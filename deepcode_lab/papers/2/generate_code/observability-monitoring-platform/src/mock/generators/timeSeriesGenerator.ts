/**
 * Time-Series Data Generator
 * 
 * Generates realistic metric time-series data with natural patterns including:
 * - Sine wave oscillation (hourly/daily patterns)
 * - Gaussian noise (random variation)
 * - Linear trend (gradual increase/decrease)
 * - Anomaly spikes (occasional outliers)
 * 
 * Algorithm: value(t) = baseValue + amplitude*sin(2π*t/period) + noise(t) + trend*t + anomaly(t)
 */

import { MetricPoint, TimeSeries, MetricConfig } from '@/types';
import { generateUUID, gaussian, clamp } from './utils';

/**
 * Configuration for time-series generation
 */
export interface TimeSeriesGeneratorConfig extends MetricConfig {
  metricId: string;
  metricName: string;
  unit: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  intervalSeconds: number;
}

/**
 * Generate a realistic time-series with natural patterns
 * 
 * @param config - Configuration for the time-series
 * @returns Generated TimeSeries object
 */
export function generateTimeSeries(config: TimeSeriesGeneratorConfig): TimeSeries {
  const points: MetricPoint[] = [];
  
  // Convert period from minutes to milliseconds
  const periodMs = config.period * 60 * 1000;
  
  // Calculate time range
  const startTimeMs = config.startTime.getTime();
  const endTimeMs = config.endTime.getTime();
  const intervalMs = config.intervalSeconds * 1000;
  
  // Generate points
  let currentTimeMs = startTimeMs;
  
  while (currentTimeMs <= endTimeMs) {
    const timestamp = new Date(currentTimeMs);
    const timeElapsedMs = currentTimeMs - startTimeMs;
    
    // 1. Sine wave component (daily/hourly pattern)
    const sineComponent = config.amplitude * Math.sin((2 * Math.PI * timeElapsedMs) / periodMs);
    
    // 2. Gaussian noise (random variation)
    const noiseComponent = gaussian(0, 1) * config.baseValue * config.noise;
    
    // 3. Linear trend (gradual increase/decrease)
    const trendComponent = config.trend * (timeElapsedMs / 60000); // Convert to minutes
    
    // 4. Anomaly spike (occasional outlier)
    let anomalyComponent = 0;
    if (Math.random() < config.anomalyProb) {
      anomalyComponent = config.baseValue * config.anomalyMag * Math.random();
    }
    
    // Combine all components
    let value = config.baseValue + sineComponent + noiseComponent + trendComponent + anomalyComponent;
    
    // Clamp to valid range
    value = clamp(value, config.minValue, config.maxValue);
    
    points.push({
      timestamp,
      value,
    });
    
    currentTimeMs += intervalMs;
  }
  
  // Create aggregated buckets (min/max for each point)
  const pointsWithBounds = points.map((point, index) => {
    // Look at surrounding points to calculate min/max
    const windowSize = Math.max(1, Math.floor(points.length / 100)); // 1% of total points
    const startIdx = Math.max(0, index - windowSize);
    const endIdx = Math.min(points.length - 1, index + windowSize);
    
    const windowValues = points
      .slice(startIdx, endIdx + 1)
      .map(p => p.value);
    
    return {
      ...point,
      min: Math.min(...windowValues),
      max: Math.max(...windowValues),
    };
  });
  
  return {
    metricId: config.metricId,
    metricName: config.metricName,
    unit: config.unit,
    serviceId: config.serviceId,
    dataPoints: pointsWithBounds,
    lastUpdate: new Date(),
  };
}

/**
 * Pre-defined metric configurations for common metrics
 */
export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  CPU_USAGE: {
    baseValue: 50,
    amplitude: 20,
    period: 5, // 5-minute oscillation
    noise: 0.1,
    trend: 0.1, // +0.1% per minute
    anomalyProb: 0.05,
    anomalyMag: 3,
    minValue: 0,
    maxValue: 100,
  },
  
  MEMORY_USAGE: {
    baseValue: 65,
    amplitude: 15,
    period: 8,
    noise: 0.08,
    trend: 0.05,
    anomalyProb: 0.02,
    anomalyMag: 2,
    minValue: 0,
    maxValue: 100,
  },
  
  ERROR_RATE: {
    baseValue: 0.5,
    amplitude: 0.3,
    period: 10,
    noise: 0.1,
    trend: 0,
    anomalyProb: 0.02,
    anomalyMag: 5,
    minValue: 0,
    maxValue: 10,
  },
  
  RESPONSE_TIME: {
    baseValue: 100,
    amplitude: 30,
    period: 8,
    noise: 0.15,
    trend: 2, // +2ms per minute (degradation)
    anomalyProb: 0.01,
    anomalyMag: 10,
    minValue: 10,
    maxValue: 5000,
  },
  
  QPS: {
    baseValue: 1000,
    amplitude: 300,
    period: 6,
    noise: 0.12,
    trend: 0,
    anomalyProb: 0.03,
    anomalyMag: 2,
    minValue: 100,
    maxValue: 5000,
  },
  
  DISK_IO: {
    baseValue: 40,
    amplitude: 25,
    period: 7,
    noise: 0.2,
    trend: 0.05,
    anomalyProb: 0.04,
    anomalyMag: 4,
    minValue: 0,
    maxValue: 100,
  },
  
  NETWORK_BANDWIDTH: {
    baseValue: 500,
    amplitude: 200,
    period: 5,
    noise: 0.15,
    trend: 0,
    anomalyProb: 0.02,
    anomalyMag: 3,
    minValue: 0,
    maxValue: 10000,
  },
  
  SUCCESS_RATE: {
    baseValue: 99.5,
    amplitude: 0.3,
    period: 12,
    noise: 0.05,
    trend: 0,
    anomalyProb: 0.01,
    anomalyMag: 2,
    minValue: 95,
    maxValue: 100,
  },
  
  P50_LATENCY: {
    baseValue: 50,
    amplitude: 15,
    period: 8,
    noise: 0.1,
    trend: 1,
    anomalyProb: 0.01,
    anomalyMag: 5,
    minValue: 10,
    maxValue: 500,
  },
  
  P90_LATENCY: {
    baseValue: 150,
    amplitude: 40,
    period: 8,
    noise: 0.12,
    trend: 2,
    anomalyProb: 0.02,
    anomalyMag: 8,
    minValue: 30,
    maxValue: 2000,
  },
  
  P99_LATENCY: {
    baseValue: 300,
    amplitude: 80,
    period: 8,
    noise: 0.15,
    trend: 3,
    anomalyProb: 0.01,
    anomalyMag: 10,
    minValue: 50,
    maxValue: 5000,
  },
};

/**
 * Generate multiple time-series for a service
 * 
 * @param serviceId - Service ID
 * @param serviceName - Service name
 * @param startTime - Start time for data generation
 * @param endTime - End time for data generation
 * @param intervalSeconds - Interval between data points
 * @returns Array of TimeSeries objects
 */
export function generateServiceMetrics(
  serviceId: string,
  serviceName: string,
  startTime: Date,
  endTime: Date,
  intervalSeconds: number = 60
): TimeSeries[] {
  const metrics: TimeSeries[] = [];
  
  // Generate standard metrics for the service
  const metricNames = [
    'CPU_USAGE',
    'MEMORY_USAGE',
    'ERROR_RATE',
    'RESPONSE_TIME',
    'QPS',
    'SUCCESS_RATE',
    'P50_LATENCY',
    'P90_LATENCY',
    'P99_LATENCY',
  ];
  
  for (const metricName of metricNames) {
    const config = METRIC_CONFIGS[metricName];
    if (!config) continue;
    
    const metricId = `${serviceId}_${metricName}`;
    
    // Get unit based on metric name
    let unit = '%';
    if (metricName.includes('LATENCY') || metricName === 'RESPONSE_TIME') {
      unit = 'ms';
    } else if (metricName === 'QPS' || metricName === 'NETWORK_BANDWIDTH') {
      unit = 'req/s';
    }
    
    const timeSeries = generateTimeSeries({
      ...config,
      metricId,
      metricName,
      unit,
      serviceId,
      startTime,
      endTime,
      intervalSeconds,
    });
    
    metrics.push(timeSeries);
  }
  
  return metrics;
}

/**
 * Generate a single metric point at a specific time
 * Useful for real-time data generation
 * 
 * @param config - Configuration for the metric
 * @param timestamp - Timestamp for the point
 * @param baselineTime - Reference time for sine wave calculation
 * @returns Generated MetricPoint
 */
export function generateMetricPoint(
  config: MetricConfig,
  timestamp: Date,
  baselineTime: Date = new Date(0)
): MetricPoint {
  const periodMs = config.period * 60 * 1000;
  const timeElapsedMs = timestamp.getTime() - baselineTime.getTime();
  
  // Sine wave component
  const sineComponent = config.amplitude * Math.sin((2 * Math.PI * timeElapsedMs) / periodMs);
  
  // Gaussian noise
  const noiseComponent = gaussian(0, 1) * config.baseValue * config.noise;
  
  // Trend
  const trendComponent = config.trend * (timeElapsedMs / 60000);
  
  // Anomaly
  let anomalyComponent = 0;
  if (Math.random() < config.anomalyProb) {
    anomalyComponent = config.baseValue * config.anomalyMag * Math.random();
  }
  
  // Combine
  let value = config.baseValue + sineComponent + noiseComponent + trendComponent + anomalyComponent;
  value = clamp(value, config.minValue, config.maxValue);
  
  return {
    timestamp,
    value,
  };
}

/**
 * Aggregate time-series data to reduce point count while preserving patterns
 * Uses Largest-Triangle-Three-Buckets (LTTB) algorithm
 * 
 * @param points - Original data points
 * @param maxPoints - Maximum number of points to return
 * @returns Aggregated data points
 */
export function aggregateTimeSeries(
  points: MetricPoint[],
  maxPoints: number = 500
): MetricPoint[] {
  if (points.length <= maxPoints) {
    return points;
  }
  
  const bucketSize = Math.ceil(points.length / maxPoints);
  const aggregated: MetricPoint[] = [];
  
  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, Math.min(i + bucketSize, points.length));
    
    if (bucket.length === 0) continue;
    
    // Calculate statistics for the bucket
    const values = bucket.map(p => p.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    // Use first point's timestamp, but could use middle or last
    aggregated.push({
      timestamp: bucket[0].timestamp,
      value: avgValue,
      min: minValue,
      max: maxValue,
    });
  }
  
  return aggregated;
}
