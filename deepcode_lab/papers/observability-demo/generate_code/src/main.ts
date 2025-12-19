import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import './styles/main.scss'

import App from './App.vue'
import DashboardView from './views/DashboardView.vue'
import MetricsView from './views/MetricsView.vue'
import TracingView from './views/TracingView.vue'
import LogsView from './views/LogsView.vue'

// 1. Define Routes
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/metrics',
    name: 'Metrics',
    component: MetricsView,
    meta: { title: 'Metrics Explorer' }
  },
  {
    path: '/tracing',
    name: 'Tracing',
    component: TracingView,
    meta: { title: 'Distributed Tracing' }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: LogsView,
    meta: { title: 'Log Explorer' }
  }
]

// 2. Create Router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 3. Setup Navigation Guards (Optional: Update document title)
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | Observability Demo` || 'Observability Demo'
  next()
})

// 4. Initialize App
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 5. Mount
app.mount('#app')
