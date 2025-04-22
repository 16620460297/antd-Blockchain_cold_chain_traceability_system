<template>
  <div class="query-result-container">
    <a-card :title="'溯源结果: ' + $route.params.sku">
      <!-- 这里添加溯源结果展示内容 -->
      <p>商品SKU: {{ $route.params.sku }}</p>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.query-result-container {
  padding: 20px;
}
</style>