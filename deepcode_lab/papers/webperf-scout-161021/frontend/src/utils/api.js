import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败';
    console.error('API错误:', message);
    return Promise.reject(new Error(message));
  }
);

export const startTask = async (config) => {
  try {
    const { urls, crawler } = config;
    const payload = urls ? { urls } : { config: { crawler } };
    return await apiClient.post('/start-task', payload);
  } catch (error) {
    throw error;
  }
};

export const getProgress = async (taskId) => {
  try {
    return await apiClient.get(`/get-progress/${taskId}`);
  } catch (error) {
    throw error;
  }
};

export const getReport = async (taskId) => {
  try {
    return await apiClient.get(`/get-report/${taskId}`);
  } catch (error) {
    throw error;
  }
};

export const cancelTask = async (taskId) => {
  try {
    return await apiClient.post(`/cancel-task/${taskId}`);
  } catch (error) {
    throw error;
  }
};

export const pollProgress = (taskId, onUpdate, interval = 2000) => {
  const poll = setInterval(async () => {
    try {
      const data = await getProgress(taskId);
      onUpdate(data);
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        clearInterval(poll);
      }
    } catch (error) {
      clearInterval(poll);
      onUpdate({ status: 'failed', logs: [{ level: 'error', message: error.message }] });
    }
  }, interval);
  return () => clearInterval(poll);
};