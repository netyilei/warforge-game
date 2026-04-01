<template>
  <div class="user-select">
    <!-- 已选用户显示 -->
    <div v-if="selectedUsers.length > 0" class="mb-3">
      <CFormLabel>已选用户 ({{ selectedUsers.length }})</CFormLabel>
      <div class="selected-users-list">
        <CBadge
          v-for="user in selectedUsers"
          :key="user.userID"
          color="primary"
          class="me-2 mb-2"
          style="cursor: pointer; font-size: 0.875rem; padding: 0.5rem 0.75rem;"
          @click="removeUser(user.userID)"
        >
          {{ user.nickName || `用户${user.userID}` }}({{ user.userID }})
          <CIcon icon="cil-x" class="ms-1" />
        </CBadge>
      </div>
    </div>

    <!-- 搜索和选择区域 -->
    <div class="mb-3">
      <CFormLabel>选择用户</CFormLabel>
      <div class="d-flex gap-2 mb-2">
        <CFormInput
          v-model="searchUserID"
          type="number"
          placeholder="输入用户ID搜索"
          style="flex: 1;"
          @keyup.enter="handleSearch"
        />
        <CButton color="primary" @click="handleSearch" :disabled="loading">
          <CIcon icon="cil-magnifying-glass" class="me-1" />
          搜索
        </CButton>
        <CButton color="secondary" @click="clearSearch" :disabled="loading">
          清除
        </CButton>
      </div>
    </div>

    <!-- 用户列表 -->
    <div v-if="loading" class="text-center py-3">
      <CSpinner size="sm" />
      <div class="mt-2 small text-muted">加载中...</div>
    </div>
    <div v-else-if="userList.length === 0" class="text-center py-3 text-muted">
      暂无用户数据
    </div>
    <div v-else class="user-list-container">
      <CTable hover responsive small>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell style="width: 50px;">
              <CFormCheck
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
              />
            </CTableHeaderCell>
            <CTableHeaderCell>用户ID</CTableHeaderCell>
            <CTableHeaderCell>昵称</CTableHeaderCell>
            <CTableHeaderCell>操作</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="user in userList" :key="user.userID">
            <CTableDataCell>
              <CFormCheck
                :checked="isSelected(user.userID)"
                @change="toggleUser(user)"
              />
            </CTableDataCell>
            <CTableDataCell>{{ user.userID }}</CTableDataCell>
            <CTableDataCell>{{ user.loginData?.nickName || '-' }}</CTableDataCell>
            <CTableDataCell>
              <CButton
                v-if="!isSelected(user.userID)"
                color="success"
                size="sm"
                @click="addUser(user)"
              >
                选择
              </CButton>
              <CButton
                v-else
                color="danger"
                size="sm"
                @click="removeUser(user.userID)"
              >
                取消
              </CButton>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>

      <!-- 分页 -->
      <div v-if="totalCount > pageSize" class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted small">
          共 {{ totalCount }} 条记录，当前第 {{ currentPage + 1 }} / {{ Math.ceil(totalCount / pageSize) }} 页
        </div>
        <CPagination>
          <CPaginationItem
            :disabled="currentPage === 0"
            @click="currentPage = 0; loadUsers()"
          >
            首页
          </CPaginationItem>
          <CPaginationItem
            :disabled="currentPage === 0"
            @click="currentPage--; loadUsers()"
          >
            上一页
          </CPaginationItem>
          <CPaginationItem active>
            {{ currentPage + 1 }} / {{ Math.ceil(totalCount / pageSize) }}
          </CPaginationItem>
          <CPaginationItem
            :disabled="currentPage >= Math.ceil(totalCount / pageSize) - 1"
            @click="currentPage++; loadUsers()"
          >
            下一页
          </CPaginationItem>
          <CPaginationItem
            :disabled="currentPage >= Math.ceil(totalCount / pageSize) - 1"
            @click="currentPage = Math.ceil(totalCount / pageSize) - 1; loadUsers()"
          >
            末页
          </CPaginationItem>
        </CPagination>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { userGetusers } from '@/web/AdminReq'
import { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { UserDefine } from 'pp-base-define/UserDefine'

interface Props {
  modelValue?: number[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

// 用户列表数据
const loading = ref(false)
const userList = ref<AdminReqDefine.tUserGetusersRes['users']>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)
const searchUserID = ref<number | undefined>(undefined)

// 已选用户
const selectedUsers = ref<AdminReqDefine.tUserGetusersRes['users']>([])

// 计算属性
const selectedUserIDs = computed(() => {
  return props.modelValue || []
})

const allSelected = computed(() => {
  return userList.value.length > 0 && userList.value.every(user => isSelected(user.userID))
})

const someSelected = computed(() => {
  return userList.value.some(user => isSelected(user.userID)) && !allSelected.value
})

// 方法
const isSelected = (userID: number): boolean => {
  return selectedUserIDs.value.includes(userID)
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params: AdminReqDefine.tUserGetusersReq = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchUserID.value !== undefined && searchUserID.value !== null) {
      params.userID = searchUserID.value
    }

    const response = await userGetusers(params)
    if (response.errCode) {
      console.error('Load users error:', response.errMsg)
      return
    }

    userList.value = response.users || []
    totalCount.value = response.count || 0
  } catch (error) {
    console.error('Load users error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 0
  loadUsers()
}

const clearSearch = () => {
  searchUserID.value = undefined
  currentPage.value = 0
  loadUsers()
}

const addUser = (user: AdminReqDefine.tUserGetusersRes['users'][0]) => {
  if (props.disabled) return
  if (!isSelected(user.userID)) {
    const newValue = [...selectedUserIDs.value, user.userID]
    emit('update:modelValue', newValue)
    updateSelectedUsers(newValue)
  }
}

const removeUser = (userID: number) => {
  if (props.disabled) return
  const newValue = selectedUserIDs.value.filter(id => id !== userID)
  emit('update:modelValue', newValue)
  updateSelectedUsers(newValue)
}

const toggleUser = (user: AdminReqDefine.tUserGetusersRes['users'][0]) => {
  if (isSelected(user.userID)) {
    removeUser(user.userID)
  } else {
    addUser(user)
  }
}

const toggleSelectAll = () => {
  if (props.disabled) return
  if (allSelected.value) {
    // 取消选择当前页所有用户
    const currentPageUserIDs = userList.value.map(u => u.userID)
    const newValue = selectedUserIDs.value.filter(id => !currentPageUserIDs.includes(id))
    emit('update:modelValue', newValue)
    updateSelectedUsers(newValue)
  } else {
    // 选择当前页所有未选中的用户
    const currentPageUserIDs = userList.value.map(u => u.userID)
    const newValue = [...new Set([...selectedUserIDs.value, ...currentPageUserIDs])]
    emit('update:modelValue', newValue)
    updateSelectedUsers(newValue)
  }
}

// 更新已选用户列表（用于显示昵称）
const updateSelectedUsers = async (userIDs: number[]) => {
  if (userIDs.length === 0) {
    selectedUsers.value = []
    return
  }

  // 从当前列表中找到已选用户
  const foundUsers: AdminReqDefine.tUserGetusersRes['users'] = []
  const missingIDs: number[] = []

  userIDs.forEach(userID => {
    const user = userList.value.find(u => u.userID === userID)
    if (user) {
      foundUsers.push(user)
    } else {
      // 检查是否已经在 selectedUsers 中
      const existingUser = selectedUsers.value.find(u => u.userID === userID)
      if (existingUser) {
        foundUsers.push(existingUser)
      } else {
        missingIDs.push(userID)
      }
    }
  })

  // 如果有缺失的用户ID，需要单独加载
  if (missingIDs.length > 0) {
    try {
      // 接口支持 userIDs 参数，批量获取用户
      const response = await userGetusers({
        userIDs: missingIDs,
        page: 0,
        limit: missingIDs.length
      })
      if (!response.errCode && response.users) {
        foundUsers.push(...response.users)
      }
    } catch (error) {
      console.error('Load missing users error:', error)
      // 如果批量获取失败，尝试逐个获取（降级处理）
      for (const userID of missingIDs) {
        try {
          const singleResponse = await userGetusers({
            userID: userID,
            page: 0,
            limit: 1
          })
          if (!singleResponse.errCode && singleResponse.users && singleResponse.users.length > 0) {
            foundUsers.push(singleResponse.users[0])
          }
        } catch (e) {
          console.error(`Load user ${userID} error:`, e)
        }
      }
    }
  }

  selectedUsers.value = foundUsers
}

// 监听 modelValue 变化，更新已选用户列表
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    updateSelectedUsers(newValue)
  } else {
    selectedUsers.value = []
  }
}, { immediate: true })

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-select {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #fff;
}

.selected-users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  min-height: 3rem;
}

.user-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}
</style>
