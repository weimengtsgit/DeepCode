import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimeSeries, MetricPoint, MetricStats } from '@/types'

/**
 * Pinia store for managing cached metrics data with refresh management
 * Provides centralized state for all metric-related operations across the application
 * 
 * Responsibilities:
 * - Cache metric time-series data
 * - Track loading and error states
 * - Provide aggregation and filtering methods
 * - Manage cache invalidation
 */
export const useMetricsStore = defineStore('metrics', () => {
  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Cached metrics data indexed by metric ID
   * Structure: { 'metric_id': TimeSeries }
   */
  const metrics = ref<Record<string, TimeSeries>>({})

  /**
   * Currently loading metric IDs (for UI loading states)
   */
  const loadingMetrics = ref<Set<string>>(new Set())

  /**
   * Global loading state (true if any metric is loading)
   */
  const loading = computed(() => loadingMetrics.value.size > 0)

  /**
   * Last update timestamp for cache invalidation
   */
  const lastUpdate = ref<Date | null>(null)

  /**
   * Error state for failed metric fetches
   */
  const error = ref<Error | null>(null)

  /**
   * Cache TTL in milliseconds (5 minutes)
   */
  const CACHE_TTL_MS = 5 * 60 * 1000

  /**
   * Maximum points per series before aggregation
   */
  const MAX_POINTS_PER_SERIES = 1000

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  /**
   * Count of cached metrics
   */
  const metricCount = computed(() => Object.keys(metrics.value).length)

  /**
   * Check if cache needs refresh (older than TTL)
   */
  const isDirty = computed(() => {
    if (!lastUpdate.value) return true
    return Date.now() - lastUpdate.value.getTime() > CACHE_TTL_MS
  })

  /**
   * Check if no metrics are cached
   */
  const isEmpty = computed(() => metricCount.value === 0)

  /**
   * Get all metric IDs currently cached
   */
  const metricIds = computed(() => Object.keys(metrics.value))

  /**
   * Get all metric names (for UI dropdowns)
   */
  const metricNames = computed(() => {
    return Object.values(metrics.value).map(ts => ts.metricName)
  })

  /**
   * Get all unique services in cached metrics
   */
  const services = computed(() => {
    const serviceSet = new Set<string>()
    Object.values(metrics.value).forEach(ts => {
      serviceSet.add(ts.serviceId)
    })
    return Array.from(serviceSet)
  })

  // ============================================================================
  // ACTIONS - DATA MANAGEMENT
  // ============================================================================

  /**
   * Set metrics data in cache
   * @param metricId - Unique metric identifier
   * @param timeSeries - Complete time-series data
   */
  function setMetric(metricId: string, timeSeries: TimeSeries): void {
    metrics.value[metricId] = timeSeries
    lastUpdate.value = new Date()
    error.value = null
  }

  /**
   * Set multiple metrics at once
   * @param newMetrics - Record of metric ID to TimeSeries
   */
  function setMetrics(newMetrics: Record<string, TimeSeries>): void {
    metrics.value = { ...metrics.value, ...newMetrics }
    lastUpdate.value = new Date()
    error.value = null
  }

  /**
   * Get metric data by ID
   * @param metricId - Metric identifier
   * @returns TimeSeries or undefined if not cached
   */
  function getMetric(metricId: string): TimeSeries | undefined {
    return metrics.value[metricId]
  }

  /**
   * Get metrics for a specific service
   * @param serviceId - Service identifier
   * @returns Array of TimeSeries for that service
   */
  function getMetricsByService(serviceId: string): TimeSeries[] {
    return Object.values(metrics.value).filter(ts => ts.serviceId === serviceId)
  }

  /**
   * Get metrics by name (e.g., all "CPU_USAGE" metrics across services)
   * @param metricName - Metric name to filter by
   * @returns Array of matching TimeSeries
   */
  function getMetricsByName(metricName: string): TimeSeries[] {
    return Object.values(metrics.value).filter(ts => ts.metricName === metricName)
  }

  /**
   * Clear all cached metrics
   */
  function clearMetrics(): void {
    metrics.value = {}
    lastUpdate.value = null
    error.value = null
  }

  /**
   * Clear specific metric from cache
   * @param metricId - Metric to remove
   */
  function clearMetric(metricId: string): void {
    delete metrics.value[metricId]
  }

  /**
   * Invalidate cache (mark as dirty for refresh)
   */
  function invalidateCache(): void {
    lastUpdate.value = null
  }

  // ============================================================================
  // ACTIONS - LOADING STATE
  // ============================================================================

  /**
   * Mark metric as loading
   * @param metricId - Metric being loaded
   */
  function setMetricLoading(metricId: string, isLoading: boolean): void {
    if (isLoading) {
      loadingMetrics.value.add(metricId)
    } else {
      loadingMetrics.value.delete(metricId)
    }
  }

  /**
   * Check if specific metric is loading
   * @param metricId - Metric to check
   */
  function isMetricLoading(metricId: string): boolean {
    return loadingMetrics.value.has(metricId)
  }

  /**
   * Set global error state
   * @param err - Error object or null to clear
   */
  function setError(err: Error | null): void {
    error.value = err
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null
  }

  // ============================================================================
  // ACTIONS - DATA AGGREGATION
  // ============================================================================

  /**
   * Aggregate time-series data to reduce point count while preserving patterns
   * Uses Largest-Triangle-Three-Buckets (LTTB) algorithm
   * 
   * @param points - Original data points
   * @param maxPoints - Target number of points (default: 500)
   * @returns Aggregated points with min/max/avg per bucket
   */
  function aggregateTimeSeries(points: MetricPoint[], maxPoints: number = 500): MetricPoint[] {
    if (points.length <= maxPoints) {
      return points
    }

    const bucketSize = Math.ceil(points.length / maxPoints)
    const aggregated: MetricPoint[] = []

    for (let i = 0; i < points.length; i += bucketSize) {
      const bucket = points.slice(i, Math.min(i + bucketSize, points.length))

      if (bucket.length === 0) continue

      // Calculate statistics for bucket
      const values = bucket.map(p => p.value)
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length

      // Use first timestamp in bucket
      aggregated.push({
        timestamp: bucket[0].timestamp,
        value: avgValue,
        min: minValue,
        max: maxValue
      })
    }

    return aggregated
  }

  /**
   * Calculate statistics for a time-series
   * @param timeSeries - Time-series to analyze
   * @returns MetricStats with min, max, avg, stdDev, percentiles
   */
  function calculateMetricStats(timeSeries: TimeSeries): MetricStats {
    const values = timeSeries.dataPoints.map(p => p.value)

    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        stdDev: 0,
        p50: 0,
        p90: 0,
        p99: 0
      }
    }

    // Sort for percentile calculations
    const sorted = [...values].sort((a, b) => a - b)

    // Calculate min/max/avg
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const avg = values.reduce((a, b) => a + b, 0) / values.length

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Calculate percentiles
    const getPercentile = (p: number): number => {
      const index = Math.ceil((p / 100) * sorted.length) - 1
      return sorted[Math.max(0, index)]
    }

    return {
      min,
      max,
      avg,
      stdDev,
      p50: getPercentile(50),
      p90: getPercentile(90),
      p99: getPercentile(99)
    }
  }

  /**
   * Compare metrics across services
   * @param metricName - Metric to compare (e.g., "CPU_USAGE")
   * @param serviceIds - Services to compare
   * @returns Comparison object with stats per service
   */
  function compareMetrics(
    metricName: string,
    serviceIds: string[]
  ): Record<string, MetricStats> {
    const comparison: Record<string, MetricStats> = {}

    serviceIds.forEach(serviceId => {
      const timeSeries = Object.values(metrics.value).find(
        ts => ts.metricName === metricName && ts.serviceId === serviceId
      )

      if (timeSeries) {
        comparison[serviceId] = calculateMetricStats(timeSeries)
      }
    })

    return comparison
  }

  /**
   * Get time-series with automatic aggregation if needed
   * @param metricId - Metric to retrieve
   * @returns TimeSeries with aggregated points if > MAX_POINTS_PER_SERIES
   */
  function getAggregatedMetric(metricId: string): TimeSeries | undefined {
    const timeSeries = getMetric(metricId)
    if (!timeSeries) return undefined

    if (timeSeries.dataPoints.length > MAX_POINTS_PER_SERIES) {
      return {
        ...timeSeries,
        dataPoints: aggregateTimeSeries(timeSeries.dataPoints, MAX_POINTS_PER_SERIES)
      }
    }

    return timeSeries
  }

  // ============================================================================
  // ACTIONS - FILTERING
  // ============================================================================

  /**
   * Filter metrics by time range
   * @param metricId - Metric to filter
   * @param startTime - Start of range
   * @param endTime - End of range
   * @returns Filtered TimeSeries
   */
  function filterMetricByTimeRange(
    metricId: string,
    startTime: Date,
    endTime: Date
  ): TimeSeries | undefined {
    const timeSeries = getMetric(metricId)
    if (!timeSeries) return undefined

    const filtered = timeSeries.dataPoints.filter(
      p => p.timestamp >= startTime && p.timestamp <= endTime
    )

    return {
      ...timeSeries,
      dataPoints: filtered
    }
  }

  /**
   * Filter metrics by value range
   * @param metricId - Metric to filter
   * @param minValue - Minimum value (inclusive)
   * @param maxValue - Maximum value (inclusive)
   * @returns Filtered TimeSeries
   */
  function filterMetricByValueRange(
    metricId: string,
    minValue: number,
    maxValue: number
  ): TimeSeries | undefined {
    const timeSeries = getMetric(metricId)
    if (!timeSeries) return undefined

    const filtered = timeSeries.dataPoints.filter(
      p => p.value >= minValue && p.value <= maxValue
    )

    return {
      ...timeSeries,
      dataPoints: filtered
    }
  }

  // ============================================================================
  // ACTIONS - RESET
  // ============================================================================

  /**
   * Reset store to initial state
   */
  function reset(): void {
    metrics.value = {}
    loadingMetrics.value.clear()
    lastUpdate.value = null
    error.value = null
  }

  // ============================================================================
  // RETURN PUBLIC INTERFACE
  // ============================================================================

  return {
    // State
    metrics,
    loading,
    lastUpdate,
    error,

    // Computed
    metricCount,
    isDirty,
    isEmpty,
    metricIds,
    metricNames,
    services,

    // Data management
    setMetric,
    setMetrics,
    getMetric,
    getMetricsByService,
    getMetricsByName,
    clearMetrics,
    clearMetric,
    invalidateCache,

    // Loading state
    setMetricLoading,
    isMetricLoading,
    setError,
    clearError,

    // Aggregation
    aggregateTimeSeries,
    calculateMetricStats,
    compareMetrics,
    getAggregatedMetric,

    // Filtering
    filterMetricByTimeRange,
    filterMetricByValueRange,

    // Reset
    reset
  }
})
