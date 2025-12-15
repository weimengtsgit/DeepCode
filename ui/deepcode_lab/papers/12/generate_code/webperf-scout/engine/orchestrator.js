const { DiscoveryService } = require('../crawler/discoverer');
const { PlaywrightRunner } = require('./playwright_runner');
const { PerformanceAnalyzer } = require('./analyzer');
const { ReportGenerator } = require('../report/generator');
const { SpecValidator } = require('../spec/validator');

class PerformanceOrchestrator {
    constructor(config = {}) {
        this.config = {
            maxDepth: config.maxDepth || 2,
            maxPages: config.maxPages || 30,
            timeout: config.timeout || 60000,
            browsers: config.browsers || ['chromium', 'firefox'],
            ...config
        };
        
        this.discoveryService = new DiscoveryService(this.config);
        this.playwrightRunner = new PlaywrightRunner(this.config);
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.reportGenerator = new ReportGenerator();
        this.specValidator = new SpecValidator();
    }

    async validateSpecification(specPath) {
        return this.specValidator.validate(specPath);
    }

    async runPerformanceTest(seedUrl, options = {}) {
        try {
            // Validate input URL
            if (!this.isValidUrl(seedUrl)) {
                throw new Error('Invalid seed URL provided');
            }

            // Merge default and provided options
            const testOptions = { ...this.config, ...options };

            // Discover URLs
            const discoveredUrls = await this.discoveryService.discover(seedUrl, {
                maxDepth: testOptions.maxDepth,
                maxPages: testOptions.maxPages
            });

            // Performance testing results
            const performanceResults = [];

            // Run performance tests for each discovered URL
            for (const url of discoveredUrls) {
                const urlResults = await this.playwrightRunner.runPerformanceTest(url, {
                    browsers: testOptions.browsers,
                    timeout: testOptions.timeout
                });

                // Analyze performance metrics
                const analyzedResults = this.performanceAnalyzer.analyze(urlResults);
                performanceResults.push(analyzedResults);
            }

            // Generate comprehensive report
            const report = this.reportGenerator.generate(performanceResults, {
                seedUrl,
                discoveredUrls,
                testOptions
            });

            return {
                seedUrl,
                discoveredUrls,
                performanceResults,
                report
            };
        } catch (error) {
            console.error('Performance testing failed:', error);
            throw error;
        }
    }

    async runCrawlTest(seedUrl, options = {}) {
        try {
            // Validate input URL
            if (!this.isValidUrl(seedUrl)) {
                throw new Error('Invalid seed URL provided');
            }

            // Merge default and provided options
            const crawlOptions = { ...this.config, ...options };

            // Discover URLs
            const discoveredUrls = await this.discoveryService.discover(seedUrl, {
                maxDepth: crawlOptions.maxDepth,
                maxPages: crawlOptions.maxPages
            });

            // Generate crawl report
            const crawlReport = this.reportGenerator.generateCrawlReport(discoveredUrls, {
                seedUrl,
                ...crawlOptions
            });

            return {
                seedUrl,
                discoveredUrls,
                crawlReport
            };
        } catch (error) {
            console.error('Crawl testing failed:', error);
            throw error;
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = {
    PerformanceOrchestrator
};