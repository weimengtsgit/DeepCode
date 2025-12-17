/**
 * useChartTheme.ts
 * 
 * Composable for managing ECharts theme configuration and styling.
 * Provides reactive theme state, color palettes, and chart option generation
 * for consistent dark theme application across all chart components.
 */

import { ref, computed, Ref } from 'vue'
import type { ChartTheme, ChartConfig } from '@/types'

/**
 * Dark theme configuration matching Grafana-style design
 */
const DARK_THEME: ChartTheme = {
  backgroundColor: '#0b0c0e',
  textColor: '#d8d9da',
  axisLineColor: 'rgba(255, 255, 255, 0.2)',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  colors: [
    '#3274d9', // Blue
    '#73bf69', // Green
    '#ff9830', // Orange
    '#f2495c', // Red
    '#9830cc', // Purple
    '#37b7c3', // Cyan
    '#fac858', // Yellow
    '#ee6666', // Light Red
    '#5470c6', // Dark Blue
    '#91cc75', // Light Green
  ],
}

/**
 * Light theme configuration (optional future use)
 */
const LIGHT_THEME: ChartTheme = {
  backgroundColor: '#ffffff',
  textColor: '#333333',
  axisLineColor: 'rgba(0, 0, 0, 0.2)',
  gridColor: 'rgba(0, 0, 0, 0.1)',
  colors: [
    '#1f77b4', // Blue
    '#2ca02c', // Green
    '#ff7f0e', // Orange
    '#d62728', // Red
    '#9467bd', // Purple
    '#17becf', // Cyan
    '#bcbd22', // Yellow
    '#e377c2', // Pink
    '#7f7f7f', // Gray
    '#c7c7c7', // Light Gray
  ],
}

/**
 * Main composable for chart theme management
 * 
 * @returns Object with theme state, computed properties, and methods
 */
export function useChartTheme() {
  // Current active theme
  const theme: Ref<'dark' | 'light'> = ref('dark')

  /**
   * Get current theme configuration
   */
  const currentTheme = computed((): ChartTheme => {
    return theme.value === 'dark' ? DARK_THEME : LIGHT_THEME
  })

  /**
   * Get color palette for current theme
   */
  const colorPalette = computed((): string[] => {
    return currentTheme.value.colors
  })

  /**
   * Get text style configuration for ECharts
   */
  const textStyle = computed(() => ({
    color: currentTheme.value.textColor,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 12,
    fontWeight: 400,
  }))

  /**
   * Get axis line style configuration
   */
  const axisLineStyle = computed(() => ({
    lineStyle: {
      color: currentTheme.value.axisLineColor,
      width: 1,
    },
  }))

  /**
   * Get grid configuration
   */
  const gridConfig = computed(() => ({
    backgroundColor: 'transparent',
    borderColor: currentTheme.value.gridColor,
    show: true,
  }))

  /**
   * Get tooltip style configuration
   */
  const tooltipStyle = computed(() => ({
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: currentTheme.value.axisLineColor,
    textStyle: {
      color: currentTheme.value.textColor,
    },
  }))

  /**
   * Generate complete ECharts option with theme applied
   * 
   * @param baseOptions - Base chart options to merge with theme
   * @returns Complete ECharts option object
   */
  function getChartOptions(baseOptions: any = {}): any {
    const theme = currentTheme.value

    return {
      // Color palette
      color: theme.colors,

      // Background
      backgroundColor: theme.backgroundColor,

      // Text styling
      textStyle: textStyle.value,

      // Title styling
      title: {
        textStyle: textStyle.value,
        subtextStyle: {
          color: theme.textColor,
          opacity: 0.7,
        },
        ...baseOptions.title,
      },

      // Legend styling
      legend: {
        textStyle: textStyle.value,
        backgroundColor: 'transparent',
        borderColor: theme.axisLineColor,
        ...baseOptions.legend,
      },

      // Tooltip styling
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: theme.axisLineColor,
        textStyle: {
          color: theme.textColor,
        },
        ...baseOptions.tooltip,
      },

      // Grid styling
      grid: {
        backgroundColor: 'transparent',
        borderColor: theme.gridColor,
        ...baseOptions.grid,
      },

      // X-axis styling
      xAxis: {
        type: 'category',
        axisLine: axisLineStyle.value.lineStyle,
        axisLabel: textStyle.value,
        splitLine: {
          lineStyle: {
            color: theme.gridColor,
          },
        },
        ...baseOptions.xAxis,
      },

      // Y-axis styling
      yAxis: {
        type: 'value',
        axisLine: axisLineStyle.value.lineStyle,
        axisLabel: textStyle.value,
        splitLine: {
          lineStyle: {
            color: theme.gridColor,
          },
        },
        ...baseOptions.yAxis,
      },

      // Series styling
      series: baseOptions.series || [],

      // Animation settings
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',

      // Performance settings
      sampling: 'lttb', // Largest-Triangle-Three-Buckets for large datasets
      large: false, // Enable GPU acceleration for >2000 points
      largeThreshold: 2000,

      // Merge any additional base options
      ...baseOptions,
    }
  }

  /**
   * Get color for specific index
   * 
   * @param index - Color index in palette
   * @returns Hex color string
   */
  function getColor(index: number): string {
    return colorPalette.value[index % colorPalette.value.length]
  }

  /**
   * Get color for status
   * 
   * @param status - Status string ('success', 'error', 'warning', 'info')
   * @returns Hex color string
   */
  function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      success: '#73bf69',
      error: '#f2495c',
      warning: '#ff9830',
      info: '#3274d9',
      critical: '#f2495c',
      healthy: '#73bf69',
      degraded: '#ff9830',
      down: '#f2495c',
    }
    return statusColors[status] || colorPalette.value[0]
  }

  /**
   * Get color for log level
   * 
   * @param level - Log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')
   * @returns Hex color string
   */
  function getLevelColor(level: string): string {
    const levelColors: Record<string, string> = {
      DEBUG: '#5470c6',
      INFO: '#73bf69',
      WARN: '#ff9830',
      ERROR: '#f2495c',
      FATAL: '#9830cc',
    }
    return levelColors[level] || colorPalette.value[0]
  }

  /**
   * Toggle between dark and light themes
   */
  function toggleTheme(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  /**
   * Set theme explicitly
   * 
   * @param newTheme - 'dark' or 'light'
   */
  function setTheme(newTheme: 'dark' | 'light'): void {
    theme.value = newTheme
  }

  /**
   * Get theme-aware opacity value
   * 
   * @param opacity - Base opacity (0-1)
   * @returns Adjusted opacity for current theme
   */
  function getOpacity(opacity: number): number {
    // In dark theme, reduce opacity slightly for better contrast
    return theme.value === 'dark' ? opacity * 0.9 : opacity
  }

  /**
   * Get theme-aware border color
   * 
   * @returns Border color string
   */
  function getBorderColor(): string {
    return currentTheme.value.axisLineColor
  }

  /**
   * Get theme-aware background color
   * 
   * @returns Background color string
   */
  function getBackgroundColor(): string {
    return currentTheme.value.backgroundColor
  }

  /**
   * Get theme-aware text color
   * 
   * @returns Text color string
   */
  function getTextColor(): string {
    return currentTheme.value.textColor
  }

  return {
    // State
    theme,

    // Computed properties
    currentTheme,
    colorPalette,
    textStyle,
    axisLineStyle,
    gridConfig,
    tooltipStyle,

    // Methods
    getChartOptions,
    getColor,
    getStatusColor,
    getLevelColor,
    toggleTheme,
    setTheme,
    getOpacity,
    getBorderColor,
    getBackgroundColor,
    getTextColor,
  }
}

/**
 * Composable for chart configuration helpers
 * 
 * @returns Object with chart configuration utilities
 */
export function useChartConfig() {
  const { getChartOptions, colorPalette } = useChartTheme()

  /**
   * Generate line chart options
   * 
   * @param config - Chart configuration
   * @returns ECharts line chart options
   */
  function getLineChartOptions(config: ChartConfig): any {
    return getChartOptions({
      title: {
        text: config.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: config.title ? [config.title] : [],
        top: 30,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: config.unit || '',
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          areaStyle: {
            opacity: 0.2,
          },
        },
      ],
    })
  }

  /**
   * Generate bar chart options
   * 
   * @param config - Chart configuration
   * @returns ECharts bar chart options
   */
  function getBarChartOptions(config: ChartConfig): any {
    return getChartOptions({
      title: {
        text: config.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: config.title ? [config.title] : [],
        top: 30,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
      },
      yAxis: {
        type: 'value',
        name: config.unit || '',
      },
      series: [
        {
          type: 'bar',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    })
  }

  /**
   * Generate pie chart options
   * 
   * @param config - Chart configuration
   * @returns ECharts pie chart options
   */
  function getPieChartOptions(config: ChartConfig): any {
    return getChartOptions({
      title: {
        text: config.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          center: ['60%', '50%'],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    })
  }

  /**
   * Generate gauge chart options
   * 
   * @param config - Chart configuration
   * @returns ECharts gauge chart options
   */
  function getGaugeChartOptions(config: ChartConfig): any {
    return getChartOptions({
      title: {
        text: config.title,
        left: 'center',
      },
      series: [
        {
          type: 'gauge',
          startAngle: 225,
          endAngle: -45,
          radius: '75%',
          center: ['50%', '50%'],
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 30,
              color: [
                [0.3, '#73bf69'],
                [0.7, '#ff9830'],
                [1, '#f2495c'],
              ],
            },
          },
          pointer: {
            itemStyle: {
              color: 'auto',
            },
          },
          axisTick: {
            distance: -30,
            length: 8,
            lineStyle: {
              color: '#fff',
              width: 2,
            },
          },
          splitLine: {
            distance: -30,
            length: 30,
            lineStyle: {
              color: '#fff',
              width: 4,
            },
          },
          axisLabel: {
            color: 'auto',
            distance: 40,
            fontSize: 16,
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: 'auto',
            fontSize: 20,
          },
        },
      ],
    })
  }

  /**
   * Generate heatmap chart options
   * 
   * @param config - Chart configuration
   * @returns ECharts heatmap chart options
   */
  function getHeatmapChartOptions(config: ChartConfig): any {
    return getChartOptions({
      title: {
        text: config.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
      },
      yAxis: {
        type: 'category',
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'vertical',
        right: '10',
        top: 'center',
      },
      series: [
        {
          type: 'heatmap',
          emphasis: {
            itemStyle: {
              borderColor: '#333',
              borderWidth: 1,
            },
          },
        },
      ],
    })
  }

  return {
    getLineChartOptions,
    getBarChartOptions,
    getPieChartOptions,
    getGaugeChartOptions,
    getHeatmapChartOptions,
  }
}

/**
 * Export theme constants for external use
 */
export { DARK_THEME, LIGHT_THEME }
