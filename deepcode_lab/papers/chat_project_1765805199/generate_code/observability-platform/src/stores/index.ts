/**
 * Pinia Store Root Configuration
 * 
 * Central export point for all Pinia stores in the observability platform.
 * Provides store initialization and global store utilities.
 */

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Create Pinia instance with persistence plugin
export const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Export all stores
export { useTimeRangeStore } from './timeRange'
export { useFiltersStore } from './filters'
export { useDashboardStore } from './dashboard'

// Export types
export type { TimeRangeState } from './timeRange'
export type { FiltersState } from './filters'
export type { DashboardState } from './dashboard'

/**
 * Reset all stores to their initial state
 * Useful for testing or user logout scenarios
 */
export function resetAllStores() {
  const timeRangeStore = useTimeRangeStore()
  const filtersStore = useFiltersStore()
  const dashboardStore = useDashboardStore()

  timeRangeStore.$reset()
  filtersStore.$reset()
  dashboardStore.$reset()
}

/**
 * Export store state for debugging or persistence
 */
export function exportStoreState() {
  const timeRangeStore = useTimeRangeStore()
  const filtersStore = useFiltersStore()
  const dashboardStore = useDashboardStore()

  return {
    timeRange: timeRangeStore.$state,
    filters: filtersStore.$state,
    dashboard: dashboardStore.$state,
    timestamp: Date.now(),
  }
}

/**
 * Import store state from exported data
 */
export function importStoreState(state: ReturnType<typeof exportStoreState>) {
  const timeRangeStore = useTimeRangeStore()
  const filtersStore = useFiltersStore()
  const dashboardStore = useDashboardStore()

  if (state.timeRange) {
    timeRangeStore.$patch(state.timeRange)
  }
  if (state.filters) {
    filtersStore.$patch(state.filters)
  }
  if (state.dashboard) {
    dashboardStore.$patch(state.dashboard)
  }
}

/**
 * Get all store instances
 * Useful for global operations or debugging
 */
export function getAllStores() {
  return {
    timeRange: useTimeRangeStore(),
    filters: useFiltersStore(),
    dashboard: useDashboardStore(),
  }
}

export default pinia
