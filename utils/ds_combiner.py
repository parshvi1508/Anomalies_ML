"""
Dempster-Shafer Evidence Theory Utilities
Used for evidence fusion in dropout prediction
"""

import numpy as np
from typing import Tuple, Dict, Optional


class DempsterShaferCombination:
    """
    Dempster-Shafer evidence combination for dropout prediction
    
    Combines evidence from multiple sources:
    - Anomaly detection scores
    - Classification probabilities
    - Expert rule scores
    
    Provides belief, plausibility, and uncertainty intervals
    """
    
    def __init__(self, classes=("non-dropout", "dropout")):
        """
        Initialize DS combiner
        
        Parameters:
        -----------
        classes : tuple
            Class labels (non-dropout, dropout)
        """
        self.classes = classes
        self.frame = [
            set(),                    # Empty set
            {classes[0]},             # Non-dropout
            {classes[1]},             # Dropout
            set(classes)              # Uncertainty (Θ)
        ]
    
    def _convert_proba_to_mass(self, proba: float, uncertainty: float = 0.2) -> Dict:
        """
        Convert probability to mass function
        
        Parameters:
        -----------
        proba : float
            Probability of dropout class (0-1)
        uncertainty : float
            Uncertainty level (0-1)
            
        Returns:
        --------
        dict : Mass function with frozenset keys
        """
        p = float(np.clip(proba, 1e-4, 1-1e-4))
        
        m = {
            frozenset(): 0.0,
            frozenset({self.classes[0]}): (1 - p) * (1 - uncertainty),
            frozenset({self.classes[1]}): p * (1 - uncertainty),
            frozenset(self.classes): uncertainty
        }
        return m
    
    def _combine_masses(self, m1: Dict, m2: Dict) -> Dict:
        """
        Combine two mass functions using Dempster's rule
        
        Parameters:
        -----------
        m1, m2 : dict
            Mass functions to combine
            
        Returns:
        --------
        dict : Combined mass function
        """
        out = {}
        k = 0.0  # Conflict
        
        # Compute combinations
        for a, va in m1.items():
            for b, vb in m2.items():
                inter = frozenset(set(a).intersection(set(b)))
                prod = va * vb
                
                if len(inter) == 0:  # Empty intersection = conflict
                    k += prod
                else:
                    out[inter] = out.get(inter, 0.0) + prod
        
        # Normalize by (1 - conflict)
        if k < 1.0:
            for key in out:
                out[key] /= (1 - k)
        
        # Ensure all focal sets exist
        for s in [frozenset(), 
                  frozenset({self.classes[0]}), 
                  frozenset({self.classes[1]}), 
                  frozenset(self.classes)]:
            out.setdefault(s, 0.0)
        
        return out
    
    def combine(self, anomaly_score: float, clf_proba: float, 
                expert_score: Optional[float] = None) -> Tuple[float, float, float]:
        """
        Combine evidence from multiple sources
        
        Parameters:
        -----------
        anomaly_score : float
            Normalized anomaly score (0-1)
        clf_proba : float
            Classifier probability (0-1)
        expert_score : float, optional
            Expert rule score (0-1)
            
        Returns:
        --------
        tuple : (belief, plausibility, uncertainty)
            - belief: Lower bound of dropout probability
            - plausibility: Upper bound of dropout probability
            - uncertainty: Interval width (plausibility - belief)
        """
        # Convert to mass functions
        m_anom = self._convert_proba_to_mass(anomaly_score, uncertainty=0.25)
        m_clf = self._convert_proba_to_mass(clf_proba, uncertainty=0.15)
        
        # Combine anomaly and classifier
        m = self._combine_masses(m_anom, m_clf)
        
        # Add expert rules if available
        if expert_score is not None:
            m_exp = self._convert_proba_to_mass(expert_score, uncertainty=0.20)
            m = self._combine_masses(m, m_exp)
        
        # Extract belief and plausibility for dropout class
        drop = frozenset({self.classes[1]})
        belief = m[drop]
        plausibility = belief + m[frozenset(self.classes)]
        uncertainty = plausibility - belief
        
        return belief, plausibility, uncertainty


class DempsterShaferCombinationDynamic(DempsterShaferCombination):
    """
    Dynamic uncertainty version of DS combination
    
    Computes instance-specific uncertainty based on:
    - Model confidence (entropy)
    - Decision boundary distance
    - Number of triggered rules
    """
    
    def compute_dynamic_uncertainty(self, proba: float, 
                                   model_type: str = 'classifier') -> float:
        """
        Compute instance-specific uncertainty
        
        Parameters:
        -----------
        proba : float
            Model probability output
        model_type : str
            'classifier', 'anomaly', or 'expert'
            
        Returns:
        --------
        float : Dynamic uncertainty (0-0.4)
        """
        if model_type == 'classifier':
            # Entropy-based uncertainty
            p = np.clip(proba, 1e-10, 1-1e-10)
            entropy = -p * np.log2(p) - (1-p) * np.log2(1-p)
            uncertainty = entropy  # Max entropy = 1.0
            
        elif model_type == 'anomaly':
            # Distance from decision boundary
            uncertainty = 1 - 2 * abs(proba - 0.5)
            
        elif model_type == 'expert':
            # Fixed for expert rules
            uncertainty = 0.20
            
        else:
            uncertainty = 0.15  # Default
        
        return float(np.clip(uncertainty, 0.01, 0.40))
    
    def combine_dynamic(self, anomaly_score: float, clf_proba: float,
                       expert_score: Optional[float] = None) -> Tuple[float, float, float]:
        """
        Combine evidence with dynamic uncertainty
        
        Parameters:
        -----------
        anomaly_score : float
            Normalized anomaly score (0-1)
        clf_proba : float
            Classifier probability (0-1)
        expert_score : float, optional
            Expert rule score (0-1)
            
        Returns:
        --------
        tuple : (belief, plausibility, uncertainty)
        """
        # Compute dynamic uncertainties
        u_anom = self.compute_dynamic_uncertainty(anomaly_score, 'anomaly')
        u_clf = self.compute_dynamic_uncertainty(clf_proba, 'classifier')
        
        # Convert to mass functions with dynamic uncertainty
        m_anom = self._convert_proba_to_mass(anomaly_score, uncertainty=u_anom)
        m_clf = self._convert_proba_to_mass(clf_proba, uncertainty=u_clf)
        
        # Combine
        m = self._combine_masses(m_anom, m_clf)
        
        # Add expert if available
        if expert_score is not None:
            u_exp = self.compute_dynamic_uncertainty(expert_score, 'expert')
            m_exp = self._convert_proba_to_mass(expert_score, uncertainty=u_exp)
            m = self._combine_masses(m, m_exp)
        
        # Extract results
        drop = frozenset({self.classes[1]})
        belief = m[drop]
        plausibility = belief + m[frozenset(self.classes)]
        uncertainty = plausibility - belief
        
        return belief, plausibility, uncertainty


def expert_rule_score(student_data: Dict) -> float:
    """
    Rule-based scoring system based on domain expertise
    
    Parameters:
    -----------
    student_data : dict
        Student features (gpa, attendance, failed_courses, etc.)
        
    Returns:
    --------
    float : Expert score (0-1), higher = higher dropout risk
    """
    score = 0.0
    
    # Rule 1: Low GPA (50% weight)
    if 'gpa' in student_data:
        if student_data['gpa'] < 2.0:
            score += 0.5
        elif student_data['gpa'] < 2.5:
            score += 0.3
    
    # Rule 2: Poor attendance (30% weight)
    if 'attendance' in student_data:
        if student_data['attendance'] < 65:
            score += 0.3
        elif student_data['attendance'] < 75:
            score += 0.2
    
    # Rule 3: Multiple failures (20% weight)
    if 'failed_courses' in student_data:
        if student_data['failed_courses'] > 3:
            score += 0.2
        elif student_data['failed_courses'] > 2:
            score += 0.1
    
    return float(np.clip(score, 0.0, 1.0))
