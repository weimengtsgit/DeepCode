<template>
  <div class="alert-panel" :class="{ 'is-compact': compact, 'is-mobile': isMobile }">
    <!-- Header -->
    <div v-if="showHeader" class="alert-panel-header">
      <div class="header-left">
        <el-icon v-if="icon" class="header-icon">
          <component :is="icon" />
        </el-icon>
        <div class="header-title">
          <h3>{{ title }}</h3>
          <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-badge v-if="showCount" :value="activeAlertCount" :type="activeAlertCount > 0 ? 'danger' : 'info'" :max="99">
          <el-button :size="size" text>
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
        <el-button v-if="showRefresh" :size="size" :icon="RefreshRight" text @click="handleRefresh" :loading="loading">
          刷新
        </el-button>
        <el-dropdown v-if="showActions" trigger="click" @command="handleAction">
          <el-button :size="size" text>
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="acknowledge-all">
                <el-icon><Check /></el-icon>
                确认所有
              </el-dropdown-item>
              <el-dropdown-item command="export">
                <el-icon><Download /></el-icon>
                导出告警
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                告警设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="showFilters" class="alert-panel-filters">
      <el-select
        v-model="selectedSeverity"
        :size="size"
        placeholder="严重程度"
        clearable
        style="width: 140px"
        @change="handleFilterChange"
      >
        <el-option label="全部" value="" />
        <el-option label="严重" value="critical">
          <el-icon color="#f2495c"><CircleClose /></el-icon>
          严重
        </el-option>
        <el-option label="警告" value="warning">
          <el-icon color="#ff9830"><Warning /></el-icon>
          警告
        </el-option>
        <el-option label="信息" value="info">
          <el-icon color="#5794f2"><InfoFilled /></el-icon>
          信息
        </el-option>
      </el-select>

      <el-select
        v-model="selectedStatus"
        :size="size"
        placeholder="状态"
        clearable
        style="width: 120px"
        @change="handleFilterChange"
      >
        <el-option label="全部" value="" />
        <el-option label="触发中" value="firing" />
        <el-option label="已确认" value="acknowledged" />
        <el-option label="已解决" value="resolved" />
      </el-select>

      <el-select
        v-if="showServiceFilter"
        v-model="selectedService"
        :size="size"
        placeholder="服务"
        clearable
        filterable
        style="width: 160px"
        @change="handleFilterChange"
      >
        <el-option label="全部服务" value="" />
        <el-option
          v-for="service in availableServices"
          :key="service"
          :label="service"
          :value="service"
        />
      </el-select>

      <el-input
        v-if="showSearch"
        v-model="searchQuery"
        :size="size"
        placeholder="搜索告警..."
        clearable
        style="width: 200px"
        @input="handleFilterChange"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Alert List -->
    <div class="alert-panel-content" :style="{ maxHeight }">
      <LoadingSkeleton v-if="loading" type="list" :rows="5" />
      <EmptyState
        v-else-if="filteredAlerts.length === 0"
        type="no-alerts"
        :title="hasFilters ? '未找到匹配的告警' : '暂无告警'"
        :description="hasFilters ? '尝试调整筛选条件' : '系统运行正常，没有活跃告警'"
        :show-action="hasFilters"
        action-text="清除筛选"
        @action="handleClearFilters"
      />
      <div v-else class="alert-list">
        <div
          v-for="alert in displayedAlerts"
          :key="alert.id"
          class="alert-item"
          :class="[
            `alert-${alert.severity}`,
            `alert-${alert.status}`,
            { 'is-clickable': clickable }
          ]"
          @click="handleAlertClick(alert)"
        >
          <div class="alert-icon">
            <el-icon :color="getSeverityColor(alert.severity)">
              <component :is="getSeverityIcon(alert.severity)" />
            </el-icon>
          </div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-title">{{ alert.title }}</span>
              <el-tag
                :type="getStatusType(alert.status)"
                :size="size"
                effect="plain"
              >
                {{ getStatusText(alert.status) }}
              </el-tag>
            </div>
            <div class="alert-description">{{ alert.description }}</div>
            <div class="alert-meta">
              <span class="meta-item">
                <el-icon><Monitor /></el-icon>
                {{ alert.service }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatRelativeTime(alert.timestamp) }}
              </span>
              <span v-if="alert.value !== undefined" class="meta-item">
                <el-icon><TrendCharts /></el-icon>
                {{ alert.value }} / {{ alert.threshold }}
              </span>
            </div>
            <div v-if="alert.labels && Object.keys(alert.labels).length > 0" class="alert-labels">
              <el-tag
                v-for="(value, key) in alert.labels"
                :key="key"
                size="small"
                effect="plain"
              >
                {{ key }}: {{ value }}
              </el-tag>
            </div>
          </div>
          <div class="alert-actions">
            <el-button
              v-if="alert.status === 'firing' && showAcknowledge"
              :size="size"
              type="warning"
              text
              @click.stop="handleAcknowledge(alert)"
            >
              <el-icon><Check /></el-icon>
              确认
            </el-button>
            <el-button
              v-if="alert.status !== 'resolved' && showResolve"
              :size="size"
              type="success"
              text
              @click.stop="handleResolve(alert)"
            >
              <el-icon><CircleCheck /></el-icon>
              解决
            </el-button>
            <el-dropdown v-if="showItemActions" trigger="click" @command="(cmd) => handleItemAction(cmd, alert)">
              <el-button :size="size" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">
                    <el-icon><View /></el-icon>
                    查看详情
                  </el-dropdown-item>
                  <el-dropdown-item command="history">
                    <el-icon><Clock /></el-icon>
                    历史记录
                  </el-dropdown-item>
                  <el-dropdown-item command="related">
                    <el-icon><Connection /></el-icon>
                    相关告警
                  </el-dropdown-item>
                  <el-dropdown-item divided command="mute">
                    <el-icon><Mute /></el-icon>
                    静音告警
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="alert-panel-footer">
        <el-button :size="size" text @click="handleLoadMore">
          加载更多 ({{ remainingCount }})
        </el-button>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="showStatistics && !loading" class="alert-panel-statistics">
      <div class="stat-item">
        <span class="stat-label">总计</span>
        <span class="stat-value">{{ filteredAlerts.length }}</span>
      </div>
      <div class="stat-item stat-critical">
        <span class="stat-label">严重</span>
        <span class="stat-value">{{ criticalCount }}</span>
      </div>
      <div class="stat-item stat-warning">
        <span class="stat-label">警告</span>
        <span class="stat-value">{{ warningCount }}</span>
      </div>
      <div class="stat-item stat-info">
        <span class="stat-label">信息</span>
        <span class="stat-value">{{ infoCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, type Component } from 'vue'
import {
  Bell,
  RefreshRight,
  MoreFilled,
  Check,
  Download,
  Setting,
  CircleClose,
  Warning,
  InfoFilled,
  Search,
  Monitor,
  Clock,
  TrendCharts,
  CircleCheck,
  View,
  Connection,
  Mute
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import type { Alert, AlertSeverity, AlertStatus } from '@/types'
import { formatRelativeTime } from '@/utils/format'
import { getAlertSeverityColor } from '@/utils/color'

interface Props {
  alerts?: Alert[]
  title?: string
  subtitle?: string
  icon?: Component
  showHeader?: boolean
  showFilters?: boolean
  showSearch?: boolean
  showServiceFilter?: boolean
  showCount?: boolean
  showRefresh?: boolean
  showActions?: boolean
  showAcknowledge?: boolean
  showResolve?: boolean
  showItemActions?: boolean
  showStatistics?: boolean
  maxHeight?: string
  pageSize?: number
  size?: 'large' | 'default' | 'small'
  compact?: boolean
  isMobile?: boolean
  clickable?: boolean
  loading?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '告警面板',
  showHeader: true,
  showFilters: true,
  showSearch: true,
  showServiceFilter: true,
  showCount: true,
  showRefresh: true,
  showActions: true,
  showAcknowledge: true,
  showResolve: true,
  showItemActions: true,
  showStatistics: true,
  maxHeight: '600px',
  pageSize: 10,
  size: 'default',
  compact: false,
  isMobile: false,
  clickable: true,
  loading: false,
  autoRefresh: false,
  refreshInterval: 30000
})

const emit = defineEmits<{
  refresh: []
  click: [alert: Alert]
  acknowledge: [alert: Alert]
  resolve: [alert: Alert]
  action: [command: string]
  itemAction: [command: string, alert: Alert]
}>()

// Filter state
const selectedSeverity = ref<AlertSeverity | ''>('')
const selectedStatus = ref<AlertStatus | ''>('')
const selectedService = ref('')
const searchQuery = ref('')
const currentPage = ref(1)

// Auto refresh timer
let refreshTimer: number | null = null

// Computed properties
const filteredAlerts = computed(() => {
  if (!props.alerts) return []

  let result = [...props.alerts]

  // Filter by severity
  if (selectedSeverity.value) {
    result = result.filter(alert => alert.severity === selectedSeverity.value)
  }

  // Filter by status
  if (selectedStatus.value) {
    result = result.filter(alert => alert.status === selectedStatus.value)
  }

  // Filter by service
  if (selectedService.value) {
    result = result.filter(alert => alert.service === selectedService.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(alert =>
      alert.title.toLowerCase().includes(query) ||
      alert.description.toLowerCase().includes(query) ||
      alert.service.toLowerCase().includes(query)
    )
  }

  // Sort by timestamp (newest first)
  result.sort((a, b) => b.timestamp - a.timestamp)

  return result
})

const displayedAlerts = computed(() => {
  return filteredAlerts.value.slice(0, currentPage.value * props.pageSize)
})

const hasMore = computed(() => {
  return displayedAlerts.value.length < filteredAlerts.value.length
})

const remainingCount = computed(() => {
  return filteredAlerts.value.length - displayedAlerts.value.length
})

const hasFilters = computed(() => {
  return !!(selectedSeverity.value || selectedStatus.value || selectedService.value || searchQuery.value)
})

const availableServices = computed(() => {
  if (!props.alerts) return []
  return [...new Set(props.alerts.map(alert => alert.service))].sort()
})

const activeAlertCount = computed(() => {
  if (!props.alerts) return 0
  return props.alerts.filter(alert => alert.status === 'firing' || alert.status === 'acknowledged').length
})

const criticalCount = computed(() => {
  return filteredAlerts.value.filter(alert => alert.severity === 'critical').length
})

const warningCount = computed(() => {
  return filteredAlerts.value.filter(alert => alert.severity === 'warning').length
})

const infoCount = computed(() => {
  return filteredAlerts.value.filter(alert => alert.severity === 'info').length
})

// Methods
const getSeverityColor = (severity: AlertSeverity): string => {
  return getAlertSeverityColor(severity)
}

const getSeverityIcon = (severity: AlertSeverity): Component => {
  const icons: Record<AlertSeverity, Component> = {
    critical: CircleClose,
    warning: Warning,
    info: InfoFilled
  }
  return icons[severity]
}

const getStatusType = (status: AlertStatus): 'danger' | 'warning' | 'success' | 'info' => {
  const types: Record<AlertStatus, 'danger' | 'warning' | 'success' | 'info'> = {
    firing: 'danger',
    acknowledged: 'warning',
    resolved: 'success'
  }
  return types[status]
}

const getStatusText = (status: AlertStatus): string => {
  const texts: Record<AlertStatus, string> = {
    firing: '触发中',
    acknowledged: '已确认',
    resolved: '已解决'
  }
  return texts[status]
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleClearFilters = () => {
  selectedSeverity.value = ''
  selectedStatus.value = ''
  selectedService.value = ''
  searchQuery.value = ''
  currentPage.value = 1
}

const handleLoadMore = () => {
  currentPage.value++
}

const handleRefresh = () => {
  emit('refresh')
}

const handleAlertClick = (alert: Alert) => {
  if (props.clickable) {
    emit('click', alert)
  }
}

const handleAcknowledge = (alert: Alert) => {
  emit('acknowledge', alert)
  ElMessage.success('告警已确认')
}

const handleResolve = (alert: Alert) => {
  emit('resolve', alert)
  ElMessage.success('告警已解决')
}

const handleAction = (command: string) => {
  emit('action', command)
}

const handleItemAction = (command: string, alert: Alert) => {
  emit('itemAction', command, alert)
}

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      handleRefresh()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle
onMounted(() => {
  startAutoRefresh()
})

watch(() => props.autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

watch(() => props.refreshInterval, () => {
  stopAutoRefresh()
  startAutoRefresh()
})

// Cleanup
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<script lang="ts">
import { onUnmounted } from 'vue'
export default {
  name: 'AlertPanel'
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.alert-panel {
  display: flex;
  flex-direction: column;
  background: $background-card;
  border-radius: 8px;
  overflow: hidden;

  &.is-compact {
    .alert-panel-header {
      padding: 12px 16px;
    }

    .alert-item {
      padding: 12px;
    }
  }

  &.is-mobile {
    .alert-panel-filters {
      flex-wrap: wrap;
      gap: 8px;

      .el-select,
      .el-input {
        width: 100% !important;
      }
    }

    .alert-item {
      flex-direction: column;
      align-items: flex-start;

      .alert-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 8px;
      }
    }
  }
}

.alert-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $border-default;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 20px;
      color: $accent-primary;
    }

    .header-title {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
      }

      .subtitle {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.alert-panel-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid $border-default;
  background: $background-secondary;
}

.alert-panel-content {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
}

.alert-list {
  display: flex;
  flex-direction: column;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid $border-default;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &.is-clickable {
    cursor: pointer;

    &:hover {
      background: $background-elevated;
    }
  }

  &.alert-resolved {
    opacity: 0.6;
  }

  .alert-icon {
    flex-shrink: 0;
    font-size: 20px;
    margin-top: 2px;
  }

  .alert-content {
    flex: 1;
    min-width: 0;

    .alert-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;

      .alert-title {
        font-size: 14px;
        font-weight: 500;
        color: $text-primary;
      }
    }

    .alert-description {
      font-size: 13px;
      color: $text-secondary;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .alert-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: $text-secondary;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .alert-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
  }

  .alert-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
}

.alert-panel-footer {
  display: flex;
  justify-content: center;
  padding: 16px;
  border-top: 1px solid $border-default;
}

.alert-panel-statistics {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px 20px;
  border-top: 1px solid $border-default;
  background: $background-secondary;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .stat-label {
      font-size: 12px;
      color: $text-secondary;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: $text-primary;
    }

    &.stat-critical .stat-value {
      color: $accent-error;
    }

    &.stat-warning .stat-value {
      color: $accent-warning;
    }

    &.stat-info .stat-value {
      color: $accent-info;
    }
  }
}
</style>
