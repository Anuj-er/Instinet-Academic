const express = require('express');
const router = express.Router();
const { authenticateUser, isAdmin } = require('../middleware/auth');
const redisDashboardController = require('../controllers/redisDashboardController');

// Redis Dashboard (Admin only)
router.get('/dashboard', authenticateUser, isAdmin, redisDashboardController.getRedisDashboard);

// API endpoints
router.get('/stats', authenticateUser, redisDashboardController.getCacheStats);
router.delete('/clear/:key', authenticateUser, isAdmin, redisDashboardController.clearCacheKey);
router.delete('/clear-all', authenticateUser, isAdmin, redisDashboardController.clearAllCache);

module.exports = router;
