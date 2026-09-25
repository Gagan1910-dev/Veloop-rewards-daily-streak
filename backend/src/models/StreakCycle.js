import mongoose from 'mongoose';

const streakCycleSchema = new mongoose.Schema(
  {
    cycleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    cycleNumber: {
      type: Number,
      default: 1,
      min: 1
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'RESET', 'ABANDONED'],
      default: 'ACTIVE',
      index: true
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
      max: 7
    },
    lastClaimedDay: {
      type: Number,
      default: 0,
      min: 0,
      max: 7
    },
    lastClaimedAt: {
      type: Date,
      default: null
    },
    nextEligibleClaimAt: {
      type: Date,
      default: null
    },
    claimWindowExpiresAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique partial index to ensure strictly ONE active cycle per user at all times
streakCycleSchema.index(
  { userId: 1, status: 1 },
  { name: 'uniq_user_active_cycle', unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
streakCycleSchema.index({ userId: 1, cycleNumber: -1 });

const StreakCycle = mongoose.model('StreakCycle', streakCycleSchema);
export default StreakCycle;
