<template>
  <div class="products-container">
    <div class="page-header">
      <h2>产品管理</h2>
      <a-button type="primary" @click="goToAddProduct">
        <template #icon><PlusOutlined /></template>
        添加产品
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="products"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'orange'">
            {{ record.status === 1 ? '已发布' : '待审核' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'image'">
          <img
            v-if="record.image_url"
            :src="record.image_url"
            alt="产品图片"
            class="product-image"
            @click="() => previewImage(record.image_url)"
          />
          <span v-else>无图片</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="() => viewProductDetail(record)">
              详情
            </a-button>
            <a-button 
              type="link" 
              size="small" 
              @click="() => transferProduct(record)"
              :disabled="record.status !== 1"
            >
              交接
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
        <a-descriptions-item label="质量评级">
          {{ currentProduct.quality_rating }}
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="currentProduct.status === 1 ? 'green' : 'orange'">
            {{ currentProduct.status === 1 ? '已发布' : '待审核' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ formatDate(currentProduct.created_at) }}
        </a-descriptions-item>
        <a-descriptions-item label="产品图片" :span="2">
          <img
            v-if="currentProduct.image_url"
            :src="currentProduct.image_url"
            alt="产品图片"
            class="product-detail-image"
            @click="() => previewImage(currentProduct.image_url)"
          />
          <span v-else>无图片</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 图片预览 -->
    <a-image
      :visible="previewVisible"
      :src="previewImageUrl"
      @visibleChange="handlePreviewVisibleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { factoryApi } from '../../api/factory'
import type { ProductInfo } from '../../api/factory'

const router = useRouter()
const loading = ref(false)
const products = ref<ProductInfo[]>([])
const currentProduct = ref<ProductInfo | null>(null)
const detailVisible = ref(false)
const previewVisible = ref(false)
const previewImageUrl = ref('')

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
    width: 180
  },
  {
    title: '产品名称',
    dataIndex: 'name',
    key: 'name',
    width: 150
  },
  {
    title: '品牌',
    dataIndex: 'brand',
    key: 'brand',
    width: 120
  },
  {
    title: '批次号',
    dataIndex: 'batch_number',
    key: 'batch_number',
    width: 120
  },
  {
    title: '生产日期',
    dataIndex: 'production_date',
    key: 'production_date',
    width: 120,
    render: (text: string) => formatDate(text)
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '图片',
    key: 'image',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 120
  }
]

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

// 获取产品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await factoryApi.getProducts({
      page: pagination.current,
      page_size: pagination.pageSize
    })
    products.value = res.products
    pagination.total = res.total
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
  fetchProducts()
}

// 查看产品详情
const viewProductDetail = (record: ProductInfo) => {
  currentProduct.value = record
  detailVisible.value = true
}

// 预览图片
const previewImage = (url: string) => {
  previewImageUrl.value = url
  previewVisible.value = true
}

// 处理预览可见性变化
const handlePreviewVisibleChange = (visible: boolean) => {
  previewVisible.value = visible
}

// 跳转到添加产品页面
const goToAddProduct = () => {
  router.push('/factory/add-product')
}

// 跳转到产品交接页面
const transferProduct = (record: ProductInfo) => {
  router.push({
    path: '/factory/transfer-product',
    query: { sku: record.sku }
  })
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.products-container {
  padding: 0 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.product-detail-image {
  max-width: 300px;
  max-height: 300px;
  object-fit: contain;
  cursor: pointer;
}
</style>