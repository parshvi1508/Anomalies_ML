"""
Python script to generate recommendations via API
Loads trained models and returns JSON response
"""

import sys
import json
import pandas as pd
import numpy as np
import os

# Add parent directory to path to import recommender modules
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


def get_recommendations(params):
    """
    Generate recommendations based on parameters
    
    Parameters:
    -----------
    params : dict
        Request parameters with user_id, top_n, explanation, algorithm
    """
    try:
        # Load data
        courses, user_prefs, interactions = load_data()
        
        # Extract parameters
        user_id = params.get('user_id')
        top_n = params.get('top_n', 5)
        explanation = params.get('explanation', False)
        algorithm = params.get('algorithm', 'hybrid')
        
        # Initialize hybrid recommender
        hybrid = HybridRecommender(courses, user_prefs, interactions)
        
        # Get recommendations
        recommendations = hybrid.recommend(
            user_id=user_id,
            top_n=top_n,
            explanation=explanation
        )
        
        # Convert to JSON-serializable format
        result = {
            'user_id': user_id,
            'algorithm': algorithm,
            'recommendations': recommendations.to_dict(orient='records'),
            'count': len(recommendations)
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
        get_recommendations(params)
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON parameters: {str(e)}'}), file=sys.stderr)
        sys.exit(1)
