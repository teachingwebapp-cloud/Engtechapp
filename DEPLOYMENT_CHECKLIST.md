# ✅ Deployment Checklist

## Before You Start
- [x] GitHub account created
- [x] MongoDB Atlas account created
- [ ] Railway account (create at https://railway.app)

---

## Step 1: MongoDB Atlas (5 min)
- [ ] Create free M0 cluster
- [ ] Create database user (username: `engteach-admin`)
- [ ] Save password securely
- [ ] Allow network access (0.0.0.0/0)
- [ ] Get connection string
- [ ] Replace `<password>` in connection string

**Your MongoDB Connection String:**
```
mongodb+srv://engteach-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 2: Push to GitHub (3 min)
- [ ] Open terminal in project folder
- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit"`
- [ ] Create new repository on GitHub
- [ ] Run: `git remote add origin YOUR_GITHUB_URL`
- [ ] Run: `git push -u origin main`

---

## Step 3: Deploy to Railway (5 min)
- [ ] Go to https://railway.app
- [ ] Login with GitHub
- [ ] Create new project
- [ ] Deploy from GitHub repo
- [ ] Select your repository

---

## Step 4: Configure Environment Variables
- [ ] Click on your service in Railway
- [ ] Go to "Variables" tab
- [ ] Add these variables:

### Generate JWT Secrets First:
Run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run again for second secret.

### Add These Variables:
```
MONGODB_URI = <your-mongodb-connection-string>
JWT_SECRET = <generated-secret-1>
JWT_REFRESH_SECRET = <generated-secret-2>
NODE_ENV = production
PORT = 4000
```

---

## Step 5: Get Domain and Update
- [ ] Go to Settings → Domains
- [ ] Click "Generate Domain"
- [ ] Copy your Railway URL
- [ ] Go back to Variables
- [ ] Add: `CLIENT_URL = <your-railway-url>`
- [ ] Redeploy (Deployments → three dots → Redeploy)

---

## Step 6: Test Your Deployment
- [ ] Visit: `https://your-railway-url.up.railway.app/api/health`
- [ ] Should see: `{"status":"ok",...}`
- [ ] Visit: `https://your-railway-url.up.railway.app`
- [ ] Should see login page
- [ ] Login with: `admin` / `admin123`
- [ ] Change default password

---

## 🎉 Success Criteria
- [ ] Health endpoint returns OK
- [ ] Login page loads
- [ ] Can login with admin credentials
- [ ] Can create a class
- [ ] Can create a student
- [ ] No errors in Railway logs

---

## 📝 Save These Important Details

**MongoDB Connection String:**
```
_________________________________
```

**JWT_SECRET:**
```
_________________________________
```

**JWT_REFRESH_SECRET:**
```
_________________________________
```

**Railway URL:**
```
_________________________________
```

**GitHub Repository:**
```
_________________________________
```

---

## 🐛 Common Issues

### MongoDB Connection Failed
- Check password in connection string
- Verify Network Access allows 0.0.0.0/0
- Check database user exists

### Application Error
- Check Railway logs
- Verify all environment variables are set
- Check JWT secrets are set

### Login Not Working
- Clear browser cache
- Check Railway logs for errors
- Verify JWT_SECRET is set

---

## 🔄 After Deployment

### To Update Your App:
```bash
git add .
git commit -m "Your changes"
git push origin main
```
Railway auto-deploys! 🚀

### To View Logs:
1. Go to Railway dashboard
2. Click your service
3. Click "View Logs"

### To Monitor:
- Check Railway metrics
- Monitor MongoDB Atlas metrics
- Review application logs

---

**Estimated Total Time: 15-20 minutes**

Good luck! 🚀
