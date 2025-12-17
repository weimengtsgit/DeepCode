/**
 * Color Palette Utilities
 * Provides centralized color definitions and utilities for the dark theme
 * Used by chart components, UI components, and theme configuration
 */

/**
 * Dark Theme Color Palette
 * Primary color scheme for the observability monitoring platform
 */
export const DARK_THEME_COLORS = {
  // Backgrounds
  bgPrimary: '#0b0c0e',
  bgSecondary: '#181b1f',
  bgTertiary: '#252a30',
  bgHover: '#2d3139',
  bgActive: '#3a4149',

  // Text
  textPrimary: '#d8d9da',
  textSecondary: '#a8aab0',
  textTertiary: '#7a7d84',
  textDisabled: '#5a5d64',
  textInverse: '#0b0c0e',

  // Borders
  border: '#3a4149',
  borderLight: '#2d3139',
  borderDark: '#4a5159',

  // Status Colors
  success: '#73bf69',
  warning: '#ff9830',
  error: '#f2495c',
  info: '#3274d9',
  critical: '#f2495c',

  // Chart Colors (8-color palette for multi-series)
  chart: [
    '#3274d9', // Blue
    '#73bf69', // Green
    '#ff9830', // Orange
    '#f2495c', // Red
    '#9ac48a', // Light Green
    '#f7cc0d', // Yellow
    '#37b7c3', // Cyan
    '#c44e52', // Dark Red
  ],

  // Semantic Colors
  healthy: '#73bf69',
  degraded: '#ff9830',
  unhealthy: '#f2495c',
  neutral: '#3274d9',

  // Opacity Variants
  transparent: 'transparent',
  overlay: 'rgba(11, 12, 14, 0.8)',
  backdrop: 'rgba(11, 12, 14, 0.5)',
};

/**
 * Light Theme Color Palette (optional future implementation)
 */
export const LIGHT_THEME_COLORS = {
  // Backgrounds
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgTertiary: '#eeeeee',
  bgHover: '#e8e8e8',
  bgActive: '#e0e0e0',

  // Text
  textPrimary: '#212121',
  textSecondary: '#424242',
  textTertiary: '#757575',
  textDisabled: '#bdbdbd',
  textInverse: '#ffffff',

  // Borders
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderDark: '#d0d0d0',

  // Status Colors (same as dark theme)
  success: '#73bf69',
  warning: '#ff9830',
  error: '#f2495c',
  info: '#3274d9',
  critical: '#f2495c',

  // Chart Colors (same as dark theme)
  chart: [
    '#3274d9',
    '#73bf69',
    '#ff9830',
    '#f2495c',
    '#9ac48a',
    '#f7cc0d',
    '#37b7c3',
    '#c44e52',
  ],

  // Semantic Colors
  healthy: '#73bf69',
  degraded: '#ff9830',
  unhealthy: '#f2495c',
  neutral: '#3274d9',

  // Opacity Variants
  transparent: 'transparent',
  overlay: 'rgba(255, 255, 255, 0.8)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

/**
 * Get color palette for theme
 * @param theme - 'dark' or 'light'
 * @returns Color palette object
 */
export function getColorPalette(theme: 'dark' | 'light' = 'dark') {
  return theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
}

/**
 * Get chart color by index with cycling
 * @param index - Color index (cycles through palette)
 * @param theme - 'dark' or 'light'
 * @returns Hex color string
 */
export function getChartColor(index: number, theme: 'dark' | 'light' = 'dark'): string {
  const palette = getColorPalette(theme);
  return palette.chart[index % palette.chart.length];
}

/**
 * Get status color based on health status
 * @param status - 'healthy', 'degraded', 'unhealthy', or 'neutral'
 * @param theme - 'dark' or 'light'
 * @returns Hex color string
 */
export function getStatusColor(
  status: 'healthy' | 'degraded' | 'unhealthy' | 'neutral',
  theme: 'dark' | 'light' = 'dark'
): string {
  const palette = getColorPalette(theme);
  return palette[status];
}

/**
 * Get severity color based on alert/log level
 * @param severity - 'critical', 'error', 'warning', 'info', 'debug'
 * @param theme - 'dark' or 'light'
 * @returns Hex color string
 */
export function getSeverityColor(
  severity: 'critical' | 'error' | 'warning' | 'info' | 'debug',
  theme: 'dark' | 'light' = 'dark'
): string {
  const palette = getColorPalette(theme);
  const severityMap: Record<string, keyof typeof palette> = {
    critical: 'critical',
    error: 'error',
    warning: 'warning',
    info: 'info',
    debug: 'textTertiary',
  };
  return palette[severityMap[severity]];
}

/**
 * Get log level color
 * @param level - 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'
 * @param theme - 'dark' or 'light'
 * @returns Hex color string
 */
export function getLogLevelColor(
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
  theme: 'dark' | 'light' = 'dark'
): string {
  const palette = getColorPalette(theme);
  const levelMap: Record<string, keyof typeof palette> = {
    DEBUG: 'textTertiary',
    INFO: 'info',
    WARN: 'warning',
    ERROR: 'error',
    FATAL: 'critical',
  };
  return palette[levelMap[level]];
}

/**
 * Get alert severity color
 * @param severity - 'critical', 'warning', 'info'
 * @param theme - 'dark' or 'light'
 * @returns Hex color string
 */
export function getAlertSeverityColor(
  severity: 'critical' | 'warning' | 'info',
  theme: 'dark' | 'light' = 'dark'
): string {
  const palette = getColorPalette(theme);
  const severityMap: Record<string, keyof typeof palette> = {
    critical: 'critical',
    warning: 'warning',
    info: 'info',
  };
  return palette[severityMap[severity]];
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (#RRGGBB)
 * @returns RGB object {r, g, b}
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string (#RRGGBB)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Add opacity to hex color
 * @param hex - Hex color string (#RRGGBB)
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, opacity))})`;
}

/**
 * Lighten a hex color
 * @param hex - Hex color string (#RRGGBB)
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color string
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  const r = Math.min(255, Math.round(rgb.r * factor));
  const g = Math.min(255, Math.round(rgb.g * factor));
  const b = Math.min(255, Math.round(rgb.b * factor));

  return rgbToHex(r, g, b);
}

/**
 * Darken a hex color
 * @param hex - Hex color string (#RRGGBB)
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color string
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return rgbToHex(r, g, b);
}

/**
 * Get contrasting text color (black or white) for background
 * @param bgHex - Background hex color
 * @returns '#000000' or '#ffffff'
 */
export function getContrastingTextColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#ffffff';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  // Return black text for light backgrounds, white for dark
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Get gradient colors for charts
 * @param color - Base color hex
 * @param steps - Number of gradient steps
 * @returns Array of gradient colors
 */
export function getGradientColors(color: string, steps: number = 5): string[] {
  const colors: string[] = [];
  const rgb = hexToRgb(color);

  if (!rgb) return Array(steps).fill(color);

  for (let i = 0; i < steps; i++) {
    const opacity = 1 - (i / (steps - 1)) * 0.7; // Fade from full to 30% opacity
    colors.push(hexToRgba(color, opacity));
  }

  return colors;
}

/**
 * Get color for metric value (green to red gradient)
 * @param value - Metric value (0-1, where 0=green, 1=red)
 * @param theme - 'dark' or 'light'
 * @returns Hex color string
 */
export function getMetricColor(value: number, theme: 'dark' | 'light' = 'dark'): string {
  const palette = getColorPalette(theme);
  const clampedValue = Math.max(0, Math.min(1, value));

  if (clampedValue < 0.33) {
    return palette.success; // Green
  } else if (clampedValue < 0.66) {
    return palette.warning; // Orange
  } else {
    return palette.error; // Red
  }
}

/**
 * Get color palette for percentile visualization
 * @param theme - 'dark' or 'light'
 * @returns Object with percentile colors
 */
export function getPercentileColors(theme: 'dark' | 'light' = 'dark') {
  const palette = getColorPalette(theme);
  return {
    p50: palette.chart[0], // Blue
    p90: palette.chart[2], // Orange
    p99: palette.chart[3], // Red
    p999: palette.critical, // Dark Red
  };
}

/**
 * Get color palette for service status
 * @param theme - 'dark' or 'light'
 * @returns Object with service status colors
 */
export function getServiceStatusColors(theme: 'dark' | 'light' = 'dark') {
  const palette = getColorPalette(theme);
  return {
    healthy: palette.success,
    warning: palette.warning,
    critical: palette.error,
    unknown: palette.textTertiary,
  };
}

/**
 * Get color palette for trace status
 * @param theme - 'dark' or 'light'
 * @returns Object with trace status colors
 */
export function getTraceStatusColors(theme: 'dark' | 'light' = 'dark') {
  const palette = getColorPalette(theme);
  return {
    success: palette.success,
    error: palette.error,
    timeout: palette.warning,
  };
}

/**
 * Get color palette for environment
 * @param theme - 'dark' or 'light'
 * @returns Object with environment colors
 */
export function getEnvironmentColors(theme: 'dark' | 'light' = 'dark') {
  const palette = getColorPalette(theme);
  return {
    production: palette.error,
    staging: palette.warning,
    testing: palette.info,
    development: palette.chart[4],
  };
}

/**
 * Export all color utilities as a namespace
 */
export const ColorPalette = {
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
  getColorPalette,
  getChartColor,
  getStatusColor,
  getSeverityColor,
  getLogLevelColor,
  getAlertSeverityColor,
  hexToRgb,
  rgbToHex,
  hexToRgba,
  lightenColor,
  darkenColor,
  getContrastingTextColor,
  getGradientColors,
  getMetricColor,
  getPercentileColors,
  getServiceStatusColors,
  getTraceStatusColors,
  getEnvironmentColors,
};

export default ColorPalette;
