"""
Content-Based Filtering Module for Course Recommendations
Uses course features and learner preferences to compute similarity
Implements cosine similarity as per methodology document
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')


class ContentBasedRecommender:
    """
    Content-based filtering using course features and learner profiles
    """
    
    def __init__(self, courses_df, user_preferences_df, interactions_df):
        """
        Initialize the content-based recommender
        
        Parameters:
        -----------
        courses_df : DataFrame
            Course metadata
        user_preferences_df : DataFrame
            User preference profiles
        interactions_df : DataFrame
            User-course interaction history
        """
        self.courses_df = courses_df.copy()
        self.user_preferences_df = user_preferences_df.copy()
        self.interactions_df = interactions_df.copy()
        self.course_features_matrix = None
        self.course_similarity_matrix = None
        
    def prepare_course_features(self):
        """
        Prepare TF-IDF feature matrix from course descriptions and attributes
        """
        # Combine text features
        self.courses_df['combined_features'] = (
            self.courses_df['title'] + ' ' +
            self.courses_df['domain'] + ' ' +
            self.courses_df['description'] + ' ' +
            self.courses_df['learning_objectives'] + ' ' +
            self.courses_df['difficulty'] + ' ' +
            self.courses_df['format'] + ' ' +
            self.courses_df['platform']
        )
        
        # TF-IDF vectorization
        tfidf = TfidfVectorizer(stop_words='english', max_features=100)
        self.course_features_matrix = tfidf.fit_transform(
            self.courses_df['combined_features']
        )
        
        # Compute course-course similarity matrix
        self.course_similarity_matrix = cosine_similarity(
            self.course_features_matrix
        )
        
        print(f"✅ Course feature matrix prepared: {self.course_features_matrix.shape}")
        
    def get_user_profile_vector(self, user_id):
        """
        Build user profile vector from their interaction history
        
        Parameters:
        -----------
        user_id : str
            User identifier
            
        Returns:
        --------
        numpy.ndarray : User profile feature vector
        """
        # Get user's completed/in-progress courses
        user_interactions = self.interactions_df[
            (self.interactions_df['user_id'] == user_id) &
            (self.interactions_df['completion_status'].isin(['Completed', 'In Progress']))
        ]
        
        if len(user_interactions) == 0:
            # Cold start: return zeros
            return np.zeros(self.course_features_matrix.shape[1])
        
        # Get course indices
        course_ids = user_interactions['course_id'].values
        course_indices = [
            self.courses_df[self.courses_df['course_id'] == cid].index[0]
            for cid in course_ids
            if cid in self.courses_df['course_id'].values
        ]
        
        # Weight by ratings and time spent
        weights = user_interactions['implicit_rating'].values
        
        # Weighted average of course feature vectors
        weighted_vectors = []
        for idx, weight in zip(course_indices, weights):
            course_vector = self.course_features_matrix[idx].toarray().flatten()
            weighted_vectors.append(course_vector * weight)
        
        user_profile = np.mean(weighted_vectors, axis=0)
        return user_profile
        
    def recommend_for_user(self, user_id, top_n=5, exclude_completed=True):
        """
        Generate content-based recommendations for a user
        
        Parameters:
        -----------
        user_id : str
            User identifier
        top_n : int
            Number of recommendations to return
        exclude_completed : bool
            Whether to exclude already taken courses
            
        Returns:
        --------
        DataFrame : Recommended courses with similarity scores
        """
        # Build user profile
        user_profile = self.get_user_profile_vector(user_id)
        
        # Compute similarity with all courses
        course_similarities = cosine_similarity(
            user_profile.reshape(1, -1),
            self.course_features_matrix
        ).flatten()
        
        # Create recommendations dataframe
        recommendations = self.courses_df.copy()
        recommendations['similarity_score'] = course_similarities
        
        # Exclude already taken courses
        if exclude_completed:
            taken_courses = self.interactions_df[
                self.interactions_df['user_id'] == user_id
            ]['course_id'].values
            recommendations = recommendations[
                ~recommendations['course_id'].isin(taken_courses)
            ]
        
        # Sort by similarity and return top N
        recommendations = recommendations.sort_values(
            'similarity_score', ascending=False
        ).head(top_n)
        
        return recommendations[[
            'course_id', 'title', 'difficulty', 'duration_weeks',
            'domain', 'platform', 'rating', 'similarity_score'
        ]]
    
    def recommend_similar_courses(self, course_id, top_n=5):
        """
        Find courses similar to a given course
        
        Parameters:
        -----------
        course_id : str
            Course identifier
        top_n : int
            Number of similar courses to return
            
        Returns:
        --------
        DataFrame : Similar courses with similarity scores
        """
        # Get course index
        course_idx = self.courses_df[
            self.courses_df['course_id'] == course_id
        ].index[0]
        
        # Get similarity scores
        similarities = self.course_similarity_matrix[course_idx]
        
        # Create recommendations dataframe
        similar_courses = self.courses_df.copy()
        similar_courses['similarity_score'] = similarities
        
        # Exclude the query course itself
        similar_courses = similar_courses[
            similar_courses['course_id'] != course_id
        ]
        
        # Sort and return top N
        similar_courses = similar_courses.sort_values(
            'similarity_score', ascending=False
        ).head(top_n)
        
        return similar_courses[[
            'course_id', 'title', 'difficulty', 'domain',
            'platform', 'rating', 'similarity_score'
        ]]


def cold_start_recommendations(user_preferences_df, courses_df, user_id, top_n=5):
    """
    Handle cold start for new users based on their stated preferences
    
    Parameters:
    -----------
    user_preferences_df : DataFrame
        User preference data
    courses_df : DataFrame
        Course metadata
    user_id : str
        User identifier
    top_n : int
        Number of recommendations
        
    Returns:
    --------
    DataFrame : Recommended courses for cold start users
    """
    # Get user preferences
    user_prefs = user_preferences_df[
        user_preferences_df['user_id'] == user_id
    ]
    
    if len(user_prefs) == 0:
        # Return popular courses
        return courses_df.sort_values('rating', ascending=False).head(top_n)
    
    user_prefs = user_prefs.iloc[0]
    
    # Filter courses by preferences
    recommended = courses_df.copy()
    
    # Match domain interests
    domain_interests = user_prefs['domain_interests'].split()
    domain_match = recommended['domain'].apply(
        lambda x: any(d in x for d in domain_interests)
    )
    
    # Match course format
    format_match = recommended['format'] == user_prefs['course_format']
    
    # Match cost preference
    if user_prefs['cost_preference'] == 'Free':
        cost_match = recommended['cost'] == 'Free'
    else:
        cost_match = recommended['cost'].isin(['Free', 'Paid'])
    
    # Combine filters
    recommended['match_score'] = (
        domain_match.astype(int) * 3 +  # Domain is most important
        format_match.astype(int) * 2 +
        cost_match.astype(int) * 1
    )
    
    # Add rating weight
    scaler = MinMaxScaler()
    recommended['rating_normalized'] = scaler.fit_transform(
        recommended[['rating']]
    )
    
    recommended['final_score'] = (
        recommended['match_score'] * 0.7 +
        recommended['rating_normalized'] * 0.3
    )
    
    return recommended.sort_values('final_score', ascending=False).head(top_n)[[
        'course_id', 'title', 'difficulty', 'duration_weeks',
        'domain', 'platform', 'rating', 'final_score'
    ]]


if __name__ == "__main__":
    # Test the content-based recommender
    courses = pd.read_csv('../data/courses.csv')
    user_prefs = pd.read_csv('../data/user_preferences.csv')
    interactions = pd.read_csv('../data/user_course_interactions.csv')
    
    # Initialize recommender
    cb_recommender = ContentBasedRecommender(courses, user_prefs, interactions)
    cb_recommender.prepare_course_features()
    
    # Test recommendations for a user
    user_id = 'U001'
    recommendations = cb_recommender.recommend_for_user(user_id, top_n=5)
    print(f"\n📚 Content-Based Recommendations for {user_id}:")
    print(recommendations)
    
    # Test cold start
    cold_start_recs = cold_start_recommendations(user_prefs, courses, 'U001', top_n=5)
    print(f"\n❄️ Cold Start Recommendations for {user_id}:")
    print(cold_start_recs)
