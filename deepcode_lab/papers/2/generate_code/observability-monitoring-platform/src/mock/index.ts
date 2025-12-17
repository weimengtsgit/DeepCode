/**
 * Mock Data Initialization System
 * 
 * Orchestrates all mock data generators (metrics, traces, logs, alerts) and populates
 * Pinia stores with realistic 24-hour historical dataset at application startup.
 * 
 * This module is the entry point for the entire mock data system and is called from
 * src/main.ts during app initialization.
 */

import { useMetricsStore } from '@/stores/metricsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useLogsStore } from '@/stores/logsStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { useTimeStore } from '@/stores/timeStore'

import { generateServiceMetrics } from './generators/timeSeriesGenerator'
import { generateTraces } from './generators/traceGenerator'
import { generateLogs } from './generators/logGenerator'
import { generateAlertRules, generateAlertEvents } from './generators/alertGenerator'

import { SERVICES, MOCK_DATA_CONFIG } from './constants'
import type { TimeSeries, Trace, LogEntry, AlertRule, AlertEvent } from '@/types'

/**
 * Global flag to track initialization status
 * Prevents multiple initializations if called multiple times
 */
let isInitialized = false

/**
 * Main initialization function that generates and populates all mock data
 * Called once from src/main.ts during app startup
 * 
 * Execution flow:
 * 1. Calculate time range (24 hours back from now)
 * 2. Generate metrics for each service
 * 3. Generate traces across all services
 * 4. Generate logs across all services
 * 5. Generate alert rules and events
 * 6. Populate all Pinia stores with generated data
 * 7. Log performance metrics
 */
export async function initializeMockData(): Promise<void> {
  // Prevent multiple initializations
  if (isInitialized) {
    console.warn('[MockData] Already initialized, skipping...')
    return
  }

  const startTime = performance.now()
  console.log('[MockData] Starting initialization...')

  try {
    // Calculate time range: 24 hours back from now
    const endTime = new Date()
    const startTimeDate = new Date(endTime.getTime() - MOCK_DATA_CONFIG.historicalDataDays * 24 * 60 * 60 * 1000)

    console.log(`[MockData] Generating data for range: ${startTimeDate.toISOString()} to ${endTime.toISOString()}`)

    // ============================================================================
    // PHASE 1: Generate Metrics Data
    // ============================================================================
    console.log('[MockData] Phase 1: Generating metrics...')
    const metricsStartTime = performance.now()

    const allMetrics: Record<string, TimeSeries> = {}
    
    for (const service of SERVICES) {
      const serviceMetrics = generateServiceMetrics(
        service.id,
        service.displayName,
        startTimeDate,
        endTime,
        60 // 1-minute interval
      )

      // Index metrics by ID for quick lookup
      for (const metric of serviceMetrics) {
        allMetrics[metric.metricId] = metric
      }
    }

    const metricsElapsed = performance.now() - metricsStartTime
    console.log(`[MockData] Generated ${Object.keys(allMetrics).length} metric time-series in ${metricsElapsed.toFixed(0)}ms`)

    // ============================================================================
    // PHASE 2: Generate Traces Data
    // ============================================================================
    console.log('[MockData] Phase 2: Generating traces...')
    const tracesStartTime = performance.now()

    const traces = generateTraces({
      services: SERVICES,
      minDepth: 3,
      maxDepth: 10,
      errorRate: 0.05, // 5% error rate
      durationMinMs: 10,
      durationMaxMs: 500,
      branchProbability: 0.7,
      timeRange: { start: startTimeDate, end: endTime }
    }, MOCK_DATA_CONFIG.tracesPerDay)

    const tracesElapsed = performance.now() - tracesStartTime
    console.log(`[MockData] Generated ${traces.length} traces in ${tracesElapsed.toFixed(0)}ms`)

    // ============================================================================
    // PHASE 3: Generate Logs Data
    // ============================================================================
    console.log('[MockData] Phase 3: Generating logs...')
    const logsStartTime = performance.now()

    const logs = generateLogs({
      services: SERVICES,
      timeRange: { start: startTimeDate, end: endTime },
      baseFrequencyPerMinute: 10,
      peakHours: [[9, 12], [14, 17]], // UTC business hours
      errorRateNormal: 0.005, // 0.5% normal error rate
      errorRatePeak: 0.1, // 10% during error clusters
      traceIdProbability: 0.2 // 20% of logs linked to traces
    })

    const logsElapsed = performance.now() - logsStartTime
    console.log(`[MockData] Generated ${logs.length} log entries in ${logsElapsed.toFixed(0)}ms`)

    // ============================================================================
    // PHASE 4: Generate Alert Rules and Events
    // ============================================================================
    console.log('[MockData] Phase 4: Generating alerts...')
    const alertsStartTime = performance.now()

    const alertRules = generateAlertRules({
      services: SERVICES,
      metrics: Object.values(allMetrics),
      severities: ['critical', 'warning', 'info'],
      ruleCount: 10
    })

    const alertEvents = generateAlertEvents({
      rules: alertRules,
      timeRange: { start: startTimeDate, end: endTime },
      eventDensity: 5, // ~5 events per rule per day
      avgDurationMinutes: 30
    })

    const alertsElapsed = performance.now() - alertsStartTime
    console.log(`[MockData] Generated ${alertRules.length} alert rules and ${alertEvents.length} alert events in ${alertsElapsed.toFixed(0)}ms`)

    // ============================================================================
    // PHASE 5: Populate Pinia Stores
    // ============================================================================
    console.log('[MockData] Phase 5: Populating stores...')
    const storesStartTime = performance.now()

    // Initialize time store with current time range
    const timeStore = useTimeStore()
    timeStore.setTimeRange(startTimeDate, endTime)
    timeStore.applyPreset('last_24h')

    // Populate metrics store
    const metricsStore = useMetricsStore()
    metricsStore.setMetrics(allMetrics)

    // Populate traces store
    const tracesStore = useTracesStore()
    tracesStore.setTraces(traces)

    // Populate logs store
    const logsStore = useLogsStore()
    logsStore.setLogs(logs)

    // Populate alerts store
    const alertsStore = useAlertsStore()
    alertsStore.setRules(alertRules)
    alertsStore.setEvents(alertEvents)

    const storesElapsed = performance.now() - storesStartTime
    console.log(`[MockData] Populated stores in ${storesElapsed.toFixed(0)}ms`)

    // ============================================================================
    // PHASE 6: Summary and Performance Metrics
    // ============================================================================
    const totalElapsed = performance.now() - startTime

    console.log('[MockData] ============================================')
    console.log('[MockData] Initialization Complete!')
    console.log('[MockData] ============================================')
    console.log(`[MockData] Total Time: ${totalElapsed.toFixed(0)}ms`)
    console.log(`[MockData] Metrics: ${Object.keys(allMetrics).length} time-series`)
    console.log(`[MockData] Traces: ${traces.length} traces (${traces.reduce((sum, t) => sum + t.spanCount, 0)} spans)`)
    console.log(`[MockData] Logs: ${logs.length} entries`)
    console.log(`[MockData] Alerts: ${alertRules.length} rules, ${alertEvents.length} events`)
    console.log(`[MockData] Memory: ~${(JSON.stringify({ allMetrics, traces, logs, alertRules, alertEvents }).length / 1024 / 1024).toFixed(1)}MB`)
    console.log('[MockData] ============================================')

    isInitialized = true
  } catch (error) {
    console.error('[MockData] Initialization failed:', error)
    throw error
  }
}

/**
 * Reset mock data and reinitialize
 * Useful for testing or manual data refresh
 */
export async function resetMockData(): Promise<void> {
  console.log('[MockData] Resetting mock data...')
  isInitialized = false
  
  // Clear all stores
  const metricsStore = useMetricsStore()
  const tracesStore = useTracesStore()
  const logsStore = useLogsStore()
  const alertsStore = useAlertsStore()

  metricsStore.clearMetrics()
  tracesStore.clearTraces()
  logsStore.clearLogs()
  alertsStore.reset()

  // Reinitialize
  await initializeMockData()
}

/**
 * Check if mock data has been initialized
 */
export function isMockDataInitialized(): boolean {
  return isInitialized
}

/**
 * Get initialization status and statistics
 */
export function getMockDataStats(): {
  initialized: boolean
  metricsCount: number
  tracesCount: number
  logsCount: number
  alertRulesCount: number
  alertEventsCount: number
} {
  const metricsStore = useMetricsStore()
  const tracesStore = useTracesStore()
  const logsStore = useLogsStore()
  const alertsStore = useAlertsStore()

  return {
    initialized: isInitialized,
    metricsCount: metricsStore.metricCount,
    tracesCount: tracesStore.traceCount,
    logsCount: logsStore.totalLogs,
    alertRulesCount: alertsStore.totalRules,
    alertEventsCount: alertsStore.events.length
  }
}

/**
 * Export initialization function as default for convenience
 */
export default initializeMockData
