/**
 * Dashboard Type Definitions
 * Defines all TypeScript interfaces for dashboard configurations, widgets, and related operations
 */

/**
 * Widget type enumeration
 */
export type WidgetType = 
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'gauge-chart'
  | 'heatmap-chart'
  | 'metric-card'
  | 'alert-panel'
  | 'service-health'
  | 'topology-graph'
  | 'flamechart'
  | 'gantt-chart'
  | 'custom-html';

/**
 * Widget data source type
 */
export type DataSourceType = 'metrics' | 'traces' | 'logs' | 'alerts' | 'custom';

/**
 * Chart type enumeration
 */
export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'gauge'
  | 'heatmap'
  | 'scatter'
  | 'area'
  | 'candlestick'
  | 'radar'
  | 'sankey'
  | 'tree'
  | 'sunburst';

/**
 * Widget position and size in grid units
 */
export interface WidgetPosition {
  x: number;           // Column position (0-11 for 12-column grid)
  y: number;           // Row position
  width: number;       // Width in grid units (2-12)
  height: number;      // Height in grid units (2-4)
}

/**
 * Widget configuration for data source and display
 */
export interface WidgetConfig {
  dataSource?: DataSourceType;           // Where data comes from
  metric?: string;                       // Metric name/ID for metrics data source
  metricNames?: string[];                // Multiple metrics for comparison
  service?: string;                      // Service filter
  services?: string[];                   // Multiple services for comparison
  environment?: string;                  // Environment filter
  region?: string;                       // Region filter
  chartType?: ChartType;                 // Chart visualization type
  timeRange?: {
    start: Date;
    end: Date;
  };                                     // Custom time range (overrides global)
  filters?: Record<string, any>;         // Custom filters
  threshold?: {
    warning?: number;
    critical?: number;
  };                                     // Alert thresholds
  unit?: string;                         // Metric unit (%, ms, etc)
  showLegend?: boolean;                  // Display legend
  showGrid?: boolean;                    // Display grid lines
  showTooltip?: boolean;                 // Display hover tooltip
  animation?: boolean;                   // Enable animations
  colors?: string[];                     // Custom color palette
  customHtml?: string;                   // HTML content for custom widget type
  refreshInterval?: number;              // Auto-refresh interval in seconds
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'p50' | 'p90' | 'p99';  // Aggregation method
  comparison?: {
    enabled: boolean;
    mode: 'previous_period' | 'previous_year' | 'custom';
    customRange?: {
      start: Date;
      end: Date;
    };
  };                                     // Time comparison settings
}

/**
 * Individual dashboard widget
 */
export interface DashboardWidget {
  id: string;                            // Unique widget ID (UUID)
  type: WidgetType;                      // Widget type
  title: string;                         // Display title
  description?: string;                  // Optional description
  position: WidgetPosition;              // Grid position and size
  config: WidgetConfig;                  // Widget configuration
  createdAt: Date;                       // Creation timestamp
  updatedAt: Date;                       // Last modification timestamp
  isVisible?: boolean;                   // Widget visibility toggle
  isLocked?: boolean;                    // Prevent accidental moves/resizes
  tags?: string[];                       // Custom tags for organization
}

/**
 * Complete dashboard configuration
 */
export interface DashboardConfig {
  id: string;                            // Unique dashboard ID (UUID)
  name: string;                          // Dashboard name
  description?: string;                  // Optional description
  widgets: DashboardWidget[];            // Array of widgets
  createdAt: Date;                       // Creation timestamp
  updatedAt: Date;                       // Last modification timestamp
  createdBy?: string;                    // User ID who created
  isDefault?: boolean;                   // Mark as default dashboard
  isPublic?: boolean;                    // Share with other users
  tags?: string[];                       // Custom tags for organization
  gridConfig?: {
    columns: number;                     // Grid column count (default: 12)
    gap: number;                         // Gap between widgets in pixels
    cellHeight: number;                  // Height of single grid cell in pixels
  };
  theme?: 'dark' | 'light';              // Dashboard-specific theme override
  refreshInterval?: number;              // Global refresh interval for all widgets (seconds)
  autoLayout?: boolean;                  // Auto-arrange widgets on resize
  locked?: boolean;                      // Prevent all edits
}

/**
 * Dashboard template for quick creation
 */
export interface DashboardTemplate {
  id: string;                            // Template ID
  name: string;                          // Template name
  description: string;                   // Template description
  category: 'application' | 'infrastructure' | 'business' | 'custom';  // Template category
  thumbnail?: string;                    // Preview image URL
  config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;  // Template configuration
  tags?: string[];                       // Template tags
}

/**
 * Dashboard layout snapshot for undo/redo
 */
export interface DashboardLayoutSnapshot {
  widgets: DashboardWidget[];            // Widget state at snapshot time
  timestamp: Date;                       // When snapshot was taken
  description?: string;                  // Optional description (e.g., "Before resize")
}

/**
 * Dashboard comparison result
 */
export interface DashboardComparison {
  dashboard1: DashboardConfig;
  dashboard2: DashboardConfig;
  addedWidgets: DashboardWidget[];       // Widgets in dashboard2 but not dashboard1
  removedWidgets: DashboardWidget[];     // Widgets in dashboard1 but not dashboard2
  modifiedWidgets: {
    widget: DashboardWidget;
    changes: Record<string, any>;        // Changed properties
  }[];
}

/**
 * Dashboard export format
 */
export interface DashboardExport {
  version: string;                       // Export format version
  exportedAt: Date;                      // Export timestamp
  dashboard: DashboardConfig;            // Dashboard configuration
  metadata?: Record<string, any>;        // Additional metadata
}

/**
 * Dashboard import result
 */
export interface DashboardImportResult {
  success: boolean;
  dashboardId?: string;                  // ID of imported dashboard
  errors?: string[];                     // Import errors if any
  warnings?: string[];                   // Non-fatal warnings
}

/**
 * Widget statistics for analytics
 */
export interface WidgetStatistics {
  widgetId: string;
  type: WidgetType;
  viewCount: number;                     // Times viewed
  lastViewedAt?: Date;                   // Last view timestamp
  refreshCount: number;                  // Times refreshed
  errorCount: number;                    // Times errored
  averageLoadTimeMs: number;             // Average load time
}

/**
 * Dashboard usage statistics
 */
export interface DashboardStatistics {
  dashboardId: string;
  viewCount: number;
  lastViewedAt?: Date;
  widgetStats: WidgetStatistics[];
  totalLoadTimeMs: number;               // Sum of all widget load times
  errorRate: number;                     // Percentage of failed loads
}

/**
 * Dashboard search/filter criteria
 */
export interface DashboardSearchCriteria {
  query?: string;                        // Search by name or description
  tags?: string[];                       // Filter by tags
  category?: string;                     // Filter by category
  createdBy?: string;                    // Filter by creator
  isDefault?: boolean;                   // Filter by default status
  isPublic?: boolean;                    // Filter by public status
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'viewCount';  // Sort field
  sortOrder?: 'asc' | 'desc';            // Sort direction
  limit?: number;                        // Result limit
  offset?: number;                       // Result offset for pagination
}

/**
 * Dashboard search result
 */
export interface DashboardSearchResult {
  dashboards: DashboardConfig[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Widget drag/drop event
 */
export interface WidgetDragEvent {
  widgetId: string;
  startPosition: WidgetPosition;
  endPosition: WidgetPosition;
  timestamp: Date;
}

/**
 * Widget resize event
 */
export interface WidgetResizeEvent {
  widgetId: string;
  startSize: { width: number; height: number };
  endSize: { width: number; height: number };
  timestamp: Date;
}

/**
 * Dashboard change event for tracking modifications
 */
export interface DashboardChangeEvent {
  type: 'widget_added' | 'widget_removed' | 'widget_moved' | 'widget_resized' | 'widget_config_changed' | 'dashboard_renamed' | 'dashboard_deleted';
  dashboardId: string;
  widgetId?: string;
  changes?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

/**
 * Grid configuration for dashboard layout
 */
export interface GridConfig {
  columns: number;                       // Number of columns (default: 12)
  gap: number;                           // Gap between widgets in pixels (default: 16)
  cellHeight: number;                    // Height of single cell in pixels (default: 60)
  minWidth: number;                      // Minimum widget width in grid units (default: 2)
  maxWidth: number;                      // Maximum widget width in grid units (default: 12)
  minHeight: number;                     // Minimum widget height in grid units (default: 2)
  maxHeight: number;                     // Maximum widget height in grid units (default: 4)
}

/**
 * Dashboard validation result
 */
export interface DashboardValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
