"""
Core package for the Performance Specification Toolkit.
Provides access to core components: analyzer, crawler, metrics collector, and report generator.
"""

from .analyzer import Analyzer
from .crawler import Crawler
from .metrics_collector import MetricsCollector
from .report_generator import ReportGenerator

__all__ = [
    "Analyzer",
    "Crawler",
    "MetricsCollector",
    "ReportGenerator"
]
