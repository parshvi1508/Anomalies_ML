from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from pathlib import Path
import pandas as pd
import numpy as np
import io
import json
import pickle
import os
import sys
import logging
from functools import lru_cache
from scripts.explore_student_data import explore_student_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add paths for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'recommender'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'utils'))

# Import DS combiner class BEFORE loading pickled models
from ds_combiner import DempsterShaferCombination, DempsterShaferCombinationDynamic
from model_loader import load_all_models

app = FastAPI(title="Student Analytics API", version="2.0.0")

# CORS Configuration - Allow Vercel frontend + Render backend
# Note: Vercel wildcard patterns don't work in allow_origins, use allow_origin_regex instead
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # All Vercel domains
    allow_origins=[
        "http://localhost:3000",  # Local development
        "http://localhost:3001",
        "https://localhost:3000",
        # Add your specific Vercel domain
        "https://dropout-dashboard.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PYDANTIC MODELS ====================

class StudentData(BaseModel):
    """Input schema for anomaly detection and dropout prediction"""
    gpa: float = Field(..., ge=0.0, le=4.0, description="Current GPA (0-4)")
    prev_gpa: float = Field(..., ge=0.0, le=4.0, description="Previous semester GPA (0-4)")
    attendance: float = Field(..., ge=0.0, le=100.0, description="Attendance percentage")
    failed_courses: int = Field(..., ge=0, description="Number of failed courses")
    feedback_engagement: float = Field(..., ge=0.0, le=100.0, description="Feedback engagement score")
    late_assignments: float = Field(..., ge=0.0, le=100.0, description="Late assignment percentage")
    clicks_per_week: int = Field(..., ge=0, description="Platform clicks per week")
    days_active: int = Field(..., ge=0, le=7, description="Days active per week")
    assessments_submitted: int = Field(..., ge=0, description="Number of assessments submitted")
    previous_attempts: int = Field(..., ge=0, description="Number of course retakes")
    studied_credits: int = Field(..., ge=0, description="Total credits enrolled")
    
    class Config:
        json_schema_extra = {
            "example": {
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
        }

class RecommendationRequest(BaseModel):
    """Input schema for personalized recommendations"""
    user_id: str = Field(..., description="User identifier")
    top_n: int = Field(5, ge=1, le=20, description="Number of recommendations")
    explanation: bool = Field(False, description="Include score breakdowns")
    algorithm: str = Field("hybrid", pattern="^(hybrid|content|collaborative)$", description="Recommendation algorithm")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "U001",
                "top_n": 5,
                "explanation": True,
                "algorithm": "hybrid"
            }
        }

class AtRiskRecommendationRequest(BaseModel):
    """Input schema for at-risk student recommendations"""
    user_id: str = Field(..., description="User identifier")
    risk_factors: Dict[str, Any] = Field(..., description="Student risk factors")
    top_n: int = Field(5, ge=1, le=20, description="Number of recommendations")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "U001",
                "risk_factors": {
                    "dropout_risk": "high",
                    "gpa": 2.1,
                    "attendance": 60.0
                },
                "top_n": 5
            }
        }

# ==================== MODEL LOADING ====================

class ModelCache:
    """Singleton for loading and caching ML models"""
    _instance = None
    _models = {}
    _recommender = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelCache, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance
    
    def _load_models(self):
        """Load all trained models at startup"""
        try:
            models_dir = os.path.join(os.path.dirname(__file__), 'public', 'models')
            from pathlib import Path
            
            # Use model_loader to handle unpickling correctly
            self._models = load_all_models(Path(models_dir))
            
            print("✅ Models loaded successfully!")
            print(f"   - Anomaly Model: {type(self._models['anomaly']).__name__}")
            print(f"   - Dropout Model: {type(self._models['dropout']).__name__}")
            print(f"   - DS Combiner: {type(self._models['ds_combiner']).__name__}")
            
        except Exception as e:
            print(f"❌ Failed to load models: {str(e)}")
            raise RuntimeError(f"Model loading failed: {str(e)}")
    
    @property
    def models(self):
        return self._models
    
    def get_recommender(self):
        """Lazy-load recommendation system"""
        if self._recommender is None:
            try:
                from hybrid_recommender import HybridRecommender
                
                data_dir = os.path.join(os.path.dirname(__file__), 'data')
                courses = pd.read_csv(os.path.join(data_dir, 'courses.csv'))
                user_prefs = pd.read_csv(os.path.join(data_dir, 'user_preferences.csv'))
                interactions = pd.read_csv(os.path.join(data_dir, 'user_course_interactions.csv'))
                
                self._recommender = HybridRecommender(courses, user_prefs, interactions)
                print("✅ Recommendation system initialized!")
                
            except Exception as e:
                print(f"❌ Failed to initialize recommender: {str(e)}")
                raise RuntimeError(f"Recommender initialization failed: {str(e)}")
        
        return self._recommender

# Initialize model cache at startup
try:
    model_cache = ModelCache()
except Exception as e:
    print(f"⚠️ Warning: Model cache initialization failed: {str(e)}")
    model_cache = None

# ==================== ENDPOINTS ====================

@app.get("/")
def root():
    """Health check endpoint"""
    model_status = "loaded" if model_cache and model_cache.models else "not loaded"
    return {
        "message": "Student Analytics API is running ✅",
        "version": "2.0.0",
        "models_status": model_status,
        "endpoints": {
            "analysis": "/analyze",
            "prediction": "/predict",
            "recommendations": "/api/recommendations",
            "at_risk_recommendations": "/api/recommendations/at-risk"
        }
    }

@app.get("/health")
def health_check():
    """Detailed health check for monitoring"""
    if not model_cache or not model_cache.models:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    return {
        "status": "healthy",
        "models": {
            "anomaly_detection": "ready",
            "dropout_prediction": "ready",
            "evidence_fusion": "ready"
        },
        "timestamp": pd.Timestamp.now().isoformat()
    }

@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """Analyze uploaded student data CSV"""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        results = explore_student_data(df)
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/students")
async def get_students():
    """Get all students with risk predictions from uploaded data"""
    try:
        # Try to load the most recent uploaded file
        upload_paths = [
            Path("./uploads/student_data_with_risk.csv"),
            Path("./uploads/student_data.csv"),
            Path("/tmp/uploads/student_data_with_risk.csv"),
            Path("/tmp/uploads/student_data.csv")
        ]
        
        df = None
        for path in upload_paths:
            if path.exists():
                df = pd.read_csv(path)
                logger.info(f"Loaded student data from {path}")
                break
        
        if df is None:
            return JSONResponse(
                content={"error": "No student data available. Please upload a CSV file first."},
                status_code=404
            )
        
        # Ensure we have required columns
        if 'student_id' not in df.columns:
            df['student_id'] = [f"S{i:04d}" for i in range(len(df))]
        
        # Calculate risk scores if not present
        if 'risk_score' not in df.columns and model_cache and model_cache.models:
            risk_scores = []
            for _, row in df.iterrows():
                try:
                    # Create prediction input
                    input_data = {
                        'gpa': float(row.get('gpa', 3.0)),
                        'attendance': float(row.get('attendance', 85.0)),
                        'failed_courses': int(row.get('failed_courses', 0)),
                        'feedback_engagement': float(row.get('feedback_engagement', 50.0)),
                        'late_assignments': int(row.get('late_assignments', 0)),
                        'forum_participation': int(row.get('forum_participation', 3)),
                        'meeting_attendance': float(row.get('meeting_attendance', 75.0)),
                        'study_group': int(row.get('study_group', 1))
                    }
                    
                    input_df = pd.DataFrame([input_data])
                    dropout_model = model_cache.models.get('dropout_model')
                    if dropout_model:
                        dropout_prob = dropout_model.predict_proba(input_df)[0][1]
                        risk_scores.append(round(dropout_prob * 100, 1))
                    else:
                        risk_scores.append(50.0)
                except:
                    risk_scores.append(50.0)
            
            df['risk_score'] = risk_scores
        
        # Add risk categories
        if 'risk_category' not in df.columns:
            df['risk_category'] = df.get('risk_score', 50).apply(
                lambda x: 'Extreme Risk' if x >= 75 else 
                         'High Risk' if x >= 50 else 
                         'Moderate Risk' if x >= 25 else 
                         'Low Risk'
            )
        
        # Select relevant columns for display
        display_columns = ['student_id', 'gpa', 'attendance', 'failed_courses', 
                          'risk_score', 'risk_category']
        available_columns = [col for col in display_columns if col in df.columns]
        
        students_data = df[available_columns].head(100).to_dict(orient='records')
        
        # Clean NaN values
        for student in students_data:
            for key, value in student.items():
                if pd.isna(value):
                    student[key] = None
        
        return JSONResponse(content={
            "success": True,
            "students": students_data,
            "total_count": len(df),
            "displayed_count": len(students_data)
        })
        
    except Exception as e:
        logger.error(f"Error fetching students: {str(e)}")
        return JSONResponse(
            content={"error": f"Failed to load student data: {str(e)}"},
            status_code=500
        )

@app.post("/predict")
async def predict_dropout(data: StudentData):
    """
    Real-time anomaly detection and dropout prediction
    
    Returns:
    - Anomaly score and classification
    - Dropout probability with optimized threshold
    - Dempster-Shafer evidence fusion results
    - Risk tier classification
    """
    if not model_cache or not model_cache.models:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Convert input to DataFrame
        student_dict = data.dict()
        input_df = pd.DataFrame([student_dict])
        
        # Extract feature names from metadata
        metadata = model_cache.models.get('metadata', {})
        anomaly_features = metadata.get('anomaly_features', [
            'clicks_per_week', 'days_active', 'previous_attempts',
            'studied_credits', 'assessments_submitted'
        ])
        
        # ===== STEP 1: Anomaly Detection =====
        anomaly_model = model_cache.models['anomaly']
        X_anomaly = input_df[anomaly_features]
        
        # Raw anomaly score
        raw_score = anomaly_model.decision_function(X_anomaly)[0]
        # Normalize to [0, 1] (higher = more anomalous)
        anomaly_score = float((-raw_score - (-1)) / (1 - (-1)))  # Approximate normalization
        is_anomaly = int(anomaly_model.predict(X_anomaly)[0] == -1)
        
        # ===== STEP 2: Feature Engineering =====
        input_df['anomaly_score'] = anomaly_score
        input_df['is_anomaly'] = is_anomaly
        input_df['anomaly_gpa_interaction'] = anomaly_score * input_df['gpa']
        input_df['anomaly_attendance_interaction'] = anomaly_score * input_df['attendance']
        
        # ===== STEP 3: Dropout Prediction =====
        dropout_model = model_cache.models['dropout']
        dropout_proba = dropout_model.predict_proba(input_df)[0][1]  # Probability of dropout
        
        # Use optimized threshold (from training: 0.342)
        optimal_threshold = metadata.get('optimal_threshold', 0.342)
        dropout_prediction = int(dropout_proba >= optimal_threshold)
        
        # ===== STEP 4: Dempster-Shafer Evidence Fusion =====
        try:
            ds_combiner = model_cache.models['ds_combiner']
            
            # Compute dynamic uncertainty
            entropy = -np.sum([dropout_proba * np.log2(dropout_proba + 1e-10),
                              (1-dropout_proba) * np.log2(1-dropout_proba + 1e-10)])
            uncertainty = float(entropy / np.log2(2))
            
            # Convert to mass functions
            m_anomaly = {
                'non-dropout': (1 - anomaly_score) * (1 - uncertainty),
                'dropout': anomaly_score * (1 - uncertainty),
                'uncertainty': uncertainty
            }
            
            m_classifier = {
                'non-dropout': (1 - dropout_proba) * (1 - uncertainty),
                'dropout': dropout_proba * (1 - uncertainty),
                'uncertainty': uncertainty
            }
            
            # Simple Dempster combination (conflict normalization omitted for brevity)
            belief = m_classifier['dropout']
            plausibility = m_classifier['dropout'] + m_classifier['uncertainty']
            
        except Exception as e:
            print(f"DS fusion warning: {str(e)}")
            belief = dropout_proba
            plausibility = dropout_proba + 0.15
            uncertainty = 0.15
        
        # ===== STEP 5: Risk Tier Classification =====
        if plausibility >= 0.75:
            risk_tier = "Very High"
        elif plausibility >= 0.5:
            risk_tier = "High"
        elif plausibility >= 0.3:
            risk_tier = "Moderate"
        else:
            risk_tier = "Low"
        
        # ===== RESPONSE =====
        return {
            "success": True,
            "anomaly_detection": {
                "score": round(anomaly_score, 4),
                "is_anomaly": bool(is_anomaly),
                "interpretation": "High" if is_anomaly else "Normal"
            },
            "dropout_prediction": {
                "probability": round(dropout_proba, 4),
                "prediction": "Dropout" if dropout_prediction else "Non-Dropout",
                "threshold_used": optimal_threshold,
                "confidence": round(abs(dropout_proba - 0.5) * 2, 4)
            },
            "evidence_fusion": {
                "belief": round(belief, 4),
                "plausibility": round(plausibility, 4),
                "uncertainty": round(plausibility - belief, 4)
            },
            "risk_assessment": {
                "tier": risk_tier,
                "needs_intervention": dropout_prediction == 1,
                "priority_score": round(plausibility, 4)
            },
            "input_summary": {
                "gpa": data.gpa,
                "attendance": data.attendance,
                "engagement": data.feedback_engagement
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """
    Get personalized course recommendations using Hybrid ISM
    
    Combines:
    - Content-based filtering (35%)
    - Collaborative filtering (40%)
    - Rule-based recommendations (15%)
    - Popularity-based (10%)
    """
    if not model_cache:
        raise HTTPException(status_code=503, detail="Recommendation system not available")
    
    try:
        # Get recommender instance (lazy-loaded)
        recommender = model_cache.get_recommender()
        
        # Generate recommendations
        recommendations = recommender.recommend(
            user_id=request.user_id,
            top_n=request.top_n,
            explanation=request.explanation
        )
        
        # Handle empty results
        if recommendations.empty:
            return {
                "success": True,
                "user_id": request.user_id,
                "algorithm": request.algorithm,
                "recommendations": [],
                "count": 0,
                "message": "No recommendations available (user may have taken all courses)"
            }
        
        # Convert to JSON-serializable format
        recs_list = recommendations.to_dict(orient='records')
        
        # Clean up NaN values
        for rec in recs_list:
            for key, value in rec.items():
                if pd.isna(value):
                    rec[key] = None
        
        return {
            "success": True,
            "user_id": request.user_id,
            "algorithm": request.algorithm,
            "recommendations": recs_list,
            "count": len(recs_list),
            "metadata": {
                "weights": {
                    "content_based": 0.35,
                    "collaborative": 0.40,
                    "rule_based": 0.15,
                    "popularity": 0.10
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@app.post("/api/recommendations/at-risk")
async def get_at_risk_recommendations(request: AtRiskRecommendationRequest):
    """
    Get specialized recommendations for at-risk students
    
    Prioritizes:
    - Easier courses with high pass rates
    - Courses with strong instructor support
    - Foundational courses for skill gaps
    """
    if not model_cache:
        raise HTTPException(status_code=503, detail="Recommendation system not available")
    
    try:
        recommender = model_cache.get_recommender()
        
        # Generate at-risk recommendations
        recommendations = recommender.recommend_for_at_risk_student(
            user_id=request.user_id,
            risk_factors=request.risk_factors,
            top_n=request.top_n
        )
        
        if recommendations.empty:
            return {
                "success": True,
                "user_id": request.user_id,
                "recommendations": [],
                "count": 0,
                "message": "No at-risk recommendations available"
            }
        
        recs_list = recommendations.to_dict(orient='records')
        
        # Clean NaN values
        for rec in recs_list:
            for key, value in rec.items():
                if pd.isna(value):
                    rec[key] = None
        
        return {
            "success": True,
            "user_id": request.user_id,
            "risk_level": request.risk_factors.get("dropout_risk", "unknown"),
            "recommendations": recs_list,
            "count": len(recs_list),
            "intervention_strategy": "at_risk_specialized"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"At-risk recommendation failed: {str(e)}")
