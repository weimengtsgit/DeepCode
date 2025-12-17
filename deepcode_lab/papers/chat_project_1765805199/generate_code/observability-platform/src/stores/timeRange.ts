import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimeRange, QuickTimeRange } from '@/types'
import { getTimeRangeFromPreset, getNowTimeRange, getTimeRangeDuration } from '@/utils/date'

export interface TimeRangeState {
  timeRange: TimeRange
  currentPreset: QuickTimeRange | null
  isRealtime: boolean
  refreshInterval: number
  isPaused: boolean
}

export const useTimeRangeStore = defineStore('timeRange', () => {
  // State
  const timeRange = ref<TimeRange>(getTimeRangeFromPreset('15m'))
  const currentPreset = ref<QuickTimeRange | null>('15m')
  const isRealtime = ref(false)
  const refreshInterval = ref(30000) // 30 seconds default
  const isPaused = ref(false)

  // Computed
  const duration = computed(() => getTimeRangeDuration(timeRange.value))
  
  const label = computed(() => {
    if (currentPreset.value && currentPreset.value !== 'custom') {
      return timeRange.value.label || currentPreset.value
    }
    return timeRange.value.label || 'Custom Range'
  })

  const isCustomRange = computed(() => currentPreset.value === 'custom' || currentPreset.value === null)

  const startTime = computed(() => timeRange.value.start)
  const endTime = computed(() => timeRange.value.end)

  // Actions
  function setTimeRange(newTimeRange: TimeRange) {
    timeRange.value = newTimeRange
    currentPreset.value = null
  }

  function setPreset(preset: QuickTimeRange) {
    if (preset === 'custom') {
      currentPreset.value = 'custom'
      return
    }
    
    const newTimeRange = getTimeRangeFromPreset(preset)
    timeRange.value = newTimeRange
    currentPreset.value = preset
  }

  function setCustomRange(start: number, end: number, label?: string) {
    timeRange.value = {
      start,
      end,
      label: label || 'Custom Range'
    }
    currentPreset.value = 'custom'
  }

  function toggleRealtime() {
    isRealtime.value = !isRealtime.value
    if (isRealtime.value && currentPreset.value && currentPreset.value !== 'custom') {
      // Update to current time range when enabling realtime
      refresh()
    }
  }

  function setRefreshInterval(interval: number) {
    if (interval < 0) {
      console.warn('Refresh interval must be non-negative')
      return
    }
    refreshInterval.value = interval
  }

  function refresh() {
    if (currentPreset.value && currentPreset.value !== 'custom') {
      // Refresh preset to current time
      const newTimeRange = getTimeRangeFromPreset(currentPreset.value)
      timeRange.value = newTimeRange
    } else if (isRealtime.value) {
      // For custom ranges in realtime mode, shift to current time
      const dur = duration.value
      const now = Date.now()
      timeRange.value = {
        start: now - dur,
        end: now,
        label: timeRange.value.label
      }
    }
  }

  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function shiftForward() {
    const dur = duration.value
    timeRange.value = {
      start: timeRange.value.start + dur,
      end: timeRange.value.end + dur,
      label: timeRange.value.label
    }
    currentPreset.value = null // Shifting invalidates preset
  }

  function shiftBackward() {
    const dur = duration.value
    timeRange.value = {
      start: timeRange.value.start - dur,
      end: timeRange.value.end - dur,
      label: timeRange.value.label
    }
    currentPreset.value = null // Shifting invalidates preset
  }

  function zoomIn(factor: number = 0.5) {
    const dur = duration.value
    const center = (timeRange.value.start + timeRange.value.end) / 2
    const newDur = dur * factor
    timeRange.value = {
      start: center - newDur / 2,
      end: center + newDur / 2,
      label: timeRange.value.label
    }
    currentPreset.value = null // Zooming invalidates preset
  }

  function zoomOut(factor: number = 2) {
    const dur = duration.value
    const center = (timeRange.value.start + timeRange.value.end) / 2
    const newDur = dur * factor
    timeRange.value = {
      start: center - newDur / 2,
      end: center + newDur / 2,
      label: timeRange.value.label
    }
    currentPreset.value = null // Zooming invalidates preset
  }

  function reset() {
    timeRange.value = getTimeRangeFromPreset('15m')
    currentPreset.value = '15m'
    isRealtime.value = false
    refreshInterval.value = 30000
    isPaused.value = false
  }

  return {
    // State
    timeRange,
    currentPreset,
    isRealtime,
    refreshInterval,
    isPaused,
    
    // Computed
    duration,
    label,
    isCustomRange,
    startTime,
    endTime,
    
    // Actions
    setTimeRange,
    setPreset,
    setCustomRange,
    toggleRealtime,
    setRefreshInterval,
    refresh,
    pause,
    resume,
    togglePause,
    shiftForward,
    shiftBackward,
    zoomIn,
    zoomOut,
    reset
  }
}, {
  persist: {
    key: 'observability-timeRange',
    storage: localStorage,
    paths: ['currentPreset', 'refreshInterval', 'isRealtime']
    // Don't persist timeRange itself to avoid stale timestamps
  }
})
