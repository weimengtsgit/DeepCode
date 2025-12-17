/**
 * Log Generator
 * 
 * Generates realistic log entries with various levels, patterns, and distributions
 * for the observability platform. Simulates real-world logging scenarios including
 * normal operations, errors, access logs, and system events.
 */

import { faker } from '@faker-js/faker';
import type {
  LogEntry,
  LogLevel,
  LogSource,
  LogFormat,
  LogPattern,
  LogAnomaly,
  LogTimeSeriesData,
} from '@/types/logs';
import type { MetricLabels } from '@/types/metrics';

/**
 * Log Generator Configuration
 */
export interface LogGeneratorConfig {
  /** Start timestamp (Unix milliseconds) */
  startTime: number;
  /** End timestamp (Unix milliseconds) */
  endTime: number;
  /** Service name */
  service: string;
  /** Environment */
  environment?: string;
  /** Region */
  region?: string;
  /** Log level distribution (percentages should sum to 100) */
  levelDistribution?: Record<LogLevel, number>;
  /** Average logs per second */
  logsPerSecond?: number;
  /** Include trace context */
  includeTraceContext?: boolean;
  /** Include HTTP context */
  includeHttpContext?: boolean;
  /** Error rate (0-1) */
  errorRate?: number;
  /** Log format */
  format?: LogFormat;
}

/**
 * Default log level distribution (realistic production distribution)
 */
const DEFAULT_LEVEL_DISTRIBUTION: Record<LogLevel, number> = {
  FATAL: 0.5,
  ERROR: 7.5,
  WARN: 20,
  INFO: 70,
  DEBUG: 2,
  TRACE: 0,
};

/**
 * Log message templates by level
 */
const LOG_TEMPLATES: Record<LogLevel, string[]> = {
  FATAL: [
    'System critical failure: {error}',
    'Database connection pool exhausted',
    'Out of memory error: heap space exceeded',
    'Unrecoverable error in {component}: {error}',
    'Service shutdown due to fatal error',
  ],
  ERROR: [
    'Failed to process request: {error}',
    'Database query failed: {query}',
    'External API call failed: {url}',
    'Authentication failed for user {userId}',
    'Payment processing error: {error}',
    'Failed to send notification: {error}',
    'Cache write failed: {key}',
    'File operation failed: {path}',
    'Invalid request parameters: {params}',
    'Resource not found: {resource}',
  ],
  WARN: [
    'High memory usage detected: {usage}%',
    'Slow query detected: {duration}ms',
    'Rate limit approaching for {endpoint}',
    'Cache miss for key: {key}',
    'Deprecated API usage: {api}',
    'Connection pool size approaching limit',
    'Retry attempt {attempt} for {operation}',
    'Configuration value missing: {key}',
    'Session timeout for user {userId}',
    'Disk space low: {available}GB remaining',
  ],
  INFO: [
    'Request processed successfully',
    'User {userId} logged in',
    'Order {orderId} created',
    'Payment {paymentId} completed',
    'Cache updated for key: {key}',
    'Configuration reloaded',
    'Health check passed',
    'Scheduled task {task} executed',
    'Message published to {topic}',
    'Database connection established',
  ],
  DEBUG: [
    'Processing request with params: {params}',
    'Cache lookup for key: {key}',
    'Query execution plan: {plan}',
    'Middleware chain: {middlewares}',
    'Variable state: {state}',
    'Function {function} called with args: {args}',
    'HTTP client request: {method} {url}',
    'Validation result: {result}',
  ],
  TRACE: [
    'Entering function: {function}',
    'Exiting function: {function}',
    'Loop iteration {iteration}',
    'Condition evaluated: {condition}',
    'Variable assignment: {variable} = {value}',
  ],
};

/**
 * Common error types
 */
const ERROR_TYPES = [
  'NullPointerException',
  'IllegalArgumentException',
  'TimeoutException',
  'ConnectionException',
  'ValidationException',
  'AuthenticationException',
  'AuthorizationException',
  'NotFoundException',
  'ConflictException',
  'ServiceUnavailableException',
];

/**
 * HTTP methods and status codes
 */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const HTTP_STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 409, 500, 502, 503];

/**
 * Generate a single log entry
 */
export function generateLogEntry(config: Partial<LogGeneratorConfig> & { timestamp: number }): LogEntry {
  const level = selectLogLevel(config.levelDistribution);
  const template = faker.helpers.arrayElement(LOG_TEMPLATES[level]);
  const message = interpolateTemplate(template, level);

  const log: LogEntry = {
    id: faker.string.uuid(),
    timestamp: config.timestamp,
    level,
    message,
    service: config.service || faker.helpers.arrayElement(['user-service', 'order-service', 'payment-service']),
    source: selectLogSource(level),
    format: config.format || 'json',
    hostname: faker.internet.domainName(),
    pid: faker.number.int({ min: 1000, max: 65535 }),
    thread: `thread-${faker.number.int({ min: 1, max: 20 })}`,
    logger: `com.example.${faker.word.noun()}.${faker.word.verb()}`,
    environment: config.environment || 'production',
    region: config.region || faker.helpers.arrayElement(['us-east-1', 'us-west-2', 'eu-west-1']),
    version: faker.system.semver(),
    fields: {},
  };

  // Add trace context if enabled
  if (config.includeTraceContext && faker.datatype.boolean({ probability: 0.3 })) {
    log.traceId = faker.string.hexadecimal({ length: 32, prefix: '' });
    log.spanId = faker.string.hexadecimal({ length: 16, prefix: '' });
  }

  // Add HTTP context if enabled
  if (config.includeHttpContext && faker.datatype.boolean({ probability: 0.4 })) {
    log.httpMethod = faker.helpers.arrayElement(HTTP_METHODS);
    log.httpStatusCode = faker.helpers.arrayElement(HTTP_STATUS_CODES);
    log.httpUrl = `/${faker.word.noun()}/${faker.word.noun()}`;
    log.httpUserAgent = faker.internet.userAgent();
    log.httpRemoteAddr = faker.internet.ip();
    log.httpDuration = faker.number.int({ min: 10, max: 5000 });
  }

  // Add error details for ERROR and FATAL levels
  if (level === 'ERROR' || level === 'FATAL') {
    log.exception = faker.helpers.arrayElement(ERROR_TYPES);
    log.stackTrace = generateStackTrace();
    log.errorCode = `ERR_${faker.number.int({ min: 1000, max: 9999 })}`;
  }

  // Add user context
  if (faker.datatype.boolean({ probability: 0.3 })) {
    log.userId = faker.string.uuid();
    log.username = faker.internet.userName();
  }

  // Add session context
  if (faker.datatype.boolean({ probability: 0.2 })) {
    log.sessionId = faker.string.uuid();
  }

  // Add request ID
  if (faker.datatype.boolean({ probability: 0.5 })) {
    log.requestId = faker.string.uuid();
  }

  // Add custom fields
  log.fields = {
    component: faker.word.noun(),
    action: faker.word.verb(),
    duration: faker.number.int({ min: 1, max: 1000 }),
    ...generateCustomFields(level),
  };

  // Add tags
  log.tags = [
    log.service,
    log.environment,
    level.toLowerCase(),
    faker.word.adjective(),
  ];

  return log;
}

/**
 * Generate multiple log entries
 */
export function generateLogs(config: LogGeneratorConfig): LogEntry[] {
  const logs: LogEntry[] = [];
  const duration = config.endTime - config.startTime;
  const logsPerSecond = config.logsPerSecond || 100;
  const totalLogs = Math.floor((duration / 1000) * logsPerSecond);

  // Generate logs with Poisson distribution for realistic time distribution
  for (let i = 0; i < totalLogs; i++) {
    const timestamp = config.startTime + Math.floor(Math.random() * duration);
    logs.push(generateLogEntry({ ...config, timestamp }));
  }

  // Sort by timestamp
  logs.sort((a, b) => a.timestamp - b.timestamp);

  return logs;
}

/**
 * Generate logs with specific pattern
 */
export function generatePatternLogs(
  pattern: 'normal' | 'spike' | 'error-burst' | 'gradual-increase',
  config: LogGeneratorConfig
): LogEntry[] {
  const logs: LogEntry[] = [];
  const duration = config.endTime - config.startTime;
  const baseLogsPerSecond = config.logsPerSecond || 100;

  switch (pattern) {
    case 'normal':
      return generateLogs(config);

    case 'spike': {
      // Normal logs with a sudden spike in the middle
      const spikeStart = config.startTime + duration * 0.5;
      const spikeEnd = spikeStart + 60000; // 1 minute spike

      for (let t = config.startTime; t < config.endTime; t += 1000) {
        const isSpike = t >= spikeStart && t < spikeEnd;
        const logsThisSecond = isSpike ? baseLogsPerSecond * 5 : baseLogsPerSecond;

        for (let i = 0; i < logsThisSecond; i++) {
          const timestamp = t + Math.floor(Math.random() * 1000);
          logs.push(generateLogEntry({ ...config, timestamp }));
        }
      }
      break;
    }

    case 'error-burst': {
      // Normal logs with periodic error bursts
      for (let t = config.startTime; t < config.endTime; t += 1000) {
        const isErrorBurst = Math.floor((t - config.startTime) / 1000) % 300 < 10; // 10s burst every 5 minutes
        const errorRate = isErrorBurst ? 0.5 : 0.08;

        for (let i = 0; i < baseLogsPerSecond; i++) {
          const timestamp = t + Math.floor(Math.random() * 1000);
          const levelDistribution = isErrorBurst
            ? { FATAL: 2, ERROR: 48, WARN: 30, INFO: 20, DEBUG: 0, TRACE: 0 }
            : DEFAULT_LEVEL_DISTRIBUTION;

          logs.push(generateLogEntry({ ...config, timestamp, levelDistribution }));
        }
      }
      break;
    }

    case 'gradual-increase': {
      // Gradually increasing log volume
      for (let t = config.startTime; t < config.endTime; t += 1000) {
        const progress = (t - config.startTime) / duration;
        const logsThisSecond = Math.floor(baseLogsPerSecond * (1 + progress * 2));

        for (let i = 0; i < logsThisSecond; i++) {
          const timestamp = t + Math.floor(Math.random() * 1000);
          logs.push(generateLogEntry({ ...config, timestamp }));
        }
      }
      break;
    }
  }

  logs.sort((a, b) => a.timestamp - b.timestamp);
  return logs;
}

/**
 * Generate log time series data
 */
export function generateLogTimeSeries(
  logs: LogEntry[],
  interval: number
): LogTimeSeriesData[] {
  if (logs.length === 0) return [];

  const startTime = logs[0].timestamp;
  const endTime = logs[logs.length - 1].timestamp;
  const buckets = new Map<number, LogTimeSeriesData>();

  // Initialize buckets
  for (let t = startTime; t <= endTime; t += interval) {
    buckets.set(t, {
      timestamp: t,
      count: 0,
      levels: {
        FATAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
        DEBUG: 0,
        TRACE: 0,
      },
    });
  }

  // Fill buckets
  logs.forEach((log) => {
    const bucketTime = Math.floor(log.timestamp / interval) * interval;
    const bucket = buckets.get(bucketTime);
    if (bucket) {
      bucket.count++;
      bucket.levels[log.level]++;
    }
  });

  return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Detect log patterns
 */
export function detectLogPatterns(logs: LogEntry[]): LogPattern[] {
  const patterns = new Map<string, LogPattern>();

  logs.forEach((log) => {
    // Extract pattern by removing variable parts
    const pattern = log.message
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '{uuid}')
      .replace(/\b\d+\b/g, '{number}')
      .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, '{email}')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '{ip}');

    const key = `${log.level}:${pattern}`;
    const existing = patterns.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = Math.max(existing.lastSeen, log.timestamp);
      if (existing.examples.length < 3) {
        existing.examples.push(log.message);
      }
    } else {
      patterns.set(key, {
        pattern,
        count: 1,
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        level: log.level,
        service: log.service,
        examples: [log.message],
        severity: log.level === 'FATAL' || log.level === 'ERROR' ? 'high' : log.level === 'WARN' ? 'medium' : 'low',
      });
    }
  });

  return Array.from(patterns.values()).sort((a, b) => b.count - a.count);
}

/**
 * Detect log anomalies
 */
export function detectLogAnomalies(
  timeSeries: LogTimeSeriesData[],
  threshold: number = 2
): LogAnomaly[] {
  if (timeSeries.length < 10) return [];

  const anomalies: LogAnomaly[] = [];

  // Calculate baseline statistics
  const counts = timeSeries.map((d) => d.count);
  const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
  const stdDev = Math.sqrt(
    counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length
  );

  // Detect spikes and drops
  timeSeries.forEach((data, index) => {
    const zScore = (data.count - mean) / stdDev;

    if (Math.abs(zScore) > threshold) {
      anomalies.push({
        timestamp: data.timestamp,
        type: zScore > 0 ? 'spike' : 'drop',
        severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
        description: `${zScore > 0 ? 'Spike' : 'Drop'} in log volume: ${data.count} logs (${Math.abs(zScore).toFixed(1)}σ from mean)`,
        affectedLevels: Object.entries(data.levels)
          .filter(([_, count]) => count > 0)
          .map(([level]) => level as LogLevel),
        score: Math.abs(zScore),
      });
    }
  });

  // Detect pattern changes (sudden increase in error rate)
  for (let i = 5; i < timeSeries.length; i++) {
    const recentErrors = timeSeries.slice(i - 5, i).reduce((sum, d) => sum + d.levels.ERROR + d.levels.FATAL, 0);
    const currentErrors = timeSeries[i].levels.ERROR + timeSeries[i].levels.FATAL;
    const recentTotal = timeSeries.slice(i - 5, i).reduce((sum, d) => sum + d.count, 0);
    const currentTotal = timeSeries[i].count;

    const recentErrorRate = recentTotal > 0 ? recentErrors / recentTotal : 0;
    const currentErrorRate = currentTotal > 0 ? currentErrors / currentTotal : 0;

    if (currentErrorRate > recentErrorRate * 3 && currentErrorRate > 0.1) {
      anomalies.push({
        timestamp: timeSeries[i].timestamp,
        type: 'pattern_change',
        severity: 'high',
        description: `Sudden increase in error rate: ${(currentErrorRate * 100).toFixed(1)}% (was ${(recentErrorRate * 100).toFixed(1)}%)`,
        affectedLevels: ['ERROR', 'FATAL'],
        score: currentErrorRate / recentErrorRate,
      });
    }
  }

  return anomalies.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Helper: Select log level based on distribution
 */
function selectLogLevel(distribution?: Record<LogLevel, number>): LogLevel {
  const dist = distribution || DEFAULT_LEVEL_DISTRIBUTION;
  const rand = Math.random() * 100;
  let cumulative = 0;

  for (const [level, percentage] of Object.entries(dist)) {
    cumulative += percentage;
    if (rand <= cumulative) {
      return level as LogLevel;
    }
  }

  return 'INFO';
}

/**
 * Helper: Select log source based on level
 */
function selectLogSource(level: LogLevel): LogSource {
  if (level === 'FATAL' || level === 'ERROR') {
    return faker.helpers.arrayElement(['application', 'system', 'database']);
  }
  return faker.helpers.arrayElement(['application', 'access', 'audit', 'security']);
}

/**
 * Helper: Interpolate template with random values
 */
function interpolateTemplate(template: string, level: LogLevel): string {
  return template
    .replace(/{error}/g, faker.helpers.arrayElement(ERROR_TYPES))
    .replace(/{component}/g, faker.word.noun())
    .replace(/{query}/g, `SELECT * FROM ${faker.word.noun()}`)
    .replace(/{url}/g, `https://api.example.com/${faker.word.noun()}`)
    .replace(/{userId}/g, faker.string.uuid())
    .replace(/{orderId}/g, `ORD-${faker.number.int({ min: 10000, max: 99999 })}`)
    .replace(/{paymentId}/g, `PAY-${faker.number.int({ min: 10000, max: 99999 })}`)
    .replace(/{key}/g, `cache:${faker.word.noun()}:${faker.number.int({ min: 1, max: 1000 })}`)
    .replace(/{path}/g, `/var/log/${faker.word.noun()}.log`)
    .replace(/{params}/g, JSON.stringify({ id: faker.number.int(), name: faker.word.noun() }))
    .replace(/{resource}/g, faker.word.noun())
    .replace(/{usage}/g, faker.number.int({ min: 70, max: 95 }).toString())
    .replace(/{duration}/g, faker.number.int({ min: 500, max: 5000 }).toString())
    .replace(/{endpoint}/g, `/${faker.word.noun()}`)
    .replace(/{api}/g, `v1/${faker.word.noun()}`)
    .replace(/{attempt}/g, faker.number.int({ min: 1, max: 5 }).toString())
    .replace(/{operation}/g, faker.word.verb())
    .replace(/{available}/g, faker.number.int({ min: 1, max: 50 }).toString())
    .replace(/{task}/g, faker.word.noun())
    .replace(/{topic}/g, `events.${faker.word.noun()}`)
    .replace(/{plan}/g, 'Index Scan')
    .replace(/{middlewares}/g, 'auth -> validate -> process')
    .replace(/{state}/g, JSON.stringify({ status: 'active' }))
    .replace(/{function}/g, faker.word.verb())
    .replace(/{args}/g, '(arg1, arg2)')
    .replace(/{method}/g, faker.helpers.arrayElement(HTTP_METHODS))
    .replace(/{result}/g, 'passed')
    .replace(/{iteration}/g, faker.number.int({ min: 1, max: 100 }).toString())
    .replace(/{condition}/g, 'true')
    .replace(/{variable}/g, faker.word.noun())
    .replace(/{value}/g, faker.number.int({ min: 1, max: 100 }).toString());
}

/**
 * Helper: Generate stack trace
 */
function generateStackTrace(): string {
  const lines: string[] = [];
  const depth = faker.number.int({ min: 5, max: 15 });

  for (let i = 0; i < depth; i++) {
    const className = `com.example.${faker.word.noun()}.${faker.helpers.arrayElement(['Controller', 'Service', 'Repository', 'Util'])}`;
    const methodName = faker.word.verb();
    const fileName = `${faker.word.noun()}.java`;
    const lineNumber = faker.number.int({ min: 10, max: 500 });

    lines.push(`    at ${className}.${methodName}(${fileName}:${lineNumber})`);
  }

  return lines.join('\n');
}

/**
 * Helper: Generate custom fields based on log level
 */
function generateCustomFields(level: LogLevel): Record<string, any> {
  const fields: Record<string, any> = {};

  if (level === 'ERROR' || level === 'FATAL') {
    fields.errorType = faker.helpers.arrayElement(ERROR_TYPES);
    fields.errorMessage = faker.lorem.sentence();
  }

  if (faker.datatype.boolean({ probability: 0.3 })) {
    fields.responseTime = faker.number.int({ min: 10, max: 5000 });
  }

  if (faker.datatype.boolean({ probability: 0.2 })) {
    fields.cacheHit = faker.datatype.boolean();
  }

  return fields;
}
