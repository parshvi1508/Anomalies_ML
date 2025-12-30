"""
Python script to generate at-risk student recommendations
"""

import sys
import json
import pandas as pd
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'recommender'))

from hybrid_recommender import HybridRecommender


def load_data():
    """Load CSV data files"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        
        courses = pd.read_csv(os.path.join(data_dir, 'courses.csv'))
        user_prefs = pd.read_csv(os.path.join(data_dir, 'user_preferences.csv'))
        interactions = pd.read_csv(os.path.join(data_dir, 'user_course_interactions.csv'))
        
        return courses, user_prefs, interactions
    except Exception as e:
        print(json.dumps({'error': f'Failed to load data: {str(e)}'}), file=sys.stderr)
        sys.exit(1)


def get_at_risk_recommendations(params):
    """
    Generate recommendations for at-risk students
    
    Parameters:
    -----------
    params : dict
        Request parameters with user_id, risk_factors, top_n
    """
    try:
        # Load data
        courses, user_prefs, interactions = load_data()
        
        # Extract parameters
        user_id = params.get('user_id')
        risk_factors = params.get('risk_factors', {})
        top_n = params.get('top_n', 5)
        
        # Initialize hybrid recommender
        hybrid = HybridRecommender(courses, user_prefs, interactions)
        
        # Get at-risk recommendations
        recommendations = hybrid.recommend_for_at_risk_student(
            user_id=user_id,
            risk_factors=risk_factors,
            top_n=top_n
        )
        
        # Convert to JSON-serializable format
        result = {
            'user_id': user_id,
            'risk_factors': risk_factors,
            'recommendations': recommendations.to_dict(orient='records'),
            'count': len(recommendations),
            'message': 'Recommendations tailored for at-risk student'
        }
        
        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'user_id': params.get('user_id', 'unknown')
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing parameters'}), file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse parameters from command line argument
        params = json.loads(sys.argv[1])
        get_at_risk_recommendations(params)
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON parameters: {str(e)}'}), file=sys.stderr)
        sys.exit(1)
