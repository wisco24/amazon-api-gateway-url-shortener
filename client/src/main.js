import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import store from './store'

// Import your components for routes
import Dashboard from './views/Dashboard.vue'
// Import other components as needed

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  }
  // Add other routes as needed
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')
