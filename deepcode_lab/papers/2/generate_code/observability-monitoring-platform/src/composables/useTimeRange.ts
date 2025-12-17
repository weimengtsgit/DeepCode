import { computed, ref, watch, Ref } from 'vue'
import { useTimeStore } from '@/stores/timeStore'
import type { DateRange, TimePreset } from '@/types'

/**
 * Composable for managing time range state and operations
 * Provides reactive access to time range, presets, real-time mode, and comparison functionality
 * Integrates with global timeStore for cross-module state synchronization
 */
export function useTimeRange() {
  const timeStore = useTimeStore()

  // Local state for UI interactions
  const showCustomRange = ref(false)
  const showComparison = ref(false)

  // Computed properties for reactive UI binding
  const startTime = computed({
    get: () => timeStore.startTime,
    set: (value: Date) => {
      timeStore.setTimeRange(value, timeStore.endTime)
    }
  })

  const endTime = computed({
    get: () => timeStore.endTime,
    set: (value: Date) => {
      timeStore.setTimeRange(timeStore.startTime, value)
    }
  })

  const selectedPreset = computed({
    get: () => timeStore.selectedPreset,
    set: (value: TimePreset) => {
      timeStore.applyPreset(value)
    }
  })

  const realTimeMode = computed({
    get: () => timeStore.realTimeMode,
    set: (value: boolean) => {
      timeStore.toggleRealTime()
    }
  })

  const refreshInterval = computed({
    get: () => timeStore.refreshInterval,
    set: (value: number) => {
      timeStore.setRefreshInterval(value)
    }
  })

  // Derived computed properties
  const durationMs = computed(() => timeStore.durationMs)
  const durationMinutes = computed(() => timeStore.durationMinutes)
  const durationHours = computed(() => timeStore.durationHours)
  const durationDays = computed(() => timeStore.durationDays)
  const formattedRange = computed(() => timeStore.formattedRange)
  const isRealTime = computed(() => timeStore.isRealTime)
  const isPastWeek = computed(() => timeStore.isPastWeek)

  /**
   * Apply a quick time preset (5m, 1h, 24h, 7d, etc)
   */
  const applyPreset = (preset: TimePreset): void => {
    timeStore.applyPreset(preset)
    showCustomRange.value = false
  }

  /**
   * Set custom date range with validation
   */
  const setCustomRange = (start: Date, end: Date): void => {
    if (start >= end) {
      console.warn('Invalid time range: start must be before end')
      return
    }
    timeStore.setTimeRange(start, end)
    showCustomRange.value = false
  }

  /**
   * Toggle real-time mode on/off
   */
  const toggleRealTime = (): void => {
    timeStore.toggleRealTime()
  }

  /**
   * Set refresh interval for real-time mode
   */
  const setRefreshInterval = (seconds: number): void => {
    if (seconds <= 0) {
      console.warn('Refresh interval must be positive')
      return
    }
    timeStore.setRefreshInterval(seconds)
  }

  /**
   * Get time range for comparison with previous period
   * @param mode 'previous_period' | 'previous_year'
   */
  const getComparisonRange = (mode: 'previous_period' | 'previous_year' = 'previous_period'): DateRange => {
    return timeStore.getComparisonRange(mode)
  }

  /**
   * Format time range as human-readable string
   * @example "Jan 15, 2024 14:30 - 15:30"
   */
  const getFormattedRange = (): string => {
    return timeStore.formattedRange
  }

  /**
   * Get time range as ISO 8601 strings
   */
  const getISORange = (): { start: string; end: string } => {
    return {
      start: timeStore.startTime.toISOString(),
      end: timeStore.endTime.toISOString()
    }
  }

  /**
   * Reset to default time range (last 1 hour)
   */
  const reset = (): void => {
    timeStore.reset()
  }

  /**
   * Check if time range is valid for data fetching
   */
  const isValid = (): boolean => {
    return timeStore.startTime < timeStore.endTime && durationMs.value > 0
  }

  /**
   * Get available time presets
   */
  const getAvailablePresets = (): Array<{ value: TimePreset; label: string }> => {
    return [
      { value: 'last_5m', label: 'Last 5 minutes' },
      { value: 'last_15m', label: 'Last 15 minutes' },
      { value: 'last_1h', label: 'Last 1 hour' },
      { value: 'last_6h', label: 'Last 6 hours' },
      { value: 'last_24h', label: 'Last 24 hours' },
      { value: 'last_7d', label: 'Last 7 days' }
    ]
  }

  /**
   * Watch for time range changes and emit custom event
   * Used by components that need to react to time changes
   */
  const onTimeRangeChange = (callback: (range: DateRange) => void): (() => void) => {
    const unwatch = watch(
      () => ({ start: timeStore.startTime, end: timeStore.endTime }),
      ({ start, end }) => {
        callback({ start, end })
      }
    )
    return unwatch
  }

  /**
   * Watch for real-time mode changes
   */
  const onRealTimeModeChange = (callback: (isRealTime: boolean) => void): (() => void) => {
    const unwatch = watch(
      () => timeStore.realTimeMode,
      (isRealTime) => {
        callback(isRealTime)
      }
    )
    return unwatch
  }

  return {
    // State refs
    startTime,
    endTime,
    selectedPreset,
    realTimeMode,
    refreshInterval,
    showCustomRange,
    showComparison,

    // Computed properties
    durationMs,
    durationMinutes,
    durationHours,
    durationDays,
    formattedRange,
    isRealTime,
    isPastWeek,

    // Methods
    applyPreset,
    setCustomRange,
    toggleRealTime,
    setRefreshInterval,
    getComparisonRange,
    getFormattedRange,
    getISORange,
    reset,
    isValid,
    getAvailablePresets,
    onTimeRangeChange,
    onRealTimeModeChange
  }
}

/**
 * Composable for time formatting utilities
 */
export function useTimeFormatting() {
  /**
   * Format date to "HH:MM" format
   */
  const formatTime = (date: Date): string => {
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * Format date to "YYYY-MM-DD HH:MM" format
   */
  const formatDateTime = (date: Date): string => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  /**
   * Format date to "MMM DD, YYYY" format
   */
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getUTCMonth()]
    const day = date.getUTCDate()
    const year = date.getUTCFullYear()
    return `${month} ${day}, ${year}`
  }

  /**
   * Format relative time (e.g., "5 minutes ago")
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
      return 'just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return formatDate(date)
    }
  }

  /**
   * Format duration in milliseconds to human-readable format
   * @example 3661000 -> "1h 1m"
   */
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds}s`)

    return parts.join(' ')
  }

  return {
    formatTime,
    formatDateTime,
    formatDate,
    formatRelativeTime,
    formatDuration
  }
}

/**
 * Composable for time range presets and calculations
 */
export function useTimePresets() {
  /**
   * Calculate time range for a given preset
   */
  const getPresetRange = (preset: TimePreset): DateRange => {
    const now = new Date()
    const start = new Date(now)

    switch (preset) {
      case 'last_5m':
        start.setUTCMinutes(start.getUTCMinutes() - 5)
        break
      case 'last_15m':
        start.setUTCMinutes(start.getUTCMinutes() - 15)
        break
      case 'last_1h':
        start.setUTCHours(start.getUTCHours() - 1)
        break
      case 'last_6h':
        start.setUTCHours(start.getUTCHours() - 6)
        break
      case 'last_24h':
        start.setUTCDate(start.getUTCDate() - 1)
        break
      case 'last_7d':
        start.setUTCDate(start.getUTCDate() - 7)
        break
      case 'custom':
        // Custom range handled separately
        break
    }

    return { start, end: now }
  }

  /**
   * Get preset label for display
   */
  const getPresetLabel = (preset: TimePreset): string => {
    const labels: Record<TimePreset, string> = {
      last_5m: 'Last 5 minutes',
      last_15m: 'Last 15 minutes',
      last_1h: 'Last 1 hour',
      last_6h: 'Last 6 hours',
      last_24h: 'Last 24 hours',
      last_7d: 'Last 7 days',
      custom: 'Custom range'
    }
    return labels[preset] || 'Unknown'
  }

  /**
   * Determine which preset matches a given time range
   */
  const detectPreset = (start: Date, end: Date): TimePreset => {
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = diffMs / (1000 * 60)

    if (Math.abs(diffMinutes - 5) < 1) return 'last_5m'
    if (Math.abs(diffMinutes - 15) < 1) return 'last_15m'
    if (Math.abs(diffMinutes - 60) < 5) return 'last_1h'
    if (Math.abs(diffMinutes - 360) < 10) return 'last_6h'
    if (Math.abs(diffMinutes - 1440) < 30) return 'last_24h'
    if (Math.abs(diffMinutes - 10080) < 60) return 'last_7d'

    return 'custom'
  }

  return {
    getPresetRange,
    getPresetLabel,
    detectPreset
  }
}
