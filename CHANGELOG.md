# Changelog

All notable changes to the EngTeach project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-05-03

### 🔒 Security
- **Added** XSS protection with HTML sanitization in chat messages
- **Added** Rate limiting for permission requests (10 requests per 5 minutes)
- **Added** Input validation for socket messages (type, length, format)
- **Added** Enhanced socket authorization checks
- **Added** Message length limits (1000 characters)

### 🐛 Bug Fixes
- **Fixed** Redis connection errors causing application crashes
- **Fixed** Invalid `.lean()` call on `countDocuments()` query
- **Fixed** Race condition in permission requests with unique compound index
- **Fixed** Memory leak in cache with automatic cleanup every 5 minutes
- **Fixed** Missing validation for class schedule updates
- **Fixed** Incorrect MongoDB connection check in activity log controller
- **Fixed** Socket.IO error handling with comprehensive try-catch blocks
- **Fixed** Duplicate key error handling for concurrent permission requests

### ⚡ Performance
- **Improved** Cache cleanup with automatic expiry removal
- **Improved** Database queries with proper indexing
- **Improved** Error recovery with graceful fallbacks
- **Optimized** Permission request queries with grouped responses

### 📚 Documentation
- **Added** BUG_REPORT.md with detailed bug analysis
- **Added** FIXES_APPLIED.md with implementation details
- **Added** TEST_RESULTS.md with test verification
- **Added** SUMMARY.md with complete overview
- **Added** QUICK_REFERENCE.md for quick access
- **Added** DEPLOYMENT_GUIDE.md with deployment instructions
- **Added** CHANGELOG.md (this file)
- **Updated** .env.example with better documentation

### 🧪 Testing
- **Added** Automated test script (test-fixes.js)
- **Added** Module verification tests
- **Added** Integration test recommendations

### 🔧 Technical
- **Added** Unique compound index on PermissionRequest model
- **Added** Permission request rate limiter middleware
- **Added** Grouped response format for permission requests
- **Added** Message sanitization function in chat component
- **Added** Periodic cache cleanup interval
- **Improved** Error messages across all controllers
- **Improved** Socket event error handling

---

## [1.0.0] - 2026-04-15

### 🎉 Initial Release

#### Features
- **User Management**: Create and manage students, teachers, and admins
- **Class Management**: Create classes and enroll students
- **Live Video Classes**: Integrated Jitsi Meet for real-time video conferencing
- **Permission System**: Request/grant microphone and camera permissions
- **Activity Logging**: Comprehensive audit logs for all system activities
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Chat**: Socket.IO-based classroom chat
- **Authentication**: JWT-based authentication with refresh tokens

#### Security
- JWT authentication with access and refresh tokens
- Password hashing with bcryptjs
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Account lockout after failed login attempts

#### Technical Stack
- **Frontend**: React 19, Vite, React Router, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Video**: Jitsi Meet integration
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcryptjs

---

## [Unreleased]

### Planned Features
- [ ] Message persistence to database
- [ ] WebSocket authentication with JWT
- [ ] Message read receipts
- [ ] Typing indicators
- [ ] File upload support with virus scanning
- [ ] End-to-end encryption for messages
- [ ] Comprehensive automated testing suite
- [ ] Performance monitoring (APM)
- [ ] Mobile applications (iOS/Android)
- [ ] Multi-language support

### Planned Improvements
- [ ] Implement comprehensive unit tests
- [ ] Add integration tests
- [ ] Add end-to-end tests
- [ ] Implement CI/CD pipeline
- [ ] Add performance benchmarks
- [ ] Implement automated security scanning
- [ ] Add database migration system
- [ ] Implement feature flags

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.1 | 2026-05-03 | Bug fixes and security improvements |
| 1.0.0 | 2026-04-15 | Initial release |

---

## Migration Guide

### Upgrading from 1.0.0 to 1.0.1

#### Database Changes
The unique compound index on `PermissionRequest` will be created automatically on first use. No manual migration required.

#### Environment Variables
No new required environment variables. Optional additions:
```env
# Optional: Redis for better caching
REDIS_URL=redis://localhost:6379
```

#### Breaking Changes
None. All changes are backward compatible.

#### Recommended Actions
1. Update dependencies: `npm install --prefix server && npm install --prefix client`
2. Run tests: `node server/test-fixes.js`
3. Review new documentation files
4. Update .env file from .env.example if needed
5. Monitor logs after deployment for any issues

---

## Support

For issues, questions, or contributions:
- Review documentation in project root
- Check TROUBLESHOOTING section in DEPLOYMENT_GUIDE.md
- Review QUICK_REFERENCE.md for common tasks

---

## Contributors

- AI Assistant - Bug fixes, testing, documentation (2026-05-03)

---

## License

Proprietary - All rights reserved

---

**Changelog Maintained By**: Development Team
**Last Updated**: May 3, 2026
