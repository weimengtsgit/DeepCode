<template>
  <div class="dashboard-view">
    <!-- Page Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <el-icon :size="24" class="header-icon">
          <Monitor />
        </el-icon>
        <div class="header-text">
          <h1 class="header-title">综合仪表盘</h1>
          <p class="header-subtitle">实时监控服务健康状态和关键指标</p>
        </div>
      </div>
      <div class="header-right">
        <el-button
          :icon="RefreshRight"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          刷新
        </el-button>
        <el-button :icon="Setting" @click="showSettings = true">
          设置
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon healthy">
          <el-icon :size="32">
            <CircleCheck />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.healthyServices }}</div>
          <div class="stat-label">健康服务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon :size="32">
            <Warning />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.degradedServices }}</div>
          <div class="stat-label">降级服务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon error">
          <el-icon :size="32">
            <CircleClose />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.downServices }}</div>
          <div class="stat-label">故障服务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon alert">
          <el-icon :size="32">
            <Bell />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.activeAlerts }}</div>
          <div class="stat-label">活跃告警</div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Service Status Panel -->
      <div class="grid-item service-status">
        <ServiceStatus
          :services="services"
          :service-metrics="serviceMetrics"
          :loading="loading.services"
          :auto-refresh="isRealtime"
          :refresh-interval="refreshInterval"
          @refresh="loadServices"
          @service-click="handleServiceClick"
        />
      </div>

      <!-- Alert Panel -->
      <div class="grid-item alerts">
        <AlertPanel
          :alerts="alerts"
          :loading="loading.alerts"
          :auto-refresh="isRealtime"
          :refresh-interval="refreshInterval"
          :page-size="5"
          @refresh="loadAlerts"
          @acknowledge="handleAcknowledgeAlert"
          @resolve="handleResolveAlert"
        />
      </div>

      <!-- QPS Metric Card -->
      <div class="grid-item metric-card">
        <MetricCard
          title="总请求量 (QPS)"
          :icon="TrendCharts"
          :value="overallMetrics.qps"
          unit="req/s"
          :trend="overallMetrics.qpsTrend"
          chart-type="line"
          :chart-data="qpsChartData"
          :loading="loading.metrics"
          clickable
          @click="navigateToMetrics('qps')"
        />
      </div>

      <!-- Latency Metric Card -->
      <div class="grid-item metric-card">
        <MetricCard
          title="平均响应时间 (P99)"
          :icon="Timer"
          :value="overallMetrics.p99Latency"
          unit="ms"
          :trend="overallMetrics.latencyTrend"
          :value-thresholds="[
            { value: 500, color: '#73bf69' },
            { value: 1000, color: '#ff9830' },
            { value: 2000, color: '#f2495c' }
          ]"
          chart-type="line"
          :chart-data="latencyChartData"
          :loading="loading.metrics"
          clickable
          @click="navigateToMetrics('latency')"
        />
      </div>

      <!-- Error Rate Metric Card -->
      <div class="grid-item metric-card">
        <MetricCard
          title="错误率"
          :icon="Warning"
          :value="overallMetrics.errorRate"
          unit="%"
          :trend="overallMetrics.errorRateTrend"
          :value-thresholds="[
            { value: 1, color: '#73bf69' },
            { value: 3, color: '#ff9830' },
            { value: 5, color: '#f2495c' }
          ]"
          chart-type="line"
          :chart-data="errorRateChartData"
          :loading="loading.metrics"
          clickable
          @click="navigateToMetrics('error_rate')"
        />
      </div>

      <!-- CPU Usage Gauge -->
      <div class="grid-item metric-card">
        <MetricCard
          title="平均 CPU 使用率"
          :icon="Cpu"
          :value="overallMetrics.cpuUsage"
          unit="%"
          chart-type="gauge"
          :value="overallMetrics.cpuUsage"
          :loading="loading.metrics"
        />
      </div>

      <!-- Request Distribution Chart -->
      <div class="grid-item chart-large">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <el-icon :size="20">
                <PieChart />
              </el-icon>
              <span>请求分布</span>
            </div>
            <el-button
              text
              :icon="RefreshRight"
              @click="loadMetrics"
            />
          </div>
          <PieChart
            :data="requestDistributionData"
            chart-type="donut"
            :height="'280px'"
            :loading="loading.metrics"
          />
        </div>
      </div>

      <!-- Service Health Trend -->
      <div class="grid-item chart-large">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <el-icon :size="20">
                <DataLine />
              </el-icon>
              <span>服务健康趋势</span>
            </div>
            <el-button
              text
              :icon="RefreshRight"
              @click="loadMetrics"
            />
          </div>
          <LineChart
            :data="healthTrendData"
            :height="'280px'"
            :show-area="true"
            :loading="loading.metrics"
          />
        </div>
      </div>
    </div>

    <!-- Settings Dialog -->
    <el-dialog
      v-model="showSettings"
      title="仪表盘设置"
      width="600px"
    >
      <el-form label-width="120px">
        <el-form-item label="自动刷新">
          <el-switch v-model="autoRefreshEnabled" />
        </el-form-item>
        <el-form-item label="刷新间隔">
          <el-select
            v-model="refreshInterval"
            :disabled="!autoRefreshEnabled"
            style="width: 200px"
          >
            <el-option label="5 秒" :value="5000" />
            <el-option label="10 秒" :value="10000" />
            <el-option label="30 秒" :value="30000" />
            <el-option label="1 分钟" :value="60000" />
            <el-option label="5 分钟" :value="300000" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示统计卡片">
          <el-switch v-model="showStatistics" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Monitor,
  RefreshRight,
  Setting,
  CircleCheck,
  Warning,
  CircleClose,
  Bell,
  TrendCharts,
  Timer,
  Cpu,
  PieChart,
  DataLine
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Components
import ServiceStatus from '@/components/Dashboard/ServiceStatus.vue'
import AlertPanel from '@/components/Dashboard/AlertPanel.vue'
import MetricCard from '@/components/Dashboard/MetricCard.vue'
import LineChart from '@/components/Charts/LineChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'

// Stores
import { useTimeRangeStore } from '@/stores/timeRange'
import { useFiltersStore } from '@/stores/filters'
import { useDashboardStore } from '@/stores/dashboard'

// Mock API
import {
  getServices,
  getAllServicesMetrics,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  getDashboardOverview
} from '@/mock'

// Types
import type { Service, Alert, TimeSeries } from '@/types'
import type { ServiceMetrics } from '@/types/metrics'

// Router
const router = useRouter()

// Stores
const timeRangeStore = useTimeRangeStore()
const filtersStore = useFiltersStore()
const dashboardStore = useDashboardStore()

const { timeRange, isRealtime } = storeToRefs(timeRangeStore)
const { filters } = storeToRefs(filtersStore)
const { userPreferences } = storeToRefs(dashboardStore)

// State
const services = ref<Service[]>([])
const serviceMetrics = ref<Record<string, ServiceMetrics>>({})
const alerts = ref<Alert[]>([])
const isRefreshing = ref(false)
const showSettings = ref(false)
const autoRefreshEnabled = ref(isRealtime.value)
const refreshInterval = ref(userPreferences.value.refreshInterval)
const showStatistics = ref(true)

const loading = ref({
  services: false,
  metrics: false,
  alerts: false
})

let refreshTimer: number | null = null

// Statistics
const statistics = computed(() => {
  const healthyServices = services.value.filter(s => s.status === 'healthy').length
  const degradedServices = services.value.filter(s => s.status === 'degraded').length
  const downServices = services.value.filter(s => s.status === 'down').length
  const activeAlerts = alerts.value.filter(a => a.status === 'firing' || a.status === 'acknowledged').length

  return {
    healthyServices,
    degradedServices,
    downServices,
    activeAlerts
  }
})

// Overall Metrics
const overallMetrics = computed(() => {
  const metricsArray = Object.values(serviceMetrics.value)
  if (metricsArray.length === 0) {
    return {
      qps: 0,
      p99Latency: 0,
      errorRate: 0,
      cpuUsage: 0,
      qpsTrend: { text: '0%', isIncrease: false, isGood: true },
      latencyTrend: { text: '0%', isIncrease: false, isGood: true },
      errorRateTrend: { text: '0%', isIncrease: false, isGood: true }
    }
  }

  const totalQps = metricsArray.reduce((sum, m) => sum + (m.qps || 0), 0)
  const avgP99 = metricsArray.reduce((sum, m) => sum + (m.p99Latency || 0), 0) / metricsArray.length
  const avgErrorRate = metricsArray.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metricsArray.length
  const avgCpu = metricsArray.reduce((sum, m) => sum + (m.cpuUsage || 0), 0) / metricsArray.length

  return {
    qps: Math.round(totalQps),
    p99Latency: Math.round(avgP99),
    errorRate: Number(avgErrorRate.toFixed(2)),
    cpuUsage: Math.round(avgCpu),
    qpsTrend: { text: '+5.2%', isIncrease: true, isGood: true },
    latencyTrend: { text: '-2.1%', isIncrease: false, isGood: true },
    errorRateTrend: { text: '+0.3%', isIncrease: true, isGood: false }
  }
})

// Chart Data
const qpsChartData = computed<TimeSeries[]>(() => {
  return services.value.map(service => {
    const metrics = serviceMetrics.value[service.id]
    if (!metrics?.qpsTimeSeries) return { name: service.displayName, data: [] }
    
    return {
      name: service.displayName,
      data: metrics.qpsTimeSeries.dataPoints.map(dp => ({
        timestamp: dp.timestamp,
        value: dp.value
      })),
      unit: 'req/s'
    }
  })
})

const latencyChartData = computed<TimeSeries[]>(() => {
  return services.value.map(service => {
    const metrics = serviceMetrics.value[service.id]
    if (!metrics?.p99LatencyTimeSeries) return { name: service.displayName, data: [] }
    
    return {
      name: service.displayName,
      data: metrics.p99LatencyTimeSeries.dataPoints.map(dp => ({
        timestamp: dp.timestamp,
        value: dp.value
      })),
      unit: 'ms'
    }
  })
})

const errorRateChartData = computed<TimeSeries[]>(() => {
  return services.value.map(service => {
    const metrics = serviceMetrics.value[service.id]
    if (!metrics?.errorRateTimeSeries) return { name: service.displayName, data: [] }
    
    return {
      name: service.displayName,
      data: metrics.errorRateTimeSeries.dataPoints.map(dp => ({
        timestamp: dp.timestamp,
        value: dp.value
      })),
      unit: '%'
    }
  })
})

const requestDistributionData = computed(() => {
  return services.value.map(service => ({
    name: service.displayName,
    value: serviceMetrics.value[service.id]?.qps || 0
  }))
})

const healthTrendData = computed<TimeSeries[]>(() => {
  return [
    {
      name: '健康',
      data: generateMockTrendData(statistics.value.healthyServices),
      color: '#73bf69'
    },
    {
      name: '降级',
      data: generateMockTrendData(statistics.value.degradedServices),
      color: '#ff9830'
    },
    {
      name: '故障',
      data: generateMockTrendData(statistics.value.downServices),
      color: '#f2495c'
    }
  ]
})

// Helper function to generate mock trend data
function generateMockTrendData(currentValue: number): Array<{ timestamp: number; value: number }> {
  const now = Date.now()
  const data = []
  for (let i = 23; i >= 0; i--) {
    data.push({
      timestamp: now - i * 3600000, // 1 hour intervals
      value: Math.max(0, currentValue + Math.floor(Math.random() * 3 - 1))
    })
  }
  return data
}

// Load Data Functions
async function loadServices() {
  loading.value.services = true
  try {
    const response = await getServices()
    if (response.success && response.data) {
      services.value = response.data
    }
  } catch (error) {
    console.error('Failed to load services:', error)
    ElMessage.error('加载服务列表失败')
  } finally {
    loading.value.services = false
  }
}

async function loadMetrics() {
  loading.value.metrics = true
  try {
    const response = await getAllServicesMetrics(
      timeRange.value.start,
      timeRange.value.end
    )
    if (response.success && response.data) {
      const metricsMap: Record<string, ServiceMetrics> = {}
      response.data.forEach(metrics => {
        metricsMap[metrics.serviceId] = metrics
      })
      serviceMetrics.value = metricsMap
    }
  } catch (error) {
    console.error('Failed to load metrics:', error)
    ElMessage.error('加载指标数据失败')
  } finally {
    loading.value.metrics = false
  }
}

async function loadAlerts() {
  loading.value.alerts = true
  try {
    const response = await getAlerts(filters.value)
    if (response.success && response.data) {
      alerts.value = response.data
    }
  } catch (error) {
    console.error('Failed to load alerts:', error)
    ElMessage.error('加载告警数据失败')
  } finally {
    loading.value.alerts = false
  }
}

async function loadAllData() {
  await Promise.all([
    loadServices(),
    loadMetrics(),
    loadAlerts()
  ])
}

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await loadAllData()
    ElMessage.success('刷新成功')
  } finally {
    isRefreshing.value = false
  }
}

// Event Handlers
function handleServiceClick(service: Service) {
  router.push(`/metrics/${service.id}`)
}

async function handleAcknowledgeAlert(alert: Alert) {
  try {
    const response = await acknowledgeAlert(alert.id, 'current-user')
    if (response.success) {
      ElMessage.success('告警已确认')
      await loadAlerts()
    }
  } catch (error) {
    console.error('Failed to acknowledge alert:', error)
    ElMessage.error('确认告警失败')
  }
}

async function handleResolveAlert(alert: Alert) {
  try {
    const response = await resolveAlert(alert.id)
    if (response.success) {
      ElMessage.success('告警已解决')
      await loadAlerts()
    }
  } catch (error) {
    console.error('Failed to resolve alert:', error)
    ElMessage.error('解决告警失败')
  }
}

function navigateToMetrics(metricType: string) {
  router.push({
    path: '/metrics',
    query: { metric: metricType }
  })
}

function saveSettings() {
  dashboardStore.updateUserPreferences({
    refreshInterval: refreshInterval.value
  })
  
  if (autoRefreshEnabled.value !== isRealtime.value) {
    timeRangeStore.toggleRealtime()
  }
  
  showSettings.value = false
  ElMessage.success('设置已保存')
}

// Auto Refresh
function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  if (autoRefreshEnabled.value) {
    refreshTimer = window.setInterval(() => {
      loadAllData()
    }, refreshInterval.value)
  }
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle
onMounted(() => {
  loadAllData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Watch for realtime changes
import { watch } from 'vue'
watch(isRealtime, (newValue) => {
  autoRefreshEnabled.value = newValue
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

watch([autoRefreshEnabled, refreshInterval], () => {
  startAutoRefresh()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.dashboard-view {
  padding: $spacing-lg;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-color-default;

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .header-icon {
      color: $accent-primary;
    }

    .header-text {
      .header-title {
        font-size: 28px;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 $spacing-xs 0;
      }

      .header-subtitle {
        font-size: 14px;
        color: $text-secondary;
        margin: 0;
      }
    }
  }

  .header-right {
    display: flex;
    gap: $spacing-sm;
  }
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;

  .stat-card {
    background: $background-card;
    border-radius: 8px;
    padding: $spacing-lg;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-elevated;
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.healthy {
        background: rgba(115, 191, 105, 0.1);
        color: $accent-success;
      }

      &.warning {
        background: rgba(255, 152, 48, 0.1);
        color: $accent-warning;
      }

      &.error {
        background: rgba(242, 73, 92, 0.1);
        color: $accent-error;
      }

      &.alert {
        background: rgba(87, 148, 242, 0.1);
        color: $accent-info;
      }
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: $text-primary;
        line-height: 1;
        margin-bottom: $spacing-xs;
      }

      .stat-label {
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: $spacing-lg;

  .grid-item {
    background: $background-card;
    border-radius: 8px;
    overflow: hidden;

    &.service-status {
      grid-column: span 6;
    }

    &.alerts {
      grid-column: span 6;
    }

    &.metric-card {
      grid-column: span 3;
    }

    &.chart-large {
      grid-column: span 6;
    }
  }

  .chart-card {
    padding: $spacing-lg;

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-md;

      .chart-title {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
      }
    }
  }
}

// Responsive
@media (max-width: 1400px) {
  .dashboard-grid {
    .grid-item {
      &.service-status,
      &.alerts,
      &.chart-large {
        grid-column: span 12;
      }

      &.metric-card {
        grid-column: span 6;
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-view {
    padding: $spacing-md;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;

    .header-right {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }

  .dashboard-grid {
    gap: $spacing-md;

    .grid-item {
      grid-column: span 12 !important;
    }
  }
}
</style>
