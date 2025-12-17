/**
 * Time Series Data Generator
 * 
 * Generates realistic time-series metric data using mathematical models:
 * - Sine wave patterns for cyclical behavior
 * - Random noise for realistic fluctuations
 * - Anomaly injection for testing alert systems
 * - Multiple aggregation strategies
 */

import type {
  MetricDataPoint,
  MetricTimeSeries,
  MetricType,
  MetricUnit,
  AggregationType,
  MetricLabels
} from '@/types/metrics';

/**
 * Configuration for time series generation
 */
export interface TimeSeriesConfig {
  /** Metric type identifier */
  metricType: MetricType;
  /** Start timestamp (Unix milliseconds) */
  startTime: number;
  /** End timestamp (Unix milliseconds) */
  endTime: number;
  /** Interval between data points (milliseconds) */
  interval: number;
  /** Base value around which data oscillates */
  baseValue: number;
  /** Amplitude of sine wave oscillation */
  amplitude: number;
  /** Period of sine wave (milliseconds) */
  period?: number;
  /** Random noise percentage (0-1) */
  noiseLevel?: number;
  /** Trend slope (positive = increasing, negative = decreasing) */
  trend?: number;
  /** Metric unit */
  unit?: MetricUnit;
  /** Metric labels */
  labels?: MetricLabels;
  /** Inject anomalies (spikes/drops) */
  anomalies?: AnomalyConfig[];
}

/**
 * Anomaly injection configuration
 */
export interface AnomalyConfig {
  /** Timestamp of anomaly */
  timestamp: number;
  /** Multiplier for anomaly (>1 for spike, <1 for drop) */
  multiplier: number;
  /** Duration of anomaly effect (milliseconds) */
  duration: number;
}

/**
 * Pattern type for different metric behaviors
 */
export type PatternType = 'sine' | 'linear' | 'exponential' | 'step' | 'random' | 'constant';

/**
 * Generate time series data with sine wave + noise pattern
 */
export function generateTimeSeries(config: TimeSeriesConfig): MetricTimeSeries {
  const {
    metricType,
    startTime,
    endTime,
    interval,
    baseValue,
    amplitude,
    period = 3600000, // Default 1 hour period
    noiseLevel = 0.1,
    trend = 0,
    unit = 'count',
    labels = {},
    anomalies = []
  } = config;

  const dataPoints: MetricDataPoint[] = [];
  const totalDuration = endTime - startTime;
  const pointCount = Math.floor(totalDuration / interval);

  for (let i = 0; i <= pointCount; i++) {
    const timestamp = startTime + i * interval;
    const progress = i / pointCount;

    // Sine wave component
    const sineValue = Math.sin((2 * Math.PI * (timestamp - startTime)) / period) * amplitude;

    // Trend component
    const trendValue = trend * progress * baseValue;

    // Random noise component
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * baseValue;

    // Base calculation
    let value = baseValue + sineValue + trendValue + noise;

    // Apply anomalies
    for (const anomaly of anomalies) {
      if (
        timestamp >= anomaly.timestamp &&
        timestamp < anomaly.timestamp + anomaly.duration
      ) {
        const anomalyProgress =
          (timestamp - anomaly.timestamp) / anomaly.duration;
        // Smooth transition in/out of anomaly
        const smoothing = Math.sin(anomalyProgress * Math.PI);
        value *= 1 + (anomaly.multiplier - 1) * smoothing;
      }
    }

    // Ensure non-negative values for most metrics
    if (!metricType.includes('change') && !metricType.includes('delta')) {
      value = Math.max(0, value);
    }

    dataPoints.push({
      timestamp,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      labels
    });
  }

  return {
    metric: metricType,
    labels,
    dataPoints,
    unit,
    aggregation: 'avg' as AggregationType
  };
}

/**
 * Generate QPS (Queries Per Second) time series
 */
export function generateQPSTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  baseQPS: number = 1000,
  labels?: MetricLabels
): MetricTimeSeries {
  return generateTimeSeries({
    metricType: 'qps',
    startTime,
    endTime,
    interval,
    baseValue: baseQPS,
    amplitude: baseQPS * 0.3, // 30% oscillation
    period: 3600000, // 1 hour cycle
    noiseLevel: 0.15,
    unit: 'rate',
    labels
  });
}

/**
 * Generate latency percentile time series (P50, P90, P99)
 */
export function generateLatencyTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  percentile: 'p50' | 'p90' | 'p99',
  labels?: MetricLabels
): MetricTimeSeries {
  const baseLatencies = {
    p50: 50,
    p90: 120,
    p99: 350
  };

  const baseLatency = baseLatencies[percentile];

  return generateTimeSeries({
    metricType: percentile,
    startTime,
    endTime,
    interval,
    baseValue: baseLatency,
    amplitude: baseLatency * 0.2,
    period: 7200000, // 2 hour cycle
    noiseLevel: 0.1,
    unit: 'milliseconds',
    labels
  });
}

/**
 * Generate error rate time series (percentage)
 */
export function generateErrorRateTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  baseErrorRate: number = 1.5,
  labels?: MetricLabels
): MetricTimeSeries {
  // Inject occasional error spikes
  const anomalies: AnomalyConfig[] = [];
  const duration = endTime - startTime;
  const spikeCount = Math.floor(duration / 3600000); // One spike per hour

  for (let i = 0; i < spikeCount; i++) {
    anomalies.push({
      timestamp: startTime + Math.random() * duration,
      multiplier: 2 + Math.random() * 3, // 2x-5x spike
      duration: 300000 // 5 minutes
    });
  }

  return generateTimeSeries({
    metricType: 'error_rate',
    startTime,
    endTime,
    interval,
    baseValue: baseErrorRate,
    amplitude: baseErrorRate * 0.3,
    period: 1800000, // 30 minute cycle
    noiseLevel: 0.2,
    unit: 'percent',
    labels,
    anomalies
  });
}

/**
 * Generate CPU usage time series (percentage)
 */
export function generateCPUUsageTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  baseCPU: number = 45,
  labels?: MetricLabels
): MetricTimeSeries {
  return generateTimeSeries({
    metricType: 'cpu_usage',
    startTime,
    endTime,
    interval,
    baseValue: baseCPU,
    amplitude: baseCPU * 0.25,
    period: 5400000, // 1.5 hour cycle
    noiseLevel: 0.12,
    unit: 'percent',
    labels
  });
}

/**
 * Generate memory usage time series (bytes)
 */
export function generateMemoryUsageTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  baseMemoryGB: number = 3,
  labels?: MetricLabels
): MetricTimeSeries {
  const baseMemoryBytes = baseMemoryGB * 1024 * 1024 * 1024;

  return generateTimeSeries({
    metricType: 'memory_usage',
    startTime,
    endTime,
    interval,
    baseValue: baseMemoryBytes,
    amplitude: baseMemoryBytes * 0.15,
    period: 7200000, // 2 hour cycle
    noiseLevel: 0.08,
    trend: 0.05, // Slight upward trend (memory leak simulation)
    unit: 'bytes',
    labels
  });
}

/**
 * Generate network I/O time series (bytes per second)
 */
export function generateNetworkIOTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  direction: 'in' | 'out',
  baseThroughputMBps: number = 50,
  labels?: MetricLabels
): MetricTimeSeries {
  const baseThroughputBps = baseThroughputMBps * 1024 * 1024;

  return generateTimeSeries({
    metricType: direction === 'in' ? 'network_in' : 'network_out',
    startTime,
    endTime,
    interval,
    baseValue: baseThroughputBps,
    amplitude: baseThroughputBps * 0.4,
    period: 3600000, // 1 hour cycle
    noiseLevel: 0.2,
    unit: 'bytes',
    labels
  });
}

/**
 * Generate disk I/O time series (operations per second)
 */
export function generateDiskIOTimeSeries(
  startTime: number,
  endTime: number,
  interval: number,
  operation: 'read' | 'write',
  baseIOPS: number = 500,
  labels?: MetricLabels
): MetricTimeSeries {
  return generateTimeSeries({
    metricType: operation === 'read' ? 'disk_read' : 'disk_write',
    startTime,
    endTime,
    interval,
    baseValue: baseIOPS,
    amplitude: baseIOPS * 0.35,
    period: 1800000, // 30 minute cycle
    noiseLevel: 0.18,
    unit: 'ops',
    labels
  });
}

/**
 * Generate custom pattern time series
 */
export function generatePatternTimeSeries(
  metricType: MetricType,
  startTime: number,
  endTime: number,
  interval: number,
  pattern: PatternType,
  baseValue: number,
  unit: MetricUnit = 'count',
  labels?: MetricLabels
): MetricTimeSeries {
  const dataPoints: MetricDataPoint[] = [];
  const totalDuration = endTime - startTime;
  const pointCount = Math.floor(totalDuration / interval);

  for (let i = 0; i <= pointCount; i++) {
    const timestamp = startTime + i * interval;
    const progress = i / pointCount;
    let value: number;

    switch (pattern) {
      case 'sine':
        value = baseValue + Math.sin(progress * 2 * Math.PI) * baseValue * 0.3;
        break;
      case 'linear':
        value = baseValue * (1 + progress);
        break;
      case 'exponential':
        value = baseValue * Math.exp(progress);
        break;
      case 'step':
        value = baseValue * (1 + Math.floor(progress * 5) * 0.2);
        break;
      case 'random':
        value = baseValue * (0.5 + Math.random());
        break;
      case 'constant':
      default:
        value = baseValue;
        break;
    }

    dataPoints.push({
      timestamp,
      value: Math.round(value * 100) / 100,
      labels
    });
  }

  return {
    metric: metricType,
    labels: labels || {},
    dataPoints,
    unit,
    aggregation: 'avg' as AggregationType
  };
}

/**
 * Aggregate time series data by downsampling
 */
export function aggregateTimeSeries(
  timeSeries: MetricTimeSeries,
  targetInterval: number,
  aggregation: AggregationType = 'avg'
): MetricTimeSeries {
  if (timeSeries.dataPoints.length === 0) {
    return timeSeries;
  }

  const aggregatedPoints: MetricDataPoint[] = [];
  const buckets = new Map<number, number[]>();

  // Group data points into buckets
  for (const point of timeSeries.dataPoints) {
    const bucketTime = Math.floor(point.timestamp / targetInterval) * targetInterval;
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime)!.push(point.value);
  }

  // Aggregate each bucket
  for (const [timestamp, values] of buckets.entries()) {
    let aggregatedValue: number;

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((sum, v) => sum + v, 0);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'p50':
        aggregatedValue = percentile(values, 0.5);
        break;
      case 'p90':
        aggregatedValue = percentile(values, 0.9);
        break;
      case 'p95':
        aggregatedValue = percentile(values, 0.95);
        break;
      case 'p99':
        aggregatedValue = percentile(values, 0.99);
        break;
      case 'avg':
      default:
        aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length;
        break;
    }

    aggregatedPoints.push({
      timestamp,
      value: Math.round(aggregatedValue * 100) / 100,
      labels: timeSeries.labels
    });
  }

  // Sort by timestamp
  aggregatedPoints.sort((a, b) => a.timestamp - b.timestamp);

  return {
    ...timeSeries,
    dataPoints: aggregatedPoints,
    aggregation
  };
}

/**
 * Calculate percentile from array of values
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Detect optimal interval based on time range
 */
export function getOptimalInterval(startTime: number, endTime: number): number {
  const duration = endTime - startTime;
  const targetPoints = 200; // Target number of data points

  // Calculate base interval
  let interval = Math.floor(duration / targetPoints);

  // Round to nice intervals
  if (interval < 1000) return 1000; // 1 second minimum
  if (interval < 5000) return 5000; // 5 seconds
  if (interval < 10000) return 10000; // 10 seconds
  if (interval < 30000) return 30000; // 30 seconds
  if (interval < 60000) return 60000; // 1 minute
  if (interval < 300000) return 300000; // 5 minutes
  if (interval < 900000) return 900000; // 15 minutes
  if (interval < 1800000) return 1800000; // 30 minutes
  if (interval < 3600000) return 3600000; // 1 hour
  return 21600000; // 6 hours
}

/**
 * Generate multiple related time series (e.g., P50, P90, P99 together)
 */
export function generateMultiSeriesLatency(
  startTime: number,
  endTime: number,
  interval: number,
  labels?: MetricLabels
): MetricTimeSeries[] {
  return [
    generateLatencyTimeSeries(startTime, endTime, interval, 'p50', labels),
    generateLatencyTimeSeries(startTime, endTime, interval, 'p90', labels),
    generateLatencyTimeSeries(startTime, endTime, interval, 'p99', labels)
  ];
}

/**
 * Generate complete service metrics set
 */
export function generateServiceMetrics(
  serviceName: string,
  startTime: number,
  endTime: number,
  interval: number
): Record<string, MetricTimeSeries> {
  const labels: MetricLabels = { service: serviceName };

  return {
    qps: generateQPSTimeSeries(startTime, endTime, interval, 1000, labels),
    p50: generateLatencyTimeSeries(startTime, endTime, interval, 'p50', labels),
    p90: generateLatencyTimeSeries(startTime, endTime, interval, 'p90', labels),
    p99: generateLatencyTimeSeries(startTime, endTime, interval, 'p99', labels),
    error_rate: generateErrorRateTimeSeries(startTime, endTime, interval, 1.5, labels),
    cpu_usage: generateCPUUsageTimeSeries(startTime, endTime, interval, 45, labels),
    memory_usage: generateMemoryUsageTimeSeries(startTime, endTime, interval, 3, labels),
    network_in: generateNetworkIOTimeSeries(startTime, endTime, interval, 'in', 50, labels),
    network_out: generateNetworkIOTimeSeries(startTime, endTime, interval, 'out', 30, labels)
  };
}
