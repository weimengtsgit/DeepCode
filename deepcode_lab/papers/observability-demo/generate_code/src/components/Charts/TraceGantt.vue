<template>
  <div class="trace-gantt" v-if="trace">
    <!-- Header -->
    <div class="gantt-header">
      <div class="col-service">Service & Operation</div>
      <div class="col-timeline">
        <div class="timeline-ruler">
          <span class="tick start">0ms</span>
          <span class="tick mid">{{ formatDuration((trace.totalDuration || trace.duration || 0) / 2) }}</span>
          <span class="tick end">{{ formatDuration(trace.totalDuration || trace.duration || 0) }}</span>
        </div>
      </div>
    </div>

    <!-- Rows -->
    <div class="gantt-body">
      <div 
        v-for="row in processedSpans" 
        :key="row.span.spanId" 
        class="gantt-row"
        :class="{ 'has-error': row.span.status === 'error' }"
        @mouseenter="hoveredSpanId = row.span.spanId"
        @mouseleave="hoveredSpanId = null"
      >
        <!-- Tree Column -->
        <div class="col-service" :style="{ paddingLeft: `${row.depth * 20 + 10}px` }">
          <span class="status-icon" :class="row.span.status === 'error' ? 'error' : 'success'" :title="row.span.status === 'error' ? '失败' : '成功'">
            {{ row.span.status === 'error' ? '✗' : '✓' }}
          </span>
          <div class="service-badge" :style="{ backgroundColor: getServiceColor(row.span.serviceName) }">
            {{ row.span.serviceName }}
          </div>
          <span class="operation-name" :title="row.span.operationName">{{ row.span.operationName }}</span>
        </div>

        <!-- Timeline Column -->
        <div class="col-timeline">
          <div class="timeline-track">
            <div 
              class="span-bar"
              :style="{
                left: `${getLeftPercent(row.span)}%`,
                width: `${getWidthPercent(row.span)}%`,
                backgroundColor: getServiceColor(row.span.serviceName)
              }"
            >
              <span class="span-duration" v-if="getWidthPercent(row.span) > 5">
                {{ formatDuration(row.span.duration) }}
              </span>
            </div>
            
            <!-- Connector lines could go here in a more complex implementation -->
          </div>
        </div>

        <!-- Tooltip (Simple inline or popover) -->
        <div v-if="hoveredSpanId === row.span.spanId" class="span-details-popover" :style="{ top: '30px', left: '20%' }">
          <div class="popover-header">
            <strong>{{ row.span.serviceName }}</strong>: {{ row.span.operationName }}
          </div>
          <div class="popover-body">
            <div>Start: {{ formatOffset(row.span.startTime) }}</div>
            <div>Duration: {{ formatDuration(row.span.duration) }}</div>
            <div>Status: {{ row.span.status }}</div>
            <div class="id-text">SpanID: {{ row.span.spanId }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    Select a trace to view details
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Trace, Span } from '@/mock/definitions';

const props = defineProps<{
  trace: Trace | null;
}>();

const hoveredSpanId = ref<string | null>(null);

// Helper to format raw ms into readable string
const formatDuration = (ms: number): string => {
  if (ms < 1) return '< 1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Format start time relative to trace start
const formatOffset = (startTime: number): string => {
  if (!props.trace) return '';
  const offset = startTime - props.trace.startTime;
  return `+${formatDuration(offset)}`;
};

// Calculate position
const getLeftPercent = (span: Span): number => {
  if (!props.trace) return 0;
  const traceDuration = props.trace.totalDuration || props.trace.duration || 1;
  const offset = span.startTime - props.trace.startTime;
  const percent = (offset / traceDuration) * 100;
  return Math.max(0, Math.min(100, percent));
};

const getWidthPercent = (span: Span): number => {
  if (!props.trace) return 0;
  const traceDuration = props.trace.totalDuration || props.trace.duration || 1;
  // Min width 0.2% so it's visible
  const percent = (span.duration / traceDuration) * 100;
  return Math.max(0.5, Math.min(100, percent));
};

// Service Colors (Consistent hashing or mapping)
const serviceColors: Record<string, string> = {
  'frontend-proxy': '#3274d9', // primary
  'auth-service': '#985fd9', // purple
  'api-gateway': '#eab839', // yellow/orange
  'order-service': '#73bf69', // green
  'payment-service': '#ff9830', // orange
  'inventory-service': '#5794f2', // light blue
  'db-primary': '#f2495c', // red-ish (often DBs are distinctive)
  'db-replica': '#f2495c',
  'email-worker': '#b877d9',
};

const getServiceColor = (service: string) => {
  return serviceColors[service] || '#8e8e8e';
};

// Flatten the tree for rendering while keeping depth info
interface ProcessedSpan {
  span: Span;
  depth: number;
}

const processedSpans = computed<ProcessedSpan[]>(() => {
  if (!props.trace || !props.trace.spans.length) return [];

  const spans = props.trace.spans;
  // Build adjacency list
  const childrenMap = new Map<string, Span[]>();
  let rootSpan: Span | null = null;

  spans.forEach(span => {
    if (!span.parentId) {
      rootSpan = span;
    } else {
      if (!childrenMap.has(span.parentId)) {
        childrenMap.set(span.parentId, []);
      }
      childrenMap.get(span.parentId)?.push(span);
    }
  });

  // If no explicit root found (shouldn't happen with generator), find earliest
  if (!rootSpan) {
    rootSpan = spans.reduce((prev, curr) => prev.startTime < curr.startTime ? prev : curr);
  }

  const result: ProcessedSpan[] = [];
  
  // DFS to build flat list
  const traverse = (span: Span, depth: number) => {
    result.push({ span, depth });
    const children = childrenMap.get(span.spanId);
    if (children) {
      // Sort children by start time
      children.sort((a, b) => a.startTime - b.startTime);
      children.forEach(child => traverse(child, depth + 1));
    }
  };

  if (rootSpan) {
    traverse(rootSpan, 0);
  }

  return result;
});
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.trace-gantt {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: $bg-panel;
  border-radius: 4px;
  overflow: hidden;
  font-size: 12px;
  color: $text-primary;
}

.gantt-header {
  display: flex;
  height: 32px;
  border-bottom: 1px solid $border-color;
  background-color: rgba(255, 255, 255, 0.02);
  
  .col-service {
    width: 300px;
    flex-shrink: 0;
    padding: 0 10px;
    display: flex;
    align-items: center;
    font-weight: 600;
    border-right: 1px solid $border-color;
  }
  
  .col-timeline {
    flex-grow: 1;
    position: relative;
    
    .timeline-ruler {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 5px;
      color: #777;
    }
  }
}

.gantt-body {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.gantt-row {
  display: flex;
  height: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
  
  &.has-error .col-service {
    color: $error;
  }
}

.col-service {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  border-right: 1px solid $border-color;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  gap: 6px;
  
  .status-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    flex-shrink: 0;
    
    &.success {
      background-color: rgba(115, 191, 105, 0.2);
      color: $success;
      border: 1px solid $success;
    }
    
    &.error {
      background-color: rgba(242, 73, 92, 0.2);
      color: $error;
      border: 1px solid $error;
    }
  }
  
  .service-badge {
    padding: 1px 4px;
    border-radius: 2px;
    color: #fff;
    font-size: 10px;
    font-weight: bold;
    text-shadow: 0 1px 1px rgba(0,0,0,0.2);
    flex-shrink: 0;
  }

  .operation-name {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
}

.col-timeline {
  flex-grow: 1;
  position: relative;
  
  .timeline-track {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    
    /* Guide lines */
    background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 10% 100%;
  }
}

.span-bar {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 2px;
  min-width: 2px;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
    z-index: 1;
    box-shadow: 0 0 5px rgba(0,0,0,0.5);
  }
  
  .span-duration {
    margin-left: 100%;
    padding-left: 4px;
    color: #aaa;
    font-size: 10px;
    white-space: nowrap;
  }
}

.span-details-popover {
  position: absolute;
  z-index: 100;
  background: $bg-panel;
  border: 1px solid $border-color;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  padding: 8px;
  border-radius: 4px;
  pointer-events: none;
  min-width: 200px;
  
  .popover-header {
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 4px;
  }
  
  .popover-body {
    color: #ccc;
    .id-text {
      font-family: monospace;
      font-size: 10px;
      color: #666;
      margin-top: 4px;
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #555;
  font-style: italic;
}
</style>