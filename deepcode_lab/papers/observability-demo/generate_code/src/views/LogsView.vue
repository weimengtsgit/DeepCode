<template>
  <div class="logs-view page-container">
    <div class="view-header panel-header">
      <div class="header-left">
        <h2>Log Explorer</h2>
        <div class="stats-badges" v-if="!isLoading">
          <span class="badge info">{{ stats.info }} INFO</span>
          <span class="badge warn">{{ stats.warn }} WARN</span>
          <span class="badge error">{{ stats.error }} ERROR</span>
        </div>
      </div>
      
      <div class="header-controls">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="Search logs..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="filter-box" v-if="activeTraceId">
          <el-tag closable @close="clearTraceFilter" type="info" effect="dark">
            Trace: {{ activeTraceId.substring(0, 8) }}...
          </el-tag>
        </div>

        <el-button :loading="isLoading" @click="fetchLogs" circle>
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="logs-content panel">
      <LogStream 
        :logs="logs" 
        :loading="isLoading" 
        @select-trace="handleTraceSelect"
      />
      
      <div class="results-meta" v-if="!isLoading && logs.length > 0">
        Showing {{ logs.length }} events
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, Refresh } from '@element-plus/icons-vue';
import LogStream from '@/components/Logs/LogStream.vue';
import { mockApi } from '@/mock';
import { useTimeRange } from '@/composables/useTimeRange';
import type { LogEntry } from '@/mock/definitions';

const route = useRoute();
const router = useRouter();
const { startTime, endTime } = useTimeRange();

// State
const logs = ref<LogEntry[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const activeTraceId = ref('');

// Computed Stats
const stats = computed(() => {
  const counts = { info: 0, warn: 0, error: 0 };
  logs.value.forEach(log => {
    if (log.level === 'INFO') counts.info++;
    else if (log.level === 'WARN') counts.warn++;
    else if (log.level === 'ERROR') counts.error++;
  });
  return counts;
});

// Actions
const fetchLogs = async () => {
  isLoading.value = true;
  try {
    const filter = {
      search: searchQuery.value,
      traceId: activeTraceId.value || undefined
    };
    
    // Artificial delay is already in mockApi, but we fetch directly
    logs.value = await mockApi.fetchLogs(startTime.value, endTime.value, filter);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  fetchLogs();
};

const clearTraceFilter = () => {
  activeTraceId.value = '';
  // Remove query param
  router.replace({ query: { ...route.query, traceId: undefined } });
};

const handleTraceSelect = (traceId: string) => {
  // Determine if we want to filter by this trace in logs view, 
  // or navigate to tracing view.
  // Requirement: "Drill down to Logs: Filter by that TraceID" 
  // - usually this implies clicking a trace in TracingView goes to LogsView.
  // - clicking a trace ID *in* LogsView might just filter, or go to TracingView.
  // Let's make it filter logs by that trace for deep dive.
  activeTraceId.value = traceId;
};

// Watchers
watch([startTime, endTime], () => {
  fetchLogs();
});

watch(() => route.query.traceId, (newId) => {
  if (newId && typeof newId === 'string') {
    activeTraceId.value = newId;
    // Don't auto-fetch here if mounted handles it, but good for navigation updates
    fetchLogs();
  } else if (!newId && activeTraceId.value) {
    activeTraceId.value = '';
    fetchLogs();
  }
});

watch(activeTraceId, (val) => {
    // If activeTraceId changes locally (e.g. cleared), sync URL
    if (!val && route.query.traceId) {
        router.replace({ query: { ...route.query, traceId: undefined } });
    } else if (val && route.query.traceId !== val) {
        router.replace({ query: { ...route.query, traceId: val } });
    }
    fetchLogs();
});

// Lifecycle
onMounted(() => {
  if (route.query.traceId && typeof route.query.traceId === 'string') {
    activeTraceId.value = route.query.traceId;
  }
  fetchLogs();
});
</script>

<style scoped lang="scss">
.logs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  gap: 16px;

  h2 {
    margin: 0;
    margin-right: 16px;
    font-size: 1.5rem;
    font-weight: 500;
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .stats-badges {
    display: flex;
    gap: 8px;

    .badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      
      &.info {
        background: rgba(50, 116, 217, 0.2);
        color: #3274d9;
      }
      &.warn {
        background: rgba(255, 146, 43, 0.2);
        color: #ff922b;
      }
      &.error {
        background: rgba(242, 73, 92, 0.2);
        color: #f2495c;
      }
    }
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    justify-content: flex-end;

    .search-box {
      width: 300px;
      max-width: 100%;
    }
  }
}

.logs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; // Critical for virtual scroller
  padding: 0; // LogStream handles its own padding
  position: relative;
  min-height: 0;
}

.results-meta {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--bg-panel);
  padding: 4px 12px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  border-top-left-radius: 4px;
  z-index: 10;
  opacity: 0.8;
}

// Element UI Overrides
:deep(.el-input__wrapper) {
  background-color: var(--bg-body);
  box-shadow: 0 0 0 1px var(--border-color) inset;
  
  &.is-focus {
    box-shadow: 0 0 0 1px var(--primary) inset;
  }
}

:deep(.el-input__inner) {
  color: var(--text-primary);
}
</style>
