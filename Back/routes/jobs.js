import express from 'express';
import Job from '../models/Job.js';
import Wallet from '../models/Wallet.js';
import { protect } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all jobs with optional filtering (public route)
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      minBudget, 
      maxBudget, 
      skills, 
      experienceLevel,
      status = 'open',
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter object
    const filter = { status };
    
    // Add search filter if provided
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Add category filter if provided
    if (category) {
      filter.category = category;
    }
    
    // Add budget filter if provided
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.max = { $gte: Number(minBudget) };
      if (maxBudget) filter.budget.min = { $lte: Number(maxBudget) };
    }
    
    // Add skills filter if provided
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      filter.skills = { $in: skillsArray };
    }
    
    // Add experience level filter if provided
    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }
    
    // Set up sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'budget-high':
        sortOption = { 'budget.max': -1 };
        break;
      case 'budget-low':
        sortOption = { 'budget.min': 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Calculate pagination
    const pageNum = Math.max(0, parseInt(page) - 1);
    const limitNum = parseInt(limit);
    
    // Execute query with pagination
    const jobs = await Job.find(filter)
      .populate('client', 'name username avatar')
      .sort(sortOption)
      .skip(pageNum * limitNum)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: parseInt(page),
      totalJobs,
      data: jobs
    });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Get all proposals submitted by the authenticated freelancer
router.get('/proposals/me', protect, async (req, res) => {
  try {
    // Check if user is a freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Freelancers only'
      });
    }
    
    const { 
      status,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;
    
    // Find jobs where the user has submitted proposals
    const query = { 'proposals.freelancer': req.user.id };
    
    // Add status filter if provided
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      query['proposals.status'] = status;
    }
    
    // Calculate pagination
    const pageNum = Math.max(0, parseInt(page) - 1);
    const limitNum = parseInt(limit);
    
    // Find all jobs with proposals from this freelancer
    const jobs = await Job.find(query)
      .populate('client', 'name username avatar')
      .select('title description category budget status proposals createdAt');
    
    // Extract and transform the proposals
    let freelancerProposals = [];
    
    jobs.forEach(job => {
      // Filter proposals that belong to this freelancer
      const userProposals = job.proposals.filter(
        proposal => proposal.freelancer.toString() === req.user.id
      );
      
      // Map to the format we need
      userProposals.forEach(proposal => {
        freelancerProposals.push({
          _id: proposal._id,
          job: {
            _id: job._id,
            title: job.title,
            description: job.description,
            category: job.category,
            budget: job.budget,
            status: job.status,
            client: job.client
          },
          coverLetter: proposal.coverLetter,
          bidAmount: proposal.price, // This will ensure bidAmount is available in the response
          price: proposal.price, // Keep original field for backward compatibility
          estimatedTime: proposal.estimatedTime,
          status: proposal.status,
          createdAt: proposal.createdAt
        });
      });
    });
    
    // Sort the proposals based on the sort parameter
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      
      freelancerProposals.sort((a, b) => {
        if (sortField === 'createdAt') {
          return sortOrder * (new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortField === 'bidAmount' || sortField === 'price') {
          return sortOrder * (a.bidAmount - b.bidAmount);
        }
        return 0;
      });
    }
    
    // Apply pagination
    const paginatedProposals = freelancerProposals.slice(
      pageNum * limitNum, 
      (pageNum + 1) * limitNum
    );
    
    res.status(200).json({
      success: true,
      count: paginatedProposals.length,
      totalPages: Math.ceil(freelancerProposals.length / limitNum),
      currentPage: parseInt(page),
      total: freelancerProposals.length,
      data: paginatedProposals
    });
  } catch (err) {
    console.error('Error fetching freelancer proposals:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Get all jobs assigned to the authenticated freelancer
router.get('/freelancer/me', protect, async (req, res) => {
  try {
    // Check if user is a freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Freelancers only'
      });
    }
    
    const { 
      status, 
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter object
    const filter = { 
      freelancer: req.user.id,
      status: { $in: ['in-progress', 'completed'] }
    };
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Set up sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Calculate pagination
    const pageNum = Math.max(0, parseInt(page) - 1);
    const limitNum = parseInt(limit);
    
    // Execute query with pagination
    const jobs = await Job.find(filter)
      .populate('client', 'name username avatar')
      .sort(sortOption)
      .skip(pageNum * limitNum)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: parseInt(page),
      totalJobs,
      data: jobs
    });
  } catch (err) {
    console.error('Error fetching freelancer jobs:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Get all jobs posted by the authenticated client
router.get('/client/me', protect, async (req, res) => {
  try {
    // Check if user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Clients only'
      });
    }
    
    const { 
      status, 
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter object
    const filter = { client: req.user.id };
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Set up sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Calculate pagination
    const pageNum = Math.max(0, parseInt(page) - 1);
    const limitNum = parseInt(limit);
    
    // Execute query with pagination
    const jobs = await Job.find(filter)
      .populate('freelancer', 'name username avatar')
      .sort(sortOption)
      .skip(pageNum * limitNum)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: parseInt(page),
      totalJobs,
      data: jobs
    });
  } catch (err) {
    console.error('Error fetching client jobs:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Get all proposals for jobs posted by the authenticated client
router.get('/client/proposals', protect, async (req, res) => {
  try {
    // Check if user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Clients only'
      });
    }
    
    const { 
      status,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;
    
    // Find all jobs posted by this client
    const jobs = await Job.find({ client: req.user.id })
      .populate('proposals.freelancer', 'name username profileImage')
      .select('title description category budget status proposals createdAt');
    
    // Extract and transform the proposals
    let clientProposals = [];
    
    jobs.forEach(job => {
      // Filter proposals based on status if provided
      let jobProposals = job.proposals;
      if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
        jobProposals = job.proposals.filter(p => p.status === status);
      }
      
      // Map to the format we need
      jobProposals.forEach(proposal => {
        clientProposals.push({
          _id: proposal._id,
          job: {
            _id: job._id,
            title: job.title,
            description: job.description,
            category: job.category,
            budget: job.budget,
            status: job.status
          },
          freelancer: proposal.freelancer,
          coverLetter: proposal.coverLetter,
          price: proposal.price,
          estimatedTime: proposal.estimatedTime,
          status: proposal.status,
          createdAt: proposal.createdAt
        });
      });
    });
    
    // Sort the proposals based on the sort parameter
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      
      clientProposals.sort((a, b) => {
        if (sortField === 'createdAt') {
          return sortOrder * (new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortField === 'price') {
          return sortOrder * (a.price - b.price);
        }
        return 0;
      });
    }
    
    // Apply pagination
    const pageNum = Math.max(0, parseInt(page) - 1);
    const limitNum = parseInt(limit);
    
    const paginatedProposals = clientProposals.slice(
      pageNum * limitNum, 
      (pageNum + 1) * limitNum
    );
    
    res.status(200).json({
      success: true,
      count: paginatedProposals.length,
      totalPages: Math.ceil(clientProposals.length / limitNum),
      currentPage: parseInt(page),
      total: clientProposals.length,
      data: paginatedProposals
    });
  } catch (err) {
    console.error('Error fetching client proposals:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Get a specific job by ID (public route)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Find job and populate client details
    const job = await Job.findById(id)
      .populate('client', 'name username avatar')
      .populate('proposals.freelancer', 'name username avatar');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Create a new job (client only)
router.post('/', protect, async (req, res) => {
  try {
    // Check if user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can post jobs'
      });
    }
    
    // Get job data from request body
    const {
      title,
      description,
      category,
      skills,
      budget,
      location,
      duration,
      experienceLevel
    } = req.body;
    
    // Validate budget
    if (budget && (budget.min >= budget.max)) {
      return res.status(400).json({
        success: false,
        message: 'Maximum budget must be greater than minimum budget'
      });
    }
    
    // Create new job
    const job = new Job({
      title,
      description,
      category,
      skills: Array.isArray(skills) ? skills : [skills],
      budget,
      location,
      duration,
      experienceLevel,
      client: req.user.id
    });
    
    // Save job to database
    await job.save();
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (err) {
    console.error('Error creating job:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Update a job (job owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Find job
    const job = await Job.findById(id);
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user is job owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own jobs'
      });
    }
    
    // Check if job can be updated (not completed or cancelled)
    if (job.status === 'completed' || job.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${job.status} job`
      });
    }
    
    // Get update data
    const updateData = req.body;
    
    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: { ...updateData, updatedAt: Date.now() } },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (err) {
    console.error('Error updating job:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Delete a job (job owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Find job
    const job = await Job.findById(id);
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user is job owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own jobs'
      });
    }
    
    // Delete job
    await Job.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Submit a proposal for a job (freelancer only)
router.post('/:id/proposals', protect, async (req, res) => {
  try {
    // Check if user is a freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can submit proposals'
      });
    }
    
    const { id } = req.params;
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Find job
    const job = await Job.findById(id);
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if job is open
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit proposal to a ${job.status} job`
      });
    }
    
    // Check if freelancer already submitted a proposal
    const existingProposal = job.proposals.find(
      proposal => proposal.freelancer.toString() === req.user.id
    );
    
    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this job'
      });
    }
    
    // Get proposal data
    const { coverLetter, price, estimatedTime } = req.body;
    
    // Create new proposal
    const newProposal = {
      freelancer: req.user.id,
      coverLetter,
      price,
      estimatedTime
    };
    
    // Add proposal to job
    job.proposals.push(newProposal);
    
    // Save job
    await job.save();
    
    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: job.proposals[job.proposals.length - 1]
    });
  } catch (err) {
    console.error('Error submitting proposal:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Withdraw a proposal for a job (freelancer only)
router.delete('/:jobId/proposals/:proposalId', protect, async (req, res) => {
  try {
    // Check if user is a freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can withdraw proposals'
      });
    }
    
    const { jobId, proposalId } = req.params;
    
    // Check if IDs are valid
    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(proposalId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job or proposal ID format'
      });
    }
    
    // Find job
    const job = await Job.findById(jobId);
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Find proposal
    const proposal = job.proposals.id(proposalId);
    
    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    // Check if user is proposal owner
    if (proposal.freelancer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own proposals'
      });
    }
    
    // Check if proposal can be withdrawn (only if status is pending)
    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw a ${proposal.status} proposal`
      });
    }
    
    // Remove the proposal from the job
    job.proposals.pull({ _id: proposalId });
    
    // Save job
    await job.save();
    
    res.status(200).json({
      success: true,
      message: 'Proposal withdrawn successfully'
    });
  } catch (err) {
    console.error('Error withdrawing proposal:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Accept a proposal for a job (job owner only)
router.put('/:jobId/proposals/:proposalId/accept', protect, async (req, res) => {
  try {
    const { jobId, proposalId } = req.params;
    
    // Check if IDs are valid
    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(proposalId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job or proposal ID format'
      });
    }
    
    // Find job
    const job = await Job.findById(jobId);
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user is job owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept proposals for your own jobs'
      });
    }
    
    // Check if job is open
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept proposal for a ${job.status} job`
      });
    }
    
    // Find proposal
    const proposal = job.proposals.id(proposalId);
    
    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    // Update proposal status
    proposal.status = 'accepted';
    
    // Update job status and freelancer
    job.status = 'in-progress';
    job.freelancer = proposal.freelancer;
    
    // Update other proposals to rejected
    job.proposals.forEach(p => {
      if (p._id.toString() !== proposalId) {
        p.status = 'rejected';
      }
    });
    
    // Save job
    await job.save();
    
    res.status(200).json({
      success: true,
      message: 'Proposal accepted successfully',
      data: job
    });
  } catch (err) {
    console.error('Error accepting proposal:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Update job status (job owner or assigned freelancer)
router.put('/:jobId/status', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Find job with populated client and freelancer information
    const job = await Job.findById(jobId)
      .populate('client', '_id name')
      .populate('freelancer', '_id name');
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check permissions - only allow client (job owner) or assigned freelancer
    const isOwner = job.client._id.toString() === req.user.id;
    const isAssignedFreelancer = job.freelancer && job.freelancer._id.toString() === req.user.id;
    
    if (!isOwner && !isAssignedFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update status for your own jobs or jobs assigned to you.'
      });
    }
    
    // Validate the requested status change
    const validStatusTransitions = {
      'open': ['in-progress', 'cancelled'],
      'in-progress': ['completion-pending', 'cancelled'],
      'active': ['completion-pending', 'cancelled'],
      'ongoing': ['completion-pending', 'cancelled'],
      'completion-pending': ['completed', 'in-progress'], // Can go back to in-progress if rejected
      'completed': [],  // completed is final
      'cancelled': []   // cancelled is final
    };
    
    if (!validStatusTransitions[job.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change job status from '${job.status}' to '${status}'`
      });
    }
    
    // If client is initiating completion process
    if (isOwner && status === 'completion-pending') {
      // Set client confirmation
      job.completionStatus.clientConfirmed = true;
      job.completionStatus.clientConfirmedAt = new Date();
      
      // Update job status to completion-pending
      job.status = 'completion-pending';
      
      await job.save();
      
      return res.status(200).json({
        success: true,
        message: 'Project marked as pending completion. Waiting for freelancer confirmation.',
        data: job
      });
    }
    
    // If freelancer is confirming completion
    if (isAssignedFreelancer && job.status === 'completion-pending' && status === 'completed') {
      // Check if client has already confirmed
      if (!job.completionStatus.clientConfirmed) {
        return res.status(400).json({
          success: false,
          message: 'Client must initiate project completion first'
        });
      }
      
      // Set freelancer confirmation
      job.completionStatus.freelancerConfirmed = true;
      job.completionStatus.freelancerConfirmedAt = new Date();
      
      // If both have confirmed, finalize the project completion
      if (job.completionStatus.clientConfirmed && job.completionStatus.freelancerConfirmed) {
        job.status = 'completed';
        job.completedAt = Date.now();
        
        // Process payment from client to freelancer
        if (job.freelancer) {
          try {
            // Get the amount to be paid (from the accepted proposal or job budget)
            let paymentAmount = 0;
            const acceptedProposal = job.proposals.find(p => p.status === 'accepted');
            
            if (acceptedProposal && acceptedProposal.price) {
              paymentAmount = acceptedProposal.price;
            } else if (job.budget.amount) {
              paymentAmount = job.budget.amount;
            } else if (job.budget.min && job.budget.max) {
              // If no fixed amount, use the average of min and max
              paymentAmount = (job.budget.min + job.budget.max) / 2;
            }
            
            if (paymentAmount <= 0) {
              return res.status(400).json({
                success: false,
                message: 'Cannot complete project with invalid payment amount'
              });
            }
            
            // Get client wallet
            const clientWallet = await Wallet.findOne({ user: job.client._id });
            if (!clientWallet) {
              return res.status(404).json({
                success: false,
                message: 'Client wallet not found'
              });
            }
            
            // Check if client has enough balance
            if (clientWallet.balance < paymentAmount) {
              return res.status(400).json({
                success: false,
                message: 'Insufficient funds in client wallet'
              });
            }
            
            // Get or create freelancer wallet
            let freelancerWallet = await Wallet.findOne({ user: job.freelancer._id });
            if (!freelancerWallet) {
              freelancerWallet = new Wallet({ user: job.freelancer._id });
            }
            
            // Create transaction for client (payment)
            const clientTransaction = {
              amount: paymentAmount,
              type: 'payment',
              status: 'completed',
              description: `Payment for project: ${job.title}`,
              reference: `PAY-${job._id}`,
              relatedProject: job._id
            };
            
            // Create transaction for freelancer (receive)
            const freelancerTransaction = {
              amount: paymentAmount,
              type: 'receive',
              status: 'completed',
              description: `Payment received for project: ${job.title}`,
              reference: `REC-${job._id}`,
              relatedProject: job._id
            };
            
            // Update balances and add transactions
            clientWallet.balance -= paymentAmount;
            clientWallet.transactions.push(clientTransaction);
            
            freelancerWallet.balance += paymentAmount;
            freelancerWallet.transactions.push(freelancerTransaction);
            
            // Save both wallets
            await clientWallet.save();
            await freelancerWallet.save();
            
            console.log(`Payment of $${paymentAmount} processed from client ${job.client.name} to freelancer ${job.freelancer.name}`);
          } catch (error) {
            console.error('Error processing payment:', error);
            return res.status(500).json({
              success: false,
              message: 'Error processing payment',
              error: error.message
            });
          }
        }
      }
      
      await job.save();
      
      return res.status(200).json({
        success: true,
        message: 'Project completion confirmed by freelancer.',
        data: job
      });
    }
    
    // For other valid status changes
    job.status = status;
    
    // Set additional timestamps as needed
    if (status === 'cancelled') {
      job.cancelledAt = Date.now();
    }
    
    // Save the updated job
    await job.save();
    
    res.status(200).json({
      success: true,
      message: `Job status updated to '${status}'`,
      data: job
    });
  } catch (err) {
    console.error('Error updating job status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Specific endpoint for job completion confirmation
router.post('/:jobId/confirm-completion', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Find job with populated client and freelancer information
    const job = await Job.findById(jobId)
      .populate('client', '_id name')
      .populate('freelancer', '_id name');
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user is client or assigned freelancer
    const isClient = job.client._id.toString() === req.user.id;
    const isFreelancer = job.freelancer && job.freelancer._id.toString() === req.user.id;
    
    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not associated with this project.'
      });
    }
    
    // Client confirms completion
    if (isClient) {
      // Move job to completion-pending if not already there
      if (job.status !== 'completion-pending') {
        job.status = 'completion-pending';
      }
      
      // Update client confirmation
      job.completionStatus.clientConfirmed = true;
      job.completionStatus.clientConfirmedAt = new Date();
      
      await job.save();
      
      return res.status(200).json({
        success: true,
        message: 'Project completion initiated. Waiting for freelancer confirmation.',
        data: job
      });
    }
    
    // Freelancer confirms completion
    if (isFreelancer) {
      // Check job status first
      if (job.status !== 'completion-pending' && job.status !== 'in-progress') {
        return res.status(400).json({
          success: false,
          message: `Cannot confirm completion for a job with status '${job.status}'`
        });
      }
      
      // Update freelancer confirmation
      job.completionStatus.freelancerConfirmed = true;
      job.completionStatus.freelancerConfirmedAt = new Date();
      
      // If client hasn't initiated completion, set status to completion-pending
      if (job.status !== 'completion-pending') {
        job.status = 'completion-pending';
      }
      
      // If both have confirmed, complete the project
      if (job.completionStatus.clientConfirmed && job.completionStatus.freelancerConfirmed) {
        job.status = 'completed';
        job.completedAt = new Date();
        
        // Process payment - removed for brevity
        // This would be handled by a payment processing function
      }
      
      await job.save();
      
      return res.status(200).json({
        success: true,
        message: job.status === 'completed' 
          ? 'Project completed successfully.' 
          : 'Project completion confirmed by freelancer. Waiting for client confirmation.',
        data: job
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Invalid request for completion confirmation'
    });
  } catch (err) {
    console.error('Error confirming job completion:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

export default router;
