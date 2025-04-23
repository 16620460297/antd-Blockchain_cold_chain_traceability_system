<template>
  <div class="add-user">
    <a-card title="添加用户">
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 14 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="formState.password" />
        </a-form-item>

        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="formState.phone" />
        </a-form-item>

        <a-form-item label="用户类型" name="userType">
          <a-select v-model:value="formState.userType">
            <a-select-option value="1">普通用户</a-select-option>
            <a-select-option value="2">企业用户</a-select-option>
            <a-select-option value="3">管理员</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :wrapper-col="{ span: 14, offset: 4 }">
          <a-button type="primary" @click="onSubmit">提交</a-button>
          <a-button style="margin-left: 10px" @click="resetForm">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { adminApi } from '../../api/admin'

const formRef = ref()

const formState = reactive({
  username: '',
  password: '',
  phone: '',
  userType: '1'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 16, message: '用户名长度4-16位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const onSubmit = () => {
  formRef.value
    .validate()
    .then(async () => {
      try {
        await adminApi.addUser(formState)
        message.success('添加用户成功')
        resetForm()
      } catch (error) {
        message.error('添加用户失败')
      }
    })
    .catch(() => {
      message.error('表单验证失败')
    })
}

const resetForm = () => {
  formRef.value.resetFields()
}
</script>

<style scoped>
.add-user {
  padding: 20px;
}
</style>
