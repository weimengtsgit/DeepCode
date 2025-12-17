/**
 * Mock Data Entry Point
 * 
 * Central hub for all mock data generation and management.
 * Provides unified interface for metrics, traces, logs, and alerts.
 */

import type {
  Service,
  TimeRange,
  FilterConfig,
  ApiResponse,
  ListResponse,
  HealthCheck
} from '@/types'
import type { MetricTimeSeries, ServiceMetrics, MetricQuery } from '@/types/metrics'
import type { Trace, TraceSearchQuery, ServiceTopology } from '@/types/tracing'
import type { LogEntry, LogSearchQuery } from '@/types/logs'

// Import mock data modules
import * as metricsModule from './metrics'
import * as tracesModule from './traces'
import * as logsModule from './logs'
import * as alertsModule from './alerts'

/**
 * Mock API Configuration
 */
export interface MockApiConfig {
  /** Simulated network latency in milliseconds */
  latency: number
  /** Probability of random errors (0-1) */
  errorRate: number
  /** Enable request logging */
  enableLogging: boolean
}

const DEFAULT_CONFIG: MockApiConfig = {
  latency: 100,
  errorRate: 0.01,
  enableLogging: false
}

let currentConfig: MockApiConfig = { ...DEFAULT_CONFIG }

/**
 * Configure mock API behavior
 */
export function configureMockApi(config: Partial<MockApiConfig>): void {
  currentConfig = { ...currentConfig, ...config }
  if (currentConfig.enableLogging) {
    console.log('[Mock API] Configuration updated:', currentConfig)
  }
}

/**
 * Simulate network latency
 */
async function simulateLatency(): Promise<void> {
  if (currentConfig.latency > 0) {
    await new Promise(resolve => setTimeout(resolve, currentConfig.latency))
  }
}

/**
 * Simulate random errors
 */
function shouldSimulateError(): boolean {
  return Math.random() < currentConfig.errorRate
}

/**
 * Wrap response in API format
 */
function wrapResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * Create error response
 */
function createErrorResponse(message: string): ApiResponse<never> {
  return {
    data: null as never,
    success: false,
    message,
    timestamp: Date.now()
  }
}

/**
 * Execute mock API call with latency and error simulation
 */
async function executeMockCall<T>(
  operation: () => T | Promise<T>,
  operationName: string
): Promise<ApiResponse<T>> {
  try {
    if (currentConfig.enableLogging) {
      console.log(`[Mock API] ${operationName} - Start`)
    }

    await simulateLatency()

    if (shouldSimulateError()) {
      throw new Error('Simulated network error')
    }

    const result = await Promise.resolve(operation())

    if (currentConfig.enableLogging) {
      console.log(`[Mock API] ${operationName} - Success`)
    }

    return wrapResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (currentConfig.enableLogging) {
      console.error(`[Mock API] ${operationName} - Error:`, message)
    }
    return createErrorResponse(message)
  }
}

// ============================================================================
// Services API
// ============================================================================

/**
 * Get all services
 */
export async function getServices(): Promise<ApiResponse<Service[]>> {
  return executeMockCall(
    () => metricsModule.getServices(),
    'getServices'
  )
}

/**
 * Get service by ID
 */
export async function getServiceById(serviceId: string): Promise<ApiResponse<Service | null>> {
  return executeMockCall(
    () => metricsModule.getServiceById(serviceId),
    `getServiceById(${serviceId})`
  )
}

/**
 * Get service health check
 */
export async function getServiceHealth(serviceId: string): Promise<ApiResponse<HealthCheck>> {
  return executeMockCall(
    () => {
      const service = metricsModule.getServiceById(serviceId)
      if (!service) {
        throw new Error(`Service ${serviceId} not found`)
      }

      const now = Date.now()
      const metrics = metricsModule.getServiceMetrics(serviceId, now - 300000, now)

      return {
        service: service.name,
        status: service.status,
        timestamp: now,
        checks: [
          {
            name: 'api',
            status: service.status,
            message: service.status === 'healthy' ? 'All systems operational' : 'Degraded performance'
          },
          {
            name: 'database',
            status: service.status === 'down' ? 'down' : 'healthy',
            message: 'Database connection OK'
          }
        ],
        uptime: Math.floor(Math.random() * 86400000), // Random uptime up to 24h
        version: service.metadata?.version || '1.0.0'
      }
    },
    `getServiceHealth(${serviceId})`
  )
}

// ============================================================================
// Metrics API
// ============================================================================

/**
 * Query metrics
 */
export async function queryMetrics(query: MetricQuery): Promise<ApiResponse<MetricTimeSeries[]>> {
  return executeMockCall(
    () => metricsModule.queryMetrics(query),
    'queryMetrics'
  )
}

/**
 * Get service metrics
 */
export async function getServiceMetrics(
  serviceId: string,
  startTime: number,
  endTime: number
): Promise<ApiResponse<ServiceMetrics>> {
  return executeMockCall(
    () => metricsModule.getServiceMetrics(serviceId, startTime, endTime),
    `getServiceMetrics(${serviceId})`
  )
}

/**
 * Get all services metrics summary
 */
export async function getAllServicesMetrics(
  startTime: number,
  endTime: number
): Promise<ApiResponse<ServiceMetrics[]>> {
  return executeMockCall(
    () => metricsModule.getAllServicesMetrics(startTime, endTime),
    'getAllServicesMetrics'
  )
}

/**
 * Compare metrics across services
 */
export async function compareServiceMetrics(
  serviceIds: string[],
  metricType: string,
  startTime: number,
  endTime: number
): Promise<ApiResponse<MetricTimeSeries[]>> {
  return executeMockCall(
    () => metricsModule.compareServiceMetrics(serviceIds, metricType, startTime, endTime),
    'compareServiceMetrics'
  )
}

// ============================================================================
// Tracing API
// ============================================================================

/**
 * Search traces
 */
export async function searchTraces(query: TraceSearchQuery): Promise<ApiResponse<ListResponse<Trace>>> {
  return executeMockCall(
    () => tracesModule.searchTraces(query),
    'searchTraces'
  )
}

/**
 * Get trace by ID
 */
export async function getTraceById(traceId: string): Promise<ApiResponse<Trace | null>> {
  return executeMockCall(
    () => tracesModule.getTraceById(traceId),
    `getTraceById(${traceId})`
  )
}

/**
 * Get service topology
 */
export async function getServiceTopology(
  startTime: number,
  endTime: number,
  services?: string[]
): Promise<ApiResponse<ServiceTopology>> {
  return executeMockCall(
    () => tracesModule.getServiceTopology(startTime, endTime, services),
    'getServiceTopology'
  )
}

/**
 * Get traces by service
 */
export async function getTracesByService(
  serviceId: string,
  startTime: number,
  endTime: number,
  limit?: number
): Promise<ApiResponse<Trace[]>> {
  return executeMockCall(
    () => tracesModule.getTracesByService(serviceId, startTime, endTime, limit),
    `getTracesByService(${serviceId})`
  )
}

// ============================================================================
// Logs API
// ============================================================================

/**
 * Search logs
 */
export async function searchLogs(query: LogSearchQuery): Promise<ApiResponse<any>> {
  return executeMockCall(
    () => logsModule.searchLogs(query),
    'searchLogs'
  )
}

/**
 * Get log by ID
 */
export async function getLogById(logId: string): Promise<ApiResponse<LogEntry | null>> {
  return executeMockCall(
    () => logsModule.getLogById(logId),
    `getLogById(${logId})`
  )
}

/**
 * Get log context
 */
export async function getLogContext(
  logId: string,
  before?: number,
  after?: number
): Promise<ApiResponse<any>> {
  return executeMockCall(
    () => logsModule.getLogContext(logId, before, after),
    `getLogContext(${logId})`
  )
}

/**
 * Get logs by trace ID
 */
export async function getLogsByTraceId(traceId: string): Promise<ApiResponse<LogEntry[]>> {
  return executeMockCall(
    () => logsModule.getLogsByTraceId(traceId),
    `getLogsByTraceId(${traceId})`
  )
}

/**
 * Get recent logs for streaming
 */
export async function getRecentLogs(
  limit?: number,
  since?: number
): Promise<ApiResponse<LogEntry[]>> {
  return executeMockCall(
    () => logsModule.getRecentLogs(limit, since),
    'getRecentLogs'
  )
}

/**
 * Get log statistics
 */
export async function getLogStatistics(
  startTime: number,
  endTime: number
): Promise<ApiResponse<any>> {
  return executeMockCall(
    () => logsModule.getLogStatistics(startTime, endTime),
    `getLogStatistics`
  )
}

// ============================================================================
// Alerts API
// ============================================================================

/**
 * Get all alerts
 */
export async function getAlerts(filters?: Partial<FilterConfig>): Promise<ApiResponse<any[]>> {
  return executeMockCall(
    () => alertsModule.getAlerts(filters),
    'getAlerts'
  )
}

/**
 * Get alert by ID
 */
export async function getAlertById(alertId: string): Promise<ApiResponse<any>> {
  return executeMockCall(
    () => alertsModule.getAlertById(alertId),
    `getAlertById(${alertId})`
  )
}

/**
 * Get alerts by service
 */
export async function getAlertsByService(serviceId: string): Promise<ApiResponse<any[]>> {
  return executeMockCall(
    () => alertsModule.getAlertsByService(serviceId),
    `getAlertsByService(${serviceId})`
  )
}

/**
 * Get active alerts count
 */
export async function getActiveAlertsCount(): Promise<ApiResponse<number>> {
  return executeMockCall(
    () => alertsModule.getActiveAlertsCount(),
    'getActiveAlertsCount'
  )
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<ApiResponse<any>> {
  return executeMockCall(
    () => alertsModule.acknowledgeAlert(alertId, acknowledgedBy),
    `acknowledgeAlert(${alertId})`
  )
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string): Promise<ApiResponse<any>> {
  return executeMockCall(
    () => alertsModule.resolveAlert(alertId),
    `resolveAlert(${alertId})`
  )
}

// ============================================================================
// Dashboard API
// ============================================================================

/**
 * Get dashboard overview data
 */
export async function getDashboardOverview(
  timeRange: TimeRange
): Promise<ApiResponse<any>> {
  return executeMockCall(
    async () => {
      const { start, end } = timeRange
      
      // Fetch all data in parallel
      const [servicesRes, metricsRes, alertsRes, logsStatsRes] = await Promise.all([
        getServices(),
        getAllServicesMetrics(start, end),
        getAlerts(),
        getLogStatistics(start, end)
      ])

      if (!servicesRes.success || !metricsRes.success || !alertsRes.success || !logsStatsRes.success) {
        throw new Error('Failed to fetch dashboard data')
      }

      const services = servicesRes.data
      const metrics = metricsRes.data
      const alerts = alertsRes.data
      const logStats = logsStatsRes.data

      // Calculate summary statistics
      const healthyServices = services.filter(s => s.status === 'healthy').length
      const totalServices = services.length
      const activeAlerts = alerts.filter((a: any) => a.status === 'firing').length
      const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical' && a.status === 'firing').length

      // Calculate average metrics
      const avgQPS = metrics.reduce((sum, m) => sum + (m.qps?.current || 0), 0) / metrics.length
      const avgLatency = metrics.reduce((sum, m) => sum + (m.latency?.p99 || 0), 0) / metrics.length
      const avgErrorRate = metrics.reduce((sum, m) => sum + (m.errorRate?.current || 0), 0) / metrics.length

      return {
        summary: {
          healthyServices,
          totalServices,
          healthPercentage: (healthyServices / totalServices) * 100,
          activeAlerts,
          criticalAlerts,
          avgQPS: Math.round(avgQPS),
          avgLatency: Math.round(avgLatency),
          avgErrorRate: Number(avgErrorRate.toFixed(2))
        },
        services: services.map(s => {
          const serviceMetrics = metrics.find(m => m.service === s.name)
          return {
            ...s,
            metrics: serviceMetrics
          }
        }),
        recentAlerts: alerts.slice(0, 10),
        logStatistics: logStats,
        timestamp: Date.now()
      }
    },
    'getDashboardOverview'
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all mock data caches
 */
export function clearAllCaches(): void {
  metricsModule.clearMetricsCache()
  tracesModule.clearTracesCache()
  logsModule.clearLogCache()
  alertsModule.clearAlertsCache()
  
  if (currentConfig.enableLogging) {
    console.log('[Mock API] All caches cleared')
  }
}

/**
 * Reset mock API to default configuration
 */
export function resetMockApi(): void {
  currentConfig = { ...DEFAULT_CONFIG }
  clearAllCaches()
  
  if (currentConfig.enableLogging) {
    console.log('[Mock API] Reset to default configuration')
  }
}

/**
 * Get current mock API configuration
 */
export function getMockApiConfig(): MockApiConfig {
  return { ...currentConfig }
}

// ============================================================================
// Re-export mock modules for direct access if needed
// ============================================================================

export { metricsModule, tracesModule, logsModule, alertsModule }

// ============================================================================
// Initialize mock data on module load
// ============================================================================

if (currentConfig.enableLogging) {
  console.log('[Mock API] Initialized with configuration:', currentConfig)
}
