import type {
  AlertRule,
  AlertEvent,
  AlertSeverity,
  AlertCondition,
  AlertStatistics,
  AlertCorrelation,
  AlertEscalationPolicy,
} from '@/types'
import type { TimeSeries, Trace, LogEntry } from '@/types'
import { mockAPI } from '@/mock/api'

/**
 * AlertsService: Business logic layer for alert management
 * Provides rule evaluation, event correlation, and statistical analysis
 */
export class AlertsService {
  /**
   * Evaluate alert rules against current metrics data
   * Returns triggered alerts based on metric values exceeding thresholds
   */
  static async evaluateRules(
    rules: AlertRule[],
    metrics: Record<string, TimeSeries>,
  ): Promise<AlertEvent[]> {
    const triggeredAlerts: AlertEvent[] = []

    for (const rule of rules) {
      if (!rule.enabled) continue

      const metricData = metrics[rule.metric]
      if (!metricData || metricData.dataPoints.length === 0) continue

      // Get the most recent data point
      const latestPoint = metricData.dataPoints[metricData.dataPoints.length - 1]
      if (!latestPoint) continue

      // Evaluate condition
      const isTriggered = this.evaluateCondition(
        latestPoint.value,
        rule.condition as AlertCondition,
        rule.threshold,
      )

      if (isTriggered) {
        const alertEvent: AlertEvent = {
          id: this.generateAlertId(),
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity as AlertSeverity,
          service: rule.service || 'unknown',
          message: `${rule.name}: ${metricData.metricName} ${rule.condition} ${rule.threshold}`,
          triggeredAt: new Date(),
          acknowledged: false,
          acknowledgedBy: undefined,
          acknowledgedAt: undefined,
          resolvedAt: undefined,
        }

        triggeredAlerts.push(alertEvent)
      }
    }

    return triggeredAlerts
  }

  /**
   * Evaluate a single condition against a value
   */
  static evaluateCondition(
    value: number,
    condition: AlertCondition,
    threshold: number,
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold
      case 'less_than':
        return value < threshold
      case 'equals':
        return Math.abs(value - threshold) < 0.001 // Float comparison tolerance
      case 'not_equals':
        return Math.abs(value - threshold) >= 0.001
      case 'contains':
        return String(value).includes(String(threshold))
      case 'not_contains':
        return !String(value).includes(String(threshold))
      default:
        return false
    }
  }

  /**
   * Correlate related alerts based on service, time window, and error patterns
   */
  static correlateAlerts(
    events: AlertEvent[],
    timeWindowMs: number = 300000, // 5 minutes default
  ): AlertCorrelation[] {
    const correlations: AlertCorrelation[] = []
    const processed = new Set<string>()

    for (let i = 0; i < events.length; i++) {
      if (processed.has(events[i].id)) continue

      const primaryAlert = events[i]
      const relatedAlerts = [primaryAlert.id]

      // Find related alerts within time window
      for (let j = i + 1; j < events.length; j++) {
        if (processed.has(events[j].id)) continue

        const secondaryAlert = events[j]
        const timeDiff = Math.abs(
          secondaryAlert.triggeredAt.getTime() - primaryAlert.triggeredAt.getTime(),
        )

        // Correlate if: same service, within time window, or same metric
        if (
          (secondaryAlert.service === primaryAlert.service ||
            timeDiff < timeWindowMs) &&
          secondaryAlert.severity === primaryAlert.severity
        ) {
          relatedAlerts.push(secondaryAlert.id)
          processed.add(secondaryAlert.id)
        }
      }

      if (relatedAlerts.length > 1) {
        correlations.push({
          id: this.generateCorrelationId(),
          primaryAlertId: primaryAlert.id,
          relatedAlertIds: relatedAlerts.slice(1),
          correlationType: 'service_based',
          confidence: 0.8,
          createdAt: new Date(),
        })
      }

      processed.add(primaryAlert.id)
    }

    return correlations
  }

  /**
   * Calculate alert statistics across event set
   */
  static calculateStatistics(events: AlertEvent[]): AlertStatistics {
    const stats: AlertStatistics = {
      totalCount: events.length,
      countBySeverity: {
        critical: 0,
        warning: 0,
        info: 0,
      },
      countByService: {},
      countByStatus: {
        active: 0,
        acknowledged: 0,
        resolved: 0,
      },
      avgResolutionTimeMs: 0,
      acknowledgmentRate: 0,
      mttr: 0, // Mean Time To Resolution
      mtta: 0, // Mean Time To Acknowledgment
    }

    let totalResolutionTime = 0
    let totalAcknowledgmentTime = 0
    let resolvedCount = 0
    let acknowledgedCount = 0

    for (const event of events) {
      // Count by severity
      stats.countBySeverity[event.severity]++

      // Count by service
      stats.countByService[event.service] = (stats.countByService[event.service] || 0) + 1

      // Count by status
      if (event.resolvedAt) {
        stats.countByStatus.resolved++
        const resolutionTime = event.resolvedAt.getTime() - event.triggeredAt.getTime()
        totalResolutionTime += resolutionTime
        resolvedCount++
      } else if (event.acknowledged) {
        stats.countByStatus.acknowledged++
        if (event.acknowledgedAt) {
          const ackTime = event.acknowledgedAt.getTime() - event.triggeredAt.getTime()
          totalAcknowledgmentTime += ackTime
          acknowledgedCount++
        }
      } else {
        stats.countByStatus.active++
      }
    }

    // Calculate averages
    if (resolvedCount > 0) {
      stats.avgResolutionTimeMs = totalResolutionTime / resolvedCount
      stats.mttr = stats.avgResolutionTimeMs
    }

    if (acknowledgedCount > 0) {
      stats.mtta = totalAcknowledgmentTime / acknowledgedCount
    }

    stats.acknowledgmentRate = events.length > 0 ? acknowledgedCount / events.length : 0

    return stats
  }

  /**
   * Detect alert storms (excessive alerts in short time window)
   */
  static detectAlertStorm(
    events: AlertEvent[],
    threshold: number = 10,
    timeWindowMs: number = 60000, // 1 minute
  ): boolean {
    if (events.length < threshold) return false

    const now = new Date()
    const recentAlerts = events.filter(
      (e) => now.getTime() - e.triggeredAt.getTime() < timeWindowMs,
    )

    return recentAlerts.length >= threshold
  }

  /**
   * Apply escalation policy to alert
   */
  static applyEscalation(
    alert: AlertEvent,
    policy: AlertEscalationPolicy,
  ): AlertEvent {
    const escalatedAlert = { ...alert }

    // Check if escalation conditions met
    const timeSinceTriggered = new Date().getTime() - alert.triggeredAt.getTime()

    for (const level of policy.escalationLevels) {
      if (timeSinceTriggered >= level.delayMs) {
        escalatedAlert.severity = level.escalatedSeverity as AlertSeverity
      }
    }

    return escalatedAlert
  }

  /**
   * Filter alerts by multiple criteria
   */
  static filterAlerts(
    events: AlertEvent[],
    filters: {
      severity?: AlertSeverity[]
      service?: string[]
      status?: ('active' | 'acknowledged' | 'resolved')[]
      timeRange?: { start: Date; end: Date }
    },
  ): AlertEvent[] {
    return events.filter((event) => {
      // Severity filter
      if (filters.severity && !filters.severity.includes(event.severity)) {
        return false
      }

      // Service filter
      if (filters.service && !filters.service.includes(event.service)) {
        return false
      }

      // Status filter
      if (filters.status) {
        let eventStatus: 'active' | 'acknowledged' | 'resolved'
        if (event.resolvedAt) {
          eventStatus = 'resolved'
        } else if (event.acknowledged) {
          eventStatus = 'acknowledged'
        } else {
          eventStatus = 'active'
        }

        if (!filters.status.includes(eventStatus)) {
          return false
        }
      }

      // Time range filter
      if (filters.timeRange) {
        if (
          event.triggeredAt < filters.timeRange.start ||
          event.triggeredAt > filters.timeRange.end
        ) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Get alerts related to a specific trace
   */
  static getAlertsForTrace(
    events: AlertEvent[],
    trace: Trace,
  ): AlertEvent[] {
    const traceTimeStart = trace.startTime
    const traceTimeEnd = trace.endTime

    return events.filter((event) => {
      // Alert triggered during trace execution
      return (
        event.triggeredAt >= traceTimeStart && event.triggeredAt <= traceTimeEnd
      )
    })
  }

  /**
   * Get alerts related to a specific log entry
   */
  static getAlertsForLog(
    events: AlertEvent[],
    log: LogEntry,
  ): AlertEvent[] {
    return events.filter((event) => {
      // Alert triggered around same time as log entry
      const timeDiff = Math.abs(
        event.triggeredAt.getTime() - log.timestamp.getTime(),
      )
      return timeDiff < 60000 && event.service === log.service // Within 1 minute, same service
    })
  }

  /**
   * Generate unique alert ID
   */
  private static generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique correlation ID
   */
  private static generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Acknowledge alert
   */
  static async acknowledgeAlert(
    eventId: string,
    userId: string,
  ): Promise<AlertEvent | null> {
    return mockAPI.acknowledgeAlert(eventId, userId)
  }

  /**
   * Resolve alert
   */
  static async resolveAlert(eventId: string): Promise<AlertEvent | null> {
    return mockAPI.resolveAlert(eventId)
  }

  /**
   * Get alert rules
   */
  static async getAlertRules(): Promise<AlertRule[]> {
    const response = await mockAPI.getAlertRules()
    return response.data || []
  }

  /**
   * Get alert events
   */
  static async getAlertEvents(
    service?: string,
    severity?: AlertSeverity,
    startTime?: Date,
    endTime?: Date,
    limit?: number,
  ): Promise<AlertEvent[]> {
    const response = await mockAPI.getAlertEvents(
      service,
      severity,
      startTime,
      endTime,
      limit,
    )
    return response.data || []
  }
}

// Export singleton instance
export const alertsService = AlertsService
