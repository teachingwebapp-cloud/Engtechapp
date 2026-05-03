const mongoose = require('mongoose');

const permissionRequestSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  requestType: {
    type: String,
    enum: ['microphone', 'camera', 'screen'],
    required: [true, 'Request type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'revoked'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['individual', 'class'],
    default: 'individual',
    description: 'Whether only teacher sees or whole class sees'
  },
  approvedAt: {
    type: Date
  },
  deniedAt: {
    type: Date
  },
  denialReason: {
    type: String,
    trim: true,
    maxlength: 200
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    description: 'Auto-revoke after session ends'
  },
  // NEW: Permission scheduling
  scheduledStartTime: {
    type: Date,
    description: 'When permission becomes active (optional)'
  },
  scheduledEndTime: {
    type: Date,
    description: 'When permission automatically expires (optional)'
  },
  // NEW: Teacher notes on approval
  approvalNotes: {
    type: String,
    trim: true,
    maxlength: 300,
    description: 'Teacher notes for why permission was approved/denied'
  },
  // NEW: Response analytics
  responseTime: {
    type: Number,
    description: 'Teacher response time in seconds'
  }
}, {
  timestamps: true
});

// Compound unique index: one active request per student per request type per class
permissionRequestSchema.index({ classId: 1, studentId: 1, requestType: 1, status: 1 });
// NEW: Prevent duplicate pending requests with unique compound index
permissionRequestSchema.index(
  { classId: 1, studentId: 1, requestType: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' },
    name: 'unique_pending_request'
  }
);
// Index for teacher to fetch pending requests quickly
permissionRequestSchema.index({ teacherId: 1, classId: 1, status: 1 });
// Index for student to see own requests
permissionRequestSchema.index({ studentId: 1, classId: 1 });
// NEW: TTL index to auto-delete expired permissions after 24 hours
permissionRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// NEW: Index for analytics queries
permissionRequestSchema.index({ teacherId: 1, createdAt: -1 });
// NEW: Index for scheduled permission checks
permissionRequestSchema.index({ classId: 1, status: 1, scheduledEndTime: 1 });

const PermissionRequest = mongoose.model('PermissionRequest', permissionRequestSchema);

module.exports = PermissionRequest;
