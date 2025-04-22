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

// 获取审核状态名称
const getAuditStatusName = (status: number) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '已拒绝'
    default: return '未知状态'
  }
}
</script>

<template>
  <div class="profile-container">
    <a-card title="个人资料" :loading="loading">
      <div v-if="userStore.isLoggedIn && !loading">
        <a-descriptions bordered>
          <a-descriptions-item label="用户名" :span="3">
            {{ userStore.username }}
          </a-descriptions-item>

          <a-descriptions-item label="用户ID">
            {{ userStore.userId }}
          </a-descriptions-item>

          <a-descriptions-item label="用户类型">
            <a-tag :color="userStore.userType === 3 ? 'blue' : 'green'">
              {{ getUserTypeName(userStore.userType) }}
            </a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="审核状态">
            <a-tag :color="userStore.auditStatus === 1 ? 'success' : userStore.auditStatus === 2 ? 'error' : 'warning'">
              {{ getAuditStatusName(userStore.auditStatus) }}
            </a-tag>
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

          <template v-if="userStore.userType !== 3">
            <a-descriptions-item label="公司名称" :span="3">
              {{ userStore.userInfo.companyName || '未设置' }}
            </a-descriptions-item>

            <a-descriptions-item label="营业执照号" :span="3">
              {{ userStore.userInfo.licenseNo || '未设置' }}
            </a-descriptions-item>
          </template>
        </a-descriptions>

        <div class="action-buttons">
          <a-button type="primary" @click="router.push('/edit-profile')">
            编辑资料
          </a-button>

          <a-button @click="userStore.logout().then(() => router.push('/login'))">
            退出登录
          </a-button>
        </div>
      </div>

      <div v-else-if="!userStore.isLoggedIn && !loading" class="not-logged-in">
        <a-result
            status="warning"
            title="您尚未登录"
            sub-title="请先登录后再查看个人资料"
        >
          <template #extra>
            <a-button type="primary" @click="router.push('/login')">
              去登录
            </a-button>
          </template>
        </a-result>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
}

.not-logged-in {
  padding: 40px 0;
}
</style>
