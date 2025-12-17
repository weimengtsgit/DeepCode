<template>
  <header class="header" :class="{ 'header--collapsed': sidebarCollapsed }">
    <!-- Left section: Breadcrumbs and page title -->
    <div class="header__left">
      <Breadcrumbs />
    </div>

    <!-- Center section: Time range and filters -->
    <div class="header__center">
      <TimeRangePicker />
      <FilterBar />
    </div>

    <!-- Right section: Alerts, notifications, user menu -->
    <div class="header__right">
      <!-- Alert indicator badge -->
      <div class="header__alerts">
        <button
          class="header__alert-btn"
          :class="{ 'header__alert-btn--critical': criticalAlertCount > 0 }"
          @click="showAlertPanel = !showAlertPanel"
          :title="`${activeAlertCount} active alerts`"
        >
          <span class="header__alert-icon">🔔</span>
          <span v-if="activeAlertCount > 0" class="header__alert-badge">
            {{ activeAlertCount > 99 ? '99+' : activeAlertCount }}
          </span>
        </button>

        <!-- Alert panel dropdown -->
        <Transition name="fade-slide">
          <div v-if="showAlertPanel" class="header__alert-panel">
            <div class="header__alert-panel-header">
              <h3>Active Alerts</h3>
              <button class="header__close-btn" @click="showAlertPanel = false">✕</button>
            </div>
            <div class="header__alert-panel-content">
              <div v-if="activeAlerts.length === 0" class="header__empty-state">
                No active alerts
              </div>
              <div v-else class="header__alert-list">
                <div
                  v-for="alert in activeAlerts.slice(0, 5)"
                  :key="alert.id"
                  class="header__alert-item"
                  :class="`header__alert-item--${alert.severity}`"
                >
                  <div class="header__alert-item-title">{{ alert.ruleName }}</div>
                  <div class="header__alert-item-service">{{ alert.service }}</div>
                  <div class="header__alert-item-time">
                    {{ formatTime(alert.triggeredAt) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="activeAlerts.length > 5" class="header__alert-panel-footer">
              <router-link to="/alerts" class="header__view-all-link">
                View all {{ activeAlerts.length }} alerts →
              </router-link>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Notification count -->
      <div v-if="notificationCount > 0" class="header__notifications">
        <span class="header__notification-badge">{{ notificationCount }}</span>
      </div>

      <!-- Theme toggle -->
      <button
        class="header__theme-btn"
        @click="toggleTheme"
        :title="`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`"
      >
        {{ isDarkTheme ? '☀️' : '🌙' }}
      </button>

      <!-- User menu -->
      <div class="header__user-menu">
        <button class="header__user-btn" @click="showUserMenu = !showUserMenu">
          <span class="header__user-avatar">👤</span>
          <span class="header__user-name">User</span>
        </button>

        <Transition name="fade-slide">
          <div v-if="showUserMenu" class="header__user-dropdown">
            <a href="#" class="header__user-menu-item">Profile</a>
            <a href="#" class="header__user-menu-item">Settings</a>
            <a href="#" class="header__user-menu-item">Help</a>
            <hr class="header__user-menu-divider" />
            <a href="#" class="header__user-menu-item header__user-menu-item--danger">
              Logout
            </a>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAlertsStore } from '@/stores/alertsStore'
import { useUIStore } from '@/stores/uiStore'
import Breadcrumbs from './Breadcrumbs.vue'
import TimeRangePicker from '../TimePicker/TimeRangePicker.vue'
import FilterBar from '../Filters/FilterBar.vue'

// Stores
const alertsStore = useAlertsStore()
const uiStore = useUIStore()

// Local state
const showAlertPanel = ref(false)
const showUserMenu = ref(false)

// Computed properties
const activeAlertCount = computed(() => alertsStore.activeCount)
const criticalAlertCount = computed(() => alertsStore.criticalCount)
const activeAlerts = computed(() => {
  // Get active alerts sorted by severity
  const alerts = alertsStore.events.filter((e) => !e.resolvedAt)
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  })
})

const isDarkTheme = computed(() => uiStore.theme === 'dark')
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)
const notificationCount = computed(() => uiStore.notifications.length)

// Methods
const toggleTheme = () => {
  uiStore.setTheme(isDarkTheme.value ? 'light' : 'dark')
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

// Close dropdowns when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.header__alerts') && !target.closest('.header__alert-panel')) {
    showAlertPanel.value = false
  }
  if (!target.closest('.header__user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background-color: $color-bg-secondary;
  border-bottom: 1px solid $color-border;
  position: fixed;
  top: 0;
  left: 260px;
  right: 0;
  z-index: 100;
  gap: 24px;
  transition: left 0.3s ease;

  &--collapsed {
    left: 80px;
  }
}

.header__left {
  flex: 0 0 auto;
  min-width: 200px;
}

.header__center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.header__right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

// Alert button and panel
.header__alerts {
  position: relative;
}

.header__alert-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 20px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &--critical {
    color: $color-error;
    animation: pulse 2s infinite;
  }
}

.header__alert-icon {
  display: inline-block;
}

.header__alert-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: $color-error;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.header__alert-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: $color-bg-primary;
  border: 1px solid $color-border;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.header__alert-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid $color-border;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-text-primary;
  }
}

.header__close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: $color-text-secondary;
  font-size: 16px;
  padding: 0;

  &:hover {
    color: $color-text-primary;
  }
}

.header__alert-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.header__empty-state {
  padding: 24px 16px;
  text-align: center;
  color: $color-text-secondary;
  font-size: 13px;
}

.header__alert-list {
  display: flex;
  flex-direction: column;
}

.header__alert-item {
  padding: 12px 16px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &--critical {
    border-left-color: $color-error;
  }

  &--warning {
    border-left-color: $color-warning;
  }

  &--info {
    border-left-color: $color-info;
  }
}

.header__alert-item-title {
  font-size: 13px;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: 4px;
}

.header__alert-item-service {
  font-size: 12px;
  color: $color-text-secondary;
  margin-bottom: 4px;
}

.header__alert-item-time {
  font-size: 11px;
  color: $color-text-tertiary;
}

.header__alert-panel-footer {
  padding: 8px 16px;
  border-top: 1px solid $color-border;
  text-align: center;
}

.header__view-all-link {
  color: $color-primary;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
}

// Notifications
.header__notifications {
  position: relative;
}

.header__notification-badge {
  display: inline-block;
  background-color: $color-warning;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

// Theme toggle
.header__theme-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  font-size: 18px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

// User menu
.header__user-menu {
  position: relative;
}

.header__user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  color: $color-text-primary;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.header__user-avatar {
  font-size: 18px;
}

.header__user-name {
  font-size: 13px;
  font-weight: 500;
}

.header__user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: $color-bg-primary;
  border: 1px solid $color-border;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 160px;
  z-index: 1000;
}

.header__user-menu-item {
  display: block;
  padding: 10px 16px;
  color: $color-text-primary;
  text-decoration: none;
  font-size: 13px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &--danger {
    color: $color-error;
  }
}

.header__user-menu-divider {
  margin: 4px 0;
  border: none;
  border-top: 1px solid $color-border;
}

// Animations
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// Responsive
@media (max-width: 1400px) {
  .header {
    padding: 0 16px;
    gap: 16px;
  }

  .header__center {
    gap: 12px;
  }

  .header__right {
    gap: 12px;
  }
}

@media (max-width: 1024px) {
  .header {
    left: 80px;
    padding: 0 12px;
  }

  .header__left {
    display: none;
  }

  .header__center {
    flex: 0 1 auto;
  }
}
</style>
