const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Helper to check MongoDB connection state
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: check presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // 2. Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 3. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 4. Ensure DB connection is established
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message:
          'MongoDB Atlas is not connected yet. Please update MONGO_URI in server/.env with your MongoDB Atlas connection string.',
        isDbOffline: true,
      });
    }

    // 5. Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Try logging in.',
      });
    }

    // 6. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Create user in MongoDB
    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 8. Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during sign up.',
    });
  }
};

// @desc    Authenticate user / Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message:
          'MongoDB Atlas is not connected yet. Please update MONGO_URI in server/.env with your MongoDB Atlas connection string.',
        isDbOffline: true,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user._id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login.',
    });
  }
};

// @desc    Check API and Database status
// @route   GET /api/auth/status
// @access  Public
const getStatus = async (req, res) => {
  const dbConnected = isDatabaseConnected();
  return res.status(200).json({
    success: true,
    server: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    message: dbConnected
      ? 'MongoDB Atlas is connected and ready!'
      : 'Server is running, but MongoDB Atlas is waiting for connection string in server/.env',
  });
};

module.exports = {
  signup,
  login,
  getStatus,
};
