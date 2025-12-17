<template>
  <div class="time-range-picker" :class="{ 'is-mobile': isMobile }">
    <!-- Quick Presets -->
    <div v-if="showPresets" class="preset-buttons">
      <el-button
        v-for="preset in presets"
        :key="preset.value"
        :type="currentPreset === preset.value ? 'primary' : 'default'"
        :size="size"
        @click="handlePresetClick(preset.value)"
      >
        {{ preset.label }}
      </el-button>
    </div>

    <!-- Custom Range Picker -->
    <div v-if="showCustomRange" class="custom-range">
      <el-date-picker
        v-model="customRange"
        type="datetimerange"
        :size="size"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        :shortcuts="datePickerShortcuts"
        :disabled-date="disabledDate"
        :clearable="clearable"
        @change="handleCustomRangeChange"
      />
    </div>

    <!-- Realtime Toggle -->
    <div v-if="showRealtimeToggle" class="realtime-toggle">
      <el-button
        :type="isRealtime ? 'success' : 'default'"
        :size="size"
        :icon="VideoPlay"
        @click="handleRealtimeToggle"
      >
        {{ isRealtime ? '实时模式' : '历史模式' }}
      </el-button>
    </div>

    <!-- Time Navigation -->
    <div v-if="showNavigation" class="time-navigation">
      <el-button-group :size="size">
        <el-button :icon="ArrowLeft" @click="handleShiftBackward" title="向前">
          <span v-if="!compact">向前</span>
        </el-button>
        <el-button :icon="RefreshRight" @click="handleRefresh" title="刷新">
          <span v-if="!compact">刷新</span>
        </el-button>
        <el-button :icon="ArrowRight" @click="handleShiftForward" title="向后">
          <span v-if="!compact">向后</span>
        </el-button>
      </el-button-group>
    </div>

    <!-- Zoom Controls -->
    <div v-if="showZoom" class="zoom-controls">
      <el-button-group :size="size">
        <el-button :icon="ZoomIn" @click="handleZoomIn" title="放大">
          <span v-if="!compact">放大</span>
        </el-button>
        <el-button :icon="ZoomOut" @click="handleZoomOut" title="缩小">
          <span v-if="!compact">缩小</span>
        </el-button>
      </el-button-group>
    </div>

    <!-- Time Range Display -->
    <div v-if="showDisplay" class="time-display">
      <el-tag :size="size" type="info">
        <el-icon class="mr-1"><Clock /></el-icon>
        {{ displayLabel }}
      </el-tag>
      <el-tag v-if="duration" :size="size" type="info" class="ml-2">
        <el-icon class="mr-1"><Timer /></el-icon>
        {{ formatDuration(duration) }}
      </el-tag>
    </div>

    <!-- Refresh Interval Selector -->
    <div v-if="showRefreshInterval" class="refresh-interval">
      <el-select
        v-model="selectedRefreshInterval"
        :size="size"
        placeholder="刷新间隔"
        @change="handleRefreshIntervalChange"
      >
        <el-option
          v-for="interval in refreshIntervals"
          :key="interval.value"
          :label="interval.label"
          :value="interval.value"
        />
      </el-select>
    </div>

    <!-- Popover for Advanced Options -->
    <el-popover
      v-if="showAdvanced"
      placement="bottom"
      :width="300"
      trigger="click"
    >
      <template #reference>
        <el-button :size="size" :icon="Setting">
          <span v-if="!compact">高级选项</span>
        </el-button>
      </template>
      <div class="advanced-options">
        <div class="option-item">
          <span class="option-label">时区：</span>
          <el-select v-model="timezone" size="small" @change="handleTimezoneChange">
            <el-option label="本地时区" value="local" />
            <el-option label="UTC" value="UTC" />
            <el-option label="Asia/Shanghai" value="Asia/Shanghai" />
            <el-option label="America/New_York" value="America/New_York" />
            <el-option label="Europe/London" value="Europe/London" />
          </el-select>
        </div>
        <div class="option-item">
          <span class="option-label">日期格式：</span>
          <el-select v-model="dateFormat" size="small" @change="handleDateFormatChange">
            <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
            <el-option label="MM/DD/YYYY HH:mm:ss" value="MM/DD/YYYY HH:mm:ss" />
            <el-option label="DD/MM/YYYY HH:mm:ss" value="DD/MM/YYYY HH:mm:ss" />
            <el-option label="相对时间" value="relative" />
          </el-select>
        </div>
        <div class="option-item">
          <el-checkbox v-model="autoRefresh" @change="handleAutoRefreshChange">
            自动刷新
          </el-checkbox>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  VideoPlay,
  ArrowLeft,
  ArrowRight,
  RefreshRight,
  ZoomIn,
  ZoomOut,
  Clock,
  Timer,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTimeRangeStore } from '@/stores/timeRange'
import { useDashboardStore } from '@/stores/dashboard'
import type { QuickTimeRange, TimeRange } from '@/types'
import { formatDuration, formatTimestamp } from '@/utils/format'
import { getCommonTimeRanges } from '@/utils/date'

// Props
interface Props {
  modelValue?: TimeRange
  showPresets?: boolean
  showCustomRange?: boolean
  showRealtimeToggle?: boolean
  showNavigation?: boolean
  showZoom?: boolean
  showDisplay?: boolean
  showRefreshInterval?: boolean
  showAdvanced?: boolean
  size?: 'large' | 'default' | 'small'
  compact?: boolean
  isMobile?: boolean
  clearable?: boolean
  disabledDate?: (date: Date) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPresets: true,
  showCustomRange: true,
  showRealtimeToggle: true,
  showNavigation: true,
  showZoom: false,
  showDisplay: true,
  showRefreshInterval: false,
  showAdvanced: false,
  size: 'default',
  compact: false,
  isMobile: false,
  clearable: true
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: TimeRange]
  change: [value: TimeRange]
  presetChange: [preset: QuickTimeRange]
  realtimeToggle: [enabled: boolean]
  refresh: []
  zoom: [factor: number]
  shift: [direction: 'forward' | 'backward']
}>()

// Stores
const timeRangeStore = useTimeRangeStore()
const dashboardStore = useDashboardStore()
const { timeRange, currentPreset, isRealtime, refreshInterval: storeRefreshInterval } = storeToRefs(timeRangeStore)
const { userPreferences } = storeToRefs(dashboardStore)

// Local state
const customRange = ref<[Date, Date] | null>(null)
const selectedRefreshInterval = ref(storeRefreshInterval.value)
const timezone = ref(userPreferences.value.timezone)
const dateFormat = ref(userPreferences.value.dateFormat)
const autoRefresh = ref(isRealtime.value)

// Presets
const presets = computed(() => getCommonTimeRanges())

// Date picker shortcuts
const datePickerShortcuts = [
  {
    text: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近6小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 6)
      return [start, end]
    }
  },
  {
    text: '最近24小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  }
]

// Refresh intervals
const refreshIntervals = [
  { label: '关闭', value: 0 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 }
]

// Computed
const duration = computed(() => {
  if (props.modelValue) {
    return props.modelValue.end - props.modelValue.start
  }
  return timeRange.value.end - timeRange.value.start
})

const displayLabel = computed(() => {
  const range = props.modelValue || timeRange.value
  if (dateFormat.value === 'relative') {
    return `${formatTimestamp(range.start, 'relative')} - ${formatTimestamp(range.end, 'relative')}`
  }
  return `${formatTimestamp(range.start, 'full')} - ${formatTimestamp(range.end, 'full')}`
})

// Methods
const handlePresetClick = (preset: QuickTimeRange) => {
  timeRangeStore.setPreset(preset)
  emit('presetChange', preset)
  emit('change', timeRange.value)
  ElMessage.success(`已切换到 ${presets.value.find(p => p.value === preset)?.label}`)
}

const handleCustomRangeChange = (value: [Date, Date] | null) => {
  if (value && value[0] && value[1]) {
    const start = value[0].getTime()
    const end = value[1].getTime()
    timeRangeStore.setCustomRange(start, end, '自定义时间范围')
    emit('change', timeRange.value)
    ElMessage.success('已设置自定义时间范围')
  }
}

const handleRealtimeToggle = () => {
  timeRangeStore.toggleRealtime()
  autoRefresh.value = isRealtime.value
  emit('realtimeToggle', isRealtime.value)
  ElMessage.success(isRealtime.value ? '已开启实时模式' : '已关闭实时模式')
}

const handleShiftBackward = () => {
  timeRangeStore.shiftBackward()
  emit('shift', 'backward')
  emit('change', timeRange.value)
}

const handleShiftForward = () => {
  timeRangeStore.shiftForward()
  emit('shift', 'forward')
  emit('change', timeRange.value)
}

const handleRefresh = () => {
  timeRangeStore.refresh()
  emit('refresh')
  emit('change', timeRange.value)
  ElMessage.success('已刷新时间范围')
}

const handleZoomIn = () => {
  timeRangeStore.zoomIn(0.5)
  emit('zoom', 0.5)
  emit('change', timeRange.value)
}

const handleZoomOut = () => {
  timeRangeStore.zoomOut(2)
  emit('zoom', 2)
  emit('change', timeRange.value)
}

const handleRefreshIntervalChange = (value: number) => {
  timeRangeStore.setRefreshInterval(value)
  dashboardStore.updateUserPreferences({ refreshInterval: value })
  ElMessage.success(`刷新间隔已设置为 ${refreshIntervals.find(i => i.value === value)?.label}`)
}

const handleTimezoneChange = (value: string) => {
  dashboardStore.updateUserPreferences({ timezone: value })
  ElMessage.success(`时区已切换到 ${value}`)
}

const handleDateFormatChange = (value: string) => {
  dashboardStore.updateUserPreferences({ dateFormat: value })
  ElMessage.success('日期格式已更新')
}

const handleAutoRefreshChange = (value: boolean) => {
  if (value) {
    timeRangeStore.toggleRealtime()
  } else {
    if (isRealtime.value) {
      timeRangeStore.toggleRealtime()
    }
  }
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    customRange.value = [new Date(newValue.start), new Date(newValue.end)]
  }
}, { immediate: true })

// Sync refresh interval
watch(storeRefreshInterval, (newValue) => {
  selectedRefreshInterval.value = newValue
})

// Initialize
onMounted(() => {
  if (timeRange.value) {
    customRange.value = [new Date(timeRange.value.start), new Date(timeRange.value.end)]
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.time-range-picker {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-wrap: wrap;

  &.is-mobile {
    flex-direction: column;
    align-items: stretch;

    .preset-buttons,
    .custom-range,
    .realtime-toggle,
    .time-navigation,
    .zoom-controls,
    .time-display,
    .refresh-interval {
      width: 100%;
    }
  }
}

.preset-buttons {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;

  .el-button {
    min-width: 60px;
  }
}

.custom-range {
  flex: 1;
  min-width: 300px;

  .el-date-editor {
    width: 100%;
  }
}

.realtime-toggle {
  .el-button {
    &.el-button--success {
      animation: pulse 2s infinite;
    }
  }
}

.time-navigation,
.zoom-controls {
  .el-button-group {
    display: flex;
  }
}

.time-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .el-tag {
    display: flex;
    align-items: center;
    padding: 0 $spacing-sm;
    height: 32px;

    .el-icon {
      margin-right: 4px;
    }
  }
}

.refresh-interval {
  .el-select {
    width: 120px;
  }
}

.advanced-options {
  .option-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;

    &:last-child {
      margin-bottom: 0;
    }

    .option-label {
      font-size: $font-size-small;
      color: $text-color-secondary;
      margin-right: $spacing-sm;
    }

    .el-select {
      flex: 1;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Responsive
@media (max-width: 768px) {
  .time-range-picker {
    .preset-buttons {
      .el-button {
        flex: 1;
        min-width: auto;
      }
    }

    .custom-range {
      min-width: auto;
    }
  }
}

// Dark theme adjustments
:deep(.el-date-editor) {
  background-color: $background-elevated;
  border-color: $border-color-default;

  .el-input__wrapper {
    background-color: $background-elevated;
  }

  .el-range-separator {
    color: $text-color-secondary;
  }
}

:deep(.el-button-group) {
  .el-button {
    border-color: $border-color-default;

    &:hover {
      border-color: $border-color-hover;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
