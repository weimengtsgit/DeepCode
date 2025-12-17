<template>
  <div class="gauge-chart-wrapper">
    <LoadingSkeleton v-if="loading" :height="height" :count="1" />
    <ErrorState
      v-else-if="hasError"
      title="Failed to load gauge chart"
      :error-code="error?.message"
      @retry="$emit('retry')"
    />
    <EmptyState
      v-else-if="isEmpty"
      icon-type="no-data"
      title="No data available"
      description="Unable to display gauge chart without data"
    />
    <div v-else ref="chartContainer" class="gauge-chart" :style="{ height }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import type { ChartConfig } from '@/types'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import ErrorState from '@/components/Common/ErrorState.vue'
import EmptyState from '@/components/Common/EmptyState.vue'

interface GaugeChartProps {
  value?: number
  min?: number
  max?: number
  unit?: string
  title?: string
  warningThreshold?: number
  criticalThreshold?: number
  loading?: boolean
  error?: Error | null
  height?: string | number
  config?: Partial<ChartConfig>
}

const props = withDefaults(defineProps<GaugeChartProps>(), {
  value: 0,
  min: 0,
  max: 100,
  unit: '%',
  title: 'Gauge',
  warningThreshold: 70,
  criticalThreshold: 90,
  loading: false,
  error: null,
  height: '300px',
  config: () => ({})
})

defineEmits<{
  retry: []
}>()

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const { getChartOptions } = useChartTheme()

const hasError = computed(() => props.error !== null)
const isEmpty = computed(() => props.value === undefined || props.value === null)

// Determine status color based on thresholds
const statusColor = computed(() => {
  if (props.value >= props.criticalThreshold) {
    return '#f2495c' // red
  } else if (props.value >= props.warningThreshold) {
    return '#ff9830' // orange
  } else {
    return '#73bf69' // green
  }
})

// Calculate percentage for gauge
const percentage = computed(() => {
  const range = props.max - props.min
  if (range === 0) return 0
  return ((props.value - props.min) / range) * 100
})

// Generate gauge chart options
const chartOptions = computed<EChartsOption>(() => {
  const baseOptions: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 225,
        endAngle: -45,
        radius: '75%',
        center: ['50%', '50%'],
        min: props.min,
        max: props.max,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.3, '#73bf69'],
              [0.7, '#ff9830'],
              [1, '#f2495c']
            ]
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4
          }
        },
        axisLabel: {
          color: 'auto',
          distance: 40,
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          formatter: `{value}${props.unit}`,
          color: statusColor.value,
          fontSize: 24,
          fontWeight: 'bold'
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

  return getChartOptions(baseOptions)
})

// Initialize chart
const initChart = () => {
  if (!chartContainer.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value, null, {
      renderer: 'canvas',
      useDirtyRect: true
    })
  }

  chartInstance.setOption(chartOptions.value)

  // Handle window resize
  const handleResize = () => {
    chartInstance?.resize()
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    chartInstance?.dispose()
    chartInstance = null
  })
}

// Watch for data changes
watch(() => props.value, () => {
  if (chartInstance) {
    chartInstance.setOption(chartOptions.value)
  }
})

// Watch for config changes
watch(() => props.config, () => {
  if (chartInstance) {
    chartInstance.setOption(chartOptions.value)
  }
})

onMounted(() => {
  initChart()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.gauge-chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge-chart {
  width: 100%;
  min-height: 300px;
}
</style>
