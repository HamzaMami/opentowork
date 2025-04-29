import express from 'express';
import { protect, freelancer } from '../../middleware/auth.js';
import FreelancerProfile from '../../models/Freelancer_profile.js';
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
      'freelancer-' + 
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

// @route   GET /api/profile/freelancer
// @desc    Get current freelancer profile
// @access  Private (freelancer only)
router.get('/', protect, freelancer, async (req, res) => {
  try {
    const freelancerProfile = await FreelancerProfile.findOne({ user: req.user._id });
    
    if (!freelancerProfile) {
      return res.status(404).json({ message: 'Freelancer profile not found' });
    }
    
    res.json(freelancerProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/profile/freelancer
// @desc    Create freelancer profile
// @access  Private (freelancer only)
router.post('/', protect, freelancer, upload.single('profileImage'), async (req, res) => {
  try {
    // Check if profile already exists
    let freelancerProfile = await FreelancerProfile.findOne({ user: req.user._id });
    
    if (freelancerProfile) {
      return res.status(400).json({ message: 'Freelancer profile already exists. Use PUT to update.' });
    }
    
    // Build profile object
    const profileData = {
      user: req.user._id,
      skills: req.body.skills,
      bio: req.body.bio
    };
    
    // Add profile image if uploaded
    if (req.file) {
      profileData.profileImage = `/${req.file.path.replace(/\\/g, '/')}`;
    }
    
    // Create new profile
    freelancerProfile = new FreelancerProfile(profileData);
    await freelancerProfile.save();
    
    res.status(201).json(freelancerProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile/freelancer
// @desc    Update freelancer profile
// @access  Private (freelancer only)
router.put('/', protect, freelancer, upload.single('profileImage'), async (req, res) => {
  try {
    // Find profile
    let freelancerProfile = await FreelancerProfile.findOne({ user: req.user._id });
    
    if (!freelancerProfile) {
      return res.status(404).json({ message: 'Freelancer profile not found' });
    }
    
    // Update fields
    if (req.body.skills !== undefined) freelancerProfile.skills = req.body.skills;
    if (req.body.bio !== undefined) freelancerProfile.bio = req.body.bio;
    
    // Handle profile image update
    if (req.file) {
      // Delete old image if it exists
      if (freelancerProfile.profileImage) {
        const oldImagePath = path.join(process.cwd(), freelancerProfile.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Set new image path
      freelancerProfile.profileImage = `/${req.file.path.replace(/\\/g, '/')}`;
    } else if (req.body.removeImage === 'true') {
      // Handle image removal
      if (freelancerProfile.profileImage) {
        const imagePath = path.join(process.cwd(), freelancerProfile.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      freelancerProfile.profileImage = null;
    }
    
    // Save updated profile
    await freelancerProfile.save();
    
    res.json(freelancerProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/profile/freelancer
// @desc    Delete freelancer profile & associated data
// @access  Private (freelancer only)
router.delete('/', protect, freelancer, async (req, res) => {
  try {
    const freelancerProfile = await FreelancerProfile.findOne({ user: req.user._id });
    
    if (!freelancerProfile) {
      return res.status(404).json({ message: 'Freelancer profile not found' });
    }
    
    // Delete profile image if exists
    if (freelancerProfile.profileImage) {
      const imagePath = path.join(process.cwd(), freelancerProfile.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete profile - updated to use current Mongoose pattern
    await freelancerProfile.deleteOne();
    
    res.json({ message: 'Freelancer profile deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;