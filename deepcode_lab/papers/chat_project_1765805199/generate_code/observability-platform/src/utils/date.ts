/**
 * Date and Time Utilities
 * 
 * Comprehensive date/time manipulation utilities for the observability platform,
 * including time range calculations, timezone handling, date formatting, and
 * time-based aggregation helpers.
 */

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { TimeRange, QuickTimeRange } from '@/types';
import type { TimeInterval } from '@/types/logs';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/**
 * Time range preset definitions (in milliseconds)
 */
export const TIME_RANGE_PRESETS: Record<QuickTimeRange, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'custom': 0,
};

/**
 * Time interval definitions (in milliseconds)
 */
export const TIME_INTERVALS: Record<TimeInterval, number> = {
  '1s': 1000,
  '5s': 5000,
  '10s': 10000,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '30m': 1800000,
  '1h': 3600000,
  '6h': 21600000,
  '24h': 86400000,
};

/**
 * Creates a TimeRange object from a quick time range preset
 */
export function getTimeRangeFromPreset(preset: QuickTimeRange): TimeRange {
  if (preset === 'custom') {
    return {
      start: Date.now() - TIME_RANGE_PRESETS['15m'],
      end: Date.now(),
      label: 'Custom',
    };
  }

  const duration = TIME_RANGE_PRESETS[preset];
  const end = Date.now();
  const start = end - duration;

  return {
    start,
    end,
    label: preset,
  };
}

/**
 * Creates a custom TimeRange object
 */
export function createTimeRange(
  start: number | Date | Dayjs,
  end: number | Date | Dayjs,
  label?: string
): TimeRange {
  return {
    start: dayjs(start).valueOf(),
    end: dayjs(end).valueOf(),
    label,
  };
}

/**
 * Gets the current time range for "now" mode (last N minutes)
 */
export function getNowTimeRange(durationMs: number): TimeRange {
  const end = Date.now();
  const start = end - durationMs;
  return { start, end, label: 'Now' };
}

/**
 * Shifts a time range forward or backward
 */
export function shiftTimeRange(
  timeRange: TimeRange,
  direction: 'forward' | 'backward'
): TimeRange {
  const duration = timeRange.end - timeRange.start;
  const shift = direction === 'forward' ? duration : -duration;

  return {
    start: timeRange.start + shift,
    end: timeRange.end + shift,
    label: timeRange.label,
  };
}

/**
 * Zooms in or out on a time range
 */
export function zoomTimeRange(
  timeRange: TimeRange,
  factor: number
): TimeRange {
  const duration = timeRange.end - timeRange.start;
  const center = timeRange.start + duration / 2;
  const newDuration = duration * factor;

  return {
    start: Math.round(center - newDuration / 2),
    end: Math.round(center + newDuration / 2),
    label: timeRange.label,
  };
}

/**
 * Checks if a timestamp is within a time range
 */
export function isInTimeRange(
  timestamp: number,
  timeRange: TimeRange
): boolean {
  return timestamp >= timeRange.start && timestamp <= timeRange.end;
}

/**
 * Gets the duration of a time range in milliseconds
 */
export function getTimeRangeDuration(timeRange: TimeRange): number {
  return timeRange.end - timeRange.start;
}

/**
 * Formats a time range as a human-readable string
 */
export function formatTimeRangeLabel(timeRange: TimeRange): string {
  if (timeRange.label && timeRange.label !== 'custom') {
    return timeRange.label;
  }

  const duration = getTimeRangeDuration(timeRange);
  const start = dayjs(timeRange.start);
  const end = dayjs(timeRange.end);

  // If less than 24 hours, show time
  if (duration < 24 * 60 * 60 * 1000) {
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
  }

  // If less than 7 days, show date and time
  if (duration < 7 * 24 * 60 * 60 * 1000) {
    return `${start.format('MMM D HH:mm')} - ${end.format('MMM D HH:mm')}`;
  }

  // Otherwise, show full date
  return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
}

/**
 * Calculates optimal data point interval based on time range
 * Aims for ~200 data points for optimal chart rendering
 */
export function getOptimalInterval(
  startTime: number,
  endTime: number
): number {
  const duration = endTime - startTime;
  const targetPoints = 200;
  const interval = Math.ceil(duration / targetPoints);

  // Round to nearest standard interval
  if (interval <= 1000) return 1000; // 1s
  if (interval <= 5000) return 5000; // 5s
  if (interval <= 10000) return 10000; // 10s
  if (interval <= 30000) return 30000; // 30s
  if (interval <= 60000) return 60000; // 1m
  if (interval <= 300000) return 300000; // 5m
  if (interval <= 900000) return 900000; // 15m
  if (interval <= 1800000) return 1800000; // 30m
  if (interval <= 3600000) return 3600000; // 1h
  if (interval <= 21600000) return 21600000; // 6h
  return 86400000; // 24h
}

/**
 * Generates time buckets for aggregation
 */
export function generateTimeBuckets(
  startTime: number,
  endTime: number,
  interval: number
): number[] {
  const buckets: number[] = [];
  let current = Math.floor(startTime / interval) * interval;

  while (current <= endTime) {
    buckets.push(current);
    current += interval;
  }

  return buckets;
}

/**
 * Rounds timestamp to nearest interval
 */
export function roundToInterval(timestamp: number, interval: number): number {
  return Math.floor(timestamp / interval) * interval;
}

/**
 * Formats a timestamp with various format options
 */
export function formatDate(
  timestamp: number | Date | Dayjs,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  return dayjs(timestamp).format(format);
}

/**
 * Formats a timestamp as ISO 8601 string
 */
export function toISOString(timestamp: number | Date | Dayjs): string {
  return dayjs(timestamp).toISOString();
}

/**
 * Parses various date formats to timestamp
 */
export function parseDate(
  date: string | number | Date | Dayjs
): number {
  return dayjs(date).valueOf();
}

/**
 * Gets relative time string (e.g., "2 minutes ago")
 */
export function getRelativeTime(timestamp: number | Date | Dayjs): string {
  return dayjs(timestamp).fromNow();
}

/**
 * Gets time difference in human-readable format
 */
export function getTimeDiff(
  start: number | Date | Dayjs,
  end: number | Date | Dayjs
): string {
  const duration = dayjs.duration(dayjs(end).diff(dayjs(start)));
  
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Checks if a date is today
 */
export function isToday(timestamp: number | Date | Dayjs): boolean {
  return dayjs(timestamp).isSame(dayjs(), 'day');
}

/**
 * Checks if a date is yesterday
 */
export function isYesterday(timestamp: number | Date | Dayjs): boolean {
  return dayjs(timestamp).isSame(dayjs().subtract(1, 'day'), 'day');
}

/**
 * Gets start of day timestamp
 */
export function getStartOfDay(timestamp?: number | Date | Dayjs): number {
  return dayjs(timestamp).startOf('day').valueOf();
}

/**
 * Gets end of day timestamp
 */
export function getEndOfDay(timestamp?: number | Date | Dayjs): number {
  return dayjs(timestamp).endOf('day').valueOf();
}

/**
 * Gets start of week timestamp
 */
export function getStartOfWeek(timestamp?: number | Date | Dayjs): number {
  return dayjs(timestamp).startOf('week').valueOf();
}

/**
 * Gets end of week timestamp
 */
export function getEndOfWeek(timestamp?: number | Date | Dayjs): number {
  return dayjs(timestamp).endOf('week').valueOf();
}

/**
 * Gets start of month timestamp
 */
export function getStartOfMonth(timestamp?: number | Date | Dayjs): number {
  return dayjs(timestamp).startOf('month').valueOf();
}

/**
 * Gets end of month timestamp
 */
export function getEndOfMonth(timestamp?: number | Date | Dayjs): number {
  return dayjs(timestamp).endOf('month').valueOf();
}

/**
 * Adds time to a timestamp
 */
export function addTime(
  timestamp: number | Date | Dayjs,
  amount: number,
  unit: 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y'
): number {
  const unitMap: Record<string, any> = {
    'ms': 'millisecond',
    's': 'second',
    'm': 'minute',
    'h': 'hour',
    'd': 'day',
    'w': 'week',
    'M': 'month',
    'y': 'year',
  };

  return dayjs(timestamp).add(amount, unitMap[unit]).valueOf();
}

/**
 * Subtracts time from a timestamp
 */
export function subtractTime(
  timestamp: number | Date | Dayjs,
  amount: number,
  unit: 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y'
): number {
  const unitMap: Record<string, any> = {
    'ms': 'millisecond',
    's': 'second',
    'm': 'minute',
    'h': 'hour',
    'd': 'day',
    'w': 'week',
    'M': 'month',
    'y': 'year',
  };

  return dayjs(timestamp).subtract(amount, unitMap[unit]).valueOf();
}

/**
 * Gets timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Converts timestamp to specific timezone
 */
export function toTimezone(
  timestamp: number | Date | Dayjs,
  timezone: string
): Dayjs {
  return dayjs(timestamp).tz(timezone);
}

/**
 * Gets current timezone name
 */
export function getCurrentTimezone(): string {
  return dayjs.tz.guess();
}

/**
 * Formats duration in milliseconds to human-readable string
 */
export function formatDurationMs(ms: number): string {
  const duration = dayjs.duration(ms);
  
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  if (ms < 60000) {
    return `${duration.seconds()}s`;
  }
  
  if (ms < 3600000) {
    return `${duration.minutes()}m ${duration.seconds()}s`;
  }
  
  if (ms < 86400000) {
    return `${duration.hours()}h ${duration.minutes()}m`;
  }
  
  return `${duration.days()}d ${duration.hours()}h`;
}

/**
 * Validates if a string is a valid date
 */
export function isValidDate(date: string): boolean {
  return dayjs(date).isValid();
}

/**
 * Gets the number of days between two dates
 */
export function getDaysBetween(
  start: number | Date | Dayjs,
  end: number | Date | Dayjs
): number {
  return dayjs(end).diff(dayjs(start), 'day');
}

/**
 * Gets the number of hours between two dates
 */
export function getHoursBetween(
  start: number | Date | Dayjs,
  end: number | Date | Dayjs
): number {
  return dayjs(end).diff(dayjs(start), 'hour');
}

/**
 * Gets the number of minutes between two dates
 */
export function getMinutesBetween(
  start: number | Date | Dayjs,
  end: number | Date | Dayjs
): number {
  return dayjs(end).diff(dayjs(start), 'minute');
}

/**
 * Formats time range for chart axis labels
 */
export function formatAxisLabel(
  timestamp: number,
  timeRange: TimeRange
): string {
  const duration = getTimeRangeDuration(timeRange);
  const date = dayjs(timestamp);

  // Less than 1 hour: show time with seconds
  if (duration < 60 * 60 * 1000) {
    return date.format('HH:mm:ss');
  }

  // Less than 24 hours: show time
  if (duration < 24 * 60 * 60 * 1000) {
    return date.format('HH:mm');
  }

  // Less than 7 days: show date and time
  if (duration < 7 * 24 * 60 * 60 * 1000) {
    return date.format('MM/DD HH:mm');
  }

  // Otherwise: show date
  return date.format('MM/DD');
}

/**
 * Gets time range for common presets
 */
export function getCommonTimeRanges(): Array<{
  label: string;
  value: QuickTimeRange;
  range: TimeRange;
}> {
  return [
    { label: 'Last 5 minutes', value: '5m', range: getTimeRangeFromPreset('5m') },
    { label: 'Last 15 minutes', value: '15m', range: getTimeRangeFromPreset('15m') },
    { label: 'Last 30 minutes', value: '30m', range: getTimeRangeFromPreset('30m') },
    { label: 'Last 1 hour', value: '1h', range: getTimeRangeFromPreset('1h') },
    { label: 'Last 3 hours', value: '3h', range: getTimeRangeFromPreset('3h') },
    { label: 'Last 6 hours', value: '6h', range: getTimeRangeFromPreset('6h') },
    { label: 'Last 12 hours', value: '12h', range: getTimeRangeFromPreset('12h') },
    { label: 'Last 24 hours', value: '24h', range: getTimeRangeFromPreset('24h') },
    { label: 'Last 7 days', value: '7d', range: getTimeRangeFromPreset('7d') },
    { label: 'Last 30 days', value: '30d', range: getTimeRangeFromPreset('30d') },
  ];
}

/**
 * Checks if two time ranges overlap
 */
export function timeRangesOverlap(
  range1: TimeRange,
  range2: TimeRange
): boolean {
  return range1.start <= range2.end && range2.start <= range1.end;
}

/**
 * Merges overlapping time ranges
 */
export function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: TimeRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Splits a time range into equal intervals
 */
export function splitTimeRange(
  timeRange: TimeRange,
  count: number
): TimeRange[] {
  const duration = getTimeRangeDuration(timeRange);
  const intervalDuration = duration / count;
  const ranges: TimeRange[] = [];

  for (let i = 0; i < count; i++) {
    ranges.push({
      start: Math.round(timeRange.start + i * intervalDuration),
      end: Math.round(timeRange.start + (i + 1) * intervalDuration),
    });
  }

  return ranges;
}

export default {
  TIME_RANGE_PRESETS,
  TIME_INTERVALS,
  getTimeRangeFromPreset,
  createTimeRange,
  getNowTimeRange,
  shiftTimeRange,
  zoomTimeRange,
  isInTimeRange,
  getTimeRangeDuration,
  formatTimeRangeLabel,
  getOptimalInterval,
  generateTimeBuckets,
  roundToInterval,
  formatDate,
  toISOString,
  parseDate,
  getRelativeTime,
  getTimeDiff,
  isToday,
  isYesterday,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  addTime,
  subtractTime,
  getTimezoneOffset,
  toTimezone,
  getCurrentTimezone,
  formatDurationMs,
  isValidDate,
  getDaysBetween,
  getHoursBetween,
  getMinutesBetween,
  formatAxisLabel,
  getCommonTimeRanges,
  timeRangesOverlap,
  mergeTimeRanges,
  splitTimeRange,
};
