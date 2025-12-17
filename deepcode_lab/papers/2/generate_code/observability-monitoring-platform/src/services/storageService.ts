/**
 * Storage Service - Domain-specific localStorage management
 * Provides high-level API for persisting application state (dashboards, filters, preferences)
 * with automatic serialization, validation, and error handling
 */

import { useLocalStorage } from '@/composables/useLocalStorage'
import type { DashboardConfig } from '@/types/dashboard'
import type { FilterSet } from '@/types/filters'
import type { DateRange, TimePreset } from '@/types/index'

/**
 * Storage keys for application state
 */
const STORAGE_KEYS = {
  DASHBOARDS: 'monitoring_dashboards',
  FILTER_PRESETS: 'monitoring_filter_presets',
  ACTIVE_FILTERS: 'monitoring_active_filters',
  TIME_RANGE: 'monitoring_time_range',
  THEME: 'monitoring_theme',
  SIDEBAR_COLLAPSED: 'monitoring_sidebar_collapsed',
  USER_PREFERENCES: 'monitoring_user_preferences',
} as const

/**
 * Type definitions for storage items
 */
interface StoredDashboard extends DashboardConfig {
  savedAt: string
  version: number
}

interface StoredFilterPreset {
  id: string
  name: string
  filters: FilterSet
  createdAt: string
  updatedAt: string
}

interface StoredTimeRange {
  startTime: string
  endTime: string
  preset: TimePreset
  savedAt: string
}

interface UserPreferences {
  theme: 'dark' | 'light'
  sidebarCollapsed: boolean
  defaultDashboardId?: string
  autoRefreshEnabled: boolean
  refreshIntervalSeconds: number
}

/**
 * Storage Service - Centralized storage management
 */
class StorageService {
  private static readonly STORAGE_VERSION = 1
  private static readonly DASHBOARD_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days
  private static readonly FILTER_PRESET_TTL = 90 * 24 * 60 * 60 * 1000 // 90 days

  /**
   * Dashboard Management
   */

  /**
   * Save dashboard configuration to localStorage
   */
  static saveDashboard(dashboard: DashboardConfig): boolean {
    try {
      const stored: StoredDashboard = {
        ...dashboard,
        savedAt: new Date().toISOString(),
        version: this.STORAGE_VERSION,
      }

      const key = `${STORAGE_KEYS.DASHBOARDS}_${dashboard.id}`
      const dashboards = this.getAllDashboards()
      const index = dashboards.findIndex((d) => d.id === dashboard.id)

      if (index >= 0) {
        dashboards[index] = stored
      } else {
        dashboards.push(stored)
      }

      localStorage.setItem(STORAGE_KEYS.DASHBOARDS, JSON.stringify(dashboards))
      return true
    } catch (error) {
      console.error('Failed to save dashboard:', error)
      return false
    }
  }

  /**
   * Load dashboard by ID
   */
  static loadDashboard(dashboardId: string): DashboardConfig | null {
    try {
      const dashboards = this.getAllDashboards()
      const dashboard = dashboards.find((d) => d.id === dashboardId)

      if (!dashboard) {
        return null
      }

      // Check TTL
      const savedAt = new Date(dashboard.savedAt).getTime()
      if (Date.now() - savedAt > this.DASHBOARD_TTL) {
        this.deleteDashboard(dashboardId)
        return null
      }

      return dashboard
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      return null
    }
  }

  /**
   * Get all saved dashboards
   */
  static getAllDashboards(): StoredDashboard[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DASHBOARDS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load dashboards:', error)
      return []
    }
  }

  /**
   * Delete dashboard
   */
  static deleteDashboard(dashboardId: string): boolean {
    try {
      const dashboards = this.getAllDashboards()
      const filtered = dashboards.filter((d) => d.id !== dashboardId)
      localStorage.setItem(STORAGE_KEYS.DASHBOARDS, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete dashboard:', error)
      return false
    }
  }

  /**
   * Filter Preset Management
   */

  /**
   * Save filter preset
   */
  static saveFilterPreset(preset: StoredFilterPreset): boolean {
    try {
      const presets = this.getAllFilterPresets()
      const index = presets.findIndex((p) => p.id === preset.id)

      if (index >= 0) {
        presets[index] = preset
      } else {
        presets.push(preset)
      }

      localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, JSON.stringify(presets))
      return true
    } catch (error) {
      console.error('Failed to save filter preset:', error)
      return false
    }
  }

  /**
   * Load filter preset by ID
   */
  static loadFilterPreset(presetId: string): StoredFilterPreset | null {
    try {
      const presets = this.getAllFilterPresets()
      return presets.find((p) => p.id === presetId) || null
    } catch (error) {
      console.error('Failed to load filter preset:', error)
      return null
    }
  }

  /**
   * Get all filter presets
   */
  static getAllFilterPresets(): StoredFilterPreset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FILTER_PRESETS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load filter presets:', error)
      return []
    }
  }

  /**
   * Delete filter preset
   */
  static deleteFilterPreset(presetId: string): boolean {
    try {
      const presets = this.getAllFilterPresets()
      const filtered = presets.filter((p) => p.id !== presetId)
      localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete filter preset:', error)
      return false
    }
  }

  /**
   * Time Range Management
   */

  /**
   * Save current time range
   */
  static saveTimeRange(startTime: Date, endTime: Date, preset: TimePreset): boolean {
    try {
      const timeRange: StoredTimeRange = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        preset,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEYS.TIME_RANGE, JSON.stringify(timeRange))
      return true
    } catch (error) {
      console.error('Failed to save time range:', error)
      return false
    }
  }

  /**
   * Load saved time range
   */
  static loadTimeRange(): StoredTimeRange | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIME_RANGE)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load time range:', error)
      return null
    }
  }

  /**
   * User Preferences Management
   */

  /**
   * Save user preferences
   */
  static savePreferences(preferences: UserPreferences): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
      return true
    } catch (error) {
      console.error('Failed to save preferences:', error)
      return false
    }
  }

  /**
   * Load user preferences
   */
  static loadPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
      return data
        ? JSON.parse(data)
        : {
            theme: 'dark',
            sidebarCollapsed: false,
            autoRefreshEnabled: true,
            refreshIntervalSeconds: 10,
          }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      return {
        theme: 'dark',
        sidebarCollapsed: false,
        autoRefreshEnabled: true,
        refreshIntervalSeconds: 10,
      }
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Clear all application storage
   */
  static clearAll(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    dashboardCount: number
    filterPresetCount: number
    totalSize: number
  } {
    try {
      const dashboards = this.getAllDashboards()
      const presets = this.getAllFilterPresets()

      let totalSize = 0
      Object.values(STORAGE_KEYS).forEach((key) => {
        const data = localStorage.getItem(key)
        if (data) {
          totalSize += data.length
        }
      })

      return {
        dashboardCount: dashboards.length,
        filterPresetCount: presets.length,
        totalSize,
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        dashboardCount: 0,
        filterPresetCount: 0,
        totalSize: 0,
      }
    }
  }

  /**
   * Export all data as JSON
   */
  static exportData(): string {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        exportedAt: new Date().toISOString(),
        dashboards: this.getAllDashboards(),
        filterPresets: this.getAllFilterPresets(),
        timeRange: this.loadTimeRange(),
        preferences: this.loadPreferences(),
      }
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      return ''
    }
  }

  /**
   * Import data from JSON
   */
  static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)

      if (data.version !== this.STORAGE_VERSION) {
        console.warn('Storage version mismatch')
      }

      // Import dashboards
      if (Array.isArray(data.dashboards)) {
        localStorage.setItem(STORAGE_KEYS.DASHBOARDS, JSON.stringify(data.dashboards))
      }

      // Import filter presets
      if (Array.isArray(data.filterPresets)) {
        localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, JSON.stringify(data.filterPresets))
      }

      // Import time range
      if (data.timeRange) {
        localStorage.setItem(STORAGE_KEYS.TIME_RANGE, JSON.stringify(data.timeRange))
      }

      // Import preferences
      if (data.preferences) {
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data.preferences))
      }

      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }
}

export { StorageService, STORAGE_KEYS, type StoredDashboard, type StoredFilterPreset, type StoredTimeRange, type UserPreferences }
