import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import base64
import io
import warnings
warnings.filterwarnings('ignore')

def explore_student_data(df):
    """
    Explore student data and generate visualizations exactly as specified.
    
    Parameters:
    -----------
    df: pandas DataFrame
        Student dataset loaded from CSV
    
    Returns:
    --------
    dict: Analysis results with plots as base64 encoded images
    """
    
    # Dataset Overview
    total_records = len(df)
    total_features = df.shape[1] - 1  # excluding target column
    dropout_rate = round(df['dropout'].mean() * 100, 1) if 'dropout' in df.columns else 0
    
    # Removed emoji characters that cause encoding issues
    print("Dataset Overview:")
    print(f"- Total Records: {total_records}")
    print(f"- Total Features (excluding target): {total_features}")
    print(f"- Dropout Rate: {dropout_rate}%")
    
    # Set style for all plots
    plt.style.use('default')
    sns.set_palette("husl")
    
    results = {
        'overview': {
            'total_records': total_records,
            'total_features': total_features,
            'dropout_rate': dropout_rate
        },
        'descriptive_stats': df.describe().to_dict(),
        'plots': {}
    }
    
    # 1. Correlation Heatmap
    plt.figure(figsize=(12, 10))
    # Remove non-numeric columns for correlation
    numeric_df = df.select_dtypes(include=[np.number])
    if 'student_id' in numeric_df.columns:
        numeric_df = numeric_df.drop(columns=['student_id'])
    
    corr_matrix = numeric_df.corr()
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    
    sns.heatmap(corr_matrix, mask=mask, annot=False, cmap='coolwarm', 
                center=0, square=True, linewidths=0.5, cbar_kws={"shrink": .8})
    plt.title('Feature Correlation Heatmap', fontsize=16, fontweight='bold', pad=20)
    plt.tight_layout()
    
    # Convert to base64
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
    img_buffer.seek(0)
    correlation_plot = base64.b64encode(img_buffer.getvalue()).decode()
    results['plots']['correlation_heatmap'] = f"data:image/png;base64,{correlation_plot}"
    plt.close()
    
    # 2. Feature Distributions by Dropout Status
    if 'dropout' in df.columns:
        # Select key features for distribution plots
        features_to_plot = []
        potential_features = ['gpa', 'attendance', 'failed_courses', 'feedback_engagement', 'clicks_per_week']
        
        for feature in potential_features:
            if feature in df.columns:
                features_to_plot.append(feature)
        
        # If we don't have the expected features, use the first 5 numeric columns
        if len(features_to_plot) < 3:
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if 'dropout' in numeric_cols:
                numeric_cols.remove('dropout')
            if 'student_id' in numeric_cols:
                numeric_cols.remove('student_id')
            features_to_plot = numeric_cols[:5]
        
        fig, axes = plt.subplots(2, 3, figsize=(15, 10))
        axes = axes.flatten()
        
        for i, feature in enumerate(features_to_plot[:6]):
            if feature in df.columns:
                sns.histplot(data=df, x=feature, hue='dropout', kde=True, ax=axes[i], alpha=0.7)
                axes[i].set_title(f'{feature.replace("_", " ").title()} Distribution')
                axes[i].legend(['No Dropout', 'Dropout'])
        
        # Hide empty subplots
        for i in range(len(features_to_plot), 6):
            axes[i].set_visible(False)
        
        plt.suptitle('Feature Distributions by Dropout Status', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        distribution_plot = base64.b64encode(img_buffer.getvalue()).decode()
        results['plots']['feature_distributions'] = f"data:image/png;base64,{distribution_plot}"
        plt.close()
        
        # 3. Boxplots by Dropout Status
        fig, axes = plt.subplots(2, 3, figsize=(15, 10))
        axes = axes.flatten()
        
        for i, feature in enumerate(features_to_plot[:6]):
            if feature in df.columns:
                sns.boxplot(data=df, x='dropout', y=feature, ax=axes[i])
                axes[i].set_title(f'{feature.replace("_", " ").title()} by Dropout Status')
                axes[i].set_xlabel('Dropout Status')
        
        # Hide empty subplots
        for i in range(len(features_to_plot), 6):
            axes[i].set_visible(False)
        
        plt.suptitle('Boxplot Analysis by Dropout Status', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        boxplot_plot = base64.b64encode(img_buffer.getvalue()).decode()
        results['plots']['boxplots'] = f"data:image/png;base64,{boxplot_plot}"
        plt.close()
        
        # 4. GPA vs Attendance Scatter Plot (or substitute with available features)
        x_feature = 'gpa' if 'gpa' in df.columns else features_to_plot[0] if features_to_plot else 'dropout'
        y_feature = 'attendance' if 'attendance' in df.columns else features_to_plot[1] if len(features_to_plot) > 1 else 'dropout'
        
        if x_feature != 'dropout' and y_feature != 'dropout':
            plt.figure(figsize=(10, 6))
            sns.scatterplot(data=df, x=x_feature, y=y_feature, hue='dropout', alpha=0.7, s=50)
            plt.title(f'{x_feature.replace("_", " ").title()} vs {y_feature.replace("_", " ").title()}', 
                     fontsize=16, fontweight='bold')
            plt.xlabel(x_feature.replace("_", " ").title())
            plt.ylabel(y_feature.replace("_", " ").title())
            plt.legend(['No Dropout', 'Dropout'])
            plt.tight_layout()
            
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
            img_buffer.seek(0)
            scatter_plot = base64.b64encode(img_buffer.getvalue()).decode()
            results['plots']['gpa_vs_attendance'] = f"data:image/png;base64,{scatter_plot}"
            plt.close()
        else:
            # Create a simple scatter plot with available data
            plt.figure(figsize=(10, 6))
            if len(features_to_plot) >= 2:
                sns.scatterplot(data=df, x=features_to_plot[0], y=features_to_plot[1], 
                               hue='dropout' if 'dropout' in df.columns else None, alpha=0.7, s=50)
            plt.title('Feature Relationship Analysis', fontsize=16, fontweight='bold')
            plt.tight_layout()
            
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
            img_buffer.seek(0)
            scatter_plot = base64.b64encode(img_buffer.getvalue()).decode()
            results['plots']['gpa_vs_attendance'] = f"data:image/png;base64,{scatter_plot}"
            plt.close()
    
    else:
        # If no dropout column, create basic visualizations
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if 'student_id' in numeric_cols:
            numeric_cols.remove('student_id')
        
        # Create placeholder plots
        for plot_name in ['feature_distributions', 'boxplots', 'gpa_vs_attendance']:
            plt.figure(figsize=(10, 6))
            if len(numeric_cols) >= 2:
                plt.scatter(df[numeric_cols[0]], df[numeric_cols[1]], alpha=0.7)
                plt.xlabel(numeric_cols[0])
                plt.ylabel(numeric_cols[1])
            plt.title('Data Visualization (No Dropout Column Found)')
            plt.tight_layout()
            
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
            img_buffer.seek(0)
            plot_data = base64.b64encode(img_buffer.getvalue()).decode()
            results['plots'][plot_name] = f"data:image/png;base64,{plot_data}"
            plt.close()
    
    return results

def main():
    if len(sys.argv) != 2:
        print("Usage: python explore_student_data.py <csv_file_path>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    
    try:
        # Load the CSV file
        df = pd.read_csv(csv_file_path)
        
        # Run the exploration
        results = explore_student_data(df)
        
        # Output results as JSON
        print(json.dumps(results))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()