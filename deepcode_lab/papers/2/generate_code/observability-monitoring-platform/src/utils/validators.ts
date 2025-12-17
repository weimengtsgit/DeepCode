/**
 * Input validation utilities for the observability monitoring platform
 * Provides validation rules for filters, time ranges, metric values, and user inputs
 */

import type { FilterSet, DateRange, TimePreset } from '@/types'

/**
 * Validates a time range object
 * @param range - DateRange object with start and end dates
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateTimeRange(range: DateRange): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!range.start || !range.end) {
    errors.push('Start and end dates are required')
    return { valid: false, errors }
  }

  if (!(range.start instanceof Date) || !(range.end instanceof Date)) {
    errors.push('Start and end must be Date objects')
    return { valid: false, errors }
  }

  if (range.start >= range.end) {
    errors.push('Start date must be before end date')
  }

  const maxDuration = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds
  const duration = range.end.getTime() - range.start.getTime()
  if (duration > maxDuration) {
    errors.push('Time range cannot exceed 90 days')
  }

  if (duration < 60000) {
    // Less than 1 minute
    errors.push('Time range must be at least 1 minute')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a time preset value
 * @param preset - TimePreset string to validate
 * @returns boolean indicating if preset is valid
 */
export function validateTimePreset(preset: TimePreset): boolean {
  const validPresets: TimePreset[] = [
    'last_5m',
    'last_15m',
    'last_1h',
    'last_6h',
    'last_24h',
    'last_7d',
    'custom',
  ]
  return validPresets.includes(preset)
}

/**
 * Validates a filter set object
 * @param filters - FilterSet object to validate
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateFilters(filters: FilterSet): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!filters || typeof filters !== 'object') {
    errors.push('Filters must be an object')
    return { valid: false, errors }
  }

  // Validate service filter
  if (filters.service) {
    if (!Array.isArray(filters.service)) {
      errors.push('Service filter must be an array')
    } else if (filters.service.length > 0) {
      if (!filters.service.every((s) => typeof s === 'string' && s.length > 0)) {
        errors.push('All service values must be non-empty strings')
      }
    }
  }

  // Validate environment filter
  if (filters.environment) {
    if (!Array.isArray(filters.environment)) {
      errors.push('Environment filter must be an array')
    } else {
      const validEnvs = ['production', 'staging', 'testing', 'development']
      if (!filters.environment.every((e) => validEnvs.includes(e))) {
        errors.push('Invalid environment value. Must be one of: production, staging, testing, development')
      }
    }
  }

  // Validate region filter
  if (filters.region) {
    if (!Array.isArray(filters.region)) {
      errors.push('Region filter must be an array')
    } else if (filters.region.length > 0) {
      if (!filters.region.every((r) => typeof r === 'string' && r.length > 0)) {
        errors.push('All region values must be non-empty strings')
      }
    }
  }

  // Validate instance filter
  if (filters.instance) {
    if (!Array.isArray(filters.instance)) {
      errors.push('Instance filter must be an array')
    } else if (filters.instance.length > 0) {
      if (!filters.instance.every((i) => typeof i === 'string' && i.length > 0)) {
        errors.push('All instance values must be non-empty strings')
      }
    }
  }

  // Validate tags filter
  if (filters.tags) {
    if (typeof filters.tags !== 'object' || Array.isArray(filters.tags)) {
      errors.push('Tags filter must be an object')
    } else {
      for (const [key, values] of Object.entries(filters.tags)) {
        if (!Array.isArray(values)) {
          errors.push(`Tag values for key "${key}" must be an array`)
        } else if (values.length > 0) {
          if (!values.every((v) => typeof v === 'string' && v.length > 0)) {
            errors.push(`All tag values for key "${key}" must be non-empty strings`)
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a metric value against expected bounds
 * @param value - Numeric value to validate
 * @param metricType - Type of metric (cpu, memory, error_rate, latency, etc.)
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateMetricValue(
  value: number,
  metricType: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push('Metric value must be a valid number')
    return { valid: false, errors }
  }

  if (!isFinite(value)) {
    errors.push('Metric value must be finite')
    return { valid: false, errors }
  }

  // Validate based on metric type
  switch (metricType) {
    case 'cpu':
    case 'memory':
    case 'disk':
    case 'error_rate':
    case 'success_rate':
      if (value < 0 || value > 100) {
        errors.push(`${metricType} must be between 0 and 100`)
      }
      break

    case 'latency':
    case 'response_time':
      if (value < 0) {
        errors.push(`${metricType} cannot be negative`)
      }
      if (value > 3600000) {
        // More than 1 hour
        errors.push(`${metricType} seems unreasonably high (> 1 hour)`)
      }
      break

    case 'throughput':
    case 'qps':
      if (value < 0) {
        errors.push(`${metricType} cannot be negative`)
      }
      break

    default:
      if (value < 0) {
        errors.push('Metric value cannot be negative')
      }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a service name
 * @param serviceName - Service name to validate
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateServiceName(serviceName: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!serviceName || typeof serviceName !== 'string') {
    errors.push('Service name must be a non-empty string')
    return { valid: false, errors }
  }

  if (serviceName.length < 1) {
    errors.push('Service name cannot be empty')
  }

  if (serviceName.length > 255) {
    errors.push('Service name cannot exceed 255 characters')
  }

  if (!/^[a-zA-Z0-9\-_.]+$/.test(serviceName)) {
    errors.push('Service name can only contain alphanumeric characters, hyphens, underscores, and dots')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a trace ID
 * @param traceId - Trace ID to validate
 * @returns boolean indicating if trace ID is valid
 */
export function validateTraceId(traceId: string): boolean {
  if (!traceId || typeof traceId !== 'string') {
    return false
  }

  // UUID v4 format: 8-4-4-4-12 hex digits
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(traceId)
}

/**
 * Validates a span ID
 * @param spanId - Span ID to validate
 * @returns boolean indicating if span ID is valid
 */
export function validateSpanId(spanId: string): boolean {
  if (!spanId || typeof spanId !== 'string') {
    return false
  }

  // Span ID is typically a 16-character hex string
  const spanIdRegex = /^[0-9a-f]{16}$/i
  return spanIdRegex.test(spanId)
}

/**
 * Validates a log level
 * @param level - Log level to validate
 * @returns boolean indicating if log level is valid
 */
export function validateLogLevel(level: string): boolean {
  const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
  return validLevels.includes(level.toUpperCase())
}

/**
 * Validates an alert severity
 * @param severity - Alert severity to validate
 * @returns boolean indicating if severity is valid
 */
export function validateAlertSeverity(severity: string): boolean {
  const validSeverities = ['critical', 'warning', 'info']
  return validSeverities.includes(severity.toLowerCase())
}

/**
 * Validates a refresh interval in seconds
 * @param seconds - Refresh interval in seconds
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateRefreshInterval(seconds: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof seconds !== 'number' || isNaN(seconds)) {
    errors.push('Refresh interval must be a valid number')
    return { valid: false, errors }
  }

  if (seconds < 5) {
    errors.push('Refresh interval must be at least 5 seconds')
  }

  if (seconds > 3600) {
    errors.push('Refresh interval cannot exceed 1 hour')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a page number and size for pagination
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validatePagination(page: number, pageSize: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Number.isInteger(page) || page < 1) {
    errors.push('Page must be a positive integer')
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    errors.push('Page size must be a positive integer')
  }

  if (pageSize > 1000) {
    errors.push('Page size cannot exceed 1000')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a dashboard name
 * @param name - Dashboard name to validate
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateDashboardName(name: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!name || typeof name !== 'string') {
    errors.push('Dashboard name must be a non-empty string')
    return { valid: false, errors }
  }

  if (name.length < 1) {
    errors.push('Dashboard name cannot be empty')
  }

  if (name.length > 255) {
    errors.push('Dashboard name cannot exceed 255 characters')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a search query
 * @param query - Search query string to validate
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateSearchQuery(query: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof query !== 'string') {
    errors.push('Search query must be a string')
    return { valid: false, errors }
  }

  if (query.length > 1000) {
    errors.push('Search query cannot exceed 1000 characters')
  }

  // Check for potentially problematic regex patterns
  if (query.includes('(?') && query.includes(')')) {
    // Warn about advanced regex features
    errors.push('Advanced regex features may not be supported')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a JSON string
 * @param jsonString - JSON string to validate
 * @returns Object with { valid: boolean, errors: string[], parsed?: any }
 */
export function validateJSON(jsonString: string): { valid: boolean; errors: string[]; parsed?: any } {
  const errors: string[] = []
  let parsed: any

  if (typeof jsonString !== 'string') {
    errors.push('Input must be a string')
    return { valid: false, errors }
  }

  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { valid: false, errors }
  }

  return { valid: true, errors, parsed }
}

/**
 * Validates an email address (basic validation)
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates a URL
 * @param url - URL string to validate
 * @returns boolean indicating if URL is valid
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates a color hex code
 * @param color - Hex color code to validate
 * @returns boolean indicating if color is valid
 */
export function validateHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false
  }

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}
