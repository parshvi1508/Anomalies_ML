# 🏗️ COMPLETE SYSTEM ARCHITECTURE & WORKING LOGIC

## 📊 SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (Next.js)                     │
│  Dashboard | Students | Recommendations | Upload | Analysis | Models │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js API Routes)                    │
│  /api/students  |  /api/recommendations  |  /api/analyze-python    │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  Python Child Process  │ (spawn Python scripts from Node.js)
    └────────────┬───────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PYTHON PROCESSING LAYER                          │
│  1. Recommender System   2. Anomaly Detection   3. Data Analysis    │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (CSV Files)                            │
│  courses.csv | user_preferences.csv | interactions.csv | models/    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE DATA FLOW

### **Flow 1: Recommendation System**

```
1. USER ACTION (Frontend)
   ├─ User enters User ID: "U001"
   ├─ Selects top_n: 5
   └─ Clicks "Get Recommendations"

2. API REQUEST (Next.js API Route)
   ├─ GET /api/recommendations?user_id=U001&top_n=5
   └─ Route handler: src/app/api/recommendations/route.ts

3. PYTHON SCRIPT EXECUTION
   ├─ spawn('python', ['scripts/get_recommendations.py', '{"user_id":"U001","top_n":5}'])
   └─ Script receives parameters as JSON string

4. DATA LOADING (Python)
   ├─ Load data/courses.csv → DataFrame with 25 courses
   ├─ Load data/user_preferences.csv → User profile for U001
   └─ Load data/user_course_interactions.csv → U001's interaction history

5. HYBRID RECOMMENDER INITIALIZATION
   ├─ ContentBasedRecommender
   │   ├─ Create TF-IDF matrix from course descriptions
   │   ├─ Shape: (25 courses × 100 features)
   │   └─ Compute cosine similarity matrix (25×25)
   │
   ├─ CollaborativeFilteringRecommender
   │   ├─ Load interaction ratings
   │   ├─ Train SVD model (50 factors, 20 epochs)
   │   └─ Split: 80% train, 20% test
   │
   └─ HybridRecommender combines both

6. RECOMMENDATION GENERATION
   ├─ Step 1: Content-Based Score
   │   ├─ Build user profile from U001's completed courses
   │   ├─ Weight by ratings: course_vector * implicit_rating
   │   ├─ Compute similarity: cosine(user_profile, all_courses)
   │   └─ Output: content_score for each course (0-1)
   │
   ├─ Step 2: Collaborative Filtering Score
   │   ├─ For each candidate course:
   │   │   └─ predicted_rating = SVD.predict(U001, course_id)
   │   └─ Normalize to 0-1: cf_score = predicted_rating / 5.0
   │
   ├─ Step 3: Rule-Based Score
   │   ├─ Match domain interests: +0.3 if domain matches
   │   ├─ Match learning pace: +0.2 if format suits pace
   │   ├─ Match cost preference: +0.25 if cost aligns
   │   ├─ Match platform preference: +0.15 if platform preferred
   │   ├─ Match difficulty: +0.1 if difficulty matches level
   │   └─ Normalize: rule_score (0-1)
   │
   ├─ Step 4: Popularity Score
   │   ├─ Count enrollments per course
   │   ├─ Combine with rating: (rating/5)*0.6 + (enrollments/10)*0.4
   │   └─ Output: popularity_score (0-1)
   │
   └─ Step 5: Hybrid Combination
       ├─ hybrid_score = content_score*0.35 + cf_score*0.40 + 
       │                 rule_score*0.15 + popularity_score*0.10
       ├─ Sort by hybrid_score descending
       └─ Return top 5 courses

7. JSON RESPONSE
   {
     "user_id": "U001",
     "recommendations": [
       {
         "course_id": "C002",
         "title": "Advanced Machine Learning",
         "hybrid_score": 0.8523,
         "content_score": 0.7841,
         "cf_score": 0.9012,
         ...
       }
     ],
     "count": 5
   }

8. FRONTEND DISPLAY
   └─ Render recommendation cards with scores
```

---

### **Flow 2: Student Risk Assessment**

```
1. DATA SOURCE
   uploads/student_data_with_risk.csv
   ├─ Contains: student_id, gpa, attendance, risk_score, risk_category
   └─ Generated by final_anomaly&dropout.ipynb notebook

2. API REQUEST
   GET /api/students

3. DATA PROCESSING (route.ts)
   ├─ Read CSV file with csv-parser
   ├─ Parse each row:
   │   ├─ student_id: string
   │   ├─ risk_score: parseFloat()
   │   └─ risk_category: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Extreme Risk'
   └─ Group by risk_category

4. RESPONSE
   {
     "Low Risk": [{ student_id, name, risk_score, ... }],
     "Moderate Risk": [...],
     "High Risk": [...],
     "Extreme Risk": [...]
   }

5. FRONTEND
   ├─ /students page displays all students
   ├─ Filter by risk category
   ├─ Sort by risk score
   └─ Click student → /students/[id] detail page
```

---

### **Flow 3: Anomaly Detection & Dropout Prediction**

**This happens in the Jupyter Notebook (offline training):**

```
STEP 1: DATA GENERATION
├─ Generate synthetic student data (10,000 students)
├─ Features: gpa, attendance, failed_courses, feedback_engagement,
│            late_assignments, forum_participation, clicks_per_week, etc.
└─ Save: student_dropout_dataset.csv

STEP 2: ANOMALY DETECTION (Isolation Forest)
├─ Input Features: clicks_per_week, days_active, forum_participation
├─ Model: IsolationForest(contamination=0.1, n_estimators=100)
├─ Training:
│   ├─ Build isolation trees by random splitting
│   ├─ Anomalies have shorter path lengths (easier to isolate)
│   └─ Compute anomaly_score for each student (0-1)
├─ Output: 
│   ├─ anomaly_score: 0 (normal) to 1 (anomaly)
│   └─ is_anomaly: -1 (anomaly) or 1 (normal)
└─ Save: public/models/anomaly_model.pkl

STEP 3: FEATURE ENHANCEMENT
├─ Add anomaly_score to original dataset
├─ Create interaction features:
│   ├─ anomaly_gpa = anomaly_score * gpa
│   ├─ anomaly_attendance = anomaly_score * attendance
│   └─ anomaly_engagement = anomaly_score * feedback_engagement
└─ Enhanced feature set: 16 original + 4 anomaly features

STEP 4: DROPOUT PREDICTION (Random Forest)
├─ Input: All features (20 total)
├─ Model: RandomForestClassifier(n_estimators=100, class_weight='balanced')
├─ SMOTE: Balance classes (oversample minority dropout class)
├─ Training:
│   ├─ 80% train, 20% test
│   ├─ Build 100 decision trees
│   ├─ Each tree votes on dropout/non-dropout
│   └─ Majority vote = final prediction
├─ Output:
│   ├─ dropout_probability (0-1)
│   └─ dropout_prediction (0 or 1)
└─ Save: public/models/dropout_model.pkl

STEP 5: DEMPSTER-SHAFER EVIDENCE COMBINATION
├─ Combine 3 evidence sources:
│   1. Anomaly Score
│   2. Dropout Probability
│   3. Expert Rules (low GPA, poor attendance, failed courses)
│
├─ Convert to Mass Functions:
│   m(dropout) = probability * (1 - uncertainty)
│   m(no_dropout) = (1 - probability) * (1 - uncertainty)
│   m(Θ) = uncertainty (ignorance)
│
├─ Dempster's Rule of Combination:
│   m₁₂(A) = Σ{m₁(X) × m₂(Y) : X∩Y=A} / (1 - conflict)
│
├─ Calculate:
│   ├─ Belief(dropout): Lower bound of certainty
│   ├─ Plausibility(dropout): Upper bound of certainty
│   └─ Uncertainty: Plausibility - Belief
│
└─ Output:
    ├─ belief_score (0-1)
    ├─ plausibility_score (0-1)
    ├─ uncertainty (0-1)
    └─ risk_category: Based on belief threshold

STEP 6: RISK CATEGORIZATION
├─ If belief_score >= 0.7 → "Extreme Risk"
├─ If belief_score >= 0.5 → "High Risk"
├─ If belief_score >= 0.3 → "Moderate Risk"
└─ If belief_score < 0.3 → "Low Risk"

STEP 7: SAVE RESULTS
├─ Save models:
│   ├─ public/models/anomaly_model.pkl
│   ├─ public/models/dropout_model.pkl
│   └─ public/models/ds_combiner.pkl
└─ Save predictions: uploads/student_data_with_risk.csv
```

---

### **Flow 4: Data Upload & Analysis**

```
1. USER UPLOADS CSV
   ├─ /upload page
   ├─ Select student_data.csv
   └─ Click upload

2. API REQUEST
   POST /api/analyze-python
   ├─ FormData with file
   └─ File validation: .csv only

3. FILE PROCESSING
   ├─ Save to temp/[timestamp]_[filename].csv
   └─ Pass file path to Python script

4. PYTHON ANALYSIS
   scripts/explore_student_data.py
   ├─ Load CSV into pandas DataFrame
   ├─ Calculate statistics:
   │   ├─ Total records
   │   ├─ Total features
   │   └─ Dropout rate
   ├─ Generate visualizations:
   │   ├─ Correlation heatmap (matplotlib/seaborn)
   │   ├─ Feature distributions by dropout
   │   ├─ Boxplots by dropout status
   │   └─ GPA vs Attendance scatter plot
   ├─ Convert plots to base64 images
   └─ Return JSON with plots

5. RESPONSE
   {
     "overview": { total_records, total_features, dropout_rate },
     "plots": {
       "correlation_heatmap": "data:image/png;base64,...",
       "feature_distributions": "data:image/png;base64,...",
       ...
     }
   }

6. FRONTEND DISPLAY
   └─ Render base64 images in <Image> components
```

---

## 🧮 MODEL DETAILS

### **Model 1: Content-Based Recommender**

**Input:**
```python
courses_df: DataFrame
    - course_id, title, description, domain, difficulty, 
      format, platform, learning_objectives, rating

user_interactions: DataFrame
    - user_id, course_id, rating, time_spent_hours, 
      completion_status, implicit_rating
```

**Processing:**
```python
# Step 1: TF-IDF Vectorization
combined_text = title + domain + description + objectives
tfidf_matrix = TfidfVectorizer(max_features=100).fit_transform(combined_text)
# Shape: (25 courses, 100 features)

# Step 2: User Profile
user_courses = interactions[user_id's completed courses]
user_vector = weighted_average(
    course_vectors, 
    weights=implicit_ratings
)
# Shape: (1, 100)

# Step 3: Similarity
similarities = cosine_similarity(user_vector, tfidf_matrix)
# Shape: (1, 25)

# Step 4: Rank
top_courses = courses.sort_by(similarities, descending=True).head(5)
```

**Output:**
```python
DataFrame: [course_id, title, similarity_score (0-1)]
```

---

### **Model 2: Collaborative Filtering (SVD)**

**Input:**
```python
ratings_matrix: DataFrame
    user_id | course_id | rating (1-5)
    U001    | C001      | 5
    U001    | C003      | 4
    U002    | C005      | 5
```

**Processing:**
```python
# Step 1: Matrix Factorization
# R ≈ U × V^T
# R: user-item rating matrix (m×n)
# U: user factors (m×k), k=50 latent factors
# V: item factors (n×k)

svd = SVD(n_factors=50, n_epochs=20)
svd.fit(trainset)

# Step 2: Prediction
predicted_rating = U[user_id] · V[course_id]^T
# Dot product of user and item latent vectors

# Step 3: Normalize
cf_score = predicted_rating / 5.0  # Convert to 0-1
```

**Output:**
```python
predicted_rating: float (1-5 scale)
```

---

### **Model 3: Isolation Forest (Anomaly Detection)**

**Input:**
```python
behavioral_features: DataFrame
    clicks_per_week, days_active, forum_participation,
    study_group, meeting_attendance
```

**Processing:**
```python
# Build isolation trees
for each tree:
    1. Randomly sample features
    2. Randomly split data between min and max
    3. Recursively split until all points isolated
    
# Anomaly scoring
anomaly_score = 2^(-average_path_length / c(n))
# where c(n) = expected path length for n samples

# Shorter path = more anomalous
```

**Output:**
```python
anomaly_score: float (0-1)
is_anomaly: int (-1 or 1)
```

---

### **Model 4: Random Forest (Dropout Prediction)**

**Input:**
```python
student_features: DataFrame (20 features)
    gpa, attendance, failed_courses, late_assignments,
    anomaly_score, anomaly_gpa, anomaly_attendance, ...
```

**Processing:**
```python
# Build 100 decision trees
for each tree:
    1. Bootstrap sample from training data
    2. At each split, randomly select subset of features
    3. Find best split using Gini impurity
    4. Build tree until stopping criteria
    
# Prediction
dropout_probability = average(
    tree1.predict_proba(student),
    tree2.predict_proba(student),
    ...
    tree100.predict_proba(student)
)
```

**Output:**
```python
dropout_probability: float (0-1)
dropout_prediction: int (0 or 1)
```

---

### **Model 5: Dempster-Shafer Combiner**

**Input:**
```python
anomaly_score: float (0-1)
dropout_probability: float (0-1)
expert_rules: dict
    {
        'low_gpa': bool,
        'poor_attendance': bool,
        'failed_courses': bool
    }
```

**Processing:**
```python
# Convert to mass functions
def to_mass(prob, uncertainty):
    return {
        'dropout': prob * (1 - uncertainty),
        'no_dropout': (1 - prob) * (1 - uncertainty),
        'ignorance': uncertainty
    }

m1 = to_mass(anomaly_score, u1)
m2 = to_mass(dropout_probability, u2)
m3 = to_mass(expert_rules_score, u3)

# Dempster's combination
def combine(m1, m2):
    combined = {}
    for A in m1:
        for B in m2:
            intersection = A ∩ B
            if intersection ≠ ∅:
                combined[intersection] += m1[A] * m2[B]
    
    # Normalize by conflict
    conflict = Σ(m1[A] * m2[B]) where A ∩ B = ∅
    for key in combined:
        combined[key] /= (1 - conflict)
    
    return combined

final_mass = combine(combine(m1, m2), m3)

# Calculate belief and plausibility
belief = final_mass['dropout']
plausibility = belief + final_mass['ignorance']
uncertainty = plausibility - belief
```

**Output:**
```python
belief_score: float (0-1)
plausibility_score: float (0-1)
uncertainty: float (0-1)
risk_category: str
```

---

## 🚀 DEPLOYMENT TO NEXT.JS (PRODUCTION)

### **✅ What WILL Work:**

1. **Next.js Frontend**
   - All React components ✅
   - API Routes ✅
   - Static assets ✅
   - CSS/Tailwind ✅

2. **CSV Data Storage**
   - CSV files in `/data` folder ✅
   - CSV files in `/uploads` folder ✅
   - Works on Vercel, Netlify, etc. ✅

3. **Python Script Execution**
   - **IF** Python runtime is available ⚠️
   - Works on: Railway, Render, AWS, DigitalOcean ✅
   - **DOES NOT** work on: Vercel (serverless) ❌

### **⚠️ DEPLOYMENT CHALLENGES:**

#### **Challenge 1: Python Runtime**

**Problem:** Vercel (most common Next.js host) doesn't support Python child processes

**Solutions:**

**Option A: Use Vercel Python Runtime**
```typescript
// Convert to serverless functions
// api/recommendations.py (Python serverless function)
// api/recommendations/route.ts calls api/recommendations.py
```

**Option B: Separate Python Backend**
```
Frontend (Next.js) → Vercel
Backend (Python FastAPI) → Railway/Render/Heroku
   ↓
API Gateway pattern
```

**Option C: Use Platform with Python Support**
- Railway ✅ (Node + Python)
- Render ✅ (Node + Python)
- AWS Elastic Beanstalk ✅
- DigitalOcean App Platform ✅

#### **Challenge 2: File System Access**

**Problem:** Serverless environments have read-only file systems (except /tmp)

**Solutions:**
- Store CSV files in object storage (AWS S3, Vercel Blob)
- Use database instead (PostgreSQL, MongoDB)
- Embed small datasets in code

#### **Challenge 3: Model Loading**

**Problem:** Loading large .pkl files on cold starts is slow

**Solutions:**
- Pre-load models in serverless function
- Use model serving platforms (AWS SageMaker, Google AI Platform)
- Cache models in memory

---

## 📋 RECOMMENDED DEPLOYMENT ARCHITECTURE

### **Architecture 1: Monolithic (Railway/Render)**

```
┌─────────────────────────────────────┐
│    Railway/Render Container         │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  Next.js App (Node.js)      │  │
│  │  - Frontend                  │  │
│  │  - API Routes                │  │
│  └────────────┬────────────────┘  │
│               │                    │
│               ▼                    │
│  ┌─────────────────────────────┐  │
│  │  Python Scripts              │  │
│  │  - Recommender System        │  │
│  │  - spawn() calls work        │  │
│  └─────────────────────────────┘  │
│               │                    │
│               ▼                    │
│  ┌─────────────────────────────┐  │
│  │  CSV Files & Models          │  │
│  │  - /data/*.csv               │  │
│  │  - /public/models/*.pkl      │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Pros:** Simple, everything in one place
**Cons:** Harder to scale independently

---

### **Architecture 2: Microservices (Recommended for Scale)**

```
┌────────────────────┐
│  Vercel (Frontend) │
│  Next.js App       │
└──────────┬─────────┘
           │
           │ HTTPS
           ▼
┌────────────────────────────────┐
│  API Gateway / Load Balancer   │
└──────────┬─────────────────────┘
           │
     ┌─────┴─────┬──────────────┐
     │           │              │
     ▼           ▼              ▼
┌─────────┐ ┌─────────┐  ┌──────────┐
│Recommend│ │ Anomaly │  │ Analysis │
│ Service │ │ Service │  │ Service  │
│(FastAPI)│ │(FastAPI)│  │(FastAPI) │
│ Python  │ │ Python  │  │ Python   │
└────┬────┘ └────┬────┘  └────┬─────┘
     │           │              │
     └───────────┴──────────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │  Cloud Storage       │
      │  - CSV Files (S3)    │
      │  - Models (S3)       │
      └─────────────────────┘
```

**Pros:** Scalable, independent deployment
**Cons:** More complex, higher cost

---

## 🛠️ DEPLOYMENT STEPS

### **Option 1: Railway (Easiest)**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add start script to package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "railway:build": "npm install && pip install -r requirements.txt && npm run build"
  }
}

# 5. Create railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run railway:build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

# 6. Deploy
railway up
```

### **Option 2: Render**

```yaml
# render.yaml (already in your project!)
services:
  - type: web
    name: dropout-dashboard
    env: node
    buildCommand: npm install && pip install -r requirements.txt && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### **Option 3: Docker (Any Platform)**

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install dependencies
RUN npm install
RUN pip3 install -r requirements.txt

# Copy app
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## ✅ FINAL DEPLOYMENT CHECKLIST

- [ ] Python runtime available on hosting platform
- [ ] All dependencies in requirements.txt
- [ ] CSV files committed to repo or uploaded to storage
- [ ] Trained models (.pkl files) in public/models/
- [ ] Environment variables configured
- [ ] Build command includes Python dependencies
- [ ] File paths are relative, not absolute
- [ ] Error handling for missing files
- [ ] CORS configured if using separate backend
- [ ] API routes tested in production

---

## 🎯 SUMMARY

**Your system works as:**

1. **Next.js frontend** displays UI
2. **API Routes** receive requests
3. **Python scripts** execute via spawn()
4. **CSV files** provide data storage
5. **Trained models** (.pkl) provide predictions
6. **JSON responses** return to frontend

**For production:**
- Use Railway/Render for easiest deployment ✅
- Python + Node.js in same container works perfectly ✅
- CSV files work fine for current scale ✅
- Consider microservices for enterprise scale ⚡

Your codebase is **deployment-ready** for platforms that support both Node.js and Python!
