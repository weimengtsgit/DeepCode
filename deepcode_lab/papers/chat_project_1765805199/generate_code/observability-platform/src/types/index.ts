/**
 * Core Type Definitions - Observability Platform
 * 
 * Central type definitions for the entire monitoring platform.
 * Exports all domain-specific types and common interfaces.
 */

// Re-export domain-specific types
export * from './metrics'
export * from './tracing'
export * from './logs'

/**
 * Common Types
 */

// Time range configuration
export interface TimeRange {
  start: number // Unix timestamp (ms)
  end: number // Unix timestamp (ms)
  label?: string // Display label (e.g., "Last 15 minutes")
}

// Quick time range options
export type QuickTimeRange = 
  | '5m' 
  | '15m' 
  | '30m' 
  | '1h' 
  | '3h' 
  | '6h' 
  | '12h' 
  | '24h' 
  | '7d' 
  | '30d'
  | 'custom'

// Service information
export interface Service {
  id: string
  name: string
  displayName: string
  description?: string
  environment: Environment
  region: Region
  status: ServiceStatus
  tags: string[]
  metadata?: Record<string, any>
}

// Environment types
export type Environment = 'production' | 'staging' | 'development' | 'test'

// Region types
export type Region = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1' | 'cn-north-1'

// Service status
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

// Alert severity levels
export type AlertSeverity = 'critical' | 'warning' | 'info'

// Alert status
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged'

// Alert interface
export interface Alert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  status: AlertStatus
  service: string
  timestamp: number
  resolvedAt?: number
  acknowledgedAt?: number
  acknowledgedBy?: string
  labels: Record<string, string>
  annotations: Record<string, string>
  value?: number
  threshold?: number
}

// Filter configuration
export interface FilterConfig {
  services: string[]
  environments: Environment[]
  regions: Region[]
  tags: string[]
  searchQuery?: string
}

// Chart data point
export interface DataPoint {
  timestamp: number
  value: number
  label?: string
}

// Time series data
export interface TimeSeries {
  name: string
  data: DataPoint[]
  unit?: string
  color?: string
}

// Chart configuration
export interface ChartConfig {
  title?: string
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'heatmap'
  height?: number
  width?: number
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  animation?: boolean
  theme?: 'dark' | 'light'
}

// Dashboard widget configuration
export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'alert' | 'status' | 'custom'
  title: string
  config: Record<string, any>
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
  dataSource?: string
  refreshInterval?: number
}

// Dashboard configuration
export interface DashboardConfig {
  id: string
  name: string
  description?: string
  widgets: DashboardWidget[]
  layout: 'grid' | 'flex'
  createdAt: number
  updatedAt: number
  isDefault?: boolean
}

// Pagination
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

// Sort configuration
export interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

// API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: number
}

// List response with pagination
export interface ListResponse<T> {
  items: T[]
  pagination: Pagination
  filters?: FilterConfig
  sort?: SortConfig
}

// Statistics
export interface Statistics {
  count: number
  sum?: number
  avg?: number
  min?: number
  max?: number
  p50?: number
  p90?: number
  p95?: number
  p99?: number
}

// Health check result
export interface HealthCheck {
  service: string
  status: ServiceStatus
  timestamp: number
  checks: {
    name: string
    status: 'pass' | 'fail' | 'warn'
    message?: string
    duration?: number
  }[]
  uptime?: number
  version?: string
}

// User preferences
export interface UserPreferences {
  theme: 'dark' | 'light'
  timezone: string
  dateFormat: string
  defaultTimeRange: QuickTimeRange
  refreshInterval: number
  dashboardLayout?: string
  favoriteServices: string[]
}

// Navigation item
export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: number
  children?: NavItem[]
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string
  path?: string
}

// Loading state
export interface LoadingState {
  isLoading: boolean
  error?: Error | string
  lastUpdated?: number
}

// Error details
export interface ErrorDetails {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: number
  stack?: string
}

// Export utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Color palette for status mapping
export const STATUS_COLORS = {
  healthy: '#73bf69',
  degraded: '#ff9830',
  down: '#f2495c',
  unknown: '#6e7681',
  critical: '#f2495c',
  warning: '#ff9830',
  info: '#5794f2',
  success: '#73bf69',
  error: '#f2495c',
} as const

// Chart color palette
export const CHART_COLORS = [
  '#5470c6', // Blue
  '#91cc75', // Green
  '#fac858', // Yellow
  '#ee6666', // Red
  '#73c0de', // Cyan
  '#3ba272', // Dark green
  '#fc8452', // Orange
  '#9a60b4', // Purple
] as const

// Time range presets (in milliseconds)
export const TIME_RANGE_PRESETS: Record<QuickTimeRange, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'custom': 0,
} as const

// Refresh interval options (in milliseconds)
export const REFRESH_INTERVALS = {
  off: 0,
  '5s': 5 * 1000,
  '10s': 10 * 1000,
  '30s': 30 * 1000,
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
} as const

// Default values
export const DEFAULTS = {
  timeRange: '15m' as QuickTimeRange,
  refreshInterval: 30 * 1000, // 30 seconds
  pageSize: 20,
  chartHeight: 300,
  animationDuration: 300,
} as const
