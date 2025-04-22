import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../api/user'
import { setToken, getToken, removeToken, setUserInfo, getUserInfo, clearAuth } from '../utils/auth'

export const useUserStore = defineStore('user', () => {
    // 状态
    const token = ref<string | null>(getToken())
    const userInfo = ref<any>(getUserInfo() || {})
    const loading = ref(false)

    // 计算属性
    const isLoggedIn = computed(() => !!token.value)
    const userId = computed(() => userInfo.value.userID)
    const username = computed(() => userInfo.value.username)
    const userType = computed(() => userInfo.value.userType)
    const auditStatus = computed(() => userInfo.value.auditStatus)
    


    // 方法
    const login = async (username: string, password: string) => {
        loading.value = true
        try {
            const data = await userApi.login({ username, password })
            token.value = data.token
            userInfo.value = data

            // 保存到本地
            setToken(data.token)
            setUserInfo(data)

            return data
        } finally {
            loading.value = false
        }
    }

    const logout = async () => {
        if (token.value) {
            try {
                await userApi.logout()
            } catch (error) {
                console.error('退出登录失败:', error)
            }
        }

        // 无论退出成功与否，都清除本地存储
        token.value = null
        userInfo.value = {}
        clearAuth()
    }

    const fetchUserInfo = async () => {
        if (!token.value) return null

        try {
            const data = await userApi.getUserInfo()
            userInfo.value = data
            setUserInfo(data)
            return data
        } catch (error) {
            console.error('获取用户信息失败:', error)
            return null
        }
    }

    // 根据用户类型获取首页路由
    const getHomeRoute = () => {
        if (!isLoggedIn.value) return '/login'
        
        // 如果用户未审核通过且不是消费者，则跳转到等待审核页面
        if (userType.value !== 3 && userType.value !== 4 && auditStatus.value !== 1) {
            return '/waiting-approval'
        }
        
        // 根据用户类型返回对应的首页
        switch (userType.value) {
            case 0: return '/admin/dashboard'  // 系统管理员
            case 1: return '/factory/products'  // 厂家
            case 2: return '/saler/products'   // 经销商
            case 3: return '/query/search'     // 消费者/监管方
            case 4: return '/admin/dashboard'  // 管理员
            default: return '/dashboard'       // 默认个人资料页
        }
    }
    return {
        token,
        userInfo,
        loading,
        isLoggedIn,
        userId,
        username,
        userType,
        auditStatus,
        login,
        logout,
        fetchUserInfo,
        getHomeRoute
    }
})
