<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <div class="empty-state__icon">
      <svg
        v-if="!customIcon"
        class="empty-state__svg"
        :class="`empty-state__svg--${iconType}`"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- No Data Icon -->
        <g v-if="iconType === 'no-data'">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M 20 32 Q 32 44 44 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <circle cx="24" cy="24" r="2" fill="currentColor" />
          <circle cx="40" cy="24" r="2" fill="currentColor" />
        </g>

        <!-- No Results Icon -->
        <g v-else-if="iconType === 'no-results'">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M 20 20 L 44 44 M 44 20 L 20 44" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- Empty Folder Icon -->
        <g v-else-if="iconType === 'empty-folder'">
          <path d="M 12 16 L 12 52 Q 12 56 16 56 L 48 56 Q 52 56 52 52 L 52 20 Q 52 16 48 16 L 28 16 L 24 12 Q 20 12 20 16 L 20 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        </g>

        <!-- Error Icon -->
        <g v-else-if="iconType === 'error'">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M 32 20 L 32 36" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <circle cx="32" cy="44" r="2" fill="currentColor" />
        </g>
      </svg>
      <slot v-else name="icon">
        <component :is="customIcon" class="empty-state__custom-icon" />
      </slot>
    </div>

    <h3 class="empty-state__title">{{ title }}</h3>

    <p v-if="description" class="empty-state__description">{{ description }}</p>

    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions" />
    </div>

    <button
      v-if="showActionButton && actionButtonLabel"
      class="empty-state__button"
      :class="{ 'empty-state__button--primary': actionButtonPrimary }"
      @click="$emit('action')"
    >
      {{ actionButtonLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /**
   * Type of empty state icon to display
   * @default 'no-data'
   */
  iconType?: 'no-data' | 'no-results' | 'empty-folder' | 'error'

  /**
   * Custom icon component to use instead of built-in icons
   */
  customIcon?: any

  /**
   * Main title text
   * @default 'No Data Available'
   */
  title?: string

  /**
   * Description text below title
   */
  description?: string

  /**
   * Label for action button
   */
  actionButtonLabel?: string

  /**
   * Whether to show action button
   * @default false
   */
  showActionButton?: boolean

  /**
   * Whether action button should be primary style
   * @default true
   */
  actionButtonPrimary?: boolean

  /**
   * Compact layout (smaller spacing)
   * @default false
   */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconType: 'no-data',
  title: 'No Data Available',
  showActionButton: false,
  actionButtonPrimary: true,
  compact: false
})

defineEmits<{
  action: []
}>()

// Computed properties for styling
const iconColor = computed(() => {
  switch (props.iconType) {
    case 'error':
      return '#f2495c' // error red
    case 'no-results':
      return '#ff9830' // warning orange
    default:
      return '#73bf69' // success green
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  min-height: 300px;

  &--compact {
    padding: 24px 16px;
    min-height: 200px;
  }
}

.empty-state__icon {
  margin-bottom: 24px;

  .empty-state--compact & {
    margin-bottom: 16px;
  }
}

.empty-state__svg {
  width: 80px;
  height: 80px;
  color: $color-text-tertiary;
  opacity: 0.6;

  .empty-state--compact & {
    width: 60px;
    height: 60px;
  }

  &--error {
    color: $color-error;
  }

  &--no-results {
    color: $color-warning;
  }

  &--empty-folder {
    color: $color-primary;
  }
}

.empty-state__custom-icon {
  width: 80px;
  height: 80px;

  .empty-state--compact & {
    width: 60px;
    height: 60px;
  }
}

.empty-state__title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1.4;

  .empty-state--compact & {
    font-size: 16px;
    margin-bottom: 8px;
  }
}

.empty-state__description {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: $color-text-secondary;
  line-height: 1.6;
  max-width: 400px;

  .empty-state--compact & {
    font-size: 13px;
    margin-bottom: 16px;
  }
}

.empty-state__actions {
  margin-bottom: 16px;
}

.empty-state__button {
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: transparent;
  color: $color-text-primary;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: $color-bg-tertiary;
    border-color: $color-border-light;
  }

  &:active {
    transform: scale(0.98);
  }

  &--primary {
    background-color: $color-primary;
    border-color: $color-primary;
    color: white;

    &:hover {
      background-color: lighten($color-primary, 5%);
      border-color: lighten($color-primary, 5%);
    }
  }
}
</style>
