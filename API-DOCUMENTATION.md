# Student Analytics API - Complete Documentation

## 🎯 Overview

Production-grade REST API for:
- **Real-time Dropout Prediction** - Anomaly detection + classification
- **Personalized Course Recommendations** - Hybrid ISM system
- **At-Risk Student Interventions** - Specialized recommendations

**Base URL:** `http://localhost:8000` (development)

---

## 📋 Endpoints

### 1. Health Check

#### `GET /`
Root endpoint with system status

**Response:**
```json
{
  "message": "Student Analytics API is running ✅",
  "version": "2.0.0",
  "environment": "development",
  "models_status": "loaded",
  "endpoints": {
    "health": "/health",
    "analysis": "/analyze",
    "prediction": "/predict",
    "recommendations": "/api/recommendations",
    "at_risk_recommendations": "/api/recommendations/at-risk"
  },
  "timestamp": "2026-01-11T14:30:00"
}
```

#### `GET /health`
Detailed health check for monitoring

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "anomaly_detection": "ready",
    "dropout_prediction": "ready",
    "evidence_fusion": "ready"
  },
  "system": {
    "upload_dir_exists": true,
    "temp_dir_exists": true,
    "model_dir_exists": true
  },
  "timestamp": "2026-01-11T14:30:00"
}
```

---

### 2. CSV Analysis

#### `POST /analyze`
Upload and analyze student data CSV

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  ```
  file: <student_data.csv>
  ```

**CSV Format:**
```csv
student_id,gpa,attendance,failed_courses,feedback_engagement
S001,2.5,75.0,1,60.0
S002,3.2,85.0,0,80.0
```

**Response:**
```json
{
  "summary": {
    "total_students": 100,
    "columns": ["student_id", "gpa", "attendance", ...],
    "missing_values": {...}
  },
  "statistics": {
    "gpa": {"mean": 2.8, "std": 0.5, "min": 1.5, "max": 4.0},
    ...
  },
  "file_info": {
    "filename": "student_data.csv",
    "saved_path": "/uploads/20260111_143000_student_data.csv",
    "size_mb": 0.15,
    "upload_timestamp": "2026-01-11T14:30:00"
  }
}
```

**Error Responses:**
- `400` - Invalid file format, file too large (>10MB), empty CSV
- `500` - Processing error

---

### 3. Dropout Prediction (✅ Real-time Anomaly Detection)

#### `POST /predict`
Predict dropout risk for a single student

**Implements complete pipeline from MODEL-TRAINING-DETAILS.md:**
1. Isolation Forest anomaly detection
2. Feature engineering
3. Random Forest dropout classification
4. Dempster-Shafer evidence fusion
5. Risk tier classification

**Request:**
```json
{
  "gpa": 2.3,
  "prev_gpa": 2.5,
  "attendance": 65.0,
  "failed_courses": 2,
  "feedback_engagement": 45.0,
  "late_assignments": 35.0,
  "clicks_per_week": 120,
  "days_active": 3,
  "assessments_submitted": 4,
  "previous_attempts": 1,
  "studied_credits": 15
}
```

**Response:**
```json
{
  "success": true,
  "anomaly_detection": {
    "score": 0.7823,
    "is_anomaly": true,
    "interpretation": "High",
    "features_used": [
      "clicks_per_week",
      "days_active",
      "previous_attempts",
      "studied_credits",
      "assessments_submitted"
    ]
  },
  "dropout_prediction": {
    "probability": 0.6542,
    "prediction": "Dropout",
    "threshold_used": 0.342,
    "confidence": 0.3084
  },
  "evidence_fusion": {
    "belief": 0.5234,
    "plausibility": 0.7123,
    "uncertainty": 0.1889,
    "method": "Dempster-Shafer (Dynamic Uncertainty)"
  },
  "risk_assessment": {
    "tier": "High",
    "needs_intervention": true,
    "priority_score": 0.7123
  },
  "input_summary": {
    "gpa": 2.3,
    "attendance": 65.0,
    "engagement": 45.0,
    "days_active": 3
  },
  "timestamp": "2026-01-11T14:30:00"
}
```

**Risk Tiers:**
- **Very High:** plausibility ≥ 0.75
- **High:** plausibility ≥ 0.50
- **Moderate:** plausibility ≥ 0.30
- **Low:** plausibility < 0.30

**Validation:**
- All numeric fields validated against ranges
- GPA: [0.0, 4.0]
- Attendance/Engagement: [0.0, 100.0]
- Days active: [0, 7]

**Error Responses:**
- `400` - Invalid input data, missing required fields
- `503` - Models not loaded
- `500` - Prediction error

---

### 4. Personalized Recommendations (✅ ISM Implementation)

#### `POST /api/recommendations`
Get course recommendations using Hybrid ISM

**Implements Intelligent Student Model from PhD thesis:**
- Content-based filtering (35%)
- Collaborative filtering (40%)
- Rule-based recommendations (15%)
- Popularity-based (10%)

**Request:**
```json
{
  "user_id": "U001",
  "top_n": 5,
  "explanation": true,
  "algorithm": "hybrid"
}
```

**Parameters:**
- `user_id` (required): Student identifier (1-50 chars)
- `top_n` (optional): Number of recommendations [1-20], default=5
- `explanation` (optional): Include score breakdowns, default=false
- `algorithm` (optional): "hybrid" | "content" | "collaborative", default="hybrid"

**Response:**
```json
{
  "success": true,
  "user_id": "U001",
  "algorithm": "hybrid",
  "recommendations": [
    {
      "course_id": "C101",
      "course_name": "Introduction to Python",
      "score": 0.8534,
      "difficulty": "beginner",
      "category": "Programming",
      "estimated_hours": 40,
      "instructor_rating": 4.5,
      "explanation": {
        "content_score": 0.75,
        "collaborative_score": 0.89,
        "rule_score": 0.90,
        "popularity_score": 0.85
      }
    }
  ],
  "count": 5,
  "metadata": {
    "weights": {
      "content_based": 0.35,
      "collaborative": 0.40,
      "rule_based": 0.15,
      "popularity": 0.10
    },
    "method": "Hybrid ISM (Intelligent Student Model)"
  },
  "timestamp": "2026-01-11T14:30:00"
}
```

**Empty Response (No recommendations available):**
```json
{
  "success": true,
  "user_id": "U999",
  "algorithm": "hybrid",
  "recommendations": [],
  "count": 0,
  "message": "No recommendations available (user may have taken all courses)"
}
```

**Error Responses:**
- `400` - Invalid user_id format, invalid algorithm
- `503` - Recommendation system not initialized
- `500` - Recommendation generation error

---

### 5. At-Risk Student Recommendations

#### `POST /api/recommendations/at-risk`
Specialized recommendations for high-risk students

**Prioritizes:**
- Easier courses with high pass rates
- Courses with strong instructor support
- Foundational courses for skill gaps
- High engagement courses

**Request:**
```json
{
  "user_id": "U001",
  "risk_factors": {
    "dropout_risk": "high",
    "gpa": 2.1,
    "attendance": 60.0,
    "failed_courses": 3,
    "engagement_score": 35.0
  },
  "top_n": 5
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "U001",
  "risk_level": "high",
  "recommendations": [
    {
      "course_id": "C202",
      "course_name": "Study Skills Workshop",
      "score": 0.9123,
      "difficulty": "beginner",
      "pass_rate": 0.92,
      "support_level": "high",
      "rationale": "High pass rate and strong support for struggling students"
    }
  ],
  "count": 5,
  "intervention_strategy": "at_risk_specialized",
  "timestamp": "2026-01-11T14:30:00"
}
```

---

## 🔒 Security Features

### Rate Limiting
- **Default:** 60 requests/minute per IP address
- **Response when exceeded:**
  ```json
  {
    "error": "Rate limit exceeded",
    "status_code": 429
  }
  ```

### File Upload Security
- **Max file size:** 10 MB (configurable via `.env`)
- **Allowed extensions:** `.csv`, `.xlsx`
- **Validation:** File format, size, content structure
- **Storage:** Unique timestamped filenames prevent collisions

### Error Handling
All errors return standardized JSON:
```json
{
  "success": false,
  "error": "Error description",
  "status_code": 400,
  "timestamp": "2026-01-11T14:30:00"
}
```

---

## 🛠️ Configuration

### Environment Variables (.env)
```bash
# Application Settings
APP_ENV=development
DEBUG=true
PORT=8000

# File Upload
MAX_UPLOAD_SIZE_MB=10
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log

# Security
RATE_LIMIT_PER_MINUTE=60
```

### Directory Structure
```
├── uploads/          # Uploaded CSV files (persistent)
├── temp/             # Temporary processing files
├── logs/             # Application logs with rotation
├── public/models/    # Trained ML models (.pkl files)
└── data/             # Recommendation system data
```

---

## 🧪 Testing Examples

### cURL Examples

**1. Health Check:**
```bash
curl http://localhost:8000/health
```

**2. Dropout Prediction:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "gpa": 2.3,
    "prev_gpa": 2.5,
    "attendance": 65.0,
    "failed_courses": 2,
    "feedback_engagement": 45.0,
    "late_assignments": 35.0,
    "clicks_per_week": 120,
    "days_active": 3,
    "assessments_submitted": 4,
    "previous_attempts": 1,
    "studied_credits": 15
  }'
```

**3. Get Recommendations:**
```bash
curl -X POST http://localhost:8000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "U001",
    "top_n": 5,
    "explanation": true,
    "algorithm": "hybrid"
  }'
```

**4. Upload CSV:**
```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@student_data.csv"
```

### Python Examples

```python
import requests

# 1. Dropout Prediction
response = requests.post(
    "http://localhost:8000/predict",
    json={
        "gpa": 2.3,
        "prev_gpa": 2.5,
        "attendance": 65.0,
        "failed_courses": 2,
        "feedback_engagement": 45.0,
        "late_assignments": 35.0,
        "clicks_per_week": 120,
        "days_active": 3,
        "assessments_submitted": 4,
        "previous_attempts": 1,
        "studied_credits": 15
    }
)
print(response.json())

# 2. Recommendations
response = requests.post(
    "http://localhost:8000/api/recommendations",
    json={
        "user_id": "U001",
        "top_n": 5,
        "explanation": True
    }
)
print(response.json())
```

---

## 🚀 Deployment

### Start Development Server
```bash
# Activate virtual environment
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start server
python app.py
# OR
uvicorn app:app --reload --port 8000
```

### Start Production Server
```bash
# Using Gunicorn (Linux/Mac)
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Using Uvicorn (Windows)
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📊 Model Details

### Trained Models
- **anomaly_model.pkl** - Isolation Forest (100 estimators, 10% contamination)
- **dropout_model.pkl** - Random Forest (200 trees, optimized threshold: 0.342)
- **ds_combiner.pkl** - Dempster-Shafer evidence fusion
- **model_info.pkl** - Feature names and metadata

### Performance Metrics (Test Set)
- **Accuracy:** 77.5%
- **Precision:** 60.0%
- **Recall:** 75.0%
- **F1-Score:** 66.7%
- **ROC-AUC:** 0.815
- **Interval Coverage (Dynamic):** 74.8%

---

## 🐛 Troubleshooting

### Models Not Loading
```
Error: "Models not loaded"
Solution: Check public/models/ directory contains all .pkl files
```

### CSV Upload Fails
```
Error: "File too large"
Solution: Increase MAX_UPLOAD_SIZE_MB in .env
```

### Recommendation System Fails
```
Error: "No recommendations available"
Solution: Ensure data/courses.csv, data/user_preferences.csv exist
```

---

## 📝 Changelog

### v2.0.0 (2026-01-11)
- ✅ Real-time anomaly detection deployed (Isolation Forest)
- ✅ ISM personalized recommendations endpoint
- ✅ Production-grade logging and configuration
- ✅ File upload with persistent storage
- ✅ Rate limiting and security headers
- ✅ Comprehensive error handling
- ✅ Environment-based configuration

---

## 📞 Support

For technical issues or questions:
- Check logs: `logs/app.log`
- Review: `MODEL-TRAINING-DETAILS.md`
- API docs: `http://localhost:8000/docs` (dev mode)
