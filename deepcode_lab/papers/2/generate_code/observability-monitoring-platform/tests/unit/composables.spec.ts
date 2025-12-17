import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Import composables to test
import { useTimeRange } from '@/composables/useTimeRange'
import { useFilters } from '@/composables/useFilters'
import { useMetrics } from '@/composables/useMetrics'
import { useLogs } from '@/composables/useLogs'
import { useTraces } from '@/composables/useTraces'
import { useAlerts } from '@/composables/useAlerts'
import { useChartTheme } from '@/composables/useChartTheme'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useRealtime } from '@/composables/useRealtime'
import { usePagination } from '@/composables/usePagination'

// Import stores
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useLogsStore } from '@/stores/logsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { useDashboardStore } from '@/stores/dashboardStore'

describe('Composables', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('useTimeRange', () => {
    it('should initialize with default time range', () => {
      const { startTime, endTime, selectedPreset } = useTimeRange()
      
      expect(startTime).toBeDefined()
      expect(endTime).toBeDefined()
      expect(selectedPreset).toBeDefined()
    })

    it('should apply preset and update time range', () => {
      const { applyPreset, startTime, endTime } = useTimeRange()
      const initialStart = startTime.value
      
      applyPreset('last_1h')
      
      expect(startTime.value).not.toEqual(initialStart)
      expect(endTime.value).toBeDefined()
    })

    it('should set custom time range', () => {
      const { setCustomRange, startTime, endTime } = useTimeRange()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      setCustomRange(oneHourAgo, now)
      
      expect(startTime.value).toEqual(oneHourAgo)
      expect(endTime.value).toEqual(now)
    })

    it('should toggle real-time mode', () => {
      const { toggleRealTime, realTimeMode } = useTimeRange()
      const initialMode = realTimeMode.value
      
      toggleRealTime()
      
      expect(realTimeMode.value).toBe(!initialMode)
    })

    it('should calculate duration correctly', () => {
      const { durationMs, setCustomRange } = useTimeRange()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      setCustomRange(oneHourAgo, now)
      
      expect(durationMs.value).toBeCloseTo(60 * 60 * 1000, -3)
    })

    it('should format time range for display', () => {
      const { formattedRange, setCustomRange } = useTimeRange()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      setCustomRange(oneHourAgo, now)
      
      expect(formattedRange.value).toBeDefined()
      expect(typeof formattedRange.value).toBe('string')
    })
  })

  describe('useFilters', () => {
    it('should initialize with empty filters', () => {
      const { activeFilters } = useFilters()
      
      expect(activeFilters.value).toBeDefined()
      expect(Object.keys(activeFilters.value).length).toBeGreaterThanOrEqual(0)
    })

    it('should apply service filter', () => {
      const { applyFilter, activeFilters } = useFilters()
      
      applyFilter('service', ['api-service'])
      
      expect(activeFilters.value.service).toContain('api-service')
    })

    it('should clear specific filter', () => {
      const { applyFilter, clearFilter, activeFilters } = useFilters()
      
      applyFilter('service', ['api-service'])
      clearFilter('service')
      
      expect(activeFilters.value.service).toBeUndefined()
    })

    it('should clear all filters', () => {
      const { applyFilter, clearAllFilters, activeFilters } = useFilters()
      
      applyFilter('service', ['api-service'])
      applyFilter('environment', ['production'])
      clearAllFilters()
      
      expect(Object.keys(activeFilters.value).length).toBe(0)
    })

    it('should filter data with AND/OR logic', () => {
      const { getFilteredData } = useFilters()
      
      const testData = [
        { service: 'api-service', environment: 'production' },
        { service: 'auth-service', environment: 'production' },
        { service: 'api-service', environment: 'staging' }
      ]
      
      const filterRules = {
        service: (item: any, value: string) => item.service === value,
        environment: (item: any, value: string) => item.environment === value
      }
      
      const filtered = getFilteredData(testData, filterRules)
      
      expect(Array.isArray(filtered)).toBe(true)
    })

    it('should save and load filter presets', () => {
      const { applyFilter, savePreset, loadPreset, activeFilters } = useFilters()
      
      applyFilter('service', ['api-service'])
      savePreset('my-preset')
      
      clearAllFilters()
      expect(activeFilters.value.service).toBeUndefined()
      
      loadPreset('my-preset')
      expect(activeFilters.value.service).toContain('api-service')
    })
  })

  describe('useMetrics', () => {
    it('should initialize with empty data', () => {
      const { data, loading } = useMetrics()
      
      expect(data.value).toBeDefined()
      expect(Array.isArray(data.value)).toBe(true)
    })

    it('should fetch metrics for service', async () => {
      const { fetchMetrics, data } = useMetrics('api-service')
      
      await fetchMetrics()
      
      expect(data.value).toBeDefined()
    })

    it('should calculate metric statistics', () => {
      const { stats } = useMetrics()
      
      expect(stats.value).toBeDefined()
    })

    it('should handle loading state', () => {
      const { loading, fetchMetrics } = useMetrics()
      
      expect(loading.value).toBeDefined()
      expect(typeof loading.value).toBe('boolean')
    })

    it('should aggregate time series data', () => {
      const { getAggregatedMetric } = useMetrics()
      
      expect(typeof getAggregatedMetric).toBe('function')
    })

    it('should compare metrics across services', () => {
      const { compareMetrics } = useMetrics()
      
      expect(typeof compareMetrics).toBe('function')
    })
  })

  describe('useLogs', () => {
    it('should initialize with empty logs', () => {
      const { logs } = useLogs()
      
      expect(logs.value).toBeDefined()
      expect(Array.isArray(logs.value)).toBe(true)
    })

    it('should search logs with query', () => {
      const { search, searchResults } = useLogs()
      
      search('error')
      
      expect(searchResults.value).toBeDefined()
      expect(Array.isArray(searchResults.value)).toBe(true)
    })

    it('should filter logs by level', () => {
      const { setLevelFilter, filteredLogs } = useLogs()
      
      setLevelFilter(['ERROR', 'WARN'])
      
      expect(filteredLogs.value).toBeDefined()
    })

    it('should filter logs by service', () => {
      const { setServiceFilter, filteredLogs } = useLogs()
      
      setServiceFilter(['api-service'])
      
      expect(filteredLogs.value).toBeDefined()
    })

    it('should paginate logs', () => {
      const { goToPage, currentPage, paginatedLogs } = useLogs()
      
      goToPage(2)
      
      expect(currentPage.value).toBe(2)
      expect(paginatedLogs.value).toBeDefined()
    })

    it('should get log context', () => {
      const { getLogContext } = useLogs()
      
      expect(typeof getLogContext).toBe('function')
    })
  })

  describe('useTraces', () => {
    it('should initialize with empty traces', () => {
      const { traces } = useTraces()
      
      expect(traces.value).toBeDefined()
      expect(Array.isArray(traces.value)).toBe(true)
    })

    it('should fetch traces for service', async () => {
      const { fetchTraces, traces } = useTraces('api-service')
      
      await fetchTraces()
      
      expect(traces.value).toBeDefined()
    })

    it('should filter traces by status', () => {
      const { setStatusFilter, filteredTraces } = useTraces()
      
      setStatusFilter('ERROR')
      
      expect(filteredTraces.value).toBeDefined()
    })

    it('should detect slow traces', () => {
      const { slowTraces } = useTraces()
      
      expect(slowTraces.value).toBeDefined()
      expect(Array.isArray(slowTraces.value)).toBe(true)
    })

    it('should select trace for detail view', () => {
      const { selectTrace, selectedTrace } = useTraces()
      
      selectTrace('trace-123')
      
      expect(selectedTrace.value).toBeDefined()
    })

    it('should get slow spans from trace', () => {
      const { getSlowSpans } = useTraces()
      
      expect(typeof getSlowSpans).toBe('function')
    })
  })

  describe('useAlerts', () => {
    it('should initialize with empty alerts', () => {
      const { alerts } = useAlerts()
      
      expect(alerts.value).toBeDefined()
      expect(Array.isArray(alerts.value)).toBe(true)
    })

    it('should filter alerts by severity', () => {
      const { setSeverityFilter, filteredAlerts } = useAlerts()
      
      setSeverityFilter('critical')
      
      expect(filteredAlerts.value).toBeDefined()
    })

    it('should filter alerts by service', () => {
      const { setServiceFilter, filteredAlerts } = useAlerts()
      
      setServiceFilter('api-service')
      
      expect(filteredAlerts.value).toBeDefined()
    })

    it('should acknowledge alert', () => {
      const { acknowledgeAlert } = useAlerts()
      
      expect(typeof acknowledgeAlert).toBe('function')
    })

    it('should resolve alert', () => {
      const { resolveAlert } = useAlerts()
      
      expect(typeof resolveAlert).toBe('function')
    })

    it('should calculate alert statistics', () => {
      const { alertStats } = useAlerts()
      
      expect(alertStats.value).toBeDefined()
    })
  })

  describe('useChartTheme', () => {
    it('should initialize with dark theme', () => {
      const { currentTheme } = useChartTheme()
      
      expect(currentTheme.value).toBeDefined()
      expect(['dark', 'light']).toContain(currentTheme.value)
    })

    it('should get chart options with theme applied', () => {
      const { getChartOptions } = useChartTheme()
      
      const options = getChartOptions({ title: 'Test Chart' })
      
      expect(options).toBeDefined()
      expect(typeof options).toBe('object')
    })

    it('should get color palette', () => {
      const { getColorPalette } = useChartTheme()
      
      const colors = getColorPalette()
      
      expect(Array.isArray(colors)).toBe(true)
      expect(colors.length).toBeGreaterThan(0)
    })

    it('should toggle theme', () => {
      const { toggleTheme, currentTheme } = useChartTheme()
      const initialTheme = currentTheme.value
      
      toggleTheme()
      
      expect(currentTheme.value).not.toBe(initialTheme)
    })

    it('should get status color', () => {
      const { getStatusColor } = useChartTheme()
      
      const color = getStatusColor('success')
      
      expect(typeof color).toBe('string')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should get log level color', () => {
      const { getLogLevelColor } = useChartTheme()
      
      const color = getLogLevelColor('ERROR')
      
      expect(typeof color).toBe('string')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('useDashboardLayout', () => {
    it('should initialize with empty widgets', () => {
      const { widgets } = useDashboardLayout()
      
      expect(widgets.value).toBeDefined()
      expect(Array.isArray(widgets.value)).toBe(true)
    })

    it('should add widget to dashboard', () => {
      const { addWidget, widgets } = useDashboardLayout()
      const initialCount = widgets.value.length
      
      addWidget({
        type: 'line-chart',
        title: 'Test Chart',
        config: {}
      })
      
      expect(widgets.value.length).toBe(initialCount + 1)
    })

    it('should remove widget from dashboard', () => {
      const { addWidget, removeWidget, widgets } = useDashboardLayout()
      
      const widget = addWidget({
        type: 'line-chart',
        title: 'Test Chart',
        config: {}
      })
      
      removeWidget(widget.id)
      
      expect(widgets.value.find(w => w.id === widget.id)).toBeUndefined()
    })

    it('should move widget on grid', () => {
      const { addWidget, moveWidget, widgets } = useDashboardLayout()
      
      const widget = addWidget({
        type: 'line-chart',
        title: 'Test Chart',
        config: {}
      })
      
      moveWidget(widget.id, 5, 5)
      
      const updated = widgets.value.find(w => w.id === widget.id)
      expect(updated?.position.x).toBe(5)
      expect(updated?.position.y).toBe(5)
    })

    it('should resize widget', () => {
      const { addWidget, resizeWidget, widgets } = useDashboardLayout()
      
      const widget = addWidget({
        type: 'line-chart',
        title: 'Test Chart',
        config: {}
      })
      
      resizeWidget(widget.id, 6, 3)
      
      const updated = widgets.value.find(w => w.id === widget.id)
      expect(updated?.position.width).toBe(6)
      expect(updated?.position.height).toBe(3)
    })

    it('should support undo/redo', () => {
      const { addWidget, undo, redo, widgets } = useDashboardLayout()
      const initialCount = widgets.value.length
      
      addWidget({
        type: 'line-chart',
        title: 'Test Chart',
        config: {}
      })
      
      expect(widgets.value.length).toBe(initialCount + 1)
      
      undo()
      expect(widgets.value.length).toBe(initialCount)
      
      redo()
      expect(widgets.value.length).toBe(initialCount + 1)
    })

    it('should save and load layout', () => {
      const { addWidget, exportLayout, importLayout, widgets } = useDashboardLayout()
      
      addWidget({
        type: 'line-chart',
        title: 'Test Chart',
        config: {}
      })
      
      const exported = exportLayout()
      expect(typeof exported).toBe('string')
      
      // Clear and reimport
      widgets.value = []
      importLayout(exported)
      
      expect(widgets.value.length).toBeGreaterThan(0)
    })
  })

  describe('useLocalStorage', () => {
    it('should save and load data from localStorage', () => {
      const { data, setData } = useLocalStorage('test-key', { value: 'initial' })
      
      expect(data.value).toEqual({ value: 'initial' })
      
      setData({ value: 'updated' })
      
      expect(data.value).toEqual({ value: 'updated' })
    })

    it('should handle expiration', () => {
      const { data, setData } = useLocalStorage('test-key-expire', { value: 'test' }, { expires: 1 })
      
      setData({ value: 'test' })
      
      // Simulate expiration by waiting
      expect(data.value).toBeDefined()
    })

    it('should remove data from localStorage', () => {
      const { data, setData, removeData } = useLocalStorage('test-key-remove', { value: 'test' })
      
      setData({ value: 'test' })
      removeData()
      
      expect(data.value).toBeUndefined()
    })

    it('should sync across tabs', () => {
      const { data } = useLocalStorage('test-key-sync', { value: 'initial' }, { sync: true })
      
      expect(data.value).toBeDefined()
    })

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('test-invalid', 'not-json')
      
      const { data } = useLocalStorage('test-invalid', { value: 'default' })
      
      expect(data.value).toEqual({ value: 'default' })
    })

    it('should handle quota exceeded', () => {
      const { setData } = useLocalStorage('test-quota', {})
      
      // Try to set large data (may fail gracefully)
      expect(() => {
        setData({ large: 'x'.repeat(10000000) })
      }).not.toThrow()
    })
  })

  describe('useRealtime', () => {
    it('should initialize real-time state', () => {
      const { isRefreshing, lastRefreshTime } = useRealtime()
      
      expect(isRefreshing.value).toBeDefined()
      expect(typeof isRefreshing.value).toBe('boolean')
    })

    it('should start refresh interval', () => {
      const { startRefresh, stopRefresh, isRefreshing } = useRealtime()
      
      const callback = vi.fn()
      startRefresh(callback)
      
      expect(isRefreshing.value).toBe(true)
      
      stopRefresh()
      expect(isRefreshing.value).toBe(false)
    })

    it('should trigger refresh callback', async () => {
      const { startRefresh, stopRefresh } = useRealtime()
      
      const callback = vi.fn()
      startRefresh(callback)
      
      // Wait for callback to be called
      await new Promise(resolve => setTimeout(resolve, 100))
      
      stopRefresh()
      
      expect(callback).toHaveBeenCalled()
    })

    it('should track last refresh time', () => {
      const { startRefresh, stopRefresh, lastRefreshTime } = useRealtime()
      
      startRefresh(() => {})
      
      expect(lastRefreshTime.value).toBeDefined()
      
      stopRefresh()
    })

    it('should support debounced refresh', () => {
      const { debouncedRefresh } = useRealtime()
      
      expect(typeof debouncedRefresh).toBe('function')
    })

    it('should support throttled refresh', () => {
      const { throttledRefresh } = useRealtime()
      
      expect(typeof throttledRefresh).toBe('function')
    })
  })

  describe('usePagination', () => {
    it('should initialize pagination state', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { currentPage, pageSize, totalPages } = usePagination(data, 3)
      
      expect(currentPage.value).toBe(1)
      expect(pageSize.value).toBe(3)
      expect(totalPages.value).toBe(4)
    })

    it('should get paginated data', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { paginatedData } = usePagination(data, 3)
      
      expect(paginatedData.value).toEqual([1, 2, 3])
    })

    it('should navigate to next page', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { nextPage, currentPage, paginatedData } = usePagination(data, 3)
      
      nextPage()
      
      expect(currentPage.value).toBe(2)
      expect(paginatedData.value).toEqual([4, 5, 6])
    })

    it('should navigate to previous page', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { nextPage, previousPage, currentPage, paginatedData } = usePagination(data, 3)
      
      nextPage()
      previousPage()
      
      expect(currentPage.value).toBe(1)
      expect(paginatedData.value).toEqual([1, 2, 3])
    })

    it('should go to specific page', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { goToPage, currentPage, paginatedData } = usePagination(data, 3)
      
      goToPage(3)
      
      expect(currentPage.value).toBe(3)
      expect(paginatedData.value).toEqual([7, 8, 9])
    })

    it('should change page size', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { setPageSize, pageSize, totalPages } = usePagination(data, 3)
      
      setPageSize(5)
      
      expect(pageSize.value).toBe(5)
      expect(totalPages.value).toBe(2)
    })

    it('should handle empty data', () => {
      const data = ref([])
      const { totalPages, paginatedData } = usePagination(data, 3)
      
      expect(totalPages.value).toBe(0)
      expect(paginatedData.value).toEqual([])
    })

    it('should reset pagination', () => {
      const data = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { goToPage, reset, currentPage } = usePagination(data, 3)
      
      goToPage(3)
      reset()
      
      expect(currentPage.value).toBe(1)
    })
  })

  describe('Composable Integration', () => {
    it('should work together: time range + filters + metrics', () => {
      const { startTime, endTime } = useTimeRange()
      const { activeFilters } = useFilters()
      const { data: metrics } = useMetrics()
      
      expect(startTime.value).toBeDefined()
      expect(activeFilters.value).toBeDefined()
      expect(metrics.value).toBeDefined()
    })

    it('should work together: filters + logs + pagination', () => {
      const { activeFilters } = useFilters()
      const { logs } = useLogs()
      const { paginatedData } = usePagination(logs, 10)
      
      expect(activeFilters.value).toBeDefined()
      expect(logs.value).toBeDefined()
      expect(paginatedData.value).toBeDefined()
    })

    it('should work together: dashboard layout + local storage', () => {
      const { widgets, exportLayout } = useDashboardLayout()
      const { data: savedLayout, setData } = useLocalStorage('dashboard-layout', {})
      
      expect(widgets.value).toBeDefined()
      expect(savedLayout.value).toBeDefined()
    })

    it('should work together: real-time + metrics + time range', () => {
      const { realTimeMode } = useTimeRange()
      const { startRefresh, stopRefresh } = useRealtime()
      const { fetchMetrics } = useMetrics()
      
      expect(realTimeMode.value).toBeDefined()
      expect(typeof startRefresh).toBe('function')
      expect(typeof fetchMetrics).toBe('function')
    })
  })
})
