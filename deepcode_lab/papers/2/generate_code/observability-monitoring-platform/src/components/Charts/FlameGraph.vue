<template>
  <div class="flame-graph-container">
    <div v-if="loading" class="loading-state">
      <LoadingSkeleton :count="5" />
    </div>
    <div v-else-if="error" class="error-state">
      <ErrorState 
        title="Failed to load trace visualization"
        :error-details="error.message"
        @retry="$emit('retry')"
      />
    </div>
    <div v-else-if="!trace || trace.spans.length === 0" class="empty-state">
      <EmptyState 
        title="No trace data available"
        description="Select a trace to view its execution timeline"
      />
    </div>
    <div v-else class="flame-graph-content">
      <div class="flame-graph-header">
        <h3>{{ trace.rootService }} - {{ formatDuration(trace.totalDurationMs) }}</h3>
        <div class="flame-graph-controls">
          <button @click="zoomIn" class="btn btn-sm" title="Zoom in">+</button>
          <button @click="zoomOut" class="btn btn-sm" title="Zoom out">−</button>
          <button @click="resetZoom" class="btn btn-sm" title="Reset zoom">Reset</button>
        </div>
      </div>
      
      <div class="flame-graph-canvas" ref="canvasContainer">
        <svg :width="svgWidth" :height="svgHeight" class="flame-graph-svg">
          <!-- Render flame graph rectangles -->
          <g v-for="(rect, index) in flameRects" :key="index">
            <rect
              :x="rect.x"
              :y="rect.y"
              :width="rect.width"
              :height="rect.height"
              :fill="rect.color"
              :class="{ 'flame-rect-slow': rect.isSlow, 'flame-rect-error': rect.isError }"
              @click="selectSpan(rect.span)"
              @mouseenter="hoveredSpan = rect.span"
              @mouseleave="hoveredSpan = null"
            />
            <text
              :x="rect.x + 4"
              :y="rect.y + rect.height / 2 + 4"
              class="flame-text"
              :opacity="rect.width > 50 ? 1 : 0"
            >
              {{ rect.label }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Tooltip for hovered span -->
      <div v-if="hoveredSpan" class="flame-tooltip">
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span class="tooltip-label">Service:</span>
            <span class="tooltip-value">{{ hoveredSpan.service }}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Operation:</span>
            <span class="tooltip-value">{{ hoveredSpan.operation }}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Duration:</span>
            <span class="tooltip-value">{{ formatDuration(hoveredSpan.durationMs) }}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Status:</span>
            <span class="tooltip-value" :class="`status-${hoveredSpan.status.toLowerCase()}`">
              {{ hoveredSpan.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Selected span detail -->
      <div v-if="selectedSpan" class="span-detail-panel">
        <div class="detail-header">
          <h4>Span Details</h4>
          <button @click="selectedSpan = null" class="btn-close">×</button>
        </div>
        <div class="detail-content">
          <div class="detail-row">
            <span class="detail-label">Span ID:</span>
            <span class="detail-value">{{ formatSpanId(selectedSpan.spanId) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">{{ selectedSpan.service }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Operation:</span>
            <span class="detail-value">{{ selectedSpan.operation }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">{{ formatDuration(selectedSpan.durationMs) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" :class="`status-${selectedSpan.status.toLowerCase()}`">
              {{ selectedSpan.status }}
            </span>
          </div>
          <div v-if="selectedSpan.tags && Object.keys(selectedSpan.tags).length > 0" class="detail-section">
            <h5>Tags</h5>
            <div v-for="(value, key) in selectedSpan.tags" :key="key" class="detail-row">
              <span class="detail-label">{{ key }}:</span>
              <span class="detail-value">{{ value }}</span>
            </div>
          </div>
          <div v-if="selectedSpan.logs && selectedSpan.logs.length > 0" class="detail-section">
            <h5>Logs ({{ selectedSpan.logs.length }})</h5>
            <div v-for="(log, index) in selectedSpan.logs.slice(0, 5)" :key="index" class="log-entry">
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              <div class="log-message">{{ log.message }}</div>
            </div>
            <div v-if="selectedSpan.logs.length > 5" class="log-more">
              +{{ selectedSpan.logs.length - 5 }} more logs
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Trace, Span } from '@/types'
import { formatDuration, formatTime, formatSpanId } from '@/utils/formatters'
import { getStatusColor } from '@/utils/color-palette'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import ErrorState from '@/components/Common/ErrorState.vue'
import EmptyState from '@/components/Common/EmptyState.vue'

interface Props {
  trace?: Trace
  loading?: boolean
  error?: Error | null
  colorBy?: 'service' | 'status'
}

interface FlameRect {
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
  span: Span
  isSlow: boolean
  isError: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  colorBy: 'service'
})

const emit = defineEmits<{
  retry: []
  spanSelected: [span: Span]
}>()

const canvasContainer = ref<HTMLElement>()
const selectedSpan = ref<Span | null>(null)
const hoveredSpan = ref<Span | null>(null)
const zoomLevel = ref(1)

const SPAN_HEIGHT = 20
const SPAN_GAP = 2
const MARGIN_LEFT = 200
const MARGIN_TOP = 20

const svgWidth = computed(() => {
  if (!props.trace) return 800
  return Math.max(800, props.trace.totalDurationMs * zoomLevel.value + MARGIN_LEFT + 20)
})

const svgHeight = computed(() => {
  if (!props.trace) return 400
  const maxDepth = calculateMaxDepth(props.trace.spans)
  return maxDepth * (SPAN_HEIGHT + SPAN_GAP) + MARGIN_TOP + 40
})

const flameRects = computed<FlameRect[]>(() => {
  if (!props.trace) return []

  const rects: FlameRect[] = []
  const spanDepths = new Map<string, number>()

  // Calculate depth for each span (distance from root)
  const calculateDepth = (spanId: string, depth = 0): number => {
    if (spanDepths.has(spanId)) return spanDepths.get(spanId)!
    spanDepths.set(spanId, depth)
    
    const children = props.trace!.spans.filter(s => s.parentSpanId === spanId)
    children.forEach(child => calculateDepth(child.spanId, depth + 1))
    
    return depth
  }

  const rootSpan = props.trace.spans.find(s => s.spanId === props.trace!.rootSpanId)
  if (rootSpan) {
    calculateDepth(rootSpan.spanId, 0)
  }

  // Generate rectangles for each span
  props.trace.spans.forEach(span => {
    const depth = spanDepths.get(span.spanId) || 0
    const startMs = span.startTime.getTime() - props.trace!.startTime.getTime()
    const durationMs = span.durationMs

    const x = MARGIN_LEFT + (startMs * zoomLevel.value)
    const y = MARGIN_TOP + depth * (SPAN_HEIGHT + SPAN_GAP)
    const width = Math.max(1, durationMs * zoomLevel.value)
    const height = SPAN_HEIGHT

    // Determine color based on status or service
    let color = '#3274d9'
    if (props.colorBy === 'status') {
      color = getStatusColor(span.status === 'SUCCESS' ? 'healthy' : 'unhealthy')
    } else {
      // Color by service (cycle through palette)
      const serviceIndex = props.trace!.spans
        .map(s => s.service)
        .filter((v, i, a) => a.indexOf(v) === i)
        .indexOf(span.service)
      const colors = ['#3274d9', '#73bf69', '#ff9830', '#f2495c', '#9830ff', '#30ffff']
      color = colors[serviceIndex % colors.length]
    }

    const isSlow = span.durationMs > calculateMeanDuration(props.trace.spans) * 1.5
    const isError = span.status === 'ERROR'

    rects.push({
      x,
      y,
      width,
      height,
      color,
      label: `${span.service}: ${span.operation} (${formatDuration(durationMs)})`,
      span,
      isSlow,
      isError
    })
  })

  return rects
})

function calculateMaxDepth(spans: Span[]): number {
  const depths = new Map<string, number>()
  
  const getDepth = (spanId: string): number => {
    if (depths.has(spanId)) return depths.get(spanId)!
    
    const span = spans.find(s => s.spanId === spanId)
    if (!span || !span.parentSpanId) {
      depths.set(spanId, 0)
      return 0
    }
    
    const parentDepth = getDepth(span.parentSpanId)
    const depth = parentDepth + 1
    depths.set(spanId, depth)
    return depth
  }

  let maxDepth = 0
  spans.forEach(span => {
    const depth = getDepth(span.spanId)
    maxDepth = Math.max(maxDepth, depth)
  })

  return maxDepth + 1
}

function calculateMeanDuration(spans: Span[]): number {
  if (spans.length === 0) return 0
  const total = spans.reduce((sum, span) => sum + span.durationMs, 0)
  return total / spans.length
}

function selectSpan(span: Span) {
  selectedSpan.value = span
  emit('spanSelected', span)
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value * 1.5, 10)
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value / 1.5, 0.1)
}

function resetZoom() {
  zoomLevel.value = 1
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.flame-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $color-bg-secondary;
  border-radius: $border-radius-md;
  overflow: hidden;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: $spacing-lg;
}

.flame-graph-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.flame-graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $color-border;
  background-color: $color-bg-tertiary;

  h3 {
    margin: 0;
    font-size: $font-size-lg;
    color: $color-text-primary;
  }
}

.flame-graph-controls {
  display: flex;
  gap: $spacing-sm;

  .btn {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }
}

.flame-graph-canvas {
  flex: 1;
  overflow: auto;
  background-color: $color-bg-primary;
  border: 1px solid $color-border;

  .flame-graph-svg {
    display: block;
  }
}

.flame-rect-slow {
  stroke: $color-warning;
  stroke-width: 2;
}

.flame-rect-error {
  stroke: $color-error;
  stroke-width: 2;
}

.flame-text {
  font-size: 11px;
  fill: $color-text-primary;
  pointer-events: none;
  text-anchor: start;
}

.flame-tooltip {
  position: absolute;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: $border-radius-md;
  padding: $spacing-sm;
  font-size: $font-size-sm;
  z-index: 10;
  pointer-events: none;
  max-width: 300px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tooltip-row {
  display: flex;
  gap: $spacing-sm;

  .tooltip-label {
    color: $color-text-secondary;
    min-width: 80px;
  }

  .tooltip-value {
    color: $color-text-primary;
    font-weight: 500;
  }
}

.status-success {
  color: $color-success;
}

.status-error {
  color: $color-error;
}

.status-timeout {
  color: $color-warning;
}

.span-detail-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 350px;
  height: 100%;
  background-color: $color-bg-tertiary;
  border-left: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  z-index: 5;
  box-shadow: $shadow-lg;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $color-border;

  h4 {
    margin: 0;
    color: $color-text-primary;
  }

  .btn-close {
    background: none;
    border: none;
    color: $color-text-secondary;
    font-size: $font-size-xl;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: $color-text-primary;
    }
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
}

.detail-row {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
  font-size: $font-size-sm;

  .detail-label {
    color: $color-text-secondary;
    min-width: 100px;
    font-weight: 500;
  }

  .detail-value {
    color: $color-text-primary;
    flex: 1;
    word-break: break-all;
  }
}

.detail-section {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;

  h5 {
    margin: 0 0 $spacing-sm 0;
    color: $color-text-primary;
    font-size: $font-size-sm;
    font-weight: 600;
  }
}

.log-entry {
  margin-bottom: $spacing-sm;
  padding: $spacing-xs;
  background-color: $color-bg-secondary;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;

  .log-time {
    color: $color-text-secondary;
    margin-bottom: 2px;
  }

  .log-message {
    color: $color-text-primary;
    word-break: break-word;
  }
}

.log-more {
  color: $color-text-secondary;
  font-size: $font-size-xs;
  font-style: italic;
  padding: $spacing-xs;
}
</style>
