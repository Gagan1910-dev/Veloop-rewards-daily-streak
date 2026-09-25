import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    vesBalance: {
      type: Number,
      default: 0,
      min: [0, 'VES balance cannot be negative']
    },
    gemsBalance: {
      type: Number,
      default: 0,
      min: [0, 'Gems balance cannot be negative']
    },
    giftCardBalanceINR: {
      type: Number,
      default: 0,
      min: [0, 'Gift card balance cannot be negative']
    },
    currency: {
      type: String,
      default: 'VES'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;
