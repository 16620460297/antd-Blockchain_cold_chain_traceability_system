<template>
  <div class="add-product-container">
    <h2>添加冷冻品</h2>
    <a-form
      :model="formState"
      :rules="rules"
      ref="formRef"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 14 }"
      @finish="handleSubmit"
    >
      <a-form-item label="产品名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入产品名称" />
      </a-form-item>

      <a-form-item label="品牌" name="brand">
        <a-input v-model:value="formState.brand" placeholder="请输入品牌" />
      </a-form-item>

      <a-form-item label="规格" name="specification">
        <a-input v-model:value="formState.specification" placeholder="请输入规格，如重量、数量等" />
      </a-form-item>

      <a-form-item label="生产日期" name="production_date">
        <a-date-picker
          v-model:value="formState.production_date"
          style="width: 100%"
          :disabledDate="disabledFutureDate"
        />
      </a-form-item>

      <a-form-item label="保质期" name="expiration_date">
        <a-date-picker
          v-model:value="formState.expiration_date"
          style="width: 100%"
          :disabledDate="disabledPastDate"
        />
      </a-form-item>

      <a-form-item label="批次号" name="batch_number">
        <a-input v-model:value="formState.batch_number" placeholder="请输入批次号" />
      </a-form-item>

      <a-form-item label="原材料来源" name="material_source">
        <a-textarea
          v-model:value="formState.material_source"
          placeholder="请输入原材料产地、供应商等信息"
          :rows="2"
        />
      </a-form-item>

      <a-form-item label="加工地点" name="process_location">
        <a-input v-model:value="formState.process_location" placeholder="请输入加工地点" />
      </a-form-item>

      <a-form-item label="加工方式" name="process_method">
        <a-textarea
          v-model:value="formState.process_method"
          placeholder="请输入加工方式，如冷冻方法等"
          :rows="2"
        />
      </a-form-item>

      <a-form-item label="运输温度(°C)" name="transport_temp">
        <a-input-number
          v-model:value="formState.transport_temp"
          :min="-50"
          :max="30"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item label="存储条件" name="storage_condition">
        <a-textarea
          v-model:value="formState.storage_condition"
          placeholder="请输入存储温度要求及其他环境控制措施"
          :rows="2"
        />
      </a-form-item>

      <a-form-item label="安全检测结果" name="safety_testing">
        <a-textarea
          v-model:value="formState.safety_testing"
          placeholder="请输入微生物检测、化学残留检测等结果"
          :rows="2"
        />
      </a-form-item>

      <a-form-item label="质量评级" name="quality_rating">
        <a-select v-model:value="formState.quality_rating" placeholder="请选择质量评级">
          <a-select-option value="优质">优质</a-select-option>
          <a-select-option value="良好">良好</a-select-option>
          <a-select-option value="合格">合格</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="产品图片" name="image_file">
        <a-upload
          v-model:fileList="fileList"
          list-type="picture-card"
          :before-upload="beforeUpload"
          @preview="handlePreview"
          :maxCount="1"
        >
          <div v-if="fileList.length < 1">
            <plus-outlined />
            <div style="margin-top: 8px">上传</div>
          </div>
        </a-upload>
        <a-modal
          :visible="previewVisible"
          :title="previewTitle"
          :footer="null"
          @cancel="handleCancel"
        >
          <img alt="预览图片" style="width: 100%" :src="previewImage" />
        </a-modal>
      </a-form-item>

      <a-form-item :wrapper-col="{ span: 14, offset: 6 }">
        <a-button type="primary" html-type="submit" :loading="submitting">提交</a-button>
        <a-button style="margin-left: 10px" @click="resetForm">重置</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { FormInstance, UploadProps } from 'ant-design-vue'
import { factoryApi } from '../../api/factory'
import type { AddProductRequest } from '../../api/factory'
import dayjs from 'dayjs'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 图片预览相关
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')
const fileList = ref<any[]>([])

// 表单状态
const formState = reactive<AddProductRequest & { production_date: any; expiration_date: any }>({ 
  name: '',
  brand: '',
  specification: '',
  production_date: null,
  expiration_date: null,
  batch_number: '',
  material_source: '',
  process_location: '',
  process_method: '',
  transport_temp: -18, // 默认冷冻温度
  storage_condition: '',
  safety_testing: '',
  quality_rating: '合格'
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  specification: [{ required: true, message: '请输入规格', trigger: 'blur' }],
  production_date: [{ required: true, message: '请选择生产日期', trigger: 'change' }],
  expiration_date: [{ required: true, message: '请选择保质期', trigger: 'change' }],
  batch_number: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  material_source: [{ required: true, message: '请输入原材料来源', trigger: 'blur' }],
  process_location: [{ required: true, message: '请输入加工地点', trigger: 'blur' }],
  process_method: [{ required: true, message: '请输入加工方式', trigger: 'blur' }],
  transport_temp: [{ required: true, message: '请输入运输温度', trigger: 'change' }],
  storage_condition: [{ required: true, message: '请输入存储条件', trigger: 'blur' }],
  safety_testing: [{ required: true, message: '请输入安全检测结果', trigger: 'blur' }],
  quality_rating: [{ required: true, message: '请选择质量评级', trigger: 'change' }]
}

// 禁用未来日期（用于生产日期）
const disabledFutureDate = (current: Date) => {
  return current && current > new Date()
}

// 禁用过去日期（用于保质期）
const disabledPastDate = (current: Date) => {
  return current && current < new Date()
}

// 图片上传前处理
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
  }
  
  // 检查文件大小
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过2MB!')
  }
  
  // 阻止自动上传，我们将在表单提交时手动上传
  return false
}

// 图片预览处理
const handlePreview = async (file: any) => {
  if (!file.url && !file.preview) {
    file.preview = await getBase64(file.originFileObj)
  }
  previewImage.value = file.url || file.preview
  previewVisible.value = true
  previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
}

// 关闭预览
const handleCancel = () => {
  previewVisible.value = false
}

// 将文件转换为Base64
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
    
    // 准备提交数据
    const formData: AddProductRequest = {
      name: formState.name,
      brand: formState.brand,
      specification: formState.specification,
      production_date: dayjs(formState.production_date).format('YYYY-MM-DD'),
      expiration_date: dayjs(formState.expiration_date).format('YYYY-MM-DD'),
      batch_number: formState.batch_number,
      material_source: formState.material_source,
      process_location: formState.process_location,
      process_method: formState.process_method,
      transport_temp: formState.transport_temp,
      storage_condition: formState.storage_condition,
      safety_testing: formState.safety_testing,
      quality_rating: formState.quality_rating
    }
    
    // 获取图片文件
    const imageFile = fileList.value.length > 0 ? fileList.value[0].originFileObj : undefined
    
    // 提交到API
    await factoryApi.addProduct(formData, imageFile)
    
    message.success('产品添加成功，等待审核')
    router.push('/factory/products')
  } catch (error: any) {
    message.error(error.message || '提交失败，请检查表单')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  fileList.value = []
}
</script>

<style scoped>
.add-product-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 24px;
  text-align: center;
}
</style>