/**
 * Service Definitions for Mock Data Generation
 * 
 * Defines the 3 core microservices used throughout the observability platform:
 * - api-service: Main API gateway handling user requests
 * - auth-service: Authentication and authorization service
 * - user-service: User management and profile service
 * 
 * Each service includes metadata (instances, environment, region) used by:
 * - Mock data generators (traces, logs, metrics)
 * - Filter components (service selection)
 * - Topology visualization (service dependencies)
 * - Dashboard health indicators
 */

import type { ServiceDefinition } from '@/types'

/**
 * Service Definitions
 * 
 * Each service includes:
 * - id: Unique identifier for internal use
 * - name: Display name for UI
 * - displayName: Human-readable name
 * - description: Service purpose
 * - instances: Array of running instances (for distributed tracing)
 * - environment: Deployment environment
 * - region: Geographic region
 * - status: Current health status (computed from metrics)
 */
export const SERVICES: ServiceDefinition[] = [
  {
    id: 'api-service',
    name: 'api-service',
    displayName: 'API Service',
    description: 'Main API gateway handling user requests and routing',
    instances: [
      'api-service-prod-1',
      'api-service-prod-2',
      'api-service-prod-3'
    ],
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy'
  },
  {
    id: 'auth-service',
    name: 'auth-service',
    displayName: 'Auth Service',
    description: 'Authentication and authorization service',
    instances: [
      'auth-service-prod-1',
      'auth-service-prod-2'
    ],
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy'
  },
  {
    id: 'user-service',
    name: 'user-service',
    displayName: 'User Service',
    description: 'User management and profile service',
    instances: [
      'user-service-prod-1',
      'user-service-prod-2',
      'user-service-prod-3'
    ],
    environment: 'production',
    region: 'us-east-1',
    status: 'healthy'
  }
]

/**
 * Service Operations
 * 
 * Maps service names to realistic operation names used in:
 * - Trace span generation
 * - Log message generation
 * - Metrics naming
 */
export const SERVICE_OPERATIONS: Record<string, string[]> = {
  'api-service': [
    'POST /api/users',
    'GET /api/users/:id',
    'PUT /api/users/:id',
    'DELETE /api/users/:id',
    'GET /api/health',
    'POST /api/login',
    'POST /api/logout',
    'GET /api/profile',
    'POST /api/refresh-token',
    'GET /api/services'
  ],
  'auth-service': [
    'validate-token',
    'issue-token',
    'refresh-token',
    'revoke-token',
    'check-permissions',
    'authenticate-user',
    'verify-mfa',
    'create-session',
    'destroy-session',
    'get-user-roles'
  ],
  'user-service': [
    'create-user',
    'get-user',
    'update-user',
    'delete-user',
    'list-users',
    'get-user-profile',
    'update-profile',
    'change-password',
    'get-user-preferences',
    'update-preferences'
  ]
}

/**
 * Service Dependencies
 * 
 * Defines which services call which other services
 * Used for:
 * - Trace generation (building realistic call chains)
 * - Topology visualization (service dependency graph)
 * - Impact analysis (cascade failure detection)
 */
export const SERVICE_DEPENDENCIES: Record<string, string[]> = {
  'api-service': ['auth-service', 'user-service'],
  'auth-service': [],
  'user-service': []
}

/**
 * Service Metadata
 * 
 * Additional service information for monitoring and visualization
 */
export const SERVICE_METADATA: Record<string, Record<string, any>> = {
  'api-service': {
    type: 'gateway',
    language: 'Node.js',
    framework: 'Express',
    port: 3000,
    healthCheckPath: '/health',
    metricsPath: '/metrics'
  },
  'auth-service': {
    type: 'service',
    language: 'Python',
    framework: 'FastAPI',
    port: 8000,
    healthCheckPath: '/health',
    metricsPath: '/metrics'
  },
  'user-service': {
    type: 'service',
    language: 'Go',
    framework: 'Gin',
    port: 8080,
    healthCheckPath: '/health',
    metricsPath: '/metrics'
  }
}

/**
 * Get service by ID
 * 
 * @param serviceId - Service identifier
 * @returns ServiceDefinition or undefined if not found
 */
export function getServiceById(serviceId: string): ServiceDefinition | undefined {
  return SERVICES.find(s => s.id === serviceId)
}

/**
 * Get all service IDs
 * 
 * @returns Array of service IDs
 */
export function getServiceIds(): string[] {
  return SERVICES.map(s => s.id)
}

/**
 * Get service operations
 * 
 * @param serviceId - Service identifier
 * @returns Array of operation names for the service
 */
export function getServiceOperations(serviceId: string): string[] {
  return SERVICE_OPERATIONS[serviceId] || []
}

/**
 * Get dependent services
 * 
 * @param serviceId - Service identifier
 * @returns Array of service IDs that this service depends on
 */
export function getDependentServices(serviceId: string): string[] {
  return SERVICE_DEPENDENCIES[serviceId] || []
}

/**
 * Get service metadata
 * 
 * @param serviceId - Service identifier
 * @returns Metadata object for the service
 */
export function getServiceMetadata(serviceId: string): Record<string, any> {
  return SERVICE_METADATA[serviceId] || {}
}

/**
 * Check if service exists
 * 
 * @param serviceId - Service identifier
 * @returns True if service exists
 */
export function serviceExists(serviceId: string): boolean {
  return SERVICES.some(s => s.id === serviceId)
}

/**
 * Get all services
 * 
 * @returns Array of all ServiceDefinition objects
 */
export function getAllServices(): ServiceDefinition[] {
  return [...SERVICES]
}

/**
 * Get services by environment
 * 
 * @param environment - Environment name (e.g., 'production')
 * @returns Array of services in the specified environment
 */
export function getServicesByEnvironment(environment: string): ServiceDefinition[] {
  return SERVICES.filter(s => s.environment === environment)
}

/**
 * Get services by region
 * 
 * @param region - Region name (e.g., 'us-east-1')
 * @returns Array of services in the specified region
 */
export function getServicesByRegion(region: string): ServiceDefinition[] {
  return SERVICES.filter(s => s.region === region)
}

/**
 * Get all instances across all services
 * 
 * @returns Array of all instance IDs
 */
export function getAllInstances(): string[] {
  return SERVICES.flatMap(s => s.instances)
}

/**
 * Get instances for a specific service
 * 
 * @param serviceId - Service identifier
 * @returns Array of instance IDs for the service
 */
export function getServiceInstances(serviceId: string): string[] {
  const service = getServiceById(serviceId)
  return service?.instances || []
}

/**
 * Get service from instance ID
 * 
 * @param instanceId - Instance identifier
 * @returns ServiceDefinition or undefined if instance not found
 */
export function getServiceFromInstance(instanceId: string): ServiceDefinition | undefined {
  return SERVICES.find(s => s.instances.includes(instanceId))
}

export default SERVICES
