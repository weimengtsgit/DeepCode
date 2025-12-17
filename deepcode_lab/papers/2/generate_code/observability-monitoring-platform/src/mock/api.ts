/**
 * Mock API Layer
 * Simulates HTTP API endpoints for metrics, traces, logs, and alerts
 * Provides realistic response structures and latency simulation
 */

import { TimeSeries, Trace, LogEntry, AlertRule, AlertEvent, ApiResponse, PaginatedResponse } from '@/types'
import { generateTimeSeries, generateServiceMetrics } from './generators/timeSeriesGenerator'
import { generateTraces, detectSlowSpans } from './generators/traceGenerator'
import { generateLogs } from './generators/logGenerator'
import { generateAlertRules, generateAlertEvents } from './generators/alertGenerator'
import { randomInt } from './generators/utils'

/**
 * Simulates network latency
 * @param minMs Minimum latency in milliseconds
 * @param maxMs Maximum latency in milliseconds
 */
async function simulateLatency(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = randomInt(minMs, maxMs)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Mock API Service
 * Provides methods that simulate HTTP endpoints
 */
export class MockAPI {
  private static instance: MockAPI
  private metricsCache: Map<string, TimeSeries[]> = new Map()
  private tracesCache: Map<string, Trace[]> = new Map()
  private logsCache: Map<string, LogEntry[]> = new Map()
  private alertRulesCache: AlertRule[] = []
  private alertEventsCache: AlertEvent[] = []

  private constructor() {
    this.initializeCache()
  }

  static getInstance(): MockAPI {
    if (!MockAPI.instance) {
      MockAPI.instance = new MockAPI()
    }
    return MockAPI.instance
  }

  /**
   * Initialize cache with generated mock data
   */
  private initializeCache(): void {
    // Generate metrics for 3 services
    const services = ['api-service', 'database-service', 'cache-service']
    const now = new Date()
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24h ago

    services.forEach(service => {
      const metrics = generateServiceMetrics(service, service, startTime, now, 60) // 1-minute intervals
      this.metricsCache.set(service, metrics)
    })

    // Generate traces
    const traces = generateTraces(
      {
        services: services.map(s => ({
          id: s,
          name: s,
          displayName: s.replace('-', ' '),
          description: `${s} service`,
          instances: [`${s}-1`, `${s}-2`, `${s}-3`],
          environment: 'production',
          region: 'us-east-1',
          status: 'healthy'
        })),
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7,
        timeRange: { start: startTime, end: now }
      },
      100 // Generate 100 traces
    )
    this.tracesCache.set('all', traces)

    // Generate logs
    const logs = generateLogs({
      services: services.map(s => ({
        id: s,
        name: s,
        displayName: s.replace('-', ' '),
        description: `${s} service`,
        instances: [`${s}-1`, `${s}-2`, `${s}-3`],
        environment: 'production',
        region: 'us-east-1',
        status: 'healthy'
      })),
      timeRange: { start: startTime, end: now },
      baseFrequencyPerMinute: 10,
      peakHours: [[9, 12], [14, 17]],
      errorRateNormal: 0.005,
      errorRatePeak: 0.1,
      traceIdProbability: 0.2
    })
    this.logsCache.set('all', logs)

    // Generate alert rules and events
    this.alertRulesCache = generateAlertRules({
      services: services.map(s => ({
        id: s,
        name: s,
        displayName: s.replace('-', ' '),
        description: `${s} service`,
        instances: [`${s}-1`, `${s}-2`, `${s}-3`],
        environment: 'production',
        region: 'us-east-1',
        status: 'healthy'
      })),
      metrics: ['error_rate', 'response_time', 'cpu_usage', 'memory_usage'],
      severities: ['critical', 'warning', 'info'],
      conditions: ['greater_than', 'less_than'],
      ruleCount: 10
    })

    this.alertEventsCache = generateAlertEvents({
      rules: this.alertRulesCache,
      timeRange: { start: startTime, end: now },
      eventDensity: 2, // 2 events per rule per day
      avgDurationMinutes: 30
    })
  }

  /**
   * GET /api/metrics/:service
   * Fetch metrics for a specific service
   */
  async getMetrics(
    service: string,
    startTime: Date,
    endTime: Date,
    metricNames?: string[]
  ): Promise<ApiResponse<TimeSeries[]>> {
    await simulateLatency(100, 300)

    try {
      let metrics = this.metricsCache.get(service) || []

      // Filter by time range
      metrics = metrics.map(m => ({
        ...m,
        dataPoints: m.dataPoints.filter(
          p => p.timestamp >= startTime && p.timestamp <= endTime
        )
      }))

      // Filter by metric names if provided
      if (metricNames && metricNames.length > 0) {
        metrics = metrics.filter(m => metricNames.includes(m.metricName))
      }

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        timestamp: new Date()
      }
    }
  }

  /**
   * GET /api/metrics/compare
   * Compare metrics across multiple services
   */
  async compareMetrics(
    services: string[],
    metricName: string,
    startTime: Date,
    endTime: Date
  ): Promise<ApiResponse<Record<string, TimeSeries>>> {
    await simulateLatency(150, 400)

    try {
      const result: Record<string, TimeSeries> = {}

      for (const service of services) {
        const metrics = this.metricsCache.get(service) || []
        const metric = metrics.find(m => m.metricName === metricName)

        if (metric) {
          result[service] = {
            ...metric,
            dataPoints: metric.dataPoints.filter(
              p => p.timestamp >= startTime && p.timestamp <= endTime
            )
          }
        }
      }

      return {
        success: true,
        data: result,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare metrics',
        timestamp: new Date()
      }
    }
  }

  /**
   * GET /api/traces
   * Fetch traces with optional filtering
   */
  async getTraces(
    service?: string,
    startTime?: Date,
    endTime?: Date,
    status?: 'success' | 'error' | 'timeout',
    limit: number = 100
  ): Promise<ApiResponse<Trace[]>> {
    await simulateLatency(200, 500)

    try {
      let traces = this.tracesCache.get('all') || []

      // Filter by service
      if (service) {
        traces = traces.filter(t => t.rootService === service)
      }

      // Filter by time range
      if (startTime && endTime) {
        traces = traces.filter(
          t => t.startTime >= startTime && t.startTime <= endTime
        )
      }

      // Filter by status
      if (status) {
        traces = traces.filter(t => t.status === status)
      }

      // Sort by start time descending
      traces = traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

      // Apply limit
      traces = traces.slice(0, limit)

      return {
        success: true,
        data: traces,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch traces',
        timestamp: new Date()
      }
    }
  }

  /**
   * GET /api/traces/:traceId
   * Fetch a specific trace by ID
   */
  async getTrace(traceId: string): Promise<ApiResponse<Trace | null>> {
    await simulateLatency(100, 200)

    try {
      const traces = this.tracesCache.get('all') || []
      const trace = traces.find(t => t.traceId === traceId)

      return {
        success: true,
        data: trace || null,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trace',
        timestamp: new Date()
      }
    }
  }

  /**
   * GET /api/logs
   * Search logs with filtering and pagination
   */
  async getLogs(
    service?: string,
    level?: string,
    startTime?: Date,
    endTime?: Date,
    traceId?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<LogEntry>> {
    await simulateLatency(150, 400)

    try {
      let logs = this.logsCache.get('all') || []

      // Filter by service
      if (service) {
        logs = logs.filter(l => l.service === service)
      }

      // Filter by level
      if (level) {
        logs = logs.filter(l => l.level === level)
      }

      // Filter by time range
      if (startTime && endTime) {
        logs = logs.filter(
          l => l.timestamp >= startTime && l.timestamp <= endTime
        )
      }

      // Filter by traceId
      if (traceId) {
        logs = logs.filter(l => l.traceId === traceId)
      }

      // Sort by timestamp descending
      logs = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Paginate
      const total = logs.length
      const totalPages = Math.ceil(total / pageSize)
      const startIdx = (page - 1) * pageSize
      const endIdx = startIdx + pageSize
      const items = logs.slice(startIdx, endIdx)

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Failed to fetch logs'
      }
    }
  }

  /**
   * GET /api/logs/search
   * Full-text search logs
   */
  async searchLogs(
    query: string,
    service?: string,
    startTime?: Date,
    endTime?: Date,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<LogEntry>> {
    await simulateLatency(200, 500)

    try {
      let logs = this.logsCache.get('all') || []

      // Filter by service
      if (service) {
        logs = logs.filter(l => l.service === service)
      }

      // Filter by time range
      if (startTime && endTime) {
        logs = logs.filter(
          l => l.timestamp >= startTime && l.timestamp <= endTime
        )
      }

      // Search by query (case-insensitive)
      const queryLower = query.toLowerCase()
      logs = logs.filter(l =>
        l.message.toLowerCase().includes(queryLower) ||
        l.service.toLowerCase().includes(queryLower)
      )

      // Sort by timestamp descending
      logs = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Paginate
      const total = logs.length
      const totalPages = Math.ceil(total / pageSize)
      const startIdx = (page - 1) * pageSize
      const endIdx = startIdx + pageSize
      const items = logs.slice(startIdx, endIdx)

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Failed to search logs'
      }
    }
  }

  /**
   * GET /api/alerts/rules
   * Fetch all alert rules
   */
  async getAlertRules(): Promise<ApiResponse<AlertRule[]>> {
    await simulateLatency(100, 200)

    try {
      return {
        success: true,
        data: this.alertRulesCache,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alert rules',
        timestamp: new Date()
      }
    }
  }

  /**
   * GET /api/alerts/events
   * Fetch alert events with filtering
   */
  async getAlertEvents(
    service?: string,
    severity?: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 100
  ): Promise<ApiResponse<AlertEvent[]>> {
    await simulateLatency(150, 350)

    try {
      let events = this.alertEventsCache

      // Filter by service
      if (service) {
        events = events.filter(e => e.service === service)
      }

      // Filter by severity
      if (severity) {
        events = events.filter(e => e.severity === severity)
      }

      // Filter by time range
      if (startTime && endTime) {
        events = events.filter(
          e => e.triggeredAt >= startTime && e.triggeredAt <= endTime
        )
      }

      // Sort by triggered time descending
      events = events.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())

      // Apply limit
      events = events.slice(0, limit)

      return {
        success: true,
        data: events,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alert events',
        timestamp: new Date()
      }
    }
  }

  /**
   * POST /api/alerts/events/:eventId/acknowledge
   * Acknowledge an alert event
   */
  async acknowledgeAlert(eventId: string, userId: string): Promise<ApiResponse<AlertEvent | null>> {
    await simulateLatency(100, 200)

    try {
      const event = this.alertEventsCache.find(e => e.id === eventId)

      if (!event) {
        return {
          success: false,
          error: 'Alert event not found',
          timestamp: new Date()
        }
      }

      event.acknowledged = true
      event.acknowledgedBy = userId
      event.acknowledgedAt = new Date()

      return {
        success: true,
        data: event,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
        timestamp: new Date()
      }
    }
  }

  /**
   * POST /api/alerts/events/:eventId/resolve
   * Resolve an alert event
   */
  async resolveAlert(eventId: string): Promise<ApiResponse<AlertEvent | null>> {
    await simulateLatency(100, 200)

    try {
      const event = this.alertEventsCache.find(e => e.id === eventId)

      if (!event) {
        return {
          success: false,
          error: 'Alert event not found',
          timestamp: new Date()
        }
      }

      event.resolvedAt = new Date()

      return {
        success: true,
        data: event,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve alert',
        timestamp: new Date()
      }
    }
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  async getHealth(): Promise<ApiResponse<{ status: string; timestamp: Date }>> {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date()
      },
      timestamp: new Date()
    }
  }

  /**
   * Clear all caches (for testing/reset)
   */
  clearCache(): void {
    this.metricsCache.clear()
    this.tracesCache.clear()
    this.logsCache.clear()
    this.alertRulesCache = []
    this.alertEventsCache = []
    this.initializeCache()
  }
}

// Export singleton instance
export const mockAPI = MockAPI.getInstance()
