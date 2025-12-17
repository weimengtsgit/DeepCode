/**
 * Data Formatting Utilities
 * 
 * Provides comprehensive formatting functions for metrics, logs, traces,
 * timestamps, durations, bytes, percentages, and other data types used
 * throughout the observability platform.
 */

import type { MetricUnit, MetricType } from '@/types/metrics'
import type { LogLevel } from '@/types/logs'
import type { TraceStatus, SpanStatus } from '@/types/tracing'

/**
 * Format number with appropriate unit suffix (K, M, B, T)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (value === 0) return '0'
  if (!isFinite(value)) return 'N/A'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`
  }
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`
  }

  return `${sign}${absValue.toFixed(decimals)}`
}

/**
 * Format bytes to human-readable format (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'
  if (!isFinite(bytes)) return 'N/A'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(ms: number, precision: 'auto' | 'ms' | 's' | 'm' | 'h' = 'auto'): string {
  if (!isFinite(ms) || ms < 0) return 'N/A'

  if (precision === 'ms' || (precision === 'auto' && ms < 1000)) {
    return `${ms.toFixed(2)}ms`
  }

  const seconds = ms / 1000
  if (precision === 's' || (precision === 'auto' && seconds < 60)) {
    return `${seconds.toFixed(2)}s`
  }

  const minutes = seconds / 60
  if (precision === 'm' || (precision === 'auto' && minutes < 60)) {
    return `${minutes.toFixed(2)}m`
  }

  const hours = minutes / 60
  if (precision === 'h' || (precision === 'auto' && hours < 24)) {
    return `${hours.toFixed(2)}h`
  }

  const days = hours / 24
  return `${days.toFixed(2)}d`
}

/**
 * Format duration with breakdown (e.g., "2h 30m 15s")
 */
export function formatDurationDetailed(ms: number): string {
  if (!isFinite(ms) || ms < 0) return 'N/A'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours % 24 > 0) parts.push(`${hours % 24}h`)
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
  if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`)

  return parts.slice(0, 2).join(' ') // Show max 2 units
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format rate (operations per second)
 */
export function formatRate(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return 'N/A'
  return `${formatNumber(value, decimals)}/s`
}

/**
 * Format metric value based on its unit
 */
export function formatMetricValue(value: number, unit?: MetricUnit, decimals: number = 2): string {
  if (!isFinite(value)) return 'N/A'

  switch (unit) {
    case 'percent':
      return formatPercent(value, decimals)
    case 'milliseconds':
      return formatDuration(value)
    case 'bytes':
      return formatBytes(value, decimals)
    case 'rate':
    case 'ops':
      return formatRate(value, decimals)
    case 'count':
      return formatNumber(value, 0)
    default:
      return formatNumber(value, decimals)
  }
}

/**
 * Format timestamp to readable date/time string
 */
export function formatTimestamp(timestamp: number, format: 'full' | 'date' | 'time' | 'relative' = 'full'): string {
  const date = new Date(timestamp)

  if (!isFinite(timestamp) || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  switch (format) {
    case 'full':
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    case 'date':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    case 'relative':
      return formatRelativeTime(timestamp)
    default:
      return date.toISOString()
  }
}

/**
 * Format relative time (e.g., "2 minutes ago", "in 5 hours")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const absDiff = Math.abs(diff)

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const suffix = diff > 0 ? 'ago' : 'from now'

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ${suffix}`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ${suffix}`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${suffix}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${suffix}`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ${suffix}`
  if (seconds > 10) return `${seconds} second${seconds > 1 ? 's' : ''} ${suffix}`

  return 'just now'
}

/**
 * Format time range to readable string
 */
export function formatTimeRange(startTime: number, endTime: number): string {
  const duration = endTime - startTime
  const start = formatTimestamp(startTime, 'full')
  const end = formatTimestamp(endTime, 'full')

  return `${start} - ${end} (${formatDurationDetailed(duration)})`
}

/**
 * Format log level with color coding
 */
export function formatLogLevel(level: LogLevel): { text: string; color: string } {
  const colors: Record<LogLevel, string> = {
    FATAL: '#f2495c',
    ERROR: '#ff7383',
    WARN: '#ff9830',
    INFO: '#5794f2',
    DEBUG: '#b877d9',
    TRACE: '#9fa7b3',
  }

  return {
    text: level,
    color: colors[level] || '#9fa7b3',
  }
}

/**
 * Format trace status with color coding
 */
export function formatTraceStatus(status: TraceStatus): { text: string; color: string } {
  const statusMap: Record<TraceStatus, { text: string; color: string }> = {
    success: { text: 'Success', color: '#73bf69' },
    error: { text: 'Error', color: '#f2495c' },
    timeout: { text: 'Timeout', color: '#ff9830' },
    cancelled: { text: 'Cancelled', color: '#9fa7b3' },
    unknown: { text: 'Unknown', color: '#6e7681' },
  }

  return statusMap[status] || statusMap.unknown
}

/**
 * Format span status with color coding
 */
export function formatSpanStatus(status: SpanStatus): { text: string; color: string } {
  const statusMap: Record<SpanStatus, { text: string; color: string }> = {
    ok: { text: 'OK', color: '#73bf69' },
    error: { text: 'Error', color: '#f2495c' },
    unset: { text: 'Unset', color: '#9fa7b3' },
  }

  return statusMap[status] || statusMap.unset
}

/**
 * Format change percentage with sign and color
 */
export function formatChange(current: number, previous: number): { text: string; color: string; isIncrease: boolean } {
  if (!isFinite(current) || !isFinite(previous) || previous === 0) {
    return { text: 'N/A', color: '#9fa7b3', isIncrease: false }
  }

  const change = ((current - previous) / previous) * 100
  const isIncrease = change > 0
  const sign = isIncrease ? '+' : ''
  const color = isIncrease ? '#f2495c' : '#73bf69' // Red for increase (bad), green for decrease (good)

  return {
    text: `${sign}${change.toFixed(2)}%`,
    color,
    isIncrease,
  }
}

/**
 * Format latency percentile label
 */
export function formatPercentile(percentile: number): string {
  if (percentile === 50) return 'P50 (Median)'
  if (percentile === 90) return 'P90'
  if (percentile === 95) return 'P95'
  if (percentile === 99) return 'P99'
  return `P${percentile}`
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number = 50, ellipsis: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Format JSON with syntax highlighting (returns HTML string)
 */
export function formatJSON(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent)
  } catch (error) {
    return String(obj)
  }
}

/**
 * Format stack trace for display
 */
export function formatStackTrace(stackTrace: string): string[] {
  return stackTrace
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/**
 * Format HTTP status code with description
 */
export function formatHttpStatus(statusCode: number): { text: string; color: string; description: string } {
  const statusDescriptions: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }

  const description = statusDescriptions[statusCode] || 'Unknown'
  let color = '#9fa7b3'

  if (statusCode >= 200 && statusCode < 300) {
    color = '#73bf69' // Success - green
  } else if (statusCode >= 300 && statusCode < 400) {
    color = '#5794f2' // Redirect - blue
  } else if (statusCode >= 400 && statusCode < 500) {
    color = '#ff9830' // Client error - orange
  } else if (statusCode >= 500) {
    color = '#f2495c' // Server error - red
  }

  return {
    text: `${statusCode}`,
    color,
    description,
  }
}

/**
 * Format metric type to display name
 */
export function formatMetricType(metricType: MetricType): string {
  const typeMap: Record<string, string> = {
    qps: 'QPS',
    rps: 'RPS',
    tps: 'TPS',
    error_rate: 'Error Rate',
    latency: 'Latency',
    p50: 'P50 Latency',
    p90: 'P90 Latency',
    p95: 'P95 Latency',
    p99: 'P99 Latency',
    throughput: 'Throughput',
    success_rate: 'Success Rate',
    availability: 'Availability',
    cpu_usage: 'CPU Usage',
    memory_usage: 'Memory Usage',
    disk_usage: 'Disk Usage',
    disk_io_read: 'Disk I/O Read',
    disk_io_write: 'Disk I/O Write',
    network_in: 'Network In',
    network_out: 'Network Out',
    connection_count: 'Connection Count',
    thread_count: 'Thread Count',
    gc_count: 'GC Count',
    gc_time: 'GC Time',
  }

  return typeMap[metricType] || metricType
}

/**
 * Format large numbers with commas
 */
export function formatWithCommas(value: number): string {
  if (!isFinite(value)) return 'N/A'
  return value.toLocaleString('en-US')
}

/**
 * Format uptime duration
 */
export function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Format service name to display name
 */
export function formatServiceName(serviceName: string): string {
  return serviceName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format environment name with color
 */
export function formatEnvironment(env: string): { text: string; color: string } {
  const envMap: Record<string, { text: string; color: string }> = {
    production: { text: 'Production', color: '#f2495c' },
    staging: { text: 'Staging', color: '#ff9830' },
    development: { text: 'Development', color: '#5794f2' },
    test: { text: 'Test', color: '#b877d9' },
  }

  return envMap[env] || { text: env, color: '#9fa7b3' }
}

/**
 * Format file size for export
 */
export function formatFileSize(bytes: number): string {
  return formatBytes(bytes, 1)
}

/**
 * Format query execution time
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
