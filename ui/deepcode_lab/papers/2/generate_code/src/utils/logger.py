"""
Logger module for the performance specification toolkit.
Handles logging configuration and provides a global logger instance.
"""

import logging
import os
from datetime import datetime
from typing import Optional

class Logger:
    """A simple logging wrapper class for the toolkit."""
    
    def __init__(self, name: str = "perf-spec", log_level: int = logging.INFO):
        """Initialize the logger with a given name and log level.
        
        Args:
            name (str): Name of the logger
            log_level (int): Logging level (e.g., logging.INFO, logging.DEBUG)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        
        # Prevent adding multiple handlers if logger already has them
        if not self.logger.handlers:
            # Create logs directory if it doesn't exist
            logs_dir = "logs"
            if not os.path.exists(logs_dir):
                os.makedirs(logs_dir)
            
            # File handler
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            log_file = os.path.join(logs_dir, f"{name}_{timestamp}.log")
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(log_level)
            
            # Console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(log_level)
            
            # Formatter
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)
            
            # Add handlers to logger
            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)
    
    def get_logger(self) -> logging.Logger:
        """Return the configured logger instance.
        
        Returns:
            logging.Logger: Configured logger instance
        """
        return self.logger

# Global logger instance
_default_logger = None

def get_logger() -> logging.Logger:
    """Get the global logger instance.
    
    Returns:
        logging.Logger: Global logger instance
    """
    global _default_logger
    if _default_logger is None:
        _default_logger = Logger().get_logger()
    return _default_logger

# Convenience functions
def debug(msg: str):
    """Log a debug message."""
    get_logger().debug(msg)

def info(msg: str):
    """Log an info message."""
    get_logger().info(msg)

def warning(msg: str):
    """Log a warning message."""
    get_logger().warning(msg)

def error(msg: str):
    """Log an error message."""
    get_logger().error(msg)

def critical(msg: str):
    """Log a critical message."""
    get_logger().critical(msg)