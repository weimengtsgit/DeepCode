import React from 'react';
import useStore from '../store';

const ProgressPanel = () => {
  const { testStatus, progress, currentTask, wsConnected } = useStore();

  const getStatusColor = () => {
    switch (testStatus) {
      case 'running': return '#3498db';
      case 'completed': return '#2ecc71';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = () => {
    switch (testStatus) {
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  };

  return (
    <div className="progress-panel">
      <div className="panel-header">
        <h2>Test Progress</h2>
        <div className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
          WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="status-section">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className="status-value" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </span>
        </div>
        
        {currentTask && (
          <div className="task-section">
            <h3>Current Task:</h3>
            <p>{currentTask}</p>
          </div>
        )}
        
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressPanel;
