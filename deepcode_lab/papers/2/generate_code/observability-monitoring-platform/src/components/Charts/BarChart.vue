<template>
  <div class="bar-chart-wrapper">
    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" :height="height" />

    <!-- Error State -->
    <ErrorState
      v-else-if="hasError"
      title="Chart Error"
      :description="error?.message || 'Failed to render chart'"
      severity="error"
      show-retry-button
      @retry="initChart"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      icon-type="no-data"
      title="No Data Available"
      description="No data points to display in this chart"
    />

    <!-- Chart Container -->
    <div v-else ref="chartRef" class="bar-chart-container" :style="{ height }"></div>
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

interface BarChartProps {
  data?: TimeSeries | TimeSeries[]
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  animation?: boolean
  responsive?: boolean
  height?: string | number
  maxDataPoints?: number
  barWidth?: string | number
  barGap?: string | number
  barCategoryGap?: string | number
  stacked?: boolean
  horizontal?: boolean
}

const props = withDefaults(defineProps<BarChartProps>(), {
  loading: false,
  error: null,
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  animation: true,
  responsive: true,
  height: '400px',
  maxDataPoints: 1000,
  barWidth: '60%',
  barGap: '30%',
  barCategoryGap: '20%',
  stacked: false,
  horizontal: false
})

// Refs
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// Composables
const { getChartOptions, getColor } = useChartTheme()

// Computed properties
const hasError = computed(() => props.error !== null && props.error !== undefined)
const isEmpty = computed(() => {
  if (!props.data) return true
  const dataArray = Array.isArray(props.data) ? props.data : [props.data]
  return dataArray.length === 0 || dataArray.every(ts => !ts.dataPoints || ts.dataPoints.length === 0)
})

// Methods
const aggregateTimeSeries = (points: MetricPoint[], maxPoints: number = 500): MetricPoint[] => {
  if (points.length <= maxPoints) return points

  const bucketSize = Math.ceil(points.length / maxPoints)
  const aggregated: MetricPoint[] = []

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, i + bucketSize)
    const values = bucket.map(p => p.value)
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)

    aggregated.push({
      timestamp: bucket[0].timestamp,
      value: avgValue,
      min: minValue,
      max: maxValue
    })
  }

  return aggregated
}

const initChart = () => {
  if (!chartRef.value) return

  try {
    // Initialize or get existing chart instance
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value, null, { renderer: 'canvas' })
    }

    // Prepare data
    const dataArray = Array.isArray(props.data) ? props.data : props.data ? [props.data] : []

    if (dataArray.length === 0) {
      chartInstance.setOption({ series: [] })
      return
    }

    // Process data for bar chart
    let categories: string[] = []
    const seriesData: any[] = []

    if (props.horizontal) {
      // Horizontal bar chart - categories on Y-axis
      // Use metric names as categories
      categories = dataArray.map((ts, idx) => ts.metricName || `Series ${idx + 1}`)

      // Create series with values
      dataArray.forEach((ts, idx) => {
        const value = ts.dataPoints && ts.dataPoints.length > 0
          ? ts.dataPoints[ts.dataPoints.length - 1].value
          : 0

        seriesData.push({
          name: ts.metricName || `Series ${idx + 1}`,
          value: value,
          itemStyle: {
            color: getColor(idx)
          }
        })
      })
    } else {
      // Vertical bar chart - categories on X-axis
      // Use timestamps or metric names as categories
      if (dataArray[0].dataPoints && dataArray[0].dataPoints.length > 0) {
        // Time-series bar chart
        const points = aggregateTimeSeries(dataArray[0].dataPoints, props.maxDataPoints)
        categories = points.map(p => {
          const date = new Date(p.timestamp)
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        })

        dataArray.forEach((ts, idx) => {
          const points = aggregateTimeSeries(ts.dataPoints || [], props.maxDataPoints)
          seriesData.push({
            name: ts.metricName || `Series ${idx + 1}`,
            type: 'bar',
            data: points.map(p => p.value),
            itemStyle: {
              color: getColor(idx)
            },
            stack: props.stacked ? 'total' : undefined,
            barWidth: props.barWidth,
            barGap: props.barGap
          })
        })
      } else {
        // Category bar chart (no time-series)
        categories = dataArray.map((ts, idx) => ts.metricName || `Series ${idx + 1}`)
        dataArray.forEach((ts, idx) => {
          seriesData.push({
            name: ts.metricName || `Series ${idx + 1}`,
            type: 'bar',
            data: [ts.dataPoints && ts.dataPoints.length > 0 ? ts.dataPoints[0].value : 0],
            itemStyle: {
              color: getColor(idx)
            },
            stack: props.stacked ? 'total' : undefined,
            barWidth: props.barWidth,
            barGap: props.barGap
          })
        })
      }
    }

    // Build chart options
    const baseOptions = {
      title: props.config?.title ? {
        text: props.config.title,
        left: 'center',
        textStyle: {
          color: '#d8d9da',
          fontSize: 14,
          fontWeight: 500
        }
      } : undefined,
      tooltip: props.showTooltip ? {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: {
          color: '#d8d9da'
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) params = [params]
          let result = `<div style="padding: 8px;">`
          params.forEach((param: any) => {
            result += `<div style="color: ${param.color}; margin-bottom: 4px;">${param.seriesName}: <strong>${param.value}</strong></div>`
          })
          result += `</div>`
          return result
        }
      } : undefined,
      legend: props.showLegend ? {
        data: dataArray.map((ts, idx) => ts.metricName || `Series ${idx + 1}`),
        bottom: 10,
        textStyle: {
          color: '#d8d9da'
        }
      } : undefined,
      grid: props.showGrid ? {
        left: '60px',
        right: '20px',
        top: props.config?.title ? '60px' : '20px',
        bottom: props.showLegend ? '60px' : '20px',
        containLabel: true
      } : undefined,
      xAxis: props.horizontal ? {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#d8d9da' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
      } : {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#d8d9da', rotate: categories.length > 10 ? 45 : 0 },
        splitLine: { show: false }
      },
      yAxis: props.horizontal ? {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#d8d9da' },
        splitLine: { show: false }
      } : {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#d8d9da' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
      },
      series: seriesData,
      animation: props.animation,
      animationDuration: 500,
      animationEasing: 'cubicOut'
    }

    // Apply theme and set options
    const options = getChartOptions(baseOptions)
    chartInstance.setOption(options)

    // Handle window resize
    if (props.responsive) {
      const handleResize = () => {
        chartInstance?.resize()
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  } catch (err) {
    console.error('Error initializing bar chart:', err)
  }
}

// Watchers
watch(() => props.data, () => {
  initChart()
}, { deep: true })

watch(() => props.config, () => {
  initChart()
}, { deep: true })

watch(() => props.loading, (newVal) => {
  if (!newVal) {
    initChart()
  }
})

// Lifecycle
onMounted(() => {
  if (!props.loading && !isEmpty.value) {
    initChart()
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.bar-chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.bar-chart-container {
  width: 100%;
  min-height: 300px;
  background-color: $color-bg-secondary;
  border-radius: 4px;
  border: 1px solid $color-border;
}
</style>
