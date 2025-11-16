const express = require('express');
const router = express.Router();
const { authenticateUser, isStaff } = require('../middleware/auth');
const announcementController = require('../controllers/announcementController');

// Debug middleware
router.use((req, res, next) => {
    console.log('Announcement route accessed:', req.method, req.path);
    next();
});

// Staff creates announcement
router.get('/create', authenticateUser, isStaff, (req, res) => {
  res.render('createAnnouncement', { 
    user: req.user, 
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/create', authenticateUser, isStaff, (req, res, next) => {
    console.log('Create announcement route hit');
    console.log('Request body:', req.body);
    next();
}, announcementController.createAnnouncement);

// View single announcement (kept for direct access if needed)
router.get('/:id', authenticateUser, announcementController.getAnnouncement);

// Test route
router.post('/test', (req, res) => {
    console.log('Test route hit');
    console.log('Request body:', req.body);
    res.json({ message: 'Test successful', body: req.body });
});

module.exports = router;
