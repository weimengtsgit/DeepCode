/**
 * Distributed Tracing Type Definitions
 * 
 * Defines TypeScript interfaces for trace, span, and related data structures
 * used throughout the observability platform's tracing module.
 */

/**
 * Span Status - Current execution state of a span
 */
export type SpanStatus = 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'CANCELLED'

/**
 * Span Log - Log entry associated with a span during execution
 */
export interface SpanLog {
  timestamp: Date
  message: string
  fields?: Record<string, any>
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
}

/**
 * Span - Individual operation within a distributed trace
 * 
 * Represents a single unit of work (function call, RPC, database query, etc.)
 * within a larger distributed transaction. Spans form a tree structure with
 * parent-child relationships representing the call chain.
 */
export interface Span {
  spanId: string                    // Unique identifier for this span
  traceId: string                   // Parent trace ID (links to root trace)
  parentSpanId: string | null       // Parent span ID (null for root span)
  service: string                   // Service/application name
  operation: string                 // Operation name (e.g., "POST /api/users", "db.query")
  startTime: Date                   // Span start timestamp
  endTime: Date                     // Span end timestamp
  durationMs: number                // Duration in milliseconds
  status: SpanStatus                // Execution status (SUCCESS, ERROR, TIMEOUT, CANCELLED)
  tags?: Record<string, any>        // Metadata tags (host, user, version, etc.)
  logs?: SpanLog[]                  // Associated log entries during span execution
  stacktrace?: string               // Error stack trace (if status === ERROR)
  childSpanIds?: string[]           // IDs of child spans (for quick lookup)
}

/**
 * Trace - Complete distributed trace representing a single request/transaction
 * 
 * A trace is a collection of spans that represent the complete execution path
 * of a request through a distributed system. It starts with a root span and
 * includes all downstream service calls.
 */
export interface Trace {
  traceId: string                   // Unique trace identifier (UUID)
  rootSpanId: string                // ID of the root/entry span
  rootService: string               // Service that initiated the trace
  startTime: Date                   // Trace start time (from root span)
  endTime: Date                     // Trace end time (from last span)
  totalDurationMs: number           // Total trace duration in milliseconds
  spanCount: number                 // Total number of spans in trace
  status: SpanStatus                // Overall trace status (SUCCESS if all spans succeed)
  spans: Span[]                     // All spans in this trace
  errorCount?: number               // Number of spans with ERROR status
  slowSpanCount?: number            // Number of spans exceeding latency threshold
  tags?: Record<string, any>        // Trace-level metadata
}

/**
 * Trace Statistics - Aggregated metrics across multiple traces
 */
export interface TraceStatistics {
  totalTraces: number               // Total number of traces analyzed
  successCount: number              // Traces with SUCCESS status
  errorCount: number                // Traces with ERROR status
  timeoutCount: number              // Traces with TIMEOUT status
  avgDurationMs: number             // Average trace duration
  minDurationMs: number             // Minimum trace duration
  maxDurationMs: number             // Maximum trace duration
  p50DurationMs: number             // 50th percentile duration
  p90DurationMs: number             // 90th percentile duration
  p99DurationMs: number             // 99th percentile duration
  avgSpanCount: number              // Average spans per trace
  minSpanCount: number              // Minimum spans in a trace
  maxSpanCount: number              // Maximum spans in a trace
  errorRate: number                 // Percentage of traces with errors (0-100)
  slowTraceRate: number             // Percentage of traces exceeding latency threshold
}

/**
 * Service Dependency - Relationship between two services in call graph
 */
export interface ServiceDependency {
  source: string                    // Calling service
  target: string                    // Called service
  callCount: number                 // Number of calls between services
  errorCount: number                // Number of failed calls
  avgLatencyMs: number              // Average latency of calls
  p99LatencyMs: number              // 99th percentile latency
}

/**
 * Service Dependency Graph - Topology of service interactions
 */
export interface ServiceDependencyGraph {
  nodes: Array<{
    id: string                      // Service name
    label: string                   // Display name
    status?: 'healthy' | 'warning' | 'critical'
  }>
  edges: Array<{
    source: string                  // Source service
    target: string                  // Target service
    label?: string                  // Edge label (call count, latency)
    weight?: number                 // Edge weight for visualization
    callCount?: number
    errorRate?: number
  }>
}

/**
 * Trace Filter Criteria - Parameters for filtering traces
 */
export interface TraceFilterCriteria {
  service?: string                  // Filter by service name
  operation?: string                // Filter by operation name
  status?: SpanStatus               // Filter by trace status
  minDurationMs?: number            // Minimum trace duration
  maxDurationMs?: number            // Maximum trace duration
  hasError?: boolean                // Filter to error traces only
  isSlow?: boolean                  // Filter to slow traces only
  tags?: Record<string, string>     // Filter by trace tags
}

/**
 * Trace Query Result - Paginated trace search results
 */
export interface TraceQueryResult {
  traces: Trace[]                   // Matching traces
  total: number                     // Total matching traces
  page: number                      // Current page number
  pageSize: number                  // Items per page
  totalPages: number                // Total number of pages
}

/**
 * Span Analysis Result - Detailed analysis of a span
 */
export interface SpanAnalysis {
  span: Span
  isSlowSpan: boolean               // True if duration > threshold
  slowReason?: string               // Why span is slow (e.g., "Database query timeout")
  relativeLatency: number           // Latency relative to siblings (0-100)
  criticalPath: boolean             // True if on critical path
  childSpans: Span[]                // Direct child spans
  parentSpan?: Span                 // Parent span (if not root)
}

/**
 * Critical Path - Longest execution path through trace
 */
export interface CriticalPath {
  spans: Span[]                     // Spans on critical path
  totalDurationMs: number           // Total duration of critical path
  percentage: number                // Percentage of total trace duration
}

/**
 * Concurrency Analysis - Parallel execution metrics
 */
export interface ConcurrencyAnalysis {
  maxConcurrentSpans: number        // Maximum spans executing in parallel
  avgConcurrentSpans: number        // Average concurrent spans
  parallelizationRatio: number      // Ratio of parallel to sequential time (0-1)
  criticalPath: CriticalPath        // Longest sequential path
}

/**
 * Trace Comparison - Metrics comparing two traces
 */
export interface TraceComparison {
  trace1: Trace
  trace2: Trace
  durationDiffMs: number            // Duration difference
  durationDiffPercent: number       // Duration difference as percentage
  spanCountDiff: number             // Difference in span count
  commonServices: string[]          // Services in both traces
  uniqueServices1: string[]         // Services only in trace1
  uniqueServices2: string[]         // Services only in trace2
  errorDiff: number                 // Difference in error count
}

/**
 * Trace Generator Configuration - Parameters for mock trace generation
 */
export interface TraceGeneratorConfig {
  services: Array<{
    id: string
    name: string
    displayName?: string
    instances?: string[]
  }>
  minDepth: number                  // Minimum span depth (3-10)
  maxDepth: number                  // Maximum span depth (3-10)
  errorRate: number                 // Probability of error (0-1)
  durationMinMs: number             // Minimum span duration
  durationMaxMs: number             // Maximum span duration
  branchProbability: number         // Probability of deeper calls (0-1)
  timeRange?: {
    start: Date
    end: Date
  }
}

/**
 * Trace Export Format - For exporting traces to external systems
 */
export interface TraceExport {
  format: 'jaeger' | 'zipkin' | 'otel' | 'json'
  trace: Trace
  exportedAt: Date
  metadata?: Record<string, any>
}

/**
 * Span Metrics - Performance metrics for a span
 */
export interface SpanMetrics {
  spanId: string
  durationMs: number
  durationPercentile: number        // Percentile relative to same operation
  errorRate: number                 // Error rate for this operation
  throughput: number                // Calls per minute
  p50DurationMs: number
  p90DurationMs: number
  p99DurationMs: number
}

/**
 * Operation Metrics - Aggregated metrics for an operation across all traces
 */
export interface OperationMetrics {
  operation: string
  service: string
  callCount: number
  errorCount: number
  avgDurationMs: number
  p50DurationMs: number
  p90DurationMs: number
  p99DurationMs: number
  errorRate: number
  throughput: number                // Calls per minute
}

/**
 * Trace Anomaly - Detected anomaly in trace execution
 */
export interface TraceAnomaly {
  type: 'slow_span' | 'error_spike' | 'unusual_pattern' | 'service_degradation'
  severity: 'info' | 'warning' | 'critical'
  description: string
  affectedSpans: string[]           // Span IDs involved
  affectedServices: string[]        // Service names involved
  detectedAt: Date
  confidence: number                // 0-1 confidence score
}
