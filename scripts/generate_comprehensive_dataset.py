"""
Generate Comprehensive Student Dataset for ML Presentation
Creates 1200 student records with realistic distributions across all 4 risk categories
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Set random seed for reproducibility
np.random.seed(42)

def generate_student_data(n_students=1200):
    """
    Generate comprehensive student dataset with 16 features
    
    Features:
    1. student_id - Unique identifier
    2. gpa - Grade Point Average (0-4)
    3. attendance - Class attendance percentage (0-100)
    4. semester - Current semester (1-8)
    5. prev_gpa - Previous semester GPA (0-4)
    6. failed_courses - Number of failed courses (0-5)
    7. feedback_engagement - Engagement with instructor feedback (0-100)
    8. late_assignments - Percentage of late assignments (0-100)
    9. forum_participation - Forum posts per week (0-10)
    10. meeting_attendance - Meeting/office hours attendance (0-100)
    11. study_group - Study group participation (0=no, 1-3=yes)
    12. days_active - Days active on LMS per week (0-7)
    13. clicks_per_week - Platform interactions per week (0-50)
    14. assessments_submitted - Assessments submitted on time (0-10)
    15. previous_attempts - Course retakes (0-3)
    16. studied_credits - Total credits enrolled (10-40)
    17. dropout - Target variable (0=enrolled, 1=dropout)
    """
    
    students = []
    
    # Define risk category distributions (ensure all 4 categories represented)
    # Low Risk: 35%, Moderate Risk: 30%, High Risk: 25%, Extreme Risk: 10%
    n_low = int(n_students * 0.35)
    n_moderate = int(n_students * 0.30)
    n_high = int(n_students * 0.25)
    n_extreme = n_students - (n_low + n_moderate + n_high)
    
    print(f"Generating {n_students} student records:")
    print(f"  • Low Risk: {n_low} ({n_low/n_students*100:.1f}%)")
    print(f"  • Moderate Risk: {n_moderate} ({n_moderate/n_students*100:.1f}%)")
    print(f"  • High Risk: {n_high} ({n_high/n_students*100:.1f}%)")
    print(f"  • Extreme Risk: {n_extreme} ({n_extreme/n_students*100:.1f}%)")
    
    student_id = 1
    
    # Generate LOW RISK students (Risk Score 0-24)
    # Characteristics: High GPA, high attendance, good engagement
    for _ in range(n_low):
        gpa = np.random.normal(3.4, 0.3)
        gpa = np.clip(gpa, 3.0, 4.0)
        prev_gpa = np.random.normal(3.3, 0.3)
        prev_gpa = np.clip(prev_gpa, 2.8, 4.0)
        
        students.append({
            'student_id': f'S{student_id:04d}',
            'gpa': round(gpa, 2),
            'attendance': round(np.random.uniform(85, 100), 2),
            'semester': np.random.randint(1, 9),
            'prev_gpa': round(prev_gpa, 2),
            'failed_courses': np.random.choice([0, 0, 0, 0, 1], p=[0.85, 0.10, 0.03, 0.01, 0.01]),
            'feedback_engagement': round(np.random.uniform(70, 100), 2),
            'late_assignments': round(np.random.uniform(0, 15), 2),
            'forum_participation': np.random.randint(4, 11),
            'meeting_attendance': round(np.random.uniform(75, 100), 2),
            'study_group': np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2]),
            'days_active': np.random.randint(5, 8),
            'clicks_per_week': np.random.randint(20, 51),
            'assessments_submitted': np.random.randint(8, 11),
            'previous_attempts': 0,
            'studied_credits': np.random.randint(15, 41),
            'dropout': 0
        })
        student_id += 1
    
    # Generate MODERATE RISK students (Risk Score 25-49)
    # Characteristics: Average GPA, decent attendance, some issues
    for _ in range(n_moderate):
        gpa = np.random.normal(2.7, 0.3)
        gpa = np.clip(gpa, 2.3, 3.2)
        prev_gpa = np.random.normal(2.6, 0.3)
        prev_gpa = np.clip(prev_gpa, 2.0, 3.2)
        
        students.append({
            'student_id': f'S{student_id:04d}',
            'gpa': round(gpa, 2),
            'attendance': round(np.random.uniform(70, 88), 2),
            'semester': np.random.randint(1, 9),
            'prev_gpa': round(prev_gpa, 2),
            'failed_courses': np.random.choice([0, 1, 2], p=[0.5, 0.4, 0.1]),
            'feedback_engagement': round(np.random.uniform(50, 75), 2),
            'late_assignments': round(np.random.uniform(15, 35), 2),
            'forum_participation': np.random.randint(2, 6),
            'meeting_attendance': round(np.random.uniform(55, 80), 2),
            'study_group': np.random.choice([0, 1, 2], p=[0.3, 0.5, 0.2]),
            'days_active': np.random.randint(4, 7),
            'clicks_per_week': np.random.randint(10, 25),
            'assessments_submitted': np.random.randint(5, 9),
            'previous_attempts': np.random.choice([0, 1], p=[0.7, 0.3]),
            'studied_credits': np.random.randint(12, 35),
            'dropout': np.random.choice([0, 1], p=[0.75, 0.25])
        })
        student_id += 1
    
    # Generate HIGH RISK students (Risk Score 50-74)
    # Characteristics: Low-average GPA, poor attendance, multiple issues
    for _ in range(n_high):
        gpa = np.random.normal(2.2, 0.3)
        gpa = np.clip(gpa, 1.8, 2.7)
        prev_gpa = np.random.normal(2.0, 0.4)
        prev_gpa = np.clip(prev_gpa, 1.5, 2.8)
        
        students.append({
            'student_id': f'S{student_id:04d}',
            'gpa': round(gpa, 2),
            'attendance': round(np.random.uniform(60, 78), 2),
            'semester': np.random.randint(1, 9),
            'prev_gpa': round(prev_gpa, 2),
            'failed_courses': np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2]),
            'feedback_engagement': round(np.random.uniform(30, 60), 2),
            'late_assignments': round(np.random.uniform(30, 55), 2),
            'forum_participation': np.random.randint(0, 4),
            'meeting_attendance': round(np.random.uniform(35, 65), 2),
            'study_group': np.random.choice([0, 1], p=[0.6, 0.4]),
            'days_active': np.random.randint(2, 5),
            'clicks_per_week': np.random.randint(5, 18),
            'assessments_submitted': np.random.randint(3, 7),
            'previous_attempts': np.random.choice([0, 1, 2], p=[0.3, 0.5, 0.2]),
            'studied_credits': np.random.randint(10, 28),
            'dropout': np.random.choice([0, 1], p=[0.4, 0.6])
        })
        student_id += 1
    
    # Generate EXTREME RISK students (Risk Score 75-100)
    # Characteristics: Very low GPA, very poor attendance, critical issues
    for _ in range(n_extreme):
        gpa = np.random.normal(1.8, 0.3)
        gpa = np.clip(gpa, 1.0, 2.3)
        prev_gpa = np.random.normal(1.7, 0.4)
        prev_gpa = np.clip(prev_gpa, 0.8, 2.2)
        
        students.append({
            'student_id': f'S{student_id:04d}',
            'gpa': round(gpa, 2),
            'attendance': round(np.random.uniform(40, 65), 2),
            'semester': np.random.randint(1, 9),
            'prev_gpa': round(prev_gpa, 2),
            'failed_courses': np.random.choice([2, 3, 4, 5], p=[0.3, 0.3, 0.3, 0.1]),
            'feedback_engagement': round(np.random.uniform(10, 45), 2),
            'late_assignments': round(np.random.uniform(50, 85), 2),
            'forum_participation': np.random.randint(0, 3),
            'meeting_attendance': round(np.random.uniform(20, 50), 2),
            'study_group': 0,
            'days_active': np.random.randint(0, 4),
            'clicks_per_week': np.random.randint(0, 12),
            'assessments_submitted': np.random.randint(0, 5),
            'previous_attempts': np.random.choice([1, 2, 3], p=[0.3, 0.4, 0.3]),
            'studied_credits': np.random.randint(8, 22),
            'dropout': 1
        })
        student_id += 1
    
    # Create DataFrame and shuffle
    df = pd.DataFrame(students)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df


def calculate_risk_metrics(df):
    """Calculate risk scores and add statistics"""
    
    def calc_risk_score(row):
        score = 0
        
        # GPA (0-25 points)
        if row['gpa'] < 2.0:
            score += 25
        elif row['gpa'] < 2.5:
            score += 18
        elif row['gpa'] < 3.0:
            score += 10
        else:
            score += 3
        
        # Attendance (0-20 points)
        if row['attendance'] < 60:
            score += 20
        elif row['attendance'] < 75:
            score += 15
        elif row['attendance'] < 85:
            score += 8
        else:
            score += 2
        
        # Failed courses (0-20 points)
        score += min(row['failed_courses'] * 7, 20)
        
        # Late assignments (0-15 points)
        if row['late_assignments'] > 30:
            score += 15
        elif row['late_assignments'] > 15:
            score += 10
        elif row['late_assignments'] > 5:
            score += 5
        
        # Engagement (0-10 points)
        if row['feedback_engagement'] < 30:
            score += 10
        elif row['feedback_engagement'] < 50:
            score += 6
        elif row['feedback_engagement'] < 70:
            score += 3
        
        # Activity (0-10 points)
        if row['days_active'] < 3:
            score += 10
        elif row['days_active'] < 5:
            score += 5
        elif row['days_active'] < 6:
            score += 2
        
        return min(score, 100)
    
    df['risk_score'] = df.apply(calc_risk_score, axis=1)
    
    def get_risk_category(score):
        if score >= 75:
            return 'Extreme Risk'
        elif score >= 50:
            return 'High Risk'
        elif score >= 25:
            return 'Moderate Risk'
        else:
            return 'Low Risk'
    
    df['risk_category'] = df['risk_score'].apply(get_risk_category)
    
    return df


def print_statistics(df):
    """Print dataset statistics"""
    print("\n" + "="*70)
    print("COMPREHENSIVE STUDENT DATASET STATISTICS")
    print("="*70)
    
    print(f"\n📊 DATASET OVERVIEW:")
    print(f"  • Total Students: {len(df)}")
    print(f"  • Total Features: {len(df.columns) - 1}")  # Excluding student_id
    print(f"  • Dropout Rate: {df['dropout'].mean()*100:.1f}%")
    
    print(f"\n🎯 RISK CATEGORY DISTRIBUTION:")
    risk_counts = df['risk_category'].value_counts()
    for category in ['Low Risk', 'Moderate Risk', 'High Risk', 'Extreme Risk']:
        count = risk_counts.get(category, 0)
        pct = count / len(df) * 100
        print(f"  • {category:15s}: {count:4d} students ({pct:5.1f}%)")
    
    print(f"\n📈 ACADEMIC METRICS:")
    print(f"  • Average GPA: {df['gpa'].mean():.2f} (σ={df['gpa'].std():.2f})")
    print(f"  • Average Attendance: {df['attendance'].mean():.1f}% (σ={df['attendance'].std():.1f}%)")
    print(f"  • Failed Courses: {df['failed_courses'].mean():.2f} avg, {df['failed_courses'].max()} max")
    
    print(f"\n💻 ENGAGEMENT METRICS:")
    print(f"  • Days Active: {df['days_active'].mean():.1f} days/week (σ={df['days_active'].std():.1f})")
    print(f"  • Clicks/Week: {df['clicks_per_week'].mean():.1f} (σ={df['clicks_per_week'].std():.1f})")
    print(f"  • Forum Posts: {df['forum_participation'].mean():.1f}/week (σ={df['forum_participation'].std():.1f})")
    print(f"  • Feedback Engagement: {df['feedback_engagement'].mean():.1f}% (σ={df['feedback_engagement'].std():.1f}%)")
    
    print(f"\n⚠️  RISK INDICATORS:")
    print(f"  • Late Assignments: {df['late_assignments'].mean():.1f}% avg")
    print(f"  • Previous Attempts: {df['previous_attempts'].mean():.2f} avg")
    print(f"  • Low Study Group: {(df['study_group']==0).sum()} students ({(df['study_group']==0).mean()*100:.1f}%)")
    
    print(f"\n📊 RISK SCORE STATISTICS:")
    print(f"  • Mean Risk Score: {df['risk_score'].mean():.1f}")
    print(f"  • Median Risk Score: {df['risk_score'].median():.1f}")
    print(f"  • Min Risk Score: {df['risk_score'].min()}")
    print(f"  • Max Risk Score: {df['risk_score'].max()}")
    
    print(f"\n✅ FEATURE COMPLETENESS:")
    print(f"  • No missing values: {df.isnull().sum().sum() == 0}")
    print(f"  • All features present: {len(df.columns)} columns")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    print("Generating comprehensive student dataset for ML presentation...\n")
    
    # Generate dataset
    df = generate_student_data(n_students=1200)
    
    # Calculate risk scores for statistics ONLY (not saved to CSV)
    df_with_risk = calculate_risk_metrics(df.copy())
    
    # Print statistics using the risk-calculated version
    print_statistics(df_with_risk)
    
    # Save base dataset WITHOUT risk_score and risk_category (backend calculates these)
    output_path = 'data/comprehensive_student_data.csv'
    df.to_csv(output_path, index=False)
    print(f"\n✅ Dataset saved to: {output_path}")
    
    # Also save to uploads folder for immediate use
    upload_path = 'uploads/student_data_comprehensive.csv'
    df.to_csv(upload_path, index=False)
    print(f"✅ Dataset also saved to: {upload_path}")
    
    print("\n📋 FEATURE LIST (16 features):")
    features = [
        "1. student_id - Unique identifier",
        "2. gpa - Grade Point Average (0-4)",
        "3. attendance - Class attendance percentage (0-100)",
        "4. semester - Current semester (1-8)",
        "5. prev_gpa - Previous semester GPA (0-4)",
        "6. failed_courses - Number of failed courses (0-5)",
        "7. feedback_engagement - Engagement with feedback (0-100)",
        "8. late_assignments - Late assignment percentage (0-100)",
        "9. forum_participation - Forum posts per week (0-10)",
        "10. meeting_attendance - Meeting attendance (0-100)",
        "11. study_group - Study group participation (0-3)",
        "12. days_active - Days active on LMS per week (0-7)",
        "13. clicks_per_week - Platform interactions per week (0-50)",
        "14. assessments_submitted - On-time assessments (0-10)",
        "15. previous_attempts - Course retakes (0-3)",
        "16. studied_credits - Credits enrolled (10-40)"
    ]
    
    for feature in features:
        print(f"  {feature}")
    
    print("\n" + "="*70)
    print("NOTE: risk_score and risk_category will be calculated by the backend.")
    print("CSV contains only the 16 base features + dropout label (17 columns total).")
    print("="*70)
    print("✨ Dataset generation complete! Ready for presentation.")
    print("="*70)
