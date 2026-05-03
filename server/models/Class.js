const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true,
    maxlength: 200
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  schedule: {
    type: Date,
    required: [true, 'Schedule is required']
  },
  duration: {
    type: Number,
    default: 60,
    min: 15,
    max: 300
  },
  jitsiRoomName: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed'],
    default: 'scheduled'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // NEW: Class-wide permission settings
  permissionSettings: {
    allowMicrophone: {
      type: Boolean,
      default: true,
      description: 'Students can request microphone access'
    },
    allowCamera: {
      type: Boolean,
      default: true,
      description: 'Students can request camera access'
    },
    allowScreenShare: {
      type: Boolean,
      default: true,
      description: 'Students can request screen sharing'
    }
  },
  // NEW: Student speaking limits
  maxConcurrentSpeakers: {
    type: Number,
    default: 5,
    min: 1,
    max: 100,
    description: 'Maximum number of students with active mic permission'
  },
  // NEW: Auto-revoke duration in seconds
  permissionDuration: {
    type: Number,
    default: 3600,
    min: 300,
    max: 28800,
    description: 'How long permission lasts before auto-revoke (5min to 8h)'
  }
}, {
  timestamps: true
});

// Index for efficient queries
classSchema.index({ teacherId: 1, schedule: -1 });
classSchema.index({ status: 1 });
// NEW: Index for analytics
classSchema.index({ maxConcurrentSpeakers: 1 });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
