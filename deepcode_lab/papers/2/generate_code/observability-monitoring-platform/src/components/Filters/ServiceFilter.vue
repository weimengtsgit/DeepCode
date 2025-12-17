<template>
  <div class="service-filter">
    <div class="filter-header">
      <label class="filter-label">Service</label>
      <span v-if="selectedServices.length > 0" class="filter-badge">
        {{ selectedServices.length }}
      </span>
    </div>

    <div class="filter-content">
      <!-- Search Input -->
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search services..."
          class="search-input"
          @input="filterOptions"
        />
        <span v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</span>
      </div>

      <!-- Service Options List -->
      <div class="options-list">
        <div v-if="filteredOptions.length === 0" class="no-results">
          No services found
        </div>

        <div v-for="service in filteredOptions" :key="service.id" class="option-item">
          <input
            :id="`service-${service.id}`"
            type="checkbox"
            :checked="isServiceSelected(service.id)"
            @change="toggleService(service.id)"
            class="option-checkbox"
          />
          <label :for="`service-${service.id}`" class="option-label">
            <span class="service-name">{{ service.displayName || service.name }}</span>
            <span class="service-status" :class="`status-${service.status}`">
              {{ service.status }}
            </span>
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="availableServices.length > 0" class="filter-actions">
        <button
          v-if="selectedServices.length > 0"
          class="action-button secondary"
          @click="clearSelection"
        >
          Clear
        </button>
        <button
          v-if="selectedServices.length < availableServices.length"
          class="action-button secondary"
          @click="selectAll"
        >
          Select All
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useLogsStore } from '@/stores/logsStore'
import type { ServiceDefinition } from '@/types'

// Stores
const filterStore = useFilterStore()
const metricsStore = useMetricsStore()
const tracesStore = useTracesStore()
const logsStore = useLogsStore()

// Local state
const searchQuery = ref('')

// Computed properties
const selectedServices = computed(() => filterStore.activeFilters.service || [])

const availableServices = computed(() => {
  // Extract unique services from all data stores
  const services = new Set<string>()

  // From metrics
  metricsStore.metrics.forEach((metric) => {
    if (metric.serviceId) services.add(metric.serviceId)
  })

  // From traces
  tracesStore.traces.forEach((trace) => {
    if (trace.rootService) services.add(trace.rootService)
    trace.spans.forEach((span) => {
      if (span.service) services.add(span.service)
    })
  })

  // From logs
  logsStore.logs.forEach((log) => {
    if (log.service) services.add(log.service)
  })

  // Return as array of service objects with metadata
  return Array.from(services)
    .map((serviceId) => ({
      id: serviceId,
      name: serviceId,
      displayName: serviceId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      status: getServiceStatus(serviceId),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return availableServices.value

  const query = searchQuery.value.toLowerCase()
  return availableServices.value.filter(
    (service) =>
      service.name.toLowerCase().includes(query) ||
      service.displayName.toLowerCase().includes(query)
  )
})

// Methods
function getServiceStatus(serviceId: string): 'healthy' | 'warning' | 'critical' {
  // Determine service status based on recent data
  // This is a simplified implementation - in production, would check actual metrics
  const recentLogs = logsStore.logs.filter(
    (log) => log.service === serviceId && new Date(log.timestamp).getTime() > Date.now() - 5 * 60 * 1000
  )

  if (recentLogs.length === 0) return 'healthy'

  const errorCount = recentLogs.filter((log) => log.level === 'ERROR' || log.level === 'FATAL').length
  const errorRate = errorCount / recentLogs.length

  if (errorRate > 0.1) return 'critical'
  if (errorRate > 0.05) return 'warning'
  return 'healthy'
}

function isServiceSelected(serviceId: string): boolean {
  return selectedServices.value.includes(serviceId)
}

function toggleService(serviceId: string): void {
  const newSelection = isServiceSelected(serviceId)
    ? selectedServices.value.filter((id) => id !== serviceId)
    : [...selectedServices.value, serviceId]

  filterStore.setFilter('service', newSelection)
}

function selectAll(): void {
  const allServiceIds = availableServices.value.map((s) => s.id)
  filterStore.setFilter('service', allServiceIds)
}

function clearSelection(): void {
  filterStore.clearFilter('service')
}

function filterOptions(): void {
  // Filtering is handled by computed property, no additional logic needed
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.service-filter {
  padding: 12px;
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: $color-text-primary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-badge {
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

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  padding-right: 28px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 13px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 2px rgba($color-primary, 0.1);
  }

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.clear-search {
  position: absolute;
  right: 10px;
  cursor: pointer;
  color: $color-text-secondary;
  font-size: 16px;
  transition: color 0.2s ease;

  &:hover {
    color: $color-text-primary;
  }
}

.options-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: $color-bg-secondary;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $color-border;
    border-radius: 3px;

    &:hover {
      background-color: $color-border-light;
    }
  }
}

.no-results {
  padding: 16px 12px;
  text-align: center;
  color: $color-text-secondary;
  font-size: 13px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid $color-border;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: $color-bg-tertiary;
  }
}

.option-checkbox {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  cursor: pointer;
  accent-color: $color-primary;
}

.option-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  cursor: pointer;
  user-select: none;
}

.service-name {
  font-size: 13px;
  color: $color-text-primary;
  font-weight: 500;
}

.service-status {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;

  &.status-healthy {
    background-color: rgba(115, 191, 105, 0.2);
    color: #73bf69;
  }

  &.status-warning {
    background-color: rgba(255, 152, 48, 0.2);
    color: #ff9830;
  }

  &.status-critical {
    background-color: rgba(242, 73, 92, 0.2);
    color: #f2495c;
  }
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid $color-border;
}

.action-button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: transparent;
  color: $color-text-primary;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    border-color: $color-primary;
    color: $color-primary;
  }

  &:active {
    transform: scale(0.98);
  }

  &.secondary {
    background-color: $color-bg-tertiary;
    border-color: $color-border;
  }
}
</style>
