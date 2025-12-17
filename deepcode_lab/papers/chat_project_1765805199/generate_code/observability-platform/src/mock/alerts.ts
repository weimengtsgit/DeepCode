/**
 * Mock Alert Data Module
 * 
 * Provides comprehensive alert management including:
 * - Alert generation with realistic severity distribution
 * - Alert lifecycle management (firing, acknowledged, resolved)
 * - Alert filtering and search
 * - Alert statistics and aggregations
 * - Integration with metrics and traces
 */

import { faker } from '@faker-js/faker';
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  FilterConfig,
  Service,
} from '@/types';

// ============================================================================
// Constants & Configuration
// ============================================================================

const SERVICES = [
  {
    id: 'user-service',
    name: 'user-service',
    displayName: 'User Service',
    environment: 'production' as const,
    region: 'us-east-1' as const,
  },
  {
    id: 'order-service',
    name: 'order-service',
    displayName: 'Order Service',
    environment: 'production' as const,
    region: 'us-west-2' as const,
  },
  {
    id: 'payment-service',
    name: 'payment-service',
    displayName: 'Payment Service',
    environment: 'production' as const,
    region: 'eu-west-1' as const,
  },
];

// Alert rule templates
const ALERT_RULES = [
  // Critical alerts
  {
    severity: 'critical' as AlertSeverity,
    title: 'Service Down',
    description: 'Service is not responding to health checks',
    threshold: 0,
    probability: 0.02,
  },
  {
    severity: 'critical' as AlertSeverity,
    title: 'High Error Rate',
    description: 'Error rate exceeded 5% threshold',
    threshold: 5,
    probability: 0.05,
  },
  {
    severity: 'critical' as AlertSeverity,
    title: 'P99 Latency Critical',
    description: 'P99 response time exceeded 2000ms',
    threshold: 2000,
    probability: 0.03,
  },
  {
    severity: 'critical' as AlertSeverity,
    title: 'Database Connection Pool Exhausted',
    description: 'All database connections are in use',
    threshold: 100,
    probability: 0.02,
  },
  // Warning alerts
  {
    severity: 'warning' as AlertSeverity,
    title: 'High CPU Usage',
    description: 'CPU usage exceeded 80% threshold',
    threshold: 80,
    probability: 0.15,
  },
  {
    severity: 'warning' as AlertSeverity,
    title: 'High Memory Usage',
    description: 'Memory usage exceeded 85% threshold',
    threshold: 85,
    probability: 0.12,
  },
  {
    severity: 'warning' as AlertSeverity,
    title: 'Elevated Error Rate',
    description: 'Error rate exceeded 2% threshold',
    threshold: 2,
    probability: 0.1,
  },
  {
    severity: 'warning' as AlertSeverity,
    title: 'P99 Latency Warning',
    description: 'P99 response time exceeded 1000ms',
    threshold: 1000,
    probability: 0.08,
  },
  {
    severity: 'warning' as AlertSeverity,
    title: 'High Disk Usage',
    description: 'Disk usage exceeded 75% threshold',
    threshold: 75,
    probability: 0.06,
  },
  {
    severity: 'warning' as AlertSeverity,
    title: 'Slow Database Queries',
    description: 'Database query time exceeded 500ms',
    threshold: 500,
    probability: 0.07,
  },
  // Info alerts
  {
    severity: 'info' as AlertSeverity,
    title: 'Deployment Started',
    description: 'New version deployment initiated',
    threshold: 0,
    probability: 0.05,
  },
  {
    severity: 'info' as AlertSeverity,
    title: 'Configuration Changed',
    description: 'Service configuration has been updated',
    threshold: 0,
    probability: 0.04,
  },
  {
    severity: 'info' as AlertSeverity,
    title: 'Auto-scaling Triggered',
    description: 'Service instances scaled automatically',
    threshold: 0,
    probability: 0.06,
  },
  {
    severity: 'info' as AlertSeverity,
    title: 'Cache Cleared',
    description: 'Service cache has been cleared',
    threshold: 0,
    probability: 0.03,
  },
];

// Alert status distribution
const STATUS_DISTRIBUTION = {
  firing: 0.3, // 30% active alerts
  acknowledged: 0.2, // 20% acknowledged
  resolved: 0.5, // 50% resolved
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let alertsCache: Alert[] | null = null;
let cacheTimestamp = 0;

// ============================================================================
// Alert Generation
// ============================================================================

/**
 * Generates a single alert with realistic data
 */
function generateAlert(
  service: typeof SERVICES[0],
  rule: typeof ALERT_RULES[0],
  timestamp: number,
  status: AlertStatus = 'firing'
): Alert {
  const alertId = faker.string.uuid();
  const value = rule.threshold > 0 ? rule.threshold + Math.random() * rule.threshold * 0.5 : undefined;

  const alert: Alert = {
    id: alertId,
    title: `${rule.title} - ${service.displayName}`,
    description: rule.description,
    severity: rule.severity,
    status,
    service: service.name,
    timestamp,
    labels: {
      service: service.name,
      environment: service.environment,
      region: service.region,
      severity: rule.severity,
      rule: rule.title.toLowerCase().replace(/\s+/g, '_'),
    },
    annotations: {
      summary: rule.description,
      description: `${rule.title} detected on ${service.displayName}`,
      runbook_url: `https://runbooks.example.com/${service.name}/${rule.title.toLowerCase().replace(/\s+/g, '-')}`,
    },
    value,
    threshold: rule.threshold > 0 ? rule.threshold : undefined,
  };

  // Add resolution/acknowledgment data based on status
  if (status === 'resolved') {
    const resolutionDelay = Math.random() * 3600000; // 0-1 hour
    alert.resolvedAt = timestamp + resolutionDelay;
  } else if (status === 'acknowledged') {
    const ackDelay = Math.random() * 1800000; // 0-30 minutes
    alert.acknowledgedAt = timestamp + ackDelay;
    alert.acknowledgedBy = faker.person.fullName();
  }

  return alert;
}

/**
 * Generates a collection of alerts for all services
 */
function generateAlerts(count: number = 50): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();
  const timeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days

  for (let i = 0; i < count; i++) {
    // Random service
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];

    // Select alert rule based on probability
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedRule = ALERT_RULES[0];

    for (const rule of ALERT_RULES) {
      cumulativeProbability += rule.probability;
      if (random <= cumulativeProbability) {
        selectedRule = rule;
        break;
      }
    }

    // Random timestamp within time window
    const timestamp = now - Math.random() * timeWindow;

    // Determine status based on distribution
    const statusRandom = Math.random();
    let status: AlertStatus = 'firing';
    if (statusRandom < STATUS_DISTRIBUTION.resolved) {
      status = 'resolved';
    } else if (statusRandom < STATUS_DISTRIBUTION.resolved + STATUS_DISTRIBUTION.acknowledged) {
      status = 'acknowledged';
    }

    alerts.push(generateAlert(service, selectedRule, timestamp, status));
  }

  // Sort by timestamp (newest first)
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Ensures alerts cache is populated
 */
function ensureAlertsCache(): Alert[] {
  const now = Date.now();
  if (!alertsCache || now - cacheTimestamp > CACHE_DURATION) {
    alertsCache = generateAlerts(100); // Generate 100 alerts
    cacheTimestamp = now;
  }
  return alertsCache;
}

// ============================================================================
// Alert Query & Filtering
// ============================================================================

/**
 * Filters alerts based on criteria
 */
function filterAlerts(alerts: Alert[], filters?: Partial<FilterConfig>): Alert[] {
  if (!filters) return alerts;

  let filtered = [...alerts];

  // Filter by services
  if (filters.services && filters.services.length > 0) {
    filtered = filtered.filter((alert) => filters.services!.includes(alert.service));
  }

  // Filter by environments
  if (filters.environments && filters.environments.length > 0) {
    filtered = filtered.filter((alert) =>
      filters.environments!.includes(alert.labels.environment as any)
    );
  }

  // Filter by regions
  if (filters.regions && filters.regions.length > 0) {
    filtered = filtered.filter((alert) =>
      filters.regions!.includes(alert.labels.region as any)
    );
  }

  // Filter by tags (severity in this case)
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((alert) =>
      filters.tags!.some((tag) => alert.severity === tag || alert.status === tag)
    );
  }

  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (alert) =>
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.service.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Gets alerts with optional filtering
 */
export function getAlerts(filters?: Partial<FilterConfig>): Alert[] {
  const alerts = ensureAlertsCache();
  return filterAlerts(alerts, filters);
}

/**
 * Gets a single alert by ID
 */
export function getAlertById(alertId: string): Alert | null {
  const alerts = ensureAlertsCache();
  return alerts.find((alert) => alert.id === alertId) || null;
}

/**
 * Gets alerts for a specific service
 */
export function getAlertsByService(serviceId: string): Alert[] {
  const alerts = ensureAlertsCache();
  return alerts.filter((alert) => alert.service === serviceId);
}

/**
 * Gets count of active alerts (firing + acknowledged)
 */
export function getActiveAlertsCount(): number {
  const alerts = ensureAlertsCache();
  return alerts.filter((alert) => alert.status === 'firing' || alert.status === 'acknowledged')
    .length;
}

/**
 * Gets alerts by severity
 */
export function getAlertsBySeverity(severity: AlertSeverity): Alert[] {
  const alerts = ensureAlertsCache();
  return alerts.filter((alert) => alert.severity === severity);
}

/**
 * Gets alerts by status
 */
export function getAlertsByStatus(status: AlertStatus): Alert[] {
  const alerts = ensureAlertsCache();
  return alerts.filter((alert) => alert.status === status);
}

/**
 * Gets recent alerts (last 24 hours)
 */
export function getRecentAlerts(limit: number = 20): Alert[] {
  const alerts = ensureAlertsCache();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return alerts.filter((alert) => alert.timestamp >= oneDayAgo).slice(0, limit);
}

// ============================================================================
// Alert Statistics
// ============================================================================

/**
 * Calculates alert statistics
 */
export function getAlertStatistics(startTime?: number, endTime?: number) {
  const alerts = ensureAlertsCache();
  const now = Date.now();
  const start = startTime || now - 24 * 60 * 60 * 1000; // Default: last 24 hours
  const end = endTime || now;

  const filteredAlerts = alerts.filter(
    (alert) => alert.timestamp >= start && alert.timestamp <= end
  );

  // Count by severity
  const bySeverity = {
    critical: filteredAlerts.filter((a) => a.severity === 'critical').length,
    warning: filteredAlerts.filter((a) => a.severity === 'warning').length,
    info: filteredAlerts.filter((a) => a.severity === 'info').length,
  };

  // Count by status
  const byStatus = {
    firing: filteredAlerts.filter((a) => a.status === 'firing').length,
    acknowledged: filteredAlerts.filter((a) => a.status === 'acknowledged').length,
    resolved: filteredAlerts.filter((a) => a.status === 'resolved').length,
  };

  // Count by service
  const byService: Record<string, number> = {};
  filteredAlerts.forEach((alert) => {
    byService[alert.service] = (byService[alert.service] || 0) + 1;
  });

  // Calculate resolution metrics
  const resolvedAlerts = filteredAlerts.filter((a) => a.status === 'resolved' && a.resolvedAt);
  const resolutionTimes = resolvedAlerts.map((a) => a.resolvedAt! - a.timestamp);
  const avgResolutionTime =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

  // Time series data (hourly buckets)
  const timeSeriesData: Array<{
    timestamp: number;
    critical: number;
    warning: number;
    info: number;
    total: number;
  }> = [];

  const hourMs = 60 * 60 * 1000;
  for (let t = start; t <= end; t += hourMs) {
    const bucketEnd = t + hourMs;
    const bucketAlerts = filteredAlerts.filter(
      (a) => a.timestamp >= t && a.timestamp < bucketEnd
    );

    timeSeriesData.push({
      timestamp: t,
      critical: bucketAlerts.filter((a) => a.severity === 'critical').length,
      warning: bucketAlerts.filter((a) => a.severity === 'warning').length,
      info: bucketAlerts.filter((a) => a.severity === 'info').length,
      total: bucketAlerts.length,
    });
  }

  return {
    total: filteredAlerts.length,
    active: byStatus.firing + byStatus.acknowledged,
    bySeverity,
    byStatus,
    byService,
    avgResolutionTime,
    timeSeries: timeSeriesData,
  };
}

/**
 * Gets top alert rules by frequency
 */
export function getTopAlertRules(limit: number = 10): Array<{ rule: string; count: number }> {
  const alerts = ensureAlertsCache();
  const ruleCounts: Record<string, number> = {};

  alerts.forEach((alert) => {
    const rule = alert.labels.rule || 'unknown';
    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
  });

  return Object.entries(ruleCounts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================================================
// Alert Lifecycle Management
// ============================================================================

/**
 * Acknowledges an alert
 */
export function acknowledgeAlert(alertId: string, acknowledgedBy: string): Alert | null {
  const alerts = ensureAlertsCache();
  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) return null;

  if (alert.status === 'firing') {
    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;
  }

  return alert;
}

/**
 * Resolves an alert
 */
export function resolveAlert(alertId: string): Alert | null {
  const alerts = ensureAlertsCache();
  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) return null;

  if (alert.status !== 'resolved') {
    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
  }

  return alert;
}

/**
 * Bulk acknowledges alerts
 */
export function bulkAcknowledgeAlerts(
  alertIds: string[],
  acknowledgedBy: string
): { success: number; failed: number } {
  let success = 0;
  let failed = 0;

  alertIds.forEach((id) => {
    const result = acknowledgeAlert(id, acknowledgedBy);
    if (result) success++;
    else failed++;
  });

  return { success, failed };
}

/**
 * Bulk resolves alerts
 */
export function bulkResolveAlerts(alertIds: string[]): { success: number; failed: number } {
  let success = 0;
  let failed = 0;

  alertIds.forEach((id) => {
    const result = resolveAlert(id);
    if (result) success++;
    else failed++;
  });

  return { success, failed };
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clears the alerts cache (for testing)
 */
export function clearAlertsCache(): void {
  alertsCache = null;
  cacheTimestamp = 0;
}

/**
 * Forces cache refresh
 */
export function refreshAlertsCache(): Alert[] {
  clearAlertsCache();
  return ensureAlertsCache();
}

// ============================================================================
// Initialization
// ============================================================================

// Pre-generate alerts on module load
ensureAlertsCache();
