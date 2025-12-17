<template>
  <div class="topology-viewer">
    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" :count="3" :height="200" />

    <!-- Error State -->
    <ErrorState
      v-else-if="hasError"
      title="Failed to Load Service Topology"
      :error-code="error?.message || 'TOPOLOGY_ERROR'"
      :show-retry-button="true"
      @retry="$emit('retry')"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      icon-type="no-data"
      title="No Service Data Available"
      description="No traces or services found for the selected time range and filters"
    />

    <!-- Topology Graph -->
    <div v-else class="topology-container">
      <!-- Toolbar -->
      <div class="topology-toolbar">
        <div class="toolbar-left">
          <button class="btn btn-secondary" @click="zoomIn" title="Zoom In">
            <span class="icon">+</span>
          </button>
          <button class="btn btn-secondary" @click="zoomOut" title="Zoom Out">
            <span class="icon">−</span>
          </button>
          <button class="btn btn-secondary" @click="resetZoom" title="Reset Zoom">
            <span class="icon">⟲</span>
          </button>
          <button class="btn btn-secondary" @click="fitToScreen" title="Fit to Screen">
            <span class="icon">⊡</span>
          </button>
        </div>

        <div class="toolbar-center">
          <span class="node-count">{{ nodeCount }} services • {{ edgeCount }} connections</span>
        </div>

        <div class="toolbar-right">
          <label class="checkbox-label">
            <input v-model="showLabels" type="checkbox" />
            <span>Show Labels</span>
          </label>
          <label class="checkbox-label">
            <input v-model="showMetrics" type="checkbox" />
            <span>Show Metrics</span>
          </label>
        </div>
      </div>

      <!-- SVG Canvas for G6 Graph -->
      <div ref="containerRef" class="graph-container"></div>

      <!-- Legend -->
      <div class="topology-legend">
        <div class="legend-item">
          <div class="legend-color" style="background-color: #73bf69"></div>
          <span>Healthy</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #ff9830"></div>
          <span>Warning</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #f2495c"></div>
          <span>Critical</span>
        </div>
      </div>

      <!-- Node Detail Panel -->
      <div v-if="selectedNode" class="node-detail-panel">
        <button class="close-btn" @click="selectedNode = null">×</button>
        <h3>{{ selectedNode.label }}</h3>
        <div class="detail-content">
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value" :class="selectedNode.status">{{ selectedNode.status }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Instances:</span>
            <span class="value">{{ selectedNode.instances }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Avg Latency:</span>
            <span class="value">{{ selectedNode.avgLatency }}ms</span>
          </div>
          <div class="detail-row">
            <span class="label">Error Rate:</span>
            <span class="value">{{ selectedNode.errorRate }}%</span>
          </div>
          <div class="detail-row">
            <span class="label">Throughput:</span>
            <span class="value">{{ selectedNode.throughput }} req/s</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import G6 from '@antv/g6'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import ErrorState from '@/components/Common/ErrorState.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import { useTracesStore } from '@/stores/tracesStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { SERVICES } from '@/mock/services'
import type { Trace, Span } from '@/types'

interface Props {
  traces?: Trace[]
  loading?: boolean
  error?: Error | null
  interactive?: boolean
}

interface Emits {
  (e: 'retry'): void
  (e: 'nodeSelected', node: any): void
}

const props = withDefaults(defineProps<Props>(), {
  traces: () => [],
  loading: false,
  error: null,
  interactive: true
})

const emit = defineEmits<Emits>()

const containerRef = ref<HTMLDivElement | null>(null)
let graphInstance: any = null
let zoomLevel = 1

const tracesStore = useTracesStore()
const metricsStore = useMetricsStore()

const showLabels = ref(true)
const showMetrics = ref(true)
const selectedNode = ref<any>(null)

// Computed properties
const hasError = computed(() => props.error !== null)
const isEmpty = computed(() => {
  const traces = props.traces || tracesStore.traces
  return traces.length === 0
})

const nodeCount = computed(() => {
  const traces = props.traces || tracesStore.traces
  const services = new Set<string>()
  traces.forEach(trace => {
    services.add(trace.rootService)
    trace.spans.forEach(span => services.add(span.service))
  })
  return services.size
})

const edgeCount = computed(() => {
  const traces = props.traces || tracesStore.traces
  const edges = new Set<string>()
  traces.forEach(trace => {
    trace.spans.forEach(span => {
      if (span.parentSpanId) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId)
        if (parentSpan) {
          const edgeKey = `${parentSpan.service}-${span.service}`
          edges.add(edgeKey)
        }
      }
    })
  })
  return edges.size
})

// Methods
const buildGraphData = () => {
  const traces = props.traces || tracesStore.traces
  const nodes: any[] = []
  const edges: any[] = []
  const serviceMap = new Map<string, any>()

  // Build service nodes
  const services = new Set<string>()
  traces.forEach(trace => {
    services.add(trace.rootService)
    trace.spans.forEach(span => services.add(span.service))
  })

  services.forEach(serviceName => {
    const serviceInfo = SERVICES.find(s => s.name === serviceName)
    const status = getServiceStatus(serviceName)
    const metrics = getServiceMetrics(serviceName)

    const node = {
      id: serviceName,
      label: serviceInfo?.displayName || serviceName,
      status: status,
      instances: serviceInfo?.instances.length || 1,
      avgLatency: metrics.avgLatency,
      errorRate: metrics.errorRate,
      throughput: metrics.throughput,
      size: [120, 60],
      style: {
        fill: getStatusColor(status),
        stroke: '#ffffff',
        lineWidth: 2
      }
    }

    nodes.push(node)
    serviceMap.set(serviceName, node)
  })

  // Build edges (service dependencies)
  const edgeSet = new Set<string>()
  traces.forEach(trace => {
    trace.spans.forEach(span => {
      if (span.parentSpanId) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId)
        if (parentSpan && parentSpan.service !== span.service) {
          const edgeKey = `${parentSpan.service}-${span.service}`
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey)

            const callCount = traces.reduce((count, t) => {
              return count + t.spans.filter(s => {
                const parent = t.spans.find(p => p.spanId === s.parentSpanId)
                return parent && parent.service === parentSpan.service && s.service === span.service
              }).length
            }, 0)

            edges.push({
              source: parentSpan.service,
              target: span.service,
              label: `${callCount} calls`,
              style: {
                stroke: '#999999',
                lineWidth: Math.min(callCount / 10, 3)
              }
            })
          }
        }
      }
    })
  })

  return { nodes, edges }
}

const initializeGraph = () => {
  if (!containerRef.value) return

  const { nodes, edges } = buildGraphData()

  if (graphInstance) {
    graphInstance.destroy()
  }

  graphInstance = new G6.Graph({
    container: containerRef.value,
    width: containerRef.value.offsetWidth,
    height: containerRef.value.offsetHeight,
    layout: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 120,
      linkDistance: 200,
      nodeStrength: -50,
      edgeStrength: 0.1,
      collideStrength: 0.8,
      alpha: 0.3,
      alphaDecay: 0.028,
      onTick: () => {
        // Animation frame
      }
    },
    defaultNode: {
      type: 'rect',
      size: [120, 60],
      style: {
        fill: '#3274d9',
        stroke: '#ffffff',
        lineWidth: 2
      },
      labelCfg: {
        style: {
          fill: '#ffffff',
          fontSize: 12,
          fontWeight: 500
        }
      }
    },
    defaultEdge: {
      type: 'quadratic',
      style: {
        stroke: '#999999',
        lineWidth: 1,
        endArrow: {
          path: 'M 0,0 L 8,4 L 8,-4 Z',
          fill: '#999999'
        }
      },
      labelCfg: {
        autoRotate: true,
        style: {
          fill: '#666666',
          fontSize: 10
        }
      }
    },
    modes: {
      default: ['drag-canvas', 'zoom-canvas', 'drag-node']
    }
  })

  graphInstance.data({ nodes, edges })
  graphInstance.render()

  // Event handlers
  graphInstance.on('node:click', (evt: any) => {
    const node = evt.item.getModel()
    selectedNode.value = node
    emit('nodeSelected', node)
  })

  graphInstance.on('canvas:click', () => {
    selectedNode.value = null
  })

  // Fit to screen initially
  fitToScreen()
}

const getServiceStatus = (serviceName: string): string => {
  const traces = props.traces || tracesStore.traces
  const serviceTraces = traces.filter(t => 
    t.rootService === serviceName || t.spans.some(s => s.service === serviceName)
  )

  if (serviceTraces.length === 0) return 'unknown'

  const errorCount = serviceTraces.filter(t => t.status === 'ERROR').length
  const errorRate = errorCount / serviceTraces.length

  if (errorRate > 0.1) return 'critical'
  if (errorRate > 0.05) return 'warning'
  return 'healthy'
}

const getServiceMetrics = (serviceName: string) => {
  const traces = props.traces || tracesStore.traces
  const spans = traces.flatMap(t => t.spans.filter(s => s.service === serviceName))

  if (spans.length === 0) {
    return { avgLatency: 0, errorRate: 0, throughput: 0 }
  }

  const avgLatency = Math.round(spans.reduce((sum, s) => sum + s.durationMs, 0) / spans.length)
  const errorRate = Math.round((spans.filter(s => s.status === 'ERROR').length / spans.length) * 100)
  const throughput = Math.round(spans.length / 60) // Assume 1 minute window

  return { avgLatency, errorRate, throughput }
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    healthy: '#73bf69',
    warning: '#ff9830',
    critical: '#f2495c',
    unknown: '#999999'
  }
  return colors[status] || '#3274d9'
}

const zoomIn = () => {
  if (graphInstance) {
    zoomLevel = Math.min(zoomLevel + 0.2, 3)
    graphInstance.zoom(zoomLevel)
  }
}

const zoomOut = () => {
  if (graphInstance) {
    zoomLevel = Math.max(zoomLevel - 0.2, 0.5)
    graphInstance.zoom(zoomLevel)
  }
}

const resetZoom = () => {
  if (graphInstance) {
    zoomLevel = 1
    graphInstance.zoom(1)
  }
}

const fitToScreen = () => {
  if (graphInstance) {
    graphInstance.fitView()
    zoomLevel = 1
  }
}

// Lifecycle
onMounted(() => {
  if (!isEmpty.value && !hasError.value) {
    initializeGraph()
  }

  // Handle window resize
  const handleResize = () => {
    if (graphInstance && containerRef.value) {
      graphInstance.changeSize(
        containerRef.value.offsetWidth,
        containerRef.value.offsetHeight
      )
    }
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (graphInstance) {
      graphInstance.destroy()
    }
  })
})

// Watch for data changes
watch(
  () => props.traces,
  () => {
    if (!isEmpty.value && !hasError.value) {
      initializeGraph()
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.topology-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $color-bg-primary;
  border-radius: $border-radius-md;
  overflow: hidden;
}

.topology-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: $color-bg-secondary;
}

.topology-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md;
  background-color: $color-bg-primary;
  border-bottom: 1px solid $color-border;
  gap: $spacing-md;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }

  .toolbar-center {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: $color-text-secondary;
  }

  .btn {
    padding: $spacing-xs $spacing-sm;
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    cursor: pointer;
    font-size: 12px;
    color: $color-text-secondary;

    input {
      cursor: pointer;
    }

    &:hover {
      color: $color-text-primary;
    }
  }

  .node-count {
    font-size: 12px;
    color: $color-text-secondary;
  }
}

.graph-container {
  flex: 1;
  position: relative;
  background-color: $color-bg-secondary;
  border-radius: $border-radius-md;
  overflow: hidden;

  :deep(canvas) {
    display: block;
  }
}

.topology-legend {
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-md;
  background-color: $color-bg-primary;
  border-top: 1px solid $color-border;
  font-size: 12px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
  }
}

.node-detail-panel {
  position: absolute;
  right: $spacing-md;
  bottom: $spacing-md;
  width: 280px;
  background-color: $color-bg-primary;
  border: 1px solid $color-border;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;

  .close-btn {
    position: absolute;
    top: $spacing-xs;
    right: $spacing-xs;
    background: none;
    border: none;
    color: $color-text-secondary;
    font-size: 20px;
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

  h3 {
    margin: 0 0 $spacing-md 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-text-primary;
    padding-right: $spacing-lg;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;

    .label {
      color: $color-text-secondary;
      font-weight: 500;
    }

    .value {
      color: $color-text-primary;
      font-weight: 600;

      &.healthy {
        color: #73bf69;
      }

      &.warning {
        color: #ff9830;
      }

      &.critical {
        color: #f2495c;
      }
    }
  }
}

@media (max-width: 1400px) {
  .topology-toolbar {
    flex-wrap: wrap;

    .toolbar-center {
      order: 3;
      width: 100%;
      margin-top: $spacing-sm;
    }
  }

  .node-detail-panel {
    width: 240px;
    right: $spacing-sm;
    bottom: $spacing-sm;
  }
}
</style>
