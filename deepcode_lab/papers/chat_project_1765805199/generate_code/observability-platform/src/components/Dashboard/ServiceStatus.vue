<template>
  <div
    :class="[
      'service-status',
      `service-status--${size}`,
      {
        'service-status--compact': compact,
        'service-status--clickable': clickable,
        'service-status--loading': loading,
      },
    ]"
    @click="handleClick"
  >
    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" type="card" :rows="3" :show-avatar="true" />

    <!-- Error State -->
    <EmptyState
      v-else-if="error"
      type="error"
      :title="error"
      :show-action="false"
      :min-height="compact ? '150px' : '200px'"
    />

    <!-- Content -->
    <div v-else class="service-status__content">
      <!-- Header -->
      <div v-if="showHeader" class="service-status__header">
        <div class="service-status__header-left">
          <el-icon v-if="icon" :size="iconSize" class="service-status__icon">
            <component :is="icon" />
          </el-icon>
          <div class="service-status__title-group">
            <h3 class="service-status__title">{{ title }}</h3>
            <p v-if="subtitle" class="service-status__subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="service-status__header-right">
          <el-button
            v-if="showRefresh"
            :size="size"
            :icon="RefreshRight"
            circle
            @click.stop="handleRefresh"
          />
          <el-dropdown v-if="showActions" trigger="click" @command="handleAction">
            <el-button :size="size" :icon="MoreFilled" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="detail" :icon="View">
                  查看详情
                </el-dropdown-item>
                <el-dropdown-item command="metrics" :icon="TrendCharts">
                  查看指标
                </el-dropdown-item>
                <el-dropdown-item command="traces" :icon="Connection">
                  查看链路
                </el-dropdown-item>
                <el-dropdown-item command="logs" :icon="Document">
                  查看日志
                </el-dropdown-item>
                <el-dropdown-item divided command="export" :icon="Download">
                  导出数据
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Service List -->
      <div class="service-status__list">
        <div
          v-for="service in displayedServices"
          :key="service.id"
          :class="[
            'service-status__item',
            `service-status__item--${service.status}`,
            { 'service-status__item--clickable': clickable },
          ]"
          @click.stop="handleServiceClick(service)"
        >
          <!-- Status Indicator -->
          <div class="service-status__indicator">
            <div
              class="service-status__indicator-dot"
              :style="{ backgroundColor: getStatusColor(service.status) }"
            />
            <div
              v-if="showPulse && service.status === 'healthy'"
              class="service-status__indicator-pulse"
              :style="{ backgroundColor: getStatusColor(service.status) }"
            />
          </div>

          <!-- Service Info -->
          <div class="service-status__info">
            <div class="service-status__info-header">
              <span class="service-status__name">{{ service.displayName || service.name }}</span>
              <el-tag
                v-if="showEnvironment"
                :type="getEnvironmentType(service.environment)"
                size="small"
                effect="plain"
              >
                {{ service.environment }}
              </el-tag>
            </div>
            <div v-if="showDetails" class="service-status__info-details">
              <span v-if="showRegion" class="service-status__detail">
                <el-icon><Location /></el-icon>
                {{ service.region }}
              </span>
              <span v-if="service.metadata?.version" class="service-status__detail">
                <el-icon><Box /></el-icon>
                v{{ service.metadata.version }}
              </span>
              <span v-if="service.metadata?.instances" class="service-status__detail">
                <el-icon><Monitor /></el-icon>
                {{ service.metadata.instances }} 实例
              </span>
            </div>
          </div>

          <!-- Metrics -->
          <div v-if="showMetrics && serviceMetrics[service.id]" class="service-status__metrics">
            <div
              v-for="metric in getDisplayMetrics(serviceMetrics[service.id])"
              :key="metric.label"
              class="service-status__metric"
            >
              <span class="service-status__metric-label">{{ metric.label }}</span>
              <span
                class="service-status__metric-value"
                :style="{ color: metric.color }"
              >
                {{ metric.value }}
              </span>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="service-status__badge">
            <el-tag
              :type="getStatusType(service.status)"
              :effect="compact ? 'plain' : 'dark'"
              size="small"
            >
              {{ getStatusText(service.status) }}
            </el-tag>
          </div>

          <!-- Actions -->
          <div v-if="showItemActions" class="service-status__item-actions">
            <el-button
              :size="size"
              :icon="ArrowRight"
              circle
              @click.stop="handleServiceClick(service)"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-if="displayedServices.length === 0"
        type="no-services"
        title="暂无服务"
        description="当前没有可显示的服务"
        :show-action="false"
        :min-height="compact ? '150px' : '200px'"
      />

      <!-- Footer -->
      <div v-if="showFooter && services.length > pageSize" class="service-status__footer">
        <el-button
          v-if="!showAll"
          :size="size"
          text
          @click="showAll = true"
        >
          显示全部 ({{ services.length }})
        </el-button>
        <el-button
          v-else
          :size="size"
          text
          @click="showAll = false"
        >
          收起
        </el-button>
      </div>

      <!-- Statistics -->
      <div v-if="showStatistics" class="service-status__statistics">
        <div class="service-status__stat">
          <span class="service-status__stat-label">总计</span>
          <span class="service-status__stat-value">{{ services.length }}</span>
        </div>
        <div
          v-for="status in ['healthy', 'degraded', 'down', 'unknown']"
          :key="status"
          class="service-status__stat"
        >
          <span class="service-status__stat-label">{{ getStatusText(status as ServiceStatus) }}</span>
          <span
            class="service-status__stat-value"
            :style="{ color: getStatusColor(status as ServiceStatus) }"
          >
            {{ getStatusCount(status as ServiceStatus) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Component } from 'vue'
import {
  RefreshRight,
  MoreFilled,
  View,
  TrendCharts,
  Connection,
  Document,
  Download,
  ArrowRight,
  Location,
  Box,
  Monitor,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import type { Service, ServiceStatus, Environment } from '@/types'
import type { ServiceMetrics } from '@/types/metrics'
import { getServiceStatusColor } from '@/utils/color'
import { formatMetricValue, formatPercent } from '@/utils/format'

// Props
interface Props {
  services?: Service[]
  serviceMetrics?: Record<string, ServiceMetrics>
  title?: string
  subtitle?: string
  icon?: Component
  showHeader?: boolean
  showRefresh?: boolean
  showActions?: boolean
  showItemActions?: boolean
  showEnvironment?: boolean
  showRegion?: boolean
  showDetails?: boolean
  showMetrics?: boolean
  showStatistics?: boolean
  showFooter?: boolean
  showPulse?: boolean
  pageSize?: number
  size?: 'large' | 'default' | 'small'
  compact?: boolean
  clickable?: boolean
  loading?: boolean
  error?: string | null
  iconSize?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  services: () => [],
  serviceMetrics: () => ({}),
  title: '服务状态',
  showHeader: true,
  showRefresh: true,
  showActions: true,
  showItemActions: true,
  showEnvironment: true,
  showRegion: true,
  showDetails: true,
  showMetrics: true,
  showStatistics: false,
  showFooter: true,
  showPulse: true,
  pageSize: 5,
  size: 'default',
  compact: false,
  clickable: true,
  loading: false,
  error: null,
  iconSize: 20,
  autoRefresh: false,
  refreshInterval: 30000,
})

// Emits
const emit = defineEmits<{
  refresh: []
  click: [service?: Service]
  serviceClick: [service: Service]
  action: [command: string, service?: Service]
}>()

// State
const showAll = ref(false)
let refreshTimer: number | null = null

// Computed
const displayedServices = computed(() => {
  if (showAll.value || props.services.length <= props.pageSize) {
    return props.services
  }
  return props.services.slice(0, props.pageSize)
})

// Methods
const getStatusColor = (status: ServiceStatus): string => {
  return getServiceStatusColor(status)
}

const getStatusType = (status: ServiceStatus): 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<ServiceStatus, 'success' | 'warning' | 'danger' | 'info'> = {
    healthy: 'success',
    degraded: 'warning',
    down: 'danger',
    unknown: 'info',
  }
  return typeMap[status]
}

const getStatusText = (status: ServiceStatus): string => {
  const textMap: Record<ServiceStatus, string> = {
    healthy: '健康',
    degraded: '降级',
    down: '故障',
    unknown: '未知',
  }
  return textMap[status]
}

const getEnvironmentType = (env: Environment): 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<Environment, 'success' | 'warning' | 'danger' | 'info'> = {
    production: 'danger',
    staging: 'warning',
    development: 'info',
    test: 'success',
  }
  return typeMap[env]
}

const getStatusCount = (status: ServiceStatus): number => {
  return props.services.filter((s) => s.status === status).length
}

const getDisplayMetrics = (metrics: ServiceMetrics) => {
  const result = []

  if (metrics.qps !== undefined) {
    result.push({
      label: 'QPS',
      value: formatMetricValue(metrics.qps, 'rate', 0),
      color: metrics.qps > 1000 ? '#73bf69' : undefined,
    })
  }

  if (metrics.errorRate !== undefined) {
    const color = metrics.errorRate > 5 ? '#f2495c' : metrics.errorRate > 2 ? '#ff9830' : '#73bf69'
    result.push({
      label: '错误率',
      value: formatPercent(metrics.errorRate / 100, 2),
      color,
    })
  }

  if (metrics.p99 !== undefined) {
    const color = metrics.p99 > 1000 ? '#f2495c' : metrics.p99 > 500 ? '#ff9830' : '#73bf69'
    result.push({
      label: 'P99',
      value: formatMetricValue(metrics.p99, 'milliseconds', 0),
      color,
    })
  }

  return result.slice(0, props.compact ? 2 : 3)
}

const handleClick = () => {
  if (props.clickable && !props.loading) {
    emit('click')
  }
}

const handleServiceClick = (service: Service) => {
  if (props.clickable) {
    emit('serviceClick', service)
  }
}

const handleRefresh = () => {
  emit('refresh')
  ElMessage.success('刷新成功')
}

const handleAction = (command: string) => {
  emit('action', command)
}

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      emit('refresh')
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle
onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

watch(
  () => [props.autoRefresh, props.refreshInterval],
  () => {
    stopAutoRefresh()
    startAutoRefresh()
  }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.service-status {
  background: $background-card;
  border-radius: 8px;
  border: 1px solid $border-default;
  transition: all 0.3s ease;

  &--clickable {
    cursor: pointer;

    &:hover {
      border-color: $border-hover;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  &--loading {
    pointer-events: none;
  }

  &--compact {
    .service-status__header {
      padding: 12px 16px;
    }

    .service-status__list {
      padding: 0 16px 12px;
    }

    .service-status__item {
      padding: 8px 0;
    }
  }

  &--small {
    font-size: 12px;
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $border-default;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    color: $accent-primary;
    flex-shrink: 0;
  }

  &__title-group {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
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

  &__list {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid $border-default;
    transition: all 0.2s ease;

    &:last-child {
      border-bottom: none;
    }

    &--clickable {
      cursor: pointer;

      &:hover {
        background: rgba($accent-primary, 0.05);
        border-radius: 4px;
        padding-left: 8px;
        padding-right: 8px;
      }
    }
  }

  &__indicator {
    position: relative;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  &__indicator-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: relative;
    z-index: 1;
  }

  &__indicator-pulse {
    position: absolute;
    top: 0;
    left: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    opacity: 0.6;
    animation: pulse 2s ease-in-out infinite;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    @include text-ellipsis;
  }

  &__info-details {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__detail {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: $text-secondary;

    .el-icon {
      font-size: 12px;
    }
  }

  &__metrics {
    display: flex;
    gap: 16px;
    flex-shrink: 0;
  }

  &__metric {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  &__metric-label {
    font-size: 11px;
    color: $text-secondary;
  }

  &__metric-value {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }

  &__badge {
    flex-shrink: 0;
  }

  &__item-actions {
    flex-shrink: 0;
  }

  &__footer {
    padding: 12px 20px;
    border-top: 1px solid $border-default;
    text-align: center;
  }

  &__statistics {
    display: flex;
    gap: 24px;
    padding: 16px 20px;
    border-top: 1px solid $border-default;
    background: rgba($background-secondary, 0.5);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__stat-label {
    font-size: 12px;
    color: $text-secondary;
  }

  &__stat-value {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .service-status {
    &__header {
      padding: 12px 16px;
    }

    &__list {
      padding: 12px 16px;
    }

    &__item {
      flex-wrap: wrap;
    }

    &__metrics {
      width: 100%;
      justify-content: space-between;
      margin-top: 8px;
    }

    &__statistics {
      flex-wrap: wrap;
      gap: 16px;
    }

    &__stat {
      flex: 1;
      min-width: calc(50% - 8px);
    }
  }
}
</style>
