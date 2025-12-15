const { Server } = require('socket.io');
const { PerformanceOrchestrator } = require('../../engine/orchestrator');
const { ReportGenerator } = require('../../report/generator');

class WebSocketServer {
  constructor(httpServer, options = {}) {
    this.options = {
      pingTimeout: 60000,
      pingInterval: 25000,
      ...options
    };

    this.io = new Server(httpServer, {
      cors: {
        origin: this.options.corsOrigin || '*',
        methods: ['GET', 'POST']
      },
      ...this.options
    });

    this.performanceOrchestrator = new PerformanceOrchestrator();
    this.reportGenerator = new ReportGenerator();

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('WebSocket client connected');

      // Performance Test Request Handler
      socket.on('start-performance-test', async (testConfig) => {
        try {
          // Validate input configuration
          const validatedConfig = this.validateTestConfiguration(testConfig);

          // Emit test start confirmation
          socket.emit('test-started', { 
            message: 'Performance test initiated', 
            testId: validatedConfig.testId 
          });

          // Run performance test with progress tracking
          const testResults = await this.runPerformanceTest(validatedConfig, (progress) => {
            socket.emit('test-progress', progress);
          });

          // Generate report
          const report = await this.reportGenerator.generateComprehensiveReport(testResults, ['json', 'html']);

          // Emit test completion
          socket.emit('test-completed', {
            results: testResults,
            report: report,
            testId: validatedConfig.testId
          });

        } catch (error) {
          socket.emit('test-error', {
            message: error.message,
            stack: error.stack
          });
        }
      });

      // Crawl Test Request Handler
      socket.on('start-crawl-test', async (crawlConfig) => {
        try {
          const validatedConfig = this.validateCrawlConfiguration(crawlConfig);

          socket.emit('crawl-started', { 
            message: 'Website crawl initiated', 
            testId: validatedConfig.testId 
          });

          const crawlResults = await this.performCrawl(validatedConfig, (progress) => {
            socket.emit('crawl-progress', progress);
          });

          socket.emit('crawl-completed', {
            results: crawlResults,
            testId: validatedConfig.testId
          });

        } catch (error) {
          socket.emit('crawl-error', {
            message: error.message,
            stack: error.stack
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  validateTestConfiguration(config) {
    // Implement configuration validation logic
    if (!config.url) {
      throw new Error('URL is required for performance testing');
    }

    return {
      ...config,
      testId: `test_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  validateCrawlConfiguration(config) {
    // Implement crawl configuration validation
    if (!config.seedUrl) {
      throw new Error('Seed URL is required for crawling');
    }

    return {
      ...config,
      testId: `crawl_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  async runPerformanceTest(config, progressCallback) {
    return this.performanceOrchestrator.runPerformanceTest(config.url, {
      ...config,
      onProgress: progressCallback
    });
  }

  async performCrawl(config, progressCallback) {
    return this.performanceOrchestrator.runCrawlTest(config.seedUrl, {
      ...config,
      onProgress: progressCallback
    });
  }

  // Graceful shutdown method
  async close() {
    if (this.io) {
      await new Promise((resolve) => {
        this.io.close(() => {
          console.log('WebSocket server closed');
          resolve();
        });
      });
    }
  }

  // Static method to create and start WebSocket server
  static createServer(httpServer, options) {
    return new WebSocketServer(httpServer, options);
  }
}

module.exports = {
  WebSocketServer
};