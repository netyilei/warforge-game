<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>邮件管理</strong>
                        <div>
                            <CButton color="success" size="sm" @click="openSystemMailModal" class="me-2">
                                <CIcon icon="cil-envelope-open" class="me-1" />
                                发送系统邮件
                            </CButton>
                            <CButton color="primary" size="sm" @click="openUserMailModal" class="me-2">
                                <CIcon icon="cil-envelope-closed" class="me-1" />
                                发送用户邮件
                            </CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <CAlert color="info" class="mb-3">
                        <CIcon icon="cil-info" class="me-2" />
                        系统邮件将发送给所有用户，用户邮件将发送给指定用户。
                    </CAlert>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>

    <!-- 发送系统邮件 Modal -->
    <CModal :visible="showSystemMailModal" @close="closeSystemMailModal" size="lg">
        <CModalHeader>
            <CModalTitle>发送系统邮件</CModalTitle>
        </CModalHeader>
        <CModalBody>
            <CForm>
                <div class="mb-3">
                    <CFormLabel>邮件标题 <span class="text-danger">*</span></CFormLabel>
                    <CFormInput
                        v-model="systemMailForm.title"
                        placeholder="请输入邮件标题"
                        :invalid="!systemMailForm.title.trim()"
                    />
                </div>
                <div class="mb-3">
                    <CFormLabel>邮件内容 <span class="text-danger">*</span></CFormLabel>
                    <CFormTextarea
                        v-model="systemMailForm.content"
                        placeholder="请输入邮件内容"
                        rows="5"
                        :invalid="!systemMailForm.content.trim()"
                    />
                </div>
                <div class="mb-3">
                    <CFormLabel>发送原因（可选）</CFormLabel>
                    <CFormInput
                        v-model="systemMailForm.reason"
                        placeholder="请输入发送原因"
                    />
                </div>
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <CFormLabel class="mb-0">附件（可选）</CFormLabel>
                        <CButton color="success" size="sm" @click="addSystemMailAttach">
                            <CIcon icon="cil-plus" class="me-1" />
                            添加附件
                        </CButton>
                    </div>
                    <div v-if="systemMailForm.attachs && systemMailForm.attachs.length > 0" class="border rounded p-3">
                        <div v-for="(attach, index) in systemMailForm.attachs" :key="index" class="mb-3 pb-3 border-bottom">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <strong>附件 {{ index + 1 }}</strong>
                                <CButton color="danger" size="sm" @click="removeSystemMailAttach(index)">
                                    <CIcon icon="cil-trash" />
                                </CButton>
                            </div>
                            <CRow>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>附件类型</CFormLabel>
                                    <select class="form-select" v-model="attach.attachType">
                                        <option value="item">物品</option>
                                        <option value="club">俱乐部</option>
                                    </select>
                                </CCol>
                                <CCol :md="6" class="mb-2" v-if="attach.attachType === 'item'">
                                    <CFormLabel>物品ID</CFormLabel>
                                    <ItemSelect v-model="attach.itemID" />
                                </CCol>
                                <CCol :md="6" class="mb-2" v-if="attach.attachType === 'club'">
                                    <CFormLabel>俱乐部ID</CFormLabel>
                                    <CFormInput
                                        type="number"
                                        v-model.number="attach.clubID"
                                        placeholder="请输入俱乐部ID"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2" v-if="attach.attachType === 'club'">
                                    <CFormLabel>价值类型</CFormLabel>
                                    <select class="form-select" v-model.number="attach.valueIndex">
                                        <option :value="ClubDefine.ValueIndex.Gold">金币</option>
                                        <option :value="ClubDefine.ValueIndex.Diamond">钻石</option>
                                    </select>
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>数量 <span class="text-danger">*</span></CFormLabel>
                                    <CFormInput
                                        type="number"
                                        v-model.number="attach.count"
                                        placeholder="请输入数量"
                                        :invalid="!attach.count || attach.count <= 0"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>标题（可选）</CFormLabel>
                                    <CFormInput
                                        v-model="attach.title"
                                        placeholder="附件标题"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>内容（可选）</CFormLabel>
                                    <CFormInput
                                        v-model="attach.content"
                                        placeholder="附件内容"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>URL（可选）</CFormLabel>
                                    <CFormInput
                                        v-model="attach.url"
                                        placeholder="附件URL"
                                    />
                                </CCol>
                            </CRow>
                        </div>
                    </div>
                    <div v-else class="text-muted text-center py-3 border rounded">
                        暂无附件，点击"添加附件"按钮添加
                    </div>
                </div>
            </CForm>
        </CModalBody>
        <CModalFooter>
            <CButton color="secondary" @click="closeSystemMailModal">取消</CButton>
            <CButton color="primary" @click="sendSystemMail" :disabled="saving || !systemMailForm.title.trim() || !systemMailForm.content.trim()">
                {{ saving ? '发送中...' : '发送' }}
            </CButton>
        </CModalFooter>
    </CModal>

    <!-- 发送用户邮件 Modal -->
    <CModal :visible="showUserMailModal" @close="closeUserMailModal" size="lg">
        <CModalHeader>
            <CModalTitle>发送用户邮件</CModalTitle>
        </CModalHeader>
        <CModalBody>
            <CForm>
                <div class="mb-3">
                    <CFormLabel>用户ID <span class="text-danger">*</span></CFormLabel>
                    <CFormInput
                        type="number"
                        v-model.number="userMailForm.userID"
                        placeholder="请输入用户ID"
                        :invalid="!userMailForm.userID || userMailForm.userID <= 0"
                    />
                </div>
                <div class="mb-3">
                    <CFormLabel>邮件标题 <span class="text-danger">*</span></CFormLabel>
                    <CFormInput
                        v-model="userMailForm.title"
                        placeholder="请输入邮件标题"
                        :invalid="!userMailForm.title.trim()"
                    />
                </div>
                <div class="mb-3">
                    <CFormLabel>邮件内容 <span class="text-danger">*</span></CFormLabel>
                    <CFormTextarea
                        v-model="userMailForm.content"
                        placeholder="请输入邮件内容"
                        rows="5"
                        :invalid="!userMailForm.content.trim()"
                    />
                </div>
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <CFormLabel class="mb-0">附件（可选）</CFormLabel>
                        <CButton color="success" size="sm" @click="addUserMailAttach">
                            <CIcon icon="cil-plus" class="me-1" />
                            添加附件
                        </CButton>
                    </div>
                    <div v-if="userMailForm.attachs && userMailForm.attachs.length > 0" class="border rounded p-3">
                        <div v-for="(attach, index) in userMailForm.attachs" :key="index" class="mb-3 pb-3 border-bottom">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <strong>附件 {{ index + 1 }}</strong>
                                <CButton color="danger" size="sm" @click="removeUserMailAttach(index)">
                                    <CIcon icon="cil-trash" />
                                </CButton>
                            </div>
                            <CRow>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>附件类型</CFormLabel>
                                    <select class="form-select" v-model="attach.attachType">
                                        <option value="item">物品</option>
                                        <option value="club">俱乐部</option>
                                    </select>
                                </CCol>
                                <CCol :md="6" class="mb-2" v-if="attach.attachType === 'item'">
                                    <CFormLabel>物品ID</CFormLabel>
                                    <ItemSelect v-model="attach.itemID" />
                                </CCol>
                                <CCol :md="6" class="mb-2" v-if="attach.attachType === 'club'">
                                    <CFormLabel>俱乐部ID</CFormLabel>
                                    <CFormInput
                                        type="number"
                                        v-model.number="attach.clubID"
                                        placeholder="请输入俱乐部ID"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2" v-if="attach.attachType === 'club'">
                                    <CFormLabel>价值类型</CFormLabel>
                                    <select class="form-select" v-model.number="attach.valueIndex">
                                        <option :value="ClubDefine.ValueIndex.Gold">金币</option>
                                        <option :value="ClubDefine.ValueIndex.Diamond">钻石</option>
                                    </select>
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>数量 <span class="text-danger">*</span></CFormLabel>
                                    <CFormInput
                                        type="number"
                                        v-model.number="attach.count"
                                        placeholder="请输入数量"
                                        :invalid="!attach.count || attach.count <= 0"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>标题（可选）</CFormLabel>
                                    <CFormInput
                                        v-model="attach.title"
                                        placeholder="附件标题"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>内容（可选）</CFormLabel>
                                    <CFormInput
                                        v-model="attach.content"
                                        placeholder="附件内容"
                                    />
                                </CCol>
                                <CCol :md="6" class="mb-2">
                                    <CFormLabel>URL（可选）</CFormLabel>
                                    <CFormInput
                                        v-model="attach.url"
                                        placeholder="附件URL"
                                    />
                                </CCol>
                            </CRow>
                        </div>
                    </div>
                    <div v-else class="text-muted text-center py-3 border rounded">
                        暂无附件，点击"添加附件"按钮添加
                    </div>
                </div>
            </CForm>
        </CModalBody>
        <CModalFooter>
            <CButton color="secondary" @click="closeUserMailModal">取消</CButton>
            <CButton color="primary" @click="sendUserMail" :disabled="saving || !userMailForm.userID || !userMailForm.title.trim() || !userMailForm.content.trim()">
                {{ saving ? '发送中...' : '发送' }}
            </CButton>
        </CModalFooter>
    </CModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
    mgrSendsystemmail,
    mgrSendusermail,
} from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { MailDefine } from 'pp-base-define/MailDefine'
import { ClubDefine } from 'pp-base-define/ClubDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'

// Attach form type
interface AttachForm {
    attachType: 'item' | 'club'
    itemID?: string
    clubID?: number
    valueIndex?: ClubDefine.ValueIndex
    count: number
    title?: string
    content?: string
    url?: string
}

// Reactive data
const saving = ref(false)
const showSystemMailModal = ref(false)
const showUserMailModal = ref(false)

// System mail form
const systemMailForm = ref<{
    title: string
    content: string
    reason?: string
    attachs?: AttachForm[]
}>({
    title: '',
    content: '',
    reason: undefined,
    attachs: undefined,
})

// User mail form
const userMailForm = ref<{
    userID: number
    title: string
    content: string
    attachs?: AttachForm[]
}>({
    userID: 0,
    title: '',
    content: '',
    attachs: undefined,
})

// Open system mail modal
const openSystemMailModal = () => {
    systemMailForm.value = {
        title: '',
        content: '',
        reason: undefined,
        attachs: undefined,
    }
    showSystemMailModal.value = true
}

// Close system mail modal
const closeSystemMailModal = () => {
    showSystemMailModal.value = false
}

// Open user mail modal
const openUserMailModal = () => {
    userMailForm.value = {
        userID: 0,
        title: '',
        content: '',
        attachs: undefined,
    }
    showUserMailModal.value = true
}

// Close user mail modal
const closeUserMailModal = () => {
    showUserMailModal.value = false
}

// Add system mail attach
const addSystemMailAttach = () => {
    if (!systemMailForm.value.attachs) {
        systemMailForm.value.attachs = []
    }
    systemMailForm.value.attachs.push({
        attachType: 'item',
        itemID: undefined,
        clubID: undefined,
        valueIndex: undefined,
        count: 0,
        title: undefined,
        content: undefined,
        url: undefined,
    })
}

// Remove system mail attach
const removeSystemMailAttach = (index: number) => {
    if (systemMailForm.value.attachs) {
        systemMailForm.value.attachs.splice(index, 1)
        if (systemMailForm.value.attachs.length === 0) {
            systemMailForm.value.attachs = undefined
        }
    }
}

// Add user mail attach
const addUserMailAttach = () => {
    if (!userMailForm.value.attachs) {
        userMailForm.value.attachs = []
    }
    userMailForm.value.attachs.push({
        attachType: 'item',
        itemID: undefined,
        clubID: undefined,
        valueIndex: undefined,
        count: 0,
        title: undefined,
        content: undefined,
        url: undefined,
    })
}

// Remove user mail attach
const removeUserMailAttach = (index: number) => {
    if (userMailForm.value.attachs) {
        userMailForm.value.attachs.splice(index, 1)
        if (userMailForm.value.attachs.length === 0) {
            userMailForm.value.attachs = undefined
        }
    }
}

// Convert attach form to MailDefine.tMailAttach
const convertAttach = (attach: AttachForm): MailDefine.tMailAttach => {
    const mailAttach: MailDefine.tMailAttach = {
        count: attach.count,
    }
    
    if (attach.attachType === 'item' && attach.itemID) {
        mailAttach.itemID = attach.itemID
    } else if (attach.attachType === 'club' && attach.clubID !== undefined && attach.valueIndex !== undefined) {
        mailAttach.club = {
            clubID: attach.clubID,
            valueIndex: attach.valueIndex,
        }
    }
    
    if (attach.title) {
        mailAttach.title = attach.title
    }
    if (attach.content) {
        mailAttach.content = attach.content
    }
    if (attach.url) {
        mailAttach.url = attach.url
    }
    
    return mailAttach
}

// Send system mail
const sendSystemMail = async () => {
    if (!systemMailForm.value.title.trim()) {
        Toast.warning('请输入邮件标题')
        return
    }
    if (!systemMailForm.value.content.trim()) {
        Toast.warning('请输入邮件内容')
        return
    }

    // Validate attaches
    if (systemMailForm.value.attachs && systemMailForm.value.attachs.length > 0) {
        for (const attach of systemMailForm.value.attachs) {
            if (!attach.count || attach.count <= 0) {
                Toast.warning('请为所有附件输入有效的数量')
                return
            }
            if (attach.attachType === 'item' && !attach.itemID) {
                Toast.warning('请为物品附件选择物品ID')
                return
            }
            if (attach.attachType === 'club' && (attach.clubID === undefined || attach.valueIndex === undefined)) {
                Toast.warning('请为俱乐部附件输入俱乐部ID和价值类型')
                return
            }
        }
    }

    saving.value = true
    try {
        const request: AdminReqDefine.tMgrSendsystemmailReq = {
            title: systemMailForm.value.title.trim(),
            content: systemMailForm.value.content.trim(),
            reason: systemMailForm.value.reason?.trim() || undefined,
            attachs: systemMailForm.value.attachs && systemMailForm.value.attachs.length > 0
                ? systemMailForm.value.attachs.map(convertAttach)
                : undefined,
        }

        const response = await mgrSendsystemmail(request)

        if (response.errCode) {
            Toast.error(response.errMsg || '发送系统邮件失败')
            return
        }

        Toast.success('系统邮件发送成功')
        closeSystemMailModal()
    } catch (error) {
        console.error('Send system mail error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Send user mail
const sendUserMail = async () => {
    if (!userMailForm.value.userID || userMailForm.value.userID <= 0) {
        Toast.warning('请输入有效的用户ID')
        return
    }
    if (!userMailForm.value.title.trim()) {
        Toast.warning('请输入邮件标题')
        return
    }
    if (!userMailForm.value.content.trim()) {
        Toast.warning('请输入邮件内容')
        return
    }

    // Validate attaches
    if (userMailForm.value.attachs && userMailForm.value.attachs.length > 0) {
        for (const attach of userMailForm.value.attachs) {
            if (!attach.count || attach.count <= 0) {
                Toast.warning('请为所有附件输入有效的数量')
                return
            }
            if (attach.attachType === 'item' && !attach.itemID) {
                Toast.warning('请为物品附件选择物品ID')
                return
            }
            if (attach.attachType === 'club' && (attach.clubID === undefined || attach.valueIndex === undefined)) {
                Toast.warning('请为俱乐部附件输入俱乐部ID和价值类型')
                return
            }
        }
    }

    saving.value = true
    try {
        const request: AdminReqDefine.tMgrSendusermailReq = {
            userID: userMailForm.value.userID,
            title: userMailForm.value.title.trim(),
            content: userMailForm.value.content.trim(),
            attachs: userMailForm.value.attachs && userMailForm.value.attachs.length > 0
                ? userMailForm.value.attachs.map(convertAttach)
                : undefined,
        }

        const response = await mgrSendusermail(request)

        if (response.errCode) {
            Toast.error(response.errMsg || '发送用户邮件失败')
            return
        }

        Toast.success('用户邮件发送成功')
        closeUserMailModal()
    } catch (error) {
        console.error('Send user mail error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}
</script>
