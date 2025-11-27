require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 8080;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Create server (HTTP or HTTPS based on environment)
let server;
if (USE_HTTPS) {
  try {
    const options = {
      key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
    };
    server = https.createServer(options, app);
    console.log('🔒 HTTPS mode enabled');
  } catch (err) {
    console.error('⚠️  SSL certificates not found.');
    console.log('Falling back to HTTP...');
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

const protocol = USE_HTTPS ? 'https' : 'http';
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || `${protocol}://localhost:${PORT}`,
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
      console.log(`Server running at ${protocol}://localhost:${PORT}`);
      console.log('🔌 WebSocket server is ready');
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}


