<template>
  <div class="region-filter">
    <div class="filter-header">
      <span class="filter-label">Region</span>
      <span v-if="selectedRegionCount > 0" class="filter-badge">{{ selectedRegionCount }}</span>
    </div>

    <div class="filter-content">
      <!-- Region Selection -->
      <div class="region-list">
        <div
          v-for="region in availableRegions"
          :key="region.id"
          class="region-item"
        >
          <div class="region-header">
            <input
              type="checkbox"
              :id="`region-${region.id}`"
              :checked="isRegionSelected(region.id)"
              @change="toggleRegion(region.id)"
              class="region-checkbox"
            />
            <label :for="`region-${region.id}`" class="region-label">
              {{ region.name }}
              <span class="region-count">({{ getRegionCount(region.id) }})</span>
            </label>
            <button
              v-if="region.zones && region.zones.length > 0"
              @click="toggleRegionExpanded(region.id)"
              class="expand-button"
              :class="{ expanded: expandedRegions.includes(region.id) }"
              aria-label="Toggle zones"
            >
              <span class="expand-icon">▶</span>
            </button>
          </div>

          <!-- Zone Selection (nested) -->
          <div
            v-if="expandedRegions.includes(region.id) && region.zones"
            class="zone-list"
          >
            <div
              v-for="zone in region.zones"
              :key="`${region.id}-${zone.id}`"
              class="zone-item"
            >
              <input
                type="checkbox"
                :id="`zone-${region.id}-${zone.id}`"
                :checked="isZoneSelected(region.id, zone.id)"
                @change="toggleZone(region.id, zone.id)"
                class="zone-checkbox"
              />
              <label :for="`zone-${region.id}-${zone.id}`" class="zone-label">
                {{ zone.name }}
                <span class="zone-count">({{ getZoneCount(region.id, zone.id) }})</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="filter-actions">
        <button
          @click="selectAll"
          class="action-button secondary"
          :disabled="selectedRegionCount === totalRegionCount"
        >
          Select All
        </button>
        <button
          @click="clearSelection"
          class="action-button secondary"
          :disabled="selectedRegionCount === 0"
        >
          Clear
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

interface Zone {
  id: string
  name: string
}

interface Region {
  id: string
  name: string
  zones?: Zone[]
}

// Stores
const filterStore = useFilterStore()
const metricsStore = useMetricsStore()
const tracesStore = useTracesStore()
const logsStore = useLogsStore()

// Local state
const expandedRegions = ref<string[]>([])

// Predefined regions and zones
const REGION_ZONES: Region[] = [
  {
    id: 'us-east',
    name: 'US East',
    zones: [
      { id: 'us-east-1a', name: 'us-east-1a' },
      { id: 'us-east-1b', name: 'us-east-1b' },
      { id: 'us-east-1c', name: 'us-east-1c' },
    ],
  },
  {
    id: 'us-west',
    name: 'US West',
    zones: [
      { id: 'us-west-1a', name: 'us-west-1a' },
      { id: 'us-west-1b', name: 'us-west-1b' },
    ],
  },
  {
    id: 'eu-west',
    name: 'EU West',
    zones: [
      { id: 'eu-west-1a', name: 'eu-west-1a' },
      { id: 'eu-west-1b', name: 'eu-west-1b' },
      { id: 'eu-west-1c', name: 'eu-west-1c' },
    ],
  },
  {
    id: 'ap-southeast',
    name: 'AP Southeast',
    zones: [
      { id: 'ap-southeast-1a', name: 'ap-southeast-1a' },
      { id: 'ap-southeast-1b', name: 'ap-southeast-1b' },
    ],
  },
]

// Computed properties
const selectedRegions = computed(() => {
  return filterStore.activeFilters.region || []
})

const selectedZones = computed(() => {
  // Extract zone IDs from selected regions
  const zones: string[] = []
  REGION_ZONES.forEach((region) => {
    if (selectedRegions.value.includes(region.id)) {
      region.zones?.forEach((zone) => {
        zones.push(zone.id)
      })
    }
  })
  return zones
})

const selectedRegionCount = computed(() => {
  return selectedRegions.value.length
})

const totalRegionCount = computed(() => {
  return REGION_ZONES.length
})

const availableRegions = computed(() => {
  // Filter regions that have data in current stores
  return REGION_ZONES.filter((region) => {
    // For demo purposes, all regions are available
    // In production, would check if region has data in stores
    return true
  })
})

// Methods
const toggleRegion = (regionId: string) => {
  const newSelection = selectedRegions.value.includes(regionId)
    ? selectedRegions.value.filter((r) => r !== regionId)
    : [...selectedRegions.value, regionId]

  filterStore.setFilter('region', newSelection)
}

const toggleZone = (regionId: string, zoneId: string) => {
  // When toggling a zone, update the region selection
  const region = REGION_ZONES.find((r) => r.id === regionId)
  if (!region || !region.zones) return

  const allZonesSelected = region.zones.every((z) =>
    selectedZones.value.includes(z.id)
  )

  if (allZonesSelected) {
    // If all zones in region are selected, deselect region
    toggleRegion(regionId)
  } else {
    // Otherwise, select region
    if (!selectedRegions.value.includes(regionId)) {
      toggleRegion(regionId)
    }
  }
}

const toggleRegionExpanded = (regionId: string) => {
  if (expandedRegions.value.includes(regionId)) {
    expandedRegions.value = expandedRegions.value.filter((r) => r !== regionId)
  } else {
    expandedRegions.value = [...expandedRegions.value, regionId]
  }
}

const isRegionSelected = (regionId: string): boolean => {
  return selectedRegions.value.includes(regionId)
}

const isZoneSelected = (regionId: string, zoneId: string): boolean => {
  return selectedZones.value.includes(zoneId)
}

const getRegionCount = (regionId: string): number => {
  // Count items in region (for demo, return fixed count)
  const region = REGION_ZONES.find((r) => r.id === regionId)
  return region?.zones?.length || 0
}

const getZoneCount = (regionId: string, zoneId: string): number => {
  // Count items in zone (for demo, return fixed count)
  return Math.floor(Math.random() * 100) + 10
}

const selectAll = () => {
  const allRegionIds = REGION_ZONES.map((r) => r.id)
  filterStore.setFilter('region', allRegionIds)
}

const clearSelection = () => {
  filterStore.clearFilter('region')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.region-filter {
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
  padding: 0 12px 8px;
  font-weight: 500;
  color: $color-text-primary;
  font-size: 13px;
}

.filter-label {
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
  font-size: 11px;
  font-weight: 600;
}

.filter-content {
  padding: 0 12px;
}

.region-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 12px;

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

.region-item {
  margin-bottom: 8px;
}

.region-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;

  &:hover {
    background-color: rgba($color-primary, 0.05);
    border-radius: 4px;
    padding: 6px 4px;
  }
}

.region-checkbox,
.zone-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: $color-primary;
  flex-shrink: 0;
}

.region-label,
.zone-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: $color-text-primary;
  flex: 1;
  user-select: none;

  &:hover {
    color: $color-primary;
  }
}

.region-count,
.zone-count {
  color: $color-text-secondary;
  font-size: 12px;
  font-weight: 400;
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: $color-text-secondary;
  transition: transform 0.2s ease, color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: $color-primary;
  }

  &.expanded {
    transform: rotate(90deg);
  }
}

.expand-icon {
  display: inline-block;
  font-size: 10px;
  line-height: 1;
}

.zone-list {
  margin-left: 24px;
  padding-left: 12px;
  border-left: 2px solid $color-border;
  margin-bottom: 8px;
}

.zone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  margin-bottom: 4px;

  &:hover {
    background-color: rgba($color-primary, 0.05);
    border-radius: 4px;
    padding: 4px 4px;
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
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid $color-border;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: transparent;
  color: $color-text-primary;

  &.secondary {
    background-color: $color-bg-tertiary;
    border-color: $color-border;

    &:hover:not(:disabled) {
      background-color: $color-bg-secondary;
      border-color: $color-primary;
      color: $color-primary;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}
</style>
