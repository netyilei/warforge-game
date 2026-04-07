<template>
  <div class="email-settings-container">
    <NCard title="邮件服务配置" class="mb-4">
      <div class="config-status">
        <NSpace align="center" justify="space-between">
          <NSpace align="center">
            <NIcon size="24" :color="configForm.status === 1 ? '#18a058' : '#999'">
              <Icon :icon="configForm.status === 1 ? 'mdi:email-check' : 'mdi:email-off'" />
            </NIcon>
            <div>
              <div class="status-title">{{ configForm.host || '未配置邮件服务' }}</div>
              <div class="status-desc">
                <template v-if="configForm.host">
                  {{ getEncryptionLabel(configForm.encryption) }} · {{ configForm.host }}:{{ configForm.port }}
                  <NTag :type="configForm.status === 1 ? 'success' : 'default'" size="small" style="margin-left: 8px;">
                    {{ configForm.status === 1 ? '已启用' : '已禁用' }}
                  </NTag>
                </template>
                <template v-else>
                  点击"设置"按钮配置邮件服务
                </template>
              </div>
            </div>
          </NSpace>
          <NButton type="primary" @click="showConfigModal = true">
            <template #icon>
              <icon-mdi-cog />
            </template>
            设置
          </NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard title="邮件模板">
      <template #header-extra>
        <NButton type="primary" @click="openTemplateModal()">
          <template #icon>
            <icon-mdi-add />
          </template>
          添加邮件模板
        </NButton>
      </template>
      <NDataTable
        :columns="templateColumns"
        :data="templates"
        :loading="templateLoading"
        :pagination="false"
      />
    </NCard>

    <NModal
      v-model:show="showConfigModal"
      preset="card"
      title="邮件服务设置"
      :style="{ width: '600px' }"
      :mask-closable="false"
    >
      <NForm ref="configFormRef" :model="configForm" :rules="configRules" label-placement="left" label-width="100">
        <NFormItem label="服务器地址" path="host">
          <NInput v-model:value="configForm.host" placeholder="例如: smtp.qq.com" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="20">
          <NGi>
            <NFormItem label="加密方式" path="encryption">
              <NSelect
                v-model:value="configForm.encryption"
                :options="encryptionOptions"
                placeholder="请选择加密方式"
                @update:value="handleEncryptionChange"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="端口" path="port">
              <NInputNumber v-model:value="configForm.port" :min="1" :max="65535" style="width: 100%" />
            </NFormItem>
          </NGi>
        </NGrid>
        <NGrid :cols="2" :x-gap="20">
          <NGi>
            <NFormItem label="用户名" path="username">
              <NInput v-model:value="configForm.username" placeholder="请输入用户名" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="密码" path="password">
              <NInput
                v-model:value="configForm.password"
                placeholder="请输入邮箱密码或授权码"
              />
            </NFormItem>
          </NGi>
        </NGrid>
        <NGrid :cols="2" :x-gap="20">
          <NGi>
            <NFormItem label="发件人名称" path="fromName">
              <NInput v-model:value="configForm.fromName" placeholder="请输入发件人名称" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="发件人邮箱" path="fromEmail">
              <NInput v-model:value="configForm.fromEmail" placeholder="请输入发件人邮箱" />
            </NFormItem>
          </NGi>
        </NGrid>
        <NDivider style="margin: 12px 0;" />
        <NFormItem label="测试收件人" path="testEmail">
          <NInput v-model:value="configForm.testEmail" placeholder="输入邮箱地址用于测试邮件发送">
            <template #suffix>
              <NButton text type="primary" :loading="testLoading" @click="sendTestEmail" :disabled="!configForm.testEmail">
                发送测试
              </NButton>
            </template>
          </NInput>
        </NFormItem>
        <NDivider style="margin: 12px 0;" />
        <NFormItem label="状态" path="status">
          <NSwitch v-model:value="configForm.status" :checked-value="1" :unchecked-value="0">
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </NSwitch>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showConfigModal = false">取消</NButton>
          <NButton type="primary" :loading="submitLoading" @click="submitConfig">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="showTemplateModal"
      preset="card"
      :title="editingTemplate ? '编辑邮件模板' : '添加邮件模板'"
      :style="{ width: '900px' }"
      :mask-closable="false"
    >
      <NForm ref="templateFormRef" :model="templateForm" :rules="templateRules" label-placement="left" label-width="100">
        <NGrid :cols="2" :x-gap="20">
          <NGi>
            <NFormItem label="模板名称" path="name">
              <NInput v-model:value="templateForm.name" placeholder="请输入模板名称" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="模板标识" path="code">
              <NInput v-model:value="templateForm.code" placeholder="请输入模板标识" :disabled="!!editingTemplate" />
            </NFormItem>
          </NGi>
        </NGrid>
        <NFormItem label="邮件主题" path="subject">
          <NInput v-model:value="templateForm.subject" placeholder="请输入邮件主题" />
        </NFormItem>
        <NFormItem label="模板描述" path="description">
          <NInput v-model:value="templateForm.description" type="textarea" placeholder="请输入模板描述" :rows="2" />
        </NFormItem>
        <NFormItem label="模板内容" path="content">
          <div class="editor-container">
            <ToastEditor
              ref="templateEditorRef"
              v-model:value="templateForm.content"
              mode="wysiwyg"
              height="400px"
              placeholder="请输入模板内容"
              upload-type="email"
              hide-mode-switch
            />
          </div>
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NSwitch v-model:value="templateForm.status" :checked-value="1" :unchecked-value="0" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showTemplateModal = false">取消</NButton>
          <NButton type="primary" :loading="submitLoading" @click="submitTemplate">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NSpace, NSwitch, NTag, NIcon, useMessage, useDialog, type DataTableColumns } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { emailApi, type EmailTemplate } from '@/service/api/v1/email';
import ToastEditor from '@/components/common/toast-editor.vue';

const message = useMessage();
const dialog = useDialog();

const templates = ref<EmailTemplate[]>([]);
const configLoading = ref(false);
const templateLoading = ref(false);
const submitLoading = ref(false);
const testLoading = ref(false);

const showConfigModal = ref(false);
const showTemplateModal = ref(false);

const editingTemplate = ref<EmailTemplate | null>(null);
const templateEditorRef = ref<InstanceType<typeof ToastEditor>>();

const encryptionOptions = [
  { label: 'STARTTLS', value: 'tls' },
  { label: 'SSL/TLS', value: 'ssl' },
  { label: '无加密', value: 'none' }
];

const encryptionPortMap: Record<string, number> = {
  tls: 587,
  ssl: 465,
  none: 25
};

const getEncryptionLabel = (encryption: string) => {
  const option = encryptionOptions.find(o => o.value === encryption);
  return option ? option.label : encryption.toUpperCase();
};

const configForm = reactive({
  id: '',
  encryption: 'tls' as 'tls' | 'ssl' | 'none',
  host: '',
  port: 587,
  username: '',
  password: '',
  fromName: '',
  fromEmail: '',
  testEmail: '',
  status: 0
});

const templateForm = reactive({
  name: '',
  code: '',
  subject: '',
  content: '',
  description: '',
  status: 1
});

const configRules = {
  host: { required: true, message: '请输入服务器地址', trigger: 'blur' },
  encryption: { required: true, message: '请选择加密方式', trigger: 'change' },
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  fromEmail: { required: true, message: '请输入发件人邮箱', trigger: 'blur' }
};

const templateRules = {
  name: { required: true, message: '请输入模板名称', trigger: 'blur' },
  code: { required: true, message: '请输入模板标识', trigger: 'blur' },
  subject: { required: true, message: '请输入邮件主题', trigger: 'blur' },
  content: { required: true, message: '请输入邮件内容', trigger: 'blur' }
};

const templateColumns: DataTableColumns<EmailTemplate> = [
  { title: '名称', key: 'name' },
  { title: '标识', key: 'code' },
  { title: '主题', key: 'subject' },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    render: row => h(NSwitch, {
      value: row.status === 1,
      onUpdateValue: (v: boolean) => updateTemplateStatus(row, v ? 1 : 0)
    })
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: row => h(NSpace, {}, () => [
      h(NButton, { size: 'small', onClick: () => editTemplate(row) }, () => '编辑'),
      h(NButton, { size: 'small', type: 'error', onClick: () => deleteTemplate(row) }, () => '删除')
    ])
  }
];

const handleEncryptionChange = (value: string) => {
  configForm.port = encryptionPortMap[value] || 587;
};

const loadConfig = async () => {
  configLoading.value = true;
  try {
    const { data } = await emailApi.getConfigs();
    if (data?.configs && data.configs.length > 0) {
      const config = data.configs[0];
      configForm.id = config.id;
      configForm.encryption = config.encryption || 'tls';
      configForm.host = config.host;
      configForm.port = config.port;
      configForm.username = config.username;
      configForm.password = '';
      configForm.fromName = config.fromName;
      configForm.fromEmail = config.fromEmail;
      configForm.status = config.status;
    }
  } catch (error) {
    message.error('加载邮箱配置失败');
  } finally {
    configLoading.value = false;
  }
};

const loadTemplates = async () => {
  templateLoading.value = true;
  try {
    const { data } = await emailApi.getTemplates();
    if (data) {
      templates.value = data.templates || [];
    }
  } catch (error) {
    message.error('加载邮件模板失败');
  } finally {
    templateLoading.value = false;
  }
};

const submitConfig = async () => {
  submitLoading.value = true;
  try {
    const protocolMap: Record<string, 'starttls' | 'smtps' | 'smtp'> = {
      tls: 'starttls',
      ssl: 'smtps',
      none: 'smtp'
    };
    const protocol = protocolMap[configForm.encryption] || 'starttls';
    
    const configData = {
      name: '默认邮件配置',
      protocol,
      encryption: configForm.encryption,
      host: configForm.host,
      port: configForm.port,
      username: configForm.username,
      password: configForm.password,
      fromName: configForm.fromName,
      fromEmail: configForm.fromEmail,
      status: configForm.status
    };
    
    if (configForm.id) {
      await emailApi.updateConfig(configForm.id, configData);
      message.success('更新成功');
    } else {
      const { data } = await emailApi.createConfig({ 
        ...configData,
        code: 'default'
      });
      if (data?.id) {
        configForm.id = data.id;
      }
      message.success('创建成功');
    }
    showConfigModal.value = false;
    loadConfig();
  } catch (error: any) {
    const errorMsg = error?.response?.data?.msg || error?.message || '操作失败';
    message.error(errorMsg);
  } finally {
    submitLoading.value = false;
  }
};

const resetTemplateForm = () => {
  templateForm.name = '';
  templateForm.code = '';
  templateForm.subject = '';
  templateForm.content = '';
  templateForm.description = '';
  templateForm.status = 1;
  editingTemplate.value = null;
};

const openTemplateModal = (template?: EmailTemplate) => {
  if (template) {
    editingTemplate.value = template;
    templateForm.name = template.name;
    templateForm.code = template.code;
    templateForm.subject = template.subject;
    templateForm.content = template.content;
    templateForm.description = template.description;
    templateForm.status = template.status;
  } else {
    resetTemplateForm();
  }
  showTemplateModal.value = true;
};

const editTemplate = (template: EmailTemplate) => {
  openTemplateModal(template);
};

const submitTemplate = async () => {
  submitLoading.value = true;
  try {
    const content = templateEditorRef.value?.getHTML() || templateForm.content;
    
    const submitData = {
      ...templateForm,
      content,
      contentType: 'html' as const
    };
    
    if (editingTemplate.value) {
      await emailApi.updateTemplate(editingTemplate.value.id, submitData);
      message.success('更新成功');
    } else {
      await emailApi.createTemplate(submitData);
      message.success('创建成功');
    }
    showTemplateModal.value = false;
    resetTemplateForm();
    loadTemplates();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
};

const updateTemplateStatus = async (template: EmailTemplate, status: number) => {
  try {
    await emailApi.updateTemplate(template.id, { ...template, status });
    message.success('状态更新成功');
    loadTemplates();
  } catch (error) {
    message.error('状态更新失败');
  }
};

const deleteTemplate = (template: EmailTemplate) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除邮件模板 "${template.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await emailApi.deleteTemplate(template.id);
        message.success('删除成功');
        loadTemplates();
      } catch (error) {
        message.error('删除失败');
      }
    }
  });
};

const sendTestEmail = async () => {
  if (!configForm.testEmail) {
    message.warning('请输入测试收件人邮箱');
    return;
  }
  
  if (!configForm.host) {
    message.warning('请先配置邮件服务器');
    return;
  }

  if (!configForm.id) {
    message.warning('请先保存邮件配置');
    return;
  }
  
  testLoading.value = true;
  try {
    const { data } = await emailApi.sendTestEmail({
      configId: configForm.id,
      toEmail: configForm.testEmail,
      subject: '测试邮件',
      content: '<p>这是一封测试邮件，用于验证邮件服务配置是否正确。</p>'
    });
    if (data?.success) {
      message.success(data.message || '邮件发送成功');
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.msg || error?.message || '邮件发送失败';
    message.error(errorMsg);
  } finally {
    testLoading.value = false;
  }
};

onMounted(() => {
  loadConfig();
  loadTemplates();
});
</script>

<style scoped>
.email-settings-container {
  padding: 16px;
}

.config-status {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.status-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.status-desc {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.editor-container {
  width: 100%;
}
</style>
