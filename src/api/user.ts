import request from '../utils/request'

export interface LoginParams {
    username: string
    password: string
}

export interface RegisterParams {
    username: string
    password: string
    real_name: string    // 改为real_name而不是realName
    address?: string
    contact: string
    user_type: number    // 改为user_type而不是userType
    company_name?: string // 改为company_name而不是companyName
    license_no?: string   // 改为license_no而不是licenseNo
}

export interface UserInfo {
    id: number
    username: string
    realName: string
    address: string
    contact: string
    userType: number
    companyName: string
    licenseNo: string
    auditStatus: number
    createdAt: string
}

export const userApi = {
    login(data: LoginParams) {
        return request({
            url: '/api/user/login',
            method: 'post',
            data
        })
    },

    register(data: RegisterParams) {
        // 转换字段名以匹配后端期望
        const formattedData = {
            username: data.username,
            password: data.password,
            real_name: data.realName,        // 将realName转换为real_name
            address: data.address,
            contact: data.contact,
            user_type: data.userType,        // 将userType转换为user_type
            company_name: data.companyName,  // 将companyName转换为company_name
            license_no: data.licenseNo       // 将licenseNo转换为license_no
        };

        return request({
            url: '/api/user/register',
            method: 'post',
            data: formattedData  // 使用转换后的数据
        })
    },

    logout() {
        return request({
            url: '/api/user/logout',
            method: 'post'
        })
    },

    getUserInfo() {
        return request({
            url: '/api/user/info',
            method: 'get'
        })
    },

    updateUserInfo(data: Partial<UserInfo>) {
        return request({
            url: '/api/user/info',
            method: 'put',
            data
        })
    }
}
