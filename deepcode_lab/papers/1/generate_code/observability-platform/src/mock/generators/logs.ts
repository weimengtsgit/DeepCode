/**
 * Log Generator
 * 
 * Generates realistic log streams with proper temporal and severity distribution
 * using Poisson process for event timing and weighted random selection for levels.
 * 
 * Algorithm: Poisson Process + Weighted Level Distribution
 * - Divides time range into 1-minute buckets
 * - Uses Poisson distribution for logs per minute
 * - Weighted random selection for log levels (DEBUG: 30%, INFO: 50%, WARN: 15%, ERROR: 4%, FATAL: 1%)
 * - 60% of WARN/ERROR/FATAL logs include traceId for correlation
 */

import type { LogEntry, LogLevel, LogMessageTemplate } from '@/types/logs'
import {
  generateUUID,
  randomInt,
  randomTimestamp,
  poissonRandom,
  randomElement,
  randomBool,
  weightedRandom,
  randomHostname,
  randomPodName,
  randomThreadName,
  randomUserId,
  randomOrderId,
  randomSessionId,
  randomHttpStatus,
  randomHttpMethod,
  randomApiEndpoint,
  randomQueryType,
  randomCacheKey,
  randomIP,
  randomPercentage,
  randomDuration as randomDurationMicros
} from './utils'
import { getServiceNames } from '@/mock/data/services'
import {
  getRandomTemplate,
  getRandomErrorMessage,
  generateStackTrace,
  ALL_TEMPLATES
} from '@/mock/data/templates'
import { LOG_LEVEL_DISTRIBUTION } from '@/types/logs'

/**
 * Configuration for log generation
 */
export interface LogGenerationConfig {
  startTime: number
  endTime: number
  averageLogsPerMinute?: number
  services?: string[]
  errorProbability?: number
  traceCorrelationProbability?: number
}

/**
 * Generate a batch of realistic logs
 * 
 * @param count - Number of logs to generate
 * @param config - Generation configuration
 * @returns Array of log entries sorted by timestamp descending
 */
export function generateLogs(
  count: number,
  config: Partial<LogGenerationConfig> = {}
): LogEntry[] {
  const {
    startTime = Date.now() - 24 * 3600 * 1000, // Default: last 24 hours
    endTime = Date.now(),
    averageLogsPerMinute = 100,
    services = getServiceNames(),
    errorProbability = 0.05,
    traceCorrelationProbability = 0.6
  } = config

  const logs: LogEntry[] = []
  const timeRangeMs = endTime - startTime
  const minuteBuckets = Math.ceil(timeRangeMs / 60000) // 1-minute buckets

  // Generate logs using Poisson distribution per minute
  let generatedCount = 0
  for (let i = 0; i < minuteBuckets && generatedCount < count; i++) {
    const bucketStart = startTime + i * 60000
    const bucketEnd = Math.min(bucketStart + 60000, endTime)

    // Poisson distribution for logs in this minute
    const logsInBucket = Math.min(
      poissonRandom(averageLogsPerMinute),
      count - generatedCount
    )

    for (let j = 0; j < logsInBucket; j++) {
      const log = generateSingleLog({
        timestamp: randomTimestamp(bucketStart, bucketEnd),
        services,
        errorProbability,
        traceCorrelationProbability
      })
      logs.push(log)
      generatedCount++
    }
  }

  // Sort by timestamp descending (newest first)
  logs.sort((a, b) => b.timestamp - a.timestamp)

  return logs
}

/**
 * Generate a single log entry
 */
function generateSingleLog(config: {
  timestamp: number
  services: string[]
  errorProbability: number
  traceCorrelationProbability: number
}): LogEntry {
  const { timestamp, services, errorProbability, traceCorrelationProbability } = config

  // Select service
  const service = randomElement(services)

  // Determine log level using weighted distribution
  const level = selectLogLevel()

  // Generate message from template
  const template = getRandomTemplate(level)
  const message = interpolateTemplate(template, service)

  // Determine if this log should have a traceId
  const shouldHaveTrace =
    template.requiresTrace ||
    (['WARN', 'ERROR', 'FATAL'].includes(level) &&
      randomBool(traceCorrelationProbability))

  // Generate metadata
  const metadata = {
    hostname: randomHostname('node'),
    pod: randomPodName(service),
    thread: randomThreadName(),
    source: `${service}.log`,
    tags: generateTags(service, level)
  }

  // Build log entry
  const log: LogEntry = {
    id: generateUUID(),
    timestamp,
    level: level as LogLevel,
    service,
    message,
    metadata
  }

  // Add traceId if applicable
  if (shouldHaveTrace) {
    log.traceId = generateUUID()
    log.spanId = generateUUID()
  }

  // Add stack trace for ERROR/FATAL
  if (level === 'ERROR' || level === 'FATAL') {
    log.stackTrace = generateStackTrace(randomInt(5, 15))
  }

  // Add structured fields
  log.fields = generateStructuredFields(level, template, service)

  return log
}

/**
 * Select log level using weighted distribution
 */
function selectLogLevel(): string {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
  const weights = levels.map(level => LOG_LEVEL_DISTRIBUTION[level])
  return weightedRandom(levels, weights)
}

/**
 * Interpolate template placeholders with actual values
 */
function interpolateTemplate(template: LogMessageTemplate, service: string): string {
  let message = template.template

  // Replace placeholders
  const replacements: Record<string, () => string> = {
    '{userId}': () => randomUserId(),
    '{orderId}': () => randomOrderId(),
    '{sessionId}': () => randomSessionId(),
    '{key}': () => randomCacheKey(),
    '{method}': () => randomHttpMethod(),
    '{path}': () => randomApiEndpoint(),
    '{status}': () => randomHttpStatus().toString(),
    '{duration}': () => Math.round(randomDurationMicros() / 1000).toString(), // Convert to ms
    '{percent}': () => randomPercentage(1).toString(),
    '{error}': () => getRandomErrorMessage(),
    '{count}': () => randomInt(1, 1000).toString(),
    '{ip}': () => randomIP(),
    '{service}': () => service,
    '{query}': () => randomQueryType()
  }

  for (const [placeholder, generator] of Object.entries(replacements)) {
    if (message.includes(placeholder)) {
      message = message.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), generator())
    }
  }

  return message
}

/**
 * Generate tags for log entry
 */
function generateTags(service: string, level: string): string[] {
  const tags: string[] = [service, level.toLowerCase()]

  // Add environment tag
  tags.push(randomElement(['production', 'staging', 'development']))

  // Add region tag
  tags.push(randomElement(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']))

  // Add version tag
  tags.push(`v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 20)}`)

  return tags
}

/**
 * Generate structured fields based on log level and template
 */
function generateStructuredFields(
  level: string,
  template: LogMessageTemplate,
  service: string
): Record<string, any> {
  const fields: Record<string, any> = {
    level,
    service,
    timestamp: new Date().toISOString()
  }

  // Add HTTP-related fields for request logs
  if (template.template.includes('{method}') || template.template.includes('{path}')) {
    fields.http = {
      method: randomHttpMethod(),
      path: randomApiEndpoint(),
      status: randomHttpStatus(),
      duration: Math.round(randomDurationMicros() / 1000), // ms
      userAgent: 'Mozilla/5.0 (compatible; ObservabilityBot/1.0)'
    }
  }

  // Add database fields for query logs
  if (template.template.includes('{query}')) {
    fields.database = {
      type: randomElement(['mysql', 'postgresql', 'mongodb']),
      query: randomQueryType(),
      duration: Math.round(randomDurationMicros() / 1000), // ms
      rowsAffected: randomInt(0, 1000)
    }
  }

  // Add cache fields for cache logs
  if (template.template.includes('{key}')) {
    fields.cache = {
      key: randomCacheKey(),
      hit: randomBool(0.7),
      ttl: randomInt(60, 3600)
    }
  }

  // Add error details for ERROR/FATAL
  if (level === 'ERROR' || level === 'FATAL') {
    fields.error = {
      message: getRandomErrorMessage(),
      code: randomElement(['ERR_TIMEOUT', 'ERR_CONNECTION', 'ERR_VALIDATION', 'ERR_INTERNAL']),
      retryable: randomBool(0.3)
    }
  }

  // Add resource usage for WARN logs
  if (level === 'WARN' && template.template.includes('{percent}')) {
    fields.resource = {
      type: randomElement(['cpu', 'memory', 'disk']),
      usage: randomPercentage(1),
      threshold: randomInt(70, 90)
    }
  }

  return fields
}

/**
 * Generate logs for a specific time range with realistic temporal patterns
 * 
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @param averageLogsPerMinute - Average logs per minute (Poisson lambda)
 * @returns Array of log entries
 */
export function generateLogsForTimeRange(
  startTime: number,
  endTime: number,
  averageLogsPerMinute: number = 100
): LogEntry[] {
  const timeRangeMs = endTime - startTime
  const estimatedCount = Math.ceil((timeRangeMs / 60000) * averageLogsPerMinute)

  return generateLogs(estimatedCount, {
    startTime,
    endTime,
    averageLogsPerMinute
  })
}

/**
 * Generate logs for a specific service
 * 
 * @param service - Service name
 * @param count - Number of logs
 * @param config - Additional configuration
 * @returns Array of log entries for the service
 */
export function generateLogsForService(
  service: string,
  count: number,
  config: Partial<LogGenerationConfig> = {}
): LogEntry[] {
  return generateLogs(count, {
    ...config,
    services: [service]
  })
}

/**
 * Generate logs with specific trace correlation
 * 
 * @param traceId - Trace ID to correlate with
 * @param spanIds - Span IDs to correlate with
 * @param count - Number of logs
 * @param config - Additional configuration
 * @returns Array of log entries with trace correlation
 */
export function generateLogsForTrace(
  traceId: string,
  spanIds: string[],
  count: number,
  config: Partial<LogGenerationConfig> = {}
): LogEntry[] {
  const logs = generateLogs(count, config)

  // Assign traceId and random spanId to each log
  logs.forEach(log => {
    log.traceId = traceId
    log.spanId = randomElement(spanIds)
  })

  return logs
}

/**
 * Generate real-time log stream (for real-time mode)
 * 
 * @param previousTimestamp - Last log timestamp
 * @param count - Number of new logs to generate
 * @returns Array of new log entries
 */
export function generateRealtimeLogs(
  previousTimestamp: number = Date.now(),
  count: number = 10
): LogEntry[] {
  const now = Date.now()
  return generateLogs(count, {
    startTime: previousTimestamp,
    endTime: now,
    averageLogsPerMinute: count * 6 // Adjust to generate exactly 'count' logs
  })
}
