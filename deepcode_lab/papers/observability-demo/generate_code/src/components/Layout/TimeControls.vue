<script setup lang="ts">
import { computed } from 'vue';
import { useTimeRange } from '@/composables/useTimeRange';
import { Refresh, Timer, Calendar } from '@element-plus/icons-vue';

const { 
  startTime, 
  endTime, 
  QUICK_RANGES, 
  setQuickRange, 
  setTimeRange,
  refreshInterval,
  formattedDuration 
} = useTimeRange();

// Two-way binding for Date Picker
const dateRange = computed({
  get: () => [startTime.value, endTime.value] as [Date, Date],
  set: (val: [Date, Date] | null) => {
    if (val) {
      setTimeRange(val[0], val[1]);
    }
  }
});

// Auto-refresh options (in milliseconds)
const refreshOptions = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
];

const handleRefresh = () => {
  // If we are in a "Last X" mode (inferred roughly), shift the window to Now
  // For simplicity in this demo, we just trigger a tiny shift to force reactivity 
  // or re-apply the current duration if it matches a quick range.
  // A simple hack to force refresh in the demo context:
  const duration = endTime.value.getTime() - startTime.value.getTime();
  const end = new Date();
  const start = new Date(end.getTime() - duration);
  setTimeRange(start, end);
};
</script>

<template>
  <div class="time-controls">
    <!-- Quick Range Buttons -->
    <el-button-group class="quick-ranges hidden-xs-only">
      <el-button 
        v-for="range in QUICK_RANGES" 
        :key="range.label"
        size="small"
        :type="formattedDuration === range.label ? 'primary' : ''"
        @click="setQuickRange(range.value)"
      >
        {{ range.label }}
      </el-button>
    </el-button-group>

    <el-divider direction="vertical" class="hidden-xs-only" />

    <!-- Date Picker -->
    <div class="date-picker-wrapper">
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="-"
        start-placeholder="Start"
        end-placeholder="End"
        size="small"
        :clearable="false"
        :prefix-icon="Calendar"
        class="custom-date-picker"
      />
    </div>

    <el-divider direction="vertical" />

    <!-- Refresh Interval Dropdown -->
    <el-dropdown trigger="click" @command="(val: number) => refreshInterval = val">
      <el-button size="small" class="refresh-interval-btn">
        <el-icon><Timer /></el-icon>
        <span class="interval-label">{{ refreshInterval > 0 ? `${refreshInterval/1000}s` : 'Off' }}</span>
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-for="opt in refreshOptions" 
            :key="opt.value" 
            :command="opt.value"
            :class="{ active: refreshInterval === opt.value }"
          >
            {{ opt.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Manual Refresh Trigger -->
    <el-button 
      size="small" 
      class="refresh-btn" 
      :icon="Refresh" 
      @click="handleRefresh"
      title="Refresh Data"
    />
  </div>
</template>

<style scoped lang="scss">
.time-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-panel);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  height: 40px;
}

.date-picker-wrapper {
  display: flex;
  align-items: center;
}

// Override Element Plus DatePicker styles to match dark theme better if needed
:deep(.el-date-editor.el-input__wrapper) {
  background-color: transparent;
  box-shadow: none !important;
  border: 1px solid transparent;
  
  &:hover {
    border-color: var(--primary);
  }
  
  .el-range-input {
    color: var(--text-primary);
  }
  
  .el-range-separator {
    color: var(--text-secondary);
  }
}

.active {
  color: var(--primary);
  font-weight: bold;
}

.interval-label {
  margin-left: 4px;
  min-width: 20px;
  display: inline-block;
}

@media (max-width: 768px) {
  .hidden-xs-only {
    display: none;
  }
  
  .custom-date-picker {
    width: 200px !important;
  }
}
</style>
