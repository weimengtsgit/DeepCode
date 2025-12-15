import fs from 'fs';
import path from 'path';
import { ConfigValidator } from '../spec/validator.js';
import { WebCrawler } from '../crawler/discoverer.js';
import { PlaywrightRunner } from './playwright-runner.js';
import { PerformanceAnalyzer } from './analyzer.js';
import { ReportGenerator } from '../report/generator.js';

class PerformanceOrchestrator {
  constructor(configPath = null) {
    // Load and validate configuration
    const validator = new ConfigValidator();
    this.config = validator.validate(configPath);
    
    // Initialize core components
    this.crawler = new WebCrawler(this.config);
    this.playwright = new PlaywrightRunner(this.config);
    this.analyzer = new PerformanceAnalyzer(this.config);
    this.reportGenerator = new ReportGenerator(this.config);
  }

  async analyze(startUrl, depth = 1) {
    try {
      // Discover URLs based on configuration
      const discoveredUrls = await this.crawler.crawl(startUrl, depth);
      
      // Performance measurement results
      const performanceResults = [];

      // Measure performance for each discovered URL
      for (const url of discoveredUrls) {
        try {
          // Run performance measurements
          const measurements = await this.playwright.measurePerformance(url);
          
          // Analyze performance metrics
          const analysisResult = this.analyzer.scorePerformance(measurements);
          
          performanceResults.push({
            url,
            metrics: measurements,
            score: analysisResult
          });
        } catch (urlError) {
          console.error(`Performance measurement failed for ${url}:`, urlError);
        }
      }

      // Generate comprehensive report
      const report = this.reportGenerator.generate(performanceResults);
      
      return report;
    } catch (error) {
      console.error('Performance analysis failed:', error);
      throw error;
    }
  }

  async saveReport(report, outputPath = './performance-report.json') {
    try {
      const reportDir = path.dirname(outputPath);
      
      // Ensure report directory exists
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // Write report to file
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      
      console.log(`Performance report saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Report saving failed:', error);
      throw error;
    }
  }
}

export { PerformanceOrchestrator };