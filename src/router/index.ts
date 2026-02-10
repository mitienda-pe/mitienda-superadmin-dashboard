import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

// Auth Views
import LoginView from '@/views/auth/LoginView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: LoginView,
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'Overview',
        component: () => import('@/views/dashboard/OverviewDashboardView.vue')
      }
    ]
  },
  {
    path: '/stores',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'Stores',
        component: () => import('@/views/stores/StoresListView.vue')
      },
      {
        path: ':id',
        name: 'StoreDetail',
        component: () => import('@/views/stores/StoreDetailView.vue')
      }
    ]
  },
  {
    path: '/revenue',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'Revenue',
        component: () => import('@/views/revenue/RevenueView.vue')
      }
    ]
  },
  {
    path: '/alerts',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'Alerts',
        component: () => import('@/views/alerts/AlertsView.vue')
      }
    ]
  },
  {
    path: '/investor',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'Investor',
        component: () => import('@/views/investor/InvestorView.vue')
      }
    ]
  },
  {
    path: '/pipeline',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'Pipeline',
        component: () => import('@/views/pipeline/PipelineLeadsView.vue')
      },
      {
        path: ':id',
        name: 'PipelineDetail',
        component: () => import('@/views/pipeline/PipelineLeadsView.vue')
      }
    ]
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: () => import('@/views/AccessDeniedView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach((_to, _from, next) => {
  const authStore = useAuthStore()

  // Restore session if needed
  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  const requiresAuth = _to.matched.some(record => record.meta.requiresAuth !== false)
  const requiresSuperAdmin = _to.matched.some(record => record.meta.requiresSuperAdmin === true)

  // Requires auth but not authenticated
  if (requiresAuth && !authStore.isAuthenticated) {
    if (_to.path !== '/login') {
      next('/login')
      return
    }
  }

  // Already authenticated and going to login
  if (_to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  // Requires superadmin
  if (requiresSuperAdmin && !authStore.isSuperAdmin) {
    next('/access-denied')
    return
  }

  next()
})

export default router
