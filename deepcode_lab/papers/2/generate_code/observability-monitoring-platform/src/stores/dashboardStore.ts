import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DashboardConfig, DashboardWidget, WidgetConfig } from '@/types'
import { generateUUID } from '@/mock/generators/utils'

/**
 * Pinia store for managing dashboard configurations and widgets
 * Provides state management for custom dashboard layouts with persistence to localStorage
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const dashboards = ref<Record<string, DashboardConfig>>({})
  const currentDashboardId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdate = ref<Date | null>(null)

  // Computed properties
  const currentDashboard = computed(() => {
    if (!currentDashboardId.value) return null
    return dashboards.value[currentDashboardId.value] || null
  })

  const dashboardList = computed(() => {
    return Object.values(dashboards.value).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  const dashboardCount = computed(() => {
    return Object.keys(dashboards.value).length
  })

  const defaultDashboard = computed(() => {
    return Object.values(dashboards.value).find(d => d.isDefault) || null
  })

  const currentWidgetCount = computed(() => {
    return currentDashboard.value?.widgets.length || 0
  })

  // Actions - Dashboard Management
  const createDashboard = (name: string, description?: string): DashboardConfig => {
    const id = generateUUID()
    const now = new Date()
    
    const newDashboard: DashboardConfig = {
      id,
      name,
      description: description || '',
      widgets: [],
      createdAt: now,
      updatedAt: now,
      isDefault: dashboardCount.value === 0 // First dashboard is default
    }
    
    dashboards.value[id] = newDashboard
    currentDashboardId.value = id
    lastUpdate.value = now
    persistToLocalStorage()
    
    return newDashboard
  }

  const updateDashboard = (id: string, updates: Partial<DashboardConfig>): void => {
    if (!dashboards.value[id]) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    const dashboard = dashboards.value[id]
    Object.assign(dashboard, {
      ...updates,
      updatedAt: new Date()
    })
    
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  const deleteDashboard = (id: string): void => {
    if (!dashboards.value[id]) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    delete dashboards.value[id]
    
    // If deleted dashboard was current, switch to another
    if (currentDashboardId.value === id) {
      const remaining = Object.keys(dashboards.value)
      currentDashboardId.value = remaining.length > 0 ? remaining[0] : null
    }
    
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  const setCurrentDashboard = (id: string): void => {
    if (!dashboards.value[id]) {
      throw new Error(`Dashboard ${id} not found`)
    }
    currentDashboardId.value = id
  }

  const setDefaultDashboard = (id: string): void => {
    if (!dashboards.value[id]) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    // Unset previous default
    Object.values(dashboards.value).forEach(d => {
      d.isDefault = false
    })
    
    // Set new default
    dashboards.value[id].isDefault = true
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  const duplicateDashboard = (id: string, newName: string): DashboardConfig => {
    const source = dashboards.value[id]
    if (!source) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    const newId = generateUUID()
    const now = new Date()
    
    const newDashboard: DashboardConfig = {
      id: newId,
      name: newName,
      description: source.description,
      widgets: source.widgets.map(w => ({
        ...w,
        id: generateUUID() // New IDs for widgets
      })),
      createdAt: now,
      updatedAt: now,
      isDefault: false
    }
    
    dashboards.value[newId] = newDashboard
    lastUpdate.value = now
    persistToLocalStorage()
    
    return newDashboard
  }

  // Actions - Widget Management
  const addWidget = (dashboardId: string, widget: Omit<DashboardWidget, 'id'>): DashboardWidget => {
    const dashboard = dashboards.value[dashboardId]
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`)
    }
    
    const newWidget: DashboardWidget = {
      ...widget,
      id: generateUUID()
    }
    
    dashboard.widgets.push(newWidget)
    dashboard.updatedAt = new Date()
    lastUpdate.value = new Date()
    persistToLocalStorage()
    
    return newWidget
  }

  const updateWidget = (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): void => {
    const dashboard = dashboards.value[dashboardId]
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`)
    }
    
    const widget = dashboard.widgets.find(w => w.id === widgetId)
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`)
    }
    
    Object.assign(widget, updates)
    dashboard.updatedAt = new Date()
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  const removeWidget = (dashboardId: string, widgetId: string): void => {
    const dashboard = dashboards.value[dashboardId]
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`)
    }
    
    const index = dashboard.widgets.findIndex(w => w.id === widgetId)
    if (index === -1) {
      throw new Error(`Widget ${widgetId} not found`)
    }
    
    dashboard.widgets.splice(index, 1)
    dashboard.updatedAt = new Date()
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  const moveWidget = (dashboardId: string, widgetId: string, x: number, y: number): void => {
    updateWidget(dashboardId, widgetId, {
      position: { x, y }
    })
  }

  const resizeWidget = (dashboardId: string, widgetId: string, width: number, height: number): void => {
    updateWidget(dashboardId, widgetId, {
      position: {
        ...dashboards.value[dashboardId]?.widgets.find(w => w.id === widgetId)?.position,
        width,
        height
      }
    })
  }

  const reorderWidgets = (dashboardId: string, widgetIds: string[]): void => {
    const dashboard = dashboards.value[dashboardId]
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`)
    }
    
    const widgetMap = new Map(dashboard.widgets.map(w => [w.id, w]))
    dashboard.widgets = widgetIds
      .map(id => widgetMap.get(id))
      .filter((w): w is DashboardWidget => w !== undefined)
    
    dashboard.updatedAt = new Date()
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  const clearWidgets = (dashboardId: string): void => {
    const dashboard = dashboards.value[dashboardId]
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`)
    }
    
    dashboard.widgets = []
    dashboard.updatedAt = new Date()
    lastUpdate.value = new Date()
    persistToLocalStorage()
  }

  // Actions - Batch Operations
  const setDashboards = (newDashboards: Record<string, DashboardConfig>): void => {
    dashboards.value = newDashboards
    lastUpdate.value = new Date()
  }

  const setLoading = (isLoading: boolean): void => {
    loading.value = isLoading
  }

  const setError = (err: Error | null): void => {
    error.value = err
  }

  const clearError = (): void => {
    error.value = null
  }

  // Persistence
  const persistToLocalStorage = (): void => {
    try {
      const data = {
        dashboards: dashboards.value,
        currentDashboardId: currentDashboardId.value,
        lastUpdate: lastUpdate.value?.toISOString()
      }
      localStorage.setItem('monitoring_dashboards', JSON.stringify(data))
    } catch (err) {
      console.error('Failed to persist dashboards to localStorage:', err)
    }
  }

  const loadFromLocalStorage = (): void => {
    try {
      const data = localStorage.getItem('monitoring_dashboards')
      if (!data) return
      
      const parsed = JSON.parse(data)
      dashboards.value = parsed.dashboards || {}
      currentDashboardId.value = parsed.currentDashboardId || null
      
      if (parsed.lastUpdate) {
        lastUpdate.value = new Date(parsed.lastUpdate)
      }
    } catch (err) {
      console.error('Failed to load dashboards from localStorage:', err)
    }
  }

  // Utility methods
  const getDashboard = (id: string): DashboardConfig | undefined => {
    return dashboards.value[id]
  }

  const getWidget = (dashboardId: string, widgetId: string): DashboardWidget | undefined => {
    const dashboard = dashboards.value[dashboardId]
    return dashboard?.widgets.find(w => w.id === widgetId)
  }

  const exportDashboard = (id: string): string => {
    const dashboard = dashboards.value[id]
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`)
    }
    return JSON.stringify(dashboard, null, 2)
  }

  const importDashboard = (jsonString: string): DashboardConfig => {
    try {
      const imported = JSON.parse(jsonString) as DashboardConfig
      
      // Validate required fields
      if (!imported.name || !Array.isArray(imported.widgets)) {
        throw new Error('Invalid dashboard format')
      }
      
      // Generate new ID to avoid conflicts
      const newId = generateUUID()
      const now = new Date()
      
      const newDashboard: DashboardConfig = {
        ...imported,
        id: newId,
        createdAt: now,
        updatedAt: now,
        isDefault: false,
        widgets: imported.widgets.map(w => ({
          ...w,
          id: generateUUID()
        }))
      }
      
      dashboards.value[newId] = newDashboard
      lastUpdate.value = now
      persistToLocalStorage()
      
      return newDashboard
    } catch (err) {
      throw new Error(`Failed to import dashboard: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const reset = (): void => {
    dashboards.value = {}
    currentDashboardId.value = null
    loading.value = false
    error.value = null
    lastUpdate.value = null
    localStorage.removeItem('monitoring_dashboards')
  }

  return {
    // State
    dashboards,
    currentDashboardId,
    loading,
    error,
    lastUpdate,
    
    // Computed
    currentDashboard,
    dashboardList,
    dashboardCount,
    defaultDashboard,
    currentWidgetCount,
    
    // Dashboard actions
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setCurrentDashboard,
    setDefaultDashboard,
    duplicateDashboard,
    
    // Widget actions
    addWidget,
    updateWidget,
    removeWidget,
    moveWidget,
    resizeWidget,
    reorderWidgets,
    clearWidgets,
    
    // Batch operations
    setDashboards,
    setLoading,
    setError,
    clearError,
    
    // Persistence
    persistToLocalStorage,
    loadFromLocalStorage,
    
    // Utilities
    getDashboard,
    getWidget,
    exportDashboard,
    importDashboard,
    reset
  }
})
