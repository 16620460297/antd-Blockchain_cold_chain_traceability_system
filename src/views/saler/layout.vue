<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <h2 v-if="!collapsed">冷链溯源系统</h2>
        <h2 v-else>冷链</h2>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
      >
        <a-menu-item key="products">
          <template #icon>
            <AppstoreOutlined />
          </template>
          <span>产品管理</span>
          <router-link to="/saler/products" />
        </a-menu-item>
        <a-menu-item key="search">
          <template #icon>
            <SearchOutlined />
          </template>
          <span>搜索产品</span>
          <router-link to="/saler/search" />
        </a-menu-item>
        <a-menu-item key="logistics">
          <template #icon>
            <CarOutlined />
          </template>
          <span>物流记录</span>
          <router-link to="/saler/logistics" />
        </a-menu-item>
        <a-menu-item key="add-logistics">
          <template #icon>
            <PlusOutlined />
          </template>
          <span>添加物流</span>
          <router-link to="/saler/add-logistics" />
        </a-menu-item>
        <a-menu-item key="transfers">
          <template #icon>
            <SwapOutlined />
          </template>
          <span>交接确认</span>
          <router-link to="/saler/transfers" />
        </a-menu-item>
        <a-menu-item key="dashboard">
          <template #icon>
            <UserOutlined />
          </template>
          <span>个人资料</span>
          <router-link to="/dashboard" />
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0">
        <div class="header-right">
          <a-dropdown>
            <a class="ant-dropdown-link" @click.prevent>
              <UserOutlined /> {{ userStore.username }}
              <DownOutlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item>
                  <router-link to="/dashboard">个人资料</router-link>
                </a-menu-item>
                <a-menu-item @click="handleLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <div :style="{ padding: '24px', background: '#fff', minHeight: '360px' }">
          <router-view />
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        冷链溯源系统 ©{{ new Date().getFullYear() }} 基于区块链的冷冻品溯源系统
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  AppstoreOutlined,
  SearchOutlined,
  CarOutlined,
  PlusOutlined,
  SwapOutlined,
  DownOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref<boolean>(false)

// 根据当前路由设置选中的菜单项
const selectedKeys = ref<string[]>([])

onMounted(() => {
  const pathParts = route.path.split('/')
  const currentPage = pathParts[pathParts.length - 1]
  selectedKeys.value = [currentPage]
})

watch(
  () => route.path,
  (newPath) => {
    const pathParts = newPath.split('/')
    const currentPage = pathParts[pathParts.length - 1]
    selectedKeys.value = [currentPage]
  }
)

const handleLogout = async () => {
  try {
    await userStore.logout()
    message.success('退出登录成功')
    router.push('/login')
  } catch (error) {
    message.error('退出登录失败')
  }
}
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  color: white;
  text-align: center;
  line-height: 32px;
  white-space: nowrap;
  overflow: hidden;
}

.header-right {
  float: right;
  margin-right: 20px;
}

.ant-dropdown-link {
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
}
</style>