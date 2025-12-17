import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue'
import { useTimeStore } from '@/stores/timeStore'

/**
 * Composable for managing real-time data refresh functionality
 * Handles automatic data updates at configurable intervals when real-time mode is enabled
 */
export function useRealtime() {
  const timeStore = useTimeStore()
  
  const isRefreshing = ref(false)
  const lastRefreshTime = ref<Date | null>(null)
  const refreshCount = ref(0)
  let refreshInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Computed property: Check if real-time mode is active
   */
  const isRealtimeActive = computed(() => timeStore.isRealTime)

  /**
   * Computed property: Time since last refresh in seconds
   */
  const timeSinceLastRefresh = computed(() => {
    if (!lastRefreshTime.value) return 0
    return Math.floor((Date.now() - lastRefreshTime.value.getTime()) / 1000)
  })

  /**
   * Computed property: Next refresh countdown in seconds
   */
  const nextRefreshIn = computed(() => {
    const interval = timeStore.refreshInterval
    return Math.max(0, interval - timeSinceLastRefresh.value)
  })

  /**
   * Start real-time refresh interval
   * @param callback Function to call on each refresh
   */
  const startRefresh = (callback: () => Promise<void> | void) => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    const intervalMs = timeStore.refreshInterval * 1000

    refreshInterval = setInterval(async () => {
      isRefreshing.value = true
      try {
        await callback()
        lastRefreshTime.value = new Date()
        refreshCount.value++
      } catch (error) {
        console.error('Real-time refresh error:', error)
      } finally {
        isRefreshing.value = false
      }
    }, intervalMs)
  }

  /**
   * Stop real-time refresh interval
   */
  const stopRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  /**
   * Trigger immediate refresh
   */
  const triggerRefresh = async (callback: () => Promise<void> | void) => {
    isRefreshing.value = true
    try {
      await callback()
      lastRefreshTime.value = new Date()
      refreshCount.value++
    } catch (error) {
      console.error('Manual refresh error:', error)
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Reset refresh statistics
   */
  const resetStats = () => {
    lastRefreshTime.value = null
    refreshCount.value = 0
  }

  /**
   * Watch for real-time mode changes and manage interval accordingly
   */
  const setupRealtimeWatcher = (callback: () => Promise<void> | void) => {
    watch(
      () => timeStore.isRealTime,
      (isActive) => {
        if (isActive) {
          startRefresh(callback)
        } else {
          stopRefresh()
        }
      }
    )

    // Also watch refresh interval changes
    watch(
      () => timeStore.refreshInterval,
      () => {
        if (timeStore.isRealTime) {
          stopRefresh()
          startRefresh(callback)
        }
      }
    )

    // Cleanup on unmount
    onUnmounted(() => {
      stopRefresh()
    })
  }

  return {
    // State
    isRefreshing,
    lastRefreshTime,
    refreshCount,

    // Computed
    isRealtimeActive,
    timeSinceLastRefresh,
    nextRefreshIn,

    // Methods
    startRefresh,
    stopRefresh,
    triggerRefresh,
    resetStats,
    setupRealtimeWatcher,
  }
}

/**
 * Composable for managing data refresh with debouncing
 * Prevents excessive API calls when multiple filters change rapidly
 */
export function useRefreshDebounce(delayMs: number = 500) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const isPending = ref(false)

  /**
   * Debounced refresh function
   */
  const debouncedRefresh = (callback: () => Promise<void> | void) => {
    isPending.value = true

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(async () => {
      try {
        await callback()
      } finally {
        isPending.value = false
      }
    }, delayMs)
  }

  /**
   * Cancel pending refresh
   */
  const cancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
      isPending.value = false
    }
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    cancel()
  })

  return {
    isPending,
    debouncedRefresh,
    cancel,
  }
}

/**
 * Composable for managing data refresh with throttling
 * Ensures minimum time between refresh calls
 */
export function useRefreshThrottle(minIntervalMs: number = 1000) {
  let lastRefreshTime = 0
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  const isThrottled = ref(false)

  /**
   * Throttled refresh function
   */
  const throttledRefresh = (callback: () => Promise<void> | void) => {
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTime

    if (timeSinceLastRefresh >= minIntervalMs) {
      // Enough time has passed, execute immediately
      lastRefreshTime = now
      callback()
    } else {
      // Schedule for later
      isThrottled.value = true
      const delay = minIntervalMs - timeSinceLastRefresh

      if (pendingTimer) {
        clearTimeout(pendingTimer)
      }

      pendingTimer = setTimeout(() => {
        lastRefreshTime = Date.now()
        callback()
        isThrottled.value = false
      }, delay)
    }
  }

  /**
   * Reset throttle state
   */
  const reset = () => {
    lastRefreshTime = 0
    isThrottled.value = false
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    reset()
  })

  return {
    isThrottled,
    throttledRefresh,
    reset,
  }
}
