/**
 * Logs Service Layer
 * Provides business logic for log searching, filtering, field extraction, and statistics
 * 
 * Core Responsibilities:
 * - Advanced log search with regex and keyword matching
 * - Multi-dimensional filtering (service, level, traceId, time range)
 * - Field extraction from log messages using regex patterns
 * - Log context retrieval (surrounding logs)
 * - Statistics aggregation (counts by level, by service, trends)
 * - Log correlation with traces
 */

import type {
  LogEntry,
  LogLevel,
  LogStatistics,
  FilterSet,
  DateRange,
} from '@/types'

/**
 * Log search query parsed structure
 */
interface ParsedLogQuery {
  keywords: string[]
  fields: Record<string, string[]>
  operators: Record<string, 'AND' | 'OR'>
  isRegex: boolean
}

/**
 * Log field extraction patterns
 */
interface LogFieldPatterns {
  [key: string]: RegExp
}

/**
 * Log statistics result
 */
interface LogStatisticsResult {
  totalCount: number
  countByLevel: Record<LogLevel, number>
  countByService: Record<string, number>
  countTrend: Array<{ timestamp: Date; count: number }>
  topErrors: Array<{ message: string; count: number }>
  topServices: Array<{ service: string; count: number }>
  errorRate: number
  avgLogsPerMinute: number
}

/**
 * Logs Service - Business logic for log operations
 */
export class LogsService {
  /**
   * Default field extraction patterns for common log formats
   */
  private static readonly DEFAULT_PATTERNS: LogFieldPatterns = {
    timestamp: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,
    level: /\b(DEBUG|INFO|WARN|ERROR|FATAL)\b/i,
    service: /service[=:\s]+([a-zA-Z0-9\-_]+)/i,
    userId: /user[=:\s]+([a-zA-Z0-9\-_]+)/i,
    requestId: /request[=:\s]+([a-zA-Z0-9\-_]+)/i,
    traceId: /trace[=:\s]+([a-zA-Z0-9\-_]+)/i,
    spanId: /span[=:\s]+([a-zA-Z0-9\-_]+)/i,
    statusCode: /status[=:\s]+(\d{3})/,
    duration: /duration[=:\s]+(\d+)ms/i,
    error: /error[=:\s]+([^\s,]+)/i,
  }

  /**
   * Search logs with advanced query support
   * Supports: keywords, field:value syntax, regex patterns
   * 
   * @param logs - Array of log entries to search
   * @param query - Search query string (keywords, field:value, regex)
   * @param filters - Optional additional filters (service, level, traceId)
   * @returns Matching log entries
   */
  static search(
    logs: LogEntry[],
    query: string,
    filters?: Partial<FilterSet>
  ): LogEntry[] {
    if (!query && !filters) {
      return logs
    }

    const parsed = this.parseQuery(query)

    return logs.filter((log) => {
      // Apply keyword search
      if (parsed.keywords.length > 0) {
        const keywordMatch = parsed.keywords.some((keyword) => {
          try {
            if (parsed.isRegex) {
              const regex = new RegExp(keyword, 'i')
              return regex.test(log.message)
            } else {
              return log.message.toLowerCase().includes(keyword.toLowerCase())
            }
          } catch {
            // Invalid regex, fall back to string matching
            return log.message.toLowerCase().includes(keyword.toLowerCase())
          }
        })

        if (!keywordMatch) {
          return false
        }
      }

      // Apply field filters
      for (const [field, values] of Object.entries(parsed.fields)) {
        const logValue = this.extractFieldValue(log, field)
        if (logValue && !values.includes(logValue)) {
          return false
        }
      }

      // Apply global filters
      if (filters?.service && filters.service.length > 0) {
        if (!filters.service.includes(log.service)) {
          return false
        }
      }

      if (filters?.tags) {
        for (const [key, filterValues] of Object.entries(filters.tags)) {
          const logTagValue = log.context?.[key]
          if (logTagValue && !filterValues.includes(String(logTagValue))) {
            return false
          }
        }
      }

      return true
    })
  }

  /**
   * Filter logs by level
   * 
   * @param logs - Array of log entries
   * @param levels - Log levels to include
   * @returns Filtered log entries
   */
  static filterByLevel(logs: LogEntry[], levels: LogLevel[]): LogEntry[] {
    if (!levels || levels.length === 0) {
      return logs
    }
    return logs.filter((log) => levels.includes(log.level))
  }

  /**
   * Filter logs by service
   * 
   * @param logs - Array of log entries
   * @param services - Service names to include
   * @returns Filtered log entries
   */
  static filterByService(logs: LogEntry[], services: string[]): LogEntry[] {
    if (!services || services.length === 0) {
      return logs
    }
    return logs.filter((log) => services.includes(log.service))
  }

  /**
   * Filter logs by trace ID
   * 
   * @param logs - Array of log entries
   * @param traceId - Trace ID to match
   * @returns Filtered log entries
   */
  static filterByTraceId(logs: LogEntry[], traceId: string): LogEntry[] {
    if (!traceId) {
      return logs
    }
    return logs.filter((log) => log.traceId === traceId)
  }

  /**
   * Filter logs by time range
   * 
   * @param logs - Array of log entries
   * @param timeRange - Start and end dates
   * @returns Filtered log entries
   */
  static filterByTimeRange(
    logs: LogEntry[],
    timeRange: DateRange
  ): LogEntry[] {
    if (!timeRange.start || !timeRange.end) {
      return logs
    }

    const startTime = timeRange.start.getTime()
    const endTime = timeRange.end.getTime()

    return logs.filter((log) => {
      const logTime = log.timestamp.getTime()
      return logTime >= startTime && logTime <= endTime
    })
  }

  /**
   * Get surrounding logs (context) for a specific log entry
   * 
   * @param logs - Array of all log entries (must be sorted by timestamp)
   * @param logId - ID of the log entry to get context for
   * @param contextSize - Number of logs before and after (default: 5)
   * @returns Array of surrounding logs including the target log
   */
  static getLogContext(
    logs: LogEntry[],
    logId: string,
    contextSize: number = 5
  ): LogEntry[] {
    const index = logs.findIndex((log) => log.id === logId)
    if (index === -1) {
      return []
    }

    const start = Math.max(0, index - contextSize)
    const end = Math.min(logs.length, index + contextSize + 1)

    return logs.slice(start, end)
  }

  /**
   * Extract field values from log message using regex patterns
   * 
   * @param log - Log entry to extract fields from
   * @param patterns - Optional custom regex patterns (uses defaults if not provided)
   * @returns Object with extracted field values
   */
  static extractFields(
    log: LogEntry,
    patterns?: LogFieldPatterns
  ): Record<string, string> {
    const patternMap = patterns || LogsService.DEFAULT_PATTERNS
    const fields: Record<string, string> = {}

    for (const [fieldName, pattern] of Object.entries(patternMap)) {
      try {
        const match = log.message.match(pattern)
        if (match && match[1]) {
          fields[fieldName] = match[1]
        }
      } catch {
        // Invalid regex, skip this field
      }
    }

    return fields
  }

  /**
   * Calculate log statistics for a set of logs
   * 
   * @param logs - Array of log entries
   * @param timeRange - Optional time range for trend calculation
   * @returns Statistics object with counts, distributions, and trends
   */
  static calculateStatistics(
    logs: LogEntry[],
    timeRange?: DateRange
  ): LogStatisticsResult {
    const countByLevel: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    }

    const countByService: Record<string, number> = {}
    const errorMessages: Record<string, number> = {}
    let errorCount = 0

    // Count by level and service
    logs.forEach((log) => {
      countByLevel[log.level]++
      countByService[log.service] = (countByService[log.service] || 0) + 1

      if (log.level === 'ERROR' || log.level === 'FATAL') {
        errorCount++
        errorMessages[log.message] = (errorMessages[log.message] || 0) + 1
      }
    })

    // Calculate trend (logs per minute)
    const countTrend = this.calculateTrend(logs, timeRange)

    // Get top errors
    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }))

    // Get top services
    const topServices = Object.entries(countByService)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([service, count]) => ({ service, count }))

    // Calculate error rate
    const errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0

    // Calculate average logs per minute
    let avgLogsPerMinute = 0
    if (timeRange && logs.length > 0) {
      const durationMs = timeRange.end.getTime() - timeRange.start.getTime()
      const durationMinutes = durationMs / (1000 * 60)
      avgLogsPerMinute = logs.length / durationMinutes
    }

    return {
      totalCount: logs.length,
      countByLevel,
      countByService,
      countTrend,
      topErrors,
      topServices,
      errorRate,
      avgLogsPerMinute,
    }
  }

  /**
   * Highlight search matches in log message
   * 
   * @param message - Log message text
   * @param query - Search query to highlight
   * @returns HTML string with highlighted matches
   */
  static highlightMatches(message: string, query: string): string {
    if (!query) {
      return message
    }

    try {
      // Try to use query as regex
      const regex = new RegExp(`(${query})`, 'gi')
      return message.replace(regex, '<mark>$1</mark>')
    } catch {
      // Fall back to literal string matching
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'gi')
      return message.replace(regex, '<mark>$&</mark>')
    }
  }

  /**
   * Parse advanced log search query
   * Supports: keywords, field:value syntax, regex patterns
   * 
   * @param query - Search query string
   * @returns Parsed query structure
   */
  private static parseQuery(query: string): ParsedLogQuery {
    const keywords: string[] = []
    const fields: Record<string, string[]> = {}
    const isRegex = query.startsWith('/') && query.endsWith('/')

    if (isRegex) {
      // Extract regex pattern (remove leading/trailing slashes)
      keywords.push(query.slice(1, -1))
      return { keywords, fields, operators: {}, isRegex: true }
    }

    // Parse field:value syntax and keywords
    const parts = query.split(/\s+/)
    for (const part of parts) {
      if (part.includes(':')) {
        const [field, value] = part.split(':')
        if (!fields[field]) {
          fields[field] = []
        }
        fields[field].push(value)
      } else if (part) {
        keywords.push(part)
      }
    }

    return { keywords, fields, operators: {}, isRegex: false }
  }

  /**
   * Extract a specific field value from a log entry
   * 
   * @param log - Log entry
   * @param field - Field name to extract
   * @returns Field value or undefined
   */
  private static extractFieldValue(log: LogEntry, field: string): string | undefined {
    switch (field.toLowerCase()) {
      case 'level':
        return log.level
      case 'service':
        return log.service
      case 'traceid':
        return log.traceId || undefined
      case 'spanid':
        return log.spanId || undefined
      case 'userid':
        return log.context?.userId?.toString()
      case 'requestid':
        return log.context?.requestId
      case 'environment':
        return log.context?.environment
      case 'region':
        return log.context?.region
      default:
        return undefined
    }
  }

  /**
   * Calculate log count trend over time
   * Groups logs into time buckets and counts per bucket
   * 
   * @param logs - Array of log entries
   * @param timeRange - Optional time range for bucketing
   * @returns Array of {timestamp, count} objects
   */
  private static calculateTrend(
    logs: LogEntry[],
    timeRange?: DateRange
  ): Array<{ timestamp: Date; count: number }> {
    if (logs.length === 0) {
      return []
    }

    // Determine bucket size (5 minutes for 1-hour range, 1 hour for 24h range, etc)
    let bucketSizeMs = 5 * 60 * 1000 // 5 minutes default

    if (timeRange) {
      const durationMs = timeRange.end.getTime() - timeRange.start.getTime()
      if (durationMs > 24 * 60 * 60 * 1000) {
        bucketSizeMs = 60 * 60 * 1000 // 1 hour for >24h
      } else if (durationMs > 6 * 60 * 60 * 1000) {
        bucketSizeMs = 30 * 60 * 1000 // 30 minutes for >6h
      }
    }

    // Group logs into buckets
    const buckets: Record<number, number> = {}
    const startTime = timeRange?.start || logs[0].timestamp
    const endTime = timeRange?.end || logs[logs.length - 1].timestamp

    logs.forEach((log) => {
      const bucketKey = Math.floor(
        (log.timestamp.getTime() - startTime.getTime()) / bucketSizeMs
      )
      buckets[bucketKey] = (buckets[bucketKey] || 0) + 1
    })

    // Convert to array of {timestamp, count}
    const trend: Array<{ timestamp: Date; count: number }> = []
    for (let i = 0; i <= Math.floor((endTime.getTime() - startTime.getTime()) / bucketSizeMs); i++) {
      const timestamp = new Date(startTime.getTime() + i * bucketSizeMs)
      const count = buckets[i] || 0
      trend.push({ timestamp, count })
    }

    return trend
  }
}

/**
 * Export service instance for use throughout the application
 */
export const logsService = new LogsService()
