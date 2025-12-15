"""
Configuration manager for the Performance Specification Toolkit.
Handles loading and parsing of configuration from YAML files and environment variables.
"""

import os
import yaml
from typing import Any, Dict, Optional


class Config:
    """Handles configuration loading and access."""

    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize the configuration.
        :param config_file: Path to the YAML configuration file.
        """
        self._config: Dict[str, Any] = {}
        if config_file and os.path.exists(config_file):
            self.load_from_yaml(config_file)
        self.load_from_env()

    def load_from_yaml(self, file_path: str) -> None:
        """Load configuration from a YAML file."""
        try:
            with open(file_path, 'r') as f:
                yaml_config = yaml.safe_load(f)
                if yaml_config:
                    self._config.update(yaml_config)
        except Exception as e:
            raise RuntimeError(f"Failed to load config from {file_path}: {e}")

    def load_from_env(self) -> None:
        """Load configuration from environment variables."""
        # Example: SPEC_KIT_TIMEOUT -> spec_kit.timeout
        for key, value in os.environ.items():
            if key.startswith("SPEC_KIT_"):
                config_key = key.replace("SPEC_KIT_", "").lower().replace("_", ".")
                self._set_nested(config_key, value)

    def _set_nested(self, key: str, value: Any) -> None:
        """Set a nested configuration value using dot notation."""
        keys = key.split('.')
        d = self._config
        for k in keys[:-1]:
            if k not in d:
                d[k] = {}
            d = d[k]
        d[keys[-1]] = value

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value using dot notation.
        :param key: Dot-separated key (e.g., 'crawler.max_depth')
        :param default: Default value if key is not found
        :return: Configuration value
        """
        keys = key.split('.')
        value = self._config
        try:
            for k in keys:
                value = value[k]
            return value
        except KeyError:
            return default

    def set(self, key: str, value: Any) -> None:
        """
        Set a configuration value using dot notation.
        :param key: Dot-separated key
        :param value: Value to set
        """
        self._set_nested(key, value)


# Global config instance
_config_instance: Optional[Config] = None

def get_config(config_file: Optional[str] = None) -> Config:
    """
    Get the global Config instance.
    :param config_file: Optional path to config file
    :return: Config instance
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = Config(config_file)
    return _config_instance
