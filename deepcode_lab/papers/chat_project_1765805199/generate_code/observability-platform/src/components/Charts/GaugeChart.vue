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
    @dblclick="handleDblclick"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { createGaugeConfig, mergeChartOptions } from '@/utils/chart'
import type { ChartConfig } from '@/types'

/**
 * GaugeChart Component
 * 
 * Specialized chart component for rendering gauge/speedometer visualizations
 * with threshold-based coloring for monitoring metrics like CPU, memory, etc.
 * 
 * Features:
 * - Single value display with min/max range
 * - Threshold-based color zones (success/warning/danger)
 * - Customizable gauge appearance (radius, angle, pointer)
 * - Progress bar style option
 * - Animated value transitions
 * 
 * @example
 * <GaugeChart
 *   :value="75"
 *   :min="0"
 *   :max="100"
 *   title="CPU Usage"
 *   unit="%"
 *   :thresholds="[
 *     { value: 60, color: '#73bf69' },
 *     { value: 80, color: '#ff9830' },
 *     { value: 100, color: '#f2495c' }
 *   ]"
 * />
 */

interface GaugeThreshold {
  value: number
  color: string
}

interface Props {
  // Data
  value?: number
  min?: number
  max?: number
  
  // Display
  title?: string
  unit?: string
  showTitle?: boolean
  showDetail?: boolean
  
  // Thresholds
  thresholds?: GaugeThreshold[]
  
  // Appearance
  radius?: string
  startAngle?: number
  endAngle?: number
  splitNumber?: number
  
  // Pointer
  showPointer?: boolean
  pointerLength?: string
  pointerWidth?: number
  
  // Progress style
  progressStyle?: boolean
  progressWidth?: number
  
  // Chart config
  config?: Partial<ChartConfig>
  width?: string
  height?: string
  
  // States
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  lazyLoad?: boolean
  
  // Advanced
  customOptions?: Partial<EChartsOption>
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  min: 0,
  max: 100,
  title: '',
  unit: '',
  showTitle: true,
  showDetail: true,
  thresholds: () => [
    { value: 60, color: '#73bf69' },  // Success (green)
    { value: 80, color: '#ff9830' },  // Warning (orange)
    { value: 100, color: '#f2495c' }  // Danger (red)
  ],
  radius: '75%',
  startAngle: 225,
  endAngle: -45,
  splitNumber: 10,
  showPointer: true,
  pointerLength: '60%',
  pointerWidth: 6,
  progressStyle: false,
  progressWidth: 10,
  width: '100%',
  height: '300px',
  loading: false,
  error: null,
  isEmpty: false,
  lazyLoad: false
})

const emit = defineEmits<{
  click: [event: any]
  dblclick: [event: any]
}>()

const chartRef = ref<InstanceType<typeof BaseChart>>()

/**
 * Computed chart option
 * Generates ECharts configuration for gauge chart
 */
const chartOption = computed<EChartsOption>(() => {
  // Base gauge configuration
  const baseConfig = createGaugeConfig(props.value, {
    title: props.title,
    min: props.min,
    max: props.max,
    unit: props.unit,
    thresholds: props.thresholds,
    ...props.config
  })

  // Custom gauge styling
  const customConfig: Partial<EChartsOption> = {
    series: [
      {
        type: 'gauge',
        radius: props.radius,
        startAngle: props.startAngle,
        endAngle: props.endAngle,
        splitNumber: props.splitNumber,
        
        // Axis line (outer ring)
        axisLine: {
          lineStyle: {
            width: props.progressStyle ? props.progressWidth : 10,
            color: props.thresholds.map((threshold, index) => {
              const prevValue = index === 0 ? props.min : props.thresholds[index - 1].value
              return [
                (threshold.value - props.min) / (props.max - props.min),
                threshold.color
              ]
            })
          }
        },
        
        // Pointer
        pointer: {
          show: props.showPointer && !props.progressStyle,
          length: props.pointerLength,
          width: props.pointerWidth,
          itemStyle: {
            color: 'auto'
          }
        },
        
        // Progress bar (for progress style)
        progress: {
          show: props.progressStyle,
          width: props.progressWidth,
          itemStyle: {
            color: 'auto'
          }
        },
        
        // Axis tick
        axisTick: {
          show: !props.progressStyle,
          distance: -10,
          length: 6,
          lineStyle: {
            color: '#6e7681',
            width: 1
          }
        },
        
        // Split line
        splitLine: {
          show: !props.progressStyle,
          distance: -15,
          length: 12,
          lineStyle: {
            color: '#6e7681',
            width: 2
          }
        },
        
        // Axis label
        axisLabel: {
          show: !props.progressStyle,
          distance: 20,
          color: '#9fa7b3',
          fontSize: 12,
          formatter: (value: number) => {
            if (props.unit === '%') {
              return value.toFixed(0)
            }
            return value.toFixed(1)
          }
        },
        
        // Anchor (center point)
        anchor: {
          show: props.showPointer && !props.progressStyle,
          showAbove: true,
          size: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#5794f2',
            color: '#181b1f'
          }
        },
        
        // Title
        title: {
          show: props.showTitle,
          offsetCenter: [0, props.progressStyle ? '0%' : '80%'],
          fontSize: 14,
          color: '#9fa7b3',
          fontWeight: 'normal'
        },
        
        // Detail (value display)
        detail: {
          show: props.showDetail,
          offsetCenter: [0, props.progressStyle ? '0%' : '40%'],
          fontSize: props.progressStyle ? 24 : 32,
          fontWeight: 'bold',
          color: 'auto',
          formatter: (value: number) => {
            const formattedValue = props.unit === '%' 
              ? value.toFixed(1) 
              : value.toFixed(2)
            return `${formattedValue}${props.unit}`
          }
        },
        
        data: [
          {
            value: props.value,
            name: props.title
          }
        ]
      }
    ]
  }

  // Merge configurations
  let finalConfig = mergeChartOptions(baseConfig, customConfig)
  
  if (props.customOptions) {
    finalConfig = mergeChartOptions(finalConfig, props.customOptions)
  }

  return finalConfig
})

/**
 * Watch for data changes and update chart
 */
watch(
  () => props.value,
  () => {
    if (chartRef.value) {
      chartRef.value.setOption(chartOption.value, { notMerge: false })
    }
  }
)

/**
 * Event handlers
 */
const handleClick = (event: any) => {
  emit('click', event)
}

const handleDblclick = (event: any) => {
  emit('dblclick', event)
}

/**
 * Expose chart methods
 */
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
/* Component-specific styles if needed */
</style>
