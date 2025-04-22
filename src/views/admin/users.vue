<template>
  <div class="user-management">
    <a-card title="用户管理">
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchValue"
            placeholder="请输入用户名或手机号"
            style="width: 300px"
            @search="onSearch"
          />
          <a-button type="primary" @click="showAddModal">
            <template #icon><UserAddOutlined /></template>
            添加用户
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="userList"
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
import { UserAddOutlined } from '@ant-design/icons-vue'
import { adminApi } from '@/api/admin'

const loading = ref(false)
const searchValue = ref('')
const userList = ref<any[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: '用户类型',
    dataIndex: 'userType',
    key: 'userType',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  }
]

const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await adminApi.getUserList({
      page: pagination.current,
      page_size: pagination.pageSize,
      search: searchValue.value
    })
    userList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const onSearch = (value: string) => {
  searchValue.value = value
  pagination.current = 1
  fetchUserList()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchUserList()
}

const showAddModal = () => {
  // TODO: 实现添加用户弹窗
}

const showEditModal = (record: any) => {
  // TODO: 实现编辑用户弹窗
}

const handleDelete = (record: any) => {
  // TODO: 实现删除用户
}

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}
.table-operations {
  margin-bottom: 16px;
}
</style>