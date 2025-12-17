/**
 * Composable for managing alert operations and subscriptions
 * Wraps alertsStore with additional business logic for alert fetching, filtering, and state management
 * Used by: AlertPanel, AlertHistory, AlertDetail, AlertRuleList components
 */

import { computed, ref, watch, Ref } from 'vue'
import { useAlertsStore } from '@/stores/alertsStore'
import { AlertEvent, AlertRule, DateRange } from '@/types'

/**
 * Main composable for alert operations
 * Provides reactive alert data, filtering, and mutation methods
 */
export function useAlerts() {
  const alertsStore = useAlertsStore()

  // Local state for filtering and pagination
  const selectedSeverity = ref<'all' | 'critical' | 'warning' | 'info'>('all')
  const selectedService = ref<string | null>(null)
  const selectedRule = ref<string | null>(null)
  const showAcknowledged = ref(true)
  const showResolved = ref(false)
  const searchQuery = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Computed: Filter alerts based on local state
  const filteredAlerts = computed(() => {
    let alerts = alertsStore.events

    // Filter by severity
    if (selectedSeverity.value !== 'all') {
      alerts = alerts.filter(a => a.severity === selectedSeverity.value)
    }

    // Filter by service
    if (selectedService.value) {
      alerts = alerts.filter(a => a.service === selectedService.value)
    }

    // Filter by rule
    if (selectedRule.value) {
      alerts = alerts.filter(a => a.ruleId === selectedRule.value)
    }

    // Filter by acknowledgment status
    if (!showAcknowledged.value) {
      alerts = alerts.filter(a => !a.acknowledged)
    }

    // Filter by resolution status
    if (!showResolved.value) {
      alerts = alerts.filter(a => !a.resolvedAt)
    }

    // Filter by search query (search in message and rule name)
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      alerts = alerts.filter(a => {
        const rule = alertsStore.getRuleById(a.ruleId)
        return (
          a.message.toLowerCase().includes(query) ||
          (rule && rule.name.toLowerCase().includes(query))
        )
      })
    }

    return alerts
  })

  // Computed: Paginated alerts
  const paginatedAlerts = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredAlerts.value.slice(start, end)
  })

  // Computed: Pagination info
  const paginationInfo = computed(() => ({
    total: filteredAlerts.value.length,
    page: currentPage.value,
    pageSize: pageSize.value,
    totalPages: Math.ceil(filteredAlerts.value.length / pageSize.value),
  }))

  // Computed: Active alerts only (unresolved)
  const activeAlerts = computed(() =>
    alertsStore.events.filter(a => !a.resolvedAt)
  )

  // Computed: Unacknowledged active alerts
  const unacknowledgedAlerts = computed(() =>
    activeAlerts.value.filter(a => !a.acknowledged)
  )

  // Computed: Alert counts by severity
  const alertCounts = computed(() => ({
    critical: alertsStore.criticalCount,
    warning: alertsStore.warningCount,
    info: alertsStore.infoCount,
    total: alertsStore.activeCount,
  }))

  // Computed: Unique services with active alerts
  const affectedServices = computed(() => {
    const services = new Set<string>()
    activeAlerts.value.forEach(a => services.add(a.service))
    return Array.from(services).sort()
  })

  // Computed: Unique rules with active alerts
  const affectedRules = computed(() => {
    const ruleIds = new Set<string>()
    activeAlerts.value.forEach(a => ruleIds.add(a.ruleId))
    return Array.from(ruleIds)
      .map(id => alertsStore.getRuleById(id))
      .filter((r): r is AlertRule => r !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  // Methods: Filter operations
  const setSeverityFilter = (severity: 'all' | 'critical' | 'warning' | 'info') => {
    selectedSeverity.value = severity
    currentPage.value = 1 // Reset pagination
  }

  const setServiceFilter = (service: string | null) => {
    selectedService.value = service
    currentPage.value = 1
  }

  const setRuleFilter = (ruleId: string | null) => {
    selectedRule.value = ruleId
    currentPage.value = 1
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  const clearFilters = () => {
    selectedSeverity.value = 'all'
    selectedService.value = null
    selectedRule.value = null
    searchQuery.value = ''
    showAcknowledged.value = true
    showResolved.value = false
    currentPage.value = 1
  }

  // Methods: Alert operations
  const acknowledgeAlert = (eventId: string, userId: string) => {
    alertsStore.acknowledgeAlert(eventId, userId)
  }

  const resolveAlert = (eventId: string) => {
    alertsStore.resolveAlert(eventId)
  }

  const acknowledgeMultiple = (eventIds: string[], userId: string) => {
    eventIds.forEach(id => alertsStore.acknowledgeAlert(id, userId))
  }

  const resolveMultiple = (eventIds: string[]) => {
    eventIds.forEach(id => alertsStore.resolveAlert(id))
  }

  // Methods: Rule operations
  const toggleRuleEnabled = (ruleId: string) => {
    alertsStore.toggleRuleEnabled(ruleId)
  }

  const updateRule = (ruleId: string, updates: Partial<AlertRule>) => {
    alertsStore.updateRule(ruleId, updates)
  }

  // Methods: Pagination
  const goToPage = (page: number) => {
    const maxPage = paginationInfo.value.totalPages
    currentPage.value = Math.max(1, Math.min(page, maxPage))
  }

  const nextPage = () => {
    goToPage(currentPage.value + 1)
  }

  const prevPage = () => {
    goToPage(currentPage.value - 1)
  }

  const setPageSize = (size: number) => {
    pageSize.value = Math.max(1, size)
    currentPage.value = 1
  }

  // Methods: Data retrieval
  const getAlertsByTimeRange = (timeRange: DateRange): AlertEvent[] => {
    return alertsStore.getEventsByTimeRange(timeRange.start, timeRange.end)
  }

  const getAlertsByService = (service: string): AlertEvent[] => {
    return alertsStore.getAlertsByService(service)
  }

  const getAlertsBySeverity = (severity: 'critical' | 'warning' | 'info'): AlertEvent[] => {
    return alertsStore.getAlertsBySeverity(severity)
  }

  const getAlertDetail = (eventId: string): AlertEvent | undefined => {
    return alertsStore.getEventById(eventId)
  }

  const getRuleDetail = (ruleId: string): AlertRule | undefined => {
    return alertsStore.getRuleById(ruleId)
  }

  // Methods: Batch operations
  const acknowledgeAllActive = (userId: string) => {
    const unacknowledged = unacknowledgedAlerts.value.map(a => a.id)
    acknowledgeMultiple(unacknowledged, userId)
  }

  const resolveAllActive = () => {
    const active = activeAlerts.value.map(a => a.id)
    resolveMultiple(active)
  }

  // Methods: Statistics
  const getAlertStatistics = () => {
    const stats = {
      totalActive: activeAlerts.value.length,
      totalUnacknowledged: unacknowledgedAlerts.value.length,
      criticalCount: alertCounts.value.critical,
      warningCount: alertCounts.value.warning,
      infoCount: alertCounts.value.info,
      affectedServiceCount: affectedServices.value.length,
      affectedRuleCount: affectedRules.value.length,
      acknowledgedRate: activeAlerts.value.length > 0
        ? ((activeAlerts.value.length - unacknowledgedAlerts.value.length) / activeAlerts.value.length * 100).toFixed(1)
        : '0',
    }
    return stats
  }

  // Methods: Export/Import
  const exportAlerts = (alerts: AlertEvent[] = filteredAlerts.value): string => {
    return JSON.stringify(alerts, null, 2)
  }

  const exportRules = (rules: AlertRule[] = alertsStore.rules): string => {
    return JSON.stringify(rules, null, 2)
  }

  return {
    // State
    selectedSeverity,
    selectedService,
    selectedRule,
    showAcknowledged,
    showResolved,
    searchQuery,
    currentPage,
    pageSize,

    // Computed
    filteredAlerts,
    paginatedAlerts,
    paginationInfo,
    activeAlerts,
    unacknowledgedAlerts,
    alertCounts,
    affectedServices,
    affectedRules,

    // Filter methods
    setSeverityFilter,
    setServiceFilter,
    setRuleFilter,
    setSearchQuery,
    clearFilters,

    // Alert operations
    acknowledgeAlert,
    resolveAlert,
    acknowledgeMultiple,
    resolveMultiple,
    acknowledgeAllActive,
    resolveAllActive,

    // Rule operations
    toggleRuleEnabled,
    updateRule,

    // Pagination
    goToPage,
    nextPage,
    prevPage,
    setPageSize,

    // Data retrieval
    getAlertsByTimeRange,
    getAlertsByService,
    getAlertsBySeverity,
    getAlertDetail,
    getRuleDetail,

    // Statistics
    getAlertStatistics,

    // Export
    exportAlerts,
    exportRules,
  }
}

/**
 * Composable for alert subscriptions and real-time updates
 * Provides watchers for alert state changes
 */
export function useAlertSubscriptions() {
  const alertsStore = useAlertsStore()

  // Callback refs for subscriptions
  const onAlertAdded = ref<((alert: AlertEvent) => void) | null>(null)
  const onAlertResolved = ref<((alert: AlertEvent) => void) | null>(null)
  const onAlertAcknowledged = ref<((alert: AlertEvent) => void) | null>(null)
  const onRuleUpdated = ref<((rule: AlertRule) => void) | null>(null)

  // Track previous state for change detection
  const previousEventCount = ref(alertsStore.events.length)
  const previousRuleCount = ref(alertsStore.rules.length)

  // Watch for new alerts
  watch(
    () => alertsStore.events.length,
    (newCount, oldCount) => {
      if (newCount > oldCount && onAlertAdded.value) {
        // Find the new alert (most recent)
        const newAlert = alertsStore.events[alertsStore.events.length - 1]
        onAlertAdded.value(newAlert)
      }
      previousEventCount.value = newCount
    }
  )

  // Watch for rule changes
  watch(
    () => alertsStore.rules.length,
    (newCount, oldCount) => {
      if (newCount !== oldCount && onRuleUpdated.value) {
        // Notify about rule change (could be more specific)
        const updatedRule = alertsStore.rules[alertsStore.rules.length - 1]
        onRuleUpdated.value(updatedRule)
      }
      previousRuleCount.value = newCount
    }
  )

  // Methods: Subscribe to events
  const subscribeToAlertAdded = (callback: (alert: AlertEvent) => void) => {
    onAlertAdded.value = callback
  }

  const subscribeToAlertResolved = (callback: (alert: AlertEvent) => void) => {
    onAlertResolved.value = callback
  }

  const subscribeToAlertAcknowledged = (callback: (alert: AlertEvent) => void) => {
    onAlertAcknowledged.value = callback
  }

  const subscribeToRuleUpdated = (callback: (rule: AlertRule) => void) => {
    onRuleUpdated.value = callback
  }

  // Methods: Unsubscribe
  const unsubscribeAll = () => {
    onAlertAdded.value = null
    onAlertResolved.value = null
    onAlertAcknowledged.value = null
    onRuleUpdated.value = null
  }

  return {
    subscribeToAlertAdded,
    subscribeToAlertResolved,
    subscribeToAlertAcknowledged,
    subscribeToRuleUpdated,
    unsubscribeAll,
  }
}

/**
 * Composable for alert notifications
 * Provides methods to create and manage alert notifications
 */
export function useAlertNotifications() {
  const alertsStore = useAlertsStore()
  const notifications = ref<Array<{
    id: string
    type: 'alert' | 'rule'
    severity: string
    message: string
    timestamp: Date
    read: boolean
  }>>([])

  // Methods: Create notification
  const createAlertNotification = (alert: AlertEvent) => {
    const rule = alertsStore.getRuleById(alert.ruleId)
    const notification = {
      id: alert.id,
      type: 'alert' as const,
      severity: alert.severity,
      message: `${rule?.name || 'Alert'}: ${alert.message}`,
      timestamp: alert.triggeredAt,
      read: false,
    }
    notifications.value.unshift(notification)
  }

  const createRuleNotification = (rule: AlertRule) => {
    const notification = {
      id: rule.id,
      type: 'rule' as const,
      severity: rule.severity,
      message: `Rule updated: ${rule.name}`,
      timestamp: new Date(),
      read: false,
    }
    notifications.value.unshift(notification)
  }

  // Methods: Manage notifications
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  const clearNotification = (notificationId: string) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Computed: Unread count
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  // Computed: Recent notifications
  const recentNotifications = computed(() =>
    notifications.value.slice(0, 10)
  )

  return {
    notifications,
    unreadCount,
    recentNotifications,
    createAlertNotification,
    createRuleNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  }
}
