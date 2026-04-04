<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NCard,
  NSwitch,
  NButton,
  NSpace,
  useMessage,
  NGrid,
  NGridItem,
  NDescriptions,
  NDescriptionsItem,
} from 'naive-ui';
import { fetchGetSettings, fetchUpdateSettings } from '@/service/api/settings';

interface SystemSetting {
  key: string;
  value: string;
  description: string;
}

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const settings = ref<Record<string, boolean>>({
  require_registration_approval: false,
  require_identity_verification: false,
});

const settingDescriptions: Record<string, string> = {
  require_registration_approval: '用户注册是否需要审核',
  require_identity_verification: '用户注册是否需要证件核实',
};

const fetchSettings = async () => {
  loading.value = true;
  try {
    const { data, error } = await fetchGetSettings();
    if (error) {
      message.error('获取设置失败');
      return;
    }
    const settingsList = data?.settings || [];
    settingsList.forEach((s: SystemSetting) => {
      if (s.key in settings.value) {
        settings.value[s.key] = s.value === 'true';
      }
    });
  } catch (error) {
    message.error('获取设置失败');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const settingsList = Object.entries(settings.value).map(([key, value]) => ({
      key,
      value: value ? 'true' : 'false',
      description: settingDescriptions[key] || '',
    }));
    const { error } = await fetchUpdateSettings(settingsList);
    if (error) {
      message.error('保存失败');
      return;
    }
    message.success('保存成功');
  } catch (error) {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});
</script>

<template>
  <div class="user-settings-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="用户设置" :bordered="false" :loading="loading">
          <NDescriptions label-placement="left" :column="1">
            <NDescriptionsItem label="注册审核">
              <NSwitch 
                v-model:value="settings.require_registration_approval"
                :round="false"
              >
                <template #checked>开启</template>
                <template #unchecked>关闭</template>
              </NSwitch>
              <span style="margin-left: 12px; color: #999">
                开启后，用户注册需要管理员审核才能使用
              </span>
            </NDescriptionsItem>
            <NDescriptionsItem label="证件核实">
              <NSwitch 
                v-model:value="settings.require_identity_verification"
                :round="false"
              >
                <template #checked>开启</template>
                <template #unchecked>关闭</template>
              </NSwitch>
              <span style="margin-left: 12px; color: #999">
                开启后，用户注册需要上传证件进行核实
              </span>
            </NDescriptionsItem>
          </NDescriptions>
          
          <template #footer>
            <NSpace>
              <NButton type="primary" :loading="saving" @click="handleSave">
                保存设置
              </NButton>
            </NSpace>
          </template>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped lang="scss">
.user-settings-container {
  padding: 20px;
}
</style>
