# Component Guide - Observability Monitoring Platform

## Overview

This guide documents all 47 Vue 3 components in the Observability Monitoring Platform, organized by category with complete API specifications, usage examples, and integration patterns.

---

## Table of Contents

1. [Chart Components (10)](#chart-components)
2. [Filter Components (6)](#filter-components)
3. [Time Picker Components (5)](#time-picker-components)
4. [Alert Components (4)](#alert-components)
5. [Layout Components (5)](#layout-components)
6. [Common Components (5)](#common-components)
7. [View Components (5)](#view-components)
8. [Advanced Components (2)](#advanced-components)

---

## Chart Components

### LineChart.vue

**Purpose**: Time-series metric visualization with automatic aggregation and theme support.

**Props**:
```typescript
interface LineChartProps {
  data?: TimeSeries | TimeSeries[]           // Single or multiple time-series
  config?: Partial<ChartConfig>              // Chart configuration
  loading?: boolean                          // Loading state indicator
  error?: Error | null                       // Error state with message
  showLegend?: boolean                       // Toggle legend visibility (default: true)
  showGrid?: boolean                         // Toggle grid lines (default: true)
  showTooltip?: boolean                      // Toggle hover tooltip (default: true)
  animation?: boolean                        // Enable animations (default: true)
  responsive?: boolean                       // Enable window resize handling (default: true)
  height?: string | number                   // Container height (default: '400px')
  maxDataPoints?: number                     // Aggregation threshold (default: 1000)
}
```

**Emits**: None (data-driven visualization)

**Usage Example**:
```vue
<template>
  <LineChart
    :data="metricData"
    :config="{ title: 'CPU Usage', unit: '%' }"
    :loading="isLoading"
    height="500px"
  />
</template>

<script setup lang="ts">
import { useMetrics } from '@/composables'
const { data: metricData, loading: isLoading } = useMetrics('api-service')
</script>
```

**Features**:
- LTTB aggregation for >1000 points
- Smooth interpolation for natural curves
- Gradient fill under line
- Responsive sizing with ResizeObserver
- Dark theme with customizable colors

---

### BarChart.vue

**Purpose**: Categorical and time-series metric comparison with vertical/horizontal orientation.

**Props**:
```typescript
interface BarChartProps {
  data?: TimeSeries | TimeSeries[]
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  showLegend?: boolean                       // (default: true)
  showGrid?: boolean                         // (default: true)
  showTooltip?: boolean                      // (default: true)
  animation?: boolean                        // (default: true)
  responsive?: boolean                       // (default: true)
  height?: string | number                   // (default: '400px')
  maxDataPoints?: number                     // (default: 1000)
  barWidth?: string | number                 // (default: '60%')
  barGap?: string | number                   // (default: '30%')
  barCategoryGap?: string | number           // (default: '20%')
  stacked?: boolean                          // (default: false)
  horizontal?: boolean                       // (default: false)
}
```

**Usage Example**:
```vue
<BarChart
  :data="comparisonMetrics"
  :config="{ title: 'Service Comparison' }"
  :stacked="true"
/>
```

---

### PieChart.vue

**Purpose**: Distribution visualization for categorical data (log levels, error types, etc).

**Props**:
```typescript
interface PieChartProps {
  data: TimeSeries | TimeSeries[] | Record<string, number>
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  showLegend?: boolean                       // (default: true)
  showTooltip?: boolean                      // (default: true)
  animation?: boolean                        // (default: true)
  responsive?: boolean                       // (default: true)
  height?: string | number                   // (default: '400px')
  donutMode?: boolean                        // (default: false)
  radius?: string | number                   // (default: '70%')
  innerRadius?: string | number              // (default: '0%')
  labelPosition?: 'inside' | 'outside'       // (default: 'outside')
  showPercentage?: boolean                   // (default: true)
  showValue?: boolean                        // (default: true)
}
```

**Usage Example**:
```vue
<PieChart
  :data="{ ERROR: 150, WARN: 300, INFO: 1000 }"
  :config="{ title: 'Log Level Distribution' }"
  donutMode
/>
```

---

### HeatmapChart.vue

**Purpose**: Time-intensity visualization for service activity patterns.

**Props**:
```typescript
interface HeatmapChartProps {
  data: TimeSeries[]
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  height?: string | number                   // (default: '400px')
  bucketSizeMinutes?: number                 // (default: 60)
  colorScale?: 'viridis' | 'plasma' | 'cool' | 'warm'  // (default: 'viridis')
}
```

---

### GaugeChart.vue

**Purpose**: KPI display with color-coded thresholds (healthy/warning/critical).

**Props**:
```typescript
interface GaugeChartProps {
  value: number                              // Current metric value
  min?: number                               // Minimum value (default: 0)
  max?: number                               // Maximum value (default: 100)
  config?: Partial<ChartConfig>
  warningThreshold?: number                  // Yellow threshold (default: 70)
  criticalThreshold?: number                 // Red threshold (default: 90)
  unit?: string                              // Unit label (e.g., '%', 'ms')
  height?: string | number                   // (default: '300px')
}
```

---

### FlameGraph.vue

**Purpose**: Trace execution timeline with horizontal stacked rectangles representing spans.

**Props**:
```typescript
interface FlameGraphProps {
  trace: Trace
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  height?: string | number                   // (default: '600px')
  colorBy?: 'service' | 'status'             // (default: 'service')
}
```

**Features**:
- Width proportional to span duration
- Color-coded by service or status
- Click to zoom into span
- Hover to show duration tooltip

---

### GanttChart.vue

**Purpose**: Timeline visualization showing concurrent span execution.

**Props**:
```typescript
interface GanttChartProps {
  trace: Trace
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  height?: string | number                   // (default: '600px')
}
```

**Features**:
- Horizontal timeline bars for each span
- Stacked for concurrent execution
- Color-coded by status (green/red)
- Shows parallelism clearly

---

### ChartContainer.vue

**Purpose**: Responsive wrapper providing toolbar, legend, and settings for any chart.

**Props**:
```typescript
interface ChartContainerProps {
  title?: string
  unit?: string
  height?: string | number                   // (default: '400px')
  showLegendToggle?: boolean                 // (default: true)
  showRefreshButton?: boolean                // (default: true)
  showExportButton?: boolean                 // (default: true)
  showFullscreenButton?: boolean             // (default: true)
  showSettingsButton?: boolean               // (default: true)
  showChartTypeSelector?: boolean            // (default: false)
  showTimeRange?: boolean                    // (default: true)
  legendItems?: Array<{label, color, value}>
  isRefreshing?: boolean                     // (default: false)
}
```

**Emits**:
```typescript
emit('refresh')                              // Refresh button clicked
emit('export')                               // Export button clicked
emit('chartTypeChange', type: string)        // Chart type changed
```

**Slot**: Default slot for chart component

---

### ChartLegend.vue

**Purpose**: Interactive legend with toggle visibility and value display.

**Props**:
```typescript
interface ChartLegendProps {
  items: LegendItem[]
  vertical?: boolean                         // (default: false)
  showValue?: boolean                        // (default: false)
  showControls?: boolean                     // (default: true)
  valueFormatter?: (value: number) => string
}
```

**Emits**:
```typescript
emit('toggle', index: number, visible: boolean)
emit('showAll')
emit('hideAll')
```

---

### TopologyViewer.vue

**Purpose**: Service dependency graph visualization using AntV G6.

**Props**:
```typescript
interface TopologyViewerProps {
  traces: Trace[]
  config?: Partial<ChartConfig>
  loading?: boolean
  error?: Error | null
  height?: string | number                   // (default: '600px')
  interactive?: boolean                      // (default: true)
}
```

**Features**:
- Service nodes with status colors
- Edges with call count and latency
- Interactive pan/zoom
- Click node for details
- Highlight on hover

---

## Filter Components

### FilterBar.vue

**Purpose**: Main filter control container aggregating all filter types.

**Props**: None (uses Pinia stores directly)

**Usage Example**:
```vue
<template>
  <FilterBar />
</template>
```

**Features**:
- Expandable/collapsible panel
- Active filter count badge
- Clear all button
- Filter summary display

---

### ServiceFilter.vue

**Purpose**: Multi-select dropdown for service filtering.

**Props**: None (uses stores)

**Features**:
- Search/autocomplete
- Status indicators (healthy/warning/critical)
- Select all / Clear buttons
- Checkbox-based multi-select

---

### EnvironmentFilter.vue

**Purpose**: Environment selector (Production/Staging/Testing/Development).

**Props**: None (uses stores)

**Features**:
- Radio or multi-select mode
- Predefined environment options
- Status indicators

---

### RegionFilter.vue

**Purpose**: Hierarchical region/availability zone selector.

**Props**: None (uses stores)

**Features**:
- Two-level hierarchy (Region → Zones)
- Expandable/collapsible regions
- Bidirectional sync (zone selection updates region)
- Badge showing selected count

---

### InstanceFilter.vue

**Purpose**: Instance ID autocomplete filter.

**Props**: None (uses stores)

**Features**:
- Text input with dropdown suggestions
- Real-time filtering
- Add multiple instances
- Manual entry support

---

### TagFilter.vue

**Purpose**: Custom key-value tag filtering.

**Props**: None (uses stores)

**Features**:
- Two-stage selection (key → value)
- Dynamic value extraction from data
- Chip-based display
- Add new tag keys

---

## Time Picker Components

### TimeRangePicker.vue

**Purpose**: Main time range selection container.

**Props**: None (uses Pinia store)

**Features**:
- Expandable/collapsible panel
- Integrates QuickTimeSelect, CustomDateTimeRange, RealtimeToggle
- Formatted time range display
- Apply/Cancel buttons

---

### QuickTimeSelect.vue

**Purpose**: Preset time range buttons (5m, 15m, 1h, 6h, 24h, 7d).

**Props**: None (uses store)

**Features**:
- 6 preset buttons
- Active state highlighting
- Instant application

---

### CustomDateTimeRange.vue

**Purpose**: Custom date/time range picker with validation.

**Props**: None (uses store)

**Features**:
- Separate date and time inputs
- Validation (start < end, max 90 days)
- Duration display
- Error messages

---

### RealtimeToggle.vue

**Purpose**: Real-time mode toggle with refresh interval selector.

**Props**: None (uses store)

**Features**:
- Toggle switch
- Interval selector (5s, 10s, 30s, 1min)
- "LIVE" indicator
- Auto-advance time window

---

### TimeComparison.vue

**Purpose**: Time period comparison toggle (current vs previous).

**Props**: None (uses store)

**Features**:
- Toggle comparison mode
- Automatic previous period calculation
- Dual series display in charts

---

## Alert Components

### AlertPanel.vue

**Purpose**: Dashboard widget displaying active alerts grouped by severity.

**Props**: None (uses stores)

**Features**:
- Severity grouping (critical/warning/info)
- Collapsible sections
- Show first 3 per group + "View all" link
- Acknowledgment capability
- Detail drawer on click

---

### AlertHistory.vue

**Purpose**: Paginated table of historical alert events with filtering.

**Props**: None (uses stores)

**Features**:
- Sortable columns (severity, service, triggered time)
- Filter by severity/service/status
- Pagination (10 items/page)
- Detail drawer on row click
- Acknowledgment actions

---

### AlertDetail.vue

**Purpose**: Modal/drawer displaying full alert context and related data.

**Props**:
```typescript
interface AlertDetailProps {
  alertId?: string                           // Alert ID to fetch from store
  alert?: AlertEvent | null                  // Direct alert object
}
```

**Emits**:
```typescript
emit('close')                                // Close detail view
emit('acknowledge')                          // After acknowledgment
```

**Features**:
- Full alert information display
- Rule configuration details
- Acknowledgment metadata
- Navigation to related traces/logs

---

### AlertRuleList.vue

**Purpose**: Management interface for alert rules with CRUD operations.

**Props**: None (uses stores)

**Features**:
- Rule list with columns (name, metric, condition, severity)
- Search and filter
- Enable/disable toggle
- Edit via drawer
- Delete with confirmation
- Pagination

---

## Layout Components

### MainLayout.vue

**Purpose**: Root layout wrapper with header, sidebar, and content area.

**Props**: None (uses stores)

**Features**:
- Fixed header (60px height)
- Fixed sidebar (260px width, collapsible to 80px)
- Scrollable content area
- Modal/notification management
- Global loading overlay

---

### Header.vue

**Purpose**: Top navigation bar with time/filter controls and alerts.

**Props**: None (uses stores)

**Features**:
- Breadcrumb navigation
- Time range picker
- Filter bar
- Alert count badge
- Theme toggle
- User menu

---

### Sidebar.vue

**Purpose**: Left navigation menu with collapsible sections.

**Props**: None (uses stores)

**Features**:
- Menu items (Dashboard, Metrics, Tracing, Logs, Custom)
- Active state highlighting
- Collapse/expand animation
- Theme toggle in footer
- Settings access

---

### PageContent.vue

**Purpose**: Main scrollable content container with loading/error states.

**Props**:
```typescript
interface PageContentProps {
  isLoading?: boolean
  loadingMessage?: string                    // (default: 'Loading...')
  hasError?: boolean
  error?: Error | null
  errorTitle?: string                        // (default: 'Something went wrong')
  showFAB?: boolean                          // Show floating action button
}
```

**Emits**:
```typescript
emit('retry')                                // Retry button clicked
```

**Slots**:
- `default`: Main content area
- `header-actions`: Page-level action buttons
- `fab`: Floating action button content

**Features**:
- Loading skeleton display
- Error state with retry
- Scroll-to-top button
- Responsive layout

---

### Breadcrumbs.vue

**Purpose**: Navigation context display showing current page path.

**Props**: None (uses router)

**Features**:
- Clickable breadcrumb items
- Navigation history
- Current page highlight
- Responsive truncation

---

## Common Components

### LoadingSkeleton.vue

**Purpose**: Pulsing placeholder during data loading.

**Props**:
```typescript
interface LoadingSkeletonProps {
  width?: string | number                    // (default: '100%')
  height?: string | number                   // (default: '20px')
  count?: number                             // Number of skeleton lines (default: 1)
  circle?: boolean                           // Circular skeleton (default: false)
}
```

**Features**:
- CSS animation pulsing
- Customizable dimensions
- Multiple line support

---

### EmptyState.vue

**Purpose**: Display when no data available.

**Props**:
```typescript
interface EmptyStateProps {
  iconType?: 'no-data' | 'no-results' | 'empty-folder' | 'error'
  customIcon?: any                           // Custom icon component
  title?: string                             // (default: 'No Data Available')
  description?: string
  actionButtonLabel?: string
  showActionButton?: boolean                 // (default: false)
  actionButtonPrimary?: boolean              // (default: true)
  compact?: boolean                          // (default: false)
}
```

**Emits**:
```typescript
emit('action')                               // Action button clicked
```

**Slots**:
- `icon`: Custom icon replacement
- `actions`: Custom action area

---

### ErrorState.vue

**Purpose**: Display error information with recovery options.

**Props**:
```typescript
interface ErrorStateProps {
  title?: string                             // (default: 'Something went wrong')
  description?: string
  errorCode?: string | number
  errorDetails?: string
  severity?: 'error' | 'warning' | 'critical'  // (default: 'error')
  showRetryButton?: boolean                  // (default: true)
  retryButtonLabel?: string                  // (default: 'Retry')
  showActionButton?: boolean
  actionButtonLabel?: string
  showSupportLink?: boolean
  compact?: boolean
  showDetails?: boolean
  customIcon?: Component
}
```

**Emits**:
```typescript
emit('retry')
emit('action')
emit('support')
```

**Slots**:
- `icon`: Custom error icon
- `actions`: Custom action buttons

---

### ConfirmDialog.vue

**Purpose**: Modal confirmation dialog.

**Props**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message?: string
  severity?: 'info' | 'warning' | 'error' | 'success'  // (default: 'info')
  confirmButtonLabel?: string                // (default: 'Confirm')
  cancelButtonLabel?: string                 // (default: 'Cancel')
  showIcon?: boolean                         // (default: true)
  showCloseButton?: boolean                  // (default: true)
  isLoading?: boolean                        // (default: false)
  isConfirmEnabled?: boolean                 // (default: true)
  closeOnBackdropClick?: boolean             // (default: true)
  closeOnEscape?: boolean                    // (default: true)
}
```

**Emits**:
```typescript
emit('confirm')
emit('cancel')
emit('close')
```

**Slots**:
- `content`: Custom content area
- `actions`: Custom footer buttons

---

### InfoDrawer.vue

**Purpose**: Side panel for detailed information display.

**Props**:
```typescript
interface InfoDrawerProps {
  isOpen: boolean
  title?: string                             // (default: 'Details')
  content?: string
  width?: number | string                    // (default: '400px')
  position?: 'right' | 'left'                // (default: 'right')
  showCloseButton?: boolean                  // (default: true)
  showFooter?: boolean                       // (default: false)
  showPrimaryAction?: boolean                // (default: false)
  showSecondaryAction?: boolean              // (default: false)
  primaryActionLabel?: string                // (default: 'Save')
  secondaryActionLabel?: string              // (default: 'Cancel')
  isPrimaryActionDisabled?: boolean          // (default: false)
  closeOnBackdropClick?: boolean             // (default: true)
  closeOnEscape?: boolean                    // (default: true)
  isLoading?: boolean                        // (default: false)
}
```

**Emits**:
```typescript
emit('close')
emit('primaryAction')
emit('secondaryAction')
```

**Slots**:
- `content`: Custom content area
- `actions`: Custom footer actions

---

## View Components

### Dashboard.vue

**Purpose**: Main overview page with service health, KPIs, alerts, and trends.

**Props**: None (uses stores)

**Features**:
- Service health board (3 services)
- 4 KPI cards (error rate, latency, QPS, CPU)
- Alert panel (active alerts)
- 4 trend charts (error rate, latency, QPS, CPU)
- Real-time refresh support
- Drill-down navigation

---

### Metrics.vue

**Purpose**: Detailed metrics analysis with service selection and comparisons.

**Props**: None (uses route query params)

**Features**:
- Service list (left panel)
- Metric detail view (right panel)
- Business metrics (error rate, success rate, QPS, P50/P90/P99)
- System metrics (CPU, memory, disk I/O, network)
- Chart type switching (line, bar, pie, heatmap)
- Multi-service comparison
- Time period comparison

---

### Tracing.vue

**Purpose**: Distributed trace visualization with multiple views.

**Props**: None (uses stores)

**Features**:
- Trace list (left panel, 10 per page)
- Visualization tabs:
  - Topology: Service dependency graph
  - Flamechart: Trace execution timeline
  - Gantt: Concurrent span timeline
  - Spans: Detailed span list
  - Slow Queries: Performance bottlenecks
- Search by trace ID
- Filter by status (success/error)
- Slow span highlighting
- Pagination

---

### Logs.vue

**Purpose**: Log search and analytics with virtual scrolling.

**Props**: None (uses stores)

**Features**:
- Log stream (left panel, 50 per page)
- Search bar (keyword + regex support)
- Filters (service, level, traceId)
- Statistics sidebar (right panel)
- Log detail drawer
- Context logs (±5 surrounding logs)
- Cross-module navigation to traces
- Export to CSV

---

### Custom.vue

**Purpose**: User-configurable dashboard builder with drag-drop.

**Props**: None (uses stores)

**Features**:
- 12-column drag-drop grid
- Widget resizing with handles
- Chart configuration modal
- Dashboard templates (Application, Infrastructure)
- Save/load dashboards
- Undo/redo support
- Export/import as JSON
- Responsive grid layout

---

## Advanced Components

### DragDropGrid.vue

**Purpose**: 12-column responsive grid layout engine for dashboard widgets.

**Props**:
```typescript
interface DragDropGridProps {
  widgets: DashboardWidget[]
  gridConfig?: GridConfig
  editable?: boolean                         // (default: true)
  showGridLines?: boolean                    // (default: false)
}
```

**Emits**:
```typescript
emit('widgetMoved', widgetId: string, x: number, y: number)
emit('widgetResized', widgetId: string, width: number, height: number)
emit('widgetSelected', widgetId: string)
```

**Features**:
- Drag to reposition
- Resize with corner handles
- Snap to grid
- Overlap detection
- Min/max size constraints

---

### DashboardWidget.vue

**Purpose**: Individual widget wrapper with configuration and rendering.

**Props**:
```typescript
interface DashboardWidgetProps {
  widget: DashboardWidget
  editable?: boolean                         // (default: true)
  selected?: boolean                         // (default: false)
}
```

**Emits**:
```typescript
emit('configure')                            // Open configuration modal
emit('remove')                               // Delete widget
emit('select')                               // Select widget
```

**Features**:
- Dynamic chart rendering based on widget type
- Configuration button
- Delete button
- Selection highlight
- Loading/error states

---

## Integration Patterns

### Cross-Module Navigation

```vue
<!-- From Dashboard to Metrics -->
<button @click="navigateToMetrics('api-service')">
  View Metrics
</button>

<!-- From Metrics to Tracing -->
<button @click="navigateToTraces('api-service', timeRange)">
  View Traces
</button>

<!-- From Tracing to Logs -->
<button @click="navigateToLogs(traceId, service)">
  View Logs
</button>
```

### Real-Time Updates

```vue
<script setup lang="ts">
import { useRealtime } from '@/composables'

const { startRefresh, stopRefresh } = useRealtime()

onMounted(() => {
  startRefresh(() => {
    // Refresh data
    fetchMetrics()
  })
})

onUnmounted(() => {
  stopRefresh()
})
</script>
```

### Filter Application

```vue
<script setup lang="ts">
import { useFilters } from '@/composables'

const { activeFilters, getFilteredData } = useFilters()

const filteredMetrics = computed(() => {
  return getFilteredData(allMetrics, filterRules)
})
</script>
```

---

## Performance Best Practices

1. **Use ChartContainer** for responsive chart wrapping
2. **Enable aggregation** for >1000 data points
3. **Lazy load** heavy components (charts, modals)
4. **Virtual scroll** for lists >100 items
5. **Debounce** search and filter inputs
6. **Memoize** computed properties with dependencies
7. **Clean up** intervals and watchers on unmount

---

## Accessibility Guidelines

- Use semantic HTML (buttons, links, forms)
- Provide ARIA labels for interactive elements
- Ensure color contrast meets WCAG AA standards
- Support keyboard navigation (Tab, Enter, Escape)
- Include focus indicators on interactive elements
- Provide alt text for images and icons

---

## Styling & Theming

All components use CSS custom properties from `src/styles/variables.scss`:

```scss
// Colors
--color-primary: #3274d9
--color-error: #f2495c
--color-warning: #ff9830
--color-success: #73bf69

// Spacing (8px grid)
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px

// Typography
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
--font-size-base: 14px
--font-size-lg: 16px
--font-size-xl: 18px
```

---

## Testing Components

```typescript
import { mount } from '@vue/test-utils'
import LineChart from '@/components/Charts/LineChart.vue'

describe('LineChart', () => {
  it('renders with data', () => {
    const wrapper = mount(LineChart, {
      props: {
        data: mockTimeSeries,
        config: { title: 'Test Chart' }
      }
    })
    expect(wrapper.find('.chart-container').exists()).toBe(true)
  })

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(LineChart, {
      props: { loading: true }
    })
    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
  })

  it('displays error state on error', () => {
    const wrapper = mount(LineChart, {
      props: { error: new Error('Test error') }
    })
    expect(wrapper.find('.error-state').exists()).toBe(true)
  })
})
```

---

## Component Inventory Summary

| Category | Count | Components |
|----------|-------|------------|
| Charts | 10 | LineChart, BarChart, PieChart, HeatmapChart, GaugeChart, FlameGraph, GanttChart, ChartContainer, ChartLegend, TopologyViewer |
| Filters | 6 | FilterBar, ServiceFilter, EnvironmentFilter, RegionFilter, InstanceFilter, TagFilter |
| Time Pickers | 5 | TimeRangePicker, QuickTimeSelect, CustomDateTimeRange, RealtimeToggle, TimeComparison |
| Alerts | 4 | AlertPanel, AlertHistory, AlertDetail, AlertRuleList |
| Layout | 5 | MainLayout, Header, Sidebar, PageContent, Breadcrumbs |
| Common | 5 | LoadingSkeleton, EmptyState, ErrorState, ConfirmDialog, InfoDrawer |
| Views | 5 | Dashboard, Metrics, Tracing, Logs, Custom |
| Advanced | 2 | DragDropGrid, DashboardWidget |
| **Total** | **47** | |

---

## Quick Reference

### Most Used Props
- `loading: boolean` - Show loading state
- `error: Error | null` - Show error state
- `height: string | number` - Container height
- `config: ChartConfig` - Chart configuration
- `data: TimeSeries[]` - Chart data

### Most Used Emits
- `@refresh` - Refresh data
- `@confirm` - Confirm action
- `@close` - Close modal/drawer
- `@action` - Custom action

### Most Used Slots
- `default` - Main content
- `content` - Custom content area
- `actions` - Custom action buttons
- `icon` - Custom icon

---

For detailed implementation examples, see the component source files in `src/components/`.
