/**
 * Formatting utilities for displaying metrics, timestamps, and numbers
 * Used throughout the platform for consistent data presentation
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

dayjs.extend(relativeTime)
dayjs.extend(utc)

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    return dayjs(date).fromNow()
  } catch {
    return 'Unknown'
  }
}

/**
 * Format timestamp as readable date/time (e.g., "Jan 15, 2024 14:30:45")
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    return dayjs(date).format('MMM DD, YYYY HH:mm:ss')
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format timestamp as date only (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string | number): string {
  try {
    return dayjs(date).format('MMM DD, YYYY')
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format timestamp as time only (e.g., "14:30:45")
 */
export function formatTime(date: Date | string | number): string {
  try {
    return dayjs(date).format('HH:mm:ss')
  } catch {
    return 'Invalid time'
  }
}

/**
 * Format timestamp as ISO 8601 string (e.g., "2024-01-15T14:30:45Z")
 */
export function formatISO(date: Date | string | number): string {
  try {
    return dayjs(date).toISOString()
  } catch {
    return ''
  }
}

/**
 * Format timestamp as short time (e.g., "14:30")
 */
export function formatTimeShort(date: Date | string | number): string {
  try {
    return dayjs(date).format('HH:mm')
  } catch {
    return 'Invalid time'
  }
}

/**
 * Format duration in milliseconds to human-readable format
 * Examples: "100ms", "1.5s", "2m 30s", "1h 15m"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  
  const minutes = seconds / 60
  if (minutes < 60) {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  
  const hours = minutes / 60
  if (hours < 24) {
    const hrs = Math.floor(hours)
    const mins = Math.round((hours - hrs) * 60)
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }
  
  const days = hours / 24
  const d = Math.floor(days)
  const h = Math.round((days - d) * 24)
  return h > 0 ? `${d}d ${h}h` : `${d}d`
}

/**
 * Format number with appropriate unit suffix
 * Examples: 1000 -> "1.0K", 1000000 -> "1.0M", 1000000000 -> "1.0B"
 */
export function formatNumberWithUnit(value: number, decimals: number = 1): string {
  if (value === 0) return '0'
  if (!isFinite(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
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
 * Format metric value with appropriate unit
 * Examples: 100 (ms) -> "100ms", 0.5 (%) -> "0.5%", 1024 (bytes) -> "1.0KB"
 */
export function formatMetricValue(value: number, unit: string = '', decimals: number = 2): string {
  if (value === null || value === undefined) return 'N/A'
  if (!isFinite(value)) return 'N/A'
  
  let formatted: string
  
  // Handle specific units
  switch (unit.toLowerCase()) {
    case 'ms':
    case 'milliseconds':
      formatted = `${value.toFixed(decimals)}ms`
      break
    case '%':
    case 'percent':
      formatted = `${value.toFixed(decimals)}%`
      break
    case 'bytes':
    case 'b':
      formatted = formatBytes(value)
      break
    case 'mbps':
    case 'bandwidth':
      formatted = `${value.toFixed(decimals)}Mbps`
      break
    case 'req/s':
    case 'rps':
    case 'requests':
      formatted = `${value.toFixed(decimals)}req/s`
      break
    case 'ops/s':
    case 'ops':
      formatted = `${value.toFixed(decimals)}ops/s`
      break
    case 'count':
    case '':
      formatted = value.toFixed(decimals)
      break
    default:
      formatted = `${value.toFixed(decimals)}${unit}`
  }
  
  return formatted
}

/**
 * Format bytes to human-readable size
 * Examples: 1024 -> "1.0KB", 1048576 -> "1.0MB"
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0B'
  if (!isFinite(bytes)) return 'N/A'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  
  if (i >= sizes.length) {
    return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(decimals)}${sizes[sizes.length - 1]}`
  }
  
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)}${sizes[i]}`
}

/**
 * Format percentage value
 * Examples: 0.5 -> "0.50%", 95.123 -> "95.12%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with thousand separators
 * Examples: 1000 -> "1,000", 1000000 -> "1,000,000"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (!isFinite(value)) return 'N/A'
  
  const parts = value.toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return parts.join('.')
}

/**
 * Format latency/response time with appropriate unit
 * Examples: 10 -> "10ms", 1500 -> "1.5s", 65000 -> "1m 5s"
 */
export function formatLatency(ms: number, decimals: number = 1): string {
  if (ms < 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(decimals)}s`
  
  const minutes = seconds / 60
  if (minutes < 60) {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  
  const hours = minutes / 60
  const hrs = Math.floor(hours)
  const mins = Math.round((hours - hrs) * 60)
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

/**
 * Format error rate as percentage
 * Examples: 0.005 -> "0.50%", 0.1 -> "10.00%"
 */
export function formatErrorRate(rate: number, decimals: number = 2): string {
  if (!isFinite(rate)) return 'N/A'
  const percentage = rate * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Format throughput (requests per second)
 * Examples: 100 -> "100 req/s", 1500 -> "1.5K req/s"
 */
export function formatThroughput(rps: number, decimals: number = 1): string {
  if (!isFinite(rps)) return 'N/A'
  
  if (rps >= 1000) {
    return `${(rps / 1000).toFixed(decimals)}K req/s`
  }
  
  return `${rps.toFixed(decimals)} req/s`
}

/**
 * Format CPU usage percentage
 * Examples: 50 -> "50%", 95.5 -> "95.5%"
 */
export function formatCPU(percentage: number, decimals: number = 1): string {
  if (!isFinite(percentage)) return 'N/A'
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Format memory usage
 * Examples: 1024 -> "1.0MB", 1048576 -> "1.0GB"
 */
export function formatMemory(bytes: number, decimals: number = 1): string {
  return formatBytes(bytes, decimals)
}

/**
 * Format time range as readable string
 * Examples: {start: Date, end: Date} -> "Jan 15, 14:30 - Jan 15, 15:30"
 */
export function formatTimeRange(start: Date | string | number, end: Date | string | number): string {
  try {
    const startDay = dayjs(start).format('MMM DD')
    const startTime = dayjs(start).format('HH:mm')
    const endDay = dayjs(end).format('MMM DD')
    const endTime = dayjs(end).format('HH:mm')
    
    if (startDay === endDay) {
      return `${startDay}, ${startTime} - ${endTime}`
    }
    
    return `${startDay} ${startTime} - ${endDay} ${endTime}`
  } catch {
    return 'Invalid range'
  }
}

/**
 * Format time range as compact string
 * Examples: {start: Date, end: Date} -> "01/15 14:30 - 01/15 15:30"
 */
export function formatTimeRangeCompact(start: Date | string | number, end: Date | string | number): string {
  try {
    const startStr = dayjs(start).format('MM/DD HH:mm')
    const endStr = dayjs(end).format('MM/DD HH:mm')
    return `${startStr} - ${endStr}`
  } catch {
    return 'Invalid range'
  }
}

/**
 * Format duration between two dates
 * Examples: (start, end) -> "2h 30m", "5d 3h"
 */
export function formatDateDuration(start: Date | string | number, end: Date | string | number): string {
  try {
    const ms = dayjs(end).diff(dayjs(start), 'millisecond')
    return formatDuration(ms)
  } catch {
    return 'Invalid duration'
  }
}

/**
 * Truncate string to max length with ellipsis
 * Examples: ("Hello World", 8) -> "Hello..."
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return `${str.substring(0, maxLength - 3)}...`
}

/**
 * Format service name for display
 * Examples: "api-service" -> "API Service", "user_service" -> "User Service"
 */
export function formatServiceName(serviceName: string): string {
  if (!serviceName) return ''
  
  return serviceName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format operation name for display
 * Examples: "POST /api/users" -> "POST /api/users", "validate-token" -> "Validate Token"
 */
export function formatOperationName(operation: string): string {
  if (!operation) return ''
  
  // If it looks like HTTP method + path, return as-is
  if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//.test(operation)) {
    return operation
  }
  
  // Otherwise, convert to title case
  return operation
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format log level for display with consistent casing
 * Examples: "ERROR" -> "Error", "debug" -> "Debug"
 */
export function formatLogLevel(level: string): string {
  if (!level) return ''
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
}

/**
 * Format alert severity for display
 * Examples: "critical" -> "Critical", "warning" -> "Warning"
 */
export function formatSeverity(severity: string): string {
  if (!severity) return ''
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()
}

/**
 * Format status for display
 * Examples: "success" -> "Success", "error" -> "Error"
 */
export function formatStatus(status: string): string {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

/**
 * Format trace ID for display (truncate if too long)
 * Examples: "abc123def456..." (first 12 chars + ellipsis)
 */
export function formatTraceId(traceId: string): string {
  if (!traceId) return ''
  return truncateString(traceId, 12)
}

/**
 * Format span ID for display (truncate if too long)
 */
export function formatSpanId(spanId: string): string {
  if (!spanId) return ''
  return truncateString(spanId, 12)
}

/**
 * Format user ID for display
 */
export function formatUserId(userId: string | number): string {
  if (!userId) return 'Unknown'
  return String(userId)
}

/**
 * Format instance ID for display
 * Examples: "i-1234567890abcdef0" -> "i-1234567890..."
 */
export function formatInstanceId(instanceId: string): string {
  if (!instanceId) return ''
  return truncateString(instanceId, 16)
}

/**
 * Format region name for display
 * Examples: "us-east-1" -> "US East (N. Virginia)"
 */
export function formatRegion(region: string): string {
  const regionMap: Record<string, string> = {
    'us-east-1': 'US East (N. Virginia)',
    'us-east-2': 'US East (Ohio)',
    'us-west-1': 'US West (N. California)',
    'us-west-2': 'US West (Oregon)',
    'eu-west-1': 'EU (Ireland)',
    'eu-central-1': 'EU (Frankfurt)',
    'ap-southeast-1': 'Asia Pacific (Singapore)',
    'ap-northeast-1': 'Asia Pacific (Tokyo)',
  }
  
  return regionMap[region] || region
}

/**
 * Format environment name for display
 * Examples: "production" -> "Production", "staging" -> "Staging"
 */
export function formatEnvironment(env: string): string {
  if (!env) return ''
  return env.charAt(0).toUpperCase() + env.slice(1).toLowerCase()
}

/**
 * Format boolean value for display
 * Examples: true -> "Yes", false -> "No"
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No'
}

/**
 * Format JSON object for display (pretty-printed)
 */
export function formatJSON(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent)
  } catch {
    return 'Invalid JSON'
  }
}

/**
 * Format array as comma-separated string
 * Examples: ['a', 'b', 'c'] -> "a, b, c"
 */
export function formatArray(arr: any[], separator: string = ', '): string {
  if (!Array.isArray(arr)) return ''
  return arr.map(item => String(item)).join(separator)
}

/**
 * Format key-value pairs as readable string
 * Examples: {a: 1, b: 2} -> "a: 1, b: 2"
 */
export function formatKeyValuePairs(obj: Record<string, any>, separator: string = ', '): string {
  if (!obj || typeof obj !== 'object') return ''
  
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(separator)
}

/**
 * Format number as ordinal (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(num: number): string {
  const j = num % 10
  const k = num % 100
  
  if (j === 1 && k !== 11) return `${num}st`
  if (j === 2 && k !== 12) return `${num}nd`
  if (j === 3 && k !== 13) return `${num}rd`
  
  return `${num}th`
}

/**
 * Format percentile value (e.g., "P50", "P99")
 */
export function formatPercentile(percentile: number): string {
  return `P${percentile}`
}

/**
 * Format confidence score as percentage
 * Examples: 0.95 -> "95%", 0.5 -> "50%"
 */
export function formatConfidence(score: number, decimals: number = 0): string {
  if (!isFinite(score)) return 'N/A'
  return `${(score * 100).toFixed(decimals)}%`
}
