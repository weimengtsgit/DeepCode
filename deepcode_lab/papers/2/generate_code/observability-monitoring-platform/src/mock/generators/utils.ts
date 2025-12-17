/**
 * Utility functions for mock data generation
 * Provides random number generation, UUID generation, and statistical distributions
 * Used by: timeSeriesGenerator, traceGenerator, logGenerator, alertGenerator
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 string
 * @returns UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random integer in range [min, max]
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns Random float in range [min, max)
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Clamp a value to a range
 * @param value Value to clamp
 * @param min Minimum bound (inclusive)
 * @param max Maximum bound (inclusive)
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a random value from a Gaussian (normal) distribution
 * Uses Box-Muller transform for proper distribution
 * @param mu Mean (default: 0)
 * @param sigma Standard deviation (default: 1)
 * @returns Random value from N(mu, sigma^2)
 */
export function gaussian(mu: number = 0, sigma: number = 1): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  
  // Avoid log(0)
  const u1Safe = u1 === 0 ? 1e-10 : u1;
  
  const z = Math.sqrt(-2 * Math.log(u1Safe)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}

/**
 * Generate a random value from an exponential distribution
 * Useful for modeling latencies, inter-arrival times, etc.
 * @param min Minimum value (shift parameter)
 * @param max Maximum value (upper bound)
 * @returns Random value from exponential distribution in range [min, max]
 */
export function exponentialRandom(min: number, max: number): number {
  // Standard exponential: -ln(U) where U ~ Uniform(0,1)
  const u = Math.random();
  const uSafe = u === 0 ? 1e-10 : u;
  
  // Scale to [0, 1] range
  const exp = Math.exp(-5 * uSafe);
  
  // Map to [min, max] range
  return min + exp * (max - min);
}

/**
 * Generate a random value from a Poisson distribution
 * Useful for modeling event counts, inter-arrival times
 * Uses Knuth's algorithm
 * @param lambda Rate parameter (mean = lambda)
 * @returns Random value from Poisson(lambda)
 */
export function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  
  return k - 1;
}

/**
 * Calculate the average of an array of numbers
 * @param values Array of numbers
 * @returns Average value
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate the standard deviation of an array of numbers
 * @param values Array of numbers
 * @returns Standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = average(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = average(squaredDiffs);
  
  return Math.sqrt(variance);
}

/**
 * Calculate the percentile of an array of numbers
 * @param values Array of numbers
 * @param percentile Percentile to calculate (0-100)
 * @returns Value at the given percentile
 */
export function percentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  
  return sorted[Math.max(0, index)];
}

/**
 * Select a random element from an array
 * @param array Array to select from
 * @returns Random element from array
 */
export function selectRandom<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Select multiple random elements from an array without replacement
 * @param array Array to select from
 * @param count Number of elements to select
 * @returns Array of random elements
 */
export function selectRandomMultiple<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Shuffle an array in-place using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns Shuffled array (same reference)
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generate a random string of specified length
 * @param length Length of string to generate
 * @param charset Character set to use (default: alphanumeric)
 * @returns Random string
 */
export function randomString(
  length: number,
  charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Generate a random hex color string
 * @returns Hex color string (e.g., "#a1b2c3")
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Add a random offset to a date
 * @param date Base date
 * @param minMs Minimum offset in milliseconds
 * @param maxMs Maximum offset in milliseconds
 * @returns New date with random offset applied
 */
export function randomDateOffset(date: Date, minMs: number, maxMs: number): Date {
  const offset = randomInt(minMs, maxMs);
  return new Date(date.getTime() + offset);
}

/**
 * Calculate time difference in milliseconds
 * @param start Start date
 * @param end End date
 * @returns Difference in milliseconds
 */
export function timeDiffMs(start: Date, end: Date): number {
  return end.getTime() - start.getTime();
}

/**
 * Calculate time difference in seconds
 * @param start Start date
 * @param end End date
 * @returns Difference in seconds
 */
export function timeDiffSeconds(start: Date, end: Date): number {
  return Math.floor(timeDiffMs(start, end) / 1000);
}

/**
 * Calculate time difference in minutes
 * @param start Start date
 * @param end End date
 * @returns Difference in minutes
 */
export function timeDiffMinutes(start: Date, end: Date): number {
  return Math.floor(timeDiffSeconds(start, end) / 60);
}

/**
 * Calculate time difference in hours
 * @param start Start date
 * @param end End date
 * @returns Difference in hours
 */
export function timeDiffHours(start: Date, end: Date): number {
  return Math.floor(timeDiffMinutes(start, end) / 60);
}

/**
 * Calculate time difference in days
 * @param start Start date
 * @param end End date
 * @returns Difference in days
 */
export function timeDiffDays(start: Date, end: Date): number {
  return Math.floor(timeDiffHours(start, end) / 24);
}

/**
 * Check if a time falls within business hours
 * @param date Date to check
 * @param startHour Start hour (0-23, UTC)
 * @param endHour End hour (0-23, UTC)
 * @returns True if within business hours
 */
export function isBusinessHour(date: Date, startHour: number = 9, endHour: number = 17): boolean {
  const hour = date.getUTCHours();
  return hour >= startHour && hour < endHour;
}

/**
 * Check if a date is a weekend
 * @param date Date to check
 * @returns True if Saturday or Sunday
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Get the hour of day (0-23) in UTC
 * @param date Date to check
 * @returns Hour (0-23)
 */
export function getHourUTC(date: Date): number {
  return date.getUTCHours();
}

/**
 * Get the day of week (0-6) in UTC
 * @param date Date to check
 * @returns Day of week (0=Sunday, 6=Saturday)
 */
export function getDayOfWeekUTC(date: Date): number {
  return date.getUTCDay();
}

/**
 * Format a date as ISO string
 * @param date Date to format
 * @returns ISO string (e.g., "2024-01-15T14:30:45.000Z")
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * Format a date as a simple string
 * @param date Date to format
 * @returns Formatted string (e.g., "2024-01-15 14:30:45")
 */
export function formatDateSimple(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Create a date from components
 * @param year Year
 * @param month Month (1-12)
 * @param day Day (1-31)
 * @param hour Hour (0-23, UTC)
 * @param minute Minute (0-59)
 * @param second Second (0-59)
 * @returns Date object
 */
export function createDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

/**
 * Add milliseconds to a date
 * @param date Base date
 * @param ms Milliseconds to add
 * @returns New date
 */
export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

/**
 * Add seconds to a date
 * @param date Base date
 * @param seconds Seconds to add
 * @returns New date
 */
export function addSeconds(date: Date, seconds: number): Date {
  return addMs(date, seconds * 1000);
}

/**
 * Add minutes to a date
 * @param date Base date
 * @param minutes Minutes to add
 * @returns New date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return addSeconds(date, minutes * 60);
}

/**
 * Add hours to a date
 * @param date Base date
 * @param hours Hours to add
 * @returns New date
 */
export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

/**
 * Add days to a date
 * @param date Base date
 * @param days Days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}

/**
 * Get the start of day (00:00:00 UTC)
 * @param date Date to process
 * @returns Date at start of day
 */
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
  ));
}

/**
 * Get the end of day (23:59:59.999 UTC)
 * @param date Date to process
 * @returns Date at end of day
 */
export function endOfDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999
  ));
}

/**
 * Round a date to the nearest minute
 * @param date Date to round
 * @param intervalMinutes Rounding interval in minutes (default: 1)
 * @returns Rounded date
 */
export function roundToMinute(date: Date, intervalMinutes: number = 1): Date {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/**
 * Round a date to the nearest hour
 * @param date Date to round
 * @returns Rounded date
 */
export function roundToHour(date: Date): Date {
  return roundToMinute(date, 60);
}

/**
 * Generate a range of dates
 * @param start Start date
 * @param end End date
 * @param intervalMs Interval in milliseconds
 * @returns Array of dates
 */
export function dateRange(start: Date, end: Date, intervalMs: number): Date[] {
  const dates: Date[] = [];
  let current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current = addMs(current, intervalMs);
  }
  
  return dates;
}

/**
 * Interpolate between two numbers
 * @param start Start value
 * @param end End value
 * @param t Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Ease-in-out cubic interpolation
 * @param t Interpolation factor (0-1)
 * @returns Eased value (0-1)
 */
export function easeInOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Ease-out cubic interpolation
 * @param t Interpolation factor (0-1)
 * @returns Eased value (0-1)
 */
export function easeOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Ease-in cubic interpolation
 * @param t Interpolation factor (0-1)
 * @returns Eased value (0-1)
 */
export function easeInCubic(t: number): number {
  const clamped = clamp(t, 0, 1);
  return clamped * clamped * clamped;
}
