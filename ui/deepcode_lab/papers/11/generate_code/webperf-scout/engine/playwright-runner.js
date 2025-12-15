const { chromium } = require('playwright');
const { performance } = require('perf_hooks');

class PlaywrightRunner {
  constructor(config) {
    this.config = config || {
      browser: {
        timeout: 30000,
        deviceScaleFactor: 1,
        viewport: { width: 1280, height: 720 },
        networkConditions: {
          download: 10 * 1024 * 1024, // 10 Mbps
          upload: 5 * 1024 * 1024,    // 5 Mbps
          latency: 20                 // 20ms
        }
      },
      performance: {
        captureScreenshots: true,
        screenshotPath: './performance-screenshots'
      }
    };
  }

  async measurePerformance(url) {
    const browser = await chromium.launch({
      headless: true,
      timeout: this.config.browser.timeout
    });

    const context = await browser.newContext({
      viewport: this.config.browser.viewport,
      deviceScaleFactor: this.config.browser.deviceScaleFactor
    });

    const page = await context.newPage();

    // Simulate network conditions
    await page.route('**/*', route => {
      const networkConditions = this.config.browser.networkConditions;
      route.continue({
        headers: {
          'x-download-speed': networkConditions.download,
          'x-upload-speed': networkConditions.upload,
          'x-latency': networkConditions.latency
        }
      });
    });

    const metrics = {
      startTime: performance.now(),
      url: url
    };

    try {
      // Navigate and collect performance metrics
      const navigationPromise = page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.config.browser.timeout 
      });

      const [response] = await Promise.all([
        navigationPromise,
        page.waitForLoadState('networkidle')
      ]);

      // Collect browser performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint')[0];
        const resources = performance.getEntriesByType('resource');

        return {
          // Core Web Vitals
          largestContentfulPaint: navigation.largestContentfulPaint || null,
          firstContentfulPaint: paint ? paint.startTime : null,
          cumulativeLayoutShift: navigation.cumulative_layout_shift || null,
          timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
          totalBlockingTime: navigation.total_blocking_time || null,

          // Additional metrics
          domLoadTime: timing.domComplete - timing.domLoading,
          pageLoadTime: timing.loadEventEnd - timing.navigationStart,
          resourceCount: resources.length,
          resourceLoadTime: resources.reduce((total, resource) => 
            total + (resource.responseEnd - resource.startTime), 0)
        };
      });

      // Capture screenshot if enabled
      let screenshotPath = null;
      if (this.config.performance.captureScreenshots) {
        const fs = require('fs');
        const path = require('path');
        
        // Ensure screenshot directory exists
        const screenshotDir = path.resolve(this.config.performance.screenshotPath);
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        screenshotPath = path.join(screenshotDir, `${new URL(url).hostname}-performance.png`);
        await page.screenshot({ path: screenshotPath });
      }

      metrics.performanceMetrics = performanceMetrics;
      metrics.screenshotPath = screenshotPath;
      metrics.endTime = performance.now();
      metrics.totalTime = metrics.endTime - metrics.startTime;

    } catch (error) {
      metrics.error = {
        message: error.message,
        stack: error.stack
      };
    } finally {
      await browser.close();
    }

    return metrics;
  }

  // Batch performance measurement for multiple URLs
  async measureMultipleUrls(urls) {
    const results = [];
    for (const url of urls) {
      try {
        const result = await this.measurePerformance(url);
        results.push(result);
      } catch (error) {
        results.push({
          url,
          error: {
            message: error.message,
            stack: error.stack
          }
        });
      }
    }
    return results;
  }
}

module.exports = PlaywrightRunner;