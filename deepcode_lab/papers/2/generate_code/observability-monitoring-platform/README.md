# Observability Monitoring Platform

A comprehensive, client-side observability monitoring system built with Vue 3, TypeScript, and ECharts. Provides real-time visualization of metrics, distributed traces, logs, and alerts across microservices with seamless cross-module navigation for rapid fault localization.

## 🎯 Features

### Core Modules

- **Dashboard**: Real-time service health overview with KPI cards, alert panel, and metric trends
- **Metrics**: Detailed metric analysis with multi-dimensional filtering, comparisons, and statistical aggregation
- **Tracing**: Distributed trace visualization with flamechart, Gantt timeline, service topology, and slow query detection
- **Logs**: Real-time log search with virtual scrolling (10,000+ items), filtering, and cross-module correlation
- **Custom Dashboard**: Drag-drop dashboard builder with 12-column grid, templates, and persistence

### Advanced Capabilities

- **Cross-Module Linking**: Seamless navigation between modules with context preservation
  - Metric anomaly → Traces (filtered by service + time)
  - Trace → Logs (filtered by traceId)
  - Log → Trace (via traceId link)
- **Real-Time Mode**: Auto-refreshing data with configurable intervals (5s-1min)
- **Multi-Dimensional Filtering**: Service, environment, region, instance, and custom tag filters
- **Time Range Management**: Quick presets (5m, 15m, 1h, 6h, 24h, 7d) + custom ranges
- **Dark Theme**: Professional dark theme optimized for 24/7 monitoring
- **Responsive Design**: Optimized for 1920x1080 and 2560x1440 displays

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Modern browser (Chrome 90+, Firefox 88+, Edge 90+)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd observability-monitoring-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

## 📊 Mock Data Architecture

The platform generates realistic 24-hour historical datasets at startup with no backend required:

### Data Generators

1. **Time-Series Generator** (`src/mock/generators/timeSeriesGenerator.ts`)
   - Algorithm: `value(t) = baseValue + amplitude*sin(2π*t/period) + noise(t) + trend*t + anomaly(t)`
   - Generates 11 metrics per service (CPU, memory, error rate, latencies, QPS, etc.)
   - 1440 points per metric (1-minute intervals)
   - Realistic patterns with sine wave oscillation, Gaussian noise, and anomaly spikes

2. **Trace Generator** (`src/mock/generators/traceGenerator.ts`)
   - Random tree generation with parent-child span relationships
   - 3-10 span levels per trace
   - 5% error rate with realistic latency distribution
   - 100+ traces generated per session

3. **Log Generator** (`src/mock/generators/logGenerator.ts`)
   - Poisson distribution for inter-arrival times
   - Time-based density variation (1.5x business hours, 0.3x night)
   - Error clustering (occasional 5-15 minute bursts with 10% error rate)
   - 100,000+ log entries per 24-hour period

4. **Alert Generator** (`src/mock/generators/alertGenerator.ts`)
   - 8 predefined alert rule templates
   - Historical alert events with trigger/resolution patterns
   - Severity-based distribution (critical, warning, info)

### Data Volume

- **Metrics**: 33 time-series (11 metrics × 3 services) × 1440 points = 47,520 data points
- **Traces**: 100-500 traces with 3-20 spans each = 500-1000 spans
- **Logs**: 100,000+ entries across 3 services
- **Alerts**: 8 rules + 50-100 historical events
- **Total Memory**: ~50-100MB for complete 24-hour dataset

## 🏗️ Architecture

### Project Structure

```
src/
├── main.ts                    # App initialization, Pinia, Router
├── App.vue                    # Root component with global state
├── views/                     # Page-level components (5 modules)
├── components/                # Reusable UI components (47 total)
│   ├── Charts/               # 10 chart types (Line, Bar, Pie, Heatmap, etc.)
│   ├── Filters/              # 6 filter components (Service, Environment, etc.)
│   ├── TimePicker/           # Time range selection (5 components)
│   ├── Alerts/               # Alert management (4 components)
│   ├── Layout/               # Layout structure (5 components)
│   └── Common/               # Shared utilities (5 components)
├── composables/              # Reusable logic (11 composables)
├── stores/                   # Pinia state management (8 stores)
├── services/                 # Business logic layer (5 services)
├── mock/                     # Mock data generation system
│   ├── generators/           # 4 data generation algorithms
│   ├── data/                 # Pre-generated sample data
│   └── api.ts               # Mock HTTP endpoints
├── types/                    # TypeScript definitions (10 files)
├── utils/                    # Utility functions (7 files)
├── router/                   # Vue Router configuration
└── styles/                   # SCSS styling system
```

### State Management (Pinia)

- **timeStore**: Global time range state (start, end, preset, real-time mode)
- **filterStore**: Multi-dimensional filter state (service, environment, region, instance, tags)
- **metricsStore**: Cached metrics data with aggregation
- **tracesStore**: Cached trace data with analysis
- **logsStore**: Cached log entries with search
- **alertsStore**: Alert rules and historical events
- **dashboardStore**: Custom dashboard configurations
- **uiStore**: UI state (theme, modals, notifications, sidebar)

### Data Flow

```
Mock Data Generators
    ↓
Pinia Stores (cached state)
    ↓
Services (business logic)
    ↓
Composables (reactive wrappers)
    ↓
Vue Components (UI rendering)
```

## 🎨 UI Components

### Chart Components (10 types)

- **LineChart**: Time-series visualization with hover tooltips
- **BarChart**: Categorical comparison with stacking support
- **PieChart**: Distribution visualization with legend
- **HeatmapChart**: Time-intensity heatmap
- **GaugeChart**: KPI displays with thresholds
- **FlameGraph**: Trace flamechart (horizontal rectangles)
- **GanttChart**: Span timeline with concurrency
- **TopologyViewer**: Service dependency graph (AntV G6)
- **ChartContainer**: Responsive wrapper with toolbar
- **ChartLegend**: Interactive legend with toggles

### Filter Components (6 types)

- **FilterBar**: Main filter container
- **ServiceFilter**: Multi-select service dropdown
- **EnvironmentFilter**: Environment selector (prod/staging/test)
- **RegionFilter**: Hierarchical region/zone picker
- **InstanceFilter**: Instance ID autocomplete
- **TagFilter**: Custom key-value tag filtering

### Time Picker Components (5 types)

- **TimeRangePicker**: Main time control container
- **QuickTimeSelect**: Preset buttons (5m-7d)
- **CustomDateTimeRange**: Date + time pickers
- **RealtimeToggle**: Real-time mode + interval selector
- **TimeComparison**: Compare with previous period

## 📈 Performance Targets

- **First Contentful Paint**: < 2 seconds
- **Time to Interactive**: < 2 seconds
- **Page Transition**: < 300ms
- **Chart Render**: < 500ms
- **Data Refresh**: < 200ms
- **Virtual Scroll**: 60 FPS sustained (10,000+ items)
- **Memory Usage**: < 150MB for full 24h dataset

## 🔧 Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check

# Run tests
npm run test

# Watch mode for tests
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Code quality rules with Vue 3 support
- **Prettier**: Automatic code formatting (100 char line width)
- **Test Coverage**: Unit + integration tests for core functionality

## 📚 Documentation

- **ARCHITECTURE.md**: System design and component relationships
- **MOCK_DATA.md**: Data generation algorithms and configurations
- **COMPONENT_GUIDE.md**: Component APIs and usage examples
- **STYLING_GUIDE.md**: Design system and theming
- **DEPLOYMENT.md**: Build and deployment instructions

## 🔗 Cross-Module Navigation

The platform enables seamless navigation between modules with context preservation:

### Metric Anomaly → Traces
```
User clicks anomalous data point in Dashboard
  → Navigates to Tracing page
  → Pre-filters traces by service + time window
  → Shows traces that occurred during anomaly
```

### Trace → Logs
```
User clicks slow span in Trace detail
  → Navigates to Logs page
  → Pre-filters logs by traceId + service
  → Shows all logs from that span execution
```

### Log → Trace
```
User clicks traceId link in log entry
  → Navigates to Tracing page
  → Loads specific trace
  → Highlights all spans in timeline
```

## 🎯 Key Algorithms

### Time-Series Generation
- **Sine Wave**: Periodic oscillation (5-14 minute periods) for natural patterns
- **Gaussian Noise**: 10% variation for realistic fluctuation
- **Anomaly Spikes**: 5% probability with 2-3x magnitude
- **Trend**: Linear drift (e.g., +0.1% per minute for degradation)

### Slow Span Detection
- **Statistical Method**: Spans > mean + 2*stdDev marked as slow
- **Percentile Calculation**: P50, P90, P99 latencies computed
- **Critical Path**: Longest execution path through trace DAG

### Log Search
- **Keyword Matching**: Regex or literal string search
- **Field Extraction**: Regex patterns for structured field parsing
- **Filtering**: AND between filter types, OR within types
- **Virtual Scrolling**: Renders 10,000+ items without lag

### Alert Evaluation
- **Condition Evaluation**: Supports >, <, =, !=, contains operators
- **Alert Correlation**: Groups related alerts by service/time/severity
- **Escalation**: Increases severity based on time elapsed

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## 📦 Dependencies

### Core Framework
- **vue**: 3.3.4 - UI framework
- **pinia**: 2.1.3 - State management
- **vue-router**: 4.2.4 - Client-side routing

### UI & Visualization
- **element-plus**: 2.4.0 - Component library
- **echarts**: 5.4.2 - Chart rendering
- **@antv/g6**: 5.0.0 - Graph visualization
- **@iconify/vue**: 4.1.1 - Icon library

### Utilities
- **dayjs**: 1.11.10 - Date/time formatting
- **uuid**: 9.0.0 - UUID generation
- **vue-virtual-scroller**: 1.0.10 - Virtual scrolling
- **gsap**: 3.12.2 - Animations

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please follow the code style guidelines:

1. Use TypeScript with strict mode
2. Follow ESLint and Prettier rules
3. Write unit tests for new features
4. Update documentation as needed
5. Use semantic commit messages

## 📞 Support

For issues, questions, or feature requests, please open an issue on the repository.

## 🎓 Learning Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia State Management](https://pinia.vuejs.org/)
- [ECharts Documentation](https://echarts.apache.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: Production Ready
