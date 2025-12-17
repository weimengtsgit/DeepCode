/**
 * Mathematical utility functions for metrics analysis, percentile calculations,
 * and statistical aggregations used throughout the observability platform.
 */

import type { MetricPoint, MetricStats } from '@/types'

/**
 * Calculate percentile value from sorted array
 * Uses ceiling index method (standard for monitoring systems)
 * @param values - Array of numeric values
 * @param percentile - Percentile to calculate (0-100)
 * @returns Percentile value
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100')
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Calculate multiple percentiles efficiently (single sort)
 * @param values - Array of numeric values
 * @param percentiles - Array of percentiles to calculate
 * @returns Object mapping percentile to value
 */
export function calculatePercentiles(
  values: number[],
  percentiles: number[] = [50, 90, 99]
): Record<number, number> {
  if (values.length === 0) {
    return percentiles.reduce((acc, p) => ({ ...acc, [p]: 0 }), {})
  }

  const sorted = [...values].sort((a, b) => a - b)
  const result: Record<number, number> = {}

  for (const p of percentiles) {
    const index = Math.ceil((p / 100) * sorted.length) - 1
    result[p] = sorted[Math.max(0, index)]
  }

  return result
}

/**
 * Calculate arithmetic mean (average)
 * @param values - Array of numeric values
 * @returns Mean value
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Calculate sum of values
 * @param values - Array of numeric values
 * @returns Sum
 */
export function sum(values: number[]): number {
  return values.reduce((total, val) => total + val, 0)
}

/**
 * Calculate minimum value
 * @param values - Array of numeric values
 * @returns Minimum value
 */
export function min(values: number[]): number {
  if (values.length === 0) return 0
  return Math.min(...values)
}

/**
 * Calculate maximum value
 * @param values - Array of numeric values
 * @returns Maximum value
 */
export function max(values: number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values)
}

/**
 * Calculate standard deviation
 * Uses sample standard deviation formula (n-1 denominator)
 * @param values - Array of numeric values
 * @returns Standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0

  const mean = average(values)
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
  const variance = sum(squaredDiffs) / (values.length - 1)

  return Math.sqrt(variance)
}

/**
 * Calculate variance
 * @param values - Array of numeric values
 * @returns Variance
 */
export function variance(values: number[]): number {
  if (values.length < 2) return 0

  const mean = average(values)
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
  return sum(squaredDiffs) / (values.length - 1)
}

/**
 * Calculate median value
 * @param values - Array of numeric values
 * @returns Median value
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}

/**
 * Calculate mode (most frequent value)
 * Returns first mode if multiple exist
 * @param values - Array of numeric values
 * @returns Mode value
 */
export function mode(values: number[]): number {
  if (values.length === 0) return 0

  const frequency: Record<number, number> = {}
  let maxFreq = 0
  let modeValue = values[0]

  for (const val of values) {
    frequency[val] = (frequency[val] || 0) + 1
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val]
      modeValue = val
    }
  }

  return modeValue
}

/**
 * Calculate coefficient of variation (CV)
 * Measures relative variability (stdDev / mean)
 * @param values - Array of numeric values
 * @returns Coefficient of variation (0-1)
 */
export function coefficientOfVariation(values: number[]): number {
  const mean = average(values)
  if (mean === 0) return 0

  const stdDev = standardDeviation(values)
  return stdDev / mean
}

/**
 * Detect outliers using IQR (Interquartile Range) method
 * Values outside Q1 - 1.5*IQR to Q3 + 1.5*IQR are outliers
 * @param values - Array of numeric values
 * @returns Array of outlier values
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return []

  const q1 = calculatePercentile(values, 25)
  const q3 = calculatePercentile(values, 75)
  const iqr = q3 - q1

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return values.filter((val) => val < lowerBound || val > upperBound)
}

/**
 * Detect anomalies using statistical method (mean ± 2*stdDev)
 * Values outside this range are considered anomalies
 * @param values - Array of numeric values
 * @param threshold - Number of standard deviations (default: 2)
 * @returns Array of anomalous values
 */
export function detectAnomalies(values: number[], threshold: number = 2): number[] {
  if (values.length < 2) return []

  const mean = average(values)
  const stdDev = standardDeviation(values)

  const lowerBound = mean - threshold * stdDev
  const upperBound = mean + threshold * stdDev

  return values.filter((val) => val < lowerBound || val > upperBound)
}

/**
 * Calculate rate of change (derivative)
 * Returns array of changes between consecutive points
 * @param values - Array of numeric values
 * @returns Array of changes (length = input.length - 1)
 */
export function rateOfChange(values: number[]): number[] {
  if (values.length < 2) return []

  const changes: number[] = []
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1])
  }

  return changes
}

/**
 * Calculate moving average
 * @param values - Array of numeric values
 * @param windowSize - Size of moving window
 * @returns Array of moving averages (length = input.length - windowSize + 1)
 */
export function movingAverage(values: number[], windowSize: number = 5): number[] {
  if (values.length < windowSize) return values

  const result: number[] = []
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize)
    result.push(average(window))
  }

  return result
}

/**
 * Calculate exponential moving average (EMA)
 * Gives more weight to recent values
 * @param values - Array of numeric values
 * @param alpha - Smoothing factor (0-1, default: 0.3)
 * @returns Array of EMA values
 */
export function exponentialMovingAverage(values: number[], alpha: number = 0.3): number[] {
  if (values.length === 0) return []

  const result: number[] = [values[0]]

  for (let i = 1; i < values.length; i++) {
    const ema = alpha * values[i] + (1 - alpha) * result[i - 1]
    result.push(ema)
  }

  return result
}

/**
 * Calculate comprehensive statistics for metric data
 * @param points - Array of metric points
 * @returns MetricStats object with min, max, avg, stdDev, P50, P90, P99
 */
export function calculateMetricStats(points: MetricPoint[]): MetricStats {
  if (points.length === 0) {
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

  const values = points.map((p) => p.value)
  const percentiles = calculatePercentiles(values, [50, 90, 99])

  return {
    min: min(values),
    max: max(values),
    avg: average(values),
    stdDev: standardDeviation(values),
    p50: percentiles[50],
    p90: percentiles[90],
    p99: percentiles[99],
  }
}

/**
 * Aggregate metric points by bucketing
 * Groups points into time buckets and calculates min/max/avg per bucket
 * @param points - Array of metric points
 * @param bucketCount - Number of buckets to create
 * @returns Aggregated metric points
 */
export function aggregateMetricPoints(
  points: MetricPoint[],
  bucketCount: number = 500
): MetricPoint[] {
  if (points.length <= bucketCount) return points

  const bucketSize = Math.ceil(points.length / bucketCount)
  const aggregated: MetricPoint[] = []

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, Math.min(i + bucketSize, points.length))

    if (bucket.length === 0) continue

    const values = bucket.map((p) => p.value)
    const avgValue = average(values)
    const minValue = min(values)
    const maxValue = max(values)

    aggregated.push({
      timestamp: bucket[0].timestamp,
      value: avgValue,
      min: minValue,
      max: maxValue,
    })
  }

  return aggregated
}

/**
 * Calculate percentage change between two values
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Percentage change (-100 to +Infinity)
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100
  }

  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Calculate absolute change between two values
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Absolute change
 */
export function absoluteChange(oldValue: number, newValue: number): number {
  return newValue - oldValue
}

/**
 * Normalize values to 0-1 range (min-max normalization)
 * @param values - Array of numeric values
 * @returns Normalized values
 */
export function normalize(values: number[]): number[] {
  if (values.length === 0) return []

  const minVal = min(values)
  const maxVal = max(values)
  const range = maxVal - minVal

  if (range === 0) {
    return values.map(() => 0.5)
  }

  return values.map((val) => (val - minVal) / range)
}

/**
 * Standardize values (z-score normalization)
 * Converts to mean=0, stdDev=1
 * @param values - Array of numeric values
 * @returns Standardized values
 */
export function standardize(values: number[]): number[] {
  if (values.length < 2) return values

  const mean = average(values)
  const stdDev = standardDeviation(values)

  if (stdDev === 0) {
    return values.map(() => 0)
  }

  return values.map((val) => (val - mean) / stdDev)
}

/**
 * Calculate correlation coefficient between two arrays
 * Pearson correlation coefficient (-1 to 1)
 * @param x - First array of values
 * @param y - Second array of values
 * @returns Correlation coefficient
 */
export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0

  const meanX = average(x)
  const meanY = average(y)

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY

    numerator += dx * dy
    sumSqX += dx * dx
    sumSqY += dy * dy
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)

  if (denominator === 0) return 0

  return numerator / denominator
}

/**
 * Calculate linear regression slope and intercept
 * Returns {slope, intercept} for line y = slope*x + intercept
 * @param x - X values (typically time indices)
 * @param y - Y values (metric values)
 * @returns Object with slope and intercept
 */
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0 }
  }

  const meanX = average(x)
  const meanY = average(y)

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < x.length; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY)
    denominator += (x[i] - meanX) * (x[i] - meanX)
  }

  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = meanY - slope * meanX

  return { slope, intercept }
}

/**
 * Calculate trend direction and strength
 * @param values - Array of numeric values
 * @returns Object with direction ('up'|'down'|'stable') and strength (0-1)
 */
export function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; strength: number } {
  if (values.length < 2) {
    return { direction: 'stable', strength: 0 }
  }

  const indices = Array.from({ length: values.length }, (_, i) => i)
  const { slope } = linearRegression(indices, values)

  const absSlope = Math.abs(slope)
  const avgValue = average(values)
  const strength = avgValue === 0 ? 0 : Math.min(1, absSlope / avgValue)

  const direction = slope > 0.001 ? 'up' : slope < -0.001 ? 'down' : 'stable'

  return { direction, strength }
}
