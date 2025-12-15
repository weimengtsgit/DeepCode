const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const axios = require('axios');
const cheerio = require('cheerio');

class WebCrawler {
  constructor(config) {
    this.config = config || {};
    this.visitedUrls = new Set();
    this.discoveredUrls = [];

    // Default crawling settings
    this.maxDepth = this.config.crawler?.maxDepth || 1;
    this.maxUrls = this.config.crawler?.maxUrls || 10;
    this.allowedDomains = this.config.security?.allowedDomains || [];
    this.urlBlacklist = this.config.security?.urlBlacklist || [];
  }

  /**
   * Validate if a URL meets security and configuration constraints
   * @param {string} url - URL to validate
   * @param {number} currentDepth - Current crawling depth
   * @returns {boolean} Whether the URL is valid for crawling
   */
  isValidUrl(url, currentDepth) {
    try {
      const parsedUrl = new URL(url);

      // Check depth constraint
      if (currentDepth > this.maxDepth) return false;

      // Check total discovered URLs limit
      if (this.discoveredUrls.length >= this.maxUrls) return false;

      // Check domain restrictions
      if (this.allowedDomains.length > 0 && 
          !this.allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
        return false;
      }

      // Check URL blacklist
      if (this.urlBlacklist.some(pattern => url.includes(pattern))) {
        return false;
      }

      // Ensure HTTPS for security
      if (parsedUrl.protocol !== 'https:') return false;

      // Avoid revisiting URLs
      if (this.visitedUrls.has(url)) return false;

      return true;
    } catch (error) {
      console.warn(`Invalid URL validation: ${url}`, error);
      return false;
    }
  }

  /**
   * Extract links from a webpage
   * @param {string} html - HTML content of the page
   * @param {string} baseUrl - Base URL for resolving relative links
   * @returns {string[]} Discovered links
   */
  extractLinks(html, baseUrl) {
    const $ = cheerio.load(html);
    const links = [];

    $('a[href]').each((index, element) => {
      try {
        const href = $(element).attr('href');
        const absoluteUrl = new URL(href, baseUrl).toString();
        links.push(absoluteUrl);
      } catch (error) {
        // Silently ignore invalid links
      }
    });

    return links;
  }

  /**
   * Crawl a given URL and discover linked pages
   * @param {string} startUrl - Initial URL to start crawling
   * @param {number} depth - Current crawling depth
   * @returns {Promise<string[]>} Discovered URLs
   */
  async crawl(startUrl, depth = 0) {
    if (!this.isValidUrl(startUrl, depth)) return [];

    try {
      const response = await axios.get(startUrl, {
        timeout: this.config.network?.timeout || 5000,
        headers: {
          'User-Agent': 'WebPerf Scout Crawler/1.0'
        }
      });

      this.visitedUrls.add(startUrl);
      this.discoveredUrls.push(startUrl);

      const links = this.extractLinks(response.data, startUrl);
      const validLinks = links.filter(link => this.isValidUrl(link, depth + 1));

      // Recursive crawling with depth control
      for (const link of validLinks) {
        if (depth + 1 <= this.maxDepth) {
          await this.crawl(link, depth + 1);
        }
      }

      return this.discoveredUrls;
    } catch (error) {
      console.warn(`Crawling error for ${startUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Get discovered URLs
   * @returns {string[]} List of discovered URLs
   */
  getDiscoveredUrls() {
    return this.discoveredUrls;
  }
}

module.exports = WebCrawler;