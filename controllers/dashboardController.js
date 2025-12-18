const User = require('../models/User');
const Course = require('../models/Courses');
const Announcement = require('../models/Announcement');

exports.getAdminDashboard = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const totalUsers = users.length;
    const students = users.filter(user => user.role === 'student').length;
    const staff = users.filter(user => user.role === 'staff').length;
    const courses = await Course.countDocuments();

    // Fetch announcements for display on dashboard
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName role')
      .limit(10)
      .lean();

    res.render('adminDashboard', { 
      title: 'Admin Dashboard', 
      user: req.user, 
      users,
      announcements,
      stats: {
        totalUsers,
        students,
        staff,
        courses
      },
      path: req.path
    });
  } catch (error) {
    console.error('Error in getAdminDashboard:', error);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/login');
  }
};

exports.getStaffDashboard = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).lean();
    for (let student of students) {
      if (student.studentDetails && student.studentDetails.department) {
        student.courses = await Course.find({ department: student.studentDetails.department }).lean();
      } else {
        student.courses = [];
      }
    }
    
    // Fetch announcements for display on dashboard
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName role')
      .limit(10)
      .lean();
    
    // Calculate stats for staff dashboard
    const stats = {
      totalStudents: students.length,
      totalCourses: await Course.countDocuments(),
      totalAnnouncements: await Announcement.countDocuments()
    };
    
    res.render('staffDashboard', {
      title: 'Staff Dashboard',
      user: req.user,
      students,
      announcements,
      stats,
      error: req.flash('error'),
      success: req.flash('success'),
      path: req.path
    });
  } catch (err) {
    console.error('Error in getStaffDashboard:', err);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/login');
  }
};

exports.getStudentDashboard = async (req, res) => {
  const department = req.user.studentDetails?.department;
  const courses = await Course.find({ department }).limit(4);
  
  // Fetch announcements for display on dashboard
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName role')
    .limit(10)
    .lean();
  
  // Calculate stats for student dashboard
  const stats = {
    enrolledCourses: courses.length,
    totalAnnouncements: announcements.length
  };
  
  res.render('studentDashboard', {
    title: 'Student Dashboard',
    user: req.user,
    courses,
    announcements,
    stats,
    path: req.path
  });
}; 