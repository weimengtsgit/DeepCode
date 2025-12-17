<template>
  <div class="time-comparison">
    <div class="comparison-header">
      <label class="comparison-toggle">
        <input
          type="checkbox"
          :checked="isComparisonEnabled"
          @change="handleToggleComparison"
          class="toggle-input"
        />
        <span class="toggle-label">Compare with Previous Period</span>
      </label>
    </div>

    <div v-if="isComparisonEnabled" class="comparison-config">
      <div class="comparison-mode">
        <label>Comparison Mode:</label>
        <select
          :value="comparisonMode"
          @change="handleModeChange"
          class="mode-select"
        >
          <option value="previous_period">Previous Period</option>
          <option value="previous_year">Previous Year (Same Period)</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      <div v-if="comparisonMode === 'custom'" class="custom-comparison">
        <div class="date-input-group">
          <label>Compare Start:</label>
          <input
            type="date"
            :value="customComparisonStart"
            @change="handleCustomStartChange"
            class="date-input"
          />
        </div>
        <div class="date-input-group">
          <label>Compare End:</label>
          <input
            type="date"
            :value="customComparisonEnd"
            @change="handleCustomEndChange"
            class="date-input"
          />
        </div>
      </div>

      <div class="comparison-info">
        <div class="info-item">
          <span class="info-label">Current Period:</span>
          <span class="info-value">{{ formatDateRange(currentStart, currentEnd) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Comparison Period:</span>
          <span class="info-value">{{ formatDateRange(comparisonStart, comparisonEnd) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTimeStore } from '@/stores/timeStore'
import { formatDateTime, formatDate } from '@/utils/formatters'

interface Props {
  modelValue?: boolean
  comparisonMode?: 'previous_period' | 'previous_year' | 'custom'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:comparisonMode', value: string): void
  (e: 'comparisonRangeChange', range: { start: Date; end: Date }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  comparisonMode: 'previous_period'
})

const emit = defineEmits<Emits>()

const timeStore = useTimeStore()

const isComparisonEnabled = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const comparisonMode = computed({
  get: () => props.comparisonMode,
  set: (value) => emit('update:comparisonMode', value)
})

const customComparisonStart = ref<string>('')
const customComparisonEnd = ref<string>('')

const currentStart = computed(() => timeStore.startTime)
const currentEnd = computed(() => timeStore.endTime)

const comparisonStart = computed(() => {
  if (comparisonMode.value === 'previous_period') {
    const duration = currentEnd.value.getTime() - currentStart.value.getTime()
    return new Date(currentStart.value.getTime() - duration)
  } else if (comparisonMode.value === 'previous_year') {
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    return new Date(currentStart.value.getTime() - oneYearMs)
  } else {
    return new Date(customComparisonStart.value)
  }
})

const comparisonEnd = computed(() => {
  if (comparisonMode.value === 'previous_period') {
    const duration = currentEnd.value.getTime() - currentStart.value.getTime()
    return new Date(currentEnd.value.getTime() - duration)
  } else if (comparisonMode.value === 'previous_year') {
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    return new Date(currentEnd.value.getTime() - oneYearMs)
  } else {
    return new Date(customComparisonEnd.value)
  }
})

const handleToggleComparison = (event: Event) => {
  const target = event.target as HTMLInputElement
  isComparisonEnabled.value = target.checked
}

const handleModeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  comparisonMode.value = target.value as 'previous_period' | 'previous_year' | 'custom'
}

const handleCustomStartChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  customComparisonStart.value = target.value
  emitComparisonRange()
}

const handleCustomEndChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  customComparisonEnd.value = target.value
  emitComparisonRange()
}

const emitComparisonRange = () => {
  if (customComparisonStart.value && customComparisonEnd.value) {
    emit('comparisonRangeChange', {
      start: new Date(customComparisonStart.value),
      end: new Date(customComparisonEnd.value)
    })
  }
}

const formatDateRange = (start: Date, end: Date): string => {
  if (!start || !end) return 'N/A'
  const startStr = formatDate(start)
  const endStr = formatDate(end)
  return `${startStr} - ${endStr}`
}

// Initialize custom dates when component mounts
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && comparisonMode.value === 'custom') {
      const start = new Date(comparisonStart.value)
      const end = new Date(comparisonEnd.value)
      customComparisonStart.value = start.toISOString().split('T')[0]
      customComparisonEnd.value = end.toISOString().split('T')[0]
    }
  }
)

// Emit comparison range when mode or dates change
watch([comparisonStart, comparisonEnd], () => {
  if (isComparisonEnabled.value) {
    emit('comparisonRangeChange', {
      start: comparisonStart.value,
      end: comparisonEnd.value
    })
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.time-comparison {
  padding: $spacing-md;
  background-color: $color-bg-secondary;
  border-radius: $border-radius-md;
  border: 1px solid $color-border;
}

.comparison-header {
  margin-bottom: $spacing-md;
}

.comparison-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;

  .toggle-input {
    margin-right: $spacing-sm;
    cursor: pointer;
    width: 18px;
    height: 18px;
    accent-color: $color-primary;

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: 2px;
    }
  }

  .toggle-label {
    color: $color-text-primary;
    font-weight: 500;
    transition: color $transition-normal ease-out;

    &:hover {
      color: $color-primary;
    }
  }
}

.comparison-config {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;
}

.comparison-mode {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  label {
    color: $color-text-secondary;
    font-size: 14px;
    font-weight: 500;
    min-width: 120px;
  }

  .mode-select {
    flex: 1;
    padding: $spacing-sm $spacing-md;
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    font-size: 14px;
    cursor: pointer;
    transition: border-color $transition-normal ease-out;

    &:hover {
      border-color: $color-primary;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: -2px;
    }

    option {
      background-color: $color-bg-secondary;
      color: $color-text-primary;
    }
  }
}

.custom-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
  padding: $spacing-md;
  background-color: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  @include media-max-md {
    grid-template-columns: 1fr;
  }
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    color: $color-text-secondary;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .date-input {
    padding: $spacing-sm $spacing-md;
    background-color: $color-bg-secondary;
    color: $color-text-primary;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    font-size: 14px;
    cursor: pointer;
    transition: border-color $transition-normal ease-out;

    &:hover {
      border-color: $color-primary;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: -2px;
    }

    &::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
      cursor: pointer;
    }
  }
}

.comparison-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
  padding: $spacing-md;
  background-color: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  @include media-max-md {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  .info-label {
    color: $color-text-secondary;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    color: $color-text-primary;
    font-size: 14px;
    font-weight: 500;
    font-family: $font-family-mono;
  }
}
</style>
