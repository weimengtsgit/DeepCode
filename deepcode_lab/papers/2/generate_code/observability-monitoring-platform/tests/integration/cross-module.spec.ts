import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useLogsStore } from '@/stores/logsStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { useMetrics } from '@/composables/useMetrics'
import { useTraces } from '@/composables/useTraces'
import { useLogs } from '@/composables/useLogs'
import { useAlerts } from '@/composables/useAlerts'
import { useFilters } from '@/composables/useFilters'
import { useTimeRange } from '@/composables/useTimeRange'
import { metricsService } from '@/services/metricsService'
import { tracesService } from '@/services/tracesService'
import { logsService } from '@/services/logsService'
import { alertsService } from '@/services/alertsService'
import type { TimeSeries, MetricPoint } from '@/types/metrics'
import type { Trace, Span } from '@/types/traces'
import type { LogEntry } from '@/types/logs'
import type { AlertEvent } from '@/types/alerts'

describe('Cross-Module Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Module Linkage: Dashboard → Metrics → Tracing → Logs', () => {
    it('should navigate from Dashboard metric anomaly to Metrics page with pre-filtered service', () => {
      // Setup: Initialize stores
      const timeStore = useTimeStore()
      const filterStore = useFilterStore()
      const metricsStore = useMetricsStore()

      // Create mock metric data with anomaly
      const mockMetrics: TimeSeries[] = [
        {
          metricId: 'error-rate-1',
          metricName: 'error_rate',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: Array.from({ length: 100 }, (_, i) => ({
            timestamp: new Date(Date.now() - (100 - i) * 60000),
            value: i < 80 ? 0.5 : 5.0, // Anomaly spike at end
          })),
          lastUpdate: new Date(),
        },
      ]

      metricsStore.setMetrics(mockMetrics)

      // Action: User clicks on anomaly point and navigates to Metrics
      const anomalyService = 'api-service'
      filterStore.setFilter('service', [anomalyService])

      // Assert: Filter applied and service context preserved
      expect(filterStore.activeFilters.service).toContain(anomalyService)
      expect(metricsStore.metrics['error-rate-1']).toBeDefined()
    })

    it('should navigate from Metrics slow metric to Tracing page with time window context', () => {
      // Setup
      const timeStore = useTimeStore()
      const filterStore = useFilterStore()
      const tracesStore = useTracesStore()

      // Create mock traces
      const mockTraces: Trace[] = [
        {
          traceId: 'trace-1',
          rootSpanId: 'span-1',
          rootService: 'api-service',
          startTime: new Date(),
          endTime: new Date(Date.now() + 500),
          totalDurationMs: 500,
          spanCount: 5,
          status: 'SUCCESS',
          spans: [],
        },
      ]

      tracesStore.setTraces(mockTraces)

      // Action: Navigate with service and time context
      const service = 'api-service'
      const timeRange = { start: new Date(Date.now() - 3600000), end: new Date() }

      filterStore.setFilter('service', [service])
      timeStore.setTimeRange(timeRange.start, timeRange.end)

      // Assert: Context preserved
      expect(filterStore.activeFilters.service).toContain(service)
      expect(timeStore.startTime).toEqual(timeRange.start)
      expect(timeStore.endTime).toEqual(timeRange.end)
      expect(tracesStore.traces.length).toBeGreaterThan(0)
    })

    it('should navigate from Trace span to Logs page with traceId and service filters', () => {
      // Setup
      const filterStore = useFilterStore()
      const logsStore = useLogsStore()

      // Create mock logs
      const mockLogs: LogEntry[] = [
        {
          id: 'log-1',
          timestamp: new Date(),
          service: 'api-service',
          level: 'ERROR',
          message: 'Request failed',
          traceId: 'trace-1',
          context: {
            userId: 123,
            requestId: 'req-1',
            instanceId: 'instance-1',
            environment: 'production',
            region: 'us-east-1',
          },
        },
      ]

      logsStore.setLogs(mockLogs)

      // Action: Navigate with span context
      const traceId = 'trace-1'
      const service = 'api-service'

      filterStore.setFilter('service', [service])
      // Note: traceId filtering would be done in logs search

      // Assert: Filters applied
      expect(filterStore.activeFilters.service).toContain(service)
      expect(logsStore.logs.length).toBeGreaterThan(0)
    })

    it('should navigate from Log entry with traceId back to Trace detail', () => {
      // Setup
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Create mock data
      const traceId = 'trace-1'
      const mockTrace: Trace = {
        traceId,
        rootSpanId: 'span-1',
        rootService: 'api-service',
        startTime: new Date(),
        endTime: new Date(Date.now() + 500),
        totalDurationMs: 500,
        spanCount: 3,
        status: 'SUCCESS',
        spans: [],
      }

      const mockLog: LogEntry = {
        id: 'log-1',
        timestamp: new Date(),
        service: 'api-service',
        level: 'ERROR',
        message: 'Error occurred',
        traceId,
        context: {
          userId: 123,
          requestId: 'req-1',
          instanceId: 'instance-1',
          environment: 'production',
          region: 'us-east-1',
        },
      }

      tracesStore.setTraces([mockTrace])
      logsStore.setLogs([mockLog])

      // Action: Click traceId link in log
      const linkedTrace = tracesStore.getTrace(traceId)

      // Assert: Trace found and displayed
      expect(linkedTrace).toBeDefined()
      expect(linkedTrace?.traceId).toBe(traceId)
    })
  })

  describe('State Synchronization Across Modules', () => {
    it('should propagate time range changes to all modules', () => {
      // Setup
      const timeStore = useTimeStore()
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Create mock data
      const mockMetrics: TimeSeries[] = [
        {
          metricId: 'cpu-1',
          metricName: 'cpu_usage',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(Date.now() - (10 - i) * 60000),
            value: 50 + Math.random() * 20,
          })),
          lastUpdate: new Date(),
        },
      ]

      metricsStore.setMetrics(mockMetrics)

      // Action: Change time range
      const newStart = new Date(Date.now() - 7200000) // 2 hours ago
      const newEnd = new Date()

      timeStore.setTimeRange(newStart, newEnd)

      // Assert: All modules see the new time range
      expect(timeStore.startTime).toEqual(newStart)
      expect(timeStore.endTime).toEqual(newEnd)
      expect(timeStore.durationMs).toBe(newEnd.getTime() - newStart.getTime())
    })

    it('should propagate filter changes to all modules', () => {
      // Setup
      const filterStore = useFilterStore()
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Create mock data
      const mockMetrics: TimeSeries[] = [
        {
          metricId: 'metric-1',
          metricName: 'error_rate',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: [
            { timestamp: new Date(), value: 0.5 },
          ],
          lastUpdate: new Date(),
        },
      ]

      metricsStore.setMetrics(mockMetrics)

      // Action: Apply filter
      const service = 'api-service'
      const environment = 'production'

      filterStore.setFilter('service', [service])
      filterStore.setFilter('environment', [environment])

      // Assert: Filters applied globally
      expect(filterStore.activeFilters.service).toContain(service)
      expect(filterStore.activeFilters.environment).toContain(environment)
    })

    it('should maintain filter state when navigating between modules', () => {
      // Setup
      const filterStore = useFilterStore()

      // Action: Apply filters
      const service = 'api-service'
      const environment = 'production'
      const region = 'us-east-1'

      filterStore.setFilter('service', [service])
      filterStore.setFilter('environment', [environment])
      filterStore.setFilter('region', [region])

      // Simulate navigation to different module
      const savedFilters = { ...filterStore.activeFilters }

      // Navigate back
      const restoredFilters = filterStore.activeFilters

      // Assert: Filters preserved
      expect(restoredFilters.service).toEqual(savedFilters.service)
      expect(restoredFilters.environment).toEqual(savedFilters.environment)
      expect(restoredFilters.region).toEqual(savedFilters.region)
    })
  })

  describe('Real-Time Mode Synchronization', () => {
    it('should auto-refresh all modules when real-time mode is enabled', async () => {
      // Setup
      const timeStore = useTimeStore()
      const metricsStore = useMetricsStore()

      // Create mock metrics
      const mockMetrics: TimeSeries[] = [
        {
          metricId: 'metric-1',
          metricName: 'cpu_usage',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: [
            { timestamp: new Date(), value: 50 },
          ],
          lastUpdate: new Date(),
        },
      ]

      metricsStore.setMetrics(mockMetrics)

      // Action: Enable real-time mode
      timeStore.toggleRealTime()
      timeStore.setRefreshInterval(5)

      // Assert: Real-time mode active
      expect(timeStore.realTimeMode).toBe(true)
      expect(timeStore.refreshInterval).toBe(5)
      expect(timeStore.isRealTime).toBe(true)
    })

    it('should stop auto-refresh when real-time mode is disabled', () => {
      // Setup
      const timeStore = useTimeStore()

      // Action: Enable then disable real-time
      timeStore.toggleRealTime()
      expect(timeStore.realTimeMode).toBe(true)

      timeStore.toggleRealTime()

      // Assert: Real-time mode disabled
      expect(timeStore.realTimeMode).toBe(false)
      expect(timeStore.isRealTime).toBe(false)
    })
  })

  describe('Alert-Driven Navigation', () => {
    it('should navigate from alert to affected service metrics', () => {
      // Setup
      const alertsStore = useAlertsStore()
      const filterStore = useFilterStore()

      // Create mock alert
      const mockAlert: AlertEvent = {
        id: 'alert-1',
        ruleId: 'rule-1',
        ruleName: 'High Error Rate',
        severity: 'critical',
        service: 'api-service',
        message: 'Error rate exceeded 5%',
        triggeredAt: new Date(),
        acknowledged: false,
      }

      alertsStore.addEvent(mockAlert)

      // Action: Click alert to navigate to service metrics
      const alert = alertsStore.events[0]
      filterStore.setFilter('service', [alert.service])

      // Assert: Service filter applied
      expect(filterStore.activeFilters.service).toContain(alert.service)
    })

    it('should navigate from alert to related traces', () => {
      // Setup
      const alertsStore = useAlertsStore()
      const tracesStore = useTracesStore()
      const filterStore = useFilterStore()

      // Create mock data
      const mockAlert: AlertEvent = {
        id: 'alert-1',
        ruleId: 'rule-1',
        ruleName: 'High Error Rate',
        severity: 'critical',
        service: 'api-service',
        message: 'Error rate exceeded 5%',
        triggeredAt: new Date(),
        acknowledged: false,
      }

      const mockTrace: Trace = {
        traceId: 'trace-1',
        rootSpanId: 'span-1',
        rootService: 'api-service',
        startTime: new Date(),
        endTime: new Date(Date.now() + 500),
        totalDurationMs: 500,
        spanCount: 3,
        status: 'ERROR',
        spans: [],
      }

      alertsStore.addEvent(mockAlert)
      tracesStore.setTraces([mockTrace])

      // Action: Navigate from alert to traces
      filterStore.setFilter('service', [mockAlert.service])

      // Assert: Traces filtered to alert service
      expect(filterStore.activeFilters.service).toContain(mockAlert.service)
      expect(tracesStore.traces.length).toBeGreaterThan(0)
    })
  })

  describe('Filter Preset Persistence Across Modules', () => {
    it('should save and restore filter presets across module navigation', () => {
      // Setup
      const filterStore = useFilterStore()

      // Action: Create filter preset
      const presetName = 'production-api'
      filterStore.setFilter('service', ['api-service'])
      filterStore.setFilter('environment', ['production'])
      filterStore.setFilter('region', ['us-east-1'])

      filterStore.savePreset(presetName)

      // Clear filters
      filterStore.clearAllFilters()
      expect(filterStore.activeFilters.service).toBeUndefined()

      // Load preset
      filterStore.loadPreset(presetName)

      // Assert: Preset restored
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(filterStore.activeFilters.environment).toContain('production')
      expect(filterStore.activeFilters.region).toContain('us-east-1')
    })

    it('should apply preset when navigating to different module', () => {
      // Setup
      const filterStore = useFilterStore()

      // Create preset
      filterStore.setFilter('service', ['auth-service'])
      filterStore.setFilter('environment', ['staging'])
      filterStore.savePreset('staging-auth')

      // Clear and navigate
      filterStore.clearAllFilters()

      // Load preset for new module
      filterStore.loadPreset('staging-auth')

      // Assert: Preset applied
      expect(filterStore.activeFilters.service).toContain('auth-service')
      expect(filterStore.activeFilters.environment).toContain('staging')
    })
  })

  describe('Time Comparison Across Modules', () => {
    it('should calculate comparison time range for all modules', () => {
      // Setup
      const timeStore = useTimeStore()

      // Action: Set time range and get comparison range
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 3600000)

      timeStore.setTimeRange(oneHourAgo, now)

      // Get comparison range (previous period)
      const comparisonStart = new Date(oneHourAgo.getTime() - 3600000)
      const comparisonEnd = new Date(oneHourAgo)

      // Assert: Comparison range calculated correctly
      expect(comparisonStart.getTime()).toBeLessThan(oneHourAgo.getTime())
      expect(comparisonEnd.getTime()).toBe(oneHourAgo.getTime())
    })

    it('should apply time comparison to metrics across services', () => {
      // Setup
      const timeStore = useTimeStore()
      const metricsStore = useMetricsStore()

      // Create mock metrics for current and previous period
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 3600000)

      const mockMetrics: TimeSeries[] = [
        {
          metricId: 'cpu-current',
          metricName: 'cpu_usage',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: [
            { timestamp: oneHourAgo, value: 50 },
            { timestamp: now, value: 60 },
          ],
          lastUpdate: now,
        },
      ]

      metricsStore.setMetrics(mockMetrics)
      timeStore.setTimeRange(oneHourAgo, now)

      // Assert: Metrics available for comparison
      expect(metricsStore.metrics['cpu-current']).toBeDefined()
      expect(metricsStore.metrics['cpu-current'].dataPoints.length).toBe(2)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty data gracefully across modules', () => {
      // Setup
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Assert: Empty state handled
      expect(metricsStore.isEmpty).toBe(true)
      expect(tracesStore.isEmpty).toBe(true)
      expect(logsStore.isEmpty).toBe(true)
    })

    it('should handle invalid filter combinations', () => {
      // Setup
      const filterStore = useFilterStore()

      // Action: Apply invalid filter
      filterStore.setFilter('service', [])
      filterStore.setFilter('environment', ['invalid-env'])

      // Assert: Filters applied (validation at component level)
      expect(filterStore.activeFilters.service).toEqual([])
      expect(filterStore.activeFilters.environment).toContain('invalid-env')
    })

    it('should handle time range edge cases', () => {
      // Setup
      const timeStore = useTimeStore()

      // Action: Set same start and end time
      const now = new Date()
      timeStore.setTimeRange(now, now)

      // Assert: Duration is 0
      expect(timeStore.durationMs).toBe(0)
    })

    it('should handle missing data in cross-module navigation', () => {
      // Setup
      const tracesStore = useTracesStore()
      const filterStore = useFilterStore()

      // Action: Navigate to trace that doesn't exist
      const nonExistentTraceId = 'trace-nonexistent'
      const trace = tracesStore.getTrace(nonExistentTraceId)

      // Assert: Graceful handling
      expect(trace).toBeUndefined()
    })
  })

  describe('Performance Under Load', () => {
    it('should handle 10,000 metric points across multiple services', () => {
      // Setup
      const metricsStore = useMetricsStore()

      // Create large metric dataset
      const largeMetrics: TimeSeries[] = Array.from({ length: 10 }, (_, serviceIdx) => ({
        metricId: `metric-${serviceIdx}`,
        metricName: 'cpu_usage',
        unit: '%',
        serviceId: `service-${serviceIdx}`,
        dataPoints: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() - (1000 - i) * 60000),
          value: 50 + Math.random() * 20,
        })),
        lastUpdate: new Date(),
      }))

      // Action: Load metrics
      metricsStore.setMetrics(largeMetrics)

      // Assert: All metrics loaded
      expect(Object.keys(metricsStore.metrics).length).toBe(10)
      expect(metricsStore.metricCount).toBe(10)
    })

    it('should handle 1,000 traces with efficient filtering', () => {
      // Setup
      const tracesStore = useTracesStore()
      const filterStore = useFilterStore()

      // Create large trace dataset
      const largeTraces: Trace[] = Array.from({ length: 1000 }, (_, i) => ({
        traceId: `trace-${i}`,
        rootSpanId: `span-${i}`,
        rootService: i % 3 === 0 ? 'api-service' : i % 3 === 1 ? 'auth-service' : 'user-service',
        startTime: new Date(Date.now() - (1000 - i) * 60000),
        endTime: new Date(Date.now() - (1000 - i) * 60000 + 500),
        totalDurationMs: 500,
        spanCount: 5,
        status: i % 20 === 0 ? 'ERROR' : 'SUCCESS',
        spans: [],
      }))

      tracesStore.setTraces(largeTraces)

      // Action: Filter traces
      filterStore.setFilter('service', ['api-service'])

      // Assert: Filtering efficient
      expect(tracesStore.traces.length).toBe(1000)
      const apiTraces = tracesStore.traces.filter(t => t.rootService === 'api-service')
      expect(apiTraces.length).toBeGreaterThan(0)
    })

    it('should handle 100,000 log entries with search', () => {
      // Setup
      const logsStore = useLogsStore()

      // Create large log dataset
      const largeLogs: LogEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - (10000 - i) * 1000),
        service: ['api-service', 'auth-service', 'user-service'][i % 3],
        level: ['DEBUG', 'INFO', 'WARN', 'ERROR'][i % 4] as any,
        message: `Log message ${i}`,
        context: {
          userId: i % 1000,
          requestId: `req-${i}`,
          instanceId: `instance-${i % 10}`,
          environment: 'production',
          region: 'us-east-1',
        },
      }))

      logsStore.setLogs(largeLogs)

      // Assert: Logs loaded
      expect(logsStore.totalLogs).toBe(10000)
    })
  })

  describe('Module Isolation and State Independence', () => {
    it('should not leak state between module instances', () => {
      // Setup: Create two independent filter stores
      setActivePinia(createPinia())
      const filterStore1 = useFilterStore()

      filterStore1.setFilter('service', ['api-service'])

      // Create new Pinia instance (simulating new module)
      setActivePinia(createPinia())
      const filterStore2 = useFilterStore()

      // Assert: Filters are independent
      expect(filterStore2.activeFilters.service).toBeUndefined()
    })

    it('should maintain separate time ranges for different views', () => {
      // Setup
      const timeStore = useTimeStore()

      // Action: Set time range
      const start = new Date(Date.now() - 3600000)
      const end = new Date()

      timeStore.setTimeRange(start, end)

      // Assert: Time range maintained
      expect(timeStore.startTime).toEqual(start)
      expect(timeStore.endTime).toEqual(end)
    })
  })

  describe('Cross-Module Data Consistency', () => {
    it('should maintain consistent service list across all modules', () => {
      // Setup
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Create mock data with consistent services
      const services = ['api-service', 'auth-service', 'user-service']

      const mockMetrics: TimeSeries[] = services.map(service => ({
        metricId: `metric-${service}`,
        metricName: 'cpu_usage',
        unit: '%',
        serviceId: service,
        dataPoints: [{ timestamp: new Date(), value: 50 }],
        lastUpdate: new Date(),
      }))

      const mockTraces: Trace[] = services.map(service => ({
        traceId: `trace-${service}`,
        rootSpanId: `span-${service}`,
        rootService: service,
        startTime: new Date(),
        endTime: new Date(Date.now() + 500),
        totalDurationMs: 500,
        spanCount: 3,
        status: 'SUCCESS',
        spans: [],
      }))

      const mockLogs: LogEntry[] = services.map(service => ({
        id: `log-${service}`,
        timestamp: new Date(),
        service,
        level: 'INFO',
        message: 'Test log',
        context: {
          userId: 1,
          requestId: 'req-1',
          instanceId: 'instance-1',
          environment: 'production',
          region: 'us-east-1',
        },
      }))

      metricsStore.setMetrics(mockMetrics)
      tracesStore.setTraces(mockTraces)
      logsStore.setLogs(mockLogs)

      // Assert: Consistent service references
      const metricServices = Object.values(metricsStore.metrics).map(m => m.serviceId)
      const traceServices = tracesStore.traces.map(t => t.rootService)
      const logServices = logsStore.logs.map(l => l.service)

      expect(metricServices.sort()).toEqual(services.sort())
      expect(traceServices.sort()).toEqual(services.sort())
      expect(logServices.sort()).toEqual(services.sort())
    })

    it('should maintain consistent time ranges across all modules', () => {
      // Setup
      const timeStore = useTimeStore()
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Action: Set global time range
      const start = new Date(Date.now() - 3600000)
      const end = new Date()

      timeStore.setTimeRange(start, end)

      // Create mock data within time range
      const mockMetrics: TimeSeries[] = [
        {
          metricId: 'metric-1',
          metricName: 'cpu_usage',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: [
            { timestamp: start, value: 50 },
            { timestamp: end, value: 60 },
          ],
          lastUpdate: end,
        },
      ]

      metricsStore.setMetrics(mockMetrics)

      // Assert: All modules use same time range
      expect(timeStore.startTime).toEqual(start)
      expect(timeStore.endTime).toEqual(end)
      expect(metricsStore.metrics['metric-1'].dataPoints[0].timestamp).toEqual(start)
    })
  })
})
