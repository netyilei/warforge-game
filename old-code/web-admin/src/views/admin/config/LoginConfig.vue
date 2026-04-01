<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>登录配置</strong>
                        <CButton color="primary" size="sm" @click="loadConfig">
                            <CIcon icon="cil-reload" class="me-1" />
                            重新加载
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <CForm v-else>
                        <!-- 基本配置 -->
                        <div class="mb-4">
                            <CRow class="mb-3">
                                <CCol :md="6">
                                    <CFormLabel>最大在线Channel数</CFormLabel>
                                    <CFormInput type="number" v-model.number="config.limitOnlineCount"
                                        placeholder="请输入最大在线Channel数" />
                                </CCol>
                            </CRow>
                        </div>

                        <!-- 登录方式配置 -->
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0">登录方式配置</h5>
                                <CButton color="success" size="sm" @click="addLoginChannel">
                                    <CIcon icon="cil-plus" class="me-1" />
                                    添加登录方式
                                </CButton>
                            </div>

                            <div v-if="!config.loginChannels || config.loginChannels.length === 0"
                                class="text-center text-muted py-3 border rounded">
                                暂无登录方式配置，请点击"添加登录方式"按钮添加
                            </div>

                            <div v-for="(channel, index) in config.loginChannels" :key="index"
                                class="border rounded p-3 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <strong>{{ getChannelName(channel.type) }}登录</strong>
                                    <CButton color="danger" size="sm" @click="removeLoginChannel(index)">
                                        <CIcon icon="cil-trash" class="me-1" />
                                        删除
                                    </CButton>
                                </div>

                                <CRow class="mb-3">
                                        <CCol :md="4">
                                            <CFormLabel>渠道类型</CFormLabel>
                                            <select class="form-select" v-model="channel.type">
                                                <option value="">请选择渠道</option>
                                                <option :value="UserDefine.LoginChannel.Guest">游客</option>
                                                <option :value="UserDefine.LoginChannel.Account">账号</option>
                                                <option :value="UserDefine.LoginChannel.Email">邮箱</option>
                                                <option :value="UserDefine.LoginChannel.Phone">手机号</option>
                                                <option :value="UserDefine.LoginChannel.Web3">Web3</option>
                                                <option :value="UserDefine.LoginChannel.Wechat">微信</option>
                                            </select>
                                        </CCol>
                                    <CCol :md="4">
                                        <CFormLabel>是否启用</CFormLabel>
                                        <CFormSwitch v-model="channel.enabled" :label="channel.enabled ? '启用' : '禁用'" />
                                    </CCol>
                                    <CCol :md="4">
                                        <CFormLabel>超时时间(秒)</CFormLabel>
                                        <CFormInput type="number" v-model.number="channel.expireTime" placeholder="超时时间"
                                            min="0" />
                                    </CCol>
                                </CRow>
                            </div>
                        </div>

                        <!-- 国家/地区配置 -->
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0">国家/地区配置</h5>
                                <CButton color="success" size="sm" @click="addCountry">
                                    <CIcon icon="cil-plus" class="me-1" />
                                    添加国家
                                </CButton>
                            </div>

                            <div v-if="!config.countries || config.countries.length === 0"
                                class="text-center text-muted py-3 border rounded">
                                暂无国家配置，请点击"添加国家"按钮添加
                            </div>

                            <div v-for="(country, index) in config.countries" :key="index"
                                class="border rounded p-3 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <strong>国家 #{{ index + 1 }}</strong>
                                    <CButton color="danger" size="sm" @click="removeCountry(index)">
                                        <CIcon icon="cil-trash" class="me-1" />
                                        删除
                                    </CButton>
                                </div>

                                <CRow class="mb-3">
                                    <CCol :md="6">
                                        <CFormLabel>国家名称</CFormLabel>
                                        <CFormInput v-model="country.name" placeholder="如：CHN" />
                                    </CCol>
                                    <CCol :md="6">
                                        <CFormLabel>国家代码</CFormLabel>
                                        <CFormInput v-model="country.code" placeholder="如：86" />
                                    </CCol>
                                </CRow>

                                <div class="mb-2">
                                    <CFormLabel>支持的语言</CFormLabel>
                                    <div class="d-flex gap-2 mb-2">
                                        <CFormInput v-model="newLang" placeholder="输入语言代码"
                                            @keyup.enter="addLang(country)" style="max-width: 200px;" />
                                        <CButton color="info" size="sm" @click="addLang(country)">
                                            添加语言
                                        </CButton>
                                    </div>
                                    <div v-if="country.langs && country.langs.length > 0"
                                        class="d-flex flex-wrap gap-2">
                                        <CBadge v-for="(lang, langIndex) in country.langs" :key="langIndex"
                                            color="primary" class="d-flex align-items-center">
                                            {{ lang }}
                                            <CIcon icon="cil-x" class="ms-1" style="cursor: pointer;"
                                                @click="removeLang(country, langIndex)" />
                                        </CBadge>
                                    </div>
                                    <div v-else class="text-muted small">
                                        暂无语言配置
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="mt-4">
                            <CButtonGroup role="group">
                                <CButton color="warning" @click="resetConfig">
                                    重置
                                </CButton>
                                <CButton color="success" @click="saveConfig" :disabled="saving">
                                    {{ saving ? '保存中...' : '保存配置' }}
                                </CButton>
                            </CButtonGroup>
                        </div>
                    </CForm>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { configGetlogin, configSetlogin } from '@/web/AdminReq'
import type { GlobalConfig } from 'pp-base-define/GlobalConfig'
import { UserDefine } from 'pp-base-define/UserDefine'
import { showError, showSuccess, showWarning } from '@/utils/message'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const newLang = ref('')

// 配置数据 - 使用 GlobalConfig.tLogin 类型
const config = ref<GlobalConfig.tLogin>({
    limitOnlineCount: 100,
    loginChannels: [
        {
            enabled: true,
            type: UserDefine.LoginChannel.Account,
            expireTime: 3600
        },
        {
            enabled: false,
            type: UserDefine.LoginChannel.Wechat,
            expireTime: 3600
        }
    ],
    countries: [
        {
            name: 'CHN',
            code: '86',
            langs: ['zh-CN', 'en-US']
        }
    ]
})

// 获取渠道名称
const getChannelName = (type: UserDefine.LoginChannel): string => {
    const channelMap: Record<UserDefine.LoginChannel, string> = {
        [UserDefine.LoginChannel.Guest]: '游客',
        [UserDefine.LoginChannel.Account]: '账号',
        [UserDefine.LoginChannel.Email]: '邮箱',
        [UserDefine.LoginChannel.Phone]: '手机号',
        [UserDefine.LoginChannel.Web3]: 'Web3',
        [UserDefine.LoginChannel.Wechat]: '微信',
    }
    return channelMap[type] || '未知'
}

// 加载配置
const loadConfig = async () => {
    loading.value = true
    try {
        const response = await configGetlogin({})

        if (response.errCode) {
            showError(response.errMsg || '加载配置失败')
            return
        }
        // 直接使用登录配置
        if (!response.config) {
            response.config = {
                limitOnlineCount: 100,
                loginChannels: [],
                countries: []
            }
        }
        Object.assign(config.value, response.config)
    } catch (error) {
        console.error('Load config error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// 保存配置
const saveConfig = async () => {
    saving.value = true
    try {
        const response = await configSetlogin({
            config: config.value
        })

        if (response.errCode) {
            showError(response.errMsg || '保存配置失败')
            return
        }
        showSuccess('配置保存成功')
    } catch (error) {
        console.error('Save config error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// 重置配置
const resetConfig = () => {
    // 重置为默认配置
    config.value = {
        limitOnlineCount: 100,
        loginChannels: [
            {
                enabled: true,
                type: UserDefine.LoginChannel.Account,
                expireTime: 3600
            },
            {
                enabled: false,
                type: UserDefine.LoginChannel.Wechat,
                expireTime: 3600
            }
        ],
        countries: [
            {
                name: 'CHN',
                code: '86',
                langs: ['zh-CN', 'en-US']
            }
        ]
    }
    showWarning('配置已重置，请保存以应用更改')
}

// 添加登录渠道
const addLoginChannel = () => {
    if (!config.value.loginChannels) {
        config.value.loginChannels = []
    }

    config.value.loginChannels.push({
        enabled: false,
        type: UserDefine.LoginChannel.Account,
        expireTime: 3600
    })
}

// 删除登录渠道
const removeLoginChannel = (index: number) => {
    if (config.value.loginChannels && config.value.loginChannels.length > index) {
        config.value.loginChannels.splice(index, 1)
    }
}

// 添加国家
const addCountry = () => {
    if (!config.value.countries) {
        config.value.countries = []
    }

    config.value.countries.push({
        name: '',
        code: '',
        langs: []
    })
}

// 删除国家
const removeCountry = (index: number) => {
    if (config.value.countries && config.value.countries.length > index) {
        config.value.countries.splice(index, 1)
    }
}

// 添加语言
const addLang = (country: { langs: string[] }) => {
    if (!newLang.value.trim()) {
        showWarning('请输入语言代码')
        return
    }

    if (!country.langs) {
        country.langs = []
    }

    if (country.langs.includes(newLang.value.trim())) {
        showWarning('该语言已存在')
        return
    }

    country.langs.push(newLang.value.trim())
    newLang.value = ''
}

// 删除语言
const removeLang = (country: { langs: string[] }, langIndex: number) => {
    if (country.langs && country.langs.length > langIndex) {
        country.langs.splice(langIndex, 1)
    }
}

// 组件挂载时加载配置
onMounted(() => {
    loadConfig()
})
</script>
