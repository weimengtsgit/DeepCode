<template>
  <div class="environment-filter">
    <div class="filter-header">
      <label class="filter-label">Environment</label>
      <span v-if="selectedEnvironments.length > 0" class="filter-badge">
        {{ selectedEnvironments.length }}
      </span>
    </div>

    <div class="filter-content">
      <div class="environment-options">
        <div
          v-for="env in availableEnvironments"
          :key="env.id"
          class="environment-item"
          :class="{ active: isEnvironmentSelected(env.id) }"
          @click="toggleEnvironment(env.id)"
        >
          <div class="environment-checkbox">
            <input
              type="checkbox"
              :id="`env-${env.id}`"
              :checked="isEnvironmentSelected(env.id)"
              @change="toggleEnvironment(env.id)"
              class="checkbox-input"
            />
            <label :for="`env-${env.id}`" class="checkbox-label"></label>
          </div>
          <div class="environment-info">
            <span class="environment-name">{{ env.label }}</span>
            <span class="environment-description">{{ env.description }}</span>
          </div>
          <span class="environment-count">
            {{ getEnvironmentCount(env.id) }}
          </span>
        </div>
      </div>

      <div class="filter-actions">
        <button
          v-if="selectedEnvironments.length > 0"
          class="action-button secondary"
          @click="clearSelection"
        >
          Clear
        </button>
        <button
          v-if="selectedEnvironments.length < availableEnvironments.length"
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
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTracesStore } from '@/stores/tracesStore'
import { useLogsStore } from '@/stores/logsStore'

interface EnvironmentOption {
  id: string
  label: string
  description: string
}

// Pinia stores
const filterStore = useFilterStore()
const metricsStore = useMetricsStore()
const tracesStore = useTracesStore()
const logsStore = useLogsStore()

// Predefined environment options
const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  {
    id: 'production',
    label: 'Production',
    description: 'Live production environment'
  },
  {
    id: 'staging',
    label: 'Staging',
    description: 'Pre-production staging environment'
  },
  {
    id: 'testing',
    label: 'Testing',
    description: 'QA and testing environment'
  },
  {
    id: 'development',
    label: 'Development',
    description: 'Local development environment'
  }
]

// Computed properties
const selectedEnvironments = computed(() => {
  return filterStore.activeFilters.environment || []
})

const availableEnvironments = computed(() => {
  // Filter to only show environments that have data
  const environmentsWithData = new Set<string>()

  // Extract environments from metrics
  metricsStore.metrics &&
    Object.values(metricsStore.metrics).forEach((timeSeries) => {
      if (timeSeries.serviceId) {
        // In a real app, would extract environment from service metadata
        // For now, assume all services exist in all environments
        ENVIRONMENT_OPTIONS.forEach((env) => {
          environmentsWithData.add(env.id)
        })
      }
    })

  // Extract environments from traces
  tracesStore.traces &&
    tracesStore.traces.forEach((trace) => {
      // Assume all services in traces exist in all environments
      ENVIRONMENT_OPTIONS.forEach((env) => {
        environmentsWithData.add(env.id)
      })
    })

  // Extract environments from logs
  logsStore.logs &&
    logsStore.logs.forEach((log) => {
      // Assume all services in logs exist in all environments
      ENVIRONMENT_OPTIONS.forEach((env) => {
        environmentsWithData.add(env.id)
      })
    })

  // If no data, show all environments
  if (environmentsWithData.size === 0) {
    return ENVIRONMENT_OPTIONS
  }

  return ENVIRONMENT_OPTIONS.filter((env) => environmentsWithData.has(env.id))
})

// Methods
const toggleEnvironment = (environmentId: string) => {
  const current = selectedEnvironments.value || []
  const newSelection = current.includes(environmentId)
    ? current.filter((id) => id !== environmentId)
    : [...current, environmentId]

  filterStore.setFilter('environment', newSelection)
}

const selectAll = () => {
  const allIds = availableEnvironments.value.map((env) => env.id)
  filterStore.setFilter('environment', allIds)
}

const clearSelection = () => {
  filterStore.clearFilter('environment')
}

const isEnvironmentSelected = (environmentId: string): boolean => {
  return selectedEnvironments.value.includes(environmentId)
}

const getEnvironmentCount = (environmentId: string): number => {
  // Count services/traces/logs in this environment
  let count = 0

  // Count from metrics
  metricsStore.metrics &&
    Object.values(metricsStore.metrics).forEach((timeSeries) => {
      if (timeSeries.serviceId) {
        count++
      }
    })

  // Count from traces
  tracesStore.traces && (count += tracesStore.traces.length)

  // Count from logs
  logsStore.logs && (count += logsStore.logs.length)

  return count
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.environment-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
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

.environment-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 0 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $color-border-light;
    border-radius: 3px;

    &:hover {
      background-color: $color-border;
    }
  }
}

.environment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: transparent;

  &:hover {
    background-color: $color-bg-tertiary;
  }

  &.active {
    background-color: rgba($color-primary, 0.1);
  }
}

.environment-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid $color-border;
  border-radius: 4px;
  background-color: $color-bg-secondary;
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: '';
    display: none;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}

.checkbox-input:checked + .checkbox-label {
  background-color: $color-primary;
  border-color: $color-primary;

  &::after {
    display: block;
  }
}

.environment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.environment-name {
  font-size: 13px;
  font-weight: 500;
  color: $color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.environment-description {
  font-size: 12px;
  color: $color-text-tertiary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.environment-count {
  font-size: 12px;
  color: $color-text-secondary;
  font-weight: 500;
  flex-shrink: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding: 0 12px;
  justify-content: flex-end;
}

.action-button {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.secondary {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
    border: 1px solid $color-border;

    &:hover {
      background-color: $color-border;
      color: $color-text-primary;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
