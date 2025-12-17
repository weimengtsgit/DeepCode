/**
 * Log Generator - Generates realistic log streams with time-based density variation
 * 
 * Core Concept: Poisson process for inter-arrival times, density varies by time-of-day
 * 
 * Algorithm: 
 * - Base frequency varies by time (business hours: 1.5x, night: 0.3x, weekend: 0.6x)
 * - Poisson inter-arrival times for realistic log spacing
 * - Error clustering: occasional bursts of errors (1% chance to start cluster)
 * - Level distribution: 50% INFO, 30% WARN, 15% ERROR, 5% DEBUG, 1% FATAL
 * - TraceId correlation: 20% of logs linked to traces
 */

import { LogEntry, LogLevel, LogConfig, ServiceDefinition } from '@/types';
import { generateUUID, gaussian, exponentialRandom } from './utils';

/**
 * Configuration for log generation
 */
export interface LogGeneratorConfig {
  services: ServiceDefinition[];
  timeRange: { start: Date; end: Date };
  baseFrequencyPerMinute?: number;  // Default: 10 logs/minute
  peakHours?: [number, number][];   // UTC hours with higher frequency
  errorRateNormal?: number;         // Default: 0.005 (0.5%)
  errorRatePeak?: number;           // Default: 0.1 (10% during clusters)
  traceIdProbability?: number;      // Default: 0.2 (20% of logs)
}

/**
 * Log message templates by level
 */
const LOG_MESSAGE_TEMPLATES: Record<LogLevel, string[]> = {
  DEBUG: [
    'Method {method} called with params {params}',
    'Cache hit for key {key}',
    'Database connection pool available: {count}',
    'Processing batch item {index}/{total}',
    'Cache miss for key {key}, fetching from source',
    'Query execution time: {ms}ms',
    'Serializing response object',
  ],
  INFO: [
    'Request {id} received from {source}',
    'User {userId} logged in successfully',
    'Batch job {jobId} started',
    'Service health check passed for {service}',
    'Configuration reloaded successfully',
    'Database migration completed',
    'Cache warmed up with {count} entries',
    'Service started on port {port}',
  ],
  WARN: [
    'Retry attempt {attempt}/{max} for operation {op}',
    'High memory usage: {percent}%',
    'API response time elevated: {ms}ms',
    'Database connection slow: {ms}ms',
    'Rate limit approaching: {current}/{limit}',
    'Deprecated API endpoint called: {endpoint}',
    'Slow query detected: {query}',
    'Connection pool exhausted, waiting for available connection',
  ],
  ERROR: [
    'Failed to connect to database: {error}',
    'Timeout on API call to {service}: {ms}ms',
    'Authentication failed for user {userId}',
    'Payment processing failed: {error}',
    'Failed to write to cache: {error}',
    'Service {service} returned error: {code}',
    'Request validation failed: {reason}',
    'File not found: {path}',
  ],
  FATAL: [
    'Critical service degradation detected',
    'Data corruption detected in {component}',
    'System out of memory, shutting down',
    'Unrecoverable error in core component',
    'Database connection lost permanently',
    'Critical security vulnerability detected',
    'System panic: {reason}',
  ],
};

/**
 * Service-specific operation names for realistic context
 */
const SERVICE_OPERATIONS: Record<string, string[]> = {
  'api-gateway': [
    'POST /api/users',
    'GET /api/users/{id}',
    'PUT /api/users/{id}',
    'DELETE /api/users/{id}',
    'POST /api/auth/login',
    'POST /api/auth/logout',
  ],
  'auth-service': [
    'validate-token',
    'refresh-token',
    'create-session',
    'revoke-session',
    'check-permissions',
  ],
  'user-service': [
    'create-user',
    'update-user',
    'delete-user',
    'get-user-profile',
    'list-users',
  ],
};

/**
 * Poisson random number generator
 * Uses Knuth's algorithm for Poisson distribution
 */
function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k = k + 1;
    p = p * Math.random();
  } while (p > L);

  return k - 1;
}

/**
 * Calculate log density multiplier based on time of day
 */
function calculateDensityMultiplier(timestamp: Date, peakHours?: [number, number][]): number {
  const hourUTC = timestamp.getUTCHours();
  const dayOfWeek = timestamp.getUTCDay();

  // Default peak hours: 9-12, 14-17 UTC (business hours)
  const defaultPeakHours = peakHours || [[9, 12], [14, 17]];
  
  const isBusinessHour = defaultPeakHours.some(
    ([start, end]) => hourUTC >= start && hourUTC < end
  );
  const isNightHour = hourUTC >= 0 && hourUTC < 7;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isBusinessHour) {
    return 1.5;  // 50% more logs during business hours
  } else if (isNightHour) {
    return 0.3;  // 70% fewer logs at night
  } else if (isWeekend) {
    return 0.6;  // 40% fewer logs on weekends
  }

  return 1.0;   // Normal frequency
}

/**
 * Select log level based on error rate
 */
function selectLogLevel(errorRate: number): LogLevel {
  const random = Math.random();

  if (random < errorRate * 0.7) {
    return 'ERROR';      // 70% of errors
  } else if (random < errorRate * 0.85) {
    return 'WARN';       // 15% of errors
  } else if (random < errorRate + 0.3) {
    return 'INFO';       // Main log type (30% of normal)
  } else if (random < errorRate + 0.5) {
    return 'DEBUG';      // Detailed debugging (20% of normal)
  } else {
    return 'FATAL';      // Rare critical failures (1% of normal)
  }
}

/**
 * Format log message by replacing placeholders
 */
function formatMessage(template: string, context: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return String(context[key] || match);
  });
}

/**
 * Generate context data for a log entry
 */
function generateLogContext(service: ServiceDefinition): Record<string, any> {
  const instance = service.instances[Math.floor(Math.random() * service.instances.length)];
  
  return {
    userId: Math.floor(Math.random() * 10000) + 1,
    requestId: generateUUID(),
    instanceId: instance,
    environment: service.environment,
    region: service.region,
  };
}

/**
 * Generate a single log entry
 */
function generateLogEntry(
  timestamp: Date,
  service: ServiceDefinition,
  level: LogLevel,
  traceId: string | null,
  context: Record<string, any>
): LogEntry {
  const templates = LOG_MESSAGE_TEMPLATES[level];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const messageContext = {
    method: SERVICE_OPERATIONS[service.name]?.[0] || 'unknown',
    key: `cache_key_${Math.floor(Math.random() * 1000)}`,
    count: Math.floor(Math.random() * 100),
    index: Math.floor(Math.random() * 100),
    total: 1000,
    id: generateUUID().substring(0, 8),
    source: `client_${Math.floor(Math.random() * 100)}`,
    userId: context.userId,
    jobId: generateUUID().substring(0, 8),
    service: service.name,
    attempt: Math.floor(Math.random() * 3) + 1,
    max: 3,
    op: 'operation',
    percent: Math.floor(Math.random() * 100),
    ms: Math.floor(Math.random() * 5000),
    error: 'Connection refused',
    code: Math.floor(Math.random() * 500) + 400,
    reason: 'Invalid input',
    path: '/data/file.txt',
    component: 'database',
    query: 'SELECT * FROM users',
    port: 8080,
    limit: 1000,
    current: 950,
    endpoint: '/api/v1/deprecated',
  };

  const message = formatMessage(template, messageContext);

  return {
    id: generateUUID(),
    timestamp,
    service: service.name,
    level,
    message,
    traceId,
    spanId: null,
    context,
    stacktrace: level === 'ERROR' || level === 'FATAL' 
      ? `Error: ${message}\n    at ${service.name}.handler\n    at processRequest`
      : null,
  };
}

/**
 * Main log generation function
 * Generates realistic log streams with time-based density variation
 */
export function generateLogs(config: LogGeneratorConfig): LogEntry[] {
  const {
    services,
    timeRange,
    baseFrequencyPerMinute = 10,
    peakHours,
    errorRateNormal = 0.005,
    errorRatePeak = 0.1,
    traceIdProbability = 0.2,
  } = config;

  const logs: LogEntry[] = [];
  let currentTime = new Date(timeRange.start);
  let isErrorCluster = false;
  let clusterEndTime = currentTime;

  while (currentTime < timeRange.end) {
    // Calculate density multiplier based on time of day
    const densityMultiplier = calculateDensityMultiplier(currentTime, peakHours);
    const effectiveFrequency = baseFrequencyPerMinute * densityMultiplier;

    // Poisson inter-arrival time (in seconds)
    const interArrivalSeconds = poissonRandom(effectiveFrequency) * 60;
    currentTime = new Date(currentTime.getTime() + interArrivalSeconds * 1000);

    if (currentTime >= timeRange.end) {
      break;
    }

    // Error clustering: 1% chance to start a cluster
    if (Math.random() < 0.01) {
      isErrorCluster = true;
      clusterEndTime = new Date(currentTime.getTime() + (Math.random() * 10 + 5) * 60 * 1000);
    }

    if (currentTime > clusterEndTime) {
      isErrorCluster = false;
    }

    // Determine error rate based on cluster state
    const errorRate = isErrorCluster ? errorRatePeak : errorRateNormal;

    // Select log level
    const level = selectLogLevel(errorRate);

    // Select random service
    const service = services[Math.floor(Math.random() * services.length)];

    // Generate context
    const context = generateLogContext(service);

    // Determine if this log has a traceId
    const traceId = Math.random() < traceIdProbability ? generateUUID() : null;

    // Create log entry
    const log = generateLogEntry(currentTime, service, level, traceId, context);

    logs.push(log);
  }

  // Sort by timestamp
  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Generate logs for all services in a time range
 */
export function generateServiceLogs(
  services: ServiceDefinition[],
  startTime: Date,
  endTime: Date,
  baseFrequencyPerMinute: number = 10
): LogEntry[] {
  return generateLogs({
    services,
    timeRange: { start: startTime, end: endTime },
    baseFrequencyPerMinute,
  });
}

/**
 * Generate a single log entry for real-time updates
 */
export function generateLogPoint(
  timestamp: Date,
  service: ServiceDefinition,
  errorRate: number = 0.005
): LogEntry {
  const level = selectLogLevel(errorRate);
  const context = generateLogContext(service);
  const traceId = Math.random() < 0.2 ? generateUUID() : null;

  return generateLogEntry(timestamp, service, level, traceId, context);
}

/**
 * Calculate log statistics from a log array
 */
export function calculateLogStatistics(logs: LogEntry[]): {
  totalCount: number;
  countByLevel: Record<LogLevel, number>;
  countTrend: Array<{ timestamp: Date; count: number }>;
  topErrors: Array<{ message: string; count: number }>;
} {
  const countByLevel: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    FATAL: 0,
  };

  const errorCounts: Record<string, number> = {};
  const trendMap: Record<string, number> = {};

  for (const log of logs) {
    countByLevel[log.level]++;

    if (log.level === 'ERROR' || log.level === 'FATAL') {
      errorCounts[log.message] = (errorCounts[log.message] || 0) + 1;
    }

    // Bucket by hour for trend
    const hourKey = new Date(log.timestamp);
    hourKey.setMinutes(0, 0, 0);
    const key = hourKey.toISOString();
    trendMap[key] = (trendMap[key] || 0) + 1;
  }

  // Convert trend map to array
  const countTrend = Object.entries(trendMap)
    .map(([timestamp, count]) => ({
      timestamp: new Date(timestamp),
      count,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Get top errors
  const topErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalCount: logs.length,
    countByLevel,
    countTrend,
    topErrors,
  };
}

/**
 * Filter logs by level
 */
export function filterLogsByLevel(logs: LogEntry[], levels: LogLevel[]): LogEntry[] {
  return logs.filter(log => levels.includes(log.level));
}

/**
 * Filter logs by service
 */
export function filterLogsByService(logs: LogEntry[], services: string[]): LogEntry[] {
  return logs.filter(log => services.includes(log.service));
}

/**
 * Search logs by keyword (supports regex)
 */
export function searchLogs(logs: LogEntry[], query: string): LogEntry[] {
  try {
    // Try to use as regex
    const regex = new RegExp(query, 'i');
    return logs.filter(log => regex.test(log.message));
  } catch {
    // Fall back to simple string matching
    const lowerQuery = query.toLowerCase();
    return logs.filter(log => log.message.toLowerCase().includes(lowerQuery));
  }
}

/**
 * Get logs with context (surrounding logs)
 */
export function getLogContext(
  logs: LogEntry[],
  logId: string,
  contextSize: number = 5
): LogEntry[] {
  const index = logs.findIndex(log => log.id === logId);
  if (index === -1) {
    return [];
  }

  const start = Math.max(0, index - contextSize);
  const end = Math.min(logs.length, index + contextSize + 1);

  return logs.slice(start, end);
}
