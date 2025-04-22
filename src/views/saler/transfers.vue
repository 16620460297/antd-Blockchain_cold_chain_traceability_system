<template>
  <div class="transfers-container">
    <h2>产品交接确认</h2>
    
    <a-table
      :columns="columns"
      :data-source="transferList"
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
        
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button 
              type="primary" 
              size="small" 
              @click="handleConfirm(record)"
              :disabled="record.status !== 0"
            >
              确认交接
            </a-button>
            <a-button 
              type="primary" 
              size="small" 
              @click="showDetail(record)"
            >
              查看详情
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 交接详情弹窗 -->
    <a-modal
      v-model:visible="detailVisible"
      title="交接详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions bordered :column="2" v-if="currentTransfer">
        <a-descriptions-item label="SKU" :span="2">
          {{ currentTransfer.product_sku }}
        </a-descriptions-item>
        <a-descriptions-item label="产品名称">
          {{ currentTransfer.product_name }}
        </a-descriptions-item>
        <a-descriptions-item label="品牌">
          {{ currentTransfer.product_brand }}
        </a-descriptions-item>
        <a-descriptions-item label="规格">
          {{ currentTransfer.product_specification }}
        </a-descriptions-item>
        <a-descriptions-item label="批次号">
          {{ currentTransfer.product_batch_number }}
        </a-descriptions-item>
        <a-descriptions-item label="交接时间">
          {{ formatDate(currentTransfer.created_at) }}
        </a-descriptions-item>
        <a-descriptions-item label="交接状态" :span="2">
          <a-tag :color="getStatusColor(currentTransfer.status)">
            {{ getStatusText(currentTransfer.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="交接备注" :span="2">
          {{ currentTransfer.remarks || '无' }}
        </a-descriptions-item>
      </a-descriptions>
      
      <div class="modal-footer" style="margin-top: 24px; text-align: right;">
        <a-button @click="detailVisible = false">关闭</a-button>
        <a-button 
          v-if="currentTransfer && currentTransfer.status === 0" 
          type="primary" 
          style="margin-left: 8px;"
          @click="handleConfirm(currentTransfer)"
        >
          确认交接
        </a-button>
      </div>
    </a-modal>
    
    <!-- 确认交接弹窗 -->
    <a-modal
      v-model:visible="confirmVisible"
      title="确认交接"
      @ok="confirmTransfer"
      :confirmLoading="confirmLoading"
    >
      <p>确认接收产品 {{ currentTransfer?.product_name }} (SKU: {{ currentTransfer?.product_sku }}) 吗？</p>
      <p>确认后，该产品将归属于您的账户，您将负责该产品的后续物流和仓储记录。</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { salerApi } from '../../api/saler'
import type { TransferConfirmRequest } from '../../api/saler'

// 表格加载状态
const loading = ref(false)

// 交接列表
const transferList = ref<any[]>([])

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
    dataIndex: 'product_sku',
    key: 'product_sku',
  },
  {
    title: '产品名称',
    dataIndex: 'product_name',
    key: 'product_name',
  },
  {
    title: '品牌',
    dataIndex: 'product_brand',
    key: 'product_brand',
  },
  {
    title: '批次号',
    dataIndex: 'product_batch_number',
    key: 'product_batch_number',
  },
  {
    title: '交接时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (text: string) => formatDate(text)
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '操作',
    key: 'action',
  }
]

// 详情弹窗
const detailVisible = ref(false)
const currentTransfer = ref<any>(null)

// 确认弹窗
const confirmVisible = ref(false)
const confirmLoading = ref(false)

// 获取交接列表
const fetchTransferList = async () => {
  loading.value = true
  try {
    const res = await salerApi.getProducts({
      page: pagination.current,
      page_size: pagination.pageSize,
      transfer_status: 'pending' // 获取待确认的交接
    })
    transferList.value = res.transfers || []
    pagination.total = res.total || 0
  } catch (error: any) {
    message.error(error.message || '获取交接列表失败')
  } finally {
    loading.value = false
  }
}

// 表格变化处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchTransferList()
}

// 显示详情
const showDetail = (record: any) => {
  currentTransfer.value = record
  detailVisible.value = true
}

// 处理确认交接
const handleConfirm = (record: any) => {
  currentTransfer.value = record
  confirmVisible.value = true
}

// 确认交接
const confirmTransfer = async () => {
  if (!currentTransfer.value) return
  
  confirmLoading.value = true
  try {
    const data: TransferConfirmRequest = {
      transfer_id: currentTransfer.value.id
    }
    
    await salerApi.confirmTransfer(data)
    
    message.success('产品交接确认成功')
    confirmVisible.value = false
    detailVisible.value = false
    fetchTransferList()
  } catch (error: any) {
    message.error(error.message || '确认交接失败')
  } finally {
    confirmLoading.value = false
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

// 获取状态文本
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待确认',
    1: '已确认',
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
  fetchTransferList()
})
</script>

<style scoped>
.transfers-container {
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}
</style>