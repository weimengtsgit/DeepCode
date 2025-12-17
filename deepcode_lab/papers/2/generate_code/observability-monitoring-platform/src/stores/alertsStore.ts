import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AlertRule, AlertEvent } from '@/types'

export const useAlertsStore = defineStore('alerts', () => {
  // State
  const rules = ref<AlertRule[]>([])
  const events = ref<AlertEvent[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdate = ref<Date | null>(null)

  // Computed properties
  const activeCount = computed(() => {
    return events.value.filter(e => !e.resolvedAt).length
  })

  const criticalCount = computed(() => {
    return events.value.filter(
      e => !e.resolvedAt && e.severity === 'critical'
    ).length
  })

  const warningCount = computed(() => {
    return events.value.filter(
      e => !e.resolvedAt && e.severity === 'warning'
    ).length
  })

  const infoCount = computed(() => {
    return events.value.filter(
      e => !e.resolvedAt && e.severity === 'info'
    ).length
  })

  const totalRules = computed(() => rules.value.length)

  const enabledRules = computed(() => {
    return rules.value.filter(r => r.enabled).length
  })

  const acknowledgedCount = computed(() => {
    return events.value.filter(e => e.acknowledged).length
  })

  const unacknowledgedCount = computed(() => {
    return events.value.filter(e => !e.acknowledged && !e.resolvedAt).length
  })

  // Actions
  function setRules(newRules: AlertRule[]) {
    rules.value = newRules
    lastUpdate.value = new Date()
  }

  function setEvents(newEvents: AlertEvent[]) {
    events.value = newEvents
    lastUpdate.value = new Date()
  }

  function addRule(rule: AlertRule) {
    rules.value.push(rule)
    lastUpdate.value = new Date()
  }

  function updateRule(ruleId: string, updates: Partial<AlertRule>) {
    const index = rules.value.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      rules.value[index] = { ...rules.value[index], ...updates }
      lastUpdate.value = new Date()
    }
  }

  function deleteRule(ruleId: string) {
    rules.value = rules.value.filter(r => r.id !== ruleId)
    lastUpdate.value = new Date()
  }

  function toggleRuleEnabled(ruleId: string) {
    const rule = rules.value.find(r => r.id === ruleId)
    if (rule) {
      rule.enabled = !rule.enabled
      lastUpdate.value = new Date()
    }
  }

  function addEvent(event: AlertEvent) {
    events.value.push(event)
    lastUpdate.value = new Date()
  }

  function acknowledgeAlert(eventId: string, userId: string) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      event.acknowledged = true
      event.acknowledgedBy = userId
      event.acknowledgedAt = new Date()
      lastUpdate.value = new Date()
    }
  }

  function resolveAlert(eventId: string) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      event.resolvedAt = new Date()
      lastUpdate.value = new Date()
    }
  }

  function clearResolvedAlerts() {
    events.value = events.value.filter(e => !e.resolvedAt)
    lastUpdate.value = new Date()
  }

  function getAlertsByService(service: string): AlertEvent[] {
    return events.value.filter(
      e => e.service === service && !e.resolvedAt
    )
  }

  function getAlertsBySeverity(severity: 'critical' | 'warning' | 'info'): AlertEvent[] {
    return events.value.filter(
      e => e.severity === severity && !e.resolvedAt
    )
  }

  function getAlertsByRule(ruleId: string): AlertEvent[] {
    return events.value.filter(
      e => e.ruleId === ruleId && !e.resolvedAt
    )
  }

  function getRuleById(ruleId: string): AlertRule | undefined {
    return rules.value.find(r => r.id === ruleId)
  }

  function getEventById(eventId: string): AlertEvent | undefined {
    return events.value.find(e => e.id === eventId)
  }

  function getRecentEvents(limit: number = 10): AlertEvent[] {
    return [...events.value]
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, limit)
  }

  function getEventsByTimeRange(startTime: Date, endTime: Date): AlertEvent[] {
    return events.value.filter(e => {
      const eventTime = new Date(e.triggeredAt)
      return eventTime >= startTime && eventTime <= endTime
    })
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }

  function setError(err: Error | null) {
    error.value = err
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    rules.value = []
    events.value = []
    loading.value = false
    error.value = null
    lastUpdate.value = null
  }

  return {
    // State
    rules,
    events,
    loading,
    error,
    lastUpdate,

    // Computed
    activeCount,
    criticalCount,
    warningCount,
    infoCount,
    totalRules,
    enabledRules,
    acknowledgedCount,
    unacknowledgedCount,

    // Actions
    setRules,
    setEvents,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleEnabled,
    addEvent,
    acknowledgeAlert,
    resolveAlert,
    clearResolvedAlerts,
    getAlertsByService,
    getAlertsBySeverity,
    getAlertsByRule,
    getRuleById,
    getEventById,
    getRecentEvents,
    getEventsByTimeRange,
    setLoading,
    setError,
    clearError,
    reset
  }
})
