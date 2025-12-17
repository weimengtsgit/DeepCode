<template>
  <div class="app" :class="[`theme-${currentTheme}`, { 'sidebar-collapsed': sidebarCollapsed }]">
    <!-- Main Layout Wrapper -->
    <MainLayout>
      <!-- Router outlet for page views -->
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </router-view>
    </MainLayout>

    <!-- Global Notifications -->
    <div class="notifications-container">
      <Transition-group name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
        >
          <div class="notification-content">
            <span class="notification-message">{{ notification.message }}</span>
            <button class="notification-close" @click="removeNotification(notification.id)">×</button>
          </div>
        </div>
      </Transition-group>
    </div>

    <!-- Global Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>

    <!-- Modal Stack -->
    <div v-if="hasActiveModals" class="modal-stack">
      <Transition-group name="modal" tag="div">
        <div
          v-for="(modal, index) in activeModalStack"
          :key="modal.id"
          :class="['modal-backdrop', { 'modal-active': index === activeModalStack.length - 1 }]"
          @click="closeTopModal"
        >
          <div class="modal-content" @click.stop>
            <component :is="modal.component" v-bind="modal.props" @close="closeModal(modal.id)" />
          </div>
        </div>
      </Transition-group>
    </div>

    <!-- Right Drawer Panel -->
    <Transition name="drawer">
      <div v-if="rightDrawerOpen" class="right-drawer">
        <div class="drawer-header">
          <h3>{{ drawerTitle }}</h3>
          <button class="drawer-close" @click="closeRightDrawer">×</button>
        </div>
        <div class="drawer-content">
          <slot name="drawer-content" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/components/Layout/MainLayout.vue'
import { useUIStore } from '@/stores/uiStore'
import { useTimeStore } from '@/stores/timeStore'
import { useFilterStore } from '@/stores/filterStore'

// Store instances
const uiStore = useUIStore()
const timeStore = useTimeStore()
const filterStore = useFilterStore()

// Router
const router = useRouter()
const route = useRoute()

// Computed properties from stores
const currentTheme = computed(() => uiStore.theme)
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)
const notifications = computed(() => uiStore.notifications)
const isLoading = computed(() => uiStore.isLoading)
const hasActiveModals = computed(() => uiStore.hasActiveModals)
const activeModalStack = computed(() => {
  // Convert Set of modal IDs to array of modal objects
  // This would be managed by uiStore
  return []
})
const rightDrawerOpen = computed(() => uiStore.rightDrawerOpen)
const drawerTitle = computed(() => uiStore.drawerTitle || 'Details')

// Methods
const removeNotification = (id: string) => {
  uiStore.removeNotification(id)
}

const closeTopModal = () => {
  uiStore.closeTopModal()
}

const closeModal = (id: string) => {
  uiStore.closeModal(id)
}

const closeRightDrawer = () => {
  uiStore.closeRightDrawer()
}

// Lifecycle hooks
onMounted(() => {
  // Load persisted UI state
  uiStore.loadUIState()

  // Load persisted time range
  timeStore.loadFromLocalStorage()

  // Load persisted filters
  filterStore.initialize()

  // Apply theme to document
  applyTheme(currentTheme.value)

  // Setup keyboard shortcuts
  setupKeyboardShortcuts()

  // Log app initialization
  console.log('🚀 Observability Monitoring Platform initialized')
})

onUnmounted(() => {
  // Cleanup
  removeKeyboardShortcuts()
})

// Watch for theme changes
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
})

// Watch for route changes to update breadcrumbs
watch(
  () => route.path,
  (newPath) => {
    updateBreadcrumbs(newPath)
  }
)

// Apply theme to document
const applyTheme = (theme: 'dark' | 'light') => {
  const html = document.documentElement
  html.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    html.classList.add('dark-theme')
    html.classList.remove('light-theme')
  } else {
    html.classList.add('light-theme')
    html.classList.remove('dark-theme')
  }
}

// Setup keyboard shortcuts
const setupKeyboardShortcuts = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + K: Focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      // Emit event to focus search (handled by components)
      window.dispatchEvent(new CustomEvent('focus-search'))
    }

    // Escape: Close modals/drawers
    if (event.key === 'Escape') {
      if (hasActiveModals.value) {
        closeTopModal()
      } else if (rightDrawerOpen.value) {
        closeRightDrawer()
      }
    }

    // Ctrl/Cmd + /: Toggle sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault()
      uiStore.toggleSidebar()
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  // Store for cleanup
  ;(window as any).__appKeydownHandler = handleKeyDown
}

// Remove keyboard shortcuts
const removeKeyboardShortcuts = () => {
  const handler = (window as any).__appKeydownHandler
  if (handler) {
    window.removeEventListener('keydown', handler)
    delete (window as any).__appKeydownHandler
  }
}

// Update breadcrumbs based on route
const updateBreadcrumbs = (path: string) => {
  const breadcrumbs = []

  // Always include Dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard'
  })

  // Add current page
  const routeMap: Record<string, { label: string; icon: string }> = {
    '/metrics': { label: 'Metrics', icon: 'metrics' },
    '/tracing': { label: 'Tracing', icon: 'tracing' },
    '/logs': { label: 'Logs', icon: 'logs' },
    '/custom': { label: 'Custom Dashboard', icon: 'custom' }
  }

  if (routeMap[path]) {
    breadcrumbs.push(routeMap[path])
  }

  uiStore.setBreadcrumbs(breadcrumbs)
}
</script>

<style scoped lang="scss">
@import '@/styles/main.scss';

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family);
  transition: background-color 0.3s ease, color 0.3s ease;

  &.theme-dark {
    --color-background: #0b0c0e;
    --color-text: #d8d9da;
    --color-border: rgba(255, 255, 255, 0.1);
  }

  &.theme-light {
    --color-background: #ffffff;
    --color-text: #1a1a1a;
    --color-border: rgba(0, 0, 0, 0.1);
  }

  &.sidebar-collapsed {
    :deep(.sidebar) {
      width: 60px;
    }

    :deep(.main-content) {
      margin-left: 60px;
    }
  }
}

// Notifications container
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  pointer-events: none;

  .notification {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideIn 0.3s ease-out;

    &.notification-success {
      border-left: 4px solid #73bf69;
    }

    &.notification-error {
      border-left: 4px solid #f2495c;
    }

    &.notification-warning {
      border-left: 4px solid #ff9830;
    }

    &.notification-info {
      border-left: 4px solid #3274d9;
    }

    .notification-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .notification-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.5;
    }

    .notification-close {
      background: none;
      border: none;
      color: var(--color-text);
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      margin-left: 12px;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }
  }
}

// Loading overlay
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;

  .loading-spinner {
    text-align: center;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: #3274d9;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    p {
      color: white;
      font-size: 14px;
    }
  }
}

// Modal stack
.modal-stack {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.modal-active {
      opacity: 1;
    }

    .modal-content {
      background-color: var(--color-surface);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s ease-out;
    }
  }
}

// Right drawer
.right-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  animation: drawerSlideIn 0.3s ease-out;

  .drawer-header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .drawer-close {
      background: none;
      border: none;
      color: var(--color-text);
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
}

// Animations
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes modalSlideIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes drawerSlideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

// Transition classes
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
