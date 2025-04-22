import request from '../utils/request'

export interface BlockchainData {
  block_number: string
  tx_hash: string
  timestamp: string
  operation_type: number
  operator_name: string
  operator_role: string
  product_sku: string
  prev_hash: string
}

export interface ProductTraceInfo {
  product: any
  logistics: any[]
  transfers: any[]
  blockchain: BlockchainData[]
}

export const queryApi = {
  // 根据SKU查询产品溯源信息
  queryProductBySKU(sku: string) {
    return request({
      url: '/api/query/product',
      method: 'get',
      params: { sku }
    })
  },
  
  // 验证区块链数据完整性
  verifyBlockchain(sku: string) {
    return request({
      url: '/api/blockchain/verify',
      method: 'get',
      params: { sku }
    })
  },
  
  // 获取区块链数据
  getBlockchainData(sku: string) {
    return request({
      url: '/api/blockchain/data',
      method: 'get',
      params: { sku }
    })
  }
}