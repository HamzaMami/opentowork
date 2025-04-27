import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to verify user authentication token
export const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (remove "Bearer" prefix)
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user data to request object (without password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to check if user is admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Middleware to check if user is freelancer
export const freelancer = (req, res, next) => {
  if (req.user && (req.user.role === 'freelancer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as freelancer' });
  }
};

// Middleware to check if user is client
export const client = (req, res, next) => {
  if (req.user && (req.user.role === 'client' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as client' });
  }
};

// Middleware to check if user is the resource owner or admin
export const isOwnerOrAdmin = (req, res, next) => {
  if (
    req.user && 
    (req.user._id.toString() === req.params.id || req.user.role === 'admin')
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to access this resource' });
  }
};