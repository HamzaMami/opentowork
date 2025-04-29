import express from 'express';
import { protect, client } from '../../middleware/auth.js';
import ClientProfile from '../../models/Client_profile.js';
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
      'client-' + 
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

// @route   GET /api/profile/client
// @desc    Get current client profile
// @access  Private (client only)
router.get('/', protect, client, async (req, res) => {
  try {
    const clientProfile = await ClientProfile.findOne({ user: req.user._id });
    
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    res.json(clientProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/profile/client
// @desc    Create client profile
// @access  Private (client only)
router.post('/', protect, client, upload.single('profileImage'), async (req, res) => {
  try {
    // Check if profile already exists
    let clientProfile = await ClientProfile.findOne({ user: req.user._id });
    
    if (clientProfile) {
      return res.status(400).json({ message: 'Client profile already exists. Use PUT to update.' });
    }
    
    // Build profile object
    const profileData = {
      user: req.user._id,
      companyName: req.body.companyName,
      title: req.body.title,
      bio: req.body.bio
    };
    
    // Add profile image if uploaded
    if (req.file) {
      profileData.profileImage = `/${req.file.path.replace(/\\/g, '/')}`;
    }
    
    // Create new profile
    clientProfile = new ClientProfile(profileData);
    await clientProfile.save();
    
    res.status(201).json(clientProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile/client
// @desc    Update client profile
// @access  Private (client only)
router.put('/', protect, client, upload.single('profileImage'), async (req, res) => {
  try {
    // Find profile
    let clientProfile = await ClientProfile.findOne({ user: req.user._id });
    
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    // Update fields
    if (req.body.companyName !== undefined) clientProfile.companyName = req.body.companyName;
    if (req.body.title !== undefined) clientProfile.title = req.body.title;
    if (req.body.bio !== undefined) clientProfile.bio = req.body.bio;
    
    // Handle profile image update
    if (req.file) {
      // Delete old image if it exists
      if (clientProfile.profileImage) {
        const oldImagePath = path.join(process.cwd(), clientProfile.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Set new image path
      clientProfile.profileImage = `/${req.file.path.replace(/\\/g, '/')}`;
    } else if (req.body.removeImage === 'true') {
      // Handle image removal
      if (clientProfile.profileImage) {
        const imagePath = path.join(process.cwd(), clientProfile.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      clientProfile.profileImage = null;
    }
    
    // Save updated profile
    await clientProfile.save();
    
    res.json(clientProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/profile/client
// @desc    Delete client profile & associated data
// @access  Private (client only)
router.delete('/', protect, client, async (req, res) => {
  try {
    const clientProfile = await ClientProfile.findOne({ user: req.user._id });
    
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    // Delete profile image if exists
    if (clientProfile.profileImage) {
      const imagePath = path.join(process.cwd(), clientProfile.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete profile - updated to use current Mongoose pattern
    await clientProfile.deleteOne();
    
    res.json({ message: 'Client profile deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;