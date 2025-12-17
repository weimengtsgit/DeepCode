<template>
  <div class="grid-layout" :class="{ 'is-mobile': isMobile, 'is-editing': isEditing }">
    <!-- Header -->
    <div v-if="showHeader" class="grid-layout-header">
      <div class="header-left">
        <el-icon v-if="icon" class="header-icon">
          <component :is="icon" />
        </el-icon>
        <div class="header-text">
          <h3 class="header-title">{{ title }}</h3>
          <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button
          v-if="showEditToggle"
          :type="isEditing ? 'primary' : 'default'"
          :icon="isEditing ? Check : Edit"
          :size="size"
          @click="toggleEdit"
        >
          {{ isEditing ? '完成编辑' : '编辑布局' }}
        </el-button>
        <el-button
          v-if="showAddWidget && isEditing"
          type="primary"
          :icon="Plus"
          :size="size"
          @click="handleAddWidget"
        >
          添加组件
        </el-button>
        <el-button
          v-if="showSave && isEditing"
          type="success"
          :icon="DocumentCopy"
          :size="size"
          @click="handleSave"
        >
          保存布局
        </el-button>
        <el-button
          v-if="showReset && isEditing"
          type="warning"
          :icon="RefreshRight"
          :size="size"
          @click="handleReset"
        >
          重置布局
        </el-button>
      </div>
    </div>

    <!-- Grid Layout -->
    <div class="grid-layout-container">
      <grid-layout
        v-model:layout="currentLayout"
        :col-num="colNum"
        :row-height="rowHeight"
        :is-draggable="isDraggable && isEditing"
        :is-resizable="isResizable && isEditing"
        :is-mirrored="false"
        :vertical-compact="true"
        :margin="margin"
        :use-css-transforms="true"
        :responsive="responsive"
        :breakpoints="breakpoints"
        :cols="cols"
        @layout-updated="handleLayoutUpdated"
        @breakpoint-changed="handleBreakpointChanged"
      >
        <grid-item
          v-for="item in currentLayout"
          :key="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          :min-w="item.minW || 2"
          :min-h="item.minH || 2"
          :max-w="item.maxW"
          :max-h="item.maxH"
          :is-draggable="isDraggable && isEditing"
          :is-resizable="isResizable && isEditing"
          :static="item.static"
          @moved="handleItemMoved"
          @resized="handleItemResized"
        >
          <div class="grid-item-wrapper" :class="{ 'is-editing': isEditing }">
            <!-- Edit Mode Controls -->
            <div v-if="isEditing" class="grid-item-controls">
              <el-button-group size="small">
                <el-button :icon="Setting" @click="handleConfigWidget(item)" />
                <el-button :icon="DocumentCopy" @click="handleDuplicateWidget(item)" />
                <el-button :icon="Delete" type="danger" @click="handleRemoveWidget(item)" />
              </el-button-group>
            </div>

            <!-- Widget Content -->
            <div class="grid-item-content">
              <slot :name="`widget-${item.i}`" :item="item" :is-editing="isEditing">
                <div class="default-widget">
                  <el-icon class="widget-icon">
                    <Grid />
                  </el-icon>
                  <p class="widget-text">Widget {{ item.i }}</p>
                </div>
              </slot>
            </div>

            <!-- Resize Handle (visible in edit mode) -->
            <div v-if="isEditing && isResizable" class="resize-handle">
              <el-icon>
                <BottomRight />
              </el-icon>
            </div>
          </div>
        </grid-item>
      </grid-layout>

      <!-- Empty State -->
      <empty-state
        v-if="currentLayout.length === 0"
        type="no-data"
        title="暂无组件"
        description="点击"添加组件"按钮开始构建您的仪表盘"
        :show-action="isEditing"
        action-text="添加组件"
        :action-icon="Plus"
        @action="handleAddWidget"
      />
    </div>

    <!-- Add Widget Dialog -->
    <el-dialog
      v-model="showAddDialog"
      title="添加组件"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="newWidgetForm" label-width="100px">
        <el-form-item label="组件类型">
          <el-select v-model="newWidgetForm.type" placeholder="选择组件类型">
            <el-option
              v-for="type in widgetTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <el-icon style="margin-right: 8px">
                <component :is="type.icon" />
              </el-icon>
              {{ type.label }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="组件标题">
          <el-input v-model="newWidgetForm.title" placeholder="输入组件标题" />
        </el-form-item>
        <el-form-item label="宽度">
          <el-slider v-model="newWidgetForm.w" :min="2" :max="12" :marks="{ 2: '2', 6: '6', 12: '12' }" />
        </el-form-item>
        <el-form-item label="高度">
          <el-slider v-model="newWidgetForm.h" :min="2" :max="8" :marks="{ 2: '2', 4: '4', 8: '8' }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddWidget">确定</el-button>
      </template>
    </el-dialog>

    <!-- Configure Widget Dialog -->
    <el-dialog
      v-model="showConfigDialog"
      title="配置组件"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form v-if="editingWidget" :model="editingWidget" label-width="100px">
        <el-form-item label="组件标题">
          <el-input v-model="editingWidget.title" placeholder="输入组件标题" />
        </el-form-item>
        <el-form-item label="宽度">
          <el-slider v-model="editingWidget.w" :min="2" :max="12" />
        </el-form-item>
        <el-form-item label="高度">
          <el-slider v-model="editingWidget.h" :min="2" :max="8" />
        </el-form-item>
        <el-form-item label="固定位置">
          <el-switch v-model="editingWidget.static" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmConfigWidget">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { GridLayout, GridItem } from 'vue-grid-layout'
import {
  Edit,
  Check,
  Plus,
  DocumentCopy,
  RefreshRight,
  Setting,
  Delete,
  Grid,
  BottomRight,
  TrendCharts,
  DataAnalysis,
  Odometer,
  PieChart,
  Monitor
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import EmptyState from '@/components/Common/EmptyState.vue'

// Types
interface GridLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  [key: string]: any
}

interface WidgetType {
  value: string
  label: string
  icon: any
  defaultW: number
  defaultH: number
}

// Props
interface Props {
  layout?: GridLayoutItem[]
  title?: string
  subtitle?: string
  icon?: any
  showHeader?: boolean
  showEditToggle?: boolean
  showAddWidget?: boolean
  showSave?: boolean
  showReset?: boolean
  colNum?: number
  rowHeight?: number
  margin?: [number, number]
  isDraggable?: boolean
  isResizable?: boolean
  responsive?: boolean
  breakpoints?: Record<string, number>
  cols?: Record<string, number>
  size?: 'large' | 'default' | 'small'
  isMobile?: boolean
  autoSave?: boolean
  saveDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  layout: () => [],
  title: '自定义布局',
  showHeader: true,
  showEditToggle: true,
  showAddWidget: true,
  showSave: true,
  showReset: true,
  colNum: 12,
  rowHeight: 60,
  margin: () => [16, 16],
  isDraggable: true,
  isResizable: true,
  responsive: true,
  breakpoints: () => ({ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }),
  cols: () => ({ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }),
  size: 'default',
  isMobile: false,
  autoSave: false,
  saveDelay: 1000
})

// Emits
const emit = defineEmits<{
  'update:layout': [value: GridLayoutItem[]]
  'layout-updated': [value: GridLayoutItem[]]
  'edit-toggle': [value: boolean]
  'add-widget': [value: GridLayoutItem]
  'remove-widget': [value: GridLayoutItem]
  'config-widget': [value: GridLayoutItem]
  'save': [value: GridLayoutItem[]]
  'reset': []
}>()

// State
const isEditing = ref(false)
const currentLayout = ref<GridLayoutItem[]>([...props.layout])
const showAddDialog = ref(false)
const showConfigDialog = ref(false)
const editingWidget = ref<GridLayoutItem | null>(null)
const currentBreakpoint = ref('lg')
let saveTimer: ReturnType<typeof setTimeout> | null = null

// Widget Types
const widgetTypes: WidgetType[] = [
  { value: 'metric-card', label: '指标卡片', icon: Monitor, defaultW: 3, defaultH: 2 },
  { value: 'line-chart', label: '折线图', icon: TrendCharts, defaultW: 6, defaultH: 4 },
  { value: 'bar-chart', label: '柱状图', icon: DataAnalysis, defaultW: 6, defaultH: 4 },
  { value: 'pie-chart', label: '饼图', icon: PieChart, defaultW: 4, defaultH: 4 },
  { value: 'gauge', label: '仪表盘', icon: Odometer, defaultW: 3, defaultH: 3 }
]

// New Widget Form
const newWidgetForm = ref({
  type: 'metric-card',
  title: '',
  w: 3,
  h: 2
})

// Computed
const nextWidgetId = computed(() => {
  const ids = currentLayout.value.map(item => parseInt(item.i.replace(/\D/g, '')) || 0)
  return Math.max(0, ...ids) + 1
})

// Watch
watch(
  () => props.layout,
  (newLayout) => {
    currentLayout.value = [...newLayout]
  },
  { deep: true }
)

watch(
  currentLayout,
  (newLayout) => {
    emit('update:layout', newLayout)
    
    // Auto-save with debounce
    if (props.autoSave && isEditing.value) {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        emit('save', newLayout)
      }, props.saveDelay)
    }
  },
  { deep: true }
)

// Methods
const toggleEdit = () => {
  isEditing.value = !isEditing.value
  emit('edit-toggle', isEditing.value)
  
  if (!isEditing.value && props.autoSave) {
    emit('save', currentLayout.value)
  }
}

const handleAddWidget = () => {
  newWidgetForm.value = {
    type: 'metric-card',
    title: '',
    w: 3,
    h: 2
  }
  showAddDialog.value = true
}

const confirmAddWidget = () => {
  const selectedType = widgetTypes.find(t => t.value === newWidgetForm.value.type)
  
  const newWidget: GridLayoutItem = {
    i: `widget-${nextWidgetId.value}`,
    x: 0,
    y: 0,
    w: newWidgetForm.value.w,
    h: newWidgetForm.value.h,
    minW: 2,
    minH: 2,
    type: newWidgetForm.value.type,
    title: newWidgetForm.value.title || selectedType?.label || '新组件'
  }
  
  currentLayout.value.push(newWidget)
  emit('add-widget', newWidget)
  showAddDialog.value = false
  
  ElMessage.success('组件添加成功')
}

const handleRemoveWidget = (item: GridLayoutItem) => {
  const index = currentLayout.value.findIndex(i => i.i === item.i)
  if (index > -1) {
    currentLayout.value.splice(index, 1)
    emit('remove-widget', item)
    ElMessage.success('组件已删除')
  }
}

const handleConfigWidget = (item: GridLayoutItem) => {
  editingWidget.value = { ...item }
  showConfigDialog.value = true
}

const confirmConfigWidget = () => {
  if (editingWidget.value) {
    const index = currentLayout.value.findIndex(i => i.i === editingWidget.value!.i)
    if (index > -1) {
      currentLayout.value[index] = { ...editingWidget.value }
      emit('config-widget', editingWidget.value)
      ElMessage.success('组件配置已更新')
    }
  }
  showConfigDialog.value = false
}

const handleDuplicateWidget = (item: GridLayoutItem) => {
  const newWidget: GridLayoutItem = {
    ...item,
    i: `widget-${nextWidgetId.value}`,
    x: item.x + 1,
    y: item.y + 1
  }
  currentLayout.value.push(newWidget)
  emit('add-widget', newWidget)
  ElMessage.success('组件已复制')
}

const handleSave = () => {
  emit('save', currentLayout.value)
  ElMessage.success('布局已保存')
}

const handleReset = () => {
  currentLayout.value = [...props.layout]
  emit('reset')
  ElMessage.success('布局已重置')
}

const handleLayoutUpdated = (newLayout: GridLayoutItem[]) => {
  emit('layout-updated', newLayout)
}

const handleBreakpointChanged = (newBreakpoint: string) => {
  currentBreakpoint.value = newBreakpoint
}

const handleItemMoved = (i: string, newX: number, newY: number) => {
  // Item moved event
}

const handleItemResized = (i: string, newH: number, newW: number) => {
  // Item resized event
}

// Lifecycle
onMounted(() => {
  if (currentLayout.value.length === 0 && props.layout.length === 0) {
    // Initialize with default layout if empty
    currentLayout.value = []
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.grid-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.is-mobile {
    .grid-layout-header {
      flex-direction: column;
      gap: 12px;

      .header-right {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
}

.grid-layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .header-icon {
      font-size: 24px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .header-text {
      flex: 1;
      min-width: 0;

      .header-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        @include text-ellipsis;
      }

      .header-subtitle {
        margin: 4px 0 0;
        font-size: 14px;
        color: var(--text-secondary);
        @include text-ellipsis;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

.grid-layout-container {
  flex: 1;
  padding: 16px;
  overflow: auto;
  position: relative;
}

.grid-item-wrapper {
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;

  &.is-editing {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(50, 116, 217, 0.2);

    &:hover {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(50, 116, 217, 0.4);
    }
  }

  &:hover {
    border-color: var(--border-hover);
  }
}

.grid-item-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;

  .grid-item-wrapper:hover & {
    opacity: 1;
  }
}

.grid-item-content {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;

  .default-widget {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-secondary);

    .widget-icon {
      font-size: 48px;
      opacity: 0.5;
    }

    .widget-text {
      margin: 0;
      font-size: 14px;
    }
  }
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.3s ease;

  .grid-item-wrapper:hover & {
    opacity: 1;
  }

  .el-icon {
    font-size: 16px;
  }
}

// Vue Grid Layout Overrides
:deep(.vue-grid-layout) {
  background: transparent;
}

:deep(.vue-grid-item) {
  transition: all 0.3s ease;

  &.vue-grid-placeholder {
    background: rgba(50, 116, 217, 0.2);
    border: 2px dashed var(--primary-color);
    border-radius: 8px;
    z-index: 2;
    transition: all 0.3s ease;
  }

  &.resizing,
  &.dragging {
    opacity: 0.8;
    z-index: 100;
  }
}

:deep(.vue-resizable-handle) {
  display: none;
}
</style>
