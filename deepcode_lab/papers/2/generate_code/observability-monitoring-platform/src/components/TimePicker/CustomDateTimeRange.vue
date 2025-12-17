<template>
  <div class="custom-date-time-range">
    <div class="range-section">
      <div class="section-label">Start Time</div>
      <div class="input-group">
        <input
          v-model="startDateStr"
          type="date"
          class="date-input"
          :max="endDateStr"
          @change="validateAndUpdate"
        />
        <input
          v-model="startTimeStr"
          type="time"
          class="time-input"
          @change="validateAndUpdate"
        />
      </div>
    </div>

    <div class="range-section">
      <div class="section-label">End Time</div>
      <div class="input-group">
        <input
          v-model="endDateStr"
          type="date"
          class="date-input"
          :min="startDateStr"
          @change="validateAndUpdate"
        />
        <input
          v-model="endTimeStr"
          type="time"
          class="time-input"
          @change="validateAndUpdate"
        />
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div class="duration-display">
      <span class="label">Duration:</span>
      <span class="value">{{ formattedDuration }}</span>
    </div>

    <div class="actions">
      <button
        class="btn btn-secondary"
        @click="handleCancel"
      >
        Cancel
      </button>
      <button
        class="btn btn-primary"
        :disabled="!isValid"
        @click="handleApply"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeStore } from '@/stores/timeStore'

const timeStore = useTimeStore()

// Local state for form inputs
const startDateStr = ref<string>('')
const startTimeStr = ref<string>('')
const endDateStr = ref<string>('')
const endTimeStr = ref<string>('')
const errorMessage = ref<string>('')

// Initialize from store
onMounted(() => {
  const start = timeStore.startTime
  const end = timeStore.endTime

  startDateStr.value = formatDateForInput(start)
  startTimeStr.value = formatTimeForInput(start)
  endDateStr.value = formatDateForInput(end)
  endTimeStr.value = formatTimeForInput(end)
})

// Format Date to YYYY-MM-DD for date input
function formatDateForInput(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format Date to HH:MM for time input
function formatTimeForInput(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Parse date and time strings to Date object
function parseDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null

  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)

    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
    return date
  } catch {
    return null
  }
}

// Validate and update
function validateAndUpdate(): void {
  errorMessage.value = ''

  const start = parseDateTime(startDateStr.value, startTimeStr.value)
  const end = parseDateTime(endDateStr.value, endTimeStr.value)

  if (!start || !end) {
    errorMessage.value = 'Invalid date or time format'
    return
  }

  if (start >= end) {
    errorMessage.value = 'Start time must be before end time'
    return
  }

  const maxDuration = 90 * 24 * 60 * 60 * 1000 // 90 days
  if (end.getTime() - start.getTime() > maxDuration) {
    errorMessage.value = 'Time range cannot exceed 90 days'
    return
  }
}

// Computed properties
const isValid = computed(() => {
  if (errorMessage.value) return false

  const start = parseDateTime(startDateStr.value, startTimeStr.value)
  const end = parseDateTime(endDateStr.value, endTimeStr.value)

  return start && end && start < end
})

const formattedDuration = computed(() => {
  const start = parseDateTime(startDateStr.value, startTimeStr.value)
  const end = parseDateTime(endDateStr.value, endTimeStr.value)

  if (!start || !end) return 'Invalid'

  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / (60 * 1000))

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  } else if (diffMinutes < 24 * 60) {
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  } else {
    const days = Math.floor(diffMinutes / (24 * 60))
    const hours = Math.floor((diffMinutes % (24 * 60)) / 60)
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }
})

// Event handlers
function handleCancel(): void {
  // Reset to current store values
  const start = timeStore.startTime
  const end = timeStore.endTime

  startDateStr.value = formatDateForInput(start)
  startTimeStr.value = formatTimeForInput(start)
  endDateStr.value = formatDateForInput(end)
  endTimeStr.value = formatTimeForInput(end)

  errorMessage.value = ''
}

function handleApply(): void {
  if (!isValid.value) return

  const start = parseDateTime(startDateStr.value, startTimeStr.value)
  const end = parseDateTime(endDateStr.value, endTimeStr.value)

  if (start && end) {
    timeStore.setTimeRange(start, end)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.custom-date-time-range {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: $color-bg-secondary;
  border-radius: 4px;
}

.range-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: $color-text-secondary;
  letter-spacing: 0.5px;
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.date-input,
.time-input {
  flex: 1;
  padding: 8px 12px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 14px;
  font-family: 'Courier New', monospace;

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 2px rgba(50, 116, 217, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Webkit calendar picker styling
  &::-webkit-calendar-picker-indicator {
    filter: invert(0.8);
    cursor: pointer;
  }
}

.date-input {
  flex: 1.5;
}

.time-input {
  flex: 1;
}

.error-message {
  padding: 8px 12px;
  background-color: rgba(242, 73, 92, 0.1);
  border: 1px solid $color-error;
  border-radius: 4px;
  color: $color-error;
  font-size: 12px;
  line-height: 1.4;
}

.duration-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: $color-bg-tertiary;
  border-radius: 4px;
  border: 1px solid $color-border-light;

  .label {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
  }

  .value {
    font-size: 14px;
    font-weight: 500;
    color: $color-text-primary;
    font-family: 'Courier New', monospace;
  }
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background-color: $color-bg-tertiary;
  color: $color-text-primary;
  border: 1px solid $color-border;

  &:hover:not(:disabled) {
    background-color: $color-bg-secondary;
    border-color: $color-border;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
}

.btn-primary {
  background-color: $color-primary;
  color: white;

  &:hover:not(:disabled) {
    background-color: darken($color-primary, 10%);
    box-shadow: 0 2px 8px rgba(50, 116, 217, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
}
</style>
