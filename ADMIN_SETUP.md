# Admin Setup Guide

This guide explains how to give admin rights to users in your FinTask application.

## Method 1: API Endpoint (Recommended for Production)

### Using curl (Linux/Mac/WSL):
```bash
curl -X POST "https://your-app-url.com/api/setup/make-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ardikmachhi@gmail.com",
    "adminKey": "make-admin-2024"
  }'
```

### Using PowerShell (Windows):
```powershell
$body = @{
    email = "ardikmachhi@gmail.com"
    adminKey = "make-admin-2024"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-app-url.com/api/setup/make-admin" -Method POST -Body $body -ContentType "application/json"
```

### Using the provided scripts:
```bash
# Linux/Mac
./make-admin-api-call.sh ardikmachhi@gmail.com https://your-app-url.com

# Windows PowerShell
.\make-admin-api-call.ps1 -Email "ardikmachhi@gmail.com" -ServerUrl "https://your-app-url.com"
```

## Method 2: Admin Dashboard (After you have admin access)

1. Login as an admin user
2. Go to `/admin` dashboard
3. Find the user in the users list
4. Click "Edit Role" and change to "superadmin"

## Method 3: Database Scripts (Development Only)

For local development with database access:

```bash
# Make a user admin
pnpm run make-admin ardikmachhi@gmail.com

# Or manage user roles
pnpm run manage-user-role ardikmachhi@gmail.com superadmin
```

## Security Notes

- The `adminKey` is set to `make-admin-2024` by default
- You can change it by setting the `ADMIN_SETUP_KEY` environment variable
- The API endpoint `/api/setup/make-admin` is public but requires the correct admin key
- After making your first admin, you can use the admin dashboard for further user management

## Environment Variables

Add to your `.env` file:
```env
ADMIN_SETUP_KEY=your-secure-admin-key-here
```

## User Roles

- `user`: Regular user with access to their own data
- `superadmin`: Full admin access to all features and user management

## For ardikmachhi@gmail.com

To make `ardikmachhi@gmail.com` an admin, use this exact command:

```bash
curl -X POST "https://your-deployed-app-url.com/api/setup/make-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ardikmachhi@gmail.com",
    "adminKey": "make-admin-2024"
  }'
```

Replace `https://your-deployed-app-url.com` with your actual deployment URL.