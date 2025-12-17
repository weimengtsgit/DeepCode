<template>
  <div class="chart-legend" :class="{ 'chart-legend--vertical': vertical }">
    <div class="chart-legend__items">
      <div
        v-for="(item, index) in items"
        :key="item.id || index"
        class="chart-legend__item"
        :class="{ 'chart-legend__item--disabled': !item.visible }"
        @click="toggleItem(index)"
      >
        <span class="chart-legend__color" :style="{ backgroundColor: item.color }"></span>
        <span class="chart-legend__label">{{ item.label }}</span>
        <span v-if="showValue && item.value !== undefined" class="chart-legend__value">
          {{ formatValue(item.value) }}
        </span>
      </div>
    </div>

    <div v-if="showControls" class="chart-legend__controls">
      <button
        v-if="items.length > 1"
        class="chart-legend__button"
        title="Show all series"
        @click="showAll"
      >
        Show All
      </button>
      <button
        v-if="items.length > 1"
        class="chart-legend__button"
        title="Hide all series"
        @click="hideAll"
      >
        Hide All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, withDefaults, defineProps, defineEmits } from 'vue'

interface LegendItem {
  id?: string
  label: string
  color: string
  value?: number
  visible?: boolean
}

interface Props {
  items: LegendItem[]
  vertical?: boolean
  showValue?: boolean
  showControls?: boolean
  valueFormatter?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  vertical: false,
  showValue: false,
  showControls: true,
  valueFormatter: (value: number) => value.toFixed(2)
})

const emit = defineEmits<{
  toggle: [index: number, visible: boolean]
  showAll: []
  hideAll: []
}>()

// Local state for visibility tracking
const visibilityState = ref<boolean[]>(
  props.items.map((item) => item.visible !== false)
)

const items = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    visible: visibilityState.value[index] ?? true
  }))
)

const toggleItem = (index: number) => {
  visibilityState.value[index] = !visibilityState.value[index]
  emit('toggle', index, visibilityState.value[index])
}

const showAll = () => {
  visibilityState.value = visibilityState.value.map(() => true)
  emit('showAll')
}

const hideAll = () => {
  visibilityState.value = visibilityState.value.map(() => false)
  emit('hideAll')
}

const formatValue = (value: number): string => {
  return props.valueFormatter(value)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;

  &--vertical {
    flex-direction: column;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-border;
      border-radius: 3px;

      &:hover {
        background: $color-border-light;
      }
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    border-radius: 3px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: $color-bg-secondary;
    }

    &--disabled {
      opacity: 0.5;
    }
  }

  &__color {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    font-size: 12px;
    color: $color-text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__value {
    font-size: 11px;
    color: $color-text-secondary;
    font-family: 'Monaco', 'Courier New', monospace;
    white-space: nowrap;
  }

  &__controls {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid $color-border;
  }

  &__button {
    flex: 1;
    padding: 6px 12px;
    font-size: 12px;
    color: $color-text-primary;
    background-color: $color-bg-secondary;
    border: 1px solid $color-border;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: $color-primary;
      border-color: $color-primary;
      color: white;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
