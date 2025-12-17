<template>
  <div class="alert-history">
    <!-- Header with filters -->
    <div class="alert-history-header">
      <div class="header-title">
        <h2>Alert History</h2>
        <span class="total-count">{{ totalResults }} alerts</span>
      </div>
      
      <div class="header-controls">
        <!-- Severity filter -->
        <div class="filter-group">
          <label>Severity:</label>
          <select v-model="selectedSeverity" class="filter-select">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <!-- Service filter -->
        <div class="filter-group">
          <label>Service:</label>
          <select v-model="selectedService" class="filter-select">
            <option value="">All Services</option>
            <option v-for="service in availableServices" :key="service" :value="service">
              {{ service }}
            </option>
          </select>
        </div>

        <!-- Status filter -->
        <div class="filter-group">
          <label>Status:</label>
          <select v-model="selectedStatus" class="filter-select">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>

        <!-- Clear filters button -->
        <button v-if="hasActiveFilters" class="btn-clear-filters" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <LoadingSkeleton v-for="i in 5" :key="i" class="skeleton-row" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredAlerts.length === 0"
      icon-type="no-results"
      title="No Alerts Found"
      description="No alerts match your current filters. Try adjusting your search criteria."
      :show-action-button="hasActiveFilters"
      action-button-label="Clear Filters"
      @action="clearFilters"
    />

    <!-- Alerts table -->
    <div v-else class="alerts-table-wrapper">
      <table class="alerts-table">
        <thead>
          <tr>
            <th class="col-severity" @click="sortBy('severity')">
              Severity
              <span v-if="sortField === 'severity'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="col-rule" @click="sortBy('ruleName')">
              Rule
              <span v-if="sortField === 'ruleName'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="col-service" @click="sortBy('service')">
              Service
              <span v-if="sortField === 'service'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="col-triggered" @click="sortBy('triggeredAt')">
              Triggered
              <span v-if="sortField === 'triggeredAt'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="col-duration">Duration</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in paginatedAlerts" :key="alert.id" class="alert-row" :class="alert.severity">
            <!-- Severity badge -->
            <td class="col-severity">
              <span class="severity-badge" :class="alert.severity">
                {{ capitalizeFirst(alert.severity) }}
              </span>
            </td>

            <!-- Rule name -->
            <td class="col-rule">
              <span class="rule-name">{{ alert.ruleName }}</span>
            </td>

            <!-- Service -->
            <td class="col-service">
              <span class="service-name">{{ alert.service }}</span>
            </td>

            <!-- Triggered time -->
            <td class="col-triggered">
              <span class="time-value" :title="formatDateTime(alert.triggeredAt)">
                {{ formatTime(alert.triggeredAt) }}
              </span>
            </td>

            <!-- Duration -->
            <td class="col-duration">
              <span class="duration-value">
                {{ calculateDuration(alert) }}
              </span>
            </td>

            <!-- Status -->
            <td class="col-status">
              <span class="status-badge" :class="getAlertStatus(alert)">
                {{ getAlertStatus(alert) | capitalize }}
              </span>
            </td>

            <!-- Actions -->
            <td class="col-actions">
              <button
                v-if="!alert.resolved && !alert.acknowledged"
                class="btn-action"
                @click="acknowledgeAlert(alert.id)"
                title="Acknowledge this alert"
              >
                Acknowledge
              </button>
              <button
                class="btn-action"
                @click="selectAlert(alert)"
                title="View alert details"
              >
                Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-container">
      <button
        class="btn-pagination"
        :disabled="currentPage === 1"
        @click="previousPage"
      >
        ← Previous
      </button>

      <div class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </div>

      <button
        class="btn-pagination"
        :disabled="currentPage === totalPages"
        @click="nextPage"
      >
        Next →
      </button>
    </div>

    <!-- Alert detail drawer -->
    <InfoDrawer
      :is-open="selectedAlertId !== null"
      title="Alert Details"
      :show-footer="true"
      primary-action-label="Acknowledge"
      secondary-action-label="Close"
      :show-primary-action="!selectedAlert?.acknowledged && !selectedAlert?.resolved"
      @primary-action="acknowledgeSelectedAlert"
      @secondary-action="closeDetailDrawer"
      @close="closeDetailDrawer"
    >
      <template #content v-if="selectedAlert">
        <div class="alert-detail-content">
          <!-- Alert metadata -->
          <div class="detail-section">
            <h3>Alert Information</h3>
            <div class="detail-row">
              <span class="detail-label">Rule:</span>
              <span class="detail-value">{{ selectedAlert.ruleName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">{{ selectedAlert.service }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Severity:</span>
              <span class="detail-value">
                <span class="severity-badge" :class="selectedAlert.severity">
                  {{ capitalizeFirst(selectedAlert.severity) }}
                </span>
              </span>
            </div>
          </div>

          <!-- Timing information -->
          <div class="detail-section">
            <h3>Timing</h3>
            <div class="detail-row">
              <span class="detail-label">Triggered:</span>
              <span class="detail-value">{{ formatDateTime(selectedAlert.triggeredAt) }}</span>
            </div>
            <div v-if="selectedAlert.resolvedAt" class="detail-row">
              <span class="detail-label">Resolved:</span>
              <span class="detail-value">{{ formatDateTime(selectedAlert.resolvedAt) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">{{ calculateDuration(selectedAlert) }}</span>
            </div>
          </div>

          <!-- Message -->
          <div class="detail-section">
            <h3>Message</h3>
            <p class="alert-message">{{ selectedAlert.message }}</p>
          </div>

          <!-- Acknowledgment info -->
          <div v-if="selectedAlert.acknowledged" class="detail-section">
            <h3>Acknowledgment</h3>
            <div class="detail-row">
              <span class="detail-label">Acknowledged by:</span>
              <span class="detail-value">{{ selectedAlert.acknowledgedBy || 'Unknown' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Acknowledged at:</span>
              <span class="detail-value">{{ formatDateTime(selectedAlert.acknowledgedAt) }}</span>
            </div>
          </div>

          <!-- Status -->
          <div class="detail-section">
            <h3>Status</h3>
            <div class="status-indicator" :class="getAlertStatus(selectedAlert)">
              {{ getAlertStatus(selectedAlert) | capitalize }}
            </div>
          </div>
        </div>
      </template>
    </InfoDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAlertsStore } from '@/stores/alertsStore'
import { useAlerts } from '@/composables/useAlerts'
import { useTimeStore } from '@/stores/timeStore'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import InfoDrawer from '@/components/Common/InfoDrawer.vue'
import type { AlertEvent } from '@/types'

// Stores and composables
const alertsStore = useAlertsStore()
const { acknowledgeAlert: acknowledgeAlertAction } = useAlerts()
const timeStore = useTimeStore()

// Local state
const selectedSeverity = ref<string>('')
const selectedService = ref<string>('')
const selectedStatus = ref<string>('')
const selectedAlertId = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const sortField = ref<string>('triggeredAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const loading = ref(false)

// Computed properties
const filteredAlerts = computed(() => {
  let alerts = alertsStore.events

  // Filter by severity
  if (selectedSeverity.value) {
    alerts = alerts.filter(a => a.severity === selectedSeverity.value)
  }

  // Filter by service
  if (selectedService.value) {
    alerts = alerts.filter(a => a.service === selectedService.value)
  }

  // Filter by status
  if (selectedStatus.value) {
    alerts = alerts.filter(a => {
      if (selectedStatus.value === 'active') return !a.resolvedAt
      if (selectedStatus.value === 'resolved') return a.resolvedAt
      if (selectedStatus.value === 'acknowledged') return a.acknowledged
      return true
    })
  }

  // Sort
  const sorted = [...alerts].sort((a, b) => {
    let aVal: any = a[sortField.value as keyof AlertEvent]
    let bVal: any = b[sortField.value as keyof AlertEvent]

    if (aVal instanceof Date && bVal instanceof Date) {
      aVal = aVal.getTime()
      bVal = bVal.getTime()
    }

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return sorted
})

const totalResults = computed(() => filteredAlerts.value.length)
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize.value))

const paginatedAlerts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlerts.value.slice(start, end)
})

const availableServices = computed(() => {
  const services = new Set(alertsStore.events.map(a => a.service))
  return Array.from(services).sort()
})

const hasActiveFilters = computed(() => {
  return selectedSeverity.value || selectedService.value || selectedStatus.value
})

const selectedAlert = computed(() => {
  if (!selectedAlertId.value) return null
  return alertsStore.events.find(a => a.id === selectedAlertId.value) || null
})

// Methods
const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
  currentPage.value = 1
}

const clearFilters = () => {
  selectedSeverity.value = ''
  selectedService.value = ''
  selectedStatus.value = ''
  currentPage.value = 1
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const selectAlert = (alert: AlertEvent) => {
  selectedAlertId.value = alert.id
}

const closeDetailDrawer = () => {
  selectedAlertId.value = null
}

const acknowledgeAlert = (alertId: string) => {
  acknowledgeAlertAction(alertId, 'current-user')
}

const acknowledgeSelectedAlert = () => {
  if (selectedAlert.value) {
    acknowledgeAlert(selectedAlert.value.id)
    closeDetailDrawer()
  }
}

const getAlertStatus = (alert: AlertEvent): string => {
  if (alert.resolvedAt) return 'resolved'
  if (alert.acknowledged) return 'acknowledged'
  return 'active'
}

const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString()
}

const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString()
}

const calculateDuration = (alert: AlertEvent): string => {
  const start = new Date(alert.triggeredAt)
  const end = alert.resolvedAt ? new Date(alert.resolvedAt) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '< 1m'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`
  return `${diffDays}d ${diffHours % 24}h`
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Lifecycle
onMounted(() => {
  // Load alerts from store (already populated by mock data)
  loading.value = false
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.alert-history {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background-color: $color-bg-secondary;
  border-radius: 8px;
  min-height: 400px;
}

.alert-history-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: $color-text-primary;
  }

  .total-count {
    font-size: 14px;
    color: $color-text-secondary;
    background-color: $color-bg-tertiary;
    padding: 4px 12px;
    border-radius: 12px;
  }
}

.header-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 14px;
    color: $color-text-secondary;
    font-weight: 500;
  }

  .filter-select {
    padding: 8px 12px;
    border: 1px solid $color-border;
    border-radius: 4px;
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: $color-border-light;
    }

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 2px rgba(50, 116, 217, 0.1);
    }
  }
}

.btn-clear-filters {
  padding: 8px 16px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: transparent;
  color: $color-text-secondary;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .skeleton-row {
    height: 48px;
  }
}

.alerts-table-wrapper {
  overflow-x: auto;
  border: 1px solid $color-border;
  border-radius: 4px;
}

.alerts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background-color: $color-bg-tertiary;
    border-bottom: 1px solid $color-border;

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: $color-text-primary;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      .sort-indicator {
        margin-left: 4px;
        font-size: 12px;
        color: $color-primary;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $color-border;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.02);
      }

      &.critical {
        border-left: 3px solid #f2495c;
      }

      &.warning {
        border-left: 3px solid #ff9830;
      }

      &.info {
        border-left: 3px solid #3274d9;
      }
    }

    td {
      padding: 12px 16px;
      color: $color-text-primary;
    }
  }
}

.col-severity {
  width: 100px;
}

.col-rule {
  width: 200px;
}

.col-service {
  width: 150px;
}

.col-triggered {
  width: 150px;
}

.col-duration {
  width: 120px;
}

.col-status {
  width: 120px;
}

.col-actions {
  width: 200px;
}

.severity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;

  &.critical {
    background-color: rgba(242, 73, 92, 0.2);
    color: #f2495c;
  }

  &.warning {
    background-color: rgba(255, 152, 48, 0.2);
    color: #ff9830;
  }

  &.info {
    background-color: rgba(50, 116, 217, 0.2);
    color: #3274d9;
  }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;

  &.active {
    background-color: rgba(242, 73, 92, 0.2);
    color: #f2495c;
  }

  &.acknowledged {
    background-color: rgba(255, 152, 48, 0.2);
    color: #ff9830;
  }

  &.resolved {
    background-color: rgba(115, 191, 105, 0.2);
    color: #73bf69;
  }
}

.btn-action {
  padding: 6px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: transparent;
  color: $color-primary;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 8px;

  &:hover {
    background-color: rgba(50, 116, 217, 0.1);
    border-color: $color-primary;
  }

  &:active {
    transform: scale(0.98);
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid $color-border;
}

.btn-pagination {
  padding: 8px 16px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: transparent;
  color: $color-text-primary;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: $color-bg-tertiary;
    border-color: $color-border-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 14px;
  color: $color-text-secondary;
  min-width: 150px;
  text-align: center;
}

.alert-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-text-primary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid $color-border;

  .detail-label {
    font-size: 13px;
    color: $color-text-secondary;
    font-weight: 500;
  }

  .detail-value {
    font-size: 13px;
    color: $color-text-primary;
  }
}

.alert-message {
  margin: 0;
  padding: 12px;
  background-color: $color-bg-tertiary;
  border-radius: 4px;
  font-size: 13px;
  color: $color-text-primary;
  line-height: 1.5;
  word-break: break-word;
}

.status-indicator {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;

  &.active {
    background-color: rgba(242, 73, 92, 0.2);
    color: #f2495c;
  }

  &.acknowledged {
    background-color: rgba(255, 152, 48, 0.2);
    color: #ff9830;
  }

  &.resolved {
    background-color: rgba(115, 191, 105, 0.2);
    color: #73bf69;
  }
}

@media (max-width: 1400px) {
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-group {
    width: 100%;

    .filter-select {
      flex: 1;
    }
  }

  .alerts-table {
    font-size: 12px;

    th,
    td {
      padding: 8px 12px;
    }
  }

  .col-rule,
  .col-service {
    width: auto;
  }
}

@media (max-width: 1024px) {
  .alert-history {
    padding: 16px;
  }

  .alerts-table-wrapper {
    overflow-x: auto;
  }

  .btn-action {
    padding: 4px 8px;
    font-size: 11px;
    margin-right: 4px;
  }
}
</style>
