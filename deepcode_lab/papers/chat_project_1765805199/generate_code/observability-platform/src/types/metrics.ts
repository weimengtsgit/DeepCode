/**
 * Metrics Type Definitions
 * 
 * Defines all types related to metrics monitoring including:
 * - Metric types (business and system metrics)
 * - Metric data structures
 * - Aggregation and query configurations
 * - Metric metadata and labels
 */

/**
 * Metric Type Categories
 */
export type MetricCategory = 'business' | 'system' | 'custom';

/**
 * Business Metrics
 */
export type BusinessMetricType =
  | 'qps'           // Queries Per Second
  | 'rps'           // Requests Per Second
  | 'tps'           // Transactions Per Second
  | 'error_rate'    // Error Rate (%)
  | 'success_rate'  // Success Rate (%)
  | 'latency'       // Response Time
  | 'p50'           // 50th Percentile Latency
  | 'p90'           // 90th Percentile Latency
  | 'p95'           // 95th Percentile Latency
  | 'p99'           // 99th Percentile Latency
  | 'throughput'    // Data Throughput
  | 'concurrency';  // Concurrent Requests

/**
 * System Metrics
 */
export type SystemMetricType =
  | 'cpu_usage'         // CPU Usage (%)
  | 'memory_usage'      // Memory Usage (%)
  | 'memory_bytes'      // Memory Usage (bytes)
  | 'disk_usage'        // Disk Usage (%)
  | 'disk_io'           // Disk I/O
  | 'network_in'        // Network Inbound
  | 'network_out'       // Network Outbound
  | 'connection_count'  // Active Connections
  | 'thread_count'      // Thread Count
  | 'gc_count'          // Garbage Collection Count
  | 'gc_time';          // Garbage Collection Time

/**
 * All Metric Types
 */
export type MetricType = BusinessMetricType | SystemMetricType | string;

/**
 * Metric Unit Types
 */
export type MetricUnit =
  | 'none'
  | 'percent'       // %
  | 'milliseconds'  // ms
  | 'seconds'       // s
  | 'bytes'         // B
  | 'kilobytes'     // KB
  | 'megabytes'     // MB
  | 'gigabytes'     // GB
  | 'count'         // count
  | 'rate'          // per second
  | 'ops';          // operations

/**
 * Aggregation Methods
 */
export type AggregationType =
  | 'avg'   // Average
  | 'sum'   // Sum
  | 'min'   // Minimum
  | 'max'   // Maximum
  | 'count' // Count
  | 'rate'  // Rate of change
  | 'p50'   // 50th percentile
  | 'p90'   // 90th percentile
  | 'p95'   // 95th percentile
  | 'p99';  // 99th percentile

/**
 * Metric Labels (Dimensions)
 */
export interface MetricLabels {
  service?: string;
  instance?: string;
  environment?: string;
  region?: string;
  version?: string;
  endpoint?: string;
  method?: string;
  status?: string;
  [key: string]: string | undefined;
}

/**
 * Single Metric Data Point
 */
export interface MetricDataPoint {
  timestamp: number;  // Unix timestamp in milliseconds
  value: number;      // Metric value
  labels?: MetricLabels;
}

/**
 * Time Series Metric Data
 */
export interface MetricTimeSeries {
  metric: string;           // Metric name/type
  labels: MetricLabels;     // Metric labels
  dataPoints: MetricDataPoint[];
  unit?: MetricUnit;
  aggregation?: AggregationType;
}

/**
 * Metric Metadata
 */
export interface MetricMetadata {
  name: string;
  displayName: string;
  description?: string;
  type: MetricType;
  category: MetricCategory;
  unit: MetricUnit;
  defaultAggregation: AggregationType;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  tags?: string[];
}

/**
 * Metric Query Configuration
 */
export interface MetricQuery {
  metric: string;
  labels?: MetricLabels;
  aggregation?: AggregationType;
  interval?: number;        // Aggregation interval in seconds
  timeRange: {
    start: number;
    end: number;
  };
  groupBy?: string[];       // Group by label keys
  filters?: {
    key: string;
    operator: 'eq' | 'ne' | 'regex' | 'in';
    value: string | string[];
  }[];
}

/**
 * Metric Query Result
 */
export interface MetricQueryResult {
  query: MetricQuery;
  series: MetricTimeSeries[];
  statistics?: {
    avg?: number;
    min?: number;
    max?: number;
    sum?: number;
    count?: number;
    p50?: number;
    p90?: number;
    p95?: number;
    p99?: number;
  };
  executionTime?: number;   // Query execution time in ms
}

/**
 * Service Metrics Summary
 */
export interface ServiceMetrics {
  service: string;
  timestamp: number;
  metrics: {
    // Business Metrics
    qps?: number;
    errorRate?: number;
    successRate?: number;
    avgLatency?: number;
    p50Latency?: number;
    p90Latency?: number;
    p95Latency?: number;
    p99Latency?: number;
    
    // System Metrics
    cpuUsage?: number;
    memoryUsage?: number;
    memoryBytes?: number;
    diskUsage?: number;
    networkIn?: number;
    networkOut?: number;
    connectionCount?: number;
    threadCount?: number;
    
    // Custom Metrics
    [key: string]: number | undefined;
  };
  status: 'healthy' | 'degraded' | 'down';
  instances?: number;
}

/**
 * Metric Comparison Configuration
 */
export interface MetricComparison {
  baseMetric: MetricQuery;
  compareMetric: MetricQuery;
  comparisonType: 'absolute' | 'percentage' | 'ratio';
}

/**
 * Metric Alert Rule
 */
export interface MetricAlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  labels?: MetricLabels;
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    threshold: number;
    duration?: number;      // Duration in seconds
  };
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  annotations?: Record<string, string>;
}

/**
 * Metric Dashboard Panel Configuration
 */
export interface MetricPanel {
  id: string;
  title: string;
  description?: string;
  queries: MetricQuery[];
  visualization: {
    type: 'line' | 'bar' | 'area' | 'gauge' | 'stat' | 'heatmap' | 'pie';
    options?: {
      stacked?: boolean;
      fill?: boolean;
      showPoints?: boolean;
      showLegend?: boolean;
      legendPosition?: 'top' | 'bottom' | 'left' | 'right';
      yAxisLabel?: string;
      xAxisLabel?: string;
      colors?: string[];
      thresholds?: Array<{
        value: number;
        color: string;
      }>;
    };
  };
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Metric Aggregation Result
 */
export interface AggregatedMetric {
  metric: string;
  labels: MetricLabels;
  aggregation: AggregationType;
  value: number;
  timestamp: number;
  interval?: number;
}

/**
 * Metric Trend Analysis
 */
export interface MetricTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;           // Absolute change
  changePercent: number;    // Percentage change
  trend: 'up' | 'down' | 'stable';
  isAnomaly?: boolean;
}

/**
 * Metric Histogram Data
 */
export interface MetricHistogram {
  metric: string;
  labels: MetricLabels;
  buckets: Array<{
    le: number;             // Less than or equal to
    count: number;
  }>;
  sum: number;
  count: number;
}

/**
 * Metric Cardinality Info
 */
export interface MetricCardinality {
  metric: string;
  labelCardinality: Record<string, number>;
  totalSeries: number;
  estimatedMemory?: number;
}

/**
 * Metric Export Configuration
 */
export interface MetricExportConfig {
  format: 'json' | 'csv' | 'prometheus';
  metrics: string[];
  timeRange: {
    start: number;
    end: number;
  };
  labels?: MetricLabels;
  aggregation?: AggregationType;
  interval?: number;
}

/**
 * Real-time Metric Update
 */
export interface MetricUpdate {
  metric: string;
  labels: MetricLabels;
  value: number;
  timestamp: number;
  delta?: number;           // Change from previous value
}

/**
 * Metric Annotation (Event Marker)
 */
export interface MetricAnnotation {
  id: string;
  timestamp: number;
  title: string;
  description?: string;
  tags?: string[];
  type: 'deployment' | 'incident' | 'config_change' | 'custom';
  metadata?: Record<string, any>;
}

/**
 * Metric Data Source Configuration
 */
export interface MetricDataSource {
  id: string;
  name: string;
  type: 'prometheus' | 'influxdb' | 'elasticsearch' | 'mock';
  url?: string;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  defaultLabels?: MetricLabels;
  scrapeInterval?: number;
}

/**
 * Metric Template for Quick Setup
 */
export interface MetricTemplate {
  id: string;
  name: string;
  description?: string;
  category: MetricCategory;
  panels: MetricPanel[];
  variables?: Array<{
    name: string;
    label: string;
    type: 'query' | 'custom' | 'constant';
    options?: string[];
    defaultValue?: string;
  }>;
}

/**
 * Type Guards
 */
export function isBusinessMetric(type: string): type is BusinessMetricType {
  const businessMetrics: BusinessMetricType[] = [
    'qps', 'rps', 'tps', 'error_rate', 'success_rate', 'latency',
    'p50', 'p90', 'p95', 'p99', 'throughput', 'concurrency'
  ];
  return businessMetrics.includes(type as BusinessMetricType);
}

export function isSystemMetric(type: string): type is SystemMetricType {
  const systemMetrics: SystemMetricType[] = [
    'cpu_usage', 'memory_usage', 'memory_bytes', 'disk_usage', 'disk_io',
    'network_in', 'network_out', 'connection_count', 'thread_count',
    'gc_count', 'gc_time'
  ];
  return systemMetrics.includes(type as SystemMetricType);
}

/**
 * Metric Constants
 */
export const METRIC_UNITS: Record<MetricType, MetricUnit> = {
  // Business Metrics
  qps: 'rate',
  rps: 'rate',
  tps: 'rate',
  error_rate: 'percent',
  success_rate: 'percent',
  latency: 'milliseconds',
  p50: 'milliseconds',
  p90: 'milliseconds',
  p95: 'milliseconds',
  p99: 'milliseconds',
  throughput: 'rate',
  concurrency: 'count',
  
  // System Metrics
  cpu_usage: 'percent',
  memory_usage: 'percent',
  memory_bytes: 'bytes',
  disk_usage: 'percent',
  disk_io: 'rate',
  network_in: 'rate',
  network_out: 'rate',
  connection_count: 'count',
  thread_count: 'count',
  gc_count: 'count',
  gc_time: 'milliseconds',
} as const;

export const DEFAULT_AGGREGATIONS: Record<MetricType, AggregationType> = {
  // Business Metrics
  qps: 'avg',
  rps: 'avg',
  tps: 'avg',
  error_rate: 'avg',
  success_rate: 'avg',
  latency: 'avg',
  p50: 'p50',
  p90: 'p90',
  p95: 'p95',
  p99: 'p99',
  throughput: 'sum',
  concurrency: 'avg',
  
  // System Metrics
  cpu_usage: 'avg',
  memory_usage: 'avg',
  memory_bytes: 'avg',
  disk_usage: 'avg',
  disk_io: 'avg',
  network_in: 'sum',
  network_out: 'sum',
  connection_count: 'avg',
  thread_count: 'avg',
  gc_count: 'sum',
  gc_time: 'sum',
} as const;
