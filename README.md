# EngTeach. - Secure Online Spoken English Teaching System

A modern, full-stack web application for managing online English language classes with real-time video conferencing, student management, and activity logging.

## 🌟 Features

- **👥 User Management**: Create and manage students, teachers, and admins
- **📚 Class Management**: Create classes and enroll students
- **🎥 Live Video Classes**: Integrated Jitsi Meet for real-time video conferencing
- **🔐 Permission System**: Request/grant microphone and camera permissions
- **📊 Activity Logging**: Comprehensive audit logs for all system activities
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🔒 Security**: JWT authentication, rate limiting, password hashing, CORS protection
- **📤 Export**: Download activity logs and student credentials as CSV

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier available)
- npm or yarn

### Local Development

1. **Clone and install:**
```bash
git clone <repo-url>
cd spoken-english

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

2. **Setup environment:**
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secrets
```

3. **Start development servers:**
```bash
# Terminal 1: Start backend
npm start --prefix server

# Terminal 2: Start frontend
npm run dev --prefix client
```

4. **Access the app:**
- Client: http://localhost:5173 (or next available port)
- Server: http://localhost:4000

5. **Default login:**
```
ID: admin
Password: admin123
```

---

## 📁 Project Structure

```
spoken-english/
├── server/                    # Express.js backend
│   ├── config/               # Database configuration
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth, validation, rate limiting
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── utils/               # Helpers and utilities
│   └── server.js            # Entry point
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   ├── api/            # API client
│   │   └── App.jsx         # Main app
│   └── dist/               # Production build
├── .env.example             # Environment template
├── DEPLOYMENT.md            # Deployment guide
├── Dockerfile              # Docker image
├── docker-compose.yml      # Docker compose
└── README.md               # This file
```

---

## 🔧 Build for Production

```bash
# Build client
npm run build --prefix client

# Client built to: client/dist/
```

---

## 🐳 Docker Deployment

### Build image:
```bash
docker build -t engteach:latest .
```

### Run container:
```bash
docker run -d \
  -p 4000:4000 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db" \
  -e JWT_SECRET="your-secret-key" \
  -e NODE_ENV="production" \
  --name engteach \
  engteach:latest
```

### Using Docker Compose:
```bash
docker-compose up -d
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id/status` - Toggle user status

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class

### Enrollments
- `POST /api/enrollments` - Enroll students
- `GET /api/enrollments` - List enrollments

### Permissions
- `POST /api/permissions/request` - Request permission
- `PUT /api/permissions/:id/approve` - Approve permission
- `PUT /api/permissions/:id/deny` - Deny permission

### Activity Logs
- `GET /api/activity-logs` - List logs

---

## 🔐 Environment Variables

```env
# Server
PORT=4000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=app

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h

# Client
CLIENT_URL=https://yourdomain.com

# Security
MAX_FAILED_LOGINS=5
LOCK_DURATION_MS=600000

# Optional
USE_MEMORY_DB=false
REDIS_URL=redis://localhost:6379
```

---

## 📚 Role-Based Access

### Teacher
- Create and manage students
- Create and manage classes
- View activity logs
- Manage student credentials
- Control permission requests
- Join classes

### Student
- View enrolled classes
- Join classes with permission approval
- View personal activity logs

### Admin
- Full system access

---

## 🧪 Seed Default Data

```bash
npm run seed --prefix server
```

Creates default admin account:
- ID: `admin`
- Password: `admin123`

---

## 📊 Database Schema

### User
- studentId (unique)
- name
- phone
- role (student, teacher, admin)
- password (hashed)
- isActive
- createdAt

### Class
- name
- description
- teacher
- schedule
- createdAt

### Enrollment
- student
- class
- enrolledAt

### Permission
- student
- class
- type (microphone, camera)
- status (pending, approved, denied)
- requestedAt

### ActivityLog
- userId
- action (login, logout, class_join, etc.)
- details
- ipAddress
- timestamp

---

## 🛡️ Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcryptjs
- ✅ Rate limiting (100 requests per 15 mins)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ MongoDB injection prevention
- ✅ Strong password requirements
- ✅ Account lockout after failed attempts
- ✅ Audit logging

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas
- Test connection string locally

### CORS Errors
- Update CLIENT_URL in .env
- Verify origin and allowed methods

### Port Already in Use
- Change PORT in .env
- Or kill existing process: `lsof -ti:4000 | xargs kill -9`

### Module Not Found
- Run `npm install --prefix server` and `npm install --prefix client`
- Clear node_modules: `rm -rf server/node_modules client/node_modules`
- Reinstall: `npm install --prefix server && npm install --prefix client`

---

## 📦 Deployment Platforms

Tested and ready for:
- ✅ Vercel (frontend)
- ✅ Railway (backend)
- ✅ DigitalOcean
- ✅ AWS
- ✅ Heroku
- ✅ Docker containers

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## 📝 License

Proprietary - All rights reserved

---

## 👥 Support

For issues, feature requests, or documentation:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review `.env.example` for configuration
- Test with default credentials in development

---

## 🔄 Version

**v1.0.0** - Initial Release

---

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] `.env.production` configured
- [ ] Client built (`npm run build --prefix client`)
- [ ] All tests passing
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Domain/SSL certificate ready
- [ ] Backup strategy in place
- [ ] Monitoring/logging setup
- [ ] Health check endpoint working
- [ ] Admin credentials changed from defaults

---

**Built with ❤️ using React, Express.js, MongoDB, and Jitsi Meet**
