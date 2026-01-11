# 🚀 QUICK DEPLOYMENT COMMANDS

## 📦 Commit & Push Changes

```bash
git add .
git commit -m "Implement separate deployment: Vercel + Render"
git push origin master
```

---

## 🔧 Backend (Render)

### Deploy
1. Go to: https://dashboard.render.com/
2. New+ → Web Service → Connect GitHub
3. Settings:
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Python**: `3.11.0`

### Test
```bash
curl https://student-analytics-api.onrender.com/
```

---

## 🎨 Frontend (Vercel)

### Deploy
1. Go to: https://vercel.com/dashboard
2. New Project → Import GitHub
3. Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://student-analytics-api.onrender.com
   ```

### Test
Visit: `https://your-project.vercel.app`

---

## 💻 Local Development

### Backend (Terminal 1)
```bash
.\venv\Scripts\Activate.ps1
uvicorn app:app --reload
```
Runs at: http://localhost:8000

### Frontend (Terminal 2)
```bash
npm install  # First time only
npm run dev
```
Runs at: http://localhost:3000

---

## 📚 Full Guides
- **Complete Guide**: `OPTION-A-GUIDE.md`
- **Deployment Fix**: `DEPLOYMENT-FIX.md`
- **Full Analysis**: `DEPLOYMENT-ANALYSIS.md`
