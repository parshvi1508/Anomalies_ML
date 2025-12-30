"""
Collaborative Filtering Module using Surprise Library
Implements user-based and item-based collaborative filtering
As per methodology document requirements
"""

import pandas as pd
import numpy as np
from surprise import SVD, KNNBasic, Dataset, Reader
from surprise.model_selection import cross_validate, train_test_split
from surprise import accuracy
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')


class CollaborativeFilteringRecommender:
    """
    Collaborative filtering using explicit and implicit ratings
    Supports both user-based and item-based approaches
    """
    
    def __init__(self, interactions_df, algorithm='SVD'):
        """
        Initialize collaborative filtering recommender
        
        Parameters:
        -----------
        interactions_df : DataFrame
            User-course interaction data with ratings
        algorithm : str
            Algorithm to use: 'SVD', 'KNN_user', or 'KNN_item'
        """
        self.interactions_df = interactions_df.copy()
        self.algorithm_name = algorithm
        self.model = None
        self.trainset = None
        self.testset = None
        
    def prepare_data(self):
        """
        Prepare data in Surprise library format
        """
        # Use explicit ratings if available, otherwise use implicit ratings
        rating_data = self.interactions_df[[
            'user_id', 'course_id', 'rating'
        ]].copy()
        
        # Define rating scale
        reader = Reader(rating_scale=(1, 5))
        
        # Load data into Surprise Dataset
        data = Dataset.load_from_df(rating_data, reader)
        
        # Split into train and test sets
        self.trainset, self.testset = train_test_split(data, test_size=0.2)
        
        print(f"✅ Data prepared: {self.trainset.n_ratings} training ratings")
        
    def train_model(self):
        """
        Train the collaborative filtering model
        """
        if self.algorithm_name == 'SVD':
            # Matrix factorization approach
            self.model = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02)
            
        elif self.algorithm_name == 'KNN_user':
            # User-based collaborative filtering
            sim_options = {
                'name': 'cosine',
                'user_based': True
            }
            self.model = KNNBasic(sim_options=sim_options, k=40)
            
        elif self.algorithm_name == 'KNN_item':
            # Item-based collaborative filtering
            sim_options = {
                'name': 'cosine',
                'user_based': False
            }
            self.model = KNNBasic(sim_options=sim_options, k=40)
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm_name}")
        
        # Train the model
        self.model.fit(self.trainset)
        print(f"✅ {self.algorithm_name} model trained successfully")
        
    def evaluate_model(self):
        """
        Evaluate model performance on test set
        
        Returns:
        --------
        dict : Evaluation metrics (RMSE, MAE)
        """
        # Make predictions on test set
        predictions = self.model.test(self.testset)
        
        # Calculate metrics
        rmse = accuracy.rmse(predictions, verbose=False)
        mae = accuracy.mae(predictions, verbose=False)
        
        metrics = {
            'RMSE': rmse,
            'MAE': mae
        }
        
        print(f"\n📊 Model Evaluation ({self.algorithm_name}):")
        print(f"  RMSE: {rmse:.4f}")
        print(f"  MAE: {mae:.4f}")
        
        return metrics
        
    def predict_rating(self, user_id, course_id):
        """
        Predict rating for a user-course pair
        
        Parameters:
        -----------
        user_id : str
            User identifier
        course_id : str
            Course identifier
            
        Returns:
        --------
        float : Predicted rating
        """
        prediction = self.model.predict(user_id, course_id)
        return prediction.est
        
    def recommend_for_user(self, user_id, courses_df, top_n=5, exclude_taken=True):
        """
        Generate recommendations for a user
        
        Parameters:
        -----------
        user_id : str
            User identifier
        courses_df : DataFrame
            Course metadata
        top_n : int
            Number of recommendations
        exclude_taken : bool
            Exclude courses already taken
            
        Returns:
        --------
        DataFrame : Recommended courses with predicted ratings
        """
        # Get all courses
        all_courses = courses_df['course_id'].values
        
        # Get courses already taken by user
        if exclude_taken:
            taken_courses = self.interactions_df[
                self.interactions_df['user_id'] == user_id
            ]['course_id'].values
            
            candidate_courses = [
                c for c in all_courses if c not in taken_courses
            ]
        else:
            candidate_courses = all_courses
        
        # Predict ratings for all candidate courses
        predictions = []
        for course_id in candidate_courses:
            pred_rating = self.predict_rating(user_id, course_id)
            predictions.append({
                'course_id': course_id,
                'predicted_rating': pred_rating
            })
        
        # Create recommendations dataframe
        recommendations = pd.DataFrame(predictions)
        
        # Merge with course metadata
        recommendations = recommendations.merge(
            courses_df[[
                'course_id', 'title', 'difficulty', 'duration_weeks',
                'domain', 'platform', 'rating'
            ]],
            on='course_id',
            how='left'
        )
        
        # Sort by predicted rating
        recommendations = recommendations.sort_values(
            'predicted_rating', ascending=False
        ).head(top_n)
        
        return recommendations
    
    def get_similar_users(self, user_id, k=5):
        """
        Find similar users (for user-based CF)
        
        Parameters:
        -----------
        user_id : str
            User identifier
        k : int
            Number of similar users to return
            
        Returns:
        --------
        list : Similar user IDs with similarity scores
        """
        if self.algorithm_name != 'KNN_user':
            print("⚠️ Similar users only available for KNN_user algorithm")
            return []
        
        try:
            # Get inner user id
            inner_id = self.trainset.to_inner_uid(user_id)
            
            # Get k nearest neighbors
            neighbors = self.model.get_neighbors(inner_id, k=k)
            
            # Convert back to raw IDs
            similar_users = []
            for neighbor_id in neighbors:
                raw_id = self.trainset.to_raw_uid(neighbor_id)
                # Get similarity score
                sim_score = self.model.sim[inner_id, neighbor_id]
                similar_users.append({
                    'user_id': raw_id,
                    'similarity': sim_score
                })
            
            return similar_users
        except ValueError:
            print(f"⚠️ User {user_id} not found in training data")
            return []
    
    def get_similar_items(self, course_id, k=5):
        """
        Find similar courses (for item-based CF)
        
        Parameters:
        -----------
        course_id : str
            Course identifier
        k : int
            Number of similar courses to return
            
        Returns:
        --------
        list : Similar course IDs with similarity scores
        """
        if self.algorithm_name != 'KNN_item':
            print("⚠️ Similar items only available for KNN_item algorithm")
            return []
        
        try:
            # Get inner item id
            inner_id = self.trainset.to_inner_iid(course_id)
            
            # Get k nearest neighbors
            neighbors = self.model.get_neighbors(inner_id, k=k)
            
            # Convert back to raw IDs
            similar_courses = []
            for neighbor_id in neighbors:
                raw_id = self.trainset.to_raw_iid(neighbor_id)
                # Get similarity score
                sim_score = self.model.sim[inner_id, neighbor_id]
                similar_courses.append({
                    'course_id': raw_id,
                    'similarity': sim_score
                })
            
            return similar_courses
        except ValueError:
            print(f"⚠️ Course {course_id} not found in training data")
            return []


class ImplicitFeedbackCF:
    """
    Collaborative filtering based on implicit feedback
    (time spent, clicks, video views, etc.)
    """
    
    def __init__(self, interactions_df):
        """
        Initialize implicit feedback CF
        
        Parameters:
        -----------
        interactions_df : DataFrame
            Interaction data with implicit signals
        """
        self.interactions_df = interactions_df.copy()
        
    def compute_implicit_ratings(self):
        """
        Compute implicit ratings from behavioral signals
        
        Returns:
        --------
        DataFrame : Data with computed implicit ratings
        """
        df = self.interactions_df.copy()
        
        # Normalize time spent (0-1)
        max_time = df['time_spent_hours'].max()
        df['time_score'] = df['time_spent_hours'] / max_time
        
        # Normalize video views (0-1)
        df['video_score'] = df['video_views_percent'] / 100
        
        # Quiz attempts score (cap at 1)
        max_quiz = df['quiz_attempts'].quantile(0.95)
        df['quiz_score'] = np.minimum(df['quiz_attempts'] / max_quiz, 1)
        
        # Forum engagement score (cap at 1)
        max_posts = df['forum_posts'].quantile(0.95)
        df['forum_score'] = np.minimum(df['forum_posts'] / max_posts, 1)
        
        # Completion bonus
        df['completion_score'] = df['completion_status'].map({
            'Completed': 1.0,
            'In Progress': 0.5,
            'Dropped': 0.0
        })
        
        # Weighted combination (weights based on importance)
        df['computed_implicit_rating'] = (
            df['time_score'] * 0.25 +
            df['video_score'] * 0.20 +
            df['quiz_score'] * 0.15 +
            df['forum_score'] * 0.10 +
            df['completion_score'] * 0.30
        )
        
        # Scale to 1-5 rating range
        df['computed_implicit_rating'] = (
            df['computed_implicit_rating'] * 4 + 1
        )
        
        return df


if __name__ == "__main__":
    # Test collaborative filtering
    interactions = pd.read_csv('../data/user_course_interactions.csv')
    courses = pd.read_csv('../data/courses.csv')
    
    # Test SVD
    print("\n" + "="*60)
    print("Testing SVD (Matrix Factorization)")
    print("="*60)
    cf_svd = CollaborativeFilteringRecommender(interactions, algorithm='SVD')
    cf_svd.prepare_data()
    cf_svd.train_model()
    cf_svd.evaluate_model()
    
    recommendations = cf_svd.recommend_for_user('U001', courses, top_n=5)
    print(f"\n📚 SVD Recommendations for U001:")
    print(recommendations[['title', 'predicted_rating', 'domain']])
    
    # Test User-based CF
    print("\n" + "="*60)
    print("Testing User-Based Collaborative Filtering")
    print("="*60)
    cf_user = CollaborativeFilteringRecommender(interactions, algorithm='KNN_user')
    cf_user.prepare_data()
    cf_user.train_model()
    cf_user.evaluate_model()
    
    # Test Item-based CF
    print("\n" + "="*60)
    print("Testing Item-Based Collaborative Filtering")
    print("="*60)
    cf_item = CollaborativeFilteringRecommender(interactions, algorithm='KNN_item')
    cf_item.prepare_data()
    cf_item.train_model()
    cf_item.evaluate_model()
