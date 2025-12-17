<template>
  <div :class="['multi-filter', { 'is-mobile': isMobile, 'is-compact': compact }]">
    <!-- Header -->
    <div v-if="showHeader" class="multi-filter__header">
      <div class="header-left">
        <el-icon class="header-icon">
          <Filter />
        </el-icon>
        <span class="header-title">{{ title }}</span>
        <el-badge
          v-if="activeFilterCount > 0"
          :value="activeFilterCount"
          :type="activeFilterCount > 5 ? 'danger' : 'primary'"
          class="filter-badge"
        />
      </div>
      <div class="header-right">
        <el-button
          v-if="showClearAll && hasActiveFilters"
          link
          type="danger"
          size="small"
          @click="handleClearAll"
        >
          <el-icon><CircleClose /></el-icon>
          清空筛选
        </el-button>
        <el-button
          v-if="showSave"
          link
          type="primary"
          size="small"
          @click="handleSave"
        >
          <el-icon><DocumentCopy /></el-icon>
          保存筛选
        </el-button>
      </div>
    </div>

    <!-- Search -->
    <div v-if="showSearch" class="multi-filter__search">
      <el-input
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        :size="size"
        clearable
        @input="handleSearchChange"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Filter Sections -->
    <div class="multi-filter__content">
      <!-- Services Filter -->
      <div v-if="showServices" class="filter-section">
        <div class="section-header">
          <el-icon class="section-icon"><FolderOpened /></el-icon>
          <span class="section-title">服务</span>
          <el-badge
            v-if="selectedServices.length > 0"
            :value="selectedServices.length"
            type="primary"
            class="section-badge"
          />
        </div>
        <div class="section-content">
          <ServiceFilter
            v-model="selectedServices"
            :services="availableServices"
            :show-header="false"
            :show-footer="false"
            :show-selected-tags="false"
            :max-height="sectionMaxHeight"
            :size="size"
            :compact="compact"
            :use-store="useStore"
            @change="handleServicesChange"
          />
        </div>
      </div>

      <!-- Environments Filter -->
      <div v-if="showEnvironments" class="filter-section">
        <div class="section-header">
          <el-icon class="section-icon"><Monitor /></el-icon>
          <span class="section-title">环境</span>
          <el-badge
            v-if="selectedEnvironments.length > 0"
            :value="selectedEnvironments.length"
            type="primary"
            class="section-badge"
          />
        </div>
        <div class="section-content">
          <div class="checkbox-group">
            <el-checkbox
              v-for="env in availableEnvironments"
              :key="env"
              :model-value="selectedEnvironments.includes(env)"
              @change="handleEnvironmentToggle(env)"
            >
              <el-tag :type="getEnvironmentTagType(env)" size="small">
                {{ formatEnvironment(env) }}
              </el-tag>
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- Regions Filter -->
      <div v-if="showRegions" class="filter-section">
        <div class="section-header">
          <el-icon class="section-icon"><Location /></el-icon>
          <span class="section-title">区域</span>
          <el-badge
            v-if="selectedRegions.length > 0"
            :value="selectedRegions.length"
            type="primary"
            class="section-badge"
          />
        </div>
        <div class="section-content">
          <div class="checkbox-group">
            <el-checkbox
              v-for="region in availableRegions"
              :key="region"
              :model-value="selectedRegions.includes(region)"
              @change="handleRegionToggle(region)"
            >
              <span class="region-label">{{ formatRegion(region) }}</span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- Tags Filter -->
      <div v-if="showTags" class="filter-section">
        <div class="section-header">
          <el-icon class="section-icon"><PriceTag /></el-icon>
          <span class="section-title">标签</span>
          <el-badge
            v-if="selectedTags.length > 0"
            :value="selectedTags.length"
            type="primary"
            class="section-badge"
          />
        </div>
        <div class="section-content">
          <div class="tag-input-wrapper">
            <el-select
              v-model="selectedTags"
              multiple
              filterable
              allow-create
              default-first-option
              :placeholder="tagsPlaceholder"
              :size="size"
              :max-collapse-tags="3"
              @change="handleTagsChange"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- Custom Filters Slot -->
      <slot name="custom-filters" :filters="currentFilters" />
    </div>

    <!-- Selected Filters Display -->
    <div v-if="showSelectedFilters && hasActiveFilters" class="multi-filter__selected">
      <div class="selected-header">
        <span class="selected-title">已选筛选条件</span>
        <el-button link type="danger" size="small" @click="handleClearAll">
          清空全部
        </el-button>
      </div>
      <div class="selected-tags">
        <el-tag
          v-for="service in selectedServices"
          :key="`service-${service}`"
          closable
          type="info"
          @close="handleRemoveService(service)"
        >
          服务: {{ getServiceName(service) }}
        </el-tag>
        <el-tag
          v-for="env in selectedEnvironments"
          :key="`env-${env}`"
          closable
          :type="getEnvironmentTagType(env)"
          @close="handleRemoveEnvironment(env)"
        >
          环境: {{ formatEnvironment(env) }}
        </el-tag>
        <el-tag
          v-for="region in selectedRegions"
          :key="`region-${region}`"
          closable
          type="warning"
          @close="handleRemoveRegion(region)"
        >
          区域: {{ formatRegion(region) }}
        </el-tag>
        <el-tag
          v-for="tag in selectedTags"
          :key="`tag-${tag}`"
          closable
          type="success"
          @close="handleRemoveTag(tag)"
        >
          标签: {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="showFooter" class="multi-filter__footer">
      <el-button :size="size" @click="handleCancel">取消</el-button>
      <el-button :size="size" type="primary" @click="handleConfirm">
        确定 ({{ activeFilterCount }})
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Filter,
  Search,
  CircleClose,
  DocumentCopy,
  FolderOpened,
  Monitor,
  Location,
  PriceTag
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ServiceFilter from './ServiceFilter.vue'
import { useFiltersStore } from '@/stores/filters'
import type { FilterConfig, Service, Environment, Region } from '@/types'

// Props
interface Props {
  modelValue?: Partial<FilterConfig>
  services?: Service[]
  title?: string
  showHeader?: boolean
  showSearch?: boolean
  showServices?: boolean
  showEnvironments?: boolean
  showRegions?: boolean
  showTags?: boolean
  showSelectedFilters?: boolean
  showClearAll?: boolean
  showSave?: boolean
  showFooter?: boolean
  searchPlaceholder?: string
  tagsPlaceholder?: string
  sectionMaxHeight?: string
  size?: 'large' | 'default' | 'small'
  compact?: boolean
  isMobile?: boolean
  useStore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '筛选条件',
  showHeader: true,
  showSearch: true,
  showServices: true,
  showEnvironments: true,
  showRegions: true,
  showTags: true,
  showSelectedFilters: true,
  showClearAll: true,
  showSave: false,
  showFooter: false,
  searchPlaceholder: '搜索服务、标签...',
  tagsPlaceholder: '选择或输入标签',
  sectionMaxHeight: '200px',
  size: 'default',
  compact: false,
  isMobile: false,
  useStore: true
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Partial<FilterConfig>]
  change: [value: Partial<FilterConfig>]
  confirm: [value: Partial<FilterConfig>]
  cancel: []
  save: [value: Partial<FilterConfig>]
}>()

// Store
const filtersStore = props.useStore ? useFiltersStore() : null
const storeRefs = filtersStore ? storeToRefs(filtersStore) : null

// Local state
const searchQuery = ref('')
const selectedServices = ref<string[]>([])
const selectedEnvironments = ref<Environment[]>([])
const selectedRegions = ref<Region[]>([])
const selectedTags = ref<string[]>([])

// Initialize from store or modelValue
if (props.useStore && storeRefs) {
  selectedServices.value = [...storeRefs.services.value]
  selectedEnvironments.value = [...storeRefs.environments.value]
  selectedRegions.value = [...storeRefs.regions.value]
  selectedTags.value = [...storeRefs.tags.value]
  searchQuery.value = storeRefs.searchQuery.value
} else if (props.modelValue) {
  selectedServices.value = props.modelValue.services || []
  selectedEnvironments.value = props.modelValue.environments || []
  selectedRegions.value = props.modelValue.regions || []
  selectedTags.value = props.modelValue.tags || []
  searchQuery.value = props.modelValue.searchQuery || ''
}

// Computed
const availableServices = computed(() => {
  if (props.services) return props.services
  // Get from mock data or store
  return []
})

const availableEnvironments = computed<Environment[]>(() => {
  return ['production', 'staging', 'development', 'test']
})

const availableRegions = computed<Region[]>(() => {
  return ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'cn-north-1']
})

const availableTags = computed(() => {
  const tags = new Set<string>()
  availableServices.value.forEach(service => {
    service.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

const currentFilters = computed<Partial<FilterConfig>>(() => ({
  services: selectedServices.value,
  environments: selectedEnvironments.value,
  regions: selectedRegions.value,
  tags: selectedTags.value,
  searchQuery: searchQuery.value
}))

const hasActiveFilters = computed(() => {
  return (
    selectedServices.value.length > 0 ||
    selectedEnvironments.value.length > 0 ||
    selectedRegions.value.length > 0 ||
    selectedTags.value.length > 0 ||
    searchQuery.value.trim() !== ''
  )
})

const activeFilterCount = computed(() => {
  return (
    selectedServices.value.length +
    selectedEnvironments.value.length +
    selectedRegions.value.length +
    selectedTags.value.length +
    (searchQuery.value.trim() ? 1 : 0)
  )
})

// Methods
const getServiceName = (serviceId: string): string => {
  const service = availableServices.value.find(s => s.id === serviceId)
  return service?.displayName || service?.name || serviceId
}

const formatEnvironment = (env: Environment): string => {
  const map: Record<Environment, string> = {
    production: '生产',
    staging: '预发布',
    development: '开发',
    test: '测试'
  }
  return map[env] || env
}

const formatRegion = (region: Region): string => {
  const map: Record<Region, string> = {
    'us-east-1': '美东1',
    'us-west-2': '美西2',
    'eu-west-1': '欧洲西1',
    'ap-southeast-1': '亚太东南1',
    'cn-north-1': '华北1'
  }
  return map[region] || region
}

const getEnvironmentTagType = (env: Environment): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<Environment, 'success' | 'warning' | 'info' | 'danger'> = {
    production: 'danger',
    staging: 'warning',
    development: 'info',
    test: 'success'
  }
  return typeMap[env] || 'info'
}

const handleSearchChange = () => {
  emitChange()
}

const handleServicesChange = (services: string[]) => {
  selectedServices.value = services
  emitChange()
}

const handleEnvironmentToggle = (env: Environment) => {
  const index = selectedEnvironments.value.indexOf(env)
  if (index > -1) {
    selectedEnvironments.value.splice(index, 1)
  } else {
    selectedEnvironments.value.push(env)
  }
  emitChange()
}

const handleRegionToggle = (region: Region) => {
  const index = selectedRegions.value.indexOf(region)
  if (index > -1) {
    selectedRegions.value.splice(index, 1)
  } else {
    selectedRegions.value.push(region)
  }
  emitChange()
}

const handleTagsChange = () => {
  emitChange()
}

const handleRemoveService = (serviceId: string) => {
  const index = selectedServices.value.indexOf(serviceId)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
    emitChange()
  }
}

const handleRemoveEnvironment = (env: Environment) => {
  const index = selectedEnvironments.value.indexOf(env)
  if (index > -1) {
    selectedEnvironments.value.splice(index, 1)
    emitChange()
  }
}

const handleRemoveRegion = (region: Region) => {
  const index = selectedRegions.value.indexOf(region)
  if (index > -1) {
    selectedRegions.value.splice(index, 1)
    emitChange()
  }
}

const handleRemoveTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
    emitChange()
  }
}

const handleClearAll = () => {
  selectedServices.value = []
  selectedEnvironments.value = []
  selectedRegions.value = []
  selectedTags.value = []
  searchQuery.value = ''
  
  if (props.useStore && filtersStore) {
    filtersStore.clearFilters()
  }
  
  emitChange()
  ElMessage.success('已清空所有筛选条件')
}

const handleSave = () => {
  emit('save', currentFilters.value)
  ElMessage.success('筛选条件已保存')
}

const handleConfirm = () => {
  if (props.useStore && filtersStore) {
    filtersStore.setFilters(currentFilters.value)
  }
  emit('confirm', currentFilters.value)
}

const handleCancel = () => {
  emit('cancel')
}

const emitChange = () => {
  const filters = currentFilters.value
  emit('update:modelValue', filters)
  emit('change', filters)
  
  if (props.useStore && filtersStore) {
    filtersStore.setFilters(filters)
  }
}

// Watch modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !props.useStore) {
      selectedServices.value = newValue.services || []
      selectedEnvironments.value = newValue.environments || []
      selectedRegions.value = newValue.regions || []
      selectedTags.value = newValue.tags || []
      searchQuery.value = newValue.searchQuery || ''
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.multi-filter {
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
    
    .multi-filter__header {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;
    }
  }
}

.multi-filter__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-default;

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .header-icon {
      font-size: 18px;
      color: $accent-primary;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }

    .filter-badge {
      margin-left: $spacing-xs;
    }
  }

  .header-right {
    display: flex;
    gap: $spacing-sm;
  }
}

.multi-filter__search {
  width: 100%;
}

.multi-filter__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  max-height: 600px;
  overflow-y: auto;
  @include custom-scrollbar;
}

.filter-section {
  background: $bg-card;
  border-radius: 6px;
  padding: $spacing-sm;
  border: 1px solid $border-default;

  .section-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
    padding-bottom: $spacing-xs;
    border-bottom: 1px solid $border-default;

    .section-icon {
      font-size: 16px;
      color: $accent-info;
    }

    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      flex: 1;
    }

    .section-badge {
      margin-left: auto;
    }
  }

  .section-content {
    max-height: 300px;
    overflow-y: auto;
    @include custom-scrollbar;
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .el-checkbox {
    margin: 0;
    
    :deep(.el-checkbox__label) {
      color: $text-primary;
    }
  }

  .region-label {
    color: $text-primary;
    font-size: 14px;
  }
}

.tag-input-wrapper {
  width: 100%;
}

.multi-filter__selected {
  background: $bg-card;
  border-radius: 6px;
  padding: $spacing-sm;
  border: 1px solid $border-default;

  .selected-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .selected-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
    }
  }

  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;

    .el-tag {
      margin: 0;
    }
  }
}

.multi-filter__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $border-default;
}
</style>
