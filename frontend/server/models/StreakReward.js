import mongoose from 'mongoose';

const streakRewardSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 7,
      index: true
    },
    rewardType: {
      type: String,
      required: true,
      enum: ['VES', 'GIFT_CARD', 'COIN', 'VIP', 'CROWN', 'CUSTOM']
    },
    currency: {
      type: String,
      required: true,
      enum: ['VES', 'INR', 'USD', 'GEMS'],
      default: 'VES'
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Reward amount must be positive']
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    asset: {
      type: String,
      required: true,
      enum: ['coin', 'gift-box', 'gift-card', 'crown', 'coins-stack']
    },
    active: {
      type: Boolean,
      default: true
    },
    metadata: {
      badge: {
        type: String,
        default: null // e.g. "Today", "Gift Card", "Coin", "VIP"
      },
      isUltimate: {
        type: Boolean,
        default: false
      },
      displayIcon: {
        type: String,
        default: ''
      },
      brand: {
        type: String,
        default: 'VELoop' // or "Amazon" for gift cards
      }
    }
  },
  {
    timestamps: true
  }
);

streakRewardSchema.index({ day: 1, active: 1 });

const StreakReward = mongoose.model('StreakReward', streakRewardSchema);
export default StreakReward;
