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
    @legendselectchanged="handleLegendChange"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { createPieChartConfig, mergeChartOptions } from '@/utils/chart'
import type { ChartConfig } from '@/types'

/**
 * PieChart Component
 * 
 * Specialized chart component for rendering pie/donut charts with support for:
 * - Standard pie and donut (ring) modes
 * - Rose (nightingale) chart variant
 * - Percentage and value labels
 * - Interactive legend with selection
 * - Custom radius and center positioning
 * - Rich tooltip formatting
 * 
 * Use cases:
 * - Service distribution visualization
 * - Error type breakdown
 * - Status distribution (healthy/degraded/down)
 * - Resource allocation charts
 * - Log level distribution
 */

export interface PieChartDataItem {
  name: string
  value: number
  itemStyle?: {
    color?: string
    borderColor?: string
    borderWidth?: number
  }
}

interface Props {
  // Data
  data?: PieChartDataItem[]
  config?: Partial<ChartConfig>
  
  // Chart type
  chartType?: 'pie' | 'donut' | 'rose' // rose = nightingale chart
  
  // Dimensions
  width?: string
  height?: string
  
  // Radius configuration
  radius?: string | [string, string] // Single value for pie, [inner, outer] for donut
  innerRadius?: string // Shortcut for donut inner radius (default: '50%')
  outerRadius?: string // Shortcut for outer radius (default: '70%')
  
  // Position
  center?: [string, string] // [x, y] position (default: ['50%', '50%'])
  
  // Labels
  showLabels?: boolean // Show data labels
  labelPosition?: 'outside' | 'inside' | 'center' // Label position
  showLabelLine?: boolean // Show label connection lines
  labelFormat?: 'name' | 'value' | 'percent' | 'name-value' | 'name-percent' // Label content format
  
  // Legend
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  legendOrient?: 'horizontal' | 'vertical'
  
  // Tooltip
  showTooltip?: boolean
  tooltipFormat?: 'default' | 'percent' // Tooltip content format
  
  // Visual
  minAngle?: number // Minimum angle for small slices (default: 0)
  padAngle?: number // Padding angle between slices
  borderRadius?: number | string // Slice border radius
  borderWidth?: number // Slice border width
  borderColor?: string // Slice border color
  
  // Interaction
  selectedMode?: boolean | 'single' | 'multiple' // Enable slice selection
  selectedOffset?: number // Offset distance for selected slice (default: 10)
  
  // Animation
  animationType?: 'expansion' | 'scale' // Animation type
  animationDuration?: number
  
  // State
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  lazyLoad?: boolean
  
  // Advanced
  customOptions?: Partial<EChartsOption>
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '300px',
  chartType: 'pie',
  innerRadius: '50%',
  outerRadius: '70%',
  center: () => ['50%', '50%'],
  showLabels: true,
  labelPosition: 'outside',
  showLabelLine: true,
  labelFormat: 'name-percent',
  showLegend: true,
  legendPosition: 'bottom',
  legendOrient: 'horizontal',
  showTooltip: true,
  tooltipFormat: 'default',
  minAngle: 0,
  borderWidth: 0,
  borderColor: '#fff',
  selectedMode: false,
  selectedOffset: 10,
  animationType: 'expansion',
  animationDuration: 300,
  loading: false,
  error: null,
  isEmpty: false,
  lazyLoad: false
})

interface Emits {
  (e: 'click', event: any): void
  (e: 'dblclick', event: any): void
  (e: 'legendChange', event: any): void
}

const emit = defineEmits<Emits>()

const chartRef = ref<InstanceType<typeof BaseChart>>()

// Compute radius based on chart type
const computedRadius = computed(() => {
  if (props.radius) {
    return props.radius
  }
  
  switch (props.chartType) {
    case 'donut':
      return [props.innerRadius, props.outerRadius]
    case 'rose':
      return [0, props.outerRadius]
    case 'pie':
    default:
      return [0, props.outerRadius]
  }
})

// Compute rose type
const roseType = computed(() => {
  return props.chartType === 'rose' ? 'radius' : false
})

// Format label content
const getLabelFormatter = () => {
  switch (props.labelFormat) {
    case 'name':
      return '{b}'
    case 'value':
      return '{c}'
    case 'percent':
      return '{d}%'
    case 'name-value':
      return '{b}: {c}'
    case 'name-percent':
    default:
      return '{b}: {d}%'
  }
}

// Format tooltip content
const getTooltipFormatter = () => {
  if (props.tooltipFormat === 'percent') {
    return (params: any) => {
      const { name, value, percent } = params
      return `${name}<br/>数量: ${value}<br/>占比: ${percent}%`
    }
  }
  return undefined // Use default formatter
}

// Build chart option
const chartOption = computed<EChartsOption>(() => {
  const baseConfig: Partial<ChartConfig> = {
    title: props.config?.title,
    showLegend: props.showLegend,
    showTooltip: props.showTooltip,
    ...props.config
  }
  
  const baseOption = createPieChartConfig(
    props.data || [],
    {
      ...baseConfig,
      radius: computedRadius.value,
      center: props.center,
      roseType: roseType.value
    }
  )
  
  // Customize series configuration
  const customSeriesConfig: any = {
    label: {
      show: props.showLabels,
      position: props.labelPosition,
      formatter: getLabelFormatter()
    },
    labelLine: {
      show: props.showLabelLine && props.labelPosition === 'outside'
    },
    itemStyle: {
      borderRadius: props.borderRadius,
      borderWidth: props.borderWidth,
      borderColor: props.borderColor
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    minAngle: props.minAngle,
    padAngle: props.padAngle,
    selectedMode: props.selectedMode,
    selectedOffset: props.selectedOffset,
    animationType: props.animationType,
    animationDuration: props.animationDuration
  }
  
  // Merge custom series config
  const mergedOption = mergeChartOptions(baseOption, {
    series: [customSeriesConfig]
  })
  
  // Customize tooltip
  if (mergedOption.tooltip && typeof mergedOption.tooltip === 'object') {
    const formatter = getTooltipFormatter()
    if (formatter) {
      mergedOption.tooltip.formatter = formatter
    }
  }
  
  // Customize legend
  if (mergedOption.legend && typeof mergedOption.legend === 'object') {
    mergedOption.legend = {
      ...mergedOption.legend,
      orient: props.legendOrient,
      [props.legendPosition]: props.legendPosition === 'left' || props.legendPosition === 'right' ? 10 : 0,
      [props.legendPosition === 'top' || props.legendPosition === 'bottom' ? 'left' : 'top']: 
        props.legendPosition === 'left' || props.legendPosition === 'right' ? 0 : 'center'
    }
  }
  
  // Apply custom options
  if (props.customOptions) {
    return mergeChartOptions(mergedOption, props.customOptions)
  }
  
  return mergedOption
})

// Watch data changes
watch(
  () => props.data,
  () => {
    // Chart will auto-update via chartOption computed property
  },
  { deep: true }
)

// Event handlers
const handleClick = (event: any) => {
  emit('click', event)
}

const handleDblclick = (event: any) => {
  emit('dblclick', event)
}

const handleLegendChange = (event: any) => {
  emit('legendChange', event)
}

// Expose methods
const getChartInstance = () => {
  return chartRef.value?.getChartInstance()
}

const resize = () => {
  chartRef.value?.resize()
}

const clear = () => {
  chartRef.value?.clear()
}

const setOption = (option: EChartsOption, opts?: any) => {
  chartRef.value?.setOption(option, opts)
}

const showLoading = () => {
  chartRef.value?.showLoading()
}

const hideLoading = () => {
  chartRef.value?.hideLoading()
}

defineExpose({
  getChartInstance,
  resize,
  clear,
  setOption,
  showLoading,
  hideLoading
})
</script>

<style scoped lang="scss">
/* PieChart specific styles if needed */
</style>
