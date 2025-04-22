<template>
  <div class="product-audit-container">
    <h2>产品审核</h2>
    
    <a-table
      :columns="columns"
      :data-source="productList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        
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
              v-if="record.status === 0"
              type="primary" 
              size="small" 
              @click="handleAudit(record, 1)"
            >
              通过
            </a-button>
            <a-button 
              v-if="record.status === 0"
              type="danger" 
              size="small" 
              @click="handleAudit(record, 2)"
            >
              拒绝
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
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(currentProduct.status)">
            {{ getStatusText(currentProduct.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="审核备注" v-if="currentProduct.audit_remark">
          {{ currentProduct.audit_remark }}
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
      
      <div class="modal-footer" style="margin-top: 24px; text-align: right;">
        <a-button @click="detailVisible = false">关闭</a-button>
        <a-button 
          v-if="currentProduct && currentProduct.status === 0" 
          type="primary" 
          style="margin-left: 8px;"
          @click="handleAudit(currentProduct, 1)"
        >
          通过审核
        </a-button>
        <a-button 
          v-if="currentProduct && currentProduct.status === 0" 
          danger 
          style="margin-left: 8px;"
          @click="handleAudit(currentProduct, 2)"
        >
          拒绝审核
        </a-button>
      </div>
    </a-modal>
    
    <!-- 审核弹窗 -->
    <a-modal
      v-model:visible="auditVisible"
      :title="auditStatus === 1 ? '通过审核' : '拒绝审核'"
      @ok="confirmAudit"
      :confirmLoading="auditLoading"
    >
      <a-form :model="auditForm">
        <a-form-item label="审核备注" name="remark">
          <a-textarea 
            v-model:value="auditForm.remark" 
            :rows="4" 
            :placeholder="auditStatus === 1 ? '请输入通过备注（选填）' : '请输入拒绝原因（必填）'"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { adminApi } from '../../api/admin'

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
    title: '批次号',
    dataIndex: 'batch_number',
    key: 'batch_number',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
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

// 审核弹窗
const auditVisible = ref(false)
const auditLoading = ref(false)
const auditStatus = ref(0)
const auditForm = reactive({
  product_id: 0,
  status: 0,
  remark: ''
})

// 获取产品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const res = await adminApi.getProductsForAudit({
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

// 处理审核
const handleAudit = (record: any, status: number) => {
  currentProduct.value = record
  auditStatus.value = status
  auditForm.product_id = record.id
  auditForm.status = status
  auditForm.remark = ''
  auditVisible.value = true
}

// 确认审核
const confirmAudit = async () => {
  // 如果是拒绝审核，必须填写原因
  if (auditForm.status === 2 && !auditForm.remark) {
    message.warning('请填写拒绝原因')
    return
  }
  
  auditLoading.value = true
  try {
    await adminApi.auditProduct(auditForm)
    
    message.success(auditForm.status === 1 ? '审核通过成功' : '审核拒绝成功')
    auditVisible.value = false
    detailVisible.value = false
    fetchProductList()
  } catch (error: any) {
    message.error(error.message || '审核操作失败')
  } finally {
    auditLoading.value = false
  }
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

// 获取状态文本
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝'
  }
  return statusMap[status] || '未知状态'
}

// 获取状态颜色
const getStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    0: 'orange',
    1: 'green',
    2: 'red'
  }
  return colorMap[status] || 'default'
}

onMounted(() => {
  fetchProductList()
})
</script>

<style scoped>
.product-audit-container {
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}
</style>