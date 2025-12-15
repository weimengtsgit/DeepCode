import React from 'react';
import useStore from '../store';
import PerformanceChart from './PerformanceChart';

const ResultsPanel = () => {
  const { testResults } = useStore();

  if (!testResults) {
    return (
      <div className="results-panel">
        <h2>Test Results</h2>
        <p className="no-results">No test results available. Run a test to see results.</p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 90) return '#2ecc71';
    if (score >= 70) return '#f1c40f';
    if (score >= 50) return '#e67e22';
    return '#e74c3c';
  };

  return (
    <div className="results-panel">
      <h2>Test Results</h2>
      
      <div className="overall-score">
        <h3>Overall Performance Score</h3>
        <div className="score-display" style={{ color: getScoreColor(testResults.overall_score) }}>
          {testResults.overall_score}
        </div>
      </div>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>First Contentful Paint</h4>
          <p className="metric-value">{testResults.metrics.fcp}ms</p>
        </div>
        
        <div className="metric-card">
          <h4>Largest Contentful Paint</h4>
          <p className="metric-value">{testResults.metrics.lcp}ms</p>
        </div>
        
        <div className="metric-card">
          <h4>Time to Interactive</h4>
          <p className="metric-value">{testResults.metrics.tti}ms</p>
        </div>
        
        <div className="metric-card">
          <h4>Total Blocking Time</h4>
          <p className="metric-value">{testResults.metrics.tbt}ms</p>
        </div>
        
        <div className="metric-card">
          <h4>Cumulative Layout Shift</h4>
          <p className="metric-value">{testResults.metrics.cls}</p>
        </div>
        
        <div className="metric-card">
          <h4>Speed Index</h4>
          <p className="metric-value">{testResults.metrics.speed_index}ms</p>
        </div>
      </div>
      
      <div className="chart-section">
        <h3>Performance Metrics Comparison</h3>
        <PerformanceChart metrics={testResults.metrics} />
      </div>
      
      {testResults.audits && (
        <div className="audits-section">
          <h3>Key Audits</h3>
          <ul className="audit-list">
            {testResults.audits.map((audit, index) => (
              <li key={index} className="audit-item">
                <span className="audit-name">{audit.name}:</span>
                <span className={`audit-score ${audit.score >= 0.9 ? 'pass' : audit.score >= 0.5 ? 'warn' : 'fail'}`}>
                  {Math.round(audit.score * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;