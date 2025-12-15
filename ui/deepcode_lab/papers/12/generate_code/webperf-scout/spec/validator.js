const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { URL } = require('url');

class SpecValidator {
  /**
   * Validate a performance specification file
   * @param {string} specPath - Path to the specification YAML file
   * @returns {Object} Validation result with status and details
   */
  static validateSpecification(specPath) {
    try {
      // Check file existence
      if (!fs.existsSync(specPath)) {
        throw new Error(`Specification file not found: ${specPath}`);
      }

      // Read and parse YAML
      const specContent = fs.readFileSync(specPath, 'utf8');
      const spec = yaml.load(specContent);

      // Validate core specification structure
      this._validateSpecStructure(spec);

      // Validate URLs
      if (spec.urls && spec.urls.length > 0) {
        spec.urls.forEach(url => this._validateUrl(url));
      }

      // Validate performance thresholds
      this._validatePerformanceThresholds(spec.performance_thresholds || {});

      return {
        valid: true,
        message: 'Specification is valid',
        details: spec
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        details: null
      };
    }
  }

  /**
   * Validate specification structure
   * @param {Object} spec - Parsed specification object
   * @private
   */
  static _validateSpecStructure(spec) {
    if (!spec || typeof spec !== 'object') {
      throw new Error('Invalid specification: Must be a YAML object');
    }

    const requiredFields = ['name', 'description'];
    requiredFields.forEach(field => {
      if (!spec[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
  }

  /**
   * Validate individual URLs
   * @param {string} url - URL to validate
   * @private
   */
  static _validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        throw new Error(`Invalid URL protocol: ${url}`);
      }
    } catch (error) {
      throw new Error(`Invalid URL: ${url} - ${error.message}`);
    }
  }

  /**
   * Validate performance thresholds
   * @param {Object} thresholds - Performance thresholds
   * @private
   */
  static _validatePerformanceThresholds(thresholds) {
    const validMetrics = [
      'lcp', 'fcp', 'tti', 'cls', 'tbt', 
      'total_blocking_time', 'cumulative_layout_shift'
    ];

    Object.keys(thresholds).forEach(metric => {
      if (!validMetrics.includes(metric)) {
        throw new Error(`Invalid performance metric: ${metric}`);
      }

      const threshold = thresholds[metric];
      if (typeof threshold !== 'number' || threshold < 0) {
        throw new Error(`Invalid threshold for ${metric}: must be a non-negative number`);
      }
    });
  }

  /**
   * Generate a default specification template
   * @returns {Object} Default specification template
   */
  static generateDefaultSpecTemplate() {
    return {
      name: 'WebPerf Scout Default Spec',
      description: 'Default performance testing specification',
      urls: ['https://example.com'],
      performance_thresholds: {
        lcp: 2500,  // Largest Contentful Paint (ms)
        fcp: 1800,  // First Contentful Paint (ms)
        tti: 3500,  // Time to Interactive (ms)
        cls: 0.1,   // Cumulative Layout Shift
        tbt: 200    // Total Blocking Time (ms)
      },
      browser_options: {
        devices: ['desktop', 'mobile'],
        network_conditions: ['3g', '4g']
      }
    };
  }

  /**
   * Save a specification template to a file
   * @param {string} outputPath - Path to save the template
   */
  static saveSpecTemplate(outputPath) {
    const template = this.generateDefaultSpecTemplate();
    const yamlContent = yaml.dump(template);
    
    fs.writeFileSync(outputPath, yamlContent, 'utf8');
  }
}

module.exports = SpecValidator;