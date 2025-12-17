/**
 * Central type definitions for Observability Monitoring Platform
 * Exports all types used throughout the application
 */

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface MetricPoint {
  timestamp: Date | string;
  value: number;
  min?: number;
  max?: number;
}

export interface TimeSeries {
  metricId: string;
  metricName: string;
  unit: string;
  serviceId: string;
  dataPoints: MetricPoint[];
  lastUpdate: Date;
}

export interface MetricStats {
  min: number;
  max: number;
  avg: number;
  stdDev: number;
  p50: number;
  p90: number;
  p99: number;
}

export interface MetricConfig {
  baseValue: number;
  amplitude: number;
  period: number; // minutes
  noise: number; // 0-1
  trend: number; // per minute
  anomalyProb: number; // 0-1
  anomalyMag: number;
  minValue: number;
  maxValue: number;
}

// ============================================================================
// TRACE TYPES
// ============================================================================

export interface SpanLog {
  timestamp: Date | string;
  message: string;
  fields: Record<string, any>;
}

export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId: string | null;
  service: string;
  operation: string;
  startTime: Date | string;
  endTime: Date | string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  tags: Record<string, any>;
  logs: SpanLog[];
}

export interface Trace {
  traceId: string;
  rootSpanId: string;
  rootService: string;
  startTime: Date | string;
  endTime: Date | string;
  totalDurationMs: number;
  spanCount: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  spans: Span[];
}

export interface TraceConfig {
  services: ServiceDefinition[];
  minDepth: number;
  maxDepth: number;
  errorRate: number;
  durationMinMs: number;
  durationMaxMs: number;
  branchProbability: number;
}

// ============================================================================
// LOG TYPES
// ============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  id: string;
  timestamp: Date | string;
  service: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  spanId?: string;
  context: {
    userId: number;
    requestId: string;
    instanceId: string;
    environment?: string;
    region?: string;
  };
  stacktrace?: string;
}

export interface LogConfig {
  services: ServiceDefinition[];
  timeRange: DateRange;
  baseFrequencyPerMinute: number;
  peakHours: [number, number][];
  errorRateNormal: number;
  errorRatePeak: number;
  traceIdProbability: number;
}

export interface LogStatistics {
  totalCount: number;
  countByLevel: Record<LogLevel, number>;
  countTrend: Array<{ timestamp: Date; count: number }>;
  topErrors: Array<{ message: string; count: number }>;
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: number; // seconds
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  createdAt: Date;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterSet {
  service?: string[];
  environment?: string[];
  region?: string[];
  instance?: string[];
  tags?: Record<string, string[]>;
}

export interface FilterValue {
  type: string;
  value: any;
}

export type FilterRule = (item: any, value: any) => boolean;

export interface FilterRuleMap {
  [key: string]: FilterRule;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'alert' | 'table';
  title: string;
  config: WidgetConfig;
  position: {
    x: number; // grid column (0-11)
    y: number; // grid row
    width: number; // grid units (1-12)
    height: number; // grid units
  };
}

export interface WidgetConfig {
  dataSource: string;
  metric?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'heatmap' | 'gauge';
  timeRange?: DateRange;
  filters?: FilterSet;
  threshold?: number;
  unit?: string;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

// ============================================================================
// TIME RANGE TYPES
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export type TimePreset = 'last_5m' | 'last_15m' | 'last_1h' | 'last_6h' | 'last_24h' | 'last_7d' | 'custom';

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface ServiceDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  instances: string[];
  environment: 'production' | 'staging' | 'testing';
  region: string;
  status: 'healthy' | 'warning' | 'critical';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface UIState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  activeModal?: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ============================================================================
// CHART TYPES
// ============================================================================

export interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  axisLineColor: string;
  gridColor: string;
  colors: string[];
}

export interface ChartConfig {
  title: string;
  unit?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animation?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
}
