<template>
  <div 
    class="empty-state" 
    :class="[`empty-state--${type}`, customClass]"
    :style="containerStyle"
  >
    <!-- Icon -->
    <div class="empty-state__icon" v-if="showIcon">
      <slot name="icon">
        <component 
          :is="iconComponent" 
          :style="{ fontSize: iconSize + 'px', color: iconColor }"
        />
      </slot>
    </div>

    <!-- Title -->
    <div class="empty-state__title" v-if="title || $slots.title">
      <slot name="title">
        {{ title }}
      </slot>
    </div>

    <!-- Description -->
    <div class="empty-state__description" v-if="description || $slots.description">
      <slot name="description">
        {{ description }}
      </slot>
    </div>

    <!-- Action Button -->
    <div class="empty-state__action" v-if="showAction || $slots.action">
      <slot name="action">
        <el-button 
          v-if="actionText"
          :type="actionType"
          :icon="actionIcon"
          @click="handleAction"
        >
          {{ actionText }}
        </el-button>
      </slot>
    </div>

    <!-- Extra Content -->
    <div class="empty-state__extra" v-if="$slots.extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { 
  DocumentDelete, 
  Search, 
  FolderOpened, 
  Connection,
  Warning,
  InfoFilled,
  CircleClose,
  Filter,
  Box,
  Document
} from '@element-plus/icons-vue'

/**
 * EmptyState Component Props
 */
interface Props {
  /** Empty state type (determines default icon and styling) */
  type?: 'no-data' | 'no-results' | 'no-services' | 'no-traces' | 'no-logs' | 'no-alerts' | 'error' | 'info' | 'custom'
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Show icon */
  showIcon?: boolean
  /** Custom icon component */
  icon?: any
  /** Icon size in pixels */
  iconSize?: number
  /** Icon color */
  iconColor?: string
  /** Show action button */
  showAction?: boolean
  /** Action button text */
  actionText?: string
  /** Action button type */
  actionType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** Action button icon */
  actionIcon?: any
  /** Container width */
  width?: string | number
  /** Container height */
  height?: string | number
  /** Minimum height */
  minHeight?: string | number
  /** Additional CSS class */
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'no-data',
  showIcon: true,
  iconSize: 80,
  showAction: false,
  actionType: 'primary',
  width: '100%',
  height: 'auto',
  minHeight: '300px',
  customClass: ''
})

/**
 * Component Events
 */
const emit = defineEmits<{
  action: []
}>()

/**
 * Type-based configuration
 */
const typeConfig = computed(() => {
  const configs = {
    'no-data': {
      icon: DocumentDelete,
      title: '暂无数据',
      description: '当前没有可显示的数据',
      iconColor: '#6e7681'
    },
    'no-results': {
      icon: Search,
      title: '未找到结果',
      description: '没有符合条件的数据，请尝试调整筛选条件',
      iconColor: '#6e7681'
    },
    'no-services': {
      icon: Connection,
      title: '暂无服务',
      description: '当前没有可用的服务',
      iconColor: '#6e7681'
    },
    'no-traces': {
      icon: FolderOpened,
      title: '暂无链路数据',
      description: '当前时间范围内没有链路追踪数据',
      iconColor: '#6e7681'
    },
    'no-logs': {
      icon: Document,
      title: '暂无日志',
      description: '当前时间范围内没有日志数据',
      iconColor: '#6e7681'
    },
    'no-alerts': {
      icon: Warning,
      title: '暂无告警',
      description: '当前没有活跃的告警',
      iconColor: '#73bf69'
    },
    'error': {
      icon: CircleClose,
      title: '加载失败',
      description: '数据加载失败，请稍后重试',
      iconColor: '#f2495c'
    },
    'info': {
      icon: InfoFilled,
      title: '提示信息',
      description: '',
      iconColor: '#5794f2'
    },
    'custom': {
      icon: Box,
      title: '',
      description: '',
      iconColor: '#6e7681'
    }
  }

  return configs[props.type] || configs['no-data']
})

/**
 * Icon component
 */
const iconComponent = computed(() => {
  return props.icon || typeConfig.value.icon
})

/**
 * Icon color
 */
const iconColor = computed(() => {
  return props.iconColor || typeConfig.value.iconColor
})

/**
 * Container style
 */
const containerStyle = computed<CSSProperties>(() => {
  const width = typeof props.width === 'number' ? `${props.width}px` : props.width
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height
  const minHeight = typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight

  return {
    width,
    height,
    minHeight
  }
})

/**
 * Handle action button click
 */
const handleAction = () => {
  emit('action')
}
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl, 32px);
  text-align: center;

  &__icon {
    margin-bottom: var(--spacing-lg, 24px);
    opacity: 0.6;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    color: var(--text-primary, #d8d9da);
    margin-bottom: var(--spacing-sm, 8px);
    line-height: 1.5;
  }

  &__description {
    font-size: 14px;
    color: var(--text-secondary, #9fa7b3);
    margin-bottom: var(--spacing-lg, 24px);
    line-height: 1.6;
    max-width: 500px;
  }

  &__action {
    margin-bottom: var(--spacing-md, 16px);
  }

  &__extra {
    margin-top: var(--spacing-md, 16px);
    color: var(--text-secondary, #9fa7b3);
    font-size: 13px;
  }

  // Type-specific styles
  &--no-alerts {
    .empty-state__icon {
      opacity: 0.8;
    }
  }

  &--error {
    .empty-state__icon {
      opacity: 0.9;
    }
  }

  &--info {
    .empty-state__icon {
      opacity: 0.8;
    }
  }
}

// Dark theme adjustments (already default, but explicit for clarity)
@media (prefers-color-scheme: dark) {
  .empty-state {
    &__title {
      color: #d8d9da;
    }

    &__description {
      color: #9fa7b3;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .empty-state {
    padding: var(--spacing-lg, 24px);

    &__icon {
      font-size: 60px !important;
      margin-bottom: var(--spacing-md, 16px);
    }

    &__title {
      font-size: 16px;
    }

    &__description {
      font-size: 13px;
      margin-bottom: var(--spacing-md, 16px);
    }
  }
}
</style>
