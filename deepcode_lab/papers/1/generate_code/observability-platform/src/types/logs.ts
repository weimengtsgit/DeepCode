/**
 * Log Analytics Type Definitions
 * 
 * Defines TypeScript interfaces and types for the log analytics module,
 * including log entries, levels, search queries, filters, and statistics.
 */

/**
 * Log severity levels
 * Ordered from least to most severe
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * Log level distribution for statistics
 */
export const LOG_LEVEL_DISTRIBUTION: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0.30,  // 30%
  [LogLevel.INFO]: 0.50,   // 50%
  [LogLevel.WARN]: 0.15,   // 15%
  [LogLevel.ERROR]: 0.04,  // 4%
  [LogLevel.FATAL]: 0.01   // 1%
}

/**
 * Log level colors for UI display
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '#6c6f77',   // Gray
  [LogLevel.INFO]: '#3274d9',    // Blue
  [LogLevel.WARN]: '#ff9830',    // Orange
  [LogLevel.ERROR]: '#f2495c',   // Red
  [LogLevel.FATAL]: '#b91c1c'    // Dark red
}

/**
 * Single log entry structure
 */
export interface LogEntry {
  /** Unique log identifier */
  id: string
  
  /** Timestamp in ISO8601 format */
  timestamp: string
  
  /** Log severity level */
  level: LogLevel
  
  /** Service that generated the log */
  service: string
  
  /** Log message content */
  message: string
  
  /** Optional trace ID for correlation with distributed traces */
  traceId?: string
  
  /** Optional span ID for correlation with specific spans */
  spanId?: string
  
  /** Additional metadata */
  metadata: LogMetadata
  
  /** Stack trace for ERROR/FATAL logs */
  stackTrace?: string
  
  /** Structured fields extracted from log */
  fields?: Record<string, any>
}

/**
 * Log metadata
 */
export interface LogMetadata {
  /** Hostname where log was generated */
  hostname: string
  
  /** Pod/container name (for Kubernetes) */
  pod?: string
  
  /** Thread/process ID */
  thread?: string
  
  /** Source file and line number */
  source?: string
  
  /** Additional custom tags */
  tags?: Record<string, string>
}

/**
 * Log search query parameters
 */
export interface LogQuery {
  /** Text search term */
  searchTerm?: string
  
  /** Enable regex search */
  useRegex?: boolean
  
  /** Filter by log levels */
  levels?: LogLevel[]
  
  /** Filter by services */
  services?: string[]
  
  /** Filter by trace ID */
  traceId?: string
  
  /** Time range */
  startTime: number
  endTime: number
  
  /** Pagination */
  limit?: number
  offset?: number
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
  
  /** Field filters */
  fieldFilters?: Record<string, any>
}

/**
 * Log query response
 */
export interface LogQueryResponse {
  /** Log entries */
  logs: LogEntry[]
  
  /** Total count (before pagination) */
  total: number
  
  /** Query execution time (ms) */
  executionTime: number
  
  /** Whether more results are available */
  hasMore: boolean
  
  /** Query that was executed */
  query: LogQuery
}

/**
 * Log statistics
 */
export interface LogStatistics {
  /** Total log count */
  totalCount: number
  
  /** Count by level */
  countByLevel: Record<LogLevel, number>
  
  /** Count by service */
  countByService: Record<string, number>
  
  /** Logs per minute time series */
  logsPerMinute: Array<{
    timestamp: number
    count: number
    byLevel: Record<LogLevel, number>
  }>
  
  /** Top error messages */
  topErrors?: Array<{
    message: string
    count: number
    firstSeen: string
    lastSeen: string
  }>
  
  /** Time range */
  timeRange: {
    startTime: number
    endTime: number
  }
}

/**
 * Log filter state
 */
export interface LogFilterState {
  /** Selected log levels */
  selectedLevels: LogLevel[]
  
  /** Selected services */
  selectedServices: string[]
  
  /** Search term */
  searchTerm: string
  
  /** Regex mode enabled */
  useRegex: boolean
  
  /** Trace ID filter */
  traceId?: string
  
  /** Show only logs with traces */
  onlyWithTraces: boolean
  
  /** Field filters */
  fieldFilters: Record<string, any>
}

/**
 * Log context (surrounding logs)
 */
export interface LogContext {
  /** Target log entry */
  targetLog: LogEntry
  
  /** Logs before target */
  before: LogEntry[]
  
  /** Logs after target */
  after: LogEntry[]
  
  /** Context window size (lines) */
  contextSize: number
}

/**
 * Log export options
 */
export interface LogExportOptions {
  /** Export format */
  format: 'json' | 'csv' | 'txt'
  
  /** Include metadata */
  includeMetadata: boolean
  
  /** Include stack traces */
  includeStackTraces: boolean
  
  /** Maximum number of logs to export */
  maxLogs?: number
  
  /** Filename */
  filename?: string
}

/**
 * Log pattern detection result
 */
export interface LogPattern {
  /** Pattern ID */
  id: string
  
  /** Pattern template */
  template: string
  
  /** Example messages matching this pattern */
  examples: string[]
  
  /** Occurrence count */
  count: number
  
  /** First occurrence */
  firstSeen: string
  
  /** Last occurrence */
  lastSeen: string
  
  /** Severity distribution */
  severityDistribution: Record<LogLevel, number>
}

/**
 * Log streaming configuration
 */
export interface LogStreamConfig {
  /** Enable real-time streaming */
  enabled: boolean
  
  /** Buffer size (number of logs to keep in memory) */
  bufferSize: number
  
  /** Auto-scroll to latest */
  autoScroll: boolean
  
  /** Highlight new logs */
  highlightNew: boolean
  
  /** Pause streaming */
  paused: boolean
}

/**
 * Log aggregation bucket
 */
export interface LogAggregationBucket {
  /** Bucket timestamp */
  timestamp: number
  
  /** Log count in bucket */
  count: number
  
  /** Count by level */
  byLevel: Record<LogLevel, number>
  
  /** Count by service */
  byService: Record<string, number>
}

/**
 * Log tail options (for real-time log following)
 */
export interface LogTailOptions {
  /** Services to tail */
  services: string[]
  
  /** Minimum log level */
  minLevel: LogLevel
  
  /** Maximum logs to keep */
  maxLogs: number
  
  /** Follow mode (auto-scroll) */
  follow: boolean
}

/**
 * Log message template (for mock generation)
 */
export interface LogMessageTemplate {
  /** Template string with placeholders */
  template: string
  
  /** Log level */
  level: LogLevel
  
  /** Weight for random selection */
  weight: number
  
  /** Whether to include stack trace */
  includeStackTrace?: boolean
  
  /** Whether to include trace ID */
  includeTraceId?: boolean
}

/**
 * Virtual scroll item data
 */
export interface LogVirtualScrollItem {
  /** Log entry */
  log: LogEntry
  
  /** Item height in pixels */
  height: number
  
  /** Whether item is expanded */
  expanded: boolean
  
  /** Whether item is highlighted */
  highlighted: boolean
}

/**
 * Log search suggestion
 */
export interface LogSearchSuggestion {
  /** Suggestion type */
  type: 'service' | 'level' | 'field' | 'value'
  
  /** Suggestion text */
  text: string
  
  /** Display label */
  label: string
  
  /** Occurrence count */
  count?: number
}

/**
 * Log correlation result
 */
export interface LogCorrelation {
  /** Correlated trace ID */
  traceId: string
  
  /** Logs in this trace */
  logs: LogEntry[]
  
  /** Services involved */
  services: string[]
  
  /** Time span */
  timeSpan: {
    start: string
    end: string
    duration: number
  }
  
  /** Error count */
  errorCount: number
}

/**
 * Log parsing error
 */
export interface LogParseError {
  /** Original log line */
  rawLog: string
  
  /** Error message */
  error: string
  
  /** Timestamp when error occurred */
  timestamp: string
}

/**
 * Log viewer preferences
 */
export interface LogViewerPreferences {
  /** Font size */
  fontSize: number
  
  /** Line height */
  lineHeight: number
  
  /** Show timestamps */
  showTimestamps: boolean
  
  /** Show service names */
  showServices: boolean
  
  /** Show log levels */
  showLevels: boolean
  
  /** Wrap long lines */
  wrapLines: boolean
  
  /** Highlight search matches */
  highlightMatches: boolean
  
  /** Color scheme */
  colorScheme: 'default' | 'monochrome' | 'high-contrast'
}
