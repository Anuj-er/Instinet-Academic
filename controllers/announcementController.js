const Announcement = require('../models/Announcement');
const { redisClient } = require('../utils/redisClient');

exports.createAnnouncement = async (req, res) => {
  try {
      console.log('Creating announcement:', req.body); // Debug log
      const { title, message } = req.body;
      
      if (!title || !message) {
          req.flash('error', 'Title and message are required');
          const redirectPath = req.user.role === 'admin' ? '/adminDashboard' : '/staffDashboard';
          return res.redirect(redirectPath);
      }

      const announcement = await Announcement.create({
          title,
          message,
          createdBy: req.user._id
      });
      
      console.log('Announcement created:', announcement); // Debug log
      
      // Invalidate announcements cache (don't await, let it run in background)
      if (process.env.REDIS_URL && redisClient.isReady) {
        redisClient.del('announcements:list').then(() => {
          console.log('✅ Cache invalidated: announcements:list');
        }).catch(err => {
          console.error('Cache invalidation error:', err.message);
        });
      }
      
      // Broadcast new announcement via WebSocket (don't await)
      const io = req.app.get('socketio');
      if (io) {
        Announcement.findById(announcement._id)
          .populate('createdBy', 'firstName lastName role')
          .then(populatedAnnouncement => {
            io.emit('newAnnouncement', populatedAnnouncement);
            console.log('🔔 WebSocket: New announcement broadcasted');
          })
          .catch(err => console.error('WebSocket broadcast error:', err));
      }
      
      req.flash('success', 'Announcement created successfully!');
      const redirectPath = req.user.role === 'admin' ? '/adminDashboard' : '/staffDashboard';
      return res.redirect(redirectPath);
  } catch (err) {
      console.error('Error creating announcement:', err);
      req.flash('error', 'Failed to create announcement');
      const redirectPath = req.user.role === 'admin' ? '/adminDashboard' : '/staffDashboard';
      res.redirect(redirectPath);
  }
};

// Get all announcements with Redis caching
exports.getAllAnnouncements = async (req, res) => {
  try {
    const cacheKey = 'announcements:list';
    
    // Try to get from Redis cache first
    if (redisClient.isReady) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const announcements = JSON.parse(cachedData);
          console.log('✅ Cache HIT: Announcements retrieved from Redis');
          return res.render('announcements', { 
            user: req.user, 
            announcements, 
            title: 'Announcements',
            fromCache: true
          });
        }
        console.log('❌ Cache MISS: Fetching announcements from database');
      } catch (cacheErr) {
        console.error('Redis cache read error:', cacheErr.message);
      }
    }
    
    // Fetch from database
    const announcements = await Announcement.find()
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 });
    
    // Store in Redis cache (expires in 5 minutes)
    if (redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(announcements));
        console.log('💾 Stored in Redis: announcements:list (TTL: 5 minutes)');
      } catch (cacheErr) {
        console.error('Redis cache write error:', cacheErr.message);
      }
    }
    
    res.render('announcements', { 
      user: req.user, 
      announcements, 
      title: 'Announcements',
      fromCache: false
    });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    req.flash('error', 'Failed to fetch announcements');
    res.redirect('/');
  }
};

exports.getAnnouncement = async (req, res) => {
  try {
    const cacheKey = `announcement:${req.params.id}`;
    
    // Try Redis cache first
    if (redisClient.isReady) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const announcement = JSON.parse(cachedData);
          console.log(`✅ Cache HIT: Announcement ${req.params.id} from Redis`);
          return res.render('announcementDetail', { 
            user: req.user, 
            announcement, 
            title: announcement.title,
            fromCache: true
          });
        }
      } catch (cacheErr) {
        console.error('Redis cache read error:', cacheErr.message);
      }
    }
    
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'firstName lastName role');
      
    if (!announcement) {
      req.flash('error', 'Announcement not found');
      return res.redirect('/announcements');
    }
    
    // Cache individual announcement (expires in 10 minutes)
    if (redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(announcement));
        console.log(`💾 Stored in Redis: announcement:${req.params.id} (TTL: 10 minutes)`);
      } catch (cacheErr) {
        console.error('Redis cache write error:', cacheErr.message);
      }
    }
    
    res.render('announcementDetail', { 
      user: req.user, 
      announcement, 
      title: announcement.title,
      fromCache: false
    });
  } catch (err) {
    req.flash('error', 'Failed to fetch announcement');
    res.redirect('/announcements');
  }
};
