import pandas as pd

df = pd.read_csv('uploads/student_data.csv')
print('Sample data:')
print(df[['student_id', 'gpa', 'attendance', 'failed_courses', 'dropout']].head(10))

def calc_risk(row):
    score = 0
    gpa = row['gpa']
    score += 25 if gpa < 2.0 else 18 if gpa < 2.5 else 10 if gpa < 3.0 else 3
    att = row['attendance']
    score += 20 if att < 60 else 15 if att < 75 else 8 if att < 85 else 2
    score += min(row['failed_courses'] * 7, 20)
    if row['dropout'] == 1:
        score = max(score, 60)
    return min(score, 100)

df['risk_score'] = df.apply(calc_risk, axis=1)
df['risk_category'] = df['risk_score'].apply(lambda x: 'Extreme Risk' if x >= 75 else 'High Risk' if x >= 50 else 'Moderate Risk' if x >= 25 else 'Low Risk')

print('\nRisk distribution:')
print(df['risk_category'].value_counts())
print('\nSample with scores:')
print(df[['student_id', 'gpa', 'attendance', 'dropout', 'risk_score', 'risk_category']].head(20))
