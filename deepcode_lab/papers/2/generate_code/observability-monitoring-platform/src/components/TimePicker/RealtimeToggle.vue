<template>
  <div class="realtime-toggle">
    <div class="toggle-container">
      <label class="toggle-label">
        <input
          type="checkbox"
          :checked="isRealTimeMode"
          @change="handleToggle"
          class="toggle-input"
        />
        <span class="toggle-switch"></span>
        <span class="toggle-text">Real-time Mode</span>
      </label>
      
      <div v-if="isRealTimeMode" class="live-indicator">
        <span class="live-dot"></span>
        <span class="live-text">LIVE</span>
      </div>
    </div>

    <div v-if="isRealTimeMode" class="refresh-interval-section">
      <label class="interval-label">Refresh Interval:</label>
      <div class="interval-buttons">
        <button
          v-for="interval in refreshIntervalOptions"
          :key="interval"
          :class="['interval-btn', { active: selectedInterval === interval }]"
          @click="handleIntervalChange(interval)"
        >
          {{ formatInterval(interval) }}
        </button>
      </div>
      <div class="interval-display">
        Next refresh in {{ countdownSeconds }}s
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTimeStore } from '@/stores/timeStore'

interface Props {
  modelValue?: boolean
  refreshInterval?: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:refreshInterval', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  refreshInterval: 10
})

const emit = defineEmits<Emits>()

const timeStore = useTimeStore()

// Local state
const isRealTimeMode = computed({
  get: () => props.modelValue || timeStore.realTimeMode,
  set: (value: boolean) => {
    emit('update:modelValue', value)
    timeStore.toggleRealTime()
  }
})

const selectedInterval = computed({
  get: () => props.refreshInterval || timeStore.refreshInterval,
  set: (value: number) => {
    emit('update:refreshInterval', value)
    timeStore.setRefreshInterval(value)
  }
})

const refreshIntervalOptions = [5, 10, 30, 60]

const countdownSeconds = ref<number>(selectedInterval.value)
let countdownInterval: ReturnType<typeof setInterval> | null = null

// Methods
const handleToggle = (event: Event) => {
  const target = event.target as HTMLInputElement
  isRealTimeMode.value = target.checked
}

const handleIntervalChange = (interval: number) => {
  selectedInterval.value = interval
  countdownSeconds.value = interval
}

const formatInterval = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  return `${Math.floor(seconds / 60)}m`
}

const startCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  countdownSeconds.value = selectedInterval.value

  countdownInterval = setInterval(() => {
    countdownSeconds.value--
    if (countdownSeconds.value <= 0) {
      countdownSeconds.value = selectedInterval.value
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// Watchers
watch(isRealTimeMode, (newVal) => {
  if (newVal) {
    startCountdown()
  } else {
    stopCountdown()
  }
})

watch(selectedInterval, () => {
  countdownSeconds.value = selectedInterval.value
})

// Lifecycle
onMounted(() => {
  if (isRealTimeMode.value) {
    startCountdown()
  }
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.realtime-toggle {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-md;
  background-color: $color-bg-secondary;
  border-radius: $border-radius-md;
  border: 1px solid $color-border;
}

.toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  display: none;

  &:checked + .toggle-switch {
    background-color: $color-success;

    &::after {
      transform: translateX(20px);
    }
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background-color: $color-border;
  border-radius: 12px;
  transition: background-color $transition-normal ease-out;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: transform $transition-normal ease-out;
  }
}

.toggle-text {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background-color: rgba($color-success, 0.1);
  border-radius: $border-radius-sm;
  border: 1px solid $color-success;
}

.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: $color-success;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

.live-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-success;
  letter-spacing: 1px;
}

.refresh-interval-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $color-border;
}

.interval-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.interval-buttons {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.interval-btn {
  padding: $spacing-xs $spacing-sm;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-normal ease-out;

  &:hover {
    background-color: $color-bg-secondary;
    border-color: $color-primary;
    color: $color-primary;
  }

  &.active {
    background-color: $color-primary;
    border-color: $color-primary;
    color: white;
  }

  &:active {
    transform: scale(0.95);
  }
}

.interval-display {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
  padding: $spacing-xs;
  background-color: rgba($color-primary, 0.05);
  border-radius: $border-radius-sm;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle-switch,
  .interval-btn,
  .live-dot {
    animation: none;
    transition: none;
  }
}

@include media-max-md {
  .realtime-toggle {
    padding: $spacing-sm;
    gap: $spacing-sm;
  }

  .toggle-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .interval-buttons {
    width: 100%;
  }

  .interval-btn {
    flex: 1;
    min-width: 60px;
  }
}
</style>
