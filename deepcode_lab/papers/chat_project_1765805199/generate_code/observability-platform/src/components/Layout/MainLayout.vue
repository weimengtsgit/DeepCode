<template>
  <div class="main-layout">
    <!-- Sidebar Navigation -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle="handleSidebarToggle"
    />

    <!-- Main Content Area -->
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Top Bar -->
      <Topbar
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="handleSidebarToggle"
      />

      <!-- Page Content with Error Boundary -->
      <div class="content-wrapper">
        <ErrorBoundary
          :show-details="true"
          :show-retry="true"
          :show-reset="true"
          :show-home="true"
          @retry="handleErrorRetry"
          @reset="handleErrorReset"
        >
          <div class="page-content">
            <router-view v-slot="{ Component, route }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </div>
        </ErrorBoundary>
      </div>
    </div>

    <!-- Global Loading Overlay -->
    <transition name="fade">
      <div v-if="globalLoading" class="global-loading-overlay">
        <div class="loading-spinner">
          <el-icon :size="48" class="is-loading">
            <Loading />
          </el-icon>
          <p class="loading-text">{{ loadingText }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import ErrorBoundary from '@/components/Common/ErrorBoundary.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

// ============================================================================
// State Management
// ============================================================================

const router = useRouter()
const route = useRoute()

// Sidebar state with localStorage persistence
const sidebarCollapsed = useLocalStorage('sidebar-collapsed', false)

// Global loading state
const globalLoading = ref(false)
const loadingText = ref('加载中...')

// ============================================================================
// Computed Properties
// ============================================================================

const contentClass = computed(() => ({
  'sidebar-collapsed': sidebarCollapsed.value,
}))

// ============================================================================
// Sidebar Management
// ============================================================================

/**
 * Toggle sidebar collapsed state
 */
const handleSidebarToggle = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/**
 * Auto-collapse sidebar on mobile
 */
const checkMobileView = () => {
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle error retry action
 */
const handleErrorRetry = () => {
  // Reload current route
  router.go(0)
}

/**
 * Handle error reset action
 */
const handleErrorReset = () => {
  // Navigate to dashboard
  router.push('/dashboard')
}

// ============================================================================
// Loading State Management
// ============================================================================

/**
 * Show global loading overlay
 */
const showLoading = (text: string = '加载中...') => {
  globalLoading.value = true
  loadingText.value = text
}

/**
 * Hide global loading overlay
 */
const hideLoading = () => {
  globalLoading.value = false
}

/**
 * Router navigation guards for loading states
 */
router.beforeEach((to, from, next) => {
  // Show loading for route changes
  if (to.path !== from.path) {
    showLoading('页面加载中...')
  }
  next()
})

router.afterEach(() => {
  // Hide loading after route change
  setTimeout(() => {
    hideLoading()
  }, 300)
})

// ============================================================================
// Lifecycle Hooks
// ============================================================================

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // Check initial mobile view
  checkMobileView()

  // Add resize listener
  window.addEventListener('resize', checkMobileView)

  // Setup resize observer for responsive behavior
  resizeObserver = new ResizeObserver(() => {
    checkMobileView()
  })

  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    resizeObserver.observe(mainContent)
  }
})

onUnmounted(() => {
  // Cleanup listeners
  window.removeEventListener('resize', checkMobileView)
  
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// ============================================================================
// Expose Methods (for parent components)
// ============================================================================

defineExpose({
  showLoading,
  hideLoading,
  toggleSidebar: handleSidebarToggle,
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: $background-primary;
}

// ============================================================================
// Main Content Area
// ============================================================================

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - #{$sidebar-width});
  height: 100vh;
  margin-left: $sidebar-width;
  transition: margin-left $animation-duration-normal $animation-easing,
              width $animation-duration-normal $animation-easing;
  overflow: hidden;

  &.sidebar-collapsed {
    margin-left: $sidebar-width-collapsed;
    width: calc(100% - #{$sidebar-width-collapsed});
  }
}

// ============================================================================
// Content Wrapper
// ============================================================================

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $background-primary;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: $spacing-lg;
  
  // Custom scrollbar for dark theme
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: $background-secondary;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-hover;
    border-radius: 4px;
    
    &:hover {
      background: lighten($border-hover, 10%);
    }
  }
}

// ============================================================================
// Global Loading Overlay
// ============================================================================

.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(11, 12, 14, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  
  .el-icon {
    color: $accent-primary;
  }
}

.loading-text {
  color: $text-primary;
  font-size: $font-size-body;
  margin: 0;
}

// ============================================================================
// Page Transitions
// ============================================================================

.fade-enter-active,
.fade-leave-active {
  transition: opacity $animation-duration-normal $animation-easing;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// ============================================================================
// Responsive Design
// ============================================================================

@media (max-width: 1024px) {
  .page-content {
    padding: $spacing-md;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    
    &.sidebar-collapsed {
      margin-left: 0;
      width: 100%;
    }
  }

  .page-content {
    padding: $spacing-sm;
  }
}

// ============================================================================
// Print Styles
// ============================================================================

@media print {
  .main-layout {
    display: block;
    height: auto;
  }

  .main-content {
    margin-left: 0;
    width: 100%;
  }

  .global-loading-overlay {
    display: none;
  }
}
</style>
