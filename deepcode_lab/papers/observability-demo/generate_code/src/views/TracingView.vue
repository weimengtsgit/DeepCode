<template>
  <div class="tracing-view page-container">
    <div class="header-actions">
      <h2>Distributed Tracing</h2>
      <div class="stats" v-if="!isLoadingTraces">
        <span class="stat-item">
          <span class="label">Total Traces:</span>
          <span class="value">{{ traceCount }}</span>
        </span>
        <span class="stat-item">
          <span class="label">Errors:</span>
          <span class="value error">{{ errorTraceCount }}</span>
        </span>
        <span class="stat-item">
          <span class="label">Avg Duration:</span>
          <span class="value">{{ Math.round(avgDuration) }}ms</span>
        </span>
      </div>
    </div>

    <div class="content-split">
      <!-- Left Panel: Trace List -->
      <div class="trace-list-panel panel">
        <div class="panel-header">
          <h3>Trace List</h3>
        </div>
        
        <div class="list-container" v-loading="isLoadingTraces">
          <el-table 
            :data="tracesWithCorrectErrorCount" 
            style="width: 100%" 
            height="100%"
            @row-click="handleRowClick"
            highlight-current-row
            class="trace-table"
            :row-class-name="tableRowClassName"
          >
            <el-table-column width="100" label="Status" align="center">
              <template #default="{ row }">
                <div class="status-badge" :class="row.errorCount > 0 ? 'error' : 'success'">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ row.errorCount > 0 ? '失败' : '成功' }}</span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="Trace / Service" min-width="180">
              <template #default="{ row }">
                <div class="trace-info">
                  <div class="service-name">{{ row.rootServiceName || 'unknown' }}</div>
                  <div class="trace-id">{{ row.traceId.substring(0, 7) }}...</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="Duration" width="100" align="right">
              <template #default="{ row }">
                {{ row.totalDuration || row.duration || 0 }}ms
              </template>
            </el-table-column>
            
            <el-table-column label="Time" width="120" align="right">
              <template #default="{ row }">
                {{ formatTime(row.startTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Right Panel: Trace Details (Gantt) -->
      <div class="trace-details-panel panel">
        <div class="panel-header">
          <h3>Trace Details</h3>
          <div v-if="selectedTrace" class="trace-meta">
            <span class="tag status-tag" :class="selectedTrace.errorCount > 0 ? 'error' : 'success'">
              {{ selectedTrace.errorCount > 0 ? '失败' : '成功' }}
            </span>
            <span class="tag trace-id">{{ selectedTrace.traceId }}</span>
            <span class="tag duration">{{ selectedTrace.totalDuration || selectedTrace.duration || 0 }}ms</span>
            <span class="tag errors" v-if="selectedTrace.errorCount > 0">{{ selectedTrace.errorCount }} 个错误</span>
          </div>
        </div>

        <div class="details-content" v-loading="isLoadingTraceDetails">
          <template v-if="selectedTrace">
            <div class="gantt-container">
              <TraceGantt :key="selectedTrace.traceId" :trace="selectedTrace" />
            </div>
          </template>
          
          <div v-else class="empty-state">
            <el-empty description="Select a trace from the list to view details" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import TraceGantt from '@/components/Charts/TraceGantt.vue';
import type { Trace } from '@/mock/definitions';

const store = useDataStore();
const { 
  traces, 
  selectedTrace, 
  isLoadingTraces, 
  isLoadingTraceDetails, 
  traceCount, 
  errorTraceCount, 
  avgDuration 
} = storeToRefs(store);

const formatTime = (ts: number) => {
  return dayjs(ts).format('HH:mm:ss');
};

// Computed to ensure errorCount is always correct based on actual spans
const tracesWithCorrectErrorCount = computed(() => {
  return traces.value.map(trace => {
    const actualErrorCount = trace.spans?.filter(s => s.status === 'error').length || 0;
    if (trace.errorCount !== actualErrorCount) {
      // If mismatch, create corrected trace
      return {
        ...trace,
        errorCount: actualErrorCount
      };
    }
    return trace;
  });
});

const handleRowClick = (row: Trace) => {
  // Ensure the trace has correct errorCount
  const actualErrorCount = row.spans?.filter(s => s.status === 'error').length || 0;
  const correctedTrace = actualErrorCount !== row.errorCount
    ? { ...row, errorCount: actualErrorCount }
    : row;
  
  store.setSelectedTrace(correctedTrace);
};

const tableRowClassName = ({ row }: { row: Trace }) => {
  return selectedTrace.value?.traceId === row.traceId ? 'selected-row' : '';
};
</script>

<style scoped lang="scss">
.tracing-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .stats {
    display: flex;
    gap: 20px;
    font-size: var(--font-size-base);

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .label {
        color: var(--text-secondary);
      }
      
      .value {
        font-weight: 600;
        color: var(--text-primary);
        
        &.error {
          color: var(--error);
        }
      }
    }
  }
}

.content-split {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0; // Fix flex overflow
}

.trace-list-panel {
  flex: 0 0 400px; // Fixed width for list
  display: flex;
  flex-direction: column;
  min-width: 300px;
  overflow: visible; // Allow table to render properly
  
  .list-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}

.trace-details-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // Allow flex item to shrink below content size
  overflow: visible; // Allow content to render properly
  
  .trace-meta {
    display: flex;
    gap: 10px;
    font-size: 12px;
    flex-shrink: 0;
    
    .tag {
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      
      &.status-tag {
        font-weight: 600;
        
        &.success {
          background: rgba(115, 191, 105, 0.2);
          color: var(--success);
          border: 1px solid var(--success);
        }
        
        &.error {
          background: rgba(242, 73, 92, 0.2);
          color: var(--error);
          border: 1px solid var(--error);
        }
      }
      
      &.errors {
        background: rgba(242, 73, 92, 0.2);
        color: var(--error);
      }
    }
  }

  .details-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    position: relative;
    padding: var(--spacing-md);
  }
  
  .gantt-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Custom Trace List Styling
.trace-info {
  display: flex;
  flex-direction: column;
  
  .service-name {
    font-weight: 600;
    color: var(--primary);
  }
  
  .trace-id {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: monospace;
  }
}

// Status Badge with text and dot
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  &.success {
    background-color: rgba(115, 191, 105, 0.15);
    color: var(--success);
    
    .status-dot {
      background-color: var(--success);
      box-shadow: 0 0 4px var(--success);
    }
  }
  
  &.error {
    background-color: rgba(242, 73, 92, 0.15);
    color: var(--error);
    
    .status-dot {
      background-color: var(--error);
      box-shadow: 0 0 4px var(--error);
    }
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .status-text {
    line-height: 1;
    white-space: nowrap;
  }
}

// Element Plus Table Overrides for Dark Mode integration
:deep(.el-table) {
  background-color: transparent;
  color: var(--text-primary);
  
  th.el-table__cell {
    background-color: var(--bg-body);
    color: var(--text-secondary);
    border-bottom-color: var(--border-color);
  }
  
  tr {
    background-color: transparent;
    cursor: pointer;
    
    &:hover > td.el-table__cell {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  td.el-table__cell {
    border-bottom-color: var(--border-color);
  }

  .current-row > td.el-table__cell {
    background-color: rgba(50, 116, 217, 0.15) !important;
  }
}

:deep(.el-loading-mask) {
  background-color: rgba(11, 12, 14, 0.7);
}

@media (max-width: 1024px) {
  .content-split {
    flex-direction: column;
  }
  
  .trace-list-panel {
    flex: 0 0 300px;
    height: 300px;
  }
}
</style>
