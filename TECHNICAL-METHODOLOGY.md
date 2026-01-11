# 📊 TECHNICAL METHODOLOGY & MODEL DOCUMENTATION

## Table of Contents
1. [Anomaly Detection System](#1-anomaly-detection-system)
2. [Dropout Prediction System](#2-dropout-prediction-system)
3. [Dempster-Shafer Evidence Combination](#3-dempster-shafer-evidence-combination)
4. [Recommendation System](#4-recommendation-system)
5. [Data Flow & Integration](#5-data-flow--integration)

---

## 1. ANOMALY DETECTION SYSTEM

### 1.1 Algorithm: Isolation Forest

**Purpose:** Detect anomalous student behavior patterns based on engagement metrics.

### 1.2 Input Data

```
Features Used:
- clicks_per_week: Number of clicks student makes per week
- days_active: Number of days student is active
- forum_participation: Level of forum engagement (0-10)
- study_group: Binary indicator (0 or 1)
- meeting_attendance: Percentage of meetings attended (0-100)
```

**Data Format:**
```python
X = df[['clicks_per_week', 'days_active', 'forum_participation', 
        'study_group', 'meeting_attendance']]
# Shape: (n_students, 5 features)
```

### 1.3 Mathematical Model

**Isolation Forest Algorithm:**

The algorithm isolates observations by randomly selecting a feature and then randomly selecting a split value between the maximum and minimum values of the selected feature.

**Anomaly Score Calculation:**

```
h(x) = path length of sample x
c(n) = average path length of unsuccessful search in BST
      = 2H(n-1) - (2(n-1)/n)
      where H(i) = ln(i) + Euler's constant (≈ 0.5772)

Anomaly Score(x) = 2^(-h(x)/c(n))
```

**Interpretation:**
- Score ≈ 1: Clear anomaly
- Score ≈ 0.5: Normal sample
- Score ≈ 0: Very normal sample

### 1.4 Model Parameters

```python
IsolationForest(
    contamination=0.1,      # Expected proportion of outliers (10%)
    n_estimators=100,       # Number of isolation trees
    max_samples='auto',     # Samples to draw: min(256, n_samples)
    random_state=42         # For reproducibility
)
```

### 1.5 Processing Steps

1. **Build Isolation Trees:**
   ```
   For each tree (100 trees):
       - Sample data points randomly
       - Select random feature
       - Select random split value between min and max
       - Recursively split until:
         * Node has only 1 sample, OR
         * All samples have same value, OR
         * Tree reaches max depth
   ```

2. **Calculate Path Length:**
   ```
   For each student:
       path_length = average traversal depth across all trees
   ```

3. **Compute Anomaly Score:**
   ```
   anomaly_score = 2^(-path_length / c(n))
   where n = number of samples
   ```

### 1.6 Output

```python
Output Format:
{
    'anomaly_score': float (0 to 1),
    'is_anomaly': int (-1 for anomaly, 1 for normal)
}

Example:
Student A: anomaly_score = 0.73 → Anomalous behavior
Student B: anomaly_score = 0.42 → Normal behavior
```

**Classification Rule:**
```
IF anomaly_score > contamination_threshold (0.1):
    is_anomaly = -1  (Anomaly)
ELSE:
    is_anomaly = 1   (Normal)
```

---

## 2. DROPOUT PREDICTION SYSTEM

### 2.1 Algorithm: Random Forest Classifier

**Purpose:** Predict whether a student will drop out based on academic and behavioral features.

### 2.2 Input Data

```
Original Features (16):
- gpa: Grade Point Average (0.0-4.0)
- attendance: Attendance percentage (0-100)
- failed_courses: Number of courses failed
- feedback_engagement: Feedback engagement level (0-10)
- late_assignments: Number of late submissions
- forum_participation: Forum activity level (0-10)
- clicks_per_week: Weekly platform clicks
- days_active: Active days per week
- study_group: Group study participation (0/1)
- meeting_attendance: Meeting attendance (0-100)
- resource_usage: Educational resource usage (0-10)
- course_completion: Completed courses count
- quiz_performance: Average quiz score (0-100)
- assignment_score: Average assignment score (0-100)
- midterm_score: Midterm exam score (0-100)
- final_score: Final exam score (0-100)

Enhanced Features (4):
- anomaly_gpa: anomaly_score × gpa
- anomaly_attendance: anomaly_score × attendance
- anomaly_engagement: anomaly_score × feedback_engagement
- anomaly_interaction: anomaly_score × (clicks_per_week/100)

Total Features: 20
```

**Data Format:**
```python
X = df[all_20_features]
y = df['dropout']  # Binary: 1 = dropout, 0 = continue
```

### 2.3 Mathematical Model

**Random Forest Algorithm:**

Ensemble of Decision Trees using Bagging (Bootstrap Aggregating)

**Gini Impurity (for splitting):**

```
Gini(D) = 1 - Σ(pᵢ²)
where:
    D = dataset at node
    pᵢ = proportion of class i
    i ∈ {dropout, continue}

For binary classification:
Gini(D) = 1 - (p_dropout² + p_continue²)
```

**Information Gain:**

```
IG(D, feature) = Gini(D_parent) - Σ(|D_child|/|D_parent| × Gini(D_child))
```

**Prediction (Classification):**

```
For each tree t in forest (100 trees):
    prediction_t = class with majority votes at leaf node

Final Prediction = Mode(prediction_1, prediction_2, ..., prediction_100)
```

**Dropout Probability:**

```
P(dropout) = (Number of trees predicting dropout) / (Total trees)
```

### 2.4 Model Parameters

```python
RandomForestClassifier(
    n_estimators=100,           # Number of trees
    max_depth=None,             # Unlimited depth
    min_samples_split=2,        # Min samples to split node
    min_samples_leaf=1,         # Min samples at leaf
    class_weight='balanced',    # Handle class imbalance
    random_state=42             # Reproducibility
)
```

**Class Weight Balancing:**
```
w_dropout = n_samples / (n_classes × n_dropout_samples)
w_continue = n_samples / (n_classes × n_continue_samples)
```

### 2.5 Processing Steps

1. **Handle Class Imbalance (SMOTE):**
   ```
   SMOTE (Synthetic Minority Over-sampling Technique):
   
   For each minority class sample x:
       1. Find k nearest neighbors (k=5)
       2. Randomly select one neighbor x_neighbor
       3. Generate synthetic sample:
          x_synthetic = x + λ × (x_neighbor - x)
          where λ ~ Uniform(0, 1)
   ```

2. **Build Random Forest:**
   ```
   For each tree (100 trees):
       1. Bootstrap sample: Draw n samples with replacement
       2. Build decision tree:
          At each node:
              - Randomly select √20 ≈ 4 features
              - Find best split using Gini impurity
              - Split if IG > 0
              - Continue until stopping criteria
   ```

3. **Predict Dropout Probability:**
   ```
   For new student:
       For each tree:
           Traverse tree to leaf node
           Record class prediction
       
       dropout_probability = count(dropout_predictions) / 100
       dropout_prediction = 1 if dropout_probability > 0.5 else 0
   ```

### 2.6 Output

```python
Output Format:
{
    'dropout_probability': float (0 to 1),
    'dropout_prediction': int (0 or 1),
    'feature_importance': dict
}

Example:
Student X:
    dropout_probability = 0.73
    dropout_prediction = 1
    interpretation = "73% of trees predict dropout"
```

---

## 3. DEMPSTER-SHAFER EVIDENCE COMBINATION

### 3.1 Purpose

Combine multiple evidence sources (anomaly detection, dropout prediction, expert rules) to make a final risk assessment with uncertainty quantification.

### 3.2 Theory of Evidence

**Frame of Discernment:**
```
Θ = {dropout, no_dropout}
```

**Mass Function (Basic Probability Assignment):**
```
m: 2^Θ → [0, 1]
where:
    Σ m(A) = 1 for all A ⊆ Θ
    m(∅) = 0
```

### 3.3 Input Data

**Three Evidence Sources:**

1. **Anomaly Score Evidence:**
   ```python
   anomaly_score = output from Isolation Forest (0-1)
   ```

2. **Dropout Probability Evidence:**
   ```python
   dropout_probability = output from Random Forest (0-1)
   ```

3. **Expert Rules Evidence:**
   ```python
   Rules:
   - low_gpa: gpa < 2.5
   - poor_attendance: attendance < 60%
   - failed_courses: failed_courses > 2
   - low_engagement: feedback_engagement < 3
   ```

### 3.4 Mass Function Conversion

**Formula for each evidence source:**

```
Given: probability p and uncertainty u

m(dropout) = p × (1 - u)
m(no_dropout) = (1 - p) × (1 - u)
m(Θ) = u  (ignorance/uncertainty)

where:
    p = probability of dropout
    u = uncertainty level (0-1)
```

**Example Conversion:**

```python
# Anomaly Evidence
anomaly_score = 0.73
uncertainty_anomaly = 0.2

m1({dropout}) = 0.73 × (1 - 0.2) = 0.584
m1({no_dropout}) = 0.27 × (1 - 0.2) = 0.216
m1(Θ) = 0.2

# Dropout Model Evidence
dropout_prob = 0.68
uncertainty_model = 0.15

m2({dropout}) = 0.68 × (1 - 0.15) = 0.578
m2({no_dropout}) = 0.32 × (1 - 0.15) = 0.272
m2(Θ) = 0.15

# Expert Rules Evidence
rules_score = 0.6  (60% of rules triggered)
uncertainty_rules = 0.3

m3({dropout}) = 0.6 × (1 - 0.3) = 0.42
m3({no_dropout}) = 0.4 × (1 - 0.3) = 0.28
m3(Θ) = 0.3
```

### 3.5 Dempster's Rule of Combination

**Formula:**

```
m₁₂(A) = [Σ m₁(B) × m₂(C)] / (1 - K)
         B∩C=A

Conflict Factor:
K = Σ m₁(B) × m₂(C)
    B∩C=∅
```

**Step-by-Step Combination:**

**Step 1: Combine m1 and m2**

```
Intersection Table:
                m2({D})  m2({ND})  m2(Θ)
m1({D})         {D}      ∅         {D}
m1({ND})        ∅        {ND}      {ND}
m1(Θ)           {D}      {ND}      Θ

where D = dropout, ND = no_dropout

Calculate combined masses:
m₁₂({dropout}) = m1({D})×m2({D}) + m1({D})×m2(Θ) + m1(Θ)×m2({D})
                = 0.584×0.578 + 0.584×0.15 + 0.2×0.578
                = 0.337 + 0.088 + 0.116 = 0.541

m₁₂({no_dropout}) = m1({ND})×m2({ND}) + m1({ND})×m2(Θ) + m1(Θ)×m2({ND})
                   = 0.216×0.272 + 0.216×0.15 + 0.2×0.272
                   = 0.059 + 0.032 + 0.054 = 0.145

m₁₂(Θ) = m1(Θ)×m2(Θ)
        = 0.2×0.15 = 0.03

Conflict:
K = m1({D})×m2({ND}) + m1({ND})×m2({D})
  = 0.584×0.272 + 0.216×0.578
  = 0.159 + 0.125 = 0.284

Normalization (divide by 1-K):
m₁₂({dropout}) = 0.541 / (1-0.284) = 0.755
m₁₂({no_dropout}) = 0.145 / 0.716 = 0.203
m₁₂(Θ) = 0.03 / 0.716 = 0.042
```

**Step 2: Combine m₁₂ with m3**

```
Follow same process to get final masses:
m_final({dropout})
m_final({no_dropout})
m_final(Θ)
```

### 3.6 Belief and Plausibility Calculation

**Belief (Lower Bound):**
```
Bel(A) = Σ m(B)
         B⊆A

Bel({dropout}) = m({dropout})
               = measure of definite support for dropout
```

**Plausibility (Upper Bound):**
```
Pl(A) = Σ m(B)
        B∩A≠∅

Pl({dropout}) = m({dropout}) + m(Θ)
              = maximum possible support for dropout
```

**Uncertainty:**
```
Uncertainty = Pl({dropout}) - Bel({dropout})
            = m(Θ)
            = degree of ignorance
```

### 3.7 Final Risk Categorization

**Rules:**

```python
belief_score = Bel({dropout})

IF belief_score >= 0.7:
    risk_category = "Extreme Risk"
    risk_level = 4
    
ELIF belief_score >= 0.5:
    risk_category = "High Risk"
    risk_level = 3
    
ELIF belief_score >= 0.3:
    risk_category = "Moderate Risk"
    risk_level = 2
    
ELSE:
    risk_category = "Low Risk"
    risk_level = 1
```

### 3.8 Output

```python
Final Output:
{
    'belief_score': float (0-1),
    'plausibility_score': float (0-1),
    'uncertainty': float (0-1),
    'risk_category': str,
    'risk_level': int (1-4),
    'contributing_factors': list
}

Example:
Student Y:
    belief_score = 0.755
    plausibility_score = 0.797
    uncertainty = 0.042
    risk_category = "Extreme Risk"
    interpretation = "At least 75.5% confidence in dropout risk"
```

---

## 4. RECOMMENDATION SYSTEM

### 4.1 Content-Based Filtering

**Purpose:** Recommend courses based on similarity to courses the user has taken.

#### 4.1.1 Input Data

```python
Courses DataFrame:
- course_id: Unique identifier
- title: Course name
- description: Course description
- domain: Subject area
- learning_objectives: Learning goals
- difficulty: Beginner/Intermediate/Advanced
- duration_weeks: Course length
- platform: Learning platform
- rating: Average rating (0-5)

User Interactions:
- user_id: Student identifier
- course_id: Course taken
- rating: User rating (1-5)
- time_spent_hours: Hours spent
- completion_status: Completed/In Progress
- implicit_rating: Derived score (0-1)
```

#### 4.1.2 TF-IDF Vectorization

**Term Frequency (TF):**
```
TF(term, document) = (Number of times term appears in document) / 
                     (Total terms in document)
```

**Inverse Document Frequency (IDF):**
```
IDF(term) = log(Total documents / Documents containing term)
```

**TF-IDF Score:**
```
TF-IDF(term, document) = TF(term, document) × IDF(term)
```

**Feature Construction:**
```python
# Combine text features
combined_text = title + " " + domain + " " + description + " " + learning_objectives

# Create TF-IDF matrix
tfidf_vectorizer = TfidfVectorizer(max_features=100)
tfidf_matrix = tfidf_vectorizer.fit_transform(combined_text)

# Shape: (25 courses, 100 features)
```

#### 4.1.3 Cosine Similarity

**Formula:**
```
Cosine Similarity(A, B) = (A · B) / (||A|| × ||B||)

where:
    A · B = Σ(Aᵢ × Bᵢ)  (dot product)
    ||A|| = √(Σ(Aᵢ²))  (magnitude)
```

**Computation:**
```python
# User profile vector (weighted average of completed courses)
user_vector = Σ(course_vector_i × implicit_rating_i) / Σ(implicit_rating_i)

# Similarity with all courses
for each course:
    similarity_score = cosine_similarity(user_vector, course_vector)
```

#### 4.1.4 Output

```python
Content-Based Score:
{
    'course_id': str,
    'content_score': float (0-1),
    'similarity_explanation': str
}

Interpretation:
score = 0.85 → 85% similar to user's preferences
```

### 4.2 Collaborative Filtering

**Purpose:** Recommend courses based on similar users' preferences.

#### 4.2.1 Matrix Factorization (SVD)

**User-Item Rating Matrix:**
```
R = [r_ui]  (m users × n items)

where r_ui = rating of user u for item i
```

**SVD Decomposition:**
```
R ≈ U × Σ × V^T

where:
    U: m × k user feature matrix
    Σ: k × k diagonal matrix of singular values
    V: n × k item feature matrix
    k: number of latent factors (50)
```

**Predicted Rating:**
```
r̂_ui = μ + b_u + b_i + q_i^T × p_u

where:
    μ = global average rating
    b_u = user bias (user's tendency to rate high/low)
    b_i = item bias (item's tendency to be rated high/low)
    p_u = user latent factor vector
    q_i = item latent factor vector
```

**Optimization (Gradient Descent):**
```
Minimize: Σ(r_ui - r̂_ui)² + λ(||p_u||² + ||q_i||² + b_u² + b_i²)

where λ = regularization parameter (0.02)
```

#### 4.2.2 Model Parameters

```python
SVD(
    n_factors=50,          # Latent dimensions
    n_epochs=20,           # Training iterations
    lr_all=0.005,          # Learning rate
    reg_all=0.02,          # Regularization
    biased=True            # Use bias terms
)
```

#### 4.2.3 Training Process

```
For each epoch (20 iterations):
    For each rating r_ui in training set:
        1. Compute prediction: r̂_ui = μ + b_u + b_i + q_i^T × p_u
        2. Calculate error: e_ui = r_ui - r̂_ui
        3. Update parameters:
           p_u ← p_u + α(e_ui × q_i - λ × p_u)
           q_i ← q_i + α(e_ui × p_u - λ × q_i)
           b_u ← b_u + α(e_ui - λ × b_u)
           b_i ← b_i + α(e_ui - λ × b_i)
        
        where α = learning rate (0.005)
```

#### 4.2.4 Evaluation Metrics

**Root Mean Square Error (RMSE):**
```
RMSE = √[Σ(r_ui - r̂_ui)² / n]
```

**Mean Absolute Error (MAE):**
```
MAE = Σ|r_ui - r̂_ui| / n
```

#### 4.2.5 Output

```python
Collaborative Filtering Score:
{
    'course_id': str,
    'predicted_rating': float (1-5),
    'cf_score': float (0-1)  # normalized: predicted_rating/5
}
```

### 4.3 Rule-Based Scoring

**Purpose:** Apply domain-specific rules to boost relevant courses.

#### 4.3.1 Rules

```python
Rule 1: Domain Match
IF course.domain IN user.preferred_domains:
    score += 0.3

Rule 2: Learning Pace Match
IF course.format MATCHES user.learning_pace:
    score += 0.2
    # self-paced ↔ self_paced, instructor-led ↔ structured

Rule 3: Cost Preference Match
IF course.cost_type MATCHES user.cost_preference:
    score += 0.25
    # free ↔ free_only, paid ↔ willing_to_pay

Rule 4: Platform Preference
IF course.platform IN user.preferred_platforms:
    score += 0.15

Rule 5: Difficulty Match
IF course.difficulty MATCHES user.current_level:
    score += 0.1

Total Rule Score = Σ(matched_rules) / 1.0  # Normalized
```

#### 4.3.2 Output

```python
Rule-Based Score:
{
    'course_id': str,
    'rule_score': float (0-1),
    'matched_rules': list
}
```

### 4.4 Popularity-Based Scoring

**Formula:**
```
Popularity Score = (rating/5) × 0.6 + (enrollments/max_enrollments) × 0.4

Normalized to [0, 1]
```

### 4.5 Hybrid Recommendation

**Purpose:** Combine all recommendation approaches.

#### 4.5.1 Weighted Combination

**Default Weights:**
```python
weights = {
    'content_based': 0.35,      # 35%
    'collaborative': 0.40,      # 40%
    'rule_based': 0.15,         # 15%
    'popularity': 0.10          # 10%
}
```

**Hybrid Score Calculation:**
```
hybrid_score = (content_score × 0.35) + 
               (cf_score × 0.40) + 
               (rule_score × 0.15) + 
               (popularity_score × 0.10)
```

#### 4.5.2 Cold Start Handling

**For New Users (no interaction history):**
```python
# Adjust weights to favor non-personalized approaches
weights = {
    'content_based': 0.20,      # Reduced (no history)
    'collaborative': 0.10,      # Reduced (no history)
    'rule_based': 0.40,         # Increased (use preferences)
    'popularity': 0.30          # Increased (general trends)
}
```

#### 4.5.3 At-Risk Student Recommendations

**Special Adjustments:**
```python
# Boost beginner and foundational courses
IF student.risk_category IN ['High Risk', 'Extreme Risk']:
    IF course.difficulty == 'Beginner':
        hybrid_score × 1.2
    IF 'foundational' in course.tags:
        hybrid_score × 1.15
    IF course.duration_weeks <= 6:
        hybrid_score × 1.1  # Prefer shorter courses
```

#### 4.5.4 Final Ranking

```
1. Calculate hybrid_score for all candidate courses
2. Sort by hybrid_score (descending)
3. Apply diversity filter (max 2 courses per domain)
4. Return top N recommendations
```

#### 4.5.5 Output

```python
Final Recommendation:
{
    'user_id': str,
    'recommendations': [
        {
            'course_id': str,
            'title': str,
            'hybrid_score': float (0-1),
            'content_score': float (0-1),
            'cf_score': float (0-1),
            'rule_score': float (0-1),
            'popularity_score': float (0-1),
            'explanation': str
        },
        ...
    ],
    'count': int
}
```

---

## 5. DATA FLOW & INTEGRATION

### 5.1 End-to-End Pipeline

```
INPUT DATA
    ↓
┌─────────────────────────────────────────────┐
│ 1. FEATURE ENGINEERING                      │
│    - Clean data                             │
│    - Handle missing values                  │
│    - Create derived features                │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 2. ANOMALY DETECTION                        │
│    Algorithm: Isolation Forest              │
│    Input: 5 behavioral features             │
│    Output: anomaly_score (0-1)              │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 3. FEATURE ENHANCEMENT                      │
│    - Create interaction features:           │
│      * anomaly_score × gpa                  │
│      * anomaly_score × attendance           │
│      * etc.                                 │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 4. DROPOUT PREDICTION                       │
│    Algorithm: Random Forest                 │
│    Input: 20 features (16 original + 4 new) │
│    Output: dropout_probability (0-1)        │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 5. EXPERT RULES EVALUATION                  │
│    - Check: low GPA, poor attendance, etc.  │
│    Output: rules_score (0-1)                │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 6. DEMPSTER-SHAFER COMBINATION              │
│    Inputs:                                  │
│    - anomaly_score                          │
│    - dropout_probability                    │
│    - rules_score                            │
│    Process:                                 │
│    - Convert to mass functions              │
│    - Apply Dempster's rule                  │
│    Output:                                  │
│    - belief_score                           │
│    - plausibility_score                     │
│    - uncertainty                            │
│    - risk_category                          │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 7. COURSE RECOMMENDATIONS                   │
│    (For at-risk students)                   │
│    A. Content-Based: TF-IDF + Cosine Sim    │
│    B. Collaborative: SVD Matrix Fact.       │
│    C. Rule-Based: Domain rules              │
│    D. Popularity: Rating × Enrollments      │
│    E. Hybrid: Weighted combination          │
│    Output: Top N recommended courses        │
└─────────────────────────────────────────────┘
    ↓
FINAL OUTPUT
    - Student risk assessment
    - Personalized course recommendations
    - Intervention priorities
```

### 5.2 System Integration Points

```
┌─────────────────┐
│   Frontend      │
│  (Next.js)      │
└────────┬────────┘
         │ HTTP REST API
         ▼
┌─────────────────┐
│   API Routes    │
│  (TypeScript)   │
└────────┬────────┘
         │ spawn()
         ▼
┌─────────────────┐
│  Python Scripts │
│  - Anomaly Det  │
│  - Dropout Pred │
│  - DS Combiner  │
│  - Recommender  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Data Layer    │
│   (CSV Files)   │
│  - students.csv │
│  - courses.csv  │
│  - interact.csv │
└─────────────────┘
```

### 5.3 Data Formats

**Student Risk Data:**
```json
{
  "student_id": "S0001",
  "features": {
    "gpa": 2.3,
    "attendance": 55,
    "clicks_per_week": 45
  },
  "predictions": {
    "anomaly_score": 0.73,
    "dropout_probability": 0.68,
    "belief_score": 0.755,
    "risk_category": "Extreme Risk"
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Recommendation Data:**
```json
{
  "user_id": "U001",
  "request": {
    "top_n": 5,
    "filters": ["Data Science", "Beginner"]
  },
  "response": {
    "recommendations": [
      {
        "course_id": "C002",
        "title": "Advanced Machine Learning",
        "hybrid_score": 0.8523,
        "components": {
          "content": 0.7841,
          "collaborative": 0.9012,
          "rules": 0.8500,
          "popularity": 0.8800
        }
      }
    ]
  }
}
```

---

## 6. PERFORMANCE METRICS

### 6.1 Anomaly Detection Metrics

```
Contamination Rate: 10% (expected outliers)
Precision: Fraction of detected anomalies that are true anomalies
Recall: Fraction of true anomalies that are detected
F1-Score: Harmonic mean of Precision and Recall
```

### 6.2 Dropout Prediction Metrics

```
Accuracy: (TP + TN) / (TP + TN + FP + FN)
Precision: TP / (TP + FP)
Recall (Sensitivity): TP / (TP + FN)
Specificity: TN / (TN + FP)
F1-Score: 2 × (Precision × Recall) / (Precision + Recall)
AUC-ROC: Area under ROC curve

Current Performance:
- Accuracy: 72%
- Precision: 66.7%
- Specificity: 98.6%
```

### 6.3 Recommendation Metrics

```
RMSE: √[Σ(actual - predicted)² / n]
MAE: Σ|actual - predicted| / n
Precision@K: Relevant items in top K / K
Recall@K: Relevant items in top K / Total relevant
NDCG: Normalized Discounted Cumulative Gain

Current Performance:
- SVD RMSE: ~0.85
- SVD MAE: ~0.65
```

---

## 7. IMPLEMENTATION NOTES

### 7.1 Computational Complexity

```
Isolation Forest:
- Training: O(n × t × ψ × log ψ)
  where n = features, t = trees, ψ = sample size
- Prediction: O(t × log ψ)

Random Forest:
- Training: O(n × m × t × log n)
  where n = samples, m = features, t = trees
- Prediction: O(t × log n)

Dempster-Shafer:
- Combination: O(2^|Θ|)
  where |Θ| = 2 (binary frame)

Collaborative Filtering (SVD):
- Training: O(n × k × i)
  where n = ratings, k = factors, i = iterations
- Prediction: O(k)
```

### 7.2 Scalability Considerations

```
Current Scale:
- Students: 10,000
- Courses: 25
- User Interactions: 25
- Features: 20

Production Scale Recommendations:
- Use batch processing for >100K students
- Implement caching for recommendations
- Use approximate nearest neighbors for similarity
- Implement incremental model updates
```

---

## 8. REFERENCES

### 8.1 Algorithms

1. **Isolation Forest:** Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation forest. ICDM.
2. **Random Forest:** Breiman, L. (2001). Random forests. Machine learning.
3. **Dempster-Shafer Theory:** Shafer, G. (1976). A mathematical theory of evidence.
4. **SVD:** Koren, Y., Bell, R., & Volinsky, C. (2009). Matrix factorization techniques.

### 8.2 Libraries Used

```
Python:
- scikit-learn: ML algorithms
- scikit-surprise: Collaborative filtering
- pandas: Data manipulation
- numpy: Numerical computations
- scipy: Statistical functions

TypeScript/JavaScript:
- Next.js: Frontend framework
- React: UI components
- Chart.js: Visualizations
```

---

## SUMMARY

This system implements a comprehensive student success prediction and intervention system:

1. **Detects** anomalous behavior patterns (Isolation Forest)
2. **Predicts** dropout risk (Random Forest with SMOTE)
3. **Combines** multiple evidence sources (Dempster-Shafer Theory)
4. **Recommends** personalized interventions (Hybrid Recommender)
5. **Quantifies** uncertainty in predictions
6. **Provides** explainable results for educational decision-making

All models work together in a pipeline that processes student data, identifies at-risk students, and provides actionable recommendations for intervention.
