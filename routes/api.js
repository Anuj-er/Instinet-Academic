const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateUser, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const { redisClient } = require('../utils/redisClient');

// API route to get current user data
router.get('/current-user', authenticateUser, (req, res) => {
  // User is already attached to req by authenticateUser middleware
  const { password, ...userInfo } = req.user;
  res.json(userInfo);
});

// API routes example
router.get('/courses', (req, res) => {
  res.status(200).json({
    courses: [
      { id: 1, name: 'Computer Science', instructor: 'Dr. Smith', duration: '4 years' },
      { id: 2, name: 'Information Technology', instructor: 'Prof. Johnson', duration: '3 years' },
      { id: 3, name: 'Electronics Engineering', instructor: 'Dr. Williams', duration: '4 years' },
      { id: 4, name: 'Data Science', instructor: 'Prof. Brown', duration: '2 years' }
    ]
  });
});

// API route to get announcements with Redis caching
router.get('/announcements', authenticateUser, async (req, res) => {
  try {
    const cacheKey = 'announcements:list';
    
    // Try Redis cache first
    if (redisClient.isReady) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const announcements = JSON.parse(cachedData);
          console.log('✅ API Cache HIT: Announcements from Redis');
          return res.status(200).json({
            success: true,
            announcements: announcements,
            fromCache: true
          });
        }
        console.log('❌ API Cache MISS: Fetching from database');
      } catch (cacheErr) {
        console.error('Redis cache read error:', cacheErr.message);
      }
    }
    
    // Fetch from database
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName role')
      .lean();
    
    // Store in Redis cache (5 minutes TTL)
    if (redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(announcements));
        console.log('💾 API: Stored announcements in Redis (TTL: 5 minutes)');
      } catch (cacheErr) {
        console.error('Redis cache write error:', cacheErr.message);
      }
    }
    
    res.status(200).json({
      success: true,
      announcements: announcements,
      fromCache: false
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      announcements: [],
      error: 'Failed to fetch announcements'
    });
  }
});

// API route to get users (admin only)
router.get('/users', authenticateUser, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;