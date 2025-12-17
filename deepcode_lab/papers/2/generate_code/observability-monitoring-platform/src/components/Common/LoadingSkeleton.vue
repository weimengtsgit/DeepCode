<template>
  <div class="loading-skeleton" :class="{ 'skeleton-circle': circle }">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton-item"
      :style="{
        width: width,
        height: height,
        borderRadius: circle ? '50%' : '4px',
        marginBottom: i < count ? '12px' : '0'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from 'vue'

interface Props {
  width?: string | number
  height?: string | number
  count?: number
  circle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '16px',
  count: 3,
  circle: false
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .skeleton-item {
    background: linear-gradient(
      90deg,
      $color-bg-tertiary 0%,
      $color-bg-secondary 50%,
      $color-bg-tertiary 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  &.skeleton-circle {
    .skeleton-item {
      border-radius: 50%;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-skeleton .skeleton-item {
    animation: none;
    background: $color-bg-tertiary;
  }
}
</style>
