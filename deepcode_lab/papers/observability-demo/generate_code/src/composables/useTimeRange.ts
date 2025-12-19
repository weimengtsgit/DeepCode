import { ref, computed } from 'vue';
import dayjs from 'dayjs';

/**
 * Global Time Range State (Singleton)
 * Shared across the header (TimeControls) and all views (Dashboard, Metrics, Tracing, Logs)
 */

// Default to Last 15 minutes
const now = new Date();
const endTime = ref<Date>(now);
const startTime = ref<Date>(dayjs(now).subtract(15, 'minute').toDate());

// Refresh rate in seconds (0 = off)
const refreshInterval = ref<number>(0);

// Quick ranges for the UI
export const QUICK_RANGES = [
  { label: 'Last 5m', value: 5 },
  { label: 'Last 15m', value: 15 },
  { label: 'Last 30m', value: 30 },
  { label: 'Last 1h', value: 60 },
  { label: 'Last 3h', value: 180 },
  { label: 'Last 6h', value: 360 },
  { label: 'Last 12h', value: 720 },
  { label: 'Last 24h', value: 1440 },
  { label: 'Last 2d', value: 2880 },
  { label: 'Last 7d', value: 10080 },
];

export function useTimeRange() {
  /**
   * Updates the global time range
   */
  const setTimeRange = (start: Date, end: Date) => {
    startTime.value = start;
    endTime.value = end;
  };

  /**
   * Sets the time range to "Last X minutes" relative to now
   */
  const setQuickRange = (minutes: number) => {
    const end = new Date();
    const start = dayjs(end).subtract(minutes, 'minute').toDate();
    setTimeRange(start, end);
  };

  /**
   * Human readable duration string
   */
  const formattedDuration = computed(() => {
    const diffMinutes = dayjs(endTime.value).diff(dayjs(startTime.value), 'minute');
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else if (diffMinutes < 1440) { // < 24 hours
      const hours = (diffMinutes / 60).toFixed(1);
      return `${hours.endsWith('.0') ? parseInt(hours) : hours} hours`;
    } else {
      const days = (diffMinutes / 1440).toFixed(1);
      return `${days.endsWith('.0') ? parseInt(days) : days} days`;
    }
  });

  return {
    startTime,
    endTime,
    refreshInterval,
    setTimeRange,
    setQuickRange,
    formattedDuration,
    QUICK_RANGES
  };
}
