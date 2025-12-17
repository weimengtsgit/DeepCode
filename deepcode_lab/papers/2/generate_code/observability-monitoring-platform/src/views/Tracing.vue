<template>
  <PageContent
    :is-loading="loading"
    :has-error="hasError"
    :error="error"
    @retry="refresh"
  >
    <div class="tracing-container">
      <!-- Header Section -->
      <div class="tracing-header">
        <div class="header-title">
          <h1>Distributed Tracing</h1>
          <p class="subtitle">Analyze service call chains and identify performance bottlenecks</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <span class="stat-label">Total Traces</span>
            <span class="stat-value">{{ traceCount }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Error Rate</span>
            <span class="stat-value">{{ formatPercentage(errorRate, 2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Duration</span>
            <span class="stat-value">{{ formatDuration(avgDuration) }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="tracing-grid">
        <!-- Left Panel: Trace List -->
        <div class="trace-list-panel">
          <div class="panel-header">
            <h2>Traces</h2>
            <div class="filter-controls">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by trace ID..."
                class="search-input"
              />
              <select v-model="statusFilter" class="status-select">
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="ERROR">Error</option>
                <option value="TIMEOUT">Timeout</option>
              </select>
            </div>
          </div>

          <div class="trace-list">
            <div v-if="isEmpty" class="empty-state">
              <EmptyState
                icon-type="no-results"
                title="No Traces Found"
                description="Try adjusting your filters or time range"
              />
            </div>

            <div v-else class="trace-items">
              <div
                v-for="trace in paginatedTraces"
                :key="trace.traceId"
                class="trace-item"
                :class="{ active: selectedTrace?.traceId === trace.traceId }"
                @click="selectTrace(trace.traceId)"
              >
                <div class="trace-header">
                  <span class="trace-id">{{ formatTraceId(trace.traceId) }}</span>
                  <span class="trace-status" :class="trace.status.toLowerCase()">
                    {{ trace.status }}
                  </span>
                </div>
                <div class="trace-details">
                  <span class="detail-item">
                    <span class="label">Service:</span>
                    <span class="value">{{ trace.rootService }}</span>
                  </span>
                  <span class="detail-item">
                    <span class="label">Duration:</span>
                    <span class="value">{{ formatDuration(trace.totalDurationMs) }}</span>
                  </span>
                  <span class="detail-item">
                    <span class="label">Spans:</span>
                    <span class="value">{{ trace.spanCount }}</span>
                  </span>
                </div>
                <div class="trace-time">
                  {{ formatRelativeTime(trace.startTime) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              :disabled="currentPage === 1"
              @click="previousPage"
              class="pagination-btn"
            >
              ← Previous
            </button>
            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              :disabled="currentPage === totalPages"
              @click="nextPage"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>

        <!-- Right Panel: Trace Visualization -->
        <div class="trace-detail-panel">
          <div v-if="!selectedTrace" class="empty-detail">
            <EmptyState
              icon-type="empty-folder"
              title="Select a Trace"
              description="Click on a trace to view details"
            />
          </div>

          <div v-else class="trace-detail">
            <!-- Tabs -->
            <div class="detail-tabs">
              <button
                v-for="tab in tabs"
                :key="tab"
                class="tab-button"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab"
              >
                {{ formatTabName(tab) }}
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <!-- Topology Tab -->
              <div v-show="activeTab === 'topology'" class="tab-pane">
                <TopologyViewer
                  :traces="[selectedTrace]"
                  :height="500"
                />
              </div>

              <!-- Flamechart Tab -->
              <div v-show="activeTab === 'flamechart'" class="tab-pane">
                <ChartContainer
                  title="Trace Flamechart"
                  :show-legend-toggle="false"
                  :show-refresh-button="false"
                  :show-fullscreen-button="true"
                  height="500"
                >
                  <FlameGraph
                    :trace="selectedTrace"
                    :height="500"
                  />
                </ChartContainer>
              </div>

              <!-- Gantt Tab -->
              <div v-show="activeTab === 'gantt'" class="tab-pane">
                <ChartContainer
                  title="Span Timeline"
                  :show-legend-toggle="false"
                  :show-refresh-button="false"
                  :show-fullscreen-button="true"
                  height="500"
                >
                  <GanttChart
                    :trace="selectedTrace"
                    :height="500"
                  />
                </ChartContainer>
              </div>

              <!-- Spans Tab -->
              <div v-show="activeTab === 'spans'" class="tab-pane">
                <div class="spans-list">
                  <div
                    v-for="span in selectedTrace.spans"
                    :key="span.spanId"
                    class="span-item"
                    :class="{ slow: isSlowSpan(span) }"
                  >
                    <div class="span-header">
                      <span class="span-service">{{ span.service }}</span>
                      <span class="span-operation">{{ span.operation }}</span>
                      <span class="span-duration">
                        {{ formatDuration(span.durationMs) }}
                      </span>
                      <span class="span-status" :class="span.status.toLowerCase()">
                        {{ span.status }}
                      </span>
                    </div>
                    <div class="span-details">
                      <span class="detail">ID: {{ formatSpanId(span.spanId) }}</span>
                      <span class="detail">
                        Start: {{ formatTime(span.startTime) }}
                      </span>
                      <span v-if="span.tags" class="detail">
                        Tags: {{ Object.keys(span.tags).length }}
                      </span>
                      <span v-if="span.logs" class="detail">
                        Logs: {{ span.logs.length }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Slow Queries Tab -->
              <div v-show="activeTab === 'slow'" class="tab-pane">
                <div class="slow-queries">
                  <div v-if="slowSpans.length === 0" class="no-slow">
                    <p>No slow spans detected in this trace</p>
                  </div>
                  <div v-else class="slow-list">
                    <div
                      v-for="(span, index) in slowSpans"
                      :key="span.spanId"
                      class="slow-item"
                    >
                      <div class="slow-rank">{{ index + 1 }}</div>
                      <div class="slow-info">
                        <div class="slow-title">
                          {{ span.service }} → {{ span.operation }}
                        </div>
                        <div class="slow-details">
                          <span>Duration: {{ formatDuration(span.durationMs) }}</span>
                          <span>Status: {{ span.status }}</span>
                        </div>
                      </div>
                      <div class="slow-duration">
                        {{ formatDuration(span.durationMs) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trace Metadata -->
            <div class="trace-metadata">
              <div class="metadata-section">
                <h3>Trace Information</h3>
                <div class="metadata-grid">
                  <div class="metadata-item">
                    <span class="label">Trace ID:</span>
                    <span class="value">{{ selectedTrace.traceId }}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="label">Root Service:</span>
                    <span class="value">{{ selectedTrace.rootService }}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="label">Total Duration:</span>
                    <span class="value">{{ formatDuration(selectedTrace.totalDurationMs) }}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="label">Span Count:</span>
                    <span class="value">{{ selectedTrace.spanCount }}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="label">Status:</span>
                    <span class="value" :class="selectedTrace.status.toLowerCase()">
                      {{ selectedTrace.status }}
                    </span>
                  </div>
                  <div class="metadata-item">
                    <span class="label">Start Time:</span>
                    <span class="value">{{ formatDateTime(selectedTrace.startTime) }}</span>
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
import { useTraces } from '@/composables/useTraces'
import { useTimeRange } from '@/composables/useTimeRange'
import { useFilters } from '@/composables/useFilters'
import PageContent from '@/components/Layout/PageContent.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import ChartContainer from '@/components/Charts/ChartContainer.vue'
import TopologyViewer from '@/components/Charts/TopologyViewer.vue'
import FlameGraph from '@/components/Charts/FlameGraph.vue'
import GanttChart from '@/components/Charts/GanttChart.vue'
import {
  formatDuration,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatTraceId,
  formatSpanId,
  formatPercentage,
} from '@/utils/formatters'

// Composables
const {
  filteredTraces,
  selectedTrace,
  slowSpans,
  traceStats,
  loading,
  error,
  isEmpty,
  hasError,
  searchQuery,
  statusFilter,
  selectTrace,
  setSearchQuery,
  setStatusFilter,
  fetchTraces,
  refresh,
  getSlowSpans,
} = useTraces(undefined, true)

const { timeRange } = useTimeRange()
const { activeFilters } = useFilters()

// Local state
const activeTab = ref<'topology' | 'flamechart' | 'gantt' | 'spans' | 'slow'>('topology')
const currentPage = ref(1)
const pageSize = ref(10)

const tabs = ['topology', 'flamechart', 'gantt', 'spans', 'slow'] as const

// Computed properties
const traceCount = computed(() => filteredTraces.value.length)
const errorRate = computed(() => {
  if (!traceStats.value) return 0
  return traceStats.value.errorCount / traceStats.value.totalTraces
})
const avgDuration = computed(() => traceStats.value?.avgDurationMs || 0)

const paginatedTraces = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTraces.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTraces.value.length / pageSize.value)
})

// Methods
const formatTabName = (tab: string): string => {
  const names: Record<string, string> = {
    topology: 'Service Topology',
    flamechart: 'Flamechart',
    gantt: 'Timeline',
    spans: 'Spans',
    slow: 'Slow Queries',
  }
  return names[tab] || tab
}

const isSlowSpan = (span: any): boolean => {
  return slowSpans.value.some(s => s.spanId === span.spanId)
}

const previousPage = (): void => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = (): void => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Lifecycle
onMounted(() => {
  fetchTraces()
})

onUnmounted(() => {
  // Cleanup if needed
})

// Watch for search/filter changes
const handleSearchChange = (query: string): void => {
  setSearchQuery(query)
  currentPage.value = 1
}

const handleStatusChange = (status: string): void => {
  setStatusFilter(status as any)
  currentPage.value = 1
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.tracing-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-lg;
}

.tracing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
  padding: $spacing-lg;
  background: $color-bg-secondary;
  border-radius: 8px;
  border: 1px solid $color-border;

  .header-title {
    flex: 1;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: $color-text-primary;
    }

    .subtitle {
      margin: $spacing-sm 0 0 0;
      font-size: 14px;
      color: $color-text-secondary;
    }
  }

  .header-stats {
    display: flex;
    gap: $spacing-md;

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-md;
      background: $color-bg-tertiary;
      border-radius: 6px;
      border: 1px solid $color-border-light;
      min-width: 120px;

      .stat-label {
        font-size: 12px;
        color: $color-text-secondary;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        margin-top: $spacing-sm;
        font-size: 18px;
        font-weight: 600;
        color: $color-primary;
      }
    }
  }
}

.tracing-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: $spacing-lg;
  min-height: 600px;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
}

.trace-list-panel {
  display: flex;
  flex-direction: column;
  background: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  overflow: hidden;

  .panel-header {
    padding: $spacing-md;
    border-bottom: 1px solid $color-border;

    h2 {
      margin: 0 0 $spacing-md 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-text-primary;
    }

    .filter-controls {
      display: flex;
      gap: $spacing-sm;

      .search-input,
      .status-select {
        flex: 1;
        padding: $spacing-sm;
        background: $color-bg-tertiary;
        border: 1px solid $color-border-light;
        border-radius: 4px;
        color: $color-text-primary;
        font-size: 14px;

        &:focus {
          outline: none;
          border-color: $color-primary;
          box-shadow: 0 0 0 2px rgba($color-primary, 0.1);
        }
      }
    }
  }

  .trace-list {
    flex: 1;
    overflow-y: auto;

    .empty-state {
      padding: $spacing-lg;
    }

    .trace-items {
      display: flex;
      flex-direction: column;
    }
  }

  .trace-item {
    padding: $spacing-md;
    border-bottom: 1px solid $color-border-light;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: $color-bg-tertiary;
    }

    &.active {
      background: rgba($color-primary, 0.1);
      border-left: 3px solid $color-primary;
      padding-left: calc($spacing-md - 3px);
    }

    .trace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;

      .trace-id {
        font-family: monospace;
        font-size: 12px;
        color: $color-text-secondary;
      }

      .trace-status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;

        &.success {
          background: rgba(115, 191, 105, 0.2);
          color: #73bf69;
        }

        &.error {
          background: rgba(242, 73, 92, 0.2);
          color: #f2495c;
        }

        &.timeout {
          background: rgba(255, 152, 48, 0.2);
          color: #ff9830;
        }
      }
    }

    .trace-details {
      display: flex;
      gap: $spacing-md;
      margin-bottom: $spacing-sm;
      font-size: 13px;

      .detail-item {
        display: flex;
        gap: $spacing-sm;

        .label {
          color: $color-text-secondary;
        }

        .value {
          color: $color-text-primary;
          font-weight: 500;
        }
      }
    }

    .trace-time {
      font-size: 12px;
      color: $color-text-tertiary;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    border-top: 1px solid $color-border;

    .pagination-btn {
      padding: $spacing-sm $spacing-md;
      background: $color-bg-tertiary;
      border: 1px solid $color-border-light;
      border-radius: 4px;
      color: $color-text-primary;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: $color-primary;
        border-color: $color-primary;
        color: white;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-info {
      font-size: 13px;
      color: $color-text-secondary;
    }
  }
}

.trace-detail-panel {
  background: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .empty-detail {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: $spacing-lg;
  }

  .trace-detail {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-tabs {
      display: flex;
      gap: $spacing-sm;
      padding: $spacing-md;
      border-bottom: 1px solid $color-border;
      overflow-x: auto;

      .tab-button {
        padding: $spacing-sm $spacing-md;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: $color-text-secondary;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover {
          color: $color-text-primary;
        }

        &.active {
          color: $color-primary;
          border-bottom-color: $color-primary;
        }
      }
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: $spacing-md;

      .tab-pane {
        height: 100%;
      }
    }

    .spans-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;

      .span-item {
        padding: $spacing-md;
        background: $color-bg-tertiary;
        border: 1px solid $color-border-light;
        border-radius: 6px;
        transition: all 0.2s ease;

        &.slow {
          border-color: #ff9830;
          background: rgba(255, 152, 48, 0.05);
        }

        .span-header {
          display: flex;
          gap: $spacing-md;
          align-items: center;
          margin-bottom: $spacing-sm;
          flex-wrap: wrap;

          .span-service {
            padding: 2px 8px;
            background: rgba($color-primary, 0.2);
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            color: $color-primary;
          }

          .span-operation {
            font-size: 13px;
            font-weight: 500;
            color: $color-text-primary;
            flex: 1;
          }

          .span-duration {
            font-family: monospace;
            font-size: 12px;
            color: $color-text-secondary;
          }

          .span-status {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;

            &.success {
              background: rgba(115, 191, 105, 0.2);
              color: #73bf69;
            }

            &.error {
              background: rgba(242, 73, 92, 0.2);
              color: #f2495c;
            }

            &.timeout {
              background: rgba(255, 152, 48, 0.2);
              color: #ff9830;
            }
          }
        }

        .span-details {
          display: flex;
          gap: $spacing-md;
          flex-wrap: wrap;
          font-size: 12px;

          .detail {
            color: $color-text-secondary;
          }
        }
      }
    }

    .slow-queries {
      .no-slow {
        padding: $spacing-lg;
        text-align: center;
        color: $color-text-secondary;
      }

      .slow-list {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;

        .slow-item {
          display: flex;
          gap: $spacing-md;
          align-items: center;
          padding: $spacing-md;
          background: $color-bg-tertiary;
          border: 1px solid $color-border-light;
          border-radius: 6px;
          border-left: 3px solid #ff9830;

          .slow-rank {
            min-width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 152, 48, 0.2);
            border-radius: 50%;
            font-weight: 600;
            color: #ff9830;
            font-size: 14px;
          }

          .slow-info {
            flex: 1;

            .slow-title {
              font-size: 13px;
              font-weight: 600;
              color: $color-text-primary;
              margin-bottom: $spacing-sm;
            }

            .slow-details {
              display: flex;
              gap: $spacing-md;
              font-size: 12px;
              color: $color-text-secondary;
            }
          }

          .slow-duration {
            font-family: monospace;
            font-size: 13px;
            font-weight: 600;
            color: #ff9830;
            min-width: 80px;
            text-align: right;
          }
        }
      }
    }
  }
}

.trace-metadata {
  padding: $spacing-md;
  border-top: 1px solid $color-border;
  background: $color-bg-tertiary;

  .metadata-section {
    h3 {
      margin: 0 0 $spacing-md 0;
      font-size: 14px;
      font-weight: 600;
      color: $color-text-primary;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: $spacing-md;

      .metadata-item {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;

        .label {
          font-size: 12px;
          color: $color-text-secondary;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .value {
          font-size: 13px;
          color: $color-text-primary;
          font-weight: 500;
          word-break: break-all;

          &.success {
            color: #73bf69;
          }

          &.error {
            color: #f2495c;
          }

          &.timeout {
            color: #ff9830;
          }
        }
      }
    }
  }
}
</style>
