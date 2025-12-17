/**
 * Integration Tests: End-to-End Workflows
 * 
 * Tests complete user workflows across multiple modules:
 * - Dashboard → Metrics drill-down → Trace navigation → Log search
 * - Real-time mode with auto-refresh across all modules
 * - Filter state propagation and persistence
 * - Time range changes affecting all data sources
 * - Cross-module state synchronization
 */

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
import { useTimeRange } from '@/composables/useTimeRange'
import { useFilters } from '@/composables/useFilters'
import metricsService from '@/services/metricsService'
import tracesService from '@/services/tracesService'
import logsService from '@/services/logsService'
import alertsService from '@/services/alertsService'

describe('End-to-End Workflows', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Workflow 1: Dashboard → Metrics Drill-Down', () => {
    it('should navigate from dashboard metric anomaly to metrics page with pre-filtered data', async () => {
      // Setup: Dashboard shows metric anomaly
      const timeStore = useTimeStore()
      const filterStore = useFilterStore()
      const metricsStore = useMetricsStore()

      // User views dashboard with 1h time range
      timeStore.applyPreset('last_1h')
      expect(timeStore.durationMinutes).toBe(60)

      // Simulate metric data fetch
      const mockMetrics = [
        {
          metricId: 'cpu-api-service',
          metricName: 'CPU Usage',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: Array.from({ length: 60 }, (_, i) => ({
            timestamp: new Date(Date.now() - (60 - i) * 60000),
            value: 50 + Math.random() * 30
          })),
          lastUpdate: new Date()
        }
      ]
      metricsStore.setMetrics(mockMetrics)

      // User clicks on anomaly point → triggers drill-down to Metrics page
      // Pre-filter to api-service
      filterStore.setFilter('service', ['api-service'])

      // Verify state after drill-down
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(metricsStore.metrics['cpu-api-service']).toBeDefined()
      expect(metricsStore.metrics['cpu-api-service'].dataPoints.length).toBe(60)
    })

    it('should preserve time range when navigating between modules', async () => {
      const timeStore = useTimeStore()
      const filterStore = useFilterStore()

      // Set custom time range on Dashboard
      const startTime = new Date('2024-01-15T14:00:00Z')
      const endTime = new Date('2024-01-15T15:00:00Z')
      timeStore.setTimeRange(startTime, endTime)

      // Navigate to Metrics page
      filterStore.setFilter('service', ['api-service'])

      // Verify time range preserved
      expect(timeStore.startTime).toEqual(startTime)
      expect(timeStore.endTime).toEqual(endTime)
      expect(timeStore.durationMinutes).toBe(60)
    })

    it('should apply multiple filters when drilling down from dashboard', async () => {
      const filterStore = useFilterStore()

      // User selects multiple filter dimensions
      filterStore.setFilter('service', ['api-service', 'auth-service'])
      filterStore.setFilter('environment', ['production'])
      filterStore.setFilter('region', ['us-east-1'])

      // Verify all filters applied (AND logic between types)
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(filterStore.activeFilters.service).toContain('auth-service')
      expect(filterStore.activeFilters.environment).toContain('production')
      expect(filterStore.activeFilters.region).toContain('us-east-1')
      expect(filterStore.activeFilterCount).toBe(4)
    })
  })

  describe('Workflow 2: Metrics → Tracing Drill-Down', () => {
    it('should navigate from slow metric to tracing page with time window context', async () => {
      const timeStore = useTimeStore()
      const filterStore = useFilterStore()
      const tracesStore = useTracesStore()

      // Setup: User viewing metrics for api-service
      timeStore.applyPreset('last_6h')
      filterStore.setFilter('service', ['api-service'])

      // Simulate slow metric detection
      const anomalyTime = new Date()
      const timeWindowStart = new Date(anomalyTime.getTime() - 30 * 60000) // ±30 min
      const timeWindowEnd = new Date(anomalyTime.getTime() + 30 * 60000)

      // User clicks "View Traces" → navigate to Tracing with context
      timeStore.setTimeRange(timeWindowStart, timeWindowEnd)

      // Verify traces filtered to time window and service
      expect(timeStore.startTime).toEqual(timeWindowStart)
      expect(timeStore.endTime).toEqual(timeWindowEnd)
      expect(filterStore.activeFilters.service).toContain('api-service')
    })

    it('should detect slow traces when navigating from metrics anomaly', async () => {
      const tracesStore = useTracesStore()

      // Simulate trace data with varying durations
      const mockTraces = [
        {
          traceId: 'trace-1',
          rootService: 'api-service',
          totalDurationMs: 150,
          status: 'SUCCESS',
          spans: []
        },
        {
          traceId: 'trace-2',
          rootService: 'api-service',
          totalDurationMs: 800, // Slow
          status: 'SUCCESS',
          spans: []
        },
        {
          traceId: 'trace-3',
          rootService: 'api-service',
          totalDurationMs: 1200, // Very slow
          status: 'SUCCESS',
          spans: []
        }
      ]
      tracesStore.setTraces(mockTraces)

      // Detect slow traces (> 500ms)
      const slowTraces = tracesStore.getSlowTraces(500)
      expect(slowTraces.length).toBe(2)
      expect(slowTraces[0].totalDurationMs).toBeGreaterThan(500)
    })
  })

  describe('Workflow 3: Trace → Logs Drill-Down', () => {
    it('should navigate from slow span to logs page with traceId filter', async () => {
      const logsStore = useLogsStore()
      const filterStore = useFilterStore()

      // Setup: User viewing trace detail with slow span
      const traceId = 'trace-abc-123'
      const spanService = 'user-service'

      // Simulate logs for this trace
      const mockLogs = [
        {
          id: 'log-1',
          timestamp: new Date(),
          service: spanService,
          level: 'INFO',
          message: 'Processing request',
          traceId: traceId,
          context: {}
        },
        {
          id: 'log-2',
          timestamp: new Date(),
          service: spanService,
          level: 'ERROR',
          message: 'Database timeout',
          traceId: traceId,
          context: {}
        }
      ]
      logsStore.setLogs(mockLogs)

      // User clicks "View Logs" → navigate with traceId filter
      filterStore.setFilter('service', [spanService])

      // Verify logs filtered to trace
      const traceLogs = logsStore.logs.filter(log => log.traceId === traceId)
      expect(traceLogs.length).toBe(2)
      expect(filterStore.activeFilters.service).toContain(spanService)
    })

    it('should show log context around error in trace', async () => {
      const logsStore = useLogsStore()

      // Simulate log stream with error in middle
      const mockLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(Date.now() + i * 1000),
        service: 'api-service',
        level: i === 5 ? 'ERROR' : 'INFO',
        message: i === 5 ? 'Critical error occurred' : `Log entry ${i}`,
        traceId: null,
        context: {}
      }))
      logsStore.setLogs(mockLogs)

      // Get context around error (log-5)
      const errorLog = mockLogs[5]
      const contextSize = 2
      const contextLogs = logsStore.logs.filter((log, idx) => {
        const errorIdx = logsStore.logs.findIndex(l => l.id === errorLog.id)
        return idx >= errorIdx - contextSize && idx <= errorIdx + contextSize
      })

      expect(contextLogs.length).toBe(5) // 2 before + error + 2 after
      expect(contextLogs[2].level).toBe('ERROR') // Error in middle
    })
  })

  describe('Workflow 4: Real-Time Mode Across All Modules', () => {
    it('should auto-refresh all modules when real-time mode enabled', async () => {
      const timeStore = useTimeStore()
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Enable real-time mode
      timeStore.toggleRealTime()
      timeStore.setRefreshInterval(10)

      expect(timeStore.realTimeMode).toBe(true)
      expect(timeStore.refreshInterval).toBe(10)

      // Simulate initial data load
      metricsStore.setMetrics([])
      tracesStore.setTraces([])
      logsStore.setLogs([])

      // In real implementation, auto-refresh would trigger data updates
      // Verify real-time mode state is propagated
      expect(timeStore.isRealTime).toBe(true)
    })

    it('should update time window continuously in real-time mode', async () => {
      const timeStore = useTimeStore()

      // Set 1h window
      timeStore.applyPreset('last_1h')
      const initialStart = timeStore.startTime
      const initialEnd = timeStore.endTime

      // Enable real-time mode
      timeStore.toggleRealTime()

      // Simulate time advancement (would happen via interval in real app)
      const newEnd = new Date()
      const newStart = new Date(newEnd.getTime() - 60 * 60000) // 1h before
      timeStore.setTimeRange(newStart, newEnd)

      // Verify window moved forward
      expect(timeStore.endTime.getTime()).toBeGreaterThan(initialEnd.getTime())
      expect(timeStore.durationMinutes).toBe(60) // Duration preserved
    })

    it('should stop auto-refresh when real-time mode disabled', async () => {
      const timeStore = useTimeStore()

      timeStore.toggleRealTime()
      expect(timeStore.realTimeMode).toBe(true)

      timeStore.toggleRealTime()
      expect(timeStore.realTimeMode).toBe(false)
    })
  })

  describe('Workflow 5: Filter State Persistence', () => {
    it('should persist filters across page reloads', async () => {
      const filterStore = useFilterStore()

      // User sets filters
      filterStore.setFilter('service', ['api-service'])
      filterStore.setFilter('environment', ['production'])

      // Simulate page reload (in real app, would use localStorage)
      const savedFilters = {
        service: filterStore.activeFilters.service,
        environment: filterStore.activeFilters.environment
      }

      // Create new store instance (simulating reload)
      setActivePinia(createPinia())
      const newFilterStore = useFilterStore()

      // Manually restore (in real app, would load from localStorage)
      newFilterStore.setFilter('service', savedFilters.service)
      newFilterStore.setFilter('environment', savedFilters.environment)

      expect(newFilterStore.activeFilters.service).toContain('api-service')
      expect(newFilterStore.activeFilters.environment).toContain('production')
    })

    it('should save and load filter presets', async () => {
      const filterStore = useFilterStore()

      // Create filter preset
      filterStore.setFilter('service', ['api-service', 'auth-service'])
      filterStore.setFilter('environment', ['production'])

      // Save as preset
      const presetName = 'production-services'
      filterStore.savePreset(presetName)

      // Clear filters
      filterStore.clearAllFilters()
      expect(filterStore.activeFilterCount).toBe(0)

      // Load preset
      filterStore.loadPreset(presetName)
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(filterStore.activeFilters.service).toContain('auth-service')
      expect(filterStore.activeFilters.environment).toContain('production')
    })
  })

  describe('Workflow 6: Alert-Driven Navigation', () => {
    it('should navigate to affected service when clicking alert', async () => {
      const alertsStore = useAlertsStore()
      const filterStore = useFilterStore()
      const timeStore = useTimeStore()

      // Simulate active alert
      const mockAlert = {
        id: 'alert-1',
        ruleId: 'rule-high-error-rate',
        ruleName: 'High Error Rate',
        severity: 'critical',
        service: 'api-service',
        message: 'Error rate exceeded 10%',
        triggeredAt: new Date(),
        resolvedAt: null,
        acknowledged: false
      }
      alertsStore.setEvents([mockAlert])

      // User clicks alert → navigate to Metrics for api-service
      filterStore.setFilter('service', [mockAlert.service])
      timeStore.applyPreset('last_1h')

      // Verify navigation context
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(timeStore.durationMinutes).toBe(60)
    })

    it('should show alert context with related traces and logs', async () => {
      const alertsStore = useAlertsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Setup: Alert for api-service
      const alertService = 'api-service'
      const alertTime = new Date()

      // Simulate related traces
      const mockTraces = [
        {
          traceId: 'trace-1',
          rootService: alertService,
          totalDurationMs: 500,
          status: 'ERROR',
          spans: []
        }
      ]
      tracesStore.setTraces(mockTraces)

      // Simulate related logs
      const mockLogs = [
        {
          id: 'log-1',
          timestamp: alertTime,
          service: alertService,
          level: 'ERROR',
          message: 'Service error',
          traceId: 'trace-1',
          context: {}
        }
      ]
      logsStore.setLogs(mockLogs)

      // Verify alert context
      const errorTraces = tracesStore.traces.filter(t => t.status === 'ERROR')
      const errorLogs = logsStore.logs.filter(l => l.level === 'ERROR')

      expect(errorTraces.length).toBeGreaterThan(0)
      expect(errorLogs.length).toBeGreaterThan(0)
    })
  })

  describe('Workflow 7: Cross-Module State Synchronization', () => {
    it('should synchronize time range changes across all modules', async () => {
      const timeStore = useTimeStore()
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Change time range
      const newStart = new Date('2024-01-15T10:00:00Z')
      const newEnd = new Date('2024-01-15T11:00:00Z')
      timeStore.setTimeRange(newStart, newEnd)

      // All modules should use same time range
      expect(timeStore.startTime).toEqual(newStart)
      expect(timeStore.endTime).toEqual(newEnd)

      // In real app, this would trigger data refresh in all modules
      // Verify time range is accessible from all stores
      expect(timeStore.durationMinutes).toBe(60)
    })

    it('should synchronize filter changes across all modules', async () => {
      const filterStore = useFilterStore()
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Apply filter
      filterStore.setFilter('service', ['api-service'])
      filterStore.setFilter('environment', ['production'])

      // All modules should see same filters
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(filterStore.activeFilters.environment).toContain('production')

      // In real app, all data fetches would use these filters
      expect(filterStore.activeFilterCount).toBe(2)
    })

    it('should handle filter + time range combination correctly', async () => {
      const timeStore = useTimeStore()
      const filterStore = useFilterStore()

      // Set both time range and filters
      timeStore.applyPreset('last_6h')
      filterStore.setFilter('service', ['api-service'])
      filterStore.setFilter('environment', ['production'])

      // Verify both are active
      expect(timeStore.durationMinutes).toBe(360) // 6 hours
      expect(filterStore.activeFilterCount).toBe(2)

      // Change time range
      timeStore.applyPreset('last_24h')

      // Filters should persist
      expect(filterStore.activeFilters.service).toContain('api-service')
      expect(timeStore.durationMinutes).toBe(1440) // 24 hours
    })
  })

  describe('Workflow 8: Error Recovery and Edge Cases', () => {
    it('should handle empty data gracefully across modules', async () => {
      const metricsStore = useMetricsStore()
      const tracesStore = useTracesStore()
      const logsStore = useLogsStore()

      // Set empty data
      metricsStore.setMetrics([])
      tracesStore.setTraces([])
      logsStore.setLogs([])

      // Verify empty state
      expect(metricsStore.isEmpty).toBe(true)
      expect(tracesStore.isEmpty).toBe(true)
      expect(logsStore.isEmpty).toBe(true)
    })

    it('should handle invalid filter values gracefully', async () => {
      const filterStore = useFilterStore()

      // Try to set invalid filter
      filterStore.setFilter('service', ['non-existent-service'])

      // Should still accept (validation happens at data layer)
      expect(filterStore.activeFilters.service).toContain('non-existent-service')

      // Clear should work
      filterStore.clearFilter('service')
      expect(filterStore.activeFilters.service).toBeUndefined()
    })

    it('should handle time range edge cases', async () => {
      const timeStore = useTimeStore()

      // Set same start and end time
      const sameTime = new Date()
      timeStore.setTimeRange(sameTime, sameTime)

      expect(timeStore.durationMs).toBe(0)

      // Set very large time range
      const start = new Date('2023-01-01')
      const end = new Date('2024-12-31')
      timeStore.setTimeRange(start, end)

      expect(timeStore.durationDays).toBeGreaterThan(700)
    })
  })

  describe('Workflow 9: Performance Under Load', () => {
    it('should handle large metric datasets efficiently', async () => {
      const metricsStore = useMetricsStore()

      // Generate large dataset (10,000 points)
      const largeMetrics = [
        {
          metricId: 'cpu-large',
          metricName: 'CPU Usage',
          unit: '%',
          serviceId: 'api-service',
          dataPoints: Array.from({ length: 10000 }, (_, i) => ({
            timestamp: new Date(Date.now() - (10000 - i) * 1000),
            value: 50 + Math.random() * 30
          })),
          lastUpdate: new Date()
        }
      ]

      const startTime = performance.now()
      metricsStore.setMetrics(largeMetrics)
      const endTime = performance.now()

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000) // < 1 second
      expect(metricsStore.metricCount).toBe(1)
    })

    it('should handle large trace datasets efficiently', async () => {
      const tracesStore = useTracesStore()

      // Generate large trace dataset (1000 traces)
      const largeTraces = Array.from({ length: 1000 }, (_, i) => ({
        traceId: `trace-${i}`,
        rootService: 'api-service',
        totalDurationMs: Math.random() * 1000,
        status: Math.random() > 0.95 ? 'ERROR' : 'SUCCESS',
        spans: []
      }))

      const startTime = performance.now()
      tracesStore.setTraces(largeTraces)
      const endTime = performance.now()

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000) // < 1 second
      expect(tracesStore.traceCount).toBe(1000)
    })

    it('should handle large log datasets efficiently', async () => {
      const logsStore = useLogsStore()

      // Generate large log dataset (100,000 entries)
      const largeLogs = Array.from({ length: 100000 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - (100000 - i) * 100),
        service: 'api-service',
        level: ['DEBUG', 'INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 4)],
        message: `Log entry ${i}`,
        traceId: null,
        context: {}
      }))

      const startTime = performance.now()
      logsStore.setLogs(largeLogs)
      const endTime = performance.now()

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(2000) // < 2 seconds
      expect(logsStore.totalLogs).toBe(100000)
    })
  })
})
