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
    OPTIMIZED: Samples large datasets and reduces DPI for faster processing.
    
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
    
    # ULTRA-FAST: Sample only 200 rows for SPEED
    if len(df) > 200:
        print(f"⚡ FAST MODE: Sampling 200 records from {len(df)} for presentation")
        df_viz = df.sample(n=200, random_state=42)
    else:
        df_viz = df
    
    # Minimal matplotlib settings
    plt.style.use('fast')
    plt.rcParams['figure.max_open_warning'] = 0
    plt.rcParams['agg.path.chunksize'] = 10000
    
    results = {
        'overview': {
            'total_records': total_records,
            'total_features': total_features,
            'dropout_rate': dropout_rate
        },
        'descriptive_stats': df.describe().to_dict(),
        'plots': {}
    }
    
    # Get numeric columns
    numeric_df = df_viz.select_dtypes(include=[np.number])
    if 'student_id' in numeric_df.columns:
        numeric_df = numeric_df.drop(columns=['student_id'])
    
    # Select key features
    features_to_plot = []
    potential_features = ['gpa', 'attendance', 'failed_courses', 'feedback_engagement']
    for feature in potential_features:
        if feature in df.columns:
            features_to_plot.append(feature)
    if len(features_to_plot) < 2:
        numeric_cols = numeric_df.columns.tolist()
        if 'dropout' in numeric_cols:
            numeric_cols.remove('dropout')
        features_to_plot = numeric_cols[:4]
    
    # ONLY 2 PLOTS FOR PRESENTATION SPEED
    
    # 1. Correlation Heatmap - FAST version
    print("⚡ Generating correlation heatmap...")
    fig, ax = plt.subplots(figsize=(8, 6))
    corr_matrix = numeric_df.corr()
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    sns.heatmap(corr_matrix, mask=mask, annot=False, cmap='coolwarm', 
                center=0, square=True, linewidths=0, cbar_kws={"shrink": .7}, ax=ax)
    ax.set_title('Feature Correlation', fontsize=12, pad=10)
    plt.tight_layout()
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=80, bbox_inches='tight')
    img_buffer.seek(0)
    results['plots']['correlation_heatmap'] = f"data:image/png;base64,{base64.b64encode(img_buffer.getvalue()).decode()}"
    plt.close()
    
    # 2. Feature Distributions - SIMPLIFIED (only 4 subplots)
    if 'dropout' in df.columns and len(features_to_plot) > 0:
        print("⚡ Generating feature distributions...")
        fig, axes = plt.subplots(2, 2, figsize=(10, 8))
        axes = axes.flatten()
        
        for i, feature in enumerate(features_to_plot[:4]):
            if feature in df_viz.columns:
                df_viz[df_viz['dropout']==0][feature].hist(ax=axes[i], alpha=0.5, bins=15, label='No Dropout', color='green')
                df_viz[df_viz['dropout']==1][feature].hist(ax=axes[i], alpha=0.5, bins=15, label='Dropout', color='red')
                axes[i].set_title(f'{feature.replace("_", " ").title()}', fontsize=10)
                axes[i].legend(fontsize=8)
                axes[i].grid(alpha=0.3)
        
        plt.suptitle('Key Features by Dropout Status', fontsize=12, fontweight='bold')
        plt.tight_layout()
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=80, bbox_inches='tight')
        img_buffer.seek(0)
        results['plots']['feature_distributions'] = f"data:image/png;base64,{base64.b64encode(img_buffer.getvalue()).decode()}"
        plt.close()
        
        # 3. Create simple boxplots (different from distributions)
        print("⚡ Generating boxplots...")
        fig, axes = plt.subplots(1, 2, figsize=(10, 4))
        if len(features_to_plot) >= 2:
            for i, feature in enumerate(features_to_plot[:2]):
                if feature in df_viz.columns:
                    df_viz.boxplot(column=feature, by='dropout', ax=axes[i])
                    axes[i].set_title(f'{feature.replace("_", " ").title()}')
                    axes[i].set_xlabel('Dropout Status')
        plt.suptitle('Boxplot Comparison', fontsize=12, fontweight='bold')
        plt.tight_layout()
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=80, bbox_inches='tight')
        img_buffer.seek(0)
        results['plots']['boxplots'] = f"data:image/png;base64,{base64.b64encode(img_buffer.getvalue()).decode()}"
        plt.close()
        
        # 4. Simple scatter plot
        print("⚡ Generating scatter plot...")
        if len(features_to_plot) >= 2:
            fig, ax = plt.subplots(figsize=(8, 5))
            for dropout_val in [0, 1]:
                mask = df_viz['dropout'] == dropout_val
                ax.scatter(df_viz[mask][features_to_plot[0]], 
                          df_viz[mask][features_to_plot[1]],
                          alpha=0.5, s=20, 
                          label='Dropout' if dropout_val else 'Enrolled')
            ax.set_xlabel(features_to_plot[0].replace('_', ' ').title())
            ax.set_ylabel(features_to_plot[1].replace('_', ' ').title())
            ax.set_title('Feature Relationship', fontsize=12)
            ax.legend()
            ax.grid(alpha=0.3)
            plt.tight_layout()
            
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=80, bbox_inches='tight')
            img_buffer.seek(0)
            results['plots']['gpa_vs_attendance'] = f"data:image/png;base64,{base64.b64encode(img_buffer.getvalue()).decode()}"
            plt.close()
        else:
            # Use correlation as fallback
            results['plots']['gpa_vs_attendance'] = results['plots']['correlation_heatmap']
    else:
        # No dropout column - create basic plots
        results['plots']['feature_distributions'] = results['plots']['correlation_heatmap']
        results['plots']['boxplots'] = results['plots']['correlation_heatmap']
        results['plots']['gpa_vs_attendance'] = results['plots']['correlation_heatmap']
    
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