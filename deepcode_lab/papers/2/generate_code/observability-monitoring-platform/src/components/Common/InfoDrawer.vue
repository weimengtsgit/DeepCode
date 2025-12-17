<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-overlay" @click="handleBackdropClick">
        <Transition name="drawer-slide">
          <div v-if="isOpen" class="drawer-panel" @click.stop>
            <!-- Header -->
            <div class="drawer-header">
              <h2 class="drawer-title">{{ title }}</h2>
              <button
                v-if="showCloseButton"
                class="close-button"
                aria-label="Close drawer"
                @click="handleClose"
              >
                ✕
              </button>
            </div>

            <!-- Content -->
            <div class="drawer-content">
              <slot name="content">
                <div v-if="content" class="default-content">
                  {{ content }}
                </div>
              </slot>
            </div>

            <!-- Footer Actions -->
            <div v-if="showFooter" class="drawer-footer">
              <slot name="actions">
                <button
                  v-if="showPrimaryAction"
                  class="action-button primary"
                  :disabled="isPrimaryActionDisabled"
                  @click="handlePrimaryAction"
                >
                  {{ primaryActionLabel }}
                </button>
                <button
                  v-if="showSecondaryAction"
                  class="action-button secondary"
                  @click="handleSecondaryAction"
                >
                  {{ secondaryActionLabel }}
                </button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, withDefaults, defineProps, defineEmits } from 'vue'

interface Props {
  isOpen?: boolean
  title?: string
  content?: string
  width?: number | string
  position?: 'right' | 'left'
  showCloseButton?: boolean
  showFooter?: boolean
  showPrimaryAction?: boolean
  showSecondaryAction?: boolean
  primaryActionLabel?: string
  secondaryActionLabel?: string
  isPrimaryActionDisabled?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: 'Details',
  content: '',
  width: 400,
  position: 'right',
  showCloseButton: true,
  showFooter: false,
  showPrimaryAction: false,
  showSecondaryAction: false,
  primaryActionLabel: 'Save',
  secondaryActionLabel: 'Cancel',
  isPrimaryActionDisabled: false,
  closeOnBackdropClick: true,
  closeOnEscape: true,
  isLoading: false,
})

const emit = defineEmits<{
  close: []
  primaryAction: []
  secondaryAction: []
}>()

// Computed properties
const drawerWidth = computed(() => {
  if (typeof props.width === 'number') {
    return `${props.width}px`
  }
  return props.width
})

const drawerPosition = computed(() => {
  return props.position === 'left' ? 'left' : 'right'
})

// Methods
const handleClose = () => {
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdropClick) {
    handleClose()
  }
}

const handlePrimaryAction = () => {
  emit('primaryAction')
}

const handleSecondaryAction = () => {
  emit('secondaryAction')
}

// Keyboard event handling
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeOnEscape && props.isOpen) {
    handleClose()
  }
}

// Lifecycle
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.drawer-panel {
  position: fixed;
  top: 60px;
  bottom: 0;
  width: v-bind(drawerWidth);
  background-color: $color-bg-secondary;
  border-left: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  z-index: 1001;

  &[data-position='left'] {
    left: 0;
    border-left: none;
    border-right: 1px solid $color-border;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: $color-text-primary;
}

.close-button {
  background: none;
  border: none;
  color: $color-text-secondary;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: $color-text-primary;
  }

  &:active {
    color: $color-primary;
  }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: $color-text-primary;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-border;
    border-radius: 4px;

    &:hover {
      background: $color-border-light;
    }
  }
}

.default-content {
  line-height: 1.6;
  font-size: 14px;
}

.drawer-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
  background-color: $color-bg-tertiary;
}

.action-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background-color: $color-primary;
    color: white;

    &:hover:not(:disabled) {
      background-color: lighten($color-primary, 5%);
    }

    &:active:not(:disabled) {
      background-color: darken($color-primary, 5%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background-color: $color-bg-secondary;
    color: $color-text-primary;
    border: 1px solid $color-border;

    &:hover {
      background-color: $color-bg-tertiary;
    }

    &:active {
      background-color: darken($color-bg-tertiary, 5%);
    }
  }
}

// Transitions
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s ease;
}

.drawer-slide-enter-from {
  transform: translateX(100%);
}

.drawer-slide-leave-to {
  transform: translateX(100%);
}

// Responsive
@media (max-width: 768px) {
  .drawer-panel {
    width: 100% !important;
    max-width: 90vw;
  }

  .drawer-footer {
    flex-direction: column-reverse;
  }

  .action-button {
    width: 100%;
  }
}
</style>
