# 🔄 Migration Guide - Teacher Feature

## Overview
This guide helps you migrate existing data and update your deployment with the new teacher management feature.

---

## 📋 Pre-Migration Checklist

- [ ] Backup your MongoDB database
- [ ] Review current admin users
- [ ] List all existing classes
- [ ] Note any custom modifications
- [ ] Test in development first

---

## 🗄️ Database Migration

### No Breaking Changes!
✅ All existing data remains compatible  
✅ Existing admin accounts work as before  
✅ Existing classes remain unchanged  
✅ Students unaffected  

### New Fields (Auto-Added)
The following fields are added automatically with default values:

**User Model:**
```javascript
{
  canTeach: false,              // Default for existing admins
  teacherProfile: {},           // Empty for non-teachers
  email: null                   // Optional field
}
```

**Class Model:**
```javascript
{
  isLive: false,                // Default for existing classes
  liveStartedAt: null,
  liveEndedAt: null,
  hasConflict: false,
  conflictingClasses: []
}
```

---

## 🚀 Deployment Steps

### 1. Update Code
```bash
# Pull latest changes
git pull origin main

# Install dependencies (if any new ones)
npm install --prefix server
```

### 2. Environment Variables
No new environment variables required! All existing vars work.

### 3. Deploy to Railway
```bash
# Railway auto-deploys from GitHub
# Or manually:
railway up
```

### 4. Verify Deployment
```bash
# Check health
curl https://your-domain.com/api/health

# Should return:
{
  "status": "ok",
  "database": "connected"
}
```

---

## 👥 Existing Admin Accounts

### Option 1: Keep as Super Admin
Existing admin accounts (`studentId: 'admin'`) automatically have:
- ✅ Full admin rights
- ✅ Can manage all teachers
- ✅ Can manage all classes
- ❌ Cannot teach by default

To enable teaching:
```bash
PATCH /api/teachers/admin/toggle-teaching
Authorization: Bearer <admin_token>
```

### Option 2: Convert to Teacher
If you want an existing admin to be a teacher:

1. **Create new super admin** (recommended)
2. **Change existing admin role** (not recommended)

---

## 🏫 Existing Classes

### Automatic Updates
All existing classes:
- ✅ Remain assigned to current teacher
- ✅ Keep all enrollments
- ✅ Maintain schedule
- ✅ Work with new features

### Manual Updates (Optional)
To check for schedule conflicts in existing classes:

```javascript
// Run this script once after deployment
const checkExistingConflicts = async () => {
  const classes = await Class.find({ status: 'scheduled' });
  
  for (const classItem of classes) {
    const conflicts = await checkScheduleConflict(
      classItem.schedule,
      classItem.duration,
      classItem._id
    );
    
    if (conflicts.hasConflict) {
      classItem.hasConflict = true;
      classItem.conflictingClasses = conflicts.conflictingClasses.map(c => c._id);
      await classItem.save();
      
      console.log(`Conflict found: ${classItem.title}`);
    }
  }
};
```

---

## 🔐 Permission Updates

### Before (Old System)
```
Admin: Full access
Student: Limited access
```

### After (New System)
```
Admin: Full access (unchanged)
Teacher: Limited access (new)
Student: Limited access (unchanged)
```

### Migration Impact
- ✅ Existing admin permissions unchanged
- ✅ Existing student permissions unchanged
- ✅ New teacher role added
- ✅ Backward compatible

---

## 📊 Data Integrity Checks

### 1. Verify Users
```bash
# Check all users have valid roles
db.users.find({ role: { $nin: ['admin', 'teacher', 'student'] } })

# Should return empty
```

### 2. Verify Classes
```bash
# Check all classes have valid teachers
db.classes.find({ teacherId: { $exists: false } })

# Should return empty
```

### 3. Verify Enrollments
```bash
# Check all enrollments are valid
db.enrollments.find({
  $or: [
    { studentId: { $exists: false } },
    { classId: { $exists: false } }
  ]
})

# Should return empty
```

---

## 🧪 Testing After Migration

### 1. Test Existing Functionality
```bash
# Login as existing admin
POST /api/auth/login
{
  "studentId": "admin",
  "password": "admin123"
}

# Should work as before
```

### 2. Test New Teacher Creation
```bash
# Create a teacher
POST /api/teachers
{
  "name": "Test Teacher",
  "email": "test@example.com"
}

# Should return credentials
```

### 3. Test Class Creation
```bash
# Teacher creates class
POST /api/classes
{
  "title": "Test Class",
  "schedule": "2026-05-10T10:00:00.000Z",
  "duration": 60
}

# Should work
```

### 4. Test Schedule Conflicts
```bash
# Create two classes at same time
# Should receive conflict warnings
```

### 5. Test Go Live
```bash
# Start a class
POST /api/classes/:id/go-live

# Should update status to 'live'
```

---

## 🔄 Rollback Plan

If issues occur, you can rollback:

### Option 1: Git Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Railway auto-deploys previous version
```

### Option 2: Railway Rollback
```bash
# In Railway dashboard
railway rollback
```

### Option 3: Manual Rollback
```bash
# Checkout previous version
git checkout <previous-commit>
git push -f origin main
```

### Data Cleanup (if needed)
```javascript
// Remove new fields (only if necessary)
db.users.updateMany({}, {
  $unset: {
    canTeach: "",
    teacherProfile: "",
    email: ""
  }
});

db.classes.updateMany({}, {
  $unset: {
    isLive: "",
    liveStartedAt: "",
    liveEndedAt: "",
    hasConflict: "",
    conflictingClasses: ""
  }
});
```

---

## 📝 Post-Migration Tasks

### 1. Create Teacher Accounts
```bash
# For each teacher, create account
POST /api/teachers
{
  "name": "Teacher Name",
  "email": "teacher@example.com",
  "specialization": "Subject"
}

# Save credentials securely
```

### 2. Reassign Classes (if needed)
```bash
# If classes need to be reassigned to new teachers
PATCH /api/classes/:id
{
  "teacherId": "new-teacher-id"
}
```

### 3. Enable Admin Teaching (if needed)
```bash
# If admin should also teach
PATCH /api/teachers/admin/toggle-teaching
```

### 4. Check Schedule Conflicts
```bash
# Review any conflicts
GET /api/classes?status=scheduled

# Check hasConflict field
```

### 5. Update Frontend
- Deploy new frontend with teacher UI
- Update navigation menus
- Add teacher management pages
- Add go live buttons

---

## 🐛 Common Issues

### Issue: "Role 'teacher' not recognized"
**Solution:** Restart server to load updated User model

### Issue: "Cannot create teacher"
**Solution:** Ensure you're logged in as admin

### Issue: "Schedule conflict not detected"
**Solution:** Check that both classes have valid schedule dates

### Issue: "Cannot go live"
**Solution:** Ensure class status is 'scheduled'

### Issue: "Teacher can see all classes"
**Solution:** Check role authorization in routes

---

## 📞 Support

### Check Logs
```bash
# Server logs
tail -f server/logs/combined.log

# Error logs
tail -f server/logs/error.log

# Railway logs
railway logs
```

### Verify Database
```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Check collections
show collections
db.users.countDocuments({ role: 'teacher' })
db.classes.countDocuments({ isLive: true })
```

### Test Endpoints
```bash
# Health check
curl https://your-domain.com/api/health

# List teachers
curl https://your-domain.com/api/teachers \
  -H "Authorization: Bearer <admin_token>"
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Test in development
- [ ] Review documentation
- [ ] Notify users of maintenance

### During Migration
- [ ] Pull latest code
- [ ] Deploy to production
- [ ] Verify health check
- [ ] Test existing functionality
- [ ] Test new features

### Post-Migration
- [ ] Create teacher accounts
- [ ] Check schedule conflicts
- [ ] Update frontend
- [ ] Monitor logs
- [ ] Gather user feedback

---

## 📊 Migration Timeline

**Estimated Time: 30 minutes**

1. **Backup** (5 min)
2. **Deploy** (10 min)
3. **Verify** (5 min)
4. **Test** (10 min)

**Zero Downtime:** Railway handles deployment without downtime

---

## 🎯 Success Criteria

✅ All existing users can login  
✅ All existing classes accessible  
✅ Admin can create teachers  
✅ Teachers can create classes  
✅ Schedule conflicts detected  
✅ Go live feature works  
✅ No errors in logs  
✅ Health check passes  

---

**Status**: Ready for Migration  
**Risk Level**: Low (Backward Compatible)  
**Downtime**: None (Railway handles it)  
**Rollback**: Easy (Git revert)
