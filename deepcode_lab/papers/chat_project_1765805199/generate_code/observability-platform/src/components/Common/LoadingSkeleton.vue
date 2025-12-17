<template>
  <div class="loading-skeleton" :class="skeletonClasses">
    <!-- Card Skeleton -->
    <template v-if="type === 'card'">
      <div class="skeleton-card">
        <div v-if="showAvatar" class="skeleton-avatar" :style="avatarStyle"></div>
        <div class="skeleton-content">
          <div class="skeleton-title" :style="titleStyle"></div>
          <div v-for="i in rows" :key="i" class="skeleton-row" :style="getRowStyle(i)"></div>
        </div>
      </div>
    </template>

    <!-- Chart Skeleton -->
    <template v-else-if="type === 'chart'">
      <div class="skeleton-chart" :style="chartStyle">
        <div class="skeleton-chart-header">
          <div class="skeleton-chart-title"></div>
          <div class="skeleton-chart-legend">
            <div v-for="i in 3" :key="i" class="skeleton-legend-item"></div>
          </div>
        </div>
        <div class="skeleton-chart-body">
          <div class="skeleton-chart-yaxis"></div>
          <div class="skeleton-chart-content">
            <div v-for="i in 8" :key="i" class="skeleton-chart-bar" :style="getBarStyle(i)"></div>
          </div>
        </div>
        <div class="skeleton-chart-xaxis"></div>
      </div>
    </template>

    <!-- Table Skeleton -->
    <template v-else-if="type === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table-header">
          <div v-for="i in columns" :key="i" class="skeleton-table-cell"></div>
        </div>
        <div v-for="i in rows" :key="i" class="skeleton-table-row">
          <div v-for="j in columns" :key="j" class="skeleton-table-cell" :style="getTableCellStyle(j)"></div>
        </div>
      </div>
    </template>

    <!-- List Skeleton -->
    <template v-else-if="type === 'list'">
      <div class="skeleton-list">
        <div v-for="i in rows" :key="i" class="skeleton-list-item">
          <div v-if="showAvatar" class="skeleton-avatar" :style="avatarStyle"></div>
          <div class="skeleton-list-content">
            <div class="skeleton-list-title"></div>
            <div class="skeleton-list-description"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Text Skeleton -->
    <template v-else-if="type === 'text'">
      <div class="skeleton-text">
        <div v-for="i in rows" :key="i" class="skeleton-text-row" :style="getTextRowStyle(i)"></div>
      </div>
    </template>

    <!-- Custom Skeleton -->
    <template v-else-if="type === 'custom'">
      <slot></slot>
    </template>

    <!-- Default: Rectangle -->
    <template v-else>
      <div class="skeleton-rect" :style="rectStyle"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';

/**
 * LoadingSkeleton Component
 * 
 * Provides skeleton screen loading states for various content types
 * with animated shimmer effect for better perceived performance.
 * 
 * @example
 * <LoadingSkeleton type="chart" :height="300" />
 * <LoadingSkeleton type="table" :rows="5" :columns="4" />
 * <LoadingSkeleton type="card" :rows="3" show-avatar />
 */

interface Props {
  /** Skeleton type */
  type?: 'card' | 'chart' | 'table' | 'list' | 'text' | 'rect' | 'custom';
  /** Number of rows (for card, table, list, text) */
  rows?: number;
  /** Number of columns (for table) */
  columns?: number;
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Show avatar (for card, list) */
  showAvatar?: boolean;
  /** Avatar size */
  avatarSize?: number;
  /** Avatar shape */
  avatarShape?: 'circle' | 'square';
  /** Enable animation */
  animated?: boolean;
  /** Animation speed */
  animationSpeed?: 'slow' | 'normal' | 'fast';
  /** Border radius */
  borderRadius?: string | number;
  /** Custom class */
  customClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'rect',
  rows: 3,
  columns: 4,
  width: '100%',
  height: 'auto',
  showAvatar: false,
  avatarSize: 40,
  avatarShape: 'circle',
  animated: true,
  animationSpeed: 'normal',
  borderRadius: '4px',
  customClass: '',
});

// Computed classes
const skeletonClasses = computed(() => ({
  'skeleton-animated': props.animated,
  [`skeleton-speed-${props.animationSpeed}`]: props.animated,
  [props.customClass]: props.customClass,
}));

// Avatar style
const avatarStyle = computed<CSSProperties>(() => ({
  width: `${props.avatarSize}px`,
  height: `${props.avatarSize}px`,
  borderRadius: props.avatarShape === 'circle' ? '50%' : props.borderRadius,
}));

// Title style
const titleStyle = computed<CSSProperties>(() => ({
  width: '60%',
  height: '20px',
  borderRadius: props.borderRadius,
}));

// Chart style
const chartStyle = computed<CSSProperties>(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}));

// Rectangle style
const rectStyle = computed<CSSProperties>(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  borderRadius: typeof props.borderRadius === 'number' ? `${props.borderRadius}px` : props.borderRadius,
}));

// Get row style with varying widths
const getRowStyle = (index: number): CSSProperties => {
  const widths = ['100%', '95%', '90%', '85%', '80%'];
  return {
    width: widths[index % widths.length],
    height: '14px',
    borderRadius: props.borderRadius,
  };
};

// Get bar style for chart skeleton
const getBarStyle = (index: number): CSSProperties => {
  const heights = [60, 80, 50, 90, 70, 85, 65, 75];
  return {
    height: `${heights[index % heights.length]}%`,
  };
};

// Get table cell style with varying widths
const getTableCellStyle = (index: number): CSSProperties => {
  const widths = ['25%', '20%', '30%', '25%'];
  return {
    width: widths[index % widths.length],
  };
};

// Get text row style
const getTextRowStyle = (index: number): CSSProperties => {
  const widths = ['100%', '95%', '90%', '85%', '60%'];
  return {
    width: widths[index % widths.length],
    height: '16px',
    borderRadius: props.borderRadius,
  };
};
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.loading-skeleton {
  width: 100%;
}

// Base skeleton element
.skeleton-element {
  background: linear-gradient(
    90deg,
    $background-card 0%,
    lighten($background-card, 3%) 50%,
    $background-card 100%
  );
  background-size: 200% 100%;
}

// Animation
.skeleton-animated {
  .skeleton-element,
  .skeleton-avatar,
  .skeleton-title,
  .skeleton-row,
  .skeleton-rect,
  .skeleton-chart-title,
  .skeleton-legend-item,
  .skeleton-chart-yaxis,
  .skeleton-chart-bar,
  .skeleton-chart-xaxis,
  .skeleton-table-cell,
  .skeleton-list-title,
  .skeleton-list-description,
  .skeleton-text-row {
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  &.skeleton-speed-slow {
    .skeleton-element,
    .skeleton-avatar,
    .skeleton-title,
    .skeleton-row,
    .skeleton-rect,
    .skeleton-chart-title,
    .skeleton-legend-item,
    .skeleton-chart-yaxis,
    .skeleton-chart-bar,
    .skeleton-chart-xaxis,
    .skeleton-table-cell,
    .skeleton-list-title,
    .skeleton-list-description,
    .skeleton-text-row {
      animation-duration: 2.5s;
    }
  }

  &.skeleton-speed-fast {
    .skeleton-element,
    .skeleton-avatar,
    .skeleton-title,
    .skeleton-row,
    .skeleton-rect,
    .skeleton-chart-title,
    .skeleton-legend-item,
    .skeleton-chart-yaxis,
    .skeleton-chart-bar,
    .skeleton-chart-xaxis,
    .skeleton-table-cell,
    .skeleton-list-title,
    .skeleton-list-description,
    .skeleton-text-row {
      animation-duration: 1s;
    }
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Card Skeleton
.skeleton-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $background-card;
  border-radius: 8px;

  .skeleton-avatar {
    flex-shrink: 0;
    @extend .skeleton-element;
  }

  .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;

    .skeleton-title {
      @extend .skeleton-element;
    }

    .skeleton-row {
      @extend .skeleton-element;
    }
  }
}

// Chart Skeleton
.skeleton-chart {
  padding: $spacing-lg;
  background: $background-card;
  border-radius: 8px;

  .skeleton-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    .skeleton-chart-title {
      width: 150px;
      height: 20px;
      border-radius: 4px;
      @extend .skeleton-element;
    }

    .skeleton-chart-legend {
      display: flex;
      gap: $spacing-md;

      .skeleton-legend-item {
        width: 60px;
        height: 16px;
        border-radius: 4px;
        @extend .skeleton-element;
      }
    }
  }

  .skeleton-chart-body {
    display: flex;
    gap: $spacing-md;
    height: 200px;
    margin-bottom: $spacing-sm;

    .skeleton-chart-yaxis {
      width: 40px;
      border-radius: 4px;
      @extend .skeleton-element;
    }

    .skeleton-chart-content {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: $spacing-sm;

      .skeleton-chart-bar {
        flex: 1;
        border-radius: 4px 4px 0 0;
        @extend .skeleton-element;
      }
    }
  }

  .skeleton-chart-xaxis {
    height: 30px;
    border-radius: 4px;
    @extend .skeleton-element;
  }
}

// Table Skeleton
.skeleton-table {
  background: $background-card;
  border-radius: 8px;
  overflow: hidden;

  .skeleton-table-header {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    background: lighten($background-card, 2%);
    border-bottom: 1px solid $border-default;

    .skeleton-table-cell {
      height: 16px;
      border-radius: 4px;
      @extend .skeleton-element;
    }
  }

  .skeleton-table-row {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $border-default;

    &:last-child {
      border-bottom: none;
    }

    .skeleton-table-cell {
      height: 14px;
      border-radius: 4px;
      @extend .skeleton-element;
    }
  }
}

// List Skeleton
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .skeleton-list-item {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-md;
    background: $background-card;
    border-radius: 8px;

    .skeleton-avatar {
      flex-shrink: 0;
      @extend .skeleton-element;
    }

    .skeleton-list-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;

      .skeleton-list-title {
        width: 60%;
        height: 16px;
        border-radius: 4px;
        @extend .skeleton-element;
      }

      .skeleton-list-description {
        width: 90%;
        height: 14px;
        border-radius: 4px;
        @extend .skeleton-element;
      }
    }
  }
}

// Text Skeleton
.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .skeleton-text-row {
    @extend .skeleton-element;
  }
}

// Rectangle Skeleton
.skeleton-rect {
  @extend .skeleton-element;
}
</style>
