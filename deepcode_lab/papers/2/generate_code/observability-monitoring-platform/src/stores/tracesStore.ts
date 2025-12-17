import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Trace, Span, TraceStatistics } from '@/types'

export const useTracesStore = defineStore('traces', () => {
  // State
  const traces = ref<Trace[]>([])
  const selectedTrace = ref<Trace | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdate = ref<Date | null>(null)

  // Computed properties
  const traceCount = computed(() => traces.value.length)
  
  const errorTraceCount = computed(() => {
    return traces.value.filter(t => t.status === 'ERROR').length
  })
  
  const successTraceCount = computed(() => {
    return traces.value.filter(t => t.status === 'SUCCESS').length
  })
  
  const avgDuration = computed(() => {
    if (traces.value.length === 0) return 0
    const total = traces.value.reduce((sum, t) => sum + t.totalDurationMs, 0)
    return Math.round(total / traces.value.length)
  })
  
  const isEmpty = computed(() => traces.value.length === 0)
  
  const hasError = computed(() => error.value !== null)

  // Actions - Data management
  const setTraces = (newTraces: Trace[]) => {
    traces.value = newTraces
    lastUpdate.value = new Date()
  }

  const addTrace = (trace: Trace) => {
    traces.value.push(trace)
    lastUpdate.value = new Date()
  }

  const addTraces = (newTraces: Trace[]) => {
    traces.value.push(...newTraces)
    lastUpdate.value = new Date()
  }

  const getTrace = (traceId: string): Trace | undefined => {
    return traces.value.find(t => t.traceId === traceId)
  }

  const clearTraces = () => {
    traces.value = []
    selectedTrace.value = null
    lastUpdate.value = new Date()
  }

  const clearTrace = (traceId: string) => {
    traces.value = traces.value.filter(t => t.traceId !== traceId)
    if (selectedTrace.value?.traceId === traceId) {
      selectedTrace.value = null
    }
    lastUpdate.value = new Date()
  }

  // Actions - Selection
  const setSelectedTrace = (trace: Trace | null) => {
    selectedTrace.value = trace
  }

  const selectTrace = (traceId: string) => {
    const trace = getTrace(traceId)
    if (trace) {
      selectedTrace.value = trace
    }
  }

  // Actions - Query methods
  const getTracesByService = (service: string): Trace[] => {
    return traces.value.filter(t => t.rootService === service)
  }

  const getTracesByStatus = (status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'): Trace[] => {
    return traces.value.filter(t => t.status === status)
  }

  const getTracesByTimeRange = (startTime: Date, endTime: Date): Trace[] => {
    return traces.value.filter(t => {
      const traceTime = new Date(t.startTime)
      return traceTime >= startTime && traceTime <= endTime
    })
  }

  const getTracesByDuration = (minMs: number, maxMs: number): Trace[] => {
    return traces.value.filter(t => t.totalDurationMs >= minMs && t.totalDurationMs <= maxMs)
  }

  const searchTraces = (query: string): Trace[] => {
    const lowerQuery = query.toLowerCase()
    return traces.value.filter(t => 
      t.traceId.toLowerCase().includes(lowerQuery) ||
      t.rootService.toLowerCase().includes(lowerQuery)
    )
  }

  const getSlowTraces = (threshold?: number): Trace[] => {
    const durations = traces.value.map(t => t.totalDurationMs)
    if (durations.length === 0) return []
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length
    const stdDev = Math.sqrt(variance)
    
    const slowThreshold = threshold || (avg + 2 * stdDev)
    return traces.value
      .filter(t => t.totalDurationMs > slowThreshold)
      .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
  }

  const getErrorTraces = (): Trace[] => {
    return traces.value.filter(t => t.status === 'ERROR')
  }

  const getRecentTraces = (limit: number = 10): Trace[] => {
    return [...traces.value]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit)
  }

  // Actions - Analysis
  const calculateTraceStats = (): TraceStatistics => {
    const total = traces.value.length
    const errors = traces.value.filter(t => t.status === 'ERROR').length
    const durations = traces.value.map(t => t.totalDurationMs)
    
    if (durations.length === 0) {
      return {
        totalTraces: 0,
        successCount: 0,
        errorCount: 0,
        avgDurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
        avgSpanCount: 0
      }
    }
    
    durations.sort((a, b) => a - b)
    const p50Index = Math.ceil((50 / 100) * durations.length) - 1
    const p90Index = Math.ceil((90 / 100) * durations.length) - 1
    const p99Index = Math.ceil((99 / 100) * durations.length) - 1
    
    const avgSpans = traces.value.reduce((sum, t) => sum + t.spanCount, 0) / total
    
    return {
      totalTraces: total,
      successCount: total - errors,
      errorCount: errors,
      avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / total),
      minDurationMs: durations[0],
      maxDurationMs: durations[durations.length - 1],
      avgSpanCount: Math.round(avgSpans)
    }
  }

  const detectSlowSpans = (traceId: string, threshold?: number): Span[] => {
    const trace = getTrace(traceId)
    if (!trace) return []
    
    const durations = trace.spans.map(s => s.durationMs)
    if (durations.length === 0) return []
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length
    const stdDev = Math.sqrt(variance)
    
    const slowThreshold = threshold || (avg + 2 * stdDev)
    return trace.spans
      .filter(s => s.durationMs > slowThreshold)
      .sort((a, b) => b.durationMs - a.durationMs)
  }

  // Actions - State management
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (err: Error | null) => {
    error.value = err
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    traces.value = []
    selectedTrace.value = null
    loading.value = false
    error.value = null
    lastUpdate.value = null
  }

  return {
    // State
    traces,
    selectedTrace,
    loading,
    error,
    lastUpdate,
    
    // Computed
    traceCount,
    errorTraceCount,
    successTraceCount,
    avgDuration,
    isEmpty,
    hasError,
    
    // Actions
    setTraces,
    addTrace,
    addTraces,
    getTrace,
    clearTraces,
    clearTrace,
    setSelectedTrace,
    selectTrace,
    getTracesByService,
    getTracesByStatus,
    getTracesByTimeRange,
    getTracesByDuration,
    searchTraces,
    getSlowTraces,
    getErrorTraces,
    getRecentTraces,
    calculateTraceStats,
    detectSlowSpans,
    setLoading,
    setError,
    clearError,
    reset
  }
})
