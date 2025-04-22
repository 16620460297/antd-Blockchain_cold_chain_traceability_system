import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getToken } from '../utils/auth'
import { message } from 'ant-design-vue'

// 路由配置
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/login.vue'),
        meta: { requiresAuth: false, title: '登录' }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/register.vue'),
        meta: { requiresAuth: false, title: '注册' }
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../views/dashboard.vue'),
        meta: { requiresAuth: true, title: '个人资料', allowUnaudited: true }
    },
    {
        path: '/waiting-approval',
        name: 'WaitingApproval',
        component: () => import('../views/waiting-approval.vue'),
        meta: { requiresAuth: true, title: '等待审核', allowUnaudited: true }
    },
    // 其他需要审核的页面可以不添加 allowUnaudited: true
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} - 冷链溯源系统` : '冷链溯源系统'

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const token = getToken()

    // 不需要认证的页面直接放行
    if (!requiresAuth) {
        // 如果已经登录且访问登录页，重定向到首页
        if (token && (to.path === '/login' || to.path === '/register')) {
            next({ path: '/dashboard' })
        } else {
            next()
        }
        return
    }

    // 需要认证但没有token，重定向到登录页
    if (!token) {
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
    }

    // 获取用户信息
    const userStore = useUserStore()

    if (!userStore.userInfo.userID) {
        try {
            // 获取用户信息
            await userStore.fetchUserInfo()
        } catch (error) {
            message.error('获取用户信息失败，请重新登录')
            userStore.logout()
            next({ path: '/login', query: { redirect: to.fullPath } })
            return
        }
    }

    // 检查用户类型是否有权限访问该路由
    if (to.meta.userType !== undefined) {
        if (userStore.userType !== to.meta.userType) {
            message.error('您没有权限访问该页面')
            next({ path: userStore.getHomeRoute() })
            return
        }
    }

    // 检查用户审核状态 - 只针对需要审核的页面
    const allowUnaudited = to.matched.some(record => record.meta.allowUnaudited === true)

    if (!allowUnaudited && userStore.userType !== 3 && userStore.auditStatus !== 1) {
        // 如果页面不允许未审核用户访问，且用户是企业类型且未通过审核
        message.warning('您的账号正在审核中，暂时无法访问系统功能')
        next({ path: '/waiting-approval' })
        return
    }

    next()
})

export default router
