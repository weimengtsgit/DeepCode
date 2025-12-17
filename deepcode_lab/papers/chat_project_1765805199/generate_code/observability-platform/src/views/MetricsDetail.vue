<template>
  <div class="metrics-detail">
    <!-- Header Section -->
    <div class="detail-header">
      <div class="header-left">
        <el-icon :size="24" class="header-icon">
          <Monitor />
        </el-icon>
        <div class="header-info">
          <h1 class="service-name">
            {{ service?.displayName || service?.name || serviceId }}
          </h1>
          <div class="service-meta">
            <el-tag
              :type="getStatusType(service?.status || 'unknown')"
              size="small"
              effect="dark"
            >
              {{ getStatusText(service?.status || 'unknown') }}
            </el-tag>
            <el-tag
              v-if="service?.environment"
              :type="getEnvironmentType(service.environment)"
              size="small"
            >
              {{ service.environment }}
            </el-tag>
            <span v-if="service?.region" class="region">
              <el-icon><Location /></el-icon>
              {{ service.region }}
            </span>
            <span v-if="service?.description" class="description">
              {{ service.description }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button
          :icon="RefreshRight"
          :loading="loading"
          @click="handleRefresh"
        >
          刷新
        </el-button>
        <el-dropdown @command="handleAction">
          <el-button :icon="MoreFilled">
            操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="traces" :icon="Connection">
                查看链路追踪
              </el-dropdown-item>
              <el-dropdown-item command="logs" :icon="Document">
                查看日志
              </el-dropdown-item>
              <el-dropdown-item command="alerts" :icon="Bell">
                配置告警
              </el-dropdown-item>
              <el-dropdown-item command="export" :icon="Download" divided>
                导出数据
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSkeleton v-if="loading && !serviceMetrics" type="chart" :rows="6" />

    <!-- Error State -->
    <EmptyState
      v-else-if="error"
      type="error"
      :title="error"
      :show-action="true"
      action-text="重试"
      @action="loadData"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!serviceMetrics"
      type="no-data"
      title="未找到服务数据"
      description="该服务可能不存在或已被删除"
      :show-action="true"
      action-text="返回列表"
      @action="router.push('/metrics')"
    />

    <!-- Main Content -->
    <div v-else class="detail-content">
      <!-- Key Metrics Cards -->
      <div class="metrics-cards">
        <MetricCard
          title="QPS"
          subtitle="每秒请求数"
          :icon="TrendCharts"
          :value="serviceMetrics.qps"
          unit="req/s"
          :trend="getMetricTrend('qps')"
          :chart-data="qpsChartData"
          chart-type="line"
          chart-height="120px"
          size="small"
          @click="scrollToChart('qps')"
        />
        <MetricCard
          title="P99 延迟"
          subtitle="99分位响应时间"
          :icon="Timer"
          :value="serviceMetrics.p99"
          unit="ms"
          :trend="getMetricTrend('p99')"
          :chart-data="latencyChartData"
          chart-type="line"
          chart-height="120px"
          size="small"
          :value-thresholds="[
            { value: 500, color: '#73bf69' },
            { value: 1000, color: '#ff9830' },
            { value: 2000, color: '#f2495c' }
          ]"
          @click="scrollToChart('latency')"
        />
        <MetricCard
          title="错误率"
          subtitle="请求错误百分比"
          :icon="Warning"
          :value="serviceMetrics.errorRate"
          unit="%"
          :trend="getMetricTrend('errorRate')"
          :chart-data="errorRateChartData"
          chart-type="line"
          chart-height="120px"
          size="small"
          :value-thresholds="[
            { value: 2, color: '#73bf69' },
            { value: 5, color: '#ff9830' },
            { value: 10, color: '#f2495c' }
          ]"
          @click="scrollToChart('errorRate')"
        />
        <MetricCard
          title="CPU 使用率"
          subtitle="处理器占用"
          :icon="Cpu"
          :value="serviceMetrics.cpuUsage"
          unit="%"
          :trend="getMetricTrend('cpuUsage')"
          :chart-data="cpuChartData"
          chart-type="gauge"
          chart-height="120px"
          size="small"
          :value-thresholds="[
            { value: 60, color: '#73bf69' },
            { value: 80, color: '#ff9830' },
            { value: 100, color: '#f2495c' }
          ]"
          @click="scrollToChart('cpu')"
        />
      </div>

      <!-- Detailed Charts Section -->
      <div class="charts-section">
        <!-- QPS Chart -->
        <div ref="qpsChartRef" class="chart-container">
          <div class="chart-header">
            <h3>请求量 (QPS)</h3>
            <div class="chart-actions">
              <el-button-group size="small">
                <el-button
                  v-for="agg in aggregationTypes"
                  :key="agg.value"
                  :type="selectedAggregation.qps === agg.value ? 'primary' : ''"
                  @click="selectedAggregation.qps = agg.value"
                >
                  {{ agg.label }}
                </el-button>
              </el-button-group>
            </div>
          </div>
          <LineChart
            :metric-data="[qpsMetricSeries]"
            :height="chartHeight"
            :show-data-zoom="true"
            :show-legend="false"
            y-axis-name="请求数"
            y-axis-unit="req/s"
            :lazy-load="true"
          />
        </div>

        <!-- Latency Chart -->
        <div ref="latencyChartRef" class="chart-container">
          <div class="chart-header">
            <h3>响应时间</h3>
            <div class="chart-actions">
              <el-checkbox-group v-model="selectedPercentiles" size="small">
                <el-checkbox-button label="p50">P50</el-checkbox-button>
                <el-checkbox-button label="p90">P90</el-checkbox-button>
                <el-checkbox-button label="p95">P95</el-checkbox-button>
                <el-checkbox-button label="p99">P99</el-checkbox-button>
              </el-checkbox-group>
            </div>
          </div>
          <LineChart
            :metric-data="latencyMetricSeries"
            :height="chartHeight"
            :show-data-zoom="true"
            :show-legend="true"
            y-axis-name="延迟"
            y-axis-unit="ms"
            :lazy-load="true"
          />
        </div>

        <!-- Error Rate Chart -->
        <div ref="errorRateChartRef" class="chart-container">
          <div class="chart-header">
            <h3>错误率</h3>
          </div>
          <LineChart
            :metric-data="[errorRateMetricSeries]"
            :height="chartHeight"
            :show-data-zoom="true"
            :show-legend="false"
            :show-area="true"
            y-axis-name="错误率"
            y-axis-unit="%"
            :lazy-load="true"
          />
        </div>

        <!-- Resource Usage Charts -->
        <div class="resource-charts">
          <div ref="cpuChartRef" class="chart-container half-width">
            <div class="chart-header">
              <h3>CPU 使用率</h3>
            </div>
            <LineChart
              :metric-data="[cpuMetricSeries]"
              :height="chartHeight"
              :show-data-zoom="true"
              :show-legend="false"
              :show-area="true"
              y-axis-name="CPU"
              y-axis-unit="%"
              :lazy-load="true"
            />
          </div>

          <div ref="memoryChartRef" class="chart-container half-width">
            <div class="chart-header">
              <h3>内存使用</h3>
            </div>
            <LineChart
              :metric-data="[memoryMetricSeries]"
              :height="chartHeight"
              :show-data-zoom="true"
              :show-legend="false"
              :show-area="true"
              y-axis-name="内存"
              y-axis-unit="GB"
              :lazy-load="true"
            />
          </div>
        </div>

        <!-- Network I/O Charts -->
        <div class="network-charts">
          <div ref="networkChartRef" class="chart-container half-width">
            <div class="chart-header">
              <h3>网络吞吐量</h3>
            </div>
            <LineChart
              :metric-data="networkMetricSeries"
              :height="chartHeight"
              :show-data-zoom="true"
              :show-legend="true"
              y-axis-name="吞吐量"
              y-axis-unit="MB/s"
              :lazy-load="true"
            />
          </div>

          <div ref="diskChartRef" class="chart-container half-width">
            <div class="chart-header">
              <h3>磁盘 I/O</h3>
            </div>
            <LineChart
              :metric-data="diskMetricSeries"
              :height="chartHeight"
              :show-data-zoom="true"
              :show-legend="true"
              y-axis-name="IOPS"
              y-axis-unit="ops/s"
              :lazy-load="true"
            />
          </div>
        </div>

        <!-- Throughput Chart -->
        <div ref="throughputChartRef" class="chart-container">
          <div class="chart-header">
            <h3>吞吐量</h3>
          </div>
          <BarChart
            :metric-data="[throughputMetricSeries]"
            :height="chartHeight"
            :show-data-zoom="true"
            :show-legend="false"
            y-axis-name="吞吐量"
            y-axis-unit="MB/s"
            :lazy-load="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Monitor,
  RefreshRight,
  MoreFilled,
  ArrowDown,
  Location,
  Connection,
  Document,
  Bell,
  Download,
  TrendCharts,
  Timer,
  Warning,
  Cpu
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MetricCard from '@/components/Dashboard/MetricCard.vue'
import LineChart from '@/components/Charts/LineChart.vue'
import BarChart from '@/components/Charts/BarChart.vue'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import { useTimeRangeStore } from '@/stores/timeRange'
import { getServiceById, getServiceMetrics } from '@/mock'
import type { Service, TimeSeries } from '@/types'
import type { ServiceMetrics, MetricTimeSeries } from '@/types/metrics'
import { getServiceStatusColor } from '@/utils/color'

const router = useRouter()
const route = useRoute()
const timeRangeStore = useTimeRangeStore()
const { timeRange, isRealtime } = storeToRefs(timeRangeStore)

// Service ID from route params
const serviceId = computed(() => route.params.service as string)

// State
const loading = ref(false)
const error = ref<string | null>(null)
const service = ref<Service | null>(null)
const serviceMetrics = ref<ServiceMetrics | null>(null)
const previousMetrics = ref<ServiceMetrics | null>(null)

// Chart configuration
const chartHeight = '300px'
const selectedAggregation = ref({
  qps: 'avg' as const,
  latency: 'avg' as const,
  errorRate: 'avg' as const
})
const selectedPercentiles = ref(['p50', 'p90', 'p99'])

const aggregationTypes = [
  { label: '平均', value: 'avg' },
  { label: '最大', value: 'max' },
  { label: '最小', value: 'min' }
]

// Chart refs for scrolling
const qpsChartRef = ref<HTMLElement>()
const latencyChartRef = ref<HTMLElement>()
const errorRateChartRef = ref<HTMLElement>()
const cpuChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
const networkChartRef = ref<HTMLElement>()
const diskChartRef = ref<HTMLElement>()
const throughputChartRef = ref<HTMLElement>()

// Auto-refresh
let refreshTimer: number | null = null

// Computed - Chart Data
const qpsChartData = computed<TimeSeries[]>(() => {
  if (!serviceMetrics.value?.qpsTimeSeries) return []
  return [{
    name: 'QPS',
    data: serviceMetrics.value.qpsTimeSeries.dataPoints.map(dp => ({
      timestamp: dp.timestamp,
      value: dp.value
    })),
    unit: 'req/s',
    color: '#5470c6'
  }]
})

const latencyChartData = computed<TimeSeries[]>(() => {
  const series: TimeSeries[] = []
  if (!serviceMetrics.value) return series

  const percentileMap = {
    p50: { data: serviceMetrics.value.p50TimeSeries, color: '#91cc75', name: 'P50' },
    p90: { data: serviceMetrics.value.p90TimeSeries, color: '#fac858', name: 'P90' },
    p95: { data: serviceMetrics.value.p95TimeSeries, color: '#ee6666', name: 'P95' },
    p99: { data: serviceMetrics.value.p99TimeSeries, color: '#73c0de', name: 'P99' }
  }

  selectedPercentiles.value.forEach(p => {
    const config = percentileMap[p as keyof typeof percentileMap]
    if (config?.data) {
      series.push({
        name: config.name,
        data: config.data.dataPoints.map(dp => ({
          timestamp: dp.timestamp,
          value: dp.value
        })),
        unit: 'ms',
        color: config.color
      })
    }
  })

  return series
})

const errorRateChartData = computed<TimeSeries[]>(() => {
  if (!serviceMetrics.value?.errorRateTimeSeries) return []
  return [{
    name: '错误率',
    data: serviceMetrics.value.errorRateTimeSeries.dataPoints.map(dp => ({
      timestamp: dp.timestamp,
      value: dp.value
    })),
    unit: '%',
    color: '#f2495c'
  }]
})

const cpuChartData = computed<TimeSeries[]>(() => {
  if (!serviceMetrics.value?.cpuUsageTimeSeries) return []
  return [{
    name: 'CPU',
    data: serviceMetrics.value.cpuUsageTimeSeries.dataPoints.map(dp => ({
      timestamp: dp.timestamp,
      value: dp.value
    })),
    unit: '%',
    color: '#ff9830'
  }]
})

// Metric series for detailed charts
const qpsMetricSeries = computed<MetricTimeSeries>(() => 
  serviceMetrics.value?.qpsTimeSeries || {
    metric: 'qps',
    labels: {},
    dataPoints: [],
    unit: 'rate',
    aggregation: 'avg'
  }
)

const latencyMetricSeries = computed<MetricTimeSeries[]>(() => {
  const series: MetricTimeSeries[] = []
  if (!serviceMetrics.value) return series

  const percentileMap = {
    p50: serviceMetrics.value.p50TimeSeries,
    p90: serviceMetrics.value.p90TimeSeries,
    p95: serviceMetrics.value.p95TimeSeries,
    p99: serviceMetrics.value.p99TimeSeries
  }

  selectedPercentiles.value.forEach(p => {
    const data = percentileMap[p as keyof typeof percentileMap]
    if (data) {
      series.push(data)
    }
  })

  return series
})

const errorRateMetricSeries = computed<MetricTimeSeries>(() =>
  serviceMetrics.value?.errorRateTimeSeries || {
    metric: 'error_rate',
    labels: {},
    dataPoints: [],
    unit: 'percent',
    aggregation: 'avg'
  }
)

const cpuMetricSeries = computed<MetricTimeSeries>(() =>
  serviceMetrics.value?.cpuUsageTimeSeries || {
    metric: 'cpu_usage',
    labels: {},
    dataPoints: [],
    unit: 'percent',
    aggregation: 'avg'
  }
)

const memoryMetricSeries = computed<MetricTimeSeries>(() =>
  serviceMetrics.value?.memoryUsageTimeSeries || {
    metric: 'memory_usage',
    labels: {},
    dataPoints: [],
    unit: 'bytes',
    aggregation: 'avg'
  }
)

const networkMetricSeries = computed<MetricTimeSeries[]>(() => {
  if (!serviceMetrics.value) return []
  return [
    serviceMetrics.value.networkInTimeSeries,
    serviceMetrics.value.networkOutTimeSeries
  ].filter(Boolean) as MetricTimeSeries[]
})

const diskMetricSeries = computed<MetricTimeSeries[]>(() => {
  if (!serviceMetrics.value) return []
  return [
    serviceMetrics.value.diskReadTimeSeries,
    serviceMetrics.value.diskWriteTimeSeries
  ].filter(Boolean) as MetricTimeSeries[]
})

const throughputMetricSeries = computed<MetricTimeSeries>(() =>
  serviceMetrics.value?.throughputTimeSeries || {
    metric: 'throughput',
    labels: {},
    dataPoints: [],
    unit: 'bytes',
    aggregation: 'sum'
  }
)

// Helper functions
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    healthy: 'success',
    degraded: 'warning',
    down: 'danger',
    unknown: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    healthy: '健康',
    degraded: '降级',
    down: '故障',
    unknown: '未知'
  }
  return map[status] || '未知'
}

const getEnvironmentType = (env: string) => {
  const map: Record<string, any> = {
    production: 'danger',
    staging: 'warning',
    development: 'info',
    test: ''
  }
  return map[env] || ''
}

const getMetricTrend = (metricKey: keyof ServiceMetrics) => {
  if (!serviceMetrics.value || !previousMetrics.value) return undefined

  const current = serviceMetrics.value[metricKey] as number
  const previous = previousMetrics.value[metricKey] as number

  if (typeof current !== 'number' || typeof previous !== 'number') return undefined

  const change = ((current - previous) / previous) * 100
  const isIncrease = change > 0

  // Determine if increase is good based on metric type
  const goodMetrics = ['qps', 'throughput']
  const badMetrics = ['errorRate', 'p99', 'cpuUsage', 'memoryUsage']
  
  let isGood = false
  if (goodMetrics.includes(metricKey)) {
    isGood = isIncrease
  } else if (badMetrics.includes(metricKey)) {
    isGood = !isIncrease
  }

  return {
    text: `${isIncrease ? '+' : ''}${change.toFixed(1)}%`,
    isIncrease,
    isGood
  }
}

const scrollToChart = (chartType: string) => {
  const refMap: Record<string, any> = {
    qps: qpsChartRef,
    latency: latencyChartRef,
    errorRate: errorRateChartRef,
    cpu: cpuChartRef,
    memory: memoryChartRef,
    network: networkChartRef,
    disk: diskChartRef,
    throughput: throughputChartRef
  }

  const chartRef = refMap[chartType]
  if (chartRef?.value) {
    chartRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Data loading
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    // Load service info
    const serviceResponse = await getServiceById(serviceId.value)
    if (!serviceResponse.success || !serviceResponse.data) {
      throw new Error('服务不存在')
    }
    service.value = serviceResponse.data

    // Store previous metrics for trend calculation
    previousMetrics.value = serviceMetrics.value

    // Load service metrics
    const metricsResponse = await getServiceMetrics(
      serviceId.value,
      timeRange.value.start,
      timeRange.value.end
    )

    if (!metricsResponse.success || !metricsResponse.data) {
      throw new Error('加载指标数据失败')
    }

    serviceMetrics.value = metricsResponse.data
  } catch (err: any) {
    error.value = err.message || '加载数据失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

const handleAction = (command: string) => {
  switch (command) {
    case 'traces':
      router.push({
        path: '/tracing',
        query: { service: serviceId.value }
      })
      break
    case 'logs':
      router.push({
        path: '/logs',
        query: { service: serviceId.value }
      })
      break
    case 'alerts':
      ElMessage.info('告警配置功能开发中')
      break
    case 'export':
      ElMessage.success('数据导出功能开发中')
      break
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  refreshTimer = window.setInterval(() => {
    loadData()
  }, 30000) // 30 seconds
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle
onMounted(() => {
  loadData()
  if (isRealtime.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Watchers
watch(timeRange, () => {
  loadData()
})

watch(isRealtime, (newValue) => {
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.metrics-detail {
  padding: $spacing-lg;
  min-height: 100vh;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-xl;
    padding: $spacing-lg;
    background: $background-secondary;
    border-radius: 8px;

    .header-left {
      display: flex;
      gap: $spacing-md;
      flex: 1;

      .header-icon {
        color: $accent-primary;
        margin-top: 4px;
      }

      .header-info {
        flex: 1;

        .service-name {
          font-size: 24px;
          font-weight: 600;
          color: $text-primary;
          margin: 0 0 $spacing-sm 0;
        }

        .service-meta {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
          flex-wrap: wrap;

          .region {
            display: flex;
            align-items: center;
            gap: 4px;
            color: $text-secondary;
            font-size: 14px;
          }

          .description {
            color: $text-secondary;
            font-size: 14px;
          }
        }
      }
    }

    .header-actions {
      display: flex;
      gap: $spacing-sm;
    }
  }

  .detail-content {
    .metrics-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: $spacing-md;
      margin-bottom: $spacing-xl;
    }

    .charts-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-lg;

      .chart-container {
        background: $background-secondary;
        border-radius: 8px;
        padding: $spacing-lg;

        &.half-width {
          flex: 1;
          min-width: 0;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $spacing-md;

          h3 {
            font-size: 16px;
            font-weight: 600;
            color: $text-primary;
            margin: 0;
          }

          .chart-actions {
            :deep(.el-button-group) {
              .el-button {
                padding: 5px 12px;
              }
            }

            :deep(.el-checkbox-group) {
              .el-checkbox-button {
                .el-checkbox-button__inner {
                  padding: 5px 12px;
                }
              }
            }
          }
        }
      }

      .resource-charts,
      .network-charts {
        display: flex;
        gap: $spacing-lg;

        @media (max-width: 1200px) {
          flex-direction: column;

          .chart-container {
            width: 100%;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .metrics-detail {
    padding: $spacing-md;

    .detail-header {
      flex-direction: column;
      gap: $spacing-md;

      .header-actions {
        width: 100%;

        .el-button {
          flex: 1;
        }
      }
    }

    .detail-content {
      .metrics-cards {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
