<template>
  <div class="time-range-picker">
    <!-- Main container with toggle button -->
    <div class="time-picker-header">
      <button class="time-picker-toggle" @click="toggleExpanded">
        <span class="time-range-display">{{ formattedTimeRange }}</span>
        <span class="expand-icon" :class="{ expanded: isExpanded }">▼</span>
      </button>
    </div>

    <!-- Expanded picker panel -->
    <Transition name="slide-down">
      <div v-if="isExpanded" class="time-picker-panel">
        <!-- Quick preset buttons -->
        <QuickTimeSelect
          :selected-preset="selectedPreset"
          @select-preset="applyPreset"
        />

        <!-- Custom date/time range picker -->
        <CustomDateTimeRange
          :start-time="startTime"
          :end-time="endTime"
          @update-range="setCustomRange"
        />

        <!-- Real-time mode toggle -->
        <RealtimeToggle
          :real-time-mode="realTimeMode"
          :refresh-interval="refreshInterval"
          @toggle-real-time="toggleRealTime"
          @update-interval="setRefreshInterval"
        />

        <!-- Time comparison toggle -->
        <TimeComparison
          :enabled="comparisonEnabled"
          @toggle-comparison="toggleComparison"
        />

        <!-- Action buttons -->
        <div class="time-picker-actions">
          <button class="btn-secondary" @click="toggleExpanded">Close</button>
          <button class="btn-primary" @click="applyChanges">Apply</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTimeStore } from '@/stores/timeStore'
import QuickTimeSelect from './QuickTimeSelect.vue'
import CustomDateTimeRange from './CustomDateTimeRange.vue'
import RealtimeToggle from './RealtimeToggle.vue'
import TimeComparison from './TimeComparison.vue'

// Store
const timeStore = useTimeStore()

// Local state
const isExpanded = ref(false)
const comparisonEnabled = ref(false)
let autoAdvanceInterval: NodeJS.Timeout | null = null

// Computed properties
const startTime = computed(() => timeStore.startTime)
const endTime = computed(() => timeStore.endTime)
const selectedPreset = computed(() => timeStore.selectedPreset)
const realTimeMode = computed(() => timeStore.realTimeMode)
const refreshInterval = computed(() => timeStore.refreshInterval)

const formattedTimeRange = computed(() => {
  const start = startTime.value.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const end = endTime.value.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return `${start} - ${end}`
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const applyPreset = (preset: string) => {
  timeStore.applyPreset(preset as any)
}

const setCustomRange = (start: Date, end: Date) => {
  timeStore.setTimeRange(start, end)
}

const toggleRealTime = () => {
  timeStore.toggleRealTime()
}

const setRefreshInterval = (seconds: number) => {
  timeStore.setRefreshInterval(seconds)
}

const toggleComparison = () => {
  comparisonEnabled.value = !comparisonEnabled.value
}

const applyChanges = () => {
  isExpanded.value = false
}

// Auto-advance in real-time mode
const setupAutoAdvance = () => {
  if (realTimeMode.value && refreshInterval.value > 0) {
    if (autoAdvanceInterval) {
      clearInterval(autoAdvanceInterval)
    }
    autoAdvanceInterval = setInterval(() => {
      timeStore.advanceTimeRange()
    }, refreshInterval.value * 1000)
  } else {
    if (autoAdvanceInterval) {
      clearInterval(autoAdvanceInterval)
      autoAdvanceInterval = null
    }
  }
}

// Watchers
watch([realTimeMode, refreshInterval], () => {
  setupAutoAdvance()
})

// Lifecycle
onMounted(() => {
  setupAutoAdvance()
})

onUnmounted(() => {
  if (autoAdvanceInterval) {
    clearInterval(autoAdvanceInterval)
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.time-range-picker {
  position: relative;
  display: inline-block;
}

.time-picker-header {
  display: flex;
  align-items: center;
}

.time-picker-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    border-color: $color-border-light;
  }

  &:active {
    transform: scale(0.98);
  }
}

.time-range-display {
  font-weight: 500;
  white-space: nowrap;
}

.expand-icon {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 12px;

  &.expanded {
    transform: rotate(180deg);
  }
}

.time-picker-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  padding: 16px;
  min-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-picker-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid $color-border;
}

.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-secondary {
  background-color: $color-bg-tertiary;
  color: $color-text-primary;
  border: 1px solid $color-border;

  &:hover {
    background-color: $color-border;
  }
}

.btn-primary {
  background-color: $color-primary;
  color: white;

  &:hover {
    opacity: 0.9;
  }
}

// Transitions
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// Responsive
@media (max-width: 1400px) {
  .time-picker-panel {
    min-width: 350px;
  }
}

@media (max-width: 1024px) {
  .time-picker-panel {
    min-width: 300px;
    right: 0;
    left: auto;
  }
}
</style>
