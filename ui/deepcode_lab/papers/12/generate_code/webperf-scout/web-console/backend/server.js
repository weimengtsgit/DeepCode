const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { WebSocketServer } = require('./websocket');

class WebConsoleServer {
  constructor(options = {}) {
    this.port = options.port || 3333;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wsServer = null;

    this._configureMiddleware();
    this._setupRoutes();
  }

  _configureMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: ['http://localhost:3000', 'https://webperf-scout.com'],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // JSON parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  _setupRoutes() {
    // Performance test submission route
    this.app.post('/api/performance-test', this._handlePerformanceTest.bind(this));

    // Crawl configuration route
    this.app.post('/api/crawl-config', this._handleCrawlConfig.bind(this));

    // Performance results retrieval route
    this.app.get('/api/results', this._handleResultsRetrieval.bind(this));

    // Health check route
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });
  }

  async _handlePerformanceTest(req, res) {
    try {
      const { url, options } = req.body;
      
      // Validate input
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Delegate to performance testing engine
      const performanceOrchestrator = require('../../engine/orchestrator');
      const results = await performanceOrchestrator.runPerformanceTest(url, options);

      res.json(results);
    } catch (error) {
      console.error('Performance test error:', error);
      res.status(500).json({ error: 'Performance test failed', details: error.message });
    }
  }

  async _handleCrawlConfig(req, res) {
    try {
      const { seedUrl, options } = req.body;
      
      // Validate input
      if (!seedUrl) {
        return res.status(400).json({ error: 'Seed URL is required' });
      }

      // Delegate to crawler
      const urlDiscoverer = require('../../crawler/discoverer');
      const discoveredUrls = await urlDiscoverer.discoverUrls(seedUrl, options);

      res.json({ urls: discoveredUrls });
    } catch (error) {
      console.error('Crawl configuration error:', error);
      res.status(500).json({ error: 'URL discovery failed', details: error.message });
    }
  }

  async _handleResultsRetrieval(req, res) {
    try {
      // In a real implementation, this would interact with a database or file system
      const reportGenerator = require('../../report/generator');
      const recentResults = await reportGenerator.getRecentResults();

      res.json(recentResults);
    } catch (error) {
      console.error('Results retrieval error:', error);
      res.status(500).json({ error: 'Could not retrieve results', details: error.message });
    }
  }

  startServer() {
    // Initialize WebSocket server
    this.wsServer = new WebSocketServer(this.server);

    this.server.listen(this.port, () => {
      console.log(`WebPerf Scout Web Console Server running on port ${this.port}`);
    });

    return this.server;
  }

  stopServer() {
    if (this.server) {
      this.server.close();
    }
    if (this.wsServer) {
      this.wsServer.close();
    }
  }
}

module.exports = {
  WebConsoleServer,
  createServer: (options) => {
    const server = new WebConsoleServer(options);
    return server.startServer();
  }
};