# 🚀 Deployment Guide - Render.com

Complete guide to deploy FinTask app on Render with security best practices.

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** - Free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

---

## 🔐 Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **FREE** cluster (M0 Sandbox)
3. Create a database user:
   - Username: `fintask_user`
   - Password: Generate a strong password (save it!)
4. Add IP Access:
   - Click "Network Access"
   - Add IP: `0.0.0.0/0` (Allow from anywhere - Render uses dynamic IPs)
5. Get Connection String:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Example: `mongodb+srv://fintask_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fintask?retryWrites=true&w=majority`

---

## 🌐 Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create New Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Configure Environment Variables:**
   Click "Environment" tab and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Auto-set |
   | `MONGODB_URI` | `mongodb+srv://...` | From Step 1 |
   | `JWT_SECRET` | Generate random | Click "Generate" |
   | `PORT` | `10000` | Auto-set |
   | `TELEGRAM_BOT_TOKEN` | (optional) | If using Telegram bot |
   | `TELEGRAM_CHAT_ID` | (optional) | If using Telegram bot |

4. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build
   - Your app will be live at: `https://your-app-name.onrender.com`

### Option B: Manual Setup

1. **Create Web Service:**
   - New + → Web Service
   - Connect GitHub repo
   - Name: `fintask-app`
   - Region: Singapore (or closest to you)
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
   - Plan: **Free**

2. **Add Environment Variables** (same as Option A)

3. **Deploy!**

---

## 🔒 Step 3: Security Checklist

### ✅ Environment Variables
- [ ] `JWT_SECRET` is a strong random string (min 32 characters)
- [ ] `MONGODB_URI` contains correct password
- [ ] No sensitive data in code or `.env` file

### ✅ MongoDB Security
- [ ] Database user has strong password
- [ ] IP whitelist includes `0.0.0.0/0` for Render
- [ ] Connection string uses SSL (`retryWrites=true&w=majority`)

### ✅ Application Security
- [ ] Helmet.js enabled (already configured)
- [ ] Rate limiting active (already configured)
- [ ] CORS configured (already configured)
- [ ] Passwords hashed with bcrypt (already configured)
- [ ] JWT tokens expire after 7 days (already configured)

---

## 🧪 Step 4: Test Your Deployment

1. **Health Check:**
   ```bash
   curl https://your-app-name.onrender.com/api/ping
   ```
   Should return: `{"message":"pong"}`

2. **Register User:**
   - Go to: `https://your-app-name.onrender.com/register`
   - Create an account
   - Login and test features

3. **Check Logs:**
   - Render Dashboard → Your Service → Logs
   - Look for any errors

---

## 🔄 Step 5: Continuous Deployment

**Auto-deploy on Git push:**
- Render automatically deploys when you push to `main` branch
- Just commit and push:
  ```bash
  git add .
  git commit -m "Update feature"
  git push origin main
  ```

---

## 🐛 Troubleshooting

### Build Fails
- Check Render logs for errors
- Ensure `pnpm` is available (it should be)
- Verify all dependencies in `package.json`

### Database Connection Error
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

### App Crashes on Start
- Check environment variables are set
- Look at Render logs for error messages
- Verify `PORT` is set to `10000`

### 502 Bad Gateway
- App might be starting (wait 2-3 minutes)
- Check if health check path `/api/ping` works
- Verify start command is correct

---

## 📊 Monitoring

### Free Tier Limits (Render)
- ✅ 750 hours/month (enough for 1 app 24/7)
- ✅ Automatic SSL certificate
- ✅ Custom domain support
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start takes 30-60 seconds

### Keep App Awake (Optional)
Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes:
- Monitor URL: `https://your-app-name.onrender.com/api/ping`
- Interval: 5 minutes

---

## 🎯 Post-Deployment

### Create Admin User
1. Register a user through the app
2. Connect to MongoDB Atlas
3. Find the user in `users` collection
4. Update `role` field to `admin`

### Backup Database
- MongoDB Atlas provides automatic backups
- Free tier: 2-day backup retention
- Paid tier: Point-in-time recovery

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** (already in `.gitignore`)
2. **Use strong passwords** for MongoDB and admin users
3. **Rotate JWT_SECRET** periodically
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated**: `pnpm update`
6. **Enable 2FA** on Render and MongoDB accounts

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Issues:** Create an issue in your GitHub repo

---

## 🎉 Success!

Your FinTask app is now live and secure! 🚀

**Next Steps:**
- Share the URL with users
- Set up custom domain (optional)
- Configure Telegram bot for notifications
- Monitor usage and performance

---

**Deployment URL:** `https://your-app-name.onrender.com`

**Admin Panel:** `https://your-app-name.onrender.com/admin`

**API Health:** `https://your-app-name.onrender.com/api/ping`
