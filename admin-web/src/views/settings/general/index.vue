<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  NCard,
  NSwitch,
  NButton,
  NSpace,
  useMessage,
  NTabs,
  NTabPane,
  NDescriptions,
  NDescriptionsItem,
} from 'naive-ui';
import { fetchGetSettings, fetchUpdateSettings } from '@/service/api/v1/settings';

interface SystemSetting {
  key: string;
  value: string;
  description: string;
}

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const currentTab = ref('user');

const userSettings = ref<Record<string, boolean>>({
  require_registration_approval: false,
  require_identity_verification: false,
});

const userSettingDescriptions: Record<string, string> = {
  require_registration_approval: '用户注册是否需要审核',
  require_identity_verification: '用户注册是否需要证件核实',
};

const allSettings = computed(() => {
  const settings: { key: string; value: string; description: string }[] = [];
  
  Object.entries(userSettings.value).forEach(([key, value]) => {
    settings.push({
      key,
      value: value ? 'true' : 'false',
      description: userSettingDescriptions[key] || '',
    });
  });
  
  return settings;
});

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
      if (s.key in userSettings.value) {
        userSettings.value[s.key] = s.value === 'true';
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
    const { error } = await fetchUpdateSettings(allSettings.value);
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
  <div class="general-settings-container">
    <NCard title="基础设置" :bordered="false" :loading="loading">
      <NTabs v-model:value="currentTab" type="line">
        <NTabPane name="user" tab="用户设置">
          <NDescriptions label-placement="left" :column="1" class="settings-descriptions">
            <NDescriptionsItem label="注册审核">
              <NSwitch 
                v-model:value="userSettings.require_registration_approval"
                :round="false"
              >
                <template #checked>开启</template>
                <template #unchecked>关闭</template>
              </NSwitch>
              <span class="setting-hint">
                开启后，用户注册需要管理员审核才能使用
              </span>
            </NDescriptionsItem>
            <NDescriptionsItem label="证件核实">
              <NSwitch 
                v-model:value="userSettings.require_identity_verification"
                :round="false"
              >
                <template #checked>开启</template>
                <template #unchecked>关闭</template>
              </NSwitch>
              <span class="setting-hint">
                开启后，用户注册需要上传证件进行核实
              </span>
            </NDescriptionsItem>
          </NDescriptions>
        </NTabPane>
      </NTabs>
      
      <template #footer>
        <NSpace>
          <NButton type="primary" :loading="saving" @click="handleSave">
            保存设置
          </NButton>
        </NSpace>
      </template>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.general-settings-container {
  padding: 20px;
}

.settings-descriptions {
  margin-top: 16px;
}

.setting-hint {
  margin-left: 12px;
  color: #999;
  font-size: 13px;
}
</style>
