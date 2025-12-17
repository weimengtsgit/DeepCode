<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />
    
    <div v-else class="error-boundary__content">
      <div class="error-boundary__container">
        <!-- Error Icon -->
        <div class="error-boundary__icon">
          <el-icon :size="iconSize" :color="iconColor">
            <WarningFilled v-if="errorType === 'error'" />
            <CircleClose v-else-if="errorType === 'fatal'" />
            <Warning v-else />
          </el-icon>
        </div>

        <!-- Error Title -->
        <h2 class="error-boundary__title">
          {{ errorTitle }}
        </h2>

        <!-- Error Message -->
        <p class="error-boundary__message">
          {{ errorMessage }}
        </p>

        <!-- Error Details (Collapsible) -->
        <div v-if="showDetails && errorDetails" class="error-boundary__details">
          <el-collapse v-model="activeCollapse">
            <el-collapse-item name="details" title="错误详情">
              <div class="error-details">
                <div v-if="errorDetails.message" class="error-details__item">
                  <strong>错误信息：</strong>
                  <pre>{{ errorDetails.message }}</pre>
                </div>
                <div v-if="errorDetails.stack" class="error-details__item">
                  <strong>堆栈跟踪：</strong>
                  <pre>{{ formatStackTrace(errorDetails.stack) }}</pre>
                </div>
                <div v-if="errorDetails.componentName" class="error-details__item">
                  <strong>组件：</strong>
                  <code>{{ errorDetails.componentName }}</code>
                </div>
                <div v-if="errorDetails.timestamp" class="error-details__item">
                  <strong>时间：</strong>
                  <span>{{ formatTimestamp(errorDetails.timestamp) }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- Actions -->
        <div class="error-boundary__actions">
          <el-button
            v-if="showRetry"
            type="primary"
            :icon="RefreshRight"
            @click="handleRetry"
          >
            {{ retryText }}
          </el-button>
          
          <el-button
            v-if="showReset"
            :icon="Refresh"
            @click="handleReset"
          >
            {{ resetText }}
          </el-button>
          
          <el-button
            v-if="showReport"
            :icon="Document"
            @click="handleReport"
          >
            {{ reportText }}
          </el-button>
          
          <el-button
            v-if="showHome"
            :icon="HomeFilled"
            @click="handleGoHome"
          >
            {{ homeText }}
          </el-button>
        </div>

        <!-- Custom Action Slot -->
        <div v-if="$slots.actions" class="error-boundary__custom-actions">
          <slot name="actions" :error="errorDetails" :reset="reset" :retry="retry" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import {
  WarningFilled,
  CircleClose,
  Warning,
  RefreshRight,
  Refresh,
  Document,
  HomeFilled
} from '@element-plus/icons-vue'
import { formatTimestamp } from '@/utils/format'

/**
 * Error details interface
 */
interface ErrorDetails {
  message: string
  stack?: string
  componentName?: string
  timestamp: number
  code?: string
  info?: any
}

/**
 * Component props
 */
const props = defineProps({
  // Error type for styling
  errorType: {
    type: String as PropType<'error' | 'fatal' | 'warning'>,
    default: 'error'
  },
  
  // Custom error title
  title: {
    type: String,
    default: ''
  },
  
  // Custom error message
  message: {
    type: String,
    default: ''
  },
  
  // Show error details
  showDetails: {
    type: Boolean,
    default: true
  },
  
  // Show retry button
  showRetry: {
    type: Boolean,
    default: true
  },
  
  // Retry button text
  retryText: {
    type: String,
    default: '重试'
  },
  
  // Show reset button
  showReset: {
    type: Boolean,
    default: true
  },
  
  // Reset button text
  resetText: {
    type: String,
    default: '重置'
  },
  
  // Show report button
  showReport: {
    type: Boolean,
    default: false
  },
  
  // Report button text
  reportText: {
    type: String,
    default: '报告问题'
  },
  
  // Show home button
  showHome: {
    type: Boolean,
    default: true
  },
  
  // Home button text
  homeText: {
    type: String,
    default: '返回首页'
  },
  
  // Icon size
  iconSize: {
    type: Number,
    default: 80
  },
  
  // Icon color
  iconColor: {
    type: String,
    default: ''
  },
  
  // Auto retry
  autoRetry: {
    type: Boolean,
    default: false
  },
  
  // Auto retry delay (ms)
  autoRetryDelay: {
    type: Number,
    default: 3000
  },
  
  // Max auto retry count
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Custom error handler
  onError: {
    type: Function as PropType<(error: Error, errorDetails: ErrorDetails) => void>,
    default: undefined
  },
  
  // Custom retry handler
  onRetry: {
    type: Function as PropType<() => void | Promise<void>>,
    default: undefined
  },
  
  // Custom reset handler
  onReset: {
    type: Function as PropType<() => void>,
    default: undefined
  },
  
  // Custom report handler
  onReport: {
    type: Function as PropType<(errorDetails: ErrorDetails) => void>,
    default: undefined
  }
})

/**
 * Component emits
 */
const emit = defineEmits<{
  error: [error: Error, errorDetails: ErrorDetails]
  retry: []
  reset: []
  report: [errorDetails: ErrorDetails]
}>()

/**
 * Router instance
 */
const router = useRouter()

/**
 * State
 */
const hasError = ref(false)
const errorDetails = ref<ErrorDetails | null>(null)
const activeCollapse = ref<string[]>([])
const retryCount = ref(0)
const autoRetryTimer = ref<number | null>(null)

/**
 * Computed error title
 */
const errorTitle = computed(() => {
  if (props.title) return props.title
  
  switch (props.errorType) {
    case 'fatal':
      return '严重错误'
    case 'warning':
      return '警告'
    default:
      return '出错了'
  }
})

/**
 * Computed error message
 */
const errorMessage = computed(() => {
  if (props.message) return props.message
  
  switch (props.errorType) {
    case 'fatal':
      return '应用程序遇到了严重错误，请刷新页面或联系管理员。'
    case 'warning':
      return '应用程序遇到了一些问题，但仍可继续使用。'
    default:
      return '抱歉，页面加载时出现了问题。请尝试刷新页面或稍后再试。'
  }
})

/**
 * Computed icon color
 */
const computedIconColor = computed(() => {
  if (props.iconColor) return props.iconColor
  
  switch (props.errorType) {
    case 'fatal':
      return '#f2495c'
    case 'warning':
      return '#ff9830'
    default:
      return '#f2495c'
  }
})

const iconColor = computedIconColor

/**
 * Format stack trace for display
 */
function formatStackTrace(stack: string): string {
  return stack
    .split('\n')
    .slice(0, 10) // Limit to first 10 lines
    .map(line => line.trim())
    .join('\n')
}

/**
 * Handle error capture
 */
onErrorCaptured((err: Error, instance, info) => {
  console.error('[ErrorBoundary] Caught error:', err)
  console.error('[ErrorBoundary] Component:', instance)
  console.error('[ErrorBoundary] Info:', info)
  
  const details: ErrorDetails = {
    message: err.message,
    stack: err.stack,
    componentName: instance?.$options?.name || instance?.$options?.__name || 'Unknown',
    timestamp: Date.now(),
    info
  }
  
  errorDetails.value = details
  hasError.value = true
  
  // Call custom error handler
  if (props.onError) {
    props.onError(err, details)
  }
  
  // Emit error event
  emit('error', err, details)
  
  // Auto retry if enabled
  if (props.autoRetry && retryCount.value < props.maxRetries) {
    scheduleAutoRetry()
  }
  
  // Prevent error from propagating
  return false
})

/**
 * Schedule auto retry
 */
function scheduleAutoRetry() {
  if (autoRetryTimer.value) {
    clearTimeout(autoRetryTimer.value)
  }
  
  autoRetryTimer.value = window.setTimeout(() => {
    retryCount.value++
    retry()
  }, props.autoRetryDelay)
}

/**
 * Retry error recovery
 */
async function retry() {
  try {
    if (props.onRetry) {
      await props.onRetry()
    }
    
    reset()
    emit('retry')
  } catch (err) {
    console.error('[ErrorBoundary] Retry failed:', err)
  }
}

/**
 * Reset error state
 */
function reset() {
  hasError.value = false
  errorDetails.value = null
  activeCollapse.value = []
  retryCount.value = 0
  
  if (autoRetryTimer.value) {
    clearTimeout(autoRetryTimer.value)
    autoRetryTimer.value = null
  }
  
  if (props.onReset) {
    props.onReset()
  }
  
  emit('reset')
}

/**
 * Handle retry button click
 */
function handleRetry() {
  retry()
}

/**
 * Handle reset button click
 */
function handleReset() {
  reset()
}

/**
 * Handle report button click
 */
function handleReport() {
  if (errorDetails.value) {
    if (props.onReport) {
      props.onReport(errorDetails.value)
    }
    
    emit('report', errorDetails.value)
  }
}

/**
 * Handle go home button click
 */
function handleGoHome() {
  reset()
  router.push('/')
}

/**
 * Expose methods for parent components
 */
defineExpose({
  reset,
  retry,
  hasError: computed(() => hasError.value),
  errorDetails: computed(() => errorDetails.value)
})
</script>

<style scoped lang="scss">
.error-boundary {
  width: 100%;
  height: 100%;
  min-height: inherit;
  
  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 40px 20px;
    background-color: var(--el-bg-color);
  }
  
  &__container {
    max-width: 600px;
    text-align: center;
  }
  
  &__icon {
    margin-bottom: 24px;
    
    :deep(.el-icon) {
      animation: shake 0.5s ease-in-out;
    }
  }
  
  &__title {
    margin: 0 0 16px;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  &__message {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }
  
  &__details {
    margin-bottom: 24px;
    text-align: left;
    
    :deep(.el-collapse) {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      background-color: var(--el-fill-color-light);
    }
    
    :deep(.el-collapse-item__header) {
      padding: 0 16px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      background-color: transparent;
    }
    
    :deep(.el-collapse-item__content) {
      padding: 16px;
    }
  }
  
  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  &__custom-actions {
    margin-top: 16px;
  }
}

.error-details {
  &__item {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    strong {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--el-text-color-primary);
    }
    
    pre {
      margin: 0;
      padding: 12px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
      background-color: var(--el-fill-color-darker);
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    code {
      padding: 2px 6px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
      border-radius: 3px;
    }
    
    span {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

@media (max-width: 768px) {
  .error-boundary {
    &__content {
      padding: 24px 16px;
      min-height: 300px;
    }
    
    &__icon {
      margin-bottom: 16px;
    }
    
    &__title {
      font-size: 20px;
      margin-bottom: 12px;
    }
    
    &__message {
      font-size: 13px;
      margin-bottom: 20px;
    }
    
    &__actions {
      flex-direction: column;
      
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
