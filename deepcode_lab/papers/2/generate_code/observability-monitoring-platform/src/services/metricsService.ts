/**
 * Metrics Service
 * Business logic layer for metrics data operations
 * Handles aggregation, filtering, comparison, and statistical analysis
 */

import type { TimeSeries, MetricPoint, MetricStats, FilterSet, DateRange } from '@/types'
import { mockAPI } from '@/mock/api'

/**
 * Service for metrics data operations
 * Provides aggregation, filtering, comparison, and statistical analysis
 */
export class MetricsService {
  /**
   * Fetch metrics for a specific service within a time range
   * @param service Service ID to fetch metrics for
   * @param timeRange Time range for metric data
   * @param metricNames Optional specific metric names to fetch
   * @returns Array of TimeSeries objects
   */
  static async getMetricsForService(
    service: string,
    timeRange: DateRange,
    metricNames?: string[]
  ): Promise<TimeSeries[]> {
    try {
      const response = await mockAPI.getMetrics(
        service,
        timeRange.start,
        timeRange.end,
        metricNames
      )

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch metrics')
      }

      return response.data
    } catch (error) {
      console.error('Error fetching metrics:', error)
      throw error
    }
  }

  /**
   * Compare metrics across multiple services
   * @param services Array of service IDs to compare
   * @param metricName Name of metric to compare
   * @param timeRange Time range for comparison
   * @returns Record mapping service IDs to their metric data
   */
  static async compareMetrics(
    services: string[],
    metricName: string,
    timeRange: DateRange
  ): Promise<Record<string, TimeSeries>> {
    try {
      const response = await mockAPI.compareMetrics(
        services,
        metricName,
        timeRange.start,
        timeRange.end
      )

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to compare metrics')
      }

      return response.data
    } catch (error) {
      console.error('Error comparing metrics:', error)
      throw error
    }
  }

  /**
   * Calculate statistics for a time series
   * @param timeSeries Time series data
   * @returns MetricStats object with min, max, avg, stdDev, percentiles
   */
  static calculateMetricStats(timeSeries: TimeSeries): MetricStats {
    const values = timeSeries.dataPoints.map((p) => p.value)

    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        stdDev: 0,
        p50: 0,
        p90: 0,
        p99: 0,
      }
    }

    // Calculate min and max
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Calculate average
    const avg = values.reduce((a, b) => a + b, 0) / values.length

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b)
    const p50 = this.calculatePercentile(sorted, 50)
    const p90 = this.calculatePercentile(sorted, 90)
    const p99 = this.calculatePercentile(sorted, 99)

    return {
      min,
      max,
      avg,
      stdDev,
      p50,
      p90,
      p99,
    }
  }

  /**
   * Calculate percentile value from sorted array
   * @param sortedValues Sorted array of numbers
   * @param percentile Percentile to calculate (0-100)
   * @returns Percentile value
   */
  private static calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1
    return sortedValues[Math.max(0, index)]
  }

  /**
   * Detect anomalies in time series (values > mean + 2*stdDev)
   * @param timeSeries Time series data
   * @returns Array of anomalous data points
   */
  static detectAnomalies(timeSeries: TimeSeries): MetricPoint[] {
    const stats = this.calculateMetricStats(timeSeries)
    const threshold = stats.avg + 2 * stats.stdDev

    return timeSeries.dataPoints.filter((point) => point.value > threshold)
  }

  /**
   * Filter time series by value range
   * @param timeSeries Time series data
   * @param minValue Minimum value (inclusive)
   * @param maxValue Maximum value (inclusive)
   * @returns Filtered time series
   */
  static filterByValueRange(
    timeSeries: TimeSeries,
    minValue: number,
    maxValue: number
  ): TimeSeries {
    return {
      ...timeSeries,
      dataPoints: timeSeries.dataPoints.filter(
        (p) => p.value >= minValue && p.value <= maxValue
      ),
    }
  }

  /**
   * Filter time series by time range
   * @param timeSeries Time series data
   * @param startTime Start of time range
   * @param endTime End of time range
   * @returns Filtered time series
   */
  static filterByTimeRange(
    timeSeries: TimeSeries,
    startTime: Date,
    endTime: Date
  ): TimeSeries {
    return {
      ...timeSeries,
      dataPoints: timeSeries.dataPoints.filter(
        (p) => p.timestamp >= startTime && p.timestamp <= endTime
      ),
    }
  }

  /**
   * Aggregate multiple time series by averaging values at same timestamps
   * @param seriesArray Array of time series to aggregate
   * @returns Aggregated time series
   */
  static aggregateMultipleSeries(seriesArray: TimeSeries[]): TimeSeries {
    if (seriesArray.length === 0) {
      return {
        metricId: 'aggregated',
        metricName: 'Aggregated Metric',
        unit: '',
        serviceId: 'aggregated',
        dataPoints: [],
        lastUpdate: new Date(),
      }
    }

    // Collect all unique timestamps
    const timestampMap = new Map<number, number[]>()

    seriesArray.forEach((series) => {
      series.dataPoints.forEach((point) => {
        const timestamp = point.timestamp.getTime()
        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, [])
        }
        timestampMap.get(timestamp)!.push(point.value)
      })
    })

    // Calculate average for each timestamp
    const aggregatedPoints: MetricPoint[] = Array.from(timestampMap.entries())
      .map(([timestamp, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        return {
          timestamp: new Date(timestamp),
          value: avg,
        }
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return {
      metricId: 'aggregated',
      metricName: 'Aggregated Metric',
      unit: seriesArray[0]?.unit || '',
      serviceId: 'aggregated',
      dataPoints: aggregatedPoints,
      lastUpdate: new Date(),
    }
  }

  /**
   * Calculate rate of change (derivative) for a time series
   * @param timeSeries Time series data
   * @returns Time series of rate of change values
   */
  static calculateRateOfChange(timeSeries: TimeSeries): TimeSeries {
    const ratePoints: MetricPoint[] = []

    for (let i = 1; i < timeSeries.dataPoints.length; i++) {
      const prev = timeSeries.dataPoints[i - 1]
      const curr = timeSeries.dataPoints[i]

      const timeDiffMs = curr.timestamp.getTime() - prev.timestamp.getTime()
      const timeDiffMin = timeDiffMs / (1000 * 60)

      if (timeDiffMin > 0) {
        const rate = (curr.value - prev.value) / timeDiffMin
        ratePoints.push({
          timestamp: curr.timestamp,
          value: rate,
        })
      }
    }

    return {
      ...timeSeries,
      metricName: `${timeSeries.metricName} (Rate)`,
      unit: `${timeSeries.unit}/min`,
      dataPoints: ratePoints,
    }
  }

  /**
   * Apply filters to metrics data
   * @param metrics Array of time series
   * @param filters Filter criteria
   * @returns Filtered metrics
   */
  static applyFilters(metrics: TimeSeries[], filters: Partial<FilterSet>): TimeSeries[] {
    let filtered = [...metrics]

    // Filter by service if specified
    if (filters.service && filters.service.length > 0) {
      filtered = filtered.filter((m) => filters.service!.includes(m.serviceId))
    }

    return filtered
  }

  /**
   * Get health status of a service based on recent metrics
   * @param metrics Array of metrics for service
   * @returns Health status: 'healthy' | 'warning' | 'critical'
   */
  static getServiceHealth(metrics: TimeSeries[]): 'healthy' | 'warning' | 'critical' {
    // Find error rate metric
    const errorRateMetric = metrics.find((m) => m.metricName.toLowerCase().includes('error'))

    if (!errorRateMetric || errorRateMetric.dataPoints.length === 0) {
      return 'healthy'
    }

    // Get latest error rate
    const latestErrorRate = errorRateMetric.dataPoints[errorRateMetric.dataPoints.length - 1]
      .value

    if (latestErrorRate > 5) {
      return 'critical'
    } else if (latestErrorRate > 1) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * Calculate moving average for a time series
   * @param timeSeries Time series data
   * @param windowSize Number of points in moving average window
   * @returns Time series with moving average values
   */
  static calculateMovingAverage(timeSeries: TimeSeries, windowSize: number = 5): TimeSeries {
    const movingAvgPoints: MetricPoint[] = []

    for (let i = 0; i < timeSeries.dataPoints.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(timeSeries.dataPoints.length, i + Math.ceil(windowSize / 2))

      const window = timeSeries.dataPoints.slice(start, end)
      const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length

      movingAvgPoints.push({
        timestamp: timeSeries.dataPoints[i].timestamp,
        value: avg,
      })
    }

    return {
      ...timeSeries,
      metricName: `${timeSeries.metricName} (MA${windowSize})`,
      dataPoints: movingAvgPoints,
    }
  }
}

// Export singleton instance
export const metricsService = MetricsService
