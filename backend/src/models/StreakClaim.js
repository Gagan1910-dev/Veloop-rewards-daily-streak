import mongoose from 'mongoose';

const streakClaimSchema = new mongoose.Schema(
  {
    claimId: {
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
    cycleId: {
      type: String,
      required: true,
      index: true
    },
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StreakReward',
      required: true
    },
    rewardSnapshot: {
      rewardType: { type: String, required: true },
      currency: { type: String, required: true },
      amount: { type: Number, required: true },
      title: { type: String, required: true }
    },
    status: {
      type: String,
      enum: ['CLAIMED', 'PENDING', 'REJECTED', 'FAILED'],
      default: 'CLAIMED'
    },
    claimedAt: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// CRITICAL UNIQUE CONSTRAINT: Prevents duplicate claims for the same user, cycle, and day
streakClaimSchema.index({ userId: 1, cycleId: 1, day: 1 }, { unique: true });
streakClaimSchema.index({ userId: 1, claimedAt: -1 });

const StreakClaim = mongoose.model('StreakClaim', streakClaimSchema);
export default StreakClaim;
