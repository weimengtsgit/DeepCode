"""
Main entry point for the Performance Specification Toolkit.
Orchestrates the execution of crawling, metrics collection, analysis, and reporting.
"""

import os
from datetime import datetime

# Core components
from src.core.crawler import Crawler
from src.core.metrics_collector import MetricsCollector
from src.core.analyzer import Analyzer
from src.core.report_generator import ReportGenerator

# Utilities
from src.utils import get_logger, get_config

def main():
    """
    Main function to execute the full performance specification workflow:
    1. Initialize configuration and logger
    2. Run crawler to discover resources
    3. Collect performance metrics from endpoints and system
    4. Analyze collected metrics
    5. Generate comprehensive report
    """
    # Initialize config and logger
    config = get_config()
    logger = get_logger(__name__)
    
    logger.info("Starting Performance Specification Toolkit")
    logger.info(f"Execution timestamp: {datetime.utcnow().isoformat()}Z")
    
    try:
        # Step 1: Crawl configured URLs
        logger.info("Initializing crawler...")
        crawler = Crawler(config, logger)
        crawl_results = crawler.crawl()
        logger.info(f"Crawling completed. Discovered {len(crawl_results['urls'])} URLs.")
        
        # Step 2: Collect metrics
        logger.info("Collecting performance metrics...")
        metrics_collector = MetricsCollector(config, logger)
        metrics_data = metrics_collector.collect()
        logger.info("Metrics collection completed.")
        
        # Step 3: Analyze metrics
        logger.info("Analyzing performance metrics...")
        analyzer = Analyzer(config, logger)
        analysis_results = analyzer.analyze(metrics_data)
        logger.info("Analysis completed.")
        
        # Step 4: Generate report
        logger.info("Generating performance report...")
        report_generator = ReportGenerator(config, logger)
        report_path = report_generator.generate({
            'metrics': metrics_data,
            'analysis': analysis_results,
            'crawl_results': crawl_results
        })
        logger.info(f"Report generated at: {report_path}")
        
        logger.info("Performance Specification Toolkit execution completed successfully.")
        
    except Exception as e:
        logger.error(f"An error occurred during execution: {str(e)}")
        raise

if __name__ == "__main__":
    main()