<template>
  <div class="quick-time-select">
    <div class="preset-buttons">
      <button
        v-for="preset in presets"
        :key="preset.value"
        :class="['preset-btn', { active: selectedPreset === preset.value }]"
        @click="selectPreset(preset.value)"
        :title="preset.tooltip"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '@/stores/timeStore'
import type { TimePreset } from '@/types'

// Pinia store
const timeStore = useTimeStore()

// Preset configuration
interface PresetOption {
  value: TimePreset
  label: string
  tooltip: string
}

const presets: PresetOption[] = [
  {
    value: 'last_5m',
    label: '5m',
    tooltip: 'Last 5 minutes'
  },
  {
    value: 'last_15m',
    label: '15m',
    tooltip: 'Last 15 minutes'
  },
  {
    value: 'last_1h',
    label: '1h',
    tooltip: 'Last 1 hour'
  },
  {
    value: 'last_6h',
    label: '6h',
    tooltip: 'Last 6 hours'
  },
  {
    value: 'last_24h',
    label: '24h',
    tooltip: 'Last 24 hours'
  },
  {
    value: 'last_7d',
    label: '7d',
    tooltip: 'Last 7 days'
  }
]

// Computed properties
const selectedPreset = computed({
  get: () => timeStore.selectedPreset,
  set: (value: TimePreset) => timeStore.applyPreset(value)
})

// Methods
const selectPreset = (preset: TimePreset) => {
  timeStore.applyPreset(preset)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.quick-time-select {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid $color-border;
  background-color: $color-bg-secondary;
  color: $color-text-primary;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: $color-bg-tertiary;
    border-color: $color-border-light;
  }

  &.active {
    background-color: $color-primary;
    border-color: $color-primary;
    color: #ffffff;
    box-shadow: 0 0 0 2px rgba($color-primary, 0.2);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Responsive design
@media (max-width: 1400px) {
  .preset-buttons {
    gap: 6px;
  }

  .preset-btn {
    padding: 5px 10px;
    font-size: 11px;
  }
}

@media (max-width: 1024px) {
  .quick-time-select {
    gap: 6px;
  }

  .preset-buttons {
    gap: 4px;
  }

  .preset-btn {
    padding: 4px 8px;
    font-size: 10px;
  }
}
</style>
