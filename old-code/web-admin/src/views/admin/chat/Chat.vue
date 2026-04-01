<template>
  <CRow>
    <CCol xs="12">
      <CCard class="mb-4 chat-container">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center">
            <strong>客服聊天</strong>
            <div>
              <CButton color="primary" size="sm" @click="loadNoFromRooms" :disabled="loadingNoFromRooms" class="me-2">
                <CIcon icon="cil-reload" class="me-1" />
                刷新待接入
              </CButton>
              <CButton color="primary" size="sm" @click="loadRooms" :disabled="loading">
                <CIcon icon="cil-reload" class="me-1" />
                刷新
              </CButton>
            </div>
          </div>
        </CCardHeader>
        <CCardBody class="p-0">
          <div class="d-flex chat-wrapper">
            <!-- 左侧房间列表 -->
            <div class="chat-sidebar">
              <div class="chat-sidebar-header">
                <h5 class="mb-0">房间列表</h5>
              </div>
              <div class="chat-sidebar-search">
                <CFormInput v-model="searchKeyword" placeholder="搜索房间..." class="mb-0" />
              </div>

              <!-- 未接入房间列表 -->
              <div v-if="noFromRooms.length > 0" class="no-from-rooms-section">
                <div class="no-from-rooms-header">
                  <strong class="text-warning">待接入 ({{ noFromRooms.length }})</strong>
                </div>
                <div class="no-from-rooms-list">
                  <div v-for="room in noFromRooms" :key="room.roomID" class="chat-conversation-item no-from-item">
                    <div class="conversation-avatar">
                      <div class="avatar-circle">
                        {{ getUserDisplayName(room.toUserID).charAt(0) }}
                      </div>
                    </div>
                    <div class="conversation-info">
                      <div class="conversation-name">
                        {{ getUserDisplayNameWithID(room.toUserID) }}
                      </div>
                      <div class="conversation-preview text-muted">
                        等待接入
                      </div>
                    </div>
                    <div class="conversation-actions">
                      <CButton color="primary" size="sm" @click.stop="joinRoom(room.roomID)">
                        加入
                      </CButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 已接入房间列表 -->
              <div class="chat-sidebar-list">
                <div v-if="loading" class="text-center py-4">
                  <CSpinner />
                </div>
                <div v-else>
                  <div v-for="room in filteredRooms" :key="room.roomID" class="chat-conversation-item"
                    :class="{ active: currentRoomID === room.roomID }" @click="selectRoom(room.roomID)">
                    <div class="conversation-avatar">
                      <div class="avatar-circle">
                        {{ getUserDisplayName(room.toUserID).charAt(0) }}
                      </div>
                      <!-- 未读消息红点 -->
                      <div v-if="unreadCounts[room.roomID]?.count > 0" class="unread-badge">
                        {{ unreadCounts[room.roomID].count > 99 ? '99+' : unreadCounts[room.roomID].count }}
                      </div>
                    </div>
                    <div class="conversation-info">
                      <div class="conversation-name">
                        {{ getUserDisplayNameWithID(room.toUserID) }}
                      </div>
                      <div class="conversation-preview">
                        {{ getRoomLastMessage(room.roomID) || '暂无消息' }}
                      </div>
                    </div>
                    <div class="conversation-time">
                      {{ formatTime(room.createTimestamp) }}
                    </div>
                  </div>
                  <div v-if="filteredRooms.length === 0" class="text-center py-4 text-muted">
                    暂无房间
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧聊天区域 -->
            <div class="chat-main">
              <div v-if="currentRoom" class="chat-content">
                <!-- 聊天头部 -->
                <div class="chat-header">
                  <div class="d-flex align-items-center">
                    <div class="chat-header-avatar">
                      <div class="avatar-circle large">
                        {{ getUserDisplayName(currentRoom.toUserID).charAt(0) }}
                      </div>
                    </div>
                    <div class="chat-header-info">
                      <h6 class="mb-0">{{ getUserDisplayNameWithID(currentRoom.toUserID) }}</h6>
                    </div>
                  </div>
                  <div class="chat-header-actions">
                    <!-- 当前接入客服信息 -->
                    <div v-if="currentRoom && currentRoom.fromUserID" class="current-service-info me-3">
                      <small class="text-muted">{{ getCurrentServiceInfo() }}</small>
                    </div>
                    <CDropdown>
                      <CDropdownToggle color="ghost" size="sm" variant="outline">
                        <CIcon icon="cil-options" />
                      </CDropdownToggle>
                      <CDropdownMenu>
                        <CDropdownItem @click="loadMoreHistory" :disabled="loadingChats || !hasMoreHistory">
                          <CIcon icon="cil-people" class="me-2" />
                          加载更多历史记录
                        </CDropdownItem>
                        <CDropdownItem @click="openTransferModal">
                          <CIcon icon="cil-people" class="me-2" />
                          转接客服
                        </CDropdownItem>
                        <CDropdownItem @click="loadChats(true)">
                          <CIcon icon="cil-reload" class="me-2" />
                          刷新消息
                        </CDropdownItem>
                      </CDropdownMenu>
                    </CDropdown>
                  </div>
                </div>

                <!-- 消息列表 -->
                <div class="chat-messages" ref="messagesContainer">
                  <div v-if="loadingChats" class="text-center py-4">
                    <CSpinner />
                  </div>
                  <div v-for="chat in chats" :key="chat.msgID" class="chat-message"
                    :class="{ 'message-sent': messagePositionMap[chat.msgID] === true, 'message-received': messagePositionMap[chat.msgID] !== true }">
                    <div class="message-content">
                      <div class="message-bubble">
                        <!-- 显示发送者昵称(ID) -->
                        <div class="message-sender">
                          {{ getUserDisplayNameWithID(chat.userID) }}
                        </div>
                        <!-- 文本消息 -->
                        <div v-if="chat.type === CustomerDefine.ChatType.Text" class="message-text">{{ chat.content }}
                        </div>
                        <!-- 图片消息 -->
                        <div v-else-if="chat.type === CustomerDefine.ChatType.Image" class="message-image">
                          <img :src="getImageSrc(chat)" @load="scrollToBottom" @error="onImageError"
                            class="chat-image" @click="openImagePreview(getImageSrc(chat))" />
                        </div>
                        <!-- 其他类型消息 -->
                        <div v-else class="message-text">{{ chat.content }}</div>
                        <div class="message-time">
                          {{ formatMessageTime(chat.timestamp) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="!loadingChats && chats.length === 0" class="text-center py-4 text-muted">
                    暂无消息
                  </div>
                </div>

                <!-- 输入区域 -->
                <div class="chat-input-area">
                  <div class="chat-input-wrapper">
                    <CFormInput v-model="inputMessage" placeholder="输入消息..." class="chat-input"
                      @keyup.enter="sendMessage" :disabled="!wsConnected" />
                    <CButton color="secondary" variant="outline" @click="triggerFileInput"
                      :disabled="!wsConnected" title="发送图片">
                      <CIcon icon="cilPaperclip" />
                    </CButton>
                    <CButton color="primary" @click="sendMessage" :disabled="!inputMessage.trim() || !wsConnected">
                      <CIcon icon="cil-send" />
                    </CButton>
                  </div>
                  <input ref="fileInput" type="file" accept="image/*" style="display: none;" @change="onFileSelected" />
                  <div v-if="!wsConnected" class="text-danger small mt-2">
                    <CIcon icon="cil-warning" class="me-1" />
                    WebSocket 未连接
                  </div>
                </div>
              </div>
              <div v-else class="chat-empty">
                <div class="text-center">
                  <CIcon icon="cil-chat-bubble" size="3xl" class="text-muted mb-3" />
                  <p class="text-muted">选择一个房间开始聊天</p>
                </div>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>

    <!-- 转接客服 Modal -->
    <CModal :visible="showTransferModal" @close="closeTransferModal" backdrop="static">
      <CModalHeader>
        <CModalTitle>转接客服</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>选择客服</CFormLabel>
            <div v-if="loadingCustomers" class="text-center py-3">
              <CSpinner size="sm" />
              <div class="mt-2 text-muted">加载客服列表...</div>
            </div>
            <select 
              v-else
              class="form-select" 
              v-model.number="transferUserID"
              :class="{ 'is-invalid': !transferUserID || transferUserID <= 0 }"
            >
              <option :value="0">请选择客服</option>
              <option 
                v-for="customer in availableCustomers" 
                :key="customer.userID" 
                :value="customer.userID"
              >
                {{ getCustomerDisplayName(customer) }}
              </option>
            </select>
            <div v-if="availableCustomers.length === 0 && !loadingCustomers" class="text-muted small mt-2">
              暂无可用客服
            </div>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeTransferModal">取消</CButton>
        <CButton color="primary" @click="transferCustomer" :disabled="!transferUserID || saving || loadingCustomers">
          {{ saving ? '转接中...' : '确认转接' }}
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- 图片预览模态框 -->
    <CModal :visible="showImagePreview" @close="closeImagePreview" size="xl" alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle>图片预览</CModalTitle>
      </CModalHeader>
      <CModalBody class="text-center p-0 image-preview-container" @wheel.prevent="handleImageWheel" ref="imagePreviewContainer">
        <img 
          :src="previewImageUrl" 
          alt="预览图片" 
          ref="previewImage"
          class="preview-image"
          :style="{ transform: `scale(${imageScale})`, transformOrigin: 'center center' }"
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="info" size="sm" @click="resetImageScale" class="me-2">
          重置缩放
        </CButton>
        <CButton color="secondary" @click="closeImagePreview">关闭</CButton>
      </CModalFooter>
    </CModal>
  </CRow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { chatGetrooms, chatGetnofromrooms, chatStartroom, chatGetchats, chatChangecustomer, chatGetchangeenabledcustomers, chatAdminIscustomerid } from '@/web/ChatReq'
import { CustomerDefine, CustomerMsgDefine } from 'pp-base-define/CustomerDefine'
import { UserDefine } from 'pp-base-define/UserDefine'
import { ChatWebSocket } from '@/utils/ChatWebSocket'
import { Toast } from '@/composables/useToast'

// 状态
const loading = ref(false)
const loadingChats = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const currentRoomID = ref<number | null>(null)
const inputMessage = ref('')
const showTransferModal = ref(false)
const transferUserID = ref<number>(0)
const availableCustomers = ref<{ userID: number, role: any, loginData: any }[]>([])
const loadingCustomers = ref(false)
// 用户信息映射：userID -> { nickName?, ... }
const userInfoMap = ref<Record<number, { nickName?: string }>>({})
// 客服信息映射：userID -> { roleName, nickName, ... }
const serviceInfoMap = ref<Record<number, { roleName: string, nickName?: string }>>({})
// 客服身份检查缓存：userID -> boolean（true表示是客服）
const customerCheckCache = ref<Record<number, boolean>>({})
// 正在检查中的用户ID集合（避免重复请求）
const checkingCustomerIDs = ref<Set<number>>(new Set())
// 消息显示位置映射：msgID -> boolean（true表示显示在右侧）
const messagePositionMap = ref<Record<number, boolean>>({})
const messagesContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const wsConnected = ref(false)
const hasMoreHistory = ref(true)
const currentHistoryPage = ref(0)
const unreadCounts = ref<Record<number, { count: number, latestMessage?: string }>>({}) // 房间ID -> 未读消息信息
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const imageScale = ref(1)
const previewImage = ref<HTMLImageElement | null>(null)
const imagePreviewContainer = ref<HTMLElement | null>(null)

// 数据
const rooms = ref<CustomerDefine.tRoom[]>([])
const noFromRooms = ref<CustomerDefine.tRoom[]>([]) // 未接入的房间列表
const chats = ref<CustomerDefine.tChat[]>([])
const currentUserID = ref<number>(0) // 当前登录用户ID
const ws = ref<ChatWebSocket | null>(null)
const loadingNoFromRooms = ref(false)

// 计算属性
const filteredRooms = computed(() => {
  if (!searchKeyword.value.trim()) {
    return rooms.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return rooms.value.filter(room =>
    room.toUserID.toString().includes(keyword) ||
    room.roomID.toString().includes(keyword)
  )
})

const currentRoom = computed(() => {
  if (!currentRoomID.value) return null
  return rooms.value.find(r => r.roomID === currentRoomID.value) || null
})

// 单条消息的缩略文案（文本或 [图片] 等）
const getMessagePreviewText = (chat: CustomerDefine.tChat): string => {
  if (chat.type === CustomerDefine.ChatType.Image) {
    return '[图片]'
  }
  const content = chat.content || ''
  return content.length > 20 ? content.substring(0, 20) + '...' : content
}

// 获取房间最后一条消息或状态信息
const getRoomLastMessage = (roomID: number): string => {
  // 检查是否有未读消息
  const unreadInfo = unreadCounts.value[roomID]
  if (unreadInfo && unreadInfo.count > 0) {
    // 显示最新的未读消息内容
    const content = unreadInfo.latestMessage || ''
    const truncated = content.length > 18 ? content.substring(0, 18) + '...' : content
    return truncated
  }

  // 从当前聊天记录中查找该房间的最后一条消息
  const roomChats = chats.value.filter(chat => chat.roomID === roomID)
  if (roomChats.length > 0) {
    const lastChat = roomChats[roomChats.length - 1]
    return getMessagePreviewText(lastChat)
  }

  // 如果没有消息，显示房间状态信息
  const room = rooms.value.find(r => r.roomID === roomID)
  if (room) {
    // 如果有最后消息ID但没有在本地加载，说明有历史消息
    if (room.lastMsgID > 0) {
      return '有历史消息'
    }
    // 否则显示创建时间
    if (room.createTimestamp) {
      return '暂无消息'
    }
  }

  return '暂无消息'
}

// 获取用户显示名称（用于头像）
const getUserDisplayName = (userID: number): string => {
  const userInfo = userInfoMap.value[userID]
  if (userInfo?.nickName) {
    return userInfo.nickName
  }
  // 如果没有昵称，返回ID的字符串形式（不再使用"用户"前缀）
  return String(userID)
}

// 获取用户显示名称（昵称(ID)格式）
const getUserDisplayNameWithID = (userID: number): string => {
  // 优先从客服信息映射中获取（如果是客服）
  const serviceInfo = serviceInfoMap.value[userID]
  if (serviceInfo?.nickName) {
    return `${serviceInfo.nickName}(${userID})`
  }
  
  // 然后从用户信息映射中获取
  const userInfo = userInfoMap.value[userID]
  const nickName = userInfo?.nickName
  if (nickName) {
    return `${nickName}(${userID})`
  }
  // 如果没有昵称，只显示ID（不再使用"用户"前缀）
  return String(userID)
}

// 检查用户是否是客服（使用缓存）
const checkIsCustomer = async (userID: number): Promise<boolean> => {
  // 如果缓存中有，直接返回
  if (customerCheckCache.value[userID] !== undefined) {
    return customerCheckCache.value[userID]
  }
  
  // 如果正在检查中，等待（这里简化处理，直接返回false，避免并发问题）
  if (checkingCustomerIDs.value.has(userID)) {
    return false
  }
  
  // 标记为正在检查
  checkingCustomerIDs.value.add(userID)
  
  try {
    const response = await chatAdminIscustomerid({
      userID: userID
    })
    
    if (response.errCode) {
      console.error('Check customer error:', response.errMsg)
      // 出错时默认不是客服
      customerCheckCache.value[userID] = false
      return false
    }
    
    // 缓存结果
    const isCustomer = response.b === true
    customerCheckCache.value[userID] = isCustomer
    return isCustomer
  } catch (error) {
    console.error('Check customer error:', error)
    // 出错时默认不是客服
    customerCheckCache.value[userID] = false
    return false
  } finally {
    // 移除正在检查标记
    checkingCustomerIDs.value.delete(userID)
  }
}

// 判断消息显示位置（同步版本，用于快速判断）
const getMessagePositionSync = (chat: CustomerDefine.tChat): boolean | null => {
  // 如果已经计算过，直接返回
  if (messagePositionMap.value[chat.msgID] !== undefined) {
    return messagePositionMap.value[chat.msgID]
  }
  
  // 如果 from 字段存在，使用它判断
  if (chat.from !== null && chat.from !== undefined) {
    return chat.from === true // from==true 表示是客服发的
  }
  
  // 兼容旧消息：判断是否是自己的ID
  if (chat.userID === currentUserID.value) {
    return true
  }
  
  // 检查消息的 userID 是否属于当前房间的双方
  if (currentRoom.value) {
    const room = currentRoom.value
    // 如果消息的 userID 是当前房间的 fromUserID 或 toUserID
    if (chat.userID === room.fromUserID) {
      return true // fromUserID 是客服，显示在右侧
    }
    if (chat.userID === room.toUserID) {
      return false // toUserID 是用户，显示在左侧
    }
    
    // 如果消息的 userID 不属于当前房间的双方，需要异步检查
    return null // 返回 null 表示需要异步检查
  }
  
  // 如果没有当前房间，默认显示在左侧
  return false
}

// 异步检查并更新消息显示位置
const updateMessagePosition = async (chat: CustomerDefine.tChat) => {
  // 先尝试同步判断
  const syncResult = getMessagePositionSync(chat)
  if (syncResult !== null) {
    messagePositionMap.value[chat.msgID] = syncResult
    return
  }
  
  // 如果需要异步检查（消息不属于当前房间的双方）
  if (currentRoom.value) {
    const isCustomer = await checkIsCustomer(chat.userID)
    messagePositionMap.value[chat.msgID] = isCustomer
  } else {
    messagePositionMap.value[chat.msgID] = false
  }
}

// 判断是否是我的消息（兼容 from 字段和 userID 判断，用于其他地方）
const isMyMessage = (chat: CustomerDefine.tChat): boolean => {
  // 如果已经计算过，直接返回
  if (messagePositionMap.value[chat.msgID] !== undefined) {
    return messagePositionMap.value[chat.msgID]
  }
  
  // 如果 from 字段存在，使用它判断
  if (chat.from !== null && chat.from !== undefined) {
    return chat.from === true // from==true 表示是客服发的
  }
  
  // 兼容旧消息：判断是否是自己的ID
  if (chat.userID === currentUserID.value) {
    return true
  }
  
  // 检查消息的 userID 是否属于当前房间的双方
  if (currentRoom.value) {
    const room = currentRoom.value
    if (chat.userID === room.fromUserID) {
      return true // fromUserID 是客服，显示在右侧
    }
    if (chat.userID === room.toUserID) {
      return false // toUserID 是用户，显示在左侧
    }
  }
  
  // 如果不属于当前房间的双方，默认显示在左侧（等待异步检查）
  return false
}

// 更新用户信息映射（从消息中提取）
const updateUserInfoFromChat = (chat: CustomerDefine.tChat) => {
  if (chat.userID) {
    // 如果消息中有用户信息，可以在这里更新
    // 目前先创建占位，后续可以从API获取
    if (!userInfoMap.value[chat.userID]) {
      userInfoMap.value[chat.userID] = {}
    }
  }
}

// 获取当前接入客服信息（职位 昵称 ID）
const getCurrentServiceInfo = (): string => {
  if (!currentRoom.value || !currentRoom.value.fromUserID) {
    return ''
  }
  
  const serviceInfo = serviceInfoMap.value[currentRoom.value.fromUserID]
  const userID = currentRoom.value.fromUserID
  
  if (serviceInfo) {
    const roleName = serviceInfo.roleName || '客服'
    const nickName = serviceInfo.nickName
    if (nickName) {
      return `${roleName} ${nickName}(${userID})`
    }
    return `${roleName} (${userID})`
  }
  
  // 如果客服信息映射中没有，尝试从用户信息映射中获取昵称
  const userInfo = userInfoMap.value[userID]
  const nickName = userInfo?.nickName
  if (nickName) {
    return `客服 ${nickName}(${userID})`
  }
  return `客服 (${userID})`
}

// 加载房间列表
const loadRooms = async () => {
  loading.value = true
  try {
    const response = await chatGetrooms({
      page: 0,
      limit: 100,
    })

    if (response.errCode) {
      Toast.error(response.errMsg || '获取房间列表失败')
      return
    }

    rooms.value = response.datas || []
    
    // 从接口返回的 loginDatas 中提取并缓存用户信息
    const responseData = response as any
    if (responseData.loginDatas && Array.isArray(responseData.loginDatas)) {
      responseData.loginDatas.forEach((loginData: any) => {
        if (loginData.userID) {
          if (!userInfoMap.value[loginData.userID]) {
            userInfoMap.value[loginData.userID] = {}
          }
          if (loginData.nickName) {
            userInfoMap.value[loginData.userID].nickName = loginData.nickName
          }
        }
      })
    }
  } catch (error) {
    console.error('Load rooms error:', error)
    Toast.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载未接入房间列表
const loadNoFromRooms = async () => {
  loadingNoFromRooms.value = true
  try {
    const response = await chatGetnofromrooms({
      limit: 50,
    })

    if (response.errCode) {
      Toast.error(response.errMsg || '获取未接入房间列表失败')
      return
    }

    noFromRooms.value = response.datas || []
    
    // 从接口返回的 loginDatas 中提取并缓存用户信息
    const responseData = response as any
    if (responseData.loginDatas && Array.isArray(responseData.loginDatas)) {
      responseData.loginDatas.forEach((loginData: any) => {
        if (loginData.userID) {
          if (!userInfoMap.value[loginData.userID]) {
            userInfoMap.value[loginData.userID] = {}
          }
          if (loginData.nickName) {
            userInfoMap.value[loginData.userID].nickName = loginData.nickName
          }
        }
      })
    }
  } catch (error) {
    console.error('Load no from rooms error:', error)
    Toast.error('网络错误，请稍后重试')
  } finally {
    loadingNoFromRooms.value = false
  }
}

// 加入房间（接入用户）
const joinRoom = async (roomID: number) => {
  try {
    const response = await chatStartroom({
      roomID: roomID,
    })

    if (response.errCode) {
      // 如果返回错误，说明其他客服已经加入
      Toast.warning(response.errMsg || '该房间已被其他客服接入')
      // 刷新未接入列表和房间列表
      await loadNoFromRooms()
      await loadRooms()
      return
    }

    Toast.success('成功接入房间')
    // 刷新未接入列表和房间列表
    await loadNoFromRooms()
    await loadRooms()
    // 自动选择该房间
    await selectRoom(roomID)
  } catch (error) {
    console.error('Join room error:', error)
    Toast.error('网络错误，请稍后重试')
  }
}

// 选择房间
const selectRoom = async (roomID: number) => {
  if (currentRoomID.value === roomID) return
  currentRoomID.value = roomID
  // 重置历史记录状态
  currentHistoryPage.value = 0
  hasMoreHistory.value = true
  chats.value = [] // 清空当前聊天记录
  messagePositionMap.value = {} // 清空消息位置映射
  // 清空该房间的未读消息计数
  if (unreadCounts.value[roomID]) {
    unreadCounts.value[roomID] = { count: 0 }
  }
  await loadChats()
}

// 加载聊天记录
const loadChats = async (refresh = false) => {
  if (!currentRoomID.value) return

  loadingChats.value = true
  try {
    const response = await chatGetchats({
      roomID: currentRoomID.value,
      page: 0,
      limit: 50, // 减少每次加载的数量，改善用户体验
    })

    if (response.errCode) {
      Toast.error(response.errMsg || '获取聊天记录失败')
      return
    }

    // 如果是刷新，清除现有消息
    if (refresh) {
      chats.value = []
      currentHistoryPage.value = 0
    }

    // 合并聊天记录，避免丢失新接收的消息
    const newChats = response.datas || []
    const existingMsgIDs = new Set(chats.value.map(chat => chat.msgID))

    // 只添加不存在的消息
    newChats.forEach((chat: any) => {
      if (!existingMsgIDs.has(chat.msgID)) {
        chats.value.push(chat)
        updateUserInfoFromChat(chat)
        // 异步更新消息显示位置
        updateMessagePosition(chat)
      }
    })
    
    // 从接口返回的 loginDatas 中提取并缓存用户信息
    const responseData = response as any
    if (responseData.loginDatas && Array.isArray(responseData.loginDatas)) {
      responseData.loginDatas.forEach((loginData: any) => {
        if (loginData.userID) {
          if (!userInfoMap.value[loginData.userID]) {
            userInfoMap.value[loginData.userID] = {}
          }
          if (loginData.nickName) {
            userInfoMap.value[loginData.userID].nickName = loginData.nickName
          }
        }
      })
    }

    // 重新排序
    chats.value.sort((a, b) => a.timestamp - b.timestamp)

    // 检查是否还有更多历史记录
    hasMoreHistory.value = newChats.length === 50 // 如果返回的数据等于limit，说明可能还有更多

    if (!refresh) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  } catch (error) {
    console.error('Load chats error:', error)
    Toast.error('网络错误，请稍后重试')
  } finally {
    loadingChats.value = false
  }
}

// 加载更多历史记录
const loadMoreHistory = async () => {
  if (!currentRoomID.value || !hasMoreHistory.value || loadingChats.value) return

  loadingChats.value = true
  try {
    currentHistoryPage.value += 1

    const response = await chatGetchats({
      roomID: currentRoomID.value,
      page: currentHistoryPage.value,
      limit: 50,
    })

    if (response.errCode) {
      Toast.error(response.errMsg || '获取历史记录失败')
      currentHistoryPage.value -= 1 // 回退页码
      return
    }

    const newChats = response.datas || []
    if (newChats.length === 0) {
      hasMoreHistory.value = false
      Toast.info('没有更多历史记录了')
      return
    }

    // 从接口返回的 loginDatas 中提取并缓存用户信息
    const responseData = response as any
    if (responseData.loginDatas && Array.isArray(responseData.loginDatas)) {
      responseData.loginDatas.forEach((loginData: any) => {
        if (loginData.userID) {
          if (!userInfoMap.value[loginData.userID]) {
            userInfoMap.value[loginData.userID] = {}
          }
          if (loginData.nickName) {
            userInfoMap.value[loginData.userID].nickName = loginData.nickName
          }
        }
      })
    }

    // 获取当前滚动位置，用于加载后保持相对位置
    const container = messagesContainer.value
    const oldScrollHeight = container ? container.scrollHeight : 0

    // 添加新消息到列表开头
    chats.value.unshift(...newChats)
    
    // 异步更新所有新消息的显示位置
    newChats.forEach((chat: any) => {
      updateMessagePosition(chat)
    })

    // 重新排序（确保时间顺序正确）
    chats.value.sort((a, b) => a.timestamp - b.timestamp)

    // 检查是否还有更多历史记录
    hasMoreHistory.value = newChats.length === 50

    // 保持滚动位置
    nextTick(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight
        const scrollDiff = newScrollHeight - oldScrollHeight
        container.scrollTop += scrollDiff
      }
    })

  } catch (error) {
    console.error('Load more history error:', error)
    Toast.error('网络错误，请稍后重试')
    currentHistoryPage.value -= 1 // 回退页码
  } finally {
    loadingChats.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || !currentRoomID.value || !ws.value || !ws.value.isConnected()) {
    return
  }

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  const success = ws.value.sendChat(
    currentRoomID.value,
    content,
    CustomerDefine.ChatType.Text
  )

  if (!success) {
    Toast.error('发送消息失败，请检查连接')
    inputMessage.value = content
  }
}

// 触发文件选择（供图片按钮调用）
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 文件选择处理
const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    Toast.error('请选择图片文件')
    return
  }

  // 检查文件大小（限制为5MB）
  if (file.size > 5 * 1024 * 1024) {
    Toast.error('图片大小不能超过5MB')
    return
  }

  if (!currentRoomID.value || !ws.value || !ws.value.isConnected()) {
    Toast.error('连接未就绪，无法发送图片')
    return
  }

  try {
    // 将文件转换为base64
    const base64 = await fileToBase64(file)
    const fileExt = file.name.split('.').pop() || 'png'

    // 发送图片消息
    const success = ws.value.sendChat(
      currentRoomID.value,
      '.' + fileExt,
      CustomerDefine.ChatType.Image,
      base64
    )

    if (!success) {
      Toast.error('发送图片失败，请检查连接')
    } else {
      // 清空文件输入
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  } catch (error) {
    console.error('处理图片文件失败:', error)
    Toast.error('处理图片文件失败')
  }
}

// 文件转base64的辅助函数
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除data:image/...;base64,前缀，只保留base64数据
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 打开转接客服模态框
const openTransferModal = async () => {
  showTransferModal.value = true
  transferUserID.value = 0
  await loadAvailableCustomers()
}

// 关闭转接客服模态框
const closeTransferModal = () => {
  showTransferModal.value = false
  transferUserID.value = 0
  availableCustomers.value = []
}

// 获取客服显示名称（角色/昵称(ID)格式）
const getCustomerDisplayName = (customer: { userID: number, role?: any, loginData?: any }): string => {
  // 判断角色类型
  let roleName = '客服'
  if (customer.role?.targets) {
    // 检查所有targets中的roles
    for (const target of customer.role.targets) {
      if (target.roles) {
        // 如果包含CustomerChatManager，是客服主管
        if (target.roles.includes(UserDefine.RoleType.CustomerChatManager)) {
          roleName = '客服主管'
          break
        }
        // 如果包含CustomerChat，是客服
        if (target.roles.includes(UserDefine.RoleType.CustomerChat)) {
          roleName = '客服'
        }
      }
    }
  }
  
  const nickName = customer.loginData?.nickName
  if (nickName) {
    return `${roleName} ${nickName}(${customer.userID})`
  }
  return `${roleName} (${customer.userID})`
}

// 加载可用的客服列表
const loadAvailableCustomers = async () => {
  loadingCustomers.value = true
  try {
    const response = await chatGetchangeenabledcustomers({})
    
    if (response.errCode) {
      Toast.error(response.errMsg || '获取客服列表失败')
      availableCustomers.value = []
      return
    }
    
    availableCustomers.value = response.datas || []
    
    // 更新用户信息映射和客服信息映射（从客服列表中提取昵称和角色）
    response.datas?.forEach(customer => {
      if (customer.userID) {
        // 更新用户信息映射
        if (customer.loginData?.nickName) {
          if (!userInfoMap.value[customer.userID]) {
            userInfoMap.value[customer.userID] = {}
          }
          userInfoMap.value[customer.userID].nickName = customer.loginData.nickName
        }
        
        // 更新客服信息映射
        let roleName = '客服'
        if (customer.role?.targets) {
          for (const target of customer.role.targets) {
            if (target.roles) {
              if (target.roles.includes(UserDefine.RoleType.CustomerChatManager)) {
                roleName = '客服主管'
                break
              }
              if (target.roles.includes(UserDefine.RoleType.CustomerChat)) {
                roleName = '客服'
              }
            }
          }
        }
        serviceInfoMap.value[customer.userID] = {
          roleName,
          nickName: customer.loginData?.nickName
        }
      }
    })
  } catch (error) {
    console.error('Load available customers error:', error)
    Toast.error('网络错误，请稍后重试')
    availableCustomers.value = []
  } finally {
    loadingCustomers.value = false
  }
}

// 转接客服
const transferCustomer = async () => {
  if (!currentRoomID.value || !transferUserID.value) {
    Toast.warning('请选择要转接的房间和客服')
    return
  }

  saving.value = true
  try {
    const response = await chatChangecustomer({
      roomID: currentRoomID.value,
      userID: transferUserID.value,
    })

    if (response.errCode) {
      Toast.error(response.errMsg || '转接客服失败')
      return
    }

    Toast.success('转接客服成功')
    closeTransferModal()
    await loadRooms()
    await loadNoFromRooms()
  } catch (error) {
    console.error('Transfer customer error:', error)
    Toast.error('网络错误，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 格式化消息时间
const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 获取图片源
const getImageSrc = (chat: CustomerDefine.tChat): string => {
  // 如果content是http开头的URL，直接使用
  if (chat.content && chat.content.startsWith('http')) {
    return chat.content
  }

  // 如果有data字段，尝试解析base64数据
  if (chat.data) {
    try {
      let base64 = chat.data.trim()

      // 如果已经是完整的data URL，直接返回
      if (base64.startsWith('data:image/')) {
        return base64
      }

      // 如果以data:开头但不是image类型，尝试修复
      if (base64.startsWith('data:')) {
        // 移除可能的多余前缀，重新构造
        const parts = base64.split(',')
        if (parts.length === 2) {
          const ext = chat.content.startsWith('.') ? chat.content.substring(1) : 'png'
          const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
          return `data:${mimeType};base64,${parts[1]}`
        }
      }

      // 构造完整的data URL
      const ext = chat.content.startsWith('.') ? chat.content.substring(1) : 'png'
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error('解析图片base64失败:', error, 'chat:', chat)
    }
  }

  // 返回占位符
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUI5QkE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'
}

// 图片加载错误处理
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 避免重复设置错误图片
  if (img.src.includes('No%20Image')) {
    return
  }
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUI5QkE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'
}

// 打开图片预览
const openImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  imageScale.value = 1 // 重置缩放
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
  imageScale.value = 1 // 重置缩放
}

// 处理图片滚轮缩放
const handleImageWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.5, Math.min(5, imageScale.value + delta))
  imageScale.value = Math.round(newScale * 10) / 10 // 保留一位小数
}

// 重置图片缩放
const resetImageScale = () => {
  imageScale.value = 1
}

// 初始化 WebSocket
const initWebSocket = async () => {
  // 使用配置中的 WebSocket URL
  const wsUrl = sessionStorage.getItem('customerWSHost') || ''

  if (!wsUrl) {
    Toast.error('WebSocket 地址未配置')
    return
  }

  ws.value = new ChatWebSocket(wsUrl)
  ws.value.setWsUrl(wsUrl)

  // 监听事件
  ws.value.on('connected', () => {
    console.log('WebSocket connected')
    wsConnected.value = true

    // 登录
    const ak = sessionStorage.getItem('ak')
    if (ak) {
      ws.value?.login(ak)
    }
  })

  ws.value.on('disconnected', () => {
    console.log('WebSocket disconnected')
    wsConnected.value = false
  })

  ws.value.on('error', (data: any) => {
    console.error('WebSocket error:', data)
    if (data.error) {
      Toast.error('WebSocket 连接错误')
    } else if (data.code) {
      Toast.error(`错误: ${data.msg}`)
    }
  })

  ws.value.on('login', (data: { success: boolean; errCode?: number; errMsg?: string }) => {
    if (data.success) {
      console.log('WebSocket login success')
      // 获取当前用户ID（从登录响应或其他地方）
    } else {
      Toast.error(data.errMsg || 'WebSocket 登录失败')
    }
  })

  ws.value.on('chat', (data: { chat: CustomerDefine.tChat | any }) => {
    const chat = data.chat
    // 从WebSocket消息中提取用户信息（loginData），如果消息中包含loginData则更新缓存
    if (chat.userID && (chat as any).loginData) {
      if (!userInfoMap.value[chat.userID]) {
        userInfoMap.value[chat.userID] = {}
      }
      if ((chat as any).loginData.nickName) {
        userInfoMap.value[chat.userID].nickName = (chat as any).loginData.nickName
      }
    }
    
    // 如果是当前房间的消息，添加到聊天记录
    if (chat.roomID === currentRoomID.value) {
      // 检查是否已经存在相同消息，避免重复添加
      const existingIndex = chats.value.findIndex(c => c.msgID === chat.msgID)
      if (existingIndex === -1) {
        chats.value.push(chat)
        updateUserInfoFromChat(chat)
        // 异步更新消息显示位置
        updateMessagePosition(chat)
        nextTick(() => {
          scrollToBottom()
        })
    } else {
      // 如果消息已存在，更新它（可能有状态变化）
      chats.value[existingIndex] = chat
      updateUserInfoFromChat(chat)
      // 更新消息显示位置
      updateMessagePosition(chat)
    }
    } else {
      // 如果不是当前房间的消息，增加未读消息计数
      if (!unreadCounts.value[chat.roomID]) {
        unreadCounts.value[chat.roomID] = { count: 0 }
      }
      unreadCounts.value[chat.roomID].count++
      // 保存最新的消息内容用于显示（图片消息显示 [图片]）
      unreadCounts.value[chat.roomID].latestMessage = chat.type === CustomerDefine.ChatType.Image ? '[图片]' : (chat.content || '')
    }
    // 只在必要时更新房间状态，避免每次消息都重新加载整个列表
    // 注释掉频繁的重新加载调用，改用更轻量级的更新
    // loadRooms()
    // loadNoFromRooms()
  })

  ws.value.on('roomChanged', (data: CustomerMsgDefine.tRoomChangedNT) => {
    console.log('Room changed:', data)
    // 刷新房间列表和未接入列表
    loadRooms()
    loadNoFromRooms()
    // 如果当前房间发生变化，刷新聊天记录
    if (currentRoomID.value && (data.roomID === currentRoomID.value || data.roomIDs?.includes(currentRoomID.value))) {
      loadChats()
    }
  })

  // 连接
  try {
    await ws.value.connect()
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
    Toast.error('WebSocket 连接失败')
  }
}

// 监听消息变化，自动滚动
watch(chats, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

onMounted(async () => {
  // 获取当前用户ID（从 sessionStorage）
  try {
    const accountStr = sessionStorage.getItem('account') || sessionStorage.getItem('loginData')
    if (accountStr) {
      const account = JSON.parse(accountStr)
      if (account.userID) {
        currentUserID.value = account.userID
      }
    }
  } catch (error) {
    console.error('Failed to get current user ID:', error)
  }

  // 先加载未接入房间列表
  await loadNoFromRooms()

  // 加载房间列表
  await loadRooms()

  // 初始化 WebSocket
  await initWebSocket()
})

onUnmounted(() => {
  // 断开 WebSocket
  if (ws.value) {
    ws.value.disconnect()
  }
})
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 200px);
  min-height: 600px;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-container :deep(.card-body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-wrapper {
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.chat-sidebar {
  width: 300px;
  border-right: 1px solid var(--cui-border-color);
  display: flex;
  flex-direction: column;
  background-color: var(--cui-body-bg);
}

.chat-sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--cui-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-sidebar-search {
  padding: 0.75rem;
  border-bottom: 1px solid var(--cui-border-color);
}

.chat-sidebar-list {
  flex: 1;
  overflow-y: auto;
}

.chat-conversation-item {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid var(--cui-border-color);
  transition: background-color 0.2s;
}

.chat-conversation-item:hover {
  background-color: var(--cui-gray-100);
}

.chat-conversation-item.active {
  background-color: var(--cui-primary);
  color: white;
}

.conversation-avatar {
  position: relative;
  margin-right: 0.75rem;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--cui-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.avatar-circle.large {
  width: 48px;
  height: 48px;
  font-size: 1.125rem;
}

.status-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 0.625rem;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-preview {
  font-size: 0.875rem;
  color: var(--cui-gray-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-conversation-item.active .conversation-preview {
  color: rgba(255, 255, 255, 0.8);
}

.conversation-time {
  font-size: 0.75rem;
  color: var(--cui-gray-500);
  margin-left: 0.5rem;
}

.chat-conversation-item.active .conversation-time {
  color: rgba(255, 255, 255, 0.7);
}

.no-from-rooms-section {
  border-bottom: 2px solid var(--cui-warning);
  background-color: var(--cui-warning-bg-subtle);
}

.no-from-rooms-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--cui-border-color);
  background-color: var(--cui-warning-bg-subtle);
}

.no-from-rooms-list {
  max-height: 300px;
  overflow-y: auto;
}

.chat-conversation-item.no-from-item {
  background-color: var(--cui-warning-bg-subtle);
}

.chat-conversation-item.no-from-item:hover {
  background-color: var(--cui-warning-bg-subtle);
  opacity: 0.9;
}

.conversation-actions {
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  min-width: 20px;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.chat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--cui-body-bg);
  overflow: hidden;
}

.chat-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  max-height: 100%;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid var(--cui-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--cui-body-bg);
  flex-shrink: 0;
  gap: 0.75rem;
}

.chat-header > .d-flex {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.chat-header-avatar {
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.chat-header-info {
  min-width: 0;
}

.chat-header-info h6 {
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.chat-header-actions .current-service-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  background-color: var(--cui-gray-50);
  min-height: 0;
  max-height: 100%;
  height: 0; /* 强制 flex 子元素正确计算高度 */
}

.chat-message {
  margin-bottom: 1rem;
  display: flex;
}

.message-sent {
  justify-content: flex-end;
}

.message-received {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
}

.message-sent .message-bubble {
  background-color: var(--cui-primary);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.message-received .message-bubble {
  background-color: white;
  color: var(--cui-body-color);
  border-bottom-left-radius: 0.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-sender {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.message-sent .message-sender {
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
}

.message-received .message-sender {
  color: var(--cui-gray-600);
  text-align: left;
}

.message-text {
  margin-bottom: 0.25rem;
  word-wrap: break-word;
}

.message-image {
  margin-bottom: 0.25rem;
  max-width: 100%;
}

.chat-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.chat-image:hover {
  transform: scale(1.05);
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  text-align: right;
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid var(--cui-border-color);
  background-color: var(--cui-body-bg);
  flex-shrink: 0;
}

.chat-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chat-input {
  flex: 1;
}

.chat-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
    position: absolute;
    z-index: 10;
    height: 100%;
  }

  .chat-main {
    width: 100%;
  }
}
</style>
