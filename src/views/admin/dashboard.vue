<template>
  <div class="dashboard-container">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="用户统计" :bordered="false">
          <div class="statistic-content">
            <a-statistic title="总用户数" :value="userCount" />
            <a-statistic title="今日新增" :value="newUserCount" style="margin-top: 16px" />
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="产品统计" :bordered="false">
          <div class="statistic-content">
            <a-statistic title="总产品数" :value="productCount" />
            <a-statistic title="今日新增" :value="newProductCount" style="margin-top: 16px" />
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="系统状态" :bordered="false">
          <div class="statistic-content">
            <a-statistic title="正常运行" :value="uptime" suffix="天" />
            <a-statistic title="区块链高度" :value="blockHeight" style="margin-top: 16px" />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { adminApi } from '../../api/admin'

const userCount = ref(0)
const newUserCount = ref(0)
const productCount = ref(0)
const newProductCount = ref(0)
const uptime = ref(0)
const blockHeight = ref(0)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await adminApi.getDashboardData()
    console.log('API响应数据:', res)
    
    if (!res) {
      throw new Error('API返回数据为空')
    }
    
    userCount.value = res.user_stats?.total_users || 0
    newUserCount.value = res.user_stats?.pending_users || 0
    productCount.value = res.product_stats?.total_products || 0
    newProductCount.value = res.product_stats?.pending_products || 0
    uptime.value = res.blockchain_count || 0
    blockHeight.value = res.transfer_count || 0
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    message.error(`获取仪表盘数据失败: ${error.message}`)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: #fff;
}
.statistic-content {
  padding: 16px;
}
</style>
