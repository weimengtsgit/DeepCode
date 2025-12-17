/**
 * Color Utilities
 * 
 * Provides color mapping, manipulation, and theming utilities for the observability platform.
 * Handles status colors, severity colors, gradient generation, and color transformations.
 */

import type {
  ServiceStatus,
  AlertSeverity,
  AlertStatus,
  Environment,
  Region
} from '@/types'
import type { LogLevel } from '@/types/logs'
import type { TraceStatus, SpanStatus, SpanKind } from '@/types/tracing'
import { STATUS_COLORS, CHART_COLORS } from '@/types'

/**
 * Color format types
 */
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'

/**
 * RGB color object
 */
export interface RGBColor {
  r: number
  g: number
  b: number
}

/**
 * RGBA color object
 */
export interface RGBAColor extends RGBColor {
  a: number
}

/**
 * HSL color object
 */
export interface HSLColor {
  h: number
  s: number
  l: number
}

/**
 * HSLA color object
 */
export interface HSLAColor extends HSLColor {
  a: number
}

/**
 * Get color for service status
 */
export function getServiceStatusColor(status: ServiceStatus): string {
  return STATUS_COLORS[status] || STATUS_COLORS.unknown
}

/**
 * Get color for alert severity
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  const severityColors: Record<AlertSeverity, string> = {
    critical: STATUS_COLORS.critical,
    warning: STATUS_COLORS.warning,
    info: STATUS_COLORS.info
  }
  return severityColors[severity] || STATUS_COLORS.info
}

/**
 * Get color for alert status
 */
export function getAlertStatusColor(status: AlertStatus): string {
  const statusColors: Record<AlertStatus, string> = {
    firing: STATUS_COLORS.critical,
    acknowledged: STATUS_COLORS.warning,
    resolved: STATUS_COLORS.healthy
  }
  return statusColors[status] || STATUS_COLORS.unknown
}

/**
 * Get color for log level
 */
export function getLogLevelColor(level: LogLevel): string {
  const levelColors: Record<LogLevel, string> = {
    FATAL: '#f2495c',
    ERROR: '#ff6b6b',
    WARN: '#ff9830',
    INFO: '#5794f2',
    DEBUG: '#b877d9',
    TRACE: '#6e7681'
  }
  return levelColors[level] || '#6e7681'
}

/**
 * Get color for trace status
 */
export function getTraceStatusColor(status: TraceStatus): string {
  const statusColors: Record<TraceStatus, string> = {
    success: STATUS_COLORS.healthy,
    error: STATUS_COLORS.critical,
    timeout: STATUS_COLORS.warning,
    cancelled: '#9fa7b3',
    unknown: STATUS_COLORS.unknown
  }
  return statusColors[status] || STATUS_COLORS.unknown
}

/**
 * Get color for span status
 */
export function getSpanStatusColor(status: SpanStatus): string {
  const statusColors: Record<SpanStatus, string> = {
    ok: STATUS_COLORS.healthy,
    error: STATUS_COLORS.critical,
    unset: '#9fa7b3'
  }
  return statusColors[status] || '#9fa7b3'
}

/**
 * Get color for span kind
 */
export function getSpanKindColor(kind: SpanKind): string {
  const kindColors: Record<SpanKind, string> = {
    server: '#5470c6',
    client: '#91cc75',
    producer: '#fac858',
    consumer: '#ee6666',
    internal: '#73c0de'
  }
  return kindColors[kind] || '#9fa7b3'
}

/**
 * Get color for environment
 */
export function getEnvironmentColor(environment: Environment): string {
  const envColors: Record<Environment, string> = {
    production: STATUS_COLORS.critical,
    staging: STATUS_COLORS.warning,
    development: STATUS_COLORS.info,
    test: '#b877d9'
  }
  return envColors[environment] || '#9fa7b3'
}

/**
 * Get color for region
 */
export function getRegionColor(region: Region): string {
  const regionColors: Record<Region, string> = {
    'us-east-1': '#5470c6',
    'us-west-2': '#91cc75',
    'eu-west-1': '#fac858',
    'ap-southeast-1': '#ee6666',
    'cn-north-1': '#73c0de'
  }
  return regionColors[region] || '#9fa7b3'
}

/**
 * Get color from chart palette by index
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

/**
 * Get color based on value and thresholds
 */
export function getThresholdColor(
  value: number,
  thresholds: Array<{ value: number; color: string }>
): string {
  const sorted = [...thresholds].sort((a, b) => b.value - a.value)
  
  for (const threshold of sorted) {
    if (value >= threshold.value) {
      return threshold.color
    }
  }
  
  return sorted[sorted.length - 1]?.color || '#9fa7b3'
}

/**
 * Get color scale between two colors
 */
export function getColorScale(
  value: number,
  min: number,
  max: number,
  startColor: string,
  endColor: string
): string {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
  
  const start = hexToRgb(startColor)
  const end = hexToRgb(endColor)
  
  if (!start || !end) return startColor
  
  const r = Math.round(start.r + (end.r - start.r) * ratio)
  const g = Math.round(start.g + (end.g - start.g) * ratio)
  const b = Math.round(start.b + (end.b - start.b) * ratio)
  
  return rgbToHex({ r, g, b })
}

/**
 * Generate gradient colors
 */
export function generateGradient(
  startColor: string,
  endColor: string,
  steps: number
): string[] {
  const colors: string[] = []
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1)
    const start = hexToRgb(startColor)
    const end = hexToRgb(endColor)
    
    if (!start || !end) continue
    
    const r = Math.round(start.r + (end.r - start.r) * ratio)
    const g = Math.round(start.g + (end.g - start.g) * ratio)
    const b = Math.round(start.b + (end.b - start.b) * ratio)
    
    colors.push(rgbToHex({ r, g, b }))
  }
  
  return colors
}

/**
 * Generate heatmap colors
 */
export function generateHeatmapColors(steps: number = 10): string[] {
  return generateGradient('#1f1f24', STATUS_COLORS.critical, steps)
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGBColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Convert hex to RGBA
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / diff + 2) / 6
        break
      case b:
        h = ((r - g) / diff + 4) / 6
        break
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100
  
  let r: number, g: number, b: number
  
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * Lighten color by percentage
 */
export function lightenColor(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  
  const hsl = rgbToHsl(rgb)
  hsl.l = Math.min(100, hsl.l + percent)
  
  return rgbToHex(hslToRgb(hsl))
}

/**
 * Darken color by percentage
 */
export function darkenColor(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  
  const hsl = rgbToHsl(rgb)
  hsl.l = Math.max(0, hsl.l - percent)
  
  return rgbToHex(hslToRgb(hsl))
}

/**
 * Adjust color opacity
 */
export function adjustOpacity(color: string, opacity: number): string {
  return hexToRgba(color, Math.max(0, Math.min(1, opacity)))
}

/**
 * Get contrasting text color (black or white) for background
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return '#ffffff'
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Check if color is dark
 */
export function isDarkColor(color: string): boolean {
  return getContrastColor(color) === '#ffffff'
}

/**
 * Check if color is light
 */
export function isLightColor(color: string): boolean {
  return getContrastColor(color) === '#000000'
}

/**
 * Generate random color
 */
export function randomColor(): string {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return rgbToHex({ r, g, b })
}

/**
 * Generate random color from palette
 */
export function randomChartColor(): string {
  return CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)]
}

/**
 * Parse color string to RGB
 */
export function parseColor(color: string): RGBColor | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    return hexToRgb(color)
  }
  
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    }
  }
  
  return null
}

/**
 * Format color to specified format
 */
export function formatColor(color: string, format: ColorFormat = 'hex'): string {
  const rgb = parseColor(color)
  if (!rgb) return color
  
  switch (format) {
    case 'hex':
      return rgbToHex(rgb)
    case 'rgb':
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    case 'rgba':
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
    case 'hsl': {
      const hsl = rgbToHsl(rgb)
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    }
    case 'hsla': {
      const hsl = rgbToHsl(rgb)
      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`
    }
    default:
      return color
  }
}

/**
 * Get color palette for multiple series
 */
export function getSeriesColors(count: number): string[] {
  const colors: string[] = []
  
  for (let i = 0; i < count; i++) {
    colors.push(getChartColor(i))
  }
  
  return colors
}

/**
 * Get semantic color by name
 */
export function getSemanticColor(name: string): string {
  const semanticColors: Record<string, string> = {
    primary: '#3274d9',
    success: '#73bf69',
    warning: '#ff9830',
    error: '#f2495c',
    info: '#5794f2',
    healthy: STATUS_COLORS.healthy,
    degraded: STATUS_COLORS.degraded,
    down: STATUS_COLORS.down,
    unknown: STATUS_COLORS.unknown,
    critical: STATUS_COLORS.critical
  }
  
  return semanticColors[name] || '#9fa7b3'
}

/**
 * Export all color utilities
 */
export default {
  // Status colors
  getServiceStatusColor,
  getAlertSeverityColor,
  getAlertStatusColor,
  getLogLevelColor,
  getTraceStatusColor,
  getSpanStatusColor,
  getSpanKindColor,
  getEnvironmentColor,
  getRegionColor,
  
  // Chart colors
  getChartColor,
  getThresholdColor,
  getColorScale,
  generateGradient,
  generateHeatmapColors,
  
  // Color conversion
  hexToRgb,
  rgbToHex,
  hexToRgba,
  rgbToHsl,
  hslToRgb,
  
  // Color manipulation
  lightenColor,
  darkenColor,
  adjustOpacity,
  getContrastColor,
  isDarkColor,
  isLightColor,
  
  // Utilities
  randomColor,
  randomChartColor,
  parseColor,
  formatColor,
  getSeriesColors,
  getSemanticColor
}
