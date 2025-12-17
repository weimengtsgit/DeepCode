/**
 * Pre-generated sample log data for all services
 * Provides realistic log streams with time-based density variation, error clustering, and cross-module correlation
 * 
 * Data Structure:
 * - 3 services (api-service, auth-service, user-service)
 * - 24-hour historical data (100,000+ log entries)
 * - Realistic distribution: 50% INFO, 30% WARN, 15% ERROR, 5% DEBUG, 1% FATAL
 * - Business hour peaks (9-12, 14-17 UTC) with 1.5x density
 * - Error clustering (occasional bursts with elevated error rate)
 * - 20% of logs linked to traces for cross-module navigation
 */

import { LogEntry, LogLevel } from '@/types'
import { generateUUID, randomInt, randomFloat, selectRandom, isBusinessHour, getHourUTC, isWeekend } from '@/mock/generators/utils'
import { SERVICES, MOCK_DATA_CONFIG, LOG_MESSAGE_TEMPLATES, PEAK_HOURS } from '@/mock/constants'

/**
 * Generate realistic log entries for a service over a time range
 * Uses Poisson distribution for inter-arrival times and time-based density variation
 */
function generateServiceLogs(
  serviceId: string,
  serviceName: string,
  startTime: Date,
  endTime: Date,
  baseFrequencyPerMinute: number = 10
): LogEntry[] {
  const logs: LogEntry[] = []
  let currentTime = new Date(startTime)
  let isErrorCluster = false
  let clusterEndTime = currentTime

  const timeRangeMs = endTime.getTime() - startTime.getTime()
  const timeRangeMinutes = timeRangeMs / (60 * 1000)
  const expectedLogCount = Math.ceil(timeRangeMinutes * baseFrequencyPerMinute)

  // Generate logs with Poisson-like distribution
  for (let i = 0; i < expectedLogCount && currentTime < endTime; i++) {
    // Calculate density based on time of day
    const hourUTC = getHourUTC(currentTime)
    const isPeakHour = PEAK_HOURS.some(([start, end]) => hourUTC >= start && hourUTC < end)
    const isWeekendDay = isWeekend(currentTime)

    let densityMultiplier = 1.0
    if (isPeakHour) {
      densityMultiplier = 1.5 // Business hours: 1.5x baseline
    } else if (hourUTC >= 0 && hourUTC < 7) {
      densityMultiplier = 0.3 // Night hours: 0.3x baseline
    } else if (isWeekendDay) {
      densityMultiplier = 0.6 // Weekend: 0.6x baseline
    }

    // Poisson inter-arrival time (exponential distribution)
    const interArrivalSeconds = Math.ceil(
      (60 / (baseFrequencyPerMinute * densityMultiplier)) * (Math.random() + 0.5)
    )
    currentTime = new Date(currentTime.getTime() + interArrivalSeconds * 1000)

    if (currentTime > endTime) break

    // Error clustering: occasional bursts with elevated error rate
    if (Math.random() < 0.01) {
      // 1% chance to start error cluster
      isErrorCluster = true
      clusterEndTime = new Date(currentTime.getTime() + randomInt(5, 15) * 60 * 1000)
    }

    if (currentTime > clusterEndTime) {
      isErrorCluster = false
    }

    // Determine log level with bias towards errors during clusters
    const errorRate = isErrorCluster ? 0.1 : 0.005 // 10% during cluster, 0.5% normal
    const logLevel = selectLogLevel(errorRate)

    // Create log entry
    const log: LogEntry = {
      id: generateUUID(),
      timestamp: new Date(currentTime),
      service: serviceName,
      level: logLevel,
      message: generateLogMessage(serviceName, logLevel),
      traceId: Math.random() < 0.2 ? generateUUID() : undefined, // 20% correlation with traces
      spanId: Math.random() < 0.1 ? generateUUID() : undefined, // 10% have span ID
      context: {
        userId: randomInt(1, 10000),
        requestId: generateUUID(),
        instanceId: selectRandom(SERVICES.find(s => s.id === serviceId)?.instances || []),
        environment: 'production',
        region: 'us-east-1'
      },
      stacktrace: logLevel === 'ERROR' || logLevel === 'FATAL' ? generateStackTrace() : undefined
    }

    logs.push(log)
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Select log level based on error rate probability
 */
function selectLogLevel(errorRate: number): LogLevel {
  const random = Math.random()

  if (random < errorRate * 0.7) {
    return 'ERROR' // 70% of errors
  } else if (random < errorRate * 0.85) {
    return 'WARN' // 15% of errors
  } else if (random < errorRate + 0.3) {
    return 'INFO' // Main log type
  } else if (random < errorRate + 0.5) {
    return 'DEBUG' // Detailed debugging
  } else {
    return 'FATAL' // Rare critical failures
  }
}

/**
 * Generate realistic log message based on service and level
 */
function generateLogMessage(serviceName: string, level: LogLevel): string {
  const templates = LOG_MESSAGE_TEMPLATES[level] || []
  if (templates.length === 0) return `[${level}] Unknown event`

  const template = selectRandom(templates)

  // Replace placeholders with realistic values
  return template
    .replace('{method}', selectRandom(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']))
    .replace('{params}', `{id: ${randomInt(1, 1000)}, action: 'update'}`)
    .replace('{key}', `user:${randomInt(1, 10000)}`)
    .replace('{count}', String(randomInt(5, 50)))
    .replace('{id}', generateUUID().substring(0, 8))
    .replace('{source}', selectRandom(['192.168.1.1', '10.0.0.1', '172.16.0.1']))
    .replace('{userId}', String(randomInt(1, 10000)))
    .replace('{jobId}', `job-${randomInt(1000, 9999)}`)
    .replace('{service}', serviceName)
    .replace('{percent}', String(randomInt(50, 95)))
    .replace('{ms}', String(randomInt(100, 5000)))
    .replace('{attempt}', String(randomInt(1, 3)))
    .replace('{max}', '3')
    .replace('{op}', selectRandom(['database_query', 'api_call', 'cache_lookup']))
    .replace('{error}', selectRandom(['Connection timeout', 'Invalid credentials', 'Resource not found']))
    .replace('{component}', selectRandom(['auth_module', 'database_layer', 'cache_service']))
}

/**
 * Generate realistic stack trace for error logs
 */
function generateStackTrace(): string {
  const functions = [
    'handleRequest',
    'processData',
    'validateInput',
    'executeQuery',
    'formatResponse',
    'authenticateUser',
    'authorizeAccess'
  ]

  const lines = [
    `Error: ${selectRandom(['Connection failed', 'Invalid state', 'Timeout exceeded', 'Permission denied'])}`,
    `    at ${selectRandom(functions)} (${selectRandom(['service.ts', 'handler.ts', 'middleware.ts'])}:${randomInt(10, 500)}:${randomInt(1, 50)})`,
    `    at ${selectRandom(functions)} (${selectRandom(['service.ts', 'handler.ts', 'middleware.ts'])}:${randomInt(10, 500)}:${randomInt(1, 50)})`,
    `    at ${selectRandom(functions)} (${selectRandom(['service.ts', 'handler.ts', 'middleware.ts'])}:${randomInt(10, 500)}:${randomInt(1, 50)})`
  ]

  return lines.join('\n')
}

/**
 * Calculate statistics from log array
 */
function calculateLogStatistics(logs: LogEntry[]) {
  const levelCounts = {
    DEBUG: 0,
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    FATAL: 0
  }

  const serviceCounts: Record<string, number> = {}
  const hourlyTrend: Record<number, number> = {}

  logs.forEach(log => {
    levelCounts[log.level]++

    if (!serviceCounts[log.service]) {
      serviceCounts[log.service] = 0
    }
    serviceCounts[log.service]++

    const hour = log.timestamp.getUTCHours()
    if (!hourlyTrend[hour]) {
      hourlyTrend[hour] = 0
    }
    hourlyTrend[hour]++
  })

  return {
    totalCount: logs.length,
    countByLevel: levelCounts,
    countByService: serviceCounts,
    hourlyTrend,
    errorRate: (levelCounts.ERROR + levelCounts.FATAL) / logs.length
  }
}

/**
 * Generate all sample logs for all services
 */
function generateAllLogs(): LogEntry[] {
  const now = new Date()
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

  const allLogs: LogEntry[] = []

  // Generate logs for each service
  SERVICES.forEach(service => {
    const serviceLogs = generateServiceLogs(
      service.id,
      service.name,
      startTime,
      now,
      MOCK_DATA_CONFIG.baseLogFrequencyPerMinute || 10
    )
    allLogs.push(...serviceLogs)
  })

  // Sort by timestamp
  return allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Pre-generate all sample logs
const allLogs = generateAllLogs()

/**
 * Get all logs
 */
export function getAllLogs(): LogEntry[] {
  return allLogs
}

/**
 * Get logs for a specific service
 */
export function getLogsForService(serviceName: string): LogEntry[] {
  return allLogs.filter(log => log.service === serviceName)
}

/**
 * Get logs by level
 */
export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return allLogs.filter(log => log.level === level)
}

/**
 * Get logs by time range
 */
export function getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
  return allLogs.filter(
    log => log.timestamp >= startTime && log.timestamp <= endTime
  )
}

/**
 * Get logs by trace ID
 */
export function getLogsByTraceId(traceId: string): LogEntry[] {
  return allLogs.filter(log => log.traceId === traceId)
}

/**
 * Get log statistics
 */
export function getLogStatistics() {
  return calculateLogStatistics(allLogs)
}

/**
 * Get paginated logs
 */
export function getPaginatedLogs(page: number = 1, pageSize: number = 50): {
  logs: LogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
} {
  const total = allLogs.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  return {
    logs: allLogs.slice(startIndex, endIndex),
    total,
    page,
    pageSize,
    totalPages
  }
}

/**
 * Search logs by query
 */
export function searchLogs(query: string, filters?: {
  service?: string
  level?: LogLevel
  startTime?: Date
  endTime?: Date
}): LogEntry[] {
  let results = allLogs

  // Apply filters
  if (filters?.service) {
    results = results.filter(log => log.service === filters.service)
  }

  if (filters?.level) {
    results = results.filter(log => log.level === filters.level)
  }

  if (filters?.startTime) {
    results = results.filter(log => log.timestamp >= filters.startTime!)
  }

  if (filters?.endTime) {
    results = results.filter(log => log.timestamp <= filters.endTime!)
  }

  // Search by query (case-insensitive substring match)
  if (query) {
    const lowerQuery = query.toLowerCase()
    results = results.filter(
      log =>
        log.message.toLowerCase().includes(lowerQuery) ||
        log.service.toLowerCase().includes(lowerQuery) ||
        log.level.toLowerCase().includes(lowerQuery)
    )
  }

  return results
}

/**
 * Export sample logs for initialization
 */
export const sampleLogs = allLogs

/**
 * Export logs by service for quick access
 */
export const logsByService = {
  'api-service': getLogsForService('api-service'),
  'auth-service': getLogsForService('auth-service'),
  'user-service': getLogsForService('user-service')
}

/**
 * Export logs by level for quick access
 */
export const logsByLevel = {
  DEBUG: getLogsByLevel('DEBUG'),
  INFO: getLogsByLevel('INFO'),
  WARN: getLogsByLevel('WARN'),
  ERROR: getLogsByLevel('ERROR'),
  FATAL: getLogsByLevel('FATAL')
}

/**
 * Export statistics
 */
export const logStatistics = getLogStatistics()
