const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ArgumentParser {
  constructor() {
    this.program = program;
    this.setupCommandLineInterface();
  }

  setupCommandLineInterface() {
    this.program
      .name('webperf-scout')
      .description('Web Performance Analysis Toolkit')
      .version('1.0.0');

    // Analyze Command
    this.program
      .command('analyze <url>')
      .description('Analyze performance for a specific URL')
      .option('-c, --config <configPath>', 'Path to custom configuration file')
      .option('-d, --device <deviceType>', 'Simulate device type (mobile/desktop)', 'desktop')
      .option('-n, --network <networkType>', 'Simulate network conditions (3g/4g/5g)', '4g')
      .action(this.validateAnalyzeCommand.bind(this));

    // Crawl Command
    this.program
      .command('crawl <seedUrl>')
      .description('Discover and analyze multiple pages from a seed URL')
      .option('-d, --max-depth <depth>', 'Maximum crawl depth', '2')
      .option('-p, --max-pages <pages>', 'Maximum number of pages to crawl', '30')
      .option('-c, --config <configPath>', 'Path to custom configuration file')
      .action(this.validateCrawlCommand.bind(this));

    this.program.parse(process.argv);
  }

  validateAnalyzeCommand(url, options) {
    // URL validation
    if (!this.isValidUrl(url)) {
      console.error(`Invalid URL: ${url}`);
      process.exit(1);
    }

    // Configuration file validation
    const configPath = options.config || path.join(__dirname, '../config/default_config.yaml');
    this.validateConfigFile(configPath);

    // Device type validation
    const validDeviceTypes = ['mobile', 'desktop'];
    if (!validDeviceTypes.includes(options.device)) {
      console.error(`Invalid device type. Must be one of: ${validDeviceTypes.join(', ')}`);
      process.exit(1);
    }

    // Network type validation
    const validNetworkTypes = ['3g', '4g', '5g'];
    if (!validNetworkTypes.includes(options.network)) {
      console.error(`Invalid network type. Must be one of: ${validNetworkTypes.join(', ')}`);
      process.exit(1);
    }

    return {
      url,
      config: configPath,
      device: options.device,
      network: options.network
    };
  }

  validateCrawlCommand(seedUrl, options) {
    // URL validation
    if (!this.isValidUrl(seedUrl)) {
      console.error(`Invalid seed URL: ${seedUrl}`);
      process.exit(1);
    }

    // Depth validation
    const maxDepth = parseInt(options.maxDepth, 10);
    if (isNaN(maxDepth) || maxDepth < 1 || maxDepth > 5) {
      console.error('Max depth must be a number between 1 and 5');
      process.exit(1);
    }

    // Pages validation
    const maxPages = parseInt(options.maxPages, 10);
    if (isNaN(maxPages) || maxPages < 1 || maxPages > 100) {
      console.error('Max pages must be a number between 1 and 100');
      process.exit(1);
    }

    // Configuration file validation
    const configPath = options.config || path.join(__dirname, '../config/default_config.yaml');
    this.validateConfigFile(configPath);

    return {
      seedUrl,
      maxDepth,
      maxPages,
      config: configPath
    };
  }

  validateConfigFile(configPath) {
    try {
      if (!fs.existsSync(configPath)) {
        console.error(`Configuration file not found: ${configPath}`);
        process.exit(1);
      }

      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      
      // Basic config validation
      if (!config || typeof config !== 'object') {
        console.error('Invalid configuration file format');
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error parsing configuration file: ${error.message}`);
      process.exit(1);
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

module.exports = new ArgumentParser();