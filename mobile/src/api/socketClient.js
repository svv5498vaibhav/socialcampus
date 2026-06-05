import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const connectSocket = (token, onEvents = {}) => {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected to server:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('error-event', (err) => {
    console.error('🔌 Socket server error event:', err.message);
  });

  // Attach dynamic handlers
  Object.keys(onEvents).forEach((event) => {
    socket.on(event, onEvents[event]);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket connection destroyed');
  }
};

// Room management wrappers
export const joinPostRoom = (postId) => {
  if (socket) {
    socket.emit('join-post-room', postId);
  }
};

export const leavePostRoom = (postId) => {
  if (socket) {
    socket.emit('leave-post-room', postId);
  }
};

export const subscribeToAuthor = (authorId) => {
  if (socket) {
    socket.emit('subscribe-to-user', authorId);
  }
};

export const unsubscribeFromAuthor = (authorId) => {
  if (socket) {
    socket.emit('unsubscribe-from-user', authorId);
  }
};
