<template>
  <PageContent :is-loading="loading" :has-error="hasError" :error="error" @retry="refresh">
    <div class="metrics-container">
      <!-- Header Section -->
      <div class="metrics-header">
        <h1>Metrics Analysis</h1>
        <div class="header-controls">
          <div class="service-selector">
            <label>Service:</label>
            <select v-model="selectedService" @change="onServiceChange">
              <option value="">All Services</option>
              <option v-for="service in availableServices" :key="service.id" :value="service.id">
                {{ service.displayName }}
              </option>
            </select>
          </div>
          <button @click="refresh" class="btn-refresh">Refresh</button>
        </div>
      </div>

      <!-- Main Content: Two-Column Layout -->
      <div class="metrics-content">
        <!-- Left Panel: Service List -->
        <div class="service-list-panel">
          <div class="panel-header">
            <h2>Services</h2>
            <input 
              v-model="serviceSearchQuery" 
              type="text" 
              placeholder="Search services..."
              class="search-input"
            />
          </div>
          <div class="service-list">
            <div 
              v-for="service in filteredServices" 
              :key="service.id"
              :class="['service-item', { active: selectedService === service.id }]"
              @click="selectService(service.id)"
            >
              <div class="service-status" :class="getServiceStatus(service.id)"></div>
              <div class="service-info">
                <div class="service-name">{{ service.displayName }}</div>
                <div class="service-meta">{{ service.id }}</div>
              </div>
              <div class="service-error-rate">
                {{ getServiceErrorRate(service.id).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Metric Details -->
        <div class="metric-detail-panel">
          <div class="panel-header">
            <div class="tabs">
              <button 
                v-for="tab in metricTabs" 
                :key="tab"
                :class="['tab', { active: activeTab === tab }]"
                @click="activeTab = tab"
              >
                {{ formatTabName(tab) }}
              </button>
            </div>
          </div>

          <!-- Metrics Tab -->
          <div v-if="activeTab === 'metrics'" class="tab-content">
            <div class="metrics-grid">
              <div 
                v-for="metric in displayMetrics" 
                :key="metric.metricId"
                class="metric-chart-wrapper"
              >
                <ChartContainer 
                  :title="metric.metricName"
                  :unit="metric.unit"
                  :height="400"
                  show-legend-toggle
                  show-refresh-button
                  show-export-button
                  @refresh="refresh"
                >
                  <LineChart 
                    :data="metric"
                    :loading="loading"
                    :error="error"
                  />
                </ChartContainer>
              </div>
            </div>
          </div>

          <!-- Comparison Tab -->
          <div v-if="activeTab === 'comparison'" class="tab-content">
            <div class="comparison-controls">
              <label>Compare Services:</label>
              <div class="service-checkboxes">
                <label v-for="service in availableServices" :key="service.id" class="checkbox">
                  <input 
                    type="checkbox" 
                    :value="service.id"
                    v-model="comparisonServices"
                  />
                  {{ service.displayName }}
                </label>
              </div>
            </div>
            <div class="comparison-grid">
              <div 
                v-for="metric in comparisonMetrics" 
                :key="metric.metricId"
                class="comparison-chart-wrapper"
              >
                <ChartContainer 
                  :title="`${metric.metricName} Comparison`"
                  :unit="metric.unit"
                  :height="400"
                  show-legend-toggle
                >
                  <BarChart 
                    :data="metric"
                    :loading="loading"
                  />
                </ChartContainer>
              </div>
            </div>
          </div>

          <!-- Statistics Tab -->
          <div v-if="activeTab === 'statistics'" class="tab-content">
            <div class="statistics-grid">
              <div 
                v-for="metric in displayMetrics" 
                :key="metric.metricId"
                class="stat-card"
              >
                <h3>{{ metric.metricName }}</h3>
                <div class="stat-values">
                  <div class="stat-row">
                    <span class="stat-label">Min:</span>
                    <span class="stat-value">{{ formatMetricValue(getMetricStats(metric).min, metric.unit) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">Max:</span>
                    <span class="stat-value">{{ formatMetricValue(getMetricStats(metric).max, metric.unit) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">Avg:</span>
                    <span class="stat-value">{{ formatMetricValue(getMetricStats(metric).avg, metric.unit) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">P50:</span>
                    <span class="stat-value">{{ formatMetricValue(getMetricStats(metric).p50, metric.unit) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">P90:</span>
                    <span class="stat-value">{{ formatMetricValue(getMetricStats(metric).p90, metric.unit) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">P99:</span>
                    <span class="stat-value">{{ formatMetricValue(getMetricStats(metric).p99, metric.unit) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageContent>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import { useMetrics } from '@/composables/useMetrics'
import { useRealtime } from '@/composables/useRealtime'
import { formatMetricValue } from '@/utils/formatters'
import { calculateMetricStats } from '@/utils/calculations'
import PageContent from '@/components/Layout/PageContent.vue'
import ChartContainer from '@/components/Charts/ChartContainer.vue'
import LineChart from '@/components/Charts/LineChart.vue'
import BarChart from '@/components/Charts/BarChart.vue'
import { SERVICES, METRIC_DISPLAY_NAMES, METRIC_UNITS } from '@/mock/constants'

// State
const router = useRouter()
const route = useRoute()
const metricsStore = useMetricsStore()
const timeStore = useTimeStore()
const filterStore = useFilterStore()

const selectedService = ref<string>('')
const serviceSearchQuery = ref<string>('')
const activeTab = ref<'metrics' | 'comparison' | 'statistics'>('metrics')
const comparisonServices = ref<string[]>([])
const metricTabs = ['metrics', 'comparison', 'statistics'] as const

// Initialize from route query params
onMounted(() => {
  if (route.query.service) {
    selectedService.value = route.query.service as string
  }
})

// Composables
const { data: metricsData, loading, error, refresh } = useMetrics(selectedService, undefined)
const { startRefresh, stopRefresh } = useRealtime()

// Real-time refresh setup
onMounted(() => {
  if (timeStore.isRealTime) {
    startRefresh(() => refresh())
  }
})

onUnmounted(() => {
  stopRefresh()
})

// Computed properties
const availableServices = computed(() => SERVICES)

const filteredServices = computed(() => {
  if (!serviceSearchQuery.value) return availableServices.value
  return availableServices.value.filter(s => 
    s.displayName.toLowerCase().includes(serviceSearchQuery.value.toLowerCase()) ||
    s.id.toLowerCase().includes(serviceSearchQuery.value.toLowerCase())
  )
})

const displayMetrics = computed(() => {
  if (!selectedService.value || !metricsData.value) return []
  return metricsData.value.filter(m => m.serviceId === selectedService.value)
})

const comparisonMetrics = computed(() => {
  if (comparisonServices.value.length === 0) return []
  return metricsData.value?.filter(m => comparisonServices.value.includes(m.serviceId)) || []
})

const hasError = computed(() => !!error.value)

// Methods
const selectService = (serviceId: string) => {
  selectedService.value = serviceId
  router.push({ query: { service: serviceId } })
}

const onServiceChange = () => {
  if (selectedService.value) {
    selectService(selectedService.value)
  }
}

const getServiceStatus = (serviceId: string): string => {
  const errorRate = getServiceErrorRate(serviceId)
  if (errorRate > 5) return 'critical'
  if (errorRate > 1) return 'warning'
  return 'healthy'
}

const getServiceErrorRate = (serviceId: string): number => {
  const metrics = metricsData.value?.filter(m => m.serviceId === serviceId && m.metricName === 'ERROR_RATE') || []
  if (metrics.length === 0) return 0
  const lastPoint = metrics[0]?.dataPoints[metrics[0].dataPoints.length - 1]
  return lastPoint?.value || 0
}

const getMetricStats = (metric: any) => {
  return calculateMetricStats(metric.dataPoints || [])
}

const formatTabName = (tab: string): string => {
  return tab.charAt(0).toUpperCase() + tab.slice(1)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.metrics-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-lg;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: $color-text-primary;
    margin: 0;
  }

  .header-controls {
    display: flex;
    gap: $spacing-md;
    align-items: center;

    .service-selector {
      display: flex;
      gap: $spacing-sm;
      align-items: center;

      label {
        color: $color-text-secondary;
        font-weight: 500;
      }

      select {
        padding: $spacing-sm $spacing-md;
        background-color: $color-bg-secondary;
        color: $color-text-primary;
        border: 1px solid $color-border;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          border-color: $color-primary;
        }
      }
    }

    .btn-refresh {
      padding: $spacing-sm $spacing-md;
      background-color: $color-primary;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: darken($color-primary, 10%);
      }
    }
  }
}

.metrics-content {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: $spacing-lg;
  min-height: 600px;
}

.service-list-panel,
.metric-detail-panel {
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: $spacing-md;
  border-bottom: 1px solid $color-border;
  background-color: $color-bg-tertiary;

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: $color-text-primary;
    margin: 0 0 $spacing-sm 0;
  }

  .search-input {
    width: 100%;
    padding: $spacing-sm;
    background-color: $color-bg-secondary;
    color: $color-text-primary;
    border: 1px solid $color-border;
    border-radius: 4px;
    font-size: 14px;

    &::placeholder {
      color: $color-text-tertiary;
    }

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 2px rgba($color-primary, 0.1);
    }
  }

  .tabs {
    display: flex;
    gap: $spacing-sm;
    border-bottom: 1px solid $color-border;
    margin: -$spacing-md -$spacing-md 0 -$spacing-md;
    padding: $spacing-md $spacing-md 0 $spacing-md;

    .tab {
      padding: $spacing-sm $spacing-md;
      background: none;
      border: none;
      color: $color-text-secondary;
      cursor: pointer;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: all 0.3s ease;

      &:hover {
        color: $color-text-primary;
      }

      &.active {
        color: $color-primary;
        border-bottom-color: $color-primary;
      }
    }
  }
}

.service-list {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-sm;

  .service-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-xs;
    background-color: $color-bg-tertiary;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: lighten($color-bg-tertiary, 5%);
      border-color: $color-border;
    }

    &.active {
      background-color: rgba($color-primary, 0.1);
      border-color: $color-primary;
    }

    .service-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.healthy {
        background-color: #73bf69;
      }

      &.warning {
        background-color: #ff9830;
      }

      &.critical {
        background-color: #f2495c;
      }
    }

    .service-info {
      flex: 1;

      .service-name {
        font-size: 14px;
        font-weight: 500;
        color: $color-text-primary;
      }

      .service-meta {
        font-size: 12px;
        color: $color-text-tertiary;
      }
    }

    .service-error-rate {
      font-size: 12px;
      font-weight: 600;
      color: $color-text-secondary;
      min-width: 40px;
      text-align: right;
    }
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: $spacing-lg;
}

.metric-chart-wrapper {
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: $spacing-md;
}

.comparison-controls {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background-color: $color-bg-tertiary;
  border-radius: 8px;

  label {
    display: block;
    margin-bottom: $spacing-sm;
    color: $color-text-primary;
    font-weight: 500;
  }

  .service-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;

    .checkbox {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      cursor: pointer;
      color: $color-text-secondary;

      input {
        cursor: pointer;
      }

      &:hover {
        color: $color-text-primary;
      }
    }
  }
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: $spacing-lg;
}

.comparison-chart-wrapper {
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: $spacing-md;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;

  .stat-card {
    background-color: $color-bg-tertiary;
    border: 1px solid $color-border;
    border-radius: 8px;
    padding: $spacing-md;

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: $color-text-primary;
      margin: 0 0 $spacing-md 0;
      border-bottom: 1px solid $color-border;
      padding-bottom: $spacing-sm;
    }

    .stat-values {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;

      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .stat-label {
          font-size: 12px;
          color: $color-text-secondary;
          font-weight: 500;
        }

        .stat-value {
          font-size: 14px;
          color: $color-text-primary;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
}

@media (max-width: 1400px) {
  .metrics-content {
    grid-template-columns: 1fr;
  }

  .metrics-grid,
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
