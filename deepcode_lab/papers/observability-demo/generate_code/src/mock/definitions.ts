export interface MetricPoint {
  timestamp: number;
  value: number;
}

export type SpanStatus = 'ok' | 'error';

export interface Span {
  traceId: string;
  spanId: string;
  parentId?: string | null;
  serviceName: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration: number;
  status: SpanStatus;
  depth?: number;
  children?: Span[]; // For hierarchical view if needed
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string; // Correlated trace
  spanId?: string;  // Correlated span
}

export interface Trace {
  traceId: string;
  spans: Span[];
  rootSpan?: Span;
  rootServiceName?: string;
  startTime: number;
  duration?: number;
  totalDuration?: number;
  errorCount: number;
}
