<template>
  <div class="alert-panel">
    <!-- Header with title and action buttons -->
    <div class="alert-panel-header">
      <div class="header-left">
        <h3 class="panel-title">Active Alerts</h3>
        <span class="alert-count-badge" :class="`severity-${highestSeverity}`">
          {{ activeAlerts.length }}
        </span>
      </div>
      <div class="header-right">
        <button 
          v-if="activeAlerts.length > 0"
          class="btn-icon"
          title="View all alerts"
          @click="showAllAlerts"
        >
          <span class="icon">→</span>
        </button>
      </div>
    </div>

    <!-- Alert list or empty state -->
    <div class="alert-panel-content">
      <template v-if="activeAlerts.length > 0">
        <!-- Severity-grouped alerts -->
        <div 
          v-for="severity in ['critical', 'warning', 'info']"
          :key="severity"
          class="alert-group"
          v-show="alertsBySeverity[severity].length > 0"
        >
          <div class="group-header" :class="`severity-${severity}`">
            <span class="group-label">{{ capitalizeFirst(severity) }}</span>
            <span class="group-count">{{ alertsBySeverity[severity].length }}</span>
          </div>
          
          <!-- Individual alerts in group -->
          <div class="alerts-list">
            <div
              v-for="(alert, index) in alertsBySeverity[severity].slice(0, 3)"
              :key="alert.id"
              class="alert-item"
              :class="[`severity-${severity}`, { 'is-acknowledged': alert.acknowledged }]"
              @click="selectAlert(alert)"
            >
              <!-- Alert icon -->
              <div class="alert-icon">
                <span v-if="severity === 'critical'" class="icon">⚠️</span>
                <span v-else-if="severity === 'warning'" class="icon">⚡</span>
                <span v-else class="icon">ℹ️</span>
              </div>

              <!-- Alert content -->
              <div class="alert-content">
                <div class="alert-title">{{ alert.ruleName }}</div>
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-meta">
                  <span class="meta-item">{{ alert.service }}</span>
                  <span class="meta-item">{{ formatTime(alert.triggeredAt) }}</span>
                </div>
              </div>

              <!-- Alert actions -->
              <div class="alert-actions">
                <button
                  v-if="!alert.acknowledged"
                  class="btn-action btn-acknowledge"
                  title="Acknowledge alert"
                  @click.stop="acknowledgeAlert(alert.id)"
                >
                  ✓
                </button>
                <button
                  class="btn-action btn-details"
                  title="View details"
                  @click.stop="showAlertDetail(alert)"
                >
                  →
                </button>
              </div>
            </div>

            <!-- Show more link if group has more than 3 alerts -->
            <div 
              v-if="alertsBySeverity[severity].length > 3"
              class="show-more"
              @click="showAllAlerts"
            >
              +{{ alertsBySeverity[severity].length - 3 }} more
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-icon">✓</div>
        <div class="empty-title">All Systems Healthy</div>
        <div class="empty-description">No active alerts at this time</div>
      </div>
    </div>

    <!-- Footer with stats -->
    <div v-if="activeAlerts.length > 0" class="alert-panel-footer">
      <div class="footer-stat">
        <span class="stat-label">Unacknowledged:</span>
        <span class="stat-value">{{ unacknowledgedCount }}</span>
      </div>
      <div class="footer-stat">
        <span class="stat-label">Avg Duration:</span>
        <span class="stat-value">{{ avgDuration }}</span>
      </div>
    </div>

    <!-- Alert detail drawer -->
    <InfoDrawer
      :is-open="showDetailDrawer"
      title="Alert Details"
      :show-footer="true"
      primary-action-label="Acknowledge"
      secondary-action-label="Close"
      :show-primary-action="!selectedAlert?.acknowledged"
      @close="showDetailDrawer = false"
      @primary-action="acknowledgeSelectedAlert"
      @secondary-action="showDetailDrawer = false"
    >
      <template #content v-if="selectedAlert">
        <div class="alert-detail-content">
          <!-- Alert header -->
          <div class="detail-section">
            <h4 class="section-title">Alert Information</h4>
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
              <span class="detail-value" :class="`severity-${selectedAlert.severity}`">
                {{ capitalizeFirst(selectedAlert.severity) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                {{ selectedAlert.resolvedAt ? 'Resolved' : 'Active' }}
              </span>
            </div>
          </div>

          <!-- Timing information -->
          <div class="detail-section">
            <h4 class="section-title">Timing</h4>
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
            <h4 class="section-title">Message</h4>
            <div class="detail-message">{{ selectedAlert.message }}</div>
          </div>

          <!-- Acknowledgment info -->
          <div v-if="selectedAlert.acknowledged" class="detail-section">
            <h4 class="section-title">Acknowledgment</h4>
            <div class="detail-row">
              <span class="detail-label">Acknowledged by:</span>
              <span class="detail-value">{{ selectedAlert.acknowledgedBy || 'System' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">At:</span>
              <span class="detail-value">{{ formatDateTime(selectedAlert.acknowledgedAt) }}</span>
            </div>
          </div>
        </div>
      </template>
    </InfoDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAlertsStore } from '@/stores/alertsStore'
import { useAlerts } from '@/composables/useAlerts'
import InfoDrawer from '@/components/Common/InfoDrawer.vue'
import type { AlertEvent } from '@/types'

// Store and composable
const alertsStore = useAlertsStore()
const { acknowledgeAlert: acknowledgeAlertAction } = useAlerts()

// Local state
const showDetailDrawer = ref(false)
const selectedAlert = ref<AlertEvent | null>(null)

// Computed properties
const activeAlerts = computed(() => {
  return alertsStore.events.filter(event => !event.resolvedAt)
})

const alertsBySeverity = computed(() => {
  const grouped: Record<string, AlertEvent[]> = {
    critical: [],
    warning: [],
    info: []
  }
  
  activeAlerts.value.forEach(alert => {
    grouped[alert.severity].sort((a, b) => {
      // Sort by triggered time (newest first)
      return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    })
    grouped[alert.severity].push(alert)
  })
  
  return grouped
})

const highestSeverity = computed(() => {
  if (alertsBySeverity.value.critical.length > 0) return 'critical'
  if (alertsBySeverity.value.warning.length > 0) return 'warning'
  return 'info'
})

const unacknowledgedCount = computed(() => {
  return activeAlerts.value.filter(a => !a.acknowledged).length
})

const avgDuration = computed(() => {
  if (activeAlerts.value.length === 0) return '—'
  
  const durations = activeAlerts.value.map(alert => {
    const start = new Date(alert.triggeredAt).getTime()
    const end = alert.resolvedAt 
      ? new Date(alert.resolvedAt).getTime()
      : new Date().getTime()
    return end - start
  })
  
  const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length
  return formatDuration(avgMs)
})

// Methods
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
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

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

const calculateDuration = (alert: AlertEvent): string => {
  const start = new Date(alert.triggeredAt).getTime()
  const end = alert.resolvedAt 
    ? new Date(alert.resolvedAt).getTime()
    : new Date().getTime()
  return formatDuration(end - start)
}

const selectAlert = (alert: AlertEvent): void => {
  selectedAlert.value = alert
  showDetailDrawer.value = true
}

const showAlertDetail = (alert: AlertEvent): void => {
  selectAlert(alert)
}

const acknowledgeAlert = (alertId: string): void => {
  acknowledgeAlertAction(alertId, 'current-user')
}

const acknowledgeSelectedAlert = (): void => {
  if (selectedAlert.value) {
    acknowledgeAlert(selectedAlert.value.id)
    showDetailDrawer.value = false
  }
}

const showAllAlerts = (): void => {
  // Navigate to alerts page or open full alerts view
  // This would typically emit an event or use router
  console.log('Show all alerts')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.alert-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  overflow: hidden;
}

.alert-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid $color-border;
  background-color: $color-bg-tertiary;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $color-text-primary;
  }

  .alert-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;

    &.severity-critical {
      background-color: $color-error;
    }

    &.severity-warning {
      background-color: $color-warning;
    }

    &.severity-info {
      background-color: $color-primary;
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: $color-text-secondary;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: $color-bg-secondary;
      color: $color-text-primary;
    }

    .icon {
      font-size: 16px;
    }
  }
}

.alert-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $color-border;
    border-radius: 3px;

    &:hover {
      background-color: $color-border-light;
    }
  }
}

.alert-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  .group-label {
    color: $color-text-secondary;
  }

  .group-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 11px;
    color: white;
  }

  &.severity-critical {
    background-color: rgba(242, 73, 92, 0.1);

    .group-count {
      background-color: $color-error;
    }
  }

  &.severity-warning {
    background-color: rgba(255, 152, 48, 0.1);

    .group-count {
      background-color: $color-warning;
    }
  }

  &.severity-info {
    background-color: rgba(50, 116, 217, 0.1);

    .group-count {
      background-color: $color-primary;
    }
  }
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background-color: $color-bg-tertiary;
  border-left: 3px solid;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-secondary;
    transform: translateX(2px);
  }

  &.severity-critical {
    border-left-color: $color-error;
  }

  &.severity-warning {
    border-left-color: $color-warning;
  }

  &.severity-info {
    border-left-color: $color-primary;
  }

  &.is-acknowledged {
    opacity: 0.6;
  }

  .alert-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    font-size: 18px;
  }

  .alert-content {
    flex: 1;
    min-width: 0;
  }

  .alert-title {
    font-size: 13px;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .alert-message {
    font-size: 12px;
    color: $color-text-secondary;
    margin-bottom: 6px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .alert-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: $color-text-tertiary;
  }

  .meta-item {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .alert-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background-color: $color-bg-secondary;
    border: 1px solid $color-border;
    border-radius: 4px;
    color: $color-text-secondary;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
      background-color: $color-primary;
      border-color: $color-primary;
      color: white;
    }

    &.btn-acknowledge {
      &:hover {
        background-color: #73bf69;
        border-color: #73bf69;
      }
    }

    &.btn-details {
      &:hover {
        background-color: $color-primary;
        border-color: $color-primary;
      }
    }
  }
}

.show-more {
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: $color-primary;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: lighten($color-primary, 10%);
    background-color: rgba(50, 116, 217, 0.1);
    border-radius: 4px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: $color-text-secondary;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .empty-title {
    font-size: 14px;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: 4px;
  }

  .empty-description {
    font-size: 12px;
    color: $color-text-tertiary;
  }
}

.alert-panel-footer {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  border-top: 1px solid $color-border;
  background-color: $color-bg-tertiary;
  font-size: 12px;

  .footer-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .stat-label {
      color: $color-text-tertiary;
    }

    .stat-value {
      color: $color-text-primary;
      font-weight: 600;
    }
  }
}

.alert-detail-content {
  padding: 16px 0;
}

.detail-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    color: $color-text-primary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid $color-border;
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: $color-text-secondary;
    font-weight: 500;
  }

  .detail-value {
    color: $color-text-primary;
    text-align: right;
    flex: 1;
    margin-left: 12px;

    &.severity-critical {
      color: $color-error;
    }

    &.severity-warning {
      color: $color-warning;
    }

    &.severity-info {
      color: $color-primary;
    }
  }
}

.detail-message {
  padding: 12px;
  background-color: $color-bg-tertiary;
  border-radius: 4px;
  border-left: 3px solid $color-primary;
  font-size: 13px;
  color: $color-text-primary;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
