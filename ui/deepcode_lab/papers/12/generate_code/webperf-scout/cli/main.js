#!/usr/bin/env node

const { program } = require('commander');
const ArgumentParser = require('./argument_parser');
const Orchestrator = require('../engine/orchestrator');
const Crawler = require('../crawler/discoverer');
const ReportGenerator = require('../report/generator');
const SpecValidator = require('../spec/validator');

class WebPerfScoutCLI {
  constructor() {
    this.argumentParser = new ArgumentParser();
    this.orchestrator = new Orchestrator();
  }

  async initialize() {
    program
      .name('webperf-scout')
      .description('Web Performance Analysis Toolkit')
      .version('1.0.0');

    // Analyze single URL command
    program
      .command('analyze <url>')
      .description('Analyze performance of a single URL')
      .option('-c, --config <configPath>', 'Path to custom configuration file')
      .option('-d, --device <deviceType>', 'Simulate specific device type', 'desktop')
      .option('-n, --network <networkType>', 'Simulate network conditions', 'fast3g')
      .action(async (url, options) => {
        try {
          // Validate URL and options
          this.argumentParser.validateAnalyzeCommand(url, options);

          // Load configuration
          const config = this.argumentParser.loadConfig(options.config);

          // Run performance analysis
          const performanceResults = await this.orchestrator.runSingleUrlAnalysis(url, {
            device: options.device,
            network: options.network,
            ...config
          });

          // Generate report
          const report = new ReportGenerator(performanceResults);
          report.generateConsoleReport();
          report.generateHTMLReport();
          report.generateJSONReport();
        } catch (error) {
          console.error('Performance analysis failed:', error.message);
          process.exit(1);
        }
      });

    // Crawl website command
    program
      .command('crawl <seedUrl>')
      .description('Crawl and analyze website performance')
      .option('-c, --config <configPath>', 'Path to custom configuration file')
      .option('-d, --max-depth <depth>', 'Maximum crawl depth', '2')
      .option('-p, --max-pages <pages>', 'Maximum number of pages to crawl', '30')
      .action(async (seedUrl, options) => {
        try {
          // Validate crawl parameters
          this.argumentParser.validateCrawlCommand(seedUrl, options);

          // Load configuration
          const config = this.argumentParser.loadConfig(options.config);

          // Discover URLs
          const discoveredUrls = await Crawler.discover(seedUrl, {
            maxDepth: parseInt(options.maxDepth, 10),
            maxPages: parseInt(options.maxPages, 10)
          });

          // Run performance analysis for discovered URLs
          const crawlResults = await this.orchestrator.runCrawlAnalysis(discoveredUrls, config);

          // Generate comprehensive crawl report
          const report = new ReportGenerator(crawlResults);
          report.generateCrawlReport();
        } catch (error) {
          console.error('Website crawl and analysis failed:', error.message);
          process.exit(1);
        }
      });

    // Validate specification command
    program
      .command('validate <specFile>')
      .description('Validate performance specification file')
      .action(async (specFile) => {
        try {
          const specValidator = new SpecValidator();
          const validationResult = await specValidator.validateSpecFile(specFile);
          
          if (validationResult.isValid) {
            console.log('✅ Performance specification is valid.');
          } else {
            console.error('❌ Performance specification validation failed:', validationResult.errors);
            process.exit(1);
          }
        } catch (error) {
          console.error('Specification validation error:', error.message);
          process.exit(1);
        }
      });

    // Parse arguments
    program.parse(process.argv);

    // Show help if no command is provided
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  }
}

// Main execution
async function main() {
  const webPerfScoutCLI = new WebPerfScoutCLI();
  await webPerfScoutCLI.initialize();
}

main().catch(console.error);

module.exports = WebPerfScoutCLI;