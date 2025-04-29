import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import clientProfileRoutes from './routes/profiles/client.js';
import freelancerProfileRoutes from './routes/profiles/freelancer.js';
import walletRoutes from './routes/wallet.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

// Connect to database
connectDB();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Set up Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // Change to your frontend origin in production
    methods: ['GET', 'POST']
  }
});

// Store user socket mappings
const userSockets = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  const userId = socket.handshake.query.userId;
  if (userId) {
    // Store the user's socket connection
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  }
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove the user from the socket mapping
    if (userId) {
      userSockets.delete(userId);
      console.log(`User ${userId} unregistered`);
    }
  });
});

// Export io instance to be used in routes
export const socketIO = io;
export const getUserSocket = (userId) => userSockets.get(userId);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile/client', clientProfileRoutes);
app.use('/api/profile/freelancer', freelancerProfileRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chats', chatRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen since we're using Socket.IO
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
