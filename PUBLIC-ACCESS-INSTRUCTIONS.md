# 🌐 TAWASOL CRM - Public Access Setup

## Quick Start (For Testing/Demo)

### Option 1: Using LocalTunnel (Easiest - Temporary Links)

1. **Make sure your servers are running:**
   - Double-click `START-ALL.bat` in the root folder
   - Wait for both Backend and Frontend to start

2. **Create public links:**
   - Double-click `create-public-links.bat`
   - Two new windows will open showing your public URLs

3. **Find your URLs:**
   - Look for lines that say: `your url is: https://xxxxx.loca.lt`
   - You'll get TWO URLs:
     - **Backend URL** (API) - e.g., `https://random-name-1.loca.lt`
     - **Frontend URL** (Main App) - e.g., `https://random-name-2.loca.lt`

4. **Share the Frontend URL:**
   - Copy the **Frontend URL** and share it with anyone
   - They can open it in their browser and use your CRM!

### ⚠️ Important Notes for LocalTunnel:

- **First Visit**: Users may see a "Click to Continue" page - this is normal, just click the button
- **Temporary**: These URLs change every time you restart the tunnels
- **Keep Windows Open**: Don't close the tunnel windows or the links will stop working
- **Free Service**: LocalTunnel is free but URLs are random each time

---

## Option 2: Using ngrok (Better URLs - Free Account Required)

1. **Install ngrok:**
   ```powershell
   choco install ngrok
   ```
   OR download from: https://ngrok.com/download

2. **Sign up for free account:**
   - Go to https://ngrok.com/signup
   - Get your auth token from dashboard

3. **Configure ngrok:**
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

4. **Start tunnels:**
   ```powershell
   # Terminal 1 - Backend
   ngrok http 3000
   
   # Terminal 2 - Frontend  
   ngrok http 5173
   ```

5. **Copy the HTTPS URLs** shown in each terminal

**Benefits:**
- More reliable than LocalTunnel
- Better URLs (e.g., `https://abc-123.ngrok-free.app`)
- No "Click to Continue" page with paid plan
- Can reserve custom subdomains with paid plan

---

## Option 3: Deploy to Production (Permanent Solution)

For a permanent, professional solution, you need to deploy to a real server:

### Recommended Hosting Options:

#### 1. **Vercel (Frontend) + Railway/Render (Backend)** - EASIEST
- **Frontend**: Deploy to Vercel (Free)
- **Backend**: Deploy to Railway or Render (Free tier available)
- **Database**: Use PlanetScale or Railway's MySQL (Free tier)

#### 2. **DigitalOcean/Linode** - FULL CONTROL
- Get a VPS (Virtual Private Server) - $5-10/month
- Install Node.js, MySQL, and Nginx
- Deploy both frontend and backend
- Set up your domain (tawasol.app)

#### 3. **AWS/Google Cloud** - ENTERPRISE
- More complex but highly scalable
- Free tier available for testing

---

## Current Status

✅ **Local Development URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

📡 **Public URLs (When tunnels are active):**
- Run `create-public-links.bat` to generate temporary public URLs
- URLs will be displayed in the tunnel windows

---

## Quick Commands

**Start local servers:**
```
START-ALL.bat
```

**Create public links:**
```
create-public-links.bat
```

**Stop everything:**
```
STOP-ALL.bat
```

---

## Need Help?

- LocalTunnel issues: Check that ports 3000 and 5173 are not blocked by firewall
- Connection errors: Make sure `START-ALL.bat` is running before creating tunnels
- Custom domain: You'll need to deploy to production to use custom domains

---

## Security Warning ⚠️

**For development/testing only!**
- These tunnels expose your local server to the internet
- Anyone with the link can access your CRM
- Don't use production data with temporary tunnels
- For real use, deploy to a proper production server

