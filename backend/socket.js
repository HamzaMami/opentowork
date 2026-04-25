import { Server } from 'socket.io';

export let socketIO = null;

const userSockets = new Map();

export const initializeSocket = (server) => {
  if (socketIO) {
    return socketIO;
  }

  socketIO = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  socketIO.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (userId) {
        userSockets.delete(userId);
        console.log(`User ${userId} unregistered`);
      }
    });
  });

  return socketIO;
};

export const getUserSocket = (userId) => userSockets.get(userId);