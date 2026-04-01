<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex gap-2">
        <GameIDSelect
          v-model="filterGameID"
          placeholder="全部游戏"
          :placeholder-value="undefined"
          style="width: 150px;"
        />
        <CButton color="primary" @click="loadConfigs">
          <CIcon icon="cil-magnifying-glass" class="me-1" />
          搜索
        </CButton>
      </div>
      <CButton color="success" @click="showCreateModal = true">
        <CIcon icon="cil-plus" class="me-1" />
        新增配置
      </CButton>
    </div>

    <div v-if="loading" class="text-center py-4">
      <CSpinner />
      <div class="mt-2">加载中...</div>
    </div>
    <div v-else>
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>游戏ID</CTableHeaderCell>
            <CTableHeaderCell>性格</CTableHeaderCell>
            <CTableHeaderCell>描述</CTableHeaderCell>
            <CTableHeaderCell>操作</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="config in configs" :key="`${config.gameID}-${config.personality}`">
            <CTableDataCell>{{ config.gameID }}</CTableDataCell>
            <CTableDataCell>{{ getPersonalityName(config.personality) }}</CTableDataCell>
            <CTableDataCell>{{ config.desc || '-' }}</CTableDataCell>
            <CTableDataCell>
              <CButtonGroup role="group">
                <CButton
                  color="primary"
                  size="sm"
                  @click="editConfig(config)"
                >
                  编辑
                </CButton>
                <CButton
                  color="danger"
                  size="sm"
                  @click="deleteConfig(config)"
                >
                  删除
                </CButton>
              </CButtonGroup>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
    </div>

    <!-- 编辑/创建配置 Modal -->
    <CModal :visible="showEditModal" @close="closeEditModal" size="lg">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? '编辑配置' : '新增配置' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>游戏ID <span class="text-danger">*</span></CFormLabel>
            <GameIDSelect
              v-model="editForm.gameID"
              placeholder="请选择游戏"
              :placeholder-value="undefined"
              :disabled="isEditing"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>性格 <span class="text-danger">*</span></CFormLabel>
            <select class="form-select" v-model.number="editForm.personality" :disabled="isEditing">
              <option :value="undefined">请选择性格</option>
              <option :value="0">保守</option>
              <option :value="1">稳健</option>
              <option :value="2">激进</option>
              <option :value="3">非常激进</option>
            </select>
          </div>
          <div class="mb-3">
            <CFormLabel>描述</CFormLabel>
            <CFormInput
              v-model="editForm.desc"
              placeholder="输入描述"
            />
          </div>

          <!-- Texas 游戏特有配置 -->
          <div v-if="isTexasGame" class="mt-4">
            <h6 class="mb-3">Texas 游戏配置</h6>
            <CRow class="mb-3">
              <CCol :md="6">
                <FormSlider
                  v-model="texasForm.checkPercent"
                  label="过牌几率"
                  value-suffix="%"
                  value-type="number"
                  :min="0"
                  :max="100"
                  :step="1"
                />
              </CCol>
              <CCol :md="6">
                <CFormLabel>是否检查对手</CFormLabel>
                <CFormSwitch
                  v-model="texasForm.isCheckOpponent"
                  label="检查对手"
                />
              </CCol>
            </CRow>

            <div class="mb-3">
              <CFormLabel>诈牌配置</CFormLabel>
              <CRow>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.bluff!.betPercent" label="下注几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.bluff!.raisePercent" label="加注几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.bluff!.allinPercent" label="All-in 几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
              </CRow>
            </div>

            <div class="mb-3">
              <CFormLabel>下注配置</CFormLabel>
              <CRow>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.bet!.percent" label="几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.bet!.maxToForcePercent" label="最大胜率强制执行概率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
              </CRow>
            </div>

            <div class="mb-3">
              <CFormLabel>加注配置</CFormLabel>
              <CRow>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.raise!.percent" label="几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.raise!.maxToForcePercent" label="最大胜率强制执行概率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
              </CRow>
            </div>

            <div class="mb-3">
              <CFormLabel>跟注配置</CFormLabel>
              <CRow>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.call!.percent" label="几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.call!.maxToForcePercent" label="最大胜率强制执行概率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
              </CRow>
            </div>

            <div class="mb-3">
              <CFormLabel>All-in 配置</CFormLabel>
              <CRow>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.allin!.percent" label="几率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
                <CCol :md="4">
                  <FormSlider v-model="texasForm.allin!.maxToForcePercent" label="最大胜率强制执行概率" value-suffix="%" value-type="number" :min="0" :max="100" :step="1" />
                </CCol>
              </CRow>
            </div>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeEditModal">取消</CButton>
        <CButton color="primary" @click="saveConfig" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-1" />
          保存
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Toast } from '@/composables/useToast'
import {
  robotExtGetpersonalityconfigs,
  robotExtSetpersonalityconfig,
  robotExtDeletepersonalityconfig
} from '@/web/AdminReq'
import { RobotDefine } from 'pp-base-define/RobotDefine'
import { GameID } from 'pp-base-define/GameIDDefine'
import GameIDSelect from '@/components/GameIDSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

// 获取性格显示名称（统一格式）
const getPersonalityName = (personality: RobotDefine.Personality | null | undefined): string => {
  if (personality === null || personality === undefined) {
    return '-'
  }
  const nameMap: Record<RobotDefine.Personality, string> = {
    [RobotDefine.Personality.Level0]: '保守',
    [RobotDefine.Personality.Level1]: '稳健',
    [RobotDefine.Personality.Level2]: '激进',
    [RobotDefine.Personality.Level3]: '非常激进',
  }
  return nameMap[personality] || `Level${personality}`
}

const loading = ref(false)
const saving = ref(false)
const configs = ref<RobotDefine.tPersonalityGameConfig_Base[]>([])
const filterGameID = ref<number | undefined>(undefined)

const showEditModal = ref(false)
const showCreateModal = ref(false)
const isEditing = ref(false)

const editForm = ref<Partial<RobotDefine.tPersonalityGameConfig_Base | RobotDefine.tPersonalityGameConfig_Texas>>({
  gameID: undefined,
  personality: undefined,
  desc: ''
})

// Texas 游戏专用表单数据
const texasForm = ref<Partial<RobotDefine.tPersonalityGameConfig_Texas>>({
  checkPercent: 0,
  isCheckOpponent: false,
  bluff: {
    betPercent: 0,
    betScales: [],
    raisePercent: 0,
    raiseScales: [],
    allinPercent: 0
  },
  bet: {
    percent: 0,
    maxToForcePercent: 0
  },
  raise: {
    percent: 0,
    maxToForcePercent: 0
  },
  call: {
    percent: 0,
    maxToForcePercent: 0
  },
  allin: {
    percent: 0,
    maxToForcePercent: 0
  }
})

// 判断是否为 Texas 游戏
const isTexasGame = computed(() => {
  return editForm.value.gameID === GameID.Texas
})

const loadConfigs = async () => {
  loading.value = true
  try {
    const response = await robotExtGetpersonalityconfigs({
      gameID: filterGameID.value,
      personality: undefined
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '加载失败')
      return
    }
    configs.value = response.datas || []
  } catch (error) {
    console.error('Load configs error:', error)
    Toast.error('网络错误')
  } finally {
    loading.value = false
  }
}

const editConfig = (config: RobotDefine.tPersonalityGameConfig_Base) => {
  isEditing.value = true
  editForm.value = { ...config }
  
  // 如果是 Texas 游戏，加载 Texas 特有配置
  if (config.gameID === GameID.Texas && 'checkPercent' in config) {
    const texasConfig = config as RobotDefine.tPersonalityGameConfig_Texas
    
    // 转换百分比值：确保是数字类型（兼容字符串格式）
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) {
        return 0
      }
      if (typeof value === 'string') {
        const num = parseFloat(value)
        return isNaN(num) ? 0 : Math.round(num)
      }
      return typeof value === 'number' ? Math.round(value) : 0
    }
    
    texasForm.value = {
      checkPercent: toNumber(texasConfig.checkPercent),
      isCheckOpponent: texasConfig.isCheckOpponent || false,
      bluff: texasConfig.bluff ? {
        betPercent: toNumber(texasConfig.bluff.betPercent),
        betScales: texasConfig.bluff.betScales || [],
        raisePercent: toNumber(texasConfig.bluff.raisePercent),
        raiseScales: texasConfig.bluff.raiseScales || [],
        allinPercent: toNumber(texasConfig.bluff.allinPercent)
      } : {
        betPercent: 0,
        betScales: [],
        raisePercent: 0,
        raiseScales: [],
        allinPercent: 0
      },
      bet: {
        percent: toNumber(texasConfig.bet?.percent),
        maxToForcePercent: texasConfig.bet?.maxToForcePercent !== undefined && texasConfig.bet?.maxToForcePercent !== null
          ? toNumber(texasConfig.bet.maxToForcePercent)
          : 0
      },
      raise: {
        percent: toNumber(texasConfig.raise?.percent),
        maxToForcePercent: texasConfig.raise?.maxToForcePercent !== undefined && texasConfig.raise?.maxToForcePercent !== null
          ? toNumber(texasConfig.raise.maxToForcePercent)
          : 0
      },
      call: {
        percent: toNumber(texasConfig.call?.percent),
        maxToForcePercent: texasConfig.call?.maxToForcePercent !== undefined && texasConfig.call?.maxToForcePercent !== null
          ? toNumber(texasConfig.call.maxToForcePercent)
          : 0
      },
      allin: {
        percent: toNumber(texasConfig.allin?.percent),
        maxToForcePercent: texasConfig.allin?.maxToForcePercent !== undefined && texasConfig.allin?.maxToForcePercent !== null
          ? toNumber(texasConfig.allin.maxToForcePercent)
          : 0
      }
    }
  } else {
    // 重置 Texas 表单
    texasForm.value = {
      checkPercent: 0,
      isCheckOpponent: false,
      bluff: {
        betPercent: 0,
        betScales: [],
        raisePercent: 0,
        raiseScales: [],
        allinPercent: 0
      },
      bet: {
        percent: 0,
        maxToForcePercent: 0
      },
      raise: {
        percent: 0,
        maxToForcePercent: 0
      },
      call: {
        percent: 0,
        maxToForcePercent: 0
      },
      allin: {
        percent: 0,
        maxToForcePercent: 0
      }
    }
  }
  
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  isEditing.value = false
  editForm.value = {
    gameID: undefined,
    personality: undefined,
    desc: ''
  }
  // 重置 Texas 表单
  texasForm.value = {
    checkPercent: 0,
    isCheckOpponent: false,
    bluff: {
      betPercent: 0,
      betScales: [],
      raisePercent: 0,
      raiseScales: [],
      allinPercent: 0
    },
    bet: {
      percent: 0,
      maxToForcePercent: 0
    },
    raise: {
      percent: 0,
      maxToForcePercent: 0
    },
    call: {
      percent: 0,
      maxToForcePercent: 0
    },
    allin: {
      percent: 0,
      maxToForcePercent: 0
    }
  }
}

const saveConfig = async () => {
  if (editForm.value.gameID === undefined || editForm.value.personality === undefined) {
    Toast.error('请填写必填项')
    return
  }
  saving.value = true
  try {
    // 合并基础配置和 Texas 配置
    let configToSave: any = { ...editForm.value }
    
    if (isTexasGame.value) {
      // 确保所有百分比字段都是数字类型（不是字符串）
      const ensureNumber = (value: any): number | undefined => {
        if (value === null || value === undefined) {
          return undefined
        }
        if (typeof value === 'string') {
          const num = parseFloat(value)
          return isNaN(num) ? undefined : Math.round(num)
        }
        return typeof value === 'number' ? Math.round(value) : undefined
      }
      
      const texasData = { ...texasForm.value }
      configToSave = {
        ...configToSave,
        checkPercent: ensureNumber(texasData.checkPercent) ?? 0,
        isCheckOpponent: texasData.isCheckOpponent,
        bluff: texasData.bluff ? {
          betPercent: ensureNumber(texasData.bluff.betPercent) ?? 0,
          betScales: texasData.bluff.betScales || [],
          raisePercent: ensureNumber(texasData.bluff.raisePercent) ?? 0,
          raiseScales: texasData.bluff.raiseScales || [],
          allinPercent: ensureNumber(texasData.bluff.allinPercent) ?? 0
        } : undefined,
        bet: texasData.bet ? {
          percent: ensureNumber(texasData.bet.percent) ?? 0,
          maxToForcePercent: (() => {
            const val = ensureNumber(texasData.bet.maxToForcePercent)
            return val !== undefined && val !== 0 ? val : undefined
          })()
        } : undefined,
        raise: texasData.raise ? {
          percent: ensureNumber(texasData.raise.percent) ?? 0,
          maxToForcePercent: (() => {
            const val = ensureNumber(texasData.raise.maxToForcePercent)
            return val !== undefined && val !== 0 ? val : undefined
          })()
        } : undefined,
        call: texasData.call ? {
          percent: ensureNumber(texasData.call.percent) ?? 0,
          maxToForcePercent: (() => {
            const val = ensureNumber(texasData.call.maxToForcePercent)
            return val !== undefined && val !== 0 ? val : undefined
          })()
        } : undefined,
        allin: texasData.allin ? {
          percent: ensureNumber(texasData.allin.percent) ?? 0,
          maxToForcePercent: (() => {
            const val = ensureNumber(texasData.allin.maxToForcePercent)
            return val !== undefined && val !== 0 ? val : undefined
          })()
        } : undefined
      }
    }
    
    const response = await robotExtSetpersonalityconfig({
      config: configToSave as RobotDefine.tPersonalityGameConfig_Base
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '保存失败')
      return
    }
    Toast.success(isEditing.value ? '保存成功' : '创建成功')
    closeEditModal()
    loadConfigs()
  } catch (error) {
    console.error('Save config error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const deleteConfig = async (config: RobotDefine.tPersonalityGameConfig_Base) => {
  if (!confirm(`确定要删除游戏ID ${config.gameID} 的性格配置吗？`)) {
    return
  }
  saving.value = true
  try {
    const response = await robotExtDeletepersonalityconfig({
      gameID: config.gameID,
      personality: config.personality
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '删除失败')
      return
    }
    Toast.success('删除成功')
    loadConfigs()
  } catch (error) {
    console.error('Delete config error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

// 监听 showCreateModal 变化
const watchCreateModal = () => {
  if (showCreateModal.value) {
    isEditing.value = false
    editForm.value = {
      gameID: undefined,
      personality: undefined,
      desc: ''
    }
    // 重置 Texas 表单
    texasForm.value = {
      checkPercent: 0,
      isCheckOpponent: false,
      bluff: {
        betPercent: 0,
        betScales: [],
        raisePercent: 0,
        raiseScales: [],
        allinPercent: 0
      },
      bet: {
        percent: 0,
        maxToForcePercent: 0
      },
      raise: {
        percent: 0,
        maxToForcePercent: 0
      },
      call: {
        percent: 0,
        maxToForcePercent: 0
      },
      allin: {
        percent: 0,
        maxToForcePercent: 0
      }
    }
    showEditModal.value = true
    showCreateModal.value = false
  }
}

// 使用 watch 监听
watch(showCreateModal, watchCreateModal)

// 监听 gameID 变化，动态重置配置表单（仅在创建模式下）
watch(() => editForm.value.gameID, (newGameID) => {
  if (!isEditing.value && showEditModal.value) {
    // 创建模式下，当 gameID 改变时，重置游戏特有配置
    if (newGameID === GameID.Texas) {
      // Texas 游戏，初始化 Texas 配置
      texasForm.value = {
        checkPercent: 0,
        isCheckOpponent: false,
        bluff: {
          betPercent: 0,
          betScales: [],
          raisePercent: 0,
          raiseScales: [],
          allinPercent: 0
        },
        bet: {
          percent: 0,
          maxToForcePercent: 0
        },
        raise: {
          percent: 0,
          maxToForcePercent: 0
        },
        call: {
          percent: 0,
          maxToForcePercent: 0
        },
        allin: {
          percent: 0,
          maxToForcePercent: 0
        }
      }
    } else if (newGameID !== undefined) {
      // 其他游戏，清空 Texas 配置
      texasForm.value = {
        checkPercent: 0,
        isCheckOpponent: false,
        bluff: {
          betPercent: 0,
          betScales: [],
          raisePercent: 0,
          raiseScales: [],
          allinPercent: 0
        },
        bet: {
          percent: 0,
          maxToForcePercent: 0
        },
        raise: {
          percent: 0,
          maxToForcePercent: 0
        },
        call: {
          percent: 0,
          maxToForcePercent: 0
        },
        allin: {
          percent: 0,
          maxToForcePercent: 0
        }
      }
    }
  }
})

onMounted(() => {
  loadConfigs()
})
</script>

