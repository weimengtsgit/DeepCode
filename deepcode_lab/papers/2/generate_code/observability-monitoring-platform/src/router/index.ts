import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'

// Lazy-load views for code splitting
const Dashboard = () => import('@/views/Dashboard.vue')
const Metrics = () => import('@/views/Metrics.vue')
const Tracing = () => import('@/views/Tracing.vue')
const Logs = () => import('@/views/Logs.vue')
const Custom = () => import('@/views/Custom.vue')

/**
 * Route definitions for the observability monitoring platform
 * Supports query parameters for cross-module navigation and state preservation
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
      icon: 'dashboard',
      breadcrumb: 'Dashboard'
    }
  },
  {
    path: '/metrics',
    name: 'metrics',
    component: Metrics,
    meta: {
      title: 'Metrics',
      icon: 'metrics',
      breadcrumb: 'Metrics'
    },
    beforeEnter: (to, from, next) => {
      // Pre-apply service filter if provided in query
      if (to.query.service) {
        const filterStore = useFilterStore()
        filterStore.setFilter('service', [to.query.service as string])
      }
      next()
    }
  },
  {
    path: '/tracing',
    name: 'tracing',
    component: Tracing,
    meta: {
      title: 'Tracing',
      icon: 'tracing',
      breadcrumb: 'Tracing'
    },
    beforeEnter: (to, from, next) => {
      // Pre-apply filters for trace queries
      const filterStore = useFilterStore()
      const timeStore = useTimeStore()

      // Apply service filter if provided
      if (to.query.service) {
        filterStore.setFilter('service', [to.query.service as string])
      }

      // Apply time range if provided (for anomaly drill-down)
      if (to.query.startTime && to.query.endTime) {
        const startTime = new Date(to.query.startTime as string)
        const endTime = new Date(to.query.endTime as string)
        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
          timeStore.setTimeRange(startTime, endTime)
        }
      }

      // Jump to specific trace if traceId provided
      if (to.query.traceId) {
        // Store will be accessed by component to fetch specific trace
        sessionStorage.setItem('selectedTraceId', to.query.traceId as string)
      }

      next()
    }
  },
  {
    path: '/logs',
    name: 'logs',
    component: Logs,
    meta: {
      title: 'Logs',
      icon: 'logs',
      breadcrumb: 'Logs'
    },
    beforeEnter: (to, from, next) => {
      // Pre-apply log filters
      const filterStore = useFilterStore()

      // Apply service filter if provided
      if (to.query.service) {
        filterStore.setFilter('service', [to.query.service as string])
      }

      // Pre-fill search with traceId if provided (from trace detail)
      if (to.query.traceId) {
        sessionStorage.setItem('logSearchQuery', `traceId:${to.query.traceId}`)
      }

      next()
    }
  },
  {
    path: '/custom',
    name: 'custom',
    component: Custom,
    meta: {
      title: 'Custom Dashboard',
      icon: 'custom',
      breadcrumb: 'Custom Dashboard'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

/**
 * Create router instance with history mode
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * Global navigation guard for breadcrumb management and state synchronization
 */
router.beforeEach((to, from, next) => {
  // Update page title
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - Observability Monitoring Platform`
  }

  // Store navigation history for breadcrumbs
  const navigationHistory = sessionStorage.getItem('navigationHistory')
  const history = navigationHistory ? JSON.parse(navigationHistory) : []

  // Add current route to history (avoid duplicates)
  if (history.length === 0 || history[history.length - 1].name !== from.name) {
    history.push({
      name: from.name,
      path: from.path,
      title: from.meta?.title || 'Unknown'
    })
  }

  // Keep history to last 10 items
  if (history.length > 10) {
    history.shift()
  }

  sessionStorage.setItem('navigationHistory', JSON.stringify(history))

  next()
})

/**
 * After navigation hook for analytics and state cleanup
 */
router.afterEach((to) => {
  // Scroll to top on route change
  window.scrollTo(0, 0)

  // Log navigation for debugging
  if (import.meta.env.DEV) {
    console.log(`Navigated to: ${to.path}`)
  }
})

export default router

/**
 * Navigation helper functions for cross-module linking
 */

/**
 * Navigate to Tracing page with metric anomaly context
 * Used when clicking on anomalous data point in metric chart
 */
export function navigateToTrace(
  service: string,
  timeRange: { start: Date; end: Date }
) {
  router.push({
    name: 'tracing',
    query: {
      service,
      startTime: timeRange.start.toISOString(),
      endTime: timeRange.end.toISOString()
    }
  })
}

/**
 * Navigate to Logs page with trace context
 * Used when clicking on span in trace detail
 */
export function navigateToLogs(traceId: string, service: string) {
  router.push({
    name: 'logs',
    query: {
      traceId,
      service
    }
  })
}

/**
 * Navigate to Metrics page with service context
 * Used when clicking on service card in dashboard
 */
export function navigateToMetrics(service: string) {
  router.push({
    name: 'metrics',
    query: {
      service
    }
  })
}

/**
 * Navigate to Tracing page with specific trace ID
 * Used when clicking on traceId link in log entry
 */
export function navigateToTraceDetail(traceId: string) {
  router.push({
    name: 'tracing',
    query: {
      traceId
    }
  })
}

/**
 * Navigate back to Dashboard
 * Used by breadcrumb navigation
 */
export function navigateToDashboard() {
  router.push({
    name: 'dashboard'
  })
}

/**
 * Get current navigation history for breadcrumb display
 */
export function getNavigationHistory() {
  const navigationHistory = sessionStorage.getItem('navigationHistory')
  return navigationHistory ? JSON.parse(navigationHistory) : []
}

/**
 * Clear navigation history (on logout or reset)
 */
export function clearNavigationHistory() {
  sessionStorage.removeItem('navigationHistory')
  sessionStorage.removeItem('selectedTraceId')
  sessionStorage.removeItem('logSearchQuery')
}
