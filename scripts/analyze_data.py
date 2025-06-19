# scripts/analyze_data.py
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import base64
import io
from matplotlib.backends.backend_agg import FigureCanvasAgg

def explore_student_data(df):
    """
    Explore and visualize student data and return results as JSON
    """
    results = {}
    
    # Dataset Overview
    results['overview'] = {
        'total_records': len(df),
        'total_features': df.shape[1] - 1,
        'dropout_rate': round(df['dropout'].mean() * 100, 1)
    }
    
    # Descriptive Statistics
    desc_stats = df.describe().T
    results['descriptive_stats'] = desc_stats.to_dict()
    
    # Correlation Matrix
    corr_matrix = df.drop(columns=['student_id']).corr()
    results['correlation_matrix'] = corr_matrix.to_dict()
    
    # Generate and encode plots
    results['plots'] = {}
    
    # 1. Correlation Heatmap
    plt.figure(figsize=(12, 10))
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    sns.heatmap(corr_matrix, mask=mask, annot=False, cmap='coolwarm',
                vmin=-1, vmax=1, center=0, linewidths=0.5)
    plt.title('🔗 Feature Correlation Heatmap')
    plt.tight_layout()
    results['plots']['correlation_heatmap'] = plot_to_base64()
    plt.close()
    
    # 2. Feature Distributions by Dropout
    features_to_plot = ['gpa', 'attendance', 'failed_courses', 'feedback_engagement', 'clicks_per_week']
    
    plt.figure(figsize=(15, 12))
    for i, feature in enumerate(features_to_plot):
        plt.subplot(3, 2, i + 1)
        sns.histplot(data=df, x=feature, hue='dropout', bins=20,
                     element='step', stat='density', common_norm=False,
                     palette=['green', 'red'], hue_order=[0, 1])
        plt.title(f'{feature.capitalize()} by Dropout Status')
    
    plt.tight_layout()
    results['plots']['feature_distributions'] = plot_to_base64()
    plt.close()
    
    # 3. Boxplots
    plt.figure(figsize=(15, 10))
    boxplot_features = ['gpa', 'attendance', 'feedback_engagement', 'clicks_per_week']
    for i, feature in enumerate(boxplot_features):
        plt.subplot(2, 2, i+1)
        sns.boxplot(data=df, x='dropout', y=feature, palette=['green', 'red'])
        plt.title(f'{feature.capitalize()} Distribution by Dropout')
        plt.xticks([0, 1], ['Non-Dropout', 'Dropout'])
    
    plt.tight_layout()
    results['plots']['boxplots'] = plot_to_base64()
    plt.close()
    
    # 4. Scatter Plot: GPA vs Attendance
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=df, x='gpa', y='attendance', hue='dropout',
                    palette=['green', 'red'], alpha=0.6, hue_order=[0, 1])
    plt.title('📉 GPA vs. Attendance by Dropout Status')
    results['plots']['gpa_vs_attendance'] = plot_to_base64()
    plt.close()
    
    # Additional data for React charts
    results['chart_data'] = {
        'gpa_distribution': get_distribution_data(df, 'gpa'),
        'attendance_distribution': get_distribution_data(df, 'attendance'),
        'scatter_data': df[['gpa', 'attendance', 'dropout']].to_dict('records'),
        'correlation_data': [
            {'feature': col, 'correlation': abs(corr_matrix.loc[col, 'dropout'])}
            for col in corr_matrix.columns if col != 'dropout'
        ]
    }
    
    return results

def plot_to_base64():
    """Convert current matplotlib plot to base64 string"""
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    buffer.close()
    return f"data:image/png;base64,{image_base64}"

def get_distribution_data(df, column):
    """Get distribution data for a column"""
    if column == 'gpa':
        ranges = [(0, 1), (1, 2), (2, 3), (3, 4)]
        labels = ['0-1', '1-2', '2-3', '3-4']
    else:  # attendance
        ranges = [(50, 60), (60, 70), (70, 80), (80, 90), (90, 100)]
        labels = ['50-60', '60-70', '70-80', '80-90', '90-100']
    
    distribution = []
    for i, (min_val, max_val) in enumerate(ranges):
        count = len(df[(df[column] >= min_val) & (df[column] < max_val)])
        distribution.append({'range': labels[i], 'count': count})
    
    return distribution

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_data.py <csv_file_path>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    
    try:
        # Load the CSV file
        df = pd.read_csv(csv_file_path)
        
        # Run analysis
        results = explore_student_data(df)
        
        # Output results as JSON
        print(json.dumps(results))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
