<template>
  <div class="metrics-view page-container">
    <div class="view-header">
      <h1 class="text-xl font-bold">System Metrics</h1>
      <div class="status-badge" :class="{ active: !store.isLoadingMetrics }">
        <span class="dot"></span>
        {{ store.isLoadingMetrics ? 'Fetching...' : 'Live' }}
      </div>
    </div>

    <!-- Error State -->
    <div v-if="store.error" class="error-banner">
      {{ store.error }}
    </div>

    <div class="metrics-grid">
      <!-- CPU Usage Chart -->
      <div class="panel">
        <div class="panel-header">
          <h3>CPU Usage</h3>
          <span class="metric-value">{{ currentCpu }}%</span>
        </div>
        <div class="chart-container">
          <BaseEChart :options="cpuOptions" :loading="store.isLoadingMetrics" />
        </div>
      </div>

      <!-- Memory Usage Chart -->
      <div class="panel">
        <div class="panel-header">
          <h3>Memory Usage</h3>
          <span class="metric-value">{{ currentMemory }} MB</span>
        </div>
        <div class="chart-container">
          <BaseEChart :options="memoryOptions" :loading="store.isLoadingMetrics" />
        </div>
      </div>

      <!-- Latency Chart -->
      <div class="panel full-width">
        <div class="panel-header">
          <h3>Request Latency (p99)</h3>
          <span class="metric-value">{{ currentLatency }} ms</span>
        </div>
        <div class="chart-container">
          <BaseEChart :options="latencyOptions" :loading="store.isLoadingMetrics" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import BaseEChart from '@/components/Charts/BaseEChart.vue';
import dayjs from 'dayjs';

const store = useDataStore();

// --- Helpers ---
const formatTime = (ts: number) => dayjs(ts).format('HH:mm');
const lastValue = (metrics: any[]) => {
  if (!metrics || metrics.length === 0) return 0;
  return metrics[metrics.length - 1].value.toFixed(2);
};

// --- Current Values ---
const currentCpu = computed(() => lastValue(store.cpuMetrics));
const currentMemory = computed(() => lastValue(store.memoryMetrics));
const currentLatency = computed(() => lastValue(store.latencyMetrics));

// --- Chart Options Generators ---

// Common grid/tooltip settings are handled by the theme, 
// but we define data-specific series here.

const createChartOptions = (
  title: string, 
  data: any[], 
  unit: string, 
  color: string, 
  area: boolean = true
) => {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return `
          <div style="font-size:12px;color:#ccc">${dayjs(p.value[0]).format('YYYY-MM-DD HH:mm:ss')}</div>
          <div style="font-weight:bold;color:${color}">
            ${p.marker} ${title}: ${p.value[1].toFixed(2)} ${unit}
          </div>
        `;
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: (val: number) => dayjs(val).format('HH:mm')
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: `{value} ${unit}`
      },
      splitLine: {
        show: true,
        lineStyle: {
          opacity: 0.1
        }
      }
    },
    series: [
      {
        name: title,
        type: 'line',
        showSymbol: false,
        smooth: true,
        lineStyle: {
          width: 2,
          color: color
        },
        areaStyle: area ? {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color }, // 100% opacity at top (but handled by global opacity usually)
              { offset: 1, color: 'transparent' }
            ],
            global: false
          },
          opacity: 0.2
        } : null,
        data: data.map(p => [p.timestamp, p.value])
      }
    ]
  };
};

// --- Reactive Options ---

const cpuOptions = computed(() => 
  createChartOptions('CPU', store.cpuMetrics, '%', '#73bf69') // Green
);

const memoryOptions = computed(() => 
  createChartOptions('Memory', store.memoryMetrics, 'MB', '#3274d9') // Blue
);

const latencyOptions = computed(() => 
  createChartOptions('Latency', store.latencyMetrics, 'ms', '#f2495c') // Red
);

</script>

<style scoped lang="scss">
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  h1 {
    color: var(--text-primary);
    margin: 0;
  }
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: var(--bg-panel);
  border-radius: 12px;
  border: 1px solid var(--border-color);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--text-secondary);
  }

  &.active {
    color: var(--success);
    border-color: rgba(115, 191, 105, 0.3);
    
    .dot {
      background-color: var(--success);
      box-shadow: 0 0 8px var(--success);
    }
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  flex: 1;

  .full-width {
    grid-column: 1 / -1;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  height: 350px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .metric-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary);
    font-family: monospace;
  }
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 0; /* Important for flex child to shrink */
  position: relative;
  overflow: hidden;
}

.error-banner {
  background: rgba(242, 73, 92, 0.1);
  border: 1px solid var(--error);
  color: var(--error);
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: var(--border-radius);
}
</style>
