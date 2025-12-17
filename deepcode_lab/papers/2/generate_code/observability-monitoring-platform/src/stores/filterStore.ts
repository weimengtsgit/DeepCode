import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterSet, FilterValue } from '@/types'
import { useLocalStorage } from '@/composables/useLocalStorage'

/**
 * Pinia store for managing multi-dimensional filter state
 * Provides global filter context across all modules (Metrics, Tracing, Logs)
 * Persists filter presets to localStorage for user preferences
 */
export const useFilterStore = defineStore('filters', () => {
  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Currently active filters applied to all data queries
   * Structure: { service?: string[], environment?: string[], region?: string[], instance?: string[], tags?: Record<string, string[]> }
   * AND logic between filter types, OR logic within filter type
   */
  const activeFilters = ref<FilterSet>({
    service: [],
    environment: [],
    region: [],
    instance: [],
    tags: {}
  })

  /**
   * User-saved filter preset combinations
   * Each preset is a named FilterSet that can be quickly applied
   */
  const savedPresets = ref<Array<{ name: string; filters: FilterSet; createdAt: Date }>>([])

  /**
   * Current preset name if one is applied, null if custom filters
   */
  const currentPresetName = ref<string | null>(null)

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  /**
   * Check if any filters are currently active
   */
  const hasActiveFilters = computed(() => {
    return (
      (activeFilters.value.service && activeFilters.value.service.length > 0) ||
      (activeFilters.value.environment && activeFilters.value.environment.length > 0) ||
      (activeFilters.value.region && activeFilters.value.region.length > 0) ||
      (activeFilters.value.instance && activeFilters.value.instance.length > 0) ||
      (activeFilters.value.tags && Object.keys(activeFilters.value.tags).length > 0)
    )
  })

  /**
   * Count of active filter dimensions (for UI badge)
   */
  const activeFilterCount = computed(() => {
    let count = 0
    if (activeFilters.value.service && activeFilters.value.service.length > 0) count++
    if (activeFilters.value.environment && activeFilters.value.environment.length > 0) count++
    if (activeFilters.value.region && activeFilters.value.region.length > 0) count++
    if (activeFilters.value.instance && activeFilters.value.instance.length > 0) count++
    if (activeFilters.value.tags && Object.keys(activeFilters.value.tags).length > 0) count++
    return count
  })

  /**
   * Total count of individual filter values across all dimensions
   */
  const totalFilterValueCount = computed(() => {
    let count = 0
    if (activeFilters.value.service) count += activeFilters.value.service.length
    if (activeFilters.value.environment) count += activeFilters.value.environment.length
    if (activeFilters.value.region) count += activeFilters.value.region.length
    if (activeFilters.value.instance) count += activeFilters.value.instance.length
    if (activeFilters.value.tags) {
      Object.values(activeFilters.value.tags).forEach(values => {
        count += values.length
      })
    }
    return count
  })

  /**
   * Human-readable filter summary for display
   * Example: "Service: api-service, Environment: production"
   */
  const filterSummary = computed(() => {
    const parts: string[] = []

    if (activeFilters.value.service && activeFilters.value.service.length > 0) {
      parts.push(`Service: ${activeFilters.value.service.join(', ')}`)
    }
    if (activeFilters.value.environment && activeFilters.value.environment.length > 0) {
      parts.push(`Environment: ${activeFilters.value.environment.join(', ')}`)
    }
    if (activeFilters.value.region && activeFilters.value.region.length > 0) {
      parts.push(`Region: ${activeFilters.value.region.join(', ')}`)
    }
    if (activeFilters.value.instance && activeFilters.value.instance.length > 0) {
      parts.push(`Instance: ${activeFilters.value.instance.join(', ')}`)
    }
    if (activeFilters.value.tags && Object.keys(activeFilters.value.tags).length > 0) {
      const tagParts = Object.entries(activeFilters.value.tags).map(
        ([key, values]) => `${key}: ${values.join(', ')}`
      )
      parts.push(...tagParts)
    }

    return parts.length > 0 ? parts.join(' | ') : 'No filters applied'
  })

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Set or update a specific filter dimension
   * @param filterType - Type of filter (service, environment, region, instance, tags)
   * @param values - Array of values to set for this filter type
   */
  function setFilter(filterType: keyof FilterSet, values: string[] | Record<string, string[]>) {
    if (filterType === 'tags' && typeof values === 'object' && !Array.isArray(values)) {
      activeFilters.value.tags = values as Record<string, string[]>
    } else if (Array.isArray(values)) {
      ;(activeFilters.value[filterType] as string[]) = values
    }

    // Clear preset name since filters are now custom
    currentPresetName.value = null

    // Persist to localStorage
    persistToLocalStorage()
  }

  /**
   * Add a single value to a filter dimension
   * @param filterType - Type of filter
   * @param value - Value to add
   */
  function addFilterValue(filterType: keyof FilterSet, value: string) {
    if (filterType === 'tags') {
      // For tags, value should be "key:value" format
      const [key, val] = value.split(':')
      if (key && val) {
        if (!activeFilters.value.tags) {
          activeFilters.value.tags = {}
        }
        if (!activeFilters.value.tags[key]) {
          activeFilters.value.tags[key] = []
        }
        if (!activeFilters.value.tags[key].includes(val)) {
          activeFilters.value.tags[key].push(val)
        }
      }
    } else {
      const arr = activeFilters.value[filterType] as string[]
      if (!arr.includes(value)) {
        arr.push(value)
      }
    }

    currentPresetName.value = null
    persistToLocalStorage()
  }

  /**
   * Remove a single value from a filter dimension
   * @param filterType - Type of filter
   * @param value - Value to remove
   */
  function removeFilterValue(filterType: keyof FilterSet, value: string) {
    if (filterType === 'tags') {
      const [key, val] = value.split(':')
      if (key && activeFilters.value.tags && activeFilters.value.tags[key]) {
        activeFilters.value.tags[key] = activeFilters.value.tags[key].filter(v => v !== val)
        if (activeFilters.value.tags[key].length === 0) {
          delete activeFilters.value.tags[key]
        }
      }
    } else {
      const arr = activeFilters.value[filterType] as string[]
      const index = arr.indexOf(value)
      if (index > -1) {
        arr.splice(index, 1)
      }
    }

    currentPresetName.value = null
    persistToLocalStorage()
  }

  /**
   * Clear all filters of a specific type
   * @param filterType - Type of filter to clear (or 'all' to clear everything)
   */
  function clearFilter(filterType: keyof FilterSet | 'all') {
    if (filterType === 'all') {
      activeFilters.value = {
        service: [],
        environment: [],
        region: [],
        instance: [],
        tags: {}
      }
    } else if (filterType === 'tags') {
      activeFilters.value.tags = {}
    } else {
      ;(activeFilters.value[filterType] as string[]) = []
    }

    currentPresetName.value = null
    persistToLocalStorage()
  }

  /**
   * Clear all filters
   */
  function clearAllFilters() {
    clearFilter('all')
  }

  /**
   * Apply multiple filters at once
   * @param filters - FilterSet object with multiple filter types
   */
  function applyMultiple(filters: Partial<FilterSet>) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        setFilter(key as keyof FilterSet, value as string[] | Record<string, string[]>)
      }
    })
  }

  /**
   * Save current filters as a named preset
   * @param presetName - Name for the preset
   */
  function savePreset(presetName: string) {
    // Remove existing preset with same name
    savedPresets.value = savedPresets.value.filter(p => p.name !== presetName)

    // Add new preset
    savedPresets.value.push({
      name: presetName,
      filters: JSON.parse(JSON.stringify(activeFilters.value)), // Deep copy
      createdAt: new Date()
    })

    persistPresetsToLocalStorage()
  }

  /**
   * Load a saved filter preset
   * @param presetName - Name of preset to load
   */
  function loadPreset(presetName: string) {
    const preset = savedPresets.value.find(p => p.name === presetName)
    if (preset) {
      activeFilters.value = JSON.parse(JSON.stringify(preset.filters)) // Deep copy
      currentPresetName.value = presetName
      persistToLocalStorage()
    }
  }

  /**
   * Delete a saved preset
   * @param presetName - Name of preset to delete
   */
  function deletePreset(presetName: string) {
    savedPresets.value = savedPresets.value.filter(p => p.name !== presetName)
    if (currentPresetName.value === presetName) {
      currentPresetName.value = null
    }
    persistPresetsToLocalStorage()
  }

  /**
   * Get list of all saved preset names
   */
  function getPresetNames(): string[] {
    return savedPresets.value.map(p => p.name)
  }

  /**
   * Check if a filter value is currently active
   * @param filterType - Type of filter
   * @param value - Value to check
   */
  function isFilterActive(filterType: keyof FilterSet, value: string): boolean {
    if (filterType === 'tags') {
      const [key, val] = value.split(':')
      return !!(activeFilters.value.tags && activeFilters.value.tags[key]?.includes(val))
    } else {
      const arr = activeFilters.value[filterType] as string[]
      return arr ? arr.includes(value) : false
    }
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /**
   * Save active filters to localStorage
   */
  function persistToLocalStorage() {
    try {
      const data = {
        filters: activeFilters.value,
        presetName: currentPresetName.value,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('monitoring_filters_active', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist filters to localStorage:', error)
    }
  }

  /**
   * Load active filters from localStorage
   */
  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('monitoring_filters_active')
      if (data) {
        const parsed = JSON.parse(data)
        activeFilters.value = parsed.filters || activeFilters.value
        currentPresetName.value = parsed.presetName || null
      }
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error)
    }
  }

  /**
   * Save presets to localStorage
   */
  function persistPresetsToLocalStorage() {
    try {
      const data = {
        presets: savedPresets.value,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('monitoring_filters_presets', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist presets to localStorage:', error)
    }
  }

  /**
   * Load presets from localStorage
   */
  function loadPresetsFromLocalStorage() {
    try {
      const data = localStorage.getItem('monitoring_filters_presets')
      if (data) {
        const parsed = JSON.parse(data)
        savedPresets.value = parsed.presets || []
      }
    } catch (error) {
      console.error('Failed to load presets from localStorage:', error)
    }
  }

  /**
   * Initialize store from localStorage
   */
  function initialize() {
    loadFromLocalStorage()
    loadPresetsFromLocalStorage()
  }

  // ============================================================================
  // RETURN STORE INTERFACE
  // ============================================================================

  return {
    // State
    activeFilters,
    savedPresets,
    currentPresetName,

    // Computed
    hasActiveFilters,
    activeFilterCount,
    totalFilterValueCount,
    filterSummary,

    // Actions
    setFilter,
    addFilterValue,
    removeFilterValue,
    clearFilter,
    clearAllFilters,
    applyMultiple,
    savePreset,
    loadPreset,
    deletePreset,
    getPresetNames,
    isFilterActive,

    // Persistence
    persistToLocalStorage,
    loadFromLocalStorage,
    persistPresetsToLocalStorage,
    loadPresetsFromLocalStorage,
    initialize
  }
})
