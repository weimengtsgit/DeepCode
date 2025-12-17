<template>
  <div class="error-state" :class="{ compact }">
    <!-- Error Icon -->
    <div class="error-icon-wrapper">
      <slot name="icon">
        <svg
          v-if="!customIcon"
          class="error-icon"
          :style="{ color: errorColor }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <!-- Error/Alert Icon -->
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <component v-else :is="customIcon" class="error-icon" />
      </slot>
    </div>

    <!-- Error Title -->
    <h3 class="error-title">{{ title }}</h3>

    <!-- Error Description -->
    <p v-if="description" class="error-description">{{ description }}</p>

    <!-- Error Code (if provided) -->
    <p v-if="errorCode" class="error-code">Error Code: {{ errorCode }}</p>

    <!-- Error Details (if provided) -->
    <details v-if="showDetails && errorDetails" class="error-details">
      <summary>Technical Details</summary>
      <pre class="error-details-content">{{ errorDetails }}</pre>
    </details>

    <!-- Action Buttons -->
    <div v-if="showRetryButton || showActionButton || $slots.actions" class="error-actions">
      <slot name="actions">
        <button
          v-if="showRetryButton"
          class="btn btn-primary"
          @click="handleRetry"
        >
          {{ retryButtonLabel }}
        </button>
        <button
          v-if="showActionButton"
          class="btn"
          :class="{ 'btn-primary': actionButtonPrimary, 'btn-secondary': !actionButtonPrimary }"
          @click="handleAction"
        >
          {{ actionButtonLabel }}
        </button>
      </slot>
    </div>

    <!-- Support Link -->
    <p v-if="showSupportLink" class="error-support">
      Need help?
      <a href="#" @click.prevent="handleSupportClick">Contact Support</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps, defineEmits } from 'vue'

interface Props {
  title?: string
  description?: string
  errorCode?: string | number
  errorDetails?: string
  showDetails?: boolean
  customIcon?: any
  showRetryButton?: boolean
  retryButtonLabel?: string
  showActionButton?: boolean
  actionButtonLabel?: string
  actionButtonPrimary?: boolean
  showSupportLink?: boolean
  compact?: boolean
  severity?: 'error' | 'warning' | 'critical'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  description: 'An unexpected error occurred. Please try again.',
  showDetails: false,
  showRetryButton: true,
  retryButtonLabel: 'Retry',
  showActionButton: false,
  actionButtonLabel: 'Action',
  actionButtonPrimary: true,
  showSupportLink: false,
  compact: false,
  severity: 'error'
})

const emit = defineEmits<{
  retry: []
  action: []
  support: []
}>()

// Computed property for error color based on severity
const errorColor = computed(() => {
  switch (props.severity) {
    case 'critical':
      return '#f2495c' // Red
    case 'warning':
      return '#ff9830' // Orange
    case 'error':
    default:
      return '#f2495c' // Red
  }
})

// Event handlers
const handleRetry = () => {
  emit('retry')
}

const handleAction = () => {
  emit('action')
}

const handleSupportClick = () => {
  emit('support')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 48px 24px;
  text-align: center;
  background: $color-bg-secondary;
  border-radius: 8px;
  border: 1px solid $color-border;

  &.compact {
    min-height: 250px;
    padding: 32px 16px;
  }
}

.error-icon-wrapper {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-icon {
  width: 80px;
  height: 80px;
  color: #f2495c;
  opacity: 0.8;

  .compact & {
    width: 60px;
    height: 60px;
  }
}

.error-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1.4;

  .compact & {
    font-size: 18px;
    margin-bottom: 8px;
  }
}

.error-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: $color-text-secondary;
  line-height: 1.6;
  max-width: 500px;

  .compact & {
    font-size: 13px;
    margin-bottom: 12px;
  }
}

.error-code {
  margin: 8px 0;
  font-size: 12px;
  color: $color-text-tertiary;
  font-family: 'Monaco', 'Courier New', monospace;
  background: $color-bg-tertiary;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.error-details {
  margin: 16px 0;
  text-align: left;
  max-width: 600px;
  width: 100%;
  background: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  padding: 0;

  summary {
    padding: 12px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    user-select: none;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  &[open] summary {
    border-bottom: 1px solid $color-border;
  }
}

.error-details-content {
  margin: 0;
  padding: 12px 16px;
  font-size: 11px;
  color: $color-text-tertiary;
  font-family: 'Monaco', 'Courier New', monospace;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
  justify-content: center;

  .compact & {
    margin-top: 16px;
    gap: 8px;
  }
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &.btn-primary {
    background-color: $color-primary;
    color: white;

    &:hover {
      background-color: lighten($color-primary, 5%);
    }

    &:active {
      background-color: darken($color-primary, 5%);
    }
  }

  &.btn-secondary {
    background-color: transparent;
    color: $color-primary;
    border: 1px solid $color-primary;

    &:hover {
      background-color: rgba($color-primary, 0.1);
    }

    &:active {
      background-color: rgba($color-primary, 0.2);
    }
  }

  .compact & {
    padding: 8px 16px;
    font-size: 13px;
  }
}

.error-support {
  margin-top: 24px;
  font-size: 12px;
  color: $color-text-tertiary;

  a {
    color: $color-primary;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: lighten($color-primary, 10%);
      text-decoration: underline;
    }
  }

  .compact & {
    margin-top: 16px;
  }
}
</style>
