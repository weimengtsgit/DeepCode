"""
Report Generator Module

This module generates performance reports based on collected metrics and analysis results.
It formats data into structured output (e.g., JSON, HTML) for visualization or archival.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

from src.utils import get_logger, get_config
from src.core.analyzer import Analyzer
from src.core.metrics_collector import MetricsCollector


class ReportGenerator:
    """
    Generates performance specification reports from metrics and analysis data.
    """

    def __init__(self, config: Optional[Dict] = None, logger=None):
        """
        Initialize the ReportGenerator with optional config and logger.

        Args:
            config (dict, optional): Configuration dictionary. If not provided, uses global config.
            logger: Logger instance. If not provided, retrieves default logger.
        """
        self.config = config or get_config()
        self.logger = logger or get_logger(__name__)
        self.output_dir = self.config.get("reporting.output_dir", "reports")
        self.include_analysis = self.config.get("reporting.include_analysis", True)

        # Ensure output directory exists
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            self.logger.info(f"Created report output directory: {self.output_dir}")

    def generate(self, metrics_data: Dict[str, Any]) -> str:
        """
        Generate a comprehensive report from raw metrics data.

        Args:
            metrics_data (dict): Collected performance metrics

        Returns:
            str: Path to the generated report file
        """
        self.logger.info("Generating performance report...")

        # Create base report structure
        report = {
            "timestamp": self._get_current_timestamp(),
            "version": "1.0",
            "metrics": metrics_data,
            "analysis": {},
        }

        # Optionally include detailed analysis
        if self.include_analysis:
            analyzer = Analyzer(config=self.config, logger=self.logger)
            analysis_result = analyzer.analyze(metrics_data)
            report["analysis"] = analysis_result

        # Export report in configured format(s)
        report_path = self._save_report(report)

        self.logger.info(f"Report generated successfully at: {report_path}")
        return report_path

    def _save_report(self, report: Dict[str, Any]) -> str:
        """
        Save the report in the configured format(s) to disk.

        Args:
            report (dict): The report data to save

        Returns:
            str: File path where the report was saved
        """
        timestamp = report["timestamp"].replace(":", "-").replace("T", "_")
        base_filename = f"performance_report_{timestamp}"
        formats = self.config.get("reporting.formats", ["json"])
        paths = []

        for fmt in formats:
            if fmt == "json":
                file_path = os.path.join(self.output_dir, f"{base_filename}.json")
                with open(file_path, 'w') as f:
                    json.dump(report, f, indent=2)
                paths.append(file_path)
                self.logger.debug(f"Saved JSON report: {file_path}")

            # Future formats can be added here (e.g., html, pdf)

        # Return primary report path
        return paths[0] if paths else ""

    def _get_current_timestamp(self) -> str:
        """
        Get current UTC time in ISO 8601 format.

        Returns:
            str: Current timestamp in ISO 8601 format
        """
        return datetime.utcnow().isoformat() + "Z"