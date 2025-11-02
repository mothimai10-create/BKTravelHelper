import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { WebSocket, WebSocketServer } from "ws";
import { connectDB, UserModel, TripModel, TripMemberModel, TripStopModel, BudgetItemModel, BudgetHistoryModel, SpendingEntryModel, NotificationModel } from "./db";
import { insertUserSchema, loginUserSchema, insertTripSchema, insertTripStopSchema, insertBudgetItemSchema, insertSpendingEntrySchema } from "@shared/schema";
import OpenAI from "openai";

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

interface AuthRequest extends express.Request {
  session: session.Session & Partial<session.SessionData>;
}

const authMiddleware = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const MANAGER_ROLES = ['organizer', 'co_organizer'] as const;

type ManagerRole = typeof MANAGER_ROLES[number];

async function getMemberRecord(tripId: string, userId: string) {
  return TripMemberModel.findOne({ tripId, userId });
}

async function assertMembership(tripId: string, userId: string, res: express.Response) {
  const member = await getMemberRecord(tripId, userId);
  if (!member) {
    res.status(403).json({ message: "Not a member of this trip" });
    return null;
  }
  return member;
}

async function assertManager(tripId: string, userId: string, res: express.Response) {
  const member = await assertMembership(tripId, userId, res);
  if (!member) {
    return null;
  }
  if (!MANAGER_ROLES.includes(member.role as ManagerRole)) {
    res.status(403).json({ message: "Only organizers or co-organizers can perform this action" });
    return null;
  }
  return member;
}

async function assertOrganizer(tripId: string, userId: string, res: express.Response) {
  const member = await assertMembership(tripId, userId, res);
  if (!member) {
    return null;
  }
  if (member.role !== 'organizer') {
    res.status(403).json({ message: "Only organizers can perform this action" });
    return null;
  }
  return member;
}

async function notifyMembers(tripId: string, type: string, title: string, message: string) {
  const members = await TripMemberModel.find({ tripId });
  const notifications = members.map((member) =>
    NotificationModel.create({
      tripId,
      userId: member.userId,
      type,
      title,
      message,
    })
  );
  await Promise.all(notifications);
  broadcastTripUpdate(tripId, { type, title, message });
}

export async function registerRoutes(app: Express): Promise<Server> {
  await connectDB();

  app.use(session({
    secret: process.env.SESSION_SECRET || 'bktravel-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));

  app.post("/api/auth/register", async (req: AuthRequest, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existing = await UserModel.findOne({ userId: data.userId });
      if (existing) {
        return res.status(400).json({ message: "User ID already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await UserModel.create({
        username: data.username,
        userId: data.userId,
        password: hashedPassword,
      });

      req.session.userId = user._id.toString();
      res.json({ user: { id: user._id, username: user.username, userId: user.userId } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res) => {
    try {
      const data = loginUserSchema.parse(req.body);
      
      const user = await UserModel.findOne({ userId: data.userId });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user._id.toString();
      res.json({ user: { id: user._id, username: user.username, userId: user.userId } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", async (req: AuthRequest, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await UserModel.findById(req.session.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user._id, username: user.username, userId: user.userId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/trips", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTripSchema.parse(req.body);
      const joinCode = nanoid(8).toUpperCase();
      
      const trip = await TripModel.create({
        ...data,
        organizerId: req.session.userId,
        joinCode,
        status: new Date(data.startDate) > new Date() ? 'upcoming' : 'current',
      });

      await TripMemberModel.create({
        tripId: trip._id,
        userId: req.session.userId,
        role: 'organizer',
      });

      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trips", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const memberTrips = await TripMemberModel.find({ userId: req.session.userId });
      const tripIds = memberTrips.map(m => m.tripId);
      const trips = await TripModel.find({ _id: { $in: tripIds } })
        .populate('organizerId', 'username userId')
        .sort({ createdAt: -1 });
      res.json(trips);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const trip = await TripModel.findById(req.params.id).populate('organizerId', 'username userId');
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const isMember = await TripMemberModel.findOne({ tripId: trip._id, userId: req.session.userId });
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this trip" });
      }

      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/trips/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.organizerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Only organizer can update trip" });
      }

      const data = insertTripSchema.parse(req.body);
      Object.assign(trip, data);
      await trip.save();

      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/trips/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.organizerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Only organizer can delete trip" });
      }

      await TripMemberModel.deleteMany({ tripId: trip._id });
      await TripStopModel.deleteMany({ tripId: trip._id });
      await BudgetItemModel.deleteMany({ tripId: trip._id });
      await SpendingEntryModel.deleteMany({ tripId: trip._id });
      await TripModel.findByIdAndDelete(trip._id);

      res.json({ message: "Trip deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/trips/join", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { joinCode } = req.body;
      const trip = await TripModel.findOne({ joinCode });
      
      if (!trip) {
        return res.status(404).json({ message: "Invalid join code" });
      }

      const existingMember = await TripMemberModel.findOne({ tripId: trip._id, userId: req.session.userId });
      if (existingMember) {
        return res.status(400).json({ message: "Already a member of this trip" });
      }

      await TripMemberModel.create({
        tripId: trip._id,
        userId: req.session.userId,
      });

      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/members", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const members = await TripMemberModel.find({ tripId: req.params.id }).populate('userId', 'username userId');
      res.json(members);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/trips/:id/members/:memberId/role", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const manager = await assertManager(req.params.id, req.session.userId!, res);
      if (!manager) {
        return;
      }

      const targetMember = await TripMemberModel.findOne({ tripId: req.params.id, _id: req.params.memberId });
      if (!targetMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      const { role } = req.body;
      if (!['organizer', 'co_organizer', 'member'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (targetMember.role === 'organizer' && role !== 'organizer') {
        const organizerCount = await TripMemberModel.countDocuments({ tripId: req.params.id, role: 'organizer' });
        if (organizerCount <= 1) {
          return res.status(400).json({ message: "Trip must have at least one organizer" });
        }
      }

      if (role === 'organizer' && manager.role !== 'organizer') {
        return res.status(403).json({ message: "Only organizers can promote others to organizer" });
      }

      targetMember.role = role;
      await targetMember.save();

      res.json(targetMember);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/trips/:id/stops", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTripStopSchema.parse(req.body);
      const stop = await TripStopModel.create({ ...data, tripId: req.params.id });

      if (stop.type === 'start') {
        await TripModel.findByIdAndUpdate(req.params.id, {
          startLocationName: stop.name,
          startPlaceId: stop.placeId,
        });
      }
      if (stop.type === 'destination') {
        await TripModel.findByIdAndUpdate(req.params.id, {
          destinationLocationName: stop.name,
          destinationPlaceId: stop.placeId,
        });
      }

      res.json(stop);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/stops", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const stops = await TripStopModel.find({ tripId: req.params.id });
      const sorted = stops.sort((a: any, b: any) => {
        const typeRank = (type: string) => {
          if (type === 'start') return 0;
          if (type === 'stop') return 1;
          if (type === 'destination') return 2;
          return 3;
        };
        const rankDiff = typeRank(a.type) - typeRank(b.type);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });
      res.json(sorted);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/trips/:tripId/stops/:stopId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTripStopSchema.partial().parse(req.body);
      const stop = await TripStopModel.findByIdAndUpdate(
        req.params.stopId,
        data,
        { new: true }
      );
      if (!stop) {
        return res.status(404).json({ message: "Stop not found" });
      }

      const tripUpdate: any = {};
      if (stop.type === 'start') {
        tripUpdate.startLocationName = stop.name;
        tripUpdate.startPlaceId = stop.placeId;
      }
      if (stop.type === 'destination') {
        tripUpdate.destinationLocationName = stop.name;
        tripUpdate.destinationPlaceId = stop.placeId;
      }
      if (Object.keys(tripUpdate).length > 0) {
        await TripModel.findByIdAndUpdate(req.params.tripId, tripUpdate);
      }

      res.json(stop);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/trips/:tripId/stops/:stopId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const stop = await TripStopModel.findById(req.params.stopId);
      if (!stop) {
        return res.status(404).json({ message: "Stop not found" });
      }

      await TripStopModel.findByIdAndDelete(req.params.stopId);

      if (stop.type === 'start') {
        await TripModel.findByIdAndUpdate(req.params.tripId, {
          $unset: { startLocationName: '', startPlaceId: '' },
        });
      }
      if (stop.type === 'destination') {
        await TripModel.findByIdAndUpdate(req.params.tripId, {
          $unset: { destinationLocationName: '', destinationPlaceId: '' },
        });
      }

      res.json({ message: "Stop deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/trips/:id/budget", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBudgetItemSchema.parse(req.body);
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const isMember = await TripMemberModel.findOne({ tripId: trip._id, userId: req.session.userId });
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this trip" });
      }
      const item = await BudgetItemModel.create({ ...data, tripId: trip._id });
      // Budget items are allocations within the total budget, don't modify total budget
      const historyPromise = BudgetHistoryModel.create({
        tripId: trip._id,
        itemId: item._id,
        type: 'add',
        amount: item.amount,
        totalAfter: Number(trip.totalBudget), // Total budget remains unchanged
        category: item.category,
        description: item.description,
      });
      const members = await TripMemberModel.find({ tripId: trip._id });
      const notificationPromises = members.map((member) =>
        NotificationModel.create({
          tripId: trip._id,
          userId: member.userId,
          type: 'budget_alert',
          title: 'Budget updated',
          message: `${item.category}: ${Number(item.amount).toFixed(2)} added`,
        })
      );
      if (!members.some((member) => member.userId.toString() === trip.organizerId.toString())) {
        notificationPromises.push(
          NotificationModel.create({
            tripId: trip._id,
            userId: trip.organizerId,
            type: 'budget_alert',
            title: 'Budget updated',
            message: `${item.category}: ${Number(item.amount).toFixed(2)} added`,
          })
        );
      }
      notificationPromises.push(historyPromise);
      await Promise.all(notificationPromises);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/budget", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const isMember = await TripMemberModel.findOne({ tripId: trip._id, userId: req.session.userId });
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this trip" });
      }

      const [items, history] = await Promise.all([
        BudgetItemModel.find({ tripId: req.params.id }),
        BudgetHistoryModel.find({ tripId: req.params.id }).sort({ createdAt: -1 }),
      ]);
      res.json({ items, history, totalBudget: Number(trip.totalBudget) });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/trips/:tripId/budget/:itemId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const item = await BudgetItemModel.findByIdAndDelete(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      const trip = await TripModel.findById(req.params.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const isMember = await TripMemberModel.findOne({ tripId: trip._id, userId: req.session.userId });
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this trip" });
      }
      // Budget items are allocations within the total budget, don't modify total budget
      const historyPromise = BudgetHistoryModel.create({
        tripId: trip._id,
        itemId: item._id,
        type: 'remove',
        amount: item.amount,
        totalAfter: Number(trip.totalBudget), // Total budget remains unchanged
        category: item.category,
        description: item.description,
      });
      const members = await TripMemberModel.find({ tripId: trip._id });
      const notificationPromises = members.map((member) =>
        NotificationModel.create({
          tripId: trip._id,
          userId: member.userId,
          type: 'budget_alert',
          title: 'Budget updated',
          message: `${item.category}: ${Number(item.amount).toFixed(2)} removed`,
        })
      );
      if (!members.some((member) => member.userId.toString() === trip.organizerId.toString())) {
        notificationPromises.push(
          NotificationModel.create({
            tripId: trip._id,
            userId: trip.organizerId,
            type: 'budget_alert',
            title: 'Budget updated',
            message: `${item.category}: ${Number(item.amount).toFixed(2)} removed`,
          })
        );
      }
      notificationPromises.push(historyPromise);
      await Promise.all(notificationPromises);
      res.json({ message: "Budget item deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/trips/:id/spending", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertSpendingEntrySchema.parse(req.body);
      const members = await TripMemberModel.find({ tripId: req.params.id });
      const memberIds = members.map((m) => m.userId.toString());
      const invalidShare = data.participantShares.some((share) => !memberIds.includes(share.memberId));
      if (invalidShare) {
        return res.status(400).json({ message: "Invalid participant selected" });
      }

      const totalShares = data.participantShares.reduce((sum, s) => sum + Number(s.amount), 0);
      const totalAmount = Number(data.amount);
      if (Math.abs(totalShares - totalAmount) > 0.5) {
        return res.status(400).json({ message: "Participant splits must sum to total amount" });
      }

      const entry = await SpendingEntryModel.create({ 
        ...data, 
        tripId: req.params.id,
        userId: req.session.userId,
      });
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/spending", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const entries = await SpendingEntryModel.find({ tripId: req.params.id })
        .populate('userId', 'username userId')
        .sort({ date: -1 });
      res.json(entries);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chatbot", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ 
          message: "Chatbot is currently unavailable. Please configure OPENAI_API_KEY to enable this feature." 
        });
      }

      const { message } = req.body;
      
      const user = await UserModel.findById(req.session.userId).select('-password');
      const memberTrips = await TripMemberModel.find({ userId: req.session.userId });
      const tripIds = memberTrips.map(m => m.tripId);
      const trips = await TripModel.find({ _id: { $in: tripIds } });
      
      let contextData = `User Information:\n- Username: ${user?.username}\n- User ID: ${user?.userId}\n\n`;
      
      contextData += `Trips:\n`;
      for (const trip of trips) {
        const budgetItems = await BudgetItemModel.find({ tripId: trip._id });
        const spendingEntries = await SpendingEntryModel.find({ tripId: trip._id });
        const totalSpent = spendingEntries.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalBudgeted = budgetItems.reduce((sum, i) => sum + Number(i.amount), 0);
        const remaining = Number(trip.totalBudget) - totalSpent;
        
        contextData += `\n- Trip: ${trip.name}\n`;
        contextData += `  Status: ${trip.status}\n`;
        contextData += `  Location: ${trip.location}\n`;
        contextData += `  Dates: ${trip.startDate.toLocaleDateString()}${trip.endDate ? ' - ' + trip.endDate.toLocaleDateString() : ''}\n`;
        contextData += `  Total Budget: ₹${trip.totalBudget}\n`;
        contextData += `  Total Spent: ₹${totalSpent.toFixed(2)}\n`;
        contextData += `  Remaining Budget: ₹${remaining.toFixed(2)}\n`;
        contextData += `  Number of Members: ${trip.numberOfMembers}\n`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are BKTravel Helper's AI assistant. You help users with their travel plans, budgets, and trip information. 
You have access to the following user data:\n\n${contextData}\n\nProvide helpful, concise responses to user queries about their trips, budgets, and travel plans.`
          },
          {
            role: "user",
            content: message
          }
        ],
      });

      res.json({ response: completion.choices[0].message.content });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ===== NEW FEATURES =====
  
  // Add member by User ID (manual invitation)
  app.post("/api/trips/:id/members/add", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.organizerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Only organizer can add members" });
      }

      const { userId } = req.body;
      const user = await UserModel.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingMember = await TripMemberModel.findOne({ tripId: trip._id, userId: user._id });
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this trip" });
      }

      await TripMemberModel.create({
        tripId: trip._id,
        userId: user._id,
      });

      const members = await TripMemberModel.find({ tripId: trip._id });
      const notifications = members.map((member) => {
        const isNewMember = member.userId.toString() === user._id.toString();
        return NotificationModel.create({
          tripId: trip._id,
          userId: member.userId,
          type: 'member_joined',
          title: isNewMember ? 'You joined the trip' : 'New member joined',
          message: isNewMember ? `Welcome to "${trip.name}"` : `${user.username} joined "${trip.name}"`,
        });
      });
      if (!members.some((member) => member.userId.toString() === trip.organizerId.toString())) {
        notifications.push(
          NotificationModel.create({
            tripId: trip._id,
            userId: trip.organizerId,
            type: 'member_joined',
            title: 'New member joined',
            message: `${user.username} joined "${trip.name}"`,
          })
        );
      }
      await Promise.all(notifications);

      res.json({ message: "Member added successfully", user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Search users by userId
  app.get("/api/users/search", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await UserModel.find(
        { userId: { $regex: q, $options: 'i' } },
        { username: 1, userId: 1, _id: 1 }
      ).limit(10);

      res.json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Trip Status Auto-update
  app.put("/api/trips/:id/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const { status } = req.body;
      const validStatuses = ['upcoming', 'current', 'past'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      trip.status = status;
      await trip.save();

      // Notify all members about status change
      const members = await TripMemberModel.find({ tripId: trip._id });
      for (const member of members) {
        await NotificationModel.create({
          tripId: trip._id,
          userId: member.userId,
          type: 'trip_start',
          title: `Trip ${status}`,
          message: `${trip.name} is now ${status}`,
        });
      }

      broadcastTripUpdate(req.params.id, {
        type: 'status_update',
        status: status,
      });

      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get Notifications
  app.get("/api/notifications", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const notifications = await NotificationModel.find({ userId: req.session.userId })
        .sort({ createdAt: -1 })
        .limit(50);
      res.json(notifications);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const notification = await NotificationModel.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
      );
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // WebSocket setup
  const wss = new WebSocketServer({ noServer: true });
  const clients: Map<string, Set<WebSocket>> = new Map();

  app.get("/api/ws/:tripId", (req, res) => {
    const { tripId } = req.params;
    wss.handleUpgrade(req, req.socket as any, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws, req, tripId);
    });
  });

  wss.on('connection', (ws: WebSocket, req: any, tripId: string) => {
    if (!clients.has(tripId)) {
      clients.set(tripId, new Set());
    }
    clients.get(tripId)?.add(ws);

    ws.on('close', () => {
      clients.get(tripId)?.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  function broadcastTripUpdate(tripId: string, message: any) {
    const tripClients = clients.get(tripId);
    if (tripClients) {
      tripClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  // ===== END NEW FEATURES =====

  const httpServer = createServer(app);
  
  // Attach WebSocket server to HTTP server
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname.startsWith('/api/ws/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const tripId = pathname.split('/')[3];
        if (!clients.has(tripId)) {
          clients.set(tripId, new Set());
        }
        clients.get(tripId)?.add(ws);
        ws.on('close', () => {
          clients.get(tripId)?.delete(ws);
        });
      });
    }
  });

  return httpServer;
}
