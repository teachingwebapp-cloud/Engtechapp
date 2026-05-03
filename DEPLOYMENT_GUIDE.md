# Deployment Guide - EngTeach Application

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Node.js 18+ installed
- [ ] MongoDB Atlas account created
- [ ] Git repository set up
- [ ] Domain name configured (optional)
- [ ] SSL certificate ready (for production)

### 2. Code Preparation
- [ ] All bug fixes applied
- [ ] Tests passing (run `node server/test-fixes.js`)
- [ ] Dependencies installed
- [ ] Client built for production
- [ ] Environment variables configured

### 3. Security Review
- [ ] Strong JWT secrets generated (min 32 characters)
- [ ] MongoDB IP whitelist configured
- [ ] CORS origins properly set
- [ ] Rate limiting enabled
- [ ] Helmet security headers active

---

## 🚀 Deployment Steps

### Step 1: Configure MongoDB Atlas

1. **Create MongoDB Atlas Account**
   ```
   Visit: https://www.mongodb.com/cloud/atlas
   Sign up for free tier
   ```

2. **Create Cluster**
   ```
   - Choose cloud provider (AWS/GCP/Azure)
   - Select region closest to your users
   - Choose M0 (Free tier) or higher
   ```

3. **Configure Network Access**
   ```
   - Go to Network Access
   - Add IP Address
   - For development: Add your current IP
   - For production: Add 0.0.0.0/0 (allow from anywhere)
   ```

4. **Create Database User**
   ```
   - Go to Database Access
   - Add New Database User
   - Choose password authentication
   - Set username and strong password
   - Grant "Read and write to any database" role
   ```

5. **Get Connection String**
   ```
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace <password> with your password
   ```

### Step 2: Configure Environment Variables

1. **Create .env file**
   ```bash
   cd server
   cp .env.example .env
   ```

2. **Generate JWT Secrets**
   ```bash
   # Generate JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate JWT_REFRESH_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Edit .env file**
   ```env
   PORT=4000
   NODE_ENV=production
   
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/engteach?retryWrites=true&w=majority
   
   JWT_SECRET=<generated-secret-1>
   JWT_REFRESH_SECRET=<generated-secret-2>
   JWT_EXPIRES_IN=1h
   
   CLIENT_URL=https://yourdomain.com
   
   MAX_FAILED_LOGINS=5
   LOCK_DURATION_MS=600000
   ```

### Step 3: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 4: Run Tests

```bash
# Run automated tests
cd server
node test-fixes.js

# Expected output: All tests passing ✅
```

### Step 5: Build Client

```bash
cd client
npm run build

# Output will be in client/dist/
```

### Step 6: Test Locally

```bash
# Terminal 1: Start server
cd server
npm start

# Terminal 2: Test endpoints
curl http://localhost:4000/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set MONGODB_URI="your-mongodb-uri"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set JWT_REFRESH_SECRET="your-refresh-secret"
   railway variables set NODE_ENV="production"
   railway variables set CLIENT_URL="https://your-app.railway.app"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get URL**
   ```bash
   railway domain
   ```

### Option 2: Heroku

1. **Install Heroku CLI**
   ```bash
   # Visit: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create your-app-name
   ```

4. **Add Environment Variables**
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set JWT_REFRESH_SECRET="your-refresh-secret"
   heroku config:set NODE_ENV="production"
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

### Option 3: DigitalOcean App Platform

1. **Create Account**
   ```
   Visit: https://www.digitalocean.com
   ```

2. **Create New App**
   ```
   - Connect GitHub repository
   - Select branch (main)
   - Auto-detect Node.js
   ```

3. **Configure Build**
   ```
   Build Command: npm run build --prefix client && npm install --prefix server
   Run Command: npm start --prefix server
   ```

4. **Add Environment Variables**
   ```
   In App Settings > Environment Variables:
   - MONGODB_URI
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - NODE_ENV=production
   - CLIENT_URL
   ```

5. **Deploy**
   ```
   Click "Deploy"
   ```

### Option 4: AWS EC2 (Advanced)

1. **Launch EC2 Instance**
   ```
   - Choose Ubuntu 22.04 LTS
   - t2.micro (free tier)
   - Configure security group (ports 22, 80, 443, 4000)
   ```

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd your-repo
   ```

6. **Install Dependencies**
   ```bash
   npm install --prefix server
   npm install --prefix client
   npm run build --prefix client
   ```

7. **Create .env file**
   ```bash
   cd server
   nano .env
   # Paste your environment variables
   ```

8. **Start with PM2**
   ```bash
   cd server
   pm2 start server.js --name engteach
   pm2 save
   pm2 startup
   ```

9. **Configure Nginx (Optional)**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/engteach
   ```
   
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/engteach /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 5: Docker (Any Platform)

1. **Create Dockerfile** (already exists in project)

2. **Build Image**
   ```bash
   docker build -t engteach:latest .
   ```

3. **Run Container**
   ```bash
   docker run -d \
     -p 4000:4000 \
     -e MONGODB_URI="your-mongodb-uri" \
     -e JWT_SECRET="your-jwt-secret" \
     -e JWT_REFRESH_SECRET="your-refresh-secret" \
     -e NODE_ENV="production" \
     -e CLIENT_URL="https://yourdomain.com" \
     --name engteach \
     engteach:latest
   ```

4. **Check Logs**
   ```bash
   docker logs -f engteach
   ```

---

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test Login
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"admin","password":"admin123"}'
# Expected: {"accessToken":"...","refreshToken":"...","user":{...}}
```

### 3. Test Protected Endpoint
```bash
curl https://your-domain.com/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expected: {"users":[...],"pagination":{...}}
```

### 4. Test Socket Connection
```javascript
// In browser console
const socket = io('https://your-domain.com');
socket.on('connect', () => console.log('Connected!'));
// Expected: "Connected!" in console
```

### 5. Monitor Logs
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# PM2
pm2 logs engteach

# Docker
docker logs -f engteach
```

---

## 📊 Monitoring Setup

### 1. Error Tracking

**Option A: Sentry**
```bash
npm install @sentry/node --prefix server
```

```javascript
// In server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });
```

**Option B: LogRocket**
```bash
npm install logrocket --prefix client
```

### 2. Performance Monitoring

**Option A: New Relic**
```bash
npm install newrelic --prefix server
```

**Option B: Datadog**
```bash
npm install dd-trace --prefix server
```

### 3. Uptime Monitoring

- **UptimeRobot**: https://uptimerobot.com (Free)
- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com

---

## 🔒 Security Hardening

### 1. Enable HTTPS

**Let's Encrypt (Free SSL)**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. Configure Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Set Up Backups

**MongoDB Atlas Backups**
- Go to Clusters > Backup
- Enable Cloud Backup
- Configure backup schedule

**Application Backups**
```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz /path/to/app
```

### 4. Enable Rate Limiting (Already Configured)

Verify in logs:
```
✅ Rate limiter loaded successfully
   API limiter: ✅
   Login limiter: ✅
   Permission limiter: ✅
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed
```bash
# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "your-connection-string"

# Verify IP whitelist in MongoDB Atlas
```

### Issue: Port Already in Use
```bash
# Find process using port 4000
lsof -ti:4000

# Kill process
kill -9 $(lsof -ti:4000)
```

### Issue: Build Fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Clear client cache
cd client
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Issue: Socket Connection Fails
```bash
# Check CORS configuration in server.js
# Verify CLIENT_URL matches your domain
# Check firewall allows WebSocket connections
```

---

## 📈 Performance Optimization

### 1. Enable Redis (Optional)

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Add to .env
REDIS_URL=redis://localhost:6379
```

### 2. Enable Compression

Already configured in server with Helmet.

### 3. CDN for Static Assets

Use Cloudflare or AWS CloudFront for client assets.

### 4. Database Indexing

Already configured in models. Verify indexes:
```javascript
// In MongoDB shell
db.permissionrequests.getIndexes()
// Should see unique_pending_request index
```

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        npm install --prefix server
        npm install --prefix client
    
    - name: Run tests
      run: node server/test-fixes.js
    
    - name: Build client
      run: npm run build --prefix client
    
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## ✅ Final Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Environment variables set
- [ ] MongoDB connection working
- [ ] Client built successfully
- [ ] SSL certificate configured
- [ ] Domain name pointed to server
- [ ] Backups configured
- [ ] Monitoring set up

### Launch
- [ ] Deploy to production
- [ ] Verify health endpoint
- [ ] Test login flow
- [ ] Test class creation
- [ ] Test permission system
- [ ] Test chat functionality
- [ ] Monitor logs for errors

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Verify performance metrics
- [ ] Review user feedback
- [ ] Document any issues
- [ ] Plan next iteration

---

## 📞 Support

### Resources
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Railway Docs: https://docs.railway.app
- Heroku Docs: https://devcenter.heroku.com
- Node.js Docs: https://nodejs.org/docs

### Emergency Contacts
- Database Issues: Check MongoDB Atlas status
- Deployment Issues: Check platform status page
- Application Issues: Review error logs

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: May 3, 2026
**Status**: ✅ Ready for Production
