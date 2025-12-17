import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue'
import { useLogsStore } from '@/stores/logsStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import type { LogEntry, LogLevel, LogStatistics } from '@/types'

/**
 * Main composable for log search, filtering, and virtual scrolling
 * Provides reactive access to log data with search capabilities and pagination
 */
export function useLogs() {
  const logsStore = useLogsStore()
  const timeStore = useTimeStore()
  const filterStore = useFilterStore()

  // State refs
  const searchQuery = ref<string>('')
  const selectedLevels = ref<LogLevel[]>(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
  const selectedServices = ref<string[]>([])
  const selectedTraceId = ref<string>('')
  const currentPage = ref<number>(1)
  const pageSize = ref<number>(50)
  const sortBy = ref<'timestamp' | 'level'>('timestamp')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // Computed properties for filtered data
  const filteredLogs = computed<LogEntry[]>(() => {
    let results = logsStore.logs

    // Filter by time range
    const startTime = timeStore.startTime
    const endTime = timeStore.endTime
    results = results.filter(
      log => log.timestamp >= startTime && log.timestamp <= endTime
    )

    // Filter by log level
    if (selectedLevels.value.length > 0) {
      results = results.filter(log => selectedLevels.value.includes(log.level))
    }

    // Filter by service
    if (selectedServices.value.length > 0) {
      results = results.filter(log => selectedServices.value.includes(log.service))
    }

    // Filter by traceId if specified
    if (selectedTraceId.value) {
      results = results.filter(log => log.traceId === selectedTraceId.value)
    }

    // Apply global filters from filterStore
    if (filterStore.activeFilters.service && filterStore.activeFilters.service.length > 0) {
      results = results.filter(log =>
        filterStore.activeFilters.service!.includes(log.service)
      )
    }

    // Search by keyword (case-insensitive, supports regex)
    if (searchQuery.value) {
      try {
        const regex = new RegExp(searchQuery.value, 'i')
        results = results.filter(log => regex.test(log.message))
      } catch {
        // Invalid regex, fall back to simple string matching
        const query = searchQuery.value.toLowerCase()
        results = results.filter(log => log.message.toLowerCase().includes(query))
      }
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0
      if (sortBy.value === 'timestamp') {
        comparison = a.timestamp.getTime() - b.timestamp.getTime()
      } else if (sortBy.value === 'level') {
        const levelOrder: Record<LogLevel, number> = {
          FATAL: 5,
          ERROR: 4,
          WARN: 3,
          INFO: 2,
          DEBUG: 1
        }
        comparison = levelOrder[a.level] - levelOrder[b.level]
      }

      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return results
  })

  // Pagination
  const totalResults = computed<number>(() => filteredLogs.value.length)
  const totalPages = computed<number>(() => Math.ceil(totalResults.value / pageSize.value))
  const paginatedLogs = computed<LogEntry[]>(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredLogs.value.slice(start, end)
  })

  const paginationInfo = computed(() => ({
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    totalResults: totalResults.value,
    totalPages: totalPages.value,
    hasNextPage: currentPage.value < totalPages.value,
    hasPrevPage: currentPage.value > 1
  }))

  // Statistics
  const statistics = computed<LogStatistics>(() => {
    const logs = filteredLogs.value
    const countByLevel: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0
    }

    logs.forEach(log => {
      countByLevel[log.level]++
    })

    // Calculate hourly trend
    const hourlyBuckets: Record<number, number> = {}
    logs.forEach(log => {
      const hour = log.timestamp.getUTCHours()
      hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1
    })

    const countTrend = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyBuckets[i] || 0
    }))

    // Find top error messages
    const errorMessages: Record<string, number> = {}
    logs
      .filter(log => log.level === 'ERROR' || log.level === 'FATAL')
      .forEach(log => {
        errorMessages[log.message] = (errorMessages[log.message] || 0) + 1
      })

    const topErrors = Object.entries(errorMessages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }))

    return {
      totalCount: logs.length,
      countByLevel,
      countTrend,
      topErrors
    }
  })

  // Computed properties for UI
  const loading = computed<boolean>(() => logsStore.loading)
  const error = computed<Error | null>(() => logsStore.error)
  const isEmpty = computed<boolean>(() => filteredLogs.value.length === 0)
  const hasError = computed<boolean>(() => error.value !== null)

  // Methods
  const setSearchQuery = (query: string): void => {
    searchQuery.value = query
    currentPage.value = 1 // Reset to first page on new search
  }

  const setLevelFilter = (levels: LogLevel[]): void => {
    selectedLevels.value = levels
    currentPage.value = 1
  }

  const setServiceFilter = (services: string[]): void => {
    selectedServices.value = services
    currentPage.value = 1
  }

  const setTraceIdFilter = (traceId: string): void => {
    selectedTraceId.value = traceId
    currentPage.value = 1
  }

  const clearFilters = (): void => {
    searchQuery.value = ''
    selectedLevels.value = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    selectedServices.value = []
    selectedTraceId.value = ''
    currentPage.value = 1
  }

  const setSortBy = (field: 'timestamp' | 'level'): void => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'desc'
    }
  }

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = (): void => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = (): void => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const setPageSize = (size: number): void => {
    pageSize.value = size
    currentPage.value = 1
  }

  const getLogContext = (logId: string, contextSize: number = 5): LogEntry[] => {
    const index = filteredLogs.value.findIndex(log => log.id === logId)
    if (index === -1) return []

    const start = Math.max(0, index - contextSize)
    const end = Math.min(filteredLogs.value.length, index + contextSize + 1)
    return filteredLogs.value.slice(start, end)
  }

  const fetchLogs = async (): Promise<void> => {
    try {
      logsStore.setLoading(true)
      logsStore.clearError()

      // Fetch logs from store (mock data already loaded)
      // In real implementation, this would call an API
      const startTime = timeStore.startTime
      const endTime = timeStore.endTime

      // Filter logs by time range
      const logs = logsStore.logs.filter(
        log => log.timestamp >= startTime && log.timestamp <= endTime
      )

      logsStore.setLogs(logs)
    } catch (err) {
      logsStore.setError(err instanceof Error ? err : new Error('Failed to fetch logs'))
    } finally {
      logsStore.setLoading(false)
    }
  }

  const refresh = async (): Promise<void> => {
    await fetchLogs()
  }

  const clear = (): void => {
    logsStore.clearLogs()
    clearFilters()
  }

  // Auto-refresh on time range change
  watch(
    () => [timeStore.startTime, timeStore.endTime],
    () => {
      fetchLogs()
    },
    { deep: true }
  )

  // Auto-refresh in real-time mode
  let refreshInterval: ReturnType<typeof setInterval> | null = null
  watch(
    () => timeStore.isRealTime,
    (isRealTime) => {
      if (isRealTime && timeStore.refreshInterval > 0) {
        refreshInterval = setInterval(() => {
          refresh()
        }, timeStore.refreshInterval * 1000)
      } else if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })

  // Initial fetch on mount
  onMounted(() => {
    fetchLogs()
  })

  return {
    // State
    searchQuery,
    selectedLevels,
    selectedServices,
    selectedTraceId,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,

    // Computed
    filteredLogs,
    paginatedLogs,
    paginationInfo,
    statistics,
    loading,
    error,
    isEmpty,
    hasError,
    totalResults,
    totalPages,

    // Methods
    setSearchQuery,
    setLevelFilter,
    setServiceFilter,
    setTraceIdFilter,
    clearFilters,
    setSortBy,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    getLogContext,
    fetchLogs,
    refresh,
    clear
  }
}

/**
 * Utility composable for advanced log operations
 */
export function useLogSearch() {
  /**
   * Parse advanced search query with field syntax
   * Examples: "level:ERROR", "service:api-service", "message:timeout"
   */
  const parseAdvancedQuery = (query: string): Record<string, string[]> => {
    const fields: Record<string, string[]> = {}
    const parts = query.split(/\s+/)

    parts.forEach(part => {
      if (part.includes(':')) {
        const [field, value] = part.split(':')
        if (!fields[field]) {
          fields[field] = []
        }
        fields[field].push(value)
      }
    })

    return fields
  }

  /**
   * Extract field values from log message using regex patterns
   */
  const extractLogFields = (
    message: string,
    patterns: Record<string, RegExp>
  ): Record<string, string> => {
    const fields: Record<string, string> = {}

    Object.entries(patterns).forEach(([fieldName, pattern]) => {
      const match = message.match(pattern)
      if (match && match[1]) {
        fields[fieldName] = match[1]
      }
    })

    return fields
  }

  /**
   * Highlight search matches in log message
   */
  const highlightMatches = (message: string, query: string): string => {
    try {
      const regex = new RegExp(`(${query})`, 'gi')
      return message.replace(regex, '<mark>$1</mark>')
    } catch {
      return message
    }
  }

  /**
   * Search logs with advanced query syntax
   */
  const searchWithAdvancedQuery = (logs: LogEntry[], query: string): LogEntry[] => {
    const fields = parseAdvancedQuery(query)

    return logs.filter(log => {
      return Object.entries(fields).every(([field, values]) => {
        switch (field) {
          case 'level':
            return values.some(v => log.level.toLowerCase() === v.toLowerCase())
          case 'service':
            return values.some(v => log.service.toLowerCase().includes(v.toLowerCase()))
          case 'message':
            return values.some(v => log.message.toLowerCase().includes(v.toLowerCase()))
          case 'traceId':
            return values.some(v => log.traceId === v)
          default:
            return true
        }
      })
    })
  }

  return {
    parseAdvancedQuery,
    extractLogFields,
    highlightMatches,
    searchWithAdvancedQuery
  }
}

/**
 * Utility composable for log statistics and aggregation
 */
export function useLogStatistics() {
  /**
   * Calculate log count trend by time bucket
   */
  const calculateTrendByBucket = (
    logs: LogEntry[],
    bucketSizeMinutes: number = 60
  ): Array<{ timestamp: Date; count: number }> => {
    const buckets: Record<number, number> = {}

    logs.forEach(log => {
      const bucketTime = Math.floor(log.timestamp.getTime() / (bucketSizeMinutes * 60 * 1000))
      buckets[bucketTime] = (buckets[bucketTime] || 0) + 1
    })

    return Object.entries(buckets)
      .map(([bucket, count]) => ({
        timestamp: new Date(parseInt(bucket) * bucketSizeMinutes * 60 * 1000),
        count
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  /**
   * Calculate error rate over time
   */
  const calculateErrorRate = (logs: LogEntry[]): number => {
    if (logs.length === 0) return 0
    const errorCount = logs.filter(log => log.level === 'ERROR' || log.level === 'FATAL').length
    return (errorCount / logs.length) * 100
  }

  /**
   * Get most common log messages
   */
  const getTopMessages = (logs: LogEntry[], limit: number = 10): Array<{
    message: string
    count: number
  }> => {
    const messageCounts: Record<string, number> = {}

    logs.forEach(log => {
      messageCounts[log.message] = (messageCounts[log.message] || 0) + 1
    })

    return Object.entries(messageCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Get services with most logs
   */
  const getTopServices = (logs: LogEntry[], limit: number = 10): Array<{
    service: string
    count: number
  }> => {
    const serviceCounts: Record<string, number> = {}

    logs.forEach(log => {
      serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1
    })

    return Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  return {
    calculateTrendByBucket,
    calculateErrorRate,
    getTopMessages,
    getTopServices
  }
}
