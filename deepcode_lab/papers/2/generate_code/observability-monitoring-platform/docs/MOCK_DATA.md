# Mock Data Generation System

## Overview

The Observability Monitoring Platform uses a sophisticated mock data generation system to simulate realistic observability data without requiring a backend server. This document explains the algorithms, configurations, and usage patterns for the three core data generators.

## Architecture

The mock data system consists of three independent generators that work together to create a complete observability dataset:

```
Mock Data Generation Pipeline
├── timeSeriesGenerator.ts    → Metrics (11 types × 3 services)
├── traceGenerator.ts         → Distributed traces (100+ traces)
├── logGenerator.ts           → Log entries (100,000+ logs)
└── alertGenerator.ts         → Alert rules & events
    ↓
Pinia Stores (metricsStore, tracesStore, logsStore, alertsStore)
    ↓
Vue Components (Charts, Lists, Detail Views)
```

## 1. Time Series Generator

### Purpose
Generates realistic metric time-series data with natural patterns (sine wave oscillation, Gaussian noise, linear trend, anomaly spikes).

### Algorithm

The core formula for generating metric values:

```
value(t) = baseValue + amplitude*sin(2π*t/period) + noise(t) + trend*t + anomaly(t)
```

Where:
- **baseValue**: Average metric value (e.g., 50 for CPU%)
- **amplitude**: Oscillation magnitude (e.g., ±20)
- **period**: Sine wave period in minutes (typical: 5-14 minutes)
- **noise(t)**: Gaussian random variation (typical: 10-20% of baseValue)
- **trend*t**: Linear drift component (e.g., +0.1% per minute for degradation)
- **anomaly(t)**: Occasional spike (5% probability, 2-10x magnitude)

### Implementation Pseudocode

```typescript
function generateTimeSeries(config: TimeSeriesConfig): MetricPoint[] {
  const points: MetricPoint[] = []
  const periodMs = config.period * 60 * 1000
  const startTime = new Date()
  
  for (let t = 0; t < 24 * 60 * 60 * 1000; t += config.intervalMs) {
    // Sine wave component (periodic pattern)
    const sine = config.baseValue + 
                 config.amplitude * Math.sin(2 * Math.PI * t / periodMs)
    
    // Gaussian noise (random variation)
    const noise = gaussian(0, config.baseValue * config.noiseLevel)
    
    // Linear trend (gradual change)
    const trend = config.trendRate * (t / 60000) // convert to minutes
    
    // Anomaly spike (occasional outlier)
    let anomaly = 0
    if (Math.random() < config.anomalyProb) {
      anomaly = config.baseValue * config.anomalyMag * Math.random()
    }
    
    // Combine components
    let value = sine + noise + trend + anomaly
    
    // Clamp to realistic bounds
    value = Math.max(config.minValue, Math.min(config.maxValue, value))
    
    points.push({
      timestamp: new Date(startTime.getTime() + t),
      value: value
    })
  }
  
  return points
}

function gaussian(mu: number, sigma: number): number {
  // Box-Muller transform for Gaussian distribution
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mu + sigma * z
}
```

### Metric Configurations

Each metric type has specific parameters tuned for realistic behavior:

#### CPU_USAGE
```typescript
{
  baseValue: 50,           // 50% average
  amplitude: 20,           // ±20% oscillation
  period: 5,               // 5-minute cycle
  noise: 0.1,              // 10% variation
  trend: 0.1,              // +0.1% per minute
  anomalyProb: 0.05,       // 5% spike probability
  anomalyMag: 3,           // 3x baseline spike
  minValue: 0,
  maxValue: 100
}
```

#### ERROR_RATE
```typescript
{
  baseValue: 0.5,          // 0.5% baseline
  amplitude: 0.3,          // ±0.3% oscillation
  period: 10,              // 10-minute cycle
  noise: 0.1,              // 10% variation
  trend: 0,                // No trend
  anomalyProb: 0.02,       // 2% spike probability
  anomalyMag: 5,           // 5x baseline spike
  minValue: 0,
  maxValue: 10
}
```

#### RESPONSE_TIME (P99 Latency)
```typescript
{
  baseValue: 100,          // 100ms average
  amplitude: 30,           // ±30ms oscillation
  period: 8,               // 8-minute cycle
  noise: 0.15,             // 15% variation
  trend: 2,                // +2ms per minute (degradation)
  anomalyProb: 0.01,       // 1% spike probability
  anomalyMag: 10,          // 10x baseline spike
  minValue: 10,
  maxValue: 5000
}
```

### Data Quality Characteristics

**Temporal Patterns:**
- Sine wave creates hourly/daily business patterns
- Noise adds realistic variation (±10-20%)
- Trend simulates gradual degradation
- Anomalies create occasional spikes (5% probability)

**Statistical Properties:**
- Mean ≈ baseValue
- Standard deviation ≈ baseValue * noiseLevel
- Min/max bounded by configuration
- Percentiles (P50, P90, P99) follow realistic distributions

**Volume Capability:**
- Single series: 1440 points per day (1-minute intervals)
- 11 metrics × 3 services = 33 series
- Total: 47,520 points per day
- Memory footprint: ~5MB for 24-hour dataset

### Usage Example

```typescript
// Generate CPU usage metrics for api-service
const cpuMetrics = generateTimeSeries({
  ...METRIC_CONFIGS.CPU_USAGE,
  metricId: 'cpu-usage-api-service',
  metricName: 'CPU Usage',
  unit: '%',
  serviceId: 'api-service',
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
  intervalSeconds: 60
})

// Result: TimeSeries object with 1440 MetricPoint entries
```

## 2. Trace Generator

### Purpose
Generates distributed tracing data with realistic service call chains, parent-child span relationships, error injection, and exponential latency distributions.

### Algorithm

The trace generation uses recursive tree building to create realistic call chains:

```
Root Span (API Gateway)
├── Child Span 1 (Auth Service)
├── Child Span 2 (User Service)
│   ├── Grandchild Span 1 (Database)
│   └── Grandchild Span 2 (Cache)
└── Child Span 3 (Notification Service)
```

### Implementation Pseudocode

```typescript
function generateTrace(config: TraceGeneratorConfig): Trace {
  const traceId = generateUUID()
  const rootService = selectRandom(config.services)
  
  // Create root span
  const rootSpan = createSpan({
    traceId: traceId,
    parentSpanId: null,
    service: rootService.name,
    operation: 'entry-point',
    durationMs: exponentialRandom(10, 50),
    status: 'SUCCESS'
  })
  
  const trace = new Trace(traceId, rootSpan)
  
  // Recursively build call chain
  buildCallChain(trace, rootSpan, config, maxDepth=10)
  
  return trace
}

function buildCallChain(
  trace: Trace,
  parentSpan: Span,
  config: TraceGeneratorConfig,
  depth: number
): void {
  if (depth === 0) return // Stop recursion
  
  // Determine number of child spans (1-3)
  const branchCount = randomInt(1, 3)
  
  for (let i = 0; i < branchCount; i++) {
    // Select downstream service (avoid self-calls)
    const service = selectRandom(
      config.services.filter(s => s.name !== parentSpan.service)
    )
    
    // Determine if this span has error (5% baseline)
    const hasError = Math.random() < config.errorRate
    
    // Create child span
    const childSpan = createSpan({
      traceId: trace.id,
      parentSpanId: parentSpan.id,
      service: service.name,
      operation: selectRandom(SERVICE_OPERATIONS[service.name]),
      durationMs: exponentialRandom(config.durationMinMs, config.durationMaxMs),
      status: hasError ? 'ERROR' : 'SUCCESS',
      tags: {
        'http.method': 'POST',
        'http.status_code': hasError ? 500 : 200,
        'db.rows_affected': randomInt(1, 1000)
      },
      logs: generateSpanLogs(hasError)
    })
    
    trace.addSpan(childSpan)
    
    // Continue recursively (70% probability)
    if (Math.random() < config.branchProbability) {
      buildCallChain(trace, childSpan, config, depth - 1)
    }
  }
}

function exponentialRandom(min: number, max: number): number {
  // Exponential distribution (skewed towards small values)
  const random = Math.random()
  const exp = Math.exp(-5 * random)
  return min + exp * (max - min)
}
```

### Trace Configuration

```typescript
{
  services: [
    { name: 'api-service', instances: ['api-1', 'api-2'] },
    { name: 'auth-service', instances: ['auth-1'] },
    { name: 'user-service', instances: ['user-1', 'user-2'] }
  ],
  minDepth: 3,              // Minimum 3 span levels
  maxDepth: 10,             // Maximum 10 span levels
  errorRate: 0.05,          // 5% error probability
  durationMinMs: 10,        // Minimum span duration
  durationMaxMs: 500,       // Maximum span duration
  branchProbability: 0.7    // 70% chance of deeper calls
}
```

### Data Quality Characteristics

**Call Chain Patterns:**
- Root span represents API entry point
- Child spans represent downstream service calls
- Exponential duration distribution (most fast, few slow)
- Error injection creates realistic failure scenarios
- Tags and logs provide span context

**Realistic Behaviors:**
- Service dependencies follow logical patterns (API → Auth → User → DB)
- Span durations increase with depth (child spans faster than root)
- Error rates consistent across services (5% baseline)
- Slow spans detectable via statistical analysis (mean + 2*stdDev)

**Volume Capability:**
- Traces per generation: 50-100 traces
- Spans per trace: 3-20 spans (average: ~10)
- Total spans: 500-1000 spans
- Memory footprint: ~2MB for 1000 traces

### Usage Example

```typescript
// Generate 100 traces
const traces = generateTraces({
  services: SERVICES,
  minDepth: 3,
  maxDepth: 10,
  errorRate: 0.05,
  durationMinMs: 10,
  durationMaxMs: 500,
  branchProbability: 0.7
}, 100)

// Result: Array of 100 Trace objects with realistic call chains
```

## 3. Log Generator

### Purpose
Generates realistic log streams with time-based density variation, error clustering, and cross-module correlation with traces.

### Algorithm

The log generation uses a Poisson process to simulate realistic inter-arrival times:

```
Poisson Process: Inter-arrival times follow exponential distribution
Density Variation: Business hours (1.5x), night (0.3x), weekend (0.6x)
Error Clustering: Occasional 5-15 minute bursts with 10% error rate
Trace Correlation: 20% of logs linked to traces for cross-module navigation
```

### Implementation Pseudocode

```typescript
function generateLogs(config: LogGeneratorConfig): LogEntry[] {
  const logs: LogEntry[] = []
  let currentTime = config.startTime
  let isErrorCluster = false
  let clusterEndTime = currentTime
  
  while (currentTime < config.endTime) {
    // Calculate density based on time of day
    const hourUTC = currentTime.getUTCHours()
    const dayOfWeek = currentTime.getUTCDay()
    
    let densityMultiplier = 1.0
    if (hourUTC >= 9 && hourUTC < 12 || hourUTC >= 14 && hourUTC < 17) {
      densityMultiplier = 1.5 // Business hours
    } else if (hourUTC >= 0 && hourUTC < 7) {
      densityMultiplier = 0.3 // Night hours
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      densityMultiplier = 0.6 // Weekend
    }
    
    // Poisson inter-arrival time
    const lambda = config.baseFrequencyPerMinute * densityMultiplier
    const interArrivalSeconds = poissonRandom(lambda) * 60
    currentTime = new Date(currentTime.getTime() + interArrivalSeconds * 1000)
    
    // Error clustering (1% chance to start cluster)
    if (Math.random() < 0.01) {
      isErrorCluster = true
      clusterEndTime = new Date(currentTime.getTime() + randomInt(5, 15) * 60 * 1000)
    }
    
    if (currentTime > clusterEndTime) {
      isErrorCluster = false
    }
    
    // Determine log level with bias towards errors during clusters
    const errorRate = isErrorCluster ? 
      config.errorRatePeak : 
      config.errorRateNormal
    
    const logLevel = selectLogLevel(errorRate)
    const service = selectRandom(config.services)
    
    // Create log entry
    const log: LogEntry = {
      id: generateUUID(),
      timestamp: currentTime,
      service: service.name,
      level: logLevel,
      message: generateMessage(service, logLevel),
      traceId: Math.random() < config.traceIdProbability ? generateTraceId() : null,
      context: {
        userId: randomInt(1, 10000),
        requestId: generateUUID(),
        instanceId: selectRandom(service.instances)
      }
    }
    
    logs.push(log)
  }
  
  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

function poissonRandom(lambda: number): number {
  // Knuth's algorithm for Poisson distribution
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  
  do {
    k = k + 1
    p = p * Math.random()
  } while (p > L)
  
  return k - 1
}

function selectLogLevel(errorRate: number): LogLevel {
  const random = Math.random()
  
  if (random < errorRate * 0.7) {
    return 'ERROR'         // 70% of errors
  } else if (random < errorRate * 0.85) {
    return 'WARN'          // 15% of errors
  } else if (random < errorRate + 0.3) {
    return 'INFO'          // Main log type
  } else if (random < errorRate + 0.5) {
    return 'DEBUG'         // Detailed debugging
  } else {
    return 'FATAL'         // Rare critical failures
  }
}
```

### Log Configuration

```typescript
{
  services: SERVICES,                    // Service definitions
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  },
  baseFrequencyPerMinute: 10,            // 10 logs/minute baseline
  peakHours: [[9, 12], [14, 17]],        // Business hours (UTC)
  errorRateNormal: 0.005,                // 0.5% error rate normal
  errorRatePeak: 0.1,                    // 10% error rate in clusters
  traceIdProbability: 0.2                // 20% of logs linked to traces
}
```

### Density Function

The density multiplier varies by time of day to simulate realistic traffic patterns:

```
Peak Hours (9-12, 14-17 UTC):  1.5x baseline
Business Hours (7-21 UTC):      1.0x baseline
Night Hours (0-7 UTC):          0.3x baseline
Weekend:                        0.6x baseline
```

### Data Quality Characteristics

**Temporal Patterns:**
- Poisson inter-arrival times create realistic clustering
- Density varies by time of day (business hours peak)
- Error clustering simulates cascading failures
- Trace correlation enables cross-module navigation

**Log Level Distribution:**
- INFO: 50% (normal operations)
- WARN: 30% (warnings and issues)
- ERROR: 15% (errors and failures)
- DEBUG: 5% (detailed debugging)
- FATAL: 1% (critical failures)

**Volume Capability:**
- Baseline: 10 logs/minute × 1440 minutes = 14,400 logs/day per service
- With density variation: 10,000-15,000 logs/day per service
- 3 services × 12,000 logs/day = 36,000 logs/day total
- 24-hour dataset: 100,000+ log entries
- Memory footprint: ~50MB for 24-hour dataset

### Usage Example

```typescript
// Generate logs for 24-hour period
const logs = generateLogs({
  services: SERVICES,
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  },
  baseFrequencyPerMinute: 10,
  peakHours: [[9, 12], [14, 17]],
  errorRateNormal: 0.005,
  errorRatePeak: 0.1,
  traceIdProbability: 0.2
})

// Result: Array of 100,000+ LogEntry objects with realistic patterns
```

## 4. Alert Generator

### Purpose
Generates alert rules and historical alert events with realistic trigger/resolution patterns.

### Alert Rules

Pre-defined templates for common monitoring scenarios:

```typescript
ALERT_RULE_TEMPLATES = [
  {
    name: 'High Error Rate',
    metric: 'ERROR_RATE',
    condition: 'greater_than',
    threshold: 5,           // 5% error rate
    duration: 5,            // 5 minutes
    severity: 'critical'
  },
  {
    name: 'High Response Time',
    metric: 'RESPONSE_TIME',
    condition: 'greater_than',
    threshold: 1000,        // 1000ms
    duration: 10,           // 10 minutes
    severity: 'warning'
  },
  {
    name: 'High CPU Usage',
    metric: 'CPU_USAGE',
    condition: 'greater_than',
    threshold: 80,          // 80%
    duration: 5,            // 5 minutes
    severity: 'warning'
  }
  // ... 5 more templates
]
```

### Alert Events

Generated based on rules with realistic trigger/resolution patterns:

```typescript
function generateAlertEvents(
  rules: AlertRule[],
  config: AlertEventConfig
): AlertEvent[] {
  const events: AlertEvent[] = []
  
  for (const rule of rules) {
    // Generate N events per rule (based on density)
    const eventCount = config.timeRangeDays * config.eventDensity
    
    for (let i = 0; i < eventCount; i++) {
      // Random trigger time within range
      const triggeredAt = randomDateInRange(
        config.timeRange.start,
        config.timeRange.end
      )
      
      // Duration follows exponential distribution (most short, few long)
      const durationMinutes = exponentialRandom(15, 90)
      const resolvedAt = new Date(
        triggeredAt.getTime() + durationMinutes * 60 * 1000
      )
      
      // 70% of alerts acknowledged
      const acknowledged = Math.random() < 0.7
      
      events.push({
        id: generateUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        service: selectRandom(SERVICES).name,
        message: `${rule.name} triggered on ${service}`,
        triggeredAt: triggeredAt,
        resolvedAt: resolvedAt,
        acknowledged: acknowledged,
        acknowledgedBy: acknowledged ? 'operator-1' : null,
        acknowledgedAt: acknowledged ? 
          new Date(triggeredAt.getTime() + randomInt(1, 10) * 60 * 1000) : 
          null
      })
    }
  }
  
  return events
}
```

## Data Generation Pipeline

### Initialization Sequence

```typescript
// src/mock/index.ts
async function initializeMockData(): Promise<void> {
  console.log('Initializing mock data...')
  
  // Phase 1: Generate metrics (200ms)
  const metrics = generateServiceMetrics(SERVICES)
  metricsStore.setMetrics(metrics)
  
  // Phase 2: Generate traces (300ms)
  const traces = generateTraces(TRACE_CONFIG, 100)
  tracesStore.setTraces(traces)
  
  // Phase 3: Generate logs (400ms)
  const logs = generateLogs(LOG_CONFIG)
  logsStore.setLogs(logs)
  
  // Phase 4: Generate alerts (100ms)
  const rules = generateAlertRules(SERVICES)
  const events = generateAlertEvents(rules, ALERT_CONFIG)
  alertsStore.setRules(rules)
  alertsStore.setEvents(events)
  
  console.log('Mock data initialized successfully')
  console.log(`Generated: ${metrics.length} metrics, ${traces.length} traces, ${logs.length} logs`)
}
```

### Performance Characteristics

**Generation Time:**
- Metrics: ~200ms (33 series × 1440 points)
- Traces: ~300ms (100 traces × 10 spans average)
- Logs: ~400ms (100,000 entries with Poisson distribution)
- Alerts: ~100ms (8 rules × 10 events)
- **Total: ~1000ms (acceptable for startup)**

**Memory Footprint:**
- Metrics: ~5MB (47,520 points)
- Traces: ~2MB (1000 spans)
- Logs: ~50MB (100,000 entries)
- Alerts: ~1MB (80 events)
- **Total: ~58MB (acceptable for browser)**

**Data Quality Validation:**

```typescript
// Validate metric patterns
function validateMetrics(metrics: TimeSeries[]): ValidationResult {
  const results = []
  
  for (const series of metrics) {
    const values = series.dataPoints.map(p => p.value)
    const mean = average(values)
    const stdDev = standardDeviation(values)
    
    // Check bounds
    const allInBounds = values.every(v => v >= 0 && v <= 100)
    
    // Check distribution (should be roughly normal)
    const outliers = values.filter(v => Math.abs(v - mean) > 3 * stdDev)
    const outlierRate = outliers.length / values.length
    
    results.push({
      metricId: series.metricId,
      valid: allInBounds && outlierRate < 0.05,
      mean: mean,
      stdDev: stdDev,
      outlierRate: outlierRate
    })
  }
  
  return results
}
```

## Configuration and Customization

### Adjusting Data Volume

To generate more/less data, modify `MOCK_DATA_CONFIG`:

```typescript
// src/mock/constants.ts
export const MOCK_DATA_CONFIG = {
  historicalDataDays: 1,           // Change to 7 for 7 days
  metricsPerService: 11,           // Keep at 11
  tracesPerDay: 500,               // Change to 1000 for more traces
  logsPerDay: 100000,              // Change to 500000 for more logs
  alertRulesCount: 8,              // Keep at 8
  alertEventsPerRule: 10           // Change to 20 for more alerts
}
```

### Adjusting Data Patterns

Modify generator configurations in `src/mock/constants.ts`:

```typescript
// Increase error rate
METRIC_CONFIGS.ERROR_RATE.baseValue = 1.0  // 1% instead of 0.5%

// Increase trace depth
TRACE_CONFIG.maxDepth = 15  // Deeper call chains

// Increase log frequency
LOG_CONFIG.baseFrequencyPerMinute = 20  // 20 logs/min instead of 10
```

## Testing and Validation

### Unit Tests

```typescript
// tests/unit/generators.spec.ts
describe('Time Series Generator', () => {
  it('should generate points within bounds', () => {
    const config = METRIC_CONFIGS.CPU_USAGE
    const series = generateTimeSeries(config)
    
    expect(series.length).toBeGreaterThan(0)
    series.forEach(point => {
      expect(point.value).toBeGreaterThanOrEqual(config.minValue)
      expect(point.value).toBeLessThanOrEqual(config.maxValue)
    })
  })
  
  it('should have realistic statistical properties', () => {
    const series = generateTimeSeries(METRIC_CONFIGS.CPU_USAGE)
    const values = series.map(p => p.value)
    const mean = average(values)
    
    expect(mean).toBeCloseTo(METRIC_CONFIGS.CPU_USAGE.baseValue, 1)
  })
})
```

### Data Quality Checks

Run validation after generation:

```typescript
// Validate all generated data
const metricsValid = validateMetrics(metrics)
const tracesValid = validateTraces(traces)
const logsValid = validateLogs(logs)

console.log('Metrics validation:', metricsValid)
console.log('Traces validation:', tracesValid)
console.log('Logs validation:', logsValid)
```

## Troubleshooting

### Issue: Mock data generation too slow

**Solution:** Reduce data volume in `MOCK_DATA_CONFIG`:
```typescript
historicalDataDays: 1,    // Reduce from 7 to 1
tracesPerDay: 100,        // Reduce from 500 to 100
logsPerDay: 50000         // Reduce from 100000 to 50000
```

### Issue: Memory usage too high

**Solution:** Clear old data or reduce volume:
```typescript
// Clear logs older than 12 hours
logsStore.clearOldLogs(12 * 60 * 60 * 1000)
```

### Issue: Unrealistic data patterns

**Solution:** Adjust generator configurations:
```typescript
// Increase anomaly frequency
METRIC_CONFIGS.CPU_USAGE.anomalyProb = 0.1  // 10% instead of 5%

// Increase error rate
METRIC_CONFIGS.ERROR_RATE.baseValue = 2.0  // 2% instead of 0.5%
```

## References

- **Time Series Generation**: Box-Muller transform for Gaussian distribution
- **Trace Generation**: Recursive tree building with exponential latency distribution
- **Log Generation**: Poisson process for inter-arrival times
- **Alert Generation**: Rule-based event triggering with realistic durations

## Further Reading

- See `ARCHITECTURE.md` for system design overview
- See `COMPONENT_GUIDE.md` for component specifications
- See `DEPLOYMENT.md` for production deployment
