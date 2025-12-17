<template>
  <aside
    class="sidebar"
    :class="{
      'sidebar--collapsed': collapsed,
      'sidebar--mobile': isMobile
    }"
  >
    <!-- Logo Section -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">
        <el-icon :size="collapsed ? 24 : 32">
          <Monitor />
        </el-icon>
      </div>
      <transition name="fade">
        <div v-if="!collapsed" class="sidebar__logo-text">
          <h1 class="sidebar__logo-title">Observability</h1>
          <p class="sidebar__logo-subtitle">Monitoring Platform</p>
        </div>
      </transition>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar__nav">
      <el-scrollbar class="sidebar__scrollbar">
        <ul class="sidebar__menu">
          <li
            v-for="item in navItems"
            :key="item.id"
            class="sidebar__menu-item"
            :class="{
              'sidebar__menu-item--active': isActive(item),
              'sidebar__menu-item--has-children': item.children && item.children.length > 0
            }"
          >
            <!-- Parent Item -->
            <router-link
              v-if="!item.children || item.children.length === 0"
              :to="item.path"
              class="sidebar__menu-link"
              :title="collapsed ? item.label : ''"
            >
              <el-icon class="sidebar__menu-icon" :size="20">
                <component :is="item.icon" />
              </el-icon>
              <transition name="fade">
                <span v-if="!collapsed" class="sidebar__menu-label">
                  {{ item.label }}
                </span>
              </transition>
              <el-badge
                v-if="item.badge && !collapsed"
                :value="item.badge"
                :type="getBadgeType(item.badge)"
                class="sidebar__menu-badge"
              />
            </router-link>

            <!-- Parent Item with Children -->
            <div
              v-else
              class="sidebar__menu-link sidebar__menu-link--parent"
              :title="collapsed ? item.label : ''"
              @click="toggleSubmenu(item.id)"
            >
              <el-icon class="sidebar__menu-icon" :size="20">
                <component :is="item.icon" />
              </el-icon>
              <transition name="fade">
                <span v-if="!collapsed" class="sidebar__menu-label">
                  {{ item.label }}
                </span>
              </transition>
              <el-icon
                v-if="!collapsed"
                class="sidebar__menu-arrow"
                :class="{ 'sidebar__menu-arrow--open': expandedMenus.includes(item.id) }"
              >
                <ArrowRight />
              </el-icon>
            </div>

            <!-- Submenu -->
            <transition name="submenu">
              <ul
                v-if="item.children && item.children.length > 0 && !collapsed && expandedMenus.includes(item.id)"
                class="sidebar__submenu"
              >
                <li
                  v-for="child in item.children"
                  :key="child.id"
                  class="sidebar__submenu-item"
                  :class="{ 'sidebar__submenu-item--active': isActive(child) }"
                >
                  <router-link
                    :to="child.path"
                    class="sidebar__submenu-link"
                  >
                    <el-icon v-if="child.icon" class="sidebar__submenu-icon" :size="16">
                      <component :is="child.icon" />
                    </el-icon>
                    <span class="sidebar__submenu-label">{{ child.label }}</span>
                    <el-badge
                      v-if="child.badge"
                      :value="child.badge"
                      :type="getBadgeType(child.badge)"
                      class="sidebar__submenu-badge"
                    />
                  </router-link>
                </li>
              </ul>
            </transition>
          </li>
        </ul>
      </el-scrollbar>
    </nav>

    <!-- Footer Section -->
    <div class="sidebar__footer">
      <!-- Collapse Toggle -->
      <button
        class="sidebar__toggle"
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="handleToggle"
      >
        <el-icon :size="20">
          <component :is="collapsed ? 'Expand' : 'Fold'" />
        </el-icon>
        <transition name="fade">
          <span v-if="!collapsed" class="sidebar__toggle-text">
            {{ collapsed ? '展开' : '收起' }}
          </span>
        </transition>
      </button>

      <!-- Version Info -->
      <transition name="fade">
        <div v-if="!collapsed" class="sidebar__version">
          <span class="sidebar__version-label">Version</span>
          <span class="sidebar__version-number">{{ version }}</span>
        </div>
      </transition>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { NavItem } from '@/types'
import {
  Monitor,
  DataAnalysis,
  TrendCharts,
  Connection,
  Document,
  Bell,
  Setting,
  Grid,
  ArrowRight,
  Expand,
  Fold
} from '@element-plus/icons-vue'

// Props
interface Props {
  collapsed?: boolean
  isMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  isMobile: false
})

// Emits
const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  toggle: []
}>()

// Router
const route = useRoute()

// State
const expandedMenus = ref<string[]>([])
const version = ref('1.0.0')

// Navigation Items
const navItems = computed<NavItem[]>(() => [
  {
    id: 'dashboard',
    label: '综合仪表盘',
    icon: DataAnalysis,
    path: '/dashboard'
  },
  {
    id: 'metrics',
    label: '指标监控',
    icon: TrendCharts,
    path: '/metrics'
  },
  {
    id: 'tracing',
    label: '链路追踪',
    icon: Connection,
    path: '/tracing'
  },
  {
    id: 'logs',
    label: '日志分析',
    icon: Document,
    path: '/logs'
  },
  {
    id: 'alerts',
    label: '告警管理',
    icon: Bell,
    path: '/alerts',
    badge: getActiveAlertsCount()
  },
  {
    id: 'custom',
    label: '自定义面板',
    icon: Grid,
    path: '/custom'
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: Setting,
    path: '/settings',
    children: [
      {
        id: 'settings-general',
        label: '通用设置',
        path: '/settings/general'
      },
      {
        id: 'settings-alerts',
        label: '告警规则',
        path: '/settings/alerts'
      },
      {
        id: 'settings-users',
        label: '用户管理',
        path: '/settings/users'
      }
    ]
  }
])

// Methods
const isActive = (item: NavItem): boolean => {
  if (item.path === route.path) {
    return true
  }
  
  // Check if current route starts with item path (for parent items)
  if (route.path.startsWith(item.path) && item.path !== '/') {
    return true
  }
  
  // Check children
  if (item.children) {
    return item.children.some(child => isActive(child))
  }
  
  return false
}

const toggleSubmenu = (menuId: string) => {
  const index = expandedMenus.value.indexOf(menuId)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(menuId)
  }
}

const handleToggle = () => {
  emit('update:collapsed', !props.collapsed)
  emit('toggle')
}

const getBadgeType = (badge: number | string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  if (typeof badge === 'number') {
    if (badge > 10) return 'danger'
    if (badge > 5) return 'warning'
    if (badge > 0) return 'info'
  }
  return 'primary'
}

const getActiveAlertsCount = (): number => {
  // This would be replaced with actual store data
  // For now, return a mock value
  return 0
}

// Auto-expand active parent menu on mount
onMounted(() => {
  navItems.value.forEach(item => {
    if (item.children && isActive(item)) {
      if (!expandedMenus.value.includes(item.id)) {
        expandedMenus.value.push(item.id)
      }
    }
  })
})

// Watch route changes to auto-expand parent menus
watch(() => route.path, () => {
  navItems.value.forEach(item => {
    if (item.children && isActive(item)) {
      if (!expandedMenus.value.includes(item.id)) {
        expandedMenus.value.push(item.id)
      }
    }
  })
})

// Collapse submenus when sidebar is collapsed
watch(() => props.collapsed, (newVal) => {
  if (newVal) {
    expandedMenus.value = []
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100vh;
  background-color: $bg-secondary;
  border-right: 1px solid $border-default;
  transition: width $transition-normal;
  overflow: hidden;

  &--collapsed {
    width: 64px;

    .sidebar__logo-text,
    .sidebar__menu-label,
    .sidebar__menu-badge,
    .sidebar__menu-arrow,
    .sidebar__toggle-text,
    .sidebar__version {
      display: none;
    }

    .sidebar__menu-link {
      justify-content: center;
      padding: 12px;
    }

    .sidebar__toggle {
      justify-content: center;
    }
  }

  &--mobile {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    box-shadow: $shadow-elevated;
  }
}

// Logo Section
.sidebar__logo {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-lg $spacing-md;
  border-bottom: 1px solid $border-default;
  min-height: 72px;
}

.sidebar__logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, $accent-primary 0%, #5794f2 100%);
  color: #fff;
  flex-shrink: 0;
}

.sidebar__logo-text {
  flex: 1;
  min-width: 0;
}

.sidebar__logo-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__logo-subtitle {
  font-size: 12px;
  color: $text-secondary;
  margin: 2px 0 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Navigation
.sidebar__nav {
  flex: 1;
  overflow: hidden;
}

.sidebar__scrollbar {
  height: 100%;

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

.sidebar__menu {
  list-style: none;
  margin: 0;
  padding: $spacing-md 0;
}

.sidebar__menu-item {
  margin: 0;
  padding: 0 $spacing-sm;

  & + & {
    margin-top: $spacing-xs;
  }
}

.sidebar__menu-link {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: 12px $spacing-md;
  border-radius: 6px;
  color: $text-secondary;
  text-decoration: none;
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;

  &:hover {
    background-color: rgba($accent-primary, 0.1);
    color: $text-primary;
  }

  &--parent {
    cursor: pointer;
  }

  .sidebar__menu-item--active > & {
    background-color: rgba($accent-primary, 0.15);
    color: $accent-primary;
    font-weight: 500;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background-color: $accent-primary;
      border-radius: 0 2px 2px 0;
    }
  }
}

.sidebar__menu-icon {
  flex-shrink: 0;
  color: inherit;
}

.sidebar__menu-label {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__menu-badge {
  flex-shrink: 0;
}

.sidebar__menu-arrow {
  flex-shrink: 0;
  transition: transform $transition-fast;

  &--open {
    transform: rotate(90deg);
  }
}

// Submenu
.sidebar__submenu {
  list-style: none;
  margin: $spacing-xs 0 0;
  padding: 0;
  overflow: hidden;
}

.sidebar__submenu-item {
  margin: 0;
  padding: 0;

  & + & {
    margin-top: $spacing-xs;
  }
}

.sidebar__submenu-link {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 8px $spacing-md 8px 48px;
  border-radius: 6px;
  color: $text-secondary;
  text-decoration: none;
  font-size: 13px;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-primary, 0.08);
    color: $text-primary;
  }

  .sidebar__submenu-item--active & {
    background-color: rgba($accent-primary, 0.12);
    color: $accent-primary;
  }
}

.sidebar__submenu-icon {
  flex-shrink: 0;
  color: inherit;
}

.sidebar__submenu-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__submenu-badge {
  flex-shrink: 0;
}

// Footer
.sidebar__footer {
  padding: $spacing-md;
  border-top: 1px solid $border-default;
}

.sidebar__toggle {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  padding: 10px $spacing-md;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: $text-secondary;
  font-size: 14px;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-primary, 0.1);
    color: $text-primary;
  }
}

.sidebar__toggle-text {
  flex: 1;
  text-align: left;
}

.sidebar__version {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  border-radius: 6px;
  background-color: rgba($accent-primary, 0.05);
  font-size: 12px;
}

.sidebar__version-label {
  color: $text-secondary;
}

.sidebar__version-number {
  color: $accent-primary;
  font-weight: 500;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-fast;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all $transition-normal;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  max-height: 500px;
  opacity: 1;
}

// Responsive
@media (max-width: 768px) {
  .sidebar {
    &:not(.sidebar--mobile) {
      display: none;
    }
  }
}
</style>
