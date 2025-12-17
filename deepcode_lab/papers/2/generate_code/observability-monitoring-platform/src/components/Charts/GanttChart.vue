<template>
  <div class="gantt-chart-container">
    <div v-if="loading" class="gantt-loading">
      <LoadingSkeleton :count="5" :height="40" />
    </div>

    <div v-else-if="error" class="gantt-error">
      <ErrorState
        title="Failed to load Gantt chart"
        :error-code="error.message"
        @retry="$emit('retry')"
      />
    </div>

    <div v-else-if="!trace || trace.spans.length === 0" class="gantt-empty">
      <EmptyState
        icon-type="empty-folder"
        title="No spans available"
        description="The selected trace has no spans to visualize"
      />
    </div>

    <div v-else class="gantt-content">
      <!-- Timeline header with time labels -->
      <div class="gantt-header">
        <div class="gantt-labels-column">
          <div class="gantt-label-header">Operation</div>
        </div>
        <div class="gantt-timeline-header">
          <div
            v-for="(label, index) in timeLabels"
            :key="index"
            class="gantt-time-label"
            :style="{ left: label.position + '%' }"
          >
            {{ label.text }}
          </div>
        </div>
      </div>

      <!-- Scrollable gantt chart area -->
      <div class="gantt-body">
        <!-- Span rows -->
        <div
          v-for="(span, index) in sortedSpans"
          :key="span.spanId"
          class="gantt-row"
          :class="{ 'gantt-row-slow': isSlowSpan(span) }"
        >
          <!-- Span label (service + operation) -->
          <div class="gantt-labels-column">
            <div class="gantt-label" :title="`${span.service} - ${span.operation}`">
              <span class="gantt-service-badge" :style="{ backgroundColor: getServiceColor(span.service) }">
                {{ span.service.substring(0, 2).toUpperCase() }}
              </span>
              <span class="gantt-operation-name">{{ span.operation }}</span>
            </div>
          </div>

          <!-- Timeline bars for concurrent spans -->
          <div class="gantt-timeline">
            <!-- Background grid lines -->
            <div
              v-for="(_, gridIndex) in timeLabels"
              :key="`grid-${gridIndex}`"
              class="gantt-grid-line"
              :style="{ left: (gridIndex * 100) / (timeLabels.length - 1) + '%' }"
            />

            <!-- Span bar -->
            <div
              class="gantt-bar"
              :class="[
                `gantt-bar-${span.status.toLowerCase()}`,
                { 'gantt-bar-slow': isSlowSpan(span) }
              ]"
              :style="getBarStyle(span)"
              :title="`${span.operation} (${formatDuration(span.durationMs)})`"
              @click="selectSpan(span)"
            >
              <div class="gantt-bar-label">
                {{ formatDuration(span.durationMs) }}
              </div>
            </div>

            <!-- Hover tooltip -->
            <div
              v-if="hoveredSpan?.spanId === span.spanId"
              class="gantt-tooltip"
              :style="getTooltipStyle(span)"
            >
              <div class="gantt-tooltip-content">
                <div class="gantt-tooltip-title">{{ span.operation }}</div>
                <div class="gantt-tooltip-service">{{ span.service }}</div>
                <div class="gantt-tooltip-duration">
                  Duration: {{ formatDuration(span.durationMs) }}
                </div>
                <div class="gantt-tooltip-status">
                  Status: <span :class="`gantt-status-${span.status.toLowerCase()}`">{{ span.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="gantt-legend">
        <div class="gantt-legend-item">
          <div class="gantt-legend-color gantt-bar-success" />
          <span>Success</span>
        </div>
        <div class="gantt-legend-item">
          <div class="gantt-legend-color gantt-bar-error" />
          <span>Error</span>
        </div>
        <div class="gantt-legend-item">
          <div class="gantt-legend-color gantt-bar-timeout" />
          <span>Timeout</span>
        </div>
        <div class="gantt-legend-item">
          <div class="gantt-legend-color gantt-bar-slow" />
          <span>Slow</span>
        </div>
      </div>

      <!-- Zoom controls -->
      <div class="gantt-controls">
        <button
          class="gantt-control-btn"
          title="Zoom in"
          @click="zoomIn"
          :disabled="zoomLevel >= 5"
        >
          +
        </button>
        <span class="gantt-zoom-level">{{ zoomLevel.toFixed(1) }}x</span>
        <button
          class="gantt-control-btn"
          title="Zoom out"
          @click="zoomOut"
          :disabled="zoomLevel <= 0.5"
        >
          −
        </button>
        <button
          class="gantt-control-btn"
          title="Reset zoom"
          @click="resetZoom"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trace, Span } from '@/types'
import { formatDuration } from '@/utils/formatters'
import { getStatusColor } from '@/utils/color-palette'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import ErrorState from '@/components/Common/ErrorState.vue'
import EmptyState from '@/components/Common/EmptyState.vue'

interface Props {
  trace?: Trace
  loading?: boolean
  error?: Error | null
}

interface Emits {
  (e: 'retry'): void
  (e: 'spanSelected', span: Span): void
}

defineProps<Props>()
defineEmits<Emits>()

const zoomLevel = ref(1)
const hoveredSpan = ref<Span | null>(null)

// Calculate time range from trace
const timeRange = computed(() => {
  if (!props.trace || props.trace.spans.length === 0) {
    return { min: 0, max: 1000 }
  }

  const spans = props.trace.spans
  const minTime = Math.min(...spans.map(s => s.startTime.getTime()))
  const maxTime = Math.max(...spans.map(s => s.endTime.getTime()))

  return {
    min: minTime,
    max: maxTime,
    duration: maxTime - minTime
  }
})

// Generate time labels for header
const timeLabels = computed(() => {
  const range = timeRange.value
  const labels = []
  const steps = 5

  for (let i = 0; i <= steps; i++) {
    const position = (i / steps) * 100
    const time = range.min + (range.duration * i) / steps
    const offset = time - range.min

    labels.push({
      position,
      text: formatDuration(offset)
    })
  }

  return labels
})

// Sort spans by start time for display
const sortedSpans = computed(() => {
  if (!props.trace) return []

  return [...props.trace.spans].sort((a, b) => {
    return a.startTime.getTime() - b.startTime.getTime()
  })
})

// Calculate mean duration for slow span detection
const meanDuration = computed(() => {
  if (!props.trace || props.trace.spans.length === 0) return 0

  const total = props.trace.spans.reduce((sum, span) => sum + span.durationMs, 0)
  return total / props.trace.spans.length
})

// Check if span is slow (> 1.5x mean)
const isSlowSpan = (span: Span): boolean => {
  return span.durationMs > meanDuration.value * 1.5
}

// Get bar positioning and width
const getBarStyle = (span: Span) => {
  const range = timeRange.value
  const startOffset = span.startTime.getTime() - range.min
  const left = (startOffset / range.duration) * 100
  const width = (span.durationMs / range.duration) * 100

  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(2, width * zoomLevel.value)}%`,
    minWidth: '2px'
  }
}

// Get tooltip positioning
const getTooltipStyle = (span: Span) => {
  const range = timeRange.value
  const startOffset = span.startTime.getTime() - range.min
  const left = (startOffset / range.duration) * 100

  return {
    left: `${Math.max(0, left)}%`
  }
}

// Get service color
const getServiceColor = (service: string): string => {
  const colors = [
    '#3274d9', // blue
    '#73bf69', // green
    '#ff9830', // orange
    '#f2495c', // red
    '#9830ff', // purple
    '#30ffff'  // cyan
  ]

  let hash = 0
  for (let i = 0; i < service.length; i++) {
    hash = ((hash << 5) - hash) + service.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length]
}

// Zoom controls
const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.5)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// Select span
const selectSpan = (span: Span) => {
  emit('spanSelected', span)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.gantt-chart-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: $color-bg-secondary;
  border-radius: $border-radius-md;
  overflow: hidden;
}

.gantt-loading,
.gantt-error,
.gantt-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  padding: $spacing-lg;
}

.gantt-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  border-bottom: 1px solid $color-border;
  background-color: $color-bg-tertiary;
  position: sticky;
  top: 0;
  z-index: 10;
}

.gantt-labels-column {
  width: 200px;
  flex-shrink: 0;
  padding: $spacing-sm;
  border-right: 1px solid $color-border;
}

.gantt-label-header {
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gantt-timeline-header {
  flex: 1;
  position: relative;
  height: 40px;
  padding: $spacing-sm;
}

.gantt-time-label {
  position: absolute;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  transform: translateX(-50%);
  white-space: nowrap;
}

.gantt-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid $color-border;
  transition: background-color $transition-normal;

  &:hover {
    background-color: rgba($color-primary, 0.05);
  }

  &.gantt-row-slow {
    background-color: rgba($color-warning, 0.05);
  }
}

.gantt-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  font-size: $font-size-sm;
  color: $color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-service-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: $border-radius-sm;
  color: white;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  flex-shrink: 0;
}

.gantt-operation-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-timeline {
  flex: 1;
  position: relative;
  padding: $spacing-xs 0;
  display: flex;
  align-items: center;
}

.gantt-grid-line {
  position: absolute;
  width: 1px;
  height: 100%;
  background-color: rgba($color-border, 0.3);
  pointer-events: none;
}

.gantt-bar {
  position: absolute;
  height: 24px;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-normal;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xs;
  color: white;
  font-weight: $font-weight-bold;
  overflow: hidden;
  white-space: nowrap;
  padding: 0 $spacing-xs;

  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  &.gantt-bar-success {
    background-color: $color-success;
  }

  &.gantt-bar-error {
    background-color: $color-error;
  }

  &.gantt-bar-timeout {
    background-color: $color-warning;
  }

  &.gantt-bar-slow {
    border: 2px solid $color-warning;
    box-shadow: 0 0 8px rgba($color-warning, 0.5);
  }
}

.gantt-bar-label {
  font-size: $font-size-xs;
  opacity: 0.9;
}

.gantt-tooltip {
  position: absolute;
  bottom: 100%;
  margin-bottom: $spacing-sm;
  background-color: $color-bg-primary;
  border: 1px solid $color-border;
  border-radius: $border-radius-md;
  padding: $spacing-sm;
  box-shadow: $shadow-lg;
  z-index: 20;
  white-space: nowrap;
  pointer-events: none;
}

.gantt-tooltip-content {
  font-size: $font-size-xs;
  color: $color-text-primary;
}

.gantt-tooltip-title {
  font-weight: $font-weight-bold;
  margin-bottom: $spacing-xs;
}

.gantt-tooltip-service {
  color: $color-text-secondary;
  margin-bottom: $spacing-xs;
}

.gantt-tooltip-duration {
  margin-bottom: $spacing-xs;
}

.gantt-status-success {
  color: $color-success;
}

.gantt-status-error {
  color: $color-error;
}

.gantt-status-timeout {
  color: $color-warning;
}

.gantt-legend {
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-md;
  border-top: 1px solid $color-border;
  background-color: $color-bg-tertiary;
  flex-wrap: wrap;
}

.gantt-legend-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.gantt-legend-color {
  width: 16px;
  height: 16px;
  border-radius: $border-radius-sm;
}

.gantt-controls {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  border-top: 1px solid $color-border;
  background-color: $color-bg-tertiary;
  justify-content: flex-end;
}

.gantt-control-btn {
  padding: $spacing-xs $spacing-sm;
  background-color: $color-primary;
  color: white;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  font-weight: $font-weight-bold;
  transition: all $transition-normal;

  &:hover:not(:disabled) {
    background-color: lighten($color-primary, 10%);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.gantt-zoom-level {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  min-width: 40px;
  text-align: center;
}
</style>
