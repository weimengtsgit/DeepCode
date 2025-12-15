const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

class ConfigValidator {
  /**
   * Validates the configuration file
   * @param {string} configPath - Path to the configuration file
   * @returns {Object} Validated configuration
   * @throws {Error} If configuration is invalid
   */
  static validate(configPath) {
    // Load default configuration
    const defaultConfigPath = path.resolve(__dirname, '../config/default.yaml');
    const defaultConfig = yaml.load(fs.readFileSync(defaultConfigPath, 'utf8'));

    // Load user configuration or use default
    let userConfig = {};
    if (configPath && fs.existsSync(configPath)) {
      userConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
    }

    // Merge configurations with user config taking precedence
    const mergedConfig = this.deepMerge(defaultConfig, userConfig);

    // Validate global settings
    this.validateGlobalSettings(mergedConfig.global);
    
    // Validate browser settings
    this.validateBrowserSettings(mergedConfig.browser);
    
    // Validate network settings
    this.validateNetworkSettings(mergedConfig.network);
    
    // Validate scoring settings
    this.validateScoringSettings(mergedConfig.scoring);
    
    // Validate security settings
    this.validateSecuritySettings(mergedConfig.security);

    return mergedConfig;
  }

  /**
   * Deep merge two configuration objects
   * @param {Object} target - Default configuration
   * @param {Object} source - User configuration
   * @returns {Object} Merged configuration
   */
  static deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  /**
   * Check if value is an object
   * @param {*} item - Value to check
   * @returns {boolean} Whether item is an object
   */
  static isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Validate global settings
   * @param {Object} globalConfig - Global configuration
   * @throws {Error} If global settings are invalid
   */
  static validateGlobalSettings(globalConfig) {
    if (!globalConfig) {
      throw new Error('Global configuration is missing');
    }

    const requiredGlobalKeys = ['timeout', 'retries'];
    requiredGlobalKeys.forEach(key => {
      if (!(key in globalConfig)) {
        throw new Error(`Missing required global setting: ${key}`);
      }
    });

    if (globalConfig.timeout <= 0) {
      throw new Error('Timeout must be a positive number');
    }

    if (globalConfig.retries < 0) {
      throw new Error('Retries must be a non-negative number');
    }
  }

  /**
   * Validate browser settings
   * @param {Object} browserConfig - Browser configuration
   * @throws {Error} If browser settings are invalid
   */
  static validateBrowserSettings(browserConfig) {
    if (!browserConfig) {
      throw new Error('Browser configuration is missing');
    }

    const validBrowsers = ['chromium', 'firefox', 'webkit'];
    if (!validBrowsers.includes(browserConfig.type)) {
      throw new Error(`Invalid browser type. Must be one of: ${validBrowsers.join(', ')}`);
    }

    if (browserConfig.viewport) {
      const { width, height } = browserConfig.viewport;
      if (!width || !height || width <= 0 || height <= 0) {
        throw new Error('Invalid viewport dimensions');
      }
    }
  }

  /**
   * Validate network settings
   * @param {Object} networkConfig - Network configuration
   * @throws {Error} If network settings are invalid
   */
  static validateNetworkSettings(networkConfig) {
    if (!networkConfig) {
      throw new Error('Network configuration is missing');
    }

    const validNetworkProfiles = ['slow3g', 'fast3g', 'broadband'];
    if (!validNetworkProfiles.includes(networkConfig.profile)) {
      throw new Error(`Invalid network profile. Must be one of: ${validNetworkProfiles.join(', ')}`);
    }
  }

  /**
   * Validate scoring settings
   * @param {Object} scoringConfig - Scoring configuration
   * @throws {Error} If scoring settings are invalid
   */
  static validateScoringSettings(scoringConfig) {
    if (!scoringConfig) {
      throw new Error('Scoring configuration is missing');
    }

    const requiredMetrics = ['lcp', 'fcp', 'cls', 'tti', 'tbt'];
    requiredMetrics.forEach(metric => {
      if (!(metric in scoringConfig)) {
        throw new Error(`Missing scoring configuration for metric: ${metric}`);
      }

      const metricConfig = scoringConfig[metric];
      if (metricConfig.weight < 0 || metricConfig.weight > 1) {
        throw new Error(`Invalid weight for metric ${metric}. Must be between 0 and 1`);
      }
    });
  }

  /**
   * Validate security settings
   * @param {Object} securityConfig - Security configuration
   * @throws {Error} If security settings are invalid
   */
  static validateSecuritySettings(securityConfig) {
    if (!securityConfig) {
      throw new Error('Security configuration is missing');
    }

    if (securityConfig.maxCrawlDepth < 0) {
      throw new Error('Max crawl depth must be a non-negative number');
    }

    if (securityConfig.allowedDomains && !Array.isArray(securityConfig.allowedDomains)) {
      throw new Error('Allowed domains must be an array');
    }
  }
}

module.exports = ConfigValidator;