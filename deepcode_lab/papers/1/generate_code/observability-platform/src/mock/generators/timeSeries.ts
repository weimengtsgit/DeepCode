/**
 * Time Series Data Generator
 * 
 * Generates realistic monitoring metrics with cyclical patterns and noise
 * using sine wave + random noise algorithm.
 * 
 * Algorithm: value(t) = baseline + amplitude·sin(2πft) + noise·rand(-1,1)
 */

import { randomFloat, clamp, generateTimePoints } from './utils'
import type { MetricDataPoint } from '@/types/metrics'

/**
 * Configuration for time series generation
 */
export interface TimeSeriesConfig {
  /** Start timestamp (milliseconds) */
  startTime: number
  /** End timestamp (milliseconds) */
  endTime: number
  /** Data point interval (milliseconds), default: 60000 (1 minute) */
  interval?: number
  /** Base value around which the series oscillates */
  baseValue: number
  /** Amplitude of the sine wave (peak deviation from baseline) */
  amplitude: number
  /** Frequency of the sine wave (milliseconds for one complete cycle), default: 3600000 (1 hour) */
  frequency?: number
  /** Noise level (0-1 scale), default: 0.3 */
  noiseLevel?: number
  /** Minimum allowed value (for clamping), default: 0 */
  minValue?: number
  /** Maximum allowed value (for clamping), default: Infinity */
  maxValue?: number
  /** Probability of anomaly spike (0-1), default: 0.02 (2%) */
  anomalyProbability?: number
  /** Anomaly multiplier range [min, max], default: [1.5, 3] */
  anomalyMultiplier?: [number, number]
  /** Apply trend (linear increase/decrease over time), default: 0 */
  trend?: number
  /** Tags to attach to each data point */
  tags?: Record<string, string>
}

/**
 * Generate time series data with sine wave + noise pattern
 * 
 * @param config - Time series configuration
 * @returns Array of metric data points
 * 
 * @example
 * ```typescript
 * // Generate CPU usage metrics
 * const cpuData = generateTimeSeries({
 *   startTime: Date.now() - 24*3600*1000,
 *   endTime: Date.now(),
 *   interval: 60000,
 *   baseValue: 45,
 *   amplitude: 15,
 *   frequency: 3600000,
 *   noiseLevel: 0.3
 * })
 * ```
 */
export function generateTimeSeries(config: TimeSeriesConfig): MetricDataPoint[] {
  const {
    startTime,
    endTime,
    interval = 60000, // 1 minute default
    baseValue,
    amplitude,
    frequency = 3600000, // 1 hour default
    noiseLevel = 0.3,
    minValue = 0,
    maxValue = Infinity,
    anomalyProbability = 0.02,
    anomalyMultiplier = [1.5, 3],
    trend = 0,
    tags
  } = config

  const data: MetricDataPoint[] = []
  const timePoints = generateTimePoints(startTime, endTime, interval)
  const totalDuration = endTime - startTime

  for (const timestamp of timePoints) {
    // Calculate normalized time for sine wave
    const t = (timestamp - startTime) / frequency
    
    // Sine component: creates cyclical pattern
    const sineValue = amplitude * Math.sin(2 * Math.PI * t)
    
    // Noise component: adds randomness
    const noise = (randomFloat(-1, 1)) * noiseLevel * amplitude
    
    // Trend component: linear increase/decrease over time
    const trendValue = trend * ((timestamp - startTime) / totalDuration)
    
    // Calculate base value
    let value = baseValue + sineValue + noise + trendValue
    
    // Inject anomalies (spikes)
    if (Math.random() < anomalyProbability) {
      const multiplier = randomFloat(anomalyMultiplier[0], anomalyMultiplier[1])
      value = value * multiplier
    }
    
    // Clamp to valid range
    value = clamp(value, minValue, maxValue)
    
    // Create data point
    const dataPoint: MetricDataPoint = {
      timestamp,
      value,
      ...(tags && { tags })
    }
    
    data.push(dataPoint)
  }

  return data
}

/**
 * Generate multiple time series with different configurations
 * Useful for creating multi-line charts (e.g., P50, P90, P99)
 * 
 * @param configs - Array of time series configurations
 * @returns Map of series name to data points
 */
export function generateMultipleTimeSeries(
  configs: Array<TimeSeriesConfig & { name: string }>
): Record<string, MetricDataPoint[]> {
  const result: Record<string, MetricDataPoint[]> = {}
  
  for (const config of configs) {
    const { name, ...seriesConfig } = config
    result[name] = generateTimeSeries(seriesConfig)
  }
  
  return result
}

/**
 * Generate CPU usage time series (0-100%)
 */
export function generateCPUTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000
): MetricDataPoint[] {
  return generateTimeSeries({
    startTime,
    endTime,
    interval,
    baseValue: 45,
    amplitude: 15,
    frequency: 3600000, // 1 hour cycle
    noiseLevel: 0.3,
    minValue: 0,
    maxValue: 100,
    anomalyProbability: 0.02
  })
}

/**
 * Generate memory usage time series (0-100%)
 */
export function generateMemoryTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000
): MetricDataPoint[] {
  return generateTimeSeries({
    startTime,
    endTime,
    interval,
    baseValue: 65,
    amplitude: 10,
    frequency: 7200000, // 2 hour cycle
    noiseLevel: 0.2,
    minValue: 0,
    maxValue: 100,
    trend: 0.05, // Slight upward trend (memory leak simulation)
    anomalyProbability: 0.01
  })
}

/**
 * Generate error rate time series (0-1, representing 0-100%)
 */
export function generateErrorRateTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000,
  baseErrorRate: number = 0.02 // 2% base error rate
): MetricDataPoint[] {
  return generateTimeSeries({
    startTime,
    endTime,
    interval,
    baseValue: baseErrorRate,
    amplitude: baseErrorRate * 0.5,
    frequency: 3600000,
    noiseLevel: 0.4,
    minValue: 0,
    maxValue: 1,
    anomalyProbability: 0.05, // 5% chance of error spike
    anomalyMultiplier: [2, 5]
  })
}

/**
 * Generate response time time series (milliseconds)
 */
export function generateResponseTimeTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000,
  baseResponseTime: number = 120 // 120ms base
): MetricDataPoint[] {
  return generateTimeSeries({
    startTime,
    endTime,
    interval,
    baseValue: baseResponseTime,
    amplitude: baseResponseTime * 0.25,
    frequency: 3600000,
    noiseLevel: 0.3,
    minValue: 1,
    anomalyProbability: 0.03,
    anomalyMultiplier: [2, 4]
  })
}

/**
 * Generate QPS (Queries Per Second) time series
 */
export function generateQPSTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000,
  baseQPS: number = 1000
): MetricDataPoint[] {
  return generateTimeSeries({
    startTime,
    endTime,
    interval,
    baseValue: baseQPS,
    amplitude: baseQPS * 0.3,
    frequency: 3600000,
    noiseLevel: 0.25,
    minValue: 0,
    anomalyProbability: 0.02
  })
}

/**
 * Generate request count time series (cumulative)
 */
export function generateRequestCountTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000,
  requestsPerInterval: number = 1000
): MetricDataPoint[] {
  const data: MetricDataPoint[] = []
  const timePoints = generateTimePoints(startTime, endTime, interval)
  let cumulativeCount = 0

  for (const timestamp of timePoints) {
    // Add random variation to requests per interval
    const variation = randomFloat(0.8, 1.2)
    const requests = Math.floor(requestsPerInterval * variation)
    cumulativeCount += requests

    data.push({
      timestamp,
      value: cumulativeCount
    })
  }

  return data
}

/**
 * Generate network traffic time series (bytes/second)
 */
export function generateNetworkTrafficTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000,
  baseTraffic: number = 1024 * 1024 * 10 // 10 MB/s
): MetricDataPoint[] {
  return generateTimeSeries({
    startTime,
    endTime,
    interval,
    baseValue: baseTraffic,
    amplitude: baseTraffic * 0.4,
    frequency: 3600000,
    noiseLevel: 0.35,
    minValue: 0,
    anomalyProbability: 0.02
  })
}

/**
 * Generate percentile time series (P50, P90, P95, P99)
 * Returns multiple series with increasing values
 */
export function generatePercentileTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000,
  baseValue: number = 100 // Base P50 value
): Record<string, MetricDataPoint[]> {
  return generateMultipleTimeSeries([
    {
      name: 'p50',
      startTime,
      endTime,
      interval,
      baseValue: baseValue,
      amplitude: baseValue * 0.2,
      frequency: 3600000,
      noiseLevel: 0.25,
      minValue: 1
    },
    {
      name: 'p90',
      startTime,
      endTime,
      interval,
      baseValue: baseValue * 1.5,
      amplitude: baseValue * 0.3,
      frequency: 3600000,
      noiseLevel: 0.3,
      minValue: 1
    },
    {
      name: 'p95',
      startTime,
      endTime,
      interval,
      baseValue: baseValue * 2,
      amplitude: baseValue * 0.4,
      frequency: 3600000,
      noiseLevel: 0.35,
      minValue: 1
    },
    {
      name: 'p99',
      startTime,
      endTime,
      interval,
      baseValue: baseValue * 3,
      amplitude: baseValue * 0.6,
      frequency: 3600000,
      noiseLevel: 0.4,
      minValue: 1,
      anomalyProbability: 0.05,
      anomalyMultiplier: [1.5, 3]
    }
  ])
}

/**
 * Generate disk usage time series (0-100%)
 * Typically shows gradual increase with occasional drops (cleanup)
 */
export function generateDiskUsageTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000
): MetricDataPoint[] {
  const data: MetricDataPoint[] = []
  const timePoints = generateTimePoints(startTime, endTime, interval)
  let currentUsage = 60 // Start at 60%

  for (const timestamp of timePoints) {
    // Gradual increase
    currentUsage += randomFloat(0, 0.5)
    
    // Occasional cleanup (10% chance)
    if (Math.random() < 0.1) {
      currentUsage -= randomFloat(5, 15)
    }
    
    // Add noise
    const noise = randomFloat(-1, 1)
    let value = currentUsage + noise
    
    // Clamp to valid range
    value = clamp(value, 0, 100)
    
    data.push({
      timestamp,
      value
    })
    
    currentUsage = value
  }

  return data
}

/**
 * Generate availability time series (0-1, representing 0-100%)
 * Typically very high (99%+) with occasional dips
 */
export function generateAvailabilityTimeSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000
): MetricDataPoint[] {
  const data: MetricDataPoint[] = []
  const timePoints = generateTimePoints(startTime, endTime, interval)

  for (const timestamp of timePoints) {
    // Base availability: 99.9%
    let value = 0.999
    
    // 1% chance of availability drop
    if (Math.random() < 0.01) {
      value = randomFloat(0.95, 0.99)
    }
    
    // Small noise
    value += randomFloat(-0.001, 0.001)
    
    // Clamp to valid range
    value = clamp(value, 0, 1)
    
    data.push({
      timestamp,
      value
    })
  }

  return data
}

/**
 * Aggregate time series data by reducing data points
 * Useful for reducing chart rendering load
 * 
 * @param data - Original time series data
 * @param targetPoints - Target number of data points
 * @returns Aggregated data points
 */
export function aggregateTimeSeries(
  data: MetricDataPoint[],
  targetPoints: number
): MetricDataPoint[] {
  if (data.length <= targetPoints) {
    return data
  }

  const bucketSize = Math.ceil(data.length / targetPoints)
  const aggregated: MetricDataPoint[] = []

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize)
    
    // Calculate average for the bucket
    const avgValue = bucket.reduce((sum, point) => sum + point.value, 0) / bucket.length
    
    // Use first timestamp in bucket
    const timestamp = bucket[0].timestamp
    
    // Merge tags if present
    const tags = bucket[0].tags
    
    aggregated.push({
      timestamp,
      value: avgValue,
      ...(tags && { tags })
    })
  }

  return aggregated
}
