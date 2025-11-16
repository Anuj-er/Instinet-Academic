const User = require('../models/User');

// Get user's own profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  let incomplete = false;
  let missingFields = [];

  // Common fields
  if (!user.firstName) { incomplete = true; missingFields.push('First Name'); }
  if (!user.lastName) { incomplete = true; missingFields.push('Last Name'); }
  if (!user.email) { incomplete = true; missingFields.push('Email'); }
  if (!user.phoneNumber) { incomplete = true; missingFields.push('Phone Number'); }
  if (!user.gender) { incomplete = true; missingFields.push('Gender'); }
  if (!user.dateOfBirth) { incomplete = true; missingFields.push('Date of Birth'); }
  if (!user.address || !user.address.street || !user.address.city) { incomplete = true; missingFields.push('Address'); }

  // Role-specific
  if (user.role === 'student') {
    if (!user.studentDetails?.enrollmentNumber) { incomplete = true; missingFields.push('Enrollment Number'); }
    if (!user.studentDetails?.courseName) { incomplete = true; missingFields.push('Course Name'); }
    if (!user.studentDetails?.department) { incomplete = true; missingFields.push('Department'); }
    if (!user.studentDetails?.year) { incomplete = true; missingFields.push('Year'); }
    if (!user.studentDetails?.semester) { incomplete = true; missingFields.push('Semester'); }
  }
  if (user.role === 'staff') {
    if (!user.staffDetails?.employeeId) { incomplete = true; missingFields.push('Employee ID'); }
    if (!user.staffDetails?.department) { incomplete = true; missingFields.push('Department'); }
    if (!user.staffDetails?.designation) { incomplete = true; missingFields.push('Designation'); }
    if (!user.staffDetails?.dateOfJoining) { incomplete = true; missingFields.push('Date of Joining'); }
  }
  if (user.role === 'admin') {
    if (!user.adminDetails?.employeeId) { incomplete = true; missingFields.push('Employee ID'); }
    if (!user.adminDetails?.department) { incomplete = true; missingFields.push('Department'); }
    if (!user.adminDetails?.officeRoomNumber) { incomplete = true; missingFields.push('Office Room Number'); }
    if (!user.adminDetails?.accessLevel) { incomplete = true; missingFields.push('Access Level'); }
  }

  res.render('profile', {
    title: 'My Profile',
    user,
    incomplete,
    missingFields,
    success: req.flash('success'),
    subtle: req.flash('subtle'),
    path: req.path
  });
};

// Get edit profile form
exports.editProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.render('editProfile', {
    title: 'Edit Profile',
    user,
    error: req.flash('error'),
    subtle: req.flash('subtle'),
    path: req.path
  });
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse booleans for hostel/scholarship
    if (req.user.role === 'student' && req.body.studentDetails) {
      updateData.studentDetails = {
        ...req.body.studentDetails,
        isHostelResident: req.body.studentDetails.isHostelResident === "true",
        hasScholarship: req.body.studentDetails.hasScholarship === "true"
      };
    }
    if (req.user.role === 'staff' && req.body.staffDetails) {
      updateData.staffDetails = req.body.staffDetails;
    }
    if (req.user.role === 'admin' && req.body.adminDetails) {
      updateData.adminDetails = req.body.adminDetails;
    }
    if (req.body.address) {
      updateData.address = req.body.address;
    }

    await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    req.flash('subtle', 'Changes saved!');
    res.redirect('/profile');
  } catch (error) {
    req.flash('error', 'Error updating profile');
    res.redirect('/profile/edit');
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.render('admin/users', {
      title: 'All Users',
      users,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error fetching users');
    res.redirect('/adminDashboard');
  }
};

// Admin: Get specific user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }
    res.render('admin/userDetails', {
      title: 'User Details',
      user,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error fetching user details');
    res.redirect('/admin/users');
  }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle role-specific fields
    if (updateData.role === 'student') {
      updateData.studentDetails = {
        ...updateData.studentDetails,
        isHostelResident: updateData.studentDetails?.isHostelResident === 'on',
        hasScholarship: updateData.studentDetails?.hasScholarship === 'on'
      };
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    req.flash('success', 'User updated successfully');
    res.redirect(`/admin/users/${user._id}`);
  } catch (error) {
    req.flash('error', 'Error updating user');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', 'Error deleting user');
    res.redirect('/admin/users');
  }
}; 