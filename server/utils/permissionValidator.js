/**
 * Permission validation utilities
 * Centralized logic for permission checks, speaker limits, scheduling
 */

const PermissionRequest = require('../models/PermissionRequest');
const Class = require('../models/Class');
const cache = require('./cache');

/**
 * Check if permission is currently valid considering scheduling
 * @param {object} permission - PermissionRequest document
 * @returns {boolean} True if permission is currently active
 */
const isPermissionActive = (permission) => {
  if (!permission || permission.status !== 'approved') {
    return false;
  }

  const now = new Date();

  // Check if permission has expired
  if (permission.expiresAt && now > permission.expiresAt) {
    return false;
  }

  // Check if scheduled start time hasn't arrived yet
  if (permission.scheduledStartTime && now < permission.scheduledStartTime) {
    return false;
  }

  // Check if scheduled end time has passed
  if (permission.scheduledEndTime && now > permission.scheduledEndTime) {
    return false;
  }

  return true;
};

/**
 * Get count of currently active speakers in a class
 * @param {string} classId - Class ID
 * @param {string} type - Permission type (microphone, camera, screen)
 * @returns {Promise<number>} Count of active speakers
 */
const getActiveSpeakersCount = async (classId, type = 'microphone') => {
  try {
    // Try cache first
    const cacheKey = cache.keys.speakersCount(classId, type);
    const cached = await cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Query database
    const activePermissions = await PermissionRequest.countDocuments({
      classId,
      requestType: type,
      status: 'approved',
      expiresAt: { $gt: new Date() }
    });

    // Cache for 30 seconds (frequent updates expected)
    await cache.set(cacheKey, activePermissions, 30);
    return activePermissions;
  } catch (err) {
    console.error('Error counting active speakers:', err);
    return 0;
  }
};

/**
 * Check if student can be approved given speaker limit
 * @param {string} classId - Class ID
 * @param {string} type - Permission type
 * @returns {Promise<boolean>} True if speaker limit not reached
 */
const canApproveSpeaker = async (classId, type = 'microphone') => {
  try {
    const classItem = await Class.findById(classId)
      .select('maxConcurrentSpeakers')
      .lean();

    if (!classItem || !classItem.maxConcurrentSpeakers) {
      return true; // No limit
    }

    const activeCount = await getActiveSpeakersCount(classId, type);
    return activeCount < classItem.maxConcurrentSpeakers;
  } catch (err) {
    console.error('Error checking speaker limit:', err);
    return true; // Default to allowing if error
  }
};

/**
 * Get active permissions for a class
 * @param {string} classId - Class ID
 * @param {string} type - Permission type (optional)
 * @returns {Promise<array>} Array of active permission objects
 */
const getActivePermissions = async (classId, type = null) => {
  try {
    // Check cache
    if (type) {
      const cacheKey = cache.keys.activePermissions(classId, type);
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Query database
    const query = {
      classId,
      status: 'approved',
      expiresAt: { $gt: new Date() }
    };

    if (type) {
      query.requestType = type;
    }

    const permissions = await PermissionRequest.find(query)
      .select('studentId requestType visibility approvedAt approvalNotes')
      .lean();

    // Cache if querying by type
    if (type) {
      const cacheKey = cache.keys.activePermissions(classId, type);
      await cache.set(cacheKey, permissions, 60);
    }

    return permissions;
  } catch (err) {
    console.error('Error fetching active permissions:', err);
    return [];
  }
};

/**
 * Check if class allows a permission type
 * @param {string} classId - Class ID
 * @param {string} type - Permission type (microphone, camera, screen)
 * @returns {Promise<boolean>} True if permission type is allowed
 */
const isPermissionTypeAllowed = async (classId, type) => {
  try {
    // Check cache
    const cacheKey = cache.keys.classSettings(classId);
    let classSettings = await cache.get(cacheKey);

    if (!classSettings) {
      // Fetch from DB
      const classItem = await Class.findById(classId)
        .select('permissionSettings')
        .lean();

      classSettings = classItem?.permissionSettings || {};
      await cache.set(cacheKey, classSettings, 300); // 5 min cache
    }

    // Map requestType to setting
    const settingMap = {
      microphone: classSettings.allowMicrophone !== false,
      camera: classSettings.allowCamera !== false,
      screen: classSettings.allowScreenShare !== false
    };

    return settingMap[type] ?? true;
  } catch (err) {
    console.error('Error checking permission type allowance:', err);
    return true; // Default to allowing if error
  }
};

/**
 * Invalidate caches when permission changes
 * @param {string} classId - Class ID
 * @param {string} studentId - Student ID (optional)
 * @param {string} type - Permission type (optional)
 */
const invalidatePermissionCaches = async (classId, studentId = null, type = null) => {
  const keysToDelete = [];

  if (studentId && type) {
    // Individual permission cache
    keysToDelete.push(cache.keys.permission(classId, studentId, type));
  }

  // Always invalidate class-wide caches
  keysToDelete.push(cache.keys.speakersCount(classId, 'microphone'));
  keysToDelete.push(cache.keys.speakersCount(classId, 'camera'));
  keysToDelete.push(cache.keys.speakersCount(classId, 'screen'));
  keysToDelete.push(cache.keys.activePermissions(classId, 'microphone'));
  keysToDelete.push(cache.keys.activePermissions(classId, 'camera'));
  keysToDelete.push(cache.keys.activePermissions(classId, 'screen'));

  await cache.delMany(keysToDelete);
};

/**
 * Calculate response time in seconds
 * @param {Date} requestedAt - When request was made
 * @returns {number} Response time in seconds
 */
const calculateResponseTime = (requestedAt) => {
  return Math.round((Date.now() - requestedAt.getTime()) / 1000);
};

module.exports = {
  isPermissionActive,
  getActiveSpeakersCount,
  canApproveSpeaker,
  getActivePermissions,
  isPermissionTypeAllowed,
  invalidatePermissionCaches,
  calculateResponseTime
};
