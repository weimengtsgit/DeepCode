import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import type { TimeSeries, MetricPoint, MetricStats, FilterSet } from '@/types'

/**
 * Composable for fetching, processing, and managing metrics data
 * Integrates with timeStore and filterStore for automatic refresh
 * Handles data aggregation and statistics calculation
 */
export function useMetrics(
  serviceId?: Ref<string> | string,
  metricNames?: Ref<string[]> | string[]
) {
  const metricsStore = useMetricsStore()
  const timeStore = useTimeStore()
  const filterStore = useFilterStore()

  // Convert props to refs if needed
  const service = ref(typeof serviceId === 'string' ? serviceId : serviceId?.value || '')
  const metrics = ref(typeof metricNames === 'string' ? [metricNames] : metricNames?.value || [])

  // State
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const refreshInterval = ref<NodeJS.Timeout | null>(null)

  // Computed properties
  const data = computed(() => {
    if (!service.value || metrics.value.length === 0) {
      return []
    }

    const serviceMetrics = metricsStore.getMetricsByService(service.value)
    return serviceMetrics.filter(ts => metrics.value.includes(ts.metricName))
  })

  const stats = computed(() => {
    const result: Record<string, MetricStats> = {}
    data.value.forEach(timeSeries => {
      result[timeSeries.metricId] = metricsStore.calculateMetricStats(timeSeries)
    })
    return result
  })

  const isLoading = computed(() => {
    return loading.value || data.value.some(ts => metricsStore.isMetricLoading(ts.metricId))
  })

  const hasError = computed(() => error.value !== null)

  const isEmpty = computed(() => data.value.length === 0 && !loading.value)

  // Methods
  /**
   * Fetch metrics for the current service and time range
   */
  async function fetchMetrics() {
    if (!service.value) {
      error.value = new Error('Service ID is required')
      return
    }

    loading.value = true
    error.value = null

    try {
      // Simulate API call - in real app, would call metricsService
      const startTime = timeStore.startTime
      const endTime = timeStore.endTime
      const filters = filterStore.activeFilters

      // Mark metrics as loading
      metrics.value.forEach(metricName => {
        const metricId = `${service.value}_${metricName}`
        metricsStore.setMetricLoading(metricId, true)
      })

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300))

      // In real implementation, would call:
      // const result = await metricsService.getMetricsForService(
      //   service.value,
      //   { start: startTime, end: endTime },
      //   filters
      // )
      // metricsStore.setMetrics(result)

      // Clear loading state
      metrics.value.forEach(metricName => {
        const metricId = `${service.value}_${metricName}`
        metricsStore.setMetricLoading(metricId, false)
      })
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch metrics')
      console.error('Error fetching metrics:', error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh metrics data
   */
  async function refresh() {
    await fetchMetrics()
  }

  /**
   * Get aggregated metric data (downsampled if >1000 points)
   */
  function getAggregatedMetric(metricId: string): TimeSeries | undefined {
    return metricsStore.getAggregatedMetric(metricId)
  }

  /**
   * Get statistics for a metric
   */
  function getMetricStats(metricId: string): MetricStats | undefined {
    return stats.value[metricId]
  }

  /**
   * Compare metrics across multiple services
   */
  function compareMetrics(metricName: string, serviceIds: string[]): Record<string, MetricStats> {
    return metricsStore.compareMetrics(metricName, serviceIds)
  }

  /**
   * Filter metric by time range
   */
  function filterByTimeRange(
    metricId: string,
    startTime: Date,
    endTime: Date
  ): TimeSeries | undefined {
    return metricsStore.filterMetricByTimeRange(metricId, startTime, endTime)
  }

  /**
   * Filter metric by value range
   */
  function filterByValueRange(
    metricId: string,
    minValue: number,
    maxValue: number
  ): TimeSeries | undefined {
    return metricsStore.filterMetricByValueRange(metricId, minValue, maxValue)
  }

  /**
   * Clear all metrics
   */
  function clear() {
    metricsStore.clearMetrics()
    error.value = null
  }

  /**
   * Set up auto-refresh in real-time mode
   */
  function setupAutoRefresh() {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }

    if (timeStore.isRealTime && timeStore.refreshInterval > 0) {
      refreshInterval.value = setInterval(() => {
        refresh()
      }, timeStore.refreshInterval * 1000)
    }
  }

  // Watchers
  watch(
    () => [service.value, metrics.value, timeStore.startTime, timeStore.endTime],
    () => {
      fetchMetrics()
    },
    { deep: true }
  )

  watch(
    () => filterStore.activeFilters,
    () => {
      fetchMetrics()
    },
    { deep: true }
  )

  watch(
    () => timeStore.isRealTime,
    () => {
      setupAutoRefresh()
    }
  )

  // Lifecycle
  onMounted(() => {
    fetchMetrics()
    setupAutoRefresh()
  })

  onUnmounted(() => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }
  })

  return {
    // State
    data,
    stats,
    loading: isLoading,
    error,
    isEmpty,
    hasError,

    // Methods
    fetchMetrics,
    refresh,
    getAggregatedMetric,
    getMetricStats,
    compareMetrics,
    filterByTimeRange,
    filterByValueRange,
    clear,

    // Utilities
    setService: (newService: string) => {
      service.value = newService
    },
    setMetrics: (newMetrics: string[]) => {
      metrics.value = newMetrics
    }
  }
}

/**
 * Composable for metric aggregation and downsampling
 */
export function useMetricAggregation() {
  const metricsStore = useMetricsStore()

  /**
   * Aggregate time series using LTTB algorithm
   * Preserves visual patterns while reducing point count
   */
  function aggregateTimeSeries(
    points: MetricPoint[],
    maxPoints: number = 500
  ): MetricPoint[] {
    return metricsStore.aggregateTimeSeries(points, maxPoints)
  }

  /**
   * Calculate percentile from metric points
   */
  function calculatePercentile(
    timeSeries: TimeSeries,
    percentile: number
  ): number {
    const values = timeSeries.dataPoints.map(p => p.value)
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Calculate multiple percentiles
   */
  function calculatePercentiles(
    timeSeries: TimeSeries,
    percentiles: number[] = [50, 90, 99]
  ): Record<number, number> {
    const result: Record<number, number> = {}
    percentiles.forEach(p => {
      result[p] = calculatePercentile(timeSeries, p)
    })
    return result
  }

  /**
   * Detect anomalies (values > mean + 2*stdDev)
   */
  function detectAnomalies(timeSeries: TimeSeries): MetricPoint[] {
    const stats = metricsStore.calculateMetricStats(timeSeries)
    const threshold = stats.avg + 2 * stats.stdDev

    return timeSeries.dataPoints.filter(point => point.value > threshold)
  }

  /**
   * Calculate trend (linear regression slope)
   */
  function calculateTrend(timeSeries: TimeSeries): number {
    const points = timeSeries.dataPoints
    if (points.length < 2) return 0

    const n = points.length
    const xValues = points.map((_, i) => i)
    const yValues = points.map(p => p.value)

    const xMean = xValues.reduce((a, b) => a + b) / n
    const yMean = yValues.reduce((a, b) => a + b) / n

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean)
      denominator += (xValues[i] - xMean) ** 2
    }

    return denominator === 0 ? 0 : numerator / denominator
  }

  return {
    aggregateTimeSeries,
    calculatePercentile,
    calculatePercentiles,
    detectAnomalies,
    calculateTrend
  }
}

/**
 * Composable for metric comparison operations
 */
export function useMetricComparison() {
  const metricsStore = useMetricsStore()

  /**
   * Compare metric across services
   */
  function compareAcrossServices(
    metricName: string,
    serviceIds: string[]
  ): Record<string, MetricStats> {
    return metricsStore.compareMetrics(metricName, serviceIds)
  }

  /**
   * Compare metric across time periods
   */
  function compareTimePeriods(
    metricId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): { period1: MetricStats; period2: MetricStats; change: number } {
    const metric = metricsStore.getMetric(metricId)
    if (!metric) {
      return {
        period1: {} as MetricStats,
        period2: {} as MetricStats,
        change: 0
      }
    }

    const period1Data = metric.dataPoints.filter(
      p => p.timestamp >= period1Start && p.timestamp <= period1End
    )
    const period2Data = metric.dataPoints.filter(
      p => p.timestamp >= period2Start && p.timestamp <= period2End
    )

    const period1Stats = calculateStats(period1Data)
    const period2Stats = calculateStats(period2Data)

    const change = ((period2Stats.avg - period1Stats.avg) / period1Stats.avg) * 100

    return {
      period1: period1Stats,
      period2: period2Stats,
      change
    }
  }

  /**
   * Calculate stats from metric points
   */
  function calculateStats(points: MetricPoint[]): MetricStats {
    if (points.length === 0) {
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

    const values = points.map(p => p.value)
    const sorted = [...values].sort((a, b) => a - b)

    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const avg = values.reduce((a, b) => a + b) / values.length

    const variance =
      values.reduce((sum, val) => sum + (val - avg) ** 2, 0) / values.length
    const stdDev = Math.sqrt(variance)

    const getPercentile = (p: number) => {
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

  return {
    compareAcrossServices,
    compareTimePeriods
  }
}
