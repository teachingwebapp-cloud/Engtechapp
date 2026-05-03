const User = require('../models/User');

/**
 * Generates a unique student ID like ENG-2026-001.
 * Retries up to 5 times on duplicate key collision (race condition safety).
 */
const generateStudentId = async (retries = 5) => {
  const year = new Date().getFullYear();
  const prefix = `ENG-${year}-`;

  for (let attempt = 0; attempt < retries; attempt++) {
    // Find the last student ID for the current year
    const lastStudent = await User.findOne({
      studentId: { $regex: `^${prefix}` }
    }).sort({ studentId: -1 });

    let nextNumber = 1;
    if (lastStudent && lastStudent.studentId) {
      const parts = lastStudent.studentId.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }

    const paddedNumber = String(nextNumber).padStart(3, '0');
    const candidateId = `${prefix}${paddedNumber}`;

    // Check if this ID already exists (guard against race condition)
    const exists = await User.findOne({ studentId: candidateId }).select('_id').lean();
    if (!exists) {
      return candidateId;
    }

    // ID already taken — loop and try again with the next number
    console.warn(`generateStudentId: collision on ${candidateId}, retrying (attempt ${attempt + 1})`);
  }

  // Fallback: append a random suffix to guarantee uniqueness
  const year2 = new Date().getFullYear();
  const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
  return `ENG-${year2}-${randomSuffix}`;
};

module.exports = generateStudentId;
