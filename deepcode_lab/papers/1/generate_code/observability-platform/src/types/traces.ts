/**
 * Type definitions for distributed tracing module
 * Defines interfaces for traces, spans, topology, and flame graph visualization
 */

/**
 * Span status enumeration
 */
export enum SpanStatus {
  OK = 'ok',
  ERROR = 'error',
  UNSET = 'unset'
}

/**
 * Span kind enumeration (OpenTelemetry standard)
 */
export enum SpanKind {
  INTERNAL = 'internal',
  SERVER = 'server',
  CLIENT = 'client',
  PRODUCER = 'producer',
  CONSUMER = 'consumer'
}

/**
 * Single log event within a span
 */
export interface SpanLog {
  /** Timestamp in microseconds */
  timestamp: number
  /** Log fields (key-value pairs) */
  fields: Record<string, any>
  /** Optional log message */
  message?: string
}

/**
 * Span reference type (for span relationships)
 */
export enum SpanReferenceType {
  CHILD_OF = 'child_of',
  FOLLOWS_FROM = 'follows_from'
}

/**
 * Span reference (relationship to another span)
 */
export interface SpanReference {
  /** Reference type */
  type: SpanReferenceType
  /** Referenced trace ID */
  traceId: string
  /** Referenced span ID */
  spanId: string
}

/**
 * Individual span in a distributed trace
 */
export interface Span {
  /** Unique span identifier */
  spanId: string
  /** Trace this span belongs to */
  traceId: string
  /** Parent span ID (null for root span) */
  parentSpanId: string | null
  /** Service name that generated this span */
  serviceName: string
  /** Operation name (e.g., "HTTP GET /api/users") */
  operationName: string
  /** Span start time in microseconds */
  startTime: number
  /** Span duration in microseconds */
  duration: number
  /** Span status */
  status: SpanStatus
  /** Span kind */
  kind?: SpanKind
  /** Key-value tags/attributes */
  tags: Record<string, any>
  /** Log events within this span */
  logs: SpanLog[]
  /** Span references (relationships) */
  references?: SpanReference[]
  /** Error flag (derived from status or tags) */
  error?: boolean
  /** Error message if error occurred */
  errorMessage?: string
  /** Stack trace if error occurred */
  stackTrace?: string
}

/**
 * Complete distributed trace
 */
export interface Trace {
  /** Unique trace identifier */
  traceId: string
  /** All spans in this trace */
  spans: Span[]
  /** Trace start time (earliest span start) */
  startTime: number
  /** Total trace duration (latest span end - earliest start) */
  duration: number
  /** All services involved in this trace */
  services: string[]
  /** Root span (entry point) */
  rootSpan?: Span
  /** Trace status (error if any span has error) */
  status: SpanStatus
  /** Total span count */
  spanCount: number
  /** Error span count */
  errorCount: number
  /** Maximum depth of span tree */
  depth: number
  /** Critical path duration (longest path through tree) */
  criticalPathDuration?: number
}

/**
 * Trace query parameters
 */
export interface TraceQuery {
  /** Filter by service name(s) */
  services?: string[]
  /** Filter by operation name */
  operation?: string
  /** Filter by status */
  status?: SpanStatus
  /** Minimum duration in microseconds */
  minDuration?: number
  /** Maximum duration in microseconds */
  maxDuration?: number
  /** Filter by tags (key-value pairs) */
  tags?: Record<string, any>
  /** Start time for query range */
  startTime: number
  /** End time for query range */
  endTime: number
  /** Maximum number of traces to return */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Sort field */
  sortBy?: 'startTime' | 'duration' | 'spanCount'
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Trace query response
 */
export interface TraceQueryResponse {
  /** Matching traces */
  traces: Trace[]
  /** Total count (before pagination) */
  total: number
  /** Query execution time in milliseconds */
  executionTime: number
  /** Whether more results are available */
  hasMore: boolean
}

/**
 * Span tree node (for hierarchical visualization)
 */
export interface SpanTreeNode {
  /** The span data */
  span: Span
  /** Child spans */
  children: SpanTreeNode[]
  /** Tree depth (0 for root) */
  depth: number
  /** Self time (duration excluding children) */
  selfTime: number
  /** Cumulative time (duration including children) */
  cumulativeTime: number
  /** Path from root (for highlighting) */
  path: string[]
}

/**
 * Flame graph data point
 */
export interface FlameGraphNode {
  /** Span ID */
  spanId: string
  /** Service name */
  serviceName: string
  /** Operation name */
  operationName: string
  /** Start time relative to trace start (microseconds) */
  startOffset: number
  /** Duration in microseconds */
  duration: number
  /** Depth in tree (y-axis position) */
  depth: number
  /** X position (0-1 normalized) */
  x: number
  /** Width (0-1 normalized) */
  width: number
  /** Color (based on service) */
  color: string
  /** Error flag */
  error: boolean
  /** Child nodes */
  children: FlameGraphNode[]
  /** Self time percentage */
  selfTimePercent: number
}

/**
 * Gantt chart data point
 */
export interface GanttChartItem {
  /** Span ID */
  spanId: string
  /** Service name */
  serviceName: string
  /** Operation name */
  operationName: string
  /** Start time in microseconds */
  startTime: number
  /** End time in microseconds */
  endTime: number
  /** Duration in microseconds */
  duration: number
  /** Depth in tree */
  depth: number
  /** Status */
  status: SpanStatus
  /** Parent span ID */
  parentSpanId: string | null
  /** Error flag */
  error: boolean
}

/**
 * Service topology node
 */
export interface TopologyNode {
  /** Service name (unique identifier) */
  id: string
  /** Display name */
  name: string
  /** Service type/category */
  type: 'service' | 'database' | 'cache' | 'queue' | 'external'
  /** Request count */
  requestCount: number
  /** Error count */
  errorCount: number
  /** Error rate (0-1) */
  errorRate: number
  /** Average response time in milliseconds */
  avgResponseTime: number
  /** P99 response time in milliseconds */
  p99ResponseTime: number
  /** Health status */
  status: 'healthy' | 'warning' | 'error'
  /** Node metadata */
  metadata?: Record<string, any>
}

/**
 * Service topology edge (call relationship)
 */
export interface TopologyEdge {
  /** Source service ID */
  source: string
  /** Target service ID */
  target: string
  /** Call count */
  callCount: number
  /** Error count */
  errorCount: number
  /** Error rate (0-1) */
  errorRate: number
  /** Average latency in milliseconds */
  avgLatency: number
  /** P99 latency in milliseconds */
  p99Latency: number
  /** Edge metadata */
  metadata?: Record<string, any>
}

/**
 * Service topology graph
 */
export interface ServiceTopology {
  /** All service nodes */
  nodes: TopologyNode[]
  /** All call relationships */
  edges: TopologyEdge[]
  /** Time range for this topology */
  timeRange: {
    startTime: number
    endTime: number
  }
  /** Total request count */
  totalRequests: number
  /** Total error count */
  totalErrors: number
}

/**
 * Trace statistics
 */
export interface TraceStatistics {
  /** Total trace count */
  totalTraces: number
  /** Error trace count */
  errorTraces: number
  /** Error rate (0-1) */
  errorRate: number
  /** Average trace duration in microseconds */
  avgDuration: number
  /** P50 duration */
  p50Duration: number
  /** P90 duration */
  p90Duration: number
  /** P95 duration */
  p95Duration: number
  /** P99 duration */
  p99Duration: number
  /** Maximum duration */
  maxDuration: number
  /** Minimum duration */
  minDuration: number
  /** Average span count per trace */
  avgSpanCount: number
  /** Service distribution */
  serviceDistribution: Record<string, number>
  /** Operation distribution */
  operationDistribution: Record<string, number>
  /** Traces per minute time series */
  tracesPerMinute: Array<{
    timestamp: number
    count: number
    errorCount: number
  }>
}

/**
 * Trace filter state (UI state)
 */
export interface TraceFilterState {
  /** Selected services */
  selectedServices: string[]
  /** Selected operations */
  selectedOperations: string[]
  /** Selected status */
  selectedStatus: SpanStatus | null
  /** Duration range filter */
  durationRange: {
    min: number | null
    max: number | null
  }
  /** Tag filters */
  tagFilters: Record<string, any>
  /** Only show traces with errors */
  onlyErrors: boolean
  /** Search term (trace ID or operation name) */
  searchTerm: string
}

/**
 * Span detail panel data
 */
export interface SpanDetailData {
  /** The span */
  span: Span
  /** Parent span (if exists) */
  parent: Span | null
  /** Child spans */
  children: Span[]
  /** Related logs (from log module, if traceId correlation exists) */
  relatedLogs?: any[]
  /** Span metrics */
  metrics?: {
    selfTime: number
    selfTimePercent: number
    cumulativeTime: number
    cumulativeTimePercent: number
  }
}

/**
 * Trace comparison data (for comparing multiple traces)
 */
export interface TraceComparison {
  /** Traces being compared */
  traces: Trace[]
  /** Common services */
  commonServices: string[]
  /** Service differences */
  serviceDifferences: {
    onlyInFirst: string[]
    onlyInSecond: string[]
  }
  /** Duration comparison */
  durationComparison: {
    trace1Duration: number
    trace2Duration: number
    difference: number
    percentDifference: number
  }
  /** Span count comparison */
  spanCountComparison: {
    trace1Count: number
    trace2Count: number
    difference: number
  }
}

/**
 * Trace export options
 */
export interface TraceExportOptions {
  /** Export format */
  format: 'json' | 'jaeger' | 'zipkin' | 'otlp'
  /** Include full span details */
  includeSpanDetails: boolean
  /** Include logs */
  includeLogs: boolean
  /** Include tags */
  includeTags: boolean
  /** Filename */
  filename?: string
}

/**
 * Trace generation configuration (for mock data)
 */
export interface TraceGenerationConfig {
  /** Minimum tree depth */
  minDepth: number
  /** Maximum tree depth */
  maxDepth: number
  /** Minimum children per span */
  minChildren: number
  /** Maximum children per span */
  maxChildren: number
  /** Error probability (0-1) */
  errorProbability: number
  /** Slow span probability (0-1) */
  slowSpanProbability: number
  /** Available services */
  services: string[]
  /** Available operations per service */
  operations: Record<string, string[]>
  /** Duration distribution parameters */
  durationDistribution: {
    /** Lambda for exponential distribution */
    lambda: number
    /** Minimum duration in microseconds */
    minDuration: number
    /** Maximum duration in microseconds */
    maxDuration: number
  }
}

/**
 * Critical path analysis result
 */
export interface CriticalPath {
  /** Spans in critical path (longest path) */
  spans: Span[]
  /** Total duration of critical path */
  totalDuration: number
  /** Percentage of trace duration */
  percentOfTrace: number
  /** Bottleneck span (slowest in path) */
  bottleneck: Span
}

/**
 * Trace anomaly detection result
 */
export interface TraceAnomaly {
  /** Trace ID */
  traceId: string
  /** Anomaly type */
  type: 'slow' | 'error_spike' | 'unusual_path' | 'high_span_count'
  /** Severity */
  severity: 'low' | 'medium' | 'high'
  /** Description */
  description: string
  /** Detected timestamp */
  detectedAt: number
  /** Anomaly score (0-1) */
  score: number
  /** Related spans */
  relatedSpans: string[]
}

/**
 * Span search suggestion (for autocomplete)
 */
export interface SpanSearchSuggestion {
  /** Suggestion type */
  type: 'service' | 'operation' | 'tag' | 'traceId'
  /** Suggestion text */
  text: string
  /** Display label */
  label: string
  /** Occurrence count */
  count?: number
}
