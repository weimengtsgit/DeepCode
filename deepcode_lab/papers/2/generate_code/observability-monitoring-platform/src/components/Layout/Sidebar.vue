<template>
  <aside
    class="sidebar"
    :class="{ collapsed: sidebarCollapsed }"
    :style="{ width: effectiveSidebarWidth + 'px' }"
  >
    <!-- Sidebar Header with Logo -->
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="1"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
            <path d="M1 12h6m6 0h6"></path>
            <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
          </svg>
        </div>
        <span v-if="!sidebarCollapsed" class="logo-text">Observability</span>
      </div>
      <button
        class="collapse-btn"
        @click="toggleSidebar"
        :title="sidebarCollapsed ? 'Expand' : 'Collapse'"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline
            v-if="!sidebarCollapsed"
            points="15 18l-6-6 6-6"
          ></polyline>
          <polyline v-else points="9 18l6-6-6-6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div v-if="!sidebarCollapsed" class="nav-section-title">Main</div>
        <router-link
          v-for="item in mainMenuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="item.label"
        >
          <span class="nav-icon">
            <component :is="item.icon" />
          </span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div v-if="!sidebarCollapsed" class="nav-section-title">Analysis</div>
        <router-link
          v-for="item in analysisMenuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="item.label"
        >
          <span class="nav-icon">
            <component :is="item.icon" />
          </span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div v-if="!sidebarCollapsed" class="nav-section-title">Tools</div>
        <router-link
          v-for="item in toolsMenuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="item.label"
        >
          <span class="nav-icon">
            <component :is="item.icon" />
          </span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <div class="footer-section">
        <button
          class="footer-btn"
          @click="toggleTheme"
          :title="isDarkTheme ? 'Light Mode' : 'Dark Mode'"
        >
          <svg
            v-if="isDarkTheme"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <span v-if="!sidebarCollapsed" class="footer-label">
            {{ isDarkTheme ? 'Light' : 'Dark' }}
          </span>
        </button>

        <button
          class="footer-btn"
          @click="showSettings"
          title="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"
            ></path>
          </svg>
          <span v-if="!sidebarCollapsed" class="footer-label">Settings</span>
        </button>
      </div>

      <div class="footer-info">
        <div v-if="!sidebarCollapsed" class="version-info">
          <span class="version-label">v1.0.0</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/uiStore'

// Store and Router
const uiStore = useUIStore()
const router = useRouter()
const route = useRoute()

// Computed Properties
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)
const isDarkTheme = computed(() => uiStore.isDarkTheme)
const effectiveSidebarWidth = computed(() => {
  return sidebarCollapsed.value ? 80 : 260
})

// Menu Items Configuration
const mainMenuItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'DashboardIcon'
  }
]

const analysisMenuItems = [
  {
    path: '/metrics',
    label: 'Metrics',
    icon: 'MetricsIcon'
  },
  {
    path: '/tracing',
    label: 'Tracing',
    icon: 'TracingIcon'
  },
  {
    path: '/logs',
    label: 'Logs',
    icon: 'LogsIcon'
  }
]

const toolsMenuItems = [
  {
    path: '/custom',
    label: 'Custom',
    icon: 'CustomIcon'
  }
]

// Methods
const toggleSidebar = () => {
  uiStore.toggleSidebar()
}

const toggleTheme = () => {
  uiStore.toggleTheme()
}

const showSettings = () => {
  // Open settings modal via uiStore
  uiStore.openModal('settings')
}

const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Icon Components (Inline SVG Icons)
const DashboardIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  `
}

const MetricsIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="2" x2="12" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  `
}

const TracingIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
      <line x1="6" y1="12" x2="18" y2="12"></line>
    </svg>
  `
}

const LogsIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="12" y1="13" x2="8" y2="13"></line>
      <line x1="12" y1="17" x2="8" y2="17"></line>
    </svg>
  `
}

const CustomIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"></circle>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"></circle>
      <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"></circle>
      <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor"></circle>
    </svg>
  `
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.sidebar {
  position: fixed;
  left: 0;
  top: 60px; // Below header
  bottom: 0;
  width: 260px;
  background-color: $color-bg-secondary;
  border-right: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 99;
  overflow-y: auto;
  overflow-x: hidden;

  &.collapsed {
    width: 80px;
  }

  // Sidebar Header
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid $color-border;
    flex-shrink: 0;

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;

      .logo-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background-color: $color-bg-tertiary;
        color: $color-primary;
        flex-shrink: 0;

        svg {
          width: 18px;
          height: 18px;
        }
      }

      .logo-text {
        font-size: 14px;
        font-weight: 600;
        color: $color-text-primary;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background-color: transparent;
      color: $color-text-secondary;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background-color: $color-bg-tertiary;
        color: $color-text-primary;
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  // Navigation Menu
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 16px 8px;

    .nav-section {
      margin-bottom: 24px;

      .nav-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: $color-text-tertiary;
        padding: 0 12px 8px;
        letter-spacing: 0.5px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        color: $color-text-secondary;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;

          svg {
            width: 20px;
            height: 20px;
          }
        }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &:hover {
          background-color: $color-bg-tertiary;
          color: $color-text-primary;
        }

        &.active {
          background-color: $color-primary-alpha;
          color: $color-primary;

          .nav-icon {
            color: $color-primary;
          }
        }
      }
    }
  }

  // Sidebar Footer
  .sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-top: 1px solid $color-border;
    flex-shrink: 0;

    .footer-section {
      display: flex;
      gap: 8px;

      .footer-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 1;
        padding: 10px 12px;
        border: 1px solid $color-border;
        background-color: transparent;
        color: $color-text-secondary;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 13px;
        font-weight: 500;

        svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .footer-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &:hover {
          background-color: $color-bg-tertiary;
          color: $color-text-primary;
          border-color: $color-border-light;
        }
      }
    }

    .footer-info {
      display: flex;
      justify-content: center;
      padding: 8px 0;

      .version-info {
        font-size: 11px;
        color: $color-text-tertiary;

        .version-label {
          font-weight: 500;
        }
      }
    }
  }
}

// Scrollbar Styling
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: $color-border;
  border-radius: 3px;

  &:hover {
    background-color: $color-border-light;
  }
}

// Responsive Adjustments
@media (max-width: 1400px) {
  .sidebar {
    width: 80px;

    &.collapsed {
      width: 80px;
    }

    .sidebar-header {
      .logo-text {
        display: none;
      }

      .collapse-btn {
        display: none;
      }
    }

    .sidebar-nav {
      .nav-section {
        .nav-section-title {
          display: none;
        }

        .nav-item {
          justify-content: center;
          padding: 12px;

          .nav-label {
            display: none;
          }
        }
      }
    }

    .sidebar-footer {
      .footer-btn {
        .footer-label {
          display: none;
        }
      }

      .footer-info {
        display: none;
      }
    }
  }
}
</style>
