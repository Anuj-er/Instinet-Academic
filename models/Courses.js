const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  department: { type: String, required: true, index: true }, // e.g., "CSE", "ECE"
  code: { type: String, required: true, unique: true },       // e.g., "CS101"
  description: String,
  instructor: String,
  schedule: String
});

// Index for faster department queries
courseSchema.index({ department: 1 });

module.exports = mongoose.model('Courses', courseSchema);
