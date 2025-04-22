<template>
  <div class="product-trace-container">
    <h2>产品溯源查询</h2>
    
    <div class="search-container">
      <a-input-search
        v-model:value="searchSku"
        placeholder="请输入产品SKU码"
        enter-button="查询"
        size="large"
        @search="handleSearch"
        :loading="searching"
      />
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin tip="正在查询产品溯源信息..." />
    </div>
    
    <div v-else-if="traceInfo && traceInfo.product" class="result-container">
      <a-alert
        v-if="verifyResult && verifyResult.verified"
        message="区块链验证通过"
        description="该产品信息已通过区块链验证，数据完整且未被篡改。"
        type="success"
        show-icon
        style="margin-bottom: 24px"
      />
      <a-alert
        v-else-if="verifyResult && !verifyResult.verified"
        message="区块链验证失败"
        description="该产品信息未通过区块链验证，数据可能已被篡改。"
        type="error"
        show-icon
        style="margin-bottom: 24px"
      />
      
      <a-tabs default-active-key="1">
        <a-tab-pane key="1" tab="基本信息">
          <a-descriptions title="产品基本信息" bordered :column="2">
            <a-descriptions-item label="SKU" :span="2">
              {{ traceInfo.product.sku }}
            </a-descriptions-item>
            <a-descriptions-item label="产品名称">
              {{ traceInfo.product.name }}
            </a-descriptions-item>
            <a-descriptions-item label="品牌">
              {{ traceInfo.product.brand }}
            </a-descriptions-item>
            <a-descriptions-item label="规格">
              {{ traceInfo.product.specification }}
            </a-descriptions-item>
            <a-descriptions-item label="批次号">
              {{ traceInfo.product.batch_number }}
            </a-descriptions-item>
            <a-descriptions-item label="生产日期">
              {{ formatDate(traceInfo.product.production_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="保质期">
              {{ formatDate(traceInfo.product.expiration_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="原材料来源" :span="2">
              {{ traceInfo.product.material_source }}
            </a-descriptions-item>
            <a-descriptions-item label="加工地点">
              {{ traceInfo.product.process_location }}
            </a-descriptions-item>
            <a-descriptions-item label="加工方式">
              {{ traceInfo.product.process_method }}
            </a-descriptions-item>
            <a-descriptions-item label="运输温度">
              {{ traceInfo.product.transport_temp }}°C
            </a-descriptions-item>
            <a-descriptions-item label="存储条件">
              {{ traceInfo.product.storage_condition }}
            </a-descriptions-item>
            <a-descriptions-item label="安全检测">
              {{ traceInfo.product.safety_testing }}
            </a-descriptions-item>
            <a-descriptions-item label="质量等级">
              {{ traceInfo.product.quality_rating }}
            </a-descriptions-item>
            <a-descriptions-item label="产品图片" :span="2">
              <a-image
                v-if="traceInfo.product.image_url"
                :width="200"
                :src="traceInfo.product.image_url"
                :preview="{
                  src: traceInfo.product.image_url,
                }"
              />
              <span v-else>无图片</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        
        <a-tab-pane key="2" tab="交接记录">
          <a-empty v-if="!traceInfo.transfers || traceInfo.transfers.length === 0" description="暂无交接记录" />
          <a-timeline v-else>
            <a-timeline-item v-for="(transfer, index) in traceInfo.transfers" :key="index">
              <template #dot>
                <swap-outlined style="font-size: 16px" />
              </template>
              <div class="timeline-content">
                <h4>{{ formatDate(transfer.created_at) }}</h4>
                <p>从 <strong>{{ transfer.from_user_name }}</strong> ({{ transfer.from_company_name }}) 交接至 <strong>{{ transfer.to_user_name }}</strong> ({{ transfer.to_company_name }})</p>
                <p v-if="transfer.remarks">备注: {{ transfer.remarks }}</p>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>
        
        <a-tab-pane key="3" tab="物流记录">
          <a-empty v-if="!traceInfo.logistics || traceInfo.logistics.length === 0" description="暂无物流记录" />
          <a-timeline v-else>
            <a-timeline-item v-for="(logistics, index) in traceInfo.logistics" :key="index">
              <template #dot>
                <car-outlined style="font-size: 16px" />
              </template>
              <div class="timeline-content">
                <h4>{{ formatDate(logistics.created_at) }}</h4>
                <p>物流单号: <strong>{{ logistics.tracking_no }}</strong></p>
                <p>仓储位置: {{ logistics.warehouse_location }}</p>
                <p>温度: {{ logistics.temperature }}°C | 湿度: {{ logistics.humidity }}%</p>
                <p>操作人: {{ logistics.operator_name }} ({{ logistics.operator_company }})</p>
                <a-image
                  v-if="logistics.image_url"
                  :width="150"
                  :src="logistics.image_url"
                  :preview="{
                    src: logistics.image_url,
                  }"
                />
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>
        
        <a-tab-pane key="4" tab="区块链记录">
          <a-empty v-if="!traceInfo.blockchain || traceInfo.blockchain.length === 0" description="暂无区块链记录" />
          <a-timeline v-else>
            <a-timeline-item v-for="(block, index) in traceInfo.blockchain" :key="index">
              <template #dot>
                <block-outlined style="font-size: 16px" />
              </template>
              <div class="timeline-content">
                <h4>区块 #{{ block.block_number }}</h4>
                <p>交易哈希: <a-typography-text copyable>{{ block.tx_hash }}</a-typography-text></p>
                <p>时间戳: {{ formatDate(block.timestamp) }}</p>
                <p>操作类型: {{ getOperationTypeText(block.operation_type) }}</p>
                <p>操作人: {{ block.operator_name }} ({{ block.operator_role }})</p>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>
      </a-tabs>
    </div>
    
    <a-empty v-else-if="searched && !traceInfo" description="未找到产品信息，请检查SKU码是否正确" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { SwapOutlined, CarOutlined, BlockOutlined } from '@ant-design/icons-vue'
import { queryApi } from '../../api/query'
import type { ProductTraceInfo } from '../../api/query'

// 搜索状态
const searchSku = ref('')
const searching = ref(false)
const loading = ref(false)
const searched = ref(false)

// 溯源信息
const traceInfo = ref<ProductTraceInfo | null>(null)

// 区块链验证结果
const verifyResult = ref<{ verified: boolean; message?: string } | null>(null)

// 处理搜索
const handleSearch = async (sku: string) => {
  if (!sku) {
    message.warning('请输入产品SKU码')
    return
  }
  
  searching.value = true
  loading.value = true
  searched.value = true
  
  try {
    // 查询产品溯源信息
    const res = await queryApi.queryProductBySKU(sku)
    traceInfo.value = res.data || null
    
    // 验证区块链数据
    if (traceInfo.value) {
      try {
        const verifyRes = await queryApi.verifyBlockchain(sku)
        verifyResult.value = {
          verified: verifyRes.verified,
          message: verifyRes.message
        }
      } catch (error) {
        verifyResult.value = {
          verified: false,
          message: '区块链验证失败'
        }
      }
    }
  } catch (error: any) {
    message.error(error.message || '查询失败')
    traceInfo.value = null
  } finally {
    searching.value = false
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 新增时间格式化方法
const formatBlockchainTime = (timestamp: string) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 完善操作类型映射
const getOperationTypeText = (type: number) => {
  const types = {
    1: '生产入库',
    2: '经销商入库', 
    3: '物流运输',
    4: '销售出库'
  }
  return types[type] || '未知操作'
}
const getOperationTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'create': '创建产品',
    'transfer': '产品交接',
    'logistics': '物流记录',
    'update': '更新信息'
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.product-trace-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}

.search-container {
  max-width: 600px;
  margin: 0 auto 40px;
}

.loading-container {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.result-container {
  margin-top: 24px;
}

.timeline-content {
  margin-bottom: 16px;
}

.timeline-content h4 {
  margin-bottom: 8px;
  font-weight: 500;
}

.timeline-content p {
  margin-bottom: 4px;
}
</style>