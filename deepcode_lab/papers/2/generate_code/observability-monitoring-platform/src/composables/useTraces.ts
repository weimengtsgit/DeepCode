import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue'
import { useTracesStore } from '@/stores/tracesStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import { useRealtime } from '@/composables/useRealtime'
import type { Trace, Span, TraceStatistics, FilterSet, DateRange } from '@/types'

/**
 * Main composable for trace data management
 * Provides reactive access to trace data with automatic filtering and real-time updates
 */
export function useTraces(serviceId?: Ref<string> | string, autoFetch = true) {
  const tracesStore = useTracesStore()
  const timeStore = useTimeStore()
  const filterStore = useFilterStore()
  const { useRealtime: setupRealtime } = useRealtime()

  // Convert string to ref if needed
  const selectedService = ref(
    typeof serviceId === 'string' ? serviceId : serviceId?.value || ''
  )

  // Local state
  const selectedTraceId = ref<string | null>(null)
  const searchQuery = ref('')
  const statusFilter = ref<'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'ALL'>('ALL')
  const minDurationMs = ref(0)
  const maxDurationMs = ref(Infinity)

  // Computed properties
  const filteredTraces = computed(() => {
    let traces = tracesStore.traces

    // Filter by service
    if (selectedService.value) {
      traces = traces.filter(t => t.rootService === selectedService.value)
    }

    // Filter by status
    if (statusFilter.value !== 'ALL') {
      traces = traces.filter(t => t.status === statusFilter.value)
    }

    // Filter by duration range
    traces = traces.filter(
      t => t.totalDurationMs >= minDurationMs.value && t.totalDurationMs <= maxDurationMs.value
    )

    // Filter by time range
    const timeRange = {
      start: timeStore.startTime,
      end: timeStore.endTime
    }
    traces = tracesStore.getTracesByTimeRange(timeRange.start, timeRange.end)

    // Search by trace ID or service
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      traces = traces.filter(
        t =>
          t.traceId.toLowerCase().includes(query) ||
          t.rootService.toLowerCase().includes(query)
      )
    }

    return traces
  })

  const selectedTrace = computed(() => {
    if (!selectedTraceId.value) return null
    return tracesStore.getTrace(selectedTraceId.value) || null
  })

  const slowTraces = computed(() => {
    return tracesStore.getSlowTraces()
  })

  const errorTraces = computed(() => {
    return tracesStore.getErrorTraces()
  })

  const traceStats = computed(() => {
    return tracesStore.calculateTraceStats()
  })

  const loading = computed(() => tracesStore.loading)
  const error = computed(() => tracesStore.error)
  const isEmpty = computed(() => tracesStore.isEmpty)
  const hasError = computed(() => tracesStore.hasError)

  // Methods
  const fetchTraces = async () => {
    tracesStore.setLoading(true)
    try {
      // In a real app, this would call an API
      // For now, traces are pre-loaded from mock data
      tracesStore.setError(null)
    } catch (err) {
      tracesStore.setError(err instanceof Error ? err : new Error('Failed to fetch traces'))
    } finally {
      tracesStore.setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchTraces()
  }

  const selectTrace = (traceId: string) => {
    selectedTraceId.value = traceId
    tracesStore.selectTrace(traceId)
  }

  const clearSelection = () => {
    selectedTraceId.value = null
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setStatusFilter = (status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'ALL') => {
    statusFilter.value = status
  }

  const setDurationRange = (min: number, max: number) => {
    minDurationMs.value = min
    maxDurationMs.value = max
  }

  const setService = (service: string) => {
    selectedService.value = service
  }

  const getSlowSpans = (traceId: string): Span[] => {
    return tracesStore.detectSlowSpans(traceId)
  }

  const getTraceDetail = (traceId: string): Trace | null => {
    return tracesStore.getTrace(traceId) || null
  }

  const compareTraces = (traceId1: string, traceId2: string) => {
    const trace1 = tracesStore.getTrace(traceId1)
    const trace2 = tracesStore.getTrace(traceId2)

    if (!trace1 || !trace2) return null

    return {
      trace1,
      trace2,
      durationDiff: trace2.totalDurationMs - trace1.totalDurationMs,
      spanCountDiff: trace2.spanCount - trace1.spanCount,
      statusMatch: trace1.status === trace2.status
    }
  }

  const clear = () => {
    tracesStore.clearTraces()
    clearSelection()
    searchQuery.value = ''
    statusFilter.value = 'ALL'
  }

  // Watchers for automatic refresh
  watch(
    () => [timeStore.startTime, timeStore.endTime],
    () => {
      if (autoFetch) {
        fetchTraces()
      }
    },
    { deep: true }
  )

  watch(
    () => filterStore.activeFilters,
    () => {
      if (autoFetch) {
        fetchTraces()
      }
    },
    { deep: true }
  )

  // Real-time mode setup
  const setupRealtimeUpdates = () => {
    if (timeStore.isRealTime) {
      const { startRefresh } = setupRealtime()
      startRefresh(async () => {
        await fetchTraces()
      })
    }
  }

  // Lifecycle
  onMounted(() => {
    if (autoFetch && tracesStore.isEmpty) {
      fetchTraces()
    }
    setupRealtimeUpdates()
  })

  onUnmounted(() => {
    // Cleanup handled by useRealtime composable
  })

  return {
    // State
    selectedService,
    selectedTraceId,
    searchQuery,
    statusFilter,
    minDurationMs,
    maxDurationMs,

    // Computed
    filteredTraces,
    selectedTrace,
    slowTraces,
    errorTraces,
    traceStats,
    loading,
    error,
    isEmpty,
    hasError,

    // Methods
    fetchTraces,
    refresh,
    selectTrace,
    clearSelection,
    setSearchQuery,
    setStatusFilter,
    setDurationRange,
    setService,
    getSlowSpans,
    getTraceDetail,
    compareTraces,
    clear
  }
}

/**
 * Utility composable for trace analysis
 */
export function useTraceAnalysis() {
  const tracesStore = useTracesStore()

  const detectAnomalies = (trace: Trace) => {
    const slowSpans = tracesStore.detectSlowSpans(trace.traceId)
    const errorSpans = trace.spans.filter(s => s.status === 'ERROR')

    return {
      slowSpans,
      errorSpans,
      hasAnomalies: slowSpans.length > 0 || errorSpans.length > 0
    }
  }

  const calculateCriticalPath = (trace: Trace): Span[] => {
    // Find longest execution path through trace
    const visited = new Set<string>()
    let longestPath: Span[] = []

    const dfs = (spanId: string, path: Span[]): void => {
      if (visited.has(spanId)) return
      visited.add(spanId)

      const span = trace.spans.find(s => s.spanId === spanId)
      if (!span) return

      path.push(span)

      // Find child spans
      const children = trace.spans.filter(s => s.parentSpanId === spanId)
      if (children.length === 0) {
        // Leaf node - check if this path is longer
        if (path.length > longestPath.length) {
          longestPath = [...path]
        }
      } else {
        // Continue DFS for each child
        for (const child of children) {
          dfs(child.spanId, path)
        }
      }

      path.pop()
      visited.delete(spanId)
    }

    // Start from root span
    dfs(trace.rootSpanId, [])
    return longestPath
  }

  const analyzeConcurrency = (trace: Trace) => {
    const timelineEvents: Array<{ time: number; type: 'start' | 'end' }> = []

    // Build timeline of span starts and ends
    for (const span of trace.spans) {
      timelineEvents.push({ time: span.startTime.getTime(), type: 'start' })
      timelineEvents.push({ time: span.endTime.getTime(), type: 'end' })
    }

    // Sort by time
    timelineEvents.sort((a, b) => a.time - b.time)

    // Calculate concurrent spans at each point
    let maxConcurrent = 0
    let currentConcurrent = 0

    for (const event of timelineEvents) {
      if (event.type === 'start') {
        currentConcurrent++
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      } else {
        currentConcurrent--
      }
    }

    const avgConcurrent = trace.spanCount > 0 ? trace.spanCount / maxConcurrent : 0
    const parallelizationRatio = maxConcurrent / trace.spanCount

    return {
      maxConcurrentSpans: maxConcurrent,
      avgConcurrentSpans: avgConcurrent,
      parallelizationRatio
    }
  }

  const getServiceDependencies = (traces: Trace[]) => {
    const dependencies = new Map<string, Set<string>>()

    for (const trace of traces) {
      for (const span of trace.spans) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId)
        if (parentSpan) {
          const key = parentSpan.service
          if (!dependencies.has(key)) {
            dependencies.set(key, new Set())
          }
          dependencies.get(key)!.add(span.service)
        }
      }
    }

    // Convert to array format
    const result: Array<{ source: string; target: string; count: number }> = []
    for (const [source, targets] of dependencies) {
      for (const target of targets) {
        result.push({ source, target, count: 1 })
      }
    }

    return result
  }

  return {
    detectAnomalies,
    calculateCriticalPath,
    analyzeConcurrency,
    getServiceDependencies
  }
}

/**
 * Utility composable for trace comparison
 */
export function useTraceComparison() {
  const tracesStore = useTracesStore()

  const compareByDuration = (traces: Trace[]) => {
    return traces.sort((a, b) => b.totalDurationMs - a.totalDurationMs)
  }

  const compareByErrorRate = (traces: Trace[]) => {
    const withErrorRate = traces.map(t => ({
      trace: t,
      errorRate: t.spans.filter(s => s.status === 'ERROR').length / t.spanCount
    }))

    return withErrorRate.sort((a, b) => b.errorRate - a.errorRate)
  }

  const compareBySpanCount = (traces: Trace[]) => {
    return traces.sort((a, b) => b.spanCount - a.spanCount)
  }

  const findSimilarTraces = (traceId: string, limit = 10): Trace[] => {
    const referenceTrace = tracesStore.getTrace(traceId)
    if (!referenceTrace) return []

    const allTraces = tracesStore.traces
    const similar = allTraces
      .filter(t => t.traceId !== traceId && t.rootService === referenceTrace.rootService)
      .map(t => ({
        trace: t,
        similarity: calculateSimilarity(referenceTrace, t)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.trace)

    return similar
  }

  const calculateSimilarity = (trace1: Trace, trace2: Trace): number => {
    let score = 0

    // Same root service (10 points)
    if (trace1.rootService === trace2.rootService) score += 10

    // Similar duration (within 20%) (10 points)
    const durationDiff = Math.abs(trace1.totalDurationMs - trace2.totalDurationMs)
    const avgDuration = (trace1.totalDurationMs + trace2.totalDurationMs) / 2
    if (durationDiff / avgDuration < 0.2) score += 10

    // Same status (10 points)
    if (trace1.status === trace2.status) score += 10

    // Similar span count (within 20%) (10 points)
    const spanCountDiff = Math.abs(trace1.spanCount - trace2.spanCount)
    const avgSpanCount = (trace1.spanCount + trace2.spanCount) / 2
    if (spanCountDiff / avgSpanCount < 0.2) score += 10

    // Same services involved (10 points)
    const services1 = new Set(trace1.spans.map(s => s.service))
    const services2 = new Set(trace2.spans.map(s => s.service))
    const intersection = new Set([...services1].filter(x => services2.has(x)))
    const union = new Set([...services1, ...services2])
    const jaccardSimilarity = intersection.size / union.size
    score += jaccardSimilarity * 10

    return score
  }

  return {
    compareByDuration,
    compareByErrorRate,
    compareBySpanCount,
    findSimilarTraces
  }
}
