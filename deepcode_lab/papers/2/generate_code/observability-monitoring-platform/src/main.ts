import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { initializeMockData } from './mock'
import { useUIStore } from './stores/uiStore'
import { useTimeStore } from './stores/timeStore'
import { useFilterStore } from './stores/filterStore'

// Import global styles
import './styles/main.scss'

// Create Vue app instance
const app = createApp(App)

// Create and use Pinia store
const pinia = createPinia()
app.use(pinia)

// Use Vue Router
app.use(router)

// Use Element Plus UI library
app.use(ElementPlus)

// Initialize mock data before mounting
console.log('[App] Initializing mock data...')
const startTime = performance.now()
initializeMockData()
const endTime = performance.now()
console.log(`[App] Mock data initialized in ${(endTime - startTime).toFixed(2)}ms`)

// Initialize UI state from localStorage
const uiStore = useUIStore()
const timeStore = useTimeStore()
const filterStore = useFilterStore()

console.log('[App] Loading persisted state from localStorage...')
try {
  uiStore.loadUIState()
  timeStore.loadFromLocalStorage()
  filterStore.initialize()
  console.log('[App] Persisted state loaded successfully')
} catch (error) {
  console.warn('[App] Failed to load persisted state:', error)
  // Continue with defaults if localStorage fails
}

// Mount app to DOM
const mountElement = document.getElementById('app')
if (!mountElement) {
  throw new Error('Failed to find #app element in HTML')
}

app.mount(mountElement)

console.log('[App] Application mounted successfully')

// Log environment info
console.log('[App] Environment:', {
  nodeEnv: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
})

// Setup global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('[App] Global error:', err, info)
  // Could integrate with error tracking service here
}

// Setup global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('[App] Vue warning:', msg, trace)
}
