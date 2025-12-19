import { MetricPoint, Trace, Span, LogEntry, LogLevel } from './definitions';
import { generateMetricSeries } from './generators/mathUtils';
import { generateTraceList } from './generators/traceGenerator';
import dayjs from 'dayjs';

/**
 * Mock API Client
 * Simulates network latency and backend logic
 */

const LATENCY = 400; // ms

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Database (Optional: maintain some consistency if needed, 
// but for this demo we might just generate deterministic data based on inputs)
// However, to allow "Drill down" consistency, we can rely on the fact that
// if we request logs for a specific TraceID, we just generate them on the fly 
// matching that ID.

export const mockApi = {
  /**
   * Fetch Metrics for a given time range
   */
  async fetchMetrics(
    start: Date, 
    end: Date, 
    stepSeconds: number = 60
  ): Promise<{ cpu: MetricPoint[], memory: MetricPoint[], latency: MetricPoint[] }> {
    await delay(LATENCY);
    
    const startTime = start.getTime();
    const endTime = end.getTime();
    const interval = stepSeconds * 1000;

    // Generate different patterns for different metrics
    const cpu = generateMetricSeries(startTime, endTime, interval, {
      base: 40,
      amplitude: 25,
      period: 1000 * 60 * 15, // 15 min period
      noise: 5,
      spikeChance: 0.02
    });

    const memory = generateMetricSeries(startTime, endTime, interval, {
      base: 60,
      amplitude: 10,
      period: 1000 * 60 * 60, // 1 hour period
      noise: 2
    });

    const latency = generateMetricSeries(startTime, endTime, interval, {
      base: 200,
      amplitude: 100,
      period: 1000 * 60 * 5, // 5 min period
      noise: 20,
      spikeChance: 0.05
    });

    return { cpu, memory, latency };
  },

  /**
   * Fetch Traces for a given time range
   */
  async fetchTraces(start: Date, end: Date, limit: number = 50): Promise<Trace[]> {
    await delay(LATENCY);
    // Generate traces distributed in this window
    const traces = generateTraceList(limit, start.getTime(), end.getTime());
    return traces;
  },

  /**
   * Fetch Trace Details (by ID)
   * Since we don't have a real DB, we'll re-generate a trace that "looks" like it exists
   * or return a mock one. For the demo, we might pass the full object in navigation,
   * but if we need to fetch by ID, we'll simulate a find.
   */
  async fetchTraceById(traceId: string): Promise<Trace | null> {
    await delay(LATENCY);
    // Create a synthetic trace with this ID
    const [trace] = generateTraceList(1, Date.now() - 10000, Date.now());
    trace.traceId = traceId;
    trace.spans.forEach(s => s.traceId = traceId);
    return trace;
  },

  /**
   * Fetch Logs
   * Can filter by traceId or search query
   */
  async fetchLogs(
    start: Date, 
    end: Date, 
    filter?: { traceId?: string, search?: string, limit?: number }
  ): Promise<LogEntry[]> {
    await delay(LATENCY); // Faster than metrics
    
    const logs: LogEntry[] = [];
    const count = filter?.limit || 200; // Default count
    const startTime = start.getTime();
    const endTime = end.getTime();
    const range = endTime - startTime;

    // 1. If TraceID is provided, generate specific logs for that trace
    if (filter?.traceId) {
      // Simulate logs for the specific trace
      // We'll generate a few logs per span "conceptually"
      const traceId = filter.traceId;
      const numLogs = 15; // fixed number for this view
      
      for (let i = 0; i < numLogs; i++) {
        // Distribute logs across the requested time window (or just close to now if range is large)
        // Ideally these should match the trace timestamp, but we don't have the trace object here.
        // We'll assume the time window passed in matches the trace duration.
        const timestamp = startTime + Math.floor(Math.random() * range);
        
        logs.push({
          timestamp,
          level: Math.random() > 0.9 ? 'ERROR' : (Math.random() > 0.7 ? 'WARN' : 'INFO'),
          message: `Operation details for trace ${traceId} - step ${i + 1}`,
          service: 'service-' + Math.floor(Math.random() * 5),
          traceId: traceId,
          spanId: 'span-' + Math.floor(Math.random() * 1000).toString(16)
        });
      }
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    }

    // 2. Otherwise generate random stream of logs
    const services = ['frontend-proxy', 'auth-service', 'api-gateway', 'db-primary', 'payment-service'];
    const messages = [
      'Request received',
      'Processing payload',
      'Database connection established',
      'Cache miss',
      'User authenticated successfully',
      'Payment processed',
      'External API call started',
      'Response sent',
      'Health check passed',
      'Garbage collection started'
    ];
    
    const errorMessages = [
      'Connection timeout',
      'Database lock wait timeout exceeded',
      'Null pointer exception',
      'Invalid token signature',
      'Rate limit exceeded'
    ];

    for (let i = 0; i < count; i++) {
      const isError = Math.random() > 0.95;
      const isWarn = !isError && Math.random() > 0.90;
      
      const level: LogLevel = isError ? 'ERROR' : (isWarn ? 'WARN' : 'INFO');
      const service = services[Math.floor(Math.random() * services.length)];
      
      let message = messages[Math.floor(Math.random() * messages.length)];
      if (isError) {
        message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      }

      // Random timestamp in range
      const timestamp = startTime + Math.floor(Math.random() * range);

      logs.push({
        timestamp,
        level,
        message: `[${service}] ${message}`,
        service,
        traceId: Math.random() > 0.5 ? Math.floor(Math.random() * 10000000000).toString(16) : undefined
      });
    }

    // Sort descending (newest first)
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }
};
