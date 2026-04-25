import express from 'express';
import { protect, admin } from '../../middleware/auth.js';
import AdminProfile from '../../models/Admin_profile.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/profiles';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(
      null,
      'admin-' + 
      req.user._id + 
      '-' + 
      Date.now() + 
      path.extname(file.originalname)
    );
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// @route   GET /api/profile/admin
// @desc    Get current admin profile
// @access  Private (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const adminProfile = await AdminProfile.findOne({ user: req.user._id });
    
    if (!adminProfile) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }
    
    res.json(adminProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/profile/admin
// @desc    Create admin profile
// @access  Private (admin only)
router.post('/', protect, admin, upload.single('profileImage'), async (req, res) => {
  try {
    // Check if profile already exists
    let adminProfile = await AdminProfile.findOne({ user: req.user._id });
    
    if (adminProfile) {
      return res.status(400).json({ message: 'Admin profile already exists. Use PUT to update.' });
    }
    
    // Build profile object
    const profileData = {
      user: req.user._id,
      title: req.body.title,
      bio: req.body.bio
    };
    
    // Add profile image if uploaded
    if (req.file) {
      profileData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }
    
    // Create new profile
    adminProfile = new AdminProfile(profileData);
    await adminProfile.save();
    
    res.status(201).json(adminProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile/admin
// @desc    Update admin profile
// @access  Private (admin only)
router.put('/', protect, admin, upload.single('profileImage'), async (req, res) => {
  try {
    // Find profile
    let adminProfile = await AdminProfile.findOne({ user: req.user._id });
    
    if (!adminProfile) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }
    
    // Update fields
    if (req.body.title !== undefined) adminProfile.title = req.body.title;
    if (req.body.bio !== undefined) adminProfile.bio = req.body.bio;
    
    // Handle profile image update
    if (req.file) {
      // Delete old image if it exists
      if (adminProfile.profileImage) {
        const oldImagePath = path.join(process.cwd(), adminProfile.profileImage.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Set new image path with consistent format
      adminProfile.profileImage = `/uploads/profiles/${req.file.filename}`;
    } else if (req.body.removeImage === 'true') {
      // Handle image removal
      if (adminProfile.profileImage) {
        const imagePath = path.join(process.cwd(), adminProfile.profileImage.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      adminProfile.profileImage = null;
    }
    
    // Save updated profile
    await adminProfile.save();
    
    res.json(adminProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/profile/admin
// @desc    Delete admin profile & associated data
// @access  Private (admin only)
router.delete('/', protect, admin, async (req, res) => {
  try {
    const adminProfile = await AdminProfile.findOne({ user: req.user._id });
    
    if (!adminProfile) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }
    
    // Delete profile image if exists
    if (adminProfile.profileImage) {
      const imagePath = path.join(process.cwd(), adminProfile.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete profile
    await adminProfile.deleteOne();
    
    res.json({ message: 'Admin profile deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;