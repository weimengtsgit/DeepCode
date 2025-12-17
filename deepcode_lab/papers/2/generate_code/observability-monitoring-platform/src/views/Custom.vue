<template>
  <PageContent :is-loading="loading" :has-error="hasError" :error="error" @retry="refresh">
    <!-- Toolbar -->
    <div class="custom-toolbar">
      <div class="toolbar-left">
        <button class="btn btn-primary" @click="showAddChartModal = true">
          <span class="icon">+</span> Add Chart
        </button>
        <button class="btn btn-secondary" @click="showTemplateGallery = true">
          <span class="icon">📋</span> Apply Template
        </button>
        <button class="btn btn-secondary" @click="saveDashboard" :disabled="!isDirty">
          <span class="icon">💾</span> Save
        </button>
        <button class="btn btn-secondary" @click="loadDashboard">
          <span class="icon">📂</span> Load
        </button>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-secondary" @click="undo" :disabled="!canUndo">
          <span class="icon">↶</span> Undo
        </button>
        <button class="btn btn-secondary" @click="redo" :disabled="!canRedo">
          <span class="icon">↷</span> Redo
        </button>
        <button class="btn btn-secondary" @click="resetLayout">
          <span class="icon">🔄</span> Reset
        </button>
      </div>
    </div>

    <!-- Dashboard Grid -->
    <div class="dashboard-grid-wrapper">
      <div class="dashboard-grid" :style="gridStyle">
        <div
          v-for="widget in currentDashboard?.widgets || []"
          :key="widget.id"
          class="grid-item"
          :style="getWidgetStyle(widget)"
          @mousedown="startDrag($event, widget.id)"
          @mousedown.right="showWidgetMenu($event, widget.id)"
        >
          <!-- Widget Header -->
          <div class="widget-header">
            <h3 class="widget-title">{{ widget.title }}</h3>
            <div class="widget-actions">
              <button class="icon-btn" @click="configureWidget(widget)" title="Configure">
                ⚙️
              </button>
              <button class="icon-btn" @click="removeWidget(widget.id)" title="Remove">
                ✕
              </button>
            </div>
          </div>

          <!-- Widget Content (Chart) -->
          <div class="widget-content">
            <component
              :is="getChartComponent(widget.config.chartType)"
              :data="getWidgetData(widget)"
              :config="widget.config"
              :loading="loading"
              :error="error"
            />
          </div>

          <!-- Resize Handle -->
          <div
            class="resize-handle"
            @mousedown.stop="startResize($event, widget.id)"
            title="Drag to resize"
          />
        </div>
      </div>
    </div>

    <!-- Add Chart Modal -->
    <ConfirmDialog
      :is-open="showAddChartModal"
      title="Add Chart to Dashboard"
      @close="showAddChartModal = false"
      @confirm="addChartConfirm"
    >
      <div class="chart-config-form">
        <div class="form-group">
          <label>Chart Type</label>
          <select v-model="newChartConfig.chartType" class="form-control">
            <option value="line-chart">Line Chart</option>
            <option value="bar-chart">Bar Chart</option>
            <option value="pie-chart">Pie Chart</option>
            <option value="gauge-chart">Gauge Chart</option>
            <option value="heatmap-chart">Heatmap Chart</option>
          </select>
        </div>

        <div class="form-group">
          <label>Data Source</label>
          <select v-model="newChartConfig.dataSource" class="form-control">
            <option value="metrics">Metrics</option>
            <option value="traces">Traces</option>
            <option value="logs">Logs</option>
            <option value="alerts">Alerts</option>
          </select>
        </div>

        <div class="form-group">
          <label>Metric/Data</label>
          <select v-model="newChartConfig.metric" class="form-control">
            <option value="cpu_usage">CPU Usage</option>
            <option value="memory_usage">Memory Usage</option>
            <option value="error_rate">Error Rate</option>
            <option value="response_time">Response Time</option>
            <option value="qps">Requests/sec</option>
          </select>
        </div>

        <div class="form-group">
          <label>Title</label>
          <input
            v-model="newChartConfig.title"
            type="text"
            class="form-control"
            placeholder="Chart title"
          />
        </div>
      </div>
    </ConfirmDialog>

    <!-- Template Gallery Modal -->
    <ConfirmDialog
      :is-open="showTemplateGallery"
      title="Select Dashboard Template"
      @close="showTemplateGallery = false"
      @confirm="applyTemplateConfirm"
    >
      <div class="template-gallery">
        <div
          v-for="template in availableTemplates"
          :key="template.id"
          class="template-card"
          :class="{ active: selectedTemplate === template.id }"
          @click="selectedTemplate = template.id"
        >
          <h4>{{ template.name }}</h4>
          <p>{{ template.description }}</p>
          <span class="widget-count">{{ template.widgets.length }} widgets</span>
        </div>
      </div>
    </ConfirmDialog>

    <!-- Widget Configuration Drawer -->
    <InfoDrawer
      :is-open="showWidgetConfig"
      title="Configure Widget"
      @close="showWidgetConfig = false"
      @primary-action="saveWidgetConfig"
    >
      <div class="widget-config-form">
        <div class="form-group">
          <label>Title</label>
          <input
            v-model="editingWidget.title"
            type="text"
            class="form-control"
            placeholder="Widget title"
          />
        </div>

        <div class="form-group">
          <label>Refresh Interval (seconds)</label>
          <input
            v-model.number="editingWidget.config.refreshInterval"
            type="number"
            class="form-control"
            min="5"
            max="3600"
          />
        </div>

        <div class="form-group">
          <label>Show Legend</label>
          <input
            v-model="editingWidget.config.showLegend"
            type="checkbox"
            class="form-checkbox"
          />
        </div>

        <div class="form-group">
          <label>Show Grid</label>
          <input
            v-model="editingWidget.config.showGrid"
            type="checkbox"
            class="form-checkbox"
          />
        </div>
      </div>
    </InfoDrawer>

    <!-- Dashboard Name Input -->
    <div v-if="showDashboardNameInput" class="dashboard-name-input">
      <input
        v-model="dashboardName"
        type="text"
        class="form-control"
        placeholder="Dashboard name"
        @keyup.enter="confirmDashboardName"
        @keyup.escape="showDashboardNameInput = false"
      />
      <button class="btn btn-primary btn-sm" @click="confirmDashboardName">Save</button>
      <button class="btn btn-secondary btn-sm" @click="showDashboardNameInput = false">
        Cancel
      </button>
    </div>
  </PageContent>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useUIStore } from '@/stores/uiStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { useMetrics } from '@/composables/useMetrics'
import { useLogs } from '@/composables/useLogs'
import { useTraces } from '@/composables/useTraces'
import PageContent from '@/components/Layout/PageContent.vue'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import InfoDrawer from '@/components/Common/InfoDrawer.vue'
import LineChart from '@/components/Charts/LineChart.vue'
import BarChart from '@/components/Charts/BarChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'
import GaugeChart from '@/components/Charts/GaugeChart.vue'
import HeatmapChart from '@/components/Charts/HeatmapChart.vue'
import type { DashboardWidget, DashboardConfig } from '@/types/dashboard'

// Stores
const dashboardStore = useDashboardStore()
const uiStore = useUIStore()
const timeStore = useTimeStore()
const filterStore = useFilterStore()
const router = useRouter()

// Composables
const { widgets, addWidget, removeWidget, moveWidget, resizeWidget, undo, redo, clearLayout } =
  useDashboardLayout()
const { data: metricsData, loading: metricsLoading } = useMetrics()
const { logs: logsData, loading: logsLoading } = useLogs()
const { filteredTraces: tracesData, loading: tracesLoading } = useTraces()

// State
const loading = ref(false)
const error = ref<Error | null>(null)
const isDirty = ref(false)
const showAddChartModal = ref(false)
const showTemplateGallery = ref(false)
const showWidgetConfig = ref(false)
const showDashboardNameInput = ref(false)
const dashboardName = ref('')
const selectedTemplate = ref('')
const draggedWidget = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const resizingWidget = ref<string | null>(null)

// New chart configuration
const newChartConfig = ref({
  chartType: 'line-chart',
  dataSource: 'metrics',
  metric: 'cpu_usage',
  title: 'New Chart',
  refreshInterval: 10,
  showLegend: true,
  showGrid: true
})

// Editing widget
const editingWidget = ref<DashboardWidget | null>(null)

// Available templates
const availableTemplates = [
  {
    id: 'application-monitoring',
    name: 'Application Monitoring',
    description: 'Monitor application performance metrics',
    widgets: [
      { title: 'Error Rate', chartType: 'line-chart', metric: 'error_rate' },
      { title: 'Response Time', chartType: 'line-chart', metric: 'response_time' },
      { title: 'Requests/sec', chartType: 'gauge-chart', metric: 'qps' },
      { title: 'Service Health', chartType: 'pie-chart', metric: 'service_status' }
    ]
  },
  {
    id: 'infrastructure-monitoring',
    name: 'Infrastructure Monitoring',
    description: 'Monitor system resources',
    widgets: [
      { title: 'CPU Usage', chartType: 'line-chart', metric: 'cpu_usage' },
      { title: 'Memory Usage', chartType: 'line-chart', metric: 'memory_usage' },
      { title: 'Disk I/O', chartType: 'bar-chart', metric: 'disk_io' },
      { title: 'Network Bandwidth', chartType: 'heatmap-chart', metric: 'network_bandwidth' }
    ]
  },
  {
    id: 'business-metrics',
    name: 'Business Metrics',
    description: 'Track business KPIs',
    widgets: [
      { title: 'Revenue', chartType: 'gauge-chart', metric: 'revenue' },
      { title: 'Conversion Rate', chartType: 'pie-chart', metric: 'conversion_rate' },
      { title: 'User Growth', chartType: 'line-chart', metric: 'user_growth' },
      { title: 'Transaction Volume', chartType: 'bar-chart', metric: 'transaction_volume' }
    ]
  }
]

// Computed properties
const currentDashboard = computed(() => dashboardStore.currentDashboard)
const canUndo = computed(() => true) // Implement undo history tracking
const canRedo = computed(() => true) // Implement redo history tracking

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '16px',
  padding: '16px'
}))

// Methods
const getWidgetStyle = (widget: DashboardWidget) => ({
  gridColumn: `${widget.position.x} / span ${widget.position.width}`,
  gridRow: `${widget.position.y} / span ${widget.position.height}`,
  position: 'relative',
  backgroundColor: 'var(--color-bg-secondary)',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  padding: '12px',
  cursor: draggedWidget.value === widget.id ? 'grabbing' : 'grab'
})

const getChartComponent = (chartType: string) => {
  const components: Record<string, any> = {
    'line-chart': LineChart,
    'bar-chart': BarChart,
    'pie-chart': PieChart,
    'gauge-chart': GaugeChart,
    'heatmap-chart': HeatmapChart
  }
  return components[chartType] || LineChart
}

const getWidgetData = (widget: DashboardWidget) => {
  switch (widget.config.dataSource) {
    case 'metrics':
      return metricsData.value
    case 'logs':
      return logsData.value
    case 'traces':
      return tracesData.value
    default:
      return []
  }
}

const startDrag = (event: MouseEvent, widgetId: string) => {
  draggedWidget.value = widgetId
  dragOffset.value = {
    x: event.clientX,
    y: event.clientY
  }
}

const startResize = (event: MouseEvent, widgetId: string) => {
  resizingWidget.value = widgetId
}

const showWidgetMenu = (event: MouseEvent, widgetId: string) => {
  event.preventDefault()
  // Show context menu (optional)
}

const configureWidget = (widget: DashboardWidget) => {
  editingWidget.value = { ...widget }
  showWidgetConfig.value = true
}

const saveWidgetConfig = () => {
  if (editingWidget.value) {
    // Update widget in store
    dashboardStore.updateWidget(
      currentDashboard.value?.id || '',
      editingWidget.value.id,
      editingWidget.value
    )
    showWidgetConfig.value = false
    isDirty.value = true
  }
}

const addChartConfirm = () => {
  if (currentDashboard.value) {
    const newWidget: Omit<DashboardWidget, 'id'> = {
      type: 'chart',
      title: newChartConfig.value.title,
      position: { x: 1, y: 1, width: 6, height: 3 },
      config: {
        dataSource: newChartConfig.value.dataSource as any,
        metric: newChartConfig.value.metric,
        chartType: newChartConfig.value.chartType as any,
        refreshInterval: newChartConfig.value.refreshInterval,
        showLegend: newChartConfig.value.showLegend,
        showGrid: newChartConfig.value.showGrid
      }
    }

    dashboardStore.addWidget(currentDashboard.value.id, newWidget)
    showAddChartModal.value = false
    isDirty.value = true

    // Reset form
    newChartConfig.value = {
      chartType: 'line-chart',
      dataSource: 'metrics',
      metric: 'cpu_usage',
      title: 'New Chart',
      refreshInterval: 10,
      showLegend: true,
      showGrid: true
    }
  }
}

const applyTemplateConfirm = () => {
  const template = availableTemplates.find((t) => t.id === selectedTemplate.value)
  if (template && currentDashboard.value) {
    // Clear existing widgets
    dashboardStore.clearWidgets(currentDashboard.value.id)

    // Add template widgets
    template.widgets.forEach((widgetConfig, index) => {
      const newWidget: Omit<DashboardWidget, 'id'> = {
        type: 'chart',
        title: widgetConfig.title,
        position: {
          x: (index % 2) * 6 + 1,
          y: Math.floor(index / 2) * 3 + 1,
          width: 6,
          height: 3
        },
        config: {
          dataSource: 'metrics',
          metric: widgetConfig.metric,
          chartType: widgetConfig.chartType as any,
          refreshInterval: 10,
          showLegend: true,
          showGrid: true
        }
      }

      dashboardStore.addWidget(currentDashboard.value!.id, newWidget)
    })

    showTemplateGallery.value = false
    isDirty.value = true
  }
}

const saveDashboard = () => {
  showDashboardNameInput.value = true
}

const confirmDashboardName = () => {
  if (dashboardName.value && currentDashboard.value) {
    dashboardStore.updateDashboard(currentDashboard.value.id, {
      name: dashboardName.value
    })
    showDashboardNameInput.value = false
    isDirty.value = false
  }
}

const loadDashboard = () => {
  // Show load dialog (optional)
  // For now, just load the default dashboard
  const dashboards = dashboardStore.dashboardList
  if (dashboards.length > 0) {
    dashboardStore.setCurrentDashboard(dashboards[0].id)
  }
}

const resetLayout = () => {
  if (currentDashboard.value) {
    dashboardStore.clearWidgets(currentDashboard.value.id)
    isDirty.value = true
  }
}

const refresh = async () => {
  loading.value = true
  try {
    // Refresh all data
    await Promise.all([
      // Trigger data refresh in composables
    ])
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err : new Error('Failed to refresh')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Load default dashboard if none selected
  if (!currentDashboard.value && dashboardStore.dashboardList.length > 0) {
    dashboardStore.setCurrentDashboard(dashboardStore.dashboardList[0].id)
  } else if (!currentDashboard.value) {
    // Create default dashboard
    const newDashboard = dashboardStore.createDashboard('My Dashboard')
    dashboardStore.setCurrentDashboard(newDashboard.id)
  }
})

onUnmounted(() => {
  // Cleanup
  draggedWidget.value = null
  resizingWidget.value = null
})

// Watch for dirty state
watch(
  () => currentDashboard.value?.widgets,
  () => {
    isDirty.value = true
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.custom-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  gap: $spacing-md;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: $spacing-sm;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    border: 1px solid var(--color-border);
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all $transition-normal ease-out;

    &:hover:not(:disabled) {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon {
      font-size: 1.2em;
    }
  }
}

.dashboard-grid-wrapper {
  flex: 1;
  overflow: auto;
  background-color: var(--color-bg-primary);
}

.dashboard-grid {
  min-height: 100%;
  background-color: var(--color-bg-primary);
}

.grid-item {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: $border-radius-md;
  overflow: hidden;
  transition: all $transition-normal ease-out;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: var(--color-primary);
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md;
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-bg-tertiary);

    .widget-title {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .widget-actions {
      display: flex;
      gap: $spacing-xs;

      .icon-btn {
        background: none;
        border: none;
        color: var(--color-text-secondary);
        cursor: pointer;
        font-size: 1.2em;
        transition: color $transition-normal ease-out;

        &:hover {
          color: var(--color-primary);
        }
      }
    }
  }

  .widget-content {
    flex: 1;
    padding: $spacing-md;
    overflow: auto;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, transparent 50%, var(--color-primary) 50%);
    cursor: nwse-resize;
    opacity: 0;
    transition: opacity $transition-normal ease-out;
  }

  &:hover .resize-handle {
    opacity: 1;
  }
}

.chart-config-form,
.widget-config-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    label {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 0.9em;
    }

    .form-control {
      padding: $spacing-sm;
      border: 1px solid var(--color-border);
      border-radius: $border-radius-md;
      background-color: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      font-size: 0.95em;

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(50, 116, 217, 0.1);
      }
    }

    .form-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }
  }
}

.template-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;

  .template-card {
    padding: $spacing-md;
    border: 2px solid var(--color-border);
    border-radius: $border-radius-md;
    background-color: var(--color-bg-tertiary);
    cursor: pointer;
    transition: all $transition-normal ease-out;

    &:hover {
      border-color: var(--color-primary);
      background-color: var(--color-bg-secondary);
    }

    &.active {
      border-color: var(--color-primary);
      background-color: rgba(50, 116, 217, 0.1);
    }

    h4 {
      margin: 0 0 $spacing-xs 0;
      color: var(--color-text-primary);
      font-size: 1.1em;
    }

    p {
      margin: 0 0 $spacing-sm 0;
      color: var(--color-text-secondary);
      font-size: 0.9em;
    }

    .widget-count {
      display: inline-block;
      padding: $spacing-xs $spacing-sm;
      background-color: var(--color-primary);
      color: white;
      border-radius: $border-radius-sm;
      font-size: 0.85em;
      font-weight: 600;
    }
  }
}

.dashboard-name-input {
  position: fixed;
  bottom: $spacing-lg;
  right: $spacing-lg;
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: $border-radius-md;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;

  .form-control {
    padding: $spacing-sm;
    border: 1px solid var(--color-border);
    border-radius: $border-radius-md;
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    min-width: 200px;
  }

  .btn {
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    border: 1px solid var(--color-border);
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all $transition-normal ease-out;

    &:hover {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }

    &.btn-sm {
      padding: $spacing-xs $spacing-sm;
      font-size: 0.9em;
    }
  }
}

@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: repeat(6, 1fr) !important;
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .custom-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .grid-item {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
  }
}
</style>
