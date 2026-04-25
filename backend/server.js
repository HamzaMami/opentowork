import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initializeSocket } from './socket.js';

dotenv.config();

// Connect to database
connectDB();

const server = http.createServer(app);

initializeSocket(server);

const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen since we're using Socket.IO
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
