const { redisClient } = require('../utils/redisClient');

// Get Redis cache status and stored data
exports.getRedisDashboard = async (req, res) => {
  try {
    if (!redisClient.isReady) {
      return res.render('redisDashboard', {
        user: req.user,
        title: 'Redis Cache Dashboard',
        connected: false,
        cacheData: [],
        stats: null,
        error: 'Redis is not connected'
      });
    }

    // Get all keys from Redis
    const keys = await redisClient.keys('*');
    const cacheData = [];

    // Get details for each key
    for (const key of keys) {
      try {
        const type = await redisClient.type(key);
        const ttl = await redisClient.ttl(key);
        let preview = 'N/A';
        let fullContent = 'N/A';
        let size = 0;

        if (type === 'string') {
          const value = await redisClient.get(key);
          size = Buffer.byteLength(value, 'utf8');
          fullContent = value; // Store full content
          
          // Try to parse JSON for preview
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              preview = `Array with ${parsed.length} item${parsed.length !== 1 ? 's' : ''}`;
              // Format full content nicely
              fullContent = JSON.stringify(parsed, null, 2);
            } else if (typeof parsed === 'object' && parsed !== null) {
              const keys = Object.keys(parsed);
              preview = `Object: {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
              // Format full content nicely
              fullContent = JSON.stringify(parsed, null, 2);
            } else {
              preview = String(parsed).substring(0, 100);
              fullContent = String(parsed);
            }
          } catch (e) {
            // Not JSON, show as string
            preview = value.length > 100 ? value.substring(0, 100) + '...' : value;
            fullContent = value;
          }
        } else if (type === 'hash') {
          preview = 'Hash data structure';
          fullContent = 'Hash data (use Redis CLI to view details)';
        } else if (type === 'list') {
          preview = 'List data structure';
          fullContent = 'List data (use Redis CLI to view details)';
        } else if (type === 'set') {
          preview = 'Set data structure';
          fullContent = 'Set data (use Redis CLI to view details)';
        }

        cacheData.push({
          key,
          type,
          ttl: ttl === -1 ? 'No expiry' : ttl === -2 ? 'Expired' : `${ttl}s`,
          size: `${(size / 1024).toFixed(2)} KB`,
          preview: preview,
          fullContent: fullContent
        });
      } catch (err) {
        console.error(`Error getting data for key ${key}:`, err.message);
      }
    }

    // Get Redis server info
    const info = await redisClient.info();
    const stats = parseRedisInfo(info);

    res.render('redisDashboard', {
      user: req.user,
      title: 'Redis Cache Dashboard',
      connected: true,
      cacheData,
      stats,
      error: null
    });
  } catch (err) {
    console.error('Error fetching Redis dashboard data:', err);
    res.render('redisDashboard', {
      user: req.user,
      title: 'Redis Cache Dashboard',
      connected: false,
      cacheData: [],
      stats: null,
      error: err.message
    });
  }
};

// Clear specific cache key
exports.clearCacheKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!redisClient.isReady) {
      return res.status(500).json({ success: false, message: 'Redis is not connected' });
    }

    const result = await redisClient.del(key);
    console.log(`🗑️  Deleted cache key: ${key}`);
    
    res.status(200).json({ 
      success: true, 
      message: result > 0 ? 'Cache key deleted successfully' : 'Key not found' 
    });
  } catch (err) {
    console.error('Error deleting cache key:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Clear all cache
exports.clearAllCache = async (req, res) => {
  try {
    if (!redisClient.isReady) {
      return res.status(500).json({ success: false, message: 'Redis is not connected' });
    }

    await redisClient.flushDb();
    console.log('🗑️  Cleared all cache from Redis');
    
    res.status(200).json({ 
      success: true, 
      message: 'All cache cleared successfully' 
    });
  } catch (err) {
    console.error('Error clearing cache:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get cache statistics API
exports.getCacheStats = async (req, res) => {
  try {
    if (!redisClient.isReady) {
      return res.json({ 
        success: false, 
        connected: false,
        message: 'Redis is not connected' 
      });
    }

    const keys = await redisClient.keys('*');
    const cacheEntries = [];

    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      const type = await redisClient.type(key);
      
      let size = 0;
      if (type === 'string') {
        const value = await redisClient.get(key);
        size = Buffer.byteLength(value, 'utf8');
      }

      cacheEntries.push({
        key,
        type,
        ttl: ttl === -1 ? 'No expiry' : ttl === -2 ? 'Expired' : `${ttl}s`,
        size: `${(size / 1024).toFixed(2)} KB`
      });
    }

    res.json({
      success: true,
      connected: true,
      totalKeys: keys.length,
      cacheEntries
    });
  } catch (err) {
    console.error('Error getting cache stats:', err);
    res.json({ 
      success: false, 
      connected: false,
      message: err.message 
    });
  }
};

// Parse Redis INFO command output
function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const stats = {
    version: '',
    connectedClients: 0,
    usedMemory: '',
    totalKeys: 0,
    uptime: ''
  };

  for (const line of lines) {
    if (line.startsWith('redis_version:')) {
      stats.version = line.split(':')[1];
    } else if (line.startsWith('connected_clients:')) {
      stats.connectedClients = parseInt(line.split(':')[1]);
    } else if (line.startsWith('used_memory_human:')) {
      stats.usedMemory = line.split(':')[1];
    } else if (line.startsWith('uptime_in_seconds:')) {
      const seconds = parseInt(line.split(':')[1]);
      stats.uptime = formatUptime(seconds);
    }
  }

  return stats;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

module.exports = exports;
