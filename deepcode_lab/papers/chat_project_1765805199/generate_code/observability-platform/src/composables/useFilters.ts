/**
 * useFilters Composable
 * 
 * Provides comprehensive filter state management for the observability platform,
 * supporting multi-dimensional filtering (services, environments, regions, tags),
 * search queries, and optional Pinia store integration for global state persistence.
 */

import { ref, computed, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFiltersStore } from '@/stores/filters'
import type { FilterConfig, Service, Environment, Region } from '@/types'

/**
 * Configuration options for useFilters composable
 */
export interface UseFiltersOptions {
  /** Initial filter configuration */
  initialFilters?: Partial<FilterConfig>
  /** Use Pinia store for global state (default: false) */
  useStore?: boolean
  /** Callback when filters change */
  onChange?: (filters: FilterConfig) => void
  /** Enable filter persistence to localStorage (default: false) */
  enablePersistence?: boolean
  /** LocalStorage key for persistence (default: 'observability-filters') */
  persistenceKey?: string
}

/**
 * Default filter configuration
 */
const DEFAULT_FILTERS: FilterConfig = {
  services: [],
  environments: [],
  regions: [],
  tags: [],
  searchQuery: ''
}

/**
 * Main useFilters composable
 * 
 * @param options - Configuration options
 * @returns Filter state and control methods
 */
export function useFilters(options: UseFiltersOptions = {}) {
  const {
    initialFilters = {},
    useStore = false,
    onChange,
    enablePersistence = false,
    persistenceKey = 'observability-filters'
  } = options

  // Initialize store if needed
  const store = useStore ? useFiltersStore() : null
  const storeRefs = store ? storeToRefs(store) : null

  // Local state (used when not using store)
  const localFilters = ref<FilterConfig>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  })

  // Load persisted filters if enabled
  if (enablePersistence && !useStore) {
    const persisted = loadPersistedFilters(persistenceKey)
    if (persisted) {
      localFilters.value = { ...localFilters.value, ...persisted }
    }
  }

  // Computed properties that work with both store and local state
  const filters = computed<FilterConfig>(() => {
    if (storeRefs) {
      return {
        services: storeRefs.services.value,
        environments: storeRefs.environments.value,
        regions: storeRefs.regions.value,
        tags: storeRefs.tags.value,
        searchQuery: storeRefs.searchQuery.value
      }
    }
    return localFilters.value
  })

  const services = computed<string[]>(() => filters.value.services)
  const environments = computed<Environment[]>(() => filters.value.environments)
  const regions = computed<Region[]>(() => filters.value.regions)
  const tags = computed<string[]>(() => filters.value.tags)
  const searchQuery = computed<string>(() => filters.value.searchQuery)

  // Derived state
  const hasActiveFilters = computed<boolean>(() => {
    return (
      services.value.length > 0 ||
      environments.value.length > 0 ||
      regions.value.length > 0 ||
      tags.value.length > 0 ||
      searchQuery.value.trim() !== ''
    )
  })

  const activeFilterCount = computed<number>(() => {
    let count = 0
    if (services.value.length > 0) count++
    if (environments.value.length > 0) count++
    if (regions.value.length > 0) count++
    if (tags.value.length > 0) count++
    if (searchQuery.value.trim() !== '') count++
    return count
  })

  const filterSummary = computed<string>(() => {
    const parts: string[] = []
    if (services.value.length > 0) {
      parts.push(`${services.value.length} service${services.value.length > 1 ? 's' : ''}`)
    }
    if (environments.value.length > 0) {
      parts.push(`${environments.value.length} env${environments.value.length > 1 ? 's' : ''}`)
    }
    if (regions.value.length > 0) {
      parts.push(`${regions.value.length} region${regions.value.length > 1 ? 's' : ''}`)
    }
    if (tags.value.length > 0) {
      parts.push(`${tags.value.length} tag${tags.value.length > 1 ? 's' : ''}`)
    }
    if (searchQuery.value.trim() !== '') {
      parts.push('search query')
    }
    return parts.length > 0 ? parts.join(', ') : 'No filters'
  })

  // Action methods
  const setServices = (serviceIds: string[]) => {
    if (store) {
      store.setServices(serviceIds)
    } else {
      localFilters.value.services = [...serviceIds]
    }
  }

  const addService = (serviceId: string) => {
    if (store) {
      store.addService(serviceId)
    } else {
      if (!localFilters.value.services.includes(serviceId)) {
        localFilters.value.services.push(serviceId)
      }
    }
  }

  const removeService = (serviceId: string) => {
    if (store) {
      store.removeService(serviceId)
    } else {
      localFilters.value.services = localFilters.value.services.filter(id => id !== serviceId)
    }
  }

  const toggleService = (serviceId: string) => {
    if (services.value.includes(serviceId)) {
      removeService(serviceId)
    } else {
      addService(serviceId)
    }
  }

  const setEnvironments = (envs: Environment[]) => {
    if (store) {
      store.setEnvironments(envs)
    } else {
      localFilters.value.environments = [...envs]
    }
  }

  const addEnvironment = (env: Environment) => {
    if (store) {
      store.addEnvironment(env)
    } else {
      if (!localFilters.value.environments.includes(env)) {
        localFilters.value.environments.push(env)
      }
    }
  }

  const removeEnvironment = (env: Environment) => {
    if (store) {
      store.removeEnvironment(env)
    } else {
      localFilters.value.environments = localFilters.value.environments.filter(e => e !== env)
    }
  }

  const toggleEnvironment = (env: Environment) => {
    if (environments.value.includes(env)) {
      removeEnvironment(env)
    } else {
      addEnvironment(env)
    }
  }

  const setRegions = (regs: Region[]) => {
    if (store) {
      store.setRegions(regs)
    } else {
      localFilters.value.regions = [...regs]
    }
  }

  const addRegion = (region: Region) => {
    if (store) {
      store.addRegion(region)
    } else {
      if (!localFilters.value.regions.includes(region)) {
        localFilters.value.regions.push(region)
      }
    }
  }

  const removeRegion = (region: Region) => {
    if (store) {
      store.removeRegion(region)
    } else {
      localFilters.value.regions = localFilters.value.regions.filter(r => r !== region)
    }
  }

  const toggleRegion = (region: Region) => {
    if (regions.value.includes(region)) {
      removeRegion(region)
    } else {
      addRegion(region)
    }
  }

  const setTags = (tagList: string[]) => {
    if (store) {
      store.setTags(tagList)
    } else {
      localFilters.value.tags = [...tagList]
    }
  }

  const addTag = (tag: string) => {
    if (store) {
      store.addTag(tag)
    } else {
      if (!localFilters.value.tags.includes(tag)) {
        localFilters.value.tags.push(tag)
      }
    }
  }

  const removeTag = (tag: string) => {
    if (store) {
      store.removeTag(tag)
    } else {
      localFilters.value.tags = localFilters.value.tags.filter(t => t !== tag)
    }
  }

  const toggleTag = (tag: string) => {
    if (tags.value.includes(tag)) {
      removeTag(tag)
    } else {
      addTag(tag)
    }
  }

  const setSearchQuery = (query: string) => {
    if (store) {
      store.setSearchQuery(query)
    } else {
      localFilters.value.searchQuery = query
    }
  }

  const clearSearchQuery = () => {
    setSearchQuery('')
  }

  const setFilters = (newFilters: Partial<FilterConfig>) => {
    if (store) {
      store.setFilters(newFilters)
    } else {
      localFilters.value = {
        ...localFilters.value,
        ...newFilters
      }
    }
  }

  const clearFilters = () => {
    if (store) {
      store.clearFilters()
    } else {
      localFilters.value = { ...DEFAULT_FILTERS }
    }
  }

  const clearServiceFilters = () => {
    setServices([])
  }

  const clearEnvironmentFilters = () => {
    setEnvironments([])
  }

  const clearRegionFilters = () => {
    setRegions([])
  }

  const clearTagFilters = () => {
    setTags([])
  }

  const reset = () => {
    clearFilters()
  }

  // Filter matching utilities
  const matchesFilters = (item: {
    service?: string
    environment?: Environment
    region?: Region
    tags?: string[]
  }): boolean => {
    // Service filter
    if (services.value.length > 0 && item.service) {
      if (!services.value.includes(item.service)) {
        return false
      }
    }

    // Environment filter
    if (environments.value.length > 0 && item.environment) {
      if (!environments.value.includes(item.environment)) {
        return false
      }
    }

    // Region filter
    if (regions.value.length > 0 && item.region) {
      if (!regions.value.includes(item.region)) {
        return false
      }
    }

    // Tags filter (item must have at least one matching tag)
    if (tags.value.length > 0 && item.tags) {
      const hasMatchingTag = item.tags.some(tag => tags.value.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    return true
  }

  const matchesSearchQuery = (searchableText: string): boolean => {
    if (!searchQuery.value.trim()) {
      return true
    }
    return searchableText.toLowerCase().includes(searchQuery.value.toLowerCase())
  }

  const filterServices = (serviceList: Service[]): Service[] => {
    return serviceList.filter(service => {
      // Apply filters
      if (!matchesFilters({
        service: service.id,
        environment: service.environment,
        region: service.region,
        tags: service.tags
      })) {
        return false
      }

      // Apply search query
      if (searchQuery.value.trim()) {
        const searchText = `${service.name} ${service.displayName} ${service.description || ''}`
        if (!matchesSearchQuery(searchText)) {
          return false
        }
      }

      return true
    })
  }

  // Watch for changes and trigger callbacks
  watch(
    filters,
    (newFilters) => {
      if (onChange) {
        onChange(newFilters)
      }

      // Persist to localStorage if enabled
      if (enablePersistence && !useStore) {
        persistFilters(persistenceKey, newFilters)
      }
    },
    { deep: true }
  )

  return {
    // State
    filters: computed(() => filters.value),
    services,
    environments,
    regions,
    tags,
    searchQuery,

    // Derived state
    hasActiveFilters,
    activeFilterCount,
    filterSummary,

    // Service actions
    setServices,
    addService,
    removeService,
    toggleService,
    clearServiceFilters,

    // Environment actions
    setEnvironments,
    addEnvironment,
    removeEnvironment,
    toggleEnvironment,
    clearEnvironmentFilters,

    // Region actions
    setRegions,
    addRegion,
    removeRegion,
    toggleRegion,
    clearRegionFilters,

    // Tag actions
    setTags,
    addTag,
    removeTag,
    toggleTag,
    clearTagFilters,

    // Search actions
    setSearchQuery,
    clearSearchQuery,

    // Bulk actions
    setFilters,
    clearFilters,
    reset,

    // Utilities
    matchesFilters,
    matchesSearchQuery,
    filterServices
  }
}

/**
 * Standalone function to get current filters from global store
 */
export function getCurrentFilters(): FilterConfig {
  const store = useFiltersStore()
  return {
    services: store.services,
    environments: store.environments,
    regions: store.regions,
    tags: store.tags,
    searchQuery: store.searchQuery
  }
}

/**
 * Standalone function to set filters in global store
 */
export function setGlobalFilters(filters: Partial<FilterConfig>): void {
  const store = useFiltersStore()
  store.setFilters(filters)
}

/**
 * Standalone function to clear global filters
 */
export function clearGlobalFilters(): void {
  const store = useFiltersStore()
  store.clearFilters()
}

/**
 * Load persisted filters from localStorage
 */
function loadPersistedFilters(key: string): Partial<FilterConfig> | null {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load persisted filters:', error)
  }
  return null
}

/**
 * Persist filters to localStorage
 */
function persistFilters(key: string, filters: FilterConfig): void {
  try {
    localStorage.setItem(key, JSON.stringify(filters))
  } catch (error) {
    console.error('Failed to persist filters:', error)
  }
}
