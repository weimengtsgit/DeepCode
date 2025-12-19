import { watch, onMounted, onUnmounted } from 'vue';
import { useTimeRange } from './useTimeRange';
import { useDataStore } from '@/stores/dataStore';

/**
 * Composable to orchestrate data fetching based on the global time range.
 * It automatically triggers fetches when time changes and handles auto-refresh intervals.
 */
export function useMockData() {
  const { startTime, endTime, refreshInterval, setQuickRange, QUICK_RANGES } = useTimeRange();
  const dataStore = useDataStore();
  let timer: any = null;

  /**
   * Triggers a refresh of all core data (metrics, traces).
   * Note: Logs are usually fetched on-demand or separate view, but we could add them here if needed.
   * For the dashboard, we primarily need metrics and recent traces.
   */
  const refresh = async () => {
    // We update the window if it's a "live" dashboard feel, 
    // but here we just respect the current startTime/endTime from the store.
    // If the user picked "Last 15m", useTimeRange set specific dates. 
    // To keep it "live", one would typically re-apply the "Last 15m" logic.
    // However, simplest implementation is to just fetch what is currently in state.
    
    await Promise.all([
      dataStore.fetchMetrics(startTime.value, endTime.value),
      dataStore.fetchTraces(startTime.value, endTime.value)
    ]);
  };

  /**
   * Starts the auto-refresh timer.
   * If we wanted to strictly follow "Last X minutes", we might want to update the time range here too.
   * For this demo, we'll assume the time range is fixed until user changes it, 
   * OR we could re-assert the "Last X" if we knew which one was selected.
   * 
   * Given the scope, we will just refetch data for the current window.
   */
  const startAutoRefresh = () => {
    stopAutoRefresh();
    if (refreshInterval.value > 0) {
      timer = setInterval(() => {
        refresh();
      }, refreshInterval.value * 1000);
    }
  };

  const stopAutoRefresh = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  // Watch for time range changes to trigger immediate fetch
  watch([startTime, endTime], () => {
    refresh();
  });

  // Watch for interval changes to reset timer
  watch(refreshInterval, () => {
    startAutoRefresh();
  });

  // Lifecycle hooks
  onMounted(() => {
    // Initial fetch
    refresh();
    startAutoRefresh();
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    refresh
  };
}
