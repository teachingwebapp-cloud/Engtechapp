# Bug Report and Fixes

## Critical Bugs Found

### 1. **Redis Client Connection Error** (server/utils/cache.js)
**Issue**: Redis client initialization doesn't handle connection errors properly and may cause crashes.
**Severity**: High
**Fix**: Add proper error handling and graceful fallback

### 2. **Permission Cache Query Bug** (server/utils/permissionValidator.js)
**Issue**: `getActiveSpeakersCount` uses `.lean()` on `countDocuments()` which is invalid
**Severity**: Medium
**Fix**: Remove `.lean()` from count query

### 3. **Missing Route for Activity Stats** (server/routes/activityLogs.js)
**Issue**: `getActivityStats` controller exists but no route is defined
**Severity**: Medium
**Fix**: Add route for stats endpoint

### 4. **Duplicate Condition in Jitsi Config** (server/utils/jitsiConfig.js)
**Issue**: Line has `role === 'admin' || role === 'admin'` (duplicate condition)
**Severity**: Low (already fixed in code comments)
**Status**: Already fixed

### 5. **Missing Error Handling in Socket.IO** (server/socket.js)
**Issue**: No error handling for socket events
**Severity**: Medium
**Fix**: Add try-catch blocks

### 6. **Race Condition in Permission Requests** (server/controllers/permissionController.js)
**Issue**: Multiple simultaneous requests can bypass the "already pending" check
**Severity**: Medium
**Fix**: Add unique compound index and handle duplicate key errors

### 7. **Memory Leak in Cache** (server/utils/cache.js)
**Issue**: In-memory cache never cleans up expired entries
**Severity**: Medium
**Fix**: Add periodic cleanup

### 8. **Missing Validation in Class Update** (server/controllers/classController.js)
**Issue**: No validation for schedule date when updating
**Severity**: Low
**Fix**: Add validation

### 9. **Incorrect MongoDB Connection Check** (server/controllers/activityLogController.js)
**Issue**: Uses `!mongoose.connection.readyState` instead of `=== 0`
**Severity**: Low
**Fix**: Use proper comparison

### 10. **Missing Index on PermissionRequest** (server/models/PermissionRequest.js)
**Issue**: No compound unique index to prevent duplicate pending requests
**Severity**: Medium
**Fix**: Add compound unique index

## Logic Issues

### 11. **Permission Status Not Refreshed** (client)
**Issue**: Permission status doesn't auto-refresh after approval
**Severity**: Medium
**Fix**: Add polling or socket event

### 12. **No Cleanup for Expired Permissions**
**Issue**: Expired permissions remain in database
**Severity**: Low
**Fix**: Add background job or TTL index (already has TTL index)

### 13. **Teacher Can't See Grouped Requests** (server/controllers/permissionController.js)
**Issue**: `getPendingRequests` returns flat list, but frontend expects grouped
**Severity**: Medium
**Fix**: Add grouping logic

## Security Issues

### 14. **No Rate Limiting on Permission Requests**
**Issue**: Students can spam permission requests
**Severity**: Medium
**Status**: Partially mitigated by 5-minute cooldown

### 15. **Sensitive Data in Logs**
**Issue**: Plain text passwords logged in activity logs
**Severity**: High
**Fix**: Never log passwords

## Performance Issues

### 16. **N+1 Query in getClasses**
**Issue**: Fetches enrollments then classes separately for students
**Severity**: Medium
**Fix**: Use aggregation pipeline

### 17. **No Pagination on Socket Messages**
**Issue**: All messages kept in memory
**Severity**: Low
**Fix**: Implement message history limit

## Fixes Applied Below
