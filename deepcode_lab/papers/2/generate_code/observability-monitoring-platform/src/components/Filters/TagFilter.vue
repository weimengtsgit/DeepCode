<template>
  <div class="tag-filter">
    <div class="filter-header">
      <label class="filter-label">Tags</label>
      <span v-if="selectedTagCount > 0" class="tag-count-badge">{{ selectedTagCount }}</span>
    </div>

    <div class="filter-content">
      <!-- Tag Key Selector -->
      <div class="tag-key-section">
        <input
          v-model="tagKeyInput"
          type="text"
          placeholder="Select or type tag key..."
          class="tag-input"
          @focus="showKeyDropdown = true"
          @blur="handleKeyInputBlur"
          @keydown.enter="addNewTagKey"
        />
        
        <div v-if="showKeyDropdown" class="dropdown-menu">
          <div
            v-for="key in filteredTagKeys"
            :key="key"
            class="dropdown-item"
            @click="selectTagKey(key)"
          >
            {{ key }}
          </div>
          
          <div v-if="filteredTagKeys.length === 0 && tagKeyInput" class="dropdown-item add-new">
            <span class="add-icon">+</span> Add new key: "{{ tagKeyInput }}"
          </div>
          
          <div v-if="filteredTagKeys.length === 0 && !tagKeyInput" class="dropdown-empty">
            No tag keys available
          </div>
        </div>
      </div>

      <!-- Tag Value Selector -->
      <div v-if="selectedTagKey" class="tag-value-section">
        <input
          v-model="tagValueInput"
          type="text"
          placeholder="Select or type tag value..."
          class="tag-input"
          @focus="showValueDropdown = true"
          @blur="handleValueInputBlur"
          @keydown.enter="addTagValue"
        />
        
        <div v-if="showValueDropdown" class="dropdown-menu">
          <div
            v-for="value in filteredTagValues"
            :key="value"
            class="dropdown-item"
            @click="selectTagValue(value)"
          >
            {{ value }}
          </div>
          
          <div v-if="filteredTagValues.length === 0 && tagValueInput" class="dropdown-item add-new">
            <span class="add-icon">+</span> Add value: "{{ tagValueInput }}"
          </div>
          
          <div v-if="filteredTagValues.length === 0 && !tagValueInput" class="dropdown-empty">
            No values for this key
          </div>
        </div>

        <button class="add-button" @click="addTagValue">Add</button>
      </div>

      <!-- Selected Tags Display -->
      <div v-if="selectedTags.length > 0" class="selected-tags">
        <div
          v-for="(tag, index) in selectedTags"
          :key="`${tag.key}-${tag.value}-${index}`"
          class="tag-chip"
        >
          <span class="tag-text">{{ tag.key }}: {{ tag.value }}</span>
          <button
            class="tag-remove"
            @click="removeTag(tag.key, tag.value)"
            aria-label="Remove tag"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="filter-actions">
        <button
          v-if="selectedTags.length > 0"
          class="action-button secondary"
          @click="clearSelection"
        >
          Clear All
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

interface SelectedTag {
  key: string
  value: string
}

// Stores
const filterStore = useFilterStore()
const logsStore = useLogsStore()
const metricsStore = useMetricsStore()
const tracesStore = useTracesStore()

// Local state
const tagKeyInput = ref('')
const tagValueInput = ref('')
const selectedTagKey = ref('')
const showKeyDropdown = ref(false)
const showValueDropdown = ref(false)

// Computed properties
const selectedTags = computed(() => {
  const tags: SelectedTag[] = []
  const activeTags = filterStore.activeFilters.tags || {}
  
  for (const [key, values] of Object.entries(activeTags)) {
    for (const value of values) {
      tags.push({ key, value })
    }
  }
  
  return tags
})

const selectedTagCount = computed(() => selectedTags.value.length)

// Extract all available tag keys from logs and metrics
const availableTagKeys = computed(() => {
  const keys = new Set<string>()
  
  // From logs context
  logsStore.logs.forEach(log => {
    if (log.context && typeof log.context === 'object') {
      Object.keys(log.context).forEach(key => keys.add(key))
    }
  })
  
  // From metrics tags (if available)
  Object.values(metricsStore.metrics).forEach(series => {
    // Metrics may have tags in future versions
  })
  
  // From trace span tags
  tracesStore.traces.forEach(trace => {
    trace.spans.forEach(span => {
      if (span.tags && typeof span.tags === 'object') {
        Object.keys(span.tags).forEach(key => keys.add(key))
      }
    })
  })
  
  return Array.from(keys).sort()
})

const filteredTagKeys = computed(() => {
  if (!tagKeyInput.value) return availableTagKeys.value
  
  const query = tagKeyInput.value.toLowerCase()
  return availableTagKeys.value.filter(key =>
    key.toLowerCase().includes(query)
  )
})

// Extract values for selected tag key
const availableTagValues = computed(() => {
  if (!selectedTagKey.value) return []
  
  const values = new Set<string>()
  const key = selectedTagKey.value
  
  // From logs context
  logsStore.logs.forEach(log => {
    if (log.context && log.context[key]) {
      const value = String(log.context[key])
      values.add(value)
    }
  })
  
  // From trace span tags
  tracesStore.traces.forEach(trace => {
    trace.spans.forEach(span => {
      if (span.tags && span.tags[key]) {
        const value = String(span.tags[key])
        values.add(value)
      }
    })
  })
  
  return Array.from(values).sort()
})

const filteredTagValues = computed(() => {
  if (!tagValueInput.value) return availableTagValues.value
  
  const query = tagValueInput.value.toLowerCase()
  return availableTagValues.value.filter(value =>
    value.toLowerCase().includes(query)
  )
})

// Methods
const selectTagKey = (key: string) => {
  selectedTagKey.value = key
  tagKeyInput.value = key
  tagValueInput.value = ''
  showKeyDropdown.value = false
}

const selectTagValue = (value: string) => {
  tagValueInput.value = value
  showValueDropdown.value = false
}

const addNewTagKey = () => {
  if (tagKeyInput.value.trim()) {
    selectTagKey(tagKeyInput.value.trim())
  }
}

const addTagValue = () => {
  if (!selectedTagKey.value || !tagValueInput.value.trim()) return
  
  const key = selectedTagKey.value
  const value = tagValueInput.value.trim()
  
  // Check if tag already exists
  const exists = selectedTags.value.some(
    tag => tag.key === key && tag.value === value
  )
  
  if (exists) {
    tagValueInput.value = ''
    return
  }
  
  // Add to filter store
  const currentTags = filterStore.activeFilters.tags || {}
  const keyValues = currentTags[key] || []
  
  if (!keyValues.includes(value)) {
    keyValues.push(value)
  }
  
  filterStore.setFilter('tags', {
    ...currentTags,
    [key]: keyValues
  })
  
  // Reset inputs
  tagValueInput.value = ''
  selectedTagKey.value = ''
  tagKeyInput.value = ''
}

const removeTag = (key: string, value: string) => {
  const currentTags = filterStore.activeFilters.tags || {}
  const keyValues = currentTags[key] || []
  
  const newValues = keyValues.filter(v => v !== value)
  
  if (newValues.length === 0) {
    const newTags = { ...currentTags }
    delete newTags[key]
    filterStore.setFilter('tags', newTags)
  } else {
    filterStore.setFilter('tags', {
      ...currentTags,
      [key]: newValues
    })
  }
}

const clearSelection = () => {
  filterStore.clearFilter('tags')
  selectedTagKey.value = ''
  tagKeyInput.value = ''
  tagValueInput.value = ''
}

const handleKeyInputBlur = () => {
  setTimeout(() => {
    showKeyDropdown.value = false
  }, 200)
}

const handleValueInputBlur = () => {
  setTimeout(() => {
    showValueDropdown.value = false
  }, 200)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.tag-filter {
  padding: 12px 16px;
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

.tag-count-badge {
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

.tag-key-section,
.tag-value-section {
  position: relative;
}

.tag-value-section {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.tag-input {
  flex: 1;
  padding: 8px 12px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  color: $color-text-primary;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-border-light;
  }

  &:focus {
    border-color: $color-primary;
    background-color: $color-bg-secondary;
  }

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 4px;
  max-height: 200px;
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

.dropdown-item {
  padding: 8px 12px;
  color: $color-text-primary;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: $color-bg-tertiary;
  }

  &.add-new {
    color: $color-primary;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;

    .add-icon {
      font-size: 16px;
      font-weight: bold;
    }
  }
}

.dropdown-empty {
  padding: 12px;
  text-align: center;
  color: $color-text-tertiary;
  font-size: 12px;
}

.add-button {
  padding: 8px 16px;
  background-color: $color-primary;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: darken($color-primary, 10%);
  }

  &:active {
    transform: scale(0.98);
  }
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 16px;
  font-size: 12px;
  color: $color-text-primary;
}

.tag-text {
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
  color: $color-text-secondary;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s ease;
  line-height: 1;

  &:hover {
    color: $color-error;
  }
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid $color-border-light;
}

.action-button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: transparent;
  color: $color-text-primary;

  &:hover {
    background-color: $color-bg-tertiary;
    border-color: $color-border-light;
  }

  &.secondary {
    color: $color-text-secondary;
  }
}
</style>
