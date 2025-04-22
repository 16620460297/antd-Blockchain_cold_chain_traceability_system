import request from '../utils/request'

export interface LogisticsRequest {
  product_sku: string
  tracking_no: string
  warehouse_location: string
  temperature: number
  humidity: number
  image_file?: File
}

export interface LogisticsRecord {
  id: number
  product_sku: string
  tracking_no: string
  warehouse_location: string
  temperature: number
  humidity: number
  image_url: string
  operator_id: number
  operator_type: number
  created_at: string
}

export interface TransferConfirmRequest {
  transfer_id: number
}

export const salerApi = {
  // 搜索产品
  searchProducts(params: any) {
    return request({
      url: '/api/saler/product/search',
      method: 'get',
      params
    })
  },
  
  // 添加物流记录
  addLogistics(data: LogisticsRequest, imageFile?: File) {
    const formData = new FormData()
    
    // 添加JSON数据
    Object.keys(data).forEach(key => {
      if (key !== 'image_file') {
        formData.append(key, data[key as keyof LogisticsRequest] as string)
      }
    })
    
    // 添加图片文件
    if (imageFile) {
      formData.append('image_file', imageFile)
    }
    
    return request({
      url: '/api/saler/logistics',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 确认产品交接
  confirmTransfer(data: TransferConfirmRequest) {
    return request({
      url: '/api/saler/transfer/confirm',
      method: 'post',
      data
    })
  },
  
  // 获取产品列表
  getProducts(params?: any) {
    return request({
      url: '/api/saler/products',
      method: 'get',
      params
    })
  },
  
  // 获取物流记录列表
  getLogisticsList(params?: any) {
    return request({
      url: '/api/saler/logistics/list',
      method: 'get',
      params
    })
  }
}