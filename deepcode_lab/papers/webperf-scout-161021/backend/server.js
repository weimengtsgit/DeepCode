const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const app = express();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason });
});

app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: false
}));
app.use(cors());
app.use(express.json());

const publicDir = path.resolve(__dirname, '../frontend/public');
const distDir = path.resolve(__dirname, '../frontend/dist');
const publicPath = fs.existsSync(publicDir) ? publicDir : distDir;
app.use(express.static(publicPath));

let db;
const taskStore = new Map();
const progressStore = new Map();
const taskTimers = new Map();

function initDatabase() {
  try {
    db = new sqlite3.Database('./webperf_scout.db', (err) => {
      if (err) {
        logger.error('数据库连接失败', { error: err.message });
        return;
      }
      logger.info('SQLite数据库已连接');
    });

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) logger.error('创建tasks表失败', { error: err.message });
    });

    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      metrics TEXT,
      screenshots TEXT,
      resources TEXT,
      score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id)
    )`, (err) => {
      if (err) logger.error('创建reports表失败', { error: err.message });
    });

    db.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      level TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id)
    )`, (err) => {
      if (err) logger.error('创建logs表失败', { error: err.message });
    });

  } catch (error) {
    logger.error('数据库初始化异常', { error: error.message });
  }
}

initDatabase();

app.post('/api/start-task', (req, res) => {
  const { urls, config } = req.body;
  
  if (!urls && !config?.crawler?.seedUrl) {
    return res.status(400).json({ error: '必须提供urls或crawler配置' });
  }

  const taskId = uuidv4();
  const taskConfig = { urls, config, mode: urls ? 'manual' : 'crawler' };
  
  try {
    db.run(
      'INSERT INTO tasks (id, config, status) VALUES (?, ?, ?)',
      [taskId, JSON.stringify(taskConfig), 'running'],
      (err) => {
        if (err) {
          logger.error('保存任务失败', { error: err.message });
          taskStore.set(taskId, { config: taskConfig, status: 'running' });
        }
      }
    );

    taskStore.set(taskId, { config: taskConfig, status: 'running' });
    progressStore.set(taskId, { progress: 0, logs: [], status: 'running' });

    setTimeout(() => simulateTask(taskId, taskConfig), 100);

    res.json({ taskId, status: 'started' });
  } catch (error) {
    logger.error('启动任务异常', { error: error.message });
    res.status(500).json({ error: '任务启动失败' });
  }
});

app.get('/api/get-progress/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  const progress = progressStore.get(taskId);
  if (!progress) {
    return res.status(404).json({ error: '任务不存在' });
  }

  res.json(progress);
});

app.get('/api/get-report/:taskId', (req, res) => {
  const { taskId } = req.params;

  try {
    db.get(
      'SELECT * FROM reports WHERE task_id = ?',
      [taskId],
      (err, row) => {
        if (err) {
          logger.error('查询报告失败', { error: err.message });
          const memReport = generateMockReport(taskId);
          return res.json(memReport);
        }

        if (!row) {
          return res.status(404).json({ error: '报告未生成' });
        }

        res.json({
          taskId: row.task_id,
          metrics: JSON.parse(row.metrics || '{}'),
          screenshots: JSON.parse(row.screenshots || '[]'),
          resources: JSON.parse(row.resources || '[]'),
          score: row.score
        });
      }
    );
  } catch (error) {
    logger.error('获取报告异常', { error: error.message });
    res.status(500).json({ error: '获取报告失败' });
  }
});

app.post('/api/cancel-task/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  try {
    const progress = progressStore.get(taskId);
    if (!progress) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (progress.status === 'completed' || progress.status === 'cancelled') {
      return res.status(400).json({ error: '任务已结束，无法取消' });
    }

    const timer = taskTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      taskTimers.delete(taskId);
    }

    progressStore.set(taskId, {
      ...progress,
      status: 'cancelled',
      logs: [...progress.logs, {
        level: 'warning',
        message: '任务已被用户取消',
        timestamp: new Date().toISOString()
      }]
    });

    if (db) {
      db.run(
        'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', taskId],
        (err) => {
          if (err) logger.error('更新任务状态失败', { error: err.message });
        }
      );

      db.run(
        'INSERT INTO logs (task_id, level, message) VALUES (?, ?, ?)',
        [taskId, 'warning', '任务已被用户取消'],
        (err) => {
          if (err) logger.error('保存取消日志失败', { error: err.message });
        }
      );
    }

    logger.info('任务已取消', { taskId });
    res.json({ success: true, message: '任务已成功取消' });
  } catch (error) {
    logger.error('取消任务异常', { error: error.message });
    res.status(500).json({ error: '取消任务失败' });
  }
});

function simulateTask(taskId, config) {
  const logs = [];
  const addLog = (level, message) => {
    logs.push({ level, message, timestamp: new Date().toISOString() });
    progressStore.set(taskId, {
      ...progressStore.get(taskId),
      logs
    });

    if (db) {
      db.run(
        'INSERT INTO logs (task_id, level, message) VALUES (?, ?, ?)',
        [taskId, level, message],
        (err) => {
          if (err) logger.error('保存日志失败', { error: err.message });
        }
      );
    }
  };

  addLog('info', '任务已启动');
  
  let progress = 0;
  const interval = setInterval(() => {
    const currentProgress = progressStore.get(taskId);
    if (currentProgress?.status === 'cancelled') {
      clearInterval(interval);
      taskTimers.delete(taskId);
      return;
    }

    progress += 20;
    addLog('info', `任务进度: ${progress}%`);
    
    progressStore.set(taskId, {
      progress,
      logs,
      status: progress >= 100 ? 'completed' : 'running'
    });

    if (progress >= 100) {
      clearInterval(interval);
      taskTimers.delete(taskId);
      addLog('success', '任务完成');
      
      const report = {
        taskId,
        metrics: {
          LCP: 1800 + Math.random() * 1000,
          FCP: 1200 + Math.random() * 600,
          CLS: 0.05 + Math.random() * 0.1,
          TTI: 3000 + Math.random() * 1000,
          TBT: 100 + Math.random() * 150
        },
        screenshots: ['https://hpi-hub.tos-cn-beijing.volces.com/static/key_2d/tile_0083_1756179542620-9830.png'],
        resources: ['main.js', 'styles.css', 'logo.png'],
        score: Math.floor(70 + Math.random() * 25)
      };

      if (db) {
        db.run(
          'INSERT INTO reports (id, task_id, metrics, screenshots, resources, score) VALUES (?, ?, ?, ?, ?, ?)',
          [
            uuidv4(),
            taskId,
            JSON.stringify(report.metrics),
            JSON.stringify(report.screenshots),
            JSON.stringify(report.resources),
            report.score
          ],
          (err) => {
            if (err) logger.error('保存报告失败', { error: err.message });
          }
        );

        db.run(
          'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['completed', taskId]
        );
      }
    }
  }, 2000);

  taskTimers.set(taskId, interval);
}

function generateMockReport(taskId) {
  return {
    taskId,
    metrics: {
      LCP: 2100,
      FCP: 1400,
      CLS: 0.08,
      TTI: 3500,
      TBT: 150
    },
    screenshots: ['https://hpi-hub.tos-cn-beijing.volces.com/static/key_2d/tile_0083_1756179542620-9830.png'],
    resources: ['main.js', 'styles.css'],
    score: 78
  };
}

app.get('*', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`WebPerf Scout服务已启动`, { port: PORT });
});