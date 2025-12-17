/**
 * Log-related TypeScript type definitions for the Observability Monitoring Platform
 * Defines structures for log entries, log levels, and log-related operations
 */

/**
 * Log severity levels in order of increasing severity
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

/**
 * Individual log entry structure
 * Represents a single log message with metadata and context
 */
export interface LogEntry {
  /** Unique identifier for the log entry */
  id: string

  /** ISO 8601 timestamp when log was generated */
  timestamp: Date

  /** Service/application that generated the log */
  service: string

  /** Log severity level */
  level: LogLevel

  /** Log message text */
  message: string

  /** Optional trace ID for correlation with distributed traces */
  traceId?: string

  /** Optional span ID for correlation with specific trace span */
  spanId?: string

  /** Contextual information about the log */
  context: LogContext

  /** Optional stack trace for error logs */
  stacktrace?: string

  /** Optional structured fields extracted from message */
  fields?: Record<string, any>

  /** Optional tags for custom filtering */
  tags?: Record<string, string>

  /** Optional duration in milliseconds (for operation logs) */
  durationMs?: number

  /** Optional error code or identifier */
  errorCode?: string | number

  /** Optional HTTP status code (for API logs) */
  statusCode?: number

  /** Optional request/response size in bytes */
  sizeBytes?: number

  /** Optional user/request identifier */
  userId?: string | number

  /** Optional session identifier */
  sessionId?: string

  /** Optional environment where log originated */
  environment?: string

  /** Optional region/zone where log originated */
  region?: string

  /** Optional hostname/instance identifier */
  hostname?: string

  /** Optional process ID */
  pid?: number

  /** Optional thread ID */
  threadId?: string
}

/**
 * Contextual information associated with a log entry
 */
export interface LogContext {
  /** User ID making the request */
  userId?: string | number

  /** Unique request identifier */
  requestId: string

  /** Instance/pod ID where log originated */
  instanceId: string

  /** Environment (production, staging, testing, development) */
  environment?: string

  /** Geographic region */
  region?: string

  /** Availability zone */
  zone?: string

  /** Additional custom context fields */
  [key: string]: any
}

/**
 * Aggregated statistics for log data
 */
export interface LogStatistics {
  /** Total number of logs in dataset */
  totalCount: number

  /** Count of logs by level */
  countByLevel: Record<LogLevel, number>

  /** Count of logs by service */
  countByService: Record<string, number>

  /** Hourly trend of log counts */
  countTrend: Array<{
    timestamp: Date
    count: number
  }>

  /** Top error messages by frequency */
  topErrors: Array<{
    message: string
    count: number
    level: LogLevel
  }>

  /** Top services by log volume */
  topServices: Array<{
    service: string
    count: number
  }>

  /** Overall error rate (0-1) */
  errorRate: number

  /** Average logs per minute */
  avgLogsPerMinute: number

  /** Logs per service per minute */
  logsPerServicePerMinute: Record<string, number>

  /** Timestamp of statistics calculation */
  calculatedAt: Date
}

/**
 * Configuration for log data generation
 */
export interface LogGeneratorConfig {
  /** Array of service definitions to generate logs for */
  services: Array<{
    name: string
    instances: string[]
  }>

  /** Time range for log generation */
  timeRange: {
    start: Date
    end: Date
  }

  /** Base frequency of logs per minute (default: 10) */
  baseFrequencyPerMinute?: number

  /** UTC hours with elevated log frequency (peak hours) */
  peakHours?: Array<[number, number]>

  /** Error rate during normal operation (0-1, default: 0.005) */
  errorRateNormal?: number

  /** Error rate during error clusters (0-1, default: 0.1) */
  errorRatePeak?: number

  /** Probability that a log has associated trace ID (0-1, default: 0.2) */
  traceIdProbability?: number

  /** Probability of error clustering (0-1, default: 0.01) */
  errorClusterProbability?: number

  /** Duration of error clusters in minutes (default: 5-15) */
  errorClusterDurationMinutes?: [number, number]
}

/**
 * Parsed log search query
 */
export interface ParsedLogQuery {
  /** Keywords to search for */
  keywords: string[]

  /** Field-specific search criteria */
  fields: Record<string, string[]>

  /** Logical operators (AND, OR, NOT) */
  operators: string[]

  /** Whether query uses regex patterns */
  isRegex: boolean

  /** Original query string */
  originalQuery: string
}

/**
 * Log field extraction patterns
 */
export interface LogFieldPatterns {
  /** Regex patterns for extracting fields from log messages */
  [fieldName: string]: RegExp
}

/**
 * Result of log search operation
 */
export interface LogSearchResult {
  /** Matching log entries */
  logs: LogEntry[]

  /** Total count of matching logs */
  total: number

  /** Current page number */
  page: number

  /** Page size */
  pageSize: number

  /** Total number of pages */
  totalPages: number

  /** Query execution time in milliseconds */
  queryTimeMs: number

  /** Whether there are more results */
  hasMore: boolean
}

/**
 * Log filtering criteria
 */
export interface LogFilterCriteria {
  /** Filter by service names */
  services?: string[]

  /** Filter by log levels */
  levels?: LogLevel[]

  /** Filter by time range */
  timeRange?: {
    start: Date
    end: Date
  }

  /** Filter by trace ID */
  traceId?: string

  /** Filter by span ID */
  spanId?: string

  /** Filter by user ID */
  userId?: string | number

  /** Filter by instance ID */
  instanceId?: string

  /** Filter by environment */
  environment?: string

  /** Filter by region */
  region?: string

  /** Filter by custom tags */
  tags?: Record<string, string>

  /** Minimum error code (for error filtering) */
  minErrorCode?: number

  /** Maximum error code */
  maxErrorCode?: number

  /** Minimum duration in milliseconds */
  minDurationMs?: number

  /** Maximum duration in milliseconds */
  maxDurationMs?: number

  /** Minimum HTTP status code */
  minStatusCode?: number

  /** Maximum HTTP status code */
  maxStatusCode?: number
}

/**
 * Log aggregation bucket for time-series analysis
 */
export interface LogAggregationBucket {
  /** Start time of bucket */
  timestamp: Date

  /** Number of logs in bucket */
  count: number

  /** Count by level in bucket */
  countByLevel: Record<LogLevel, number>

  /** Count by service in bucket */
  countByService: Record<string, number>

  /** Error count in bucket */
  errorCount: number

  /** Error rate in bucket (0-1) */
  errorRate: number
}

/**
 * Log export format
 */
export interface LogExport {
  /** Export format (json, csv, txt) */
  format: 'json' | 'csv' | 'txt'

  /** Exported logs */
  logs: LogEntry[]

  /** Export timestamp */
  exportedAt: Date

  /** Total count of exported logs */
  totalCount: number

  /** Metadata about export */
  metadata: {
    timeRange: {
      start: Date
      end: Date
    }
    filters: LogFilterCriteria
    services: string[]
  }
}

/**
 * Log correlation with other data types
 */
export interface LogCorrelation {
  /** Log entry */
  log: LogEntry

  /** Related trace if available */
  relatedTrace?: {
    traceId: string
    spanId?: string
  }

  /** Related alert if available */
  relatedAlert?: {
    alertId: string
    severity: string
  }

  /** Related metric anomaly if available */
  relatedAnomaly?: {
    metricName: string
    service: string
    anomalyType: string
  }

  /** Correlation confidence (0-1) */
  confidence: number
}

/**
 * Log analysis result
 */
export interface LogAnalysis {
  /** Time period analyzed */
  timeRange: {
    start: Date
    end: Date
  }

  /** Statistics for the period */
  statistics: LogStatistics

  /** Detected patterns or anomalies */
  patterns: Array<{
    type: string
    description: string
    affectedLogs: number
    severity: 'low' | 'medium' | 'high'
  }>

  /** Top error messages */
  topErrors: Array<{
    message: string
    count: number
    lastOccurrence: Date
  }>

  /** Service health based on logs */
  serviceHealth: Record<string, {
    errorRate: number
    status: 'healthy' | 'warning' | 'critical'
  }>

  /** Recommendations based on analysis */
  recommendations: string[]
}

/**
 * Log streaming message for real-time updates
 */
export interface LogStreamMessage {
  /** Message type */
  type: 'log' | 'stats' | 'error' | 'heartbeat'

  /** Log entry (if type is 'log') */
  log?: LogEntry

  /** Statistics update (if type is 'stats') */
  stats?: Partial<LogStatistics>

  /** Error message (if type is 'error') */
  error?: string

  /** Message timestamp */
  timestamp: Date

  /** Sequence number for ordering */
  sequence: number
}

/**
 * Log retention policy
 */
export interface LogRetentionPolicy {
  /** Retention period in days */
  retentionDays: number

  /** Archive logs older than this (days) */
  archiveAfterDays?: number

  /** Delete logs older than this (days) */
  deleteAfterDays?: number

  /** Sampling rate for old logs (0-1) */
  samplingRate?: number

  /** Compression for archived logs */
  compression?: 'gzip' | 'brotli' | 'none'
}
