/**
 * API Request/Response Type Definitions
 * Defines all TypeScript interfaces for HTTP API communication
 * Used by mock API service and all service layer files
 */

import type {
  TimeSeries,
  MetricPoint,
  Trace,
  Span,
  LogEntry,
  AlertRule,
  AlertEvent,
  FilterSet,
  DateRange,
  DashboardConfig,
} from './index'

/**
 * Generic API Response Wrapper
 * All API responses follow this structure for consistency
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: Date
  requestId?: string
}

/**
 * Paginated Response Wrapper
 * Used for list endpoints that support pagination
 */
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Metrics API Requests
 */
export interface GetMetricsRequest {
  service: string
  startTime: Date
  endTime: Date
  metricNames?: string[]
  aggregationBucket?: 'auto' | '1m' | '5m' | '30m' | '1h'
}

export interface CompareMetricsRequest {
  services: string[]
  metricName: string
  startTime: Date
  endTime: Date
}

export interface MetricsQueryResponse {
  metrics: TimeSeries[]
  queryTime: number // milliseconds
  pointCount: number
  aggregationBucket?: string
}

/**
 * Traces API Requests
 */
export interface GetTracesRequest {
  service?: string
  startTime?: Date
  endTime?: Date
  status?: 'success' | 'error' | 'timeout'
  minDurationMs?: number
  maxDurationMs?: number
  limit?: number
  offset?: number
}

export interface GetTraceRequest {
  traceId: string
}

export interface TracesQueryResponse {
  traces: Trace[]
  total: number
  queryTime: number // milliseconds
}

export interface TraceDetailResponse {
  trace: Trace | null
  relatedLogs?: LogEntry[]
  relatedAlerts?: AlertEvent[]
}

/**
 * Logs API Requests
 */
export interface GetLogsRequest {
  service?: string
  level?: string[]
  startTime?: Date
  endTime?: Date
  traceId?: string
  page?: number
  pageSize?: number
}

export interface SearchLogsRequest {
  query: string
  service?: string
  level?: string[]
  startTime?: Date
  endTime?: Date
  traceId?: string
  page?: number
  pageSize?: number
  regex?: boolean
}

export interface LogsQueryResponse {
  logs: LogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  queryTime: number // milliseconds
}

/**
 * Alerts API Requests
 */
export interface GetAlertRulesRequest {
  enabled?: boolean
  severity?: string[]
  service?: string
}

export interface GetAlertEventsRequest {
  service?: string
  severity?: string[]
  status?: 'active' | 'acknowledged' | 'resolved'
  startTime?: Date
  endTime?: Date
  limit?: number
  offset?: number
}

export interface CreateAlertRuleRequest {
  name: string
  description?: string
  metric: string
  condition: string
  threshold: number
  duration: number // seconds
  severity: 'critical' | 'warning' | 'info'
  service?: string
  environment?: string
  enabled?: boolean
}

export interface UpdateAlertRuleRequest {
  id: string
  updates: Partial<CreateAlertRuleRequest>
}

export interface AcknowledgeAlertRequest {
  eventId: string
  userId: string
  comment?: string
}

export interface ResolveAlertRequest {
  eventId: string
  userId?: string
  comment?: string
}

export interface AlertsQueryResponse {
  rules?: AlertRule[]
  events?: AlertEvent[]
  total?: number
  queryTime: number // milliseconds
}

/**
 * Dashboard API Requests
 */
export interface GetDashboardsRequest {
  userId?: string
  includeDefault?: boolean
}

export interface GetDashboardRequest {
  dashboardId: string
}

export interface CreateDashboardRequest {
  name: string
  description?: string
  widgets?: any[]
  isDefault?: boolean
}

export interface UpdateDashboardRequest {
  dashboardId: string
  updates: Partial<CreateDashboardRequest>
}

export interface DeleteDashboardRequest {
  dashboardId: string
}

export interface DashboardsQueryResponse {
  dashboards: DashboardConfig[]
  total: number
  queryTime: number // milliseconds
}

/**
 * Health Check API
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  uptime: number // milliseconds
  services: {
    [serviceName: string]: {
      status: 'up' | 'down'
      responseTime: number // milliseconds
      lastCheck: Date
    }
  }
  metrics?: {
    requestsPerSecond: number
    errorRate: number
    p99Latency: number
  }
}

/**
 * Bulk Operations API
 */
export interface BulkAcknowledgeAlertsRequest {
  eventIds: string[]
  userId: string
  comment?: string
}

export interface BulkResolveAlertsRequest {
  eventIds: string[]
  userId?: string
  comment?: string
}

export interface BulkOperationResponse {
  successful: number
  failed: number
  errors?: Array<{
    id: string
    error: string
  }>
}

/**
 * Export/Import API
 */
export interface ExportDataRequest {
  format: 'json' | 'csv'
  dataType: 'metrics' | 'traces' | 'logs' | 'alerts'
  startTime: Date
  endTime: Date
  filters?: FilterSet
}

export interface ExportDataResponse {
  url: string
  format: string
  size: number // bytes
  expiresAt: Date
}

export interface ImportDataRequest {
  format: 'json' | 'csv'
  dataType: string
  file: File | string // File object or base64 string
}

export interface ImportDataResponse {
  imported: number
  skipped: number
  errors: Array<{
    row: number
    error: string
  }>
}

/**
 * Configuration API
 */
export interface GetConfigRequest {
  section?: 'metrics' | 'alerts' | 'retention' | 'ui'
}

export interface UpdateConfigRequest {
  section: string
  config: Record<string, any>
}

export interface ConfigResponse {
  config: Record<string, any>
  lastUpdated: Date
}

/**
 * User/Session API
 */
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    roles: string[]
  }
  expiresAt: Date
}

export interface LogoutRequest {
  token: string
}

export interface UserPreferencesRequest {
  theme?: 'dark' | 'light'
  defaultTimeRange?: string
  defaultDashboard?: string
  notifications?: {
    email: boolean
    slack: boolean
    pagerduty: boolean
  }
}

export interface UserPreferencesResponse {
  preferences: UserPreferencesRequest
  lastUpdated: Date
}

/**
 * Error Response Types
 */
export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
  requestId?: string
  stackTrace?: string // Only in development
}

/**
 * Validation Error Response
 */
export interface ValidationErrorResponse extends ErrorResponse {
  code: 'VALIDATION_ERROR'
  errors: Array<{
    field: string
    message: string
    value?: any
  }>
}

/**
 * Rate Limit Response
 */
export interface RateLimitResponse extends ErrorResponse {
  code: 'RATE_LIMIT_EXCEEDED'
  retryAfter: number // seconds
  limit: number
  remaining: number
  reset: Date
}

/**
 * Webhook Payload Types
 */
export interface WebhookPayload<T = any> {
  event: string
  timestamp: Date
  data: T
  signature?: string // HMAC signature for verification
}

export interface AlertWebhookPayload extends WebhookPayload<AlertEvent> {
  event: 'alert.triggered' | 'alert.acknowledged' | 'alert.resolved'
  rule: AlertRule
}

export interface MetricWebhookPayload extends WebhookPayload<TimeSeries> {
  event: 'metric.anomaly_detected'
  anomalies: Array<{
    timestamp: Date
    value: number
    expectedRange: [number, number]
  }>
}

/**
 * Streaming API Types (for WebSocket/SSE)
 */
export interface StreamMessage<T = any> {
  type: 'data' | 'error' | 'heartbeat'
  data?: T
  error?: ErrorResponse
  timestamp: Date
}

export interface MetricsStreamMessage extends StreamMessage<MetricPoint> {
  type: 'data'
  metricId: string
  service: string
}

export interface LogsStreamMessage extends StreamMessage<LogEntry> {
  type: 'data'
}

export interface AlertsStreamMessage extends StreamMessage<AlertEvent> {
  type: 'data'
}

/**
 * Batch Request Types
 */
export interface BatchRequest {
  requests: Array<{
    id: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    body?: any
  }>
}

export interface BatchResponse {
  responses: Array<{
    id: string
    status: number
    body: any
  }>
}

/**
 * Search/Filter API Types
 */
export interface SearchRequest {
  query: string
  filters?: FilterSet
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
  page?: number
  pageSize?: number
}

export interface SearchResponse<T = any> {
  results: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  facets?: Record<string, Array<{ value: string; count: number }>>
}

/**
 * Aggregation API Types
 */
export interface AggregationRequest {
  dataType: 'metrics' | 'traces' | 'logs'
  field: string
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'percentile'
  percentile?: number
  groupBy?: string[]
  filters?: FilterSet
  timeRange: DateRange
}

export interface AggregationResponse {
  aggregation: string
  field: string
  value?: number
  values?: Array<{
    key: string
    value: number
  }>
  buckets?: Array<{
    key: string
    count: number
    value?: number
  }>
}

/**
 * Comparison API Types
 */
export interface ComparisonRequest {
  dataType: 'metrics' | 'traces' | 'logs'
  items: string[] // IDs or names to compare
  timeRange: DateRange
  metrics?: string[] // Which metrics to compare
}

export interface ComparisonResponse {
  items: Array<{
    id: string
    name: string
    stats: Record<string, number>
  }>
  differences: Array<{
    item1: string
    item2: string
    metric: string
    difference: number
    percentChange: number
  }>
}

/**
 * Recommendation API Types
 */
export interface RecommendationRequest {
  type: 'optimization' | 'troubleshooting' | 'scaling'
  context: {
    service?: string
    metric?: string
    timeRange: DateRange
  }
}

export interface RecommendationResponse {
  recommendations: Array<{
    title: string
    description: string
    severity: 'low' | 'medium' | 'high'
    action?: string
    estimatedImpact?: string
  }>
}
