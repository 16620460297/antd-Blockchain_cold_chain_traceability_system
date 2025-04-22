import axios from 'axios'
import { message } from 'ant-design-vue'
import { getToken, removeToken } from './auth'
import router from '../router'

// 创建axios实例
const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 15000
})

// 请求拦截器
service.interceptors.request.use(
    config => {
        const token = getToken()
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    response => {
        const res = response.data

        // 后端约定返回格式: { code: number, message: string, data: any }
        if (res.code !== 200) {
            message.error(res.message || '操作失败')

            // 401: 未登录或token过期
            if (res.code === 401) {
                removeToken()
                router.push('/login')
            }

            return Promise.reject(new Error(res.message || '操作失败'))
        }

        return res.data
    },
    error => {
        console.error('响应错误:', error)
        const msg = error.response?.data?.message || '请求失败'
        message.error(msg)

        if (error.response?.status === 401) {
            removeToken()
            router.push('/login')
        }

        return Promise.reject(error)
    }
)

export default service
