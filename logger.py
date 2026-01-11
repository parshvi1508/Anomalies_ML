"""
Centralized Logging Configuration
Industry-standard logging with file rotation
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from config import settings


def setup_logger(name: str = "student_analytics") -> logging.Logger:
    """
    Setup application logger with console and file handlers
    
    Parameters:
    -----------
    name : str
        Logger name
        
    Returns:
    --------
    logging.Logger
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler with rotation
    try:
        file_handler = RotatingFileHandler(
            settings.log_file,
            maxBytes=settings.log_max_size_mb * 1024 * 1024,  # Convert MB to bytes
            backupCount=settings.log_backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        logger.warning(f"Could not setup file logging: {e}")
    
    return logger


# Global logger instance
logger = setup_logger()
