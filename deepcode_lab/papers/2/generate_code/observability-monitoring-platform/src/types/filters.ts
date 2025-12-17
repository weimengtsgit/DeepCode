/**
 * Filter Type Definitions
 * Defines all TypeScript interfaces for multi-dimensional filtering across the observability platform
 */

/**
 * Multi-dimensional filter set for querying metrics, traces, and logs
 * Uses AND logic between filter types, OR logic within filter type
 */
export interface FilterSet {
  service?: string[]
  environment?: string[]
  region?: string[]
  instance?: string[]
  tags?: Record<string, string[]>
}

/**
 * Individual filter value with type and value
 */
export interface FilterValue {
  type: 'service' | 'environment' | 'region' | 'instance' | 'tag'
  value: string
}

/**
 * Filter rule function type for applying filters to data items
 */
export type FilterRule = (item: any, filterValue: string) => boolean

/**
 * Map of filter types to their rule functions
 */
export interface FilterRuleMap {
  service?: FilterRule
  environment?: FilterRule
  region?: FilterRule
  instance?: FilterRule
  tags?: FilterRule
}

/**
 * Filter preset for saving and loading filter combinations
 */
export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: FilterSet
  createdAt: Date
  updatedAt: Date
}

/**
 * Filter statistics showing available options and counts
 */
export interface FilterStatistics {
  availableServices: Array<{ name: string; count: number }>
  availableEnvironments: Array<{ name: string; count: number }>
  availableRegions: Array<{ name: string; count: number }>
  availableInstances: Array<{ name: string; count: number }>
  availableTags: Record<string, Array<{ value: string; count: number }>>
}

/**
 * Filter validation result
 */
export interface FilterValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Filter change event
 */
export interface FilterChangeEvent {
  type: 'add' | 'remove' | 'clear' | 'replace'
  filterType: keyof FilterSet
  values?: string[]
  timestamp: Date
}
