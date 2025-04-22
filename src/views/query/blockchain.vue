<template>
  <div class="blockchain-container">
    <h2>区块链数据查询</h2>
    
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
      <a-spin tip="正在查询区块链数据..." />
    </div>
    
    <div v-else-if="blockchainData" class="result-container">
      <a-tabs default-active-key="1">
        <a-tab-pane key="1" tab="区块链记录">
          <a-empty v-if="!blockchainData.length" description="暂无区块链记录" />
          <a-timeline v-else>
            <a-timeline-item v-for="(block, index) in blockchainData" :key="index">
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
    
    <a-empty v-else-if="searched && !blockchainData" description="未找到区块链数据，请检查SKU码是否正确" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { BlockOutlined } from '@ant-design/icons-vue'
import { queryApi } from '../../api/query'

// 搜索状态
const searchSku = ref('')
const searching = ref(false)
const loading = ref(false)
const searched = ref(false)

// 区块链数据
const blockchainData = ref<any[]>([])

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
    const res = await queryApi.getBlockchainData(sku)
    blockchainData.value = res.data || []
  } catch (error: any) {
    message.error(error.message || '查询区块链数据失败')
    blockchainData.value = []
  } finally {
    searching.value = false
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

// 获取操作类型文本
const getOperationTypeText = (type: string) => {
  const types: Record<string, string> = {
    'create': '创建',
    'update': '更新',
    'transfer': '转移',
    'verify': '验证'
  }
  return types[type] || type
}
</script>

<style scoped>
.blockchain-container {
  padding: 24px;
}

.search-container {
  margin-bottom: 24px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.timeline-content {
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 4px;
  margin-left: 16px;
}
</style>