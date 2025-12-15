"""
Configuration path utilities for DeepCode project.

This module provides utilities to resolve configuration file paths correctly
regardless of the current working directory.
"""

import os
from pathlib import Path


def get_project_root() -> Path:
    """
    Get the project root directory.

    This function finds the project root by looking for marker files
    (mcp_agent.config.yaml, README.md, etc.)

    Returns:
        Path: The project root directory
    """
    # Start from the current file's directory
    current = Path(__file__).resolve()

    # Go up to find the project root (where mcp_agent.config.yaml exists)
    for parent in [current.parent.parent] + list(current.parents):
        if (parent / "mcp_agent.config.yaml").exists():
            return parent

    # Fallback: return current working directory if no marker found
    return Path.cwd()


def get_config_path(filename: str = "mcp_agent.config.yaml") -> str:
    """
    Get the absolute path to a configuration file.

    Args:
        filename: Configuration filename (default: mcp_agent.config.yaml)

    Returns:
        str: Absolute path to the configuration file
    """
    project_root = get_project_root()
    return str(project_root / filename)


def get_secrets_path(filename: str = "mcp_agent.secrets.yaml") -> str:
    """
    Get the absolute path to the secrets file.

    Args:
        filename: Secrets filename (default: mcp_agent.secrets.yaml)

    Returns:
        str: Absolute path to the secrets file
    """
    return get_config_path(filename)


# Pre-compute paths for efficiency
PROJECT_ROOT = get_project_root()
CONFIG_PATH = get_config_path()
SECRETS_PATH = get_secrets_path()


if __name__ == "__main__":
    # Test the utilities
    print("Project Root:", PROJECT_ROOT)
    print("Config Path:", CONFIG_PATH)
    print("Config exists:", os.path.exists(CONFIG_PATH))
    print("Secrets Path:", SECRETS_PATH)
    print("Secrets exists:", os.path.exists(SECRETS_PATH))
