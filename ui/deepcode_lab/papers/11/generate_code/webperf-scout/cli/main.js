#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Orchestrator } = require('../engine/orchestrator');
const { Validator } = require('../spec/validator');

// CLI Configuration
program
  .name('webperf-scout')
  .description('Web Performance Analysis CLI Tool')
  .version('1.0.0');

// Analyze Command
program
  .command('analyze <url>')
  .description('Analyze web performance for a given URL')
  .option('-c, --config <path>', 'Path to custom configuration file')
  .option('-d, --depth <number>', 'Crawling depth', '1')
  .option('-o, --output <path>', 'Output report path', './performance-report.json')
  .action(async (url, options) => {
    try {
      // Load configuration
      const configPath = options.config || path.join(__dirname, '../config/default.yaml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);

      // Validate configuration
      const validator = new Validator(config);
      if (!validator.isValid()) {
        console.error('Invalid configuration. Please check your config file.');
        process.exit(1);
      }

      // Set up orchestrator with configuration
      const orchestrator = new Orchestrator(config);

      // Perform performance analysis
      const results = await orchestrator.analyze(url, {
        depth: parseInt(options.depth, 10)
      });

      // Write results to output file
      fs.writeFileSync(options.output, JSON.stringify(results, null, 2));

      console.log(`Performance analysis complete. Results saved to ${options.output}`);
    } catch (error) {
      console.error('Performance analysis failed:', error.message);
      process.exit(1);
    }
  });

// Additional commands can be added here in future versions

// Parse command-line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

module.exports = program;