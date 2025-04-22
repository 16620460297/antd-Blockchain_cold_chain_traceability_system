<template>
  <div class="transfer-product-container">
    <h2>产品交接</h2>
    
    <a-alert
      v-if="!productInfo"
      message="请先选择要交接的产品"
      type="info"
      show-icon
    />
    
    <div v-else>
      <a-descriptions title="产品信息" bordered :column="2">
        <a-descriptions-item label="SKU" :span="2">
          {{ productInfo.sku }}
        </a-descriptions-item>
        <a-descriptions-item label="产品名称">
          {{ productInfo.name }}
        </a-descriptions-item>
        <a-descriptions-item label="品牌">
          {{ productInfo.brand }}
        </a-descriptions-item>
        <a-descriptions-item label="规格">
          {{ productInfo.specification }}
        </a-descriptions-item>
        <a-descriptions-item label="批次号">
          {{ productInfo.batch_number }}
        </a-descriptions-item>
      </a-descriptions>
      
      <a-divider />
      
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
        @finish="handleSubmit"
      >
        <a-form-item label="交接对象" name="to_user_id">
          <a-select
            v-model:value="formState.to_user_id"
            placeholder="请选择交接对象"
            :loading="usersLoading"
            :filter-option="filterOption"
            show-search
          >
            <a-select-option v-for="user in userList" :key="user.id" :value="user.id">
              {{ user.real_name }} ({{ user.company_name || '无公司名' }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="备注" name="remarks">
          <a-textarea
            v-model:value="formState.remarks"
            placeholder="请输入交接备注信息"
            :rows="4"
          />
        </a-form-item>
        
        <a-form-item :wrapper-col="{ span: 14, offset: 6 }">
          <a-button type="primary" html-type="submit" :loading="submitting">提交交接</a-button>
          <a-button style="margin-left: 10px" @click="goBack">返回</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { factoryApi } from '../../api/factory'
import type { ProductInfo, TransferRequest } from '../../api/factory'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const productInfo = ref<ProductInfo | null>(null)
const userList = ref<any[]>([])
const usersLoading = ref(false)

// 表单状态
const formState = reactive<TransferRequest>({
  product_sku: '',
  to_user_id: undefined as unknown as number,
  remarks: ''
})

// 表单验证规则
const rules = {
  to_user_id: [{ required: true, message: '请选择交接对象', trigger: 'change' }]
}

// 获取产品信息
const fetchProductInfo = async (sku: string) => {
  try {
    const res = await factoryApi.getProducts({ sku })
    if (res.products && res.products.length > 0) {
      productInfo.value = res.products[0]
      formState.product_sku = sku
    } else {
      message.error('未找到产品信息')
      router.push('/factory/products')
    }
  } catch (error: any) {
    message.error(error.message || '获取产品信息失败')
    router.push('/factory/products')
  }
}

// 获取用户列表（经销商）
const fetchUserList = async () => {
  usersLoading.value = true
  try {
    const res = await factoryApi.getUserList({ user_type: 2, audit_status: 1 })
    userList.value = res.users || []
  } catch (error: any) {
    message.error(error.message || '获取用户列表失败')
  } finally {
    usersLoading.value = false
  }
}

// 筛选选项
const filterOption = (input: string, option: any) => {
  return (
    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
    option.value.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
  )
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true
    
    await factoryApi.transferProduct(formState)
    
    message.success('产品交接申请已提交，等待对方确认')
    router.push('/factory/transfers')
  } catch (error: any) {
    message.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/factory/products')
}

onMounted(async () => {
  const sku = route.query.sku as string
  if (sku) {
    await fetchProductInfo(sku)
  }
  fetchUserList()
})
</script>

<style scoped>
.transfer-product-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}

.ant-descriptions {
  margin-bottom: 24px;
}
</style>