import { z } from "zod";

// User Schemas
export const insertUserSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  userId: z.string().min(3, "User ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
});

// Trip Schemas
export const insertTripSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.string().min(1, "Location is required"),
  numberOfMembers: z.coerce.number().min(1),
  totalBudget: z.coerce.number().min(0),
});

// Trip Stop Schemas
export const insertTripStopSchema = z.object({
  name: z.string().min(1, "Stop name is required"),
  type: z.enum(['start', 'stop', 'destination']),
  travelMethod: z.string().optional(),
  accommodation: z.string().optional(),
  accommodationDetails: z.string().optional(),
  imageData: z.string().optional(),
  orderIndex: z.coerce.number().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  placeId: z.string().optional(),
  address: z.string().optional(),
  time: z.string().optional(),
});

// Budget Item Schemas
export const insertBudgetItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0),
});

const participantShareSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  amount: z.coerce.number().min(0),
});

// Spending Entry Schemas
export const insertSpendingEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0),
  date: z.coerce.date(),
  splitType: z.enum(['equal', 'custom']),
  participantShares: z.array(participantShareSchema).min(1, "At least one participant is required"),
});

// Type Exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertTripStop = z.infer<typeof insertTripStopSchema>;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type InsertSpendingEntry = z.infer<typeof insertSpendingEntrySchema>;
export type ParticipantShare = z.infer<typeof participantShareSchema>;
