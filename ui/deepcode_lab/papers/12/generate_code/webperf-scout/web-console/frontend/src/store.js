import { create } from 'zustand';

const useStore = create((set) => ({
  // 配置状态
  config: {
    testUrl: '',
    browser: 'chrome',
    connectionType: '4g',
    iterations: 3,
    crawlDepth: 1,
    maxPages: 10
  },

  // 测试结果
  testResults: null,

  // 测试状态
  testStatus: 'idle', // idle, running, completed, error

  // 进度信息
  progress: 0,
  currentTask: '',

  // 历史记录
  history: [],

  // WebSocket连接状态
  wsConnected: false,

  // 更新配置
  updateConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),

  // 设置测试结果
  setTestResults: (results) => set({ testResults: results }),

  // 设置测试状态
  setTestStatus: (status) => set({ testStatus: status }),

  // 更新进度
  updateProgress: (progress, task) => set((state) => ({ progress, currentTask: task || state.currentTask })),

  // 添加到历史记录
  addToHistory: (result) => set((state) => ({
    history: [result, ...state.history]
  })),

  // 设置WebSocket连接状态
  setWsConnected: (connected) => set({ wsConnected: connected })
}));

export default useStore;