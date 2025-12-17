import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilterStore } from '@/stores/filterStore'
import { useFilters } from '@/composables/useFilters'
import type { FilterSet } from '@/types'

describe('Filter System', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Filter Store', () => {
    it('should initialize with empty filters', () => {
      const store = useFilterStore()
      expect(store.activeFilters).toEqual({})
    })

    it('should set single filter', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      expect(store.activeFilters.service).toEqual(['api-service'])
    })

    it('should add filter value to existing filter', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      store.addFilterValue('service', 'auth-service')
      expect(store.activeFilters.service).toContain('api-service')
      expect(store.activeFilters.service).toContain('auth-service')
    })

    it('should remove filter value', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service', 'auth-service'])
      store.removeFilterValue('service', 'api-service')
      expect(store.activeFilters.service).toEqual(['auth-service'])
    })

    it('should clear specific filter', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      store.setFilter('environment', ['production'])
      store.clearFilter('service')
      expect(store.activeFilters.service).toBeUndefined()
      expect(store.activeFilters.environment).toEqual(['production'])
    })

    it('should clear all filters', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      store.setFilter('environment', ['production'])
      store.setFilter('region', ['us-east-1'])
      store.clearFilter('all')
      expect(store.activeFilters).toEqual({})
    })

    it('should apply multiple filters at once', () => {
      const store = useFilterStore()
      const filters: FilterSet = {
        service: ['api-service', 'auth-service'],
        environment: ['production'],
        region: ['us-east-1']
      }
      store.applyMultiple(filters)
      expect(store.activeFilters).toEqual(filters)
    })

    it('should save and load filter preset', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      store.setFilter('environment', ['production'])
      store.savePreset('my-preset')
      
      store.clearFilter('all')
      expect(store.activeFilters).toEqual({})
      
      store.loadPreset('my-preset')
      expect(store.activeFilters.service).toEqual(['api-service'])
      expect(store.activeFilters.environment).toEqual(['production'])
    })

    it('should check if filter is active', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      expect(store.isFilterActive('service', 'api-service')).toBe(true)
      expect(store.isFilterActive('service', 'auth-service')).toBe(false)
    })

    it('should compute active filter count', () => {
      const store = useFilterStore()
      expect(store.activeFilterCount).toBe(0)
      
      store.setFilter('service', ['api-service', 'auth-service'])
      expect(store.activeFilterCount).toBe(1)
      
      store.setFilter('environment', ['production'])
      expect(store.activeFilterCount).toBe(2)
    })

    it('should compute total filter value count', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service', 'auth-service'])
      store.setFilter('environment', ['production', 'staging'])
      expect(store.totalFilterValueCount).toBe(4)
    })

    it('should generate filter summary', () => {
      const store = useFilterStore()
      store.setFilter('service', ['api-service'])
      store.setFilter('environment', ['production'])
      const summary = store.filterSummary
      expect(summary).toContain('api-service')
      expect(summary).toContain('production')
    })
  })

  describe('Filter Composable', () => {
    it('should initialize with empty filters', () => {
      const { activeFilters } = useFilters()
      expect(activeFilters.value).toEqual({})
    })

    it('should apply filter via composable', () => {
      const { applyFilter, activeFilters } = useFilters()
      applyFilter('service', ['api-service'])
      expect(activeFilters.value.service).toEqual(['api-service'])
    })

    it('should add filter value', () => {
      const { addFilter, activeFilters } = useFilters()
      addFilter('service', 'api-service')
      addFilter('service', 'auth-service')
      expect(activeFilters.value.service).toContain('api-service')
      expect(activeFilters.value.service).toContain('auth-service')
    })

    it('should remove filter value', () => {
      const { addFilter, removeFilter, activeFilters } = useFilters()
      addFilter('service', 'api-service')
      addFilter('service', 'auth-service')
      removeFilter('service', 'api-service')
      expect(activeFilters.value.service).toEqual(['auth-service'])
    })

    it('should clear filters', () => {
      const { applyFilter, clearFilter, activeFilters } = useFilters()
      applyFilter('service', ['api-service'])
      applyFilter('environment', ['production'])
      clearFilter()
      expect(activeFilters.value).toEqual({})
    })

    it('should apply multiple filters', () => {
      const { applyMultiple, activeFilters } = useFilters()
      const filters: FilterSet = {
        service: ['api-service'],
        environment: ['production'],
        region: ['us-east-1']
      }
      applyMultiple(filters)
      expect(activeFilters.value).toEqual(filters)
    })

    it('should filter data with AND/OR logic', () => {
      const { getFilteredData } = useFilters()
      
      const testData = [
        { service: 'api-service', environment: 'production', level: 'ERROR' },
        { service: 'api-service', environment: 'staging', level: 'INFO' },
        { service: 'auth-service', environment: 'production', level: 'ERROR' },
        { service: 'auth-service', environment: 'staging', level: 'WARN' }
      ]
      
      const filters: FilterSet = {
        service: ['api-service'],
        environment: ['production']
      }
      
      const rules = {
        service: (item: any, val: string) => item.service === val,
        environment: (item: any, val: string) => item.environment === val
      }
      
      const filtered = getFilteredData(testData, filters, rules)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].service).toBe('api-service')
      expect(filtered[0].environment).toBe('production')
    })

    it('should apply OR logic within same filter type', () => {
      const { getFilteredData } = useFilters()
      
      const testData = [
        { service: 'api-service', level: 'ERROR' },
        { service: 'auth-service', level: 'ERROR' },
        { service: 'user-service', level: 'INFO' }
      ]
      
      const filters: FilterSet = {
        service: ['api-service', 'auth-service']  // OR logic
      }
      
      const rules = {
        service: (item: any, val: string) => item.service === val
      }
      
      const filtered = getFilteredData(testData, filters, rules)
      expect(filtered).toHaveLength(2)
      expect(filtered.map((f: any) => f.service)).toContain('api-service')
      expect(filtered.map((f: any) => f.service)).toContain('auth-service')
    })

    it('should save and load filter preset', () => {
      const { applyFilter, savePreset, loadPreset, activeFilters } = useFilters()
      applyFilter('service', ['api-service'])
      applyFilter('environment', ['production'])
      
      savePreset('test-preset')
      
      clearFilter()
      expect(activeFilters.value).toEqual({})
      
      loadPreset('test-preset')
      expect(activeFilters.value.service).toEqual(['api-service'])
      expect(activeFilters.value.environment).toEqual(['production'])
    })

    it('should compute active filter count', () => {
      const { applyFilter, activeFilterCount } = useFilters()
      expect(activeFilterCount.value).toBe(0)
      
      applyFilter('service', ['api-service'])
      expect(activeFilterCount.value).toBe(1)
      
      applyFilter('environment', ['production'])
      expect(activeFilterCount.value).toBe(2)
    })

    it('should check if filter is active', () => {
      const { applyFilter, isFilterActive } = useFilters()
      applyFilter('service', ['api-service'])
      expect(isFilterActive('service', 'api-service')).toBe(true)
      expect(isFilterActive('service', 'auth-service')).toBe(false)
    })
  })

  describe('Filter UI State', () => {
    it('should toggle filter section expansion', () => {
      const { toggleFilterSection, expandedFilters } = useFilters()
      expect(expandedFilters.value.service).toBe(false)
      
      toggleFilterSection('service')
      expect(expandedFilters.value.service).toBe(true)
      
      toggleFilterSection('service')
      expect(expandedFilters.value.service).toBe(false)
    })

    it('should set search query for filter', () => {
      const { setSearchQuery, searchQueries } = useFilters()
      setSearchQuery('service', 'api')
      expect(searchQueries.value.service).toBe('api')
    })

    it('should clear search query', () => {
      const { setSearchQuery, clearSearchQuery, searchQueries } = useFilters()
      setSearchQuery('service', 'api')
      clearSearchQuery('service')
      expect(searchQueries.value.service).toBe('')
    })

    it('should filter options by search query', () => {
      const { getFilteredOptions } = useFilters()
      const options = ['api-service', 'auth-service', 'user-service', 'payment-service']
      
      const filtered = getFilteredOptions('service', options, 'api')
      expect(filtered).toContain('api-service')
      expect(filtered).not.toContain('auth-service')
    })
  })

  describe('Advanced Filter Operations', () => {
    it('should validate filters', () => {
      const { validateFilters } = useFilters()
      
      const validFilters: FilterSet = {
        service: ['api-service'],
        environment: ['production']
      }
      
      const result = validateFilters(validFilters)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should get filter statistics', () => {
      const { getFilterStatistics } = useFilters()
      
      const testData = [
        { service: 'api-service', environment: 'production' },
        { service: 'api-service', environment: 'staging' },
        { service: 'auth-service', environment: 'production' },
        { service: 'auth-service', environment: 'production' }
      ]
      
      const stats = getFilterStatistics(testData)
      expect(stats.service['api-service']).toBe(2)
      expect(stats.service['auth-service']).toBe(2)
      expect(stats.environment['production']).toBe(3)
      expect(stats.environment['staging']).toBe(1)
    })

    it('should export filters to JSON', () => {
      const { applyFilter, exportFilters } = useFilters()
      applyFilter('service', ['api-service'])
      applyFilter('environment', ['production'])
      
      const json = exportFilters()
      expect(json).toContain('api-service')
      expect(json).toContain('production')
    })

    it('should import filters from JSON', () => {
      const { importFilters, activeFilters } = useFilters()
      const json = JSON.stringify({
        service: ['api-service'],
        environment: ['production']
      })
      
      const success = importFilters(json)
      expect(success).toBe(true)
      expect(activeFilters.value.service).toEqual(['api-service'])
      expect(activeFilters.value.environment).toEqual(['production'])
    })
  })

  describe('Filter Integration', () => {
    it('should persist filters to localStorage', () => {
      const { applyFilter } = useFilters()
      applyFilter('service', ['api-service'])
      
      // Verify localStorage was updated
      const stored = localStorage.getItem('monitoring_filters_active')
      expect(stored).toBeDefined()
      expect(stored).toContain('api-service')
    })

    it('should restore filters from localStorage', () => {
      // Set initial filters
      const { applyFilter: applyFilter1 } = useFilters()
      applyFilter1('service', ['api-service'])
      
      // Create new composable instance (simulating page reload)
      const { activeFilters: activeFilters2 } = useFilters()
      expect(activeFilters2.value.service).toEqual(['api-service'])
    })

    it('should handle filter changes across modules', () => {
      const filterStore = useFilterStore()
      const { activeFilters } = useFilters()
      
      // Change via store
      filterStore.setFilter('service', ['api-service'])
      
      // Verify composable reflects change
      expect(activeFilters.value.service).toEqual(['api-service'])
    })

    it('should clear filters when navigating between modules', () => {
      const { applyFilter, clearFilter } = useFilters()
      applyFilter('service', ['api-service'])
      
      // Simulate navigation
      clearFilter()
      
      const { activeFilters } = useFilters()
      expect(activeFilters.value).toEqual({})
    })
  })
})
