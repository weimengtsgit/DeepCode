/**
 * Chart Configuration Templates
 * Provides pre-configured ECharts option templates for all chart types
 * with dark theme styling, responsive sizing, and consistent visual patterns
 */

import type { EChartsOption } from 'echarts'
import type { ChartConfig } from '@/types'
import { DARK_THEME_COLORS } from './color-palette'

/**
 * Base chart options shared across all chart types
 */
export const baseChartOptions: EChartsOption = {
  animation: true,
  animationDuration: 500,
  animationEasing: 'cubicOut',
  textStyle: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: 12,
    color: DARK_THEME_COLORS.text.primary,
  },
  backgroundColor: 'transparent',
}

/**
 * Line chart configuration template
 * Used for time-series metric visualization
 */
export function getLineChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
      borderColor: DARK_THEME_COLORS.border.light,
    },
    grid: {
      left: '60px',
      right: '20px',
      top: config.title ? '60px' : '20px',
      bottom: '60px',
      containLabel: true,
      backgroundColor: DARK_THEME_COLORS.bg.tertiary,
      borderColor: DARK_THEME_COLORS.border.light,
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: config.unit ? `(${config.unit})` : undefined,
      nameTextStyle: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    series: [],
  }
}

/**
 * Bar chart configuration template
 * Used for categorical metric comparison
 */
export function getBarChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    grid: {
      left: '60px',
      right: '20px',
      top: config.title ? '60px' : '20px',
      bottom: '60px',
      containLabel: true,
      backgroundColor: DARK_THEME_COLORS.bg.tertiary,
      borderColor: DARK_THEME_COLORS.border.light,
    },
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: config.unit ? `(${config.unit})` : undefined,
      nameTextStyle: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    series: [],
  }
}

/**
 * Pie chart configuration template
 * Used for distribution visualization
 */
export function getPieChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
      orient: 'horizontal',
      align: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        label: {
          color: DARK_THEME_COLORS.text.secondary,
          fontSize: 11,
        },
        emphasis: {
          label: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
        data: [],
      },
    ],
  }
}

/**
 * Gauge chart configuration template
 * Used for KPI displays with thresholds
 */
export function getGaugeChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
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
              [0.3, DARK_THEME_COLORS.status.success],
              [0.7, DARK_THEME_COLORS.status.warning],
              [1, DARK_THEME_COLORS.status.error],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: DARK_THEME_COLORS.text.primary,
          },
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: DARK_THEME_COLORS.border.light,
            width: 2,
          },
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: DARK_THEME_COLORS.border.light,
            width: 4,
          },
        },
        axisLabel: {
          color: DARK_THEME_COLORS.text.secondary,
          distance: 40,
          fontSize: 11,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: DARK_THEME_COLORS.text.primary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        data: [
          {
            value: 50,
            name: config.unit || 'Value',
          },
        ],
      },
    ],
  }
}

/**
 * Heatmap chart configuration template
 * Used for time-intensity visualization
 */
export function getHeatmapChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    grid: {
      left: '80px',
      right: '20px',
      top: config.title ? '60px' : '20px',
      bottom: '60px',
      containLabel: true,
      backgroundColor: DARK_THEME_COLORS.bg.tertiary,
      borderColor: DARK_THEME_COLORS.border.light,
    },
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: '10px',
      top: 'center',
      inRange: {
        color: [
          DARK_THEME_COLORS.status.success,
          DARK_THEME_COLORS.status.warning,
          DARK_THEME_COLORS.status.error,
        ],
      },
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    series: [
      {
        type: 'heatmap',
        data: [],
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            borderColor: DARK_THEME_COLORS.text.primary,
            borderWidth: 1,
          },
        },
      },
    ],
  }
}

/**
 * Scatter chart configuration template
 * Used for correlation visualization
 */
export function getScatterChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    grid: {
      left: '60px',
      right: '20px',
      top: config.title ? '60px' : '20px',
      bottom: '60px',
      containLabel: true,
      backgroundColor: DARK_THEME_COLORS.bg.tertiary,
      borderColor: DARK_THEME_COLORS.border.light,
    },
    xAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    series: [],
  }
}

/**
 * Area chart configuration template
 * Used for stacked area visualization
 */
export function getAreaChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    grid: {
      left: '60px',
      right: '20px',
      top: config.title ? '60px' : '20px',
      bottom: '60px',
      containLabel: true,
      backgroundColor: DARK_THEME_COLORS.bg.tertiary,
      borderColor: DARK_THEME_COLORS.border.light,
    },
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: config.unit ? `(${config.unit})` : undefined,
      nameTextStyle: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    series: [],
  }
}

/**
 * Candlestick chart configuration template
 * Used for OHLC data visualization
 */
export function getCandlestickChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      axisPointer: {
        type: 'cross',
      },
    },
    grid: {
      left: '60px',
      right: '20px',
      top: config.title ? '60px' : '20px',
      bottom: '60px',
      containLabel: true,
      backgroundColor: DARK_THEME_COLORS.bg.tertiary,
      borderColor: DARK_THEME_COLORS.border.light,
    },
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: config.unit ? `(${config.unit})` : undefined,
      nameTextStyle: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        type: 'candlestick',
        data: [],
        itemStyle: {
          color: DARK_THEME_COLORS.status.success,
          color0: DARK_THEME_COLORS.status.error,
          borderColor: DARK_THEME_COLORS.status.success,
          borderColor0: DARK_THEME_COLORS.status.error,
        },
      },
    ],
  }
}

/**
 * Radar chart configuration template
 * Used for multi-dimensional comparison
 */
export function getRadarChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    radar: {
      indicator: [],
      shape: 'polygon',
      splitNumber: 4,
      name: {
        textStyle: {
          color: DARK_THEME_COLORS.text.secondary,
        },
      },
      splitLine: {
        lineStyle: {
          color: [
            DARK_THEME_COLORS.border.light,
            DARK_THEME_COLORS.border.light,
            DARK_THEME_COLORS.border.light,
            DARK_THEME_COLORS.border.light,
          ],
        },
      },
      splitArea: {
        areaStyle: {
          color: [
            `rgba(200, 200, 200, 0.1)`,
            `rgba(200, 200, 200, 0.2)`,
          ],
        },
      },
      axisLine: {
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
    },
    series: [],
  }
}

/**
 * Sankey diagram configuration template
 * Used for flow visualization
 */
export function getSankeyChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      triggerOn: 'mousemove',
    },
    series: [
      {
        type: 'sankey',
        data: [],
        links: [],
        focusNodeAdjacency: true,
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
          opacity: 0.5,
        },
        label: {
          color: DARK_THEME_COLORS.text.secondary,
        },
      },
    ],
  }
}

/**
 * Tree diagram configuration template
 * Used for hierarchical visualization
 */
export function getTreeChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    series: [
      {
        type: 'tree',
        data: [],
        top: '10%',
        left: '10%',
        bottom: '10%',
        right: '10%',
        symbolSize: [50, 25],
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
        label: {
          backgroundColor: DARK_THEME_COLORS.bg.secondary,
          borderColor: DARK_THEME_COLORS.border.light,
          color: DARK_THEME_COLORS.text.primary,
        },
        leaves: {
          label: {
            backgroundColor: DARK_THEME_COLORS.bg.tertiary,
            borderColor: DARK_THEME_COLORS.border.light,
            color: DARK_THEME_COLORS.text.secondary,
          },
        },
        lineStyle: {
          color: DARK_THEME_COLORS.border.light,
        },
      },
    ],
  }
}

/**
 * Sunburst chart configuration template
 * Used for hierarchical proportion visualization
 */
export function getSunburstChartOptions(config: Partial<ChartConfig> = {}): EChartsOption {
  return {
    ...baseChartOptions,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.bg.secondary,
      borderColor: DARK_THEME_COLORS.border.primary,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    series: [
      {
        type: 'sunburst',
        data: [],
        radius: [0, '90%'],
        label: {
          rotate: 'radial',
          color: DARK_THEME_COLORS.text.primary,
        },
      },
    ],
  }
}

/**
 * Get chart options by type
 * Convenience function to select appropriate template
 */
export function getChartOptionsByType(
  type: string,
  config: Partial<ChartConfig> = {},
): EChartsOption {
  const typeMap: Record<string, (config: Partial<ChartConfig>) => EChartsOption> = {
    line: getLineChartOptions,
    bar: getBarChartOptions,
    pie: getPieChartOptions,
    gauge: getGaugeChartOptions,
    heatmap: getHeatmapChartOptions,
    scatter: getScatterChartOptions,
    area: getAreaChartOptions,
    candlestick: getCandlestickChartOptions,
    radar: getRadarChartOptions,
    sankey: getSankeyChartOptions,
    tree: getTreeChartOptions,
    sunburst: getSunburstChartOptions,
  }

  const optionsFn = typeMap[type.toLowerCase()] || getLineChartOptions
  return optionsFn(config)
}

/**
 * Merge custom options with base template
 * Allows partial overrides of template options
 */
export function mergeChartOptions(
  baseOptions: EChartsOption,
  customOptions: Partial<EChartsOption>,
): EChartsOption {
  return {
    ...baseOptions,
    ...customOptions,
    grid: {
      ...baseOptions.grid,
      ...customOptions.grid,
    },
    xAxis: {
      ...baseOptions.xAxis,
      ...customOptions.xAxis,
    },
    yAxis: {
      ...baseOptions.yAxis,
      ...customOptions.yAxis,
    },
    tooltip: {
      ...baseOptions.tooltip,
      ...customOptions.tooltip,
    },
    legend: {
      ...baseOptions.legend,
      ...customOptions.legend,
    },
  }
}
