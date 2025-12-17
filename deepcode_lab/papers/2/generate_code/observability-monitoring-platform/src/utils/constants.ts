/**
 * Application-wide constants and configuration values
 * Used throughout the observability monitoring platform for consistent behavior
 */

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME_PRESETS = {
  LAST_5M: 'last_5m',
  LAST_15M: 'last_15m',
  LAST_1H: 'last_1h',
  LAST_6H: 'last_6h',
  LAST_24H: 'last_24h',
  LAST_7D: 'last_7d',
  CUSTOM: 'custom',
} as const;

export const TIME_PRESET_DURATIONS = {
  [TIME_PRESETS.LAST_5M]: 5 * 60 * 1000, // 5 minutes in ms
  [TIME_PRESETS.LAST_15M]: 15 * 60 * 1000, // 15 minutes
  [TIME_PRESETS.LAST_1H]: 60 * 60 * 1000, // 1 hour
  [TIME_PRESETS.LAST_6H]: 6 * 60 * 60 * 1000, // 6 hours
  [TIME_PRESETS.LAST_24H]: 24 * 60 * 60 * 1000, // 24 hours
  [TIME_PRESETS.LAST_7D]: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const TIME_PRESET_LABELS = {
  [TIME_PRESETS.LAST_5M]: 'Last 5 minutes',
  [TIME_PRESETS.LAST_15M]: 'Last 15 minutes',
  [TIME_PRESETS.LAST_1H]: 'Last 1 hour',
  [TIME_PRESETS.LAST_6H]: 'Last 6 hours',
  [TIME_PRESETS.LAST_24H]: 'Last 24 hours',
  [TIME_PRESETS.LAST_7D]: 'Last 7 days',
  [TIME_PRESETS.CUSTOM]: 'Custom range',
} as const;

export const DEFAULT_TIME_PRESET = TIME_PRESETS.LAST_1H;
export const DEFAULT_REFRESH_INTERVAL = 10; // seconds
export const MIN_REFRESH_INTERVAL = 5; // seconds
export const MAX_REFRESH_INTERVAL = 3600; // 1 hour
export const MAX_TIME_RANGE_DAYS = 90; // Maximum queryable time range
export const MIN_TIME_RANGE_MINUTES = 1; // Minimum queryable time range

// ============================================================================
// PAGINATION CONSTANTS
// ============================================================================

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];
export const MAX_PAGE_SIZE = 1000;
export const MIN_PAGE_SIZE = 1;

// ============================================================================
// CHART CONSTANTS
// ============================================================================

export const DEFAULT_CHART_HEIGHT = 400; // pixels
export const CHART_AGGREGATION_THRESHOLD = 1000; // points
export const CHART_MAX_AGGREGATED_POINTS = 500;
export const CHART_ANIMATION_DURATION = 500; // ms
export const CHART_RESIZE_DEBOUNCE = 300; // ms

// ============================================================================
// METRIC CONSTANTS
// ============================================================================

export const METRIC_TYPES = {
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  DISK_IO: 'disk_io',
  NETWORK_BANDWIDTH: 'network_bandwidth',
  ERROR_RATE: 'error_rate',
  SUCCESS_RATE: 'success_rate',
  RESPONSE_TIME: 'response_time',
  QPS: 'qps',
  P50_LATENCY: 'p50_latency',
  P90_LATENCY: 'p90_latency',
  P99_LATENCY: 'p99_latency',
} as const;

export const METRIC_UNITS = {
  [METRIC_TYPES.CPU_USAGE]: '%',
  [METRIC_TYPES.MEMORY_USAGE]: '%',
  [METRIC_TYPES.DISK_IO]: 'MB/s',
  [METRIC_TYPES.NETWORK_BANDWIDTH]: 'Mbps',
  [METRIC_TYPES.ERROR_RATE]: '%',
  [METRIC_TYPES.SUCCESS_RATE]: '%',
  [METRIC_TYPES.RESPONSE_TIME]: 'ms',
  [METRIC_TYPES.QPS]: 'req/s',
  [METRIC_TYPES.P50_LATENCY]: 'ms',
  [METRIC_TYPES.P90_LATENCY]: 'ms',
  [METRIC_TYPES.P99_LATENCY]: 'ms',
} as const;

export const METRIC_BOUNDS = {
  [METRIC_TYPES.CPU_USAGE]: { min: 0, max: 100 },
  [METRIC_TYPES.MEMORY_USAGE]: { min: 0, max: 100 },
  [METRIC_TYPES.DISK_IO]: { min: 0, max: 10000 },
  [METRIC_TYPES.NETWORK_BANDWIDTH]: { min: 0, max: 100000 },
  [METRIC_TYPES.ERROR_RATE]: { min: 0, max: 100 },
  [METRIC_TYPES.SUCCESS_RATE]: { min: 0, max: 100 },
  [METRIC_TYPES.RESPONSE_TIME]: { min: 0, max: 60000 },
  [METRIC_TYPES.QPS]: { min: 0, max: 1000000 },
  [METRIC_TYPES.P50_LATENCY]: { min: 0, max: 60000 },
  [METRIC_TYPES.P90_LATENCY]: { min: 0, max: 60000 },
  [METRIC_TYPES.P99_LATENCY]: { min: 0, max: 60000 },
} as const;

export const METRIC_THRESHOLDS = {
  [METRIC_TYPES.CPU_USAGE]: { warning: 70, critical: 90 },
  [METRIC_TYPES.MEMORY_USAGE]: { warning: 75, critical: 90 },
  [METRIC_TYPES.ERROR_RATE]: { warning: 1, critical: 5 },
  [METRIC_TYPES.RESPONSE_TIME]: { warning: 500, critical: 1000 },
} as const;

// ============================================================================
// ALERT CONSTANTS
// ============================================================================

export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const ALERT_SEVERITY_LEVELS = {
  [ALERT_SEVERITY.CRITICAL]: 0,
  [ALERT_SEVERITY.WARNING]: 1,
  [ALERT_SEVERITY.INFO]: 2,
} as const;

export const ALERT_CONDITIONS = {
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
} as const;

export const ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
} as const;

export const DEFAULT_ALERT_DURATION_MINUTES = 5; // Duration before alert triggers
export const ALERT_STORM_THRESHOLD = 10; // Number of alerts
export const ALERT_STORM_WINDOW_MINUTES = 1; // Time window for alert storm detection

// ============================================================================
// LOG CONSTANTS
// ============================================================================

export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
} as const;

export const LOG_LEVEL_PRIORITY = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARN]: 2,
  [LOG_LEVELS.ERROR]: 3,
  [LOG_LEVELS.FATAL]: 4,
} as const;

export const DEFAULT_LOG_PAGE_SIZE = 50;
export const MAX_LOG_CONTEXT_SIZE = 100; // Max logs to show before/after
export const LOG_SEARCH_MAX_LENGTH = 1000;

// ============================================================================
// TRACE CONSTANTS
// ============================================================================

export const TRACE_STATUS = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export const SPAN_STATUS = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
} as const;

export const DEFAULT_TRACE_LIMIT = 100;
export const SLOW_SPAN_PERCENTILE = 95; // Mark spans > P95 as slow
export const SLOW_SPAN_MULTIPLIER = 2; // Mark spans > mean + 2*stdDev as slow

// ============================================================================
// FILTER CONSTANTS
// ============================================================================

export const ENVIRONMENTS = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  TESTING: 'testing',
  DEVELOPMENT: 'development',
} as const;

export const ENVIRONMENT_LABELS = {
  [ENVIRONMENTS.PRODUCTION]: 'Production',
  [ENVIRONMENTS.STAGING]: 'Staging',
  [ENVIRONMENTS.TESTING]: 'Testing',
  [ENVIRONMENTS.DEVELOPMENT]: 'Development',
} as const;

export const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'EU (Ireland)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
];

export const AVAILABILITY_ZONES = {
  'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  'us-west-2': ['us-west-2a', 'us-west-2b', 'us-west-2c'],
  'eu-west-1': ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
  'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b'],
} as const;

// ============================================================================
// SERVICE CONSTANTS
// ============================================================================

export const SERVICE_NAMES = {
  API_SERVICE: 'api-service',
  AUTH_SERVICE: 'auth-service',
  USER_SERVICE: 'user-service',
} as const;

export const SERVICE_DISPLAY_NAMES = {
  [SERVICE_NAMES.API_SERVICE]: 'API Service',
  [SERVICE_NAMES.AUTH_SERVICE]: 'Auth Service',
  [SERVICE_NAMES.USER_SERVICE]: 'User Service',
} as const;

export const SERVICE_DESCRIPTIONS = {
  [SERVICE_NAMES.API_SERVICE]: 'Main API gateway and request router',
  [SERVICE_NAMES.AUTH_SERVICE]: 'Authentication and authorization service',
  [SERVICE_NAMES.USER_SERVICE]: 'User management and profile service',
} as const;

// ============================================================================
// THEME CONSTANTS
// ============================================================================

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
} as const;

export const DEFAULT_THEME = THEMES.DARK;

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

export const COLORS = {
  // Status colors
  SUCCESS: '#73bf69',
  WARNING: '#ff9830',
  ERROR: '#f2495c',
  INFO: '#3274d9',
  
  // Severity colors
  CRITICAL: '#f2495c',
  SEVERE: '#ff9830',
  MODERATE: '#ffd666',
  MINOR: '#73bf69',
  
  // Log level colors
  DEBUG: '#8ab4f8',
  INFO_LOG: '#3274d9',
  WARN_LOG: '#ff9830',
  ERROR_LOG: '#f2495c',
  FATAL_LOG: '#c41c3b',
  
  // Background colors
  BG_PRIMARY: '#0b0c0e',
  BG_SECONDARY: '#181b1f',
  BG_TERTIARY: '#252a2f',
  
  // Text colors
  TEXT_PRIMARY: '#d8d9da',
  TEXT_SECONDARY: '#a8abb2',
  TEXT_TERTIARY: '#7a7d84',
  
  // Border colors
  BORDER: '#3a3f47',
  BORDER_LIGHT: '#252a2f',
} as const;

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const ANIMATION_DURATIONS = {
  FAST: 150, // ms
  NORMAL: 300, // ms
  SLOW: 500, // ms
} as const;

export const ANIMATION_EASING = {
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// ============================================================================
// STORAGE CONSTANTS
// ============================================================================

export const STORAGE_KEYS = {
  THEME: 'monitoring_theme',
  TIME_RANGE: 'monitoring_time_range',
  FILTERS: 'monitoring_filters',
  DASHBOARDS: 'monitoring_dashboards',
  SIDEBAR_COLLAPSED: 'monitoring_sidebar_collapsed',
  FILTER_PRESETS: 'monitoring_filter_presets',
} as const;

export const STORAGE_TTL = {
  SESSION: 0, // No expiration (session-based)
  SHORT: 1 * 60 * 60 * 1000, // 1 hour
  MEDIUM: 24 * 60 * 60 * 1000, // 24 hours
  LONG: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION_RULES = {
  SERVICE_NAME_PATTERN: /^[a-zA-Z0-9._-]+$/,
  INSTANCE_ID_PATTERN: /^[a-zA-Z0-9._-]+$/,
  TRACE_ID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SPAN_ID_PATTERN: /^[0-9a-f]{16}$/i,
  HEX_COLOR_PATTERN: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const VALIDATION_LIMITS = {
  SERVICE_NAME_MAX: 255,
  DASHBOARD_NAME_MAX: 255,
  SEARCH_QUERY_MAX: 1000,
  TAG_KEY_MAX: 100,
  TAG_VALUE_MAX: 500,
} as const;

// ============================================================================
// PERFORMANCE CONSTANTS
// ============================================================================

export const PERFORMANCE_TARGETS = {
  FIRST_LOAD_MS: 2000,
  PAGE_TRANSITION_MS: 300,
  CHART_RENDER_MS: 500,
  DATA_REFRESH_MS: 200,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300, // ms
  FILTER: 200, // ms
  RESIZE: 300, // ms
  SCROLL: 100, // ms
} as const;

// ============================================================================
// MOCK DATA CONSTANTS
// ============================================================================

export const MOCK_DATA_CONFIG = {
  SERVICES_COUNT: 3,
  METRICS_PER_SERVICE: 9,
  TRACES_COUNT: 100,
  LOGS_COUNT: 10000,
  ALERT_RULES_COUNT: 10,
  ALERT_EVENTS_COUNT: 50,
  HISTORICAL_DAYS: 1, // 24 hours of historical data
} as const;

export const MOCK_DATA_GENERATION_TIMEOUT = 5000; // ms

// ============================================================================
// API CONSTANTS
// ============================================================================

export const API_TIMEOUT = 5000; // ms
export const API_RETRY_COUNT = 3;
export const API_RETRY_DELAY = 1000; // ms

// ============================================================================
// NOTIFICATION CONSTANTS
// ============================================================================

export const NOTIFICATION_DURATION = {
  SHORT: 3000, // ms
  NORMAL: 5000, // ms
  LONG: 10000, // ms
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// ============================================================================
// MODAL CONSTANTS
// ============================================================================

export const MODAL_Z_INDEX_BASE = 1000;
export const MODAL_BACKDROP_Z_INDEX = MODAL_Z_INDEX_BASE - 1;

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  MOBILE: 768, // px
  TABLET: 1024, // px
  DESKTOP: 1400, // px
  LARGE_DESKTOP: 1920, // px
} as const;

// ============================================================================
// SIDEBAR CONSTANTS
// ============================================================================

export const SIDEBAR_WIDTH = {
  EXPANDED: 260, // px
  COLLAPSED: 80, // px
} as const;

export const SIDEBAR_TRANSITION_DURATION = 300; // ms

// ============================================================================
// HEADER CONSTANTS
// ============================================================================

export const HEADER_HEIGHT = 60; // px

// ============================================================================
// GRID CONSTANTS
// ============================================================================

export const GRID_SPACING = 8; // px (8px grid system)
export const GRID_COLUMNS = 12; // 12-column grid

// ============================================================================
// DASHBOARD CONSTANTS
// ============================================================================

export const DASHBOARD_WIDGET_MIN_WIDTH = 2; // grid columns
export const DASHBOARD_WIDGET_MAX_WIDTH = 12; // grid columns
export const DASHBOARD_WIDGET_MIN_HEIGHT = 2; // grid rows
export const DASHBOARD_WIDGET_MAX_HEIGHT = 4; // grid rows
export const DASHBOARD_GRID_ROW_HEIGHT = 100; // px

// ============================================================================
// EXPORT
// ============================================================================

// Re-export all constants as a single object for convenience
export const CONSTANTS = {
  TIME_PRESETS,
  TIME_PRESET_DURATIONS,
  TIME_PRESET_LABELS,
  METRIC_TYPES,
  METRIC_UNITS,
  METRIC_BOUNDS,
  ALERT_SEVERITY,
  LOG_LEVELS,
  TRACE_STATUS,
  ENVIRONMENTS,
  SERVICE_NAMES,
  THEMES,
  COLORS,
  STORAGE_KEYS,
  VALIDATION_RULES,
  PERFORMANCE_TARGETS,
  BREAKPOINTS,
} as const;
