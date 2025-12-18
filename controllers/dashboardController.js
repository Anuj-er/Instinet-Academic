const User = require('../models/User');
const Course = require('../models/Courses');
const Announcement = require('../models/Announcement');

exports.getAdminDashboard = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    const totalUsers = users.length;
    const students = users.filter(user => user.role === 'student').length;
    const staff = users.filter(user => user.role === 'staff').length;
    
    // Fetch all courses with student count
    const courses = await Course.find().lean();
    
    // Count students per department (optimized - single query)
    const studentsByDept = users
      .filter(u => u.role === 'student' && u.studentDetails?.department)
      .reduce((acc, u) => {
        const dept = u.studentDetails.department;
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});
    
    // Assign student counts to courses
    courses.forEach(course => {
      course.studentCount = studentsByDept[course.department] || 0;
    });

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
      courses,
      announcements,
      stats: {
        totalUsers,
        students,
        staff,
        courses: courses.length
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
    
    // Fetch all courses
    const courses = await Course.find().lean();
    
    // Fetch announcements for display on dashboard
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName role')
      .limit(10)
      .lean();
    
    // Calculate stats for staff dashboard
    const stats = {
      totalStudents: students.length,
      totalCourses: courses.length,
      totalAnnouncements: await Announcement.countDocuments()
    };
    
    res.render('staffDashboard', {
      title: 'Staff Dashboard',
      user: req.user,
      students,
      courses,
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