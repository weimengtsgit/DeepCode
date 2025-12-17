<template>
  <div class="pie-chart-container" :style="{ height: containerHeight }">
    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" :height="containerHeight" />

    <!-- Error State -->
    <ErrorState
      v-else-if="hasError"
      title="Chart Error"
      :description="error?.message || 'Failed to render pie chart'"
      severity="error"
      @retry="initChart"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      icon-type="no-data"
      title="No Data Available"
      description="No data points to display in pie chart"
    />

    <!-- Chart Container -->
    <div v-else ref="chartRef" class="chart-wrapper" :style="{ height: '100%' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, withDefaults, defineProps } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import { TimeSeries, MetricPoint, ChartConfig } from '@/types'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import ErrorState from '@/components/Common/ErrorState.vue'
import EmptyState from '@/components/Common/EmptyState.vue'

interface PieChartProps {
  data?: TimeSeries | TimeSeries[] | Record<string, number>
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  showLegend?: boolean
  showTooltip?: boolean
  animation?: boolean
  responsive?: boolean
  height?: string | number
  donutMode?: boolean
  radius?: string | number
  innerRadius?: string | number
  labelPosition?: 'inside' | 'outside'
  showPercentage?: boolean
  showValue?: boolean
}

const props = withDefaults(defineProps<PieChartProps>(), {
  loading: false,
  error: null,
  showLegend: true,
  showTooltip: true,
  animation: true,
  responsive: true,
  height: '400px',
  donutMode: false,
  radius: '70%',
  innerRadius: '0%',
  labelPosition: 'outside',
  showPercentage: true,
  showValue: true,
})

// Refs
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const resizeObserver = ref<ResizeObserver | null>(null)

// Composables
const { getChartOptions, getColor } = useChartTheme()

// Computed properties
const containerHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})

const hasError = computed(() => props.error !== null && props.error !== undefined)

const isEmpty = computed(() => {
  if (!props.data) return true
  if (Array.isArray(props.data)) {
    return props.data.length === 0 || props.data.every(ts => !ts.dataPoints || ts.dataPoints.length === 0)
  }
  if (typeof props.data === 'object' && !Array.isArray(props.data)) {
    return Object.keys(props.data).length === 0
  }
  return false
})

// Methods
const transformDataToPieFormat = (data: TimeSeries | TimeSeries[] | Record<string, number>) => {
  // Handle plain object (category -> value mapping)
  if (typeof data === 'object' && !Array.isArray(data) && !(data instanceof TimeSeries)) {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0,
    }))
  }

  // Handle single TimeSeries
  if (!Array.isArray(data)) {
    const ts = data as TimeSeries
    if (!ts.dataPoints || ts.dataPoints.length === 0) return []

    // Sum all values for pie chart
    const total = ts.dataPoints.reduce((sum, point) => sum + point.value, 0)
    return [
      {
        name: ts.metricName || 'Value',
        value: total,
      },
    ]
  }

  // Handle multiple TimeSeries (sum by metric name)
  const seriesMap = new Map<string, number>()
  data.forEach((ts) => {
    if (ts.dataPoints && ts.dataPoints.length > 0) {
      const total = ts.dataPoints.reduce((sum, point) => sum + point.value, 0)
      const name = ts.metricName || 'Unknown'
      seriesMap.set(name, (seriesMap.get(name) || 0) + total)
    }
  })

  return Array.from(seriesMap.entries()).map(([name, value]) => ({
    name,
    value,
  }))
}

const initChart = () => {
  if (!chartRef.value) return

  try {
    // Initialize chart instance if not exists
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value, null, { renderer: 'canvas' })
    }

    // Transform data
    const pieData = transformDataToPieFormat(props.data || {})
    if (pieData.length === 0) return

    // Calculate inner radius for donut mode
    const innerRadius = props.donutMode ? props.innerRadius : '0%'

    // Build chart options
    const baseOptions = {
      animation: props.animation,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        enabled: props.showTooltip,
        formatter: (params: any) => {
          if (!params.name) return ''
          const value = params.value || 0
          const percent = params.percent || 0
          let result = `<strong>${params.name}</strong><br/>`
          if (props.showValue) result += `Value: ${value.toLocaleString()}<br/>`
          if (props.showPercentage) result += `Percentage: ${percent}%`
          return result
        },
      },
      legend: {
        enabled: props.showLegend,
        orient: 'vertical' as const,
        right: 10,
        top: 'center' as const,
        textStyle: {
          color: '#d8d9da',
          fontSize: 12,
        },
        itemGap: 8,
      },
      series: [
        {
          name: props.config?.title || 'Distribution',
          type: 'pie',
          radius: [innerRadius, props.radius],
          center: ['40%', '50%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            position: props.labelPosition,
            formatter: (params: any) => {
              if (!props.showPercentage && !props.showValue) return params.name
              let result = params.name
              if (props.showValue) result += ` (${params.value})`
              if (props.showPercentage) result += ` ${params.percent}%`
              return result
            },
            color: '#d8d9da',
            fontSize: 11,
            distance: 5,
          },
          itemStyle: {
            borderColor: '#0b0c0e',
            borderWidth: 2,
          },
        },
      ],
    }

    // Apply theme
    const themeOptions = getChartOptions(baseOptions)

    // Set colors from palette
    const colors = Array.from({ length: pieData.length }, (_, i) => getColor(i))
    themeOptions.color = colors

    // Set options
    chartInstance.setOption(themeOptions, true)

    // Setup resize observer
    if (props.responsive && chartRef.value) {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect()
      }
      resizeObserver.value = new ResizeObserver(() => {
        chartInstance?.resize()
      })
      resizeObserver.value.observe(chartRef.value)
    }
  } catch (err) {
    console.error('Error initializing pie chart:', err)
  }
}

// Lifecycle hooks
onMounted(() => {
  if (!props.loading && !hasError.value && !isEmpty.value) {
    initChart()
  }
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// Watchers
watch(
  () => props.data,
  () => {
    if (!props.loading && !hasError.value && !isEmpty.value) {
      initChart()
    }
  },
  { deep: true }
)

watch(
  () => props.config,
  () => {
    if (!props.loading && !hasError.value && !isEmpty.value) {
      initChart()
    }
  },
  { deep: true }
)

watch(
  () => props.loading,
  (newLoading) => {
    if (!newLoading && !hasError.value && !isEmpty.value) {
      initChart()
    }
  }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.pie-chart-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $color-bg-secondary;
  border-radius: 8px;
  overflow: hidden;
  position: relative;

  .chart-wrapper {
    width: 100%;
    height: 100%;
  }
}
</style>
