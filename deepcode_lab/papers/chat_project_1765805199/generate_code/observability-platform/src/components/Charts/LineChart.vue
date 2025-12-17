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
    v-bind="$attrs"
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
import { createLineChartConfig, mergeChartOptions } from '@/utils/chart'
import type { TimeSeries, ChartConfig } from '@/types'
import type { MetricTimeSeries } from '@/types/metrics'

/**
 * LineChart Component
 * 
 * Specialized line chart component for time-series data visualization
 * with support for smooth curves, area fills, and multiple series.
 * 
 * Features:
 * - Smooth/stepped line rendering
 * - Optional area fill
 * - Multi-series support
 * - Data zoom for time range selection
 * - Legend with series toggle
 * - Responsive tooltip with time formatting
 */

interface Props {
  // Data
  data?: TimeSeries[]
  metricData?: MetricTimeSeries[]
  
  // Chart configuration
  config?: Partial<ChartConfig>
  
  // Dimensions
  width?: string
  height?: string
  
  // Line style
  smooth?: boolean
  showArea?: boolean
  areaOpacity?: number
  lineWidth?: number
  
  // Points
  showSymbol?: boolean
  symbolSize?: number
  
  // Grid
  showGrid?: boolean
  
  // Legend
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  
  // Tooltip
  showTooltip?: boolean
  
  // Data zoom
  showDataZoom?: boolean
  dataZoomType?: 'slider' | 'inside' | 'both'
  
  // Axis
  xAxisType?: 'time' | 'category' | 'value'
  yAxisName?: string
  yAxisUnit?: string
  
  // States
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  lazyLoad?: boolean
  
  // Custom options
  customOptions?: Partial<EChartsOption>
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  metricData: () => [],
  width: '100%',
  height: '300px',
  smooth: true,
  showArea: false,
  areaOpacity: 0.3,
  lineWidth: 2,
  showSymbol: false,
  symbolSize: 4,
  showGrid: true,
  showLegend: true,
  legendPosition: 'top',
  showTooltip: true,
  showDataZoom: false,
  dataZoomType: 'slider',
  xAxisType: 'time',
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

// Chart reference
const chartRef = ref<InstanceType<typeof BaseChart>>()

// Convert metric data to time series format
const normalizedData = computed<TimeSeries[]>(() => {
  if (props.metricData.length > 0) {
    return props.metricData.map(metric => ({
      name: metric.metric,
      data: metric.dataPoints.map(point => ({
        timestamp: point.timestamp,
        value: point.value
      })),
      unit: metric.unit,
      color: undefined
    }))
  }
  return props.data
})

// Generate chart configuration
const chartOption = computed<EChartsOption>(() => {
  // Base configuration from utility
  const baseConfig = createLineChartConfig(normalizedData.value, {
    title: props.config?.title,
    showLegend: props.showLegend,
    showGrid: props.showGrid,
    showTooltip: props.showTooltip,
    height: props.height,
    smooth: props.smooth,
    showArea: props.showArea,
    areaOpacity: props.areaOpacity,
    yAxisName: props.yAxisName,
    yAxisUnit: props.yAxisUnit
  })

  // Customize series options
  if (baseConfig.series && Array.isArray(baseConfig.series)) {
    baseConfig.series = baseConfig.series.map((series: any) => ({
      ...series,
      lineStyle: {
        ...series.lineStyle,
        width: props.lineWidth
      },
      showSymbol: props.showSymbol,
      symbolSize: props.symbolSize,
      smooth: props.smooth
    }))
  }

  // Add data zoom if enabled
  if (props.showDataZoom) {
    const dataZoomConfig: any[] = []
    
    if (props.dataZoomType === 'slider' || props.dataZoomType === 'both') {
      dataZoomConfig.push({
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
        borderColor: '#404449',
        fillerColor: 'rgba(50, 116, 217, 0.2)',
        handleStyle: {
          color: '#3274d9'
        },
        textStyle: {
          color: '#9fa7b3'
        }
      })
    }
    
    if (props.dataZoomType === 'inside' || props.dataZoomType === 'both') {
      dataZoomConfig.push({
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      })
    }
    
    baseConfig.dataZoom = dataZoomConfig
  }

  // Customize legend position
  if (baseConfig.legend && props.showLegend) {
    const legendConfig: any = {
      ...baseConfig.legend,
      [props.legendPosition]: props.legendPosition === 'top' || props.legendPosition === 'bottom' ? 10 : 20
    }
    
    // Remove conflicting position properties
    if (props.legendPosition === 'top' || props.legendPosition === 'bottom') {
      delete legendConfig.left
      delete legendConfig.right
    } else {
      delete legendConfig.top
      delete legendConfig.bottom
    }
    
    baseConfig.legend = legendConfig
  }

  // Customize x-axis type
  if (baseConfig.xAxis && !Array.isArray(baseConfig.xAxis)) {
    baseConfig.xAxis.type = props.xAxisType
  }

  // Merge with custom options
  if (props.customOptions) {
    return mergeChartOptions(baseConfig, props.customOptions)
  }

  return baseConfig
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
    // Chart will auto-update through reactive option
  },
  { deep: true }
)

// Expose chart methods
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
/* LineChart specific styles if needed */
</style>
