const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
};

// Middleware to check role
const isAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).render('error', { title: 'Access Denied', message: 'You do not have permission to access this resource.', error: null });
const isStaff = (req, res, next) => {
    console.log('Checking staff role:', req.user);
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
        next();
    } else {
        req.flash('error', 'Access denied. Staff or Admin only.');
        res.redirect('/login');
    }
};
const isStudent = (req, res, next) => req.user?.role === 'student' ? next() : res.status(403).render('error', { title: 'Access Denied', message: 'You do not have permission to access this resource.', error: null });

module.exports = { authenticateUser, isAdmin, isStaff, isStudent };