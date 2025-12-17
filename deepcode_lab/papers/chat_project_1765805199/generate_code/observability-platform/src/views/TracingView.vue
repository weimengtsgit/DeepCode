<template>
  <div class="tracing-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <el-icon :size="24" class="header-icon">
          <Connection />
        </el-icon>
        <div class="header-text">
          <h1 class="view-title">链路追踪</h1>
          <p class="view-subtitle">分布式调用链路分析与性能诊断</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="RefreshRight" @click="handleRefresh" :loading="loading">
          刷新
        </el-button>
        <el-dropdown @command="handleAction" trigger="click">
          <el-button :icon="MoreFilled">
            更多操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export" :icon="Download">
                导出数据
              </el-dropdown-item>
              <el-dropdown-item command="topology" :icon="Grid">
                查看拓扑
              </el-dropdown-item>
              <el-dropdown-item command="settings" :icon="Setting">
                配置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(82, 196, 26, 0.1)">
          <el-icon :size="24" color="#52c41a">
            <CircleCheck />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">成功请求</div>
          <div class="stat-value">{{ statistics.successCount }}</div>
          <div class="stat-trend success">
            {{ formatPercent(statistics.successRate / 100) }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(255, 77, 79, 0.1)">
          <el-icon :size="24" color="#ff4d4f">
            <CircleClose />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">错误请求</div>
          <div class="stat-value">{{ statistics.errorCount }}</div>
          <div class="stat-trend error">
            {{ formatPercent(statistics.errorRate / 100) }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(250, 173, 20, 0.1)">
          <el-icon :size="24" color="#faad14">
            <Timer />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">平均耗时</div>
          <div class="stat-value">{{ formatDuration(statistics.avgDuration) }}</div>
          <div class="stat-trend">P99: {{ formatDuration(statistics.p99Duration) }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(24, 144, 255, 0.1)">
          <el-icon :size="24" color="#1890ff">
            <Monitor />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">服务数量</div>
          <div class="stat-value">{{ statistics.serviceCount }}</div>
          <div class="stat-trend">{{ statistics.spanCount }} spans</div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="search-section">
      <div class="search-bar">
        <el-input
          v-model="searchQuery.searchQuery"
          placeholder="搜索 Trace ID、服务名、操作名..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
          class="search-input"
        />
      </div>

      <div class="filter-bar">
        <el-select
          v-model="searchQuery.services"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择服务"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option
            v-for="service in availableServices"
            :key="service"
            :label="service"
            :value="service"
          />
        </el-select>

        <el-select
          v-model="searchQuery.status"
          multiple
          collapse-tags
          placeholder="选择状态"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option label="成功" value="success" />
          <el-option label="错误" value="error" />
          <el-option label="超时" value="timeout" />
          <el-option label="取消" value="cancelled" />
        </el-select>

        <el-input
          v-model.number="searchQuery.minDuration"
          placeholder="最小耗时 (ms)"
          type="number"
          clearable
          class="filter-input"
          @input="handleFilterChange"
        >
          <template #prefix>≥</template>
        </el-input>

        <el-input
          v-model.number="searchQuery.maxDuration"
          placeholder="最大耗时 (ms)"
          type="number"
          clearable
          class="filter-input"
          @input="handleFilterChange"
        >
          <template #prefix>≤</template>
        </el-input>

        <el-select
          v-model="searchQuery.sort"
          placeholder="排序方式"
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option label="最新优先" value="timestamp:desc" />
          <el-option label="最早优先" value="timestamp:asc" />
          <el-option label="耗时最长" value="duration:desc" />
          <el-option label="耗时最短" value="duration:asc" />
          <el-option label="Span 最多" value="spanCount:desc" />
        </el-select>

        <el-button
          v-if="hasActiveFilters"
          @click="handleClearFilters"
          :icon="CircleClose"
        >
          清除筛选
        </el-button>
      </div>
    </div>

    <!-- Trace List -->
    <div class="trace-list">
      <LoadingSkeleton v-if="loading" type="list" :rows="10" />
      
      <EmptyState
        v-else-if="!loading && traces.length === 0"
        type="no-traces"
        title="暂无追踪数据"
        description="当前时间范围和筛选条件下没有找到追踪记录"
        :show-action="hasActiveFilters"
        action-text="清除筛选"
        @action="handleClearFilters"
      />

      <div v-else class="trace-items">
        <div
          v-for="trace in traces"
          :key="trace.traceId"
          class="trace-item"
          :class="{ clickable: true }"
          @click="handleTraceClick(trace)"
        >
          <div class="trace-header">
            <div class="trace-title">
              <el-tag
                :type="getStatusType(trace.status)"
                size="small"
                class="status-tag"
              >
                {{ getStatusText(trace.status) }}
              </el-tag>
              <span class="trace-id">{{ trace.traceId }}</span>
              <el-tag
                v-if="trace.errorCount > 0"
                type="danger"
                size="small"
                effect="plain"
              >
                {{ trace.errorCount }} 错误
              </el-tag>
            </div>
            <div class="trace-meta">
              <span class="meta-item">
                <el-icon><Timer /></el-icon>
                {{ formatDuration(trace.duration) }}
              </span>
              <span class="meta-item">
                <el-icon><Connection /></el-icon>
                {{ trace.spanCount }} spans
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatRelativeTime(trace.startTime) }}
              </span>
            </div>
          </div>

          <div class="trace-services">
            <div class="service-tags">
              <el-tag
                v-for="service in trace.services"
                :key="service"
                size="small"
                effect="plain"
              >
                <el-icon><Monitor /></el-icon>
                {{ service }}
              </el-tag>
            </div>
          </div>

          <div class="trace-timeline">
            <div class="timeline-bar">
              <div
                v-for="(span, index) in getTimelineSpans(trace)"
                :key="index"
                class="timeline-segment"
                :style="{
                  left: `${(span.startOffset / trace.duration) * 100}%`,
                  width: `${(span.duration / trace.duration) * 100}%`,
                  backgroundColor: getSpanColor(span),
                }"
                :title="`${span.service} - ${span.operation} (${formatDuration(span.duration)})`"
              />
            </div>
            <div class="timeline-labels">
              <span>0ms</span>
              <span>{{ formatDuration(trace.duration) }}</span>
            </div>
          </div>

          <div class="trace-actions">
            <el-button
              size="small"
              :icon="View"
              @click.stop="handleTraceClick(trace)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              :icon="Document"
              @click.stop="handleViewLogs(trace)"
            >
              查看日志
            </el-button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && traces.length > 0" class="pagination">
        <el-button
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          上一页
        </el-button>
        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页 ({{ totalCount }} 条记录)
        </span>
        <el-button
          :disabled="currentPage >= totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          下一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Connection,
  RefreshRight,
  MoreFilled,
  ArrowDown,
  Download,
  Grid,
  Setting,
  CircleCheck,
  CircleClose,
  Timer,
  Monitor,
  Search,
  View,
  Document,
  Clock,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import { useTimeRangeStore } from '@/stores/timeRange'
import { searchTraces, getTraceStatistics } from '@/mock'
import type { Trace, TraceSearchQuery, TraceStatus, Span } from '@/types/tracing'
import { formatDuration, formatRelativeTime, formatPercent } from '@/utils/format'
import { getTraceStatusColor } from '@/utils/color'

const router = useRouter()
const timeRangeStore = useTimeRangeStore()
const { timeRange, isRealtime } = storeToRefs(timeRangeStore)

// State
const loading = ref(false)
const traces = ref<Trace[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const autoRefreshTimer = ref<number | null>(null)

// Search query
const searchQuery = ref<TraceSearchQuery>({
  startTime: timeRange.value.start,
  endTime: timeRange.value.end,
  services: [],
  status: [],
  minDuration: undefined,
  maxDuration: undefined,
  searchQuery: '',
  sort: { field: 'timestamp', order: 'desc' },
  pagination: { page: 1, pageSize: 20 },
})

// Statistics
const statistics = ref({
  totalCount: 0,
  successCount: 0,
  errorCount: 0,
  successRate: 0,
  errorRate: 0,
  avgDuration: 0,
  p99Duration: 0,
  serviceCount: 0,
  spanCount: 0,
})

// Computed
const availableServices = computed(() => {
  const servicesSet = new Set<string>()
  traces.value.forEach((trace) => {
    trace.services.forEach((service) => servicesSet.add(service))
  })
  return Array.from(servicesSet).sort()
})

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.services.length > 0 ||
    searchQuery.value.status.length > 0 ||
    searchQuery.value.minDuration !== undefined ||
    searchQuery.value.maxDuration !== undefined ||
    searchQuery.value.searchQuery !== ''
  )
})

// Methods
const loadTraces = async () => {
  loading.value = true
  try {
    // Update query with current time range and pagination
    searchQuery.value.startTime = timeRange.value.start
    searchQuery.value.endTime = timeRange.value.end
    searchQuery.value.pagination = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }

    // Parse sort string
    if (typeof searchQuery.value.sort === 'string') {
      const [field, order] = searchQuery.value.sort.split(':')
      searchQuery.value.sort = { field, order: order as 'asc' | 'desc' }
    }

    const result = await searchTraces(searchQuery.value)
    traces.value = result.data.traces
    totalCount.value = result.data.total

    // Load statistics
    const statsResult = await getTraceStatistics(
      timeRange.value.start,
      timeRange.value.end
    )
    statistics.value = statsResult.data
  } catch (error) {
    console.error('Failed to load traces:', error)
    ElMessage.error('加载追踪数据失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadTraces()
  ElMessage.success('数据已刷新')
}

const handleSearch = () => {
  currentPage.value = 1
  loadTraces()
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadTraces()
}

const handleClearFilters = () => {
  searchQuery.value.services = []
  searchQuery.value.status = []
  searchQuery.value.minDuration = undefined
  searchQuery.value.maxDuration = undefined
  searchQuery.value.searchQuery = ''
  currentPage.value = 1
  loadTraces()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadTraces()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleTraceClick = (trace: Trace) => {
  router.push({
    name: 'tracing-detail',
    params: { traceId: trace.traceId },
  })
}

const handleViewLogs = (trace: Trace) => {
  router.push({
    name: 'logs',
    query: { traceId: trace.traceId },
  })
}

const handleAction = (command: string) => {
  switch (command) {
    case 'export':
      exportTraces()
      break
    case 'topology':
      router.push({ name: 'topology' })
      break
    case 'settings':
      ElMessage.info('配置功能开发中')
      break
  }
}

const exportTraces = () => {
  const csv = [
    ['Trace ID', 'Status', 'Duration (ms)', 'Span Count', 'Services', 'Start Time'].join(','),
    ...traces.value.map((trace) =>
      [
        trace.traceId,
        trace.status,
        trace.duration,
        trace.spanCount,
        trace.services.join(';'),
        new Date(trace.startTime).toISOString(),
      ].join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `traces_${Date.now()}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const getStatusType = (status: TraceStatus) => {
  const typeMap: Record<TraceStatus, any> = {
    success: 'success',
    error: 'danger',
    timeout: 'warning',
    cancelled: 'info',
    unknown: 'info',
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: TraceStatus) => {
  const textMap: Record<TraceStatus, string> = {
    success: '成功',
    error: '错误',
    timeout: '超时',
    cancelled: '取消',
    unknown: '未知',
  }
  return textMap[status] || status
}

const getTimelineSpans = (trace: Trace) => {
  // Get top-level spans for timeline visualization
  return trace.spans
    .filter((span) => !span.parentSpanId)
    .map((span) => ({
      ...span,
      startOffset: span.startTime - trace.startTime,
    }))
    .sort((a, b) => a.startOffset - b.startOffset)
}

const getSpanColor = (span: Span) => {
  if (span.status === 'error') return '#ff4d4f'
  if (span.kind === 'server') return '#1890ff'
  if (span.kind === 'client') return '#52c41a'
  if (span.kind === 'producer') return '#faad14'
  if (span.kind === 'consumer') return '#722ed1'
  return '#8c8c8c'
}

const startAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
  }
  autoRefreshTimer.value = window.setInterval(() => {
    loadTraces()
  }, 30000) // 30 seconds
}

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  loadTraces()
  if (isRealtime.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Watchers
watch(timeRange, () => {
  currentPage.value = 1
  loadTraces()
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

.tracing-view {
  padding: $spacing-lg;
  min-height: 100vh;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .header-icon {
    color: $primary-color;
  }

  .header-text {
    .view-title {
      font-size: 28px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }

    .view-subtitle {
      font-size: 14px;
      color: $text-secondary;
      margin: 4px 0 0;
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .stat-card {
    background: $background-card;
    border: 1px solid $border-color;
    border-radius: 8px;
    padding: $spacing-md;
    display: flex;
    gap: $spacing-md;
    transition: all 0.3s;

    &:hover {
      border-color: $border-hover;
      box-shadow: $shadow-card;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
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
        margin-bottom: 4px;
      }

      .stat-trend {
        font-size: 12px;
        color: $text-secondary;

        &.success {
          color: $success-color;
        }

        &.error {
          color: $error-color;
        }
      }
    }
  }
}

.search-section {
  background: $background-card;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  .search-bar {
    margin-bottom: $spacing-md;

    .search-input {
      width: 100%;
    }
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .filter-select,
    .filter-input {
      min-width: 180px;
      flex: 1;
    }
  }
}

.trace-list {
  .trace-items {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .trace-item {
    background: $background-card;
    border: 1px solid $border-color;
    border-radius: 8px;
    padding: $spacing-md;
    transition: all 0.3s;

    &.clickable {
      cursor: pointer;

      &:hover {
        border-color: $primary-color;
        box-shadow: $shadow-card;
      }
    }

    .trace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;

      .trace-title {
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        .trace-id {
          font-family: monospace;
          font-size: 14px;
          color: $text-primary;
        }
      }

      .trace-meta {
        display: flex;
        gap: $spacing-md;
        font-size: 12px;
        color: $text-secondary;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .trace-services {
      margin-bottom: $spacing-sm;

      .service-tags {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-xs;
      }
    }

    .trace-timeline {
      margin-bottom: $spacing-sm;

      .timeline-bar {
        height: 24px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        position: relative;
        overflow: hidden;

        .timeline-segment {
          position: absolute;
          height: 100%;
          opacity: 0.8;
          transition: opacity 0.2s;

          &:hover {
            opacity: 1;
          }
        }
      }

      .timeline-labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: $text-secondary;
        margin-top: 4px;
      }
    }

    .trace-actions {
      display: flex;
      gap: $spacing-sm;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-md;
  margin-top: $spacing-lg;
  padding: $spacing-md;

  .page-info {
    font-size: 14px;
    color: $text-secondary;
  }
}

@media (max-width: 768px) {
  .tracing-view {
    padding: $spacing-md;
  }

  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .statistics-cards {
    grid-template-columns: 1fr;
  }

  .search-section {
    .filter-bar {
      flex-direction: column;

      .filter-select,
      .filter-input {
        width: 100%;
      }
    }
  }

  .trace-item {
    .trace-header {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;
    }

    .trace-meta {
      flex-wrap: wrap;
    }
  }
}
</style>
