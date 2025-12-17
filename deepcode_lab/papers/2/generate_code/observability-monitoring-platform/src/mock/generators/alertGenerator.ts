/**
 * Alert Generator - Generates alert rules and events for the monitoring platform
 * 
 * Produces:
 * - AlertRule: Configured alert rules with conditions and thresholds
 * - AlertEvent: Historical alert events with trigger/resolution times
 * 
 * Algorithm: Rule-based event generation with threshold evaluation
 */

import { AlertRule, AlertEvent, ServiceDefinition } from '@/types';
import { generateUUID } from './utils';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Alert rule condition types
 */
export type AlertCondition = 'greater_than' | 'less_than' | 'equals' | 'not_equals';

/**
 * Configuration for alert rule generation
 */
export interface AlertRuleConfig {
  services: ServiceDefinition[];
  metrics: string[];
  severities: AlertSeverity[];
  conditions: AlertCondition[];
  ruleCount?: number; // Default: 10
}

/**
 * Configuration for alert event generation
 */
export interface AlertEventConfig {
  rules: AlertRule[];
  timeRange: { start: Date; end: Date };
  eventDensity?: number; // Events per day per rule (default: 2)
  avgDurationMinutes?: number; // Average alert duration (default: 30)
}

/**
 * Alert rule definition
 */
export interface GeneratedAlertRule extends AlertRule {
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: number; // Minutes
  severity: AlertSeverity;
}

/**
 * Alert event instance
 */
export interface GeneratedAlertEvent extends AlertEvent {
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  service: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * Pre-defined alert rule templates
 */
const ALERT_RULE_TEMPLATES = {
  high_error_rate: {
    name: 'High Error Rate',
    description: 'Error rate exceeds 1%',
    metric: 'error_rate',
    condition: 'greater_than' as AlertCondition,
    threshold: 1.0,
    duration: 5,
    severity: 'critical' as AlertSeverity
  },
  high_response_time: {
    name: 'High Response Time',
    description: 'P99 latency exceeds 500ms',
    metric: 'p99_latency',
    condition: 'greater_than' as AlertCondition,
    threshold: 500,
    duration: 5,
    severity: 'warning' as AlertSeverity
  },
  high_cpu_usage: {
    name: 'High CPU Usage',
    description: 'CPU usage exceeds 80%',
    metric: 'cpu_usage',
    condition: 'greater_than' as AlertCondition,
    threshold: 80,
    duration: 10,
    severity: 'warning' as AlertSeverity
  },
  high_memory_usage: {
    name: 'High Memory Usage',
    description: 'Memory usage exceeds 85%',
    metric: 'memory_usage',
    condition: 'greater_than' as AlertCondition,
    threshold: 85,
    duration: 10,
    severity: 'warning' as AlertSeverity
  },
  low_success_rate: {
    name: 'Low Success Rate',
    description: 'Success rate drops below 95%',
    metric: 'success_rate',
    condition: 'less_than' as AlertCondition,
    threshold: 95,
    duration: 5,
    severity: 'critical' as AlertSeverity
  },
  high_disk_io: {
    name: 'High Disk I/O',
    description: 'Disk I/O exceeds 80%',
    metric: 'disk_io',
    condition: 'greater_than' as AlertCondition,
    threshold: 80,
    duration: 5,
    severity: 'warning' as AlertSeverity
  },
  high_network_bandwidth: {
    name: 'High Network Bandwidth',
    description: 'Network bandwidth exceeds 75%',
    metric: 'network_bandwidth',
    condition: 'greater_than' as AlertCondition,
    threshold: 75,
    duration: 5,
    severity: 'warning' as AlertSeverity
  },
  service_unavailable: {
    name: 'Service Unavailable',
    description: 'Service health check failed',
    metric: 'service_health',
    condition: 'equals' as AlertCondition,
    threshold: 0,
    duration: 1,
    severity: 'critical' as AlertSeverity
  }
};

/**
 * Generate alert rules for services
 * 
 * Creates a set of pre-configured alert rules covering common monitoring scenarios
 * 
 * @param config - Configuration with services and rule parameters
 * @returns Array of AlertRule objects
 */
export function generateAlertRules(config: AlertRuleConfig): GeneratedAlertRule[] {
  const rules: GeneratedAlertRule[] = [];
  const ruleCount = config.ruleCount || 10;
  const templates = Object.values(ALERT_RULE_TEMPLATES);
  
  // Generate rules by cycling through templates and services
  let templateIndex = 0;
  for (let i = 0; i < ruleCount; i++) {
    const template = templates[templateIndex % templates.length];
    const service = config.services[i % config.services.length];
    
    const rule: GeneratedAlertRule = {
      id: generateUUID(),
      name: `${template.name} - ${service.name}`,
      description: template.description,
      metric: template.metric,
      condition: template.condition,
      threshold: template.threshold,
      duration: template.duration,
      severity: template.severity,
      enabled: true,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random past 30 days
    };
    
    rules.push(rule);
    templateIndex++;
  }
  
  return rules;
}

/**
 * Generate alert events from rules
 * 
 * Creates historical alert events based on rules and time range
 * Simulates alerts being triggered and resolved
 * 
 * @param config - Configuration with rules and time range
 * @returns Array of AlertEvent objects
 */
export function generateAlertEvents(config: AlertEventConfig): GeneratedAlertEvent[] {
  const events: GeneratedAlertEvent[] = [];
  const eventDensity = config.eventDensity || 2; // Events per day per rule
  const avgDurationMinutes = config.avgDurationMinutes || 30;
  
  const timeRangeMs = config.timeRange.end.getTime() - config.timeRange.start.getTime();
  const timeRangeDays = timeRangeMs / (24 * 60 * 60 * 1000);
  
  // Generate events for each rule
  for (const rule of config.rules) {
    const expectedEventCount = Math.ceil(timeRangeDays * eventDensity);
    
    for (let i = 0; i < expectedEventCount; i++) {
      // Random trigger time within range
      const randomOffset = Math.random() * timeRangeMs;
      const triggeredAt = new Date(config.timeRange.start.getTime() + randomOffset);
      
      // Duration varies around average (exponential distribution)
      const durationVariation = exponentialRandom(0.5, 2.0);
      const durationMs = avgDurationMinutes * 60 * 1000 * durationVariation;
      const resolvedAt = new Date(triggeredAt.getTime() + durationMs);
      
      // Some alerts not resolved yet (ongoing)
      const isResolved = resolvedAt.getTime() < config.timeRange.end.getTime();
      
      // Some alerts acknowledged
      const isAcknowledged = Math.random() < 0.7; // 70% acknowledged
      
      const event: GeneratedAlertEvent = {
        id: generateUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        service: extractServiceFromRuleName(rule.name),
        message: generateAlertMessage(rule),
        triggeredAt,
        resolvedAt: isResolved ? resolvedAt : undefined,
        acknowledged: isAcknowledged,
        acknowledgedBy: isAcknowledged ? `user_${Math.floor(Math.random() * 10)}` : undefined,
        acknowledgedAt: isAcknowledged ? new Date(triggeredAt.getTime() + Math.random() * 5 * 60 * 1000) : undefined
      };
      
      events.push(event);
    }
  }
  
  // Sort by triggered time
  return events.sort((a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime());
}

/**
 * Calculate alert statistics
 * 
 * @param events - Array of alert events
 * @returns Statistics object with counts and trends
 */
export function calculateAlertStatistics(events: GeneratedAlertEvent[]) {
  const stats = {
    totalAlerts: events.length,
    activeAlerts: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    acknowledgedCount: 0,
    unacknowledgedCount: 0,
    avgDurationMinutes: 0,
    alertsByService: {} as Record<string, number>,
    alertsBySeverity: {
      critical: 0,
      warning: 0,
      info: 0
    }
  };
  
  let totalDurationMs = 0;
  let resolvedCount = 0;
  
  for (const event of events) {
    // Count by severity
    stats.alertsBySeverity[event.severity]++;
    
    if (event.severity === 'critical') stats.criticalCount++;
    else if (event.severity === 'warning') stats.warningCount++;
    else stats.infoCount++;
    
    // Count by acknowledgment
    if (event.acknowledged) stats.acknowledgedCount++;
    else stats.unacknowledgedCount++;
    
    // Count active (unresolved)
    if (!event.resolvedAt) stats.activeAlerts++;
    
    // Count by service
    stats.alertsByService[event.service] = (stats.alertsByService[event.service] || 0) + 1;
    
    // Calculate average duration
    if (event.resolvedAt) {
      totalDurationMs += event.resolvedAt.getTime() - event.triggeredAt.getTime();
      resolvedCount++;
    }
  }
  
  if (resolvedCount > 0) {
    stats.avgDurationMinutes = Math.round(totalDurationMs / resolvedCount / 60 / 1000);
  }
  
  return stats;
}

/**
 * Get active alerts (unresolved)
 * 
 * @param events - Array of alert events
 * @returns Array of unresolved alerts
 */
export function getActiveAlerts(events: GeneratedAlertEvent[]): GeneratedAlertEvent[] {
  return events.filter(event => !event.resolvedAt);
}

/**
 * Get alerts by severity
 * 
 * @param events - Array of alert events
 * @param severity - Severity level to filter
 * @returns Filtered alerts
 */
export function getAlertsBySeverity(
  events: GeneratedAlertEvent[],
  severity: AlertSeverity
): GeneratedAlertEvent[] {
  return events.filter(event => event.severity === severity);
}

/**
 * Get alerts by service
 * 
 * @param events - Array of alert events
 * @param service - Service name to filter
 * @returns Filtered alerts
 */
export function getAlertsByService(
  events: GeneratedAlertEvent[],
  service: string
): GeneratedAlertEvent[] {
  return events.filter(event => event.service === service);
}

/**
 * Acknowledge an alert
 * 
 * @param event - Alert event to acknowledge
 * @param userId - User ID acknowledging the alert
 * @returns Updated alert event
 */
export function acknowledgeAlert(
  event: GeneratedAlertEvent,
  userId: string
): GeneratedAlertEvent {
  return {
    ...event,
    acknowledged: true,
    acknowledgedBy: userId,
    acknowledgedAt: new Date()
  };
}

/**
 * Resolve an alert
 * 
 * @param event - Alert event to resolve
 * @returns Updated alert event
 */
export function resolveAlert(event: GeneratedAlertEvent): GeneratedAlertEvent {
  return {
    ...event,
    resolvedAt: new Date()
  };
}

/**
 * Helper: Extract service name from rule name
 * 
 * @param ruleName - Rule name (e.g., "High Error Rate - api-service")
 * @returns Service name
 */
function extractServiceFromRuleName(ruleName: string): string {
  const parts = ruleName.split(' - ');
  return parts.length > 1 ? parts[1] : 'unknown';
}

/**
 * Helper: Generate alert message
 * 
 * @param rule - Alert rule
 * @returns Human-readable alert message
 */
function generateAlertMessage(rule: GeneratedAlertRule): string {
  const messages: Record<string, string> = {
    high_error_rate: `Error rate exceeded threshold of ${rule.threshold}%`,
    high_response_time: `Response time exceeded threshold of ${rule.threshold}ms`,
    high_cpu_usage: `CPU usage exceeded threshold of ${rule.threshold}%`,
    high_memory_usage: `Memory usage exceeded threshold of ${rule.threshold}%`,
    low_success_rate: `Success rate dropped below threshold of ${rule.threshold}%`,
    high_disk_io: `Disk I/O exceeded threshold of ${rule.threshold}%`,
    high_network_bandwidth: `Network bandwidth exceeded threshold of ${rule.threshold}%`,
    service_unavailable: 'Service health check failed'
  };
  
  return messages[rule.metric] || `Alert triggered for metric: ${rule.metric}`;
}

/**
 * Helper: Exponential random number
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number with exponential distribution
 */
function exponentialRandom(min: number, max: number): number {
  const random = Math.random();
  const exp = Math.exp(-5 * random);
  return min + exp * (max - min);
}
