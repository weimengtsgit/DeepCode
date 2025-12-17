import { ref, computed, watch, Ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useLocalStorage } from './useLocalStorage'
import type { DashboardWidget, DashboardConfig } from '@/types'

/**
 * Configuration for grid layout system
 */
interface GridConfig {
  columns: number // 12-column grid
  minWidth: number // Minimum widget width in grid units (2)
  maxWidth: number // Maximum widget width in grid units (12)
  minHeight: number // Minimum widget height in grid units (2)
  maxHeight: number // Maximum widget height in grid units (4)
  gap: number // Gap between widgets in pixels (16)
  cellHeight: number // Height of single grid cell in pixels (60)
}

/**
 * Widget position and size
 */
interface WidgetPosition {
  x: number // Column position (0-11)
  y: number // Row position
  width: number // Width in grid units (2-12)
  height: number // Height in grid units (2-4)
}

/**
 * Undo/redo history entry
 */
interface HistoryEntry {
  widgets: DashboardWidget[]
  timestamp: number
}

/**
 * Main composable for dashboard layout management with drag-drop, resize, undo/redo
 */
export function useDashboardLayout() {
  const dashboardStore = useDashboardStore()
  const { saveToLocalStorage, loadFromLocalStorage } = useLocalStorage()

  // Grid configuration
  const gridConfig: GridConfig = {
    columns: 12,
    minWidth: 2,
    maxWidth: 12,
    minHeight: 2,
    maxHeight: 4,
    gap: 16,
    cellHeight: 60,
  }

  // State
  const widgets: Ref<DashboardWidget[]> = ref([])
  const isDragging: Ref<boolean> = ref(false)
  const draggedWidgetId: Ref<string | null> = ref(null)
  const dragOffset: Ref<{ x: number; y: number }> = ref({ x: 0, y: 0 })
  const isResizing: Ref<boolean> = ref(false)
  const resizingWidgetId: Ref<string | null> = ref(null)
  const history: Ref<HistoryEntry[]> = ref([])
  const historyIndex: Ref<number> = ref(-1)

  /**
   * Calculate grid position from pixel coordinates
   */
  function pixelsToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
    const cellWidth = (window.innerWidth - gridConfig.gap * (gridConfig.columns + 1)) / gridConfig.columns
    const x = Math.floor((pixelX + gridConfig.gap) / (cellWidth + gridConfig.gap))
    const y = Math.floor((pixelY + gridConfig.gap) / (gridConfig.cellHeight + gridConfig.gap))
    return {
      x: Math.max(0, Math.min(x, gridConfig.columns - 1)),
      y: Math.max(0, y),
    }
  }

  /**
   * Calculate pixel coordinates from grid position
   */
  function gridToPixels(gridX: number, gridWidth: number, gridY: number): { x: number; y: number } {
    const cellWidth = (window.innerWidth - gridConfig.gap * (gridConfig.columns + 1)) / gridConfig.columns
    const x = gridX * (cellWidth + gridConfig.gap) + gridConfig.gap
    const y = gridY * (gridConfig.cellHeight + gridConfig.gap) + gridConfig.gap
    return { x, y }
  }

  /**
   * Check if widget position overlaps with existing widgets
   */
  function hasOverlap(
    newWidget: WidgetPosition,
    excludeId?: string,
  ): boolean {
    return widgets.value.some((w) => {
      if (excludeId && w.id === excludeId) return false

      const pos = w.position as WidgetPosition
      return !(
        newWidget.x + newWidget.width <= pos.x ||
        newWidget.x >= pos.x + pos.width ||
        newWidget.y + newWidget.height <= pos.y ||
        newWidget.y >= pos.y + pos.height
      )
    })
  }

  /**
   * Find next available position for widget
   */
  function findNextAvailablePosition(width: number, height: number): WidgetPosition {
    let y = 0
    let found = false

    while (!found) {
      for (let x = 0; x <= gridConfig.columns - width; x++) {
        const newPos: WidgetPosition = { x, y, width, height }
        if (!hasOverlap(newPos)) {
          found = true
          return newPos
        }
      }
      y++
    }

    return { x: 0, y, width, height }
  }

  /**
   * Add widget to dashboard
   */
  function addWidget(widget: Omit<DashboardWidget, 'id' | 'position'>): DashboardWidget {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: findNextAvailablePosition(4, 2), // Default 4x2 size
    }

    widgets.value.push(newWidget)
    saveHistory()
    persistLayout()

    return newWidget
  }

  /**
   * Remove widget from dashboard
   */
  function removeWidget(widgetId: string): void {
    const index = widgets.value.findIndex((w) => w.id === widgetId)
    if (index !== -1) {
      widgets.value.splice(index, 1)
      saveHistory()
      persistLayout()
    }
  }

  /**
   * Move widget to new position
   */
  function moveWidget(widgetId: string, newX: number, newY: number): void {
    const widget = widgets.value.find((w) => w.id === widgetId)
    if (!widget) return

    const pos = widget.position as WidgetPosition
    const newPos: WidgetPosition = {
      x: Math.max(0, Math.min(newX, gridConfig.columns - pos.width)),
      y: Math.max(0, newY),
      width: pos.width,
      height: pos.height,
    }

    // Check for overlap and adjust if needed
    if (hasOverlap(newPos, widgetId)) {
      return // Don't move if it would overlap
    }

    widget.position = newPos
    persistLayout()
  }

  /**
   * Resize widget
   */
  function resizeWidget(widgetId: string, newWidth: number, newHeight: number): void {
    const widget = widgets.value.find((w) => w.id === widgetId)
    if (!widget) return

    const pos = widget.position as WidgetPosition

    // Validate bounds
    const width = Math.max(gridConfig.minWidth, Math.min(newWidth, gridConfig.maxWidth))
    const height = Math.max(gridConfig.minHeight, Math.min(newHeight, gridConfig.maxHeight))

    // Ensure widget doesn't exceed grid bounds
    const constrainedWidth = Math.min(width, gridConfig.columns - pos.x)

    const newPos: WidgetPosition = {
      ...pos,
      width: constrainedWidth,
      height,
    }

    // Check for overlap
    if (hasOverlap(newPos, widgetId)) {
      return // Don't resize if it would overlap
    }

    widget.position = newPos
    persistLayout()
  }

  /**
   * Start dragging widget
   */
  function startDrag(widgetId: string, event: MouseEvent): void {
    isDragging.value = true
    draggedWidgetId.value = widgetId

    const widget = widgets.value.find((w) => w.id === widgetId)
    if (!widget) return

    const pos = widget.position as WidgetPosition
    const cellWidth = (window.innerWidth - gridConfig.gap * (gridConfig.columns + 1)) / gridConfig.columns
    const pixelX = pos.x * (cellWidth + gridConfig.gap) + gridConfig.gap
    const pixelY = pos.y * (gridConfig.cellHeight + gridConfig.gap) + gridConfig.gap

    dragOffset.value = {
      x: event.clientX - pixelX,
      y: event.clientY - pixelY,
    }
  }

  /**
   * Handle drag movement
   */
  function handleDrag(event: MouseEvent): void {
    if (!isDragging.value || !draggedWidgetId.value) return

    const pixelX = event.clientX - dragOffset.value.x
    const pixelY = event.clientY - dragOffset.value.y
    const gridPos = pixelsToGrid(pixelX, pixelY)

    moveWidget(draggedWidgetId.value, gridPos.x, gridPos.y)
  }

  /**
   * End dragging
   */
  function endDrag(): void {
    if (isDragging.value) {
      saveHistory()
    }
    isDragging.value = false
    draggedWidgetId.value = null
  }

  /**
   * Start resizing widget
   */
  function startResize(widgetId: string, event: MouseEvent): void {
    event.preventDefault()
    isResizing.value = true
    resizingWidgetId.value = widgetId
  }

  /**
   * Handle resize movement
   */
  function handleResize(event: MouseEvent): void {
    if (!isResizing.value || !resizingWidgetId.value) return

    const widget = widgets.value.find((w) => w.id === resizingWidgetId.value)
    if (!widget) return

    const pos = widget.position as WidgetPosition
    const cellWidth = (window.innerWidth - gridConfig.gap * (gridConfig.columns + 1)) / gridConfig.columns

    // Calculate new width based on mouse movement
    const containerRect = document.querySelector('[data-dashboard-grid]')?.getBoundingClientRect()
    if (!containerRect) return

    const relativeX = event.clientX - containerRect.left
    const newWidth = Math.round((relativeX - pos.x * (cellWidth + gridConfig.gap) - gridConfig.gap) / (cellWidth + gridConfig.gap))

    resizeWidget(resizingWidgetId.value, newWidth, pos.height)
  }

  /**
   * End resizing
   */
  function endResize(): void {
    if (isResizing.value) {
      saveHistory()
    }
    isResizing.value = false
    resizingWidgetId.value = null
  }

  /**
   * Save current state to history
   */
  function saveHistory(): void {
    // Remove any redo history if we're making a new change
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Add new history entry
    history.value.push({
      widgets: JSON.parse(JSON.stringify(widgets.value)),
      timestamp: Date.now(),
    })

    // Limit history to 50 entries
    if (history.value.length > 50) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  /**
   * Undo last action
   */
  function undo(): void {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const entry = history.value[historyIndex.value]
      widgets.value = JSON.parse(JSON.stringify(entry.widgets))
      persistLayout()
    }
  }

  /**
   * Redo last undone action
   */
  function redo(): void {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const entry = history.value[historyIndex.value]
      widgets.value = JSON.parse(JSON.stringify(entry.widgets))
      persistLayout()
    }
  }

  /**
   * Check if undo is available
   */
  const canUndo = computed(() => historyIndex.value > 0)

  /**
   * Check if redo is available
   */
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  /**
   * Persist layout to localStorage
   */
  function persistLayout(): void {
    const dashboardId = dashboardStore.currentDashboardId
    if (!dashboardId) return

    const layoutData = {
      dashboardId,
      widgets: widgets.value,
      timestamp: Date.now(),
    }

    saveToLocalStorage(`dashboard_layout_${dashboardId}`, layoutData)
  }

  /**
   * Load layout from localStorage
   */
  function loadLayout(dashboardId: string): void {
    const layoutData = loadFromLocalStorage(`dashboard_layout_${dashboardId}`)
    if (layoutData && layoutData.widgets) {
      widgets.value = layoutData.widgets
      history.value = [{ widgets: JSON.parse(JSON.stringify(widgets.value)), timestamp: Date.now() }]
      historyIndex.value = 0
    }
  }

  /**
   * Clear all widgets
   */
  function clearLayout(): void {
    widgets.value = []
    history.value = [{ widgets: [], timestamp: Date.now() }]
    historyIndex.value = 0
    persistLayout()
  }

  /**
   * Export layout as JSON
   */
  function exportLayout(): string {
    return JSON.stringify(
      {
        version: '1.0',
        widgets: widgets.value,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    )
  }

  /**
   * Import layout from JSON
   */
  function importLayout(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)
      if (!data.widgets || !Array.isArray(data.widgets)) {
        return false
      }

      widgets.value = data.widgets
      saveHistory()
      persistLayout()
      return true
    } catch (error) {
      console.error('Failed to import layout:', error)
      return false
    }
  }

  /**
   * Get widget by ID
   */
  function getWidget(widgetId: string): DashboardWidget | undefined {
    return widgets.value.find((w) => w.id === widgetId)
  }

  /**
   * Get all widgets
   */
  function getAllWidgets(): DashboardWidget[] {
    return widgets.value
  }

  /**
   * Calculate grid height based on widgets
   */
  const gridHeight = computed(() => {
    if (widgets.value.length === 0) return gridConfig.cellHeight * 4

    const maxY = Math.max(...widgets.value.map((w) => {
      const pos = w.position as WidgetPosition
      return pos.y + pos.height
    }))

    return maxY * (gridConfig.cellHeight + gridConfig.gap) + gridConfig.gap
  })

  /**
   * Watch for dashboard changes and load layout
   */
  watch(
    () => dashboardStore.currentDashboardId,
    (newId) => {
      if (newId) {
        loadLayout(newId)
      }
    },
  )

  return {
    // State
    widgets,
    isDragging,
    draggedWidgetId,
    isResizing,
    resizingWidgetId,
    gridConfig,
    gridHeight,

    // Widget operations
    addWidget,
    removeWidget,
    moveWidget,
    resizeWidget,
    getWidget,
    getAllWidgets,

    // Drag operations
    startDrag,
    handleDrag,
    endDrag,

    // Resize operations
    startResize,
    handleResize,
    endResize,

    // History operations
    undo,
    redo,
    canUndo,
    canRedo,

    // Layout operations
    clearLayout,
    exportLayout,
    importLayout,
    persistLayout,
    loadLayout,

    // Utilities
    pixelsToGrid,
    gridToPixels,
  }
}

/**
 * Composable for dashboard template management
 */
export function useDashboardTemplates() {
  const templates = {
    applicationMonitoring: {
      name: 'Application Monitoring',
      description: 'Monitor application health, performance, and errors',
      widgets: [
        {
          type: 'line-chart',
          title: 'Error Rate Trend',
          config: { metric: 'ERROR_RATE', timeRange: 'last_24h' },
          position: { x: 0, y: 0, width: 6, height: 2 },
        },
        {
          type: 'line-chart',
          title: 'Response Time (P99)',
          config: { metric: 'P99_LATENCY', timeRange: 'last_24h' },
          position: { x: 6, y: 0, width: 6, height: 2 },
        },
        {
          type: 'bar-chart',
          title: 'Requests Per Second',
          config: { metric: 'QPS', timeRange: 'last_24h' },
          position: { x: 0, y: 2, width: 6, height: 2 },
        },
        {
          type: 'gauge-chart',
          title: 'Success Rate',
          config: { metric: 'SUCCESS_RATE', timeRange: 'last_1h' },
          position: { x: 6, y: 2, width: 6, height: 2 },
        },
      ],
    },
    infrastructureMonitoring: {
      name: 'Infrastructure Monitoring',
      description: 'Monitor system resources and infrastructure health',
      widgets: [
        {
          type: 'line-chart',
          title: 'CPU Usage',
          config: { metric: 'CPU_USAGE', timeRange: 'last_24h' },
          position: { x: 0, y: 0, width: 6, height: 2 },
        },
        {
          type: 'line-chart',
          title: 'Memory Usage',
          config: { metric: 'MEMORY_USAGE', timeRange: 'last_24h' },
          position: { x: 6, y: 0, width: 6, height: 2 },
        },
        {
          type: 'bar-chart',
          title: 'Disk I/O',
          config: { metric: 'DISK_IO', timeRange: 'last_24h' },
          position: { x: 0, y: 2, width: 6, height: 2 },
        },
        {
          type: 'line-chart',
          title: 'Network Bandwidth',
          config: { metric: 'NETWORK_BANDWIDTH', timeRange: 'last_24h' },
          position: { x: 6, y: 2, width: 6, height: 2 },
        },
      ],
    },
    businessMetrics: {
      name: 'Business Metrics',
      description: 'Monitor business-critical KPIs and user experience',
      widgets: [
        {
          type: 'gauge-chart',
          title: 'Availability',
          config: { metric: 'SUCCESS_RATE', timeRange: 'last_1h' },
          position: { x: 0, y: 0, width: 4, height: 2 },
        },
        {
          type: 'gauge-chart',
          title: 'Performance',
          config: { metric: 'P99_LATENCY', timeRange: 'last_1h' },
          position: { x: 4, y: 0, width: 4, height: 2 },
        },
        {
          type: 'gauge-chart',
          title: 'Error Rate',
          config: { metric: 'ERROR_RATE', timeRange: 'last_1h' },
          position: { x: 8, y: 0, width: 4, height: 2 },
        },
        {
          type: 'line-chart',
          title: 'Throughput Trend',
          config: { metric: 'QPS', timeRange: 'last_24h' },
          position: { x: 0, y: 2, width: 12, height: 2 },
        },
      ],
    },
  }

  /**
   * Get template by name
   */
  function getTemplate(name: string) {
    return templates[name as keyof typeof templates]
  }

  /**
   * Get all available templates
   */
  function getAllTemplates() {
    return Object.values(templates)
  }

  /**
   * Apply template to dashboard
   */
  function applyTemplate(templateName: string, dashboardLayout: ReturnType<typeof useDashboardLayout>) {
    const template = getTemplate(templateName)
    if (!template) return false

    dashboardLayout.clearLayout()

    template.widgets.forEach((widget) => {
      dashboardLayout.addWidget({
        type: widget.type,
        title: widget.title,
        config: widget.config,
      })
    })

    return true
  }

  return {
    getTemplate,
    getAllTemplates,
    applyTemplate,
  }
}
