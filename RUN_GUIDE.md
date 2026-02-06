# ⚡ SONICPULSE HYBRID: RUN GUIDE

### 🛠️ PREREQUISITES
1. **Node.js**: Installed.
2. **FFmpeg**: Installed locally (for Windows tests).
3. **Internet**: Required for the backend to fetch YouTube data.

---

### 🔥 BOOT SEQUENCE (DUAL TERMINAL)

**1. IGNITE ENGINE (BACKEND)**
*Runs on port 10000*
Open **Terminal A**:
```powershell
cd backend-render
npm run dev
```

**2. LIGHT UP FRONTEND (VISUALS)**
*Runs on port 5173*
Open **Terminal B**:
```powershell
npm run dev
```

---

### 🚀 DEPLOYMENT GUIDE (FREE TIER)

**A. FRONTEND (Firebase Hosting)**
```powershell
npm run build
firebase deploy --only hosting
```

**B. BACKEND (Render.com)**
1. Push your code to GitHub.
2. Create a new **Web Service** on Render.
3. Select the `backend-render` folder as the **Root Directory**.
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Render will automatically use the defined `Dockerfile`.
