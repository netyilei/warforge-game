<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>普通用户管理</strong>
                        <div>
                            <CButton color="success" size="sm" @click="openCreateAccountModal" class="me-2">
                                <CIcon icon="cil-plus" class="me-1" />
                                创建账户
                            </CButton>
                        <CButton color="primary" size="sm" @click="loadUsers">
                            <CIcon icon="cil-reload" class="me-1" />
                            刷新
                        </CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 筛选条件 -->
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormLabel>用户ID</CFormLabel>
                            <CFormInput
                                type="number"
                                v-model.number="filterUserID"
                                placeholder="输入用户ID（留空显示全部）"
                            />
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>账号</CFormLabel>
                            <CFormInput
                                type="text"
                                v-model="filterAccount"
                                placeholder="输入账号（留空显示全部）"
                            />
                        </CCol> 
                        <CCol :md="3">
                            <CFormLabel>昵称</CFormLabel>
                            <CFormInput
                                type="text"
                                v-model="filterNickName"
                                placeholder="输入昵称（留空显示全部）"
                            />
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>是否包含代理</CFormLabel>
                            <select class="form-select" v-model.number="filterContainsProxy">
                                <option :value="true">是</option>
                                <option :value="false">否</option>
                            </select>
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>是否包含禁用登录</CFormLabel>
                            <select class="form-select" v-model.number="filterDisabled">
                                <option :value="true">是</option>
                                <option :value="false">否</option>
                            </select>
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>是否仅锁定提现</CFormLabel>
                            <select class="form-select" v-model.number="filterLockWithdraw">
                                <option :value="true">是</option>
                                <option :value="false">否</option>
                            </select>
                        </CCol>
                        <CCol :md="3" class="d-flex align-items-end">
                            <CButton color="primary" @click="handleSearch" class="me-2">
                                <CIcon icon="cil-magnifying-glass" class="me-1" />
                                搜索
                            </CButton>
                            <CButton color="secondary" @click="clearSearch">
                                清除
                            </CButton>
                        </CCol>
                    </CRow>

                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <div v-else>
                        <!-- 用户列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>用户ID</CTableHeaderCell>
                                    <CTableHeaderCell>昵称</CTableHeaderCell>
                                    <CTableHeaderCell>账号</CTableHeaderCell>
                                    <CTableHeaderCell>登录渠道</CTableHeaderCell>
                                    <CTableHeaderCell>锁定登录</CTableHeaderCell>
                                    <CTableHeaderCell>锁定提现</CTableHeaderCell>
                                    <CTableHeaderCell>金币余额</CTableHeaderCell>
                                    <!-- <CTableHeaderCell>期望值</CTableHeaderCell> -->
                                    <CTableHeaderCell>累计返利</CTableHeaderCell>
                                    <CTableHeaderCell>总充值</CTableHeaderCell>
                                    <CTableHeaderCell>总提现</CTableHeaderCell>
                                    <CTableHeaderCell>注册时间</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="user in userList" :key="user.userID"
                                    :class="{ 'balance-exception-highlight': isExceptionValuePositive(user) }">
                                    <CTableDataCell>{{ user.userID }}</CTableDataCell>
                                    <CTableDataCell>{{ user.loginData?.nickName || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <span v-for="(channel, index) in user.loginChannels" :key="index" class="me-1">
                                                {{ channel.account || '-' }}
                                        </span>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <span v-for="(channel, index) in user.loginChannels" :key="index" class="me-1">
                                            <CBadge :color="getChannelColor(channel.type)">
                                                {{ getChannelName(channel.type) }}
                                            </CBadge>
                                        </span>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ user.loginData?.disabled ? '是' : '否' }}</CTableDataCell>
                                    <CTableDataCell>{{ user.loginData?.lockWithdraw ? '是' : '否' }}</CTableDataCell>
                                    <CTableDataCell>{{ getGoldBalance(user) }}</CTableDataCell>
                                    <!-- <CTableDataCell>{{ getBalanceField(user, 'exceptionValue') }}</CTableDataCell> -->
                                    <!-- <CTableDataCell>{{ getExceptionField(user) + "/" + getBalanceField(user, 'exceptionValue') }}</CTableDataCell> -->
                                    <CTableDataCell>{{ getBalanceField(user, 'rewardValue') }}</CTableDataCell>
                                    <CTableDataCell>{{ getBalanceField(user, 'totalCharge') }}</CTableDataCell>
                                    <CTableDataCell>{{ getBalanceField(user, 'totalWithdraw') }}</CTableDataCell>
                                    <CTableDataCell>{{ user.loginData?.regDate || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CDropdown variant="btn-group">
                                            <CDropdownToggle color="secondary" size="sm">
                                                操作
                                            </CDropdownToggle>
                                            <CDropdownMenu>
                                                <CDropdownItem @click="viewUserBag(user.userID)">
                                                    背包
                                                </CDropdownItem>
                                                <CDropdownItem @click="viewUserLocked(user.userID)">
                                                    锁定
                                                </CDropdownItem>
                                                <CDropdownItem @click="addUserItem(user.userID)">
                                                    添加物品
                                                </CDropdownItem>
                                                <CDropdownItem @click="openChangePasswordModal(user.userID)">
                                                    修改密码
                                                </CDropdownItem>
                                                <CDropdownItem v-if="!isUserProxy(user)" @click="setUserToProxy(user,true)">
                                                    升级为代理用户
                                                </CDropdownItem>
                                                <CDropdownItem v-else @click="setUserToProxy(user,false)" disabled>
                                                    降级为普通用户
                                                </CDropdownItem>
                                                <CDropdownItem v-if="!user.loginData?.disabled" @click="setUserDisabled(user.userID)">
                                                    设置禁用登录
                                                </CDropdownItem>
                                                <CDropdownItem v-else @click="setUserEnabled(user.userID)">
                                                    设置启用登录
                                                </CDropdownItem>
                                                <CDropdownItem v-if="!user.loginData?.lockWithdraw" @click="setUserLockWithdraw(user.userID, true)">
                                                    锁定提现
                                                </CDropdownItem>
                                                <CDropdownItem v-else @click="setUserUnlockWithdraw(user.userID)">
                                                    解锁提现
                                                </CDropdownItem>
                                            </CDropdownMenu>
                                        </CDropdown>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!userList || userList.length === 0">
                                    <CTableDataCell colspan="10" class="text-center text-muted py-4">
                                        暂无用户数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>

                        <!-- 分页 -->
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="text-muted">
                                共 {{ totalCount }} 条记录，第 {{ currentPage + 1 }} / {{ totalPages || 1 }} 页
                            </span>
                            <CPagination v-if="totalPages > 0" align="end">
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
                                    {{ currentPage + 1 }} / {{ totalPages }}
                                </CPaginationItem>
                                <CPaginationItem
                                    :disabled="currentPage >= totalPages - 1"
                                    @click="currentPage++; loadUsers()"
                                >
                                    下一页
                                </CPaginationItem>
                                <CPaginationItem
                                    :disabled="currentPage >= totalPages - 1"
                                    @click="currentPage = totalPages - 1; loadUsers()"
                                >
                                    末页
                                </CPaginationItem>
                            </CPagination>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <!-- 查看用户背包 Modal -->
        <CModal :visible="showBagModal" @close="closeBagModal" size="lg">
            <CModalHeader>
                <CModalTitle>用户背包 (用户ID: {{ viewingUserID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <div v-if="bagLoading" class="text-center py-4">
                    <CSpinner />
                    <div class="mt-2">加载中...</div>
                </div>
                <div v-else>
                    <CTable hover responsive>
                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell>道具ID</CTableHeaderCell>
                                <CTableHeaderCell>UUID</CTableHeaderCell>
                                <CTableHeaderCell>数量</CTableHeaderCell>
                                <CTableHeaderCell>过期时间</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            <CTableRow v-for="(item, index) in bagItems" :key="index">
                                <CTableDataCell>{{ item.id }}</CTableDataCell>
                                <CTableDataCell>{{ item.uuid || '-' }}</CTableDataCell>
                                <CTableDataCell>{{ item.count }}</CTableDataCell>
                                <CTableDataCell>{{ item.expire ? new Date(item.expire * 1000).toLocaleString() : '-' }}</CTableDataCell>
                            </CTableRow>
                            <CTableRow v-if="!bagItems || bagItems.length === 0">
                                <CTableDataCell colspan="4" class="text-center text-muted py-4">
                                    暂无物品
                                </CTableDataCell>
                            </CTableRow>
                        </CTableBody>
                    </CTable>
                </div>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeBagModal">关闭</CButton>
            </CModalFooter>
        </CModal>

        <!-- 查看用户锁定物品 Modal -->
        <CModal :visible="showLockedModal" @close="closeLockedModal" size="lg">
            <CModalHeader>
                <CModalTitle>用户锁定物品 (用户ID: {{ viewingUserID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <div class="mb-3">
                    <CButton color="success" size="sm" @click="openCreateLockModal">
                        <CIcon icon="cil-plus" class="me-1" />
                        创建锁定物品
                    </CButton>
                </div>
                <div v-if="lockedLoading" class="text-center py-4">
                    <CSpinner />
                    <div class="mt-2">加载中...</div>
                </div>
                <div v-else>
                    <CTable hover responsive>
                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell>锁定ID</CTableHeaderCell>
                                <CTableHeaderCell>俱乐部ID</CTableHeaderCell>
                                <CTableHeaderCell>房间ID</CTableHeaderCell>
                                <CTableHeaderCell>物品数量</CTableHeaderCell>
                                <CTableHeaderCell>创建时间</CTableHeaderCell>
                                <CTableHeaderCell>操作</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            <CTableRow v-for="lock in lockedItems" :key="lock.lockID">
                                <CTableDataCell>{{ lock.lockID }}</CTableDataCell>
                                <CTableDataCell>{{ lock.clubID || '-' }}</CTableDataCell>
                                <CTableDataCell>{{ lock.roomID || '-' }}</CTableDataCell>
                                <CTableDataCell>{{ lock.items?.length || 0 }}</CTableDataCell>
                                <CTableDataCell>{{ lock.date }}</CTableDataCell>
                                <CTableDataCell>
                                    <CButton color="primary" size="sm" @click="unlockItem(lock.userID, lock.lockID, lock.clubID)">
                                        解锁
                                    </CButton>
                                </CTableDataCell>
                            </CTableRow>
                            <CTableRow v-if="!lockedItems || lockedItems.length === 0">
                                <CTableDataCell colspan="6" class="text-center text-muted py-4">
                                    暂无锁定物品
                                </CTableDataCell>
                            </CTableRow>
                        </CTableBody>
                    </CTable>
                </div>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeLockedModal">关闭</CButton>
            </CModalFooter>
        </CModal>

        <!-- 创建锁定物品 Modal -->
        <CModal :visible="showCreateLockModal" @close="closeCreateLockModal">
            <CModalHeader>
                <CModalTitle>创建锁定物品</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>用户ID</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="lockForm.userID"
                            placeholder="请输入用户ID"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>锁定ID</CFormLabel>
                        <CFormInput
                            v-model="lockForm.lockID"
                            placeholder="请输入锁定ID"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>道具ID</CFormLabel>
                        <ItemSelect
                            v-model="lockForm.itemID"
                            placeholder="请选择道具（可选）"
                            placeholder-value=""
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>俱乐部ID</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="lockForm.clubID"
                            placeholder="请输入俱乐部ID（可选）"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>价值索引</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="lockForm.valueIndex"
                            placeholder="请输入价值索引（可选）"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>数量</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="lockForm.count"
                            placeholder="请输入数量"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>序列类型</CFormLabel>
                        <select class="form-select" v-model.number="lockForm.serialType">
                            <option :value="ItemDefine.SerialType.System">系统</option>
                            <option :value="ItemDefine.SerialType.GM">GM</option>
                            <option :value="ItemDefine.SerialType.Lock">锁定</option>
                        </select>
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeCreateLockModal">取消</CButton>
                <CButton color="primary" @click="saveCreateLock" :disabled="saving">
                    {{ saving ? '创建中...' : '创建' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 添加用户物品 Modal -->
        <CModal :visible="showAddItemModal" @close="closeAddItemModal">
            <CModalHeader>
                <CModalTitle>添加用户物品</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>用户ID</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="itemForm.userID"
                            placeholder="请输入用户ID"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>道具ID</CFormLabel>
                        <ItemSelect 
                            v-model="itemForm.itemID" 
                            placeholder="请选择道具"
                            placeholder-value=""
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>数量</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="itemForm.count"
                            placeholder="请输入数量"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>锁定ID</CFormLabel>
                        <CFormInput
                            v-model="itemForm.lockID"
                            placeholder="请输入锁定ID（可选）"
                        />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeAddItemModal">取消</CButton>
                <CButton color="primary" @click="saveAddItem" :disabled="saving">
                    {{ saving ? '添加中...' : '添加' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 添加用户俱乐部价值 Modal -->
        <CModal :visible="showAddClubValueModal" @close="closeAddClubValueModal">
            <CModalHeader>
                <CModalTitle>添加用户俱乐部价值</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>俱乐部ID</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="clubValueForm.clubID"
                            placeholder="请输入俱乐部ID"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>用户ID</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="clubValueForm.userID"
                            placeholder="请输入用户ID"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>价值索引</CFormLabel>
                        <select class="form-select" v-model.number="clubValueForm.valueIndex">
                            <option :value="ClubDefine.ValueIndex.Gold">金币</option>
                            <option :value="ClubDefine.ValueIndex.Diamond">钻石</option>
                            <option :value="ClubDefine.ValueIndex.USDT">USDT</option>
                            <option :value="ClubDefine.ValueIndex.Score">分数</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <CFormLabel>数量</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="clubValueForm.count"
                            placeholder="请输入数量"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>锁定ID</CFormLabel>
                        <CFormInput
                            v-model="clubValueForm.lockID"
                            placeholder="请输入锁定ID（可选）"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>序列类型</CFormLabel>
                        <select class="form-select" v-model.number="clubValueForm.serialType">
                            <option :value="undefined">默认</option>
                            <option :value="ItemDefine.SerialType.System">系统</option>
                            <option :value="ItemDefine.SerialType.GM">GM</option>
                        </select>
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeAddClubValueModal">取消</CButton>
                <CButton color="primary" @click="saveAddClubValue" :disabled="saving">
                    {{ saving ? '添加中...' : '添加' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 创建账户 Modal -->
        <CModal :visible="showCreateAccountModal" @close="closeCreateAccountModal">
            <CModalHeader>
                <CModalTitle>创建账户</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>账户名</CFormLabel>
                        <CFormInput
                            v-model="createAccountForm.account"
                            placeholder="请输入账户名"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>昵称</CFormLabel>
                        <CFormInput
                            v-model="createAccountForm.nickName"
                            placeholder="请输入昵称"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>密码 (也可以32位MD5)</CFormLabel>
                        <CFormInput
                            type="password"
                            v-model="createAccountForm.pwdMD5"
                            placeholder="请输入密码（将自动转换为MD5）"
                        />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeCreateAccountModal">取消</CButton>
                <CButton color="primary" @click="saveCreateAccount" :disabled="saving">
                    {{ saving ? '创建中...' : '创建' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 修改密码 Modal -->
        <CModal :visible="showChangePasswordModal" @close="closeChangePasswordModal">
            <CModalHeader>
                <CModalTitle>修改密码 (用户ID: {{ changePasswordForm.userID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>新密码 (也可以32位MD5)</CFormLabel>
                        <CFormInput
                            type="password"
                            v-model="changePasswordForm.pwdMD5"
                            placeholder="请输入新密码（将自动转换为MD5）"
                        />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeChangePasswordModal">取消</CButton>
                <CButton color="primary" @click="saveChangePassword" :disabled="saving">
                    {{ saving ? '修改中...' : '修改' }}
                </CButton>
            </CModalFooter>
        </CModal>

    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
    userGetusers,
    userGetuserbags,
    userGetuserlocked,
    userCreatelockitem,
    userAdduseritem,
    userAdduserclubvalue,
    userUnlock,
    userChangelogintarget,
    userChangetargetrole,
    userCreateaccount,
    userChangepwd,
    userFilterGetnormalusers,
    userSetuserdisabled,
    userSetuserlockwithdraw,
} from '@/web/AdminReq'
import { UserDefine } from 'pp-base-define/UserDefine'
import { ItemDefine, ItemID } from 'pp-base-define/ItemDefine'
import { ClubDefine } from 'pp-base-define/ClubDefine'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { Toast } from '@/composables/useToast'
import { showConfirm } from '@/utils/message'
import ItemSelect from '@/components/ItemSelect.vue'
import { md5 } from '@/utils/md5'
import Decimal from 'decimal.js'

// Reactive data
const loading = ref(false)
const saving = ref(false)
const userList = ref<AdminReqDefine.tUserFilterGetnormalusersRes['users']>([])
const currentPage = ref(0)
const pageSize = ref(20)
const totalCount = ref(0)
const filterUserID = ref<number | undefined>(undefined)
const filterAccount = ref<string | undefined>(undefined)
const filterNickName = ref<string | undefined>(undefined)
const filterContainsProxy = ref(false)
const filterDisabled = ref(false)
const filterLockWithdraw = ref(false)

// Bag modal
const showBagModal = ref(false)
const bagLoading = ref(false)
const viewingUserID = ref(0)
const bagItems = ref<ItemDefine.tItem[]>([])

// Locked modal
const showLockedModal = ref(false)
const lockedLoading = ref(false)
const lockedItems = ref<ItemDefine.tLock[]>([])

// Create lock modal
const showCreateLockModal = ref(false)
const lockForm = ref<AdminReqDefine.tUserCreatelockitemReq>({
    userID: 0,
    lockID: '',
    itemID: '',
    clubID: undefined,
    valueIndex: undefined,
    count: 0,
    serialType: ItemDefine.SerialType.System,
})

// Add item modal
const showAddItemModal = ref(false)
const itemForm = ref<AdminReqDefine.tUserAdduseritemReq>({
    userID: 0,
    itemID: '',
    count: 0,
    lockID: undefined,
    serialType: undefined,
})

// Add club value modal
const showAddClubValueModal = ref(false)
const clubValueForm = ref<AdminReqDefine.tUserAdduserclubvalueReq>({
    clubID: 0,
    userID: 0,
    valueIndex: ClubDefine.ValueIndex.Gold,
    count: 0,
    lockID: undefined,
    serialType: undefined,
})

// Create account modal
const showCreateAccountModal = ref(false)
const createAccountForm = ref<AdminReqDefine.tUserCreateaccountReq>({
    account: '',
    nickName: '',
    pwdMD5: '',
    target: UserDefine.LoginTarget.App,
})

// Change password modal
const showChangePasswordModal = ref(false)
const changePasswordForm = ref<AdminReqDefine.tUserChangepwdReq>({
    userID: 0,
    pwdMD5: '',
})

// Change login target modal
const showChangeLoginTargetModal = ref(false)
const changeLoginTargetForm = ref<AdminReqDefine.tUserChangelogintargetReq>({
    userID: 0,
    target: UserDefine.LoginTarget.Console,
    b: true,
})
const currentLoginRole = ref<UserDefine.tLoginRole | null>(null)

// Change target role modal
const showChangeTargetRoleModal = ref(false)
const changeTargetRoleForm = ref<AdminReqDefine.tUserChangetargetroleReq>({
    userID: 0,
    target: UserDefine.LoginTarget.Console,
    role: UserDefine.RoleType.Admin,
    b: true,
})

// Computed total pages
const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// Get channel name
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

// Get channel color
const getChannelColor = (type: UserDefine.LoginChannel): string => {
    const colorMap: Record<UserDefine.LoginChannel, string> = {
        [UserDefine.LoginChannel.Guest]: 'secondary',
        [UserDefine.LoginChannel.Account]: 'primary',
        [UserDefine.LoginChannel.Email]: 'info',
        [UserDefine.LoginChannel.Phone]: 'success',
        [UserDefine.LoginChannel.Web3]: 'warning',
        [UserDefine.LoginChannel.Wechat]: 'danger',
    }
    return colorMap[type] || 'secondary'
}

// 从用户 Bag 中取 itemID = ItemID.Gold 的数量，无 bag 或无 Gold 视为 0
const getGoldBalance = (user: AdminReqDefine.tUserFilterGetnormalusersRes['users'][number]): string => {
    const items = user.bag?.items ?? []
    const goldItem = items.find((item) => item.id === ItemID.Gold)
    return goldItem?.count ?? '0'
}

// 从用户 balance 中取字段，无 balance 或对应字段则显示 0
const getBalanceField = (
    user: AdminReqDefine.tUserFilterGetnormalusersRes['users'][number],
    key: 'exceptionValue' | 'rewardValue' | 'totalCharge' | 'totalWithdraw',
): string => {
    const val = user.balance?.[key]
    return val !== undefined && val !== null && val !== '' ? String(val) : '0'
}

const getExceptionField = (
    user: AdminReqDefine.tUserFilterGetnormalusersRes['users'][number],
): string => {
    let exceptionValue = new Decimal(user.balance?.exceptionValue || 0)
    let totalCharge = new Decimal(user.balance?.totalCharge || 0)
    let win = new Decimal(user.balance?.win || 0)
    let lose = new Decimal(user.balance?.lose || 0)
    return win.add(lose).toString()
}

// 平衡期望值 > 0 时用于行高亮
const isExceptionValuePositive = (user: AdminReqDefine.tUserFilterGetnormalusersRes['users'][number]): boolean => {
    // let exceptionValue = new Decimal(user.balance?.exceptionValue || 0)
    // let totalCharge = new Decimal(user.balance?.totalCharge || 0)
    // let win = new Decimal(user.balance?.win || 0)
    // let lose = new Decimal(user.balance?.lose || 0)
    // return win.add(lose).greaterThan(0)
    return user.loginData?.disabled ?? false
}

// Load users
const loadUsers = async () => {
    loading.value = true
    try {
        const params: AdminReqDefine.tUserFilterGetnormalusersReq = {
            page: currentPage.value,
            limit: pageSize.value,
        }
        if (filterUserID.value !== undefined && filterUserID.value !== null) {
            params.userID = filterUserID.value
        }
        if (filterNickName.value !== undefined && filterNickName.value !== null) {
            params.nickName = filterNickName.value
        }
        if (filterAccount.value && filterAccount.value.trim()) {
            params.account = filterAccount.value.trim()
        }
        if (filterContainsProxy.value) {
            params.containsProxy = true
        }
        if (filterDisabled.value) {
            params.disabled = true
        }
        if (filterLockWithdraw.value) {
            params.lockWithdraw = true
        }

        const response = await userFilterGetnormalusers(params)

        if (response.errCode) {
            Toast.error(response.errMsg || '加载用户列表失败')
            return
        }

        userList.value = response.users || []
        totalCount.value = response.count || 0
    } catch (error) {
        console.error('Load users error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Handle search
const handleSearch = () => {
    currentPage.value = 0
    loadUsers()
}

// Clear search
const clearSearch = () => {
    filterUserID.value = undefined
    filterAccount.value = undefined
    filterNickName.value = undefined
    filterContainsProxy.value = false
    filterDisabled.value = false
    filterLockWithdraw.value = false
    currentPage.value = 0
    loadUsers()
}

// View user bag
const viewUserBag = async (userID: number) => {
    viewingUserID.value = userID
    showBagModal.value = true
    bagLoading.value = true
    try {
        const response = await userGetuserbags({
            userID: userID,
            page: 0,
            limit: 1000,
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '加载用户背包失败')
            return
        }

        // Find the bag for this user
        const userBag = response.datas?.find(bag => bag.userID === userID)
        bagItems.value = userBag?.items || []
    } catch (error) {
        console.error('Load user bag error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        bagLoading.value = false
    }
}

// Close bag modal
const closeBagModal = () => {
    showBagModal.value = false
    viewingUserID.value = 0
    bagItems.value = []
}

// View user locked
const viewUserLocked = async (userID: number) => {
    viewingUserID.value = userID
    showLockedModal.value = true
    await loadUserLocked(userID)
}

// Load user locked
const loadUserLocked = async (userID: number) => {
    lockedLoading.value = true
    try {
        const response = await userGetuserlocked({
            userID: userID,
            page: 0,
            limit: 1000,
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '加载用户锁定物品失败')
            return
        }

        lockedItems.value = response.datas || []
    } catch (error) {
        console.error('Load user locked error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        lockedLoading.value = false
    }
}

// Close locked modal
const closeLockedModal = () => {
    showLockedModal.value = false
    viewingUserID.value = 0
    lockedItems.value = []
}

// Show create lock modal
const openCreateLockModal = () => {
    lockForm.value = {
        userID: viewingUserID.value,
        lockID: '',
        itemID: '',
        clubID: undefined,
        valueIndex: undefined,
        count: 0,
        serialType: ItemDefine.SerialType.System,
    }
    showCreateLockModal.value = true
}

// Close create lock modal
const closeCreateLockModal = () => {
    showCreateLockModal.value = false
}

// Save create lock
const saveCreateLock = async () => {
    if (!lockForm.value.userID) {
        Toast.warning('请输入用户ID')
        return
    }
    if (!lockForm.value.lockID) {
        Toast.warning('请输入锁定ID')
        return
    }
    if (!lockForm.value.count || lockForm.value.count <= 0) {
        Toast.warning('请输入有效的数量')
        return
    }

    saving.value = true
    try {
        const response = await userCreatelockitem(lockForm.value)

        if (response.errCode) {
            Toast.error(response.errMsg || '创建锁定物品失败')
            return
        }

        Toast.success('创建锁定物品成功')
        closeCreateLockModal()
        await loadUserLocked(lockForm.value.userID)
    } catch (error) {
        console.error('Create lock item error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Add user item
const addUserItem = (userID: number) => {
    itemForm.value = {
        userID: userID,
        itemID: '',
        count: 0,
        lockID: undefined,
        serialType: undefined,
    }
    showAddItemModal.value = true
}

// Close add item modal
const closeAddItemModal = () => {
    showAddItemModal.value = false
}

// Save add item
const saveAddItem = async () => {
    if (!itemForm.value.userID) {
        Toast.warning('请输入用户ID')
        return
    }
    if (!itemForm.value.itemID) {
        Toast.warning('请输入道具ID')
        return
    }
    if (!itemForm.value.count || itemForm.value.count <= 0) {
        // Toast.warning('请输入有效的数量')
        // return
    }
    if(!itemForm.value.count) {
        Toast.warning('请输入有效的数量')
        return
    }
    if(itemForm.value.count > 0) {
        itemForm.value.serialType = ItemDefine.SerialType.GMCharge
    } else {
        itemForm.value.serialType = ItemDefine.SerialType.GMWithdraw
    }

    saving.value = true
    try {
        const response = await userAdduseritem(itemForm.value)

        if (response.errCode) {
            Toast.error(response.errMsg || '添加用户物品失败')
            return
        }

        Toast.success('添加用户物品成功')
        closeAddItemModal()
        await loadUsers()
    } catch (error) {
        console.error('Add user item error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Add user club value
const addUserClubValue = (userID: number) => {
    clubValueForm.value = {
        clubID: 0,
        userID: userID,
        valueIndex: ClubDefine.ValueIndex.Gold,
        count: 0,
        lockID: undefined,
        serialType: undefined,
    }
    showAddClubValueModal.value = true
}

// Close add club value modal
const closeAddClubValueModal = () => {
    showAddClubValueModal.value = false
}

// Save add club value
const saveAddClubValue = async () => {
    if (!clubValueForm.value.clubID) {
        Toast.warning('请输入俱乐部ID')
        return
    }
    if (!clubValueForm.value.userID) {
        Toast.warning('请输入用户ID')
        return
    }
    if (!clubValueForm.value.count || clubValueForm.value.count <= 0) {
        Toast.warning('请输入有效的数量')
        return
    }

    saving.value = true
    try {
        const response = await userAdduserclubvalue(clubValueForm.value)

        if (response.errCode) {
            Toast.error(response.errMsg || '添加用户俱乐部价值失败')
            return
        }

        Toast.success('添加用户俱乐部价值成功')
        closeAddClubValueModal()
        await loadUsers()
    } catch (error) {
        console.error('Add user club value error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Unlock item
const unlockItem = async (userID: number, lockID: string, clubID?: number) => {
    const confirmed = await showConfirm(
        `确定要解锁用户 ${userID} 的锁定物品 ${lockID} 吗？`,
        { type: 'warning' }
    )
    if (!confirmed) {
        return
    }

    try {
        const response = await userUnlock({
            userID: userID,
            lockID: lockID,
            clubID: clubID,
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '解锁失败')
            return
        }

        Toast.success('解锁成功')
        await loadUserLocked(userID)
    } catch (error) {
        console.error('Unlock item error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Get login target name
const getLoginTargetName = (target: UserDefine.LoginTarget): string => {
    const targetMap: Record<UserDefine.LoginTarget, string> = {
        [UserDefine.LoginTarget.App]: 'App',
        [UserDefine.LoginTarget.Console]: 'Console',
        [UserDefine.LoginTarget.H5]: 'H5',
        [UserDefine.LoginTarget.WechatMini]: '微信小程序',
        [UserDefine.LoginTarget.DouyinMini]: '抖音小程序',
    }
    return targetMap[target] || '未知'
}

// Get role type name
const getRoleTypeName = (role: UserDefine.RoleType): string => {
    const roleMap: Partial<Record<UserDefine.RoleType, string>> = {
        [UserDefine.RoleType.Admin]: '管理员',
        [UserDefine.RoleType.Config]: '配置',
        [UserDefine.RoleType.UserInfos]: '用户信息',
        [UserDefine.RoleType.UserConsoleRole]: '用户Console权限管理',
        [UserDefine.RoleType.UserAppRole]: '用户App权限管理',
        [UserDefine.RoleType.FullResource]: '全部资源的编辑权限',
        [UserDefine.RoleType.StoreManager]: '店长',
        [UserDefine.RoleType.StoreType]: '查看类型',
        [UserDefine.RoleType.EditStoreType]: '编辑类型',
        [UserDefine.RoleType.CreateStore]: '开店/闭店',
        [UserDefine.RoleType.FullItemManager]: '全部商品管理',
        [UserDefine.RoleType.CustomerChatManager]: '客户会话管理',
        [UserDefine.RoleType.CustomerChat]: '客服会话',
        [UserDefine.RoleType.Robot]: '机器人',
        [UserDefine.RoleType.LeaderProxy]: '代理后台登录权限',
        [UserDefine.RoleType.News]: '新闻',
        [UserDefine.RoleType.App]: 'App',
        [UserDefine.RoleType.Seller]: '核销员',
    }
    return roleMap[role] || `权限${role}`
}

// All role types for dropdown
const allRoleTypes = computed(() => {
    // 直接使用枚举中定义的所有权限类型，避免重复和不存在的值
    const roleTypes: UserDefine.RoleType[] = [
        UserDefine.RoleType.Admin,
        UserDefine.RoleType.Config,
        UserDefine.RoleType.UserInfos,
        UserDefine.RoleType.UserConsoleRole,
        UserDefine.RoleType.UserAppRole,
        UserDefine.RoleType.CustomerChatManager,
        UserDefine.RoleType.CustomerChat,
        UserDefine.RoleType.Robot,
        UserDefine.RoleType.LeaderProxy,
        UserDefine.RoleType.News,
        UserDefine.RoleType.App,
    ]
    
    return roleTypes.map(role => ({
        value: role,
        name: getRoleTypeName(role),
    }))
})

// Open create account modal
const openCreateAccountModal = () => {
    createAccountForm.value = {
        account: '',
        nickName: '',
        pwdMD5: '',
        target: UserDefine.LoginTarget.App,
    }
    showCreateAccountModal.value = true
}

// Close create account modal
const closeCreateAccountModal = () => {
    showCreateAccountModal.value = false
}

// Save create account
const saveCreateAccount = async () => {
    if (!createAccountForm.value.account.trim()) {
        Toast.warning('请输入账户名')
        return
    }
    if (!createAccountForm.value.pwdMD5) {
        Toast.warning('请输入密码')
        return
    }
    if (!createAccountForm.value.nickName.trim()) {
        Toast.warning('请输入昵称')
        return
    }

    saving.value = true
    try {
        // Convert password to MD5 if not already
        const pwdMD5 = createAccountForm.value.pwdMD5.length === 32 
            ? createAccountForm.value.pwdMD5 
            : md5(createAccountForm.value.pwdMD5)

        const response = await userCreateaccount({
            account: createAccountForm.value.account.trim(),
            nickName: createAccountForm.value.nickName.trim(),
            pwdMD5: pwdMD5,
            target: createAccountForm.value.target,
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '创建账户失败')
            return
        }

        Toast.success('创建账户成功')
        closeCreateAccountModal()
        await loadUsers()
    } catch (error) {
        console.error('Create account error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Open change password modal
const openChangePasswordModal = (userID: number) => {
    changePasswordForm.value = {
        userID: userID,
        pwdMD5: '',
    }
    showChangePasswordModal.value = true
}

// Close change password modal
const closeChangePasswordModal = () => {
    showChangePasswordModal.value = false
}

// Save change password
const saveChangePassword = async () => {
    if (!changePasswordForm.value.pwdMD5) {
        Toast.warning('请输入新密码')
        return
    }

    saving.value = true
    try {
        // Convert password to MD5 if not already
        const pwdMD5 = changePasswordForm.value.pwdMD5.length === 32 
            ? changePasswordForm.value.pwdMD5 
            : md5(changePasswordForm.value.pwdMD5)

        const response = await userChangepwd({
            userID: changePasswordForm.value.userID,
            pwdMD5: pwdMD5,
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '修改密码失败')
            return
        }

        Toast.success('修改密码成功')
        closeChangePasswordModal()
    } catch (error) {
        console.error('Change password error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

const setUserDisabled = async (userID: number) => {
    await userSetuserdisabled({
        userID: userID,
        disabled: true,
    })
    loadUsers()
}

const setUserEnabled = async (userID: number) => {
    await userSetuserdisabled({
        userID: userID,
        disabled: false,
    })
    loadUsers()
}

const setUserLockWithdraw = async (userID: number, lockWithdraw: boolean) => {
    await userSetuserlockwithdraw({
        userID: userID,
        lockWithdraw: lockWithdraw,
    })
    loadUsers()
}

const setUserUnlockWithdraw = async (userID: number) => {
    await userSetuserlockwithdraw({
        userID: userID,
        lockWithdraw: false,
    })
    loadUsers()
}
const isUserProxy = (user: AdminReqDefine.tUserFilterGetnormalusersRes['users'][number]): boolean => {
    let target = user.loginRole?.targets?.find(v=>v.target == UserDefine.LoginTarget.Console && v.roles.includes(UserDefine.RoleType.LeaderProxy))
    return target !== undefined
}

const setUserToProxy = async (user: AdminReqDefine.tUserFilterGetnormalusersRes['users'][number], b: boolean) => {
    if(b == isUserProxy(user)) {
        return
    }
    if(b) {
        await userChangelogintarget({
            userID: user.userID,
            target: UserDefine.LoginTarget.Console,
            b: true,
        })
        await userChangetargetrole({
            userID: user.userID,
            target: UserDefine.LoginTarget.Console,
            role: UserDefine.RoleType.LeaderProxy,
            b: true,
        })
    } else {
        await userChangelogintarget({
            userID: user.userID,
            target: UserDefine.LoginTarget.Console,
            b: false,
        })
    }
    loadUsers()
}
// Load users when component is mounted
onMounted(() => {
    loadUsers()
})
</script>

<style scoped>
:deep(.balance-exception-highlight) {
    background-color: rgba(220, 53, 69, 0.3) !important;
}

:deep(.balance-exception-highlight:hover) {
    background-color: rgba(220, 53, 69, 0.4) !important;
}

:deep(.balance-exception-highlight td) {
    background-color: rgba(220, 53, 69, 0.3) !important;
}

:deep(.balance-exception-highlight:hover td) {
    background-color: rgba(220, 53, 69, 0.4) !important;
}
</style>
