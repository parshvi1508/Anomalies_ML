"""
Model Loader - Handles unpickling of models trained in notebooks
Resolves module path issues for DempsterShafer classes
"""

import pickle
import sys
import os
from pathlib import Path

# Add utils to path for DS combiner
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'utils'))

# Import DS classes to make them available during unpickling
from ds_combiner import DempsterShaferCombination, DempsterShaferCombinationDynamic

# Make classes available in __main__ namespace for unpickling
import __main__
__main__.DempsterShaferCombination = DempsterShaferCombination
__main__.DempsterShaferCombinationDynamic = DempsterShaferCombinationDynamic


def load_model(model_path: Path):
    """
    Load a pickled model with proper class resolution
    
    Parameters:
    -----------
    model_path : Path
        Path to pickled model file
        
    Returns:
    --------
    object
        Loaded model
    """
    with open(model_path, 'rb') as f:
        return pickle.load(f)


def load_all_models(models_dir: Path):
    """
    Load all trained models from directory
    
    Parameters:
    -----------
    models_dir : Path
        Directory containing model files
        
    Returns:
    --------
    dict
        Dictionary of loaded models
    """
    models = {}
    
    try:
        # Load Isolation Forest
        models['anomaly'] = load_model(models_dir / 'anomaly_model.pkl')
        
        # Load Random Forest
        models['dropout'] = load_model(models_dir / 'dropout_model.pkl')
        
        # Load DS Combiner (with special handling)
        models['ds_combiner'] = load_model(models_dir / 'ds_combiner.pkl')
        
        # Load Metadata
        models['metadata'] = load_model(models_dir / 'model_info.pkl')
        
        return models
        
    except Exception as e:
        raise RuntimeError(f"Model loading failed: {str(e)}")
