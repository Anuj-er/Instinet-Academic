const Announcement = require('../models/Announcement');
const { redisClient } = require('../utils/redisClient');

exports.createAnnouncement = async (req, res) => {
  try {
      console.log('Creating announcement:', req.body); // Debug log
      const { title, message } = req.body;
      
      if (!title || !message) {
          req.flash('error', 'Title and message are required');
          return res.redirect('/staffDashboard');
      }

      const announcement = await Announcement.create({
          title,
          message,
          createdBy: req.user._id
      });
      
      console.log('Announcement created:', announcement); // Debug log
      
      // Invalidate announcements cache
      try {
        if (redisClient.isReady) {
          await redisClient.del('announcements:list');
          console.log('✅ Cache invalidated: announcements:list');
        }
      } catch (err) {
        console.error('Cache invalidation error:', err.message);
      }
      
      req.flash('success', 'Announcement created successfully!');
      res.redirect('/staffDashboard');
  } catch (err) {
      console.error('Error creating announcement:', err);
      req.flash('error', 'Failed to create announcement');
      res.redirect('/staffDashboard');
  }
};
exports.getAllAnnouncements = async (req, res) => {
  try {
    // Try to get from cache first
    if (redisClient.isReady) {
      try {
        const cached = await redisClient.get('announcements:list');
        if (cached) {
          console.log('✅ [Cache HIT] Announcements served from Redis');
          const announcements = JSON.parse(cached);
          return res.render('announcements', { 
            user: req.user, 
            announcements, 
            title: 'Announcements',
            success: req.flash('success'),
            error: req.flash('error')
          });
        }
        console.log('ℹ️ [Cache MISS] Fetching announcements from MongoDB');
      } catch (cacheErr) {
        console.error('Cache read error:', cacheErr.message);
      }
    }
    
    // Cache miss or Redis not available - fetch from database
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName role');
    
    // Store in cache for 5 minutes (300 seconds)
    if (redisClient.isReady) {
      try {
        await redisClient.setEx('announcements:list', 300, JSON.stringify(announcements));
        console.log('✅ [Cache SET] Cached announcements for 5 minutes');
      } catch (cacheErr) {
        console.error('Cache write error:', cacheErr.message);
      }
    }
    
    res.render('announcements', { 
      user: req.user, 
      announcements, 
      title: 'Announcements',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    req.flash('error', 'Failed to fetch announcements');
    res.redirect('/staffDashboard');
  }
};

exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'firstName lastName role');
    if (!announcement) {
      req.flash('error', 'Announcement not found');
      return res.redirect('/announcements');
    }
    res.render('announcementDetail', { 
      user: req.user, 
      announcement, 
      title: announcement.title 
    });
  } catch (err) {
    req.flash('error', 'Failed to fetch announcement');
    res.redirect('/announcements');
  }
};
