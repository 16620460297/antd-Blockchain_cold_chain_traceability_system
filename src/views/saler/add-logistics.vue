<template>
  <div class="add-logistics-container">
    <h2>添加物流信息</h2>
    
    <a-alert
      v-if="!productInfo"
      message="请先选择要添加物流信息的产品"
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
        <a-form-item label="物流单号" name="tracking_no">
          <a-input v-model:value="formState.tracking_no" placeholder="请输入物流单号" />
        </a-form-item>
        
        <a-form-item label="仓储位置" name="warehouse_location">
          <a-input v-model:value="formState.warehouse_location" placeholder="请输入仓储位置" />
        </a-form-item>
        
        <a-form-item label="温度(°C)" name="temperature">
          <a-input-number 
            v-model:value="formState.temperature" 
            :precision="1"
            style="width: 100%"
            placeholder="请输入冷链温度"
          />
        </a-form-item>
        
        <a-form-item label="湿度(%)" name="humidity">
          <a-input-number 
            v-model:value="formState.humidity" 
            :min="0" 
            :max="100"
            :precision="1"
            style="width: 100%"
            placeholder="请输入仓储湿度"
          />
        </a-form-item>
        
        <a-form-item label="环境照片" name="image_file">
          <a-upload
            v-model:fileList="fileList"
            list-type="picture-card"
            :before-upload="beforeUpload"
            @preview="handlePreview"
            :maxCount="1"
          >
            <div v-if="fileList.length < 1">
              <upload-outlined />
              <div style="margin-top: 8px">上传</div>
            </div>
          </a-upload>
          <a-modal
            :visible="previewVisible"
            :title="previewTitle"
            :footer="null"
            @cancel="previewVisible = false"
          >
            <img alt="example" style="width: 100%" :src="previewImage" />
          </a-modal>
        </a-form-item>
        
        <a-form-item :wrapper-col="{ span: 14, offset: 6 }">
          <a-button type="primary" html-type="submit" :loading="submitting">提交记录</a-button>
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
import type { FormInstance, UploadProps } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { salerApi } from '../../api/saler'
import type { LogisticsRequest } from '../../api/saler'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const productInfo = ref<any>(null)

// 上传图片相关
const fileList = ref<any[]>([])
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

// 表单状态
const formState = reactive<LogisticsRequest>({
  product_sku: '',
  tracking_no: '',
  warehouse_location: '',
  temperature: 0,
  humidity: 0
})

// 表单验证规则
const rules = {
  tracking_no: [{ required: true, message: '请输入物流单号', trigger: 'blur' }],
  warehouse_location: [{ required: true, message: '请输入仓储位置', trigger: 'blur' }],
  temperature: [{ required: true, message: '请输入温度', trigger: 'change' }],
  humidity: [{ required: true, message: '请输入湿度', trigger: 'change' }]
}

// 获取产品信息
const fetchProductInfo = async (sku: string) => {
  try {
    const res = await salerApi.searchProducts({ sku })
    if (res.products && res.products.length > 0) {
      productInfo.value = res.products[0]
      formState.product_sku = sku
    } else {
      message.error('未找到产品信息')
      router.push('/saler/products')
    }
  } catch (error: any) {
    message.error(error.message || '获取产品信息失败')
    router.push('/saler/products')
  }
}

// 上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传JPG或PNG格式的图片!')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过2MB!')
  }
  return false
}

// 预览图片
const handlePreview = async (file: any) => {
  if (!file.url && !file.preview) {
    file.preview = await getBase64(file.originFileObj)
  }
  previewImage.value = file.url || file.preview
  previewVisible.value = true
  previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
}

// 转换为Base64
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true
    
    // 获取上传的图片文件
    const imageFile = fileList.value[0]?.originFileObj
    
    await salerApi.addLogistics(formState, imageFile)
    
    message.success('物流信息添加成功')
    router.push('/saler/logistics')
  } catch (error: any) {
    message.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/saler/products')
}

onMounted(async () => {
  const sku = route.query.sku as string
  if (sku) {
    await fetchProductInfo(sku)
  }
})
</script>

<style scoped>
.add-logistics-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}

.ant-descriptions {
  margin-bottom: 24px;
}
</style>