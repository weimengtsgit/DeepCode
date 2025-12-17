/**
 * Filters Store
 * 
 * Pinia store managing global filter state for the observability platform.
 * Handles multi-dimensional filtering (services, environments, regions, tags, search)
 * with localStorage persistence and utility methods for filter operations.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterConfig, Service, Environment, Region } from '@/types'

/**
 * Filters Store State Interface
 */
export interface FiltersState {
  services: string[]
  environments: Environment[]
  regions: Region[]
  tags: string[]
  searchQuery: string
}

/**
 * Default empty filter configuration
 */
const DEFAULT_FILTERS: FilterConfig = {
  services: [],
  environments: [],
  regions: [],
  tags: [],
  searchQuery: ''
}

/**
 * Filters Store
 * 
 * Manages global filter state with persistence and utility methods
 */
export const useFiltersStore = defineStore('filters', () => {
  // ============================================================================
  // State
  // ============================================================================

  const services = ref<string[]>([])
  const environments = ref<Environment[]>([])
  const regions = ref<Region[]>([])
  const tags = ref<string[]>([])
  const searchQuery = ref<string>('')

  // ============================================================================
  // Computed
  // ============================================================================

  /**
   * Complete filter configuration object
   */
  const filters = computed<FilterConfig>(() => ({
    services: services.value,
    environments: environments.value,
    regions: regions.value,
    tags: tags.value,
    searchQuery: searchQuery.value
  }))

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed<boolean>(() => {
    return (
      services.value.length > 0 ||
      environments.value.length > 0 ||
      regions.value.length > 0 ||
      tags.value.length > 0 ||
      searchQuery.value.trim() !== ''
    )
  })

  /**
   * Count of active filters
   */
  const activeFilterCount = computed<number>(() => {
    let count = 0
    if (services.value.length > 0) count++
    if (environments.value.length > 0) count++
    if (regions.value.length > 0) count++
    if (tags.value.length > 0) count++
    if (searchQuery.value.trim() !== '') count++
    return count
  })

  /**
   * Human-readable filter summary
   */
  const filterSummary = computed<string>(() => {
    const parts: string[] = []

    if (services.value.length > 0) {
      parts.push(`${services.value.length} service${services.value.length > 1 ? 's' : ''}`)
    }
    if (environments.value.length > 0) {
      parts.push(`${environments.value.length} environment${environments.value.length > 1 ? 's' : ''}`)
    }
    if (regions.value.length > 0) {
      parts.push(`${regions.value.length} region${regions.value.length > 1 ? 's' : ''}`)
    }
    if (tags.value.length > 0) {
      parts.push(`${tags.value.length} tag${tags.value.length > 1 ? 's' : ''}`)
    }
    if (searchQuery.value.trim() !== '') {
      parts.push(`search: "${searchQuery.value}"`)
    }

    return parts.length > 0 ? parts.join(', ') : 'No filters'
  })

  // ============================================================================
  // Service Actions
  // ============================================================================

  /**
   * Set services filter
   */
  function setServices(newServices: string[]): void {
    services.value = [...newServices]
  }

  /**
   * Add service to filter
   */
  function addService(serviceId: string): void {
    if (!services.value.includes(serviceId)) {
      services.value.push(serviceId)
    }
  }

  /**
   * Remove service from filter
   */
  function removeService(serviceId: string): void {
    services.value = services.value.filter(id => id !== serviceId)
  }

  /**
   * Toggle service in filter
   */
  function toggleService(serviceId: string): void {
    if (services.value.includes(serviceId)) {
      removeService(serviceId)
    } else {
      addService(serviceId)
    }
  }

  /**
   * Clear services filter
   */
  function clearServices(): void {
    services.value = []
  }

  // ============================================================================
  // Environment Actions
  // ============================================================================

  /**
   * Set environments filter
   */
  function setEnvironments(newEnvironments: Environment[]): void {
    environments.value = [...newEnvironments]
  }

  /**
   * Add environment to filter
   */
  function addEnvironment(environment: Environment): void {
    if (!environments.value.includes(environment)) {
      environments.value.push(environment)
    }
  }

  /**
   * Remove environment from filter
   */
  function removeEnvironment(environment: Environment): void {
    environments.value = environments.value.filter(env => env !== environment)
  }

  /**
   * Toggle environment in filter
   */
  function toggleEnvironment(environment: Environment): void {
    if (environments.value.includes(environment)) {
      removeEnvironment(environment)
    } else {
      addEnvironment(environment)
    }
  }

  /**
   * Clear environments filter
   */
  function clearEnvironments(): void {
    environments.value = []
  }

  // ============================================================================
  // Region Actions
  // ============================================================================

  /**
   * Set regions filter
   */
  function setRegions(newRegions: Region[]): void {
    regions.value = [...newRegions]
  }

  /**
   * Add region to filter
   */
  function addRegion(region: Region): void {
    if (!regions.value.includes(region)) {
      regions.value.push(region)
    }
  }

  /**
   * Remove region from filter
   */
  function removeRegion(region: Region): void {
    regions.value = regions.value.filter(r => r !== region)
  }

  /**
   * Toggle region in filter
   */
  function toggleRegion(region: Region): void {
    if (regions.value.includes(region)) {
      removeRegion(region)
    } else {
      addRegion(region)
    }
  }

  /**
   * Clear regions filter
   */
  function clearRegions(): void {
    regions.value = []
  }

  // ============================================================================
  // Tag Actions
  // ============================================================================

  /**
   * Set tags filter
   */
  function setTags(newTags: string[]): void {
    tags.value = [...newTags]
  }

  /**
   * Add tag to filter
   */
  function addTag(tag: string): void {
    if (!tags.value.includes(tag)) {
      tags.value.push(tag)
    }
  }

  /**
   * Remove tag from filter
   */
  function removeTag(tag: string): void {
    tags.value = tags.value.filter(t => t !== tag)
  }

  /**
   * Toggle tag in filter
   */
  function toggleTag(tag: string): void {
    if (tags.value.includes(tag)) {
      removeTag(tag)
    } else {
      addTag(tag)
    }
  }

  /**
   * Clear tags filter
   */
  function clearTags(): void {
    tags.value = []
  }

  // ============================================================================
  // Search Query Actions
  // ============================================================================

  /**
   * Set search query
   */
  function setSearchQuery(query: string): void {
    searchQuery.value = query
  }

  /**
   * Clear search query
   */
  function clearSearchQuery(): void {
    searchQuery.value = ''
  }

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  /**
   * Set all filters at once
   */
  function setFilters(newFilters: Partial<FilterConfig>): void {
    if (newFilters.services !== undefined) {
      services.value = [...newFilters.services]
    }
    if (newFilters.environments !== undefined) {
      environments.value = [...newFilters.environments]
    }
    if (newFilters.regions !== undefined) {
      regions.value = [...newFilters.regions]
    }
    if (newFilters.tags !== undefined) {
      tags.value = [...newFilters.tags]
    }
    if (newFilters.searchQuery !== undefined) {
      searchQuery.value = newFilters.searchQuery
    }
  }

  /**
   * Clear all filters
   */
  function clearFilters(): void {
    services.value = []
    environments.value = []
    regions.value = []
    tags.value = []
    searchQuery.value = ''
  }

  /**
   * Reset to default state
   */
  function reset(): void {
    clearFilters()
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if a service matches current filters
   */
  function matchesServiceFilters(service: Service): boolean {
    // Service filter
    if (services.value.length > 0 && !services.value.includes(service.id)) {
      return false
    }

    // Environment filter
    if (environments.value.length > 0 && !environments.value.includes(service.environment)) {
      return false
    }

    // Region filter
    if (regions.value.length > 0 && !regions.value.includes(service.region)) {
      return false
    }

    // Tags filter
    if (tags.value.length > 0) {
      const hasMatchingTag = tags.value.some(tag => service.tags.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    // Search query
    if (searchQuery.value.trim() !== '') {
      const query = searchQuery.value.toLowerCase()
      const searchableText = [
        service.name,
        service.displayName,
        service.description || '',
        ...service.tags
      ].join(' ').toLowerCase()

      if (!searchableText.includes(query)) {
        return false
      }
    }

    return true
  }

  /**
   * Filter a list of services based on current filters
   */
  function filterServices(serviceList: Service[]): Service[] {
    return serviceList.filter(service => matchesServiceFilters(service))
  }

  /**
   * Get available filter options from a list of services
   */
  function getAvailableOptions(serviceList: Service[]): {
    environments: Environment[]
    regions: Region[]
    tags: string[]
  } {
    const environmentsSet = new Set<Environment>()
    const regionsSet = new Set<Region>()
    const tagsSet = new Set<string>()

    serviceList.forEach(service => {
      environmentsSet.add(service.environment)
      regionsSet.add(service.region)
      service.tags.forEach(tag => tagsSet.add(tag))
    })

    return {
      environments: Array.from(environmentsSet).sort(),
      regions: Array.from(regionsSet).sort(),
      tags: Array.from(tagsSet).sort()
    }
  }

  // ============================================================================
  // Return Store API
  // ============================================================================

  return {
    // State
    services,
    environments,
    regions,
    tags,
    searchQuery,

    // Computed
    filters,
    hasActiveFilters,
    activeFilterCount,
    filterSummary,

    // Service Actions
    setServices,
    addService,
    removeService,
    toggleService,
    clearServices,

    // Environment Actions
    setEnvironments,
    addEnvironment,
    removeEnvironment,
    toggleEnvironment,
    clearEnvironments,

    // Region Actions
    setRegions,
    addRegion,
    removeRegion,
    toggleRegion,
    clearRegions,

    // Tag Actions
    setTags,
    addTag,
    removeTag,
    toggleTag,
    clearTags,

    // Search Actions
    setSearchQuery,
    clearSearchQuery,

    // Bulk Actions
    setFilters,
    clearFilters,
    reset,

    // Utility Methods
    matchesServiceFilters,
    filterServices,
    getAvailableOptions
  }
}, {
  // Persist filter state to localStorage
  persist: {
    key: 'observability-filters',
    storage: localStorage,
    paths: ['services', 'environments', 'regions', 'tags', 'searchQuery']
  }
})

/**
 * Export state type for external use
 */
export type { FiltersState }
