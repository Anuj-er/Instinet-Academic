require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 8080;

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || `http://localhost:${PORT}`,
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ WebSocket: Client connected -', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ WebSocket: Client disconnected -', socket.id);
  });
});

// Make io accessible throughout the app
app.set('socketio', io);

// Only connect to MongoDB and start server when not running tests
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'your_mongodb_uri')
  .then(() => {
    console.log('MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log('🔌 WebSocket server is ready');
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}


