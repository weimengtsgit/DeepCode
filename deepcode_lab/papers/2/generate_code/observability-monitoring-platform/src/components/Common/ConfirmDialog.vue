<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="confirm-dialog-overlay" @click="handleBackdropClick">
        <div class="confirm-dialog-container" @click.stop>
          <!-- Dialog Header -->
          <div class="confirm-dialog-header">
            <div class="header-content">
              <div v-if="showIcon" class="dialog-icon" :class="`icon-${severity}`">
                <svg v-if="severity === 'warning'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                <svg v-else-if="severity === 'error'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h2 class="dialog-title">{{ title }}</h2>
            </div>
            <button v-if="showCloseButton" class="close-button" @click="handleCancel" aria-label="Close dialog">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          </div>

          <!-- Dialog Content -->
          <div class="confirm-dialog-content">
            <p v-if="message" class="dialog-message">{{ message }}</p>
            <slot name="content" />
          </div>

          <!-- Dialog Footer -->
          <div class="confirm-dialog-footer">
            <slot name="actions">
              <button
                class="dialog-button button-secondary"
                @click="handleCancel"
                :disabled="isLoading"
              >
                {{ cancelButtonLabel }}
              </button>
              <button
                class="dialog-button button-primary"
                :class="`button-${severity}`"
                @click="handleConfirm"
                :disabled="isLoading || !isConfirmEnabled"
              >
                <span v-if="isLoading" class="button-spinner"></span>
                {{ confirmButtonLabel }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, withDefaults } from 'vue'

interface Props {
  isOpen: boolean
  title: string
  message?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  confirmButtonLabel?: string
  cancelButtonLabel?: string
  showIcon?: boolean
  showCloseButton?: boolean
  isLoading?: boolean
  isConfirmEnabled?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'info',
  confirmButtonLabel: 'Confirm',
  cancelButtonLabel: 'Cancel',
  showIcon: true,
  showCloseButton: true,
  isLoading: false,
  isConfirmEnabled: true,
  closeOnBackdropClick: true,
  closeOnEscape: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

// Handle escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeOnEscape && props.isOpen) {
    handleCancel()
  }
}

// Watch for open state changes
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  }
)

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

const handleConfirm = () => {
  if (!props.isLoading && props.isConfirmEnabled) {
    emit('confirm')
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdropClick) {
    handleCancel()
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.confirm-dialog-container {
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid $color-border-light;
  gap: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.dialog-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }

  &.icon-info {
    background-color: rgba($color-primary, 0.1);
    color: $color-primary;
  }

  &.icon-warning {
    background-color: rgba(#ff9830, 0.1);
    color: #ff9830;
  }

  &.icon-error {
    background-color: rgba($color-error, 0.1);
    color: $color-error;
  }

  &.icon-success {
    background-color: rgba(#73bf69, 0.1);
    color: #73bf69;
  }
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1.4;
}

.close-button {
  background: none;
  border: none;
  color: $color-text-secondary;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
  }

  &:active {
    background-color: $color-border;
  }
}

.confirm-dialog-content {
  padding: 24px;
  color: $color-text-secondary;
  font-size: 14px;
  line-height: 1.6;
}

.dialog-message {
  margin: 0;
  color: $color-text-secondary;
}

.confirm-dialog-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid $color-border-light;
  justify-content: flex-end;
}

.dialog-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.button-secondary {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;
    border: 1px solid $color-border;

    &:hover:not(:disabled) {
      background-color: $color-border;
    }

    &:active:not(:disabled) {
      background-color: $color-border-light;
    }
  }

  &.button-primary {
    color: white;
    border: none;

    &.button-info {
      background-color: $color-primary;

      &:hover:not(:disabled) {
        background-color: darken($color-primary, 10%);
      }

      &:active:not(:disabled) {
        background-color: darken($color-primary, 15%);
      }
    }

    &.button-warning {
      background-color: #ff9830;

      &:hover:not(:disabled) {
        background-color: darken(#ff9830, 10%);
      }

      &:active:not(:disabled) {
        background-color: darken(#ff9830, 15%);
      }
    }

    &.button-error {
      background-color: $color-error;

      &:hover:not(:disabled) {
        background-color: darken($color-error, 10%);
      }

      &:active:not(:disabled) {
        background-color: darken($color-error, 15%);
      }
    }

    &.button-success {
      background-color: #73bf69;

      &:hover:not(:disabled) {
        background-color: darken(#73bf69, 10%);
      }

      &:active:not(:disabled) {
        background-color: darken(#73bf69, 15%);
      }
    }
  }
}

.button-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive
@media (max-width: 768px) {
  .confirm-dialog-container {
    width: 95%;
    max-width: 100%;
  }

  .confirm-dialog-header,
  .confirm-dialog-content,
  .confirm-dialog-footer {
    padding: 16px;
  }

  .dialog-title {
    font-size: 16px;
  }

  .confirm-dialog-footer {
    flex-direction: column-reverse;
  }

  .dialog-button {
    width: 100%;
  }
}
</style>
