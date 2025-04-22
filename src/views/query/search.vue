<template>
  <div class="search-container">
    <h2>溯源查询</h2>
    
    <div class="search-form">
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
    
    <div v-else-if="traceInfo" class="result-container">
      <a-tabs default-active-key="1">
        <a-tab-pane key="1" tab="溯源信息">
          <a-descriptions title="产品溯源信息" bordered :column="2">
            <a-descriptions-item label="SKU" :span="2">
              {{ traceInfo.product.sku }}
            </a-descriptions-item>
            <a-descriptions-item label="产品名称">
              {{ traceInfo.product.name }}
            </a-descriptions-item>
            <a-descriptions-item label="生产日期">
              {{ formatDate(traceInfo.product.productionDate) }}
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { queryApi } from '../../api/query'
import type { ProductTraceInfo } from '../../api/query'

const searchSku = ref('')
const searching = ref(false)
const loading = ref(false)
const traceInfo = ref<ProductTraceInfo | null>(null)

const handleSearch = async (sku: string) => {
  if (!sku) {
    message.warning('请输入产品SKU码')
    return
  }
  
  searching.value = true
  loading.value = true
  
  try {
    const res = await queryApi.queryProductBySKU(sku)
    traceInfo.value = res.data || null
  } catch (error: any) {
    message.error(error.message || '查询失败')
    traceInfo.value = null
  } finally {
    searching.value = false
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped>
.search-container {
  padding: 24px;
}
.search-form {
  margin-bottom: 24px;
}
.loading-container {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.result-container {
  margin-top: 24px;
}
</style>