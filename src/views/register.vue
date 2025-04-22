<script setup lang="ts">
import {computed, reactive, ref} from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { userApi } from '../api/user'

interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  realName: string
  address: string
  contact: string
  userType: number
  companyName: string
  licenseNo: string
}

const formRef = ref<FormInstance>()
const loading = ref(false)
const router = useRouter()

const registerForm = reactive<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  address: '',
  contact: '',
  userType: 3, // 默认为消费者
  companyName: '',
  licenseNo: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== registerForm.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
  userType: [{ required: true, message: '请选择用户类型', trigger: 'change' }]
}

// 动态显示额外表单项
const showExtraFields = computed(() => registerForm.userType !== 3)

const handleRegister = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    try {
      await userApi.register({
        username: registerForm.username,
        password: registerForm.password,
        realName: registerForm.realName,
        address: registerForm.address,
        contact: registerForm.contact,
        userType: registerForm.userType,
        companyName: registerForm.companyName,
        licenseNo: registerForm.licenseNo
      })

      message.success('注册成功，请等待审核')
      router.push('/login')
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试')
    } finally {
      loading.value = false
    }
  } catch (error) {
    console.log('验证失败', error)
  }
}

const toLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-box">
      <h1 class="title">用户注册</h1>
      <a-form
          :model="registerForm"
          :rules="rules"
          ref="formRef"
          layout="vertical"
          @finish="handleRegister"
      >
        <a-form-item name="username" label="用户名">
          <a-input v-model:value="registerForm.username" placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="registerForm.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password v-model:value="registerForm.confirmPassword" placeholder="请再次输入密码" />
        </a-form-item>

        <a-form-item name="userType" label="用户类型">
          <a-radio-group v-model:value="registerForm.userType">
            <a-radio :value="1">生产商</a-radio>
            <a-radio :value="2">物流商</a-radio>
            <a-radio :value="3">消费者</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item name="realName" label="真实姓名">
          <a-input v-model:value="registerForm.realName" placeholder="请输入真实姓名" />
        </a-form-item>

        <a-form-item name="contact" label="联系方式">
          <a-input v-model:value="registerForm.contact" placeholder="请输入联系方式" />
        </a-form-item>

        <a-form-item name="address" label="地址">
          <a-input v-model:value="registerForm.address" placeholder="请输入地址" />
        </a-form-item>

        <template v-if="showExtraFields">
          <a-form-item name="companyName" label="公司名称">
            <a-input v-model:value="registerForm.companyName" placeholder="请输入公司名称" />
          </a-form-item>

          <a-form-item name="licenseNo" label="营业执照号">
            <a-input v-model:value="registerForm.licenseNo" placeholder="请输入营业执照号" />
          </a-form-item>
        </template>

        <a-form-item>
          <a-button
              type="primary"
              html-type="submit"
              :loading="loading"
              block
          >
            注册
          </a-button>
        </a-form-item>

        <div class="footer-links">
          <a-button type="link" @click="toLogin">已有账号？去登录</a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 40px 0;
}

.register-box {
  width: 500px;
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
