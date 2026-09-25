import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import StreakReward from '../models/StreakReward.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();


export const DEFAULT_STREAK_REWARDS = [
  {
    day: 1,
    rewardType: 'VES',
    currency: 'VES',
    amount: 5,
    title: '+5',
    subtitle: '5 VEs',
    description: 'Day 1 Check-In Reward: +5 VEs',
    asset: 'coin',
    active: true,
    metadata: {
      badge: null,
      isUltimate: false,
      brand: 'VELoop'
    }
  },
  {
    day: 2,
    rewardType: 'VES',
    currency: 'VES',
    amount: 10,
    title: '+10',
    subtitle: '10 VEs',
    description: 'Day 2 Check-In Reward: +10 VEs',
    asset: 'coin',
    active: true,
    metadata: {
      badge: 'Today',
      isUltimate: false,
      brand: 'VELoop'
    }
  },
  {
    day: 3,
    rewardType: 'VES',
    currency: 'VES',
    amount: 15,
    title: '+15',
    subtitle: '15 VEs',
    description: 'Day 3 Check-In Reward: +15 VEs',
    asset: 'coin',
    active: true,
    metadata: {
      badge: null,
      isUltimate: false,
      brand: 'VELoop'
    }
  },
  {
    day: 4,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 1,
    title: '₹1',
    subtitle: 'Amazon Gift Card',
    description: 'Day 4 Check-In Reward: ₹1 Amazon Gift Card',
    asset: 'gift-box',
    active: true,
    metadata: {
      badge: null,
      isUltimate: false,
      brand: 'Amazon'
    }
  },
  {
    day: 5,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 2,
    title: '₹2',
    subtitle: 'Amazon Gift Card',
    description: 'Day 5 Check-In Reward: ₹2 Amazon Gift Card',
    asset: 'gift-card',
    active: true,
    metadata: {
      badge: 'Gift Card',
      isUltimate: false,
      brand: 'Amazon'
    }
  },
  {
    day: 6,
    rewardType: 'VES',
    currency: 'VES',
    amount: 30,
    title: '+30',
    subtitle: '30 VEs',
    description: 'Day 6 Check-In Reward: +30 VEs',
    asset: 'coin',
    active: true,
    metadata: {
      badge: 'Coin',
      isUltimate: false,
      brand: 'VELoop'
    }
  },
  {
    day: 7,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 5,
    title: '₹5',
    subtitle: 'Amazon Gift Card',
    description: 'Day 7 Ultimate Streak Reward: ₹5 Amazon Gift Card',
    asset: 'crown',
    active: true,
    metadata: {
      badge: 'VIP',
      isUltimate: true,
      brand: 'Amazon'
    }
  }
];

export const seedRewards = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('<username>')) {
    console.warn('[Seed Warning] MONGO_URI is not configured in .env. Skipping database seeding.');
    console.log('[Seed Info] To seed MongoDB, provide a valid MONGO_URI in backend/.env and run: npm run seed');
    return { success: false, reason: 'MONGO_URI_NOT_CONFIGURED' };
  }

  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected. Seeding StreakReward configuration...');

    for (const reward of DEFAULT_STREAK_REWARDS) {
      await StreakReward.findOneAndUpdate(
        { day: reward.day },
        { $set: reward },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Seed] Day ${reward.day} reward configured: ${reward.title} (${reward.subtitle})`);
    }

    const count = await StreakReward.countDocuments();
    console.log(`[Seed Success] Total ${count} streak rewards configured in database.`);
    await mongoose.disconnect();
    return { success: true, count };
  } catch (error) {
    console.error(`[Seed Error] Failed to seed rewards: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    throw error;
  }
};

// If executed directly via CLI: node src/seed/seedRewards.js
if (process.argv[1] && process.argv[1].endsWith('seedRewards.js')) {
  seedRewards()
    .then((result) => {
      if (result.success) {
        console.log('[Seed Completed Successfully]');
        process.exit(0);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('[Seed Process Exited with Error]', err);
      process.exit(1);
    });
}
