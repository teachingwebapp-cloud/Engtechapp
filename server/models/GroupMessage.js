/**
 * Group Message Model
 * Stores all group chat messages with tracking for deletions
 */

const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  senderRole: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: [true, 'Sender role is required']
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true
  },
  senderStudentId: {
    type: String,
    required: [true, 'Sender ID is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 2000
  },
  // Message status
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedByRole: {
    type: String,
    enum: ['admin', 'teacher']
  },
  // Message metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  originalMessage: {
    type: String
  },
  // Reactions/Read status (optional for future)
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply to message (optional for future)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessage'
  },
  // Attachments (optional for future)
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'link']
    },
    url: String,
    name: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
groupMessageSchema.index({ createdAt: -1 });
groupMessageSchema.index({ senderId: 1, createdAt: -1 });
groupMessageSchema.index({ isDeleted: 1, createdAt: -1 });
groupMessageSchema.index({ senderRole: 1, createdAt: -1 });

// Virtual for message color based on role
groupMessageSchema.virtual('messageColor').get(function() {
  switch(this.senderRole) {
    case 'admin':
      return 'green';
    case 'teacher':
      return 'red';
    case 'student':
      return 'default'; // Will be white/black based on theme
    default:
      return 'default';
  }
});

// Method to format message for students (hide names)
groupMessageSchema.methods.toStudentView = function() {
  return {
    _id: this._id,
    senderId: this.senderId,
    senderRole: this.senderRole,
    senderStudentId: this.senderStudentId,
    // Students only see ID, not name
    senderName: this.senderRole === 'student' ? this.senderStudentId : this.senderName,
    message: this.isDeleted ? '[Message deleted]' : this.message,
    isDeleted: this.isDeleted,
    isEdited: this.isEdited,
    messageColor: this.messageColor,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to format message for admin/teacher (show full details)
groupMessageSchema.methods.toAdminView = function() {
  return {
    _id: this._id,
    senderId: this.senderId,
    senderRole: this.senderRole,
    senderStudentId: this.senderStudentId,
    senderName: this.senderName,
    message: this.isDeleted ? '[Message deleted]' : this.message,
    isDeleted: this.isDeleted,
    deletedAt: this.deletedAt,
    deletedBy: this.deletedBy,
    deletedByRole: this.deletedByRole,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    originalMessage: this.originalMessage,
    messageColor: this.messageColor,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

module.exports = GroupMessage;
