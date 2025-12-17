/**
 * Service Definitions for Mock Data Generation
 * 
 * Defines the pool of microservices used throughout the observability platform.
 * These services are referenced in metrics, traces, and logs to create realistic
 * cross-module correlation.
 */

export interface ServiceDefinition {
  name: string
  displayName: string
  type: 'gateway' | 'service' | 'database' | 'cache' | 'queue' | 'external'
  description: string
  endpoints: string[]
  dependencies: string[]
  baseMetrics: {
    errorRate: number // baseline error rate (0-1)
    avgResponseTime: number // milliseconds
    qps: number // queries per second
    cpuUsage: number // percentage (0-100)
    memoryUsage: number // percentage (0-100)
  }
  tags: Record<string, string>
}

/**
 * Complete service pool for the observability platform
 */
export const SERVICES: ServiceDefinition[] = [
  {
    name: 'api-gateway',
    displayName: 'API Gateway',
    type: 'gateway',
    description: 'Main entry point for all client requests',
    endpoints: [
      '/api/users',
      '/api/orders',
      '/api/products',
      '/api/payments',
      '/api/inventory',
      '/api/notifications',
      '/api/search',
      '/api/recommendations'
    ],
    dependencies: [
      'user-service',
      'order-service',
      'product-service',
      'payment-service',
      'inventory-service',
      'notification-service'
    ],
    baseMetrics: {
      errorRate: 0.02, // 2% baseline error rate
      avgResponseTime: 45, // 45ms average
      qps: 1200,
      cpuUsage: 35,
      memoryUsage: 60
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v2.3.1',
      team: 'platform'
    }
  },
  {
    name: 'user-service',
    displayName: 'User Service',
    type: 'service',
    description: 'User authentication and profile management',
    endpoints: [
      '/users/login',
      '/users/register',
      '/users/profile',
      '/users/preferences',
      '/users/sessions',
      '/users/logout'
    ],
    dependencies: ['mysql-db', 'redis-cache'],
    baseMetrics: {
      errorRate: 0.015,
      avgResponseTime: 25,
      qps: 800,
      cpuUsage: 28,
      memoryUsage: 45
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v1.8.2',
      team: 'identity'
    }
  },
  {
    name: 'order-service',
    displayName: 'Order Service',
    type: 'service',
    description: 'Order creation and management',
    endpoints: [
      '/orders/create',
      '/orders/list',
      '/orders/details',
      '/orders/cancel',
      '/orders/update',
      '/orders/history'
    ],
    dependencies: [
      'payment-service',
      'inventory-service',
      'notification-service',
      'mysql-db',
      'kafka-queue'
    ],
    baseMetrics: {
      errorRate: 0.025,
      avgResponseTime: 120,
      qps: 450,
      cpuUsage: 42,
      memoryUsage: 55
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v3.1.0',
      team: 'commerce'
    }
  },
  {
    name: 'payment-service',
    displayName: 'Payment Service',
    type: 'service',
    description: 'Payment processing and transaction management',
    endpoints: [
      '/payments/process',
      '/payments/validate',
      '/payments/refund',
      '/payments/status',
      '/payments/methods'
    ],
    dependencies: ['mysql-db', 'stripe-api', 'paypal-api'],
    baseMetrics: {
      errorRate: 0.03, // Higher error rate due to external dependencies
      avgResponseTime: 180,
      qps: 200,
      cpuUsage: 38,
      memoryUsage: 50
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v2.5.3',
      team: 'payments',
      pci: 'compliant'
    }
  },
  {
    name: 'inventory-service',
    displayName: 'Inventory Service',
    type: 'service',
    description: 'Product inventory and stock management',
    endpoints: [
      '/inventory/check',
      '/inventory/reserve',
      '/inventory/release',
      '/inventory/update',
      '/inventory/restock'
    ],
    dependencies: ['mysql-db', 'redis-cache'],
    baseMetrics: {
      errorRate: 0.018,
      avgResponseTime: 35,
      qps: 600,
      cpuUsage: 32,
      memoryUsage: 48
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v1.9.1',
      team: 'commerce'
    }
  },
  {
    name: 'notification-service',
    displayName: 'Notification Service',
    type: 'service',
    description: 'Email, SMS, and push notification delivery',
    endpoints: [
      '/notifications/send',
      '/notifications/email',
      '/notifications/sms',
      '/notifications/push',
      '/notifications/status'
    ],
    dependencies: ['kafka-queue', 'sendgrid-api', 'twilio-api'],
    baseMetrics: {
      errorRate: 0.022,
      avgResponseTime: 95,
      qps: 350,
      cpuUsage: 30,
      memoryUsage: 42
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v2.1.4',
      team: 'communications'
    }
  },
  {
    name: 'product-service',
    displayName: 'Product Service',
    type: 'service',
    description: 'Product catalog and search',
    endpoints: [
      '/products/search',
      '/products/details',
      '/products/categories',
      '/products/recommendations',
      '/products/reviews'
    ],
    dependencies: ['elasticsearch', 'mysql-db', 'redis-cache'],
    baseMetrics: {
      errorRate: 0.012,
      avgResponseTime: 55,
      qps: 900,
      cpuUsage: 40,
      memoryUsage: 65
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: 'v2.7.0',
      team: 'catalog'
    }
  },
  {
    name: 'mysql-db',
    displayName: 'MySQL Database',
    type: 'database',
    description: 'Primary relational database',
    endpoints: [
      '/query',
      '/transaction',
      '/batch'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.005, // Very low error rate for database
      avgResponseTime: 8,
      qps: 3000,
      cpuUsage: 55,
      memoryUsage: 70
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: '8.0.32',
      team: 'infrastructure',
      type: 'mysql'
    }
  },
  {
    name: 'redis-cache',
    displayName: 'Redis Cache',
    type: 'cache',
    description: 'In-memory cache and session store',
    endpoints: [
      '/get',
      '/set',
      '/delete',
      '/expire'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.003, // Very low error rate
      avgResponseTime: 2,
      qps: 5000,
      cpuUsage: 25,
      memoryUsage: 80
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: '7.0.11',
      team: 'infrastructure',
      type: 'redis'
    }
  },
  {
    name: 'elasticsearch',
    displayName: 'Elasticsearch',
    type: 'database',
    description: 'Search and analytics engine',
    endpoints: [
      '/search',
      '/index',
      '/bulk',
      '/aggregate'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.008,
      avgResponseTime: 45,
      qps: 1500,
      cpuUsage: 60,
      memoryUsage: 75
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: '8.8.0',
      team: 'infrastructure',
      type: 'elasticsearch'
    }
  },
  {
    name: 'kafka-queue',
    displayName: 'Kafka Message Queue',
    type: 'queue',
    description: 'Event streaming and message queue',
    endpoints: [
      '/produce',
      '/consume',
      '/topics'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.006,
      avgResponseTime: 12,
      qps: 2500,
      cpuUsage: 45,
      memoryUsage: 65
    },
    tags: {
      environment: 'production',
      region: 'us-east-1',
      version: '3.4.0',
      team: 'infrastructure',
      type: 'kafka'
    }
  },
  {
    name: 'stripe-api',
    displayName: 'Stripe API',
    type: 'external',
    description: 'External payment gateway',
    endpoints: [
      '/charges',
      '/refunds',
      '/customers'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.04, // Higher error rate for external service
      avgResponseTime: 250,
      qps: 150,
      cpuUsage: 0, // External service
      memoryUsage: 0
    },
    tags: {
      environment: 'production',
      region: 'external',
      version: 'v1',
      team: 'external',
      provider: 'stripe'
    }
  },
  {
    name: 'paypal-api',
    displayName: 'PayPal API',
    type: 'external',
    description: 'External payment gateway',
    endpoints: [
      '/payments',
      '/refunds',
      '/webhooks'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.045,
      avgResponseTime: 280,
      qps: 100,
      cpuUsage: 0,
      memoryUsage: 0
    },
    tags: {
      environment: 'production',
      region: 'external',
      version: 'v2',
      team: 'external',
      provider: 'paypal'
    }
  },
  {
    name: 'sendgrid-api',
    displayName: 'SendGrid API',
    type: 'external',
    description: 'Email delivery service',
    endpoints: [
      '/send',
      '/templates',
      '/webhooks'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.035,
      avgResponseTime: 200,
      qps: 120,
      cpuUsage: 0,
      memoryUsage: 0
    },
    tags: {
      environment: 'production',
      region: 'external',
      version: 'v3',
      team: 'external',
      provider: 'sendgrid'
    }
  },
  {
    name: 'twilio-api',
    displayName: 'Twilio API',
    type: 'external',
    description: 'SMS delivery service',
    endpoints: [
      '/messages',
      '/status',
      '/webhooks'
    ],
    dependencies: [],
    baseMetrics: {
      errorRate: 0.038,
      avgResponseTime: 220,
      qps: 80,
      cpuUsage: 0,
      memoryUsage: 0
    },
    tags: {
      environment: 'production',
      region: 'external',
      version: 'v1',
      team: 'external',
      provider: 'twilio'
    }
  }
]

/**
 * Get service by name
 */
export function getService(name: string): ServiceDefinition | undefined {
  return SERVICES.find(s => s.name === name)
}

/**
 * Get all service names
 */
export function getServiceNames(): string[] {
  return SERVICES.map(s => s.name)
}

/**
 * Get services by type
 */
export function getServicesByType(type: ServiceDefinition['type']): ServiceDefinition[] {
  return SERVICES.filter(s => s.type === type)
}

/**
 * Get internal services (exclude external APIs)
 */
export function getInternalServices(): ServiceDefinition[] {
  return SERVICES.filter(s => s.type !== 'external')
}

/**
 * Get service dependencies (direct children)
 */
export function getServiceDependencies(serviceName: string): ServiceDefinition[] {
  const service = getService(serviceName)
  if (!service) return []
  
  return service.dependencies
    .map(depName => getService(depName))
    .filter((s): s is ServiceDefinition => s !== undefined)
}

/**
 * Get services that depend on this service (parents)
 */
export function getServiceDependents(serviceName: string): ServiceDefinition[] {
  return SERVICES.filter(s => s.dependencies.includes(serviceName))
}

/**
 * Get all services in dependency tree (recursive)
 */
export function getServiceTree(serviceName: string, visited = new Set<string>()): ServiceDefinition[] {
  if (visited.has(serviceName)) return []
  visited.add(serviceName)
  
  const service = getService(serviceName)
  if (!service) return []
  
  const tree: ServiceDefinition[] = [service]
  
  for (const depName of service.dependencies) {
    tree.push(...getServiceTree(depName, visited))
  }
  
  return tree
}

/**
 * Service name to color mapping for consistent visualization
 */
export const SERVICE_COLORS: Record<string, string> = {
  'api-gateway': '#3274d9',
  'user-service': '#73bf69',
  'order-service': '#ff9830',
  'payment-service': '#f2495c',
  'inventory-service': '#b877d9',
  'notification-service': '#58a6ff',
  'product-service': '#ffc107',
  'mysql-db': '#00d4aa',
  'redis-cache': '#ff6b9d',
  'elasticsearch': '#c0ca33',
  'kafka-queue': '#ff7043',
  'stripe-api': '#9c27b0',
  'paypal-api': '#00bcd4',
  'sendgrid-api': '#4caf50',
  'twilio-api': '#ff5722'
}

/**
 * Get consistent color for service
 */
export function getServiceColor(serviceName: string): string {
  return SERVICE_COLORS[serviceName] || '#6c6f77'
}
