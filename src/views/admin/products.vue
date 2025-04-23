<template>
  <div class="product-management">
    <a-card title="产品管理">
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchValue"
            placeholder="请输入产品名称或SKU"
            style="width: 300px"
            @search="onSearch"
          />
          <a-button type="primary" @click="showAddModal">
            <template #icon><PlusOutlined /></template>
            添加产品
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="productList"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #action="{ record }">
          <a-space>
            <a-button size="small" @click="showEditModal(record)">编辑</a-button>
            <a-button size="small" danger @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { adminApi } from '../../api/admin'

const loading = ref(false)
const searchValue = ref('')
const productList = ref<any[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const columns = [
  {
    title: '产品名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'SKU',
    dataIndex: 'sku',
    key: 'sku',
  },
  {
    title: '品牌',
    dataIndex: 'brand',
    key: 'brand',
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
  },
  {
    title: '库存',
    dataIndex: 'stock',
    key: 'stock',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  }
]

const fetchProductList = async () => {
  loading.value = true
  try {
    const res = await adminApi.getProductList({
      page: pagination.current,
      page_size: pagination.pageSize,
      search: searchValue.value
    })
    productList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    message.error('获取产品列表失败')
  } finally {
    loading.value = false
  }
}

const onSearch = (value: string) => {
  searchValue.value = value
  pagination.current = 1
  fetchProductList()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchProductList()
}

const showAddModal = () => {
  // TODO: 实现添加产品弹窗
}

const showEditModal = (record: any) => {
  // TODO: 实现编辑产品弹窗
}

const handleDelete = (record: any) => {
  // TODO: 实现删除产品
}

onMounted(() => {
  fetchProductList()
})
</script>

<style scoped>
.product-management {
  padding: 20px;
}
.table-operations {
  margin-bottom: 16px;
}
</style>
