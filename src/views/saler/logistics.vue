<template>
  <div class="logistics-container">
    <h2>物流记录管理</h2>
    
    <div class="table-operations">
      <a-button type="primary" @click="router.push('/saler/products')">
        添加物流记录
      </a-button>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="logisticsList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'temperature'">
          {{ record.temperature }}°C
        </template>
        
        <template v-if="column.key === 'humidity'">
          {{ record.humidity }}%
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
          <a-button type="link" @click="showDetail(record)">
            详情
          </a-button>
        </template>
      </template>
    </a-table>
    
    <!-- 物流详情弹窗 -->
    <a-modal
      v-model:visible="detailVisible"
      title="物流详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions bordered :column="2" v-if="currentLogistics">
        <a-descriptions-item label="SKU" :span="2">
          {{ currentLogistics.product_sku }}
        </a-descriptions-item>
        <a-descriptions-item label="物流单号">
          {{ currentLogistics.tracking_no }}
        </a-descriptions-item>
        <a-descriptions-item label="仓储位置">
          {{ currentLogistics.warehouse_location }}
        </a-descriptions-item>
        <a-descriptions-item label="温度">
          {{ currentLogistics.temperature }}°C
        </a-descriptions-item>
        <a-descriptions-item label="湿度">
          {{ currentLogistics.humidity }}%
        </a-descriptions-item>
        <a-descriptions-item label="记录时间">
          {{ formatDate(currentLogistics.created_at) }}
        </a-descriptions-item>
        <a-descriptions-item label="环境照片" :span="2">
          <a-image
            v-if="currentLogistics.image_url"
            :width="200"
            :src="currentLogistics.image_url"
            :preview="{
              src: currentLogistics.image_url,
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
import type { LogisticsRecord } from '../../api/saler'

const router = useRouter()

// 表格加载状态
const loading = ref(false)

// 物流记录列表
const logisticsList = ref<LogisticsRecord[]>([])

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
    title: '物流单号',
    dataIndex: 'tracking_no',
    key: 'tracking_no',
  },
  {
    title: '仓储位置',
    dataIndex: 'warehouse_location',
    key: 'warehouse_location',
  },
  {
    title: '温度',
    dataIndex: 'temperature',
    key: 'temperature',
  },
  {
    title: '湿度',
    dataIndex: 'humidity',
    key: 'humidity',
  },
  {
    title: '记录时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (text: string) => formatDate(text)
  },
  {
    title: '环境照片',
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
const currentLogistics = ref<LogisticsRecord | null>(null)

// 获取物流记录列表
const fetchLogisticsList = async () => {
  loading.value = true
  try {
    const res = await salerApi.getLogisticsList({
      page: pagination.current,
      page_size: pagination.pageSize
    })
    logisticsList.value = res.logistics || []
    pagination.total = res.total || 0
  } catch (error: any) {
    message.error(error.message || '获取物流记录失败')
  } finally {
    loading.value = false
  }
}

// 表格变化处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchLogisticsList()
}

// 显示详情
const showDetail = (record: LogisticsRecord) => {
  currentLogistics.value = record
  detailVisible.value = true
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

onMounted(() => {
  fetchLogisticsList()
})
</script>

<style scoped>
.logistics-container {
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}

.table-operations {
  margin-bottom: 16px;
  text-align: right;
}
</style>