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
    userCount.value = res.data.userCount
    newUserCount.value = res.data.newUserCount
    productCount.value = res.data.productCount
    newProductCount.value = res.data.newProductCount
    uptime.value = res.data.uptime
    blockHeight.value = res.data.blockHeight
  } catch (error) {
    message.error('获取仪表盘数据失败')
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
