<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb navigation">
    <ol class="breadcrumbs-list">
      <li v-for="(crumb, index) in breadcrumbs" :key="index" class="breadcrumb-item">
        <router-link
          v-if="crumb.path && index < breadcrumbs.length - 1"
          :to="crumb.path"
          class="breadcrumb-link"
          :title="crumb.label"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else class="breadcrumb-text" :title="crumb.label">
          {{ crumb.label }}
        </span>

        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator" aria-hidden="true">
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/uiStore'

interface Breadcrumb {
  label: string
  path?: string
}

const route = useRoute()
const uiStore = useUIStore()

// Computed breadcrumbs from route and UI store
const breadcrumbs = computed<Breadcrumb[]>(() => {
  // Start with home
  const crumbs: Breadcrumb[] = [
    {
      label: 'Dashboard',
      path: '/dashboard'
    }
  ]

  // Add breadcrumbs from UI store if available
  if (uiStore.breadcrumbs && uiStore.breadcrumbs.length > 0) {
    crumbs.push(...uiStore.breadcrumbs)
  } else {
    // Generate breadcrumbs from current route
    const routeName = route.name as string
    const routeParams = route.params
    const routeQuery = route.query

    switch (routeName) {
      case 'metrics':
        crumbs.push({
          label: 'Metrics',
          path: '/metrics'
        })
        if (routeQuery.service) {
          crumbs.push({
            label: `Service: ${routeQuery.service}`,
            path: `/metrics?service=${routeQuery.service}`
          })
        }
        break

      case 'tracing':
        crumbs.push({
          label: 'Tracing',
          path: '/tracing'
        })
        if (routeQuery.service) {
          crumbs.push({
            label: `Service: ${routeQuery.service}`,
            path: `/tracing?service=${routeQuery.service}`
          })
        }
        if (routeQuery.traceId) {
          crumbs.push({
            label: `Trace: ${String(routeQuery.traceId).substring(0, 8)}...`,
            path: `/tracing?traceId=${routeQuery.traceId}`
          })
        }
        break

      case 'logs':
        crumbs.push({
          label: 'Logs',
          path: '/logs'
        })
        if (routeQuery.service) {
          crumbs.push({
            label: `Service: ${routeQuery.service}`,
            path: `/logs?service=${routeQuery.service}`
          })
        }
        if (routeQuery.traceId) {
          crumbs.push({
            label: `Trace: ${String(routeQuery.traceId).substring(0, 8)}...`,
            path: `/logs?traceId=${routeQuery.traceId}`
          })
        }
        break

      case 'custom':
        crumbs.push({
          label: 'Custom Dashboard',
          path: '/custom'
        })
        break

      default:
        // For unknown routes, just show the route name
        if (routeName && routeName !== 'dashboard') {
          crumbs.push({
            label: String(routeName).charAt(0).toUpperCase() + String(routeName).slice(1)
          })
        }
    }
  }

  return crumbs
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.breadcrumbs {
  padding: $spacing-sm $spacing-md;
  background-color: $color-bg-secondary;
  border-bottom: 1px solid $color-border;
  font-size: $font-size-sm;
  line-height: $line-height-normal;
}

.breadcrumbs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-xs;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  min-width: 0;

  &:last-child {
    .breadcrumb-separator {
      display: none;
    }
  }
}

.breadcrumb-link {
  color: $color-primary;
  text-decoration: none;
  transition: color $transition-normal ease-out;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  &:hover {
    color: $color-primary-hover;
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
    border-radius: $border-radius-sm;
  }

  &:active {
    color: $color-primary-active;
  }
}

.breadcrumb-text {
  color: $color-text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.breadcrumb-separator {
  color: $color-text-tertiary;
  flex-shrink: 0;
}

// Responsive adjustments
@media (max-width: 768px) {
  .breadcrumbs {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
  }

  .breadcrumb-link,
  .breadcrumb-text {
    max-width: 120px;
  }

  .breadcrumbs-list {
    gap: 4px;
  }
}

// Accessibility: Reduced motion
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-link {
    transition: none;
  }
}
</style>
