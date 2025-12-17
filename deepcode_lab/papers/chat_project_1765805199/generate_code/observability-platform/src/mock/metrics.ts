/**
 * Mock Metrics Data Module
 * 
 * Provides comprehensive metric data management including:
 * - Service metrics generation (QPS, latency, error rates, resource usage)
 * - Metric querying with filters and aggregations
 * - Service comparison capabilities
 * - Health status calculation
 * - In-memory caching with automatic refresh
 */

import { faker } from '@faker-js/faker';
import type {
  Service,
  ServiceStatus,
  Environment,
  Region,
  HealthCheck,
} from '@/types';
import type {
  MetricTimeSeries,
  MetricQuery,
  MetricQueryResult,
  ServiceMetrics,
  MetricLabels,
  MetricType,
} from '@/types/metrics';
import {
  generateServiceMetrics,
  generateQPSTimeSeries,
  generateLatencyTimeSeries,
  generateErrorRateTimeSeries,
  generateCPUUsageTimeSeries,
  generateMemoryUsageTimeSeries,
  generateNetworkIOTimeSeries,
  generateDiskIOTimeSeries,
  aggregateTimeSeries,
  getOptimalInterval,
} from './generators/timeSeriesGenerator';

// ============================================================================
// Constants & Configuration
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Mock service configurations with realistic production settings
 */
const SERVICES: Array<{
  id: string;
  name: string;
  displayName: string;
  description: string;
  environment: Environment;
  region: Region;
  baseQPS: number;
  baseLatency: number;
  baseErrorRate: number;
  baseCPU: number;
  baseMemory: number;
}> = [
  {
    id: 'user-service',
    name: 'user-service',
    displayName: 'User Service',
    description: 'User authentication and profile management service',
    environment: 'production',
    region: 'us-east-1',
    baseQPS: 2000,
    baseLatency: 50,
    baseErrorRate: 1.0,
    baseCPU: 45,
    baseMemory: 3.2,
  },
  {
    id: 'order-service',
    name: 'order-service',
    displayName: 'Order Service',
    description: 'Order processing and management service',
    environment: 'production',
    region: 'us-west-2',
    baseQPS: 1200,
    baseLatency: 80,
    baseErrorRate: 2.5,
    baseCPU: 55,
    baseMemory: 4.8,
  },
  {
    id: 'payment-service',
    name: 'payment-service',
    displayName: 'Payment Service',
    description: 'Payment processing and transaction service',
    environment: 'production',
    region: 'eu-west-1',
    baseQPS: 600,
    baseLatency: 150,
    baseErrorRate: 4.0,
    baseCPU: 35,
    baseMemory: 2.5,
  },
];

// ============================================================================
// Cache Management
// ============================================================================

interface MetricsCache {
  services: Service[];
  metricsData: Map<string, ServiceMetrics>;
  timestamp: number;
}

let metricsCache: MetricsCache | null = null;

/**
 * Initializes or refreshes the metrics cache
 */
function initializeCache(): MetricsCache {
  const now = Date.now();
  const endTime = now;
  const startTime = now - 24 * 60 * 60 * 1000; // Last 24 hours

  // Generate services
  const services: Service[] = SERVICES.map((config) => {
    const status = calculateServiceStatus(config);
    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      description: config.description,
      environment: config.environment,
      region: config.region,
      status,
      tags: [
        `env:${config.environment}`,
        `region:${config.region}`,
        'team:platform',
      ],
      metadata: {
        version: `v${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 20 })}.${faker.number.int({ min: 0, max: 10 })}`,
        uptime: faker.number.int({ min: 86400, max: 2592000 }), // 1-30 days in seconds
        instances: faker.number.int({ min: 3, max: 10 }),
      },
    };
  });

  // Generate metrics for each service
  const metricsData = new Map<string, ServiceMetrics>();
  SERVICES.forEach((config) => {
    const interval = getOptimalInterval(startTime, endTime);
    const labels: MetricLabels = {
      service: config.name,
      environment: config.environment,
      region: config.region,
    };

    const metrics = generateServiceMetrics(
      config.name,
      startTime,
      endTime,
      interval
    );

    // Calculate current values (last data point)
    const getLastValue = (series: MetricTimeSeries): number => {
      const lastPoint = series.data[series.data.length - 1];
      return lastPoint ? lastPoint.value : 0;
    };

    const qps = getLastValue(metrics.qps);
    const p50 = getLastValue(metrics.latency_p50);
    const p90 = getLastValue(metrics.latency_p90);
    const p99 = getLastValue(metrics.latency_p99);
    const errorRate = getLastValue(metrics.error_rate);
    const cpu = getLastValue(metrics.cpu_usage);
    const memory = getLastValue(metrics.memory_usage);

    const serviceMetrics: ServiceMetrics = {
      service: config.name,
      timestamp: endTime,
      qps,
      rps: qps, // Same as QPS for simplicity
      errorRate,
      latency: {
        p50,
        p90,
        p95: (p90 + p99) / 2, // Approximate
        p99,
        avg: (p50 + p90 + p99) / 3, // Approximate
      },
      throughput: qps,
      cpu,
      memory,
      disk: {
        usage: faker.number.float({ min: 40, max: 80, precision: 0.1 }),
        readIOPS: faker.number.int({ min: 100, max: 500 }),
        writeIOPS: faker.number.int({ min: 50, max: 300 }),
      },
      network: {
        inbound: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
        outbound: faker.number.float({ min: 5, max: 50, precision: 0.1 }),
      },
      health: calculateHealthStatus(errorRate, p99, cpu),
      timeSeries: metrics,
    };

    metricsData.set(config.id, serviceMetrics);
  });

  return {
    services,
    metricsData,
    timestamp: now,
  };
}

/**
 * Gets or initializes the metrics cache
 */
function getCache(): MetricsCache {
  const now = Date.now();
  if (!metricsCache || now - metricsCache.timestamp > CACHE_DURATION) {
    metricsCache = initializeCache();
  }
  return metricsCache;
}

/**
 * Clears the metrics cache (for testing)
 */
export function clearMetricsCache(): void {
  metricsCache = null;
}

// ============================================================================
// Status Calculation
// ============================================================================

/**
 * Calculates service status based on metrics
 */
function calculateServiceStatus(config: typeof SERVICES[0]): ServiceStatus {
  const errorRate = config.baseErrorRate;
  const latency = config.baseLatency;

  if (errorRate > 5 || latency > 500) {
    return 'down';
  } else if (errorRate > 3 || latency > 300) {
    return 'degraded';
  } else if (errorRate > 1.5 || latency > 150) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * Calculates health status based on current metrics
 */
function calculateHealthStatus(
  errorRate: number,
  p99Latency: number,
  cpuUsage: number
): ServiceStatus {
  if (errorRate > 5 || p99Latency > 2000 || cpuUsage > 90) {
    return 'down';
  } else if (errorRate > 2 || p99Latency > 1000 || cpuUsage > 80) {
    return 'degraded';
  }
  return 'healthy';
}

// ============================================================================
// Public API - Services
// ============================================================================

/**
 * Gets all available services
 */
export function getServices(): Service[] {
  const cache = getCache();
  return cache.services;
}

/**
 * Gets a specific service by ID
 */
export function getServiceById(serviceId: string): Service | null {
  const cache = getCache();
  return cache.services.find((s) => s.id === serviceId) || null;
}

/**
 * Gets health check data for a service
 */
export function getServiceHealth(serviceId: string): HealthCheck | null {
  const service = getServiceById(serviceId);
  if (!service) return null;

  const cache = getCache();
  const metrics = cache.metricsData.get(serviceId);
  if (!metrics) return null;

  return {
    service: service.name,
    status: service.status,
    timestamp: Date.now(),
    checks: [
      {
        name: 'Error Rate',
        status: metrics.errorRate < 2 ? 'healthy' : metrics.errorRate < 5 ? 'degraded' : 'down',
        message: `Current error rate: ${metrics.errorRate.toFixed(2)}%`,
      },
      {
        name: 'Latency P99',
        status: metrics.latency.p99 < 500 ? 'healthy' : metrics.latency.p99 < 1000 ? 'degraded' : 'down',
        message: `P99 latency: ${metrics.latency.p99.toFixed(0)}ms`,
      },
      {
        name: 'CPU Usage',
        status: metrics.cpu < 70 ? 'healthy' : metrics.cpu < 85 ? 'degraded' : 'down',
        message: `CPU usage: ${metrics.cpu.toFixed(1)}%`,
      },
      {
        name: 'Memory Usage',
        status: metrics.memory < 80 ? 'healthy' : metrics.memory < 90 ? 'degraded' : 'down',
        message: `Memory usage: ${metrics.memory.toFixed(1)}%`,
      },
    ],
    uptime: service.metadata?.uptime || 0,
    version: service.metadata?.version || 'unknown',
  };
}

// ============================================================================
// Public API - Metrics Query
// ============================================================================

/**
 * Queries metrics based on query configuration
 */
export function queryMetrics(query: MetricQuery): MetricQueryResult {
  const startTime = performance.now();
  const cache = getCache();

  // Find matching services
  const matchingServices = cache.services.filter((service) => {
    if (query.labels?.service && service.name !== query.labels.service) {
      return false;
    }
    if (query.labels?.environment && service.environment !== query.labels.environment) {
      return false;
    }
    if (query.labels?.region && service.region !== query.labels.region) {
      return false;
    }
    return true;
  });

  // Generate time series for each matching service
  const series: MetricTimeSeries[] = [];
  const interval = getOptimalInterval(query.timeRange.start, query.timeRange.end);

  matchingServices.forEach((service) => {
    const labels: MetricLabels = {
      service: service.name,
      environment: service.environment,
      region: service.region,
    };

    let timeSeries: MetricTimeSeries;

    // Generate appropriate time series based on metric type
    switch (query.metric) {
      case 'qps':
      case 'rps':
      case 'tps':
        timeSeries = generateQPSTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          undefined,
          labels
        );
        break;
      case 'error_rate':
        timeSeries = generateErrorRateTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          undefined,
          labels
        );
        break;
      case 'latency_p50':
        timeSeries = generateLatencyTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          'p50',
          labels
        );
        break;
      case 'latency_p90':
        timeSeries = generateLatencyTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          'p90',
          labels
        );
        break;
      case 'latency_p99':
        timeSeries = generateLatencyTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          'p99',
          labels
        );
        break;
      case 'cpu_usage':
        timeSeries = generateCPUUsageTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          undefined,
          labels
        );
        break;
      case 'memory_usage':
        timeSeries = generateMemoryUsageTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          undefined,
          labels
        );
        break;
      case 'network_in':
        timeSeries = generateNetworkIOTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          'in',
          undefined,
          labels
        );
        break;
      case 'network_out':
        timeSeries = generateNetworkIOTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          'out',
          undefined,
          labels
        );
        break;
      default:
        // Default to QPS for unknown metrics
        timeSeries = generateQPSTimeSeries(
          query.timeRange.start,
          query.timeRange.end,
          interval,
          undefined,
          labels
        );
    }

    // Apply aggregation if specified
    if (query.aggregation && query.aggregation !== 'avg') {
      timeSeries = aggregateTimeSeries(timeSeries, interval, query.aggregation);
    }

    series.push(timeSeries);
  });

  // Calculate statistics
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const statistics = {
    count: allValues.length,
    sum: allValues.reduce((a, b) => a + b, 0),
    avg: allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0,
    min: allValues.length > 0 ? Math.min(...allValues) : 0,
    max: allValues.length > 0 ? Math.max(...allValues) : 0,
  };

  const executionTime = performance.now() - startTime;

  return {
    series,
    statistics,
    executionTime,
  };
}

/**
 * Gets comprehensive metrics for a specific service
 */
export function getServiceMetrics(
  serviceId: string,
  startTime: number,
  endTime: number
): ServiceMetrics | null {
  const cache = getCache();
  const cachedMetrics = cache.metricsData.get(serviceId);
  if (!cachedMetrics) return null;

  // If requested time range matches cache, return cached data
  const cacheAge = Date.now() - cache.timestamp;
  if (cacheAge < CACHE_DURATION) {
    return cachedMetrics;
  }

  // Otherwise, regenerate for the requested time range
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) return null;

  const interval = getOptimalInterval(startTime, endTime);
  const metrics = generateServiceMetrics(service.name, startTime, endTime, interval);

  const getLastValue = (series: MetricTimeSeries): number => {
    const lastPoint = series.data[series.data.length - 1];
    return lastPoint ? lastPoint.value : 0;
  };

  const qps = getLastValue(metrics.qps);
  const p50 = getLastValue(metrics.latency_p50);
  const p90 = getLastValue(metrics.latency_p90);
  const p99 = getLastValue(metrics.latency_p99);
  const errorRate = getLastValue(metrics.error_rate);
  const cpu = getLastValue(metrics.cpu_usage);
  const memory = getLastValue(metrics.memory_usage);

  return {
    service: service.name,
    timestamp: endTime,
    qps,
    rps: qps,
    errorRate,
    latency: {
      p50,
      p90,
      p95: (p90 + p99) / 2,
      p99,
      avg: (p50 + p90 + p99) / 3,
    },
    throughput: qps,
    cpu,
    memory,
    disk: {
      usage: faker.number.float({ min: 40, max: 80, precision: 0.1 }),
      readIOPS: faker.number.int({ min: 100, max: 500 }),
      writeIOPS: faker.number.int({ min: 50, max: 300 }),
    },
    network: {
      inbound: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
      outbound: faker.number.float({ min: 5, max: 50, precision: 0.1 }),
    },
    health: calculateHealthStatus(errorRate, p99, cpu),
    timeSeries: metrics,
  };
}

/**
 * Gets metrics for all services
 */
export function getAllServicesMetrics(
  startTime: number,
  endTime: number
): ServiceMetrics[] {
  return SERVICES.map((service) => getServiceMetrics(service.id, startTime, endTime)).filter(
    (m): m is ServiceMetrics => m !== null
  );
}

/**
 * Compares a specific metric across multiple services
 */
export function compareServiceMetrics(
  serviceIds: string[],
  metricType: MetricType,
  startTime: number,
  endTime: number
): MetricTimeSeries[] {
  const interval = getOptimalInterval(startTime, endTime);
  const series: MetricTimeSeries[] = [];

  serviceIds.forEach((serviceId) => {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    const labels: MetricLabels = {
      service: service.name,
      environment: service.environment,
      region: service.region,
    };

    let timeSeries: MetricTimeSeries;

    switch (metricType) {
      case 'qps':
        timeSeries = generateQPSTimeSeries(startTime, endTime, interval, service.baseQPS, labels);
        break;
      case 'error_rate':
        timeSeries = generateErrorRateTimeSeries(
          startTime,
          endTime,
          interval,
          service.baseErrorRate,
          labels
        );
        break;
      case 'latency_p99':
        timeSeries = generateLatencyTimeSeries(
          startTime,
          endTime,
          interval,
          'p99',
          labels
        );
        break;
      case 'cpu_usage':
        timeSeries = generateCPUUsageTimeSeries(
          startTime,
          endTime,
          interval,
          service.baseCPU,
          labels
        );
        break;
      case 'memory_usage':
        timeSeries = generateMemoryUsageTimeSeries(
          startTime,
          endTime,
          interval,
          service.baseMemory,
          labels
        );
        break;
      default:
        timeSeries = generateQPSTimeSeries(startTime, endTime, interval, service.baseQPS, labels);
    }

    series.push(timeSeries);
  });

  return series;
}
