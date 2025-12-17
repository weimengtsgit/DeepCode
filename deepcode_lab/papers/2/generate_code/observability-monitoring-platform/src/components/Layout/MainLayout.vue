<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Header (fixed top) -->
    <Header />

    <!-- Main content area with sidebar -->
    <div class="layout-container">
      <!-- Sidebar (fixed left) -->
      <Sidebar />

      <!-- Content area (scrollable) -->
      <PageContent>
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </router-view>
      </PageContent>
    </div>

    <!-- Right drawer (for detail panels) -->
    <InfoDrawer v-if="rightDrawerOpen" :title="drawerTitle" @close="closeRightDrawer">
      <slot name="drawer-content" />
    </InfoDrawer>

    <!-- Modal stack (for dialogs and confirmations) -->
    <div v-if="hasActiveModals" class="modal-backdrop" @click="closeTopModal">
      <Transition name="modal-fade">
        <div v-if="activeModalStack.length > 0" class="modal-container" @click.stop>
          <component :is="activeModalStack[activeModalStack.length - 1].component" v-bind="activeModalStack[activeModalStack.length - 1].props" />
        </div>
      </Transition>
    </div>

    <!-- Notification stack (top-right corner) -->
    <div class="notification-stack">
      <Transition-group name="notification" tag="div">
        <div v-for="notification in notifications" :key="notification.id" class="notification-item" :class="`notification-${notification.type}`">
          <div class="notification-content">
            <span class="notification-message">{{ notification.message }}</span>
            <button class="notification-close" @click="removeNotification(notification.id)">×</button>
          </div>
        </div>
      </Transition-group>
    </div>

    <!-- Loading overlay (global) -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <p class="loading-text">Loading...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import PageContent from './PageContent.vue'
import InfoDrawer from '../Common/InfoDrawer.vue'

// Get UI store
const uiStore = useUIStore()

// Computed properties from store
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)
const rightDrawerOpen = computed(() => uiStore.rightDrawerOpen)
const drawerTitle = computed(() => uiStore.drawerTitle || 'Details')
const notifications = computed(() => uiStore.notifications)
const isLoading = computed(() => uiStore.isLoading)
const hasActiveModals = computed(() => uiStore.hasActiveModals)
const activeModalStack = computed(() => uiStore.activeModals)

// Methods
const removeNotification = (id: string) => {
  uiStore.removeNotification(id)
}

const closeTopModal = () => {
  uiStore.closeTopModal()
}

const closeRightDrawer = () => {
  uiStore.closeRightDrawer()
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: $bg-primary;
  color: $text-primary;
  overflow: hidden;

  &.sidebar-collapsed {
    .layout-container {
      margin-left: $sidebar-width-collapsed;
    }
  }
}

.layout-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-left: $sidebar-width;
  transition: margin-left 0.3s ease;
}

// Modal backdrop
.modal-backdrop {
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
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background-color: $bg-secondary;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  animation: slideUp 0.3s ease;
}

// Notification stack
.notification-stack {
  position: fixed;
  top: $header-height + 16px;
  right: 16px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.notification-item {
  pointer-events: auto;
  background-color: $bg-secondary;
  border-left: 4px solid $color-info;
  border-radius: 4px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
  animation: slideInRight 0.3s ease;

  &.notification-success {
    border-left-color: $color-success;
  }

  &.notification-error {
    border-left-color: $color-error;
  }

  &.notification-warning {
    border-left-color: $color-warning;
  }

  &.notification-info {
    border-left-color: $color-info;
  }
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.notification-message {
  font-size: 14px;
  color: $text-primary;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: $text-secondary;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s ease;

  &:hover {
    color: $text-primary;
  }
}

// Loading overlay
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner-ring {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  font-size: 14px;
  margin: 0;
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// Responsive design
@media (max-width: 1920px) {
  .notification-item {
    min-width: 280px;
    max-width: 380px;
  }
}

@media (max-width: 1600px) {
  .notification-item {
    min-width: 260px;
    max-width: 360px;
  }
}
</style>
