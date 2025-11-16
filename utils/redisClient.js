const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Too many reconnection attempts, giving up');
        return new Error('Redis reconnection failed');
      }
      return retries * 100; // Exponential backoff
    }
  }
});

// Error handling
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

// Connect to Redis (graceful failure - app continues without Redis if connection fails)
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('⚠️  Redis connection failed - app will continue without Redis caching:', err.message);
    console.log('⚠️  Sessions will use in-memory store (not persistent)');
  }
};

// Only connect if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectRedis();
}

module.exports = { redisClient, connectRedis };