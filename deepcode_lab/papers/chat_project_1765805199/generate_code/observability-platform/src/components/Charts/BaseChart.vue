<template>
  <div
    ref="chartContainer"
    class="base-chart"
    :style="{ width: width, height: height }"
  >
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>{{ loadingText }}</span>
    </div>
    <div v-else-if="error" class="chart-error">
      <el-icon>
        <WarningFilled />
      </el-icon>
      <span>{{ error }}</span>
      <el-button v-if="showRetry" size="small" @click="handleRetry">
        重试
      </el-button>
    </div>
    <div v-else-if="isEmpty" class="chart-empty">
      <el-icon>
        <DocumentDelete />
      </el-icon>
      <span>{{ emptyText }}</span>
    </div>
    <v-chart
      v-else
      ref="chartRef"
      :option="mergedOption"
      :theme="theme"
      :autoresize="autoresize"
      :loading="loading"
      :loading-options="loadingOptions"
      @click="handleClick"
      @dblclick="handleDblClick"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut"
      @legendselectchanged="handleLegendSelectChanged"
      @datazoom="handleDataZoom"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  HeatmapChart,
  GraphChart,
  TreeChart,
  TreemapChart,
  SankeyChart,
  FunnelChart,
  ParallelChart,
  CandlestickChart,
  BoxplotChart,
  PictorialBarChart,
  ThemeRiverChart,
  SunburstChart,
  CustomChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PolarComponent,
  RadarComponent as RadarComponentType,
  GeoComponent,
  SingleAxisComponent,
  ParallelComponent,
  CalendarComponent,
  GraphicComponent,
  ToolboxComponent,
  BrushComponent,
  TimelineComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  VisualMapComponent,
  VisualMapContinuousComponent,
  VisualMapPiecewiseComponent,
  AriaComponent,
  TransformComponent,
  DatasetComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import type { EChartsOption } from 'echarts'
import { Loading, WarningFilled, DocumentDelete } from '@element-plus/icons-vue'
import { getDarkTheme } from '@/utils/chart'
import { useChartTheme } from '@/composables/useChartTheme'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  HeatmapChart,
  GraphChart,
  TreeChart,
  TreemapChart,
  SankeyChart,
  FunnelChart,
  ParallelChart,
  CandlestickChart,
  BoxplotChart,
  PictorialBarChart,
  ThemeRiverChart,
  SunburstChart,
  CustomChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PolarComponent,
  RadarComponentType,
  GeoComponent,
  SingleAxisComponent,
  ParallelComponent,
  CalendarComponent,
  GraphicComponent,
  ToolboxComponent,
  BrushComponent,
  TimelineComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  VisualMapComponent,
  VisualMapContinuousComponent,
  VisualMapPiecewiseComponent,
  AriaComponent,
  TransformComponent,
  DatasetComponent,
  LabelLayout,
  UniversalTransition
])

interface Props {
  option: EChartsOption
  width?: string
  height?: string
  theme?: string | object
  autoresize?: boolean
  loading?: boolean
  loadingText?: string
  error?: string | null
  showRetry?: boolean
  isEmpty?: boolean
  emptyText?: string
  lazyLoad?: boolean
  lazyLoadThreshold?: number
}

interface Emits {
  (e: 'click', event: any): void
  (e: 'dblclick', event: any): void
  (e: 'mouseover', event: any): void
  (e: 'mouseout', event: any): void
  (e: 'legendselectchanged', event: any): void
  (e: 'datazoom', event: any): void
  (e: 'retry'): void
  (e: 'ready'): void
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '300px',
  theme: 'dark',
  autoresize: true,
  loading: false,
  loadingText: '加载中...',
  error: null,
  showRetry: true,
  isEmpty: false,
  emptyText: '暂无数据',
  lazyLoad: false,
  lazyLoadThreshold: 0.1
})

const emit = defineEmits<Emits>()

// Refs
const chartContainer = ref<HTMLElement | null>(null)
const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const isVisible = ref(!props.lazyLoad)
const observer = ref<IntersectionObserver | null>(null)

// Composables
const { applyTheme } = useChartTheme()

// Computed
const mergedOption = computed<EChartsOption>(() => {
  const darkTheme = getDarkTheme()
  const themeOption = typeof props.theme === 'string' ? darkTheme : props.theme
  
  return applyTheme(props.option, themeOption as EChartsOption)
})

const loadingOptions = computed(() => ({
  text: props.loadingText,
  color: '#3274d9',
  textColor: '#d8d9da',
  maskColor: 'rgba(11, 12, 14, 0.8)',
  zlevel: 0,
  fontSize: 14,
  showSpinner: true,
  spinnerRadius: 10,
  lineWidth: 3
}))

// Methods
const getChartInstance = () => {
  return chartRef.value?.chart
}

const resize = () => {
  const chart = getChartInstance()
  if (chart) {
    chart.resize()
  }
}

const clear = () => {
  const chart = getChartInstance()
  if (chart) {
    chart.clear()
  }
}

const dispose = () => {
  const chart = getChartInstance()
  if (chart) {
    chart.dispose()
  }
}

const setOption = (option: EChartsOption, opts?: any) => {
  const chart = getChartInstance()
  if (chart) {
    chart.setOption(option, opts)
  }
}

const showLoading = () => {
  const chart = getChartInstance()
  if (chart) {
    chart.showLoading('default', loadingOptions.value)
  }
}

const hideLoading = () => {
  const chart = getChartInstance()
  if (chart) {
    chart.hideLoading()
  }
}

const dispatchAction = (payload: any) => {
  const chart = getChartInstance()
  if (chart) {
    chart.dispatchAction(payload)
  }
}

const convertToPixel = (finder: any, value: any) => {
  const chart = getChartInstance()
  return chart ? chart.convertToPixel(finder, value) : null
}

const convertFromPixel = (finder: any, value: any) => {
  const chart = getChartInstance()
  return chart ? chart.convertFromPixel(finder, value) : null
}

const containPixel = (finder: any, value: any) => {
  const chart = getChartInstance()
  return chart ? chart.containPixel(finder, value) : false
}

const getDataURL = (opts?: any) => {
  const chart = getChartInstance()
  return chart ? chart.getDataURL(opts) : ''
}

const getConnectedDataURL = (opts?: any) => {
  const chart = getChartInstance()
  return chart ? chart.getConnectedDataURL(opts) : ''
}

// Event handlers
const handleClick = (event: any) => {
  emit('click', event)
}

const handleDblClick = (event: any) => {
  emit('dblclick', event)
}

const handleMouseOver = (event: any) => {
  emit('mouseover', event)
}

const handleMouseOut = (event: any) => {
  emit('mouseout', event)
}

const handleLegendSelectChanged = (event: any) => {
  emit('legendselectchanged', event)
}

const handleDataZoom = (event: any) => {
  emit('datazoom', event)
}

const handleRetry = () => {
  emit('retry')
}

// Lazy load setup
const setupLazyLoad = () => {
  if (!props.lazyLoad || !chartContainer.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
          nextTick(() => {
            emit('ready')
          })
        }
      })
    },
    {
      threshold: props.lazyLoadThreshold
    }
  )

  observer.value.observe(chartContainer.value)
}

const cleanupLazyLoad = () => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
}

// Watchers
watch(
  () => props.option,
  () => {
    if (isVisible.value) {
      nextTick(() => {
        resize()
      })
    }
  },
  { deep: true }
)

watch(
  () => props.loading,
  (newVal) => {
    if (newVal) {
      showLoading()
    } else {
      hideLoading()
    }
  }
)

// Lifecycle
onMounted(() => {
  if (props.lazyLoad) {
    setupLazyLoad()
  } else {
    nextTick(() => {
      emit('ready')
    })
  }

  // Auto resize on window resize
  if (props.autoresize) {
    window.addEventListener('resize', resize)
  }
})

onUnmounted(() => {
  cleanupLazyLoad()
  
  if (props.autoresize) {
    window.removeEventListener('resize', resize)
  }
  
  dispose()
})

// Expose methods
defineExpose({
  getChartInstance,
  resize,
  clear,
  dispose,
  setOption,
  showLoading,
  hideLoading,
  dispatchAction,
  convertToPixel,
  convertFromPixel,
  containPixel,
  getDataURL,
  getConnectedDataURL
})
</script>

<style scoped lang="scss">
.base-chart {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;

  .chart-loading,
  .chart-error,
  .chart-empty {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background-color: var(--el-bg-color);
    z-index: 10;

    .el-icon {
      font-size: 48px;
      color: var(--el-text-color-secondary);
    }

    span {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .chart-loading {
    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .chart-error {
    .el-icon {
      color: var(--el-color-danger);
    }

    .el-button {
      margin-top: 8px;
    }
  }

  .chart-empty {
    .el-icon {
      color: var(--el-text-color-disabled);
    }
  }
}

// Animation for loading icon
.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
