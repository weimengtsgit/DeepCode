<template>
  <PageContent
    :is-loading="loading"
    :has-error="hasError"
    :error="error"
    @retry="refresh"
  >
    <!-- Search and Filter Section -->
    <div class="logs-header">
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search logs (keywords, regex, field:value)..."
          class="search-input"
          @input="handleSearchChange"
        />
        <button
          v-if="searchQuery"
          class="clear-button"
          @click="clearSearch"
          title="Clear search"
        >
          ✕
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="filter-controls">
        <div class="filter-group">
          <label>Level:</label>
          <select v-model="selectedLevels" multiple class="filter-select">
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="FATAL">FATAL</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Service:</label>
          <select v-model="selectedServices" multiple class="filter-select">
            <option
              v-for="service in availableServices"
              :key="service"
              :value="service"
            >
              {{ service }}
            </option>
          </select>
        </div>

        <button
          v-if="hasActiveFilters"
          class="clear-filters-button"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="logs-container">
      <!-- Log Stream (Left Panel) -->
      <div class="log-stream-panel">
        <div class="panel-header">
          <h3>Log Stream ({{ totalResults }} results)</h3>
          <div class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
        </div>

        <!-- Virtual Scrolled Log List -->
        <div v-if="!isEmpty" class="log-list">
          <div
            v-for="log in paginatedLogs"
            :key="log.id"
            class="log-entry"
            :class="`log-level-${log.level.toLowerCase()}`"
            @click="selectLog(log)"
          >
            <div class="log-header">
              <span class="log-level-badge">{{ log.level }}</span>
              <span class="log-service">{{ log.service }}</span>
              <span class="log-time">{{ formatRelativeTime(log.timestamp) }}</span>
            </div>
            <div class="log-message">{{ truncateMessage(log.message, 100) }}</div>
            <div v-if="log.traceId" class="log-trace-link">
              Trace: {{ formatTraceId(log.traceId) }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else
          icon-type="no-results"
          title="No logs found"
          description="Try adjusting your search query or filters"
          :show-action-button="true"
          action-button-label="Clear Filters"
          @action="clearFilters"
        />

        <!-- Pagination Controls -->
        <div v-if="!isEmpty && totalPages > 1" class="pagination-controls">
          <button
            :disabled="currentPage === 1"
            @click="previousPage"
            class="pagination-button"
          >
            ← Previous
          </button>
          <span class="page-indicator">
            Page {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            :disabled="currentPage === totalPages"
            @click="nextPage"
            class="pagination-button"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Statistics Panel (Right Sidebar) -->
      <div class="statistics-panel">
        <div class="panel-header">
          <h3>Statistics</h3>
        </div>

        <!-- Log Level Distribution -->
        <div class="stat-section">
          <h4>By Level</h4>
          <div class="stat-item">
            <span class="stat-label">DEBUG</span>
            <span class="stat-value">{{ statistics.countByLevel.DEBUG || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">INFO</span>
            <span class="stat-value">{{ statistics.countByLevel.INFO || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">WARN</span>
            <span class="stat-value">{{ statistics.countByLevel.WARN || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">ERROR</span>
            <span class="stat-value error">{{ statistics.countByLevel.ERROR || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">FATAL</span>
            <span class="stat-value critical">{{ statistics.countByLevel.FATAL || 0 }}</span>
          </div>
        </div>

        <!-- Service Distribution -->
        <div class="stat-section">
          <h4>By Service</h4>
          <div
            v-for="(count, service) in statistics.countByService"
            :key="service"
            class="stat-item"
          >
            <span class="stat-label">{{ service }}</span>
            <span class="stat-value">{{ count }}</span>
          </div>
        </div>

        <!-- Error Rate -->
        <div class="stat-section">
          <h4>Error Rate</h4>
          <div class="stat-item">
            <span class="stat-label">Errors</span>
            <span class="stat-value error">
              {{ formatPercentage(statistics.errorRate, 2) }}
            </span>
          </div>
        </div>

        <!-- Export Button -->
        <button class="export-button" @click="exportLogs">
          📥 Export Logs
        </button>
      </div>
    </div>

    <!-- Log Detail Drawer -->
    <InfoDrawer
      :is-open="showLogDetail"
      title="Log Details"
      @close="closeLogDetail"
    >
      <template v-if="selectedLog" #content>
        <div class="log-detail-content">
          <div class="detail-section">
            <h4>Message</h4>
            <p class="detail-message">{{ selectedLog.message }}</p>
          </div>

          <div class="detail-section">
            <h4>Metadata</h4>
            <div class="detail-item">
              <span class="detail-label">Timestamp:</span>
              <span class="detail-value">{{ formatDateTime(selectedLog.timestamp) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Service:</span>
              <span class="detail-value">{{ selectedLog.service }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Level:</span>
              <span class="detail-value" :class="`log-level-${selectedLog.level.toLowerCase()}`">
                {{ selectedLog.level }}
              </span>
            </div>
          </div>

          <div v-if="selectedLog.context" class="detail-section">
            <h4>Context</h4>
            <div class="detail-item">
              <span class="detail-label">User ID:</span>
              <span class="detail-value">{{ selectedLog.context.userId }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">{{ selectedLog.context.requestId }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Instance:</span>
              <span class="detail-value">{{ selectedLog.context.instanceId }}</span>
            </div>
          </div>

          <div v-if="selectedLog.traceId" class="detail-section">
            <h4>Trace Correlation</h4>
            <div class="detail-item">
              <span class="detail-label">Trace ID:</span>
              <span class="detail-value trace-link" @click="navigateToTrace">
                {{ selectedLog.traceId }}
              </span>
            </div>
          </div>

          <div v-if="selectedLog.stacktrace" class="detail-section">
            <h4>Stack Trace</h4>
            <pre class="stacktrace">{{ selectedLog.stacktrace }}</pre>
          </div>

          <div v-if="logContext.length > 0" class="detail-section">
            <h4>Context Logs (±5 entries)</h4>
            <div class="context-logs">
              <div
                v-for="contextLog in logContext"
                :key="contextLog.id"
                class="context-log-item"
                :class="{ 'is-selected': contextLog.id === selectedLog.id }"
              >
                <span class="context-log-level">{{ contextLog.level }}</span>
                <span class="context-log-message">{{ truncateMessage(contextLog.message, 60) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </InfoDrawer>
  </PageContent>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLogsStore } from '@/stores/logsStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import { useLogs } from '@/composables/useLogs'
import { useRealtime } from '@/composables/useRealtime'
import PageContent from '@/components/Layout/PageContent.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import InfoDrawer from '@/components/Common/InfoDrawer.vue'
import {
  formatRelativeTime,
  formatDateTime,
  formatPercentage,
  truncateString,
} from '@/utils/formatters'
import type { LogEntry } from '@/types/logs'

// Stores
const logsStore = useLogsStore()
const timeStore = useTimeStore()
const filterStore = useFilterStore()
const router = useRouter()

// Composables
const {
  logs,
  loading,
  error,
  isEmpty,
  searchQuery,
  selectedLevels,
  selectedServices,
  filteredLogs,
  statistics,
  getLogContext,
  search,
  clearFilters: clearAllFilters,
} = useLogs()

const { startRefresh, stopRefresh } = useRealtime()

// Local state
const currentPage = ref(1)
const pageSize = ref(50)
const selectedLog = ref<LogEntry | null>(null)
const showLogDetail = ref(false)

// Computed properties
const totalResults = computed(() => filteredLogs.value.length)
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize.value))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

const availableServices = computed(() => {
  const services = new Set<string>()
  logs.value.forEach((log) => {
    services.add(log.service)
  })
  return Array.from(services).sort()
})

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.length > 0 ||
    selectedLevels.value.length > 0 ||
    selectedServices.value.length > 0
  )
})

const hasError = computed(() => !!error.value)

const logContext = computed(() => {
  if (!selectedLog.value) return []
  return getLogContext(selectedLog.value.id, 5)
})

// Methods
const handleSearchChange = () => {
  currentPage.value = 1
  search(searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  search('')
}

const clearFilters = () => {
  clearSearch()
  selectedLevels.value = []
  selectedServices.value = []
  clearAllFilters()
  currentPage.value = 1
}

const selectLog = (log: LogEntry) => {
  selectedLog.value = log
  showLogDetail.value = true
}

const closeLogDetail = () => {
  showLogDetail.value = false
  selectedLog.value = null
}

const navigateToTrace = () => {
  if (selectedLog.value?.traceId) {
    router.push({
      name: 'tracing',
      query: {
        traceId: selectedLog.value.traceId,
        service: selectedLog.value.service,
      },
    })
    closeLogDetail()
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const exportLogs = () => {
  const csv = [
    ['Timestamp', 'Service', 'Level', 'Message'].join(','),
    ...filteredLogs.value.map((log) =>
      [
        formatDateTime(log.timestamp),
        log.service,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
      ].join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const refresh = async () => {
  await logsStore.setLoading(true)
  try {
    // Trigger data refresh via composable
    search(searchQuery.value)
  } finally {
    await logsStore.setLoading(false)
  }
}

const truncateMessage = (message: string, maxLength: number) => {
  return truncateString(message, maxLength)
}

const formatTraceId = (traceId: string) => {
  return traceId.substring(0, 12) + '...'
}

// Lifecycle
onMounted(() => {
  // Initialize logs from store
  logsStore.setLoading(false)

  // Setup real-time refresh if enabled
  if (timeStore.isRealTime) {
    startRefresh(() => {
      refresh()
    })
  }
})

onUnmounted(() => {
  stopRefresh()
})

// Watch for real-time mode changes
watch(
  () => timeStore.isRealTime,
  (isRealTime) => {
    if (isRealTime) {
      startRefresh(() => {
        refresh()
      })
    } else {
      stopRefresh()
    }
  }
)

// Watch for time range changes
watch(
  () => [timeStore.startTime, timeStore.endTime],
  () => {
    currentPage.value = 1
    refresh()
  }
)

// Watch for filter changes
watch(
  () => filterStore.activeFilters,
  () => {
    currentPage.value = 1
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.logs-header {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-lg;
  background-color: $color-bg-secondary;
  border-bottom: 1px solid $color-border;
  margin-bottom: $spacing-lg;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: $spacing-sm $spacing-md;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
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

.clear-button {
  position: absolute;
  right: $spacing-md;
  background: none;
  border: none;
  color: $color-text-secondary;
  cursor: pointer;
  font-size: 18px;

  &:hover {
    color: $color-text-primary;
  }
}

.filter-controls {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  label {
    font-weight: 500;
    color: $color-text-secondary;
    font-size: 13px;
  }
}

.filter-select {
  padding: $spacing-xs $spacing-sm;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 13px;
  max-width: 150px;

  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.clear-filters-button {
  padding: $spacing-xs $spacing-md;
  background-color: transparent;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-secondary;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
  }
}

.logs-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $spacing-lg;
  padding: 0 $spacing-lg $spacing-lg;
  height: calc(100vh - 300px);
}

.log-stream-panel,
.statistics-panel {
  display: flex;
  flex-direction: column;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $color-border;
  background-color: $color-bg-tertiary;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-text-primary;
  }

  h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: $color-text-primary;
  }
}

.pagination-info {
  font-size: 12px;
  color: $color-text-tertiary;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.log-entry {
  padding: $spacing-md;
  border-bottom: 1px solid $color-border-light;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
  }

  &.log-level-error {
    border-left: 3px solid $color-error;
  }

  &.log-level-warn {
    border-left: 3px solid $color-warning;
  }

  &.log-level-fatal {
    border-left: 3px solid $color-error;
  }
}

.log-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
  font-size: 12px;
}

.log-level-badge {
  padding: 2px 6px;
  background-color: $color-bg-tertiary;
  border-radius: 3px;
  font-weight: 600;
  font-size: 11px;
  min-width: 50px;
  text-align: center;

  &.debug {
    color: $color-text-tertiary;
  }

  &.error {
    background-color: rgba($color-error, 0.2);
    color: $color-error;
  }

  &.warn {
    background-color: rgba($color-warning, 0.2);
    color: $color-warning;
  }
}

.log-service {
  color: $color-text-secondary;
  font-weight: 500;
}

.log-time {
  color: $color-text-tertiary;
  margin-left: auto;
}

.log-message {
  color: $color-text-primary;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

.log-trace-link {
  margin-top: $spacing-xs;
  font-size: 11px;
  color: $color-primary;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border-top: 1px solid $color-border;
  background-color: $color-bg-tertiary;
}

.pagination-button {
  padding: $spacing-xs $spacing-md;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: $color-primary;
    border-color: $color-primary;
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-indicator {
  font-size: 12px;
  color: $color-text-secondary;
}

.statistics-panel {
  overflow-y: auto;
}

.stat-section {
  padding: $spacing-md;
  border-bottom: 1px solid $color-border;

  h4 {
    margin: 0 0 $spacing-sm;
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
  }
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs 0;
  font-size: 12px;
}

.stat-label {
  color: $color-text-secondary;
}

.stat-value {
  color: $color-text-primary;
  font-weight: 600;

  &.error {
    color: $color-error;
  }

  &.critical {
    color: $color-error;
  }
}

.export-button {
  margin: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background-color: $color-primary;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: darken($color-primary, 10%);
  }
}

.log-detail-content {
  padding: $spacing-md;
}

.detail-section {
  margin-bottom: $spacing-lg;

  h4 {
    margin: 0 0 $spacing-sm;
    font-size: 13px;
    font-weight: 600;
    color: $color-text-primary;
  }
}

.detail-message {
  margin: 0;
  padding: $spacing-sm;
  background-color: $color-bg-tertiary;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: $spacing-xs 0;
  font-size: 12px;
  border-bottom: 1px solid $color-border-light;

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  color: $color-text-secondary;
  font-weight: 500;
}

.detail-value {
  color: $color-text-primary;
  word-break: break-all;

  &.trace-link {
    color: $color-primary;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.stacktrace {
  margin: 0;
  padding: $spacing-sm;
  background-color: $color-bg-tertiary;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
  max-height: 300px;
}

.context-logs {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.context-log-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-xs;
  background-color: $color-bg-tertiary;
  border-radius: 3px;
  font-size: 11px;
  opacity: 0.7;

  &.is-selected {
    opacity: 1;
    background-color: rgba($color-primary, 0.1);
    border-left: 2px solid $color-primary;
  }
}

.context-log-level {
  font-weight: 600;
  min-width: 50px;
}

.context-log-message {
  color: $color-text-secondary;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Responsive design
@media (max-width: 1400px) {
  .logs-container {
    grid-template-columns: 1fr;
  }

  .statistics-panel {
    display: none;
  }
}

@media (max-width: 1024px) {
  .filter-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    max-width: 100%;
  }
}
</style>
