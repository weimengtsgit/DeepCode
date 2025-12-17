/**
 * Time Range Management Composable
 * 
 * Provides reactive time range state management with:
 * - Quick preset selection (5m, 15m, 30m, 1h, 3h, 6h, 12h, 24h, 7d, 30d)
 * - Custom time range selection
 * - Real-time mode with auto-refresh
 * - Time range shifting (forward/backward)
 * - Time range zooming (in/out)
 * - Integration with Pinia store for global state
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useTimeRangeStore } from '@/stores/timeRange';
import type { TimeRange, QuickTimeRange } from '@/types';
import {
  getTimeRangeFromPreset,
  createTimeRange,
  getNowTimeRange,
  shiftTimeRange,
  zoomTimeRange,
  getTimeRangeDuration,
  formatTimeRangeLabel,
  getCommonTimeRanges,
  TIME_RANGE_PRESETS
} from '@/utils/date';

/**
 * Time range composable configuration
 */
export interface UseTimeRangeOptions {
  /**
   * Initial time range preset (default: '15m')
   */
  initialPreset?: QuickTimeRange;
  
  /**
   * Enable real-time mode by default
   */
  enableRealtime?: boolean;
  
  /**
   * Auto-refresh interval in milliseconds (default: 30000 = 30s)
   */
  refreshInterval?: number;
  
  /**
   * Use global store for state persistence
   */
  useStore?: boolean;
  
  /**
   * Callback when time range changes
   */
  onChange?: (timeRange: TimeRange) => void;
}

/**
 * Time range management composable
 */
export function useTimeRange(options: UseTimeRangeOptions = {}) {
  const {
    initialPreset = '15m',
    enableRealtime = false,
    refreshInterval = 30000,
    useStore = true,
    onChange
  } = options;

  // Store integration
  const store = useStore ? useTimeRangeStore() : null;
  const storeRefs = store ? storeToRefs(store) : null;

  // Local state (used when store is disabled)
  const localTimeRange = ref<TimeRange>(getTimeRangeFromPreset(initialPreset));
  const localPreset = ref<QuickTimeRange>(initialPreset);
  const localIsRealtime = ref(enableRealtime);
  const localRefreshInterval = ref(refreshInterval);

  // Computed refs that use store or local state
  const timeRange = computed<TimeRange>({
    get: () => storeRefs?.timeRange.value || localTimeRange.value,
    set: (value) => {
      if (store) {
        store.setTimeRange(value);
      } else {
        localTimeRange.value = value;
      }
    }
  });

  const currentPreset = computed<QuickTimeRange>({
    get: () => storeRefs?.currentPreset.value || localPreset.value,
    set: (value) => {
      if (store) {
        store.setPreset(value);
      } else {
        localPreset.value = value;
      }
    }
  });

  const isRealtime = computed<boolean>({
    get: () => storeRefs?.isRealtime.value || localIsRealtime.value,
    set: (value) => {
      if (store) {
        store.setRealtime(value);
      } else {
        localIsRealtime.value = value;
      }
    }
  });

  const currentRefreshInterval = computed<number>({
    get: () => storeRefs?.refreshInterval.value || localRefreshInterval.value,
    set: (value) => {
      if (store) {
        store.setRefreshInterval(value);
      } else {
        localRefreshInterval.value = value;
      }
    }
  });

  // Derived state
  const duration = computed(() => getTimeRangeDuration(timeRange.value));
  const label = computed(() => formatTimeRangeLabel(timeRange.value));
  const isCustomRange = computed(() => currentPreset.value === 'custom');

  // Auto-refresh timer
  let refreshTimer: number | null = null;

  /**
   * Set time range from preset
   */
  const setPreset = (preset: QuickTimeRange) => {
    currentPreset.value = preset;
    
    if (preset === 'custom') {
      // Keep current custom range
      return;
    }

    const newRange = getTimeRangeFromPreset(preset);
    timeRange.value = newRange;
    
    onChange?.(newRange);
  };

  /**
   * Set custom time range
   */
  const setCustomRange = (start: number | Date, end: number | Date) => {
    currentPreset.value = 'custom';
    const newRange = createTimeRange(start, end, 'Custom Range');
    timeRange.value = newRange;
    
    onChange?.(newRange);
  };

  /**
   * Shift time range forward or backward
   */
  const shift = (direction: 'forward' | 'backward') => {
    const newRange = shiftTimeRange(timeRange.value, direction);
    timeRange.value = newRange;
    currentPreset.value = 'custom';
    
    onChange?.(newRange);
  };

  /**
   * Zoom time range in or out
   */
  const zoom = (factor: number) => {
    const newRange = zoomTimeRange(timeRange.value, factor);
    timeRange.value = newRange;
    currentPreset.value = 'custom';
    
    onChange?.(newRange);
  };

  /**
   * Refresh time range (update to current time for presets)
   */
  const refresh = () => {
    if (currentPreset.value === 'custom') {
      // For custom ranges, shift to current time
      const duration = getTimeRangeDuration(timeRange.value);
      const newRange = getNowTimeRange(duration);
      timeRange.value = newRange;
    } else {
      // For presets, regenerate from preset
      const newRange = getTimeRangeFromPreset(currentPreset.value);
      timeRange.value = newRange;
    }
    
    onChange?.(timeRange.value);
  };

  /**
   * Enable real-time mode
   */
  const enableRealtimeMode = () => {
    isRealtime.value = true;
    startAutoRefresh();
  };

  /**
   * Disable real-time mode
   */
  const disableRealtimeMode = () => {
    isRealtime.value = false;
    stopAutoRefresh();
  };

  /**
   * Toggle real-time mode
   */
  const toggleRealtime = () => {
    if (isRealtime.value) {
      disableRealtimeMode();
    } else {
      enableRealtimeMode();
    }
  };

  /**
   * Update refresh interval
   */
  const setRefreshInterval = (interval: number) => {
    currentRefreshInterval.value = interval;
    
    if (isRealtime.value) {
      stopAutoRefresh();
      startAutoRefresh();
    }
  };

  /**
   * Start auto-refresh timer
   */
  const startAutoRefresh = () => {
    stopAutoRefresh();
    
    if (currentRefreshInterval.value > 0) {
      refreshTimer = window.setInterval(() => {
        refresh();
      }, currentRefreshInterval.value);
    }
  };

  /**
   * Stop auto-refresh timer
   */
  const stopAutoRefresh = () => {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  /**
   * Get available time range presets
   */
  const getPresets = () => {
    return getCommonTimeRanges();
  };

  /**
   * Check if a preset is currently active
   */
  const isPresetActive = (preset: QuickTimeRange) => {
    return currentPreset.value === preset;
  };

  /**
   * Get preset duration in milliseconds
   */
  const getPresetDuration = (preset: QuickTimeRange) => {
    return TIME_RANGE_PRESETS[preset] || 0;
  };

  /**
   * Reset to initial state
   */
  const reset = () => {
    if (store) {
      store.reset();
    } else {
      localTimeRange.value = getTimeRangeFromPreset(initialPreset);
      localPreset.value = initialPreset;
      localIsRealtime.value = enableRealtime;
      localRefreshInterval.value = refreshInterval;
    }
    
    onChange?.(timeRange.value);
  };

  // Watch for realtime mode changes
  watch(isRealtime, (newValue) => {
    if (newValue) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });

  // Lifecycle hooks
  onMounted(() => {
    if (isRealtime.value) {
      startAutoRefresh();
    }
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    // State
    timeRange: computed(() => timeRange.value),
    currentPreset: computed(() => currentPreset.value),
    isRealtime: computed(() => isRealtime.value),
    refreshInterval: computed(() => currentRefreshInterval.value),
    
    // Derived state
    duration,
    label,
    isCustomRange,
    
    // Actions
    setPreset,
    setCustomRange,
    shift,
    zoom,
    refresh,
    enableRealtimeMode,
    disableRealtimeMode,
    toggleRealtime,
    setRefreshInterval,
    reset,
    
    // Utilities
    getPresets,
    isPresetActive,
    getPresetDuration
  };
}

/**
 * Standalone function to get current time range from store
 */
export function getCurrentTimeRange(): TimeRange {
  const store = useTimeRangeStore();
  return store.timeRange;
}

/**
 * Standalone function to set time range in store
 */
export function setGlobalTimeRange(timeRange: TimeRange): void {
  const store = useTimeRangeStore();
  store.setTimeRange(timeRange);
}

/**
 * Standalone function to set preset in store
 */
export function setGlobalPreset(preset: QuickTimeRange): void {
  const store = useTimeRangeStore();
  store.setPreset(preset);
}
