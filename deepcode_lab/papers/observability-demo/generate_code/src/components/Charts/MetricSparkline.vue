<template>
  <div class="metric-sparkline panel">
    <div class="metric-header">
      <div class="metric-info">
        <span class="metric-label">{{ label }}</span>
        <h3 class="metric-value" :style="{ color: color || 'white' }">
          {{ formattedCurrentValue }}
          <span v-if="unit" class="unit">{{ unit }}</span>
        </h3>
      </div>
      <!-- Optional: Add a small trend indicator here if needed -->
    </div>
    
    <div class="chart-wrapper">
      <BaseEChart 
        :options="chartOptions" 
        :loading="loading" 
        height="100%" 
        width="100%"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as echarts from 'echarts/core';
import BaseEChart from '@/components/Charts/BaseEChart.vue';
import type { MetricPoint } from '@/mock/definitions';

const props = defineProps<{
  label: string;
  data: MetricPoint[];
  loading?: boolean;
  color?: string;
  unit?: string;
  valueFormatter?: (val: number) => string;
}>();

// Get the latest value for display
const currentValue = computed(() => {
  if (!props.data || props.data.length === 0) return 0;
  return props.data[props.data.length - 1].value;
});

const formattedCurrentValue = computed(() => {
  if (props.valueFormatter) {
    return props.valueFormatter(currentValue.value);
  }
  // Default formatting: 2 decimals if float, 0 if int
  return currentValue.value % 1 === 0 
    ? currentValue.value.toString() 
    : currentValue.value.toFixed(2);
});

const chartOptions = computed(() => {
  const color = props.color || '#3274d9'; // Default primary blue
  
  // Create gradient area
  const areaColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: color },
    { offset: 1, color: 'rgba(0,0,0,0)' }
  ]);

  return {
    grid: {
      top: 5,
      bottom: 5,
      left: 0,
      right: 0
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const val = params[0].value[1];
        const date = new Date(params[0].value[0]).toLocaleTimeString();
        return `${date}<br/><strong>${val.toFixed(2)}${props.unit || ''}</strong>`;
      },
      confine: true
    },
    xAxis: {
      type: 'time',
      show: false,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      show: false,
      min: (value: any) => Math.floor(value.min * 0.95), // Dynamic min to show trends better
      max: (value: any) => Math.ceil(value.max * 1.05)
    },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 0,
        lineStyle: {
          width: 2,
          color: color
        },
        areaStyle: {
          color: areaColor,
          opacity: 0.2
        },
        data: props.data.map(p => [p.timestamp, p.value])
      }
    ]
  };
});
</script>

<style scoped lang="scss">
.metric-sparkline {
  display: flex;
  flex-direction: column;
  padding: 16px; // Using direct px as variable access in scoped style needs import or global
  height: 100%;
  background-color: #1f1f24; // Fallback or $bg-panel
  border: 1px solid #363636;
  border-radius: 4px;
  overflow: hidden;
}

.metric-header {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.metric-label {
  font-size: 12px;
  color: #a0a0a0; // Muted text
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  display: block;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.unit {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.7;
}

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
</style>
