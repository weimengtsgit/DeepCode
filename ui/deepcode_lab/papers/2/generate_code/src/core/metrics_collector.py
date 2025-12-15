"""
Module: metrics_collector.py

This module implements the MetricsCollector class, responsible for gathering performance metrics
from various sources such as system resources, network, and application-specific endpoints.
It integrates with the configuration and logging systems to provide flexible and observable
data collection.
"""

import time
import requests
from typing import Dict, Any, List

# Internal dependencies
from src.utils import get_config, get_logger

# Initialize logger and config
logger = get_logger(__name__)
config = get_config()

class MetricsCollector:
    """
    A class to collect performance metrics from multiple sources.
    
    This collector can gather system-level metrics (simulated), HTTP endpoint response times,
    status codes, and other custom metrics defined in the configuration. It supports extensible
    metric sources and structured output for downstream analysis.
    """

    def __init__(self, config: 'Config' = None, logger: 'Logger' = None):
        """
        Initialize the MetricsCollector with optional custom config and logger.
        
        Args:
            config (Config, optional): Configuration object. Defaults to global config.
            logger (Logger, optional): Logger instance. Defaults to global logger.
        """
        self.config = config or get_config()
        self.logger = logger or get_logger(__name__)
        self.metrics_sources = self.config.get('metrics.sources', ['system', 'http'])
        self.http_endpoints = self.config.get('metrics.http_endpoints', [])

    def collect(self) -> Dict[str, Any]:
        """
        Collect all configured metrics and return them in a structured format.
        
        Returns:
            dict: A dictionary containing collected metrics grouped by source.
                  Example:
                  {
                      'timestamp': '2025-12-10T14:30:00Z',
                      'system': { ... },
                      'http': [ ... ],
                      'collected_count': 5
                  }
        """
        self.logger.info("Starting metrics collection...")
        start_time = time.time()
        metrics_data = {
            'timestamp': self._get_current_timestamp(),
            'sources': {}
        }

        try:
            for source in self.metrics_sources:
                if source == 'system':
                    metrics_data['sources']['system'] = self._collect_system_metrics()
                elif source == 'http':
                    metrics_data['sources']['http'] = self._collect_http_metrics()
                else:
                    self.logger.warning(f"Unknown metrics source: {source}")

            # Finalize collection stats
            metrics_data['collected_count'] = len(metrics_data['sources'])
            collection_duration = time.time() - start_time
            self.logger.info(f"Metrics collection completed in {collection_duration:.2f}s")
            
        except Exception as e:
            self.logger.error(f"Error during metrics collection: {str(e)}")
            raise

        return metrics_data

    def _get_current_timestamp(self) -> str:
        """
        Get current UTC timestamp in ISO format.
        
        Returns:
            str: Current timestamp as string in ISO 8601 format.
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()

    def _collect_system_metrics(self) -> Dict[str, Any]:
        """
        Collect simulated system-level metrics.
        
        In a real implementation, this would interface with psutil or similar.
        
        Returns:
            dict: Simulated CPU, memory, disk, and network usage.
        """
        self.logger.debug("Collecting system metrics...")
        
        # Simulated values - in practice, integrate with psutil
        return {
            'cpu_usage_percent': 45.2,
            'memory_usage_percent': 60.1,
            'disk_usage_percent': 70.5,
            'network_bytes_sent': 1048576,
            'network_bytes_recv': 2097152,
            'collection_method': 'simulated'
        }

    def _collect_http_metrics(self) -> List[Dict[str, Any]]:
        """
        Collect HTTP metrics from configured endpoints.
        
        Gathers response time, status code, and content size for each endpoint.
        
        Returns:
            list: List of dictionaries containing metrics for each endpoint.
        """
        self.logger.debug("Collecting HTTP metrics...")
        http_metrics = []

        for endpoint in self.http_endpoints:
            try:
                start_time = time.time()
                response = requests.get(
                    endpoint,
                    timeout=self.config.get('metrics.http_timeout', 10)
                )
                duration = time.time() - start_time

                metric = {
                    'url': endpoint,
                    'status_code': response.status_code,
                    'response_time_seconds': round(duration, 3),
                    'content_length': len(response.content),
                    'success': True
                }
                http_metrics.append(metric)
                self.logger.info(f"Collected metrics from {endpoint}: {duration:.3f}s | {response.status_code}")

            except requests.exceptions.RequestException as e:
                self.logger.error(f"Failed to collect metrics from {endpoint}: {str(e)}")
                http_metrics.append({
                    'url': endpoint,
                    'error': str(e),
                    'success': False
                })

        return http_metrics