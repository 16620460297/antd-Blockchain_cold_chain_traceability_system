<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import { useUserStore } from '../stores/user'

interface LoginForm {
  username: string
  password: string
}

const formRef = ref<FormInstance>()
const loading = ref(false)
const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive<LoginForm>({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    try {
      await userStore.login(loginForm.username, loginForm.password)
      message.success('登录成功')
      // 根据用户类型跳转到不同的首页
      router.push({ path: userStore.getHomeRoute() })
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试')
    } finally {
      loading.value = false
    }
  } catch (error) {
    console.log('验证失败', error)
  }
}

const toRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">冷链溯源系统</h1>
      <a-form
          :model="loginForm"
          :rules="rules"
          ref="formRef"
          @finish="handleLogin"
      >
        <a-form-item name="username">
          <a-input
              v-model:value="loginForm.username"
              placeholder="请输入用户名"
              size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
              v-model:value="loginForm.password"
              placeholder="请输入密码"
              size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
              type="primary"
              html-type="submit"
              :loading="loading"
              size="large"
              block
          >
            登录
          </a-button>
        </a-form-item>

        <div class="footer-links">
          <a-button type="link" @click="toRegister">还没有账号？去注册</a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #1890ff;
  font-size: 24px;
}

.footer-links {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
