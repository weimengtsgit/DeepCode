const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const Handlebars = require('handlebars');

class ReportGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(process.cwd(), 'reports');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  generateJsonReport(performanceData) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `performance-report-${timestamp}.json`;
    const filePath = path.join(this.outputDir, filename);

    const reportData = {
      timestamp: new Date().toISOString(),
      urls: performanceData.map(result => ({
        url: result.url,
        performanceScore: result.performanceScore,
        metrics: result.metrics,
        recommendations: result.recommendations
      }))
    };

    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    return filePath;
  }

  generateHtmlReport(performanceData) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `performance-report-${timestamp}.html`;
    const filePath = path.join(this.outputDir, filename);

    const htmlTemplate = Handlebars.compile(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>WebPerf Scout Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          .performance-result { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; }
          .score { 
            font-weight: bold; 
            color: {{scoreColor performanceScore}}; 
          }
          .recommendations { background-color: #f4f4f4; padding: 10px; }
        </style>
      </head>
      <body>
        <h1>WebPerf Scout Performance Report</h1>
        <p>Generated: {{timestamp}}</p>
        {{#each urls}}
        <div class="performance-result">
          <h2>URL: {{url}}</h2>
          <p>Performance Score: <span class="score">{{performanceScore}}/100</span></p>
          <h3>Metrics</h3>
          <pre>{{json metrics}}</pre>
          <h3>Recommendations</h3>
          <div class="recommendations">
            {{#each recommendations}}
            <p>• {{this}}</p>
            {{/each}}
          </div>
        </div>
        {{/each}}
      </body>
      </html>
    `);

    // Register custom Handlebars helpers
    Handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });

    Handlebars.registerHelper('scoreColor', function(score) {
      if (score >= 90) return 'green';
      if (score >= 70) return 'orange';
      return 'red';
    });

    const reportData = {
      timestamp: new Date().toISOString(),
      urls: performanceData.map(result => ({
        url: result.url,
        performanceScore: result.performanceScore,
        metrics: result.metrics,
        recommendations: result.recommendations
      }))
    };

    const htmlContent = htmlTemplate(reportData);
    fs.writeFileSync(filePath, htmlContent);
    return filePath;
  }

  generateMarkdownReport(performanceData) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `performance-report-${timestamp}.md`;
    const filePath = path.join(this.outputDir, filename);

    const markdownContent = `# WebPerf Scout Performance Report

Generated: ${new Date().toISOString()}

${performanceData.map(result => `
## Performance Analysis for ${result.url}

**Performance Score**: ${result.performanceScore}/100

### Metrics
\`\`\`json
${JSON.stringify(result.metrics, null, 2)}
\`\`\`

### Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\n')}
`).join('\n\n')}`;

    fs.writeFileSync(filePath, markdownContent);
    return filePath;
  }

  generateComprehensiveReport(performanceData, formats = ['json', 'html', 'md']) {
    const generatedFiles = {};

    if (formats.includes('json')) {
      generatedFiles.json = this.generateJsonReport(performanceData);
    }

    if (formats.includes('html')) {
      generatedFiles.html = this.generateHtmlReport(performanceData);
    }

    if (formats.includes('md')) {
      generatedFiles.markdown = this.generateMarkdownReport(performanceData);
    }

    return generatedFiles;
  }
}

module.exports = { ReportGenerator };