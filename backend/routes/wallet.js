import express from 'express';
import { protect } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();

/**
 * @route   GET /api/wallet
 * @desc    Get wallet details for a user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    // If wallet doesn't exist, create one
    if (!wallet) {
      wallet = new Wallet({ user: req.user._id });
      await wallet.save();
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get transactions list for a user
 * @access  Private
 */
router.get('/transactions', protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    // Sort transactions by date (newest first)
    const transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wallet/deposit
 * @desc    Add funds to wallet (for clients)
 * @access  Private
 */
router.post('/deposit', protect, async (req, res) => {
  try {
    // Verify user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can add funds' });
    }
    
    const { amount, paymentMethod } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid amount' });
    }
    
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = new Wallet({ user: req.user._id });
    }
    
    // Create a transaction record
    const transaction = {
      amount,
      type: 'deposit',
      status: 'completed', // In a real app, this would be 'pending' until payment confirmation
      description: 'Funds added to wallet',
      reference: `DEP-${Date.now()}`
    };
    
    // Add transaction and update balance
    wallet.transactions.push(transaction);
    wallet.balance += amount;
    
    await wallet.save();
    
    res.status(201).json({ 
      message: 'Deposit successful', 
      transaction,
      balance: wallet.balance
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Withdraw funds from wallet (for freelancers)
 * @access  Private
 */
router.post('/withdraw', protect, async (req, res) => {
  try {
    // Verify user is a freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can withdraw funds' });
    }
    
    const { amount, withdrawalMethod } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid amount' });
    }
    
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    // Check if user has enough balance
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    // Create a transaction record
    const transaction = {
      amount,
      type: 'withdrawal',
      status: 'pending', // Withdrawals typically need approval
      description: 'Withdrawal request',
      reference: `WD-${Date.now()}`
    };
    
    // Add transaction and update balance
    wallet.transactions.push(transaction);
    wallet.balance -= amount;
    
    await wallet.save();
    
    res.status(201).json({ 
      message: 'Withdrawal request submitted', 
      transaction,
      balance: wallet.balance
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wallet/payment-methods
 * @desc    Add a payment method
 * @access  Private
 */
router.post('/payment-methods', protect, async (req, res) => {
  try {
    const { type, details, makeDefault } = req.body;
    
    if (!type || !details) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      wallet = new Wallet({ user: req.user._id });
    }
    
    // If this is the first payment method or makeDefault is true, set as default
    const isDefault = makeDefault || wallet.paymentMethods.length === 0;
    
    // If setting this as default, unset any existing default
    if (isDefault) {
      wallet.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    }
    
    // Add the new payment method
    wallet.paymentMethods.push({
      type,
      details,
      isDefault
    });
    
    await wallet.save();
    
    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethods: wallet.paymentMethods
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/wallet/payment-methods
 * @desc    Get all payment methods
 * @access  Private
 */
router.get('/payment-methods', protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(200).json({ paymentMethods: [] });
    }
    
    res.json({ paymentMethods: wallet.paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/wallet/payment-methods/:id
 * @desc    Delete a payment method
 * @access  Private
 */
router.delete('/payment-methods/:id', protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    // Find the payment method by ID
    const methodIndex = wallet.paymentMethods.findIndex(
      method => method._id.toString() === req.params.id
    );
    
    if (methodIndex === -1) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Check if the method to be deleted is the default
    const wasDefault = wallet.paymentMethods[methodIndex].isDefault;
    
    // Remove the payment method
    wallet.paymentMethods.splice(methodIndex, 1);
    
    // If the deleted method was the default and there are other methods, set a new default
    if (wasDefault && wallet.paymentMethods.length > 0) {
      wallet.paymentMethods[0].isDefault = true;
    }
    
    await wallet.save();
    
    res.json({
      message: 'Payment method removed successfully',
      paymentMethods: wallet.paymentMethods
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;