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
    @click="handleClick"
    @dblclick="handleDblClick"
    @legendselectchanged="handleLegendChange"
    @datazoom="handleDataZoom"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { createBarChartConfig, mergeChartOptions } from '@/utils/chart'
import type { TimeSeries, ChartConfig } from '@/types'
import type { MetricTimeSeries } from '@/types/metrics'

/**
 * BarChart Component
 * 
 * Specialized chart component for rendering bar charts with support for:
 * - Vertical and horizontal orientations
 * - Stacked bars for multi-series comparison
 * - Grouped bars for side-by-side comparison
 * - Custom bar width and gap settings
 * - Interactive tooltips and legends
 * 
 * @example
 * <BarChart
 *   :data="serviceMetrics"
 *   :config="{ title: 'Service Comparison' }"
 *   :stacked="true"
 *   :showValues="true"
 * />
 */

interface Props {
  // Data props
  data?: TimeSeries[]
  metricData?: MetricTimeSeries[]
  config?: Partial<ChartConfig>
  
  // Dimension props
  width?: string
  height?: string
  
  // Bar-specific props
  orientation?: 'vertical' | 'horizontal'
  stacked?: boolean
  barWidth?: string | number
  barGap?: string
  barCategoryGap?: string
  showValues?: boolean
  valuePosition?: 'top' | 'inside' | 'insideTop' | 'insideBottom' | 'insideLeft' | 'insideRight'
  
  // Visual props
  showGrid?: boolean
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  showTooltip?: boolean
  showDataZoom?: boolean
  dataZoomType?: 'slider' | 'inside' | 'both'
  
  // Axis props
  xAxisName?: string
  yAxisName?: string
  yAxisUnit?: string
  xAxisType?: 'category' | 'value' | 'time'
  yAxisType?: 'category' | 'value'
  
  // State props
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  lazyLoad?: boolean
  
  // Advanced customization
  customOptions?: Partial<EChartsOption>
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '300px',
  orientation: 'vertical',
  stacked: false,
  barGap: '30%',
  barCategoryGap: '20%',
  showValues: false,
  valuePosition: 'top',
  showGrid: true,
  showLegend: true,
  legendPosition: 'top',
  showTooltip: true,
  showDataZoom: false,
  dataZoomType: 'slider',
  xAxisType: 'category',
  yAxisType: 'value',
  loading: false,
  error: null,
  isEmpty: false,
  lazyLoad: false
})

interface Emits {
  (e: 'click', event: any): void
  (e: 'dblclick', event: any): void
  (e: 'legendChange', event: any): void
  (e: 'dataZoom', event: any): void
}

const emit = defineEmits<Emits>()

// Refs
const chartRef = ref<InstanceType<typeof BaseChart>>()

// Normalize metric data to TimeSeries format
const normalizedData = computed<TimeSeries[]>(() => {
  if (props.data) {
    return props.data
  }
  
  if (props.metricData) {
    return props.metricData.map(metric => ({
      name: metric.name,
      data: metric.dataPoints.map(point => ({
        timestamp: point.timestamp,
        value: point.value
      })),
      unit: metric.unit,
      color: metric.color
    }))
  }
  
  return []
})

// Build chart configuration
const chartOption = computed<EChartsOption>(() => {
  // Base configuration from utility
  const baseConfig = createBarChartConfig(normalizedData.value, {
    title: props.config?.title,
    showLegend: props.showLegend,
    showGrid: props.showGrid,
    showTooltip: props.showTooltip,
    stacked: props.stacked,
    orientation: props.orientation
  })
  
  // Apply component-specific customizations
  const customConfig: Partial<EChartsOption> = {
    legend: props.showLegend ? {
      show: true,
      [props.legendPosition]: props.legendPosition === 'top' || props.legendPosition === 'bottom' ? 10 : 20,
      orient: props.legendPosition === 'left' || props.legendPosition === 'right' ? 'vertical' : 'horizontal'
    } : { show: false },
    
    xAxis: props.orientation === 'vertical' ? {
      type: props.xAxisType,
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        rotate: props.xAxisType === 'category' ? 0 : undefined
      }
    } : {
      type: props.yAxisType,
      name: props.yAxisName,
      axisLabel: {
        formatter: props.yAxisUnit ? `{value} ${props.yAxisUnit}` : '{value}'
      }
    },
    
    yAxis: props.orientation === 'vertical' ? {
      type: props.yAxisType,
      name: props.yAxisName,
      axisLabel: {
        formatter: props.yAxisUnit ? `{value} ${props.yAxisUnit}` : '{value}'
      }
    } : {
      type: props.xAxisType,
      name: props.xAxisName
    },
    
    series: normalizedData.value.map((series, index) => ({
      name: series.name,
      type: 'bar',
      data: props.xAxisType === 'time' 
        ? series.data.map(d => [d.timestamp, d.value])
        : series.data.map(d => d.value),
      stack: props.stacked ? 'total' : undefined,
      barWidth: props.barWidth,
      barGap: props.barGap,
      barCategoryGap: props.barCategoryGap,
      label: props.showValues ? {
        show: true,
        position: props.valuePosition,
        formatter: props.yAxisUnit ? `{c} ${props.yAxisUnit}` : '{c}'
      } : undefined,
      itemStyle: {
        color: series.color
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }))
  }
  
  // Add data zoom if enabled
  if (props.showDataZoom) {
    const dataZoomAxis = props.orientation === 'vertical' ? 'xAxis' : 'yAxis'
    customConfig.dataZoom = []
    
    if (props.dataZoomType === 'slider' || props.dataZoomType === 'both') {
      customConfig.dataZoom.push({
        type: 'slider',
        [dataZoomAxis + 'Index']: 0,
        start: 0,
        end: 100,
        height: 20,
        bottom: 10
      })
    }
    
    if (props.dataZoomType === 'inside' || props.dataZoomType === 'both') {
      customConfig.dataZoom.push({
        type: 'inside',
        [dataZoomAxis + 'Index']: 0,
        start: 0,
        end: 100
      })
    }
  }
  
  // Merge all configurations
  let finalConfig = mergeChartOptions(baseConfig, customConfig)
  
  if (props.customOptions) {
    finalConfig = mergeChartOptions(finalConfig, props.customOptions)
  }
  
  return finalConfig
})

// Event handlers
const handleClick = (event: any) => {
  emit('click', event)
}

const handleDblClick = (event: any) => {
  emit('dblclick', event)
}

const handleLegendChange = (event: any) => {
  emit('legendChange', event)
}

const handleDataZoom = (event: any) => {
  emit('dataZoom', event)
}

// Watch for data changes
watch(
  () => [props.data, props.metricData],
  () => {
    // Chart will auto-update via computed chartOption
  },
  { deep: true }
)

// Expose chart instance methods
defineExpose({
  getChartInstance: () => chartRef.value?.getChartInstance(),
  resize: () => chartRef.value?.resize(),
  clear: () => chartRef.value?.clear(),
  setOption: (option: EChartsOption, opts?: any) => chartRef.value?.setOption(option, opts),
  showLoading: () => chartRef.value?.showLoading(),
  hideLoading: () => chartRef.value?.hideLoading()
})
</script>

<style scoped lang="scss">
/* BarChart-specific styles if needed */
</style>
