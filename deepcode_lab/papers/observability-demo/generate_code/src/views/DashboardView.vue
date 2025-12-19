<template>
  <div class="dashboard-view page-container">
    <!-- Header -->
    <div class="view-header">
      <div>
        <h1 class="text-xl">System Dashboard</h1>
        <p class="text-muted">Real-time overview of service health and performance</p>
      </div>
      <!-- Status Badge -->
      <div class="status-indicator" :class="{ active: !store.isLoadingMetrics }">
        <div class="dot"></div>
        <span>{{ store.isLoadingMetrics ? 'Updating...' : 'Live' }}</span>
      </div>
    </div>

    <!-- Key Metrics Row (Sparklines) -->
    <div class="metrics-row">
      <MetricSparkline 
        label="Avg CPU Usage" 
        :data="store.cpuMetrics" 
        unit="%" 
        color="#73bf69" 
        :loading="store.isLoadingMetrics"
      />
      <MetricSparkline 
        label="Avg Memory" 
        :data="store.memoryMetrics" 
        unit="MB" 
        color="#3274d9" 
        :loading="store.isLoadingMetrics"
      />
      <MetricSparkline 
        label="Global Latency" 
        :data="store.latencyMetrics" 
        unit="ms" 
        color="#e0b400" 
        :loading="store.isLoadingMetrics"
      />
      <!-- Simulated Throughput Metric derived from CPU/Latency to fill the 4th slot -->
      <MetricSparkline 
        label="Throughput" 
        :data="throughputData" 
        unit="rps" 
        color="#9f32d9" 
        :loading="store.isLoadingMetrics"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      
      <!-- Topology Panel -->
      <div class="panel topology-panel">
        <div class="panel-header">
          <h3 class="panel-title">Service Topology</h3>
          <div class="panel-actions">
            <span class="status-badge success">All Systems Operational</span>
          </div>
        </div>
        <div class="panel-body no-padding">
          <ServiceGraph />
        </div>
      </div>

      <!-- Main Trend Chart -->
      <div class="panel chart-panel">
        <div class="panel-header">
          <h3 class="panel-title">Traffic vs Latency</h3>
        </div>
        <div class="panel-body">
          <BaseEChart :options="mainChartOptions" :loading="store.isLoadingMetrics" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import MetricSparkline from '@/components/Charts/MetricSparkline.vue';
import BaseEChart from '@/components/Charts/BaseEChart.vue';
import ServiceGraph from '@/components/Topology/ServiceGraph.vue';
import dayjs from 'dayjs';

const store = useDataStore();

// Generate a simulated throughput metric based on CPU usage
// In a real app, this would come from a separate metric series
const throughputData = computed(() => {
  return store.cpuMetrics.map(point => ({
    timestamp: point.timestamp,
    value: Math.round(point.value * 5.5 + (Math.random() * 20)) // Rough correlation
  }));
});

// Main Chart Configuration (Dual Axis: Requests vs Latency)
const mainChartOptions = computed(() => {
  const timestamps = store.latencyMetrics.map(p => dayjs(p.timestamp).format('HH:mm'));
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['Throughput (rps)', 'Latency (ms)'],
      bottom: 0,
      textStyle: { color: '#9ca3af' }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6b7280' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Throughput',
        position: 'left',
        splitLine: { show: true, lineStyle: { color: '#1f1f24' } },
        axisLabel: { color: '#6b7280' }
      },
      {
        type: 'value',
        name: 'Latency',
        position: 'right',
        splitLine: { show: false },
        axisLabel: { color: '#6b7280' }
      }
    ],
    series: [
      {
        name: 'Throughput (rps)',
        type: 'line',
        showSymbol: false,
        smooth: true,
        areaStyle: {
          opacity: 0.1,
          color: '#9f32d9'
        },
        itemStyle: { color: '#9f32d9' },
        data: throughputData.value.map(p => p.value)
      },
      {
        name: 'Latency (ms)',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: false,
        smooth: true,
        itemStyle: { color: '#e0b400' },
        data: store.latencyMetrics.map(p => p.value)
      }
    ]
  };
});
</script>

<style scoped lang="scss">
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }
  
  .text-muted {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 4px 0 0 0;
  }
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-panel);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #666;
  }
  
  &.active {
    color: var(--success);
    border-color: rgba(var(--success), 0.2);
    
    .dot {
      background-color: var(--success);
      box-shadow: 0 0 8px var(--success);
    }
  }
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: var(--spacing-md);
  height: 500px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    height: auto;
    
    .panel {
      height: 400px;
    }
  }
}

.topology-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-body {
  flex: 1;
  position: relative;
  min-height: 0; // Fix flex overflow
  overflow: hidden; // Prevent content from expanding parent
  
  &.no-padding {
    padding: 0;
  }
}

.status-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(115, 191, 105, 0.1);
  color: var(--success);
  border: 1px solid rgba(115, 191, 105, 0.2);
}
</style>