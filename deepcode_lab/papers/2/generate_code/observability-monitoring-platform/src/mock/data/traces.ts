/**
 * Pre-generated sample trace data for the Observability Monitoring Platform
 * Provides realistic distributed trace examples with various patterns:
 * - Successful traces (95%)
 * - Error traces (5%)
 * - Slow traces (performance bottlenecks)
 * - Various service call chains (2-10 spans per trace)
 *
 * This data is used for:
 * 1. Initial demo data on app startup
 * 2. Consistent test data for integration tests
 * 3. Reference examples for trace visualization components
 */

import { Trace, Span, SpanStatus } from '@/types'
import { generateUUID } from '@/mock/generators/utils'

/**
 * Helper function to create a span with proper defaults
 */
function createSpan(
  traceId: string,
  spanId: string,
  parentSpanId: string | null,
  service: string,
  operation: string,
  startTime: Date,
  durationMs: number,
  status: SpanStatus = 'SUCCESS',
  tags: Record<string, any> = {},
  logs: Array<{ timestamp: Date; message: string; fields: Record<string, any> }> = []
): Span {
  const endTime = new Date(startTime.getTime() + durationMs)
  return {
    spanId,
    traceId,
    parentSpanId,
    service,
    operation,
    startTime,
    endTime,
    durationMs,
    status,
    tags,
    logs
  }
}

/**
 * Helper function to create a trace with proper defaults
 */
function createTrace(
  traceId: string,
  rootSpanId: string,
  rootService: string,
  startTime: Date,
  spans: Span[],
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'SUCCESS'
): Trace {
  const endTime = new Date(Math.max(...spans.map(s => s.endTime.getTime())))
  const totalDurationMs = endTime.getTime() - startTime.getTime()

  return {
    traceId,
    rootSpanId,
    rootService,
    startTime,
    endTime,
    totalDurationMs,
    spanCount: spans.length,
    status,
    spans
  }
}

/**
 * Sample trace 1: Successful user creation flow (3 spans)
 * Pattern: API Gateway → Auth Service → User Service
 */
const trace1: Trace = (() => {
  const startTime = new Date(Date.now() - 3600000) // 1 hour ago
  const rootSpanId = generateUUID()
  const authSpanId = generateUUID()
  const userSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'POST /api/users',
      startTime,
      145,
      'SUCCESS',
      { http_method: 'POST', http_status_code: 201, user_id: 'user-123' }
    ),
    createSpan(
      traceId,
      authSpanId,
      rootSpanId,
      'auth-service',
      'validate-token',
      new Date(startTime.getTime() + 5),
      25,
      'SUCCESS',
      { token_valid: true }
    ),
    createSpan(
      traceId,
      userSpanId,
      rootSpanId,
      'user-service',
      'create-user',
      new Date(startTime.getTime() + 35),
      100,
      'SUCCESS',
      { user_created: true, user_id: 'user-123' }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'SUCCESS')
})()

/**
 * Sample trace 2: Error trace - database connection failure (4 spans)
 * Pattern: API Gateway → User Service → Database (ERROR)
 */
const trace2: Trace = (() => {
  const startTime = new Date(Date.now() - 3000000) // 50 minutes ago
  const rootSpanId = generateUUID()
  const userSpanId = generateUUID()
  const dbSpanId = generateUUID()
  const cacheSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'GET /api/users/123',
      startTime,
      520,
      'ERROR',
      { http_method: 'GET', http_status_code: 500 }
    ),
    createSpan(
      traceId,
      userSpanId,
      rootSpanId,
      'user-service',
      'get-user',
      new Date(startTime.getTime() + 10),
      500,
      'ERROR',
      { user_id: 'user-123' }
    ),
    createSpan(
      traceId,
      dbSpanId,
      userSpanId,
      'database',
      'SELECT * FROM users WHERE id = ?',
      new Date(startTime.getTime() + 50),
      450,
      'ERROR',
      { db_error: 'Connection timeout', query_time_ms: 450 },
      [
        {
          timestamp: new Date(startTime.getTime() + 450),
          message: 'Database connection failed',
          fields: { error: 'timeout', host: 'db.internal:5432' }
        }
      ]
    ),
    createSpan(
      traceId,
      cacheSpanId,
      userSpanId,
      'cache-service',
      'GET user:123',
      new Date(startTime.getTime() + 20),
      15,
      'SUCCESS',
      { cache_hit: false }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'ERROR')
})()

/**
 * Sample trace 3: Slow trace - performance degradation (5 spans)
 * Pattern: API Gateway → Auth → User Service → Database + Cache (slow)
 */
const trace3: Trace = (() => {
  const startTime = new Date(Date.now() - 2400000) // 40 minutes ago
  const rootSpanId = generateUUID()
  const authSpanId = generateUUID()
  const userSpanId = generateUUID()
  const dbSpanId = generateUUID()
  const cacheSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'POST /api/users/search',
      startTime,
      1250,
      'SUCCESS',
      { http_method: 'POST', http_status_code: 200, result_count: 42 }
    ),
    createSpan(
      traceId,
      authSpanId,
      rootSpanId,
      'auth-service',
      'validate-token',
      new Date(startTime.getTime() + 5),
      30,
      'SUCCESS',
      { token_valid: true }
    ),
    createSpan(
      traceId,
      userSpanId,
      rootSpanId,
      'user-service',
      'search-users',
      new Date(startTime.getTime() + 40),
      1200,
      'SUCCESS',
      { query: 'status=active', result_count: 42 }
    ),
    createSpan(
      traceId,
      dbSpanId,
      userSpanId,
      'database',
      'SELECT * FROM users WHERE status = ?',
      new Date(startTime.getTime() + 100),
      1050,
      'SUCCESS',
      { query_time_ms: 1050, rows_returned: 42 }
    ),
    createSpan(
      traceId,
      cacheSpanId,
      userSpanId,
      'cache-service',
      'SET search:active',
      new Date(startTime.getTime() + 1150),
      40,
      'SUCCESS',
      { cache_key: 'search:active', ttl_seconds: 300 }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'SUCCESS')
})()

/**
 * Sample trace 4: Successful payment processing (6 spans)
 * Pattern: API Gateway → Payment Service → Bank API + Notification Service
 */
const trace4: Trace = (() => {
  const startTime = new Date(Date.now() - 1800000) // 30 minutes ago
  const rootSpanId = generateUUID()
  const paymentSpanId = generateUUID()
  const bankSpanId = generateUUID()
  const notificationSpanId = generateUUID()
  const dbSpanId = generateUUID()
  const cacheSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'POST /api/payments',
      startTime,
      380,
      'SUCCESS',
      { http_method: 'POST', http_status_code: 200, amount: 99.99 }
    ),
    createSpan(
      traceId,
      paymentSpanId,
      rootSpanId,
      'payment-service',
      'process-payment',
      new Date(startTime.getTime() + 10),
      360,
      'SUCCESS',
      { payment_id: 'pay-456', amount: 99.99 }
    ),
    createSpan(
      traceId,
      bankSpanId,
      paymentSpanId,
      'bank-api',
      'POST /charge',
      new Date(startTime.getTime() + 50),
      250,
      'SUCCESS',
      { bank_response_code: '00', transaction_id: 'txn-789' }
    ),
    createSpan(
      traceId,
      notificationSpanId,
      paymentSpanId,
      'notification-service',
      'send-email',
      new Date(startTime.getTime() + 310),
      40,
      'SUCCESS',
      { email_sent: true, recipient: 'user@example.com' }
    ),
    createSpan(
      traceId,
      dbSpanId,
      paymentSpanId,
      'database',
      'INSERT INTO payments',
      new Date(startTime.getTime() + 60),
      200,
      'SUCCESS',
      { rows_affected: 1 }
    ),
    createSpan(
      traceId,
      cacheSpanId,
      paymentSpanId,
      'cache-service',
      'SET payment:456',
      new Date(startTime.getTime() + 270),
      30,
      'SUCCESS',
      { cache_key: 'payment:456', ttl_seconds: 3600 }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'SUCCESS')
})()

/**
 * Sample trace 5: Timeout trace - service degradation (4 spans)
 * Pattern: API Gateway → User Service → Database (TIMEOUT)
 */
const trace5: Trace = (() => {
  const startTime = new Date(Date.now() - 1200000) // 20 minutes ago
  const rootSpanId = generateUUID()
  const userSpanId = generateUUID()
  const dbSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'GET /api/users/bulk',
      startTime,
      5050,
      'TIMEOUT',
      { http_method: 'GET', http_status_code: 504 }
    ),
    createSpan(
      traceId,
      userSpanId,
      rootSpanId,
      'user-service',
      'get-users-bulk',
      new Date(startTime.getTime() + 10),
      5030,
      'TIMEOUT',
      { user_ids: ['1', '2', '3', '4', '5'] }
    ),
    createSpan(
      traceId,
      dbSpanId,
      userSpanId,
      'database',
      'SELECT * FROM users WHERE id IN (...)',
      new Date(startTime.getTime() + 50),
      5000,
      'TIMEOUT',
      { query_time_ms: 5000, rows_requested: 5 },
      [
        {
          timestamp: new Date(startTime.getTime() + 5000),
          message: 'Query timeout after 5 seconds',
          fields: { timeout_ms: 5000, rows_scanned: 1000000 }
        }
      ]
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'TIMEOUT')
})()

/**
 * Sample trace 6: Successful authentication flow (3 spans)
 * Pattern: API Gateway → Auth Service → Database
 */
const trace6: Trace = (() => {
  const startTime = new Date(Date.now() - 900000) // 15 minutes ago
  const rootSpanId = generateUUID()
  const authSpanId = generateUUID()
  const dbSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'POST /api/auth/login',
      startTime,
      85,
      'SUCCESS',
      { http_method: 'POST', http_status_code: 200 }
    ),
    createSpan(
      traceId,
      authSpanId,
      rootSpanId,
      'auth-service',
      'authenticate',
      new Date(startTime.getTime() + 5),
      70,
      'SUCCESS',
      { user_id: 'user-789', mfa_enabled: true }
    ),
    createSpan(
      traceId,
      dbSpanId,
      authSpanId,
      'database',
      'SELECT * FROM users WHERE email = ?',
      new Date(startTime.getTime() + 15),
      50,
      'SUCCESS',
      { query_time_ms: 50, rows_returned: 1 }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'SUCCESS')
})()

/**
 * Sample trace 7: Partial failure - retry scenario (5 spans)
 * Pattern: API Gateway → Service A → Service B (retry) → Service C
 */
const trace7: Trace = (() => {
  const startTime = new Date(Date.now() - 600000) // 10 minutes ago
  const rootSpanId = generateUUID()
  const serviceASpanId = generateUUID()
  const serviceBSpanId1 = generateUUID()
  const serviceBSpanId2 = generateUUID()
  const serviceCSpanId = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'POST /api/orders',
      startTime,
      320,
      'SUCCESS',
      { http_method: 'POST', http_status_code: 201, order_id: 'ord-999' }
    ),
    createSpan(
      traceId,
      serviceASpanId,
      rootSpanId,
      'order-service',
      'create-order',
      new Date(startTime.getTime() + 5),
      310,
      'SUCCESS',
      { order_id: 'ord-999', items: 3 }
    ),
    createSpan(
      traceId,
      serviceBSpanId1,
      serviceASpanId,
      'inventory-service',
      'reserve-items',
      new Date(startTime.getTime() + 20),
      50,
      'ERROR',
      { attempt: 1, error: 'temporary_unavailable' }
    ),
    createSpan(
      traceId,
      serviceBSpanId2,
      serviceASpanId,
      'inventory-service',
      'reserve-items',
      new Date(startTime.getTime() + 75),
      80,
      'SUCCESS',
      { attempt: 2, items_reserved: 3 }
    ),
    createSpan(
      traceId,
      serviceCSpanId,
      serviceASpanId,
      'notification-service',
      'send-order-confirmation',
      new Date(startTime.getTime() + 160),
      140,
      'SUCCESS',
      { email_sent: true, sms_sent: true }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'SUCCESS')
})()

/**
 * Sample trace 8: Deep call chain - microservices cascade (8 spans)
 * Pattern: API Gateway → Service A → Service B → Service C → Database
 */
const trace8: Trace = (() => {
  const startTime = new Date(Date.now() - 300000) // 5 minutes ago
  const rootSpanId = generateUUID()
  const span2Id = generateUUID()
  const span3Id = generateUUID()
  const span4Id = generateUUID()
  const span5Id = generateUUID()
  const span6Id = generateUUID()
  const span7Id = generateUUID()
  const span8Id = generateUUID()
  const traceId = generateUUID()

  const spans: Span[] = [
    createSpan(
      traceId,
      rootSpanId,
      null,
      'api-gateway',
      'GET /api/recommendations',
      startTime,
      450,
      'SUCCESS',
      { http_method: 'GET', http_status_code: 200 }
    ),
    createSpan(
      traceId,
      span2Id,
      rootSpanId,
      'recommendation-service',
      'get-recommendations',
      new Date(startTime.getTime() + 10),
      430,
      'SUCCESS',
      { user_id: 'user-555' }
    ),
    createSpan(
      traceId,
      span3Id,
      span2Id,
      'user-service',
      'get-user-profile',
      new Date(startTime.getTime() + 20),
      100,
      'SUCCESS',
      { user_id: 'user-555' }
    ),
    createSpan(
      traceId,
      span4Id,
      span2Id,
      'product-service',
      'get-products',
      new Date(startTime.getTime() + 130),
      200,
      'SUCCESS',
      { category: 'electronics' }
    ),
    createSpan(
      traceId,
      span5Id,
      span4Id,
      'inventory-service',
      'check-stock',
      new Date(startTime.getTime() + 150),
      80,
      'SUCCESS',
      { product_count: 50 }
    ),
    createSpan(
      traceId,
      span6Id,
      span5Id,
      'database',
      'SELECT * FROM inventory',
      new Date(startTime.getTime() + 160),
      60,
      'SUCCESS',
      { query_time_ms: 60, rows_returned: 50 }
    ),
    createSpan(
      traceId,
      span7Id,
      span2Id,
      'cache-service',
      'SET recommendations:user-555',
      new Date(startTime.getTime() + 340),
      80,
      'SUCCESS',
      { cache_key: 'recommendations:user-555', ttl_seconds: 3600 }
    ),
    createSpan(
      traceId,
      span8Id,
      span2Id,
      'analytics-service',
      'track-event',
      new Date(startTime.getTime() + 430),
      10,
      'SUCCESS',
      { event: 'recommendation_viewed', user_id: 'user-555' }
    )
  ]

  return createTrace(traceId, rootSpanId, 'api-gateway', startTime, spans, 'SUCCESS')
})()

/**
 * Export all sample traces
 */
export const sampleTraces: Trace[] = [trace1, trace2, trace3, trace4, trace5, trace6, trace7, trace8]

/**
 * Helper function to get traces by service
 */
export function getTracesByService(service: string): Trace[] {
  return sampleTraces.filter(trace => trace.rootService === service)
}

/**
 * Helper function to get traces by status
 */
export function getTracesByStatus(status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'): Trace[] {
  return sampleTraces.filter(trace => trace.status === status)
}

/**
 * Helper function to get slow traces (duration > threshold)
 */
export function getSlowTraces(thresholdMs: number = 500): Trace[] {
  return sampleTraces.filter(trace => trace.totalDurationMs > thresholdMs)
}

/**
 * Helper function to get trace by ID
 */
export function getTraceById(traceId: string): Trace | undefined {
  return sampleTraces.find(trace => trace.traceId === traceId)
}

/**
 * Helper function to get all traces
 */
export function getAllTraces(): Trace[] {
  return sampleTraces
}

/**
 * Statistics about sample traces
 */
export const traceStatistics = {
  totalTraces: sampleTraces.length,
  successTraces: sampleTraces.filter(t => t.status === 'SUCCESS').length,
  errorTraces: sampleTraces.filter(t => t.status === 'ERROR').length,
  timeoutTraces: sampleTraces.filter(t => t.status === 'TIMEOUT').length,
  avgDurationMs: sampleTraces.reduce((sum, t) => sum + t.totalDurationMs, 0) / sampleTraces.length,
  minDurationMs: Math.min(...sampleTraces.map(t => t.totalDurationMs)),
  maxDurationMs: Math.max(...sampleTraces.map(t => t.totalDurationMs)),
  totalSpans: sampleTraces.reduce((sum, t) => sum + t.spanCount, 0),
  avgSpansPerTrace: sampleTraces.reduce((sum, t) => sum + t.spanCount, 0) / sampleTraces.length
}
