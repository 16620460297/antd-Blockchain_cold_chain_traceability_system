<template>
  <div class="products-container">
    <h2>产品管理</h2>
    
    <a-table
      :columns="columns"
      :data-source="productList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'image_url'">
          <a-image
            v-if="record.image_url"
            :width="50"
            :src="record.image_url"
            :preview="{
              src: record.image_url,
            }"
          />
          <span v-else>无图片</span>
        </template>
        
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button 
              type="primary" 
              size="small" 
              @click="showDetail(record)"
            >
              详情
            </a-button>
            <a-button 
              type="primary" 
              size="small" 
              @click="addLogistics(record)"
            >
              添加物流信息
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 产品详情弹窗 -->
    <a-modal
      v-model:visible="detailVisible"
      title="产品详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions bordered :column="2" v-if="currentProduct">
        <a-descriptions-item label="SKU" :span="2">
          {{ currentProduct.sku }}
        </a-descriptions-item>
        <a-descriptions-item label="产品名称">
          {{ currentProduct.name }}
        </a-descriptions-item>
        <a-descriptions-item label="品牌">
          {{ currentProduct.brand }}
        </a-descriptions-item>
        <a-descriptions-item label="规格">
          {{ currentProduct.specification }}
        </a-descriptions-item>
        <a-descriptions-item label="生产日期">
          {{ formatDate(currentProduct.production_date) }}
        </a-descriptions-item>
        <a-descriptions-item label="保质期">
          {{ formatDate(currentProduct.expiration_date) }}
        </a-descriptions-item>
        <a-descriptions-item label="批次号">
          {{ currentProduct.batch_number }}
        </a-descriptions-item>
        <a-descriptions-item label="原材料来源">
          {{ currentProduct.material_source }}
        </a-descriptions-item>
        <a-descriptions-item label="加工地点">
          {{ currentProduct.process_location }}
        </a-descriptions-item>
        <a-descriptions-item label="加工方式">
          {{ currentProduct.process_method }}
        </a-descriptions-item>
        <a-descriptions-item label="运输温度">
          {{ currentProduct.transport_temp }}°C
        </a-descriptions-item>
        <a-descriptions-item label="存储条件">
          {{ currentProduct.storage_condition }}
        </a-descriptions-item>
        <a-descriptions-item label="安全检测">
          {{ currentProduct.safety_testing }}
        </a-descriptions-item>
        <a-descriptions-item label="质量等级">
          {{ currentProduct.quality_rating }}
        </a-descriptions-item>
        <a-descriptions-item label="产品图片" :span="2">
          <a-image
            v-if="currentProduct.image_url"
            :width="200"
            :src="currentProduct.image_url"
            :preview="{
              src: currentProduct.image_url,
            }"
          />
          <span v-else>无图片</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { salerApi } from '../../api/saler'

const router = useRouter()

// 表格加载状态
const loading = ref(false)

// 产品列表
const productList = ref<any[]>([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列定义
const columns = [
  {
    title: 'SKU',
    dataIndex: 'sku',
    key: 'sku',
  },
  {
    title: '产品名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '品牌',
    dataIndex: 'brand',
    key: 'brand',
  },
  {
    title: '规格',
    dataIndex: 'specification',
    key: 'specification',
  },
  {
    title: '批次号',
    dataIndex: 'batch_number',
    key: 'batch_number',
  },
  {
    title: '图片',
    dataIndex: 'image_url',
    key: 'image_url',
  },
  {
    title: '操作',
    key: 'action',
  }
]

// 详情弹窗
const detailVisible = ref(false)
const currentProduct = ref<any>(null)

// 获取产品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const res = await salerApi.getProducts({
      page: pagination.current,
      page_size: pagination.pageSize
    })
    productList.value = res.products || []
    pagination.total = res.total || 0
  } catch (error: any) {
    message.error(error.message || '获取产品列表失败')
  } finally {
    loading.value = false
  }
}

// 表格变化处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchProductList()
}

// 显示详情
const showDetail = (record: any) => {
  currentProduct.value = record
  detailVisible.value = true
}

// 添加物流信息
const addLogistics = (record: any) => {
  router.push({
    path: '/saler/add-logistics',
    query: { sku: record.sku }
  })
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  fetchProductList()
})
</script>

<style scoped>
.products-container {
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}
</style>