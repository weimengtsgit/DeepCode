<template>
  <div class="instance-filter">
    <div class="filter-header">
      <label class="filter-label">Instance</label>
      <span v-if="selectedInstances.length > 0" class="filter-badge">
        {{ selectedInstances.length }}
      </span>
    </div>

    <div class="filter-content">
      <!-- Search/Autocomplete Input -->
      <div class="autocomplete-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          class="autocomplete-input"
          placeholder="Search instances..."
          @focus="showDropdown = true"
          @blur="handleBlur"
          @keydown.escape="showDropdown = false"
          @keydown.enter="addInstanceFromInput"
        />
        <span class="search-icon">🔍</span>

        <!-- Dropdown Options -->
        <div v-if="showDropdown && filteredInstances.length > 0" class="dropdown-options">
          <div
            v-for="instance in filteredInstances"
            :key="instance"
            class="option-item"
            @click="toggleInstance(instance)"
          >
            <input
              type="checkbox"
              :checked="isInstanceSelected(instance)"
              class="option-checkbox"
              @change="toggleInstance(instance)"
            />
            <span class="option-label">{{ instance }}</span>
          </div>
        </div>

        <!-- No Results Message -->
        <div v-if="showDropdown && filteredInstances.length === 0 && searchQuery" class="no-results">
          No instances found matching "{{ searchQuery }}"
        </div>
      </div>

      <!-- Selected Instances Tags -->
      <div v-if="selectedInstances.length > 0" class="selected-tags">
        <div
          v-for="instance in selectedInstances"
          :key="instance"
          class="tag"
        >
          <span class="tag-label">{{ instance }}</span>
          <button
            class="tag-remove"
            @click="toggleInstance(instance)"
            aria-label="Remove instance"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="filter-actions">
        <button
          v-if="selectedInstances.length > 0"
          class="action-button secondary"
          @click="clearSelection"
        >
          Clear
        </button>
        <button
          v-if="availableInstances.length > 0 && selectedInstances.length < availableInstances.length"
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
import { useLogsStore } from '@/stores/logsStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useTracesStore } from '@/stores/tracesStore'

// Stores
const filterStore = useFilterStore()
const logsStore = useLogsStore()
const metricsStore = useMetricsStore()
const tracesStore = useTracesStore()

// Local state
const searchQuery = ref('')
const showDropdown = ref(false)

// Computed properties
const selectedInstances = computed(() => {
  return filterStore.activeFilters.instance || []
})

const availableInstances = computed(() => {
  // Extract unique instance IDs from logs
  const instances = new Set<string>()

  // From logs context
  logsStore.logs.forEach(log => {
    if (log.context?.instanceId) {
      instances.add(log.context.instanceId)
    }
  })

  // From traces (service instances)
  tracesStore.traces.forEach(trace => {
    trace.spans.forEach(span => {
      if (span.tags?.instanceId) {
        instances.add(span.tags.instanceId)
      }
    })
  })

  // From metrics (service instances)
  Object.values(metricsStore.metrics).forEach(timeSeries => {
    // Extract instance from metric metadata if available
    if (timeSeries.serviceId) {
      instances.add(`${timeSeries.serviceId}-instance-1`)
      instances.add(`${timeSeries.serviceId}-instance-2`)
    }
  })

  return Array.from(instances).sort()
})

const filteredInstances = computed(() => {
  if (!searchQuery.value) {
    return availableInstances.value
  }

  const query = searchQuery.value.toLowerCase()
  return availableInstances.value.filter(instance =>
    instance.toLowerCase().includes(query)
  )
})

// Methods
const toggleInstance = (instanceId: string) => {
  const current = [...selectedInstances.value]
  const index = current.indexOf(instanceId)

  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(instanceId)
  }

  filterStore.setFilter('instance', current)
}

const isInstanceSelected = (instanceId: string): boolean => {
  return selectedInstances.value.includes(instanceId)
}

const selectAll = () => {
  filterStore.setFilter('instance', [...availableInstances.value])
}

const clearSelection = () => {
  filterStore.clearFilter('instance')
  searchQuery.value = ''
}

const addInstanceFromInput = () => {
  if (searchQuery.value.trim() && !isInstanceSelected(searchQuery.value.trim())) {
    toggleInstance(searchQuery.value.trim())
    searchQuery.value = ''
  }
}

const handleBlur = () => {
  // Delay to allow click on dropdown items
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.instance-filter {
  padding: 12px;
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: $color-text-primary;
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

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 13px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $color-primary;
    background-color: $color-bg-secondary;
  }

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: $color-text-tertiary;
  pointer-events: none;
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-border;
    border-radius: 3px;

    &:hover {
      background: $color-border-light;
    }
  }
}

.option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
  }
}

.option-checkbox {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: $color-primary;
}

.option-label {
  font-size: 13px;
  color: $color-text-primary;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: $color-text-tertiary;
  font-size: 13px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: $color-primary;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag-label {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: transparent;
  color: $color-text-primary;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    border-color: $color-border-light;
  }

  &:active {
    background-color: $color-bg-secondary;
  }

  &.secondary {
    background-color: $color-bg-tertiary;
  }
}
</style>
