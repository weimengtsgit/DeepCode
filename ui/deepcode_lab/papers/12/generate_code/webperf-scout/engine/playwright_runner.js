const { chromium, firefox, webkit } = require('playwright');
const { performance } = require('perf_hooks');

class PlaywrightRunner {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      browser: 'chromium',
      deviceEmulation: null,
      networkConditions: null,
      ...options
    };
  }

  async _getBrowserInstance() {
    const browserTypes = {
      'chromium': chromium,
      'firefox': firefox,
      'webkit': webkit
    };

    if (!browserTypes[this.options.browser]) {
      throw new Error(`Unsupported browser: ${this.options.browser}`);
    }

    return await browserTypes[this.options.browser].launch({
      headless: true,
      timeout: this.options.timeout
    });
  }

  async runPerformanceTest(url) {
    const browser = await this._getBrowserInstance();
    const context = await browser.newContext({
      ...(this.options.deviceEmulation && { 
        devices: this.options.deviceEmulation 
      })
    });

    const page = await context.newPage();

    // Network throttling simulation
    if (this.options.networkConditions) {
      await page.route('**/*', (route) => {
        return route.continue({
          headers: {
            ...route.request().headers(),
            'Connection': 'keep-alive'
          }
        });
      });
    }

    const metrics = {
      lcp: null,
      fcp: null,
      tti: null,
      cls: 0,
      totalBlockingTime: 0
    };

    const startTime = performance.now();

    try {
      // First Contentful Paint (FCP)
      await page.waitForLoadState('load');
      metrics.fcp = performance.now() - startTime;

      // Largest Contentful Paint (LCP)
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        });
      });
      metrics.lcp = lcp;

      // Time to Interactive (TTI)
      const tti = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'longtask', buffered: true });
        });
      });
      metrics.tti = tti;

      // Cumulative Layout Shift (CLS)
      const cls = await page.evaluate(() => {
        let totalCLS = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            totalCLS += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        return totalCLS;
      });
      metrics.cls = cls;

      // Total Blocking Time
      const longTasks = await page.evaluate(() => {
        let totalBlockingTime = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              totalBlockingTime += entry.duration - 50;
            }
          }
        }).observe({ type: 'longtask', buffered: true });
        return totalBlockingTime;
      });
      metrics.totalBlockingTime = longTasks;

    } catch (error) {
      console.error('Performance measurement error:', error);
    } finally {
      await browser.close();
    }

    return metrics;
  }

  static async testMultipleUrls(urls, options = {}) {
    const results = {};
    for (const url of urls) {
      const runner = new PlaywrightRunner(options);
      results[url] = await runner.runPerformanceTest(url);
    }
    return results;
  }
}

module.exports = PlaywrightRunner;