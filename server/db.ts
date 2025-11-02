import mongoose from 'mongoose';

const MONGODB_URI: string = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set. Please configure it in your environment.');
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  coOrganizerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String, required: true },
  numberOfMembers: { type: Number, required: true },
  totalBudget: { type: Number, required: true },
  joinCode: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'upcoming', index: true },
  startLocationName: { type: String },
  destinationLocationName: { type: String },
  startPlaceId: { type: String },
  destinationPlaceId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const tripMemberSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['organizer', 'co_organizer', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

// Compound index for efficient membership queries
tripMemberSchema.index({ tripId: 1, userId: 1 }, { unique: true });

const tripStopSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['start', 'stop', 'destination'], required: true, default: 'stop' },
  time: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  placeId: { type: String },
  address: { type: String },
  travelMethod: { type: String },
  accommodation: { type: String },
  accommodationDetails: { type: String },
  imageData: { type: String },
  orderIndex: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const budgetItemSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const budgetHistorySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetItem', required: true },
  type: { type: String, enum: ['add', 'remove'], required: true },
  amount: { type: Number, required: true },
  totalAfter: { type: Number, required: true },
  category: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const spendingEntrySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  splitType: { type: String, enum: ['equal', 'custom'], required: true },
  participantShares: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
  }],
  createdAt: { type: Date, default: Date.now },
});

const notificationSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['trip_start', 'trip_arrival', 'next_stop', 'budget_alert', 'member_joined', 'stop_added', 'stop_updated', 'stop_deleted', 'spending_added', 'trip_update'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model('User', userSchema);
export const TripModel = mongoose.model('Trip', tripSchema);
export const TripMemberModel = mongoose.model('TripMember', tripMemberSchema);
export const TripStopModel = mongoose.model('TripStop', tripStopSchema);
export const BudgetItemModel = mongoose.model('BudgetItem', budgetItemSchema);
export const BudgetHistoryModel = mongoose.model('BudgetHistory', budgetHistorySchema);
export const SpendingEntryModel = mongoose.model('SpendingEntry', spendingEntrySchema);
export const NotificationModel = mongoose.model('Notification', notificationSchema);
