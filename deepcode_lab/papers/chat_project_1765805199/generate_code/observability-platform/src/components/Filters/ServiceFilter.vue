<template>
  <div class="service-filter" :class="{ 'is-mobile': isMobile, 'is-compact': compact }">
    <!-- Filter Header -->
    <div v-if="showHeader" class="filter-header">
      <div class="filter-title">
        <el-icon><FolderOpened /></el-icon>
        <span>服务筛选</span>
        <el-badge
          v-if="selectedCount > 0"
          :value="selectedCount"
          :type="selectedCount > 0 ? 'primary' : 'info'"
          class="filter-badge"
        />
      </div>
      <div class="filter-actions">
        <el-button
          v-if="showSelectAll"
          link
          size="small"
          @click="handleSelectAll"
        >
          全选
        </el-button>
        <el-button
          v-if="selectedCount > 0"
          link
          size="small"
          type="danger"
          @click="handleClearAll"
        >
          清空
        </el-button>
      </div>
    </div>

    <!-- Search Box -->
    <div v-if="showSearch" class="filter-search">
      <el-input
        v-model="searchQuery"
        :size="size"
        placeholder="搜索服务名称..."
        clearable
        @clear="handleSearchClear"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Service List -->
    <div class="service-list" :style="{ maxHeight: maxHeight }">
      <el-scrollbar v-if="filteredServices.length > 0">
        <div class="service-items">
          <!-- Favorite Services Section -->
          <div v-if="showFavorites && favoriteServices.length > 0" class="service-section">
            <div class="section-title">
              <el-icon><Star /></el-icon>
              <span>收藏服务</span>
            </div>
            <div
              v-for="service in favoriteServices"
              :key="service.id"
              class="service-item"
              :class="{ 'is-selected': isSelected(service.id) }"
              @click="handleToggleService(service.id)"
            >
              <el-checkbox
                :model-value="isSelected(service.id)"
                @change="handleToggleService(service.id)"
                @click.stop
              />
              <div class="service-info">
                <div class="service-name">
                  <span class="name-text">{{ service.displayName || service.name }}</span>
                  <el-icon
                    class="favorite-icon active"
                    @click.stop="handleToggleFavorite(service.id)"
                  >
                    <StarFilled />
                  </el-icon>
                </div>
                <div v-if="showDetails" class="service-meta">
                  <el-tag :type="getEnvironmentType(service.environment)" size="small">
                    {{ service.environment }}
                  </el-tag>
                  <el-tag v-if="showRegion" size="small">{{ service.region }}</el-tag>
                  <span
                    class="service-status"
                    :style="{ color: getStatusColor(service.status) }"
                  >
                    <el-icon><CircleFilled /></el-icon>
                    {{ getStatusText(service.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- All Services Section -->
          <div class="service-section">
            <div v-if="showFavorites && favoriteServices.length > 0" class="section-title">
              <el-icon><Grid /></el-icon>
              <span>所有服务</span>
            </div>
            <div
              v-for="service in regularServices"
              :key="service.id"
              class="service-item"
              :class="{ 'is-selected': isSelected(service.id) }"
              @click="handleToggleService(service.id)"
            >
              <el-checkbox
                :model-value="isSelected(service.id)"
                @change="handleToggleService(service.id)"
                @click.stop
              />
              <div class="service-info">
                <div class="service-name">
                  <span class="name-text">{{ service.displayName || service.name }}</span>
                  <el-icon
                    v-if="showFavorites"
                    class="favorite-icon"
                    @click.stop="handleToggleFavorite(service.id)"
                  >
                    <Star />
                  </el-icon>
                </div>
                <div v-if="showDetails" class="service-meta">
                  <el-tag :type="getEnvironmentType(service.environment)" size="small">
                    {{ service.environment }}
                  </el-tag>
                  <el-tag v-if="showRegion" size="small">{{ service.region }}</el-tag>
                  <span
                    class="service-status"
                    :style="{ color: getStatusColor(service.status) }"
                  >
                    <el-icon><CircleFilled /></el-icon>
                    {{ getStatusText(service.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <el-icon><DocumentDelete /></el-icon>
        <p>{{ searchQuery ? '未找到匹配的服务' : '暂无可用服务' }}</p>
      </div>
    </div>

    <!-- Selected Services Tags -->
    <div v-if="showSelectedTags && selectedServices.length > 0" class="selected-tags">
      <div class="tags-header">
        <span>已选择 ({{ selectedServices.length }})</span>
        <el-button link size="small" type="danger" @click="handleClearAll">
          清空
        </el-button>
      </div>
      <div class="tags-list">
        <el-tag
          v-for="serviceId in selectedServices"
          :key="serviceId"
          closable
          :size="size"
          @close="handleRemoveService(serviceId)"
        >
          {{ getServiceName(serviceId) }}
        </el-tag>
      </div>
    </div>

    <!-- Footer Actions -->
    <div v-if="showFooter" class="filter-footer">
      <el-button :size="size" @click="handleCancel">取消</el-button>
      <el-button :size="size" type="primary" @click="handleConfirm">
        确定 ({{ selectedServices.length }})
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Search,
  FolderOpened,
  Star,
  StarFilled,
  Grid,
  CircleFilled,
  DocumentDelete
} from '@element-plus/icons-vue'
import { useFiltersStore } from '@/stores/filters'
import { useDashboardStore } from '@/stores/dashboard'
import type { Service, ServiceStatus, Environment } from '@/types'
import { getServiceStatusColor } from '@/utils/color'

// Props
interface Props {
  services?: Service[]
  modelValue?: string[]
  multiple?: boolean
  showHeader?: boolean
  showSearch?: boolean
  showDetails?: boolean
  showRegion?: boolean
  showFavorites?: boolean
  showSelectAll?: boolean
  showSelectedTags?: boolean
  showFooter?: boolean
  size?: 'large' | 'default' | 'small'
  maxHeight?: string
  compact?: boolean
  isMobile?: boolean
  useStore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  services: undefined,
  modelValue: undefined,
  multiple: true,
  showHeader: true,
  showSearch: true,
  showDetails: true,
  showRegion: true,
  showFavorites: true,
  showSelectAll: true,
  showSelectedTags: false,
  showFooter: false,
  size: 'default',
  maxHeight: '400px',
  compact: false,
  isMobile: false,
  useStore: true
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
  confirm: [value: string[]]
  cancel: []
}>()

// Stores
const filtersStore = useFiltersStore()
const dashboardStore = useDashboardStore()
const { services: storeServices } = storeToRefs(filtersStore)
const { userPreferences } = storeToRefs(dashboardStore)

// Local State
const searchQuery = ref('')
const localSelectedServices = ref<string[]>([])

// Computed
const availableServices = computed(() => {
  return props.services || []
})

const selectedServices = computed({
  get: () => {
    if (props.useStore) {
      return storeServices.value
    }
    return props.modelValue || localSelectedServices.value
  },
  set: (value: string[]) => {
    if (props.useStore) {
      filtersStore.setServices(value)
    } else {
      localSelectedServices.value = value
      emit('update:modelValue', value)
    }
    emit('change', value)
  }
})

const selectedCount = computed(() => selectedServices.value.length)

const filteredServices = computed(() => {
  if (!searchQuery.value) {
    return availableServices.value
  }

  const query = searchQuery.value.toLowerCase()
  return availableServices.value.filter(service => {
    return (
      service.name.toLowerCase().includes(query) ||
      service.displayName?.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query) ||
      service.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })
})

const favoriteServiceIds = computed(() => {
  return userPreferences.value.favoriteServices || []
})

const favoriteServices = computed(() => {
  return filteredServices.value.filter(service =>
    favoriteServiceIds.value.includes(service.id)
  )
})

const regularServices = computed(() => {
  if (!props.showFavorites) {
    return filteredServices.value
  }
  return filteredServices.value.filter(
    service => !favoriteServiceIds.value.includes(service.id)
  )
})

// Methods
const isSelected = (serviceId: string): boolean => {
  return selectedServices.value.includes(serviceId)
}

const handleToggleService = (serviceId: string) => {
  if (!props.multiple) {
    selectedServices.value = [serviceId]
    return
  }

  const newSelection = isSelected(serviceId)
    ? selectedServices.value.filter(id => id !== serviceId)
    : [...selectedServices.value, serviceId]

  selectedServices.value = newSelection
}

const handleRemoveService = (serviceId: string) => {
  selectedServices.value = selectedServices.value.filter(id => id !== serviceId)
}

const handleSelectAll = () => {
  selectedServices.value = filteredServices.value.map(s => s.id)
}

const handleClearAll = () => {
  selectedServices.value = []
}

const handleSearchClear = () => {
  searchQuery.value = ''
}

const handleToggleFavorite = (serviceId: string) => {
  if (favoriteServiceIds.value.includes(serviceId)) {
    dashboardStore.removeFavoriteService(serviceId)
  } else {
    dashboardStore.addFavoriteService(serviceId)
  }
}

const handleConfirm = () => {
  emit('confirm', selectedServices.value)
}

const handleCancel = () => {
  emit('cancel')
}

const getServiceName = (serviceId: string): string => {
  const service = availableServices.value.find(s => s.id === serviceId)
  return service?.displayName || service?.name || serviceId
}

const getStatusColor = (status: ServiceStatus): string => {
  return getServiceStatusColor(status)
}

const getStatusText = (status: ServiceStatus): string => {
  const statusMap: Record<ServiceStatus, string> = {
    healthy: '健康',
    degraded: '降级',
    down: '故障',
    unknown: '未知'
  }
  return statusMap[status] || status
}

const getEnvironmentType = (env: Environment): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<Environment, 'success' | 'warning' | 'info' | 'danger'> = {
    production: 'danger',
    staging: 'warning',
    development: 'info',
    test: 'info'
  }
  return typeMap[env] || 'info'
}

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !props.useStore) {
      localSelectedServices.value = newValue
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.service-filter {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  background: $bg-secondary;
  border-radius: 8px;
  padding: $spacing-md;

  &.is-compact {
    padding: $spacing-sm;
    gap: $spacing-sm;
  }

  &.is-mobile {
    padding: $spacing-sm;
  }
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-default;

  .filter-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;

    .el-icon {
      color: $accent-primary;
    }

    .filter-badge {
      margin-left: $spacing-xs;
    }
  }

  .filter-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.filter-search {
  .el-input {
    :deep(.el-input__wrapper) {
      background: $bg-primary;
      border-color: $border-default;

      &:hover {
        border-color: $border-hover;
      }
    }
  }
}

.service-list {
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid $border-default;
  background: $bg-primary;

  .el-scrollbar {
    height: 100%;
  }
}

.service-items {
  padding: $spacing-xs;
}

.service-section {
  margin-bottom: $spacing-md;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    margin-bottom: $spacing-xs;
    font-size: 12px;
    font-weight: 500;
    color: $text-secondary;
    text-transform: uppercase;

    .el-icon {
      font-size: 14px;
      color: $accent-primary;
    }
  }
}

.service-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $bg-elevated;
  }

  &.is-selected {
    background: rgba($accent-primary, 0.1);
    border-left: 2px solid $accent-primary;
  }

  .el-checkbox {
    margin-top: 2px;
  }

  .service-info {
    flex: 1;
    min-width: 0;
  }

  .service-name {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;

    .name-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .favorite-icon {
      font-size: 16px;
      color: $text-disabled;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: $accent-warning;
        transform: scale(1.1);
      }

      &.active {
        color: $accent-warning;
      }
    }
  }

  .service-meta {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;

    .el-tag {
      font-size: 11px;
    }

    .service-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;

      .el-icon {
        font-size: 8px;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  color: $text-secondary;

  .el-icon {
    font-size: 48px;
    margin-bottom: $spacing-md;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

.selected-tags {
  padding: $spacing-sm;
  background: $bg-primary;
  border-radius: 4px;
  border: 1px solid $border-default;

  .tags-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-sm;
    font-size: 12px;
    color: $text-secondary;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }
}

.filter-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $border-default;
}

// Mobile Styles
.is-mobile {
  .service-item {
    .service-meta {
      font-size: 11px;

      .el-tag {
        font-size: 10px;
      }
    }
  }
}
</style>
