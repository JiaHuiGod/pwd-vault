import { createRouter, createWebHashHistory } from 'vue-router'
import NormalView from '../views/NormalView.vue'
import AdminView from '../views/AdminView.vue'
import QuickAddView from '../views/QuickAddView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'normal',
      component: NormalView,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true },
    },
    {
      path: '/quick-add',
      name: 'quick-add',
      component: QuickAddView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      return '/'
    }
  }
})

export default router
