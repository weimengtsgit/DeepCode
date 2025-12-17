import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DashboardConfig,
  DashboardWidget,
  UserPreferences,
} from '@/types'
import { useLocalStorage } from '@/composables/useLocalStorage'

/**
 * Dashboard Store State Interface
 */
export interface DashboardState {
  currentDashboard: DashboardConfig | null
  dashboards: DashboardConfig[]
  userPreferences: UserPreferences
  isEditMode: boolean
  selectedWidgetId: string | null
}

/**
 * Default User Preferences
 */
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'dark',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  defaultTimeRange: '15m',
  refreshInterval: 30000,
  dashboardLayout: 'grid',
  favoriteServices: [],
}

/**
 * Default Dashboard Configuration
 */
const createDefaultDashboard = (): DashboardConfig => ({
  id: 'default',
  name: 'Overview Dashboard',
  description: 'Default observability dashboard with key metrics',
  widgets: [
    {
      id: 'widget-1',
      type: 'metric-card',
      title: 'Total QPS',
      config: {
        metricType: 'qps',
        aggregation: 'sum',
      },
      layout: { x: 0, y: 0, w: 3, h: 2 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-2',
      type: 'metric-card',
      title: 'Avg Latency (P99)',
      config: {
        metricType: 'p99',
        aggregation: 'avg',
      },
      layout: { x: 3, y: 0, w: 3, h: 2 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-3',
      type: 'metric-card',
      title: 'Error Rate',
      config: {
        metricType: 'error_rate',
        aggregation: 'avg',
      },
      layout: { x: 6, y: 0, w: 3, h: 2 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-4',
      type: 'metric-card',
      title: 'Active Alerts',
      config: {
        metricType: 'alert_count',
      },
      layout: { x: 9, y: 0, w: 3, h: 2 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-5',
      type: 'line-chart',
      title: 'QPS Trend',
      config: {
        metricType: 'qps',
        chartType: 'line',
        showLegend: true,
      },
      layout: { x: 0, y: 2, w: 6, h: 4 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-6',
      type: 'line-chart',
      title: 'Latency Percentiles',
      config: {
        metricType: 'latency',
        chartType: 'line',
        showLegend: true,
      },
      layout: { x: 6, y: 2, w: 6, h: 4 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-7',
      type: 'bar-chart',
      title: 'Error Rate by Service',
      config: {
        metricType: 'error_rate',
        chartType: 'bar',
      },
      layout: { x: 0, y: 6, w: 6, h: 4 },
      refreshInterval: 30000,
    },
    {
      id: 'widget-8',
      type: 'pie-chart',
      title: 'Service Health Status',
      config: {
        metricType: 'service_status',
        chartType: 'pie',
      },
      layout: { x: 6, y: 6, w: 6, h: 4 },
      refreshInterval: 30000,
    },
  ],
  layout: 'grid',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isDefault: true,
})

/**
 * Dashboard Store
 * Manages dashboard configurations, widgets, and user preferences
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // ==================== State ====================
  
  // Use localStorage for persistence
  const dashboards = useLocalStorage<DashboardConfig[]>(
    'observability-dashboards',
    [createDefaultDashboard()]
  )
  
  const currentDashboardId = useLocalStorage<string>(
    'observability-current-dashboard',
    'default'
  )
  
  const userPreferences = useLocalStorage<UserPreferences>(
    'observability-user-preferences',
    DEFAULT_USER_PREFERENCES
  )
  
  const isEditMode = ref(false)
  const selectedWidgetId = ref<string | null>(null)

  // ==================== Computed ====================
  
  const currentDashboard = computed<DashboardConfig | null>(() => {
    return dashboards.value.find(d => d.id === currentDashboardId.value) || null
  })
  
  const allDashboards = computed(() => dashboards.value)
  
  const defaultDashboard = computed(() => {
    return dashboards.value.find(d => d.isDefault) || null
  })
  
  const customDashboards = computed(() => {
    return dashboards.value.filter(d => !d.isDefault)
  })
  
  const currentWidgets = computed(() => {
    return currentDashboard.value?.widgets || []
  })
  
  const selectedWidget = computed(() => {
    if (!selectedWidgetId.value || !currentDashboard.value) return null
    return currentDashboard.value.widgets.find(w => w.id === selectedWidgetId.value) || null
  })

  // ==================== Dashboard Actions ====================
  
  /**
   * Set current dashboard
   */
  const setCurrentDashboard = (dashboardId: string) => {
    const dashboard = dashboards.value.find(d => d.id === dashboardId)
    if (dashboard) {
      currentDashboardId.value = dashboardId
    }
  }
  
  /**
   * Create new dashboard
   */
  const createDashboard = (config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDashboard: DashboardConfig = {
      ...config,
      id: `dashboard-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    dashboards.value.push(newDashboard)
    return newDashboard
  }
  
  /**
   * Update dashboard
   */
  const updateDashboard = (dashboardId: string, updates: Partial<DashboardConfig>) => {
    const index = dashboards.value.findIndex(d => d.id === dashboardId)
    if (index !== -1) {
      dashboards.value[index] = {
        ...dashboards.value[index],
        ...updates,
        updatedAt: Date.now(),
      }
    }
  }
  
  /**
   * Delete dashboard
   */
  const deleteDashboard = (dashboardId: string) => {
    const index = dashboards.value.findIndex(d => d.id === dashboardId)
    if (index !== -1 && !dashboards.value[index].isDefault) {
      dashboards.value.splice(index, 1)
      // Switch to default if current was deleted
      if (currentDashboardId.value === dashboardId) {
        currentDashboardId.value = 'default'
      }
    }
  }
  
  /**
   * Duplicate dashboard
   */
  const duplicateDashboard = (dashboardId: string) => {
    const dashboard = dashboards.value.find(d => d.id === dashboardId)
    if (dashboard) {
      const newDashboard: DashboardConfig = {
        ...dashboard,
        id: `dashboard-${Date.now()}`,
        name: `${dashboard.name} (Copy)`,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        widgets: dashboard.widgets.map(w => ({
          ...w,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
      }
      dashboards.value.push(newDashboard)
      return newDashboard
    }
    return null
  }

  // ==================== Widget Actions ====================
  
  /**
   * Add widget to current dashboard
   */
  const addWidget = (widget: Omit<DashboardWidget, 'id'>) => {
    if (!currentDashboard.value) return null
    
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    
    const updatedWidgets = [...currentDashboard.value.widgets, newWidget]
    updateDashboard(currentDashboard.value.id, { widgets: updatedWidgets })
    
    return newWidget
  }
  
  /**
   * Update widget
   */
  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!currentDashboard.value) return
    
    const widgets = currentDashboard.value.widgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    )
    
    updateDashboard(currentDashboard.value.id, { widgets })
  }
  
  /**
   * Delete widget
   */
  const deleteWidget = (widgetId: string) => {
    if (!currentDashboard.value) return
    
    const widgets = currentDashboard.value.widgets.filter(w => w.id !== widgetId)
    updateDashboard(currentDashboard.value.id, { widgets })
    
    if (selectedWidgetId.value === widgetId) {
      selectedWidgetId.value = null
    }
  }
  
  /**
   * Update widget layout
   */
  const updateWidgetLayout = (widgetId: string, layout: DashboardWidget['layout']) => {
    updateWidget(widgetId, { layout })
  }
  
  /**
   * Update all widget layouts (for drag-and-drop)
   */
  const updateAllWidgetLayouts = (layouts: Array<{ id: string; layout: DashboardWidget['layout'] }>) => {
    if (!currentDashboard.value) return
    
    const widgets = currentDashboard.value.widgets.map(widget => {
      const layoutUpdate = layouts.find(l => l.id === widget.id)
      return layoutUpdate ? { ...widget, layout: layoutUpdate.layout } : widget
    })
    
    updateDashboard(currentDashboard.value.id, { widgets })
  }

  // ==================== Edit Mode Actions ====================
  
  /**
   * Toggle edit mode
   */
  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value
    if (!isEditMode.value) {
      selectedWidgetId.value = null
    }
  }
  
  /**
   * Select widget
   */
  const selectWidget = (widgetId: string | null) => {
    selectedWidgetId.value = widgetId
  }

  // ==================== User Preferences Actions ====================
  
  /**
   * Update user preferences
   */
  const updateUserPreferences = (updates: Partial<UserPreferences>) => {
    userPreferences.value = {
      ...userPreferences.value,
      ...updates,
    }
  }
  
  /**
   * Add favorite service
   */
  const addFavoriteService = (serviceId: string) => {
    if (!userPreferences.value.favoriteServices.includes(serviceId)) {
      userPreferences.value.favoriteServices.push(serviceId)
    }
  }
  
  /**
   * Remove favorite service
   */
  const removeFavoriteService = (serviceId: string) => {
    const index = userPreferences.value.favoriteServices.indexOf(serviceId)
    if (index !== -1) {
      userPreferences.value.favoriteServices.splice(index, 1)
    }
  }
  
  /**
   * Toggle favorite service
   */
  const toggleFavoriteService = (serviceId: string) => {
    if (userPreferences.value.favoriteServices.includes(serviceId)) {
      removeFavoriteService(serviceId)
    } else {
      addFavoriteService(serviceId)
    }
  }
  
  /**
   * Check if service is favorite
   */
  const isFavoriteService = (serviceId: string): boolean => {
    return userPreferences.value.favoriteServices.includes(serviceId)
  }

  // ==================== Reset Actions ====================
  
  /**
   * Reset to default dashboard
   */
  const resetToDefault = () => {
    dashboards.value = [createDefaultDashboard()]
    currentDashboardId.value = 'default'
    isEditMode.value = false
    selectedWidgetId.value = null
  }
  
  /**
   * Reset user preferences
   */
  const resetUserPreferences = () => {
    userPreferences.value = { ...DEFAULT_USER_PREFERENCES }
  }
  
  /**
   * Reset all
   */
  const reset = () => {
    resetToDefault()
    resetUserPreferences()
  }

  // ==================== Export/Import Actions ====================
  
  /**
   * Export dashboard configuration
   */
  const exportDashboard = (dashboardId: string): string => {
    const dashboard = dashboards.value.find(d => d.id === dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    return JSON.stringify(dashboard, null, 2)
  }
  
  /**
   * Import dashboard configuration
   */
  const importDashboard = (configJson: string): DashboardConfig => {
    const config = JSON.parse(configJson) as DashboardConfig
    const newDashboard: DashboardConfig = {
      ...config,
      id: `dashboard-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
    }
    dashboards.value.push(newDashboard)
    return newDashboard
  }

  return {
    // State
    dashboards,
    currentDashboardId,
    userPreferences,
    isEditMode,
    selectedWidgetId,
    
    // Computed
    currentDashboard,
    allDashboards,
    defaultDashboard,
    customDashboards,
    currentWidgets,
    selectedWidget,
    
    // Dashboard Actions
    setCurrentDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    duplicateDashboard,
    
    // Widget Actions
    addWidget,
    updateWidget,
    deleteWidget,
    updateWidgetLayout,
    updateAllWidgetLayouts,
    
    // Edit Mode Actions
    toggleEditMode,
    selectWidget,
    
    // User Preferences Actions
    updateUserPreferences,
    addFavoriteService,
    removeFavoriteService,
    toggleFavoriteService,
    isFavoriteService,
    
    // Reset Actions
    resetToDefault,
    resetUserPreferences,
    reset,
    
    // Export/Import Actions
    exportDashboard,
    importDashboard,
  }
}, {
  persist: {
    key: 'observability-dashboard',
    paths: ['currentDashboardId'], // Only persist current dashboard ID, not full configs
  },
})

/**
 * Export state type
 */
export type { DashboardState }
