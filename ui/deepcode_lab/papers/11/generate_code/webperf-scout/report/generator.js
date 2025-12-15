const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class ReportGenerator {
  constructor(config = {}) {
    this.config = {
      outputFormat: 'json',
      templatePath: path.join(__dirname, 'templates/default-report.hbs'),
      screenshotDir: path.join(process.cwd(), 'performance-screenshots'),
      ...config
    };

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.config.screenshotDir)) {
      fs.mkdirSync(this.config.screenshotDir, { recursive: true });
    }
  }

  /**
   * Generate a performance report from analysis results
   * @param {Array} analysisResults - Array of performance analysis results
   * @param {string} outputPath - Path to save the report
   * @returns {Object} Generated report
   */
  generate(analysisResults, outputPath = './performance-report.json') {
    if (!analysisResults || analysisResults.length === 0) {
      throw new Error('No performance analysis results provided');
    }

    // Prepare report structure
    const report = {
      timestamp: new Date().toISOString(),
      totalUrls: analysisResults.length,
      overallScore: this._calculateOverallScore(analysisResults),
      results: analysisResults
    };

    // Output based on configured format
    switch (this.config.outputFormat) {
      case 'json':
        return this._generateJsonReport(report, outputPath);
      case 'html':
        return this._generateHtmlReport(report, outputPath);
      default:
        throw new Error(`Unsupported output format: ${this.config.outputFormat}`);
    }
  }

  /**
   * Calculate overall performance score across all URLs
   * @param {Array} analysisResults - Performance analysis results
   * @returns {number} Aggregated performance score
   */
  _calculateOverallScore(analysisResults) {
    const scores = analysisResults.map(result => result.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Generate JSON report
   * @param {Object} report - Prepared report object
   * @param {string} outputPath - Path to save report
   * @returns {Object} Generated report
   */
  _generateJsonReport(report, outputPath) {
    const jsonReport = JSON.stringify(report, null, 2);
    fs.writeFileSync(outputPath, jsonReport);
    return report;
  }

  /**
   * Generate HTML report using Handlebars template
   * @param {Object} report - Prepared report object
   * @param {string} outputPath - Path to save report
   * @returns {Object} Generated report
   */
  _generateHtmlReport(report, outputPath) {
    try {
      const templateSource = fs.readFileSync(this.config.templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      const htmlReport = template(report);
      
      const htmlOutputPath = outputPath.endsWith('.html') 
        ? outputPath 
        : outputPath.replace(/\.[^/.]+$/, '') + '.html';
      
      fs.writeFileSync(htmlOutputPath, htmlReport);
      return report;
    } catch (error) {
      console.error('Error generating HTML report:', error);
      throw error;
    }
  }

  /**
   * Save performance screenshots
   * @param {Array} analysisResults - Performance analysis results
   */
  saveScreenshots(analysisResults) {
    analysisResults.forEach((result, index) => {
      if (result.screenshot) {
        const screenshotPath = path.join(
          this.config.screenshotDir, 
          `performance-screenshot-${index + 1}.png`
        );
        fs.writeFileSync(screenshotPath, result.screenshot);
      }
    });
  }
}

module.exports = ReportGenerator;