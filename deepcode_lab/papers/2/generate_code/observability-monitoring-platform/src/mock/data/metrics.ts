/**
 * Pre-generated sample metric data for the observability monitoring platform
 * Provides reference time-series data for metrics across all services
 * 
 * Data Structure:
 * - 3 services (api-service, auth-service, user-service)
 * - 11 metrics per service (CPU, memory, error rate, latency percentiles, etc.)
 * - 24-hour historical data with 1-minute intervals (1440 points per metric)
 * - Realistic patterns: sine wave oscillation + Gaussian noise + anomaly spikes
 */

import { TimeSeries, MetricPoint } from '@/types'

/**
 * Helper function to generate sample metric points
 * Creates a sine wave with noise to simulate realistic metric behavior
 */
function generateSamplePoints(
  baseValue: number,
  amplitude: number,
  period: number,
  startTime: Date,
  pointCount: number = 1440
): MetricPoint[] {
  const points: MetricPoint[] = []
  const periodMs = period * 60 * 1000 // Convert minutes to milliseconds
  const intervalMs = 60 * 1000 // 1-minute intervals

  for (let i = 0; i < pointCount; i++) {
    const timestamp = new Date(startTime.getTime() + i * intervalMs)
    const timeElapsed = i * intervalMs

    // Sine wave component (natural oscillation)
    const sine = baseValue + amplitude * Math.sin((2 * Math.PI * timeElapsed) / periodMs)

    // Gaussian noise (random variation)
    const noise = (Math.random() - 0.5) * 2 * baseValue * 0.1

    // Occasional anomaly spike (5% probability)
    let anomaly = 0
    if (Math.random() < 0.05) {
      anomaly = baseValue * 2 * Math.random()
    }

    // Combine components
    let value = sine + noise + anomaly

    // Clamp to realistic bounds
    if (baseValue === 50) {
      // CPU usage: 0-100%
      value = Math.max(0, Math.min(100, value))
    } else if (baseValue === 0.5) {
      // Error rate: 0-10%
      value = Math.max(0, Math.min(10, value))
    } else if (baseValue === 100) {
      // Response time: 10-5000ms
      value = Math.max(10, Math.min(5000, value))
    }

    points.push({
      timestamp,
      value: Math.round(value * 100) / 100, // Round to 2 decimals
    })
  }

  return points
}

/**
 * Sample metric data for api-service
 */
export const apiServiceMetrics: TimeSeries[] = [
  {
    metricId: 'api-cpu-usage',
    metricName: 'CPU Usage',
    unit: '%',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(45, 15, 5, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-memory-usage',
    metricName: 'Memory Usage',
    unit: '%',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(55, 10, 8, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-error-rate',
    metricName: 'Error Rate',
    unit: '%',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(0.5, 0.3, 10, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-response-time-p50',
    metricName: 'Response Time P50',
    unit: 'ms',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(80, 20, 6, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-response-time-p90',
    metricName: 'Response Time P90',
    unit: 'ms',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(150, 40, 7, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-response-time-p99',
    metricName: 'Response Time P99',
    unit: 'ms',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(300, 80, 8, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-qps',
    metricName: 'Requests Per Second',
    unit: 'req/s',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(500, 150, 4, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-disk-io',
    metricName: 'Disk I/O',
    unit: 'MB/s',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(25, 10, 12, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-network-bandwidth',
    metricName: 'Network Bandwidth',
    unit: 'Mbps',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(100, 30, 5, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-success-rate',
    metricName: 'Success Rate',
    unit: '%',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(99.5, 0.3, 10, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'api-active-connections',
    metricName: 'Active Connections',
    unit: 'count',
    serviceId: 'api-service',
    dataPoints: generateSamplePoints(250, 80, 6, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
]

/**
 * Sample metric data for auth-service
 */
export const authServiceMetrics: TimeSeries[] = [
  {
    metricId: 'auth-cpu-usage',
    metricName: 'CPU Usage',
    unit: '%',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(35, 12, 6, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-memory-usage',
    metricName: 'Memory Usage',
    unit: '%',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(45, 8, 9, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-error-rate',
    metricName: 'Error Rate',
    unit: '%',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(0.3, 0.2, 12, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-response-time-p50',
    metricName: 'Response Time P50',
    unit: 'ms',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(50, 15, 7, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-response-time-p90',
    metricName: 'Response Time P90',
    unit: 'ms',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(100, 30, 8, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-response-time-p99',
    metricName: 'Response Time P99',
    unit: 'ms',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(200, 60, 9, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-qps',
    metricName: 'Requests Per Second',
    unit: 'req/s',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(300, 100, 5, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-disk-io',
    metricName: 'Disk I/O',
    unit: 'MB/s',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(15, 5, 14, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-network-bandwidth',
    metricName: 'Network Bandwidth',
    unit: 'Mbps',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(60, 20, 6, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-success-rate',
    metricName: 'Success Rate',
    unit: '%',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(99.7, 0.2, 12, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'auth-active-connections',
    metricName: 'Active Connections',
    unit: 'count',
    serviceId: 'auth-service',
    dataPoints: generateSamplePoints(150, 50, 7, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
]

/**
 * Sample metric data for user-service
 */
export const userServiceMetrics: TimeSeries[] = [
  {
    metricId: 'user-cpu-usage',
    metricName: 'CPU Usage',
    unit: '%',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(40, 14, 5, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-memory-usage',
    metricName: 'Memory Usage',
    unit: '%',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(50, 9, 8, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-error-rate',
    metricName: 'Error Rate',
    unit: '%',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(0.4, 0.25, 11, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-response-time-p50',
    metricName: 'Response Time P50',
    unit: 'ms',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(70, 18, 6, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-response-time-p90',
    metricName: 'Response Time P90',
    unit: 'ms',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(130, 35, 7, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-response-time-p99',
    metricName: 'Response Time P99',
    unit: 'ms',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(250, 70, 8, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-qps',
    metricName: 'Requests Per Second',
    unit: 'req/s',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(400, 120, 4, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-disk-io',
    metricName: 'Disk I/O',
    unit: 'MB/s',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(20, 8, 13, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-network-bandwidth',
    metricName: 'Network Bandwidth',
    unit: 'Mbps',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(80, 25, 5, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-success-rate',
    metricName: 'Success Rate',
    unit: '%',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(99.6, 0.25, 11, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
  {
    metricId: 'user-active-connections',
    metricName: 'Active Connections',
    unit: 'count',
    serviceId: 'user-service',
    dataPoints: generateSamplePoints(200, 65, 6, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    lastUpdate: new Date(),
  },
]

/**
 * Aggregated metric data for all services
 * Used for quick access and initialization
 */
export const allMetrics: TimeSeries[] = [
  ...apiServiceMetrics,
  ...authServiceMetrics,
  ...userServiceMetrics,
]

/**
 * Metric data indexed by service ID for O(1) lookup
 */
export const metricsByService: Record<string, TimeSeries[]> = {
  'api-service': apiServiceMetrics,
  'auth-service': authServiceMetrics,
  'user-service': userServiceMetrics,
}

/**
 * Metric data indexed by metric ID for O(1) lookup
 */
export const metricsById: Record<string, TimeSeries> = allMetrics.reduce(
  (acc, metric) => {
    acc[metric.metricId] = metric
    return acc
  },
  {} as Record<string, TimeSeries>
)

/**
 * Get metrics for a specific service
 * @param serviceId - Service identifier
 * @returns Array of TimeSeries for the service
 */
export function getMetricsForService(serviceId: string): TimeSeries[] {
  return metricsByService[serviceId] || []
}

/**
 * Get a specific metric by ID
 * @param metricId - Metric identifier
 * @returns TimeSeries object or undefined
 */
export function getMetricById(metricId: string): TimeSeries | undefined {
  return metricsById[metricId]
}

/**
 * Get all metrics for a specific metric name across all services
 * @param metricName - Metric name (e.g., "CPU Usage")
 * @returns Array of TimeSeries matching the metric name
 */
export function getMetricsByName(metricName: string): TimeSeries[] {
  return allMetrics.filter((metric) => metric.metricName === metricName)
}

/**
 * Get metrics for multiple services
 * @param serviceIds - Array of service identifiers
 * @returns Array of TimeSeries for all specified services
 */
export function getMetricsForServices(serviceIds: string[]): TimeSeries[] {
  return serviceIds.flatMap((serviceId) => getMetricsForService(serviceId))
}

export default {
  apiServiceMetrics,
  authServiceMetrics,
  userServiceMetrics,
  allMetrics,
  metricsByService,
  metricsById,
  getMetricsForService,
  getMetricById,
  getMetricsByName,
  getMetricsForServices,
}
