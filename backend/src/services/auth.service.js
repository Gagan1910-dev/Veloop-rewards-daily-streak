import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import { generateToken } from '../utils/token.util.js';

/**
 * Register a new user and initialize their wallet
 */
export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check duplicate account
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'user',
    isActive: true
  });

  // Automatically initialize default clean Wallet for the new user
  const wallet = await Wallet.create({
    userId: user._id,
    vesBalance: 0,
    gemsBalance: 0,
    giftCardBalanceINR: 0,
    currency: 'VES'
  });

  // Generate JWT
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    wallet: {
      vesBalance: wallet.vesBalance,
      gemsBalance: wallet.gemsBalance,
      giftCardBalanceINR: wallet.giftCardBalanceINR,
      currency: wallet.currency
    },
    token
  };
};

/**
 * Authenticate user credentials and return JWT
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account has been disabled. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // Verify password hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Fetch or ensure wallet exists
  let wallet = await Wallet.findOne({ userId: user._id });
  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,
      vesBalance: 0,
      gemsBalance: 0,
      giftCardBalanceINR: 0,
      currency: 'VES'
    });
  }

  // Generate JWT
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    wallet: {
      vesBalance: wallet.vesBalance,
      gemsBalance: wallet.gemsBalance,
      giftCardBalanceINR: wallet.giftCardBalanceINR,
      currency: wallet.currency
    },
    token
  };
};

/**
 * Fetch current authenticated user identity and wallet
 */
export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let wallet = await Wallet.findOne({ userId: user._id });
  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,
      vesBalance: 0,
      gemsBalance: 0,
      giftCardBalanceINR: 0,
      currency: 'VES'
    });
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    wallet: {
      vesBalance: wallet.vesBalance,
      gemsBalance: wallet.gemsBalance,
      giftCardBalanceINR: wallet.giftCardBalanceINR,
      currency: wallet.currency
    }
  };
};
