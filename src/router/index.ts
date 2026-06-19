import { createRouter, createWebHistory } from 'vue-router'
import NormalView from '../views/NormalView.vue'
import AdminView from '../views/AdminView.vue'
import QuickAddView from '../views/QuickAddView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
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
