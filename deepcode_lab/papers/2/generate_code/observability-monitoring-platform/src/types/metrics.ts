/**
 * Metrics Type Definitions
 * 
 * Comprehensive TypeScript interfaces for metric data structures, configurations,
 * and operations across the observability monitoring platform.
 */

/**
 * Individual metric data point with timestamp and value
 */
export interface MetricPoint {
  timestamp: Date;
  value: number;
  min?: number;      // For aggregated buckets
  max?: number;      // For aggregated buckets
  avg?: number;      // For aggregated buckets
  count?: number;    // For aggregated buckets
}

/**
 * Complete time-series metric with metadata and data points
 */
export interface TimeSeries {
  metricId: string;
  metricName: string;
  unit: string;                    // %, ms, req/s, MB/s, Mbps, etc
  serviceId: string;
  dataPoints: MetricPoint[];
  lastUpdate: Date;
  aggregationBucket?: number;      // Bucket size in seconds
  pointCount?: number;             // Total points in series
}

/**
 * Aggregated statistics for a metric
 */
export interface MetricStats {
  min: number;
  max: number;
  avg: number;
  stdDev: number;
  p50: number;
  p90: number;
  p99: number;
  p999?: number;
  median?: number;
  mode?: number;
  variance?: number;
  count?: number;
  sum?: number;
}

/**
 * Configuration for time-series data generation
 */
export interface MetricConfig {
  baseValue: number;           // Average metric value
  amplitude: number;           // Oscillation magnitude
  period: number;              // Sine wave period in minutes
  noise: number;               // Random variation coefficient (0-1)
  trend: number;               // Linear drift per minute
  anomalyProb: number;         // Probability of spike (0-1)
  anomalyMag: number;          // Spike magnitude multiplier
  minValue: number;            // Minimum realistic value
  maxValue: number;            // Maximum realistic value
}

/**
 * Metric comparison result
 */
export interface MetricComparison {
  metricName: string;
  services: Record<string, MetricStats>;
  differences: Record<string, number>;
  percentageChanges: Record<string, number>;
}

/**
 * Metric aggregation result
 */
export interface AggregatedMetric {
  metricId: string;
  metricName: string;
  unit: string;
  serviceId: string;
  aggregationBucket: number;
  dataPoints: MetricPoint[];
  originalPointCount: number;
  aggregatedPointCount: number;
  compressionRatio: number;
}

/**
 * Metric trend analysis
 */
export interface MetricTrend {
  metricId: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;            // 0-1 confidence
  slope: number;               // Rate of change per minute
  percentageChange: number;    // % change over period
  startValue: number;
  endValue: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Metric anomaly detection result
 */
export interface MetricAnomaly {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;           // Standard deviations from mean
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;          // 0-1 confidence score
}

/**
 * Metric query request
 */
export interface MetricQueryRequest {
  service?: string;
  metricNames?: string[];
  startTime: Date;
  endTime: Date;
  aggregationBucket?: number;
  filters?: Record<string, any>;
}

/**
 * Metric query response
 */
export interface MetricQueryResponse {
  metrics: TimeSeries[];
  queryTime: number;           // Milliseconds
  pointCount: number;
  aggregationBucket?: number;
}

/**
 * Metric comparison request
 */
export interface MetricComparisonRequest {
  services: string[];
  metricName: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Metric comparison response
 */
export interface MetricComparisonResponse {
  metricName: string;
  services: Record<string, TimeSeries>;
  stats: Record<string, MetricStats>;
  differences: Record<string, number>;
  percentageChanges: Record<string, number>;
  queryTime: number;
}

/**
 * Metric alert threshold
 */
export interface MetricThreshold {
  metricName: string;
  warning: number;
  critical: number;
  unit: string;
}

/**
 * Metric health status
 */
export interface MetricHealth {
  metricName: string;
  status: 'healthy' | 'warning' | 'critical';
  currentValue: number;
  threshold: MetricThreshold;
  lastUpdate: Date;
}

/**
 * Service health summary
 */
export interface ServiceHealth {
  serviceId: string;
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: MetricHealth[];
  lastUpdate: Date;
  uptime: number;              // Percentage
}

/**
 * Metric export format
 */
export interface MetricExport {
  format: 'json' | 'csv' | 'prometheus';
  metrics: TimeSeries[];
  exportedAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

/**
 * Metric aggregation bucket
 */
export interface MetricBucket {
  timestamp: Date;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  stdDev: number;
  p50: number;
  p90: number;
  p99: number;
}

/**
 * Metric percentile mapping
 */
export interface MetricPercentiles {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
}

/**
 * Metric rate of change
 */
export interface MetricRateOfChange {
  metricId: string;
  timestamp: Date;
  value: number;
  ratePerMinute: number;
  ratePerHour: number;
  ratePerDay: number;
}

/**
 * Metric correlation
 */
export interface MetricCorrelation {
  metric1Id: string;
  metric2Id: string;
  correlationCoefficient: number;  // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  lag?: number;                    // Time lag in seconds
}

/**
 * Metric forecast
 */
export interface MetricForecast {
  metricId: string;
  forecastedValues: Array<{
    timestamp: Date;
    value: number;
    confidence: number;
    lower: number;
    upper: number;
  }>;
  model: string;
  accuracy: number;
  generatedAt: Date;
}

/**
 * Metric baseline
 */
export interface MetricBaseline {
  metricId: string;
  baselineValue: number;
  upperBound: number;
  lowerBound: number;
  stdDev: number;
  calculatedAt: Date;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

/**
 * Metric streaming message
 */
export interface MetricStreamMessage {
  type: 'metric_update' | 'metric_anomaly' | 'metric_alert';
  metricId: string;
  serviceId: string;
  timestamp: Date;
  value: number;
  previousValue?: number;
  anomaly?: MetricAnomaly;
  alert?: {
    severity: string;
    message: string;
  };
}

/**
 * Metric retention policy
 */
export interface MetricRetentionPolicy {
  retentionDays: number;
  archiveAfterDays: number;
  deleteAfterDays: number;
  samplingRate: number;        // 0-1, for downsampling old data
  compression: 'none' | 'gzip' | 'zstd';
}
