<template>
  <div class="page-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Page Header with Breadcrumbs and Title -->
    <div class="page-header">
      <div class="header-left">
        <Breadcrumbs />
      </div>
      <div class="header-right">
        <!-- Optional: Page-level actions can be slotted here -->
        <slot name="header-actions"></slot>
      </div>
    </div>

    <!-- Main Content Area with Scrolling -->
    <div class="content-wrapper">
      <div class="content-inner">
        <!-- Loading Skeleton Overlay -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>{{ loadingMessage }}</p>
          </div>
        </div>

        <!-- Error State Display -->
        <div v-if="hasError && !isLoading" class="error-container">
          <ErrorState
            :error="error"
            :title="errorTitle"
            @retry="$emit('retry')"
          />
        </div>

        <!-- Main Content Slot -->
        <div v-if="!hasError || !isLoading" class="content-body">
          <slot></slot>
        </div>
      </div>
    </div>

    <!-- Floating Action Button (Optional) -->
    <div v-if="showFAB" class="fab-container">
      <slot name="fab"></slot>
    </div>

    <!-- Scroll-to-Top Button -->
    <transition name="fade">
      <button
        v-if="showScrollToTop"
        class="scroll-to-top-btn"
        @click="scrollToTop"
        title="Scroll to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import Breadcrumbs from './Breadcrumbs.vue'
import ErrorState from '@/components/Common/ErrorState.vue'

/**
 * PageContent Component
 * 
 * Wraps the main scrollable content area of the application.
 * Positioned to the right of the Sidebar and below the Header.
 * Handles loading states, error states, and scroll-to-top functionality.
 */

// Props
interface Props {
  isLoading?: boolean
  loadingMessage?: string
  hasError?: boolean
  error?: Error | null
  errorTitle?: string
  showFAB?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  loadingMessage: 'Loading...',
  hasError: false,
  error: null,
  errorTitle: 'Something went wrong',
  showFAB: false
})

// Emits
const emit = defineEmits<{
  retry: []
}>()

// Store
const uiStore = useUIStore()

// Computed
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)

// Scroll-to-top button visibility
const showScrollToTop = ref(false)
const contentWrapper = ref<HTMLElement | null>(null)

// Methods
const scrollToTop = () => {
  if (contentWrapper.value) {
    contentWrapper.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

const handleScroll = () => {
  if (contentWrapper.value) {
    showScrollToTop.value = contentWrapper.value.scrollTop > 300
  }
}

// Lifecycle
onMounted(() => {
  if (contentWrapper.value) {
    contentWrapper.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (contentWrapper.value) {
    contentWrapper.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.page-content {
  position: fixed;
  top: 60px; // Height of header
  left: 260px; // Width of expanded sidebar
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: $color-bg-primary;
  transition: left 0.3s ease;
  z-index: 10;

  &.sidebar-collapsed {
    left: 80px; // Width of collapsed sidebar
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: $color-bg-secondary;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
  height: 60px;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-left: 16px;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  // Custom scrollbar styling
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

  // Firefox scrollbar
  scrollbar-color: $color-border transparent;
  scrollbar-width: thin;
}

.content-inner {
  position: relative;
  min-height: 100%;
}

.content-body {
  padding: 24px;
  animation: fadeIn 0.3s ease-in-out;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(11, 12, 14, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  p {
    color: $color-text-primary;
    font-size: 14px;
    margin: 0;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $color-border;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
}

.scroll-to-top-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: $color-primary;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(50, 116, 217, 0.3);
  transition: all 0.3s ease;
  z-index: 40;

  &:hover {
    background-color: lighten($color-primary, 10%);
    box-shadow: 0 6px 16px rgba(50, 116, 217, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive adjustments
@media (max-width: 1400px) {
  .page-content {
    left: 80px;

    &.sidebar-collapsed {
      left: 80px;
    }
  }
}

@media (max-width: 1024px) {
  .page-header {
    padding: 12px 16px;
    height: 50px;
  }

  .content-body {
    padding: 16px;
  }

  .fab-container,
  .scroll-to-top-btn {
    bottom: 16px;
    right: 16px;
  }
}
</style>
