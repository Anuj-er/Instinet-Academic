const redis = require('redis');

// Only create Redis client if REDIS_URL is provided
let redisClient;

if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.error('❌ Redis: Max reconnection attempts reached, giving up');
          return new Error('Redis reconnection failed');
        }
        return retries * 1000; // Wait 1s, 2s, 3s between retries
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
} else {
  // Create a mock client that's never ready
  redisClient = {
    isReady: false,
    connect: async () => {},
    disconnect: async () => {},
    get: async () => null,
    set: async () => null,
    setEx: async () => null,
    del: async () => null,
    keys: async () => [],
    type: async () => 'none',
    ttl: async () => -1,
    info: async () => ''
  };
  console.log('ℹ️  Redis URL not provided - running without Redis caching');
}

// Connect to Redis (graceful failure - app continues without Redis if connection fails)
const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  No REDIS_URL configured - sessions will use memory store');
    return;
  }
  
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