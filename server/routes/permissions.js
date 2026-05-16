const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/permissionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { permissionRequestLimiter } = require('../middleware/rateLimiter');
const validations = require('../middleware/validation');

router.use(auth);

// ============ STUDENT ENDPOINTS ============

// Student requests permission (with rate limiting)
router.post('/request', authorize('student'), permissionRequestLimiter, validations.requestPermission, requestPermission);

// Student views own requests for a class
router.get('/my-requests/:classId', authorize('student'), validations.mongoId, getMyRequests);

// Check if student has specific permission (CACHED)
router.get('/status/:classId/:requestType', authorize('student'), checkPermissionStatus);

// ============ TEACHER ENDPOINTS ============

// Teacher gets all pending/approved requests for a class (PAGINATED)
router.get('/requests/:classId', authorize('admin', 'teacher'), validations.mongoId, validations.pagination, getPendingRequests);

// Teacher approves a request (WITH SPEAKER LIMIT CHECK)
router.patch('/requests/:requestId/approve', authorize('admin', 'teacher'), validations.approvePermission, approveRequest);

// Teacher denies a request
router.patch('/requests/:requestId/deny', authorize('admin', 'teacher'), validations.denyPermission, denyRequest);

// Teacher revokes an approved permission
router.patch('/requests/:requestId/revoke', authorize('admin', 'teacher'), validations.mongoId, revokePermission);

// ============ NEW ENDPOINTS: CLASS SETTINGS ============

// Teacher updates class permission settings (enable/disable mic, camera, screen)
router.patch('/classes/:classId/permission-settings', authorize('admin', 'teacher'), validations.mongoId, updatePermissionSettings);

// Teacher sets max concurrent speakers for class
router.patch('/classes/:classId/speaker-limit', authorize('admin', 'teacher'), validations.mongoId, setSpeakerLimit);

// ============ NEW ENDPOINTS: ANALYTICS ============

// Teacher views permission analytics for class
router.get('/analytics/:classId', authorize('admin', 'teacher'), validations.mongoId, getAnalytics);

module.exports = router;
