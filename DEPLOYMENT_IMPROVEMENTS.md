# 🚀 Deployment Guide - With Improvements

## Pre-Deployment Checklist

### ✅ Environment Variables
Ensure all required environment variables are set in your deployment platform:

```bash
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Recommended
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
CLIENT_URL=https://your-frontend-domain.com

# Optional
MAX_FAILED_LOGINS=5
LOCK_DURATION_MS=600000
```

### ✅ Dependencies
All dependencies are installed automatically:
```bash
npm install --prefix server
npm install --prefix client
```

### ✅ Build Client
```bash
npm run build --prefix client
```

---

## Railway Deployment

### Environment Variables
Set in Railway dashboard:
1. Go to your project → Variables
2. Add all required variables from above
3. Railway will auto-restart on variable changes

### Deployment
```bash
# Railway auto-deploys from GitHub
# Or manually:
railway up
```

### Health Check
Railway will use: `GET /api/health`

### Logs
View in Railway dashboard or:
```bash
railway logs
```

---

## Vercel Deployment (Frontend Only)

### Configuration
Create `vercel.json` in root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy
```bash
cd client
vercel --prod
```

### Environment Variables
Set in Vercel dashboard:
- `VITE_API_URL` - Your backend URL

---

## Docker Deployment

### Build Image
```bash
docker build -t engteach:latest .
```

### Run Container
```bash
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e NODE_ENV="production" \
  -e LOG_LEVEL="info" \
  --name engteach \
  engteach:latest
```

### View Logs
```bash
docker logs -f engteach
```

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-07T...",
  "uptime": 123.45,
  "environment": "production",
  "database": "connected"
}
```

### 2. Test Login
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"admin","password":"admin123"}'
```

### 3. Check Logs
- Railway: Dashboard → Logs
- Docker: `docker logs engteach`
- Server: `server/logs/combined.log`

### 4. Monitor Errors
- Check `server/logs/error.log`
- Set up alerts for error rates

---

## Monitoring Setup

### Recommended Services

#### Error Tracking
**Sentry** (Recommended)
```bash
npm install @sentry/node @sentry/react
```

Add to `server/server.js`:
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

#### Uptime Monitoring
- **UptimeRobot** - Free, monitors `/api/health`
- **Pingdom** - Advanced monitoring
- **Better Uptime** - Status pages

#### Log Management
- **Loggly** - Centralized logging
- **Papertrail** - Real-time logs
- **Datadog** - Full observability

---

## Performance Optimization

### 1. Enable Compression ✅
Already enabled in improvements!

### 2. Database Indexes
Ensure indexes exist:
```javascript
// Already created in models
User: studentId (unique)
Class: teacherId, schedule, status
Enrollment: studentId + classId (compound unique)
PermissionRequest: classId + studentId + requestType
ActivityLog: userId + timestamp
```

### 3. Connection Pooling ✅
Already configured:
```javascript
maxPoolSize: 10,
minPoolSize: 2
```

### 4. Rate Limiting ✅
Already enabled:
- API: 100 req/15min
- Login: 5 attempts/15min
- Socket: 10-30 msg/min

---

## Security Hardening

### 1. Environment Variables ✅
- Never commit `.env` files
- Use strong secrets (32+ chars)
- Rotate secrets regularly

### 2. HTTPS
Ensure HTTPS is enabled:
- Railway: Automatic
- Custom domain: Use Let's Encrypt

### 3. CORS ✅
Already configured with whitelist

### 4. Rate Limiting ✅
Already enabled on all routes

### 5. Input Validation ✅
Already enabled with express-validator

### 6. Helmet Security Headers ✅
Already enabled with CSP

---

## Scaling Considerations

### Horizontal Scaling
If deploying multiple instances:

1. **Session Management**
   - Use Redis for session storage
   - Share JWT secrets across instances

2. **Socket.io**
   - Use Redis adapter for Socket.io
   ```bash
   npm install @socket.io/redis-adapter redis
   ```

3. **File Uploads**
   - Use cloud storage (S3, Cloudinary)
   - Don't store on local filesystem

### Vertical Scaling
Recommended specs:
- **Small**: 512MB RAM, 1 CPU (< 100 users)
- **Medium**: 1GB RAM, 2 CPU (< 500 users)
- **Large**: 2GB RAM, 4 CPU (< 2000 users)

---

## Backup Strategy

### Database Backups
**MongoDB Atlas** (Recommended):
- Automatic daily backups
- Point-in-time recovery
- Download backups manually

**Manual Backup**:
```bash
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)
```

### Log Backups
Logs are rotated automatically (5 files, 5MB each).
Archive old logs:
```bash
tar -czf logs-$(date +%Y%m%d).tar.gz server/logs/*.log
```

---

## Rollback Procedure

### Railway
```bash
# Revert to previous deployment
railway rollback
```

### Docker
```bash
# Stop current container
docker stop engteach

# Start previous version
docker run -d --name engteach engteach:previous
```

### Manual
```bash
# Revert git commit
git revert HEAD
git push

# Or checkout previous version
git checkout <previous-commit>
```

---

## Troubleshooting

### Issue: Health Check Fails
**Check:**
1. MongoDB connection string
2. Database IP whitelist
3. Network connectivity
4. Logs: `server/logs/error.log`

### Issue: High Error Rate
**Check:**
1. Error logs: `server/logs/error.log`
2. Database connection status
3. Memory/CPU usage
4. Rate limit violations

### Issue: Slow Response Times
**Check:**
1. Database query performance
2. Network latency
3. Memory usage
4. Enable compression ✅ (already done)

### Issue: Socket.io Not Working
**Check:**
1. CORS configuration
2. WebSocket support on platform
3. Firewall rules
4. Client connection URL

---

## Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check disk space
- [ ] Monitor response times
- [ ] Review rate limit violations

### Monthly
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Rotate JWT secrets
- [ ] Archive old logs
- [ ] Database backup verification

### Quarterly
- [ ] Performance audit
- [ ] Security audit
- [ ] Dependency audit
- [ ] Load testing

---

## Support Contacts

### Platform Issues
- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **MongoDB Atlas**: https://support.mongodb.com

### Application Issues
1. Check logs first
2. Review `IMPROVEMENTS.md`
3. Check `.env.example`
4. Verify health check

---

**Last Updated**: 2026-05-07  
**Version**: 1.1.0  
**Status**: ✅ Production Ready
