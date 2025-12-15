import React from 'react';
import useStore from '../store';
import wsService from '../services/websocket';

const ConfigForm = () => {
  const { config, updateConfig, testStatus } = useStore();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateConfig({
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleTestSubmit = (e) => {
    e.preventDefault();
    wsService.startPerformanceTest(config);
  };

  const handleCrawlSubmit = (e) => {
    e.preventDefault();
    wsService.startCrawlTest(config);
  };

  return (
    <div className="config-form">
      <h2>Configuration</h2>
      <form onSubmit={handleTestSubmit}>
        <div className="form-group">
          <label htmlFor="testUrl">Test URL:</label>
          <input
            type="url"
            id="testUrl"
            name="testUrl"
            value={config.testUrl}
            onChange={handleChange}
            required
            placeholder="https://example.com"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="browser">Browser:</label>
            <select
              id="browser"
              name="browser"
              value={config.browser}
              onChange={handleChange}
            >
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="connectionType">Connection:</label>
            <select
              id="connectionType"
              name="connectionType"
              value={config.connectionType}
              onChange={handleChange}
            >
              <option value="4g">4G</option>
              <option value="3g">3G</option>
              <option value="lte">LTE</option>
              <option value="wifi">WiFi</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="iterations">Iterations:</label>
            <input
              type="number"
              id="iterations"
              name="iterations"
              value={config.iterations}
              onChange={handleChange}
              min="1"
              max="10"
            />
          </div>

          <div className="form-group">
            <label htmlFor="crawlDepth">Crawl Depth:</label>
            <input
              type="number"
              id="crawlDepth"
              name="crawlDepth"
              value={config.crawlDepth}
              onChange={handleChange}
              min="1"
              max="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxPages">Max Pages:</label>
            <input
              type="number"
              id="maxPages"
              name="maxPages"
              value={config.maxPages}
              onChange={handleChange}
              min="1"
              max="50"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={testStatus === 'running'}
          >
            Run Single Test
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCrawlSubmit}
            disabled={testStatus === 'running'}
          >
            Start Crawl Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigForm;