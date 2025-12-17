/**
 * Tracing Type Definitions
 * 
 * Comprehensive type system for distributed tracing, including trace structures,
 * span definitions, service topology, flame graphs, and trace analysis utilities.
 */

// ============================================================================
// Core Tracing Types
// ============================================================================

/**
 * Trace status indicating overall health of the trace
 */
export type TraceStatus = 'success' | 'error' | 'timeout' | 'cancelled' | 'unknown';

/**
 * Span kind indicating the role of the span in the trace
 */
export type SpanKind = 'server' | 'client' | 'producer' | 'consumer' | 'internal';

/**
 * Span status indicating the outcome of the operation
 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Database operation types
 */
export type DbOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER';

/**
 * Message queue operation types
 */
export type MqOperation = 'send' | 'receive' | 'publish' | 'subscribe' | 'ack' | 'nack';

// ============================================================================
// Span Interfaces
// ============================================================================

/**
 * Span attributes for additional context
 */
export interface SpanAttributes {
  // HTTP attributes
  'http.method'?: HttpMethod;
  'http.url'?: string;
  'http.target'?: string;
  'http.status_code'?: number;
  'http.user_agent'?: string;
  'http.request_content_length'?: number;
  'http.response_content_length'?: number;

  // Database attributes
  'db.system'?: string;
  'db.name'?: string;
  'db.statement'?: string;
  'db.operation'?: DbOperation;
  'db.user'?: string;
  'db.connection_string'?: string;

  // Message queue attributes
  'messaging.system'?: string;
  'messaging.destination'?: string;
  'messaging.operation'?: MqOperation;
  'messaging.message_id'?: string;
  'messaging.conversation_id'?: string;

  // RPC attributes
  'rpc.system'?: string;
  'rpc.service'?: string;
  'rpc.method'?: string;

  // Network attributes
  'net.peer.name'?: string;
  'net.peer.ip'?: string;
  'net.peer.port'?: number;
  'net.host.name'?: string;
  'net.host.ip'?: string;
  'net.host.port'?: number;

  // Custom attributes
  [key: string]: string | number | boolean | undefined;
}

/**
 * Span event representing a point-in-time occurrence
 */
export interface SpanEvent {
  /** Event name */
  name: string;
  /** Event timestamp (Unix milliseconds) */
  timestamp: number;
  /** Event attributes */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Span link to another span (for batch processing, async operations)
 */
export interface SpanLink {
  /** Linked trace ID */
  traceId: string;
  /** Linked span ID */
  spanId: string;
  /** Link attributes */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Individual span in a trace
 */
export interface Span {
  /** Unique span identifier */
  spanId: string;
  /** Parent span ID (null for root span) */
  parentSpanId: string | null;
  /** Trace ID this span belongs to */
  traceId: string;
  /** Operation name */
  name: string;
  /** Service name */
  service: string;
  /** Span kind */
  kind: SpanKind;
  /** Span status */
  status: SpanStatus;
  /** Start timestamp (Unix milliseconds) */
  startTime: number;
  /** End timestamp (Unix milliseconds) */
  endTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Span attributes */
  attributes: SpanAttributes;
  /** Span events */
  events?: SpanEvent[];
  /** Span links */
  links?: SpanLink[];
  /** Error message if status is error */
  errorMessage?: string;
  /** Stack trace if error occurred */
  stackTrace?: string;
  /** Tags for categorization */
  tags?: Record<string, string>;
  /** Child span IDs */
  children?: string[];
}

/**
 * Complete trace with all spans
 */
export interface Trace {
  /** Unique trace identifier */
  traceId: string;
  /** Root span ID */
  rootSpanId: string;
  /** Trace name (usually root operation) */
  name: string;
  /** Overall trace status */
  status: TraceStatus;
  /** Trace start timestamp */
  startTime: number;
  /** Trace end timestamp */
  endTime: number;
  /** Total trace duration */
  duration: number;
  /** All spans in the trace */
  spans: Span[];
  /** Services involved in the trace */
  services: string[];
  /** Total number of spans */
  spanCount: number;
  /** Number of error spans */
  errorCount: number;
  /** Entry service (first service in the trace) */
  entryService: string;
  /** Entry endpoint */
  entryEndpoint?: string;
  /** HTTP status code (if applicable) */
  httpStatusCode?: number;
  /** Tags for categorization */
  tags?: Record<string, string>;
}

// ============================================================================
// Trace Query & Search
// ============================================================================

/**
 * Trace search query configuration
 */
export interface TraceSearchQuery {
  /** Service name filter */
  service?: string;
  /** Operation name filter */
  operation?: string;
  /** Trace status filter */
  status?: TraceStatus[];
  /** Minimum duration (milliseconds) */
  minDuration?: number;
  /** Maximum duration (milliseconds) */
  maxDuration?: number;
  /** HTTP status code filter */
  httpStatusCode?: number[];
  /** Error filter (true = only errors, false = no errors) */
  hasError?: boolean;
  /** Tag filters */
  tags?: Record<string, string>;
  /** Time range start (Unix milliseconds) */
  startTime: number;
  /** Time range end (Unix milliseconds) */
  endTime: number;
  /** Limit number of results */
  limit?: number;
  /** Sort field */
  sortBy?: 'startTime' | 'duration' | 'spanCount';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Trace search result
 */
export interface TraceSearchResult {
  /** Matching traces */
  traces: Trace[];
  /** Total number of matching traces */
  total: number;
  /** Query execution time (milliseconds) */
  executionTime: number;
  /** Whether more results are available */
  hasMore: boolean;
}

/**
 * Trace summary for list view
 */
export interface TraceSummary {
  /** Trace ID */
  traceId: string;
  /** Trace name */
  name: string;
  /** Trace status */
  status: TraceStatus;
  /** Start timestamp */
  startTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Number of spans */
  spanCount: number;
  /** Number of services */
  serviceCount: number;
  /** Entry service */
  entryService: string;
  /** Entry endpoint */
  entryEndpoint?: string;
  /** HTTP status code */
  httpStatusCode?: number;
  /** Error count */
  errorCount: number;
}

// ============================================================================
// Service Topology
// ============================================================================

/**
 * Service node in topology graph
 */
export interface ServiceNode {
  /** Service identifier */
  id: string;
  /** Service display name */
  name: string;
  /** Service type (application, database, cache, mq, external) */
  type: 'application' | 'database' | 'cache' | 'mq' | 'external';
  /** Service status */
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  /** Request count */
  requestCount: number;
  /** Error count */
  errorCount: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Average latency (milliseconds) */
  avgLatency: number;
  /** P99 latency (milliseconds) */
  p99Latency: number;
  /** Metadata */
  metadata?: {
    environment?: string;
    region?: string;
    version?: string;
    instances?: number;
  };
}

/**
 * Service edge (call relationship) in topology graph
 */
export interface ServiceEdge {
  /** Source service ID */
  source: string;
  /** Target service ID */
  target: string;
  /** Request count */
  requestCount: number;
  /** Error count */
  errorCount: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Average latency (milliseconds) */
  avgLatency: number;
  /** P99 latency (milliseconds) */
  p99Latency: number;
  /** Call protocols */
  protocols?: string[];
}

/**
 * Service topology graph
 */
export interface ServiceTopology {
  /** Service nodes */
  nodes: ServiceNode[];
  /** Service edges (call relationships) */
  edges: ServiceEdge[];
  /** Topology timestamp */
  timestamp: number;
  /** Time range for the topology data */
  timeRange: {
    start: number;
    end: number;
  };
}

// ============================================================================
// Flame Graph & Gantt Chart
// ============================================================================

/**
 * Flame graph node for visualization
 */
export interface FlameGraphNode {
  /** Node identifier */
  id: string;
  /** Span ID */
  spanId: string;
  /** Node name (operation name) */
  name: string;
  /** Service name */
  service: string;
  /** Start time relative to trace start (milliseconds) */
  startTime: number;
  /** Duration (milliseconds) */
  duration: number;
  /** Self time (duration - children duration) */
  selfTime: number;
  /** Depth level in the tree */
  depth: number;
  /** Parent node ID */
  parentId: string | null;
  /** Child node IDs */
  children: string[];
  /** Span status */
  status: SpanStatus;
  /** Error message if any */
  errorMessage?: string;
  /** Span attributes */
  attributes: SpanAttributes;
  /** Color for visualization */
  color?: string;
}

/**
 * Gantt chart item for timeline visualization
 */
export interface GanttChartItem {
  /** Item identifier */
  id: string;
  /** Span ID */
  spanId: string;
  /** Operation name */
  name: string;
  /** Service name */
  service: string;
  /** Start time (Unix milliseconds) */
  startTime: number;
  /** End time (Unix milliseconds) */
  endTime: number;
  /** Duration (milliseconds) */
  duration: number;
  /** Depth level */
  depth: number;
  /** Span status */
  status: SpanStatus;
  /** Span kind */
  kind: SpanKind;
  /** Error message if any */
  errorMessage?: string;
  /** Color for visualization */
  color?: string;
}

// ============================================================================
// Trace Analysis
// ============================================================================

/**
 * Critical path analysis result
 */
export interface CriticalPath {
  /** Spans on the critical path */
  spans: Span[];
  /** Total duration of critical path */
  duration: number;
  /** Percentage of total trace duration */
  percentage: number;
}

/**
 * Span statistics for a service or operation
 */
export interface SpanStatistics {
  /** Service or operation name */
  name: string;
  /** Total span count */
  count: number;
  /** Total duration (milliseconds) */
  totalDuration: number;
  /** Average duration (milliseconds) */
  avgDuration: number;
  /** Minimum duration (milliseconds) */
  minDuration: number;
  /** Maximum duration (milliseconds) */
  maxDuration: number;
  /** P50 duration (milliseconds) */
  p50Duration: number;
  /** P90 duration (milliseconds) */
  p90Duration: number;
  /** P99 duration (milliseconds) */
  p99Duration: number;
  /** Error count */
  errorCount: number;
  /** Error rate (0-1) */
  errorRate: number;
}

/**
 * Trace comparison result
 */
export interface TraceComparison {
  /** Baseline trace */
  baseline: Trace;
  /** Comparison trace */
  comparison: Trace;
  /** Duration difference (milliseconds) */
  durationDiff: number;
  /** Duration difference percentage */
  durationDiffPercent: number;
  /** Span count difference */
  spanCountDiff: number;
  /** Service differences */
  serviceDiff: {
    added: string[];
    removed: string[];
    common: string[];
  };
  /** Span differences by service */
  spanDiffs: Array<{
    service: string;
    operation: string;
    baselineDuration: number;
    comparisonDuration: number;
    diff: number;
    diffPercent: number;
  }>;
}

/**
 * Slow span detection result
 */
export interface SlowSpan {
  /** Span details */
  span: Span;
  /** Trace ID */
  traceId: string;
  /** Slowness score (0-100) */
  score: number;
  /** Reason for being slow */
  reason: string;
  /** Comparison to average duration */
  avgDuration?: number;
  /** Comparison to P99 duration */
  p99Duration?: number;
}

/**
 * Trace export configuration
 */
export interface TraceExportConfig {
  /** Export format */
  format: 'json' | 'jaeger' | 'zipkin' | 'otlp';
  /** Include span events */
  includeEvents?: boolean;
  /** Include span links */
  includeLinks?: boolean;
  /** Include attributes */
  includeAttributes?: boolean;
  /** Compress output */
  compress?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Trace status colors for UI
 */
export const TRACE_STATUS_COLORS: Record<TraceStatus, string> = {
  success: '#73bf69',
  error: '#f2495c',
  timeout: '#ff9830',
  cancelled: '#9fa7b3',
  unknown: '#6e7681',
} as const;

/**
 * Span status colors for UI
 */
export const SPAN_STATUS_COLORS: Record<SpanStatus, string> = {
  ok: '#73bf69',
  error: '#f2495c',
  unset: '#9fa7b3',
} as const;

/**
 * Span kind colors for UI
 */
export const SPAN_KIND_COLORS: Record<SpanKind, string> = {
  server: '#5470c6',
  client: '#91cc75',
  producer: '#fac858',
  consumer: '#ee6666',
  internal: '#73c0de',
} as const;

/**
 * Service type colors for topology
 */
export const SERVICE_TYPE_COLORS = {
  application: '#5470c6',
  database: '#91cc75',
  cache: '#fac858',
  mq: '#ee6666',
  external: '#9fa7b3',
} as const;

/**
 * Default trace search configuration
 */
export const DEFAULT_TRACE_SEARCH: Partial<TraceSearchQuery> = {
  limit: 50,
  sortBy: 'startTime',
  sortOrder: 'desc',
} as const;

/**
 * Duration thresholds for slow span detection (milliseconds)
 */
export const SLOW_SPAN_THRESHOLDS = {
  http: 1000,
  database: 500,
  cache: 100,
  mq: 200,
  internal: 300,
} as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if trace has errors
 */
export function hasErrors(trace: Trace): boolean {
  return trace.errorCount > 0 || trace.status === 'error';
}

/**
 * Check if span is an error span
 */
export function isErrorSpan(span: Span): boolean {
  return span.status === 'error';
}

/**
 * Check if span is a root span
 */
export function isRootSpan(span: Span): boolean {
  return span.parentSpanId === null;
}

/**
 * Check if span is an HTTP span
 */
export function isHttpSpan(span: Span): boolean {
  return span.attributes['http.method'] !== undefined;
}

/**
 * Check if span is a database span
 */
export function isDatabaseSpan(span: Span): boolean {
  return span.attributes['db.system'] !== undefined;
}

/**
 * Check if span is a message queue span
 */
export function isMessageQueueSpan(span: Span): boolean {
  return span.attributes['messaging.system'] !== undefined;
}

/**
 * Check if span is slow based on thresholds
 */
export function isSlowSpan(span: Span, threshold?: number): boolean {
  if (threshold !== undefined) {
    return span.duration > threshold;
  }

  // Auto-detect threshold based on span type
  if (isHttpSpan(span)) {
    return span.duration > SLOW_SPAN_THRESHOLDS.http;
  }
  if (isDatabaseSpan(span)) {
    return span.duration > SLOW_SPAN_THRESHOLDS.database;
  }
  if (isMessageQueueSpan(span)) {
    return span.duration > SLOW_SPAN_THRESHOLDS.mq;
  }
  return span.duration > SLOW_SPAN_THRESHOLDS.internal;
}
