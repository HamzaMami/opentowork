import express from 'express';
import Contact from '../models/Contact.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Submit a new contact form
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;
    
    // Basic validation
    if (!name || !email || !subject || !message || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new contact submission
    const contactSubmission = new Contact({
      name,
      email,
      subject,
      message,
      category,
      // If user is authenticated, link to their account
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : 'guest'
    });
    
    await contactSubmission.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Your message has been sent successfully',
      ticketId: contactSubmission._id 
    });
    
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/contact
 * @desc    Get all contact submissions (admin only)
 * @access  Private/Admin
 */
router.get('/', protect, admin, async (req, res) => {
  try {
    // Support for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Support for filtering
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Support for search
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } },
        { message: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role');
    
    const total = await Contact.countDocuments(filter);
    
    res.json({
      contacts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
    
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/contact/:id
 * @desc    Get a specific contact submission (admin only)
 * @access  Private/Admin
 */
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'name email role');
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    res.json(contact);
    
  } catch (error) {
    console.error('Error fetching contact submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/contact/:id/status
 * @desc    Update status of a contact submission (admin only)
 * @access  Private/Admin
 */
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    contact.status = status;
    contact.updatedAt = Date.now();
    
    // If admin provided notes, update them
    if (req.body.adminNotes) {
      contact.adminNotes = req.body.adminNotes;
    }
    
    await contact.save();
    
    res.json({ 
      success: true, 
      message: 'Contact status updated successfully',
      contact 
    });
    
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;