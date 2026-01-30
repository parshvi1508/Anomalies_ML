# Backend API Testing

## Test /predict endpoint

```powershell
$testData = @{
    gpa = 2.8
    prev_gpa = 3.0
    attendance = 78.0
    failed_courses = 1
    feedback_engagement = 65.0
    late_assignments = 25.0
    clicks_per_week = 150
    days_active = 4
    assessments_submitted = 8
    previous_attempts = 0
    studied_credits = 15
    semester = 3
    forum_participation = 8
    meeting_attendance = 78.0
    study_group = 0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/predict" -Method POST -Body $testData -ContentType "application/json"
```

## Test /api/students/{id} endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/students/S0001" -Method GET
```

## Expected Response Structure

```json
{
  "anomaly_detection": {
    "score": 0.35,
    "dynamic_uncertainty": 0.19
  },
  "dropout_prediction": {
    "probability": 0.62,
    "dynamic_uncertainty": 0.08
  },
  "expert_rules": {
    "score": 0.45,
    "dynamic_uncertainty": 0.20
  },
  "evidence_fusion": {
    "belief": 0.52,
    "plausibility": 0.78,
    "uncertainty": 0.26
  }
}
```
