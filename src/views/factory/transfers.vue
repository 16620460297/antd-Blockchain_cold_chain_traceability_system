<template>
  <div class="transfers-container">
    <h2>厂家交接记录</h2>
    
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
        <a-descriptions-item label="产品SKU" :span="2">
          {{ currentTransfer.product_sku }}
        </a-descriptions-item>
        <a-descriptions-item label="交接对象">
          {{ currentTransfer.to_user_name }}
        </a-descriptions-item>
        <a-descriptions-item label="交接时间">
          {{ formatTime(currentTransfer.created_at) }}
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(currentTransfer.status)">
            {{ getStatusText(currentTransfer.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">
          {{ currentTransfer.remarks || '无' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { factoryApi } from '../../api/factory'
import type { TransferRecord } from '../../api/factory'

const loading = ref(false)
const transferList = ref<TransferRecord[]>([])
const currentTransfer = ref<TransferRecord | null>(null)
const detailVisible = ref(false)

// 表格列定义
const columns = [
  {
    title: '产品SKU',
    dataIndex: 'product_sku',
    key: 'product_sku'
  },
  {
    title: '交接对象',
    dataIndex: 'to_user_name',
    key: 'to_user_name'
  },
  {
    title: '交接时间',
    dataIndex: 'created_at',
    key: 'created_at',
    customRender: ({ text }: { text: string }) => formatTime(text)
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '操作',
    key: 'action'
  }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
})

// 获取交接记录
const fetchTransfers = async () => {
  try {
    loading.value = true
    const res = await factoryApi.getTransferRecords({
      page: pagination.current,
      page_size: pagination.pageSize
    })
    transferList.value = res.transfers || []
    pagination.total = res.total || 0
  } catch (error: any) {
    message.error(error.message || '获取交接记录失败')
  } finally {
    loading.value = false
  }
}

// 表格分页变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchTransfers()
}

// 显示详情
const showDetail = (record: TransferRecord) => {
  currentTransfer.value = record
  detailVisible.value = true
}

// 格式化时间
const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString()
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
  fetchTransfers()
})
</script>

<style scoped>
.transfers-container {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}
</style>