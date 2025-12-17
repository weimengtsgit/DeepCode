<template>
  <PageContent :is-loading="loading" :has-error="hasError" :error="error" @retry="refresh">
    <!-- Dashboard Header with KPI Summary -->
    <div class="dashboard-header">
      <div class="header-title">
        <h1>Observability Dashboard</h1>
        <p class="subtitle">Real-time monitoring and alerting across all services</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="refresh">
          <span v-if="!isRefreshing">🔄 Refresh</span>
          <span v-else>⏳ Refreshing...</span>
        </button>
      </div>
    </div>

    <!-- Service Health Board -->
    <section class="dashboard-section">
      <h2 class="section-title">Service Health</h2>
      <div class="health-board">
        <div
          v-for="service in services"
          :key="service.id"
          class="health-card"
          :class="`status-${getServiceStatus(service.id)}`"
        >
          <div class="health-header">
            <h3>{{ formatServiceName(service.name) }}</h3>
            <span class="status-badge" :class="`status-${getServiceStatus(service.id)}`">
              {{ getServiceStatus(service.id).toUpperCase() }}
            </span>
          </div>
          <div class="health-metrics">
            <div class="metric-item">
              <span class="metric-label">Error Rate</span>
              <span class="metric-value">{{ getServiceErrorRate(service.id) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Response Time</span>
              <span class="metric-value">{{ getServiceLatency(service.id) }}ms</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">QPS</span>
              <span class="metric-value">{{ getServiceQPS(service.id) }}</span>
            </div>
          </div>
          <button
            class="btn btn-link"
            @click="navigateToMetrics(service.id)"
          >
            View Metrics →
          </button>
        </div>
      </div>
    </section>

    <!-- Key Performance Indicators (KPI Cards) -->
    <section class="dashboard-section">
      <h2 class="section-title">Key Performance Indicators</h2>
      <div class="kpi-grid">
        <MetricCard
          title="Error Rate"
          :value="overallErrorRate"
          unit="%"
          :trend="errorRateTrend"
          :status="errorRateStatus"
          icon="📊"
          @click="navigateToLogs"
        />
        <MetricCard
          title="Response Time (P99)"
          :value="overallLatencyP99"
          unit="ms"
          :trend="latencyTrend"
          :status="latencyStatus"
          icon="⏱️"
          @click="navigateToTraces"
        />
        <MetricCard
          title="Requests/Second"
          :value="overallQPS"
          unit="req/s"
          :trend="qpsTrend"
          :status="'healthy'"
          icon="📈"
        />
        <MetricCard
          title="Resource Utilization"
          :value="overallCPUUsage"
          unit="%"
          :trend="cpuTrend"
          :status="cpuStatus"
          icon="💾"
        />
      </div>
    </section>

    <!-- Alerts Panel -->
    <section class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Active Alerts</h2>
        <span v-if="activeAlertCount > 0" class="alert-badge">{{ activeAlertCount }}</span>
      </div>
      <AlertPanel v-if="!alertsLoading" />
      <div v-else class="loading-placeholder">
        <LoadingSkeleton :count="3" />
      </div>
    </section>

    <!-- Trend Charts -->
    <section class="dashboard-section">
      <h2 class="section-title">Metric Trends (Last 24 Hours)</h2>
      <div class="charts-grid">
        <ChartContainer
          title="Error Rate Trend"
          unit="%"
          :show-legend-toggle="true"
          :show-refresh-button="true"
          @refresh="refreshMetrics"
        >
          <LineChart
            :data="errorRateTrendData"
            :loading="metricsLoading"
            :error="metricsError"
          />
        </ChartContainer>

        <ChartContainer
          title="Response Time (P99) Trend"
          unit="ms"
          :show-legend-toggle="true"
          :show-refresh-button="true"
          @refresh="refreshMetrics"
        >
          <LineChart
            :data="latencyTrendData"
            :loading="metricsLoading"
            :error="metricsError"
          />
        </ChartContainer>

        <ChartContainer
          title="Requests Per Second"
          unit="req/s"
          :show-legend-toggle="true"
          :show-refresh-button="true"
          @refresh="refreshMetrics"
        >
          <LineChart
            :data="qpsTrendData"
            :loading="metricsLoading"
            :error="metricsError"
          />
        </ChartContainer>

        <ChartContainer
          title="CPU Usage"
          unit="%"
          :show-legend-toggle="true"
          :show-refresh-button="true"
          @refresh="refreshMetrics"
        >
          <LineChart
            :data="cpuTrendData"
            :loading="metricsLoading"
            :error="metricsError"
          />
        </ChartContainer>
      </div>
    </section>

    <!-- Service Dependency Overview -->
    <section class="dashboard-section">
      <h2 class="section-title">Service Dependencies</h2>
      <div class="dependency-overview">
        <p class="info-text">
          {{ services.length }} services connected with {{ totalServiceDependencies }} active call relationships
        </p>
        <button class="btn btn-primary" @click="navigateToTraces">
          View Full Topology →
        </button>
      </div>
    </section>
  </PageContent>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMetricsStore } from '@/stores/metricsStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useTimeStore } from '@/stores/timeStore'
import { useMetrics } from '@/composables/useMetrics'
import { useAlerts } from '@/composables/useAlerts'
import { useRealtime } from '@/composables/useRealtime'
import { formatServiceName, formatDuration, formatNumber } from '@/utils/formatters'
import { calculatePercentile } from '@/utils/calculations'
import PageContent from '@/components/Layout/PageContent.vue'
import AlertPanel from '@/components/Alerts/AlertPanel.vue'
import ChartContainer from '@/components/Charts/ChartContainer.vue'
import LineChart from '@/components/Charts/LineChart.vue'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import MetricCard from '@/components/Common/MetricCard.vue'
import { SERVICES } from '@/mock/constants'

// ============================================================================
// STORES & COMPOSABLES
// ============================================================================

const router = useRouter()
const metricsStore = useMetricsStore()
const alertsStore = useAlertsStore()
const tracesStore = useTracesStore()
const timeStore = useTimeStore()

const { data: metricsData, loading: metricsLoading, error: metricsError, refresh: refreshMetrics } = useMetrics()
const { activeCount: activeAlertCount, loading: alertsLoading } = useAlerts()
const { startRefresh, stopRefresh } = useRealtime()

// ============================================================================
// STATE
// ============================================================================

const loading = ref(false)
const hasError = ref(false)
const error = ref<Error | null>(null)
const isRefreshing = ref(false)

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

const services = computed(() => SERVICES)

const totalServiceDependencies = computed(() => {
  // Count unique service-to-service call relationships from traces
  const dependencies = new Set<string>()
  tracesStore.traces.forEach(trace => {
    trace.spans.forEach(span => {
      if (span.parentSpanId) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId)
        if (parentSpan && parentSpan.service !== span.service) {
          const key = `${parentSpan.service}->${span.service}`
          dependencies.add(key)
        }
      }
    })
  })
  return dependencies.size
})

// ============================================================================
// METRIC CALCULATIONS
// ============================================================================

const overallErrorRate = computed(() => {
  const errorRateMetrics = metricsData.value.filter(m => m.metricName === 'ERROR_RATE')
  if (errorRateMetrics.length === 0) return 0
  const values = errorRateMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '0.00'
})

const overallLatencyP99 = computed(() => {
  const latencyMetrics = metricsData.value.filter(m => m.metricName === 'P99_LATENCY')
  if (latencyMetrics.length === 0) return 0
  const values = latencyMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? Math.round(calculatePercentile(values, 99)) : 0
})

const overallQPS = computed(() => {
  const qpsMetrics = metricsData.value.filter(m => m.metricName === 'QPS')
  if (qpsMetrics.length === 0) return 0
  const values = qpsMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
})

const overallCPUUsage = computed(() => {
  const cpuMetrics = metricsData.value.filter(m => m.metricName === 'CPU_USAGE')
  if (cpuMetrics.length === 0) return 0
  const values = cpuMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? Math.round(calculatePercentile(values, 50)) : 0
})

// ============================================================================
// TREND CALCULATIONS
// ============================================================================

const errorRateTrend = computed(() => {
  const errorRateMetrics = metricsData.value.filter(m => m.metricName === 'ERROR_RATE')
  if (errorRateMetrics.length === 0) return 0
  const values = errorRateMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  if (values.length < 2) return 0
  const recent = values.slice(-10).reduce((a, b) => a + b, 0) / 10
  const older = values.slice(-20, -10).reduce((a, b) => a + b, 0) / 10
  return ((recent - older) / older) * 100
})

const latencyTrend = computed(() => {
  const latencyMetrics = metricsData.value.filter(m => m.metricName === 'P99_LATENCY')
  if (latencyMetrics.length === 0) return 0
  const values = latencyMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  if (values.length < 2) return 0
  const recent = values.slice(-10).reduce((a, b) => a + b, 0) / 10
  const older = values.slice(-20, -10).reduce((a, b) => a + b, 0) / 10
  return ((recent - older) / older) * 100
})

const qpsTrend = computed(() => {
  const qpsMetrics = metricsData.value.filter(m => m.metricName === 'QPS')
  if (qpsMetrics.length === 0) return 0
  const values = qpsMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  if (values.length < 2) return 0
  const recent = values.slice(-10).reduce((a, b) => a + b, 0) / 10
  const older = values.slice(-20, -10).reduce((a, b) => a + b, 0) / 10
  return ((recent - older) / older) * 100
})

const cpuTrend = computed(() => {
  const cpuMetrics = metricsData.value.filter(m => m.metricName === 'CPU_USAGE')
  if (cpuMetrics.length === 0) return 0
  const values = cpuMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  if (values.length < 2) return 0
  const recent = values.slice(-10).reduce((a, b) => a + b, 0) / 10
  const older = values.slice(-20, -10).reduce((a, b) => a + b, 0) / 10
  return ((recent - older) / older) * 100
})

// ============================================================================
// STATUS CALCULATIONS
// ============================================================================

const errorRateStatus = computed(() => {
  const rate = parseFloat(overallErrorRate.value as string)
  if (rate > 5) return 'critical'
  if (rate > 1) return 'warning'
  return 'healthy'
})

const latencyStatus = computed(() => {
  const latency = overallLatencyP99.value as number
  if (latency > 1000) return 'critical'
  if (latency > 500) return 'warning'
  return 'healthy'
})

const cpuStatus = computed(() => {
  const cpu = overallCPUUsage.value as number
  if (cpu > 80) return 'critical'
  if (cpu > 60) return 'warning'
  return 'healthy'
})

// ============================================================================
// CHART DATA
// ============================================================================

const errorRateTrendData = computed(() => {
  const errorRateMetrics = metricsData.value.filter(m => m.metricName === 'ERROR_RATE')
  return errorRateMetrics
})

const latencyTrendData = computed(() => {
  const latencyMetrics = metricsData.value.filter(m => m.metricName === 'P99_LATENCY')
  return latencyMetrics
})

const qpsTrendData = computed(() => {
  const qpsMetrics = metricsData.value.filter(m => m.metricName === 'QPS')
  return qpsMetrics
})

const cpuTrendData = computed(() => {
  const cpuMetrics = metricsData.value.filter(m => m.metricName === 'CPU_USAGE')
  return cpuMetrics
})

// ============================================================================
// SERVICE-SPECIFIC METRICS
// ============================================================================

function getServiceStatus(serviceId: string): 'healthy' | 'warning' | 'critical' {
  const errorRate = getServiceErrorRate(serviceId)
  if (errorRate > 5) return 'critical'
  if (errorRate > 1) return 'warning'
  return 'healthy'
}

function getServiceErrorRate(serviceId: string): number {
  const errorRateMetrics = metricsData.value.filter(
    m => m.metricName === 'ERROR_RATE' && m.serviceId === serviceId
  )
  if (errorRateMetrics.length === 0) return 0
  const values = errorRateMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0
}

function getServiceLatency(serviceId: string): number {
  const latencyMetrics = metricsData.value.filter(
    m => m.metricName === 'P99_LATENCY' && m.serviceId === serviceId
  )
  if (latencyMetrics.length === 0) return 0
  const values = latencyMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? Math.round(calculatePercentile(values, 99)) : 0
}

function getServiceQPS(serviceId: string): number {
  const qpsMetrics = metricsData.value.filter(
    m => m.metricName === 'QPS' && m.serviceId === serviceId
  )
  if (qpsMetrics.length === 0) return 0
  const values = qpsMetrics.flatMap(m => m.dataPoints.map(p => p.value))
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateToMetrics(serviceId: string) {
  router.push({
    name: 'metrics',
    query: { service: serviceId }
  })
}

function navigateToTraces() {
  router.push({
    name: 'tracing',
    query: {
      startTime: timeStore.startTime.toISOString(),
      endTime: timeStore.endTime.toISOString()
    }
  })
}

function navigateToLogs() {
  router.push({
    name: 'logs',
    query: {
      startTime: timeStore.startTime.toISOString(),
      endTime: timeStore.endTime.toISOString()
    }
  })
}

// ============================================================================
// LIFECYCLE
// ============================================================================

async function refresh() {
  try {
    isRefreshing.value = true
    hasError.value = false
    error.value = null
    await refreshMetrics()
  } catch (err) {
    hasError.value = true
    error.value = err instanceof Error ? err : new Error('Failed to refresh dashboard')
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  // Initial data load
  refresh()

  // Setup real-time refresh if enabled
  if (timeStore.isRealTime) {
    startRefresh(() => {
      refreshMetrics()
    })
  }

  // Watch for real-time mode changes
  watch(() => timeStore.isRealTime, (newVal) => {
    if (newVal) {
      startRefresh(() => {
        refreshMetrics()
      })
    } else {
      stopRefresh()
    }
  })
})

onUnmounted(() => {
  stopRefresh()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border-radius: 8px;
  border: 1px solid $color-border;

  .header-title {
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: $color-text-primary;
    }

    .subtitle {
      margin: $spacing-xs 0 0 0;
      font-size: 14px;
      color: $color-text-secondary;
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.dashboard-section {
  margin-bottom: $spacing-xl;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    .alert-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 $spacing-xs;
      background: $color-error;
      color: white;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
  }
}

.section-title {
  margin: 0 0 $spacing-md 0;
  font-size: 18px;
  font-weight: 600;
  color: $color-text-primary;
  border-bottom: 2px solid $color-primary;
  padding-bottom: $spacing-sm;
}

.health-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-md;

  .health-card {
    padding: $spacing-md;
    background: $color-bg-secondary;
    border: 2px solid $color-border;
    border-radius: 8px;
    transition: all 0.3s ease;

    &.status-healthy {
      border-color: $color-success;
      background: rgba(115, 191, 105, 0.05);
    }

    &.status-warning {
      border-color: $color-warning;
      background: rgba(255, 152, 48, 0.05);
    }

    &.status-critical {
      border-color: $color-error;
      background: rgba(242, 73, 92, 0.05);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .health-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-md;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: $color-text-primary;
      }

      .status-badge {
        padding: $spacing-xs $spacing-sm;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;

        &.status-healthy {
          background: $color-success;
          color: white;
        }

        &.status-warning {
          background: $color-warning;
          color: white;
        }

        &.status-critical {
          background: $color-error;
          color: white;
        }
      }
    }

    .health-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-sm;
      margin-bottom: $spacing-md;

      .metric-item {
        display: flex;
        flex-direction: column;

        .metric-label {
          font-size: 12px;
          color: $color-text-secondary;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 16px;
          font-weight: 600;
          color: $color-text-primary;
        }
      }
    }

    .btn-link {
      width: 100%;
      padding: $spacing-sm;
      background: transparent;
      color: $color-primary;
      border: 1px solid $color-primary;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: $color-primary;
        color: white;
      }
    }
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: $spacing-md;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $spacing-md;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.loading-placeholder {
  padding: $spacing-lg;
  background: $color-bg-secondary;
  border-radius: 8px;
  border: 1px solid $color-border;
}

.dependency-overview {
  padding: $spacing-md;
  background: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .info-text {
    margin: 0;
    color: $color-text-secondary;
    font-size: 14px;
  }

  .btn-primary {
    padding: $spacing-sm $spacing-md;
    background: $color-primary;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: darken($color-primary, 10%);
    }
  }
}

.btn {
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.btn-secondary {
    background: $color-bg-tertiary;
    color: $color-text-primary;
    border: 1px solid $color-border;

    &:hover {
      background: $color-border;
    }
  }

  &.btn-primary {
    background: $color-primary;
    color: white;

    &:hover {
      background: darken($color-primary, 10%);
    }
  }
}
</style>
