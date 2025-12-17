/**
 * Alert Type Definitions
 * Defines all TypeScript interfaces and types for alert rules, events, and related data structures
 */

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Alert condition operators
 */
export type AlertCondition = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'not_contains';

/**
 * Alert status (resolved vs active)
 */
export type AlertStatus = 'active' | 'resolved' | 'acknowledged';

/**
 * Alert rule definition
 * Defines conditions that trigger alerts
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;                    // Metric name (e.g., 'error_rate', 'response_time')
  condition: AlertCondition;         // Comparison operator
  threshold: number;                 // Threshold value
  duration: number;                  // Duration in seconds before triggering
  severity: AlertSeverity;           // Alert severity level
  enabled: boolean;                  // Rule enabled/disabled
  service?: string;                  // Optional: specific service (if null, applies to all)
  environment?: string;              // Optional: specific environment
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: Record<string, string>;     // Custom metadata
}

/**
 * Alert event instance
 * Represents a triggered alert
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  service: string;
  metric?: string;
  value?: number;                    // Actual metric value that triggered alert
  threshold?: number;                // Threshold that was exceeded
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;                 // Null if still active
  duration?: number;                 // Duration in seconds (if resolved)
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  tags?: Record<string, string>;
}

/**
 * Alert statistics aggregation
 */
export interface AlertStatistics {
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  totalEvents: number;
  activeCount: number;
  resolvedCount: number;
  acknowledgedCount: number;
  unacknowledgedCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  avgResolutionTimeSeconds?: number;
  acknowledgedRate?: number;         // Percentage of alerts acknowledged
  countByService?: Record<string, number>;
  countByRule?: Record<string, number>;
  countBySeverity?: {
    critical: number;
    warning: number;
    info: number;
  };
}

/**
 * Alert notification for UI display
 */
export interface AlertNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;                // Link to related data (trace, metric, etc)
}

/**
 * Alert rule template for quick creation
 */
export interface AlertRuleTemplate {
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  icon?: string;
}

/**
 * Alert filter criteria
 */
export interface AlertFilterCriteria {
  severity?: AlertSeverity[];
  service?: string[];
  status?: AlertStatus[];
  ruleId?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  acknowledged?: boolean;
}

/**
 * Alert query result with pagination
 */
export interface AlertQueryResult {
  events: AlertEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Alert configuration for generation
 */
export interface AlertGeneratorConfig {
  services: string[];
  metrics: string[];
  severities: AlertSeverity[];
  conditions: AlertCondition[];
  ruleCount?: number;                // Default: 10
  eventDensity?: number;             // Events per day per rule (default: 2)
  avgDurationMinutes?: number;       // Average alert duration (default: 30)
  acknowledgedRate?: number;         // Percentage acknowledged (default: 0.7)
}

/**
 * Alert rule creation request
 */
export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  service?: string;
  environment?: string;
  tags?: Record<string, string>;
}

/**
 * Alert rule update request
 */
export interface UpdateAlertRuleRequest {
  name?: string;
  description?: string;
  threshold?: number;
  duration?: number;
  severity?: AlertSeverity;
  enabled?: boolean;
  tags?: Record<string, string>;
}

/**
 * Alert event acknowledgment request
 */
export interface AcknowledgeAlertRequest {
  eventId: string;
  userId: string;
  comment?: string;
}

/**
 * Alert event resolution request
 */
export interface ResolveAlertRequest {
  eventId: string;
  resolvedBy?: string;
  comment?: string;
}

/**
 * Bulk alert operations request
 */
export interface BulkAlertOperationRequest {
  eventIds: string[];
  operation: 'acknowledge' | 'resolve' | 'delete';
  userId?: string;
  comment?: string;
}

/**
 * Alert history entry for audit trail
 */
export interface AlertHistoryEntry {
  id: string;
  eventId: string;
  action: 'triggered' | 'acknowledged' | 'resolved' | 'rule_updated' | 'rule_created' | 'rule_deleted';
  timestamp: Date;
  userId?: string;
  details?: Record<string, any>;
}

/**
 * Alert correlation (related alerts)
 */
export interface AlertCorrelation {
  primaryEventId: string;
  relatedEventIds: string[];
  correlationType: 'same_service' | 'same_metric' | 'same_rule' | 'time_window';
  confidence: number;                // 0-1 confidence score
}

/**
 * Alert escalation policy
 */
export interface AlertEscalationPolicy {
  id: string;
  name: string;
  rules: Array<{
    severity: AlertSeverity;
    delayMinutes: number;
    action: 'notify' | 'escalate' | 'resolve';
    recipients?: string[];
  }>;
  enabled: boolean;
}

/**
 * Alert webhook payload for external integrations
 */
export interface AlertWebhookPayload {
  event: AlertEvent;
  rule: AlertRule;
  action: 'triggered' | 'resolved' | 'acknowledged';
  timestamp: Date;
  sourceSystem: string;
}
