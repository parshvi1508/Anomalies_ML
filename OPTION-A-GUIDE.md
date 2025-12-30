# 🚀 OPTION A: SEPARATE DEPLOYMENT GUIDE

## ✅ Implementation Complete

Your codebase is now configured for separate frontend/backend deployment:

```
┌──────────────┐
│   VERCEL     │ ← Next.js Frontend (TypeScript, React)
│  (Frontend)  │
└──────┬───────┘
       │
       │ HTTPS API Calls
       │
       ▼
┌──────────────┐
│   RENDER     │ ← FastAPI Backend (Python, ML Models)
│  (Backend)   │
└──────────────┘
```

---

## 📁 Files Created/Modified

### ✅ New Files
1. **`.vercelignore`** - Excludes Python files from Vercel deployment
2. **`src/lib/api-client.ts`** - Type-safe API client for frontend
3. **`.env.example`** - Environment variable template
4. **`OPTION-A-GUIDE.md`** - This guide

### ✅ Modified Files
1. **`app.py`** - Added CORS middleware for Vercel
2. **`package.json`** - Added lint and type-check scripts
3. **`vercel.json`** - Updated with API URL configuration
4. **`render.yaml`** - Fixed Python version and entry point
5. **`requirements.txt`** - Pinned compatible versions

---

## 🚀 DEPLOYMENT STEPS

### **STEP 1: Deploy Backend to Render** (Do This First)

#### A. Push to GitHub
```bash
git add .
git commit -m "Implement separate deployment architecture"
git push origin master
```

#### B. Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `student-analytics-api`
   - **Runtime**: `Python`
   - **Branch**: `master` (or `main`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

5. **Environment Variables**:
   - Key: `PYTHON_VERSION`
   - Value: `3.11.0`

6. Click **"Create Web Service"**

#### C. Wait for Deployment
- Monitor logs in Render dashboard
- Should see: ✅ "Build successful"
- Service URL: `https://student-analytics-api.onrender.com`

#### D. Test Backend
```bash
# Health check
curl https://student-analytics-api.onrender.com/

# Expected response:
{"message":"Service is running ✅","version":"1.0.0"}
```

---

### **STEP 2: Deploy Frontend to Vercel**

#### A. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### B. Set Environment Variables

In Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://student-analytics-api.onrender.com
   
   Environment: 
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

#### C. Deploy
- Click **"Deploy"**
- Wait for build to complete
- Your site will be live at: `https://your-project.vercel.app`

#### D. Test Frontend
1. Visit your Vercel URL
2. Check browser console for any errors
3. Test features that call the backend API

---

## 🔧 LOCAL DEVELOPMENT SETUP

### **1. Create .env.local**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **2. Run Backend (Terminal 1)**
```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run FastAPI server
uvicorn app:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`

### **3. Run Frontend (Terminal 2)**
```bash
# Install dependencies (first time only)
npm install

# Run Next.js dev server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 💻 USING THE API CLIENT

### Example: Fetch Recommendations

```typescript
// In your React component
import { getRecommendations } from '@/lib/api-client';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getRecommendations(userId, 5);
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => fetchRecommendations('U001')}>
        Get Recommendations
      </button>
      
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      <ul>
        {recommendations.map(rec => (
          <li key={rec.course_id}>{rec.course_name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example: Upload CSV

```typescript
import { analyzeCSV } from '@/lib/api-client';

const handleFileUpload = async (file: File) => {
  try {
    const result = await analyzeCSV(file);
    console.log('Analysis complete:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

## 🔍 VERIFY DEPLOYMENT

### Backend Checks (Render)

```bash
# 1. Health check
curl https://student-analytics-api.onrender.com/
# ✅ {"message":"Service is running ✅","version":"1.0.0"}

# 2. Test CORS headers
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://student-analytics-api.onrender.com/api/students
# ✅ Should return Access-Control-Allow-Origin header

# 3. Test endpoint (if data exists)
curl "https://student-analytics-api.onrender.com/api/students"
```

### Frontend Checks (Vercel)

1. **Open browser DevTools** (F12)
2. **Check Network tab**:
   - API calls should go to Render URL
   - Status: 200 OK
   - CORS errors: Should be none

3. **Check Console tab**:
   - No CORS errors
   - No 404 errors
   - API responses logged correctly

---

## 🐛 TROUBLESHOOTING

### Issue: CORS Error in Browser

**Symptoms:**
```
Access to fetch at 'https://...onrender.com' from origin 'https://...vercel.app' 
has been blocked by CORS policy
```

**Solution:**
1. Update `app.py` CORS origins:
```python
allow_origins=[
    "https://your-actual-app.vercel.app",  # Add your Vercel URL
    "https://*.vercel.app",
    "http://localhost:3000"
]
```
2. Redeploy backend to Render
3. Clear browser cache

---

### Issue: API URL Not Found

**Symptoms:**
- Frontend makes requests to `http://localhost:8000` in production
- Or requests go to wrong URL

**Solution:**
1. Check Vercel environment variables:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_API_URL` is set correctly
   - Value should be: `https://student-analytics-api.onrender.com`
2. Redeploy frontend
3. Hard refresh browser (Ctrl+Shift+R)

---

### Issue: Render Build Fails

**Check Python version:**
```bash
# In Render logs, look for:
"Python 3.11.0" ✅  # Good
"Python 3.13.0" ❌  # Bad - will fail on scikit-surprise
```

**Solution:**
- Ensure `runtime.txt` contains: `python-3.11.0`
- Ensure `render.yaml` has: `pythonVersion: 3.11.0`
- Clear build cache in Render dashboard
- Redeploy

---

### Issue: Vercel Tries to Install Python

**Symptoms:**
- Vercel build logs show: `pip install`
- Build fails with Python-related errors

**Solution:**
1. Check `.vercelignore` exists and includes:
   ```
   *.py
   requirements.txt
   ```
2. Remove any `src/app/requirements.txt`
3. Redeploy

---

## 📊 ARCHITECTURE BENEFITS

| Aspect | Benefit |
|--------|---------|
| **Performance** | Vercel CDN serves frontend globally |
| **Scalability** | Each service scales independently |
| **Cost** | Both on free tier |
| **Security** | Backend API can add auth layer |
| **Maintenance** | Clear separation of concerns |
| **Debugging** | Isolated logs for each service |

---

## 🎯 POST-DEPLOYMENT CHECKLIST

### Backend (Render)
- [ ] Service is deployed and running
- [ ] Health check returns 200 OK
- [ ] Python version is 3.11.0 (check logs)
- [ ] No build errors in logs
- [ ] CORS headers configured

### Frontend (Vercel)
- [ ] Site is deployed and accessible
- [ ] Environment variable `NEXT_PUBLIC_API_URL` is set
- [ ] No console errors
- [ ] No CORS errors
- [ ] API calls reach backend successfully

### End-to-End
- [ ] Can upload CSV files
- [ ] Can view student data
- [ ] Can get recommendations
- [ ] Can view analytics dashboard
- [ ] All features work as expected

---

## 📝 NEXT STEPS

1. ✅ Backend deployed to Render
2. ✅ Frontend deployed to Vercel
3. 🔄 Update CORS with actual Vercel URL
4. 🔄 Test all features
5. 🔄 Monitor logs for errors
6. 🔄 Set up custom domain (optional)

---

## 🆘 NEED HELP?

### Common Commands

```bash
# Check backend logs (Render Dashboard → Logs)
# or use Render CLI:
render logs student-analytics-api

# Check frontend logs (Vercel Dashboard → Deployments → Logs)
# or use Vercel CLI:
vercel logs

# Test API locally
uvicorn app:app --reload

# Test frontend locally
npm run dev
```

### Resources
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI CORS**: https://fastapi.tiangolo.com/tutorial/cors/
- **Next.js Env Variables**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

---

## ✨ SUCCESS CRITERIA

Your deployment is successful when:

1. ✅ Backend URL returns: `{"message":"Service is running ✅"}`
2. ✅ Frontend loads without errors
3. ✅ API calls from frontend reach backend
4. ✅ No CORS errors in browser console
5. ✅ All dashboard features work

**You're all set! 🎉**
