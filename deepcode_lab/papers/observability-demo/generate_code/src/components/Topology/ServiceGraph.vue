<template>
  <div class="service-graph-container" ref="containerRef">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>Generating Topology...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import G6, { Graph, TreeGraph } from '@antv/g6';
import { useGlobalStore } from '@/stores/globalStore';

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const globalStore = useGlobalStore();
let graph: Graph | null = null;

// Hardcoded topology that matches the trace generator's logic
// frontend-proxy -> api-gateway -> [order, payment, inventory] -> [db, cache]
const data = {
  nodes: [
    { id: 'frontend-proxy', label: 'Frontend\nProxy', type: 'circle', size: 60, style: { fill: '#3274d9', stroke: '#1f1f24' } },
    { id: 'auth-service', label: 'Auth\nService', type: 'circle', size: 50, style: { fill: '#5794f2', stroke: '#1f1f24' } },
    { id: 'api-gateway', label: 'API\nGateway', type: 'circle', size: 55, style: { fill: '#73bf69', stroke: '#1f1f24' } },
    { id: 'order-service', label: 'Order\nService', type: 'circle', size: 50, style: { fill: '#f2994a', stroke: '#1f1f24' } },
    { id: 'payment-service', label: 'Payment\nService', type: 'circle', size: 50, style: { fill: '#f2994a', stroke: '#1f1f24' } },
    { id: 'inventory-service', label: 'Inventory\nService', type: 'circle', size: 50, style: { fill: '#f2994a', stroke: '#1f1f24' } },
    { id: 'db-primary', label: 'DB\nPrimary', type: 'rect', size: [60, 40], style: { fill: '#f2495c', stroke: '#1f1f24', radius: 4 } },
    { id: 'db-replica', label: 'DB\nReplica', type: 'rect', size: [60, 40], style: { fill: '#ff7875', stroke: '#1f1f24', radius: 4 } },
    { id: 'cache-redis', label: 'Cache\nRedis', type: 'ellipse', size: [60, 40], style: { fill: '#9a65db', stroke: '#1f1f24' } },
  ],
  edges: [
    { source: 'frontend-proxy', target: 'auth-service' },
    { source: 'frontend-proxy', target: 'api-gateway' },
    { source: 'api-gateway', target: 'order-service' },
    { source: 'api-gateway', target: 'payment-service' },
    { source: 'api-gateway', target: 'inventory-service' },
    { source: 'order-service', target: 'db-primary' },
    { source: 'payment-service', target: 'db-primary' },
    { source: 'inventory-service', target: 'db-replica' },
    { source: 'inventory-service', target: 'cache-redis' },
  ],
};

const initGraph = () => {
  if (!containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  // Use Dagre layout for hierarchical directed graph
  graph = new G6.Graph({
    container: containerRef.value,
    width,
    height,
    fitView: true,
    fitViewPadding: [50, 50, 50, 50],
    modes: {
      default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
    },
    layout: {
      type: 'dagre',
      rankdir: 'LR', // Left to Right
      align: 'DL',
      nodesep: 40,
      ranksep: 70,
    },
    defaultNode: {
      type: 'circle',
      style: {
        lineWidth: 2,
        stroke: '#1f1f24',
      },
      labelCfg: {
        position: 'bottom',
        style: {
          fill: '#c7d0d9', // Light text for dark theme
          fontSize: 12,
        },
      },
    },
    defaultEdge: {
      type: 'cubic-horizontal',
      style: {
        stroke: '#464c54', // Dark gray edge
        endArrow: {
          path: G6.Arrow.triangle(),
          fill: '#464c54',
        },
        lineWidth: 2,
      },
    },
  });

  graph.data(data);
  graph.render();
  loading.value = false;
};

// Handle Window Resize
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  // Small delay to ensure container has size
  setTimeout(() => {
    initGraph();
  }, 100);

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!graph || !containerRef.value) return;
      graph.changeSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
      graph.fitView();
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (graph) {
    graph.destroy();
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// Watch theme changes if needed (though we currently hardcode dark theme colors)
watch(() => globalStore.isDarkTheme, (isDark) => {
  // If we had a light theme, we would update graph styles here
  // For now, the app is primarily dark mode as per requirements
});
</script>

<style scoped lang="scss">
.service-graph-container {
  width: 100%;
  height: 100%;
  background-color: var(--bg-panel);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(11, 12, 14, 0.7);
  z-index: 10;
  color: var(--text-secondary);
  
  .spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 10px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
