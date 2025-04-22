<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const router = useRouter()
const loading = ref(true)

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    message.warning('您尚未登录，请先登录')
    router.push('/login')
    return
  }

  // 如果有token但没有用户信息，尝试获取用户信息
  if (!userStore.userInfo.userID) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      message.error('获取用户信息失败，请重新登录')
      await userStore.logout()
      router.push('/login')
      return
    }
  }

  // 如果用户已经通过审核，则重定向到首页
  if (userStore.userType === 3 || userStore.auditStatus === 1) {
    message.success('您的账号已通过审核，正在跳转到首页')
    router.push(userStore.getHomeRoute())
    return
  }

  loading.value = false
})

// 获取用户类型名称
const getUserTypeName = (type: number) => {
  switch (type) {
    case 0: return '系统管理员'
    case 1: return '生产商'
    case 2: return '物流商'
    case 3: return '消费者'
    default: return '未知类型'
  }
}
</script>

<template>
  <div class="waiting-approval-container">
    <a-card title="账号审核中" :loading="loading">
      <div v-if="!loading">
        <a-result
            status="info"
            title="您的账号正在等待审核"
            sub-title="我们正在审核您提供的信息，请耐心等待。审核通过后即可使用完整功能。"
        >
          <template #extra>
            <a-button @click="() => window.location.reload()">
              刷新状态
            </a-button>
            <a-button type="primary" @click="userStore.logout().then(() => router.push('/login'))">
              退出登录
            </a-button>
          </template>
        </a-result>

        <a-divider>个人资料</a-divider>

        <a-descriptions bordered>
          <a-descriptions-item label="用户名" :span="3">
            {{ userStore.username }}
          </a-descriptions-item>

          <a-descriptions-item label="用户ID">
            {{ userStore.userId }}
          </a-descriptions-item>

          <a-descriptions-item label="用户类型">
            <a-tag color="green">
              {{ getUserTypeName(userStore.userType) }}
            </a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="审核状态">
            <a-tag color="warning">待审核</a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="真实姓名" :span="3">
            {{ userStore.userInfo.realName || '未设置' }}
          </a-descriptions-item>

          <a-descriptions-item label="联系方式" :span="3">
            {{ userStore.userInfo.contact || '未设置' }}
          </a-descriptions-item>

          <a-descriptions-item label="地址" :span="3">
            {{ userStore.userInfo.address || '未设置' }}
          </a-descriptions-item>

          <a-descriptions-item label="公司名称" :span="3">
            {{ userStore.userInfo.companyName || '未设置' }}
          </a-descriptions-item>

          <a-descriptions-item label="营业执照号" :span="3">
            {{ userStore.userInfo.licenseNo || '未设置' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-alert
            class="contact-alert"
            type="info"
            show-icon
            message="联系我们"
            description="如果您有任何疑问或需要加快审核进度，请联系管理员：admin@coldchain.com"
        />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.waiting-approval-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.contact-alert {
  margin-top: 24px;
}

.ant-result {
  padding-bottom: 0;
}

.ant-btn {
  margin: 0 8px;
}
</style>
