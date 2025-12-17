/**
 * Metrics Type Definitions
 * 
 * Defines TypeScript interfaces for metrics monitoring module including
 * metric data points, service metrics, aggregations, and percentile calculations.
 */

import type { TimeSeries, DataPoint } from './common'

/**
 * Metric Types
 */
export enum MetricType {
  COUNTER = 'counter',       // Monotonically increasing (e.g., request count)
  GAUGE = 'gauge',           // Point-in-time value (e.g., CPU usage)
  HISTOGRAM = 'histogram',   // Distribution of values (e.g., response times)
  SUMMARY = 'summary'        // Similar to histogram with quantiles
}

/**
 * Metric Categories
 */
export enum MetricCategory {
  PERFORMANCE = 'performance',   // Response time, latency
  AVAILABILITY = 'availability', // Error rate, uptime
  THROUGHPUT = 'throughput',     // QPS, requests per second
  RESOURCE = 'resource',         // CPU, memory, disk
  BUSINESS = 'business',         // Custom business metrics
  NETWORK = 'network'            // Network I/O, bandwidth
}

/**
 * Aggregation Methods
 */
export enum AggregationMethod {
  AVG = 'avg',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  P50 = 'p50',
  P90 = 'p90',
  P95 = 'p95',
  P99 = 'p99',
  RATE = 'rate'
}

/**
 * Single Metric Data Point
 * Represents a single measurement at a specific timestamp
 */
export interface MetricDataPoint {
  timestamp: number          // Unix timestamp in milliseconds
  value: number              // Metric value
  tags?: Record<string, string>  // Optional tags (e.g., {region: 'us-east-1'})
}

/**
 * Metric Metadata
 * Describes a metric's characteristics
 */
export interface MetricMetadata {
  name: string               // Metric name (e.g., 'http_request_duration')
  displayName: string        // Human-readable name
  type: MetricType           // Metric type
  category: MetricCategory   // Metric category
  unit: string               // Unit of measurement (e.g., 'ms', '%', 'req/s')
  description?: string       // Metric description
  tags?: string[]            // Available tag keys
}

/**
 * Metric Query Parameters
 * Used to fetch metrics from mock API
 */
export interface MetricQuery {
  service: string            // Service name
  metric: string             // Metric name
  startTime: number          // Query start time (ms)
  endTime: number            // Query end time (ms)
  interval?: number          // Data point interval (ms), default: auto-calculated
  aggregation?: AggregationMethod  // Aggregation method
  tags?: Record<string, string>    // Tag filters
}

/**
 * Metric Query Response
 * Result from metric query
 */
export interface MetricQueryResponse {
  metadata: MetricMetadata
  data: MetricDataPoint[]
  query: MetricQuery
  aggregated?: boolean       // Whether data was aggregated
  originalCount?: number     // Original data point count before aggregation
}

/**
 * Service Metrics
 * Complete metrics for a single service
 */
export interface ServiceMetrics {
  serviceName: string
  timestamp: number          // Last update timestamp
  
  // Performance Metrics
  responseTime: {
    avg: number              // Average response time (ms)
    p50: number              // 50th percentile
    p90: number              // 90th percentile
    p95: number              // 95th percentile
    p99: number              // 99th percentile
    max: number              // Maximum response time
    timeSeries: TimeSeries   // Time series data
  }
  
  // Availability Metrics
  errorRate: {
    value: number            // Current error rate (0-1)
    percentage: number       // Error rate as percentage (0-100)
    timeSeries: TimeSeries   // Time series data
  }
  
  // Throughput Metrics
  qps: {
    value: number            // Current queries per second
    timeSeries: TimeSeries   // Time series data
  }
  
  requestCount: {
    total: number            // Total requests in time range
    success: number          // Successful requests
    error: number            // Failed requests
    timeSeries: TimeSeries   // Time series data
  }
  
  // Resource Metrics
  cpu: {
    usage: number            // CPU usage percentage (0-100)
    timeSeries: TimeSeries   // Time series data
  }
  
  memory: {
    usage: number            // Memory usage percentage (0-100)
    used: number             // Used memory (MB)
    total: number            // Total memory (MB)
    timeSeries: TimeSeries   // Time series data
  }
  
  // Network Metrics (optional)
  network?: {
    inbound: number          // Inbound traffic (MB/s)
    outbound: number         // Outbound traffic (MB/s)
    timeSeries: TimeSeries   // Time series data
  }
}

/**
 * Percentile Calculation Result
 * Result from percentile calculation utility
 */
export interface PercentileResult {
  p50: number
  p90: number
  p95: number
  p99: number
  min: number
  max: number
  avg: number
  count: number
}

/**
 * Metric Comparison
 * Compare metrics between two time periods or services
 */
export interface MetricComparison {
  current: {
    value: number
    timeSeries: TimeSeries
  }
  previous: {
    value: number
    timeSeries: TimeSeries
  }
  change: {
    absolute: number         // Absolute change
    percentage: number       // Percentage change
    trend: 'up' | 'down' | 'stable'  // Trend direction
  }
}

/**
 * Metric Threshold
 * Defines alert thresholds for metrics
 */
export interface MetricThreshold {
  metricName: string
  warning: number            // Warning threshold
  critical: number           // Critical threshold
  comparison: 'gt' | 'lt' | 'eq'  // Comparison operator
  unit: string
}

/**
 * Metric Aggregation Config
 * Configuration for data aggregation
 */
export interface AggregationConfig {
  method: AggregationMethod
  interval: number           // Aggregation interval (ms)
  targetPoints?: number      // Target number of data points (for auto-aggregation)
  fillMissing?: boolean      // Fill missing data points
  fillValue?: number         // Value to use for missing points
}

/**
 * Service Metric Summary
 * High-level summary for service list view
 */
export interface ServiceMetricSummary {
  serviceName: string
  status: 'healthy' | 'warning' | 'critical'
  errorRate: number
  avgResponseTime: number
  qps: number
  cpuUsage: number
  memoryUsage: number
  lastUpdate: number
  alertCount: number
}

/**
 * Metric Chart Configuration
 * Configuration for rendering metric charts
 */
export interface MetricChartConfig {
  metricName: string
  displayName: string
  chartType: 'line' | 'bar' | 'area' | 'scatter'
  yAxisLabel: string
  unit: string
  thresholds?: MetricThreshold[]
  showLegend?: boolean
  showGrid?: boolean
  smooth?: boolean           // Smooth line charts
  stack?: boolean            // Stack multiple series
  colors?: string[]          // Custom color palette
}

/**
 * Multi-Service Comparison
 * Compare same metric across multiple services
 */
export interface MultiServiceComparison {
  metricName: string
  services: Array<{
    serviceName: string
    value: number
    timeSeries: TimeSeries
    status: 'healthy' | 'warning' | 'critical'
  }>
  aggregation: AggregationMethod
  timeRange: {
    startTime: number
    endTime: number
  }
}

/**
 * Metric Export Data
 * Data structure for exporting metrics
 */
export interface MetricExportData {
  serviceName: string
  metrics: Array<{
    name: string
    data: MetricDataPoint[]
    metadata: MetricMetadata
  }>
  exportTime: number
  timeRange: {
    startTime: number
    endTime: number
  }
}

/**
 * Real-time Metric Update
 * Structure for real-time metric updates
 */
export interface MetricUpdate {
  serviceName: string
  metricName: string
  dataPoint: MetricDataPoint
  timestamp: number
}

/**
 * Metric Anomaly Detection Result
 * Result from anomaly detection (for future enhancement)
 */
export interface MetricAnomaly {
  metricName: string
  timestamp: number
  value: number
  expectedValue: number
  deviation: number          // Standard deviations from expected
  severity: 'low' | 'medium' | 'high'
  confidence: number         // Confidence score (0-1)
}
