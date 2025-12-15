import { io } from 'socket.io-client';
import useStore from '../store';

class WebSocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    // 连接到WebSocket服务器
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      timeout: 5000
    });

    // 连接事件
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      useStore.setState({ wsConnected: true });
    });

    // 断开连接事件
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      useStore.setState({ wsConnected: false });
    });

    // 连接错误事件
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      useStore.setState({ wsConnected: false });
    });

    // 测试开始事件
    this.socket.on('test-started', (data) => {
      console.log('Test started:', data);
      useStore.setState({ testStatus: 'running' });
    });

    // 测试进度事件
    this.socket.on('test-progress', (progress) => {
      console.log('Test progress:', progress);
      useStore.setState({
        progress: progress.percentage || 0,
        currentTask: progress.message || ''
      });
    });

    // 测试完成事件
    this.socket.on('test-completed', (data) => {
      console.log('Test completed:', data);
      useStore.setState({
        testStatus: 'completed',
        testResults: data.results,
        progress: 100
      });
      // 添加到历史记录
      const currentConfig = useStore.getState().config;
      useStore.setState((state) => ({
        history: [
          {
            id: data.testId,
            timestamp: new Date().toISOString(),
            config: currentConfig,
            results: data.results
          },
          ...state.history
        ]
      }));
    });

    // 测试错误事件
    this.socket.on('test-error', (error) => {
      console.error('Test error:', error);
      useStore.setState({
        testStatus: 'error',
        currentTask: `Error: ${error.message}`
      });
    });

    // 爬取开始事件
    this.socket.on('crawl-started', (data) => {
      console.log('Crawl started:', data);
      useStore.setState({ testStatus: 'running' });
    });

    // 爬取进度事件
    this.socket.on('crawl-progress', (progress) => {
      console.log('Crawl progress:', progress);
      useStore.setState({
        progress: progress.percentage || 0,
        currentTask: progress.message || ''
      });
    });

    // 爬取完成事件
    this.socket.on('crawl-completed', (data) => {
      console.log('Crawl completed:', data);
      useStore.setState({
        testStatus: 'completed',
        testResults: data.results,
        progress: 100
      });
      // 添加到历史记录
      const currentConfig = useStore.getState().config;
      useStore.setState((state) => ({
        history: [
          {
            id: data.testId,
            timestamp: new Date().toISOString(),
            config: currentConfig,
            results: data.results
          },
          ...state.history
        ]
      }));
    });

    // 爬取错误事件
    this.socket.on('crawl-error', (error) => {
      console.error('Crawl error:', error);
      useStore.setState({
        testStatus: 'error',
        currentTask: `Error: ${error.message}`
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useStore.setState({ wsConnected: false });
    }
  }

  // 开始性能测试
  startPerformanceTest(config) {
    if (this.socket && this.socket.connected) {
      useStore.setState({
        testStatus: 'running',
        progress: 0,
        currentTask: 'Initializing test...'
      });
      this.socket.emit('start-performance-test', config);
    }
  }

  // 开始爬取测试
  startCrawlTest(config) {
    if (this.socket && this.socket.connected) {
      useStore.setState({
        testStatus: 'running',
        progress: 0,
        currentTask: 'Initializing crawl...'
      });
      this.socket.emit('start-crawl-test', config);
    }
  }
}

// 导出单例实例
export default new WebSocketService();