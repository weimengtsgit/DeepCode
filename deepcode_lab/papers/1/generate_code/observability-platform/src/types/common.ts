/**
 * Common Type Definitions
 * Core interfaces and types used across all modules
 */

/**
 * Time range selection state
 * Used by time picker and all data fetching operations
 */
export interface TimeRange {
  startTime: Date
  endTime: Date
  quickRange?: QuickRangeType
  isRealtime: boolean
  refreshInterval: number // milliseconds
  comparisonEnabled: boolean
}

/**
 * Quick time range presets
 */
export type QuickRangeType = '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | 'custom'

/**
 * Quick range configuration
 */
export interface QuickRangeConfig {
  label: string
  value: QuickRangeType
  duration: number // milliseconds
}

/**
 * Multi-dimensional filter state
 * Applied across metrics, traces, and logs
 */
export interface FilterState {
  selectedServices: string[]
  selectedEnvironment: string | null
  selectedRegion: string | null
  selectedTags: string[]
  customFilters: Record<string, any>
}

/**
 * Filter preset for saving/loading
 */
export interface FilterPreset {
  id: string
  name: string
  filters: FilterState
  createdAt: Date
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert status
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved'
}

/**
 * Alert data structure
 */
export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  service: string
  metric?: string
  threshold?: number
  currentValue?: number
  startTime: Date
  endTime?: Date
  acknowledgedBy?: string
  acknowledgedAt?: Date
  tags: string[]
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  service: string
  metric: string
  condition: AlertCondition
  threshold: number
  duration: number // seconds - how long condition must be true
  severity: AlertSeverity
  notificationChannels: string[]
}

/**
 * Alert condition operators
 */
export enum AlertCondition {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  GREATER_EQUAL = 'gte',
  LESS_EQUAL = 'lte'
}

/**
 * Service health status
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  FAULT = 'fault',
  UNKNOWN = 'unknown'
}

/**
 * Service health information
 */
export interface ServiceHealth {
  serviceName: string
  status: ServiceStatus
  errorRate: number
  avgResponseTime: number
  qps: number
  lastCheck: Date
  incidents: number
}

/**
 * Environment types
 */
export type Environment = 'production' | 'staging' | 'development' | 'test'

/**
 * Region types
 */
export type Region = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1'

/**
 * Data loading state
 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  status: LoadingState
  error?: string
  timestamp: Date
}

/**
 * Pagination state
 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Chart threshold line
 */
export interface ChartThreshold {
  value: number
  label: string
  color: string
  lineStyle?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Chart data point (generic)
 */
export interface DataPoint {
  timestamp: number
  value: number
  label?: string
}

/**
 * Time series data
 */
export interface TimeSeries {
  name: string
  data: DataPoint[]
  unit?: string
  color?: string
}

/**
 * Comparison data for time range comparison
 */
export interface ComparisonData<T> {
  current: T
  previous?: T
  percentChange?: number
}

/**
 * Dashboard widget type
 */
export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  METRIC_CARD = 'metric_card',
  ALERT_PANEL = 'alert_panel',
  TABLE = 'table',
  HEATMAP = 'heatmap'
}

/**
 * Dashboard widget configuration
 */
export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  service?: string
  metric?: string
  chartType?: string
  thresholds?: ChartThreshold[]
  refreshInterval?: number
  customOptions?: Record<string, any>
}

/**
 * Dashboard layout item (for vue-grid-layout)
 */
export interface LayoutItem {
  i: string // widget id
  x: number
  y: number
  w: number // width in grid units
  h: number // height in grid units
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

/**
 * Custom dashboard configuration
 */
export interface Dashboard {
  id: string
  name: string
  description?: string
  layout: LayoutItem[]
  widgets: WidgetConfig[]
  createdAt: Date
  updatedAt: Date
  isTemplate?: boolean
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'dark' | 'light'
  defaultTimeRange: QuickRangeType
  defaultRefreshInterval: number
  favoriteServices: string[]
  savedFilters: FilterPreset[]
  dashboards: Dashboard[]
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  enabled: boolean
  channels: NotificationChannel[]
  quietHours?: {
    start: string // HH:mm format
    end: string
  }
}

/**
 * Notification channel types
 */
export enum NotificationChannelType {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms'
}

/**
 * Notification channel
 */
export interface NotificationChannel {
  id: string
  type: NotificationChannelType
  name: string
  config: Record<string, any>
  enabled: boolean
}

/**
 * Error boundary error info
 */
export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: Date
}

/**
 * Chart resize event
 */
export interface ChartResizeEvent {
  width: number
  height: number
}

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'csv' | 'png' | 'pdf'

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat
  filename: string
  includeTimestamp: boolean
  dateRange?: TimeRange
}
