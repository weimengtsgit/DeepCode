<template>
  <div class="filter-bar" :class="{ collapsed: isCollapsed }">
    <!-- Filter Bar Header -->
    <div class="filter-bar-header">
      <div class="filter-bar-title">
        <span class="title-text">Filters</span>
        <span v-if="hasActiveFilters" class="filter-count-badge">{{ activeFilterCount }}</span>
      </div>
      
      <div class="filter-bar-actions">
        <button 
          class="btn-icon" 
          @click="toggleExpanded"
          :title="isExpanded ? 'Collapse filters' : 'Expand filters'"
        >
          <span class="icon">{{ isExpanded ? '▼' : '▶' }}</span>
        </button>
        
        <button 
          v-if="hasActiveFilters"
          class="btn-clear"
          @click="clearAllFilters"
          title="Clear all filters"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Filter Controls (Expandable) -->
    <transition name="filter-expand">
      <div v-if="isExpanded" class="filter-bar-content">
        <!-- Service Filter -->
        <div class="filter-section">
          <label class="filter-label">Service</label>
          <ServiceFilter
            :value="activeFilters.service || []"
            :options="availableServices"
            @change="setServiceFilter"
          />
        </div>

        <!-- Environment Filter -->
        <div class="filter-section">
          <label class="filter-label">Environment</label>
          <EnvironmentFilter
            :value="activeFilters.environment || []"
            :options="availableEnvironments"
            @change="setEnvironmentFilter"
          />
        </div>

        <!-- Region Filter -->
        <div class="filter-section">
          <label class="filter-label">Region</label>
          <RegionFilter
            :value="activeFilters.region || []"
            :options="availableRegions"
            @change="setRegionFilter"
          />
        </div>

        <!-- Instance Filter -->
        <div class="filter-section">
          <label class="filter-label">Instance</label>
          <InstanceFilter
            :value="activeFilters.instance || []"
            :options="availableInstances"
            @change="setInstanceFilter"
          />
        </div>

        <!-- Tag Filter -->
        <div class="filter-section">
          <label class="filter-label">Tags</label>
          <TagFilter
            :value="activeFilters.tags || {}"
            :options="availableTags"
            @change="setTagFilter"
          />
        </div>

        <!-- Filter Summary -->
        <div v-if="hasActiveFilters" class="filter-summary">
          <div class="summary-text">{{ filterSummary }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useLogsStore } from '@/stores/logsStore'
import ServiceFilter from './ServiceFilter.vue'
import EnvironmentFilter from './EnvironmentFilter.vue'
import RegionFilter from './RegionFilter.vue'
import InstanceFilter from './InstanceFilter.vue'
import TagFilter from './TagFilter.vue'
import type { FilterSet } from '@/types'

// Store access
const filterStore = useFilterStore()
const metricsStore = useMetricsStore()
const tracesStore = useTracesStore()
const logsStore = useLogsStore()

// Local state
const isExpanded = ref(true)
const isCollapsed = ref(false)

// Computed properties - Active filters
const activeFilters = computed(() => filterStore.activeFilters)

const hasActiveFilters = computed(() => {
  return (
    (activeFilters.value.service && activeFilters.value.service.length > 0) ||
    (activeFilters.value.environment && activeFilters.value.environment.length > 0) ||
    (activeFilters.value.region && activeFilters.value.region.length > 0) ||
    (activeFilters.value.instance && activeFilters.value.instance.length > 0) ||
    (activeFilters.value.tags && Object.keys(activeFilters.value.tags).length > 0)
  )
})

const activeFilterCount = computed(() => {
  let count = 0
  if (activeFilters.value.service) count += activeFilters.value.service.length
  if (activeFilters.value.environment) count += activeFilters.value.environment.length
  if (activeFilters.value.region) count += activeFilters.value.region.length
  if (activeFilters.value.instance) count += activeFilters.value.instance.length
  if (activeFilters.value.tags) count += Object.keys(activeFilters.value.tags).length
  return count
})

// Computed properties - Available options
const availableServices = computed(() => {
  const services = new Set<string>()
  
  // Collect from metrics
  metricsStore.metrics.forEach((metric) => {
    if (metric.serviceId) services.add(metric.serviceId)
  })
  
  // Collect from traces
  tracesStore.traces.forEach((trace) => {
    if (trace.rootService) services.add(trace.rootService)
    trace.spans.forEach((span) => {
      if (span.service) services.add(span.service)
    })
  })
  
  // Collect from logs
  logsStore.logs.forEach((log) => {
    if (log.service) services.add(log.service)
  })
  
  return Array.from(services).sort()
})

const availableEnvironments = computed(() => [
  'production',
  'staging',
  'testing',
  'development'
])

const availableRegions = computed(() => [
  { label: 'US East', value: 'us-east-1', zones: ['us-east-1a', 'us-east-1b', 'us-east-1c'] },
  { label: 'US West', value: 'us-west-2', zones: ['us-west-2a', 'us-west-2b', 'us-west-2c'] },
  { label: 'EU West', value: 'eu-west-1', zones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'] },
  { label: 'APAC', value: 'ap-southeast-1', zones: ['ap-southeast-1a', 'ap-southeast-1b'] }
])

const availableInstances = computed(() => {
  const instances = new Set<string>()
  
  // Collect from logs context
  logsStore.logs.forEach((log) => {
    if (log.context?.instanceId) instances.add(log.context.instanceId)
  })
  
  return Array.from(instances).sort()
})

const availableTags = computed(() => {
  const tags: Record<string, string[]> = {}
  
  // Collect from logs context
  logsStore.logs.forEach((log) => {
    if (log.context) {
      Object.entries(log.context).forEach(([key, value]) => {
        if (typeof value === 'string' && key !== 'instanceId') {
          if (!tags[key]) tags[key] = []
          if (!tags[key].includes(value)) tags[key].push(value)
        }
      })
    }
  })
  
  return tags
})

// Computed property - Filter summary
const filterSummary = computed(() => {
  const parts: string[] = []
  
  if (activeFilters.value.service && activeFilters.value.service.length > 0) {
    parts.push(`Service: ${activeFilters.value.service.join(', ')}`)
  }
  
  if (activeFilters.value.environment && activeFilters.value.environment.length > 0) {
    parts.push(`Environment: ${activeFilters.value.environment.join(', ')}`)
  }
  
  if (activeFilters.value.region && activeFilters.value.region.length > 0) {
    parts.push(`Region: ${activeFilters.value.region.join(', ')}`)
  }
  
  if (activeFilters.value.instance && activeFilters.value.instance.length > 0) {
    parts.push(`Instance: ${activeFilters.value.instance.join(', ')}`)
  }
  
  if (activeFilters.value.tags && Object.keys(activeFilters.value.tags).length > 0) {
    const tagParts = Object.entries(activeFilters.value.tags)
      .map(([key, values]) => `${key}: ${values.join(', ')}`)
    parts.push(...tagParts)
  }
  
  return parts.join(' • ')
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const setServiceFilter = (services: string[]) => {
  filterStore.setFilter('service', services)
}

const setEnvironmentFilter = (environments: string[]) => {
  filterStore.setFilter('environment', environments)
}

const setRegionFilter = (regions: string[]) => {
  filterStore.setFilter('region', regions)
}

const setInstanceFilter = (instances: string[]) => {
  filterStore.setFilter('instance', instances)
}

const setTagFilter = (tags: Record<string, string[]>) => {
  filterStore.setFilter('tags', tags)
}

const clearAllFilters = () => {
  filterStore.clearFilter('all')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.filter-bar {
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &.collapsed {
    .filter-bar-content {
      display: none;
    }
  }
}

.filter-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid $color-border-light;
}

.filter-bar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: $color-text-primary;
  font-size: 14px;
}

.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: $color-primary;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.filter-bar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  background: none;
  border: none;
  color: $color-text-secondary;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 12px;

  &:hover {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
  }

  &:active {
    transform: scale(0.95);
  }

  .icon {
    display: inline-block;
    transition: transform 0.3s ease;
  }
}

.btn-clear {
  background: none;
  border: 1px solid $color-border;
  color: $color-text-secondary;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
    border-color: $color-border;
  }

  &:active {
    transform: scale(0.98);
  }
}

.filter-bar-content {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  border-top: 1px solid $color-border-light;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-summary {
  grid-column: 1 / -1;
  padding-top: 8px;
  border-top: 1px solid $color-border-light;
  margin-top: 8px;
}

.summary-text {
  font-size: 12px;
  color: $color-text-secondary;
  line-height: 1.5;
  word-break: break-word;
}

// Transitions
.filter-expand-enter-active,
.filter-expand-leave-active {
  transition: all 0.3s ease;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.filter-expand-enter-to,
.filter-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

// Responsive design
@media (max-width: 1400px) {
  .filter-bar-content {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    padding: 12px;
  }

  .filter-bar-header {
    padding: 10px 12px;
  }
}

@media (max-width: 1024px) {
  .filter-bar-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-bar-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-bar-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
