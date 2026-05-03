const PermissionRequest = require('../models/PermissionRequest');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const logActivity = require('../middleware/activityLogger');
const { 
  isPermissionActive, 
  getActiveSpeakersCount, 
  canApproveSpeaker,
  getActivePermissions,
  isPermissionTypeAllowed,
  invalidatePermissionCaches,
  calculateResponseTime
} = require('../utils/permissionValidator');
const cache = require('../utils/cache');

// POST /api/permissions/request — Student requests permission (OPTIMIZED)
const requestPermission = async (req, res) => {
  try {
    const { classId, requestType, scheduledEndTime } = req.body;
    const studentId = req.user._id;

    if (!classId || !requestType) {
      return res.status(400).json({ message: 'Class ID and request type are required.' });
    }

    const validTypes = ['microphone', 'camera', 'screen'];
    if (!validTypes.includes(requestType)) {
      return res.status(400).json({ message: `Invalid request type. Must be one of: ${validTypes.join(', ')}` });
    }

    // Verify student is enrolled in class (optimize query)
    const enrollment = await Enrollment.findOne({ studentId, classId })
      .select('_id')
      .lean();
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this class.' });
    }

    // Get class to find teacher (optimize query)
    const classItem = await Class.findById(classId)
      .select('teacherId title permissionSettings permissionDuration')
      .lean();
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // NEW: Check if permission type is allowed in this class
    const isAllowed = await isPermissionTypeAllowed(classId, requestType);
    if (!isAllowed) {
      return res.status(403).json({ 
        message: `${requestType} permission is disabled for this class.` 
      });
    }

    // Check if already have active permission (optimize query)
    const existingActive = await PermissionRequest.findOne({
      classId,
      studentId,
      requestType,
      status: { $in: ['pending', 'approved'] }
    })
      .select('_id status')
      .lean();

    if (existingActive) {
      const msg = existingActive.status === 'approved' 
        ? 'You already have permission for this.'
        : 'You already have a pending request for this.';
      return res.status(400).json({ message: msg });
    }

    // Check if recently denied (prevent spam, optimize query)
    const recentDenial = await PermissionRequest.findOne({
      classId,
      studentId,
      requestType,
      status: 'denied',
      deniedAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    })
      .select('denialReason')
      .lean();

    if (recentDenial) {
      return res.status(429).json({ 
        message: 'Your request was recently denied. Please wait before requesting again.',
        deniedReason: recentDenial.denialReason
      });
    }

    // Create permission request with optional scheduling
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (classItem.permissionDuration || 3600));

    try {
      const request = await PermissionRequest.create({
        classId,
        studentId,
        teacherId: classItem.teacherId,
        requestType,
        status: 'pending',
        expiresAt,
        scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : undefined
      });

      await logActivity(
        studentId,
        'request_permission',
        classId,
        `Requested ${requestType} permission in class: ${classItem.title}`
      );

      // Invalidate teacher pending cache
      await invalidatePermissionCaches(classId);

      res.status(201).json({
        message: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} permission requested.`,
        request
      });
    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'You already have a pending request for this permission.' 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Request permission error:', error);
    res.status(500).json({ message: 'Server error requesting permission.' });
  }
};

// GET /api/permissions/requests/:classId — Teacher gets pending/approved requests (OPTIMIZED & PAGINATED)
const getPendingRequests = async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const teacherId = req.user._id;

    // Verify class and teacher ownership
    const classItem = await Class.findById(classId)
      .select('teacherId title')
      .lean();
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    if (classItem.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const skip = (page - 1) * limit;
    const statusFilter = status ? { $in: status.split(',') } : { $in: ['pending', 'approved'] };

    // Query with optimization: select only needed fields
    const requests = await PermissionRequest.find({
      classId,
      status: statusFilter
    })
      .select('_id studentId requestType status visibility approvedAt deniedAt denialReason requestedAt responseTime')
      .populate('studentId', 'name studentId email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PermissionRequest.countDocuments({
      classId,
      status: statusFilter
    });

    // Group requests by student for better UI display
    const grouped = {
      pending: [],
      approved: []
    };

    requests.forEach(req => {
      if (req.status === 'pending') {
        grouped.pending.push(req);
      } else if (req.status === 'approved') {
        grouped.approved.push(req);
      }
    });

    res.json({
      classId,
      requests,
      grouped, // Add grouped data for frontend
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        total,
        pending: grouped.pending.length,
        approved: grouped.approved.length
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error fetching requests.' });
  }
};

// PATCH /api/permissions/requests/:requestId/approve — Teacher approves (ENHANCED & OPTIMIZED)
const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { visibility, scheduledEndTime, approvalNotes } = req.body;
    const teacherId = req.user._id;

    const request = await PermissionRequest.findById(requestId)
      .populate('classId', 'teacherId title permissionDuration maxConcurrentSpeakers')
      .populate('studentId', 'name studentId email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Verify teacher owns the class
    if (request.classId.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve request with status: ${request.status}` });
    }

    // NEW: Check speaker limit for microphone
    if (request.requestType === 'microphone') {
      const canApprove = await canApproveSpeaker(request.classId._id, 'microphone');
      if (!canApprove) {
        return res.status(429).json({ 
          message: `Maximum speakers limit (${request.classId.maxConcurrentSpeakers}) reached for this class.`,
          activeCount: await getActiveSpeakersCount(request.classId._id, 'microphone'),
          limit: request.classId.maxConcurrentSpeakers
        });
      }
    }

    const validVisibility = ['individual', 'class'];
    const vis = visibility || 'individual';
    if (!validVisibility.includes(vis)) {
      return res.status(400).json({ 
        message: `Invalid visibility. Must be one of: ${validVisibility.join(', ')}` 
      });
    }

    // Set expiry time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (request.classId.permissionDuration || 3600));

    request.status = 'approved';
    request.visibility = vis;
    request.approvedAt = new Date();
    request.expiresAt = expiresAt;
    request.scheduledEndTime = scheduledEndTime ? new Date(scheduledEndTime) : undefined;
    request.approvalNotes = approvalNotes || '';
    request.responseTime = calculateResponseTime(request.requestedAt);

    await request.save();

    await logActivity(
      teacherId,
      'approve_permission',
      request.classId._id,
      `Approved ${request.requestType} for ${request.studentId.name}`
    );

    // Invalidate caches
    await invalidatePermissionCaches(request.classId._id, request.studentId._id, request.requestType);

    res.json({
      message: `${request.requestType} permission approved for ${request.studentId.name}.`,
      request,
      activeCount: await getActiveSpeakersCount(request.classId._id, request.requestType)
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error approving request.' });
  }
};

// PATCH /api/permissions/requests/:requestId/deny — Teacher denies request
const denyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const teacherId = req.user._id;

    const request = await PermissionRequest.findById(requestId)
      .populate('classId', 'teacherId title')
      .populate('studentId', 'name studentId');

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Verify teacher owns the class
    if (request.classId.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot deny request with status: ${request.status}` });
    }

    request.status = 'denied';
    request.deniedAt = new Date();
    request.denialReason = reason || 'Request denied by teacher.';
    request.responseTime = calculateResponseTime(request.requestedAt);

    await request.save();

    await logActivity(
      teacherId,
      'deny_permission',
      request.classId._id,
      `Denied ${request.requestType} for ${request.studentId.name}`
    );

    // Invalidate caches
    await invalidatePermissionCaches(request.classId._id);

    res.json({
      message: `${request.requestType} permission denied for ${request.studentId.name}.`,
      request
    });
  } catch (error) {
    console.error('Deny request error:', error);
    res.status(500).json({ message: 'Server error denying request.' });
  }
};

// PATCH /api/permissions/requests/:requestId/revoke — Teacher revokes active permission
const revokePermission = async (req, res) => {
  try {
    const { requestId } = req.params;
    const teacherId = req.user._id;

    const request = await PermissionRequest.findById(requestId)
      .populate('classId', 'teacherId title')
      .populate('studentId', 'name studentId');

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Verify teacher owns the class
    if (request.classId.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: `Cannot revoke permission with status: ${request.status}` });
    }

    request.status = 'revoked';
    await request.save();

    await logActivity(
      teacherId,
      'revoke_permission',
      request.classId._id,
      `Revoked ${request.requestType} for ${request.studentId.name}`
    );

    // Invalidate caches
    await invalidatePermissionCaches(request.classId._id, request.studentId._id, request.requestType);

    res.json({
      message: `${request.requestType} permission revoked for ${request.studentId.name}.`,
      request
    });
  } catch (error) {
    console.error('Revoke request error:', error);
    res.status(500).json({ message: 'Server error revoking request.' });
  }
};

// GET /api/permissions/my-requests/:classId — Student checks own requests (OPTIMIZED)
const getMyRequests = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id;

    const requests = await PermissionRequest.find({ studentId, classId })
      .select('_id requestType status visibility approvedAt deniedAt denialReason requestedAt scheduledStartTime scheduledEndTime')
      .lean();

    const active = requests.filter(r => isPermissionActive(r));

    res.json({
      classId,
      requests,
      active: active.length,
      summary: {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        denied: requests.filter(r => r.status === 'denied').length
      }
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error fetching requests.' });
  }
};

// GET /api/permissions/status/:classId/:type — Check current permission status (CACHED)
const checkPermissionStatus = async (req, res) => {
  try {
    const { classId, type } = req.params;
    const studentId = req.user._id;

    const validTypes = ['microphone', 'camera', 'screen'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    // Try cache
    const cacheKey = cache.keys.permission(classId, studentId, type);
    let cached = await cache.get(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const permission = await PermissionRequest.findOne({
      classId,
      studentId,
      requestType: type
    })
      .select('_id status visibility approvedAt scheduledStartTime scheduledEndTime expiresAt')
      .lean();

    const isActive = permission ? isPermissionActive(permission) : false;

    const response = {
      classId,
      studentId,
      type,
      hasPermission: isActive,
      status: permission?.status,
      visibility: permission?.visibility,
      approvedAt: permission?.approvedAt,
      expiresAt: permission?.expiresAt,
      scheduledStartTime: permission?.scheduledStartTime,
      scheduledEndTime: permission?.scheduledEndTime
    };

    // Cache for 30 seconds
    await cache.set(cacheKey, response, 30);

    res.json(response);
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ message: 'Server error checking status.' });
  }
};

// NEW: PATCH /api/classes/:classId/permission-settings — Teacher updates class permission settings
const updatePermissionSettings = async (req, res) => {
  try {
    const { classId } = req.params;
    const { allowMicrophone, allowCamera, allowScreenShare } = req.body;
    const teacherId = req.user._id;

    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Verify teacher owns class
    if (classItem.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Update settings
    if (allowMicrophone !== undefined) classItem.permissionSettings.allowMicrophone = allowMicrophone;
    if (allowCamera !== undefined) classItem.permissionSettings.allowCamera = allowCamera;
    if (allowScreenShare !== undefined) classItem.permissionSettings.allowScreenShare = allowScreenShare;

    await classItem.save();

    await logActivity(
      teacherId,
      'update_class_settings',
      classId,
      `Updated permission settings for class`
    );

    // Invalidate cache
    await cache.del(cache.keys.classSettings(classId));

    res.json({
      message: 'Permission settings updated.',
      settings: classItem.permissionSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating settings.' });
  }
};

// NEW: PATCH /api/classes/:classId/speaker-limit — Set max concurrent speakers
const setSpeakerLimit = async (req, res) => {
  try {
    const { classId } = req.params;
    const { maxConcurrentSpeakers } = req.body;
    const teacherId = req.user._id;

    if (!maxConcurrentSpeakers || maxConcurrentSpeakers < 1 || maxConcurrentSpeakers > 100) {
      return res.status(400).json({ message: 'Max speakers must be between 1 and 100.' });
    }

    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Verify teacher owns class
    if (classItem.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    classItem.maxConcurrentSpeakers = maxConcurrentSpeakers;
    await classItem.save();

    await logActivity(
      teacherId,
      'update_speaker_limit',
      classId,
      `Set max concurrent speakers to ${maxConcurrentSpeakers}`
    );

    res.json({
      message: 'Speaker limit updated.',
      maxConcurrentSpeakers: classItem.maxConcurrentSpeakers
    });
  } catch (error) {
    console.error('Set speaker limit error:', error);
    res.status(500).json({ message: 'Server error updating limit.' });
  }
};

// NEW: GET /api/permissions/analytics/:classId — Permission analytics for teacher
const getAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user._id;

    const classItem = await Class.findById(classId)
      .select('teacherId title')
      .lean();
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    if (classItem.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Get all permissions
    const allRequests = await PermissionRequest.find({ classId })
      .select('status responseTime requestType createdAt')
      .lean();

    // Calculate analytics
    const approved = allRequests.filter(r => r.status === 'approved').length;
    const denied = allRequests.filter(r => r.status === 'denied').length;
    const pending = allRequests.filter(r => r.status === 'pending').length;

    const avgResponseTime = allRequests
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / (approved + denied || 1);

    const byType = {
      microphone: allRequests.filter(r => r.requestType === 'microphone').length,
      camera: allRequests.filter(r => r.requestType === 'camera').length,
      screen: allRequests.filter(r => r.requestType === 'screen').length
    };

    res.json({
      classId,
      classTitle: classItem.title,
      summary: {
        total: allRequests.length,
        approved,
        denied,
        pending,
        approvalRate: `${Math.round((approved / (approved + denied || 1)) * 100)}%`
      },
      byType,
      avgResponseTime: Math.round(avgResponseTime),
      active: await getActivePermissions(classId)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

module.exports = {
  requestPermission,
  getPendingRequests,
  approveRequest,
  denyRequest,
  revokePermission,
  getMyRequests,
  checkPermissionStatus,
  updatePermissionSettings,
  setSpeakerLimit,
  getAnalytics
};
