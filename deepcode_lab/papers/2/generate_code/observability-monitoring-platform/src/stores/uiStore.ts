import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * UI Store - Manages global UI state
 * Handles: theme, sidebar state, modals, notifications, loading states
 */
export const useUIStore = defineStore('ui', () => {
  // ============================================================================
  // STATE
  // ============================================================================

  // Theme management
  const theme = ref<'dark' | 'light'>('dark')
  const themePreference = ref<'dark' | 'light' | 'auto'>('dark')

  // Sidebar state
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(260) // pixels

  // Modal states
  const activeModals = ref<Set<string>>(new Set())
  const modalStack = ref<string[]>([])

  // Notifications
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
    timestamp: Date
  }>>([])

  // Global loading state
  const isLoading = ref(false)
  const loadingMessage = ref('')

  // Drawer/panel states
  const rightDrawerOpen = ref(false)
  const rightDrawerContent = ref<'alert-detail' | 'log-detail' | 'span-detail' | null>(null)
  const rightDrawerData = ref<any>(null)

  // Breadcrumb state
  const breadcrumbs = ref<Array<{
    label: string
    path?: string
  }>>([])

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  const isDarkTheme = computed(() => theme.value === 'dark')
  const isLightTheme = computed(() => theme.value === 'light')

  const isSidebarCollapsed = computed(() => sidebarCollapsed.value)
  const effectiveSidebarWidth = computed(() => {
    return sidebarCollapsed.value ? 60 : sidebarWidth.value
  })

  const hasActiveModals = computed(() => activeModals.value.size > 0)
  const topModal = computed(() => {
    return modalStack.value.length > 0 ? modalStack.value[modalStack.value.length - 1] : null
  })

  const notificationCount = computed(() => notifications.value.length)
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.timestamp)
  })

  const hasNotifications = computed(() => notifications.value.length > 0)

  // ============================================================================
  // THEME ACTIONS
  // ============================================================================

  const setTheme = (newTheme: 'dark' | 'light') => {
    theme.value = newTheme
    themePreference.value = newTheme
    // Apply to document root
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    persistUIState()
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  const setThemePreference = (preference: 'dark' | 'light' | 'auto') => {
    themePreference.value = preference
    if (preference === 'auto') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    } else {
      setTheme(preference)
    }
    persistUIState()
  }

  // ============================================================================
  // SIDEBAR ACTIONS
  // ============================================================================

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    persistUIState()
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
    persistUIState()
  }

  const setSidebarWidth = (width: number) => {
    sidebarWidth.value = Math.max(200, Math.min(400, width)) // Constrain 200-400px
    persistUIState()
  }

  // ============================================================================
  // MODAL ACTIONS
  // ============================================================================

  const openModal = (modalId: string) => {
    if (!activeModals.value.has(modalId)) {
      activeModals.value.add(modalId)
      modalStack.value.push(modalId)
    }
  }

  const closeModal = (modalId: string) => {
    activeModals.value.delete(modalId)
    modalStack.value = modalStack.value.filter(id => id !== modalId)
  }

  const closeTopModal = () => {
    if (modalStack.value.length > 0) {
      const modalId = modalStack.value.pop()!
      activeModals.value.delete(modalId)
    }
  }

  const closeAllModals = () => {
    activeModals.value.clear()
    modalStack.value = []
  }

  const isModalOpen = (modalId: string): boolean => {
    return activeModals.value.has(modalId)
  }

  // ============================================================================
  // NOTIFICATION ACTIONS
  // ============================================================================

  const addNotification = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration?: number
  ): string => {
    const id = `notification-${Date.now()}-${Math.random()}`
    const notification = {
      id,
      type,
      message,
      duration,
      timestamp: new Date()
    }
    notifications.value.push(notification)

    // Auto-remove after duration
    if (duration && duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const showSuccessNotification = (message: string, duration = 3000) => {
    return addNotification(message, 'success', duration)
  }

  const showErrorNotification = (message: string, duration = 5000) => {
    return addNotification(message, 'error', duration)
  }

  const showWarningNotification = (message: string, duration = 4000) => {
    return addNotification(message, 'warning', duration)
  }

  const showInfoNotification = (message: string, duration = 3000) => {
    return addNotification(message, 'info', duration)
  }

  // ============================================================================
  // LOADING STATE ACTIONS
  // ============================================================================

  const setLoading = (loading: boolean, message = '') => {
    isLoading.value = loading
    loadingMessage.value = message
  }

  const startLoading = (message = 'Loading...') => {
    setLoading(true, message)
  }

  const stopLoading = () => {
    setLoading(false, '')
  }

  // ============================================================================
  // DRAWER ACTIONS
  // ============================================================================

  const openRightDrawer = (
    contentType: 'alert-detail' | 'log-detail' | 'span-detail',
    data: any
  ) => {
    rightDrawerContent.value = contentType
    rightDrawerData.value = data
    rightDrawerOpen.value = true
  }

  const closeRightDrawer = () => {
    rightDrawerOpen.value = false
    setTimeout(() => {
      rightDrawerContent.value = null
      rightDrawerData.value = null
    }, 300) // Wait for animation
  }

  const toggleRightDrawer = () => {
    if (rightDrawerOpen.value) {
      closeRightDrawer()
    } else {
      rightDrawerOpen.value = true
    }
  }

  // ============================================================================
  // BREADCRUMB ACTIONS
  // ============================================================================

  const setBreadcrumbs = (crumbs: Array<{ label: string; path?: string }>) => {
    breadcrumbs.value = crumbs
  }

  const addBreadcrumb = (label: string, path?: string) => {
    breadcrumbs.value.push({ label, path })
  }

  const clearBreadcrumbs = () => {
    breadcrumbs.value = []
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  const persistUIState = () => {
    try {
      const state = {
        theme: theme.value,
        themePreference: themePreference.value,
        sidebarCollapsed: sidebarCollapsed.value,
        sidebarWidth: sidebarWidth.value
      }
      localStorage.setItem('monitoring_ui_state', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to persist UI state:', error)
    }
  }

  const loadUIState = () => {
    try {
      const stored = localStorage.getItem('monitoring_ui_state')
      if (stored) {
        const state = JSON.parse(stored)
        if (state.theme) theme.value = state.theme
        if (state.themePreference) themePreference.value = state.themePreference
        if (typeof state.sidebarCollapsed === 'boolean') sidebarCollapsed.value = state.sidebarCollapsed
        if (state.sidebarWidth) sidebarWidth.value = state.sidebarWidth

        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme.value)
        }
      }
    } catch (error) {
      console.error('Failed to load UI state:', error)
    }
  }

  // ============================================================================
  // RESET
  // ============================================================================

  const reset = () => {
    theme.value = 'dark'
    themePreference.value = 'dark'
    sidebarCollapsed.value = false
    sidebarWidth.value = 260
    activeModals.value.clear()
    modalStack.value = []
    notifications.value = []
    isLoading.value = false
    loadingMessage.value = ''
    rightDrawerOpen.value = false
    rightDrawerContent.value = null
    rightDrawerData.value = null
    breadcrumbs.value = []
    persistUIState()
  }

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // State
    theme,
    themePreference,
    sidebarCollapsed,
    sidebarWidth,
    activeModals,
    modalStack,
    notifications,
    isLoading,
    loadingMessage,
    rightDrawerOpen,
    rightDrawerContent,
    rightDrawerData,
    breadcrumbs,

    // Computed
    isDarkTheme,
    isLightTheme,
    isSidebarCollapsed,
    effectiveSidebarWidth,
    hasActiveModals,
    topModal,
    notificationCount,
    unreadNotifications,
    hasNotifications,

    // Theme actions
    setTheme,
    toggleTheme,
    setThemePreference,

    // Sidebar actions
    toggleSidebar,
    setSidebarCollapsed,
    setSidebarWidth,

    // Modal actions
    openModal,
    closeModal,
    closeTopModal,
    closeAllModals,
    isModalOpen,

    // Notification actions
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,

    // Loading actions
    setLoading,
    startLoading,
    stopLoading,

    // Drawer actions
    openRightDrawer,
    closeRightDrawer,
    toggleRightDrawer,

    // Breadcrumb actions
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,

    // Persistence
    persistUIState,
    loadUIState,

    // Reset
    reset
  }
})
