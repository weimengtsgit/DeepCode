/**
 * Chart Configuration Utilities
 * 
 * Provides comprehensive ECharts configuration helpers for the observability platform,
 * including theme generation, common chart options, axis configurations, and
 * visualization-specific settings for metrics, traces, and logs.
 */

import type { EChartsOption } from 'echarts';
import type {
  ChartConfig,
  TimeSeries,
  DataPoint,
  MetricUnit,
  MetricType,
} from '@/types';
import type { MetricTimeSeries } from '@/types/metrics';
import { CHART_COLORS } from '@/types';
import { formatMetricValue, formatDuration, formatTimestamp } from './format';
import { formatAxisLabel } from './date';

/**
 * Dark theme color palette for charts
 */
export const DARK_THEME_COLORS = {
  background: '#181b1f',
  text: {
    primary: '#d8d9da',
    secondary: '#9fa7b3',
    disabled: '#6e7681',
  },
  border: {
    default: '#2d2f33',
    hover: '#404449',
  },
  grid: '#333333',
  axis: '#555555',
  splitLine: '#2d2f33',
  tooltip: {
    background: '#23252b',
    border: '#404449',
  },
  legend: {
    text: '#d8d9da',
    inactive: '#6e7681',
  },
  series: CHART_COLORS,
};

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION = {
  duration: 300,
  easing: 'cubicOut' as const,
};

/**
 * Generates base ECharts theme configuration for dark mode
 */
export function getDarkTheme(): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    textStyle: {
      color: DARK_THEME_COLORS.text.primary,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    color: DARK_THEME_COLORS.series,
    grid: {
      borderColor: DARK_THEME_COLORS.border.default,
    },
    tooltip: {
      backgroundColor: DARK_THEME_COLORS.tooltip.background,
      borderColor: DARK_THEME_COLORS.tooltip.border,
      borderWidth: 1,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    legend: {
      textStyle: {
        color: DARK_THEME_COLORS.legend.text,
      },
      inactiveColor: DARK_THEME_COLORS.legend.inactive,
    },
    axisPointer: {
      lineStyle: {
        color: DARK_THEME_COLORS.axis,
      },
      crossStyle: {
        color: DARK_THEME_COLORS.axis,
      },
    },
  };
}

/**
 * Creates common grid configuration
 */
export function getGridConfig(config?: {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  containLabel?: boolean;
}): EChartsOption['grid'] {
  return {
    top: config?.top ?? 60,
    right: config?.right ?? 20,
    bottom: config?.bottom ?? 60,
    left: config?.left ?? 60,
    containLabel: config?.containLabel ?? true,
    borderColor: DARK_THEME_COLORS.border.default,
  };
}

/**
 * Creates time-based X-axis configuration
 */
export function getTimeXAxis(config?: {
  name?: string;
  showGrid?: boolean;
  timeRange?: { start: number; end: number };
}): EChartsOption['xAxis'] {
  return {
    type: 'time',
    name: config?.name,
    nameTextStyle: {
      color: DARK_THEME_COLORS.text.secondary,
    },
    axisLine: {
      lineStyle: {
        color: DARK_THEME_COLORS.axis,
      },
    },
    axisLabel: {
      color: DARK_THEME_COLORS.text.secondary,
      formatter: (value: number) => {
        if (config?.timeRange) {
          return formatAxisLabel(value, config.timeRange);
        }
        return formatTimestamp(value, 'time');
      },
    },
    splitLine: {
      show: config?.showGrid ?? true,
      lineStyle: {
        color: DARK_THEME_COLORS.splitLine,
        type: 'dashed',
      },
    },
  };
}

/**
 * Creates value-based Y-axis configuration
 */
export function getValueYAxis(config?: {
  name?: string;
  unit?: MetricUnit;
  showGrid?: boolean;
  min?: number | 'dataMin';
  max?: number | 'dataMax';
}): EChartsOption['yAxis'] {
  return {
    type: 'value',
    name: config?.name,
    nameTextStyle: {
      color: DARK_THEME_COLORS.text.secondary,
    },
    axisLine: {
      lineStyle: {
        color: DARK_THEME_COLORS.axis,
      },
    },
    axisLabel: {
      color: DARK_THEME_COLORS.text.secondary,
      formatter: (value: number) => {
        if (config?.unit) {
          return formatMetricValue(value, config.unit);
        }
        return value.toString();
      },
    },
    splitLine: {
      show: config?.showGrid ?? true,
      lineStyle: {
        color: DARK_THEME_COLORS.splitLine,
        type: 'dashed',
      },
    },
    min: config?.min,
    max: config?.max,
  };
}

/**
 * Creates tooltip configuration
 */
export function getTooltipConfig(config?: {
  trigger?: 'axis' | 'item';
  formatter?: (params: any) => string;
  unit?: MetricUnit;
}): EChartsOption['tooltip'] {
  return {
    trigger: config?.trigger ?? 'axis',
    backgroundColor: DARK_THEME_COLORS.tooltip.background,
    borderColor: DARK_THEME_COLORS.tooltip.border,
    borderWidth: 1,
    textStyle: {
      color: DARK_THEME_COLORS.text.primary,
    },
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: DARK_THEME_COLORS.axis,
      },
      lineStyle: {
        color: DARK_THEME_COLORS.axis,
        type: 'dashed',
      },
    },
    formatter: config?.formatter ?? ((params: any) => {
      if (Array.isArray(params)) {
        const time = formatTimestamp(params[0].value[0], 'full');
        const items = params
          .map((item: any) => {
            const value = config?.unit
              ? formatMetricValue(item.value[1], config.unit)
              : item.value[1];
            return `${item.marker} ${item.seriesName}: <strong>${value}</strong>`;
          })
          .join('<br/>');
        return `${time}<br/>${items}`;
      }
      return params.name;
    }),
  };
}

/**
 * Creates legend configuration
 */
export function getLegendConfig(config?: {
  show?: boolean;
  top?: number | string;
  right?: number | string;
  orient?: 'horizontal' | 'vertical';
}): EChartsOption['legend'] {
  return {
    show: config?.show ?? true,
    top: config?.top ?? 10,
    right: config?.right ?? 20,
    orient: config?.orient ?? 'horizontal',
    textStyle: {
      color: DARK_THEME_COLORS.legend.text,
    },
    inactiveColor: DARK_THEME_COLORS.legend.inactive,
  };
}

/**
 * Creates dataZoom configuration for time range selection
 */
export function getDataZoomConfig(config?: {
  show?: boolean;
  start?: number;
  end?: number;
}): EChartsOption['dataZoom'] {
  return [
    {
      type: 'slider',
      show: config?.show ?? true,
      start: config?.start ?? 0,
      end: config?.end ?? 100,
      height: 30,
      bottom: 10,
      borderColor: DARK_THEME_COLORS.border.default,
      fillerColor: 'rgba(82, 112, 198, 0.2)',
      handleStyle: {
        color: '#5470c6',
        borderColor: '#5470c6',
      },
      textStyle: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    {
      type: 'inside',
      start: config?.start ?? 0,
      end: config?.end ?? 100,
    },
  ];
}

/**
 * Converts TimeSeries to ECharts series data format
 */
export function convertToSeriesData(timeSeries: TimeSeries): [number, number][] {
  return timeSeries.data.map((point: DataPoint) => [point.timestamp, point.value]);
}

/**
 * Converts MetricTimeSeries to ECharts series data format
 */
export function convertMetricToSeriesData(
  metricSeries: MetricTimeSeries
): [number, number][] {
  return metricSeries.dataPoints.map((point) => [point.timestamp, point.value]);
}

/**
 * Creates line chart configuration
 */
export function createLineChartConfig(
  series: TimeSeries[],
  config?: ChartConfig & {
    timeRange?: { start: number; end: number };
    smooth?: boolean;
    area?: boolean;
    unit?: MetricUnit;
  }
): EChartsOption {
  return {
    ...getDarkTheme(),
    title: config?.title
      ? {
          text: config.title,
          textStyle: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 16,
            fontWeight: 'normal',
          },
          left: 20,
          top: 10,
        }
      : undefined,
    grid: getGridConfig(),
    xAxis: getTimeXAxis({
      showGrid: config?.showGrid ?? true,
      timeRange: config?.timeRange,
    }),
    yAxis: getValueYAxis({
      unit: config?.unit,
      showGrid: config?.showGrid ?? true,
    }),
    tooltip: getTooltipConfig({
      trigger: 'axis',
      unit: config?.unit,
    }),
    legend: getLegendConfig({
      show: config?.showLegend ?? true,
    }),
    dataZoom: getDataZoomConfig(),
    series: series.map((s, index) => ({
      name: s.name,
      type: 'line',
      data: convertToSeriesData(s),
      smooth: config?.smooth ?? true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: {
        width: 2,
      },
      areaStyle: config?.area
        ? {
            opacity: 0.3,
          }
        : undefined,
      color: s.color ?? CHART_COLORS[index % CHART_COLORS.length],
    })),
    animation: config?.animation ?? true,
    animationDuration: DEFAULT_ANIMATION.duration,
    animationEasing: DEFAULT_ANIMATION.easing,
  };
}

/**
 * Creates bar chart configuration
 */
export function createBarChartConfig(
  series: TimeSeries[],
  config?: ChartConfig & {
    timeRange?: { start: number; end: number };
    stack?: boolean;
    unit?: MetricUnit;
  }
): EChartsOption {
  return {
    ...getDarkTheme(),
    title: config?.title
      ? {
          text: config.title,
          textStyle: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 16,
            fontWeight: 'normal',
          },
          left: 20,
          top: 10,
        }
      : undefined,
    grid: getGridConfig(),
    xAxis: getTimeXAxis({
      showGrid: config?.showGrid ?? true,
      timeRange: config?.timeRange,
    }),
    yAxis: getValueYAxis({
      unit: config?.unit,
      showGrid: config?.showGrid ?? true,
    }),
    tooltip: getTooltipConfig({
      trigger: 'axis',
      unit: config?.unit,
    }),
    legend: getLegendConfig({
      show: config?.showLegend ?? true,
    }),
    series: series.map((s, index) => ({
      name: s.name,
      type: 'bar',
      data: convertToSeriesData(s),
      stack: config?.stack ? 'total' : undefined,
      color: s.color ?? CHART_COLORS[index % CHART_COLORS.length],
    })),
    animation: config?.animation ?? true,
    animationDuration: DEFAULT_ANIMATION.duration,
    animationEasing: DEFAULT_ANIMATION.easing,
  };
}

/**
 * Creates pie chart configuration
 */
export function createPieChartConfig(
  data: Array<{ name: string; value: number }>,
  config?: ChartConfig & {
    radius?: string | [string, string];
    roseType?: boolean;
  }
): EChartsOption {
  return {
    ...getDarkTheme(),
    title: config?.title
      ? {
          text: config.title,
          textStyle: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 16,
            fontWeight: 'normal',
          },
          left: 'center',
          top: 10,
        }
      : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME_COLORS.tooltip.background,
      borderColor: DARK_THEME_COLORS.tooltip.border,
      borderWidth: 1,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.legend.text,
      },
    },
    series: [
      {
        type: 'pie',
        radius: config?.radius ?? ['40%', '70%'],
        center: ['40%', '50%'],
        roseType: config?.roseType ? 'radius' : undefined,
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: {
          color: DARK_THEME_COLORS.text.primary,
        },
        labelLine: {
          lineStyle: {
            color: DARK_THEME_COLORS.text.secondary,
          },
        },
      },
    ],
    animation: config?.animation ?? true,
    animationDuration: DEFAULT_ANIMATION.duration,
    animationEasing: DEFAULT_ANIMATION.easing,
  };
}

/**
 * Creates heatmap chart configuration
 */
export function createHeatmapConfig(
  data: Array<[number, number, number]>,
  config?: ChartConfig & {
    xAxisData?: string[];
    yAxisData?: string[];
    min?: number;
    max?: number;
  }
): EChartsOption {
  return {
    ...getDarkTheme(),
    title: config?.title
      ? {
          text: config.title,
          textStyle: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 16,
            fontWeight: 'normal',
          },
          left: 20,
          top: 10,
        }
      : undefined,
    grid: getGridConfig(),
    xAxis: {
      type: 'category',
      data: config?.xAxisData,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    yAxis: {
      type: 'category',
      data: config?.yAxisData,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: DARK_THEME_COLORS.text.secondary,
      },
    },
    visualMap: {
      min: config?.min ?? 0,
      max: config?.max ?? 100,
      calculable: true,
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      },
    },
    tooltip: {
      position: 'top',
      backgroundColor: DARK_THEME_COLORS.tooltip.background,
      borderColor: DARK_THEME_COLORS.tooltip.border,
      borderWidth: 1,
      textStyle: {
        color: DARK_THEME_COLORS.text.primary,
      },
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
    animation: config?.animation ?? true,
    animationDuration: DEFAULT_ANIMATION.duration,
    animationEasing: DEFAULT_ANIMATION.easing,
  };
}

/**
 * Creates gauge chart configuration
 */
export function createGaugeConfig(
  value: number,
  config?: ChartConfig & {
    min?: number;
    max?: number;
    unit?: string;
    thresholds?: Array<{ value: number; color: string }>;
  }
): EChartsOption {
  return {
    ...getDarkTheme(),
    title: config?.title
      ? {
          text: config.title,
          textStyle: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 16,
            fontWeight: 'normal',
          },
          left: 'center',
          top: 10,
        }
      : undefined,
    series: [
      {
        type: 'gauge',
        min: config?.min ?? 0,
        max: config?.max ?? 100,
        splitNumber: 10,
        radius: '80%',
        axisLine: {
          lineStyle: {
            width: 20,
            color: config?.thresholds
              ? config.thresholds.map((t) => [t.value / (config.max ?? 100), t.color])
              : [
                  [0.6, '#73bf69'],
                  [0.8, '#ff9830'],
                  [1, '#f2495c'],
                ],
          },
        },
        pointer: {
          itemStyle: {
            color: DARK_THEME_COLORS.text.primary,
          },
        },
        axisTick: {
          distance: -20,
          length: 5,
          lineStyle: {
            color: DARK_THEME_COLORS.text.primary,
          },
        },
        splitLine: {
          distance: -20,
          length: 20,
          lineStyle: {
            color: DARK_THEME_COLORS.text.primary,
          },
        },
        axisLabel: {
          color: DARK_THEME_COLORS.text.secondary,
          distance: 25,
        },
        detail: {
          valueAnimation: true,
          formatter: `{value}${config?.unit ?? ''}`,
          color: DARK_THEME_COLORS.text.primary,
          fontSize: 24,
        },
        data: [{ value }],
      },
    ],
    animation: config?.animation ?? true,
    animationDuration: DEFAULT_ANIMATION.duration,
    animationEasing: DEFAULT_ANIMATION.easing,
  };
}

/**
 * Creates multi-axis chart configuration for comparing different metric types
 */
export function createMultiAxisChartConfig(
  series: Array<{
    name: string;
    data: [number, number][];
    unit: MetricUnit;
    yAxisIndex?: number;
  }>,
  config?: ChartConfig & {
    timeRange?: { start: number; end: number };
  }
): EChartsOption {
  const uniqueUnits = [...new Set(series.map((s) => s.unit))];
  const yAxes = uniqueUnits.map((unit, index) =>
    getValueYAxis({
      unit,
      showGrid: index === 0,
    })
  );

  return {
    ...getDarkTheme(),
    title: config?.title
      ? {
          text: config.title,
          textStyle: {
            color: DARK_THEME_COLORS.text.primary,
            fontSize: 16,
            fontWeight: 'normal',
          },
          left: 20,
          top: 10,
        }
      : undefined,
    grid: getGridConfig({ right: 80 * uniqueUnits.length }),
    xAxis: getTimeXAxis({
      showGrid: config?.showGrid ?? true,
      timeRange: config?.timeRange,
    }),
    yAxis: yAxes,
    tooltip: getTooltipConfig({ trigger: 'axis' }),
    legend: getLegendConfig({ show: config?.showLegend ?? true }),
    dataZoom: getDataZoomConfig(),
    series: series.map((s, index) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      yAxisIndex: uniqueUnits.indexOf(s.unit),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: {
        width: 2,
      },
      color: CHART_COLORS[index % CHART_COLORS.length],
    })),
    animation: config?.animation ?? true,
    animationDuration: DEFAULT_ANIMATION.duration,
    animationEasing: DEFAULT_ANIMATION.easing,
  };
}

/**
 * Utility to merge custom options with base configuration
 */
export function mergeChartOptions(
  baseOptions: EChartsOption,
  customOptions: Partial<EChartsOption>
): EChartsOption {
  return {
    ...baseOptions,
    ...customOptions,
    grid: { ...baseOptions.grid, ...customOptions.grid },
    xAxis: { ...baseOptions.xAxis, ...customOptions.xAxis },
    yAxis: { ...baseOptions.yAxis, ...customOptions.yAxis },
    tooltip: { ...baseOptions.tooltip, ...customOptions.tooltip },
    legend: { ...baseOptions.legend, ...customOptions.legend },
  };
}
