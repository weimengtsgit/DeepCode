<template>
  <div class="topbar" :class="{ 'is-mobile': isMobile }">
    <!-- Left Section: Breadcrumbs -->
    <div class="topbar-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :to="item.path ? { path: item.path } : undefined"
        >
          {{ item.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- Right Section: Controls -->
    <div class="topbar-right">
      <!-- Time Range Picker -->
      <div class="topbar-control">
        <TimeRangePicker />
      </div>

      <!-- Filters -->
      <div class="topbar-control" v-if="showFilters">
        <el-popover
          placement="bottom-end"
          :width="400"
          trigger="click"
          :visible="filtersVisible"
          @update:visible="filtersVisible = $event"
        >
          <template #reference>
            <el-button
              :type="hasActiveFilters ? 'primary' : 'default'"
              :icon="Filter"
            >
              筛选
              <el-badge
                v-if="activeFilterCount > 0"
                :value="activeFilterCount"
                class="filter-badge"
              />
            </el-button>
          </template>
          <div class="filters-panel">
            <MultiFilter @close="filtersVisible = false" />
          </div>
        </el-popover>
      </div>

      <!-- Refresh Control -->
      <div class="topbar-control">
        <el-dropdown
          trigger="click"
          @command="handleRefreshCommand"
        >
          <el-button :icon="RefreshRight" :loading="isRefreshing">
            刷新
            <span v-if="refreshInterval > 0" class="refresh-interval">
              ({{ formatRefreshInterval(refreshInterval) }})
            </span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="refresh">
                <el-icon><RefreshRight /></el-icon>
                立即刷新
              </el-dropdown-item>
              <el-dropdown-item divided disabled>
                自动刷新间隔
              </el-dropdown-item>
              <el-dropdown-item
                v-for="interval in refreshIntervals"
                :key="interval.value"
                :command="`interval:${interval.value}`"
                :class="{ 'is-active': refreshInterval === interval.value }"
              >
                <el-icon v-if="refreshInterval === interval.value">
                  <Check />
                </el-icon>
                {{ interval.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- Realtime Mode Toggle -->
      <div class="topbar-control" v-if="showRealtimeToggle">
        <el-tooltip
          :content="isRealtime ? '关闭实时模式' : '开启实时模式'"
          placement="bottom"
        >
          <el-button
            :type="isRealtime ? 'success' : 'default'"
            :icon="VideoPlay"
            @click="toggleRealtime"
          >
            {{ isRealtime ? '实时' : '暂停' }}
          </el-button>
        </el-tooltip>
      </div>

      <!-- Settings -->
      <div class="topbar-control">
        <el-dropdown trigger="click" @command="handleSettingsCommand">
          <el-button :icon="Setting" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="preferences">
                <el-icon><User /></el-icon>
                用户偏好
              </el-dropdown-item>
              <el-dropdown-item command="dashboard">
                <el-icon><Grid /></el-icon>
                自定义仪表盘
              </el-dropdown-item>
              <el-dropdown-item divided command="export">
                <el-icon><Download /></el-icon>
                导出数据
              </el-dropdown-item>
              <el-dropdown-item command="help">
                <el-icon><QuestionFilled /></el-icon>
                帮助文档
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- Fullscreen Toggle -->
      <div class="topbar-control" v-if="!isMobile">
        <el-tooltip
          :content="isFullscreen ? '退出全屏' : '全屏显示'"
          placement="bottom"
        >
          <el-button
            :icon="isFullscreen ? FullScreen : FullScreen"
            circle
            @click="toggleFullscreen"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- User Preferences Dialog -->
    <el-dialog
      v-model="preferencesDialogVisible"
      title="用户偏好设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="preferences" label-width="120px">
        <el-form-item label="主题">
          <el-radio-group v-model="preferences.theme">
            <el-radio label="dark">暗色主题</el-radio>
            <el-radio label="light" disabled>亮色主题（开发中）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时区">
          <el-select v-model="preferences.timezone" placeholder="选择时区">
            <el-option label="Asia/Shanghai (UTC+8)" value="Asia/Shanghai" />
            <el-option label="America/New_York (UTC-5)" value="America/New_York" />
            <el-option label="Europe/London (UTC+0)" value="Europe/London" />
            <el-option label="UTC" value="UTC" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期格式">
          <el-select v-model="preferences.dateFormat" placeholder="选择日期格式">
            <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
            <el-option label="MM/DD/YYYY HH:mm:ss" value="MM/DD/YYYY HH:mm:ss" />
            <el-option label="DD/MM/YYYY HH:mm:ss" value="DD/MM/YYYY HH:mm:ss" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认时间范围">
          <el-select v-model="preferences.defaultTimeRange" placeholder="选择默认时间范围">
            <el-option label="最近 5 分钟" value="5m" />
            <el-option label="最近 15 分钟" value="15m" />
            <el-option label="最近 30 分钟" value="30m" />
            <el-option label="最近 1 小时" value="1h" />
            <el-option label="最近 6 小时" value="6h" />
            <el-option label="最近 24 小时" value="24h" />
          </el-select>
        </el-form-item>
        <el-form-item label="刷新间隔">
          <el-select v-model="preferences.refreshInterval" placeholder="选择刷新间隔">
            <el-option label="关闭" :value="0" />
            <el-option label="5 秒" :value="5000" />
            <el-option label="10 秒" :value="10000" />
            <el-option label="30 秒" :value="30000" />
            <el-option label="1 分钟" :value="60000" />
            <el-option label="5 分钟" :value="300000" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="preferencesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePreferences">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Filter,
  RefreshRight,
  Setting,
  VideoPlay,
  FullScreen,
  User,
  Grid,
  Download,
  QuestionFilled,
  Check
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import TimeRangePicker from '@/components/Filters/TimeRangePicker.vue'
import MultiFilter from '@/components/Filters/MultiFilter.vue'
import { useTimeRangeStore } from '@/stores/timeRange'
import { useFiltersStore } from '@/stores/filters'
import { useDashboardStore } from '@/stores/dashboard'
import type { BreadcrumbItem, QuickTimeRange } from '@/types'

// Props
interface Props {
  isMobile?: boolean
  showFilters?: boolean
  showRealtimeToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
  showFilters: true,
  showRealtimeToggle: true
})

// Router
const route = useRoute()
const router = useRouter()

// Stores
const timeRangeStore = useTimeRangeStore()
const filtersStore = useFiltersStore()
const dashboardStore = useDashboardStore()

const { isRealtime, refreshInterval } = storeToRefs(timeRangeStore)
const { hasActiveFilters, activeFilterCount } = storeToRefs(filtersStore)
const { userPreferences } = storeToRefs(dashboardStore)

// State
const filtersVisible = ref(false)
const isRefreshing = ref(false)
const preferencesDialogVisible = ref(false)
const isFullscreen = ref(false)
const preferences = ref({ ...userPreferences.value })

// Refresh intervals
const refreshIntervals = [
  { label: '关闭', value: 0 },
  { label: '5 秒', value: 5000 },
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 },
  { label: '1 分钟', value: 60000 },
  { label: '5 分钟', value: 300000 }
]

// Breadcrumbs
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const crumbs: BreadcrumbItem[] = [{ label: '首页', path: '/' }]
  
  const pathMap: Record<string, string> = {
    '/dashboard': '综合仪表盘',
    '/metrics': '指标监控',
    '/tracing': '链路追踪',
    '/logs': '日志分析',
    '/custom': '自定义仪表盘'
  }

  const path = route.path
  const matched = route.matched

  if (matched.length > 1) {
    matched.forEach((record, index) => {
      if (index === 0) return // Skip root
      
      const routePath = record.path
      const label = pathMap[routePath] || record.meta?.title || routePath
      
      crumbs.push({
        label: label as string,
        path: index === matched.length - 1 ? undefined : routePath
      })
    })
  } else {
    const label = pathMap[path] || route.meta?.title || path
    if (label !== '首页') {
      crumbs.push({ label: label as string })
    }
  }

  // Add dynamic route params
  if (route.params.service) {
    crumbs.push({ label: route.params.service as string })
  }
  if (route.params.traceId) {
    crumbs.push({ label: `Trace ${(route.params.traceId as string).slice(0, 8)}...` })
  }

  return crumbs
})

// Methods
const formatRefreshInterval = (interval: number): string => {
  if (interval === 0) return ''
  if (interval < 60000) return `${interval / 1000}s`
  return `${interval / 60000}m`
}

const handleRefreshCommand = async (command: string) => {
  if (command === 'refresh') {
    isRefreshing.value = true
    try {
      timeRangeStore.refresh()
      ElMessage.success('刷新成功')
    } catch (error) {
      ElMessage.error('刷新失败')
    } finally {
      setTimeout(() => {
        isRefreshing.value = false
      }, 500)
    }
  } else if (command.startsWith('interval:')) {
    const interval = parseInt(command.split(':')[1])
    timeRangeStore.setRefreshInterval(interval)
    ElMessage.success(`刷新间隔已设置为 ${formatRefreshInterval(interval) || '关闭'}`)
  }
}

const toggleRealtime = () => {
  timeRangeStore.toggleRealtime()
  ElMessage.success(isRealtime.value ? '已开启实时模式' : '已关闭实时模式')
}

const handleSettingsCommand = (command: string) => {
  switch (command) {
    case 'preferences':
      preferences.value = { ...userPreferences.value }
      preferencesDialogVisible.value = true
      break
    case 'dashboard':
      router.push('/custom')
      break
    case 'export':
      ElMessage.info('导出功能开发中...')
      break
    case 'help':
      ElMessage.info('帮助文档开发中...')
      break
  }
}

const savePreferences = () => {
  dashboardStore.updateUserPreferences(preferences.value)
  preferencesDialogVisible.value = false
  ElMessage.success('偏好设置已保存')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// Watch fullscreen changes
watch(() => document.fullscreenElement, (element) => {
  isFullscreen.value = !!element
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 $spacing-lg;
  background-color: $background-secondary;
  border-bottom: 1px solid $border-default;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;

  &.is-mobile {
    padding: 0 $spacing-md;
    height: 50px;

    .topbar-control {
      margin-left: $spacing-xs;
    }
  }
}

.topbar-left {
  flex: 1;
  min-width: 0;

  :deep(.el-breadcrumb) {
    font-size: 14px;
    line-height: 1;

    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        color: $text-secondary;
        font-weight: 400;
        transition: color $animation-duration-fast;

        &:hover {
          color: $accent-primary;
        }

        &.is-link {
          cursor: pointer;
        }
      }

      &:last-child {
        .el-breadcrumb__inner {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }

    .el-breadcrumb__separator {
      color: $text-disabled;
      margin: 0 8px;
    }
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.topbar-control {
  position: relative;

  .refresh-interval {
    margin-left: 4px;
    font-size: 12px;
    opacity: 0.8;
  }

  .filter-badge {
    position: absolute;
    top: -8px;
    right: -8px;
  }

  :deep(.el-button) {
    &.is-circle {
      width: 36px;
      height: 36px;
    }
  }
}

.filters-panel {
  max-height: 500px;
  overflow-y: auto;
}

:deep(.el-dropdown-menu__item) {
  &.is-active {
    color: $accent-primary;
    background-color: rgba($accent-primary, 0.1);

    .el-icon {
      color: $accent-primary;
    }
  }
}

:deep(.el-dialog) {
  background-color: $background-card;
  border: 1px solid $border-default;

  .el-dialog__header {
    border-bottom: 1px solid $border-default;
    padding: $spacing-lg;
  }

  .el-dialog__body {
    padding: $spacing-lg;
  }

  .el-dialog__footer {
    border-top: 1px solid $border-default;
    padding: $spacing-lg;
  }
}

:deep(.el-form) {
  .el-form-item__label {
    color: $text-secondary;
  }

  .el-input,
  .el-select {
    width: 100%;
  }
}

// Responsive
@media (max-width: 768px) {
  .topbar {
    .topbar-left {
      :deep(.el-breadcrumb__item) {
        &:not(:last-child) {
          display: none;
        }
      }
    }

    .topbar-control {
      .refresh-interval {
        display: none;
      }

      :deep(.el-button) {
        span:not(.el-icon) {
          display: none;
        }
      }
    }
  }
}

// Animations
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.topbar-control {
  :deep(.el-button.is-loading) {
    .el-icon {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }
}
</style>
