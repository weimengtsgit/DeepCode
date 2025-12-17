/**
 * Mock Logs Data
 * 
 * Provides mock log data for the observability platform using the log generator.
 * Generates realistic log entries with various patterns, levels, and contexts.
 */

import { faker } from '@faker-js/faker';
import type { LogEntry, LogSearchQuery, LogSearchResult, LogStatistics, LogContextResult } from '@/types/logs';
import { generateLogs, generatePatternLogs, generateLogTimeSeries, detectLogPatterns, detectLogAnomalies } from './generators/logGenerator';

// Service configurations for log generation
const SERVICES = [
  {
    name: 'user-service',
    environment: 'production' as const,
    region: 'us-east-1' as const,
    logsPerSecond: 80,
    errorRate: 0.02
  },
  {
    name: 'order-service',
    environment: 'production' as const,
    region: 'us-east-1' as const,
    logsPerSecond: 50,
    errorRate: 0.05
  },
  {
    name: 'payment-service',
    environment: 'production' as const,
    region: 'us-west-2' as const,
    logsPerSecond: 30,
    errorRate: 0.08
  }
];

// In-memory log storage
let logCache: LogEntry[] = [];
let lastGenerationTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate initial log dataset
 */
function generateInitialLogs(startTime: number, endTime: number): LogEntry[] {
  const allLogs: LogEntry[] = [];

  // Generate logs for each service
  SERVICES.forEach(service => {
    const serviceLogs = generateLogs({
      startTime,
      endTime,
      service: service.name,
      environment: service.environment,
      region: service.region,
      logsPerSecond: service.logsPerSecond,
      errorRate: service.errorRate,
      includeTraceContext: true,
      includeHttpContext: Math.random() > 0.5,
      includeUserContext: Math.random() > 0.7
    });
    allLogs.push(...serviceLogs);
  });

  // Add some pattern-based logs for testing
  const now = Date.now();
  
  // Add error burst for payment service (simulating payment gateway issues)
  const errorBurstLogs = generatePatternLogs('error-burst', {
    startTime: now - 30 * 60 * 1000, // 30 minutes ago
    endTime: now - 25 * 60 * 1000, // 25 minutes ago
    service: 'payment-service',
    environment: 'production',
    region: 'us-west-2',
    logsPerSecond: 100,
    errorRate: 0.6
  });
  allLogs.push(...errorBurstLogs);

  // Add spike for user service (simulating traffic surge)
  const spikeLogs = generatePatternLogs('spike', {
    startTime: now - 15 * 60 * 1000, // 15 minutes ago
    endTime: now - 10 * 60 * 1000, // 10 minutes ago
    service: 'user-service',
    environment: 'production',
    region: 'us-east-1',
    logsPerSecond: 200,
    errorRate: 0.03
  });
  allLogs.push(...spikeLogs);

  // Sort by timestamp
  allLogs.sort((a, b) => a.timestamp - b.timestamp);

  return allLogs;
}

/**
 * Get or generate log cache
 */
function getLogCache(timeRange?: { start: number; end: number }): LogEntry[] {
  const now = Date.now();
  
  // Regenerate cache if expired or time range specified
  if (!timeRange && logCache.length > 0 && now - lastGenerationTime < CACHE_DURATION) {
    return logCache;
  }

  const startTime = timeRange?.start || now - 60 * 60 * 1000; // Default: last hour
  const endTime = timeRange?.end || now;

  logCache = generateInitialLogs(startTime, endTime);
  lastGenerationTime = now;

  return logCache;
}

/**
 * Search logs with filters
 */
export function searchLogs(query: LogSearchQuery): LogSearchResult {
  const startTime = performance.now();
  
  let logs = getLogCache({ start: query.startTime, end: query.endTime });

  // Apply filters
  if (query.levels && query.levels.length > 0) {
    logs = logs.filter(log => query.levels!.includes(log.level));
  }

  if (query.services && query.services.length > 0) {
    logs = logs.filter(log => query.services!.includes(log.service));
  }

  if (query.environments && query.environments.length > 0) {
    logs = logs.filter(log => query.environments!.includes(log.environment));
  }

  if (query.regions && query.regions.length > 0) {
    logs = logs.filter(log => query.regions!.includes(log.region));
  }

  if (query.traceId) {
    logs = logs.filter(log => log.traceId === query.traceId);
  }

  if (query.spanId) {
    logs = logs.filter(log => log.spanId === query.spanId);
  }

  // Apply search query
  if (query.searchQuery) {
    const searchLower = query.caseSensitive ? query.searchQuery : query.searchQuery.toLowerCase();
    const regex = query.useRegex ? new RegExp(query.searchQuery, query.caseSensitive ? '' : 'i') : null;

    logs = logs.filter(log => {
      const message = query.caseSensitive ? log.message : log.message.toLowerCase();
      
      if (regex) {
        return regex.test(log.message);
      }
      
      return message.includes(searchLower);
    });
  }

  // Apply field filters
  if (query.fieldFilters && query.fieldFilters.length > 0) {
    logs = logs.filter(log => {
      return query.fieldFilters!.every(filter => {
        const value = (log as any)[filter.field];
        
        if (value === undefined) {
          return filter.operator === 'exists' ? false : true;
        }

        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).includes(String(filter.value));
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          case 'exists':
            return true;
          default:
            return true;
        }
      });
    });
  }

  // Calculate statistics
  const statistics = calculateLogStatistics(logs);

  // Apply pagination
  const page = query.page || 1;
  const pageSize = query.pageSize || 100;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  const executionTime = performance.now() - startTime;

  return {
    logs: paginatedLogs,
    total: logs.length,
    page,
    pageSize,
    statistics,
    executionTime
  };
}

/**
 * Calculate log statistics
 */
function calculateLogStatistics(logs: LogEntry[]): LogStatistics {
  const levelCounts: Record<string, number> = {};
  const serviceCounts: Record<string, number> = {};
  let errorCount = 0;
  let warningCount = 0;

  logs.forEach(log => {
    // Count by level
    levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
    
    // Count by service
    serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1;
    
    // Count errors and warnings
    if (log.level === 'ERROR' || log.level === 'FATAL') {
      errorCount++;
    }
    if (log.level === 'WARN') {
      warningCount++;
    }
  });

  const totalLogs = logs.length;
  const errorRate = totalLogs > 0 ? errorCount / totalLogs : 0;
  const warningRate = totalLogs > 0 ? warningCount / totalLogs : 0;

  // Generate time series data
  const interval = 60000; // 1 minute
  const timeSeries = generateLogTimeSeries(logs, interval);

  return {
    totalLogs,
    levelCounts,
    serviceCounts,
    errorCount,
    warningCount,
    errorRate,
    warningRate,
    timeSeries
  };
}

/**
 * Get log context (surrounding logs)
 */
export function getLogContext(logId: string, before: number = 10, after: number = 10): LogContextResult | null {
  const logs = getLogCache();
  const targetIndex = logs.findIndex(log => log.id === logId);

  if (targetIndex === -1) {
    return null;
  }

  const targetLog = logs[targetIndex];
  const beforeLogs = logs.slice(Math.max(0, targetIndex - before), targetIndex);
  const afterLogs = logs.slice(targetIndex + 1, targetIndex + 1 + after);

  return {
    targetLog,
    beforeLogs,
    afterLogs,
    totalBefore: Math.max(0, targetIndex),
    totalAfter: logs.length - targetIndex - 1
  };
}

/**
 * Get log by ID
 */
export function getLogById(logId: string): LogEntry | null {
  const logs = getLogCache();
  return logs.find(log => log.id === logId) || null;
}

/**
 * Get logs by trace ID
 */
export function getLogsByTraceId(traceId: string): LogEntry[] {
  const logs = getLogCache();
  return logs.filter(log => log.traceId === traceId);
}

/**
 * Get recent logs (for real-time streaming)
 */
export function getRecentLogs(limit: number = 100, since?: number): LogEntry[] {
  const logs = getLogCache();
  const sinceTime = since || Date.now() - 5 * 60 * 1000; // Last 5 minutes
  
  const recentLogs = logs.filter(log => log.timestamp >= sinceTime);
  
  // Return most recent logs up to limit
  return recentLogs.slice(-limit);
}

/**
 * Stream logs (simulates real-time log generation)
 */
export function* streamLogs(config: {
  services?: string[];
  levels?: string[];
  interval?: number;
}): Generator<LogEntry, void, unknown> {
  const services = config.services || SERVICES.map(s => s.name);
  const interval = config.interval || 1000; // 1 second

  while (true) {
    const service = services[Math.floor(Math.random() * services.length)];
    const serviceConfig = SERVICES.find(s => s.name === service);

    if (serviceConfig) {
      const logs = generateLogs({
        startTime: Date.now() - interval,
        endTime: Date.now(),
        service: serviceConfig.name,
        environment: serviceConfig.environment,
        region: serviceConfig.region,
        logsPerSecond: serviceConfig.logsPerSecond,
        errorRate: serviceConfig.errorRate,
        includeTraceContext: true
      });

      for (const log of logs) {
        if (!config.levels || config.levels.includes(log.level)) {
          yield log;
        }
      }
    }

    // Wait for next interval (in real implementation, this would be async)
    break;
  }
}

/**
 * Detect log patterns
 */
export function getLogPatterns(startTime: number, endTime: number, minOccurrences: number = 5) {
  const logs = getLogCache({ start: startTime, end: endTime });
  const patterns = detectLogPatterns(logs);
  
  // Filter by minimum occurrences
  return patterns.filter(pattern => pattern.occurrences >= minOccurrences);
}

/**
 * Detect log anomalies
 */
export function getLogAnomalies(startTime: number, endTime: number, threshold: number = 2) {
  const logs = getLogCache({ start: startTime, end: endTime });
  const timeSeries = generateLogTimeSeries(logs, 60000); // 1 minute intervals
  
  return detectLogAnomalies(timeSeries, threshold);
}

/**
 * Export logs
 */
export function exportLogs(query: LogSearchQuery, format: 'json' | 'csv' | 'ndjson' = 'json'): string {
  const result = searchLogs(query);
  const logs = result.logs;

  switch (format) {
    case 'json':
      return JSON.stringify(logs, null, 2);
    
    case 'csv':
      if (logs.length === 0) return '';
      
      const headers = ['timestamp', 'level', 'service', 'message', 'traceId', 'spanId'];
      const rows = logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.level,
        log.service,
        `"${log.message.replace(/"/g, '""')}"`,
        log.traceId || '',
        log.spanId || ''
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    case 'ndjson':
      return logs.map(log => JSON.stringify(log)).join('\n');
    
    default:
      return JSON.stringify(logs);
  }
}

/**
 * Clear log cache (for testing)
 */
export function clearLogCache(): void {
  logCache = [];
  lastGenerationTime = 0;
}

/**
 * Get log statistics for dashboard
 */
export function getLogStatistics(startTime: number, endTime: number): LogStatistics {
  const logs = getLogCache({ start: startTime, end: endTime });
  return calculateLogStatistics(logs);
}

// Pre-generate initial cache on module load
getLogCache();
