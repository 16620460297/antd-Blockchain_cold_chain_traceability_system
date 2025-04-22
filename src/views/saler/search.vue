<template>
  <div class="search-container">
    <a-card title="产品搜索" :bordered="false">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="关键词" name="keyword">
          <a-input v-model:value="searchForm.keyword" placeholder="请输入产品名称/批次号" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="productList"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="sku"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="showDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import salerApi from '../../api/saler'

const searchForm = reactive({
  keyword: ''
})

const productList = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  {
    title: '产品名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'SKU',
    dataIndex: 'sku',
    key: 'sku'
  },
  {
    title: '批次号',
    dataIndex: 'batch_number',
    key: 'batch_number'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const handleSearch = async () => {
  loading.value = true
  try {
    const res = await salerApi.searchProducts({
      keyword: searchForm.keyword,
      page: pagination.current,
      page_size: pagination.pageSize
    })
    productList.value = res.products || []
    pagination.total = res.total || 0
  } catch (error: any) {
    message.error(error.message || '搜索产品失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  handleSearch()
}

const showDetail = (record: any) => {
  // 显示产品详情逻辑
  console.log(record)
}
</script>

<style scoped>
.search-container {
  padding: 24px;
}
</style>