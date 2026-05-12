import { createRouter, createWebHashHistory } from 'vue-router'
import { hasEmployeeToken } from '@/utils/auth'

import EmployeeLayout from '@/views/employee/layout.vue'

export const constantRoutes = [
  {
    path: '/',
    redirect: '/employee/orders'
  },
  {
    path: '/employee/login',
    name: 'EmployeeLogin',
    component: () => import('@/views/employee/login.vue'),
    meta: { requiresAuth: false, title: '员工登录', hidden: true }
  },
  {
    path: '/employee/register',
    name: 'EmployeeRegister',
    component: () => import('@/views/employee/register.vue'),
    meta: { requiresAuth: false, title: '员工注册', hidden: true }
  },
  {
    path: '/employee/chat/:orderId',
    name: 'EmployeeChat',
    component: () => import('@/views/employee/chat.vue'),
    meta: { title: '沟通', requiresAuth: true, hidden: true }
  },
  {
    path: '/employee',
    component: EmployeeLayout,
    redirect: '/employee/orders',
    meta: { requiresAuth: true, title: '员工端', hidden: true },
    children: [
      {
        path: 'orders',
        name: 'EmployeeOrders',
        component: () => import('@/views/employee/orders.vue'),
        meta: { title: '订单', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'EmployeeProfile',
        component: () => import('@/views/employee/profile.vue'),
        meta: { title: '我的', requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    redirect: '/employee/login'
  },
  {
    path: '/register',
    name: 'Register',
    redirect: '/employee/register'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 家政服务平台`
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!hasEmployeeToken()) {
      next('/employee/login')
      return
    }
  }

  // 如果已登录且访问登录/注册页面，重定向到订单页面
  if ((to.path === '/employee/login' || to.path === '/employee/register') && hasEmployeeToken()) {
    next('/employee/orders')
    return
  }

  next()
})

export default router