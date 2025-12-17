import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateTimeSeries,
  generateServiceMetrics,
  generateMetricPoint,
  aggregateTimeSeries,
  METRIC_CONFIGS
} from '@/mock/generators/timeSeriesGenerator'
import {
  generateTrace,
  generateTraces,
  detectSlowSpans,
  calculateTraceStats,
  buildServiceDependencyGraph
} from '@/mock/generators/traceGenerator'
import {
  generateLogs,
  generateServiceLogs,
  calculateLogStatistics,
  filterLogsByLevel,
  filterLogsByService
} from '@/mock/generators/logGenerator'
import {
  generateAlertRules,
  generateAlertEvents,
  calculateAlertStatistics,
  getActiveAlerts
} from '@/mock/generators/alertGenerator'
import { SERVICES } from '@/mock/services'
import type { MetricPoint, TimeSeries, Trace, Span, LogEntry, AlertRule, AlertEvent } from '@/types'

describe('Mock Data Generators', () => {
  describe('Time Series Generator', () => {
    it('should generate time series with correct structure', () => {
      const config = METRIC_CONFIGS.CPU_USAGE
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const timeSeries = generateTimeSeries(
        config,
        'cpu-usage',
        'CPU Usage',
        '%',
        'api-service',
        startTime,
        endTime,
        60000 // 1-minute intervals
      )

      expect(timeSeries).toBeDefined()
      expect(timeSeries.metricId).toBe('cpu-usage')
      expect(timeSeries.metricName).toBe('CPU Usage')
      expect(timeSeries.unit).toBe('%')
      expect(timeSeries.serviceId).toBe('api-service')
      expect(timeSeries.dataPoints).toBeInstanceOf(Array)
      expect(timeSeries.dataPoints.length).toBeGreaterThan(0)
    })

    it('should generate metric points within configured bounds', () => {
      const config = METRIC_CONFIGS.CPU_USAGE
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const timeSeries = generateTimeSeries(
        config,
        'cpu-usage',
        'CPU Usage',
        '%',
        'api-service',
        startTime,
        endTime,
        60000
      )

      timeSeries.dataPoints.forEach((point: MetricPoint) => {
        expect(point.value).toBeGreaterThanOrEqual(config.minValue)
        expect(point.value).toBeLessThanOrEqual(config.maxValue)
        expect(point.timestamp).toBeInstanceOf(Date)
      })
    })

    it('should generate service metrics with all metric types', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const metrics = generateServiceMetrics('api-service', 'API Service', startTime, endTime, 60000)

      expect(metrics).toBeInstanceOf(Array)
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics.every((m: TimeSeries) => m.serviceId === 'api-service')).toBe(true)
      expect(metrics.every((m: TimeSeries) => m.dataPoints.length > 0)).toBe(true)
    })

    it('should aggregate time series correctly', () => {
      const config = METRIC_CONFIGS.CPU_USAGE
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const timeSeries = generateTimeSeries(
        config,
        'cpu-usage',
        'CPU Usage',
        '%',
        'api-service',
        startTime,
        endTime,
        60000
      )

      const aggregated = aggregateTimeSeries(timeSeries.dataPoints, 10)

      expect(aggregated.length).toBeLessThanOrEqual(10)
      expect(aggregated.every((p: MetricPoint) => p.value >= config.minValue && p.value <= config.maxValue)).toBe(true)
    })

    it('should generate metric point with realistic value', () => {
      const config = METRIC_CONFIGS.RESPONSE_TIME
      const timestamp = new Date()

      const point = generateMetricPoint(config, timestamp, new Date(timestamp.getTime() - 3600000))

      expect(point.timestamp).toEqual(timestamp)
      expect(point.value).toBeGreaterThanOrEqual(config.minValue)
      expect(point.value).toBeLessThanOrEqual(config.maxValue)
    })
  })

  describe('Trace Generator', () => {
    it('should generate trace with valid structure', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const trace = generateTrace(config)

      expect(trace).toBeDefined()
      expect(trace.traceId).toBeDefined()
      expect(trace.rootSpanId).toBeDefined()
      expect(trace.rootService).toBeDefined()
      expect(trace.spans).toBeInstanceOf(Array)
      expect(trace.spans.length).toBeGreaterThan(0)
      expect(trace.status).toMatch(/SUCCESS|ERROR|TIMEOUT/)
    })

    it('should generate traces with parent-child relationships', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const trace = generateTrace(config)

      // Verify parent-child relationships
      const spanMap = new Map(trace.spans.map((s: Span) => [s.spanId, s]))

      trace.spans.forEach((span: Span) => {
        if (span.parentSpanId) {
          expect(spanMap.has(span.parentSpanId)).toBe(true)
        }
      })
    })

    it('should generate multiple traces', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const traces = generateTraces(config, 10)

      expect(traces).toBeInstanceOf(Array)
      expect(traces.length).toBe(10)
      expect(traces.every((t: Trace) => t.traceId && t.spans.length > 0)).toBe(true)
    })

    it('should detect slow spans correctly', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const trace = generateTrace(config)
      const slowSpans = detectSlowSpans(trace.spans)

      expect(slowSpans).toBeInstanceOf(Array)
      // Slow spans should be sorted by duration descending
      for (let i = 0; i < slowSpans.length - 1; i++) {
        expect(slowSpans[i].durationMs).toBeGreaterThanOrEqual(slowSpans[i + 1].durationMs)
      }
    })

    it('should calculate trace statistics', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const traces = generateTraces(config, 5)
      const stats = calculateTraceStats(traces)

      expect(stats.totalTraces).toBe(5)
      expect(stats.successCount).toBeGreaterThanOrEqual(0)
      expect(stats.errorCount).toBeGreaterThanOrEqual(0)
      expect(stats.avgDurationMs).toBeGreaterThan(0)
      expect(stats.avgSpanCount).toBeGreaterThan(0)
    })

    it('should build service dependency graph', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.05,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const traces = generateTraces(config, 5)
      const graph = buildServiceDependencyGraph(traces)

      expect(graph.nodes).toBeInstanceOf(Array)
      expect(graph.edges).toBeInstanceOf(Array)
      expect(graph.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Log Generator', () => {
    it('should generate logs with valid structure', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 10,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.005,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)

      expect(logs).toBeInstanceOf(Array)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.every((l: LogEntry) => l.id && l.timestamp && l.service && l.level && l.message)).toBe(true)
    })

    it('should generate logs with valid levels', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 10,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.005,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)
      const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']

      expect(logs.every((l: LogEntry) => validLevels.includes(l.level))).toBe(true)
    })

    it('should generate logs in chronological order', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 10,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.005,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)

      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp.getTime()).toBeLessThanOrEqual(logs[i + 1].timestamp.getTime())
      }
    })

    it('should filter logs by level', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 10,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.005,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)
      const errorLogs = filterLogsByLevel(logs, ['ERROR'])

      expect(errorLogs.every((l: LogEntry) => l.level === 'ERROR')).toBe(true)
    })

    it('should filter logs by service', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 10,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.005,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)
      const serviceLogs = filterLogsByService(logs, ['api-service'])

      expect(serviceLogs.every((l: LogEntry) => l.service === 'api-service')).toBe(true)
    })

    it('should calculate log statistics', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 10,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.005,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)
      const stats = calculateLogStatistics(logs)

      expect(stats.totalCount).toBe(logs.length)
      expect(stats.countByLevel).toBeDefined()
      expect(stats.countByService).toBeDefined()
      expect(stats.errorRate).toBeGreaterThanOrEqual(0)
      expect(stats.errorRate).toBeLessThanOrEqual(1)
    })
  })

  describe('Alert Generator', () => {
    it('should generate alert rules with valid structure', () => {
      const config = {
        services: SERVICES,
        metrics: ['CPU_USAGE', 'ERROR_RATE', 'RESPONSE_TIME'],
        severities: ['critical', 'warning', 'info'],
        ruleCount: 10
      }

      const rules = generateAlertRules(config)

      expect(rules).toBeInstanceOf(Array)
      expect(rules.length).toBeGreaterThan(0)
      expect(rules.every((r: AlertRule) => r.id && r.name && r.metric && r.condition && r.threshold)).toBe(true)
    })

    it('should generate alert events with valid structure', () => {
      const config = {
        services: SERVICES,
        metrics: ['CPU_USAGE', 'ERROR_RATE', 'RESPONSE_TIME'],
        severities: ['critical', 'warning', 'info'],
        ruleCount: 5
      }

      const rules = generateAlertRules(config)

      const eventConfig = {
        rules: rules,
        timeRange: {
          start: new Date('2024-01-15T00:00:00Z'),
          end: new Date('2024-01-15T01:00:00Z')
        },
        eventDensity: 2,
        avgDurationMinutes: 30
      }

      const events = generateAlertEvents(eventConfig)

      expect(events).toBeInstanceOf(Array)
      expect(events.every((e: AlertEvent) => e.id && e.ruleId && e.severity && e.triggeredAt)).toBe(true)
    })

    it('should calculate alert statistics', () => {
      const config = {
        services: SERVICES,
        metrics: ['CPU_USAGE', 'ERROR_RATE', 'RESPONSE_TIME'],
        severities: ['critical', 'warning', 'info'],
        ruleCount: 5
      }

      const rules = generateAlertRules(config)

      const eventConfig = {
        rules: rules,
        timeRange: {
          start: new Date('2024-01-15T00:00:00Z'),
          end: new Date('2024-01-15T01:00:00Z')
        },
        eventDensity: 2,
        avgDurationMinutes: 30
      }

      const events = generateAlertEvents(eventConfig)
      const stats = calculateAlertStatistics(events)

      expect(stats.totalEvents).toBe(events.length)
      expect(stats.countBySeverity).toBeDefined()
      expect(stats.activeCount).toBeGreaterThanOrEqual(0)
      expect(stats.acknowledgedCount).toBeGreaterThanOrEqual(0)
    })

    it('should get active alerts', () => {
      const config = {
        services: SERVICES,
        metrics: ['CPU_USAGE', 'ERROR_RATE', 'RESPONSE_TIME'],
        severities: ['critical', 'warning', 'info'],
        ruleCount: 5
      }

      const rules = generateAlertRules(config)

      const eventConfig = {
        rules: rules,
        timeRange: {
          start: new Date('2024-01-15T00:00:00Z'),
          end: new Date('2024-01-15T01:00:00Z')
        },
        eventDensity: 2,
        avgDurationMinutes: 30
      }

      const events = generateAlertEvents(eventConfig)
      const activeAlerts = getActiveAlerts(events)

      expect(activeAlerts).toBeInstanceOf(Array)
      expect(activeAlerts.every((a: AlertEvent) => !a.resolvedAt)).toBe(true)
    })
  })

  describe('Data Quality Validation', () => {
    it('should generate realistic metric distributions', () => {
      const config = METRIC_CONFIGS.CPU_USAGE
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const timeSeries = generateTimeSeries(
        config,
        'cpu-usage',
        'CPU Usage',
        '%',
        'api-service',
        startTime,
        endTime,
        60000
      )

      const values = timeSeries.dataPoints.map((p: MetricPoint) => p.value)
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
      const expectedAvg = config.baseValue

      // Average should be close to baseValue (within 20%)
      expect(Math.abs(avg - expectedAvg) / expectedAvg).toBeLessThan(0.2)
    })

    it('should generate traces with realistic error rates', () => {
      const config = {
        services: SERVICES,
        minDepth: 3,
        maxDepth: 10,
        errorRate: 0.1,
        durationMinMs: 10,
        durationMaxMs: 500,
        branchProbability: 0.7
      }

      const traces = generateTraces(config, 100)
      const errorTraces = traces.filter((t: Trace) => t.status === 'ERROR')
      const actualErrorRate = errorTraces.length / traces.length

      // Actual error rate should be close to configured rate (within 50% tolerance)
      expect(Math.abs(actualErrorRate - config.errorRate) / config.errorRate).toBeLessThan(0.5)
    })

    it('should generate logs with realistic level distribution', () => {
      const startTime = new Date('2024-01-15T00:00:00Z')
      const endTime = new Date('2024-01-15T01:00:00Z')

      const config = {
        services: SERVICES,
        timeRange: { start: startTime, end: endTime },
        baseFrequencyPerMinute: 100,
        peakHours: [[9, 12], [14, 17]],
        errorRateNormal: 0.01,
        errorRatePeak: 0.1,
        traceIdProbability: 0.2
      }

      const logs = generateLogs(config)
      const stats = calculateLogStatistics(logs)

      // INFO should be most common
      const infoCount = stats.countByLevel['INFO'] || 0
      const totalCount = logs.length
      expect(infoCount / totalCount).toBeGreaterThan(0.3)
    })
  })
})
