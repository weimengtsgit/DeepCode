/**
 * Log Message Templates
 * 
 * Provides realistic log message templates for each log level,
 * used by the log generator to create varied and realistic log entries.
 * Templates include placeholders for dynamic values.
 */

import { LogLevel, LogMessageTemplate } from '@/types/logs'

/**
 * Template placeholders:
 * {userId} - Random user ID
 * {orderId} - Random order ID
 * {sessionId} - Random session ID
 * {key} - Cache/database key
 * {method} - HTTP method
 * {path} - API endpoint path
 * {status} - HTTP status code
 * {duration} - Duration in milliseconds
 * {percent} - Percentage value
 * {error} - Error message
 * {count} - Numeric count
 * {ip} - IP address
 * {service} - Service name
 * {query} - Database query type
 */

/**
 * DEBUG level templates (30% of logs)
 * Used for detailed diagnostic information
 */
export const DEBUG_TEMPLATES: LogMessageTemplate[] = [
  {
    template: 'Processing request for user {userId}',
    level: LogLevel.DEBUG,
    weight: 1.0,
    requiresTrace: false
  },
  {
    template: 'Cache hit for key: {key}',
    level: LogLevel.DEBUG,
    weight: 1.2,
    requiresTrace: false
  },
  {
    template: 'Cache miss for key: {key}, fetching from database',
    level: LogLevel.DEBUG,
    weight: 0.8,
    requiresTrace: false
  },
  {
    template: 'Executing {query} query on database',
    level: LogLevel.DEBUG,
    weight: 1.0,
    requiresTrace: false
  },
  {
    template: 'Validating request parameters for {method} {path}',
    level: LogLevel.DEBUG,
    weight: 0.9,
    requiresTrace: false
  },
  {
    template: 'Session {sessionId} authenticated successfully',
    level: LogLevel.DEBUG,
    weight: 0.7,
    requiresTrace: false
  },
  {
    template: 'Loading configuration from cache',
    level: LogLevel.DEBUG,
    weight: 0.6,
    requiresTrace: false
  },
  {
    template: 'Serializing response data ({count} items)',
    level: LogLevel.DEBUG,
    weight: 0.8,
    requiresTrace: false
  },
  {
    template: 'Connecting to downstream service: {service}',
    level: LogLevel.DEBUG,
    weight: 0.9,
    requiresTrace: false
  },
  {
    template: 'Request headers validated',
    level: LogLevel.DEBUG,
    weight: 0.5,
    requiresTrace: false
  }
]

/**
 * INFO level templates (50% of logs)
 * Used for general informational messages
 */
export const INFO_TEMPLATES: LogMessageTemplate[] = [
  {
    template: 'Request completed: {method} {path} - {status} - {duration}ms',
    level: LogLevel.INFO,
    weight: 2.0,
    requiresTrace: false
  },
  {
    template: 'User {userId} logged in from {ip}',
    level: LogLevel.INFO,
    weight: 1.0,
    requiresTrace: false
  },
  {
    template: 'Order {orderId} created successfully',
    level: LogLevel.INFO,
    weight: 1.2,
    requiresTrace: false
  },
  {
    template: 'Payment processed for order {orderId}: {status}',
    level: LogLevel.INFO,
    weight: 1.1,
    requiresTrace: false
  },
  {
    template: 'Cache updated for key: {key}',
    level: LogLevel.INFO,
    weight: 0.8,
    requiresTrace: false
  },
  {
    template: 'Database query completed in {duration}ms',
    level: LogLevel.INFO,
    weight: 1.0,
    requiresTrace: false
  },
  {
    template: 'Session {sessionId} created',
    level: LogLevel.INFO,
    weight: 0.7,
    requiresTrace: false
  },
  {
    template: 'Notification sent to user {userId}',
    level: LogLevel.INFO,
    weight: 0.6,
    requiresTrace: false
  },
  {
    template: 'Inventory updated: {count} items processed',
    level: LogLevel.INFO,
    weight: 0.8,
    requiresTrace: false
  },
  {
    template: 'Health check passed',
    level: LogLevel.INFO,
    weight: 1.5,
    requiresTrace: false
  },
  {
    template: 'API rate limit: {count} requests in last minute',
    level: LogLevel.INFO,
    weight: 0.5,
    requiresTrace: false
  },
  {
    template: 'Background job completed: {duration}ms',
    level: LogLevel.INFO,
    weight: 0.7,
    requiresTrace: false
  }
]

/**
 * WARN level templates (15% of logs)
 * Used for warning conditions that should be investigated
 */
export const WARN_TEMPLATES: LogMessageTemplate[] = [
  {
    template: 'High memory usage: {percent}%',
    level: LogLevel.WARN,
    weight: 1.0,
    requiresTrace: false
  },
  {
    template: 'Slow query detected: {duration}ms for {query}',
    level: LogLevel.WARN,
    weight: 1.2,
    requiresTrace: true
  },
  {
    template: 'Cache eviction rate high: {percent}%',
    level: LogLevel.WARN,
    weight: 0.8,
    requiresTrace: false
  },
  {
    template: 'Request timeout approaching: {duration}ms elapsed',
    level: LogLevel.WARN,
    weight: 1.0,
    requiresTrace: true
  },
  {
    template: 'Retry attempt {count} for {service}',
    level: LogLevel.WARN,
    weight: 1.1,
    requiresTrace: true
  },
  {
    template: 'Connection pool {percent}% utilized',
    level: LogLevel.WARN,
    weight: 0.7,
    requiresTrace: false
  },
  {
    template: 'Rate limit approaching for user {userId}: {count} requests',
    level: LogLevel.WARN,
    weight: 0.9,
    requiresTrace: false
  },
  {
    template: 'Deprecated API endpoint used: {method} {path}',
    level: LogLevel.WARN,
    weight: 0.6,
    requiresTrace: false
  },
  {
    template: 'Circuit breaker half-open for {service}',
    level: LogLevel.WARN,
    weight: 0.8,
    requiresTrace: true
  },
  {
    template: 'Disk usage high: {percent}%',
    level: LogLevel.WARN,
    weight: 0.7,
    requiresTrace: false
  }
]

/**
 * ERROR level templates (4% of logs)
 * Used for error conditions that need attention
 */
export const ERROR_TEMPLATES: LogMessageTemplate[] = [
  {
    template: 'Payment failed for order {orderId}: {error}',
    level: LogLevel.ERROR,
    weight: 1.2,
    requiresTrace: true
  },
  {
    template: 'Database connection timeout after {duration}ms',
    level: LogLevel.ERROR,
    weight: 1.0,
    requiresTrace: true
  },
  {
    template: 'Failed to process request: {error}',
    level: LogLevel.ERROR,
    weight: 1.5,
    requiresTrace: true
  },
  {
    template: 'External API call failed: {service} returned {status}',
    level: LogLevel.ERROR,
    weight: 1.1,
    requiresTrace: true
  },
  {
    template: 'Authentication failed for user {userId}: {error}',
    level: LogLevel.ERROR,
    weight: 0.9,
    requiresTrace: true
  },
  {
    template: 'Cache write failed for key {key}: {error}',
    level: LogLevel.ERROR,
    weight: 0.7,
    requiresTrace: true
  },
  {
    template: 'Message queue publish failed: {error}',
    level: LogLevel.ERROR,
    weight: 0.8,
    requiresTrace: true
  },
  {
    template: 'Validation error: {error}',
    level: LogLevel.ERROR,
    weight: 1.0,
    requiresTrace: true
  },
  {
    template: 'Circuit breaker opened for {service} after {count} failures',
    level: LogLevel.ERROR,
    weight: 0.9,
    requiresTrace: true
  },
  {
    template: 'Serialization error: {error}',
    level: LogLevel.ERROR,
    weight: 0.6,
    requiresTrace: true
  }
]

/**
 * FATAL level templates (1% of logs)
 * Used for critical errors that may cause service failure
 */
export const FATAL_TEMPLATES: LogMessageTemplate[] = [
  {
    template: 'Service crash: {error}',
    level: LogLevel.FATAL,
    weight: 1.0,
    requiresTrace: true
  },
  {
    template: 'Out of memory: heap usage {percent}%',
    level: LogLevel.FATAL,
    weight: 1.2,
    requiresTrace: true
  },
  {
    template: 'Database connection pool exhausted',
    level: LogLevel.FATAL,
    weight: 1.0,
    requiresTrace: true
  },
  {
    template: 'Critical configuration missing: {error}',
    level: LogLevel.FATAL,
    weight: 0.8,
    requiresTrace: true
  },
  {
    template: 'Unhandled exception in request handler: {error}',
    level: LogLevel.FATAL,
    weight: 1.1,
    requiresTrace: true
  },
  {
    template: 'Disk full: unable to write logs',
    level: LogLevel.FATAL,
    weight: 0.7,
    requiresTrace: true
  },
  {
    template: 'All downstream services unavailable',
    level: LogLevel.FATAL,
    weight: 0.9,
    requiresTrace: true
  },
  {
    template: 'Security breach detected: {error}',
    level: LogLevel.FATAL,
    weight: 0.6,
    requiresTrace: true
  }
]

/**
 * All templates combined with their weights
 */
export const ALL_TEMPLATES: LogMessageTemplate[] = [
  ...DEBUG_TEMPLATES,
  ...INFO_TEMPLATES,
  ...WARN_TEMPLATES,
  ...ERROR_TEMPLATES,
  ...FATAL_TEMPLATES
]

/**
 * Get templates for a specific log level
 */
export function getTemplatesForLevel(level: LogLevel): LogMessageTemplate[] {
  switch (level) {
    case LogLevel.DEBUG:
      return DEBUG_TEMPLATES
    case LogLevel.INFO:
      return INFO_TEMPLATES
    case LogLevel.WARN:
      return WARN_TEMPLATES
    case LogLevel.ERROR:
      return ERROR_TEMPLATES
    case LogLevel.FATAL:
      return FATAL_TEMPLATES
    default:
      return INFO_TEMPLATES
  }
}

/**
 * Get a random template for a specific log level
 * Uses weighted random selection based on template weights
 */
export function getRandomTemplate(level: LogLevel): LogMessageTemplate {
  const templates = getTemplatesForLevel(level)
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const template of templates) {
    random -= template.weight
    if (random <= 0) {
      return template
    }
  }
  
  // Fallback to first template
  return templates[0]
}

/**
 * Common error messages for ERROR and FATAL logs
 */
export const ERROR_MESSAGES = [
  'Connection refused',
  'Timeout exceeded',
  'Invalid request format',
  'Resource not found',
  'Permission denied',
  'Internal server error',
  'Service unavailable',
  'Bad gateway',
  'Gateway timeout',
  'Insufficient resources',
  'Quota exceeded',
  'Invalid credentials',
  'Token expired',
  'Duplicate key violation',
  'Foreign key constraint failed',
  'Deadlock detected',
  'Transaction rollback',
  'Network unreachable',
  'Host unreachable',
  'SSL handshake failed'
]

/**
 * Get a random error message
 */
export function getRandomErrorMessage(): string {
  return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]
}

/**
 * Stack trace templates for ERROR and FATAL logs
 */
export const STACK_TRACE_FRAMES = [
  'at handleRequest (src/handlers/request.ts:45:12)',
  'at processOrder (src/services/order.ts:123:8)',
  'at validatePayment (src/services/payment.ts:67:15)',
  'at executeQuery (src/database/query.ts:89:10)',
  'at connectDatabase (src/database/connection.ts:34:7)',
  'at fetchUserData (src/services/user.ts:156:9)',
  'at authenticateUser (src/auth/authenticate.ts:78:11)',
  'at parseRequest (src/middleware/parser.ts:23:6)',
  'at routeRequest (src/router/index.ts:91:14)',
  'at handleError (src/middleware/error.ts:45:8)',
  'at retryOperation (src/utils/retry.ts:56:12)',
  'at publishMessage (src/queue/publisher.ts:34:9)',
  'at serializeData (src/utils/serializer.ts:67:10)',
  'at cacheGet (src/cache/redis.ts:89:7)',
  'at logEvent (src/logging/logger.ts:123:11)'
]

/**
 * Generate a random stack trace
 */
export function generateStackTrace(depth: number = 5): string {
  const frames: string[] = []
  const usedFrames = new Set<number>()
  
  for (let i = 0; i < Math.min(depth, STACK_TRACE_FRAMES.length); i++) {
    let frameIndex: number
    do {
      frameIndex = Math.floor(Math.random() * STACK_TRACE_FRAMES.length)
    } while (usedFrames.has(frameIndex))
    
    usedFrames.add(frameIndex)
    frames.push(STACK_TRACE_FRAMES[frameIndex])
  }
  
  return frames.join('\n')
}
