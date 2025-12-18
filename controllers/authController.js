const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentDetails, staffDetails } = req.body;
    if (await User.findOne({ email })) {
      return res.render('register', { title: 'Register', error: 'User with this email already exists' });
    }
    let userData = { firstName, lastName, email, password, role };
    if (role === 'student' && studentDetails) {
      userData.studentDetails = {
        enrollmentNumber: studentDetails.studentId,
        department: studentDetails.department
      };
    }
    if (role === 'staff' && staffDetails) {
      userData.staffDetails = {
        department: staffDetails.department,
        designation: staffDetails.designation
      };
    }
    const user = new User(userData);
    await user.save();
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect(`/${user.role}Dashboard`);
  } catch (error) {
    res.render('register', { title: 'Register', error: 'An error occurred during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { title: 'Login', error: 'Invalid email or password' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect(`/${user.role}Dashboard`);
  } catch (error) {
    res.render('login', { title: 'Login', error: 'An error occurred during login' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
}; 