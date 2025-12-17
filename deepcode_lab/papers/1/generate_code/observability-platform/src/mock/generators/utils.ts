/**
 * Mock Data Generator Utilities
 * 
 * Provides foundational helper functions for generating realistic mock data:
 * - UUID generation
 * - Random number generation with distributions
 * - Statistical distributions (Poisson, Exponential, Normal)
 * - Array sampling and shuffling
 * - Time utilities
 */

/**
 * Generate a UUID v4 (random)
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * 
 * @returns UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a random integer between min and max (inclusive)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random float between min and max
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random float
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Generate a random boolean with given probability
 * 
 * @param probability - Probability of true (0-1)
 * @returns Random boolean
 */
export function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability
}

/**
 * Select a random element from an array
 * 
 * @param array - Source array
 * @returns Random element
 */
export function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)]
}

/**
 * Select multiple random elements from an array (without replacement)
 * 
 * @param array - Source array
 * @param count - Number of elements to select
 * @returns Array of random elements
 */
export function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, array.length))
}

/**
 * Weighted random selection
 * 
 * @param items - Array of items
 * @param weights - Array of weights (same length as items)
 * @returns Selected item
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have the same length')
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return items[i]
    }
  }
  
  return items[items.length - 1]
}

/**
 * Generate a random number following Poisson distribution
 * Used for modeling event counts in fixed time intervals
 * 
 * @param lambda - Average rate (λ)
 * @returns Random count
 */
export function poissonRandom(lambda: number): number {
  // Knuth's algorithm for Poisson distribution
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  
  do {
    k++
    p *= Math.random()
  } while (p > L)
  
  return k - 1
}

/**
 * Generate a random number following Exponential distribution
 * Used for modeling time between events
 * 
 * @param lambda - Rate parameter (λ)
 * @returns Random value
 */
export function exponentialRandom(lambda: number): number {
  return -Math.log(1 - Math.random()) / lambda
}

/**
 * Generate a random number following Normal (Gaussian) distribution
 * Uses Box-Muller transform
 * 
 * @param mean - Mean (μ)
 * @param stdDev - Standard deviation (σ)
 * @returns Random value
 */
export function normalRandom(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform
  const u1 = Math.random()
  const u2 = Math.random()
  
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}

/**
 * Clamp a value between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Generate a random timestamp within a time range
 * 
 * @param startTime - Start timestamp (ms)
 * @param endTime - End timestamp (ms)
 * @returns Random timestamp
 */
export function randomTimestamp(startTime: number, endTime: number): number {
  return randomInt(startTime, endTime)
}

/**
 * Generate a random duration in microseconds
 * Uses exponential distribution for realistic latency patterns
 * 
 * @param lambda - Rate parameter (default: 0.01 for ~100ms average)
 * @param maxDuration - Maximum duration in microseconds
 * @returns Duration in microseconds
 */
export function randomDuration(lambda: number = 0.01, maxDuration: number = 500000): number {
  const duration = exponentialRandom(lambda) * 1000 // Convert to microseconds
  return Math.min(Math.max(duration, 1000), maxDuration) // Min 1ms, max as specified
}

/**
 * Generate a random IP address
 * 
 * @returns IP address string
 */
export function randomIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`
}

/**
 * Generate a random hostname
 * 
 * @param prefix - Hostname prefix (default: 'host')
 * @returns Hostname string
 */
export function randomHostname(prefix: string = 'host'): string {
  return `${prefix}-${randomInt(1, 999)}`
}

/**
 * Generate a random pod name (Kubernetes style)
 * 
 * @param serviceName - Service name
 * @returns Pod name string
 */
export function randomPodName(serviceName: string): string {
  const hash = Math.random().toString(36).substring(2, 10)
  return `${serviceName}-${hash}-${randomInt(1, 5)}`
}

/**
 * Generate a random thread name
 * 
 * @returns Thread name string
 */
export function randomThreadName(): string {
  const types = ['http-nio', 'grpc-worker', 'async-task', 'scheduler', 'db-pool']
  return `${randomElement(types)}-${randomInt(1, 100)}`
}

/**
 * Generate a random user ID
 * 
 * @returns User ID string
 */
export function randomUserId(): string {
  return `user_${randomInt(1000, 9999)}`
}

/**
 * Generate a random order ID
 * 
 * @returns Order ID string
 */
export function randomOrderId(): string {
  return `ORD-${Date.now()}-${randomInt(1000, 9999)}`
}

/**
 * Generate a random session ID
 * 
 * @returns Session ID string
 */
export function randomSessionId(): string {
  return generateUUID().replace(/-/g, '')
}

/**
 * Shuffle an array in place (Fisher-Yates algorithm)
 * 
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Generate a random percentage (0-100)
 * 
 * @param decimals - Number of decimal places
 * @returns Percentage value
 */
export function randomPercentage(decimals: number = 2): number {
  return parseFloat((Math.random() * 100).toFixed(decimals))
}

/**
 * Generate a random HTTP status code
 * 
 * @param errorProbability - Probability of error status (0-1)
 * @returns HTTP status code
 */
export function randomHttpStatus(errorProbability: number = 0.05): number {
  if (randomBool(errorProbability)) {
    // Error status codes
    return randomElement([400, 401, 403, 404, 500, 502, 503, 504])
  }
  // Success status codes
  return randomElement([200, 201, 204, 304])
}

/**
 * Generate a random HTTP method
 * 
 * @returns HTTP method string
 */
export function randomHttpMethod(): string {
  const weights = [60, 20, 10, 5, 5] // GET, POST, PUT, DELETE, PATCH
  return weightedRandom(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], weights)
}

/**
 * Generate a random API endpoint
 * 
 * @returns API endpoint string
 */
export function randomApiEndpoint(): string {
  const resources = ['users', 'orders', 'products', 'payments', 'inventory', 'notifications']
  const resource = randomElement(resources)
  
  if (randomBool(0.6)) {
    // With ID
    return `/api/v1/${resource}/${randomInt(1, 1000)}`
  }
  // Collection endpoint
  return `/api/v1/${resource}`
}

/**
 * Generate a random database query type
 * 
 * @returns Query type string
 */
export function randomQueryType(): string {
  const weights = [50, 30, 15, 5] // SELECT, INSERT, UPDATE, DELETE
  return weightedRandom(['SELECT', 'INSERT', 'UPDATE', 'DELETE'], weights)
}

/**
 * Generate a random cache key
 * 
 * @returns Cache key string
 */
export function randomCacheKey(): string {
  const prefixes = ['user', 'session', 'product', 'order', 'config']
  return `${randomElement(prefixes)}:${randomInt(1000, 9999)}`
}

/**
 * Generate a random error message
 * 
 * @returns Error message string
 */
export function randomErrorMessage(): string {
  const errors = [
    'Connection timeout',
    'Database connection failed',
    'Invalid request parameters',
    'Resource not found',
    'Permission denied',
    'Service unavailable',
    'Internal server error',
    'Rate limit exceeded',
    'Authentication failed',
    'Payment processing failed'
  ]
  return randomElement(errors)
}

/**
 * Generate a random stack trace
 * 
 * @param depth - Stack trace depth
 * @returns Stack trace string
 */
export function randomStackTrace(depth: number = 5): string {
  const classes = [
    'com.example.service.UserService',
    'com.example.controller.OrderController',
    'com.example.repository.PaymentRepository',
    'com.example.util.ValidationUtil',
    'com.example.middleware.AuthMiddleware'
  ]
  
  const methods = ['process', 'handle', 'execute', 'validate', 'transform', 'save', 'update']
  
  const lines: string[] = []
  for (let i = 0; i < depth; i++) {
    const className = randomElement(classes)
    const method = randomElement(methods)
    const lineNumber = randomInt(10, 500)
    lines.push(`    at ${className}.${method}(${className.split('.').pop()}.java:${lineNumber})`)
  }
  
  return lines.join('\n')
}

/**
 * Sleep for a specified duration (for async operations)
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a time series of timestamps with regular intervals
 * 
 * @param startTime - Start timestamp (ms)
 * @param endTime - End timestamp (ms)
 * @param interval - Interval between points (ms)
 * @returns Array of timestamps
 */
export function generateTimePoints(startTime: number, endTime: number, interval: number): number[] {
  const points: number[] = []
  let current = startTime
  
  while (current <= endTime) {
    points.push(current)
    current += interval
  }
  
  return points
}

/**
 * Calculate percentile from sorted array
 * 
 * @param sortedValues - Sorted array of values
 * @param percentile - Percentile (0-1)
 * @returns Percentile value
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0
  if (sortedValues.length === 1) return sortedValues[0]
  
  const index = percentile * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

/**
 * Format bytes to human-readable string
 * 
 * @param bytes - Bytes value
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Format duration to human-readable string
 * 
 * @param microseconds - Duration in microseconds
 * @returns Formatted string
 */
export function formatDuration(microseconds: number): string {
  if (microseconds < 1000) return `${microseconds.toFixed(0)}μs`
  if (microseconds < 1000000) return `${(microseconds / 1000).toFixed(2)}ms`
  return `${(microseconds / 1000000).toFixed(2)}s`
}
