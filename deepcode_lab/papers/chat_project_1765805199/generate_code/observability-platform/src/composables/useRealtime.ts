/**
 * Real-time Data Refresh Composable
 * 
 * Provides automatic data refresh functionality with configurable intervals,
 * pause/resume controls, and integration with time range store for real-time mode.
 * 
 * Features:
 * - Configurable refresh intervals (5s to 5m)
 * - Automatic cleanup on component unmount
 * - Pause/resume controls
 * - Integration with time range store
 * - Error handling and retry logic
 * - Manual refresh trigger
 */

import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimeRangeStore } from '@/stores/timeRange'

/**
 * Callback function type for data refresh
 */
export type RefreshCallback = () => void | Promise<void>

/**
 * Options for useRealtime composable
 */
export interface UseRealtimeOptions {
  /**
   * Initial refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number

  /**
   * Whether to start refreshing immediately
   * @default false
   */
  immediate?: boolean

  /**
   * Whether to integrate with time range store's realtime mode
   * @default true
   */
  useTimeRangeStore?: boolean

  /**
   * Whether to pause when page is not visible
   * @default true
   */
  pauseOnHidden?: boolean

  /**
   * Maximum number of retry attempts on error
   * @default 3
   */
  maxRetries?: number

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number

  /**
   * Callback when refresh succeeds
   */
  onSuccess?: () => void

  /**
   * Callback when refresh fails
   */
  onError?: (error: Error) => void
}

/**
 * Real-time refresh composable
 * 
 * @param callback - Function to call on each refresh
 * @param options - Configuration options
 * @returns Object with state and control methods
 * 
 * @example
 * ```ts
 * const { isActive, isPaused, start, stop, pause, resume, refresh } = useRealtime(
 *   async () => {
 *     await fetchData()
 *   },
 *   { interval: 30000, immediate: true }
 * )
 * ```
 */
export function useRealtime(
  callback: RefreshCallback,
  options: UseRealtimeOptions = {}
) {
  const {
    interval: initialInterval = 30000,
    immediate = false,
    useTimeRangeStore: useStore = true,
    pauseOnHidden = true,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options

  // State
  const isActive = ref(false)
  const isPaused = ref(false)
  const interval = ref(initialInterval)
  const lastRefreshTime = ref<number | null>(null)
  const nextRefreshTime = ref<number | null>(null)
  const isRefreshing = ref(false)
  const error = ref<Error | null>(null)
  const retryCount = ref(0)

  // Timer reference
  let timerId: number | null = null
  let retryTimerId: number | null = null

  // Time range store integration
  let timeRangeStore: ReturnType<typeof useTimeRangeStore> | null = null
  if (useStore) {
    timeRangeStore = useTimeRangeStore()
  }

  // Computed
  const timeUntilNextRefresh = computed(() => {
    if (!nextRefreshTime.value || !isActive.value || isPaused.value) {
      return null
    }
    return Math.max(0, nextRefreshTime.value - Date.now())
  })

  const timeSinceLastRefresh = computed(() => {
    if (!lastRefreshTime.value) {
      return null
    }
    return Date.now() - lastRefreshTime.value
  })

  /**
   * Execute refresh callback with error handling and retry logic
   */
  const executeRefresh = async () => {
    if (isRefreshing.value) {
      return
    }

    isRefreshing.value = true
    error.value = null

    try {
      await callback()
      lastRefreshTime.value = Date.now()
      retryCount.value = 0
      onSuccess?.()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useRealtime] Refresh failed:', error.value)
      onError?.(error.value)

      // Retry logic
      if (retryCount.value < maxRetries) {
        retryCount.value++
        console.log(`[useRealtime] Retrying (${retryCount.value}/${maxRetries})...`)
        
        retryTimerId = window.setTimeout(() => {
          executeRefresh()
        }, retryDelay)
      }
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Schedule next refresh
   */
  const scheduleRefresh = () => {
    if (timerId !== null) {
      clearTimeout(timerId)
    }

    if (!isActive.value || isPaused.value) {
      nextRefreshTime.value = null
      return
    }

    nextRefreshTime.value = Date.now() + interval.value
    timerId = window.setTimeout(() => {
      executeRefresh()
      scheduleRefresh()
    }, interval.value)
  }

  /**
   * Start real-time refresh
   */
  const start = () => {
    if (isActive.value) {
      return
    }

    isActive.value = true
    isPaused.value = false
    scheduleRefresh()

    // Sync with time range store if enabled
    if (timeRangeStore) {
      const { isRealtime } = storeToRefs(timeRangeStore)
      if (!isRealtime.value) {
        timeRangeStore.toggleRealtime()
      }
    }
  }

  /**
   * Stop real-time refresh
   */
  const stop = () => {
    isActive.value = false
    isPaused.value = false
    
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
    
    if (retryTimerId !== null) {
      clearTimeout(retryTimerId)
      retryTimerId = null
    }

    nextRefreshTime.value = null

    // Sync with time range store if enabled
    if (timeRangeStore) {
      const { isRealtime } = storeToRefs(timeRangeStore)
      if (isRealtime.value) {
        timeRangeStore.toggleRealtime()
      }
    }
  }

  /**
   * Pause real-time refresh
   */
  const pause = () => {
    if (!isActive.value || isPaused.value) {
      return
    }

    isPaused.value = true
    
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }

    nextRefreshTime.value = null

    // Sync with time range store if enabled
    if (timeRangeStore) {
      timeRangeStore.pause()
    }
  }

  /**
   * Resume real-time refresh
   */
  const resume = () => {
    if (!isActive.value || !isPaused.value) {
      return
    }

    isPaused.value = false
    scheduleRefresh()

    // Sync with time range store if enabled
    if (timeRangeStore) {
      timeRangeStore.resume()
    }
  }

  /**
   * Toggle pause state
   */
  const togglePause = () => {
    if (isPaused.value) {
      resume()
    } else {
      pause()
    }
  }

  /**
   * Manually trigger refresh
   */
  const refresh = async () => {
    await executeRefresh()
    
    // Reschedule next refresh
    if (isActive.value && !isPaused.value) {
      scheduleRefresh()
    }
  }

  /**
   * Set refresh interval
   */
  const setInterval = (newInterval: number) => {
    interval.value = newInterval

    // Sync with time range store if enabled
    if (timeRangeStore) {
      timeRangeStore.setRefreshInterval(newInterval)
    }

    // Reschedule if active
    if (isActive.value && !isPaused.value) {
      scheduleRefresh()
    }
  }

  /**
   * Reset retry count
   */
  const resetRetries = () => {
    retryCount.value = 0
  }

  // Watch time range store realtime mode
  if (timeRangeStore) {
    const { isRealtime, refreshInterval: storeInterval, isPaused: storePaused } = storeToRefs(timeRangeStore)

    watch(isRealtime, (newValue) => {
      if (newValue && !isActive.value) {
        start()
      } else if (!newValue && isActive.value) {
        stop()
      }
    })

    watch(storeInterval, (newValue) => {
      if (newValue !== interval.value) {
        setInterval(newValue)
      }
    })

    watch(storePaused, (newValue) => {
      if (newValue && !isPaused.value) {
        pause()
      } else if (!newValue && isPaused.value) {
        resume()
      }
    })
  }

  // Page visibility handling
  if (pauseOnHidden) {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActive.value && !isPaused.value) {
          pause()
        }
      } else {
        if (isActive.value && isPaused.value) {
          resume()
        }
      }
    }

    onMounted(() => {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
  }

  // Auto-start if immediate
  if (immediate) {
    onMounted(() => {
      start()
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    // State
    isActive: computed(() => isActive.value),
    isPaused: computed(() => isPaused.value),
    isRefreshing: computed(() => isRefreshing.value),
    interval: computed(() => interval.value),
    lastRefreshTime: computed(() => lastRefreshTime.value),
    nextRefreshTime: computed(() => nextRefreshTime.value),
    timeUntilNextRefresh,
    timeSinceLastRefresh,
    error: computed(() => error.value),
    retryCount: computed(() => retryCount.value),

    // Actions
    start,
    stop,
    pause,
    resume,
    togglePause,
    refresh,
    setInterval,
    resetRetries
  }
}

/**
 * Get current realtime state from time range store
 */
export function getRealtimeState() {
  const timeRangeStore = useTimeRangeStore()
  const { isRealtime, refreshInterval, isPaused } = storeToRefs(timeRangeStore)

  return {
    isRealtime: isRealtime.value,
    refreshInterval: refreshInterval.value,
    isPaused: isPaused.value
  }
}

/**
 * Set realtime mode in time range store
 */
export function setRealtimeMode(enabled: boolean) {
  const timeRangeStore = useTimeRangeStore()
  const { isRealtime } = storeToRefs(timeRangeStore)

  if (enabled && !isRealtime.value) {
    timeRangeStore.toggleRealtime()
  } else if (!enabled && isRealtime.value) {
    timeRangeStore.toggleRealtime()
  }
}

/**
 * Set refresh interval in time range store
 */
export function setGlobalRefreshInterval(interval: number) {
  const timeRangeStore = useTimeRangeStore()
  timeRangeStore.setRefreshInterval(interval)
}
