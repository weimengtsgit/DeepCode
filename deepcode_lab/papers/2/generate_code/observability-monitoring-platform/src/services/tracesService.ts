/**
 * TracesService - Business logic layer for distributed tracing operations
 * Provides trace analysis, filtering, slow span detection, and service dependency extraction
 */

import type { Trace, Span, TraceStatistics, FilterSet, DateRange } from '@/types'
import { mockAPI } from '@/mock/api'

/**
 * Service for trace data operations
 * Implements static utility methods for trace analysis and filtering
 */
export class TracesService {
  /**
   * Fetch traces for a service within a time range
   * @param service - Service name to filter by (optional)
   * @param timeRange - Time range for filtering
   * @param status - Filter by trace status ('success' | 'error' | 'timeout')
   * @param limit - Maximum number of traces to return (default: 100)
   * @returns Promise resolving to array of traces
   */
  static async getTraces(
    service?: string,
    timeRange?: DateRange,
    status?: 'success' | 'error' | 'timeout',
    limit: number = 100
  ): Promise<Trace[]> {
    const traces = await mockAPI.getTraces(service, timeRange?.start, timeRange?.end, status, limit)
    
    if (!traces.success || !traces.data) {
      return []
    }

    return traces.data
  }

  /**
   * Fetch a single trace by ID
   * @param traceId - Unique trace identifier
   * @returns Promise resolving to trace object or null if not found
   */
  static async getTrace(traceId: string): Promise<Trace | null> {
    const response = await mockAPI.getTrace(traceId)
    
    if (!response.success || !response.data) {
      return null
    }

    return response.data
  }

  /**
   * Detect slow spans in a trace (performance bottlenecks)
   * Uses statistical method: spans > mean + 2*stdDev are marked as slow
   * @param trace - Trace object containing spans
   * @param threshold - Optional custom threshold in milliseconds
   * @returns Array of slow spans sorted by duration descending
   */
  static detectSlowSpans(trace: Trace, threshold?: number): Span[] {
    if (!trace.spans || trace.spans.length === 0) {
      return []
    }

    const durations = trace.spans.map(s => s.durationMs)
    
    // Calculate mean duration
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length
    
    // Calculate standard deviation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length
    const stdDev = Math.sqrt(variance)
    
    // Determine threshold: custom or statistical (mean + 2*stdDev)
    const slowThreshold = threshold !== undefined ? threshold : mean + 2 * stdDev
    
    // Filter and sort slow spans
    return trace.spans
      .filter(s => s.durationMs > slowThreshold)
      .sort((a, b) => b.durationMs - a.durationMs)
  }

  /**
   * Calculate aggregate statistics across multiple traces
   * @param traces - Array of trace objects
   * @returns Statistics object with counts, durations, and rates
   */
  static calculateTraceStats(traces: Trace[]): TraceStatistics {
    if (traces.length === 0) {
      return {
        totalTraces: 0,
        successCount: 0,
        errorCount: 0,
        timeoutCount: 0,
        avgDurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
        p50DurationMs: 0,
        p90DurationMs: 0,
        p99DurationMs: 0,
        avgSpanCount: 0,
        errorRate: 0,
        timeoutRate: 0
      }
    }

    const durations = traces.map(t => t.totalDurationMs)
    const spanCounts = traces.map(t => t.spanCount)
    
    // Count by status
    const successCount = traces.filter(t => t.status === 'SUCCESS').length
    const errorCount = traces.filter(t => t.status === 'ERROR').length
    const timeoutCount = traces.filter(t => t.status === 'TIMEOUT').length
    
    // Calculate percentiles
    const sortedDurations = [...durations].sort((a, b) => a - b)
    const p50Index = Math.ceil((50 / 100) * sortedDurations.length) - 1
    const p90Index = Math.ceil((90 / 100) * sortedDurations.length) - 1
    const p99Index = Math.ceil((99 / 100) * sortedDurations.length) - 1
    
    return {
      totalTraces: traces.length,
      successCount,
      errorCount,
      timeoutCount,
      avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDurationMs: Math.min(...durations),
      maxDurationMs: Math.max(...durations),
      p50DurationMs: sortedDurations[Math.max(0, p50Index)],
      p90DurationMs: sortedDurations[Math.max(0, p90Index)],
      p99DurationMs: sortedDurations[Math.max(0, p99Index)],
      avgSpanCount: spanCounts.reduce((a, b) => a + b, 0) / spanCounts.length,
      errorRate: errorCount / traces.length,
      timeoutRate: timeoutCount / traces.length
    }
  }

  /**
   * Build service dependency graph from traces
   * Extracts unique services and call relationships
   * @param traces - Array of traces to analyze
   * @returns Object with nodes (services) and edges (call relationships)
   */
  static buildServiceDependencyGraph(traces: Trace[]): {
    nodes: Array<{ id: string; label: string; callCount: number }>
    edges: Array<{ source: string; target: string; weight: number; avgLatency: number }>
  } {
    const nodes = new Map<string, { id: string; label: string; callCount: number }>()
    const edges = new Map<string, { source: string; target: string; weight: number; latencies: number[] }>()
    
    // Extract services and relationships from traces
    for (const trace of traces) {
      for (const span of trace.spans) {
        // Add service node
        if (!nodes.has(span.service)) {
          nodes.set(span.service, {
            id: span.service,
            label: span.service,
            callCount: 0
          })
        }
        
        // Increment call count
        const node = nodes.get(span.service)!
        node.callCount++
        
        // Add edges for parent-child relationships
        if (span.parentSpanId) {
          const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId)
          if (parentSpan) {
            const edgeKey = `${parentSpan.service}->${span.service}`
            
            if (!edges.has(edgeKey)) {
              edges.set(edgeKey, {
                source: parentSpan.service,
                target: span.service,
                weight: 0,
                latencies: []
              })
            }
            
            const edge = edges.get(edgeKey)!
            edge.weight++
            edge.latencies.push(span.durationMs)
          }
        }
      }
    }
    
    // Convert to output format
    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()).map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        avgLatency: e.latencies.reduce((a, b) => a + b, 0) / e.latencies.length
      }))
    }
  }

  /**
   * Filter traces by multiple criteria
   * @param traces - Array of traces to filter
   * @param filters - Filter criteria (service, environment, region, etc.)
   * @returns Filtered array of traces
   */
  static applyFilters(traces: Trace[], filters: Partial<FilterSet>): Trace[] {
    return traces.filter(trace => {
      // Service filter (OR logic within service array)
      if (filters.service && filters.service.length > 0) {
        const hasService = filters.service.some(s => 
          trace.spans.some(span => span.service === s)
        )
        if (!hasService) return false
      }
      
      // Environment filter (would need to be added to Trace type in future)
      // For now, skip environment filtering
      
      return true
    })
  }

  /**
   * Filter traces by time range
   * @param traces - Array of traces
   * @param startTime - Start of time range
   * @param endTime - End of time range
   * @returns Traces that started within the time range
   */
  static filterByTimeRange(traces: Trace[], startTime: Date, endTime: Date): Trace[] {
    return traces.filter(trace => {
      const traceTime = new Date(trace.startTime)
      return traceTime >= startTime && traceTime <= endTime
    })
  }

  /**
   * Filter traces by status
   * @param traces - Array of traces
   * @param status - Status to filter by ('SUCCESS' | 'ERROR' | 'TIMEOUT')
   * @returns Traces matching the status
   */
  static filterByStatus(traces: Trace[], status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'): Trace[] {
    return traces.filter(trace => trace.status === status)
  }

  /**
   * Filter traces by duration range
   * @param traces - Array of traces
   * @param minMs - Minimum duration in milliseconds
   * @param maxMs - Maximum duration in milliseconds
   * @returns Traces within the duration range
   */
  static filterByDuration(traces: Trace[], minMs: number, maxMs: number): Trace[] {
    return traces.filter(trace => 
      trace.totalDurationMs >= minMs && trace.totalDurationMs <= maxMs
    )
  }

  /**
   * Find traces containing errors
   * @param traces - Array of traces
   * @returns Traces with ERROR or TIMEOUT status
   */
  static getErrorTraces(traces: Trace[]): Trace[] {
    return traces.filter(trace => trace.status === 'ERROR' || trace.status === 'TIMEOUT')
  }

  /**
   * Find slow traces (duration > threshold)
   * @param traces - Array of traces
   * @param thresholdMs - Duration threshold in milliseconds (default: 1000ms)
   * @returns Traces exceeding the threshold, sorted by duration descending
   */
  static getSlowTraces(traces: Trace[], thresholdMs: number = 1000): Trace[] {
    return traces
      .filter(trace => trace.totalDurationMs > thresholdMs)
      .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
  }

  /**
   * Get trace by service and time range
   * @param traces - Array of traces
   * @param service - Service name
   * @param timeRange - Time range
   * @returns Filtered traces
   */
  static getTracesByServiceAndTime(
    traces: Trace[],
    service: string,
    timeRange: DateRange
  ): Trace[] {
    return traces.filter(trace => {
      const hasService = trace.spans.some(span => span.service === service)
      const traceTime = new Date(trace.startTime)
      const inTimeRange = traceTime >= timeRange.start && traceTime <= timeRange.end
      
      return hasService && inTimeRange
    })
  }

  /**
   * Calculate trace depth (maximum span nesting level)
   * @param trace - Trace object
   * @returns Maximum depth of span hierarchy
   */
  static calculateTraceDepth(trace: Trace): number {
    if (trace.spans.length === 0) return 0
    
    const spanMap = new Map<string, Span>()
    trace.spans.forEach(span => spanMap.set(span.spanId, span))
    
    let maxDepth = 0
    
    const calculateDepth = (spanId: string | null, currentDepth: number): void => {
      if (!spanId) return
      
      maxDepth = Math.max(maxDepth, currentDepth)
      
      const childSpans = trace.spans.filter(s => s.parentSpanId === spanId)
      childSpans.forEach(child => calculateDepth(child.spanId, currentDepth + 1))
    }
    
    // Start from root spans (no parent)
    const rootSpans = trace.spans.filter(s => !s.parentSpanId)
    rootSpans.forEach(root => calculateDepth(root.spanId, 1))
    
    return maxDepth
  }

  /**
   * Get critical path (longest execution path through trace)
   * @param trace - Trace object
   * @returns Array of spans forming the critical path
   */
  static getCriticalPath(trace: Trace): Span[] {
    if (trace.spans.length === 0) return []
    
    const spanMap = new Map<string, Span>()
    trace.spans.forEach(span => spanMap.set(span.spanId, span))
    
    let criticalPath: Span[] = []
    let maxDuration = 0
    
    const findPath = (spanId: string | null, path: Span[]): void => {
      if (!spanId) {
        const totalDuration = path.reduce((sum, s) => sum + s.durationMs, 0)
        if (totalDuration > maxDuration) {
          maxDuration = totalDuration
          criticalPath = [...path]
        }
        return
      }
      
      const span = spanMap.get(spanId)
      if (!span) return
      
      path.push(span)
      
      const childSpans = trace.spans.filter(s => s.parentSpanId === spanId)
      if (childSpans.length === 0) {
        // Leaf node - calculate path duration
        const totalDuration = path.reduce((sum, s) => sum + s.durationMs, 0)
        if (totalDuration > maxDuration) {
          maxDuration = totalDuration
          criticalPath = [...path]
        }
      } else {
        // Continue to children
        childSpans.forEach(child => findPath(child.spanId, path))
      }
      
      path.pop()
    }
    
    // Start from root spans
    const rootSpans = trace.spans.filter(s => !s.parentSpanId)
    rootSpans.forEach(root => findPath(root.spanId, []))
    
    return criticalPath
  }

  /**
   * Analyze span concurrency (parallel execution)
   * @param trace - Trace object
   * @returns Object with concurrency metrics
   */
  static analyzeConcurrency(trace: Trace): {
    maxConcurrentSpans: number
    avgConcurrentSpans: number
    parallelizationRatio: number
  } {
    if (trace.spans.length === 0) {
      return {
        maxConcurrentSpans: 0,
        avgConcurrentSpans: 0,
        parallelizationRatio: 0
      }
    }
    
    // Create timeline of span start/end events
    const events: Array<{ time: number; type: 'start' | 'end' }> = []
    
    trace.spans.forEach(span => {
      const startTime = new Date(span.startTime).getTime()
      const endTime = new Date(span.endTime).getTime()
      
      events.push({ time: startTime, type: 'start' })
      events.push({ time: endTime, type: 'end' })
    })
    
    // Sort events by time
    events.sort((a, b) => a.time - b.time)
    
    // Calculate concurrent spans at each point
    let currentConcurrent = 0
    let maxConcurrent = 0
    let totalConcurrent = 0
    let eventCount = 0
    
    events.forEach(event => {
      if (event.type === 'start') {
        currentConcurrent++
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      } else {
        currentConcurrent--
      }
      
      totalConcurrent += currentConcurrent
      eventCount++
    })
    
    const avgConcurrent = eventCount > 0 ? totalConcurrent / eventCount : 0
    const parallelizationRatio = trace.spans.length > 0 
      ? (trace.totalDurationMs / (trace.spans.reduce((sum, s) => sum + s.durationMs, 0))) 
      : 0
    
    return {
      maxConcurrentSpans: maxConcurrent,
      avgConcurrentSpans: avgConcurrent,
      parallelizationRatio: Math.min(parallelizationRatio, 1) // Cap at 1.0
    }
  }
}

// Export singleton instance for convenience
export const tracesService = TracesService
