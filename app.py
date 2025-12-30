from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
import json
from scripts.explore_student_data import explore_student_data  # import your function

app = FastAPI(title="Student Analytics API", version="1.0.0")

# CORS Configuration - Allow Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",  # All Vercel preview deployments
        "http://localhost:3000",  # Local development
        "http://localhost:3001",
        "https://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Service is running ✅", "version": "1.0.0"}
@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        results = explore_student_data(df)
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
