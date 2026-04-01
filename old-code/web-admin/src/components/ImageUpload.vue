<template>
    <div>
        <div v-if="imageUrl" class="mb-2">
            <div class="d-flex align-items-center gap-2 mb-2">
                <img 
                    :src="imageUrl" 
                    alt="预览" 
                    style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;"
                    @error="handleImageError"
                />
                <CButton color="danger" size="sm" @click="clearImage">
                    <CIcon icon="cil-trash" />
                    删除
                </CButton>
            </div>
            <div class="text-muted small">
                当前图片URL: {{ imageUrl }}
            </div>
        </div>
        <div v-else class="mb-2">
            <div class="text-muted small mb-2">暂无图片</div>
        </div>
        <div class="d-flex gap-2">
            <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                style="display: none;"
            />
            <CButton 
                color="primary" 
                size="sm" 
                @click="triggerFileSelect"
                :disabled="uploading"
            >
                <CIcon icon="cil-plus" class="me-1" />
                {{ uploading ? '上传中...' : '选择图片' }}
            </CButton>
            <CButton 
                v-if="imageUrl"
                color="secondary" 
                size="sm" 
                @click="editUrl"
            >
                <CIcon icon="cil-pencil" class="me-1" />
                手动输入URL
            </CButton>
        </div>
        <div v-if="showUrlInput" class="mt-2">
            <CFormInput
                v-model="urlInput"
                placeholder="输入图片URL"
                @blur="handleUrlInput"
                @keyup.enter="handleUrlInput"
            />
            <div class="d-flex gap-2 mt-2">
                <CButton color="primary" size="sm" @click="handleUrlInput">确认</CButton>
                <CButton color="secondary" size="sm" @click="cancelUrlInput">取消</CButton>
            </div>
        </div>
        <div v-if="uploadError" class="text-danger small mt-2">
            {{ uploadError }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { uploadmediaStart, uploadmediaUpload, uploadmediaEnd } from '@/web/AdminReq'
import { Toast } from '@/composables/useToast'

interface Props {
    modelValue?: string
    placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: '图片URL'
})

const emit = defineEmits<{
    'update:modelValue': [value: string | undefined]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const imageUrl = ref<string | undefined>(props.modelValue)
const showUrlInput = ref(false)
const urlInput = ref('')

// Watch modelValue changes
watch(() => props.modelValue, (newVal) => {
    imageUrl.value = newVal
})

// Watch imageUrl changes and emit
watch(imageUrl, (newVal) => {
    emit('update:modelValue', newVal)
}, { immediate: false })

// Trigger file select
const triggerFileSelect = () => {
    fileInputRef.value?.click()
}

// Handle file select
const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
        Toast.error('请选择图片文件')
        return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        Toast.error('图片大小不能超过10MB')
        return
    }

    uploading.value = true
    uploadError.value = ''

    try {
        // Get file extension (with dot prefix)
        const fileName = file.name
        const lastDotIndex = fileName.lastIndexOf('.')
        const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '.jpg'
        
        // Step 1: Start upload
        const startResponse = await uploadmediaStart({
            ext: ext,
        })

        if (startResponse.errCode) {
            throw new Error(startResponse.errMsg || '启动上传失败')
        }

        const filename = startResponse.filename

        // Step 2: Read file as base64
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1] // Remove data:image/...;base64, prefix

                // Step 3: Upload data
                const uploadResponse = await uploadmediaUpload({
                    filename: filename,
                    base64Data: base64Data,
                })

                if (uploadResponse.errCode) {
                    throw new Error(uploadResponse.errMsg || '上传数据失败')
                }

                // Step 4: End upload
                const endResponse = await uploadmediaEnd({
                    filename: filename,
                })

                if (endResponse.errCode) {
                    throw new Error(endResponse.errMsg || '完成上传失败')
                }

                // Update image URL
                imageUrl.value = endResponse.url
                // Explicitly emit the update event
                emit('update:modelValue', endResponse.url)
                Toast.success('上传成功')
            } catch (error: any) {
                console.error('Upload error:', error)
                uploadError.value = error.message || '上传失败'
                Toast.error(uploadError.value)
            } finally {
                uploading.value = false
                // Reset file input
                if (fileInputRef.value) {
                    fileInputRef.value.value = ''
                }
            }
        }

        reader.onerror = () => {
            uploading.value = false
            uploadError.value = '读取文件失败'
            Toast.error(uploadError.value)
        }

        reader.readAsDataURL(file)
    } catch (error: any) {
        console.error('Upload start error:', error)
        uploadError.value = error.message || '上传失败'
        Toast.error(uploadError.value)
        uploading.value = false
        if (fileInputRef.value) {
            fileInputRef.value.value = ''
        }
    }
}

// Clear image
const clearImage = () => {
    imageUrl.value = undefined
    emit('update:modelValue', undefined)
}

// Edit URL manually
const editUrl = () => {
    urlInput.value = imageUrl.value || ''
    showUrlInput.value = true
}

// Handle URL input
const handleUrlInput = () => {
    if (urlInput.value.trim()) {
        const newUrl = urlInput.value.trim()
        imageUrl.value = newUrl
        emit('update:modelValue', newUrl)
    }
    showUrlInput.value = false
}

// Cancel URL input
const cancelUrlInput = () => {
    showUrlInput.value = false
    urlInput.value = ''
}

// Handle image error
const handleImageError = () => {
    // Image failed to load, but keep the URL
}
</script>
