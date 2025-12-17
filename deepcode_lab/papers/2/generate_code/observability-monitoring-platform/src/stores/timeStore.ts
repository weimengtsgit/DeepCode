import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimePreset, DateRange } from '@/types'

/**
 * Global time range state store
 * Manages: start time, end time, selected preset, real-time mode, refresh interval
 * Used by: All modules (Dashboard, Metrics, Tracing, Logs, Custom)
 * Persists to: localStorage
 */
export const useTimeStore = defineStore('time', () => {
  // ============================================================================
  // STATE
  // ============================================================================

  // Current time range
  const startTime = ref<Date>(new Date(Date.now() - 60 * 60 * 1000)) // 1 hour ago
  const endTime = ref<Date>(new Date())

  // Selected preset (for UI binding)
  const selectedPreset = ref<TimePreset>('last_1h')

  // Real-time mode (auto-advance)
  const realTimeMode = ref<boolean>(false)

  // Refresh interval in seconds (5s, 10s, 30s, 1min, etc)
  const refreshInterval = ref<number>(10)

  // ============================================================================
  // COMPUTED
  // ============================================================================

  /**
   * Duration in milliseconds
   */
  const durationMs = computed(() => endTime.value.getTime() - startTime.value.getTime())

  /**
   * Duration in minutes
   */
  const durationMinutes = computed(() => Math.round(durationMs.value / 60000))

  /**
   * Duration in hours
   */
  const durationHours = computed(() => Math.round(durationMs.value / 3600000))

  /**
   * Duration in days
   */
  const durationDays = computed(() => Math.round(durationMs.value / 86400000))

  /**
   * Formatted time range string (e.g., "2024-01-15 14:30 - 2024-01-15 15:30")
   */
  const formattedRange = computed(() => {
    const start = startTime.value.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    const end = endTime.value.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return `${start} - ${end}`
  })

  /**
   * Check if currently in real-time mode
   */
  const isRealTime = computed(() => realTimeMode.value && refreshInterval.value > 0)

  /**
   * Check if time range is past week (> 7 days)
   */
  const isPastWeek = computed(() => durationDays.value > 7)

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Set custom time range
   */
  function setTimeRange(start: Date, end: Date) {
    if (start >= end) {
      console.warn('Invalid time range: start must be before end')
      return
    }
    startTime.value = new Date(start)
    endTime.value = new Date(end)
    selectedPreset.value = 'custom'
    persistToLocalStorage()
  }

  /**
   * Apply a time preset (last_5m, last_1h, last_24h, etc)
   */
  function applyPreset(preset: TimePreset) {
    const now = new Date()
    let start: Date

    switch (preset) {
      case 'last_5m':
        start = new Date(now.getTime() - 5 * 60 * 1000)
        break
      case 'last_15m':
        start = new Date(now.getTime() - 15 * 60 * 1000)
        break
      case 'last_1h':
        start = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'last_6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case 'last_24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'last_7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        // Keep current range
        return
      default:
        console.warn(`Unknown preset: ${preset}`)
        return
    }

    startTime.value = start
    endTime.value = now
    selectedPreset.value = preset
    persistToLocalStorage()
  }

  /**
   * Toggle real-time mode on/off
   */
  function toggleRealTime() {
    realTimeMode.value = !realTimeMode.value
    persistToLocalStorage()
  }

  /**
   * Set refresh interval (in seconds)
   */
  function setRefreshInterval(seconds: number) {
    if (seconds <= 0) {
      console.warn('Refresh interval must be positive')
      return
    }
    refreshInterval.value = seconds
    persistToLocalStorage()
  }

  /**
   * Get comparison range (previous period with same duration)
   * Used for "Compare with Previous Period" feature
   */
  function getComparisonRange(mode: 'previous_period' | 'previous_year' = 'previous_period'): DateRange {
    const duration = durationMs.value

    if (mode === 'previous_period') {
      return {
        start: new Date(startTime.value.getTime() - duration),
        end: new Date(endTime.value.getTime() - duration)
      }
    } else if (mode === 'previous_year') {
      const oneYear = 365 * 24 * 60 * 60 * 1000
      return {
        start: new Date(startTime.value.getTime() - oneYear),
        end: new Date(endTime.value.getTime() - oneYear)
      }
    }

    return { start: startTime.value, end: endTime.value }
  }

  /**
   * Advance time range by duration (for real-time mode)
   * Called every refreshInterval seconds
   */
  function advanceTimeRange() {
    if (!isRealTime.value) return

    const now = new Date()
    const duration = durationMs.value

    startTime.value = new Date(now.getTime() - duration)
    endTime.value = now
  }

  /**
   * Reset to default (last 1 hour)
   */
  function reset() {
    applyPreset('last_1h')
    realTimeMode.value = false
    refreshInterval.value = 10
    persistToLocalStorage()
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /**
   * Save state to localStorage
   */
  function persistToLocalStorage() {
    try {
      const state = {
        startTime: startTime.value.toISOString(),
        endTime: endTime.value.toISOString(),
        selectedPreset: selectedPreset.value,
        realTimeMode: realTimeMode.value,
        refreshInterval: refreshInterval.value
      }
      localStorage.setItem('monitoring_time_state', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to persist time state:', error)
    }
  }

  /**
   * Load state from localStorage
   */
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('monitoring_time_state')
      if (!stored) return

      const state = JSON.parse(stored)
      startTime.value = new Date(state.startTime)
      endTime.value = new Date(state.endTime)
      selectedPreset.value = state.selectedPreset
      realTimeMode.value = state.realTimeMode
      refreshInterval.value = state.refreshInterval
    } catch (error) {
      console.error('Failed to load time state:', error)
    }
  }

  // Load from localStorage on store initialization
  loadFromLocalStorage()

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // State
    startTime,
    endTime,
    selectedPreset,
    realTimeMode,
    refreshInterval,

    // Computed
    durationMs,
    durationMinutes,
    durationHours,
    durationDays,
    formattedRange,
    isRealTime,
    isPastWeek,

    // Actions
    setTimeRange,
    applyPreset,
    toggleRealTime,
    setRefreshInterval,
    getComparisonRange,
    advanceTimeRange,
    reset,

    // Persistence
    persistToLocalStorage,
    loadFromLocalStorage
  }
})
