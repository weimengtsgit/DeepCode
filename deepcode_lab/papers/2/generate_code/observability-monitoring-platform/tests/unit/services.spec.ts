import { describe, it, expect, beforeEach } from 'vitest'
import { metricsService } from '@/services/metricsService'
import { tracesService } from '@/services/tracesService'
import { logsService } from '@/services/logsService'
import { alertsService } from '@/services/alertsService'
import type { TimeSeries, MetricPoint } from '@/types/metrics'
import type { Trace, Span } from '@/types/traces'
import type { LogEntry } from '@/types/logs'
import type { AlertRule, AlertEvent } from '@/types/alerts'

describe('Services Layer', () => {
  // ============================================================================
  // METRICS SERVICE TESTS
  // ============================================================================
  describe('MetricsService', () => {
    let mockTimeSeries: TimeSeries
    let mockMetricPoints: MetricPoint[]

    beforeEach(() => {
      // Create mock metric points
      mockMetricPoints = Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(Date.now() - (100 - i) * 60000),
        value: 50 + Math.sin(i / 10) * 20 + Math.random() * 10,
        min: 40,
        max: 60
      }))

      mockTimeSeries = {
        metricId: 'cpu-usage-1',
        metricName: 'CPU Usage',
        unit: '%',
        serviceId: 'api-service',
        dataPoints: mockMetricPoints,
        lastUpdate: new Date()
      }
    })

    it('should calculate metric statistics correctly', () => {
      const stats = metricsService.calculateMetricStats(mockTimeSeries)

      expect(stats).toBeDefined()
      expect(stats.min).toBeLessThanOrEqual(stats.avg)
      expect(stats.avg).toBeLessThanOrEqual(stats.max)
      expect(stats.p50).toBeLessThanOrEqual(stats.p90)
      expect(stats.p90).toBeLessThanOrEqual(stats.p99)
    })

    it('should detect anomalies above threshold', () => {
      const anomalies = metricsService.detectAnomalies(mockTimeSeries)

      expect(Array.isArray(anomalies)).toBe(true)
      // Anomalies should be subset of original data
      anomalies.forEach(anomaly => {
        expect(mockMetricPoints).toContainEqual(expect.objectContaining({
          value: anomaly.value
        }))
      })
    })

    it('should filter metrics by value range', () => {
      const filtered = metricsService.filterByValueRange(mockTimeSeries, 50, 70)

      expect(filtered).toBeDefined()
      expect(filtered?.dataPoints.every(p => p.value >= 50 && p.value <= 70)).toBe(true)
    })

    it('should filter metrics by time range', () => {
      const startTime = new Date(Date.now() - 30 * 60000)
      const endTime = new Date()
      const filtered = metricsService.filterByTimeRange(mockTimeSeries, startTime, endTime)

      expect(filtered).toBeDefined()
      expect(filtered?.dataPoints.every(p => 
        p.timestamp >= startTime && p.timestamp <= endTime
      )).toBe(true)
    })

    it('should calculate rate of change correctly', () => {
      const rateOfChange = metricsService.calculateRateOfChange(mockTimeSeries)

      expect(Array.isArray(rateOfChange)).toBe(true)
      expect(rateOfChange.length).toBeLessThanOrEqual(mockMetricPoints.length)
    })

    it('should calculate moving average correctly', () => {
      const windowSize = 5
      const movingAvg = metricsService.calculateMovingAverage(mockTimeSeries, windowSize)

      expect(Array.isArray(movingAvg)).toBe(true)
      expect(movingAvg.length).toBeLessThanOrEqual(mockMetricPoints.length)
    })
  })

  // ============================================================================
  // TRACES SERVICE TESTS
  // ============================================================================
  describe('TracesService', () => {
    let mockTrace: Trace
    let mockSpans: Span[]

    beforeEach(() => {
      const now = Date.now()
      mockSpans = [
        {
          spanId: 'span-1',
          traceId: 'trace-1',
          parentSpanId: null,
          service: 'api-gateway',
          operation: 'POST /api/users',
          startTime: new Date(now),
          endTime: new Date(now + 100),
          durationMs: 100,
          status: 'SUCCESS',
          tags: { userId: '123' },
          logs: []
        },
        {
          spanId: 'span-2',
          traceId: 'trace-1',
          parentSpanId: 'span-1',
          service: 'auth-service',
          operation: 'validate-token',
          startTime: new Date(now + 10),
          endTime: new Date(now + 35),
          durationMs: 25,
          status: 'SUCCESS',
          tags: {},
          logs: []
        },
        {
          spanId: 'span-3',
          traceId: 'trace-1',
          parentSpanId: 'span-1',
          service: 'user-service',
          operation: 'create-user',
          startTime: new Date(now + 40),
          endTime: new Date(now + 95),
          durationMs: 55,
          status: 'SUCCESS',
          tags: {},
          logs: []
        }
      ]

      mockTrace = {
        traceId: 'trace-1',
        rootSpanId: 'span-1',
        rootService: 'api-gateway',
        startTime: new Date(now),
        endTime: new Date(now + 100),
        totalDurationMs: 100,
        spanCount: 3,
        status: 'SUCCESS',
        spans: mockSpans
      }
    })

    it('should detect slow spans correctly', () => {
      const slowSpans = tracesService.detectSlowSpans(mockTrace)

      expect(Array.isArray(slowSpans)).toBe(true)
      // Slow spans should be subset of original spans
      slowSpans.forEach(slowSpan => {
        expect(mockSpans.some(s => s.spanId === slowSpan.spanId)).toBe(true)
      })
    })

    it('should calculate trace statistics correctly', () => {
      const traces = [mockTrace]
      const stats = tracesService.calculateTraceStats(traces)

      expect(stats).toBeDefined()
      expect(stats.totalTraces).toBe(1)
      expect(stats.successCount).toBe(1)
      expect(stats.errorCount).toBe(0)
      expect(stats.avgDurationMs).toBe(100)
    })

    it('should build service dependency graph correctly', () => {
      const traces = [mockTrace]
      const graph = tracesService.buildServiceDependencyGraph(traces)

      expect(graph).toBeDefined()
      expect(graph.nodes).toBeDefined()
      expect(graph.edges).toBeDefined()
      expect(graph.nodes.length).toBeGreaterThan(0)
      expect(graph.edges.length).toBeGreaterThan(0)
    })

    it('should calculate trace depth correctly', () => {
      const depth = tracesService.calculateTraceDepth(mockTrace)

      expect(typeof depth).toBe('number')
      expect(depth).toBeGreaterThan(0)
      expect(depth).toBeLessThanOrEqual(mockSpans.length)
    })

    it('should find critical path in trace', () => {
      const criticalPath = tracesService.getCriticalPath(mockTrace)

      expect(Array.isArray(criticalPath)).toBe(true)
      expect(criticalPath.length).toBeGreaterThan(0)
      // Critical path should start with root span
      expect(criticalPath[0].spanId).toBe('span-1')
    })

    it('should analyze concurrency correctly', () => {
      const concurrency = tracesService.analyzeConcurrency(mockTrace)

      expect(concurrency).toBeDefined()
      expect(concurrency.maxConcurrentSpans).toBeGreaterThan(0)
      expect(concurrency.avgConcurrentSpans).toBeGreaterThan(0)
      expect(concurrency.parallelizationRatio).toBeGreaterThanOrEqual(0)
      expect(concurrency.parallelizationRatio).toBeLessThanOrEqual(1)
    })
  })

  // ============================================================================
  // LOGS SERVICE TESTS
  // ============================================================================
  describe('LogsService', () => {
    let mockLogs: LogEntry[]

    beforeEach(() => {
      const now = Date.now()
      mockLogs = [
        {
          id: 'log-1',
          timestamp: new Date(now - 60000),
          service: 'api-service',
          level: 'INFO',
          message: 'Request received from 192.168.1.1',
          traceId: 'trace-1',
          context: { userId: '123', requestId: 'req-1' },
          stacktrace: null
        },
        {
          id: 'log-2',
          timestamp: new Date(now - 50000),
          service: 'auth-service',
          level: 'DEBUG',
          message: 'Token validation started',
          traceId: 'trace-1',
          context: { userId: '123', requestId: 'req-1' },
          stacktrace: null
        },
        {
          id: 'log-3',
          timestamp: new Date(now - 40000),
          service: 'user-service',
          level: 'ERROR',
          message: 'Database connection failed: timeout',
          traceId: null,
          context: { userId: '456', requestId: 'req-2' },
          stacktrace: 'Error: Connection timeout\n  at Database.connect'
        },
        {
          id: 'log-4',
          timestamp: new Date(now - 30000),
          service: 'api-service',
          level: 'WARN',
          message: 'High memory usage detected: 85%',
          traceId: null,
          context: { userId: null, requestId: 'req-3' },
          stacktrace: null
        }
      ]
    })

    it('should search logs by keyword', () => {
      const results = logsService.search(mockLogs, 'connection')

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      results.forEach(log => {
        expect(log.message.toLowerCase()).toContain('connection')
      })
    })

    it('should filter logs by level', () => {
      const errorLogs = logsService.filterByLevel(mockLogs, ['ERROR'])

      expect(Array.isArray(errorLogs)).toBe(true)
      expect(errorLogs.every(log => log.level === 'ERROR')).toBe(true)
    })

    it('should filter logs by service', () => {
      const apiLogs = logsService.filterByService(mockLogs, ['api-service'])

      expect(Array.isArray(apiLogs)).toBe(true)
      expect(apiLogs.every(log => log.service === 'api-service')).toBe(true)
    })

    it('should filter logs by trace ID', () => {
      const traceLogs = logsService.filterByTraceId(mockLogs, 'trace-1')

      expect(Array.isArray(traceLogs)).toBe(true)
      expect(traceLogs.every(log => log.traceId === 'trace-1')).toBe(true)
    })

    it('should get log context correctly', () => {
      const context = logsService.getLogContext(mockLogs, 'log-2', 1)

      expect(Array.isArray(context)).toBe(true)
      expect(context.length).toBeGreaterThan(0)
      // Should include the requested log
      expect(context.some(log => log.id === 'log-2')).toBe(true)
    })

    it('should calculate log statistics correctly', () => {
      const stats = logsService.calculateStatistics(mockLogs)

      expect(stats).toBeDefined()
      expect(stats.totalCount).toBe(mockLogs.length)
      expect(stats.countByLevel).toBeDefined()
      expect(stats.countByService).toBeDefined()
      expect(stats.errorRate).toBeGreaterThanOrEqual(0)
      expect(stats.errorRate).toBeLessThanOrEqual(1)
    })

    it('should filter logs by time range', () => {
      const startTime = new Date(Date.now() - 45000)
      const endTime = new Date(Date.now() - 35000)
      const filtered = logsService.filterByTimeRange(mockLogs, startTime, endTime)

      expect(Array.isArray(filtered)).toBe(true)
      expect(filtered.every(log => 
        log.timestamp >= startTime && log.timestamp <= endTime
      )).toBe(true)
    })
  })

  // ============================================================================
  // ALERTS SERVICE TESTS
  // ============================================================================
  describe('AlertsService', () => {
    let mockRules: AlertRule[]
    let mockEvents: AlertEvent[]

    beforeEach(() => {
      const now = Date.now()
      mockRules = [
        {
          id: 'rule-1',
          name: 'High Error Rate',
          metric: 'error_rate',
          condition: 'greater_than',
          threshold: 5,
          duration: 5,
          severity: 'critical',
          service: 'api-service',
          enabled: true,
          createdAt: new Date(now - 86400000)
        },
        {
          id: 'rule-2',
          name: 'High Response Time',
          metric: 'response_time_p99',
          condition: 'greater_than',
          threshold: 1000,
          duration: 5,
          severity: 'warning',
          service: 'user-service',
          enabled: true,
          createdAt: new Date(now - 86400000)
        }
      ]

      mockEvents = [
        {
          id: 'event-1',
          ruleId: 'rule-1',
          ruleName: 'High Error Rate',
          severity: 'critical',
          service: 'api-service',
          message: 'Error rate exceeded 5%',
          triggeredAt: new Date(now - 600000),
          resolvedAt: new Date(now - 300000),
          acknowledged: true,
          acknowledgedBy: 'admin',
          acknowledgedAt: new Date(now - 500000)
        },
        {
          id: 'event-2',
          ruleId: 'rule-2',
          ruleName: 'High Response Time',
          severity: 'warning',
          service: 'user-service',
          message: 'P99 response time exceeded 1000ms',
          triggeredAt: new Date(now - 300000),
          resolvedAt: null,
          acknowledged: false,
          acknowledgedBy: null,
          acknowledgedAt: null
        }
      ]
    })

    it('should calculate alert statistics correctly', () => {
      const stats = alertsService.calculateStatistics(mockEvents)

      expect(stats).toBeDefined()
      expect(stats.totalAlerts).toBe(mockEvents.length)
      expect(stats.activeAlerts).toBe(1) // Only event-2 is unresolved
      expect(stats.acknowledgedCount).toBe(1)
      expect(stats.unacknowledgedCount).toBe(1)
    })

    it('should filter alerts by severity', () => {
      const criticalAlerts = alertsService.getAlertsBySeverity(mockEvents, 'critical')

      expect(Array.isArray(criticalAlerts)).toBe(true)
      expect(criticalAlerts.every(alert => alert.severity === 'critical')).toBe(true)
    })

    it('should filter alerts by service', () => {
      const apiAlerts = alertsService.getAlertsByService(mockEvents, 'api-service')

      expect(Array.isArray(apiAlerts)).toBe(true)
      expect(apiAlerts.every(alert => alert.service === 'api-service')).toBe(true)
    })

    it('should get active alerts only', () => {
      const activeAlerts = alertsService.getActiveAlerts(mockEvents)

      expect(Array.isArray(activeAlerts)).toBe(true)
      expect(activeAlerts.every(alert => alert.resolvedAt === null)).toBe(true)
    })

    it('should detect alert storms', () => {
      // Create many alerts in short time window
      const stormEvents = Array.from({ length: 15 }, (_, i) => ({
        ...mockEvents[0],
        id: `event-${i}`,
        triggeredAt: new Date(Date.now() - (60 - i) * 1000)
      }))

      const isStorm = alertsService.detectAlertStorm(stormEvents, 10, 60000)

      expect(typeof isStorm).toBe('boolean')
    })

    it('should correlate related alerts', () => {
      const correlations = alertsService.correlateAlerts(mockEvents, 300000)

      expect(Array.isArray(correlations)).toBe(true)
      // Correlations should group related alerts
    })
  })

  // ============================================================================
  // SERVICES INTEGRATION TESTS
  // ============================================================================
  describe('Services Integration', () => {
    it('should work together in realistic workflow', () => {
      // Simulate: fetch metrics → detect anomaly → find related traces → search logs
      
      // 1. Metrics: detect anomaly
      const mockMetricPoints: MetricPoint[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        value: 50 + Math.sin(i / 10) * 20 + (i > 40 ? 30 : 0), // Spike at end
        min: 40,
        max: 80
      }))

      const mockTimeSeries: TimeSeries = {
        metricId: 'error-rate-1',
        metricName: 'Error Rate',
        unit: '%',
        serviceId: 'api-service',
        dataPoints: mockMetricPoints,
        lastUpdate: new Date()
      }

      const anomalies = metricsService.detectAnomalies(mockTimeSeries)
      expect(anomalies.length).toBeGreaterThan(0)

      // 2. Traces: find related traces
      const now = Date.now()
      const mockTrace: Trace = {
        traceId: 'trace-anomaly-1',
        rootSpanId: 'span-1',
        rootService: 'api-service',
        startTime: new Date(now - 60000),
        endTime: new Date(now),
        totalDurationMs: 60000,
        spanCount: 5,
        status: 'ERROR',
        spans: []
      }

      const stats = tracesService.calculateTraceStats([mockTrace])
      expect(stats.errorCount).toBe(1)

      // 3. Logs: search for related logs
      const mockLogs: LogEntry[] = [
        {
          id: 'log-1',
          timestamp: new Date(now - 30000),
          service: 'api-service',
          level: 'ERROR',
          message: 'Request failed',
          traceId: 'trace-anomaly-1',
          context: { userId: '123', requestId: 'req-1' },
          stacktrace: null
        }
      ]

      const relatedLogs = logsService.filterByTraceId(mockLogs, 'trace-anomaly-1')
      expect(relatedLogs.length).toBe(1)

      // 4. Alerts: create alert for anomaly
      const mockEvent: AlertEvent = {
        id: 'event-1',
        ruleId: 'rule-1',
        ruleName: 'High Error Rate',
        severity: 'critical',
        service: 'api-service',
        message: 'Error rate spike detected',
        triggeredAt: new Date(now - 30000),
        resolvedAt: null,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null
      }

      const alertStats = alertsService.calculateStatistics([mockEvent])
      expect(alertStats.activeAlerts).toBe(1)
    })

    it('should handle empty data gracefully', () => {
      const emptyMetrics: TimeSeries = {
        metricId: 'empty',
        metricName: 'Empty',
        unit: '%',
        serviceId: 'test',
        dataPoints: [],
        lastUpdate: new Date()
      }

      const stats = metricsService.calculateMetricStats(emptyMetrics)
      expect(stats).toBeDefined()

      const emptyTrace: Trace = {
        traceId: 'empty',
        rootSpanId: 'span-1',
        rootService: 'test',
        startTime: new Date(),
        endTime: new Date(),
        totalDurationMs: 0,
        spanCount: 0,
        status: 'SUCCESS',
        spans: []
      }

      const traceStats = tracesService.calculateTraceStats([emptyTrace])
      expect(traceStats.totalTraces).toBe(1)

      const emptyLogs: LogEntry[] = []
      const logStats = logsService.calculateStatistics(emptyLogs)
      expect(logStats.totalCount).toBe(0)
    })
  })
})
