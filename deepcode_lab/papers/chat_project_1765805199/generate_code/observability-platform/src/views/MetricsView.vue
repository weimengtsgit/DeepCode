<template>
  <div class="metrics-view">
    <!-- Header Section -->
    <div class="metrics-header">
      <div class="header-left">
        <el-icon :size="24" class="header-icon">
          <TrendCharts />
        </el-icon>
        <div class="header-text">
          <h1 class="header-title">指标监控</h1>
          <p class="header-subtitle">实时监控服务性能指标和资源使用情况</p>
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
        <el-button
          :icon="compareMode ? Check : DataAnalysis"
          :type="compareMode ? 'primary' : 'default'"
          @click="toggleCompareMode"
        >
          {{ compareMode ? '退出对比' : '对比模式' }}
        </el-button>
        <el-button :icon="Download" @click="handleExport">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(82, 196, 26, 0.1)">
          <el-icon :size="24" color="#52c41a">
            <Monitor />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">监控服务</div>
          <div class="stat-value">{{ statistics.totalServices }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(24, 144, 255, 0.1)">
          <el-icon :size="24" color="#1890ff">
            <TrendCharts />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">总 QPS</div>
          <div class="stat-value">{{ formatNumber(statistics.totalQPS) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(250, 173, 20, 0.1)">
          <el-icon :size="24" color="#faad14">
            <Timer />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">平均延迟</div>
          <div class="stat-value">{{ formatDuration(statistics.avgLatency) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245, 34, 45, 0.1)">
          <el-icon :size="24" color="#f5222d">
            <Warning />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">平均错误率</div>
          <div class="stat-value">{{ formatPercent(statistics.avgErrorRate) }}</div>
        </div>
      </div>
    </div>

    <!-- Compare Mode Selection -->
    <div v-if="compareMode" class="compare-selection">
      <div class="compare-header">
        <el-icon :size="18">
          <DataAnalysis />
        </el-icon>
        <span>选择要对比的服务（最多 {{ maxCompareServices }} 个）</span>
        <el-button
          v-if="selectedServices.length > 0"
          type="primary"
          size="small"
          @click="handleCompare"
        >
          开始对比 ({{ selectedServices.length }})
        </el-button>
      </div>
      <div class="selected-services">
        <el-tag
          v-for="serviceId in selectedServices"
          :key="serviceId"
          closable
          @close="removeFromCompare(serviceId)"
        >
          {{ getServiceName(serviceId) }}
        </el-tag>
      </div>
    </div>

    <!-- Service Metrics List -->
    <div class="metrics-content">
      <el-scrollbar>
        <!-- Loading State -->
        <div v-if="loading && !services.length" class="loading-container">
          <LoadingSkeleton type="card" :rows="3" />
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else-if="!loading && !services.length"
          type="no-services"
          title="暂无服务数据"
          description="当前筛选条件下没有找到服务"
          :show-action="true"
          action-text="清除筛选"
          @action="handleClearFilters"
        />

        <!-- Service Cards -->
        <div v-else class="service-cards">
          <div
            v-for="service in services"
            :key="service.id"
            class="service-card"
            :class="{
              'is-selected': selectedServices.includes(service.id),
              'is-clickable': !compareMode
            }"
            @click="handleServiceClick(service)"
          >
            <!-- Card Header -->
            <div class="card-header">
              <div class="service-info">
                <el-checkbox
                  v-if="compareMode"
                  v-model="selectedServices"
                  :value="service.id"
                  :disabled="!selectedServices.includes(service.id) && selectedServices.length >= maxCompareServices"
                  @click.stop
                />
                <div class="service-name">
                  <el-icon :size="20" class="service-icon">
                    <Monitor />
                  </el-icon>
                  <span class="name">{{ service.displayName }}</span>
                  <el-tag :type="getStatusType(service.status)" size="small">
                    {{ getStatusText(service.status) }}
                  </el-tag>
                </div>
              </div>
              <div class="service-meta">
                <el-tag size="small" :type="getEnvironmentType(service.environment)">
                  {{ service.environment }}
                </el-tag>
                <el-tag size="small" type="info">
                  {{ service.region }}
                </el-tag>
                <el-button
                  :icon="ArrowRight"
                  text
                  @click.stop="navigateToDetail(service.id)"
                >
                  详情
                </el-button>
              </div>
            </div>

            <!-- Metrics Grid -->
            <div class="metrics-grid">
              <!-- QPS -->
              <div class="metric-item">
                <div class="metric-label">
                  <el-icon :size="16">
                    <TrendCharts />
                  </el-icon>
                  <span>QPS</span>
                </div>
                <div class="metric-value">
                  {{ formatNumber(getMetricValue(service.id, 'qps')) }}
                </div>
                <div class="metric-chart">
                  <LineChart
                    :data="getMetricTimeSeries(service.id, 'qps')"
                    :height="'60px'"
                    :show-legend="false"
                    :show-grid="false"
                    :show-tooltip="true"
                    :line-width="1"
                    :show-symbol="false"
                    :lazy-load="true"
                  />
                </div>
              </div>

              <!-- P99 Latency -->
              <div class="metric-item">
                <div class="metric-label">
                  <el-icon :size="16">
                    <Timer />
                  </el-icon>
                  <span>P99 延迟</span>
                </div>
                <div class="metric-value">
                  {{ formatDuration(getMetricValue(service.id, 'p99')) }}
                </div>
                <div class="metric-chart">
                  <LineChart
                    :data="getMetricTimeSeries(service.id, 'p99')"
                    :height="'60px'"
                    :show-legend="false"
                    :show-grid="false"
                    :show-tooltip="true"
                    :line-width="1"
                    :show-symbol="false"
                    :lazy-load="true"
                  />
                </div>
              </div>

              <!-- Error Rate -->
              <div class="metric-item">
                <div class="metric-label">
                  <el-icon :size="16">
                    <Warning />
                  </el-icon>
                  <span>错误率</span>
                </div>
                <div class="metric-value" :style="{ color: getErrorRateColor(getMetricValue(service.id, 'errorRate')) }">
                  {{ formatPercent(getMetricValue(service.id, 'errorRate')) }}
                </div>
                <div class="metric-chart">
                  <LineChart
                    :data="getMetricTimeSeries(service.id, 'errorRate')"
                    :height="'60px'"
                    :show-legend="false"
                    :show-grid="false"
                    :show-tooltip="true"
                    :line-width="1"
                    :show-symbol="false"
                    :lazy-load="true"
                  />
                </div>
              </div>

              <!-- CPU Usage -->
              <div class="metric-item">
                <div class="metric-label">
                  <el-icon :size="16">
                    <Cpu />
                  </el-icon>
                  <span>CPU 使用率</span>
                </div>
                <div class="metric-value">
                  {{ formatPercent(getMetricValue(service.id, 'cpuUsage')) }}
                </div>
                <div class="metric-chart">
                  <LineChart
                    :data="getMetricTimeSeries(service.id, 'cpuUsage')"
                    :height="'60px'"
                    :show-legend="false"
                    :show-grid="false"
                    :show-tooltip="true"
                    :line-width="1"
                    :show-symbol="false"
                    :lazy-load="true"
                  />
                </div>
              </div>

              <!-- Memory Usage -->
              <div class="metric-item">
                <div class="metric-label">
                  <el-icon :size="16">
                    <Odometer />
                  </el-icon>
                  <span>内存使用</span>
                </div>
                <div class="metric-value">
                  {{ formatBytes(getMetricValue(service.id, 'memoryUsage') * 1024 * 1024 * 1024) }}
                </div>
                <div class="metric-chart">
                  <LineChart
                    :data="getMetricTimeSeries(service.id, 'memoryUsage')"
                    :height="'60px'"
                    :show-legend="false"
                    :show-grid="false"
                    :show-tooltip="true"
                    :line-width="1"
                    :show-symbol="false"
                    :lazy-load="true"
                  />
                </div>
              </div>

              <!-- Throughput -->
              <div class="metric-item">
                <div class="metric-label">
                  <el-icon :size="16">
                    <DataLine />
                  </el-icon>
                  <span>吞吐量</span>
                </div>
                <div class="metric-value">
                  {{ formatNumber(getMetricValue(service.id, 'throughput')) }}
                </div>
                <div class="metric-chart">
                  <LineChart
                    :data="getMetricTimeSeries(service.id, 'throughput')"
                    :height="'60px'"
                    :show-legend="false"
                    :show-grid="false"
                    :show-tooltip="true"
                    :line-width="1"
                    :show-symbol="false"
                    :lazy-load="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  TrendCharts,
  RefreshRight,
  DataAnalysis,
  Download,
  Monitor,
  Timer,
  Warning,
  Cpu,
  Odometer,
  DataLine,
  ArrowRight,
  Check
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import LineChart from '@/components/Charts/LineChart.vue'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'

import { useTimeRangeStore } from '@/stores/timeRange'
import { useFiltersStore } from '@/stores/filters'

import { getServices, getAllServicesMetrics } from '@/mock'

import type { Service, TimeSeries } from '@/types'
import type { ServiceMetrics } from '@/types/metrics'

import {
  formatNumber,
  formatDuration,
  formatPercent,
  formatBytes
} from '@/utils/format'
import { getServiceStatusColor } from '@/utils/color'

// Router
const router = useRouter()

// Stores
const timeRangeStore = useTimeRangeStore()
const { timeRange, isRealtime } = storeToRefs(timeRangeStore)

const filtersStore = useFiltersStore()
const { filters } = storeToRefs(filtersStore)

// State
const loading = ref(false)
const services = ref<Service[]>([])
const serviceMetrics = ref<Record<string, ServiceMetrics>>({})
const compareMode = ref(false)
const selectedServices = ref<string[]>([])
const maxCompareServices = 5

// Auto-refresh
let refreshTimer: number | null = null

// Computed
const statistics = computed(() => {
  const metrics = Object.values(serviceMetrics.value)
  return {
    totalServices: services.value.length,
    totalQPS: metrics.reduce((sum, m) => sum + (m.qps || 0), 0),
    avgLatency: metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.p99 || 0), 0) / metrics.length
      : 0,
    avgErrorRate: metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metrics.length
      : 0
  }
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const [servicesRes, metricsRes] = await Promise.all([
      getServices(),
      getAllServicesMetrics(timeRange.value.start, timeRange.value.end)
    ])

    if (servicesRes.success && metricsRes.success) {
      // Apply filters
      let filteredServices = servicesRes.data

      if (filters.value.services.length > 0) {
        filteredServices = filteredServices.filter(s =>
          filters.value.services.includes(s.id)
        )
      }

      if (filters.value.environments.length > 0) {
        filteredServices = filteredServices.filter(s =>
          filters.value.environments.includes(s.environment)
        )
      }

      if (filters.value.regions.length > 0) {
        filteredServices = filteredServices.filter(s =>
          filters.value.regions.includes(s.region)
        )
      }

      services.value = filteredServices

      // Build metrics map
      const metricsMap: Record<string, ServiceMetrics> = {}
      metricsRes.data.forEach(m => {
        metricsMap[m.serviceId] = m
      })
      serviceMetrics.value = metricsMap
    }
  } catch (error) {
    console.error('Failed to load metrics:', error)
    ElMessage.error('加载指标数据失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value
  if (!compareMode.value) {
    selectedServices.value = []
  }
}

const removeFromCompare = (serviceId: string) => {
  const index = selectedServices.value.indexOf(serviceId)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  }
}

const handleCompare = () => {
  if (selectedServices.value.length < 2) {
    ElMessage.warning('请至少选择 2 个服务进行对比')
    return
  }

  router.push({
    name: 'metrics-compare',
    query: {
      services: selectedServices.value.join(',')
    }
  })
}

const handleServiceClick = (service: Service) => {
  if (compareMode.value) {
    const index = selectedServices.value.indexOf(service.id)
    if (index > -1) {
      selectedServices.value.splice(index, 1)
    } else if (selectedServices.value.length < maxCompareServices) {
      selectedServices.value.push(service.id)
    } else {
      ElMessage.warning(`最多只能选择 ${maxCompareServices} 个服务`)
    }
  } else {
    navigateToDetail(service.id)
  }
}

const navigateToDetail = (serviceId: string) => {
  router.push({
    name: 'metrics-detail',
    params: { service: serviceId }
  })
}

const handleClearFilters = () => {
  filtersStore.clearFilters()
}

const handleExport = () => {
  const data = services.value.map(service => {
    const metrics = serviceMetrics.value[service.id]
    return {
      service: service.displayName,
      environment: service.environment,
      region: service.region,
      status: service.status,
      qps: metrics?.qps || 0,
      p99: metrics?.p99 || 0,
      errorRate: metrics?.errorRate || 0,
      cpuUsage: metrics?.cpuUsage || 0,
      memoryUsage: metrics?.memoryUsage || 0,
      throughput: metrics?.throughput || 0
    }
  })

  const csv = [
    ['服务', '环境', '区域', '状态', 'QPS', 'P99延迟(ms)', '错误率(%)', 'CPU使用率(%)', '内存使用(GB)', '吞吐量'].join(','),
    ...data.map(row => [
      row.service,
      row.environment,
      row.region,
      row.status,
      row.qps,
      row.p99,
      (row.errorRate * 100).toFixed(2),
      (row.cpuUsage * 100).toFixed(2),
      row.memoryUsage.toFixed(2),
      row.throughput
    ].join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `metrics_${Date.now()}.csv`
  link.click()

  ElMessage.success('数据导出成功')
}

const getServiceName = (serviceId: string): string => {
  const service = services.value.find(s => s.id === serviceId)
  return service?.displayName || serviceId
}

const getMetricValue = (serviceId: string, metricType: string): number => {
  const metrics = serviceMetrics.value[serviceId]
  if (!metrics) return 0

  switch (metricType) {
    case 'qps':
      return metrics.qps || 0
    case 'p99':
      return metrics.p99 || 0
    case 'errorRate':
      return metrics.errorRate || 0
    case 'cpuUsage':
      return metrics.cpuUsage || 0
    case 'memoryUsage':
      return metrics.memoryUsage || 0
    case 'throughput':
      return metrics.throughput || 0
    default:
      return 0
  }
}

const getMetricTimeSeries = (serviceId: string, metricType: string): TimeSeries[] => {
  const metrics = serviceMetrics.value[serviceId]
  if (!metrics) return []

  let metricSeries
  switch (metricType) {
    case 'qps':
      metricSeries = metrics.qpsSeries
      break
    case 'p99':
      metricSeries = metrics.p99Series
      break
    case 'errorRate':
      metricSeries = metrics.errorRateSeries
      break
    case 'cpuUsage':
      metricSeries = metrics.cpuUsageSeries
      break
    case 'memoryUsage':
      metricSeries = metrics.memoryUsageSeries
      break
    case 'throughput':
      metricSeries = metrics.throughputSeries
      break
    default:
      return []
  }

  if (!metricSeries) return []

  return [{
    name: metricType,
    data: metricSeries.dataPoints.map(dp => ({
      timestamp: dp.timestamp,
      value: dp.value
    })),
    unit: metricSeries.unit,
    color: getMetricColor(metricType)
  }]
}

const getMetricColor = (metricType: string): string => {
  const colors: Record<string, string> = {
    qps: '#5470c6',
    p99: '#91cc75',
    errorRate: '#ee6666',
    cpuUsage: '#fac858',
    memoryUsage: '#73c0de',
    throughput: '#3ba272'
  }
  return colors[metricType] || '#5470c6'
}

const getErrorRateColor = (errorRate: number): string => {
  if (errorRate > 0.05) return '#f5222d'
  if (errorRate > 0.02) return '#faad14'
  return '#52c41a'
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    healthy: 'success',
    degraded: 'warning',
    down: 'danger',
    unknown: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    healthy: '健康',
    degraded: '降级',
    down: '故障',
    unknown: '未知'
  }
  return texts[status] || status
}

const getEnvironmentType = (env: string) => {
  const types: Record<string, any> = {
    production: 'danger',
    staging: 'warning',
    development: 'success',
    test: 'info'
  }
  return types[env] || 'info'
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
watch([timeRange, filters], () => {
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

.metrics-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $background-primary;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  background: $background-secondary;
  border-bottom: 1px solid $border-default;

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .header-icon {
      color: $accent-primary;
    }

    .header-text {
      .header-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
      }

      .header-subtitle {
        margin: 4px 0 0;
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
  padding: $spacing-lg;

  .stat-card {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    background: $background-card;
    border-radius: 8px;
    border: 1px solid $border-default;

    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .stat-content {
      flex: 1;

      .stat-label {
        font-size: 14px;
        color: $text-secondary;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
      }
    }
  }
}

.compare-selection {
  margin: 0 $spacing-lg $spacing-lg;
  padding: $spacing-md;
  background: $background-card;
  border-radius: 8px;
  border: 1px solid $accent-primary;

  .compare-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
    color: $text-primary;
    font-weight: 500;
  }

  .selected-services {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }
}

.metrics-content {
  flex: 1;
  overflow: hidden;

  .loading-container {
    padding: $spacing-lg;
  }

  .service-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
    gap: $spacing-md;
    padding: $spacing-lg;
  }
}

.service-card {
  background: $background-card;
  border: 1px solid $border-default;
  border-radius: 8px;
  padding: $spacing-md;
  transition: all 0.3s;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      border-color: $accent-primary;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  &.is-selected {
    border-color: $accent-primary;
    background: rgba(50, 116, 217, 0.05);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $border-default;

    .service-info {
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      .service-name {
        display: flex;
        align-items: center;
        gap: $spacing-xs;

        .service-icon {
          color: $accent-primary;
        }

        .name {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
        }
      }
    }

    .service-meta {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
    }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;

    .metric-item {
      .metric-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }

      .metric-chart {
        height: 60px;
      }
    }
  }
}

@media (max-width: 1400px) {
  .service-cards {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .service-card .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
