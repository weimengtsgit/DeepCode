import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LogEntry, LogLevel } from '@/types'

/**
 * Pinia store for managing log entries and search state
 * Provides centralized log data management with filtering, searching, and statistics
 */
export const useLogsStore = defineStore('logs', () => {
  // State
  const logs = ref<LogEntry[]>([])
  const searchResults = ref<LogEntry[]>([])
  const currentQuery = ref<string>('')
  const loading = ref<boolean>(false)
  const error = ref<Error | null>(null)
  const lastUpdate = ref<Date | null>(null)

  // Computed properties
  const totalLogs = computed(() => logs.value.length)
  const resultCount = computed(() => searchResults.value.length)
  const isEmpty = computed(() => logs.value.length === 0)
  const hasError = computed(() => error !== null)

  // Count by level
  const errorCount = computed(() => 
    logs.value.filter(log => log.level === 'ERROR').length
  )
  const warningCount = computed(() => 
    logs.value.filter(log => log.level === 'WARN').length
  )
  const infoCount = computed(() => 
    logs.value.filter(log => log.level === 'INFO').length
  )
  const debugCount = computed(() => 
    logs.value.filter(log => log.level === 'DEBUG').length
  )
  const fatalCount = computed(() => 
    logs.value.filter(log => log.level === 'FATAL').length
  )

  // Count by service
  const logsByService = computed(() => {
    const counts: Record<string, number> = {}
    logs.value.forEach(log => {
      counts[log.service] = (counts[log.service] || 0) + 1
    })
    return counts
  })

  // Actions
  function setLogs(newLogs: LogEntry[]): void {
    logs.value = newLogs
    lastUpdate.value = new Date()
  }

  function addLog(log: LogEntry): void {
    logs.value.push(log)
    lastUpdate.value = new Date()
  }

  function addLogs(newLogs: LogEntry[]): void {
    logs.value.push(...newLogs)
    lastUpdate.value = new Date()
  }

  function clearLogs(): void {
    logs.value = []
    searchResults.value = []
    lastUpdate.value = new Date()
  }

  function setSearchResults(results: LogEntry[]): void {
    searchResults.value = results
  }

  function setCurrentQuery(query: string): void {
    currentQuery.value = query
  }

  function setLoading(isLoading: boolean): void {
    loading.value = isLoading
  }

  function setError(err: Error | null): void {
    error.value = err
  }

  function clearError(): void {
    error.value = null
  }

  // Query methods
  function getLogsByLevel(level: LogLevel): LogEntry[] {
    return logs.value.filter(log => log.level === level)
  }

  function getLogsByService(service: string): LogEntry[] {
    return logs.value.filter(log => log.service === service)
  }

  function getLogsByTraceId(traceId: string): LogEntry[] {
    return logs.value.filter(log => log.traceId === traceId)
  }

  function getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return logs.value.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    )
  }

  function getLogContext(logId: string, contextSize: number = 5): LogEntry[] {
    const index = logs.value.findIndex(log => log.id === logId)
    if (index === -1) return []

    const start = Math.max(0, index - contextSize)
    const end = Math.min(logs.value.length, index + contextSize + 1)
    return logs.value.slice(start, end)
  }

  function getLogById(logId: string): LogEntry | undefined {
    return logs.value.find(log => log.id === logId)
  }

  function getRecentLogs(limit: number = 100): LogEntry[] {
    return logs.value.slice(-limit).reverse()
  }

  // Statistics
  function getStatistics() {
    return {
      totalCount: totalLogs.value,
      errorCount: errorCount.value,
      warningCount: warningCount.value,
      infoCount: infoCount.value,
      debugCount: debugCount.value,
      fatalCount: fatalCount.value,
      byService: logsByService.value,
      byLevel: {
        ERROR: errorCount.value,
        WARN: warningCount.value,
        INFO: infoCount.value,
        DEBUG: debugCount.value,
        FATAL: fatalCount.value
      }
    }
  }

  function reset(): void {
    logs.value = []
    searchResults.value = []
    currentQuery.value = ''
    loading.value = false
    error.value = null
    lastUpdate.value = null
  }

  return {
    // State
    logs,
    searchResults,
    currentQuery,
    loading,
    error,
    lastUpdate,

    // Computed
    totalLogs,
    resultCount,
    isEmpty,
    hasError,
    errorCount,
    warningCount,
    infoCount,
    debugCount,
    fatalCount,
    logsByService,

    // Actions
    setLogs,
    addLog,
    addLogs,
    clearLogs,
    setSearchResults,
    setCurrentQuery,
    setLoading,
    setError,
    clearError,

    // Query methods
    getLogsByLevel,
    getLogsByService,
    getLogsByTraceId,
    getLogsByTimeRange,
    getLogContext,
    getLogById,
    getRecentLogs,

    // Statistics
    getStatistics,
    reset
  }
})
