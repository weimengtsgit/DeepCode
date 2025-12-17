<template>
  <div
    class="metric-card"
    :class="{
      'metric-card--loading': loading,
      'metric-card--error': !!error,
      'metric-card--clickable': clickable,
      'metric-card--compact': compact,
      'metric-card--mobile': isMobile,
      [`metric-card--${size}`]: size,
    }"
    @click="handleClick"
  >
    <!-- Header -->
    <div class="metric-card__header">
      <div class="metric-card__title-section">
        <el-icon v-if="icon" class="metric-card__icon" :size="iconSize">
          <component :is="icon" />
        </el-icon>
        <div class="metric-card__title-wrapper">
          <h3 class="metric-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="metric-card__subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="metric-card__actions">
        <el-tooltip v-if="showRefresh" content="刷新" placement="top">
          <el-button
            :icon="RefreshRight"
            circle
            size="small"
            text
            :loading="refreshing"
            @click.stop="handleRefresh"
          />
        </el-tooltip>
        <el-dropdown v-if="showMenu" trigger="click" @command="handleMenuCommand">
          <el-button :icon="MoreFilled" circle size="small" text @click.stop />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="detail">查看详情</el-dropdown-item>
              <el-dropdown-item command="export">导出数据</el-dropdown-item>
              <el-dropdown-item command="alert" divided>配置告警</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" type="card" :rows="2" :height="chartHeight" />

    <!-- Error State -->
    <EmptyState
      v-else-if="error"
      type="error"
      :title="error"
      :show-action="showRetry"
      action-text="重试"
      :height="chartHeight"
      @action="handleRefresh"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      type="no-data"
      title="暂无数据"
      :height="chartHeight"
    />

    <!-- Content -->
    <div v-else class="metric-card__content">
      <!-- Value Section -->
      <div v-if="showValue" class="metric-card__value-section">
        <div class="metric-card__value-wrapper">
          <span class="metric-card__value" :style="{ color: valueColor }">
            {{ formattedValue }}
          </span>
          <span v-if="unit" class="metric-card__unit">{{ unit }}</span>
        </div>

        <!-- Trend Indicator -->
        <div
          v-if="showTrend && trend"
          class="metric-card__trend"
          :class="{
            'metric-card__trend--up': trend.isIncrease,
            'metric-card__trend--down': !trend.isIncrease,
            'metric-card__trend--good': trend.isGood,
            'metric-card__trend--bad': !trend.isGood,
          }"
        >
          <el-icon :size="14">
            <component :is="trend.isIncrease ? TrendCharts : Bottom" />
          </el-icon>
          <span class="metric-card__trend-value">{{ trend.text }}</span>
        </div>
      </div>

      <!-- Status Badge -->
      <div v-if="showStatus && status" class="metric-card__status">
        <el-tag :type="statusType" size="small" effect="dark">
          {{ statusText }}
        </el-tag>
      </div>

      <!-- Chart Section -->
      <div v-if="showChart && chartData" class="metric-card__chart">
        <component
          :is="chartComponent"
          :data="chartData"
          :metric-data="metricData"
          :height="chartHeight"
          :width="chartWidth"
          :config="chartConfig"
          :show-legend="showChartLegend"
          :show-grid="showChartGrid"
          :show-tooltip="showChartTooltip"
          :smooth="chartSmooth"
          :show-area="chartShowArea"
          :area-opacity="chartAreaOpacity"
          :lazy-load="lazyLoad"
          @click="handleChartClick"
        />
      </div>

      <!-- Statistics Section -->
      <div v-if="showStatistics && statistics" class="metric-card__statistics">
        <div
          v-for="stat in statistics"
          :key="stat.label"
          class="metric-card__stat-item"
        >
          <span class="metric-card__stat-label">{{ stat.label }}</span>
          <span class="metric-card__stat-value">{{ stat.value }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="showFooter" class="metric-card__footer">
        <span v-if="lastUpdateTime" class="metric-card__update-time">
          更新于 {{ formatRelativeTime(lastUpdateTime) }}
        </span>
        <el-link
          v-if="showDetailLink"
          type="primary"
          :underline="false"
          @click.stop="handleDetailClick"
        >
          查看详情
          <el-icon><ArrowRight /></el-icon>
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Component } from 'vue'
import {
  RefreshRight,
  MoreFilled,
  TrendCharts,
  Bottom,
  ArrowRight,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LineChart from '@/components/Charts/LineChart.vue'
import BarChart from '@/components/Charts/BarChart.vue'
import GaugeChart from '@/components/Charts/GaugeChart.vue'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import { formatMetricValue, formatRelativeTime } from '@/utils/format'
import { getThresholdColor } from '@/utils/color'
import type { TimeSeries, ChartConfig } from '@/types'
import type { MetricTimeSeries } from '@/types/metrics'

// Props
interface Props {
  // Basic
  title: string
  subtitle?: string
  icon?: Component
  iconSize?: number

  // Value
  value?: number
  unit?: string
  showValue?: boolean
  valueColor?: string
  valueThresholds?: Array<{ value: number; color: string }>

  // Trend
  showTrend?: boolean
  trend?: {
    text: string
    isIncrease: boolean
    isGood: boolean
  }

  // Status
  showStatus?: boolean
  status?: 'healthy' | 'degraded' | 'down' | 'unknown'

  // Chart
  showChart?: boolean
  chartType?: 'line' | 'bar' | 'gauge'
  chartData?: TimeSeries[]
  metricData?: MetricTimeSeries[]
  chartHeight?: string
  chartWidth?: string
  chartConfig?: Partial<ChartConfig>
  showChartLegend?: boolean
  showChartGrid?: boolean
  showChartTooltip?: boolean
  chartSmooth?: boolean
  chartShowArea?: boolean
  chartAreaOpacity?: number

  // Statistics
  showStatistics?: boolean
  statistics?: Array<{ label: string; value: string }>

  // Footer
  showFooter?: boolean
  lastUpdateTime?: number
  showDetailLink?: boolean

  // Actions
  showRefresh?: boolean
  showMenu?: boolean
  showRetry?: boolean
  clickable?: boolean

  // State
  loading?: boolean
  error?: string | null
  isEmpty?: boolean

  // Layout
  size?: 'large' | 'default' | 'small'
  compact?: boolean
  isMobile?: boolean
  lazyLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 24,
  showValue: true,
  showTrend: true,
  showStatus: false,
  showChart: true,
  chartType: 'line',
  chartHeight: '180px',
  chartWidth: '100%',
  showChartLegend: false,
  showChartGrid: true,
  showChartTooltip: true,
  chartSmooth: true,
  chartShowArea: false,
  chartAreaOpacity: 0.3,
  showStatistics: false,
  showFooter: true,
  showDetailLink: true,
  showRefresh: true,
  showMenu: true,
  showRetry: true,
  clickable: false,
  loading: false,
  error: null,
  isEmpty: false,
  size: 'default',
  compact: false,
  isMobile: false,
  lazyLoad: false,
})

// Emits
const emit = defineEmits<{
  click: []
  refresh: []
  detail: []
  export: []
  alert: []
  chartClick: [event: any]
}>()

// State
const refreshing = ref(false)

// Computed
const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return 'N/A'
  return formatMetricValue(props.value, props.unit as any, 2)
})

const computedValueColor = computed(() => {
  if (props.valueColor) return props.valueColor
  if (props.valueThresholds && props.value !== undefined) {
    return getThresholdColor(props.value, props.valueThresholds)
  }
  return undefined
})

const valueColor = computed(() => computedValueColor.value)

const statusType = computed(() => {
  switch (props.status) {
    case 'healthy':
      return 'success'
    case 'degraded':
      return 'warning'
    case 'down':
      return 'danger'
    default:
      return 'info'
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'healthy':
      return '健康'
    case 'degraded':
      return '降级'
    case 'down':
      return '故障'
    default:
      return '未知'
  }
})

const chartComponent = computed(() => {
  switch (props.chartType) {
    case 'bar':
      return BarChart
    case 'gauge':
      return GaugeChart
    default:
      return LineChart
  }
})

// Methods
const handleClick = () => {
  if (props.clickable && !props.loading && !props.error) {
    emit('click')
  }
}

const handleRefresh = async () => {
  if (refreshing.value) return

  refreshing.value = true
  try {
    emit('refresh')
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 500))
  } finally {
    refreshing.value = false
  }
}

const handleMenuCommand = (command: string) => {
  switch (command) {
    case 'detail':
      emit('detail')
      break
    case 'export':
      emit('export')
      ElMessage.success('导出功能开发中')
      break
    case 'alert':
      emit('alert')
      ElMessage.success('告警配置功能开发中')
      break
  }
}

const handleDetailClick = () => {
  emit('detail')
}

const handleChartClick = (event: any) => {
  emit('chartClick', event)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.metric-card {
  background: $background-card;
  border: 1px solid $border-default;
  border-radius: 8px;
  padding: $spacing-lg;
  transition: all $animation-duration-normal $animation-easing;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: $border-hover;
    box-shadow: $shadow-elevated;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
    }
  }

  &--loading,
  &--error {
    pointer-events: none;
  }

  &--compact {
    padding: $spacing-md;

    .metric-card__header {
      margin-bottom: $spacing-sm;
    }

    .metric-card__value-section {
      margin-bottom: $spacing-sm;
    }
  }

  &--small {
    .metric-card__title {
      font-size: 14px;
    }

    .metric-card__value {
      font-size: 24px;
    }
  }

  &--large {
    .metric-card__title {
      font-size: 18px;
    }

    .metric-card__value {
      font-size: 40px;
    }
  }

  &--mobile {
    padding: $spacing-md;

    .metric-card__header {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;
    }

    .metric-card__actions {
      align-self: flex-end;
    }
  }

  // Header
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-md;
  }

  &__title-section {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    flex: 1;
    min-width: 0;
  }

  &__icon {
    color: $accent-primary;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__title-wrapper {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: $text-primary;
    margin: 0;
    @include text-ellipsis;
  }

  &__subtitle {
    font-size: 12px;
    color: $text-secondary;
    margin: 4px 0 0;
    @include text-ellipsis;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
    flex-shrink: 0;
  }

  // Content
  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  // Value Section
  &__value-section {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $spacing-md;
  }

  &__value-wrapper {
    display: flex;
    align-items: baseline;
    gap: $spacing-xs;
  }

  &__value {
    font-size: 32px;
    font-weight: 600;
    color: $text-primary;
    line-height: 1;
  }

  &__unit {
    font-size: 14px;
    color: $text-secondary;
    font-weight: normal;
  }

  // Trend
  &__trend {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;

    &--up {
      color: $accent-error;
      background: rgba($accent-error, 0.1);

      &.metric-card__trend--good {
        color: $accent-success;
        background: rgba($accent-success, 0.1);
      }
    }

    &--down {
      color: $accent-success;
      background: rgba($accent-success, 0.1);

      &.metric-card__trend--bad {
        color: $accent-error;
        background: rgba($accent-error, 0.1);
      }
    }
  }

  &__trend-value {
    line-height: 1;
  }

  // Status
  &__status {
    display: flex;
    justify-content: flex-end;
  }

  // Chart
  &__chart {
    flex: 1;
    min-height: 0;
  }

  // Statistics
  &__statistics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: $spacing-md;
    padding: $spacing-md;
    background: $background-secondary;
    border-radius: 4px;
  }

  &__stat-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__stat-label {
    font-size: 12px;
    color: $text-secondary;
  }

  &__stat-value {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  // Footer
  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-default;
    margin-top: auto;
  }

  &__update-time {
    font-size: 12px;
    color: $text-disabled;
  }
}
</style>
