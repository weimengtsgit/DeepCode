const axios = require('axios');
const { parse } = require('node-html-parser');
const URL = require('url');

class UrlDiscoverer {
    /**
     * Discover URLs from a seed URL with configurable depth and page limits
     * @param {string} seedUrl - Starting URL for discovery
     * @param {Object} options - Discovery configuration
     * @returns {Promise<string[]>} Discovered URLs
     */
    static async discoverUrls(seedUrl, options = {}) {
        const {
            maxDepth = 2,
            maxPages = 30,
            allowedDomains = null
        } = options;

        const queue = [{ url: seedUrl, depth: 0 }];
        const visited = new Set();
        const results = [];

        while (queue.length > 0 && results.length < maxPages) {
            const current = queue.shift();

            // Skip already visited or invalid URLs
            if (visited.has(current.url) || current.depth > maxDepth) {
                continue;
            }

            try {
                const pageLinks = await this.extractPageLinks(current.url, allowedDomains);
                
                for (const link of pageLinks) {
                    if (results.length < maxPages) {
                        queue.push({
                            url: link,
                            depth: current.depth + 1
                        });
                    }
                }

                results.push(current.url);
                visited.add(current.url);
            } catch (error) {
                console.warn(`Error discovering links for ${current.url}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Extract links from a given page URL
     * @param {string} pageUrl - URL to extract links from
     * @param {string[]} allowedDomains - Optional domain whitelist
     * @returns {Promise<string[]>} Extracted links
     */
    static async extractPageLinks(pageUrl, allowedDomains = null) {
        try {
            const response = await axios.get(pageUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'WebPerfScout/1.0 URL Crawler'
                }
            });

            const root = parse(response.data);
            const links = root.querySelectorAll('a[href]')
                .map(link => link.getAttribute('href'))
                .filter(href => href && !href.startsWith('#'))
                .map(href => URL.resolve(pageUrl, href));

            return allowedDomains
                ? links.filter(link => 
                    allowedDomains.some(domain => new URL(link).hostname.includes(domain))
                )
                : links;

        } catch (error) {
            console.warn(`Failed to extract links from ${pageUrl}: ${error.message}`);
            return [];
        }
    }
}

module.exports = UrlDiscoverer;