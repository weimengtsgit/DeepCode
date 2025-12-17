/**
 * Mock Traces Data Module
 * 
 * Provides comprehensive trace data management including:
 * - Trace generation with realistic service call chains
 * - Trace search with filtering and pagination
 * - Service topology extraction
 * - Trace-to-log correlation
 * - In-memory caching with automatic refresh
 */

import { faker } from '@faker-js/faker';
import type {
  Trace,
  TraceSearchQuery,
  TraceSearchResult,
  ServiceTopology,
  TraceSummary,
  TraceStatus,
  Span,
} from '@/types/tracing';
import type { Service, Pagination, SortConfig } from '@/types';
import {
  generateTrace,
  generateTraces,
  generateNormalTrace,
  generateSlowTrace,
  generateErrorTrace,
  generateComplexTrace,
  generateServiceTopology,
  findCriticalPath,
  findSlowSpans,
} from './generators/traceGenerator';

// ============================================================================
// Configuration & Constants
// ============================================================================

/**
 * Mock services configuration
 */
const SERVICES: Service[] = [
  {
    id: 'user-service',
    name: 'user-service',
    displayName: 'User Service',
    description: 'User authentication and profile management',
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy',
    tags: ['backend', 'api', 'user'],
    metadata: {
      version: '2.3.1',
      team: 'user-team',
      repository: 'https://github.com/company/user-service',
    },
  },
  {
    id: 'order-service',
    name: 'order-service',
    displayName: 'Order Service',
    description: 'Order processing and management',
    environment: 'production',
    region: 'us-west-2',
    status: 'healthy',
    tags: ['backend', 'api', 'order'],
    metadata: {
      version: '1.8.4',
      team: 'order-team',
      repository: 'https://github.com/company/order-service',
    },
  },
  {
    id: 'payment-service',
    name: 'payment-service',
    displayName: 'Payment Service',
    description: 'Payment processing and transaction management',
    environment: 'production',
    region: 'eu-west-1',
    status: 'degraded',
    tags: ['backend', 'api', 'payment', 'critical'],
    metadata: {
      version: '3.1.0',
      team: 'payment-team',
      repository: 'https://github.com/company/payment-service',
    },
  },
];

/**
 * Cache configuration
 */
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Trace generation distribution
 */
const TRACE_DISTRIBUTION = {
  normal: 0.7, // 70% normal traces
  slow: 0.15, // 15% slow traces
  error: 0.1, // 10% error traces
  complex: 0.05, // 5% complex traces
};

// ============================================================================
// Cache Management
// ============================================================================

interface TracesCache {
  traces: Trace[];
  timestamp: number;
}

let tracesCache: TracesCache | null = null;

/**
 * Clears the traces cache
 */
export function clearTracesCache(): void {
  tracesCache = null;
}

/**
 * Gets cached traces or generates new ones
 */
function getCachedTraces(): Trace[] {
  const now = Date.now();

  // Return cached data if valid
  if (tracesCache && now - tracesCache.timestamp < CACHE_DURATION) {
    return tracesCache.traces;
  }

  // Generate new traces
  const traces = generateMockTraces();

  // Update cache
  tracesCache = {
    traces,
    timestamp: now,
  };

  return traces;
}

/**
 * Generates a comprehensive set of mock traces
 */
function generateMockTraces(): Trace[] {
  const traces: Trace[] = [];
  const totalTraces = 200; // Generate 200 traces
  const endTime = Date.now();
  const startTime = endTime - 24 * 60 * 60 * 1000; // Last 24 hours

  for (let i = 0; i < totalTraces; i++) {
    const timestamp = startTime + Math.random() * (endTime - startTime);
    const random = Math.random();

    let trace: Trace;

    if (random < TRACE_DISTRIBUTION.normal) {
      // Normal trace
      trace = generateNormalTrace();
    } else if (random < TRACE_DISTRIBUTION.normal + TRACE_DISTRIBUTION.slow) {
      // Slow trace
      trace = generateSlowTrace();
    } else if (
      random <
      TRACE_DISTRIBUTION.normal + TRACE_DISTRIBUTION.slow + TRACE_DISTRIBUTION.error
    ) {
      // Error trace
      trace = generateErrorTrace();
    } else {
      // Complex trace
      trace = generateComplexTrace();
    }

    // Adjust timestamps to be within the time range
    const timeDiff = timestamp - trace.startTime;
    trace.startTime = timestamp;
    trace.endTime = timestamp + trace.duration;
    trace.spans = trace.spans.map((span) => ({
      ...span,
      startTime: span.startTime + timeDiff,
      endTime: span.endTime + timeDiff,
    }));

    traces.push(trace);
  }

  // Sort by start time (newest first)
  traces.sort((a, b) => b.startTime - a.startTime);

  return traces;
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Searches traces based on query criteria
 */
export function searchTraces(query: TraceSearchQuery): TraceSearchResult {
  const startTime = performance.now();
  const allTraces = getCachedTraces();

  // Apply filters
  let filteredTraces = allTraces.filter((trace) => {
    // Time range filter
    if (query.startTime && trace.startTime < query.startTime) return false;
    if (query.endTime && trace.startTime > query.endTime) return false;

    // Service filter
    if (query.service && !trace.services.includes(query.service)) return false;

    // Operation filter
    if (query.operation) {
      const hasOperation = trace.spans.some((span) =>
        span.operationName.toLowerCase().includes(query.operation!.toLowerCase())
      );
      if (!hasOperation) return false;
    }

    // Status filter
    if (query.status && trace.status !== query.status) return false;

    // Duration filter
    if (query.minDuration && trace.duration < query.minDuration) return false;
    if (query.maxDuration && trace.duration > query.maxDuration) return false;

    // Tags filter
    if (query.tags && Object.keys(query.tags).length > 0) {
      const rootSpan = trace.spans.find((span) => !span.parentSpanId);
      if (!rootSpan) return false;

      for (const [key, value] of Object.entries(query.tags)) {
        const attrValue = rootSpan.attributes[key];
        if (attrValue !== value) return false;
      }
    }

    // Error filter
    if (query.hasError !== undefined) {
      const hasError = trace.errorCount > 0;
      if (query.hasError !== hasError) return false;
    }

    return true;
  });

  // Apply sorting
  if (query.sortBy) {
    const { field, order } = query.sortBy;
    filteredTraces.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'startTime':
          aValue = a.startTime;
          bValue = b.startTime;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'spanCount':
          aValue = a.spanCount;
          bValue = b.spanCount;
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  } else {
    // Default: sort by start time descending
    filteredTraces.sort((a, b) => b.startTime - a.startTime);
  }

  // Apply pagination
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTraces = filteredTraces.slice(startIndex, endIndex);

  const executionTime = performance.now() - startTime;

  return {
    traces: paginatedTraces,
    total: filteredTraces.length,
    page,
    pageSize,
    executionTime,
  };
}

/**
 * Gets a trace by ID
 */
export function getTraceById(traceId: string): Trace | null {
  const allTraces = getCachedTraces();
  return allTraces.find((trace) => trace.traceId === traceId) || null;
}

/**
 * Gets traces for a specific service
 */
export function getTracesByService(
  serviceId: string,
  startTime: number,
  endTime: number,
  limit: number = 50
): Trace[] {
  const allTraces = getCachedTraces();

  const filteredTraces = allTraces
    .filter((trace) => {
      if (trace.startTime < startTime || trace.startTime > endTime) return false;
      return trace.services.includes(serviceId);
    })
    .slice(0, limit);

  return filteredTraces;
}

/**
 * Gets service topology from traces
 */
export function getServiceTopology(
  startTime: number,
  endTime: number,
  services?: string[]
): ServiceTopology {
  const allTraces = getCachedTraces();

  // Filter traces by time range
  const filteredTraces = allTraces.filter(
    (trace) => trace.startTime >= startTime && trace.startTime <= endTime
  );

  // Filter by services if specified
  const tracesToAnalyze = services
    ? filteredTraces.filter((trace) =>
        trace.services.some((service) => services.includes(service))
      )
    : filteredTraces;

  return generateServiceTopology(tracesToAnalyze);
}

/**
 * Gets trace summaries for list view
 */
export function getTraceSummaries(
  startTime: number,
  endTime: number,
  limit: number = 100
): TraceSummary[] {
  const allTraces = getCachedTraces();

  const filteredTraces = allTraces
    .filter((trace) => trace.startTime >= startTime && trace.startTime <= endTime)
    .slice(0, limit);

  return filteredTraces.map((trace) => {
    const rootSpan = trace.spans.find((span) => !span.parentSpanId);

    return {
      traceId: trace.traceId,
      startTime: trace.startTime,
      duration: trace.duration,
      services: trace.services,
      spanCount: trace.spanCount,
      errorCount: trace.errorCount,
      status: trace.status,
      rootService: rootSpan?.serviceName || trace.services[0],
      rootOperation: rootSpan?.operationName || 'unknown',
    };
  });
}

/**
 * Gets critical path for a trace
 */
export function getTraceCriticalPath(traceId: string) {
  const trace = getTraceById(traceId);
  if (!trace) return null;

  return findCriticalPath(trace);
}

/**
 * Gets slow spans for a trace
 */
export function getTraceSlowSpans(traceId: string, threshold?: number) {
  const trace = getTraceById(traceId);
  if (!trace) return null;

  return findSlowSpans(trace, threshold);
}

/**
 * Gets trace statistics
 */
export function getTraceStatistics(startTime: number, endTime: number) {
  const allTraces = getCachedTraces();

  const filteredTraces = allTraces.filter(
    (trace) => trace.startTime >= startTime && trace.startTime <= endTime
  );

  const totalTraces = filteredTraces.length;
  const errorTraces = filteredTraces.filter((trace) => trace.errorCount > 0).length;
  const slowTraces = filteredTraces.filter((trace) => trace.duration > 1000).length;

  const durations = filteredTraces.map((trace) => trace.duration);
  durations.sort((a, b) => a - b);

  const avgDuration =
    durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p90 = durations[Math.floor(durations.length * 0.9)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

  // Service breakdown
  const serviceStats: Record<string, { count: number; errorCount: number }> = {};
  filteredTraces.forEach((trace) => {
    trace.services.forEach((service) => {
      if (!serviceStats[service]) {
        serviceStats[service] = { count: 0, errorCount: 0 };
      }
      serviceStats[service].count++;
      if (trace.errorCount > 0) {
        serviceStats[service].errorCount++;
      }
    });
  });

  // Status breakdown
  const statusStats: Record<TraceStatus, number> = {
    success: 0,
    error: 0,
    timeout: 0,
    cancelled: 0,
    unknown: 0,
  };
  filteredTraces.forEach((trace) => {
    statusStats[trace.status]++;
  });

  return {
    total: totalTraces,
    errorCount: errorTraces,
    slowCount: slowTraces,
    errorRate: totalTraces > 0 ? (errorTraces / totalTraces) * 100 : 0,
    avgDuration,
    p50,
    p90,
    p99,
    byService: serviceStats,
    byStatus: statusStats,
  };
}

/**
 * Gets all available services
 */
export function getServices(): Service[] {
  return SERVICES;
}

/**
 * Refreshes the traces cache
 */
export function refreshTracesCache(): Trace[] {
  clearTracesCache();
  return getCachedTraces();
}

// ============================================================================
// Initialize cache on module load
// ============================================================================

// Pre-generate traces for faster initial load
getCachedTraces();
