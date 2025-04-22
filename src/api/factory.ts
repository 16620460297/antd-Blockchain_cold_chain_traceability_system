import request from '../utils/request'

export interface AddProductRequest {
  name: string
  brand: string
  specification: string
  production_date: string
  expiration_date: string
  batch_number: string
  material_source: string
  process_location: string
  process_method: string
  transport_temp: number
  storage_condition: string
  safety_testing: string
  quality_rating: string
  image_file?: File
}

export interface ProductInfo {
  id: number
  sku: string
  name: string
  brand: string
  specification: string
  production_date: string
  expiration_date: string
  batch_number: string
  manufacturer_id: number
  material_source: string
  process_location: string
  process_method: string
  transport_temp: number
  storage_condition: string
  safety_testing: string
  quality_rating: string
  image_url: string
  status: number
  audit_remark: string
  created_at: string
}

export interface TransferRequest {
  product_sku: string
  to_user_id: number
  remarks: string
}

export const factoryApi = {
  // 添加产品
  addProduct(data: AddProductRequest, imageFile?: File) {
    const formData = new FormData()
    
    // 添加JSON数据
    Object.keys(data).forEach(key => {
      if (key !== 'image_file') {
        formData.append(key, data[key as keyof AddProductRequest] as string)
      }
    })
    
    // 添加图片文件
    if (imageFile) {
      formData.append('image_file', imageFile)
    }
    
    return request({
      url: '/api/factory/product',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取产品列表
  getProducts(params?: any) {
    return request({
      url: '/api/factory/products',
      method: 'get',
      params
    })
  },
  
  // 发起产品交接
  transferProduct(data: TransferRequest) {
    return request({
      url: '/api/factory/transfer',
      method: 'post',
      data
    })
  },
  
  // 获取交接记录
  getTransferRecords(params?: any) {
    return request({
      url: '/api/factory/transfers',
      method: 'get',
      params
    })
  },
  
  // 获取用户列表（用于选择交接对象）
  getUserList(params?: any) {
    return request({
      url: '/api/factory/users',
      method: 'get',
      params
    })
  }
}