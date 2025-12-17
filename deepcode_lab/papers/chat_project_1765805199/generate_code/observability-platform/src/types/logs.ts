/**
 * Log Analysis Type Definitions
 * Comprehensive type system for log management, search, filtering, and analysis
 */

/**
 * Log Severity Levels
 * Standard logging levels from most to least severe
 */
export type LogLevel = 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

/**
 * Log Source Types
 * Categorizes log origin for filtering and routing
 */
export type LogSource = 'application' | 'system' | 'access' | 'audit' | 'security' | 'database' | 'network';

/**
 * Log Format Types
 * Supported log serialization formats
 */
export type LogFormat = 'json' | 'text' | 'structured' | 'unstructured';

/**
 * Search Operator Types
 * Query operators for log search
 */
export type SearchOperator = 'AND' | 'OR' | 'NOT' | 'CONTAINS' | 'EQUALS' | 'REGEX' | 'RANGE';

/**
 * Time Grouping Intervals
 * Aggregation intervals for log statistics
 */
export type TimeInterval = '1s' | '5s' | '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '24h';

/**
 * Core Log Entry Interface
 * Represents a single log record with all metadata
 */
export interface LogEntry {
  /** Unique log entry identifier */
  id: string;
  
  /** Unix timestamp in milliseconds */
  timestamp: number;
  
  /** Log severity level */
  level: LogLevel;
  
  /** Primary log message */
  message: string;
  
  /** Source service/application name */
  service: string;
  
  /** Service instance identifier */
  instance?: string;
  
  /** Deployment environment */
  environment?: string;
  
  /** Cloud region or datacenter */
  region?: string;
  
  /** Log source category */
  source: LogSource;
  
  /** Distributed trace ID for correlation */
  traceId?: string;
  
  /** Span ID within trace */
  spanId?: string;
  
  /** Request/correlation ID */
  requestId?: string;
  
  /** User ID associated with log */
  userId?: string;
  
  /** Session identifier */
  sessionId?: string;
  
  /** Hostname or container ID */
  host?: string;
  
  /** Process ID */
  pid?: number;
  
  /** Thread ID */
  tid?: number;
  
  /** Logger name or category */
  logger?: string;
  
  /** Source file name */
  file?: string;
  
  /** Line number in source file */
  line?: number;
  
  /** Function/method name */
  function?: string;
  
  /** Stack trace for errors */
  stackTrace?: string;
  
  /** Exception class name */
  exception?: string;
  
  /** HTTP method for access logs */
  httpMethod?: string;
  
  /** HTTP status code */
  httpStatus?: number;
  
  /** Request URL/path */
  url?: string;
  
  /** Client IP address */
  clientIp?: string;
  
  /** User agent string */
  userAgent?: string;
  
  /** Request duration in milliseconds */
  duration?: number;
  
  /** Response size in bytes */
  responseSize?: number;
  
  /** Custom key-value pairs */
  labels?: Record<string, string>;
  
  /** Structured log fields */
  fields?: Record<string, any>;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Log format type */
  format?: LogFormat;
  
  /** Raw log line (original format) */
  raw?: string;
  
  /** Indicates if log is highlighted in search */
  highlighted?: boolean;
  
  /** Indicates if log is part of error context */
  isError?: boolean;
  
  /** Indicates if log is part of trace context */
  isTraceRelated?: boolean;
}

/**
 * Log Search Query Configuration
 * Defines search criteria and filters
 */
export interface LogSearchQuery {
  /** Free-text search query */
  query?: string;
  
  /** Log level filters */
  levels?: LogLevel[];
  
  /** Service name filters */
  services?: string[];
  
  /** Environment filters */
  environments?: string[];
  
  /** Region filters */
  regions?: string[];
  
  /** Source type filters */
  sources?: LogSource[];
  
  /** Trace ID for correlation */
  traceId?: string;
  
  /** Request ID filter */
  requestId?: string;
  
  /** User ID filter */
  userId?: string;
  
  /** Host/instance filter */
  hosts?: string[];
  
  /** HTTP status code filter */
  httpStatus?: number[];
  
  /** HTTP method filter */
  httpMethods?: string[];
  
  /** Time range start (Unix timestamp) */
  startTime: number;
  
  /** Time range end (Unix timestamp) */
  endTime: number;
  
  /** Custom label filters */
  labels?: Record<string, string>;
  
  /** Field existence checks */
  hasFields?: string[];
  
  /** Field value filters */
  fieldFilters?: FieldFilter[];
  
  /** Search operator (default: AND) */
  operator?: SearchOperator;
  
  /** Case-sensitive search */
  caseSensitive?: boolean;
  
  /** Use regex matching */
  useRegex?: boolean;
  
  /** Exclude patterns */
  excludePatterns?: string[];
  
  /** Include only patterns */
  includePatterns?: string[];
}

/**
 * Field Filter Configuration
 * Filters logs by specific field values
 */
export interface FieldFilter {
  /** Field name to filter */
  field: string;
  
  /** Filter operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'exists' | 'not_exists';
  
  /** Filter value(s) */
  value?: any;
  
  /** Multiple values for 'in' operator */
  values?: any[];
}

/**
 * Log Search Result
 * Response from log search query
 */
export interface LogSearchResult {
  /** Matching log entries */
  logs: LogEntry[];
  
  /** Total matching logs (before pagination) */
  total: number;
  
  /** Current page number */
  page: number;
  
  /** Logs per page */
  pageSize: number;
  
  /** Total pages available */
  totalPages: number;
  
  /** Query execution time in milliseconds */
  executionTime: number;
  
  /** Indicates if more results available */
  hasMore: boolean;
  
  /** Next page cursor for streaming */
  nextCursor?: string;
  
  /** Search query used */
  query: LogSearchQuery;
  
  /** Search statistics */
  statistics?: LogStatistics;
  
  /** Highlighted terms */
  highlights?: string[];
}

/**
 * Log Statistics
 * Aggregated metrics from log search
 */
export interface LogStatistics {
  /** Total log count */
  totalCount: number;
  
  /** Count by log level */
  levelCounts: Record<LogLevel, number>;
  
  /** Count by service */
  serviceCounts: Record<string, number>;
  
  /** Count by source type */
  sourceCounts: Record<LogSource, number>;
  
  /** Count by environment */
  environmentCounts?: Record<string, number>;
  
  /** Count by region */
  regionCounts?: Record<string, number>;
  
  /** Count by HTTP status code */
  httpStatusCounts?: Record<number, number>;
  
  /** Average log rate (logs per second) */
  averageRate: number;
  
  /** Peak log rate */
  peakRate: number;
  
  /** Error rate percentage */
  errorRate: number;
  
  /** Time series data for histogram */
  timeSeries?: LogTimeSeriesData[];
  
  /** Top error messages */
  topErrors?: Array<{ message: string; count: number }>;
  
  /** Top exceptions */
  topExceptions?: Array<{ exception: string; count: number }>;
  
  /** Unique trace count */
  uniqueTraces?: number;
  
  /** Unique user count */
  uniqueUsers?: number;
}

/**
 * Log Time Series Data Point
 * Aggregated log counts over time
 */
export interface LogTimeSeriesData {
  /** Time bucket timestamp */
  timestamp: number;
  
  /** Total log count in bucket */
  count: number;
  
  /** Count by level */
  levelCounts?: Record<LogLevel, number>;
  
  /** Error count in bucket */
  errorCount?: number;
  
  /** Warning count in bucket */
  warningCount?: number;
}

/**
 * Log Context Configuration
 * Settings for retrieving surrounding log context
 */
export interface LogContext {
  /** Target log entry ID */
  logId: string;
  
  /** Number of logs before target */
  before: number;
  
  /** Number of logs after target */
  after: number;
  
  /** Same service only */
  sameService?: boolean;
  
  /** Same trace only */
  sameTrace?: boolean;
  
  /** Same request only */
  sameRequest?: boolean;
  
  /** Time window in milliseconds */
  timeWindow?: number;
}

/**
 * Log Context Result
 * Surrounding logs for context viewing
 */
export interface LogContextResult {
  /** Target log entry */
  targetLog: LogEntry;
  
  /** Logs before target */
  beforeLogs: LogEntry[];
  
  /** Logs after target */
  afterLogs: LogEntry[];
  
  /** Total context logs */
  totalContext: number;
}

/**
 * Log Export Configuration
 * Settings for exporting log data
 */
export interface LogExportConfig {
  /** Export format */
  format: 'json' | 'csv' | 'text' | 'ndjson';
  
  /** Search query to export */
  query: LogSearchQuery;
  
  /** Maximum logs to export */
  maxLogs?: number;
  
  /** Fields to include in export */
  fields?: string[];
  
  /** Include headers (CSV) */
  includeHeaders?: boolean;
  
  /** Compression format */
  compression?: 'gzip' | 'zip' | 'none';
  
  /** Export filename */
  filename?: string;
}

/**
 * Log Pattern Detection
 * Identifies common log patterns
 */
export interface LogPattern {
  /** Pattern identifier */
  id: string;
  
  /** Pattern template/regex */
  pattern: string;
  
  /** Pattern description */
  description: string;
  
  /** Occurrence count */
  count: number;
  
  /** Percentage of total logs */
  percentage: number;
  
  /** Example log entries */
  examples: LogEntry[];
  
  /** Pattern severity */
  severity?: LogLevel;
  
  /** First occurrence timestamp */
  firstSeen: number;
  
  /** Last occurrence timestamp */
  lastSeen: number;
}

/**
 * Log Anomaly Detection
 * Identifies unusual log patterns
 */
export interface LogAnomaly {
  /** Anomaly identifier */
  id: string;
  
  /** Anomaly type */
  type: 'spike' | 'drop' | 'pattern_change' | 'new_error' | 'rate_change';
  
  /** Anomaly description */
  description: string;
  
  /** Severity score (0-100) */
  severity: number;
  
  /** Detection timestamp */
  detectedAt: number;
  
  /** Time range of anomaly */
  timeRange: {
    start: number;
    end: number;
  };
  
  /** Affected services */
  services: string[];
  
  /** Baseline value */
  baseline?: number;
  
  /** Observed value */
  observed?: number;
  
  /** Deviation percentage */
  deviation?: number;
  
  /** Related log entries */
  relatedLogs?: LogEntry[];
  
  /** Suggested actions */
  suggestions?: string[];
}

/**
 * Log Streaming Configuration
 * Real-time log streaming settings
 */
export interface LogStreamConfig {
  /** Stream identifier */
  streamId: string;
  
  /** Filter query */
  query: LogSearchQuery;
  
  /** Buffer size (logs) */
  bufferSize?: number;
  
  /** Auto-scroll enabled */
  autoScroll?: boolean;
  
  /** Highlight patterns */
  highlightPatterns?: string[];
  
  /** Pause streaming */
  paused?: boolean;
  
  /** Follow mode (tail -f) */
  followMode?: boolean;
}

/**
 * Log Aggregation Configuration
 * Settings for log aggregation queries
 */
export interface LogAggregation {
  /** Aggregation type */
  type: 'count' | 'terms' | 'histogram' | 'date_histogram' | 'stats' | 'percentiles';
  
  /** Field to aggregate */
  field?: string;
  
  /** Time interval for histograms */
  interval?: TimeInterval;
  
  /** Maximum buckets */
  size?: number;
  
  /** Minimum document count */
  minDocCount?: number;
  
  /** Nested aggregations */
  subAggregations?: Record<string, LogAggregation>;
  
  /** Sort order */
  order?: 'asc' | 'desc';
  
  /** Sort by field */
  orderBy?: 'count' | 'key';
}

/**
 * Log Aggregation Result
 * Response from aggregation query
 */
export interface LogAggregationResult {
  /** Aggregation buckets */
  buckets: Array<{
    key: string | number;
    count: number;
    subAggregations?: Record<string, LogAggregationResult>;
  }>;
  
  /** Total documents */
  totalCount: number;
  
  /** Statistics (for stats aggregation) */
  stats?: {
    min: number;
    max: number;
    avg: number;
    sum: number;
  };
  
  /** Percentiles (for percentile aggregation) */
  percentiles?: Record<string, number>;
}

/**
 * Log Parsing Rule
 * Configuration for parsing unstructured logs
 */
export interface LogParsingRule {
  /** Rule identifier */
  id: string;
  
  /** Rule name */
  name: string;
  
  /** Pattern to match */
  pattern: string;
  
  /** Field extraction mappings */
  fieldMappings: Record<string, string>;
  
  /** Apply to services */
  services?: string[];
  
  /** Apply to sources */
  sources?: LogSource[];
  
  /** Rule priority */
  priority?: number;
  
  /** Enabled status */
  enabled: boolean;
}

/**
 * Log Retention Policy
 * Data retention configuration
 */
export interface LogRetentionPolicy {
  /** Policy identifier */
  id: string;
  
  /** Policy name */
  name: string;
  
  /** Retention duration in days */
  retentionDays: number;
  
  /** Apply to log levels */
  levels?: LogLevel[];
  
  /** Apply to services */
  services?: string[];
  
  /** Apply to environments */
  environments?: string[];
  
  /** Archive after retention */
  archiveEnabled?: boolean;
  
  /** Archive storage location */
  archiveLocation?: string;
}

/**
 * Log Level Color Mapping
 * UI color scheme for log levels
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  FATAL: '#f2495c',    // Red
  ERROR: '#ff7383',    // Light Red
  WARN: '#ff9830',     // Orange
  INFO: '#5794f2',     // Blue
  DEBUG: '#b877d9',    // Purple
  TRACE: '#9fa7b3',    // Gray
} as const;

/**
 * Log Level Priority
 * Numeric priority for sorting/filtering
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  FATAL: 50,
  ERROR: 40,
  WARN: 30,
  INFO: 20,
  DEBUG: 10,
  TRACE: 0,
} as const;

/**
 * Log Level Icons
 * Icon names for UI display
 */
export const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  FATAL: 'mdi:alert-octagon',
  ERROR: 'mdi:alert-circle',
  WARN: 'mdi:alert',
  INFO: 'mdi:information',
  DEBUG: 'mdi:bug',
  TRACE: 'mdi:text',
} as const;

/**
 * Default Log Search Configuration
 */
export const DEFAULT_LOG_SEARCH: Partial<LogSearchQuery> = {
  operator: 'AND',
  caseSensitive: false,
  useRegex: false,
} as const;

/**
 * Default Pagination Settings
 */
export const DEFAULT_LOG_PAGINATION = {
  page: 1,
  pageSize: 100,
  maxPageSize: 1000,
} as const;

/**
 * Log Context Defaults
 */
export const DEFAULT_LOG_CONTEXT = {
  before: 10,
  after: 10,
  timeWindow: 60000, // 1 minute
} as const;

/**
 * Type Guard: Check if log level is error-related
 */
export function isErrorLevel(level: LogLevel): boolean {
  return level === 'FATAL' || level === 'ERROR';
}

/**
 * Type Guard: Check if log level is warning or above
 */
export function isWarningOrAbove(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY.WARN;
}

/**
 * Type Guard: Check if log entry has trace context
 */
export function hasTraceContext(log: LogEntry): boolean {
  return !!(log.traceId || log.spanId);
}

/**
 * Type Guard: Check if log entry is HTTP access log
 */
export function isAccessLog(log: LogEntry): boolean {
  return log.source === 'access' || !!(log.httpMethod && log.httpStatus);
}

/**
 * Type Guard: Check if log entry has error details
 */
export function hasErrorDetails(log: LogEntry): boolean {
  return !!(log.exception || log.stackTrace);
}
