import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_123', {
    expiresIn: '30d',
  });
};

// TEMPORARY DEBUG ROUTE - REMOVE IN PRODUCTION
// @route   GET /api/auth/check-admin
// @desc    Debug route to check admin credentials
// @access  Public
router.get('/check-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@opentowork.com';
    
    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      // Admin exists, just return info (don't expose password hash)
      res.json({
        message: 'Admin user exists',
        admin: {
          _id: admin._id,
          email: admin.email,
          role: admin.role,
          name: admin.name
        }
      });
    } else {
      // Admin doesn't exist, create one
      const password = 'Admin@123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      admin = new User({
        name: 'Admin User',
        username: 'admin',
        email: adminEmail,
        password: hashedPassword, // Using directly hashed password
        role: 'admin'
      });
      
      await admin.save();
      
      res.json({
        message: 'Admin user created',
        admin: {
          _id: admin._id,
          email: admin.email,
          role: admin.role,
          name: admin.name
        },
        loginWith: {
          email: adminEmail,
          password: 'Admin@123'
        }
      });
    }
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Check if email exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate and return token with user data
    const token = generateToken(user._id);
    console.log('Login successful for:', email, 'with role:', user.role);
    
    // Return user data and token
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate username from email if not provided
    const username = req.body.username || email.split('@')[0];
    
    // Set default role if not provided
    const role = req.body.role || 'client';

    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role,
    });

    if (user) {
      // Return user data and token
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      
      // Only update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;