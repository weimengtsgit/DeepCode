<template>
  <div class="chart-container" :class="{ 'chart-container--fullscreen': isFullscreen }">
    <!-- Header with title and toolbar -->
    <div class="chart-container__header">
      <div class="chart-container__title-section">
        <h3 class="chart-container__title">{{ title }}</h3>
        <span v-if="unit" class="chart-container__unit">({{ unit }})</span>
      </div>
      
      <div class="chart-container__toolbar">
        <!-- Chart type selector -->
        <div v-if="showChartTypeSelector" class="chart-container__control">
          <select 
            v-model="selectedChartType"
            class="chart-container__select"
            @change="handleChartTypeChange"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="heatmap">Heatmap</option>
          </select>
        </div>

        <!-- Time range display -->
        <div v-if="showTimeRange" class="chart-container__time-range">
          {{ formattedTimeRange }}
        </div>

        <!-- Toolbar buttons -->
        <div class="chart-container__buttons">
          <!-- Legend toggle -->
          <button 
            v-if="showLegendToggle"
            class="chart-container__button"
            :class="{ 'chart-container__button--active': showLegend }"
            title="Toggle legend"
            @click="showLegend = !showLegend"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>

          <!-- Refresh button -->
          <button 
            v-if="showRefreshButton"
            class="chart-container__button"
            :class="{ 'chart-container__button--loading': isRefreshing }"
            title="Refresh data"
            @click="handleRefresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
            </svg>
          </button>

          <!-- Export button -->
          <button 
            v-if="showExportButton"
            class="chart-container__button"
            title="Export as image"
            @click="handleExport"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>

          <!-- Fullscreen button -->
          <button 
            v-if="showFullscreenButton"
            class="chart-container__button"
            :class="{ 'chart-container__button--active': isFullscreen }"
            title="Toggle fullscreen"
            @click="toggleFullscreen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path v-if="!isFullscreen" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              <path v-else d="M8 3v5m8-5v5M3 8h5m8 0h5m-13 8v5m8-5v5m-13 0h5m8 0h5"></path>
            </svg>
          </button>

          <!-- Settings button -->
          <button 
            v-if="showSettingsButton"
            class="chart-container__button"
            title="Chart settings"
            @click="showSettings = !showSettings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Settings panel (collapsible) -->
    <div v-if="showSettings" class="chart-container__settings">
      <div class="chart-container__setting-item">
        <label class="chart-container__label">
          <input 
            v-model="showGrid"
            type="checkbox"
            class="chart-container__checkbox"
          >
          Show Grid
        </label>
      </div>
      <div class="chart-container__setting-item">
        <label class="chart-container__label">
          <input 
            v-model="showTooltip"
            type="checkbox"
            class="chart-container__checkbox"
          >
          Show Tooltip
        </label>
      </div>
      <div class="chart-container__setting-item">
        <label class="chart-container__label">
          <input 
            v-model="enableAnimation"
            type="checkbox"
            class="chart-container__checkbox"
          >
          Enable Animation
        </label>
      </div>
    </div>

    <!-- Chart content area -->
    <div 
      class="chart-container__content"
      :style="{ height: computedHeight }"
    >
      <slot></slot>
    </div>

    <!-- Legend (if enabled) -->
    <div v-if="showLegend && legendItems.length > 0" class="chart-container__legend">
      <div 
        v-for="(item, index) in legendItems"
        :key="index"
        class="chart-container__legend-item"
        :style="{ borderLeftColor: item.color }"
      >
        <span class="chart-container__legend-label">{{ item.label }}</span>
        <span v-if="item.value" class="chart-container__legend-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, withDefaults } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useTimeStore } from '@/stores/timeStore'

interface ChartContainerProps {
  title?: string
  unit?: string
  height?: string | number
  showLegendToggle?: boolean
  showRefreshButton?: boolean
  showExportButton?: boolean
  showFullscreenButton?: boolean
  showSettingsButton?: boolean
  showChartTypeSelector?: boolean
  showTimeRange?: boolean
  legendItems?: Array<{ label: string; color: string; value?: string }>
  isRefreshing?: boolean
}

const props = withDefaults(defineProps<ChartContainerProps>(), {
  title: 'Chart',
  height: '400px',
  showLegendToggle: true,
  showRefreshButton: true,
  showExportButton: true,
  showFullscreenButton: true,
  showSettingsButton: false,
  showChartTypeSelector: false,
  showTimeRange: true,
  legendItems: () => [],
  isRefreshing: false
})

const emit = defineEmits<{
  refresh: []
  export: []
  chartTypeChange: [type: string]
}>()

// State
const isFullscreen = ref(false)
const showLegend = ref(true)
const showSettings = ref(false)
const showGrid = ref(true)
const showTooltip = ref(true)
const enableAnimation = ref(true)
const selectedChartType = ref('line')

// Stores
const uiStore = useUIStore()
const timeStore = useTimeStore()

// Computed properties
const computedHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})

const formattedTimeRange = computed(() => {
  const start = timeStore.startTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const end = timeStore.endTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `${start} - ${end}`
})

// Methods
const handleRefresh = () => {
  emit('refresh')
}

const handleExport = () => {
  emit('export')
  // Implementation: Export chart as PNG/SVG
  // This would typically call a method on the chart instance
  // to export the current visualization
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    // Enter fullscreen
    const container = document.querySelector('.chart-container--fullscreen')
    if (container && container.requestFullscreen) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
        isFullscreen.value = false
      })
    }
  } else {
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }
}

const handleChartTypeChange = () => {
  emit('chartTypeChange', selectedChartType.value)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.chart-container {
  display: flex;
  flex-direction: column;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &--fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    border-radius: 0;
    border: none;
  }
}

.chart-container__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid $color-border-light;
  background-color: $color-bg-tertiary;
}

.chart-container__title-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.chart-container__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: $color-text-primary;
}

.chart-container__unit {
  font-size: 12px;
  color: $color-text-secondary;
}

.chart-container__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-container__control {
  display: flex;
  align-items: center;
}

.chart-container__select {
  padding: 6px 12px;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: $color-primary;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 2px rgba(50, 116, 217, 0.1);
  }
}

.chart-container__time-range {
  font-size: 12px;
  color: $color-text-secondary;
  white-space: nowrap;
}

.chart-container__buttons {
  display: flex;
  gap: 8px;
}

.chart-container__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: transparent;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-secondary;
    color: $color-text-primary;
    border-color: $color-primary;
  }

  &:active {
    transform: scale(0.95);
  }

  &--active {
    background-color: $color-primary;
    color: white;
    border-color: $color-primary;
  }

  &--loading {
    animation: spin 1s linear infinite;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.chart-container__settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background-color: $color-bg-tertiary;
  border-bottom: 1px solid $color-border-light;
}

.chart-container__setting-item {
  display: flex;
  align-items: center;
}

.chart-container__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $color-text-primary;
  cursor: pointer;
  user-select: none;
}

.chart-container__checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: $color-primary;
}

.chart-container__content {
  flex: 1;
  overflow: auto;
  position: relative;
  min-height: 300px;
}

.chart-container__legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 12px 16px;
  background-color: $color-bg-tertiary;
  border-top: 1px solid $color-border-light;
  max-height: 120px;
  overflow-y: auto;
}

.chart-container__legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: $color-bg-secondary;
  border-left: 3px solid $color-primary;
  border-radius: 4px;
  font-size: 12px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: $color-bg-secondary;
  }
}

.chart-container__legend-label {
  color: $color-text-primary;
  font-weight: 500;
}

.chart-container__legend-value {
  color: $color-text-secondary;
  margin-left: 8px;
}

/* Responsive design */
@media (max-width: 1400px) {
  .chart-container__toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .chart-container__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .chart-container__toolbar {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .chart-container__header {
    padding: 12px;
  }

  .chart-container__title {
    font-size: 14px;
  }

  .chart-container__button {
    width: 28px;
    height: 28px;
  }

  .chart-container__legend {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    padding: 8px 12px;
  }
}
</style>
