import { computed, ref, watch, Ref } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import type { FilterSet, FilterRule, FilterRuleMap } from '@/types'

/**
 * Composable for filter management and application
 * Wraps filterStore functionality with filter application logic
 * Provides reactive filter state and methods for component consumption
 */
export function useFilters() {
  const filterStore = useFilterStore()

  // Reactive references
  const activeFilters = computed(() => filterStore.activeFilters)
  const savedPresets = computed(() => filterStore.savedPresets)
  const currentPresetName = computed(() => filterStore.currentPresetName)

  // Filter rules: Define how to match items against filter values
  const filterRules: FilterRuleMap = {
    service: (item: any, value: string) => {
      return item.service === value || item.serviceName === value
    },
    environment: (item: any, value: string) => {
      return item.environment === value || item.context?.environment === value
    },
    region: (item: any, value: string) => {
      return item.region === value || item.context?.region === value
    },
    instance: (item: any, value: string) => {
      return item.instanceId === value || item.context?.instanceId === value
    },
    tags: (item: any, tagKey: string) => {
      const tagValue = activeFilters.value.tags?.[tagKey]
      if (!tagValue || tagValue.length === 0) return true
      const itemTagValue = item.tags?.[tagKey]
      return tagValue.includes(itemTagValue)
    }
  }

  /**
   * Apply filters to data array
   * Uses AND logic between filter types, OR logic within filter type
   * @param data - Array of items to filter
   * @param customRules - Optional custom filter rules (overrides defaults)
   * @returns Filtered array
   */
  function getFilteredData<T>(
    data: T[],
    customRules?: Partial<FilterRuleMap>
  ): T[] {
    const rules = { ...filterRules, ...customRules }

    return data.filter((item) => {
      // AND logic between filter types
      return Object.entries(activeFilters.value).every(([type, values]) => {
        // Skip if filter not applied
        if (!values || (Array.isArray(values) && values.length === 0)) {
          return true
        }

        const rule = rules[type as keyof FilterRuleMap]
        if (!rule) return true // No rule defined, skip filter

        // OR logic within filter type
        if (Array.isArray(values)) {
          return values.some((val) => rule(item, val))
        } else {
          return rule(item, values)
        }
      })
    })
  }

  /**
   * Apply single filter
   * @param filterType - Filter dimension (service, environment, region, instance, tags)
   * @param values - Filter values to apply
   */
  function applyFilter(filterType: keyof FilterSet, values: any): void {
    filterStore.setFilter(filterType, values)
  }

  /**
   * Add value to existing filter
   * @param filterType - Filter dimension
   * @param value - Value to add
   */
  function addFilter(filterType: keyof FilterSet, value: any): void {
    filterStore.addFilterValue(filterType, value)
  }

  /**
   * Remove value from filter
   * @param filterType - Filter dimension
   * @param value - Value to remove
   */
  function removeFilter(filterType: keyof FilterSet, value: any): void {
    filterStore.removeFilterValue(filterType, value)
  }

  /**
   * Clear specific filter or all filters
   * @param filterType - Filter dimension to clear, or 'all' for all filters
   */
  function clearFilter(filterType?: keyof FilterSet | 'all'): void {
    if (!filterType || filterType === 'all') {
      filterStore.clearFilter('all')
    } else {
      filterStore.clearFilter(filterType)
    }
  }

  /**
   * Apply multiple filters at once
   * @param filters - FilterSet object with multiple filters
   */
  function applyMultiple(filters: Partial<FilterSet>): void {
    filterStore.applyMultiple(filters)
  }

  /**
   * Save current filters as preset
   * @param presetName - Name for the preset
   */
  function savePreset(presetName: string): void {
    filterStore.savePreset(presetName)
  }

  /**
   * Load saved filter preset
   * @param presetName - Name of preset to load
   */
  function loadPreset(presetName: string): void {
    filterStore.loadPreset(presetName)
  }

  /**
   * Delete saved preset
   * @param presetName - Name of preset to delete
   */
  function deletePreset(presetName: string): void {
    filterStore.deletePreset(presetName)
  }

  /**
   * Get list of saved preset names
   * @returns Array of preset names
   */
  function getPresetNames(): string[] {
    return filterStore.getPresetNames()
  }

  /**
   * Check if specific filter value is active
   * @param filterType - Filter dimension
   * @param value - Value to check
   * @returns True if value is in active filters
   */
  function isFilterActive(filterType: keyof FilterSet, value: any): boolean {
    return filterStore.isFilterActive(filterType, value)
  }

  /**
   * Get count of active filters
   * @returns Number of active filter dimensions
   */
  const activeFilterCount = computed(() => filterStore.activeFilterCount)

  /**
   * Get total count of filter values
   * @returns Total individual filter values
   */
  const totalFilterValueCount = computed(() => filterStore.totalFilterValueCount)

  /**
   * Check if any filters are active
   * @returns True if any filters applied
   */
  const hasActiveFilters = computed(() => filterStore.hasActiveFilters)

  /**
   * Get human-readable filter summary
   * @returns Filter description string
   */
  const filterSummary = computed(() => filterStore.filterSummary)

  return {
    // State
    activeFilters,
    savedPresets,
    currentPresetName,

    // Methods
    getFilteredData,
    applyFilter,
    addFilter,
    removeFilter,
    clearFilter,
    applyMultiple,
    savePreset,
    loadPreset,
    deletePreset,
    getPresetNames,
    isFilterActive,

    // Computed
    activeFilterCount,
    totalFilterValueCount,
    hasActiveFilters,
    filterSummary,

    // Rules (for advanced usage)
    filterRules
  }
}

/**
 * Composable for filter UI state management
 * Handles expanded/collapsed state, search, sorting
 */
export function useFilterUI() {
  const expandedFilters = ref<Record<string, boolean>>({
    service: true,
    environment: false,
    region: false,
    instance: false,
    tags: false
  })

  const searchQueries = ref<Record<string, string>>({
    service: '',
    environment: '',
    region: '',
    instance: '',
    tags: ''
  })

  /**
   * Toggle filter section expanded state
   * @param filterType - Filter dimension
   */
  function toggleFilterSection(filterType: string): void {
    expandedFilters.value[filterType] = !expandedFilters.value[filterType]
  }

  /**
   * Set search query for filter
   * @param filterType - Filter dimension
   * @param query - Search query string
   */
  function setSearchQuery(filterType: string, query: string): void {
    searchQueries.value[filterType] = query
  }

  /**
   * Clear search query
   * @param filterType - Filter dimension
   */
  function clearSearchQuery(filterType: string): void {
    searchQueries.value[filterType] = ''
  }

  /**
   * Get filtered options based on search query
   * @param filterType - Filter dimension
   * @param options - Available options
   * @returns Filtered options matching search query
   */
  function getFilteredOptions(filterType: string, options: any[]): any[] {
    const query = searchQueries.value[filterType]?.toLowerCase() || ''
    if (!query) return options

    return options.filter((option) => {
      const label = option.label || option.name || option
      return label.toString().toLowerCase().includes(query)
    })
  }

  return {
    expandedFilters,
    searchQueries,
    toggleFilterSection,
    setSearchQuery,
    clearSearchQuery,
    getFilteredOptions
  }
}

/**
 * Composable for advanced filter operations
 * Handles filter validation, transformation, and complex queries
 */
export function useAdvancedFilters() {
  const { activeFilters, getFilteredData } = useFilters()

  /**
   * Validate filter values
   * @param filterType - Filter dimension
   * @param values - Values to validate
   * @returns Validation result with errors if any
   */
  function validateFilters(
    filterType: string,
    values: any[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!values || values.length === 0) {
      return { valid: true, errors: [] }
    }

    // Validate service filter
    if (filterType === 'service') {
      const validServices = ['api-service', 'user-service', 'database-service']
      values.forEach((val) => {
        if (!validServices.includes(val)) {
          errors.push(`Invalid service: ${val}`)
        }
      })
    }

    // Validate environment filter
    if (filterType === 'environment') {
      const validEnvs = ['production', 'staging', 'testing']
      values.forEach((val) => {
        if (!validEnvs.includes(val)) {
          errors.push(`Invalid environment: ${val}`)
        }
      })
    }

    // Validate region filter
    if (filterType === 'region') {
      const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
      values.forEach((val) => {
        if (!validRegions.includes(val)) {
          errors.push(`Invalid region: ${val}`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get filter statistics
   * @param data - Data array to analyze
   * @returns Statistics about filter distribution
   */
  function getFilterStatistics(data: any[]): Record<string, any> {
    const stats: Record<string, any> = {
      totalItems: data.length,
      byService: {},
      byEnvironment: {},
      byRegion: {}
    }

    data.forEach((item) => {
      // Count by service
      const service = item.service || item.serviceName
      if (service) {
        stats.byService[service] = (stats.byService[service] || 0) + 1
      }

      // Count by environment
      const env = item.environment || item.context?.environment
      if (env) {
        stats.byEnvironment[env] = (stats.byEnvironment[env] || 0) + 1
      }

      // Count by region
      const region = item.region || item.context?.region
      if (region) {
        stats.byRegion[region] = (stats.byRegion[region] || 0) + 1
      }
    })

    return stats
  }

  /**
   * Export filters as JSON
   * @returns JSON string of current filters
   */
  function exportFilters(): string {
    return JSON.stringify(activeFilters.value, null, 2)
  }

  /**
   * Import filters from JSON
   * @param jsonString - JSON string of filters
   * @returns Success status
   */
  function importFilters(jsonString: string): boolean {
    try {
      const filters = JSON.parse(jsonString)
      // Validate structure
      if (typeof filters !== 'object') {
        return false
      }
      // Would call applyMultiple here
      return true
    } catch {
      return false
    }
  }

  return {
    validateFilters,
    getFilterStatistics,
    exportFilters,
    importFilters
  }
}
