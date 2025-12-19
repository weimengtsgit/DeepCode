<script setup lang="ts">
import { computed } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import type { LogEntry } from '@/mock/definitions';
import dayjs from 'dayjs';

const props = defineProps<{
  logs: LogEntry[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-trace', traceId: string): void;
}>();

// Wrap logs with a unique key for the virtual scroller
const items = computed(() => {
  return props.logs.map((log, index) => ({
    ...log,
    _uid: `${log.timestamp}-${index}`
  }));
});

const formatTime = (ts: number) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss.SSS');

const onTraceClick = (traceId: string) => {
  emit('select-trace', traceId);
};
</script>

<template>
  <div class="log-stream-wrapper">
    <!-- Loading State -->
    <div v-if="loading && items.length === 0" class="status-msg">
      <div class="loading-spinner"></div>
      <span>Loading 10k+ log entries...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="status-msg">
      <span>No logs found for the selected criteria.</span>
    </div>

    <!-- Virtual Scroller -->
    <RecycleScroller
      v-else
      class="scroller"
      :items="items"
      :item-size="28"
      key-field="_uid"
      v-slot="{ item }"
    >
      <div class="log-row" :class="item.level.toLowerCase()">
        <!-- Timestamp -->
        <span class="col-time">{{ formatTime(item.timestamp) }}</span>
        
        <!-- Level -->
        <span class="col-level" :class="item.level.toLowerCase()">
          {{ item.level }}
        </span>
        
        <!-- Service -->
        <span class="col-service" :title="item.service">
          {{ item.service }}
        </span>
        
        <!-- Metadata (Trace ID) -->
        <span class="col-meta">
          <span 
            v-if="item.traceId" 
            class="trace-link" 
            @click.stop="onTraceClick(item.traceId)"
            title="Filter by this Trace ID"
          >
            trace_id={{ item.traceId.substring(0, 8) }}
          </span>
        </span>

        <!-- Message -->
        <span class="col-message" :title="item.message">
          {{ item.message }}
        </span>
      </div>
    </RecycleScroller>
  </div>
</template>

<style scoped lang="scss">
.log-stream-wrapper {
  height: 100%;
  width: 100%;
  background-color: #000000; // Use pure black for terminal feel, or darker panel
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 4px;
}

.status-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8e8e8e;
  gap: 12px;
}

.scroller {
  height: 100%;
  
  // Custom Scrollbar for the list
  &::-webkit-scrollbar {
    width: 10px;
    background: #0b0c0e;
  }
  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 5px;
    border: 2px solid #0b0c0e;
  }
}

.log-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  white-space: nowrap;
  cursor: default;
  transition: background 0.1s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  // Level-specific coloring for the row border or background hint
  &.error {
    background-color: rgba(242, 73, 92, 0.05); // faint red bg
  }
  &.warn {
    background-color: rgba(255, 148, 0, 0.05); // faint orange bg
  }
}

// Columns
.col-time {
  width: 160px;
  flex-shrink: 0;
  color: #7d7d7d;
}

.col-level {
  width: 50px;
  flex-shrink: 0;
  font-weight: bold;
  
  &.info { color: var(--primary); }
  &.warn { color: var(--warning); }
  &.error { color: var(--error); }
}

.col-service {
  width: 120px;
  flex-shrink: 0;
  color: #c0c0c0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-meta {
  width: 140px;
  flex-shrink: 0;
  color: #666;
  font-size: 11px;
  
  .trace-link {
    color: #5b9bf8;
    cursor: pointer;
    text-decoration: underline;
    opacity: 0.8;
    
    &:hover {
      opacity: 1;
      color: #7eb0f8;
    }
  }
}

.col-message {
  flex: 1;
  color: #dcdcdc;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 10px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #444;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
