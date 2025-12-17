<template>
  <div class="heatmap-chart-container">
    <LoadingSkeleton v-if="loading" :count="5" :height="20" />
    <ErrorState
      v-else-if="hasError"
      title="Failed to load heatmap"
      :error-code="error?.message"
      @retry="$emit('retry')"
    />
    <EmptyState
      v-else-if="isEmpty"
      icon-type="no-data"
      title="No data available"
      description="No heatmap data available for the selected time range"
    />
    <div v-else ref="chartContainer" class="heatmap-chart" :style="{ height: chartHeight }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, withDefaults, defineProps, defineEmits } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import ErrorState from '@/components/Common/ErrorState.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import type { TimeSeries, MetricPoint } from '@/types'

interface Props {
  data?: TimeSeries | TimeSeries[]
  config?: {
    title?: string
    unit?: string
    colors?: string[]
    bucketSizeMinutes?: number
    showLegend?: boolean
    showTooltip?: boolean
  }
  loading?: boolean
  error?: Error | null
  height?: string | number
  responsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  height: '400px',
  responsive: true
})

const emit = defineEmits<{
  retry: []
}>()

const chartContainer = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const { getChartOptions } = useChartTheme()

const chartHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})

const hasError = computed(() => props.error !== null)
const isEmpty = computed(() => !props.data || (Array.isArray(props.data) && props.data.length === 0))

// Transform time-series data to heatmap format
const heatmapData = computed(() => {
  if (!props.data) return []

  const series = Array.isArray(props.data) ? props.data : [props.data]
  const bucketSizeMs = (props.config?.bucketSizeMinutes || 60) * 60 * 1000

  const heatmapPoints: [number, number, number][] = []
  const yAxisData: string[] = []

  series.forEach((timeSeries, seriesIndex) => {
    if (!yAxisData.includes(timeSeries.metricName)) {
      yAxisData.push(timeSeries.metricName)
    }

    const yIndex = yAxisData.indexOf(timeSeries.metricName)

    // Group points into time buckets
    const buckets = new Map<number, number[]>()

    timeSeries.dataPoints.forEach((point: MetricPoint) => {
      const timestamp = new Date(point.timestamp).getTime()
      const bucketKey = Math.floor(timestamp / bucketSizeMs) * bucketSizeMs
      const bucketIndex = Math.floor(bucketKey / bucketSizeMs)

      if (!buckets.has(bucketIndex)) {
        buckets.set(bucketIndex, [])
      }
      buckets.get(bucketIndex)!.push(point.value)
    })

    // Calculate average per bucket
    buckets.forEach((values, bucketIndex) => {
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length
      heatmapPoints.push([bucketIndex, yIndex, Math.round(avgValue * 100) / 100])
    })
  })

  return { points: heatmapPoints, yAxisData }
})

// Generate heatmap chart options
const chartOptions = computed<EChartsOption>(() => {
  const { points, yAxisData } = heatmapData.value

  if (points.length === 0) {
    return {}
  }

  // Find min/max for color scaling
  const values = points.map(p => p[2])
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  // Generate x-axis labels (time buckets)
  const xAxisData = Array.from(
    { length: Math.max(...points.map(p => p[0])) + 1 },
    (_, i) => {
      const hours = Math.floor((i * (props.config?.bucketSizeMinutes || 60)) / 60)
      const minutes = (i * (props.config?.bucketSizeMinutes || 60)) % 60
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  )

  const baseOptions: EChartsOption = {
    title: {
      text: props.config?.title || 'Heatmap',
      left: 'center',
      textStyle: {
        color: 'var(--color-text-primary)',
        fontSize: 14,
        fontWeight: 500
      }
    },
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        if (Array.isArray(params)) {
          params = params[0]
        }
        const [xIndex, yIndex, value] = params.value
        return `${yAxisData[yIndex]}<br/>${xAxisData[xIndex]}<br/>Value: ${value}${props.config?.unit || ''}`
      }
    },
    grid: {
      height: '70%',
      top: '15%',
      left: '15%',
      right: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
        }
      },
      axisLabel: {
        color: 'var(--color-text-secondary)',
        fontSize: 12
      },
      axisLine: {
        lineStyle: {
          color: 'var(--color-border)'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
      axisLabel: {
        color: 'var(--color-text-secondary)',
        fontSize: 12
      },
      axisLine: {
        lineStyle: {
          color: 'var(--color-border)'
        }
      }
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: 'vertical',
      right: '2%',
      top: 'center',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      },
      textStyle: {
        color: 'var(--color-text-secondary)'
      }
    },
    series: [
      {
        name: 'Heatmap',
        type: 'heatmap',
        data: points,
        emphasis: {
          itemStyle: {
            borderColor: 'var(--color-primary)',
            borderWidth: 2
          }
        },
        progressive: 1000,
        animation: true,
        animationDuration: 300
      }
    ]
  }

  return getChartOptions(baseOptions)
})

// Initialize and manage chart
const initChart = () => {
  if (!chartContainer.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value, null, { renderer: 'canvas' })
  }

  chartInstance.setOption(chartOptions.value)
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

const disposeChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

// Lifecycle
onMounted(() => {
  initChart()

  if (props.responsive) {
    window.addEventListener('resize', resizeChart)
  }
})

onUnmounted(() => {
  if (props.responsive) {
    window.removeEventListener('resize', resizeChart)
  }
  disposeChart()
})

// Watch for data changes
watch(
  () => props.data,
  () => {
    initChart()
  },
  { deep: true }
)

// Watch for config changes
watch(
  () => props.config,
  () => {
    initChart()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.heatmap-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.heatmap-chart {
  width: 100%;
  min-height: 300px;
  background: var(--color-bg-secondary);
  border-radius: $border-radius-md;
  border: 1px solid var(--color-border);
}
</style>
