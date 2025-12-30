# 🚀 DEPLOYMENT GUIDE: Frontend (Vercel) + Backend (Render)

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         PRODUCTION SETUP                          │
└──────────────────────────────────────────────────────────────────┘

    USER BROWSER
         │
         ▼
┌─────────────────────────┐
│   VERCEL (Frontend)     │
│   - Next.js Pages       │
│   - React Components    │
│   - Static Assets       │
│   - Tailwind CSS        │
└──────────┬──────────────┘
           │
           │ HTTPS API Calls
           ▼
┌─────────────────────────┐
│   RENDER (Backend)      │
│   - FastAPI Server      │
│   - Python Scripts      │
│   - ML Models (.pkl)    │
│   - CSV Data            │
│   - Recommender System  │
└─────────────────────────┘
```

**Key Concept:** Frontend on Vercel makes API calls to Backend on Render

---

## 📦 STEP 1: Prepare Backend for Render

### 1.1 Create Standalone FastAPI Backend

Create `backend/app.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))
from recommender.hybrid_recommender import HybridRecommender

app = FastAPI(title="Dropout Dashboard API")

# CORS - Allow Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # Replace with your Vercel URL
        "http://localhost:3000",  # Development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data on startup
data_dir = Path(__file__).parent.parent / "data"
courses_df = pd.read_csv(data_dir / "courses.csv")
user_prefs_df = pd.read_csv(data_dir / "user_preferences.csv")
interactions_df = pd.read_csv(data_dir / "user_course_interactions.csv")

# Initialize recommender
recommender = HybridRecommender(courses_df, user_prefs_df, interactions_df)

@app.get("/")
def read_root():
    return {"message": "Dropout Dashboard API", "status": "running"}

@app.get("/api/recommendations")
def get_recommendations(user_id: str, top_n: int = 5):
    """Get course recommendations for a user"""
    try:
        recommendations = recommender.recommend(user_id, top_n=top_n)
        return {
            "user_id": user_id,
            "recommendations": recommendations.to_dict('records'),
            "count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/at-risk")
def get_at_risk_recommendations(data: dict):
    """Get recommendations for at-risk students"""
    try:
        user_id = data.get("user_id")
        risk_factors = data.get("risk_factors", {})
        top_n = data.get("top_n", 5)
        
        recommendations = recommender.recommend_for_at_risk_student(
            user_id, risk_factors, top_n
        )
        return {
            "user_id": user_id,
            "recommendations": recommendations.to_dict('records'),
            "count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students")
def get_students():
    """Get student risk data"""
    try:
        uploads_dir = Path(__file__).parent.parent / "uploads"
        df = pd.read_csv(uploads_dir / "student_data_with_risk.csv")
        return df.to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 1.2 Create `backend/requirements.txt`

```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pandas==2.2.2
numpy==1.26.4
scikit-learn==1.5.1
scikit-surprise==1.1.4
scipy==1.14.0
python-multipart==0.0.9
```

### 1.3 Create `render-backend.yaml`

```yaml
services:
  - type: web
    name: dropout-dashboard-backend
    runtime: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.app:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
    healthCheckPath: /
```

---

## 📦 STEP 2: Prepare Frontend for Vercel

### 2.1 Update API Calls to Use Backend URL

Create `src/lib/config.ts`:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  recommendations: `${API_BASE_URL}/api/recommendations`,
  atRiskRecommendations: `${API_BASE_URL}/api/recommendations/at-risk`,
  students: `${API_BASE_URL}/api/students`,
  analyze: `${API_BASE_URL}/api/analyze`,
};
```

### 2.2 Update API Routes to Proxy

**Option A: Remove API routes** (let frontend call backend directly)

Delete:
- `src/app/api/recommendations/route.ts`
- `src/app/api/recommendations/at-risk/route.ts`
- `src/app/api/students/route.ts`

**Option B: Keep API routes as proxy** (recommended for security)

Update `src/app/api/recommendations/route.ts`:

```typescript
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const top_n = searchParams.get('top_n') || '5';

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/recommendations?user_id=${user_id}&top_n=${top_n}`
    );
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 2.3 Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend.onrender.com"
  }
}
```

---

## 🚀 STEP 3: Deploy Backend to Render

### 3.1 Via Render Dashboard (Easiest)

1. **Go to:** https://render.com
2. **Sign in** with GitHub
3. **Click:** "New" → "Web Service"
4. **Connect Repository:** Select your GitHub repo
5. **Configure:**
   - **Name:** `dropout-dashboard-backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free (for testing)
6. **Add Files to Deploy:**
   - Ensure `backend/app.py` exists
   - Ensure `backend/requirements.txt` exists
   - Ensure `data/` folder with CSV files
   - Ensure `recommender/` folder with Python modules
7. **Click:** "Create Web Service"
8. **Wait:** 5-10 minutes for build
9. **Copy URL:** `https://dropout-dashboard-backend.onrender.com`

### 3.2 Via Render YAML (Automated)

```bash
# Already have render.yaml, just modify it
# Push to GitHub, Render auto-deploys
git add .
git commit -m "Configure backend for Render"
git push
```

---

## 🚀 STEP 4: Deploy Frontend to Vercel

### 4.1 Via Vercel Dashboard

1. **Go to:** https://vercel.com
2. **Sign in** with GitHub
3. **Click:** "Add New" → "Project"
4. **Import Repository:** Select your repo
5. **Configure:**
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
6. **Environment Variables:**
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://dropout-dashboard-backend.onrender.com`
   - **Key:** `API_BASE_URL` (for server-side)
   - **Value:** `https://dropout-dashboard-backend.onrender.com`
7. **Click:** "Deploy"
8. **Wait:** 2-3 minutes
9. **Your URL:** `https://your-app.vercel.app`

### 4.2 Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: dropout-dashboard
# - Directory: ./
# - Override settings? No

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://dropout-dashboard-backend.onrender.com

# Deploy to production
vercel --prod
```

---

## 🔧 STEP 5: Update CORS in Backend

After deploying frontend, update `backend/app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # ← Replace with actual Vercel URL
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push:
```bash
git add backend/app.py
git commit -m "Update CORS for Vercel"
git push
# Render auto-deploys
```

---

## ✅ STEP 6: Verify Deployment

### 6.1 Test Backend

```bash
# Health check
curl https://dropout-dashboard-backend.onrender.com/

# Test recommendations
curl "https://dropout-dashboard-backend.onrender.com/api/recommendations?user_id=U001&top_n=5"
```

### 6.2 Test Frontend

1. Visit: `https://your-app.vercel.app`
2. Navigate to: `/recommendations`
3. Enter User ID: `U001`
4. Click: "Get Recommendations"
5. Should see recommendations from backend

---

## 📁 Final Project Structure

```
dropout-dashboard/
├── backend/                      ← New folder for Render
│   ├── app.py                   ← FastAPI server
│   └── requirements.txt         ← Python dependencies
│
├── data/                        ← CSV data (deployed to Render)
│   ├── courses.csv
│   ├── user_preferences.csv
│   └── user_course_interactions.csv
│
├── recommender/                 ← Python modules (deployed to Render)
│   ├── __init__.py
│   ├── content_based.py
│   ├── collaborative_filtering.py
│   └── hybrid_recommender.py
│
├── src/                         ← Next.js app (deployed to Vercel)
│   ├── app/
│   │   ├── page.tsx
│   │   ├── recommendations/page.tsx
│   │   └── api/                ← Optional: Proxy routes
│   │       └── recommendations/route.ts
│   ├── components/
│   └── lib/
│       └── config.ts           ← API configuration
│
├── public/                      ← Static assets (Vercel)
│   └── models/                 ← ML models (move to Render for backend)
│
├── vercel.json                 ← Vercel config
├── render-backend.yaml         ← Render config
└── package.json                ← Node.js dependencies
```

---

## 🔑 Environment Variables

### Vercel (Frontend)
```bash
NEXT_PUBLIC_API_URL=https://dropout-dashboard-backend.onrender.com
API_BASE_URL=https://dropout-dashboard-backend.onrender.com
```

### Render (Backend)
```bash
PYTHON_VERSION=3.11.0
PORT=8000  # Auto-set by Render
```

---

## 🐛 Troubleshooting

### Issue 1: CORS Errors

**Symptom:** Browser console shows "CORS policy" error

**Fix:**
```python
# backend/app.py
allow_origins=["https://your-actual-vercel-url.vercel.app"]
```

### Issue 2: Backend Cold Starts

**Symptom:** First request takes 30+ seconds

**Fix:** Use Render's paid plan or keep-alive service
```bash
# Use cron-job.org to ping backend every 10 minutes
# URL: https://your-backend.onrender.com/
```

### Issue 3: File Not Found on Render

**Symptom:** `FileNotFoundError: data/courses.csv`

**Fix:** Ensure files are committed to Git
```bash
git add data/ recommender/ backend/
git commit -m "Add backend files"
git push
```

### Issue 4: Module Import Errors

**Symptom:** `ModuleNotFoundError: No module named 'recommender'`

**Fix:** Update `backend/app.py`:
```python
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
```

---

## 💰 Cost Comparison

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | 100GB bandwidth/month | $20/month (Pro) |
| **Render** | 750 hours/month (sleeps after 15min idle) | $7/month (always on) |
| **Total** | **$0/month** (with limitations) | **$27/month** |

---

## 🎯 Deployment Checklist

### Backend (Render)
- [ ] Create `backend/app.py` with FastAPI
- [ ] Create `backend/requirements.txt`
- [ ] Move ML models to backend folder
- [ ] Update file paths to be relative
- [ ] Test locally: `uvicorn backend.app:app --reload`
- [ ] Push to GitHub
- [ ] Connect Render to GitHub repo
- [ ] Configure build/start commands
- [ ] Deploy and verify health endpoint
- [ ] Note backend URL

### Frontend (Vercel)
- [ ] Create `src/lib/config.ts` with API URL
- [ ] Update API calls to use config
- [ ] Remove Python dependencies from package.json (optional)
- [ ] Test locally with backend URL
- [ ] Push to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Add environment variables
- [ ] Deploy
- [ ] Note frontend URL

### Post-Deployment
- [ ] Update CORS in backend with Vercel URL
- [ ] Test recommendations endpoint
- [ ] Test student data endpoint
- [ ] Test at-risk recommendations
- [ ] Monitor backend logs
- [ ] Set up error tracking (Sentry)

---

## 🚀 Quick Start Commands

```bash
# LOCAL DEVELOPMENT

# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 2: Frontend
npm run dev

# Visit: http://localhost:3000


# DEPLOYMENT

# Backend (Render)
# → Use render.com dashboard
# → Connect GitHub repo
# → Auto-deploys on push

# Frontend (Vercel)
vercel --prod

# Or use vercel.com dashboard
```

---

## 📚 Additional Resources

- [Render Python Deployment Docs](https://render.com/docs/deploy-python)
- [Vercel Next.js Deployment Docs](https://vercel.com/docs/frameworks/nextjs)
- [FastAPI CORS Guide](https://fastapi.tiangolo.com/tutorial/cors/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ You're All Set!

Your architecture:
- ✅ **Frontend (Vercel):** Fast, global CDN, auto-scaling
- ✅ **Backend (Render):** Python runtime, ML models, CSV storage
- ✅ **Communication:** HTTPS REST API
- ✅ **Cost:** Free tier available
- ✅ **Scalability:** Both platforms auto-scale

Happy deploying! 🎉
