<template>
  <div class="container">
    <a-card title="Ant Design Vue 示例" style="width: 100%">
      <a-space direction="vertical" style="width: 100%">
        <!-- 基础表单 -->
        <a-form :model="formState" layout="inline">
          <a-form-item label="用户名">
            <a-input v-model:value="formState.username" placeholder="请输入用户名" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="formState.status" style="width: 120px">
              <a-select-option value="active">激活</a-select-option>
              <a-select-option value="inactive">未激活</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">查询</a-button>
          </a-form-item>
        </a-form>

        <!-- 操作按钮 -->
        <div class="actions">
          <a-space>
            <a-button type="primary" @click="showModal">新增用户</a-button>
            <a-button danger :disabled="!selectedRowKeys.length" @click="handleDelete">
              删除选中
            </a-button>
          </a-space>
        </div>

        <!-- 数据表格 -->
        <a-table
            :columns="columns"
            :data-source="dataSource"
            :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            :pagination="{ pageSize: 5 }"
            row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a @click="handleEdit(record)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm
                    title="确定要删除此用户吗?"
                    ok-text="是"
                    cancel-text="否"
                    @confirm="handleDeleteSingle(record.id)"
                >
                  <a>删除</a>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-space>
    </a-card>

    <!-- 用户表单模态框 -->
    <a-modal
        v-model:visible="modalVisible"
        :title="modalTitle"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
    >
      <a-form :model="userForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="userForm.username" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="userForm.email" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="userForm.status">
            <a-radio value="active">激活</a-radio>
            <a-radio value="inactive">未激活</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

interface User {
  id: number;
  username: string;
  email: string;
  status: string;
}

interface FormState {
  username: string;
  status: string;
}

export default defineComponent({
  setup() {
    // 表单状态
    const formState = reactive<FormState>({
      username: '',
      status: 'active',
    });

    // 表格列定义
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: '用户名',
        dataIndex: 'username',
        key: 'username',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: '操作',
        key: 'action',
      },
    ];

    // 表格数据
    const dataSource = ref<User[]>([
      {
        id: 1,
        username: '张三',
        email: 'zhangsan@example.com',
        status: 'active',
      },
      {
        id: 2,
        username: '李四',
        email: 'lisi@example.com',
        status: 'inactive',
      },
      {
        id: 3,
        username: '王五',
        email: 'wangwu@example.com',
        status: 'active',
      },
    ]);

    // 选中行
    const selectedRowKeys = ref<number[]>([]);
    const onSelectChange = (keys: number[]) => {
      selectedRowKeys.value = keys;
    };

    // 模态框状态
    const modalVisible = ref<boolean>(false);
    const modalTitle = ref<string>('新增用户');
    const isEdit = ref<boolean>(false);
    const editId = ref<number | null>(null);

    // 用户表单
    const userForm = reactive<Omit<User, 'id'>>({
      username: '',
      email: '',
      status: 'active',
    });

    // 搜索处理
    const handleSearch = () => {
      message.success('执行查询: ' + JSON.stringify(formState));
      // 实际应用中这里会调用API进行查询
    };

    // 显示模态框
    const showModal = () => {
      resetForm();
      isEdit.value = false;
      modalTitle.value = '新增用户';
      modalVisible.value = true;
    };

    // 编辑用户
    const handleEdit = (record: User) => {
      userForm.username = record.username;
      userForm.email = record.email;
      userForm.status = record.status;
      editId.value = record.id;
      isEdit.value = true;
      modalTitle.value = '编辑用户';
      modalVisible.value = true;
    };

    // 删除单个用户
    const handleDeleteSingle = (id: number) => {
      dataSource.value = dataSource.value.filter(item => item.id !== id);
      message.success('删除成功');
    };

    // 批量删除
    const handleDelete = () => {
      dataSource.value = dataSource.value.filter(
          item => !selectedRowKeys.value.includes(item.id)
      );
      selectedRowKeys.value = [];
      message.success('批量删除成功');
    };

    // 模态框确认
    const handleModalOk = () => {
      if (isEdit.value && editId.value !== null) {
        // 编辑现有用户
        const index = dataSource.value.findIndex(item => item.id === editId.value);
        if (index !== -1) {
          dataSource.value[index] = {
            ...dataSource.value[index],
            ...userForm,
          };
        }
        message.success('编辑成功');
      } else {
        // 添加新用户
        const newId = Math.max(...dataSource.value.map(item => item.id), 0) + 1;
        dataSource.value.push({
          id: newId,
          ...userForm,
        });
        message.success('添加成功');
      }
      modalVisible.value = false;
    };

    // 模态框取消
    const handleModalCancel = () => {
      modalVisible.value = false;
    };

    // 重置表单
    const resetForm = () => {
      userForm.username = '';
      userForm.email = '';
      userForm.status = 'active';
      editId.value = null;
    };

    return {
      formState,
      columns,
      dataSource,
      selectedRowKeys,
      onSelectChange,
      modalVisible,
      modalTitle,
      userForm,
      handleSearch,
      showModal,
      handleEdit,
      handleDeleteSingle,
      handleDelete,
      handleModalOk,
      handleModalCancel,
    };
  },
});
</script>

<style scoped>
.container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
.actions {
  margin: 16px 0;
}
</style>
