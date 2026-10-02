import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
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
    currency: {
      type: String,
      required: true,
      enum: ['VES', 'INR', 'USD', 'GEMS'],
      default: 'VES'
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      default: 'CREDIT',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Transaction amount must be positive']
    },
    source: {
      type: String,
      enum: ['DAILY_STREAK', 'REFERRAL', 'PROMO', 'REWARD_REDEMPTION'],
      default: 'DAILY_STREAK'
    },
    streakDay: {
      type: Number,
      min: 1,
      max: 7,
      default: null
    },
    referenceId: {
      type: String,
      required: true,
      index: true // e.g. STREAK-XXXXXX
    },
    balanceBefore: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED', 'REVERSED'],
      default: 'SUCCESS'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;
