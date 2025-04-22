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
        name: 'Dashboard',
        component: () => import('../views/dashboard.vue'),
        meta: { requiresAuth: true, title: '个人资料', allowUnaudited: true }
    },
    {
        path: '/waiting-approval',
        name: 'WaitingApproval',
        component: () => import('../views/waiting-approval.vue'),
        meta: { requiresAuth: true, title: '等待审核', allowUnaudited: true }
    },
    // 厂家路由
    {
        path: '/factory',
        name: 'FactoryLayout',
        component: () => import('../views/factory/layout.vue'),
        meta: { requiresAuth: true, title: '厂家管理', userType: 1 },
        children: [
            {
                path: '',
                redirect: '/factory/products'
            },
            {
                path: 'products',
                name: 'FactoryProducts',
                component: () => import('../views/factory/products.vue'),
                meta: { title: '产品管理' }
            },
            {
                path: 'add-product',
                name: 'AddProduct',
                component: () => import('../views/factory/add-product.vue'),
                meta: { title: '添加产品' }
            },
            {
                path: 'transfers',
                name: 'FactoryTransfers',
                component: () => import('../views/factory/transfers.vue'),
                meta: { title: '交接记录' }
            },
            {
                path: 'transfer-product',
                name: 'TransferProduct',
                component: () => import('../views/factory/transfer-product.vue'),
                meta: { title: '产品交接' }
            }
        ]
    },
    // 经销商路由
    {
        path: '/saler',
        name: 'SalerLayout',
        component: () => import('../views/saler/layout.vue'),
        meta: { requiresAuth: true, title: '经销商管理', userType: 2 },
        children: [
            {
                path: '',
                redirect: '/saler/products'
            },
            {
                path: 'products',
                name: 'SalerProducts',
                component: () => import('../views/saler/products.vue'),
                meta: { title: '产品管理' }
            },
            {
                path: 'search',
                name: 'SearchProducts',
                component: () => import('../views/saler/search.vue'),
                meta: { title: '搜索产品' }
            },
            {
                path: 'logistics',
                name: 'LogisticsRecords',
                component: () => import('../views/saler/logistics.vue'),
                meta: { title: '物流记录' }
            },
            {
                path: 'add-logistics',
                name: 'AddLogistics',
                component: () => import('../views/saler/add-logistics.vue'),
                meta: { title: '添加物流' }
            },
            {
                path: 'transfers',
                name: 'SalerTransfers',
                component: () => import('../views/saler/transfers.vue'),
                meta: { title: '交接确认' }
            }
        ]
    },
    // 监管方/消费者路由
    {
        path: '/query',
        name: 'QueryLayout',
        component: () => import('../views/query/layout.vue'),
        meta: { requiresAuth: true, title: '溯源查询', userType: 3 },
        children: [
            {
                path: '',
                redirect: '/query/search'
            },
            {
                path: 'search',
                name: 'QuerySearch',
                component: () => import('../views/query/search.vue'),
                meta: { title: '溯源查询' }
            },
            {
                path: 'result/:sku',
                name: 'QueryResult',
                component: () => import('../views/query/result.vue'),
                meta: { title: '查询结果' }
            },
            {
                path: 'blockchain/:sku',
                name: 'BlockchainData',
                component: () => import('../views/query/blockchain.vue'),
                meta: { title: '区块链数据' }
            }
        ]
    },
    // 管理员路由
    {
        path: '/admin',
        name: 'AdminLayout',
        component: () => import('../views/admin/layout.vue'),
        meta: { requiresAuth: true, title: '系统管理', userType: 4 },
        children: [
            {
                path: '',
                redirect: '/admin/dashboard'
            },
            {
                path: 'dashboard',
                name: 'AdminDashboard',
                component: () => import('../views/admin/dashboard.vue'),
                meta: { title: '系统概览' }
            },
            {
                path: 'users',
                name: 'UserManagement',
                component: () => import('../views/admin/users.vue'),
                meta: { title: '用户管理' }
            },
            {
                path: 'products',
                name: 'ProductManagement',
                component: () => import('../views/admin/products.vue'),
                meta: { title: '产品管理' }
            },
            {
                path: 'add-user',
                name: 'AddUser',
                component: () => import('../views/admin/add-user.vue'),
                meta: { title: '添加用户' }
            }
        ]
    },
    // 404页面
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/not-found.vue'),
        meta: { requiresAuth: false, title: '页面未找到' }
    }
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
