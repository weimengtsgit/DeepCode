"""
Crawler module for the Performance Specification Toolkit.
Handles discovery and crawling of resources to be analyzed.
"""

import requests
from typing import List, Dict, Any
import time

from src.utils import get_logger, get_config

logger = get_logger(__name__)
cfg = get_config()

class Crawler:
    """
    Crawler class responsible for discovering and crawling web resources 
    based on configuration settings.
    """
    
    def __init__(self, config=None, logger=None):
        self.config = config or get_config()
        self.logger = logger or get_logger(__name__)
        self.base_urls = self.config.get('crawler.base_urls', [])
        self.max_depth = self.config.get('crawler.max_depth', 2)
        self.delay = self.config.get('crawler.delay', 1.0)
        self.timeout = self.config.get('crawler.timeout', 10)
        
    def crawl(self) -> List[Dict[str, Any]]:
        """
        Start crawling from base URLs up to max depth.
        
        Returns:
            List of crawled resources with metadata
        """
        results = []
        seen_urls = set()
        
        for url in self.base_urls:
            self.logger.info(f"Starting crawl from: {url}")
            results.extend(self._crawl_recursive(url, depth=0, seen_urls=seen_urls))
            
        return results
    
    def _crawl_recursive(self, url: str, depth: int, seen_urls: set) -> List[Dict[str, Any]]:
        """
        Recursively crawl a URL up to max_depth.
        
        Args:
            url: Target URL to crawl
            depth: Current crawl depth
            seen_urls: Set of already visited URLs
            
        Returns:
            List of resource dictionaries
        """
        if depth > self.max_depth:
            return []
            
        if url in seen_urls:
            return []
            
        seen_urls.add(url)
        
        self.logger.debug(f"Crawling ({depth}/{self.max_depth}): {url}")
        
        try:
            response = requests.get(
                url, 
                timeout=self.timeout
            )
            
            # Simulate some basic parsing (in real case, use BeautifulSoup etc.)
            result = {
                'url': url,
                'status_code': response.status_code,
                'content_length': len(response.content),
                'content_type': response.headers.get('content-type', ''),
                'response_time': response.elapsed.total_seconds(),
                'timestamp': time.time(),
                'depth': depth
            }
            
            self.logger.info(f"Crawled: {url} - {response.status_code} - {result['response_time']:.2f}s")
            
            results = [result]
            
            # Add delay to be respectful
            time.sleep(self.delay)
            
            return results
            
        except requests.RequestException as e:
            self.logger.error(f"Failed to crawl {url}: {str(e)}")
            return []
        
        except Exception as e:
            self.logger.error(f"Unexpected error crawling {url}: {str(e)}")
            return []