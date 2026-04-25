import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import FreelancerProfile from '../models/Freelancer_profile.js';
import ClientProfile from '../models/Client_profile.js';
import { protect, admin, isOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users - Protected, with search and filter capabilities
router.get('/', protect, async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = {};
    
    // Add search functionality
    if (search) {
      // Search by name, username, or email
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }
    
    // Exclude the current user from results
    query._id = { $ne: req.user._id };
    
    // Get users with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
      
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID - Protected, but allows access for chat interactions
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the requesting user is the owner or admin
    const isOwner = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';
    
    // In a chat context, we'll consider email as public information
    // for better user experience in the chat interface
    const response = {
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email // Include email for chat participants
    };
    
    // Fetch profile data based on user's role
    let profileData = null;
    if (user.role === 'freelancer') {
      profileData = await FreelancerProfile.findOne({ user: req.params.id });
    } else if (user.role === 'client') {
      profileData = await ClientProfile.findOne({ user: req.params.id });
    }
    
    // Add profile image and basic public info regardless of relationship
    if (profileData) {
      response.profileImage = profileData.profileImage;
      
      // Only add more sensitive details for owner or admin
      if (isOwner || isAdmin) {
        response.bio = profileData.bio;
        if (user.role === 'freelancer') {
          response.skills = profileData.skills;
        }
      } else {
        // For non-owners/admins, include just a preview of the bio if it exists
        if (profileData.bio) {
          const bioPreview = profileData.bio.length > 100 
            ? profileData.bio.substring(0, 100) + '...' 
            : profileData.bio;
          response.bio = bioPreview;
        }
      }
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user skills by ID - Public endpoint
router.get('/:id/skills', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'freelancer') {
      return res.status(400).json({ message: 'User is not a freelancer' });
    }
    
    // Fetch freelancer profile data
    const freelancerProfile = await FreelancerProfile.findOne({ user: req.params.id }).select('skills');
    
    // Return skills even if they're empty
    res.json({ 
      userId: req.params.id,
      skills: freelancerProfile ? freelancerProfile.skills : ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user account info (creation date) - Protected route
router.get('/:id/account-info', protect, async (req, res) => {
  try {
    // Get the requested user ID
    const userId = req.params.id;
    
    // Find the user by ID, but only return createdAt field
    const user = await User.findById(userId).select('createdAt');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return the user's account creation date
    res.json({
      success: true,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Error fetching user account info:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Create a new user - Admin only
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Generate username from email if not provided
    const username = req.body.username || email.split('@')[0];
    // Set default role if not provided
    const role = req.body.role || 'client';
    
    const user = new User({ name, username, email, password, role });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a user - Protected, Admin or Owner only
router.put('/:id', protect, isOwnerOrAdmin, async (req, res) => {
  try {
    const { name, username, email, role } = req.body;
    
    // Find user first to check if exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only admin can update role
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to change role' });
    }
    
    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    
    // Only admin can update role
    if (req.user.role === 'admin') {
      user.role = role || user.role;
    }
    
    // Only update password if provided in req.body
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user profile - Protected
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, email, removeImage } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    // Handle profile image
    if (req.files && req.files.profileImage) {
      // Delete old image if it exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', 'profiles', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const file = req.files.profileImage;
      const fileName = `user-${user._id}-${Date.now()}${path.extname(file.name)}`;
      const uploadPath = path.join(__dirname, '..', 'uploads', 'profiles', fileName);
      
      await file.mv(uploadPath);
      user.profileImage = fileName;
    } else if (removeImage) {
      // Remove existing image if removeImage flag is true
      if (user.profileImage) {
        const imagePath = path.join(__dirname, '..', 'uploads', 'profiles', user.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        user.profileImage = '';
      }
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user - Admin only
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    // Import required models if not already imported at the top
    const Chat = (await import('../models/Chat.js')).default;
    const Job = (await import('../models/Job.js')).default;
    const Wallet = (await import('../models/Wallet.js')).default;
    
    const userId = req.params.id;
    
    // Find user before deletion to get role info
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Begin transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Handle chats - Find all chats involving this user
      const userChats = await Chat.find({ participants: userId }).session(session);
      console.log(`Found ${userChats.length} chats for user ${userId}`);
      
      // Delete all chats where this user was a participant
      await Chat.deleteMany({ participants: userId }).session(session);
      
      // 2. Clean up user profile based on role
      if (userToDelete.role === 'client') {
        await ClientProfile.findOneAndDelete({ user: userId }).session(session);
      } else if (userToDelete.role === 'freelancer') {
        await FreelancerProfile.findOneAndDelete({ user: userId }).session(session);
      }
      
      // 3. Handle wallet
      await Wallet.findOneAndDelete({ user: userId }).session(session);
      
      // 4. Handle jobs
      if (userToDelete.role === 'client') {
        // For client users, find and delete their posted jobs
        await Job.deleteMany({ client: userId }).session(session);
      } else if (userToDelete.role === 'freelancer') {
        // For freelancer users, find jobs they are assigned to
        const freelancerJobs = await Job.find({ freelancer: userId }).session(session);
        
        // Update these jobs to remove freelancer assignment
        for (const job of freelancerJobs) {
          job.freelancer = null;
          job.status = 'open'; // Reset job status
          await job.save({ session });
        }
        
        // Remove their proposals from all jobs
        await Job.updateMany(
          { 'proposals.freelancer': userId },
          { $pull: { proposals: { freelancer: userId } } }
        ).session(session);
      }
      
      // 5. Finally delete the user
      const deletedUser = await User.findByIdAndDelete(userId).session(session);
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.json({ 
        message: 'User deleted successfully',
        details: {
          user: deletedUser.name,
          chatsRemoved: userChats.length
        }
      });
      
    } catch (error) {
      // If any operation fails, abort transaction
      await session.abortTransaction();
      console.error('Transaction error during user deletion:', error);
      throw error;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error during user deletion', error: error.message });
  }
});

export default router;