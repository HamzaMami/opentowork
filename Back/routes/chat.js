import express from 'express';
import { protect } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { socketIO, getUserSocket } from '../server.js';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/chats';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/**
 * @route   GET /api/chats
 * @desc    Get all chats for a user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    // Find all chats where the current user is a participant
    const chats = await Chat.find({ participants: req.user._id })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'participants',
        select: 'name email role'
      })
      .populate({
        path: 'lastMessage.sender',
        select: 'name'
      });
    
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/chats
 * @desc    Create a new chat with another user
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, initialMessage } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }
    
    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if a chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { 
        $all: [req.user._id, recipientId] 
      }
    });
    
    if (existingChat) {
      return res.status(400).json({ 
        message: 'Chat already exists',
        chatId: existingChat._id
      });
    }
    
    // Create a new chat
    let newChat = new Chat({
      participants: [req.user._id, recipientId]
    });
    
    // Add initial message if provided
    if (initialMessage) {
      newChat.messages.push({
        sender: req.user._id,
        content: initialMessage
      });
    }
    
    await newChat.save();
    
    // Populate participant details for response
    newChat = await Chat.findById(newChat._id)
      .populate({
        path: 'participants',
        select: 'name email role'
      });
    
    // Notify the recipient about new chat via Socket.IO
    const recipientSocketId = getUserSocket(recipientId);
    if (recipientSocketId) {
      socketIO.to(recipientSocketId).emit('newChat', {
        chat: newChat,
        from: req.user._id
      });
    }
    
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/chats/:chatId
 * @desc    Get a specific chat with messages
 * @access  Private
 */
router.get('/:chatId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate({
        path: 'participants',
        select: 'name email role profileImage'
      })
      .populate({
        path: 'messages.sender',
        select: 'name email role profileImage'
      });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark unread messages as read if the current user is the recipient
    const unreadMessages = chat.messages.filter(
      msg => !msg.read && msg.sender._id.toString() !== req.user._id.toString()
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        const messageIndex = chat.messages.findIndex(m => m._id.equals(msg._id));
        if (messageIndex !== -1) {
          chat.messages[messageIndex].read = true;
        }
      });
      
      await chat.save();
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/chats/:chatId/messages
 * @desc    Get messages for a specific chat with pagination
 * @access  Private
 */
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get total count
    const totalMessages = chat.messages.length;
    
    // Sort messages in reverse chronological order and paginate
    const paginatedMessages = chat.messages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort back to chronological for display
    
    // Populate sender info
    await Chat.populate(paginatedMessages, {
      path: 'sender',
      select: 'name email role profileImage'
    });
    
    res.json({
      messages: paginatedMessages,
      totalMessages,
      page,
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: totalMessages > skip + limit
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/chats/:chatId/messages
 * @desc    Send a message in a chat
 * @access  Private
 */
router.post('/:chatId/messages', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Message content or attachments are required' });
    }
    
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Process attachments with absolute URL paths for frontend
    let attachmentsData = [];
    if (req.files && req.files.length > 0) {
      attachmentsData = req.files.map(file => ({
        url: `/${file.path.replace(/\\/g, '/').replace(/^\//, '')}`, // Ensure consistent leading slash
        originalFilename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
    }
    
    // If we have attachments but no content, set a non-empty default value for content
    const messageContent = (!content && attachmentsData.length > 0) ? '[Attachment]' : (content || '');
    
    // Create new message
    const newMessage = {
      sender: req.user._id,
      content: messageContent,
      attachments: attachmentsData
    };
    
    // Only add the message to chat after we've set up the attachments
    chat.messages.push(newMessage);
    
    // Update lastMessage for chat preview
    chat.lastMessage = {
      content: messageContent,
      sender: req.user._id,
      createdAt: new Date()
    };
    
    try {
      await chat.save();
    } catch (error) {
      console.warn('Error saving message:', error);
      return res.status(400).json({ message: 'Error sending message: ' + error.message });
    }
    
    // Fetch the populated chat to get sender information
    const populatedChat = await Chat.findById(chat._id)
      .populate({
        path: 'messages.sender',
        select: 'name email role profileImage'
      });
    
    // Return the newly created message with populated sender info
    const addedMessage = populatedChat.messages[populatedChat.messages.length - 1];
    
    // Find the recipient to notify them
    const recipient = chat.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    
    if (recipient) {
      // Get the recipient's socket if they're online
      const recipientSocketId = getUserSocket(recipient.toString());
      
      if (recipientSocketId) {
        // Emit newMessage event to the recipient
        socketIO.to(recipientSocketId).emit('newMessage', {
          ...addedMessage.toObject(),
          chatId: chat._id
        });
      }
    }
    
    res.status(201).json(addedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/chats/:chatId/messages/:messageId
 * @desc    Delete a message from a chat
 * @access  Private
 */
router.delete('/:chatId/messages/:messageId', protect, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find the message
    const message = chat.messages.id(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }
    
    // If message has attachments, delete the files
    if (message.attachments && message.attachments.length > 0) {
      message.attachments.forEach(attachment => {
        // Remove leading slash if it exists
        const filePath = attachment.url.replace(/^\//, '');
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted attachment file: ${filePath}`);
          }
        } catch (err) {
          console.error(`Error deleting attachment file: ${filePath}`, err);
          // Continue with message deletion even if file deletion fails
        }
      });
    }
    
    // Remove the message
    message.deleteOne();
    
    // Update lastMessage if the deleted message was the last one
    if (chat.lastMessage && chat.lastMessage._id && chat.lastMessage._id.toString() === messageId) {
      // Find the new last message
      const lastMessage = chat.messages.length > 0 
        ? chat.messages[chat.messages.length - 1] 
        : null;
      
      if (lastMessage) {
        chat.lastMessage = {
          content: lastMessage.content,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt
        };
      } else {
        // No messages left
        chat.lastMessage = null;
      }
    }
    
    await chat.save();
    
    // Notify other participants about message deletion
    chat.participants.forEach(participant => {
      if (participant.toString() !== req.user._id.toString()) {
        const recipientSocketId = getUserSocket(participant.toString());
        
        if (recipientSocketId) {
          socketIO.to(recipientSocketId).emit('messageDeleted', {
            chatId,
            messageId
          });
        }
      }
    });
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/chats/:chatId/read
 * @desc    Mark all messages in a chat as read
 * @access  Private
 */
router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark all unread messages from other users as read
    let updated = false;
    chat.messages.forEach(message => {
      if (!message.read && message.sender.toString() !== req.user._id.toString()) {
        message.read = true;
        updated = true;
      }
    });
    
    if (updated) {
      await chat.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/chats/unread/count
 * @desc    Get count of unread messages for the user
 * @access  Private
 */
router.get('/unread/count', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id });
    
    let unreadCount = 0;
    
    chats.forEach(chat => {
      chat.messages.forEach(message => {
        if (!message.read && message.sender.toString() !== req.user._id.toString()) {
          unreadCount++;
        }
      });
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;