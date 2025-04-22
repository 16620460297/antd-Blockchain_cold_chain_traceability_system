import request from '../utils/request'

export interface AuditRequest {
  id: number
  status: number
  remark: string
}

export interface UserAddRequest {
  username: string
  password: string
  real_name: string
  address: string
  contact: string
  user_type: number
  company_name?: string
  license_no?: string
}

export const adminApi = {
  // 获取用户列表
  getUserList(params?: any) {
    return request({
      url: '/api/admin/users',
      method: 'get',
      params
    })
  },
  
  // 获取产品列表
  getProductList(params?: any) {
    return request({
      url: '/api/admin/products',
      method: 'get',
      params
    })
  },
  
  // 审核用户
  auditUser(data: AuditRequest) {
    return request({
      url: '/api/admin/user/audit',
      method: 'post',
      data
    })
  },
  
  // 审核产品
  auditProduct(data: AuditRequest) {
    return request({
      url: '/api/admin/product/audit',
      method: 'post',
      data
    })
  },
  
  // 添加用户
  addUser(data: UserAddRequest) {
    return request({
      url: '/api/admin/user/add',
      method: 'post',
      data
    })
  },
  
  // 获取仪表盘数据
  getDashboardData() {
    return request({
      url: '/api/admin/dashboard',
      method: 'get'
    })
  }
}