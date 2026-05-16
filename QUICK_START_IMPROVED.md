# 🚀 EngTeach - Quick Start Guide (Improved Version)

## 📋 Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

---

## ⚡ Quick Setup (5 Minutes)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd engteach

# Install all dependencies
npm install --prefix server
npm install --prefix client
```

### 2. Configure Environment
```bash
# Copy template
cp .env.example server/.env

# Edit with your values
nano server/.env  # or use your editor
```

**Minimum Required:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/engteach
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters-long
```

### 3. Start Development
```bash
# Terminal 1: Backend
npm run dev --prefix server

# Terminal 2: Frontend
npm run dev --prefix client
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 5. Login
```
ID: admin
Password: admin123
```

---

## 🎯 What's New in This Version?

### ✅ Production-Ready Features
- **Proper Logging** - Winston with file rotation
- **Input Validation** - All routes validated
- **Error Handling** - Standardized responses
- **Health Checks** - Database connectivity
- **Graceful Shutdown** - Clean deployments
- **Rate Limiting** - DoS protection
- **Request Tracking** - Unique IDs for debugging

### 📁 New Files You'll See
```
server/logs/          # Application logs (auto-created)
  ├── error.log       # Errors only
  └── combined.log    # All logs

.env.example          # Environment template
IMPROVEMENTS.md       # Detailed changes
```

---

## 🔍 Verify Installation

### Check Health
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-07T...",
  "uptime": 12.34,
  "environment": "development",
  "database": "connected"
}
```

### Check Logs
```bash
# View all logs
tail -f server/logs/combined.log

# View errors only
tail -f server/logs/error.log
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"admin","password":"admin123"}'
```

---

## 🐛 Troubleshooting

### Issue: "MONGODB_URI not set"
**Solution:** Copy `.env.example` to `server/.env` and add your MongoDB URI

### Issue: "Module not found"
**Solution:** Run `npm install --prefix server`

### Issue: Port already in use
**Solution:** Change `PORT` in `server/.env` or kill existing process

### Issue: Can't connect to MongoDB
**Solution:** 
1. Check MongoDB Atlas IP whitelist
2. Verify connection string
3. Test connection: `mongosh "your-connection-string"`

### Issue: Frontend can't reach backend
**Solution:** Check `VITE_API_URL` in client or proxy settings in `vite.config.js`

---

## 📊 Development Workflow

### Making Changes

1. **Backend Changes**
   - Edit files in `server/`
   - Server auto-restarts (nodemon)
   - Check logs: `server/logs/combined.log`

2. **Frontend Changes**
   - Edit files in `client/src/`
   - Hot reload enabled
   - Check browser console

3. **Database Changes**
   - Edit models in `server/models/`
   - Restart server
   - Check MongoDB Atlas

### Testing

```bash
# Test API endpoints
curl http://localhost:5000/api/health

# Test with authentication
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Debugging

1. **Check Logs**
   ```bash
   tail -f server/logs/combined.log
   ```

2. **Check Request IDs**
   - Every request has unique ID
   - Find in logs: `[request-id]`
   - Find in response headers: `X-Request-ID`

3. **Check Database**
   - MongoDB Atlas → Browse Collections
   - Check connection: Health endpoint

---

## 🚀 Deployment

### Build for Production
```bash
# Build frontend
npm run build --prefix client

# Test production build locally
npm start --prefix server
```

### Deploy to Railway
```bash
# Connect to Railway
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard
```

### Deploy to Vercel (Frontend)
```bash
cd client
vercel --prod
```

---

## 📚 Key Files

### Configuration
- `server/.env` - Environment variables (create from `.env.example`)
- `server/package.json` - Server dependencies
- `client/package.json` - Client dependencies

### Entry Points
- `server/server.js` - Backend entry point
- `client/src/main.jsx` - Frontend entry point
- `client/src/App.jsx` - React app root

### Important Directories
```
server/
├── config/          # Database config
├── controllers/     # Business logic
├── middleware/      # Auth, validation, etc.
├── models/          # MongoDB schemas
├── routes/          # API endpoints
├── utils/           # Helpers (logger, etc.)
└── logs/            # Application logs

client/src/
├── components/      # React components
├── pages/           # Page components
├── context/         # React context
└── api/             # API client
```

---

## 🔐 Security Notes

### Default Credentials
**⚠️ Change in production!**
```
ID: admin
Password: admin123
```

### JWT Secrets
- Generate strong secrets (32+ characters)
- Use different secrets for access and refresh tokens
- Never commit secrets to git

### MongoDB
- Use MongoDB Atlas (cloud)
- Enable IP whitelist
- Use strong passwords
- Enable 2FA on Atlas account

---

## 📖 Documentation

- **Full Improvements**: `IMPROVEMENTS.md`
- **Summary**: `IMPROVEMENTS_SUMMARY.md`
- **Deployment**: `DEPLOYMENT_IMPROVEMENTS.md`
- **Environment**: `.env.example`
- **Original README**: `README.md`

---

## 🆘 Getting Help

### Check These First
1. Logs: `server/logs/error.log`
2. Health check: `http://localhost:5000/api/health`
3. Environment: `server/.env` (compare with `.env.example`)
4. Dependencies: Run `npm install` again

### Common Commands
```bash
# Restart everything
npm run dev --prefix server
npm run dev --prefix client

# Clear node_modules and reinstall
rm -rf server/node_modules client/node_modules
npm install --prefix server
npm install --prefix client

# Check logs
tail -f server/logs/combined.log

# Test health
curl http://localhost:5000/api/health
```

---

## ✅ Checklist

### First Time Setup
- [ ] Node.js 18+ installed
- [ ] MongoDB Atlas account created
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] `.env` file created and configured
- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Can login with admin credentials
- [ ] Health check returns "ok"

### Before Committing
- [ ] No `.env` files in git
- [ ] No console.log statements (use logger)
- [ ] No hardcoded secrets
- [ ] Code formatted
- [ ] No errors in logs

### Before Deploying
- [ ] All environment variables set
- [ ] Client built successfully
- [ ] Health check works
- [ ] Database connection works
- [ ] Changed default admin password
- [ ] Logs directory exists

---

**Version**: 1.1.0  
**Last Updated**: 2026-05-07  
**Status**: ✅ Ready to Use

**Happy Coding! 🎉**
