/**
 * Trace Generator
 * 
 * Generates realistic distributed tracing data including:
 * - Multi-level service call chains (3-10 layers)
 * - Realistic timing distributions
 * - Various trace scenarios (normal, slow query, timeout, error)
 * - HTTP, database, message queue, and cache operations
 */

import type {
  Trace,
  Span,
  SpanKind,
  SpanStatus,
  TraceStatus,
  SpanAttributes,
  SpanEvent,
  HttpMethod,
  DbOperation,
  MqOperation,
  FlameGraphNode,
  GanttChartItem,
  ServiceNode,
  ServiceEdge,
  ServiceTopology,
  CriticalPath,
  SlowSpan,
} from '@/types/tracing';
import type { MetricLabels } from '@/types/metrics';

// ============================================================================
// Configuration & Constants
// ============================================================================

interface TraceGeneratorConfig {
  /** Trace ID (auto-generated if not provided) */
  traceId?: string;
  /** Root service name */
  rootService: string;
  /** Root operation name */
  rootOperation: string;
  /** Minimum span depth (default: 3) */
  minDepth?: number;
  /** Maximum span depth (default: 10) */
  maxDepth?: number;
  /** Minimum children per span (default: 0) */
  minChildren?: number;
  /** Maximum children per span (default: 4) */
  maxChildren?: number;
  /** Base duration in milliseconds (default: 500) */
  baseDuration?: number;
  /** Error probability (0-1, default: 0.1) */
  errorProbability?: number;
  /** Slow span probability (0-1, default: 0.15) */
  slowProbability?: number;
  /** Trace start timestamp (default: now) */
  startTime?: number;
  /** Environment */
  environment?: string;
  /** Region */
  region?: string;
}

interface SpanGeneratorConfig {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  kind: SpanKind;
  startTime: number;
  duration: number;
  depth: number;
  maxDepth: number;
  errorProbability: number;
  slowProbability: number;
  environment: string;
  region: string;
}

// Service types and their typical operations
const SERVICE_OPERATIONS: Record<string, { type: string; operations: string[] }> = {
  'user-service': {
    type: 'api',
    operations: ['GET /users/:id', 'POST /users', 'PUT /users/:id', 'GET /users/search', 'DELETE /users/:id'],
  },
  'order-service': {
    type: 'api',
    operations: ['POST /orders', 'GET /orders/:id', 'PUT /orders/:id/status', 'GET /orders/user/:userId'],
  },
  'payment-service': {
    type: 'api',
    operations: ['POST /payments', 'GET /payments/:id', 'POST /payments/refund', 'GET /payments/verify'],
  },
  'inventory-service': {
    type: 'api',
    operations: ['GET /inventory/:productId', 'PUT /inventory/reserve', 'PUT /inventory/release'],
  },
  'notification-service': {
    type: 'api',
    operations: ['POST /notifications/email', 'POST /notifications/sms', 'POST /notifications/push'],
  },
  'auth-service': {
    type: 'api',
    operations: ['POST /auth/login', 'POST /auth/verify', 'POST /auth/refresh', 'POST /auth/logout'],
  },
};

const DATABASE_OPERATIONS: DbOperation[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const MQ_OPERATIONS: MqOperation[] = ['send', 'receive', 'publish', 'subscribe'];

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(prefix: string = ''): string {
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}-${timestamp}${random}` : `${timestamp}${random}`;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldOccur(probability: number): boolean {
  return Math.random() < probability;
}

// ============================================================================
// Span Generation
// ============================================================================

function generateSpanAttributes(
  service: string,
  operation: string,
  kind: SpanKind,
  isError: boolean
): SpanAttributes {
  const attrs: SpanAttributes = {
    'service.name': service,
    'service.version': `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 20)}`,
  };

  // HTTP attributes
  if (kind === 'server' || kind === 'client') {
    const method = operation.split(' ')[0] as HttpMethod || randomChoice(HTTP_METHODS);
    const path = operation.split(' ')[1] || '/api/endpoint';
    
    attrs['http.method'] = method;
    attrs['http.url'] = `https://${service}.example.com${path}`;
    attrs['http.target'] = path;
    attrs['http.status_code'] = isError ? randomChoice([500, 503, 504]) : randomChoice([200, 201, 204]);
    attrs['http.user_agent'] = 'observability-platform/1.0';
  }

  // Database attributes
  if (operation.includes('db.') || operation.includes('SELECT') || operation.includes('INSERT')) {
    attrs['db.system'] = randomChoice(['postgresql', 'mysql', 'mongodb', 'redis']);
    attrs['db.operation'] = randomChoice(DATABASE_OPERATIONS);
    attrs['db.statement'] = `${attrs['db.operation']} * FROM ${service.replace('-service', '')}_table`;
    attrs['db.name'] = `${service.replace('-service', '')}_db`;
    
    if (attrs['db.system'] === 'redis') {
      attrs['db.redis.database_index'] = randomInt(0, 15);
    }
  }

  // Message queue attributes
  if (operation.includes('mq.') || operation.includes('queue')) {
    attrs['messaging.system'] = randomChoice(['rabbitmq', 'kafka', 'sqs']);
    attrs['messaging.operation'] = randomChoice(MQ_OPERATIONS);
    attrs['messaging.destination'] = `${service}.events`;
    
    if (attrs['messaging.system'] === 'kafka') {
      attrs['messaging.kafka.partition'] = randomInt(0, 5);
    }
  }

  // RPC attributes
  if (kind === 'client' && !attrs['http.method']) {
    attrs['rpc.system'] = 'grpc';
    attrs['rpc.service'] = service;
    attrs['rpc.method'] = operation;
  }

  // Network attributes
  attrs['net.peer.name'] = `${service}-${randomInt(1, 5)}.internal`;
  attrs['net.peer.port'] = kind === 'server' ? 8080 : randomInt(8080, 8090);

  return attrs;
}

function generateSpanEvents(isError: boolean, isSlow: boolean): SpanEvent[] {
  const events: SpanEvent[] = [];
  const now = Date.now();

  if (isSlow) {
    events.push({
      name: 'slow_operation_detected',
      timestamp: now - randomInt(100, 500),
      attributes: {
        threshold_ms: '200',
        actual_ms: String(randomInt(500, 2000)),
      },
    });
  }

  if (isError) {
    events.push({
      name: 'exception',
      timestamp: now,
      attributes: {
        'exception.type': randomChoice(['TimeoutError', 'ConnectionError', 'ValidationError', 'DatabaseError']),
        'exception.message': randomChoice([
          'Connection timeout after 5000ms',
          'Database query failed: deadlock detected',
          'Invalid request parameters',
          'Service unavailable',
        ]),
        'exception.stacktrace': 'Error: ...\n  at handler (/app/src/handler.js:42:15)\n  at process (/app/src/process.js:128:7)',
      },
    });
  }

  return events;
}

function generateSpan(config: SpanGeneratorConfig): Span {
  const isError = shouldOccur(config.errorProbability);
  const isSlow = shouldOccur(config.slowProbability);
  
  const status: SpanStatus = isError ? 'error' : 'ok';
  const attributes = generateSpanAttributes(config.service, config.operation, config.kind, isError);
  const events = generateSpanEvents(isError, isSlow);

  const labels: MetricLabels = {
    service: config.service,
    environment: config.environment,
    region: config.region,
    operation: config.operation,
  };

  return {
    spanId: config.spanId,
    traceId: config.traceId,
    parentSpanId: config.parentSpanId,
    service: config.service,
    operation: config.operation,
    kind: config.kind,
    startTime: config.startTime,
    duration: config.duration,
    status,
    attributes,
    events,
    links: [],
    tags: {
      environment: config.environment,
      region: config.region,
      version: attributes['service.version'] || 'v1.0.0',
    },
    labels,
  };
}

// ============================================================================
// Trace Tree Generation
// ============================================================================

interface SpanNode {
  span: Span;
  children: SpanNode[];
}

function generateSpanTree(
  traceId: string,
  parentSpanId: string | undefined,
  service: string,
  operation: string,
  startTime: number,
  remainingDuration: number,
  depth: number,
  maxDepth: number,
  minChildren: number,
  maxChildren: number,
  errorProbability: number,
  slowProbability: number,
  environment: string,
  region: string
): SpanNode {
  const spanId = generateId('span');
  
  // Determine if this span should have children
  const shouldHaveChildren = depth < maxDepth && shouldOccur(0.7);
  const childCount = shouldHaveChildren ? randomInt(minChildren, maxChildren) : 0;

  // Calculate this span's self time (20-50% of remaining duration)
  const selfTimeRatio = 0.2 + Math.random() * 0.3;
  const selfTime = remainingDuration * selfTimeRatio;
  const childrenTime = remainingDuration - selfTime;

  // Generate children first to calculate actual duration
  const children: SpanNode[] = [];
  let childrenStartTime = startTime + selfTime * 0.5; // Start children after some self time

  if (childCount > 0) {
    const childDuration = childrenTime / childCount;
    const childServices = Object.keys(SERVICE_OPERATIONS);

    for (let i = 0; i < childCount; i++) {
      const childService = randomChoice(childServices);
      const childOp = randomChoice(SERVICE_OPERATIONS[childService].operations);
      const childKind: SpanKind = randomChoice(['client', 'internal', 'producer']);

      const childNode = generateSpanTree(
        traceId,
        spanId,
        childService,
        childOp,
        childrenStartTime,
        childDuration * 0.8, // Leave some buffer
        depth + 1,
        maxDepth,
        minChildren,
        maxChildren,
        errorProbability,
        slowProbability,
        environment,
        region
      );

      children.push(childNode);
      childrenStartTime += childNode.span.duration + randomInt(1, 10); // Small gap between children
    }
  }

  // Calculate actual span duration
  const actualDuration = children.length > 0
    ? Math.max(selfTime, childrenStartTime - startTime)
    : selfTime;

  const span = generateSpan({
    spanId,
    traceId,
    parentSpanId,
    service,
    operation,
    kind: parentSpanId ? 'internal' : 'server',
    startTime,
    duration: actualDuration,
    depth,
    maxDepth,
    errorProbability,
    slowProbability,
    environment,
    region,
  });

  return { span, children };
}

function flattenSpanTree(node: SpanNode): Span[] {
  const spans: Span[] = [node.span];
  for (const child of node.children) {
    spans.push(...flattenSpanTree(child));
  }
  return spans;
}

// ============================================================================
// Main Trace Generation
// ============================================================================

export function generateTrace(config: TraceGeneratorConfig): Trace {
  const traceId = config.traceId || generateId('trace');
  const startTime = config.startTime || Date.now();
  const baseDuration = config.baseDuration || 500;
  const minDepth = config.minDepth || 3;
  const maxDepth = config.maxDepth || 10;
  const minChildren = config.minChildren || 0;
  const maxChildren = config.maxChildren || 4;
  const errorProbability = config.errorProbability || 0.1;
  const slowProbability = config.slowProbability || 0.15;
  const environment = config.environment || 'production';
  const region = config.region || 'us-east-1';

  // Generate span tree
  const rootTree = generateSpanTree(
    traceId,
    undefined,
    config.rootService,
    config.rootOperation,
    startTime,
    baseDuration,
    0,
    maxDepth,
    minChildren,
    maxChildren,
    errorProbability,
    slowProbability,
    environment,
    region
  );

  const spans = flattenSpanTree(rootTree);
  const services = [...new Set(spans.map(s => s.service))];
  const duration = Math.max(...spans.map(s => s.startTime + s.duration)) - startTime;
  const errorCount = spans.filter(s => s.status === 'error').length;
  const status: TraceStatus = errorCount > 0 ? 'error' : 'success';

  return {
    traceId,
    spans,
    services,
    rootService: config.rootService,
    rootOperation: config.rootOperation,
    startTime,
    duration,
    status,
    errorCount,
    spanCount: spans.length,
    tags: {
      environment,
      region,
    },
  };
}

// ============================================================================
// Batch Generation
// ============================================================================

export function generateTraces(count: number, baseConfig?: Partial<TraceGeneratorConfig>): Trace[] {
  const traces: Trace[] = [];
  const services = Object.keys(SERVICE_OPERATIONS);

  for (let i = 0; i < count; i++) {
    const rootService = randomChoice(services);
    const rootOperation = randomChoice(SERVICE_OPERATIONS[rootService].operations);
    
    const config: TraceGeneratorConfig = {
      rootService,
      rootOperation,
      baseDuration: randomInt(100, 2000),
      errorProbability: Math.random() * 0.2, // 0-20%
      slowProbability: Math.random() * 0.3, // 0-30%
      startTime: Date.now() - randomInt(0, 3600000), // Last hour
      ...baseConfig,
    };

    traces.push(generateTrace(config));
  }

  return traces;
}

// ============================================================================
// Scenario Generators
// ============================================================================

export function generateNormalTrace(service: string = 'user-service'): Trace {
  return generateTrace({
    rootService: service,
    rootOperation: randomChoice(SERVICE_OPERATIONS[service].operations),
    baseDuration: randomInt(100, 500),
    errorProbability: 0.05,
    slowProbability: 0.1,
    maxDepth: 5,
  });
}

export function generateSlowTrace(service: string = 'order-service'): Trace {
  return generateTrace({
    rootService: service,
    rootOperation: randomChoice(SERVICE_OPERATIONS[service].operations),
    baseDuration: randomInt(2000, 5000),
    errorProbability: 0.1,
    slowProbability: 0.8,
    maxDepth: 8,
  });
}

export function generateErrorTrace(service: string = 'payment-service'): Trace {
  return generateTrace({
    rootService: service,
    rootOperation: randomChoice(SERVICE_OPERATIONS[service].operations),
    baseDuration: randomInt(500, 3000),
    errorProbability: 0.6,
    slowProbability: 0.3,
    maxDepth: 6,
  });
}

export function generateComplexTrace(): Trace {
  return generateTrace({
    rootService: 'order-service',
    rootOperation: 'POST /orders',
    baseDuration: randomInt(1000, 3000),
    errorProbability: 0.15,
    slowProbability: 0.2,
    minDepth: 5,
    maxDepth: 10,
    minChildren: 1,
    maxChildren: 4,
  });
}

// ============================================================================
// Visualization Data Generators
// ============================================================================

export function generateFlameGraph(trace: Trace): FlameGraphNode {
  const spanMap = new Map<string, Span>();
  trace.spans.forEach(span => spanMap.set(span.spanId, span));

  function buildNode(span: Span, depth: number): FlameGraphNode {
    const children = trace.spans
      .filter(s => s.parentSpanId === span.spanId)
      .map(s => buildNode(s, depth + 1));

    const childrenDuration = children.reduce((sum, child) => sum + child.duration, 0);
    const selfTime = span.duration - childrenDuration;

    return {
      spanId: span.spanId,
      name: `${span.service}: ${span.operation}`,
      service: span.service,
      operation: span.operation,
      duration: span.duration,
      selfTime: Math.max(0, selfTime),
      startTime: span.startTime,
      depth,
      children,
      percentage: 0, // Will be calculated later
      color: span.status === 'error' ? '#f2495c' : '#5470c6',
    };
  }

  const rootSpan = trace.spans.find(s => !s.parentSpanId);
  if (!rootSpan) {
    throw new Error('No root span found in trace');
  }

  const root = buildNode(rootSpan, 0);

  // Calculate percentages
  function calculatePercentages(node: FlameGraphNode, totalDuration: number): void {
    node.percentage = (node.duration / totalDuration) * 100;
    node.children.forEach(child => calculatePercentages(child, totalDuration));
  }
  calculatePercentages(root, root.duration);

  return root;
}

export function generateGanttChart(trace: Trace): GanttChartItem[] {
  return trace.spans.map(span => ({
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    service: span.service,
    operation: span.operation,
    startTime: span.startTime,
    duration: span.duration,
    status: span.status,
    depth: 0, // Will be calculated by visualization component
    color: span.status === 'error' ? '#f2495c' : '#5470c6',
  }));
}

export function generateServiceTopology(traces: Trace[]): ServiceTopology {
  const nodeMap = new Map<string, ServiceNode>();
  const edgeMap = new Map<string, ServiceEdge>();

  traces.forEach(trace => {
    trace.spans.forEach(span => {
      // Add/update service node
      if (!nodeMap.has(span.service)) {
        nodeMap.set(span.service, {
          id: span.service,
          name: span.service,
          type: SERVICE_OPERATIONS[span.service]?.type || 'unknown',
          status: 'healthy',
          metrics: {
            requestCount: 0,
            errorRate: 0,
            avgLatency: 0,
            p99Latency: 0,
          },
        });
      }

      const node = nodeMap.get(span.service)!;
      node.metrics.requestCount++;
      if (span.status === 'error') {
        node.metrics.errorRate = (node.metrics.errorRate * (node.metrics.requestCount - 1) + 100) / node.metrics.requestCount;
      }

      // Add edges
      if (span.parentSpanId) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId);
        if (parentSpan && parentSpan.service !== span.service) {
          const edgeKey = `${parentSpan.service}->${span.service}`;
          
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, {
              source: parentSpan.service,
              target: span.service,
              requestCount: 0,
              errorRate: 0,
              avgLatency: 0,
              protocol: span.attributes['http.method'] ? 'http' : 'grpc',
            });
          }

          const edge = edgeMap.get(edgeKey)!;
          edge.requestCount++;
          edge.avgLatency = (edge.avgLatency * (edge.requestCount - 1) + span.duration) / edge.requestCount;
          if (span.status === 'error') {
            edge.errorRate = (edge.errorRate * (edge.requestCount - 1) + 100) / edge.requestCount;
          }
        }
      }
    });
  });

  // Update node status based on error rate
  nodeMap.forEach(node => {
    if (node.metrics.errorRate > 10) {
      node.status = 'down';
    } else if (node.metrics.errorRate > 5) {
      node.status = 'degraded';
    } else {
      node.status = 'healthy';
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

// ============================================================================
// Analysis Functions
// ============================================================================

export function findCriticalPath(trace: Trace): CriticalPath {
  const spanMap = new Map<string, Span>();
  trace.spans.forEach(span => spanMap.set(span.spanId, span));

  function findLongestPath(spanId: string): Span[] {
    const span = spanMap.get(spanId)!;
    const children = trace.spans.filter(s => s.parentSpanId === spanId);

    if (children.length === 0) {
      return [span];
    }

    const childPaths = children.map(child => findLongestPath(child.spanId));
    const longestChildPath = childPaths.reduce((longest, current) => {
      const longestDuration = longest.reduce((sum, s) => sum + s.duration, 0);
      const currentDuration = current.reduce((sum, s) => sum + s.duration, 0);
      return currentDuration > longestDuration ? current : longest;
    });

    return [span, ...longestChildPath];
  }

  const rootSpan = trace.spans.find(s => !s.parentSpanId);
  if (!rootSpan) {
    return { spans: [], totalDuration: 0, percentage: 0 };
  }

  const criticalSpans = findLongestPath(rootSpan.spanId);
  const totalDuration = criticalSpans.reduce((sum, s) => sum + s.duration, 0);
  const percentage = (totalDuration / trace.duration) * 100;

  return {
    spans: criticalSpans,
    totalDuration,
    percentage,
  };
}

export function findSlowSpans(trace: Trace, threshold?: number): SlowSpan[] {
  const slowSpans: SlowSpan[] = [];

  trace.spans.forEach(span => {
    const spanThreshold = threshold || 200;
    
    if (span.duration > spanThreshold) {
      const score = span.duration / spanThreshold;
      const reason = span.status === 'error' 
        ? 'Error occurred during execution'
        : span.events.some(e => e.name === 'slow_operation_detected')
        ? 'Slow operation detected'
        : 'Duration exceeds threshold';

      slowSpans.push({
        span,
        threshold: spanThreshold,
        actualDuration: span.duration,
        score,
        reason,
      });
    }
  });

  return slowSpans.sort((a, b) => b.score - a.score);
}
