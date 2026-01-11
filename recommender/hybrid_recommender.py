"""
Hybrid Recommendation System
Combines content-based, collaborative filtering, and rule-based approaches
Addresses cold-start problem and improves recommendation quality
As per methodology document requirements
"""

import pandas as pd
import numpy as np
from content_based import ContentBasedRecommender, cold_start_recommendations
from collaborative_filtering import CollaborativeFilteringRecommender, ImplicitFeedbackCF
import warnings
warnings.filterwarnings('ignore')


class HybridRecommender:
    """
    Hybrid recommendation system combining multiple approaches:
    - Content-based filtering
    - Collaborative filtering (SVD)
    - Rule-based recommendations
    - Sentiment analysis integration (placeholder for future)
    """
    
    def __init__(self, courses_df, user_preferences_df, interactions_df,
                 weights=None):
        """
        Initialize hybrid recommender
        
        Parameters:
        -----------
        courses_df : DataFrame
            Course metadata
        user_preferences_df : DataFrame
            User preferences
        interactions_df : DataFrame
            User-course interactions
        weights : dict
            Weights for combining different recommendation sources
        """
        self.courses_df = courses_df
        self.user_preferences_df = user_preferences_df
        self.interactions_df = interactions_df
        
        # Default weights for hybrid combination
        if weights is None:
            self.weights = {
                'content_based': 0.35,
                'collaborative': 0.40,
                'rule_based': 0.15,
                'popularity': 0.10
            }
        else:
            self.weights = weights
            
        # Initialize component recommenders
        self.content_recommender = ContentBasedRecommender(
            courses_df, user_preferences_df, interactions_df
        )
        self.cf_recommender = None
        
        # Prepare models
        self._prepare_models()
        
    def _prepare_models(self):
        """
        Prepare all recommendation models
        """
        print("🔧 Preparing hybrid recommendation system...")
        
        # Prepare content-based
        self.content_recommender.prepare_course_features()
        
        # Prepare collaborative filtering
        self.cf_recommender = CollaborativeFilteringRecommender(
            self.interactions_df, algorithm='SVD'
        )
        self.cf_recommender.prepare_data()
        self.cf_recommender.train_model()
        
        print("✅ Hybrid system ready!")
        
    def _get_user_interaction_count(self, user_id):
        """
        Count number of interactions for a user
        """
        return len(self.interactions_df[
            self.interactions_df['user_id'] == user_id
        ])
        
    def _apply_rule_based_scoring(self, user_id, courses_df):
        """
        Apply rule-based scoring based on user characteristics
        
        Parameters:
        -----------
        user_id : str
            User identifier
        courses_df : DataFrame
            Courses to score
            
        Returns:
        --------
        Series : Rule-based scores for each course
        """
        # Get user preferences
        user_prefs = self.user_preferences_df[
            self.user_preferences_df['user_id'] == user_id
        ]
        
        if len(user_prefs) == 0:
            return pd.Series(0.5, index=courses_df.index)
        
        user_prefs = user_prefs.iloc[0]
        scores = pd.Series(0.0, index=courses_df.index)
        
        # Rule 1: Match domain interests
        domain_interests = user_prefs['domain_interests'].split()
        for domain in domain_interests:
            domain_match = courses_df['domain'].str.contains(domain, case=False, na=False)
            scores += domain_match * 0.3
        
        # Rule 2: Match learning pace with course format
        if user_prefs['learning_pace'] == 'Fast':
            pace_match = courses_df['format'].isin(['Self-paced', 'Blended'])
            scores += pace_match * 0.2
        elif user_prefs['learning_pace'] == 'Slow':
            pace_match = courses_df['format'] == 'Instructor-led'
            scores += pace_match * 0.2
            
        # Rule 3: Match cost preference
        if user_prefs['cost_preference'] == 'Free':
            cost_match = courses_df['cost'] == 'Free'
            scores += cost_match * 0.25
        
        # Rule 4: Match preferred platforms
        preferred_platforms = user_prefs['preferred_platforms'].split()
        for platform in preferred_platforms:
            platform_match = courses_df['platform'] == platform
            scores += platform_match * 0.15
            
        # Rule 5: Match knowledge level with difficulty
        knowledge_map = {
            'Beginner': 'Beginner',
            'Intermediate': 'Intermediate',
            'Advanced': 'Advanced'
        }
        if user_prefs['knowledge_level'] in knowledge_map:
            difficulty_match = courses_df['difficulty'] == knowledge_map[user_prefs['knowledge_level']]
            scores += difficulty_match * 0.1
            
        # Normalize scores to 0-1
        if scores.max() > 0:
            scores = scores / scores.max()
        
        return scores
        
    def _get_popularity_scores(self, courses_df):
        """
        Compute popularity scores based on ratings and interaction count
        
        Parameters:
        -----------
        courses_df : DataFrame
            Courses to score
            
        Returns:
        --------
        Series : Popularity scores
        """
        # Count enrollments per course
        enrollment_counts = self.interactions_df['course_id'].value_counts()
        
        # Combine with ratings
        popularity = []
        for _, course in courses_df.iterrows():
            course_id = course['course_id']
            rating = course['rating']
            enrollment = enrollment_counts.get(course_id, 0)
            
            # Weighted popularity score
            pop_score = (rating / 5.0) * 0.6 + (min(enrollment / 10, 1)) * 0.4
            popularity.append(pop_score)
        
        return pd.Series(popularity, index=courses_df.index)
        
    def recommend(self, user_id, top_n=10, explanation=False):
        """
        Generate hybrid recommendations for a user
        
        Parameters:
        -----------
        user_id : str
            User identifier
        top_n : int
            Number of recommendations
        explanation : bool
            Include score breakdowns for explainability
            
        Returns:
        --------
        DataFrame : Hybrid recommendations with scores
        """
        # Check if user exists in interactions (cold start check)
        interaction_count = self._get_user_interaction_count(user_id)
        
        if interaction_count == 0:
            # Cold start: Use content-based + rule-based + popularity
            print(f"❄️ Cold start detected for {user_id}")
            return self._cold_start_recommend(user_id, top_n, explanation)
        
        # Get candidate courses (exclude already taken)
        taken_courses = self.interactions_df[
            self.interactions_df['user_id'] == user_id
        ]['course_id'].values
        
        candidate_courses = self.courses_df[
            ~self.courses_df['course_id'].isin(taken_courses)
        ].copy()
        
        if len(candidate_courses) == 0:
            print("⚠️ User has taken all available courses!")
            return pd.DataFrame()
        
        # Get content-based scores
        cb_recs = self.content_recommender.recommend_for_user(
            user_id, top_n=len(candidate_courses), exclude_completed=True
        )
        cb_scores = cb_recs.set_index('course_id')['similarity_score']
        
        # Get collaborative filtering scores
        cf_predictions = []
        for course_id in candidate_courses['course_id']:
            pred = self.cf_recommender.predict_rating(user_id, course_id)
            cf_predictions.append({'course_id': course_id, 'cf_score': pred / 5.0})
        cf_scores = pd.DataFrame(cf_predictions).set_index('course_id')['cf_score']
        
        # Get rule-based scores
        rule_scores = self._apply_rule_based_scoring(user_id, candidate_courses)
        candidate_courses['rule_score'] = rule_scores.values
        
        # Get popularity scores
        pop_scores = self._get_popularity_scores(candidate_courses)
        candidate_courses['popularity_score'] = pop_scores.values
        
        # Align all scores
        candidate_courses['content_score'] = candidate_courses['course_id'].map(cb_scores).fillna(0)
        candidate_courses['cf_score'] = candidate_courses['course_id'].map(cf_scores).fillna(0)
        
        # Compute hybrid score
        candidate_courses['hybrid_score'] = (
            candidate_courses['content_score'] * self.weights['content_based'] +
            candidate_courses['cf_score'] * self.weights['collaborative'] +
            candidate_courses['rule_score'] * self.weights['rule_based'] +
            candidate_courses['popularity_score'] * self.weights['popularity']
        )
        
        # Sort by hybrid score
        recommendations = candidate_courses.sort_values(
            'hybrid_score', ascending=False
        ).head(top_n)
        
        # Select columns to return
        result_columns = [
            'course_id', 'title', 'difficulty', 'duration_weeks',
            'domain', 'platform', 'rating', 'hybrid_score'
        ]
        
        if explanation:
            result_columns.extend([
                'content_score', 'cf_score', 'rule_score', 'popularity_score'
            ])
        
        return recommendations[result_columns]
    
    def _cold_start_recommend(self, user_id, top_n, explanation):
        """
        Handle cold start recommendations
        """
        # Use rule-based + popularity heavily for cold start
        candidate_courses = self.courses_df.copy()
        
        # Get rule-based scores
        rule_scores = self._apply_rule_based_scoring(user_id, candidate_courses)
        candidate_courses['rule_score'] = rule_scores.values
        
        # Get popularity scores
        pop_scores = self._get_popularity_scores(candidate_courses)
        candidate_courses['popularity_score'] = pop_scores.values
        
        # Cold start hybrid score (no CF, more weight on rules and popularity)
        candidate_courses['hybrid_score'] = (
            candidate_courses['rule_score'] * 0.6 +
            candidate_courses['popularity_score'] * 0.4
        )
        
        # Sort and return
        recommendations = candidate_courses.sort_values(
            'hybrid_score', ascending=False
        ).head(top_n)
        
        result_columns = [
            'course_id', 'title', 'difficulty', 'duration_weeks',
            'domain', 'platform', 'rating', 'hybrid_score'
        ]
        
        if explanation:
            result_columns.extend(['rule_score', 'popularity_score'])
        
        return recommendations[result_columns]
    
    def recommend_for_at_risk_student(self, user_id, risk_factors, top_n=5):
        """
        Specialized recommendations for at-risk students
        Considers risk factors and suggests easier/engaging courses
        
        Parameters:
        -----------
        user_id : str
            User identifier
        risk_factors : dict
            Risk indicators (e.g., {'low_gpa': True, 'poor_attendance': True})
        top_n : int
            Number of recommendations
            
        Returns:
        --------
        DataFrame : Tailored recommendations for at-risk students
        """
        # Get base recommendations
        base_recs = self.recommend(user_id, top_n=top_n * 2, explanation=True)
        
        if len(base_recs) == 0:
            return base_recs
        
        # Adjust scores based on risk factors
        adjustments = base_recs['hybrid_score'].copy()
        
        # If struggling academically, prefer easier courses
        if risk_factors.get('low_gpa', False) or risk_factors.get('failed_courses', False):
            difficulty_boost = base_recs['difficulty'].map({
                'Beginner': 0.2,
                'Intermediate': 0.0,
                'Advanced': -0.15
            })
            adjustments += difficulty_boost
        
        # If low engagement, prefer shorter, interactive courses
        if risk_factors.get('low_engagement', False):
            # Prefer shorter courses
            duration_penalty = (base_recs['duration_weeks'] - 4) * -0.02
            adjustments += duration_penalty
            
            # Boost highly rated courses
            rating_boost = (base_recs['rating'] - 3) * 0.1
            adjustments += rating_boost
        
        # Update hybrid score with adjustments
        base_recs['adjusted_score'] = adjustments
        
        # Sort by adjusted score
        recommendations = base_recs.sort_values(
            'adjusted_score', ascending=False
        ).head(top_n)
        
        return recommendations[[
            'course_id', 'title', 'difficulty', 'duration_weeks',
            'domain', 'platform', 'rating', 'adjusted_score'
        ]]


if __name__ == "__main__":
    # Test hybrid recommender
    courses = pd.read_csv('../data/courses.csv')
    user_prefs = pd.read_csv('../data/user_preferences.csv')
    interactions = pd.read_csv('../data/user_course_interactions.csv')
    
    # Initialize hybrid recommender
    hybrid = HybridRecommender(courses, user_prefs, interactions)
    
    # Test for existing user
    print("\n" + "="*70)
    print("Testing Hybrid Recommendations for Existing User (U001)")
    print("="*70)
    recs = hybrid.recommend('U001', top_n=5, explanation=True)
    print(recs)
    
    # Test cold start
    print("\n" + "="*70)
    print("Testing Cold Start for New User (U999)")
    print("="*70)
    # Add a new user preference first
    new_user = pd.DataFrame([{
        'user_id': 'U999',
        'age_group': '25-34',
        'occupation': 'Student',
        'learning_mode_preference': 'Online',
        'learning_method': 'Visual Practical',
        'course_format': 'Self-paced',
        'learning_pace': 'Fast',
        'domain_interests': 'Data Science Machine Learning',
        'knowledge_level': 'Beginner',
        'cost_preference': 'Free',
        'duration_preference': 'Short (1-4 weeks)',
        'platform_features_preferred': 'Interactive quizzes Video content',
        'importance_of_reviews': 'Very Important',
        'preferred_platforms': 'Coursera Udemy'
    }])
    hybrid.user_preferences_df = pd.concat([
        hybrid.user_preferences_df, new_user
    ], ignore_index=True)
    
    cold_recs = hybrid.recommend('U999', top_n=5, explanation=True)
    print(cold_recs)
    
    # Test at-risk student recommendations
    print("\n" + "="*70)
    print("Testing At-Risk Student Recommendations")
    print("="*70)
    risk_factors = {
        'low_gpa': True,
        'low_engagement': True,
        'failed_courses': False
    }
    at_risk_recs = hybrid.recommend_for_at_risk_student('U001', risk_factors, top_n=5)
    print(at_risk_recs)
