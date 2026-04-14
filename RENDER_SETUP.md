# 🎯 Quick Render Setup Guide

## 1️⃣ MongoDB Setup (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Create FREE cluster (M0)
4. Create database user:
   - Username: `fintask`
   - Password: Click "Autogenerate Secure Password" (SAVE THIS!)
5. Network Access → Add IP: `0.0.0.0/0`
6. Get connection string:
   ```
   mongodb+srv://fintask:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fintask?retryWrites=true&w=majority
   ```

## 2️⃣ Render Deployment (5 minutes)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. Go to https://dashboard.render.com
3. Click "New +" → "Web Service"
4. Connect GitHub repo
5. Settings:
   - **Name:** `fintask-app`
   - **Region:** Singapore
   - **Branch:** `main`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free

6. Environment Variables (click "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://fintask:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fintask
   JWT_SECRET=<click Generate>
   ```

7. Click "Create Web Service"
8. Wait 5-10 minutes ☕
9. Done! Your app is live at: `https://fintask-app.onrender.com`

## 3️⃣ Test Your App

1. Visit: `https://your-app-name.onrender.com`
2. Register a new account
3. Login and test features!

## 🔒 Security Checklist

- ✅ JWT_SECRET is auto-generated (32+ characters)
- ✅ MongoDB password is strong
- ✅ HTTPS enabled automatically
- ✅ Helmet.js protecting headers
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Passwords hashed with bcrypt

## ⚡ Important Notes

- **Free tier:** App sleeps after 15 min inactivity
- **Cold start:** First request takes 30-60 seconds
- **Auto-deploy:** Pushes to `main` branch auto-deploy
- **Logs:** Check Render dashboard for errors

## 🎉 You're Done!

Your secure FinTask app is now live on the internet! 🚀

**Share your app:** `https://your-app-name.onrender.com`
