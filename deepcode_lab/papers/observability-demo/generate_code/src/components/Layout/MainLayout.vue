<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Odometer, 
  DataLine, 
  Connection, 
  Document, 
  Fold, 
  Expand,
  Moon,
  Sunny
} from '@element-plus/icons-vue';
import { useGlobalStore } from '@/stores/globalStore';
import TimeControls from './TimeControls.vue';

const route = useRoute();
const globalStore = useGlobalStore();

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: Odometer },
  { name: 'Metrics', path: '/metrics', icon: DataLine },
  { name: 'Tracing', path: '/tracing', icon: Connection },
  { name: 'Logs', path: '/logs', icon: Document },
];

const isCollapsed = computed(() => globalStore.isSidebarCollapsed);
const isDark = computed(() => globalStore.isDarkTheme);

const toggleSidebar = () => globalStore.toggleSidebar();
const toggleTheme = () => globalStore.toggleTheme();

// Map route path to readable title
const currentTitle = computed(() => {
  const current = navigationItems.find(item => item.path === route.path);
  return current ? current.name : 'Dashboard';
});
</script>

<template>
  <div class="layout-container" :class="{ 'sidebar-collapsed': isCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="app-title" v-if="!isCollapsed">ObsPlatform</span>
      </div>

      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navigationItems" 
          :key="item.path" 
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label" v-if="!isCollapsed">{{ item.name }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="version" v-if="!isCollapsed">v1.0.0</div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="top-header">
        <div class="header-left">
          <button class="icon-btn toggle-btn" @click="toggleSidebar">
            <el-icon><component :is="isCollapsed ? Expand : Fold" /></el-icon>
          </button>
          <h2 class="page-title">{{ currentTitle }}</h2>
        </div>
        
        <div class="header-right">
          <TimeControls />
          <div class="divider"></div>
          <button class="icon-btn theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to Light' : 'Switch to Dark'">
            <el-icon><component :is="isDark ? Sunny : Moon" /></el-icon>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

// Local variables
$sidebar-width-expanded: 240px;
$sidebar-width-collapsed: $sidebar-width; // 60px from variables.scss
$transition-speed: 0.3s;

.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: $bg-body;
  color: $text-primary;
  overflow: hidden;
}

// Sidebar Styles
.sidebar {
  width: $sidebar-width-expanded;
  background-color: $bg-panel; // Darker sidebar
  border-right: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  transition: width $transition-speed ease;
  z-index: $z-header;
  flex-shrink: 0;

  .sidebar-header {
    height: $header-height;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid $border-color;
    
    .logo-icon {
      width: 24px;
      height: 24px;
      color: $primary;
      flex-shrink: 0;
    }

    .app-title {
      margin-left: 12px;
      font-weight: 700;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: $spacing-md 0;
    overflow-y: auto;

    .nav-item {
      display: flex;
      align-items: center;
      height: 48px;
      padding: 0 20px;
      color: rgba($text-primary, 0.7);
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
      border-left: 3px solid transparent;

      &:hover {
        background-color: rgba($text-primary, 0.05);
        color: $text-primary;
      }

      &.active {
        background-color: rgba($primary, 0.1);
        color: $primary;
        border-left-color: $primary;
      }

      .nav-icon {
        font-size: 18px;
        flex-shrink: 0;
      }

      .nav-label {
        margin-left: 12px;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }

  .sidebar-footer {
    padding: $spacing-md;
    text-align: center;
    font-size: 12px;
    color: rgba($text-primary, 0.4);
    border-top: 1px solid $border-color;
  }
}

// Main Wrapper (Header + Content)
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // Prevent flex overflow
}

// Header Styles
.top-header {
  height: $header-height;
  background-color: $bg-body; // Match body bg for cleaner look, or panel for contrast
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .divider {
      width: 1px;
      height: 24px;
      background-color: $border-color;
    }
  }
}

// Icon Buttons
.icon-btn {
  background: transparent;
  border: none;
  color: $text-primary;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba($text-primary, 0.1);
  }

  &.toggle-btn {
    font-size: 20px;
  }

  &.theme-toggle {
    font-size: 18px;
  }
}

// Page Content
.page-content {
  flex: 1;
  overflow: hidden; // Content scrolls internally or uses page-container
  position: relative;
  display: flex;
  flex-direction: column;
}

// Collapsed State Overrides
.layout-container.sidebar-collapsed {
  .sidebar {
    width: $sidebar-width-collapsed;

    .sidebar-header {
      justify-content: center;
      padding: 0;
    }

    .nav-item {
      justify-content: center;
      padding: 0;

      .nav-label {
        display: none;
      }
    }
  }
}

// Page Transition
.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.2s ease;
}

.fade-page-enter-from,
.fade-page-leave-to {
  opacity: 0;
}
</style>