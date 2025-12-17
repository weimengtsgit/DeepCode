/**
 * Mock Data Constants
 * Defines all constants, configurations, and data used by mock data generators
 * and the mock API service for the observability monitoring platform.
 */

import { ServiceDefinition, MetricConfig } from '@/types'

/**
 * Service Definitions
 * Three microservices for the demo platform
 */
export const SERVICES: ServiceDefinition[] = [
  {
    id: 'api-service',
    name: 'api-service',
    displayName: 'API Service',
    description: 'Main API gateway and request router',
    instances: ['api-1', 'api-2', 'api-3'],
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy'
  },
  {
    id: 'auth-service',
    name: 'auth-service',
    displayName: 'Auth Service',
    description: 'Authentication and authorization service',
    instances: ['auth-1', 'auth-2'],
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy'
  },
  {
    id: 'user-service',
    name: 'user-service',
    displayName: 'User Service',
    description: 'User management and profile service',
    instances: ['user-1', 'user-2', 'user-3'],
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy'
  }
]

/**
 * Metric Configurations
 * Defines parameters for realistic time-series generation
 */
export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  CPU_USAGE: {
    baseValue: 50,
    amplitude: 20,
    period: 5,
    noise: 0.1,
    trend: 0.1,
    anomalyProb: 0.05,
    anomalyMag: 3,
    minValue: 0,
    maxValue: 100
  },
  MEMORY_USAGE: {
    baseValue: 60,
    amplitude: 15,
    period: 8,
    noise: 0.08,
    trend: 0.05,
    anomalyProb: 0.02,
    anomalyMag: 2,
    minValue: 0,
    maxValue: 100
  },
  ERROR_RATE: {
    baseValue: 0.5,
    amplitude: 0.3,
    period: 10,
    noise: 0.1,
    trend: 0,
    anomalyProb: 0.02,
    anomalyMag: 5,
    minValue: 0,
    maxValue: 10
  },
  RESPONSE_TIME: {
    baseValue: 100,
    amplitude: 30,
    period: 8,
    noise: 0.15,
    trend: 2,
    anomalyProb: 0.01,
    anomalyMag: 10,
    minValue: 10,
    maxValue: 5000
  },
  QPS: {
    baseValue: 1000,
    amplitude: 300,
    period: 6,
    noise: 0.12,
    trend: 0,
    anomalyProb: 0.03,
    anomalyMag: 2,
    minValue: 100,
    maxValue: 5000
  },
  DISK_IO: {
    baseValue: 30,
    amplitude: 15,
    period: 12,
    noise: 0.1,
    trend: 0,
    anomalyProb: 0.01,
    anomalyMag: 4,
    minValue: 0,
    maxValue: 100
  },
  NETWORK_BANDWIDTH: {
    baseValue: 40,
    amplitude: 20,
    period: 7,
    noise: 0.12,
    trend: 0,
    anomalyProb: 0.02,
    anomalyMag: 3,
    minValue: 0,
    maxValue: 100
  },
  SUCCESS_RATE: {
    baseValue: 99.5,
    amplitude: 0.3,
    period: 10,
    noise: 0.05,
    trend: 0,
    anomalyProb: 0.01,
    anomalyMag: 5,
    minValue: 90,
    maxValue: 100
  },
  P50_LATENCY: {
    baseValue: 50,
    amplitude: 15,
    period: 8,
    noise: 0.1,
    trend: 1,
    anomalyProb: 0.01,
    anomalyMag: 5,
    minValue: 10,
    maxValue: 1000
  },
  P90_LATENCY: {
    baseValue: 150,
    amplitude: 40,
    period: 8,
    noise: 0.12,
    trend: 2,
    anomalyProb: 0.01,
    anomalyMag: 8,
    minValue: 50,
    maxValue: 3000
  },
  P99_LATENCY: {
    baseValue: 300,
    amplitude: 80,
    period: 8,
    noise: 0.15,
    trend: 3,
    anomalyProb: 0.01,
    anomalyMag: 10,
    minValue: 100,
    maxValue: 5000
  }
}

/**
 * Service Operations
 * Realistic operation names for each service
 */
export const SERVICE_OPERATIONS: Record<string, string[]> = {
  'api-service': [
    'POST /api/users',
    'GET /api/users/:id',
    'PUT /api/users/:id',
    'DELETE /api/users/:id',
    'GET /api/health',
    'POST /api/login',
    'POST /api/logout',
    'GET /api/profile'
  ],
  'auth-service': [
    'validate-token',
    'refresh-token',
    'create-session',
    'revoke-session',
    'check-permissions',
    'verify-mfa',
    'authenticate-user'
  ],
  'user-service': [
    'create-user',
    'update-user',
    'delete-user',
    'get-user-profile',
    'list-users',
    'update-preferences',
    'get-user-settings',
    'change-password'
  ]
}

/**
 * Log Message Templates
 * Realistic log messages for different severity levels
 */
export const LOG_MESSAGE_TEMPLATES: Record<string, string[]> = {
  DEBUG: [
    'Method {method} called with params {params}',
    'Cache hit for key {key}',
    'Database connection pool available: {count}',
    'Processing request {requestId} from {source}',
    'Query execution time: {duration}ms',
    'Serializing response object',
    'Deserializing request payload'
  ],
  INFO: [
    'Request {id} received from {source}',
    'User {userId} logged in successfully',
    'Batch job {jobId} started',
    'Service health check passed for {service}',
    'Configuration reloaded successfully',
    'Database migration completed',
    'Cache invalidated for {key}'
  ],
  WARN: [
    'Retry attempt {attempt}/{max} for operation {op}',
    'High memory usage: {percent}%',
    'API response time elevated: {ms}ms',
    'Database connection slow: {ms}ms',
    'Cache miss rate high: {percent}%',
    'Deprecated API endpoint called: {endpoint}',
    'Request timeout approaching: {ms}ms'
  ],
  ERROR: [
    'Failed to connect to database: {error}',
    'Timeout on API call to {service}: {ms}ms',
    'Authentication failed for user {userId}',
    'Payment processing failed: {error}',
    'File upload failed: {error}',
    'Email delivery failed: {error}',
    'External service unavailable: {service}'
  ],
  FATAL: [
    'Critical service degradation detected',
    'Data corruption detected in {component}',
    'System out of memory, shutting down',
    'Unrecoverable error in core component',
    'Database connection pool exhausted',
    'Critical security breach detected',
    'System panic: {error}'
  ]
}

/**
 * Alert Rule Templates
 * Pre-defined alert rules for common monitoring scenarios
 */
export const ALERT_RULE_TEMPLATES = [
  {
    name: 'High Error Rate',
    metric: 'ERROR_RATE',
    condition: 'greater_than',
    threshold: 5,
    duration: 5,
    severity: 'critical'
  },
  {
    name: 'High Response Time',
    metric: 'RESPONSE_TIME',
    condition: 'greater_than',
    threshold: 500,
    duration: 5,
    severity: 'warning'
  },
  {
    name: 'High CPU Usage',
    metric: 'CPU_USAGE',
    condition: 'greater_than',
    threshold: 80,
    duration: 5,
    severity: 'warning'
  },
  {
    name: 'High Memory Usage',
    metric: 'MEMORY_USAGE',
    condition: 'greater_than',
    threshold: 85,
    duration: 5,
    severity: 'warning'
  },
  {
    name: 'Low Success Rate',
    metric: 'SUCCESS_RATE',
    condition: 'less_than',
    threshold: 95,
    duration: 5,
    severity: 'critical'
  },
  {
    name: 'High P99 Latency',
    metric: 'P99_LATENCY',
    condition: 'greater_than',
    threshold: 1000,
    duration: 5,
    severity: 'warning'
  },
  {
    name: 'High Disk I/O',
    metric: 'DISK_IO',
    condition: 'greater_than',
    threshold: 80,
    duration: 5,
    severity: 'warning'
  },
  {
    name: 'High Network Bandwidth',
    metric: 'NETWORK_BANDWIDTH',
    condition: 'greater_than',
    threshold: 80,
    duration: 5,
    severity: 'info'
  }
]

/**
 * Mock Data Generation Configuration
 */
export const MOCK_DATA_CONFIG = {
  // Time range for historical data
  historicalDataDays: 1,
  
  // Metrics configuration
  metricsPerService: 11,
  metricsDataPointsPerDay: 1440, // 1 point per minute
  
  // Traces configuration
  tracesPerDay: 500,
  spansPerTrace: { min: 3, max: 15 },
  traceErrorRate: 0.05,
  
  // Logs configuration
  logsPerDay: 100000,
  baseLogsPerMinute: 70,
  peakHoursMultiplier: 1.5,
  offHoursMultiplier: 0.3,
  errorRateNormal: 0.005,
  errorRatePeak: 0.1,
  traceIdProbability: 0.2,
  
  // Alerts configuration
  alertRulesCount: 8,
  alertEventsPerDay: 50,
  alertAverageDurationMinutes: 30
}

/**
 * Peak Hours Configuration
 * UTC hours when traffic is higher
 */
export const PEAK_HOURS = [
  [9, 12],   // 9 AM - 12 PM UTC
  [14, 17]   // 2 PM - 5 PM UTC
]

/**
 * Regions and Availability Zones
 */
export const REGIONS = [
  {
    id: 'us-east-1',
    name: 'US East (N. Virginia)',
    zones: ['us-east-1a', 'us-east-1b', 'us-east-1c']
  },
  {
    id: 'us-west-2',
    name: 'US West (Oregon)',
    zones: ['us-west-2a', 'us-west-2b', 'us-west-2c']
  },
  {
    id: 'eu-west-1',
    name: 'EU (Ireland)',
    zones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c']
  },
  {
    id: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    zones: ['ap-southeast-1a', 'ap-southeast-1b']
  }
]

/**
 * Environments
 */
export const ENVIRONMENTS = ['production', 'staging', 'testing', 'development']

/**
 * Log Levels
 */
export const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']

/**
 * Log Level Distribution
 * Probability distribution for log levels
 */
export const LOG_LEVEL_DISTRIBUTION = {
  DEBUG: 0.05,
  INFO: 0.50,
  WARN: 0.30,
  ERROR: 0.14,
  FATAL: 0.01
}

/**
 * Trace Status Values
 */
export const TRACE_STATUSES = ['SUCCESS', 'ERROR', 'TIMEOUT']

/**
 * Span Status Values
 */
export const SPAN_STATUSES = ['SUCCESS', 'ERROR', 'TIMEOUT', 'CANCELLED']

/**
 * Alert Severity Levels
 */
export const ALERT_SEVERITIES = ['critical', 'warning', 'info']

/**
 * Alert Status Values
 */
export const ALERT_STATUSES = ['active', 'acknowledged', 'resolved']

/**
 * Time Presets
 */
export const TIME_PRESETS = {
  LAST_5M: 'last_5m',
  LAST_15M: 'last_15m',
  LAST_1H: 'last_1h',
  LAST_6H: 'last_6h',
  LAST_24H: 'last_24h',
  LAST_7D: 'last_7d',
  CUSTOM: 'custom'
}

/**
 * Time Preset Durations (in milliseconds)
 */
export const TIME_PRESET_DURATIONS: Record<string, number> = {
  [TIME_PRESETS.LAST_5M]: 5 * 60 * 1000,
  [TIME_PRESETS.LAST_15M]: 15 * 60 * 1000,
  [TIME_PRESETS.LAST_1H]: 60 * 60 * 1000,
  [TIME_PRESETS.LAST_6H]: 6 * 60 * 60 * 1000,
  [TIME_PRESETS.LAST_24H]: 24 * 60 * 60 * 1000,
  [TIME_PRESETS.LAST_7D]: 7 * 24 * 60 * 60 * 1000
}

/**
 * Metric Units
 */
export const METRIC_UNITS: Record<string, string> = {
  CPU_USAGE: '%',
  MEMORY_USAGE: '%',
  ERROR_RATE: '%',
  RESPONSE_TIME: 'ms',
  QPS: 'req/s',
  DISK_IO: '%',
  NETWORK_BANDWIDTH: 'Mbps',
  SUCCESS_RATE: '%',
  P50_LATENCY: 'ms',
  P90_LATENCY: 'ms',
  P99_LATENCY: 'ms'
}

/**
 * Metric Display Names
 */
export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  CPU_USAGE: 'CPU Usage',
  MEMORY_USAGE: 'Memory Usage',
  ERROR_RATE: 'Error Rate',
  RESPONSE_TIME: 'Response Time',
  QPS: 'Requests Per Second',
  DISK_IO: 'Disk I/O',
  NETWORK_BANDWIDTH: 'Network Bandwidth',
  SUCCESS_RATE: 'Success Rate',
  P50_LATENCY: 'P50 Latency',
  P90_LATENCY: 'P90 Latency',
  P99_LATENCY: 'P99 Latency'
}

/**
 * Default Configuration Values
 */
export const DEFAULT_CONFIG = {
  timePreset: TIME_PRESETS.LAST_1H,
  refreshInterval: 10, // seconds
  pageSize: 50,
  logPageSize: 50,
  chartHeight: 400,
  maxDataPoints: 1000,
  aggregationThreshold: 1000,
  debounceDelay: 500,
  throttleDelay: 1000
}

/**
 * Validation Limits
 */
export const VALIDATION_LIMITS = {
  maxServiceNameLength: 255,
  maxOperationNameLength: 255,
  maxLogMessageLength: 10000,
  maxSearchQueryLength: 1000,
  maxDashboardNameLength: 255,
  maxAlertRuleNameLength: 255,
  minRefreshInterval: 5,
  maxRefreshInterval: 3600,
  maxTimeRangeDays: 90,
  minTimeRangeMinutes: 1
}

/**
 * Performance Targets (in milliseconds)
 */
export const PERFORMANCE_TARGETS = {
  firstContentfulPaint: 2000,
  timeToInteractive: 2000,
  pageTransition: 300,
  chartRender: 500,
  dataRefresh: 200,
  apiTimeout: 5000
}

/**
 * Color Palette
 */
export const COLOR_PALETTE = {
  // Status colors
  success: '#73bf69',
  warning: '#ff9830',
  error: '#f2495c',
  info: '#3274d9',
  
  // Background colors
  bgPrimary: '#0b0c0e',
  bgSecondary: '#181b1f',
  bgTertiary: '#252a33',
  
  // Text colors
  textPrimary: '#d8d9da',
  textSecondary: '#a8adb5',
  textTertiary: '#7a8089',
  
  // Border colors
  border: '#3a3f47',
  borderLight: '#4a5058',
  
  // Chart colors
  chartColors: [
    '#3274d9',
    '#73bf69',
    '#ff9830',
    '#f2495c',
    '#9830ff',
    '#30ffff',
    '#ffb830',
    '#ff30b8'
  ]
}

/**
 * Animation Durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000
}

/**
 * Responsive Breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1400,
  ultraWide: 1920
}

/**
 * Layout Dimensions
 */
export const LAYOUT_DIMENSIONS = {
  headerHeight: 60,
  sidebarWidthExpanded: 260,
  sidebarWidthCollapsed: 80,
  gridSpacing: 8,
  gridColumns: 12
}

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  theme: 'monitoring_theme',
  timeRange: 'monitoring_time_range',
  filters: 'monitoring_filters',
  dashboards: 'monitoring_dashboards',
  preferences: 'monitoring_preferences',
  sidebarCollapsed: 'monitoring_sidebar_collapsed'
}

/**
 * Export all constants as a single object
 */
export const CONSTANTS = {
  SERVICES,
  METRIC_CONFIGS,
  SERVICE_OPERATIONS,
  LOG_MESSAGE_TEMPLATES,
  ALERT_RULE_TEMPLATES,
  MOCK_DATA_CONFIG,
  PEAK_HOURS,
  REGIONS,
  ENVIRONMENTS,
  LOG_LEVELS,
  LOG_LEVEL_DISTRIBUTION,
  TRACE_STATUSES,
  SPAN_STATUSES,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  TIME_PRESETS,
  TIME_PRESET_DURATIONS,
  METRIC_UNITS,
  METRIC_DISPLAY_NAMES,
  DEFAULT_CONFIG,
  VALIDATION_LIMITS,
  PERFORMANCE_TARGETS,
  COLOR_PALETTE,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  LAYOUT_DIMENSIONS,
  STORAGE_KEYS
}
