<template>
  <BaseChart
    ref="chartRef"
    :option="chartOption"
    :width="width"
    :height="height"
    :loading="loading"
    :error="error"
    :isEmpty="isEmpty"
    :lazyLoad="lazyLoad"
    :customOptions="customOptions"
    @click="handleClick"
    @dblclick="handleDblclick"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart.vue';
import { createHeatmapConfig, mergeChartOptions } from '@/utils/chart';
import type { ChartConfig } from '@/types';

/**
 * HeatmapChart Component
 * 
 * Specialized chart for rendering heatmap visualizations with time-based x-axis
 * and categorical y-axis. Commonly used for:
 * - Request distribution over time
 * - Error patterns across services
 * - Resource usage heatmaps
 * - Log level distribution
 * - Service call patterns
 */

export interface HeatmapDataItem {
  /** X-axis value (timestamp or category) */
  x: number | string;
  /** Y-axis value (category) */
  y: number | string;
  /** Heat value (intensity) */
  value: number;
}

interface Props {
  /** Heatmap data array [x, y, value] */
  data?: Array<[number | string, number | string, number]>;
  /** Structured data format */
  structuredData?: HeatmapDataItem[];
  /** X-axis categories (for category type) */
  xAxisData?: Array<string | number>;
  /** Y-axis categories */
  yAxisData?: Array<string | number>;
  /** X-axis type */
  xAxisType?: 'time' | 'category' | 'value';
  /** Y-axis type */
  yAxisType?: 'category' | 'value';
  /** X-axis label */
  xAxisName?: string;
  /** Y-axis label */
  yAxisName?: string;
  /** Minimum value for color scale */
  min?: number;
  /** Maximum value for color scale */
  max?: number;
  /** Color gradient (start to end) */
  colors?: string[];
  /** Show visual map (color legend) */
  showVisualMap?: boolean;
  /** Visual map position */
  visualMapPosition?: 'left' | 'right' | 'top' | 'bottom';
  /** Visual map orientation */
  visualMapOrientation?: 'horizontal' | 'vertical';
  /** Cell size (for uniform cells) */
  cellSize?: number | [number, number];
  /** Show grid lines */
  showGrid?: boolean;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Tooltip formatter function */
  tooltipFormatter?: (params: any) => string;
  /** Chart width */
  width?: string;
  /** Chart height */
  height?: string;
  /** Base chart configuration */
  config?: Partial<ChartConfig>;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Empty state */
  isEmpty?: boolean;
  /** Enable lazy loading */
  lazyLoad?: boolean;
  /** Custom ECharts options */
  customOptions?: Partial<EChartsOption>;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  structuredData: () => [],
  xAxisData: () => [],
  yAxisData: () => [],
  xAxisType: 'time',
  yAxisType: 'category',
  colors: () => ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
  showVisualMap: true,
  visualMapPosition: 'right',
  visualMapOrientation: 'vertical',
  showGrid: true,
  showTooltip: true,
  width: '100%',
  height: '400px',
});

const emit = defineEmits<{
  click: [event: any];
  dblclick: [event: any];
}>();

const chartRef = ref<InstanceType<typeof BaseChart>>();

/**
 * Normalize data to ECharts format
 */
const normalizedData = computed(() => {
  if (props.structuredData.length > 0) {
    return props.structuredData.map(item => [item.x, item.y, item.value]);
  }
  return props.data;
});

/**
 * Calculate min/max values if not provided
 */
const valueRange = computed(() => {
  const values = normalizedData.value.map(item => item[2] as number);
  return {
    min: props.min ?? Math.min(...values),
    max: props.max ?? Math.max(...values),
  };
});

/**
 * Build heatmap chart configuration
 */
const chartOption = computed<EChartsOption>(() => {
  const baseConfig = createHeatmapConfig(normalizedData.value as Array<[number, number, number]>, {
    title: props.config?.title,
    xAxisData: props.xAxisData,
    yAxisData: props.yAxisData,
    min: valueRange.value.min,
    max: valueRange.value.max,
    colors: props.colors,
    showVisualMap: props.showVisualMap,
  });

  // Customize axis types
  const customConfig: Partial<EChartsOption> = {
    xAxis: {
      type: props.xAxisType,
      name: props.xAxisName,
      data: props.xAxisType === 'category' ? props.xAxisData : undefined,
      splitArea: {
        show: props.showGrid,
      },
    },
    yAxis: {
      type: props.yAxisType,
      name: props.yAxisName,
      data: props.yAxisType === 'category' ? props.yAxisData : undefined,
      splitArea: {
        show: props.showGrid,
      },
    },
    visualMap: props.showVisualMap ? {
      min: valueRange.value.min,
      max: valueRange.value.max,
      calculable: true,
      orient: props.visualMapOrientation,
      [props.visualMapPosition]: 10,
      inRange: {
        color: props.colors,
      },
      textStyle: {
        color: '#d8d9da',
      },
    } : undefined,
    tooltip: props.showTooltip ? {
      position: 'top',
      formatter: props.tooltipFormatter || ((params: any) => {
        const data = params.data || [];
        const xLabel = props.xAxisType === 'time' 
          ? new Date(data[0]).toLocaleString()
          : data[0];
        const yLabel = data[1];
        const value = data[2];
        return `${xLabel}<br/>${yLabel}: <strong>${value}</strong>`;
      }),
    } : undefined,
    series: [
      {
        type: 'heatmap',
        data: normalizedData.value,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        itemStyle: props.cellSize ? {
          borderWidth: 1,
          borderColor: '#1f1f24',
        } : undefined,
      },
    ],
  };

  const merged = mergeChartOptions(baseConfig, customConfig);
  return props.customOptions ? mergeChartOptions(merged, props.customOptions) : merged;
});

/**
 * Watch data changes and update chart
 */
watch(
  () => [props.data, props.structuredData, props.xAxisData, props.yAxisData],
  () => {
    if (chartRef.value) {
      chartRef.value.setOption(chartOption.value);
    }
  },
  { deep: true }
);

/**
 * Event handlers
 */
const handleClick = (event: any) => {
  emit('click', event);
};

const handleDblclick = (event: any) => {
  emit('dblclick', event);
};

/**
 * Expose chart instance methods
 */
defineExpose({
  getChartInstance: () => chartRef.value?.getChartInstance(),
  resize: () => chartRef.value?.resize(),
  clear: () => chartRef.value?.clear(),
  setOption: (option: EChartsOption, opts?: any) => chartRef.value?.setOption(option, opts),
  showLoading: () => chartRef.value?.showLoading(),
  hideLoading: () => chartRef.value?.hideLoading(),
});
</script>

<style scoped lang="scss">
/* Heatmap-specific styles if needed */
</style>
