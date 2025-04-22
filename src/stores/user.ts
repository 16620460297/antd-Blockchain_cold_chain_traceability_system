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
        const type = userInfo.value.userType

        switch (type) {
            case 0: // 系统管理员
                return '/admin/dashboard'
            case 1: // 生产商
                return '/producer/dashboard'
            case 2: // 物流商
                return '/logistics/dashboard'
            case 3: // 消费者
                return '/consumer/dashboard'
            default:
                return '/dashboard'
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
