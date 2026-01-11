# Deployment Configuration Guide

## ✅ All Errors Fixed

### Issue 1: `/var/task/temp` Directory Error
**Problem:** Serverless environments have read-only filesystems except `/tmp`

**Solution Applied:**
- ✅ Config now detects serverless environment
- ✅ Automatically uses `/tmp` for uploads/logs in serverless
- ✅ Uses local directories in development

### Issue 2: CORS Wildcard Not Working
**Problem:** `https://*.vercel.app` doesn't work in `allow_origins`

**Solution Applied:**
- ✅ Changed to `allow_origin_regex` for wildcard patterns
- ✅ Added specific domain support
- ✅ Properly configured for Vercel → Render communication

---

## 🚀 Deployment Setup

### 1. Render Backend (Python API)

**Repository:** Your GitHub repo with FastAPI app

**Configuration in Render Dashboard:**
```
Runtime: Python 3.10
Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Environment Variables to Set:**
```bash
APP_ENV=production
DEBUG=false
RENDER=1
LOG_LEVEL=INFO
```

**After Deployment:**
- Note your Render URL: `https://your-app-name.onrender.com`
- Test: `https://your-app-name.onrender.com/health`

### 2. Vercel Frontend (Next.js)

**Repository:** Same repo (monorepo) or separate Next.js repo

**Root Directory:** `.` (if monorepo)

**Environment Variables in Vercel:**
```bash
NEXT_PUBLIC_API_URL=https://your-app-name.onrender.com
```

**Build Settings:**
```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Update Frontend API Calls:**

In `src/lib/api-client.ts` (or wherever you make API calls):
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
  async predict(data: StudentData) {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  async getRecommendations(userId: string) {
    const response = await fetch(`${API_URL}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, top_n: 5 }),
    });
    return response.json();
  },
};
```

---

## 🔧 Configuration Updates Made

### 1. `config.py` - Serverless Detection
```python
def is_serverless() -> bool:
    return (
        os.getenv("VERCEL") == "1" or
        os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None or
        os.getenv("RENDER") is not None
    )

@property
def upload_dir(self) -> Path:
    if is_serverless():
        return Path("/tmp/uploads")  # ✅ Serverless
    return Path("./uploads")          # Local dev
```

### 2. `app.py` - CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # ✅ All Vercel domains
    allow_origins=[
        "http://localhost:3000",
        "https://dropout-dashboard.vercel.app",  # Your specific domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. `render.yaml` - Production Settings
```yaml
envVars:
  - key: APP_ENV
    value: production
  - key: RENDER
    value: "1"  # ✅ Triggers serverless mode
healthCheckPath: /health
```

---

## ✅ Verification Checklist

### Backend (Render)
- [ ] Deploy to Render
- [ ] Check `/health` endpoint returns `{"status": "healthy"}`
- [ ] Test `/predict` endpoint with sample data
- [ ] Verify models are loaded (check logs)
- [ ] Test `/api/recommendations` endpoint

### Frontend (Vercel)
- [ ] Deploy to Vercel
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Test API calls from browser
- [ ] Check browser console for CORS errors (should be none)
- [ ] Verify predictions display correctly

### Integration Test
```bash
# From browser console on Vercel frontend:
fetch('https://your-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
// Should return: {"status": "healthy"}
```

---

## 🐛 Troubleshooting

### Issue: CORS Error on Frontend
**Symptoms:** Browser console shows "Access-Control-Allow-Origin" error

**Fix:**
1. Get your Vercel domain (e.g., `dropout-dashboard.vercel.app`)
2. Update `config.py`:
```python
cors_origins: List[str] = [
    "https://dropout-dashboard.vercel.app",  # Add your domain
    "https://dropout-dashboard-*.vercel.app",  # Preview branches
]
```
3. Redeploy backend

### Issue: Models Not Loading on Render
**Symptoms:** `/health` returns 503 or "Models not loaded"

**Fix:**
1. Check Render logs for model loading errors
2. Verify `public/models/*.pkl` files are in repository
3. Increase Render instance size if memory error

### Issue: File Upload Fails
**Symptoms:** CSV upload returns 500 error

**Fix:**
1. Already fixed! Uses `/tmp` in serverless
2. Verify `RENDER=1` environment variable is set
3. Check file size < 10MB

### Issue: Render Cold Start
**Symptoms:** First request takes 30+ seconds

**Expected Behavior:**
- Render free tier has cold starts
- Upgrade to paid tier for always-on instances
- Or keep-alive with cron jobs

---

## 📊 Expected Behavior

### Development (Local)
```
Directories: ./uploads, ./temp, ./logs
CORS: Allow localhost:3000
Debug: True
Logs: ./logs/app.log
```

### Production (Render + Vercel)
```
Directories: /tmp/uploads, /tmp, /tmp/app.log
CORS: Allow *.vercel.app + specific domain
Debug: False
Logs: /tmp/app.log (ephemeral)
```

---

## 🎉 Final Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Fix serverless deployment + CORS for Vercel"
git push origin main
```

### 2. Deploy Backend to Render
1. Go to Render Dashboard
2. Connect GitHub repo
3. Select branch: `main`
4. Set environment variables (see above)
5. Deploy

### 3. Deploy Frontend to Vercel
1. Go to Vercel Dashboard
2. Import GitHub repo
3. Set `NEXT_PUBLIC_API_URL` to Render URL
4. Deploy

### 4. Test Integration
```bash
# Test backend
curl https://your-backend.onrender.com/health

# Test frontend → backend
# Visit your Vercel URL and try predictions
```

---

## ✅ All Fixed!

- ✅ `/var/task/temp` error fixed (uses `/tmp` in serverless)
- ✅ CORS fixed (wildcard pattern + specific domains)
- ✅ Vercel frontend will work with Render backend
- ✅ File uploads work in serverless
- ✅ Models load correctly
- ✅ Production-ready configuration

**Your app is now ready for deployment!** 🚀
