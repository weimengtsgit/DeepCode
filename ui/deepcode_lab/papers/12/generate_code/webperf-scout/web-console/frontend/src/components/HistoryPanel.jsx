import React from 'react';
import useStore from '../store';

function HistoryPanel() {
  const { history } = useStore();

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="history-panel">
      <h3>Test History</h3>
      <div className="history-list">
        {history.length === 0 ? (
          <p className="no-history">No test history yet</p>
        ) : (
          history.map((item, index) => (
            <div key={index} className="history-item">
              <div className="history-header">
                <span className="history-url">{item.config?.url || 'Unknown URL'}</span>
                <span className="history-date">{formatDate(item.timestamp)}</span>
              </div>
              <div className="history-metrics">
                <div className="metric-item">
                  <span className="metric-label">Score:</span>
                  <span className={`metric-value ${item.results?.overall_score >= 80 ? 'good' : item.results?.overall_score >= 50 ? 'average' : 'poor'}`}>
                    {item.results?.overall_score || 'N/A'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">FCP:</span>
                  <span className="metric-value">{item.results?.metrics?.fcp || 'N/A'}ms</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">LCP:</span>
                  <span className="metric-value">{item.results?.metrics?.lcp || 'N/A'}ms</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HistoryPanel;