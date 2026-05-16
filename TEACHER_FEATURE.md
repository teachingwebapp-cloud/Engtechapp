# 👨‍🏫 Teacher Management Feature

## Overview
This feature adds a complete teacher management system with role-based permissions, schedule conflict detection, and live class management.

---

## 🎯 Features Implemented

### 1. **Teacher Role System**
- ✅ New `teacher` role separate from `admin`
- ✅ Admin can create teacher accounts
- ✅ Admin can also act as a teacher (dual role with `canTeach` flag)
- ✅ Teachers have limited permissions (manage only their own classes)
- ✅ Super admin (`studentId: 'admin'`) has all rights

### 2. **Teacher Account Management**
- ✅ Admin creates teacher accounts with auto-generated credentials
- ✅ Teacher profile fields: specialization, bio, experience, email
- ✅ List all teachers with statistics
- ✅ Update teacher information
- ✅ Activate/deactivate teacher accounts
- ✅ Delete teachers (with safety checks)

### 3. **Schedule Conflict Detection**
- ✅ Automatic detection when 2+ teachers schedule at same time
- ✅ Real-time notifications to affected teachers
- ✅ Admin receives conflict alerts
- ✅ Conflict tracking in database
- ✅ Visual indicators for conflicting classes

### 4. **Live Class Management**
- ✅ Teachers can "Go Live" to start classes
- ✅ Teachers can "End Live" to complete classes
- ✅ Only one live class per teacher at a time
- ✅ Real-time notifications when class goes live
- ✅ Track live duration and timestamps
- ✅ List all currently live classes

### 5. **Permission System**
- ✅ Teachers can: Schedule, manage, delete their own classes
- ✅ Teachers can: Enroll students in their classes
- ✅ Teachers can: Go live and conduct classes
- ✅ Teachers cannot: Manage other teachers' classes
- ✅ Admin can: Track all teacher activities
- ✅ Admin can: Manage all classes and teachers

---

## 📡 API Endpoints

### Teacher Management

#### Create Teacher (Admin Only)
```http
POST /api/teachers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "specialization": "English Grammar",
  "bio": "10 years of teaching experience"
}
```

**Response:**
```json
{
  "message": "Teacher account created successfully",
  "teacher": {
    "id": "...",
    "teacherId": "TCH-001",
    "name": "John Doe",
    "password": "auto-generated-password",
    "email": "john@example.com",
    "specialization": "English Grammar"
  }
}
```

#### Get All Teachers
```http
GET /api/teachers?page=1&limit=50&search=john&isActive=true
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "teachers": [
    {
      "id": "...",
      "teacherId": "TCH-001",
      "name": "John Doe",
      "email": "john@example.com",
      "isActive": true,
      "stats": {
        "totalClasses": 15,
        "activeClasses": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "pages": 1
  }
}
```

#### Get Teacher Details
```http
GET /api/teachers/:id
Authorization: Bearer <admin_token>
```

#### Update Teacher
```http
PATCH /api/teachers/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "specialization": "Advanced Grammar",
  "isActive": true
}
```

#### Toggle Teacher Status
```http
PATCH /api/teachers/:id/toggle-status
Authorization: Bearer <admin_token>
```

#### Delete Teacher
```http
DELETE /api/teachers/:id
Authorization: Bearer <admin_token>
```

#### Admin Toggle Teaching Ability
```http
PATCH /api/teachers/admin/toggle-teaching
Authorization: Bearer <admin_token>
```

---

### Live Class Management

#### Go Live
```http
POST /api/classes/:id/go-live
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "message": "Class is now live!",
  "class": {
    "id": "...",
    "title": "English Grammar 101",
    "status": "live",
    "isLive": true,
    "liveStartedAt": "2026-05-07T10:00:00.000Z"
  }
}
```

#### End Live
```http
POST /api/classes/:id/end-live
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "message": "Class ended successfully.",
  "class": {
    "id": "...",
    "status": "completed",
    "isLive": false,
    "liveEndedAt": "2026-05-07T11:00:00.000Z"
  },
  "duration": 60
}
```

#### Get Live Classes
```http
GET /api/classes/live
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "liveClasses": [
    {
      "id": "...",
      "title": "English Grammar 101",
      "teacher": {
        "name": "John Doe",
        "studentId": "TCH-001"
      },
      "liveStartedAt": "2026-05-07T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Check Live Status
```http
GET /api/classes/:id/live-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "classId": "...",
  "isLive": true,
  "status": "live",
  "liveStartedAt": "2026-05-07T10:00:00.000Z",
  "liveEndedAt": null,
  "duration": null
}
```

---

### Class Management (Updated)

#### Create Class (Teacher/Admin)
```http
POST /api/classes
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "title": "English Grammar 101",
  "schedule": "2026-05-08T10:00:00.000Z",
  "duration": 60,
  "description": "Introduction to basic grammar"
}
```

**Response with Conflict:**
```json
{
  "message": "Class created successfully.",
  "class": { ... },
  "warning": "2 other class(es) scheduled at this time",
  "conflicts": [
    {
      "id": "...",
      "title": "Vocabulary Building",
      "teacher": "Jane Smith",
      "schedule": "2026-05-08T10:00:00.000Z"
    }
  ]
}
```

---

## 🔔 Real-Time Events (Socket.io)

### Schedule Conflict (Teacher)
```javascript
socket.on('schedule_conflict', (data) => {
  // data = {
  //   message: "⚠️ 2 other teacher(s) have classes scheduled at this time",
  //   conflicts: [...],
  //   yourClass: {...}
  // }
});
```

### Schedule Conflict (Admin)
```javascript
socket.on('schedule_conflict_admin', (data) => {
  // data = {
  //   message: "Schedule conflict: John Doe scheduled...",
  //   teacher: {...},
  //   conflicts: [...],
  //   newClass: {...}
  // }
});
```

### Class Goes Live
```javascript
socket.on('class_live', (data) => {
  // data = {
  //   classId: "...",
  //   title: "English Grammar 101",
  //   teacher: "John Doe",
  //   teacherId: "TCH-001",
  //   startedAt: "2026-05-07T10:00:00.000Z"
  // }
});
```

### Class Ended
```javascript
socket.on('class_ended', (data) => {
  // data = {
  //   classId: "...",
  //   title: "English Grammar 101",
  //   teacher: "John Doe",
  //   endedAt: "2026-05-07T11:00:00.000Z"
  // }
});
```

---

## 🗄️ Database Schema Updates

### User Model
```javascript
{
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student'
  },
  canTeach: {
    type: Boolean,
    default: false,
    description: 'Admin can also act as teacher'
  },
  teacherProfile: {
    specialization: String,
    bio: String,
    experience: Number,
    joinedAt: Date
  },
  email: String
}
```

### Class Model
```javascript
{
  isLive: {
    type: Boolean,
    default: false
  },
  liveStartedAt: Date,
  liveEndedAt: Date,
  hasConflict: {
    type: Boolean,
    default: false
  },
  conflictingClasses: [ObjectId]
}
```

---

## 🔐 Permission Matrix

| Action | Admin | Admin (canTeach) | Teacher | Student |
|--------|-------|------------------|---------|---------|
| Create Teacher | ✅ | ✅ | ❌ | ❌ |
| View All Teachers | ✅ | ✅ | ❌ | ❌ |
| Create Class | ✅ | ✅ | ✅ | ❌ |
| View Own Classes | ✅ | ✅ | ✅ | ✅ |
| View All Classes | ✅ | ❌ | ❌ | ❌ |
| Update Own Class | ✅ | ✅ | ✅ | ❌ |
| Update Any Class | ✅ | ❌ | ❌ | ❌ |
| Delete Own Class | ✅ | ✅ | ✅ | ❌ |
| Delete Any Class | ✅ | ❌ | ❌ | ❌ |
| Go Live | ✅ | ✅ | ✅ | ❌ |
| End Live | ✅ | ✅ | ✅ | ❌ |
| Enroll Students | ✅ | ✅ | ✅ | ❌ |
| View Activity Logs | ✅ | ✅ | ✅ (own) | ✅ (own) |

---

## 📝 Activity Logging

New activity types tracked:
- `create_teacher` - Admin creates teacher account
- `update_teacher` - Admin updates teacher info
- `delete_teacher` - Admin deletes teacher
- `toggle_teacher_status` - Admin activates/deactivates teacher
- `toggle_admin_teaching` - Admin enables/disables teaching
- `class_go_live` - Teacher starts live class
- `class_end_live` - Teacher ends live class
- `create_class` - Teacher/Admin creates class
- `update_class` - Teacher/Admin updates class
- `delete_class` - Teacher/Admin deletes class

---

## 🚀 Usage Examples

### Admin Creates Teacher
```javascript
// Admin dashboard
const response = await api.post('/api/teachers', {
  name: 'John Doe',
  email: 'john@example.com',
  specialization: 'Grammar Expert'
});

// Show credentials to admin
alert(`Teacher Created!
ID: ${response.data.teacher.teacherId}
Password: ${response.data.teacher.password}
Please share these credentials securely.`);
```

### Teacher Schedules Class
```javascript
// Teacher dashboard
const response = await api.post('/api/classes', {
  title: 'English Grammar 101',
  schedule: '2026-05-08T10:00:00.000Z',
  duration: 60
});

if (response.data.warning) {
  // Show conflict warning
  showWarning(response.data.warning, response.data.conflicts);
}
```

### Teacher Goes Live
```javascript
// Teacher class page
const goLive = async (classId) => {
  try {
    const response = await api.post(`/api/classes/${classId}/go-live`);
    
    // Redirect to Jitsi room
    window.location.href = `/jitsi/${classId}`;
    
    // Show success
    toast.success('Class is now live!');
  } catch (error) {
    if (error.response?.data?.liveClass) {
      toast.error(`You already have a live class: ${error.response.data.liveClass.title}`);
    }
  }
};
```

### Admin Monitors Conflicts
```javascript
// Admin dashboard - listen for conflicts
socket.on('schedule_conflict_admin', (data) => {
  showNotification({
    type: 'warning',
    title: 'Schedule Conflict Detected',
    message: data.message,
    conflicts: data.conflicts
  });
});
```

---

## 🧪 Testing

### Test Teacher Creation
```bash
curl -X POST http://localhost:5000/api/teachers \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Teacher",
    "email": "test@example.com",
    "specialization": "Test Subject"
  }'
```

### Test Schedule Conflict
```bash
# Create first class
curl -X POST http://localhost:5000/api/classes \
  -H "Authorization: Bearer <teacher1_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Class 1",
    "schedule": "2026-05-08T10:00:00.000Z",
    "duration": 60
  }'

# Create conflicting class
curl -X POST http://localhost:5000/api/classes \
  -H "Authorization: Bearer <teacher2_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Class 2",
    "schedule": "2026-05-08T10:00:00.000Z",
    "duration": 60
  }'
```

### Test Go Live
```bash
curl -X POST http://localhost:5000/api/classes/<class_id>/go-live \
  -H "Authorization: Bearer <teacher_token>"
```

---

## 📊 Admin Dashboard Features

### Teacher Statistics
- Total teachers
- Active teachers
- Teachers with live classes
- Classes per teacher
- Schedule conflicts

### Conflict Management
- View all schedule conflicts
- See affected teachers
- Resolve conflicts
- Send notifications

### Activity Monitoring
- Track all teacher activities
- View class creation/updates
- Monitor live classes
- Export activity logs

---

## 🔮 Future Enhancements

Potential improvements:
1. Teacher availability calendar
2. Automatic conflict resolution suggestions
3. Teacher performance analytics
4. Student feedback for teachers
5. Teacher certifications/badges
6. Bulk teacher import
7. Teacher scheduling preferences
8. Automated conflict notifications via email
9. Teacher workload balancing
10. Multi-language support for teachers

---

**Version**: 1.0.0  
**Date**: 2026-05-07  
**Status**: ✅ Ready for Testing
