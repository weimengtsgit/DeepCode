/**
 * Distributed Trace Generator
 * 
 * Generates realistic distributed tracing data with:
 * - Random call chains (3-10 spans per trace)
 * - Parent-child span relationships
 * - Service-to-service calls
 * - Error injection (5% rate)
 * - Realistic span latencies (exponential distribution)
 * - Error clustering and anomalies
 * 
 * Algorithm: Random tree generation with exponential latency distribution
 */

import { v4 as uuidv4 } from 'uuid';
import type { Trace, Span, SpanLog, ServiceDefinition } from '@/types';
import { generateUUID, exponentialRandom, gaussian } from './utils';

/**
 * Configuration for trace generation
 */
export interface TraceGeneratorConfig {
  services: ServiceDefinition[];
  minDepth: number;           // Minimum span levels (typical: 3)
  maxDepth: number;           // Maximum span levels (typical: 10)
  errorRate: number;          // Probability of error (typical: 0.05)
  durationMinMs: number;      // Minimum span duration (typical: 10)
  durationMaxMs: number;      // Maximum span duration (typical: 500)
  branchProbability: number;  // Depth continuation probability (typical: 0.7)
  timeRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Default configuration for trace generation
 */
const DEFAULT_CONFIG: Partial<TraceGeneratorConfig> = {
  minDepth: 3,
  maxDepth: 10,
  errorRate: 0.05,
  durationMinMs: 10,
  durationMaxMs: 500,
  branchProbability: 0.7,
};

/**
 * Common operations by service type
 */
const SERVICE_OPERATIONS: Record<string, string[]> = {
  'api-gateway': ['POST /api/users', 'GET /api/users/:id', 'PUT /api/users/:id', 'DELETE /api/users/:id'],
  'auth-service': ['validate-token', 'refresh-token', 'authenticate', 'authorize'],
  'user-service': ['create-user', 'get-user', 'update-user', 'delete-user', 'list-users'],
  'database': ['INSERT users', 'SELECT users', 'UPDATE users', 'DELETE users', 'SELECT orders'],
  'cache-service': ['SET user:*', 'GET user:*', 'DEL user:*', 'INCR counter'],
  'payment-service': ['process-payment', 'refund', 'validate-card', 'check-balance'],
  'notification-service': ['send-email', 'send-sms', 'send-push', 'queue-notification'],
  'analytics-service': ['track-event', 'aggregate-metrics', 'generate-report'],
  'search-service': ['index-document', 'search', 'delete-index'],
  'storage-service': ['upload-file', 'download-file', 'delete-file', 'list-files'],
};

/**
 * Generate a single distributed trace with realistic call chains
 * 
 * Algorithm:
 * 1. Create root span (entry point)
 * 2. Recursively build call chain (3-10 levels deep)
 * 3. Each span calls 1-3 downstream services
 * 4. Inject errors (5% rate) and error clustering
 * 5. Calculate total duration from span durations
 * 
 * @param config - Trace generation configuration
 * @returns Complete Trace object with all spans
 */
export function generateTrace(config: TraceGeneratorConfig): Trace {
  const finalConfig = { ...DEFAULT_CONFIG, ...config } as TraceGeneratorConfig;
  
  const traceId = generateUUID();
  const startTime = new Date();
  
  // Select root service (entry point)
  const rootService = finalConfig.services[Math.floor(Math.random() * finalConfig.services.length)];
  const rootOperation = selectRandomOperation(rootService.name);
  
  // Create root span
  const rootSpan: Span = {
    spanId: generateUUID(),
    traceId,
    parentSpanId: null,
    service: rootService.name,
    operation: rootOperation,
    startTime,
    endTime: new Date(startTime.getTime() + exponentialRandom(10, 50)),
    durationMs: exponentialRandom(10, 50),
    status: 'SUCCESS',
    tags: generateSpanTags(rootService),
    logs: [],
  };
  
  const spans: Span[] = [rootSpan];
  
  // Build call chain recursively
  buildCallChain(
    spans,
    rootSpan,
    finalConfig,
    startTime,
    finalConfig.maxDepth
  );
  
  // Calculate total duration
  const allEndTimes = spans.map(s => s.endTime.getTime());
  const maxEndTime = Math.max(...allEndTimes);
  const totalDurationMs = maxEndTime - startTime.getTime();
  
  // Determine trace status (error if any span failed)
  const hasError = spans.some(s => s.status === 'ERROR');
  const traceStatus = hasError ? 'ERROR' : 'SUCCESS';
  
  return {
    traceId,
    rootSpanId: rootSpan.spanId,
    rootService: rootService.name,
    startTime,
    endTime: new Date(maxEndTime),
    totalDurationMs,
    spanCount: spans.length,
    status: traceStatus,
    spans,
  };
}

/**
 * Recursively build call chain for a trace
 * 
 * @param spans - Array to accumulate spans
 * @param parentSpan - Parent span to build children for
 * @param config - Generation configuration
 * @param traceStartTime - Trace start time (for calculating absolute times)
 * @param depth - Current recursion depth
 */
function buildCallChain(
  spans: Span[],
  parentSpan: Span,
  config: TraceGeneratorConfig,
  traceStartTime: Date,
  depth: number
): void {
  if (depth === 0) {
    return; // Stop recursion
  }
  
  // Determine number of child spans (1-3)
  const branchCount = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < branchCount; i++) {
    // Select downstream service (avoid self-calls)
    const childService = selectRandomService(
      config.services,
      parentSpan.service
    );
    
    // Determine if this span has an error
    const hasError = Math.random() < config.errorRate;
    
    // Calculate span timing (child starts after parent starts, ends before parent ends)
    const childStartOffset = Math.random() * (parentSpan.durationMs * 0.5);
    const childDuration = exponentialRandom(
      config.durationMinMs,
      config.durationMaxMs
    );
    
    const childStartTime = new Date(
      parentSpan.startTime.getTime() + childStartOffset
    );
    const childEndTime = new Date(childStartTime.getTime() + childDuration);
    
    // Create child span
    const childSpan: Span = {
      spanId: generateUUID(),
      traceId: parentSpan.traceId,
      parentSpanId: parentSpan.spanId,
      service: childService.name,
      operation: selectRandomOperation(childService.name),
      startTime: childStartTime,
      endTime: childEndTime,
      durationMs: childDuration,
      status: hasError ? 'ERROR' : 'SUCCESS',
      tags: generateSpanTags(childService),
      logs: generateSpanLogs(childService.name, hasError, childStartTime, childDuration),
    };
    
    spans.push(childSpan);
    
    // Continue recursively (70% chance of deeper calls)
    if (Math.random() < config.branchProbability) {
      buildCallChain(spans, childSpan, config, traceStartTime, depth - 1);
    }
  }
}

/**
 * Select a random service from the pool, optionally excluding one
 */
function selectRandomService(
  services: ServiceDefinition[],
  excludeService?: string
): ServiceDefinition {
  let available = services;
  
  if (excludeService) {
    available = services.filter(s => s.name !== excludeService);
  }
  
  if (available.length === 0) {
    available = services;
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Select a random operation for a service
 */
function selectRandomOperation(serviceName: string): string {
  const operations = SERVICE_OPERATIONS[serviceName] || ['operation'];
  return operations[Math.floor(Math.random() * operations.length)];
}

/**
 * Generate tags (metadata) for a span
 */
function generateSpanTags(service: ServiceDefinition): Record<string, any> {
  const instance = service.instances[
    Math.floor(Math.random() * service.instances.length)
  ];
  
  return {
    'service.name': service.name,
    'service.version': '1.0.0',
    'span.kind': 'INTERNAL',
    'host.name': instance,
    'http.method': ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
    'http.status_code': Math.random() < 0.95 ? 200 : 500,
    'db.system': service.name === 'database' ? 'postgresql' : undefined,
    'db.operation': service.name === 'database' ? 'query' : undefined,
    'cache.hit': service.name === 'cache-service' ? Math.random() > 0.3 : undefined,
    'user.id': Math.floor(Math.random() * 10000),
    'request.id': generateUUID(),
  };
}

/**
 * Generate logs associated with a span
 */
function generateSpanLogs(
  serviceName: string,
  hasError: boolean,
  startTime: Date,
  durationMs: number
): SpanLog[] {
  const logs: SpanLog[] = [];
  
  if (hasError) {
    // Error logs
    const errorMessages = [
      'Connection timeout',
      'Database query failed',
      'Authentication failed',
      'Payment processing error',
      'Service unavailable',
      'Invalid request parameters',
      'Resource not found',
      'Permission denied',
    ];
    
    logs.push({
      timestamp: new Date(startTime.getTime() + durationMs * 0.8),
      message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
      fields: {
        'error.kind': 'Exception',
        'error.message': 'Operation failed',
        'error.stack': 'at ' + serviceName + '.execute()',
      },
    });
  } else {
    // Success logs
    const successMessages = [
      'Operation completed successfully',
      'Data retrieved from cache',
      'Request processed',
      'Database query executed',
      'Authentication successful',
    ];
    
    logs.push({
      timestamp: new Date(startTime.getTime() + durationMs * 0.5),
      message: successMessages[Math.floor(Math.random() * successMessages.length)],
      fields: {
        'duration_ms': durationMs,
        'status': 'success',
      },
    });
  }
  
  return logs;
}

/**
 * Generate multiple traces for a time range
 * 
 * @param config - Trace generation configuration
 * @param count - Number of traces to generate
 * @returns Array of Trace objects
 */
export function generateTraces(
  config: TraceGeneratorConfig,
  count: number = 100
): Trace[] {
  const traces: Trace[] = [];
  
  for (let i = 0; i < count; i++) {
    traces.push(generateTrace(config));
  }
  
  return traces;
}

/**
 * Detect slow spans in a trace (> mean + 2*stdDev)
 * 
 * @param spans - Array of spans
 * @param threshold - Optional custom threshold in ms
 * @returns Array of slow spans sorted by duration
 */
export function detectSlowSpans(spans: Span[], threshold?: number): Span[] {
  if (spans.length === 0) {
    return [];
  }
  
  const durations = spans.map(s => s.durationMs);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  // Calculate standard deviation
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  // Determine threshold
  const slowThreshold = threshold || (mean + 2 * stdDev);
  
  return spans
    .filter(s => s.durationMs > slowThreshold)
    .sort((a, b) => b.durationMs - a.durationMs);
}

/**
 * Calculate trace statistics
 * 
 * @param traces - Array of traces
 * @returns Statistics object
 */
export function calculateTraceStats(traces: Trace[]): {
  totalTraces: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  avgSpanCount: number;
} {
  if (traces.length === 0) {
    return {
      totalTraces: 0,
      successCount: 0,
      errorCount: 0,
      avgDurationMs: 0,
      minDurationMs: 0,
      maxDurationMs: 0,
      avgSpanCount: 0,
    };
  }
  
  const durations = traces.map(t => t.totalDurationMs);
  const spanCounts = traces.map(t => t.spanCount);
  
  return {
    totalTraces: traces.length,
    successCount: traces.filter(t => t.status === 'SUCCESS').length,
    errorCount: traces.filter(t => t.status === 'ERROR').length,
    avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDurationMs: Math.min(...durations),
    maxDurationMs: Math.max(...durations),
    avgSpanCount: spanCounts.reduce((a, b) => a + b, 0) / spanCounts.length,
  };
}

/**
 * Build service dependency graph from traces
 * 
 * @param traces - Array of traces
 * @returns Object with nodes and edges for topology visualization
 */
export function buildServiceDependencyGraph(traces: Trace[]): {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ source: string; target: string; weight: number }>;
} {
  const nodeSet = new Set<string>();
  const edgeMap = new Map<string, number>();
  
  // Extract services and call relationships
  for (const trace of traces) {
    for (const span of trace.spans) {
      nodeSet.add(span.service);
      
      // Find parent span to determine call relationship
      if (span.parentSpanId) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId);
        if (parentSpan) {
          const edgeKey = `${parentSpan.service}->${span.service}`;
          edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
        }
      }
    }
  }
  
  // Convert to nodes and edges
  const nodes = Array.from(nodeSet).map(service => ({
    id: service,
    label: service,
  }));
  
  const edges = Array.from(edgeMap.entries()).map(([edgeKey, weight]) => {
    const [source, target] = edgeKey.split('->');
    return { source, target, weight };
  });
  
  return { nodes, edges };
}
