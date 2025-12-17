/**
 * Chart Theme Composable
 * 
 * Provides reactive chart theme management for ECharts components
 * with dark theme support, color palette utilities, and theme customization
 */

import { ref, computed, readonly } from 'vue';
import type { EChartsOption } from 'echarts';
import { CHART_COLORS, STATUS_COLORS } from '@/types';
import { getDarkTheme, DARK_THEME_COLORS } from '@/utils/chart';

/**
 * Chart theme configuration
 */
export interface ChartThemeConfig {
  /** Theme mode */
  mode: 'dark' | 'light';
  /** Custom color palette */
  colors?: string[];
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Grid color */
  gridColor?: string;
  /** Border color */
  borderColor?: string;
}

/**
 * Chart theme state
 */
interface ChartThemeState {
  config: ChartThemeConfig;
  customColors: Map<string, string>;
}

// Global theme state
const themeState = ref<ChartThemeState>({
  config: {
    mode: 'dark',
    colors: CHART_COLORS,
    backgroundColor: DARK_THEME_COLORS.background,
    textColor: DARK_THEME_COLORS.text.primary,
    gridColor: DARK_THEME_COLORS.grid,
    borderColor: DARK_THEME_COLORS.border,
  },
  customColors: new Map(),
});

/**
 * Chart theme composable
 */
export function useChartTheme() {
  /**
   * Current theme configuration
   */
  const currentTheme = computed(() => themeState.value.config);

  /**
   * Current color palette
   */
  const colorPalette = computed(() => currentTheme.value.colors || CHART_COLORS);

  /**
   * Base ECharts theme
   */
  const baseTheme = computed<Partial<EChartsOption>>(() => {
    if (currentTheme.value.mode === 'dark') {
      return getDarkTheme();
    }
    // Light theme (future implementation)
    return {};
  });

  /**
   * Get color by index from palette
   */
  const getColorByIndex = (index: number): string => {
    const palette = colorPalette.value;
    return palette[index % palette.length];
  };

  /**
   * Get color for specific metric type
   */
  const getMetricColor = (metricType: string): string => {
    // Check custom colors first
    if (themeState.value.customColors.has(metricType)) {
      return themeState.value.customColors.get(metricType)!;
    }

    // Map common metric types to specific colors
    const metricColorMap: Record<string, number> = {
      // Business metrics - blue tones
      qps: 0,
      rps: 0,
      tps: 0,
      throughput: 0,
      
      // Latency metrics - green tones
      latency: 1,
      p50: 1,
      p90: 1,
      p95: 1,
      p99: 1,
      response_time: 1,
      
      // Error metrics - red tones
      error_rate: 3,
      error_count: 3,
      failure_rate: 3,
      
      // Resource metrics - yellow/orange tones
      cpu_usage: 2,
      memory_usage: 2,
      disk_usage: 2,
      
      // Network metrics - cyan tones
      network_in: 4,
      network_out: 4,
      bandwidth: 4,
    };

    const colorIndex = metricColorMap[metricType.toLowerCase()] ?? 0;
    return getColorByIndex(colorIndex);
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string): string => {
    const statusKey = status.toLowerCase() as keyof typeof STATUS_COLORS;
    return STATUS_COLORS[statusKey] || STATUS_COLORS.unknown;
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: 'critical' | 'warning' | 'info'): string => {
    const severityMap = {
      critical: STATUS_COLORS.critical,
      warning: STATUS_COLORS.warning,
      info: STATUS_COLORS.info,
    };
    return severityMap[severity];
  };

  /**
   * Get gradient colors for heatmap/area charts
   */
  const getGradientColors = (baseColor: string, steps: number = 5): string[] => {
    // Simple gradient generation (can be enhanced with color manipulation library)
    const gradients: string[] = [];
    const opacity = [0.2, 0.4, 0.6, 0.8, 1.0];
    
    for (let i = 0; i < steps; i++) {
      gradients.push(`${baseColor}${Math.round(opacity[i] * 255).toString(16).padStart(2, '0')}`);
    }
    
    return gradients;
  };

  /**
   * Get color scale for value range
   */
  const getColorScale = (
    value: number,
    min: number,
    max: number,
    colors: string[] = [STATUS_COLORS.healthy, STATUS_COLORS.warning, STATUS_COLORS.critical]
  ): string => {
    if (value <= min) return colors[0];
    if (value >= max) return colors[colors.length - 1];
    
    const range = max - min;
    const normalizedValue = (value - min) / range;
    const segmentSize = 1 / (colors.length - 1);
    const segmentIndex = Math.floor(normalizedValue / segmentSize);
    
    return colors[Math.min(segmentIndex, colors.length - 1)];
  };

  /**
   * Apply theme to chart options
   */
  const applyTheme = (options: EChartsOption): EChartsOption => {
    return {
      ...baseTheme.value,
      ...options,
      color: options.color || colorPalette.value,
      backgroundColor: options.backgroundColor || currentTheme.value.backgroundColor,
      textStyle: {
        color: currentTheme.value.textColor,
        ...options.textStyle,
      },
    };
  };

  /**
   * Set custom color for metric type
   */
  const setMetricColor = (metricType: string, color: string): void => {
    themeState.value.customColors.set(metricType, color);
  };

  /**
   * Remove custom color for metric type
   */
  const removeMetricColor = (metricType: string): void => {
    themeState.value.customColors.delete(metricType);
  };

  /**
   * Clear all custom colors
   */
  const clearCustomColors = (): void => {
    themeState.value.customColors.clear();
  };

  /**
   * Update theme configuration
   */
  const updateTheme = (config: Partial<ChartThemeConfig>): void => {
    themeState.value.config = {
      ...themeState.value.config,
      ...config,
    };
  };

  /**
   * Reset theme to default
   */
  const resetTheme = (): void => {
    themeState.value = {
      config: {
        mode: 'dark',
        colors: CHART_COLORS,
        backgroundColor: DARK_THEME_COLORS.background,
        textColor: DARK_THEME_COLORS.text.primary,
        gridColor: DARK_THEME_COLORS.grid,
        borderColor: DARK_THEME_COLORS.border,
      },
      customColors: new Map(),
    };
  };

  /**
   * Get theme colors object
   */
  const getThemeColors = () => {
    return {
      background: currentTheme.value.backgroundColor,
      text: currentTheme.value.textColor,
      grid: currentTheme.value.gridColor,
      border: currentTheme.value.borderColor,
      palette: colorPalette.value,
      status: STATUS_COLORS,
    };
  };

  /**
   * Generate series colors for multiple series
   */
  const generateSeriesColors = (count: number): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(getColorByIndex(i));
    }
    return colors;
  };

  /**
   * Get threshold-based color
   */
  const getThresholdColor = (
    value: number,
    thresholds: { value: number; color: string }[]
  ): string => {
    // Sort thresholds by value
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    
    // Find appropriate color
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (value >= sorted[i].value) {
        return sorted[i].color;
      }
    }
    
    return sorted[0]?.color || colorPalette.value[0];
  };

  /**
   * Create visual map for heatmap
   */
  const createVisualMap = (
    min: number,
    max: number,
    colors?: string[]
  ): EChartsOption['visualMap'] => {
    const defaultColors = [
      DARK_THEME_COLORS.series[1], // Green
      DARK_THEME_COLORS.series[2], // Yellow
      DARK_THEME_COLORS.series[3], // Red
    ];

    return {
      min,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: colors || defaultColors,
      },
      textStyle: {
        color: currentTheme.value.textColor,
      },
    };
  };

  return {
    // State
    currentTheme: readonly(currentTheme),
    colorPalette: readonly(colorPalette),
    baseTheme: readonly(baseTheme),

    // Color utilities
    getColorByIndex,
    getMetricColor,
    getStatusColor,
    getSeverityColor,
    getGradientColors,
    getColorScale,
    getThresholdColor,
    generateSeriesColors,

    // Theme management
    applyTheme,
    updateTheme,
    resetTheme,
    getThemeColors,

    // Custom colors
    setMetricColor,
    removeMetricColor,
    clearCustomColors,

    // Visual utilities
    createVisualMap,
  };
}

/**
 * Standalone function to get chart theme (for non-reactive contexts)
 */
export function getChartTheme(): ChartThemeConfig {
  return { ...themeState.value.config };
}

/**
 * Standalone function to get color by index (for non-reactive contexts)
 */
export function getChartColor(index: number): string {
  const palette = themeState.value.config.colors || CHART_COLORS;
  return palette[index % palette.length];
}
