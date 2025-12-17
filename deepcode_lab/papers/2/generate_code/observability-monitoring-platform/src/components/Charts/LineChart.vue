<template>
  <div class="line-chart-wrapper">
    <div v-if="loading" class="chart-loading">
      <LoadingSkeleton />
    </div>
    <div v-else-if="hasError" class="chart-error">
      <ErrorState
        title="Chart Rendering Failed"
        :description="error?.message || 'Unable to render chart'"
        :show-retry-button="true"
        @retry="initChart"
      />
    </div>
    <div v-else-if="isEmpty" class="chart-empty">
      <EmptyState
        icon-type="no-data"
        title="No Data Available"
        description="No data points to display for the selected time range"
      />
    </div>
    <div v-else ref="chartContainer" class="chart-container"></div>
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

interface LineChartProps {
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
}

const props = withDefaults(defineProps<LineChartProps>(), {
  loading: false,
  error: null,
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  animation: true,
  responsive: true,
  height: '400px',
  maxDataPoints: 1000
})

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const { getChartOptions, getColor, getStatusColor } = useChartTheme()

const hasError = computed(() => props.error !== null)
const isEmpty = computed(() => {
  if (!props.data) return true
  const dataArray = Array.isArray(props.data) ? props.data : [props.data]
  return dataArray.every(series => !series.dataPoints || series.dataPoints.length === 0)
})

/**
 * Aggregate time-series data using LTTB algorithm if exceeds maxDataPoints
 * Preserves visual patterns while reducing point count for performance
 */
function aggregateTimeSeries(points: MetricPoint[], maxPoints: number): MetricPoint[] {
  if (points.length <= maxPoints) return points

  const bucketSize = Math.ceil(points.length / maxPoints)
  const aggregated: MetricPoint[] = []

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, Math.min(i + bucketSize, points.length))
    if (bucket.length === 0) continue

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

/**
 * Initialize or update ECharts instance with current data and theme
 */
function initChart() {
  if (!chartContainer.value) return

  try {
    // Create or reuse chart instance
    if (!chartInstance) {
      chartInstance = echarts.init(chartContainer.value, null, { renderer: 'canvas' })
    }

    const dataArray = Array.isArray(props.data) ? props.data : props.data ? [props.data] : []

    // Build series array from data
    const series = dataArray.map((timeSeries, index) => {
      const aggregated = aggregateTimeSeries(timeSeries.dataPoints, props.maxDataPoints)
      const values = aggregated.map(p => p.value)

      return {
        name: timeSeries.metricName,
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          color: getColor(index)
        },
        itemStyle: {
          color: getColor(index),
          borderColor: '#fff',
          borderWidth: 1
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: getColor(index) + '40' },
            { offset: 1, color: getColor(index) + '00' }
          ])
        },
        tooltip: {
          valueFormatter: (value: number) => {
            return `${value.toFixed(2)} ${timeSeries.unit || ''}`
          }
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 3
          }
        }
      }
    })

    // Build X-axis labels from timestamps
    const xAxisData = dataArray.length > 0
      ? aggregateTimeSeries(dataArray[0].dataPoints, props.maxDataPoints).map(p => {
          const date = new Date(p.timestamp)
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        })
      : []

    // Build complete ECharts option
    const option: echarts.EChartsOption = {
      animation: props.animation,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      color: Array.from({ length: 10 }, (_, i) => getColor(i)),
      tooltip: props.showTooltip ? {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#555',
        textStyle: {
          color: '#fff'
        }
      } : undefined,
      legend: props.showLegend ? {
        data: dataArray.map(d => d.metricName),
        top: 10,
        right: 10,
        textStyle: {
          color: '#d8d9da'
        }
      } : undefined,
      grid: props.showGrid ? {
        left: '60px',
        right: '20px',
        top: props.showLegend ? '60px' : '20px',
        bottom: '40px',
        containLabel: true
      } : undefined,
      xAxis: {
        type: 'category',
        data: xAxisData,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        axisLabel: {
          color: '#d8d9da',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: dataArray.length > 0 ? dataArray[0].unit : '',
        nameTextStyle: {
          color: '#d8d9da'
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        axisLabel: {
          color: '#d8d9da',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: series
    }

    // Apply theme and set option
    const themedOption = getChartOptions(option)
    chartInstance.setOption(themedOption)

    // Handle window resize
    const handleResize = () => {
      if (chartInstance) {
        chartInstance.resize()
      }
    }

    if (props.responsive) {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (props.responsive) {
        window.removeEventListener('resize', handleResize)
      }
    }
  } catch (err) {
    console.error('Error initializing chart:', err)
  }
}

/**
 * Handle data changes - update chart without reinitializing
 */
watch(
  () => props.data,
  () => {
    if (!props.loading && !props.error && !isEmpty.value) {
      initChart()
    }
  },
  { deep: true }
)

/**
 * Handle loading state changes
 */
watch(
  () => props.loading,
  (newLoading) => {
    if (!newLoading && !props.error && !isEmpty.value) {
      initChart()
    }
  }
)

/**
 * Initialize chart on mount
 */
onMounted(() => {
  if (!props.loading && !props.error && !isEmpty.value) {
    initChart()
  }
})

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.line-chart-wrapper {
  width: 100%;
  height: v-bind(height);
  position: relative;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  overflow: hidden;

  .chart-container {
    width: 100%;
    height: 100%;
  }

  .chart-loading,
  .chart-error,
  .chart-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .chart-loading {
    background-color: $color-bg-secondary;
  }

  .chart-error {
    background-color: $color-bg-secondary;
  }

  .chart-empty {
    background-color: $color-bg-secondary;
  }
}
</style>
