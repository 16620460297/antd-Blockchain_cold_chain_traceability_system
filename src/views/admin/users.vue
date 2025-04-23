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
import { adminApi } from '../../api/admin'

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
    title: '联系方式',
    dataIndex: 'contact',
    key: 'contact',
  },
  {
    title: '真实姓名',
    dataIndex: 'real_name',
    key: 'real_name',
  },
  {
    title: '公司名称',
    dataIndex: 'company_name',
    key: 'company_name',
  },
  {
    title: '许可证号',
    dataIndex: 'license_no',
    key: 'license_no',
  },
  {
    title: '地址',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: '用户类型',
    dataIndex: 'user_type',
    key: 'user_type',
    customRender: ({ text }) => {
      const types = {
        1: '普通用户',
        2: '企业用户',
        3: '管理员',
        4: '系统管理员'
      };
      return types[text] || text;
    }
  },
  {
    title: '审核状态',
    dataIndex: 'audit_status',
    key: 'audit_status',
    customRender: ({ text }) => {
      return text === 1 ? '已审核' : '未审核';
    }
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' }
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
    console.log('API返回数据:', res) // 调试日志
    // 检查不同的数据结构可能性
    if (res && Array.isArray(res.users)) {
      console.log('用户列表数据(res.users):', res.users) // 调试日志
      userList.value = res.users
      pagination.total = res.total || res.users.length
    } else if (res && Array.isArray(res)) {
      console.log('用户列表数据(res数组):', res) // 调试日志
      userList.value = res
      pagination.total = res.length
    } else if (res && typeof res === 'object') {
      console.log('API返回对象结构:', Object.keys(res)) // 调试日志
      // 尝试找到数组类型的属性作为用户列表
      const arrayProps = Object.keys(res).filter(key => Array.isArray(res[key]))
      if (arrayProps.length > 0) {
        console.log('找到可能的用户列表属性:', arrayProps) // 调试日志
        userList.value = res[arrayProps[0]]
        pagination.total = res.total || userList.value.length
      }
      }
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
