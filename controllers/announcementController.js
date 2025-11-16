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
      
      // Invalidate announcements cache
      try {
        if (redisClient.isReady) {
          await redisClient.del('announcements:list');
          console.log('✅ Cache invalidated: announcements:list');
        }
      } catch (err) {
        console.error('Cache invalidation error:', err.message);
      }
      
      // Broadcast new announcement via WebSocket
      const io = req.app.get('socketio');
      if (io) {
        const populatedAnnouncement = await Announcement.findById(announcement._id)
          .populate('createdBy', 'firstName lastName role');
        io.emit('newAnnouncement', populatedAnnouncement);
        console.log('🔔 WebSocket: New announcement broadcasted');
      }
      
      req.flash('success', 'Announcement created successfully!');
      const redirectPath = req.user.role === 'admin' ? '/adminDashboard' : '/staffDashboard';
      res.redirect(redirectPath);
  } catch (err) {
      console.error('Error creating announcement:', err);
      req.flash('error', 'Failed to create announcement');
      const redirectPath = req.user.role === 'admin' ? '/adminDashboard' : '/staffDashboard';
      res.redirect(redirectPath);
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
