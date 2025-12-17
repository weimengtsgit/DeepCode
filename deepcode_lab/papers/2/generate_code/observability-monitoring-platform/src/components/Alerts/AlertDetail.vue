<template>
  <div class="alert-detail">
    <!-- Header Section -->
    <div class="alert-detail-header">
      <div class="header-title">
        <h2>{{ alert?.ruleName || 'Alert Details' }}</h2>
        <span :class="['severity-badge', `severity-${alert?.severity}`]">
          {{ alert?.severity?.toUpperCase() }}
        </span>
      </div>
      <div class="header-actions">
        <button
          v-if="!alert?.acknowledged"
          class="btn btn-secondary"
          @click="handleAcknowledge"
          :disabled="isAcknowledging"
        >
          {{ isAcknowledging ? 'Acknowledging...' : 'Acknowledge' }}
        </button>
        <button
          v-else
          class="btn btn-secondary"
          disabled
        >
          ✓ Acknowledged
        </button>
      </div>
    </div>

    <!-- Alert Status Section -->
    <div class="alert-status-section">
      <div class="status-item">
        <span class="status-label">Status</span>
        <span :class="['status-value', getStatusClass(alert)]">
          {{ getAlertStatus(alert) }}
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">Service</span>
        <span class="status-value">{{ alert?.service || 'N/A' }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Triggered</span>
        <span class="status-value">{{ formatDateTime(alert?.triggeredAt) }}</span>
      </div>
      <div v-if="alert?.resolvedAt" class="status-item">
        <span class="status-label">Resolved</span>
        <span class="status-value">{{ formatDateTime(alert?.resolvedAt) }}</span>
      </div>
    </div>

    <!-- Alert Message Section -->
    <div class="alert-message-section">
      <h3>Alert Message</h3>
      <div class="message-content">
        {{ alert?.message || 'No message available' }}
      </div>
    </div>

    <!-- Rule Details Section -->
    <div v-if="rule" class="rule-details-section">
      <h3>Rule Configuration</h3>
      <div class="rule-grid">
        <div class="rule-item">
          <span class="rule-label">Metric</span>
          <span class="rule-value">{{ rule.metric }}</span>
        </div>
        <div class="rule-item">
          <span class="rule-label">Condition</span>
          <span class="rule-value">{{ rule.condition }}</span>
        </div>
        <div class="rule-item">
          <span class="rule-label">Threshold</span>
          <span class="rule-value">{{ rule.threshold }}</span>
        </div>
        <div class="rule-item">
          <span class="rule-label">Duration</span>
          <span class="rule-value">{{ rule.duration }}s</span>
        </div>
      </div>
    </div>

    <!-- Acknowledgment Details Section -->
    <div v-if="alert?.acknowledged" class="acknowledgment-section">
      <h3>Acknowledgment</h3>
      <div class="acknowledgment-details">
        <div class="ack-item">
          <span class="ack-label">Acknowledged By</span>
          <span class="ack-value">{{ alert?.acknowledgedBy || 'System' }}</span>
        </div>
        <div class="ack-item">
          <span class="ack-label">Acknowledged At</span>
          <span class="ack-value">{{ formatDateTime(alert?.acknowledgedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Duration Section -->
    <div v-if="alert" class="duration-section">
      <h3>Duration</h3>
      <div class="duration-display">
        <span class="duration-value">{{ calculateDuration(alert) }}</span>
        <span class="duration-label">
          {{ alert?.resolvedAt ? 'Total Duration' : 'Active Duration' }}
        </span>
      </div>
    </div>

    <!-- Related Traces/Logs Section -->
    <div class="related-section">
      <h3>Related Data</h3>
      <div class="related-actions">
        <button
          class="btn btn-secondary"
          @click="navigateToTraces"
        >
          View Related Traces
        </button>
        <button
          class="btn btn-secondary"
          @click="navigateToLogs"
        >
          View Related Logs
        </button>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="alert-detail-footer">
      <button class="btn btn-secondary" @click="$emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alertsStore'
import { useAlerts } from '@/composables/useAlerts'
import type { AlertEvent, AlertRule } from '@/types'

interface Props {
  alertId?: string
  alert?: AlertEvent | null
}

interface Emits {
  (e: 'close'): void
  (e: 'acknowledge'): void
}

const props = withDefaults(defineProps<Props>(), {
  alertId: undefined,
  alert: null
})

const emit = defineEmits<Emits>()

const router = useRouter()
const alertsStore = useAlertsStore()
const { acknowledgeAlert } = useAlerts()

const isAcknowledging = ref(false)

// Get alert from store if not provided via props
const currentAlert = computed(() => {
  return props.alert || (props.alertId ? alertsStore.getEventById(props.alertId) : null)
})

// Get associated rule
const rule = computed(() => {
  if (!currentAlert.value) return null
  return alertsStore.getRuleById(currentAlert.value.ruleId)
})

// Get alert status
const getAlertStatus = (alert: AlertEvent | null | undefined): string => {
  if (!alert) return 'Unknown'
  if (alert.resolvedAt) return 'Resolved'
  if (alert.acknowledged) return 'Acknowledged'
  return 'Active'
}

// Get status CSS class
const getStatusClass = (alert: AlertEvent | null | undefined): string => {
  if (!alert) return 'status-unknown'
  if (alert.resolvedAt) return 'status-resolved'
  if (alert.acknowledged) return 'status-acknowledged'
  return 'status-active'
}

// Format date/time
const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Calculate duration
const calculateDuration = (alert: AlertEvent): string => {
  if (!alert.triggeredAt) return 'N/A'
  
  const startTime = typeof alert.triggeredAt === 'string' 
    ? new Date(alert.triggeredAt) 
    : alert.triggeredAt
  
  const endTime = alert.resolvedAt 
    ? (typeof alert.resolvedAt === 'string' ? new Date(alert.resolvedAt) : alert.resolvedAt)
    : new Date()
  
  const durationMs = endTime.getTime() - startTime.getTime()
  const durationSeconds = Math.floor(durationMs / 1000)
  
  if (durationSeconds < 60) {
    return `${durationSeconds}s`
  } else if (durationSeconds < 3600) {
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    return `${minutes}m ${seconds}s`
  } else {
    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.floor((durationSeconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

// Handle acknowledge action
const handleAcknowledge = async () => {
  if (!currentAlert.value) return
  
  isAcknowledging.value = true
  try {
    await acknowledgeAlert(currentAlert.value.id, 'current-user')
    emit('acknowledge')
  } catch (error) {
    console.error('Failed to acknowledge alert:', error)
  } finally {
    isAcknowledging.value = false
  }
}

// Navigate to related traces
const navigateToTraces = () => {
  if (!currentAlert.value) return
  
  router.push({
    name: 'tracing',
    query: {
      service: currentAlert.value.service,
      severity: 'error'
    }
  })
  emit('close')
}

// Navigate to related logs
const navigateToLogs = () => {
  if (!currentAlert.value) return
  
  router.push({
    name: 'logs',
    query: {
      service: currentAlert.value.service,
      level: 'ERROR'
    }
  })
  emit('close')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.alert-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background-color: $color-bg-secondary;
  color: $color-text-primary;
  max-height: 100vh;
  overflow-y: auto;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: $color-text-primary;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.alert-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid $color-border;

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    h2 {
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.severity-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &.severity-critical {
    background-color: rgba(242, 73, 92, 0.2);
    color: #f2495c;
  }

  &.severity-warning {
    background-color: rgba(255, 152, 48, 0.2);
    color: #ff9830;
  }

  &.severity-info {
    background-color: rgba(50, 116, 217, 0.2);
    color: #3274d9;
  }
}

.alert-status-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: $color-bg-tertiary;
  border-radius: 4px;

  .status-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .status-label {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-value {
    font-size: 14px;
    font-weight: 500;
    color: $color-text-primary;

    &.status-active {
      color: #ff9830;
    }

    &.status-acknowledged {
      color: #3274d9;
    }

    &.status-resolved {
      color: #73bf69;
    }

    &.status-unknown {
      color: $color-text-secondary;
    }
  }
}

.alert-message-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .message-content {
    padding: 12px;
    background-color: $color-bg-tertiary;
    border-left: 3px solid $color-primary;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.5;
    color: $color-text-primary;
    word-break: break-word;
  }
}

.rule-details-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .rule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .rule-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background-color: $color-bg-tertiary;
    border-radius: 4px;
  }

  .rule-label {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rule-value {
    font-size: 14px;
    font-weight: 500;
    color: $color-text-primary;
    font-family: 'Monaco', 'Courier New', monospace;
  }
}

.acknowledgment-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: rgba(115, 191, 105, 0.1);
  border-left: 3px solid #73bf69;
  border-radius: 4px;

  .acknowledgment-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .ack-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ack-label {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ack-value {
    font-size: 14px;
    font-weight: 500;
    color: $color-text-primary;
  }
}

.duration-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .duration-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background-color: $color-bg-tertiary;
    border-radius: 4px;
  }

  .duration-value {
    font-size: 24px;
    font-weight: 600;
    color: $color-primary;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  .duration-label {
    font-size: 12px;
    font-weight: 500;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.related-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .related-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.alert-detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid $color-border;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.btn-secondary {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
    border: 1px solid $color-border;

    &:hover:not(:disabled) {
      background-color: $color-border;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: $color-border;
  border-radius: 4px;

  &:hover {
    background: $color-border-light;
  }
}
</style>
