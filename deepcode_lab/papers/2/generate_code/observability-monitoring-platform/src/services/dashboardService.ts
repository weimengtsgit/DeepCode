/**
 * Dashboard Service
 * Provides business logic for dashboard CRUD operations, persistence, template management,
 * and validation for the custom dashboard builder module.
 */

import type {
  DashboardConfig,
  DashboardWidget,
  WidgetConfig,
  DashboardTemplate,
  DashboardValidationResult,
  DashboardComparison,
  DashboardExport,
  DashboardImportResult,
  DashboardSearchCriteria,
  DashboardSearchResult,
  GridConfig,
} from '@/types/dashboard'
import { generateUUID } from '@/mock/generators/utils'

/**
 * Dashboard Service - Static utility class for dashboard operations
 * Provides CRUD, validation, template management, and persistence logic
 */
export class DashboardService {
  // Grid configuration constants
  private static readonly DEFAULT_GRID_CONFIG: GridConfig = {
    columns: 12,
    gap: 16,
    cellHeight: 60,
    minWidth: 2,
    maxWidth: 12,
    minHeight: 2,
    maxHeight: 4,
  }

  // Predefined dashboard templates
  private static readonly TEMPLATES: Record<string, DashboardTemplate> = {
    application_monitoring: {
      id: 'app-monitoring',
      name: 'Application Monitoring',
      category: 'application',
      description: 'Monitor application health, performance, and errors',
      thumbnail: 'app-monitoring.png',
      config: {
        id: '',
        name: 'Application Monitoring',
        description: 'Monitor application health, performance, and errors',
        widgets: [
          {
            id: 'widget-1',
            type: 'service-health',
            title: 'Service Health',
            position: { x: 0, y: 0, width: 6, height: 2 },
            config: {
              dataSource: 'metrics',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['health'],
          },
          {
            id: 'widget-2',
            type: 'metric-card',
            title: 'Error Rate',
            position: { x: 6, y: 0, width: 3, height: 1 },
            config: {
              dataSource: 'metrics',
              metric: 'ERROR_RATE',
              chartType: 'gauge-chart',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['error'],
          },
          {
            id: 'widget-3',
            type: 'metric-card',
            title: 'Response Time (P99)',
            position: { x: 9, y: 0, width: 3, height: 1 },
            config: {
              dataSource: 'metrics',
              metric: 'P99_LATENCY',
              chartType: 'gauge-chart',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['latency'],
          },
          {
            id: 'widget-4',
            type: 'line-chart',
            title: 'Error Rate Trend',
            position: { x: 0, y: 2, width: 6, height: 2 },
            config: {
              dataSource: 'metrics',
              metric: 'ERROR_RATE',
              chartType: 'line',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['error', 'trend'],
          },
          {
            id: 'widget-5',
            type: 'line-chart',
            title: 'Response Time Trend',
            position: { x: 6, y: 2, width: 6, height: 2 },
            config: {
              dataSource: 'metrics',
              metric: 'P99_LATENCY',
              chartType: 'line',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['latency', 'trend'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false,
        isPublic: true,
        tags: ['application', 'monitoring'],
        gridConfig: this.DEFAULT_GRID_CONFIG,
        theme: 'dark',
        refreshInterval: 10,
        autoLayout: false,
        locked: false,
      },
      tags: ['application', 'monitoring'],
    },
    infrastructure_monitoring: {
      id: 'infra-monitoring',
      name: 'Infrastructure Monitoring',
      category: 'infrastructure',
      description: 'Monitor infrastructure resources and system health',
      thumbnail: 'infra-monitoring.png',
      config: {
        id: '',
        name: 'Infrastructure Monitoring',
        description: 'Monitor infrastructure resources and system health',
        widgets: [
          {
            id: 'widget-1',
            type: 'metric-card',
            title: 'CPU Usage',
            position: { x: 0, y: 0, width: 3, height: 1 },
            config: {
              dataSource: 'metrics',
              metric: 'CPU_USAGE',
              chartType: 'gauge-chart',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['cpu'],
          },
          {
            id: 'widget-2',
            type: 'metric-card',
            title: 'Memory Usage',
            position: { x: 3, y: 0, width: 3, height: 1 },
            config: {
              dataSource: 'metrics',
              metric: 'MEMORY_USAGE',
              chartType: 'gauge-chart',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['memory'],
          },
          {
            id: 'widget-3',
            type: 'metric-card',
            title: 'Disk I/O',
            position: { x: 6, y: 0, width: 3, height: 1 },
            config: {
              dataSource: 'metrics',
              metric: 'DISK_IO',
              chartType: 'gauge-chart',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['disk'],
          },
          {
            id: 'widget-4',
            type: 'metric-card',
            title: 'Network Bandwidth',
            position: { x: 9, y: 0, width: 3, height: 1 },
            config: {
              dataSource: 'metrics',
              metric: 'NETWORK_BANDWIDTH',
              chartType: 'gauge-chart',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['network'],
          },
          {
            id: 'widget-5',
            type: 'line-chart',
            title: 'CPU Trend',
            position: { x: 0, y: 1, width: 6, height: 2 },
            config: {
              dataSource: 'metrics',
              metric: 'CPU_USAGE',
              chartType: 'line',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['cpu', 'trend'],
          },
          {
            id: 'widget-6',
            type: 'line-chart',
            title: 'Memory Trend',
            position: { x: 6, y: 1, width: 6, height: 2 },
            config: {
              dataSource: 'metrics',
              metric: 'MEMORY_USAGE',
              chartType: 'line',
              refreshInterval: 10,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            visible: true,
            locked: false,
            tags: ['memory', 'trend'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false,
        isPublic: true,
        tags: ['infrastructure', 'monitoring'],
        gridConfig: this.DEFAULT_GRID_CONFIG,
        theme: 'dark',
        refreshInterval: 10,
        autoLayout: false,
        locked: false,
      },
      tags: ['infrastructure', 'monitoring'],
    },
  }

  /**
   * Create a new dashboard with default configuration
   */
  static createDashboard(
    name: string,
    description?: string,
    isDefault = false
  ): DashboardConfig {
    const now = new Date()
    return {
      id: generateUUID(),
      name,
      description: description || '',
      widgets: [],
      createdAt: now,
      updatedAt: now,
      isDefault,
      isPublic: false,
      tags: [],
      gridConfig: this.DEFAULT_GRID_CONFIG,
      theme: 'dark',
      refreshInterval: 10,
      autoLayout: false,
      locked: false,
    }
  }

  /**
   * Create a dashboard from template
   */
  static createFromTemplate(
    templateId: string,
    dashboardName: string
  ): DashboardConfig | null {
    const template = this.TEMPLATES[templateId]
    if (!template) return null

    const dashboard = this.createDashboard(dashboardName, template.description)
    dashboard.widgets = template.config.widgets.map((widget) => ({
      ...widget,
      id: generateUUID(), // Generate new IDs for widgets
    }))
    dashboard.tags = template.tags

    return dashboard
  }

  /**
   * Validate dashboard configuration
   */
  static validateDashboard(dashboard: DashboardConfig): DashboardValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate basic properties
    if (!dashboard.name || dashboard.name.trim().length === 0) {
      errors.push('Dashboard name is required')
    }
    if (dashboard.name && dashboard.name.length > 255) {
      errors.push('Dashboard name must be less than 255 characters')
    }

    // Validate widgets
    if (!Array.isArray(dashboard.widgets)) {
      errors.push('Widgets must be an array')
    } else {
      dashboard.widgets.forEach((widget, index) => {
        const widgetErrors = this.validateWidget(widget)
        if (widgetErrors.length > 0) {
          errors.push(`Widget ${index}: ${widgetErrors.join(', ')}`)
        }
      })
    }

    // Validate grid configuration
    if (dashboard.gridConfig) {
      if (dashboard.gridConfig.columns < 1 || dashboard.gridConfig.columns > 24) {
        errors.push('Grid columns must be between 1 and 24')
      }
    }

    // Validate refresh interval
    if (dashboard.refreshInterval < 5 || dashboard.refreshInterval > 3600) {
      warnings.push('Refresh interval should be between 5 and 3600 seconds')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate individual widget
   */
  private static validateWidget(widget: DashboardWidget): string[] {
    const errors: string[] = []

    if (!widget.id || widget.id.trim().length === 0) {
      errors.push('Widget ID is required')
    }

    if (!widget.type) {
      errors.push('Widget type is required')
    }

    if (!widget.title || widget.title.trim().length === 0) {
      errors.push('Widget title is required')
    }

    if (!widget.position) {
      errors.push('Widget position is required')
    } else {
      const { x, y, width, height } = widget.position
      if (x < 0 || y < 0) {
        errors.push('Widget position must be non-negative')
      }
      if (width < 2 || width > 12) {
        errors.push('Widget width must be between 2 and 12')
      }
      if (height < 2 || height > 4) {
        errors.push('Widget height must be between 2 and 4')
      }
    }

    return errors
  }

  /**
   * Add widget to dashboard
   */
  static addWidget(
    dashboard: DashboardConfig,
    widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>
  ): DashboardWidget {
    const newWidget: DashboardWidget = {
      ...widget,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    dashboard.widgets.push(newWidget)
    dashboard.updatedAt = new Date()

    return newWidget
  }

  /**
   * Remove widget from dashboard
   */
  static removeWidget(dashboard: DashboardConfig, widgetId: string): boolean {
    const index = dashboard.widgets.findIndex((w) => w.id === widgetId)
    if (index === -1) return false

    dashboard.widgets.splice(index, 1)
    dashboard.updatedAt = new Date()

    return true
  }

  /**
   * Update widget configuration
   */
  static updateWidget(
    dashboard: DashboardConfig,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): boolean {
    const widget = dashboard.widgets.find((w) => w.id === widgetId)
    if (!widget) return false

    Object.assign(widget, updates, { updatedAt: new Date() })
    dashboard.updatedAt = new Date()

    return true
  }

  /**
   * Move widget to new position
   */
  static moveWidget(
    dashboard: DashboardConfig,
    widgetId: string,
    x: number,
    y: number
  ): boolean {
    const widget = dashboard.widgets.find((w) => w.id === widgetId)
    if (!widget) return false

    widget.position.x = x
    widget.position.y = y
    widget.updatedAt = new Date()
    dashboard.updatedAt = new Date()

    return true
  }

  /**
   * Resize widget
   */
  static resizeWidget(
    dashboard: DashboardConfig,
    widgetId: string,
    width: number,
    height: number
  ): boolean {
    const widget = dashboard.widgets.find((w) => w.id === widgetId)
    if (!widget) return false

    // Validate bounds
    if (width < 2 || width > 12 || height < 2 || height > 4) {
      return false
    }

    widget.position.width = width
    widget.position.height = height
    widget.updatedAt = new Date()
    dashboard.updatedAt = new Date()

    return true
  }

  /**
   * Compare two dashboards and return differences
   */
  static compareDashboards(
    dashboard1: DashboardConfig,
    dashboard2: DashboardConfig
  ): DashboardComparison {
    const added: DashboardWidget[] = []
    const removed: DashboardWidget[] = []
    const modified: Array<{ widget: DashboardWidget; changes: string[] }> = []

    // Find added and modified widgets
    dashboard2.widgets.forEach((widget2) => {
      const widget1 = dashboard1.widgets.find((w) => w.id === widget2.id)
      if (!widget1) {
        added.push(widget2)
      } else {
        const changes: string[] = []
        if (widget1.title !== widget2.title) changes.push('title')
        if (widget1.type !== widget2.type) changes.push('type')
        if (JSON.stringify(widget1.position) !== JSON.stringify(widget2.position))
          changes.push('position')
        if (JSON.stringify(widget1.config) !== JSON.stringify(widget2.config))
          changes.push('config')

        if (changes.length > 0) {
          modified.push({ widget: widget2, changes })
        }
      }
    })

    // Find removed widgets
    dashboard1.widgets.forEach((widget1) => {
      if (!dashboard2.widgets.find((w) => w.id === widget1.id)) {
        removed.push(widget1)
      }
    })

    return { added, removed, modified }
  }

  /**
   * Export dashboard to JSON
   */
  static exportDashboard(dashboard: DashboardConfig): DashboardExport {
    return {
      version: 1,
      timestamp: new Date(),
      dashboard,
      metadata: {
        exportedBy: 'observability-platform',
        exportFormat: 'json',
      },
    }
  }

  /**
   * Import dashboard from JSON
   */
  static importDashboard(jsonString: string): DashboardImportResult {
    try {
      const data = JSON.parse(jsonString) as DashboardExport
      const dashboard = data.dashboard

      // Validate imported dashboard
      const validation = this.validateDashboard(dashboard)

      if (!validation.valid) {
        return {
          success: false,
          dashboardId: '',
          errors: validation.errors,
          warnings: validation.warnings,
        }
      }

      // Generate new ID for imported dashboard
      const newDashboard = { ...dashboard, id: generateUUID() }

      return {
        success: true,
        dashboardId: newDashboard.id,
        errors: [],
        warnings: validation.warnings,
      }
    } catch (error) {
      return {
        success: false,
        dashboardId: '',
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      }
    }
  }

  /**
   * Search dashboards by criteria
   */
  static searchDashboards(
    dashboards: DashboardConfig[],
    criteria: DashboardSearchCriteria
  ): DashboardSearchResult {
    let results = [...dashboards]

    // Filter by query (search in name and description)
    if (criteria.query) {
      const query = criteria.query.toLowerCase()
      results = results.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query)
      )
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter((d) =>
        criteria.tags!.some((tag) => d.tags?.includes(tag))
      )
    }

    // Filter by default status
    if (criteria.isDefault !== undefined) {
      results = results.filter((d) => d.isDefault === criteria.isDefault)
    }

    // Filter by public status
    if (criteria.isPublic !== undefined) {
      results = results.filter((d) => d.isPublic === criteria.isPublic)
    }

    // Sort results
    const sortBy = criteria.sortBy || 'updatedAt'
    const sortOrder = criteria.sortOrder || 'desc'
    results.sort((a, b) => {
      let aVal: any = a[sortBy as keyof DashboardConfig]
      let bVal: any = b[sortBy as keyof DashboardConfig]

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime()
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return 0
    })

    // Apply pagination
    const offset = criteria.offset || 0
    const limit = criteria.limit || 10
    const paginatedResults = results.slice(offset, offset + limit)

    return {
      dashboards: paginatedResults,
      total: results.length,
      limit,
      offset,
    }
  }

  /**
   * Get all available templates
   */
  static getTemplates(): DashboardTemplate[] {
    return Object.values(this.TEMPLATES)
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): DashboardTemplate | null {
    return this.TEMPLATES[templateId] || null
  }

  /**
   * Get default grid configuration
   */
  static getDefaultGridConfig(): GridConfig {
    return { ...this.DEFAULT_GRID_CONFIG }
  }
}

// Export singleton instance
export const dashboardService = DashboardService
