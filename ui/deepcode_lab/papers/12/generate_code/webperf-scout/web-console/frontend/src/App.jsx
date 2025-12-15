import React, { useEffect } from 'react';
import './App.css';
import ConfigForm from './components/ConfigForm';
import ProgressPanel from './components/ProgressPanel';
import ResultsPanel from './components/ResultsPanel';
import HistoryPanel from './components/HistoryPanel';
import ErrorBoundary from './components/ErrorBoundary';
import wsService from './services/websocket';

function App() {
  useEffect(() => {
    // 连接WebSocket
    wsService.connect();

    // 组件卸载时断开连接
    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>WebPerf Scout</h1>
          <p>Automated Web Performance Testing & Analysis</p>
        </header>

        <main className="app-main">
          <div className="left-panel">
            <ConfigForm />
            <ProgressPanel />
          </div>

          <div className="right-panel">
            <ResultsPanel />
            <HistoryPanel />
          </div>
        </main>

        <footer className="app-footer">
          <p>WebPerf Scout © 2024 | Built with React & Vite</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;