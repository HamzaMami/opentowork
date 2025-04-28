import express from 'express';
import User from '../models/User.js';
import { protect, admin, isOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users - Protected, Admin only
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID - Protected, Admin or Owner only
router.get('/:id', protect, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;