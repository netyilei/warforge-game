<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>比赛管理</strong>
                        <CButton color="success" size="sm" @click="addMatch">
                            <CIcon icon="cil-plus" class="me-1" />
                            创建比赛
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 搜索条件 -->
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormLabel>比赛名称</CFormLabel>
                            <CFormInput
                                v-model="filter.name"
                                placeholder="输入比赛名称"
                            />
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>游戏ID</CFormLabel>
                            <GameIDSelect
                                v-model="filter.gameID"
                                placeholder="全部游戏"
                                :placeholder-value="undefined"
                            />
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
                        <!-- 比赛列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>比赛ID</CTableHeaderCell>
                                    <CTableHeaderCell>比赛名称</CTableHeaderCell>
                                    <CTableHeaderCell>游戏ID</CTableHeaderCell>
                                    <CTableHeaderCell>状态</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="match in matchList" :key="match.data?.matchID">
                                    <CTableDataCell>{{ match.data?.matchID || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <div v-if="match.display?.list?.title">
                                            {{ match.display.list.title }}
                                        </div>
                                        <span v-else>-</span>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ match.data?.gameData?.gameID || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="getStatusColor(match.data?.status)">
                                            {{ getStatusName(match.data?.status) }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButtonGroup role="group">
                                            <CButton color="primary" size="sm" @click="viewMatch(match)">
                                                查看
                                            </CButton>
                                            <CButton color="info" size="sm" @click="editMatch(match)">
                                                编辑
                                            </CButton>
                                            <CButton color="warning" size="sm" @click="editDisplay(match)">
                                                显示配置
                                            </CButton>
                                            <CButton color="success" size="sm" @click="editReward(match)">
                                                奖励配置
                                            </CButton>
                                            <CButton color="secondary" size="sm" @click="editWater(match)">
                                                抽水配置
                                            </CButton>
                                            <CButton color="danger" size="sm" @click="deleteMatch(match.data?.matchID || 0)">
                                                删除
                                            </CButton>
                                        </CButtonGroup>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!matchList || matchList.length === 0">
                                    <CTableDataCell colspan="5" class="text-center text-muted py-4">
                                        暂无比赛数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>

                        <!-- 分页 -->
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="text-muted">
                                共 {{ totalCount }} 条记录，第 {{ currentPage + 1 }} / {{ totalPages || 1 }} 页
                            </div>
                            <div @click.prevent="handlePaginationClick">
                                <CSmartPagination
                                    v-if="totalPages > 0"
                                    :pages="totalPages"
                                    :active-page="currentPage + 1"
                                    @active-page-change="handlePageChange"
                                />
                            </div>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <!-- 创建/编辑比赛 Modal -->
        <CModal :visible="showMatchModal" @close="closeMatchModal" size="xl" backdrop="static">
            <CModalHeader>
                <CModalTitle>{{ editingMatch ? '编辑比赛' : '创建比赛' }}</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CTabs v-model="matchFormTab">
                    <CNav variant="tabs">
                        <CNavItem>
                            <CNavLink :active="matchFormTab === 0" @click="matchFormTab = 0">
                                基础信息
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink :active="matchFormTab === 1" @click="matchFormTab = 1">
                                报名配置
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink :active="matchFormTab === 2" @click="matchFormTab = 2">
                                时间配置
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink :active="matchFormTab === 3" @click="matchFormTab = 3">
                                合桌配置
                            </CNavLink>
                        </CNavItem>
                        <CNavItem v-if="!editingMatch">
                            <CNavLink :active="matchFormTab === 4" @click="matchFormTab = 4">
                                奖励配置
                            </CNavLink>
                        </CNavItem>
                        <CNavItem v-if="!editingMatch">
                            <CNavLink :active="matchFormTab === 5" @click="matchFormTab = 5">
                                抽水配置
                            </CNavLink>
                        </CNavItem>
                    </CNav>
                    <CTabContent>
                        <!-- 基础信息 -->
                        <CTabPane :visible="matchFormTab === 0">
                            <CForm class="mt-3">
                                <CRow>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>游戏ID <span class="text-danger">*</span></CFormLabel>
                                            <GameIDSelect
                                                v-model="matchForm.data.gameData!.gameID"
                                                placeholder="请选择游戏"
                                                :placeholder-value="0"
                                                :disabled="!!editingMatch"
                                                @update:model-value="onMatchGameIDChange"
                                            />
                                        </div>
                                    </CCol>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>比赛名称 <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                v-model="matchForm.display.list!.title"
                                                placeholder="请输入比赛名称"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                                <CRow>
                                    <CCol :md="12">
                                        <div class="mb-3">
                                            <CFormLabel>比赛描述</CFormLabel>
                                            <CFormTextarea
                                                v-model="matchForm.display.list!.content"
                                                placeholder="请输入比赛描述"
                                                rows="3"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                                <CRow>
                                    <CCol :md="12">
                                        <div class="mb-3">
                                            <CFormLabel>图标</CFormLabel>
                                            <ImageUpload
                                                v-model="matchForm.display.list!.iconUrl"
                                                placeholder="选择或上传图标"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                                <!-- 规则配置（仅创建时） -->
                                <CRow v-if="!editingMatch">
                                    <CCol :md="12">
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <strong>规则配置</strong>
                                                <CButton color="success" size="sm" @click="addMatchDisplayRule">
                                                    <CIcon icon="cil-plus" class="me-1" />
                                                    添加规则
                                                </CButton>
                                            </div>
                                            <div v-for="(rule, ruleIndex) in (matchForm.display.rules || [])" :key="ruleIndex" class="mb-3 p-3 border rounded">
                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                    <strong>规则 #{{ ruleIndex + 1 }}</strong>
                                                    <CButton color="danger" size="sm" @click="removeMatchDisplayRule(ruleIndex)">
                                                        <CIcon icon="cil-trash" />
                                                        删除
                                                    </CButton>
                                                </div>
                                                <div class="mb-2">
                                                    <CFormLabel>规则内容</CFormLabel>
                                                    <CFormTextarea v-model="rule.content" placeholder="请输入规则说明" rows="2" />
                                                </div>
                                                <div>
                                                    <CFormLabel>规则图标</CFormLabel>
                                                    <ImageUpload v-model="rule.iconUrl" placeholder="选择或上传图标" />
                                                </div>
                                            </div>
                                            <div v-if="!matchForm.display.rules || matchForm.display.rules.length === 0" class="text-center text-muted py-3 border rounded">
                                                暂无规则，点击「添加规则」添加
                                            </div>
                                        </div>
                                    </CCol>
                                </CRow>
                                <CRow>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>使用的道具ID</CFormLabel>
                                            <ItemSelect
                                                v-model="matchForm.data.itemID"
                                                placeholder="选择道具（留空表示不使用道具）"
                                                placeholder-value=""
                                            />
                                        </div>
                                    </CCol>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>锁定道具数量</CFormLabel>
                                            <CFormInput
                                                v-model="matchForm.data.lockItemCount"
                                                placeholder="锁定道具数量，'0'表示全部锁定"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                                <CRow>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>最大进入次数</CFormLabel>
                                            <CFormInput
                                                type="number"
                                                v-model.number="matchForm.data.maxEnterCount"
                                                placeholder="最大进入次数，0表示不限制"
                                                min="0"
                                            />
                                        </div>
                                    </CCol>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>强制买入（可选）</CFormLabel>
                                            <CFormInput
                                                v-model="matchForm.data.buyin"
                                                placeholder="强制买入，留空表示不强制"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                                <!-- 游戏配置（仅创建时，选择 gameID 后显示，与匹配管理一致） -->
                                <CRow v-if="gameConfig && !editingMatch">
                                    <CCol :md="12">
                                        <CCard class="mb-4">
                                            <CCardHeader><strong>基础设置</strong></CCardHeader>
                                            <CCardBody>
                                                <CRow>
                                                    <CCol :md="6">
                                                        <div class="mb-3">
                                                            <CFormLabel>{{ gameConfig.lobby_setting.base_score_title }}</CFormLabel>
                                                            <select class="form-select" v-model.number="gameDataForm.baseScore">
                                                                <option v-for="(item, index) in gameConfig.lobby_setting.base_score" :key="index" :value="item">{{ `${item}分` }}</option>
                                                            </select>
                                                        </div>
                                                    </CCol>
                                                    <CCol :md="6">
                                                        <div class="mb-3">
                                                            <CFormLabel>{{ gameConfig.lobby_setting.user_count_title }}</CFormLabel>
                                                            <select class="form-select" v-model.number="gameDataForm.userCount">
                                                                <option v-for="(item, index) in gameConfig.lobby_setting.user_count" :key="index" :value="item">{{ `${item}人` }}</option>
                                                            </select>
                                                        </div>
                                                    </CCol>
                                                </CRow>
                                                <CRow>
                                                    <CCol :md="6">
                                                        <div class="mb-3">
                                                            <CFormLabel>支付类型</CFormLabel>
                                                            <select class="form-select" v-model.number="gameDataForm.payType">
                                                                <option :value="RoomDefine.PayType.Item">道具</option>
                                                                <option :value="RoomDefine.PayType.Club">俱乐部货币</option>
                                                            </select>
                                                        </div>
                                                    </CCol>
                                                    <CCol :md="6" v-if="gameDataForm.payType === RoomDefine.PayType.Item">
                                                        <div class="mb-3">
                                                            <CFormLabel>选择道具</CFormLabel>
                                                            <ItemSelect v-model="gameDataForm.payValue" placeholder="请选择道具" placeholder-value="" />
                                                        </div>
                                                    </CCol>
                                                    <CCol :md="6" v-if="gameDataForm.payType === RoomDefine.PayType.Club">
                                                        <div class="mb-3">
                                                            <CFormLabel>选择货币</CFormLabel>
                                                            <select class="form-select" v-model.number="gameDataForm.payValue">
                                                                <option v-for="(item, index) in valueIndexList" :key="index" :value="item.value">{{ item.label }}</option>
                                                            </select>
                                                        </div>
                                                    </CCol>
                                                </CRow>
                                            </CCardBody>
                                        </CCard>
                                        <CCard class="mb-4">
                                            <CCardHeader><strong>玩法设置</strong></CCardHeader>
                                            <CCardBody>
                                                <div class="mb-3">
                                                    <FormSlider v-model="gameDataForm.winnerRate" label="抽水" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                                                </div>
                                                <div class="mb-3" v-for="(option, index) in gameConfig.lobby_setting.extension" :key="index">
                                                    <CFormLabel>{{ option.title }}</CFormLabel>
                                                    <CRow v-if="option.type == 'normal'">
                                                        <CCol sm="auto" v-for="(name, i) in option.names" :key="i">
                                                            <CFormCheck v-model="gameDataForm.sets[option.group][i]" type="checkbox" :id="`match_ext_${index}_${i}`" :name="`match_ext_${index}`" :label="`${name}`" />
                                                        </CCol>
                                                    </CRow>
                                                    <select class="form-select" v-if="option.type == 'mutex'" v-model.number="gameDataForm.sets[option.group]">
                                                        <option v-for="(name, i) in option.names" :key="i" :value="i">{{ name }}</option>
                                                    </select>
                                                    <CFormInput v-if="option.type == 'int'" v-model.number="gameDataForm.sets[option.group]" type="number" placeholder="" />
                                                    <CTable striped v-if="option.type == 'time'">
                                                        <CTableHead>
                                                            <CTableRow>
                                                                <CTableHeaderCell scope="col">小时</CTableHeaderCell>
                                                                <CTableHeaderCell scope="col">分钟</CTableHeaderCell>
                                                                <CTableHeaderCell scope="col">秒</CTableHeaderCell>
                                                            </CTableRow>
                                                        </CTableHead>
                                                        <CTableBody>
                                                            <CTableRow>
                                                                <CTableDataCell><CFormInput v-model.number="durationRef[option.group].h" type="number" placeholder="" /></CTableDataCell>
                                                                <CTableDataCell><CFormInput v-model.number="durationRef[option.group].m" type="number" placeholder="" /></CTableDataCell>
                                                                <CTableDataCell><CFormInput v-model.number="durationRef[option.group].s" type="number" placeholder="" /></CTableDataCell>
                                                            </CTableRow>
                                                        </CTableBody>
                                                    </CTable>
                                                </div>
                                            </CCardBody>
                                        </CCard>
                                    </CCol>
                                </CRow>
                            </CForm>
                        </CTabPane>
                        <!-- 报名配置 -->
                        <CTabPane :visible="matchFormTab === 1">
                            <CForm class="mt-3">
                                <div class="mb-3 d-flex justify-content-between align-items-center">
                                    <strong>报名道具配置</strong>
                                    <CButton color="success" size="sm" @click="addSignupItem">
                                        <CIcon icon="cil-plus" class="me-1" />
                                        添加报名道具
                                    </CButton>
                                </div>
                                <div v-if="matchForm.data.signup && matchForm.data.signup.length > 0" class="mb-3">
                                    <div v-for="(item, index) in matchForm.data.signup" :key="index" class="mb-3 p-3 border rounded">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <strong>报名道具 #{{ index + 1 }}</strong>
                                            <CButton color="danger" size="sm" @click="removeSignupItem(index)">
                                                <CIcon icon="cil-trash" />
                                                删除
                                            </CButton>
                                        </div>
                                        <CRow>
                                            <CCol :md="6">
                                                <CFormLabel>道具ID <span class="text-danger">*</span></CFormLabel>
                                                <ItemSelect
                                                    v-model="item.itemID"
                                                    placeholder="选择道具"
                                                    placeholder-value=""
                                                />
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>数量 <span class="text-danger">*</span></CFormLabel>
                                                <CFormInput
                                                    v-model="item.count"
                                                    placeholder="请输入数量"
                                                />
                                            </CCol>
                                        </CRow>
                                    </div>
                                </div>
                                <div v-else class="text-center text-muted py-4 border rounded">
                                    暂无报名道具配置，点击"添加报名道具"添加
                                </div>
                            </CForm>
                        </CTabPane>
                        <!-- 时间配置 -->
                        <CTabPane :visible="matchFormTab === 2">
                            <CForm class="mt-3">
                                <CRow>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>报名开始时间 <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                type="datetime-local"
                                                v-model="signupStartTimeStr"
                                                placeholder="报名开始时间"
                                            />
                                        </div>
                                    </CCol>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>报名结束时间 <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                type="datetime-local"
                                                v-model="signupEndTimeStr"
                                                placeholder="报名结束时间"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                                <CRow>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>比赛开始时间 <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                type="datetime-local"
                                                v-model="startTimeStr"
                                                placeholder="比赛开始时间"
                                            />
                                        </div>
                                    </CCol>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>比赛时长（小时） <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                type="number"
                                                v-model.number="durationHours"
                                                placeholder="请输入比赛时长（小时）"
                                                min="0"
                                                step="0.5"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                            </CForm>
                        </CTabPane>
                        <!-- 合桌配置 -->
                        <CTabPane :visible="matchFormTab === 3">
                            <CForm class="mt-3">
                                <CRow>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>合桌触发人数</CFormLabel>
                                            <CFormInput
                                                type="number"
                                                v-model.number="matchForm.data.combineStartUserCount"
                                                placeholder="合桌触发人数，0表示不启用"
                                                min="0"
                                            />
                                        </div>
                                    </CCol>
                                    <CCol :md="6">
                                        <div class="mb-3">
                                            <CFormLabel>暂停游戏的最低人数</CFormLabel>
                                            <CFormInput
                                                type="number"
                                                v-model.number="matchForm.data.combineMinUserCount"
                                                placeholder="暂停游戏的最低人数，0表示不限制"
                                                min="0"
                                            />
                                        </div>
                                    </CCol>
                                </CRow>
                            </CForm>
                        </CTabPane>
                        <!-- 奖励配置（仅创建时） -->
                        <CTabPane :visible="matchFormTab === 4 && !editingMatch">
                            <CForm class="mt-3">
                                <div class="mb-3 d-flex justify-content-between align-items-center">
                                    <strong>排名奖励配置</strong>
                                    <CButton color="success" size="sm" @click="addRewardRank">
                                        <CIcon icon="cil-plus" class="me-1" />
                                        添加排名奖励
                                    </CButton>
                                </div>
                                <div v-for="(rank, rankIndex) in matchForm.reward.ranks" :key="rankIndex" class="mb-4 p-3 border rounded">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <strong>排名奖励 #{{ rankIndex + 1 }}</strong>
                                        <CButton color="danger" size="sm" @click="removeRewardRank(rankIndex)">
                                            <CIcon icon="cil-trash" />
                                            删除
                                        </CButton>
                                    </div>
                                    <CRow class="mb-2">
                                        <CCol :md="6">
                                            <CFormLabel>最小排名 <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                type="number"
                                                v-model.number="rank.minRank"
                                                placeholder="最小排名"
                                                min="1"
                                            />
                                        </CCol>
                                        <CCol :md="6">
                                            <CFormLabel>最大排名 <span class="text-danger">*</span></CFormLabel>
                                            <CFormInput
                                                type="number"
                                                v-model.number="rank.maxRank"
                                                placeholder="最大排名"
                                                min="1"
                                            />
                                        </CCol>
                                    </CRow>
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <CFormLabel>奖励道具</CFormLabel>
                                            <CButton color="primary" size="sm" @click="addRewardItem(rankIndex)">
                                                <CIcon icon="cil-plus" class="me-1" />
                                                添加道具
                                            </CButton>
                                        </div>
                                        <div v-for="(item, itemIndex) in rank.items" :key="itemIndex" class="mb-2">
                                            <CRow>
                                                <CCol :md="5">
                                                    <ItemSelect
                                                        v-model="item.itemID"
                                                        placeholder="选择道具"
                                                        placeholder-value=""
                                                    />
                                                </CCol>
                                                <CCol :md="5">
                                                    <CFormInput
                                                        v-model="item.count"
                                                        placeholder="数量"
                                                    />
                                                </CCol>
                                                <CCol :md="2">
                                                    <CButton color="danger" size="sm" @click="removeRewardItem(rankIndex, itemIndex)">
                                                        <CIcon icon="cil-trash" />
                                                    </CButton>
                                                </CCol>
                                            </CRow>
                                        </div>
                                        <div v-if="!rank.items || rank.items.length === 0" class="text-muted small">
                                            暂无奖励道具，点击"添加道具"添加
                                        </div>
                                    </div>
                                </div>
                                <div v-if="!matchForm.reward.ranks || matchForm.reward.ranks.length === 0" class="text-center text-muted py-4 border rounded">
                                    暂无排名奖励配置，点击"添加排名奖励"添加
                                </div>
                            </CForm>
                        </CTabPane>
                        <!-- 抽水配置（仅创建时） -->
                        <CTabPane :visible="matchFormTab === 5 && !editingMatch">
                            <CForm class="mt-3">
                                <CRow class="mb-3">
                                    <CCol :md="6">
                                        <CFormLabel>抽水类型</CFormLabel>
                                        <select class="form-select" v-model.number="matchForm.water!.type">
                                            <option :value="RewardDefine.GameWaterType.None">无</option>
                                            <option :value="RewardDefine.GameWaterType.Ju">局</option>
                                            <option :value="RewardDefine.GameWaterType.Round">轮</option>
                                        </select>
                                    </CCol>
                                    <CCol :md="6">
                                        <CFormLabel>抽水目标</CFormLabel>
                                        <select class="form-select" v-model.number="matchForm.water!.target">
                                            <option :value="RewardDefine.GameWaterTarget.Everyone">所有人</option>
                                            <option :value="RewardDefine.GameWaterTarget.Winner">赢家</option>
                                        </select>
                                    </CCol>
                                </CRow>
                                <CRow class="mb-3">
                                    <CCol :md="6">
                                        <FormSlider v-model="matchForm.water!.percent" label="抽水百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                                    </CCol>
                                    <CCol :md="6">
                                        <CFormLabel>最小抽水值</CFormLabel>
                                        <CFormInput
                                            v-model="matchForm.water!.minValue"
                                            placeholder="请输入最小抽水值"
                                        />
                                    </CCol>
                                </CRow>
                                <CRow class="mb-3">
                                    <CCol :md="6">
                                        <CFormLabel>最大抽水值</CFormLabel>
                                        <CFormInput
                                            v-model="matchForm.water!.maxValue"
                                            placeholder="请输入最大抽水值"
                                        />
                                    </CCol>
                                </CRow>
                            </CForm>
                        </CTabPane>
                    </CTabContent>
                </CTabs>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeMatchModal">取消</CButton>
                <CButton color="primary" @click="saveMatch" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 编辑显示配置 Modal -->
        <CModal :visible="showDisplayModal" @close="closeDisplayModal" size="lg">
            <CModalHeader>
                <CModalTitle>编辑显示配置 (比赛ID: {{ editingMatchID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>比赛名称 <span class="text-danger">*</span></CFormLabel>
                        <CFormInput
                            v-model="displayForm.list!.title"
                            placeholder="请输入比赛名称"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>比赛描述</CFormLabel>
                        <CFormTextarea
                            v-model="displayForm.list!.content"
                            placeholder="请输入比赛描述"
                            rows="3"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>图标</CFormLabel>
                        <ImageUpload
                            v-model="displayForm.list!.iconUrl"
                            placeholder="选择或上传图标"
                        />
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong>规则配置</strong>
                            <CButton color="success" size="sm" @click="addDisplayRule">
                                <CIcon icon="cil-plus" class="me-1" />
                                添加规则
                            </CButton>
                        </div>
                        <div v-for="(rule, ruleIndex) in (displayForm.rules || [])" :key="ruleIndex" class="mb-3 p-3 border rounded">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong>规则 #{{ ruleIndex + 1 }}</strong>
                                <CButton color="danger" size="sm" @click="removeDisplayRule(ruleIndex)">
                                    <CIcon icon="cil-trash" />
                                    删除
                                </CButton>
                            </div>
                            <div class="mb-2">
                                <CFormLabel>规则内容</CFormLabel>
                                <CFormTextarea
                                    v-model="rule.content"
                                    placeholder="请输入规则说明"
                                    rows="2"
                                />
                            </div>
                            <div>
                                <CFormLabel>规则图标</CFormLabel>
                                <ImageUpload
                                    v-model="rule.iconUrl"
                                    placeholder="选择或上传图标"
                                />
                            </div>
                        </div>
                        <div v-if="!displayForm.rules || displayForm.rules.length === 0" class="text-center text-muted py-3 border rounded">
                            暂无规则，点击「添加规则」添加
                        </div>
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeDisplayModal">取消</CButton>
                <CButton color="primary" @click="saveDisplay" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 编辑奖励配置 Modal -->
        <CModal :visible="showRewardModal" @close="closeRewardModal" size="xl">
            <CModalHeader>
                <CModalTitle>编辑奖励配置 (比赛ID: {{ editingMatchID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3 d-flex justify-content-between align-items-center">
                        <strong>排名奖励配置</strong>
                        <CButton color="success" size="sm" @click="addRewardRank">
                            <CIcon icon="cil-plus" class="me-1" />
                            添加排名奖励
                        </CButton>
                    </div>
                    <div v-for="(rank, rankIndex) in rewardForm.ranks" :key="rankIndex" class="mb-4 p-3 border rounded">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong>排名奖励 #{{ rankIndex + 1 }}</strong>
                            <CButton color="danger" size="sm" @click="removeRewardRank(rankIndex)">
                                <CIcon icon="cil-trash" />
                                删除
                            </CButton>
                        </div>
                        <CRow class="mb-2">
                            <CCol :md="6">
                                <CFormLabel>最小排名 <span class="text-danger">*</span></CFormLabel>
                                <CFormInput
                                    type="number"
                                    v-model.number="rank.minRank"
                                    placeholder="最小排名"
                                    min="1"
                                />
                            </CCol>
                            <CCol :md="6">
                                <CFormLabel>最大排名 <span class="text-danger">*</span></CFormLabel>
                                <CFormInput
                                    type="number"
                                    v-model.number="rank.maxRank"
                                    placeholder="最大排名"
                                    min="1"
                                />
                            </CCol>
                        </CRow>
                        <div class="mb-2">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <CFormLabel>奖励道具</CFormLabel>
                                <CButton color="primary" size="sm" @click="addRewardItem(rankIndex)">
                                    <CIcon icon="cil-plus" class="me-1" />
                                    添加道具
                                </CButton>
                            </div>
                            <div v-for="(item, itemIndex) in rank.items" :key="itemIndex" class="mb-2">
                                <CRow>
                                    <CCol :md="5">
                                        <ItemSelect
                                            v-model="item.itemID"
                                            placeholder="选择道具"
                                            placeholder-value=""
                                        />
                                    </CCol>
                                    <CCol :md="5">
                                        <CFormInput
                                            v-model="item.count"
                                            placeholder="数量"
                                        />
                                    </CCol>
                                    <CCol :md="2">
                                        <CButton color="danger" size="sm" @click="removeRewardItem(rankIndex, itemIndex)">
                                            <CIcon icon="cil-trash" />
                                        </CButton>
                                    </CCol>
                                </CRow>
                            </div>
                            <div v-if="!rank.items || rank.items.length === 0" class="text-muted small">
                                暂无奖励道具，点击"添加道具"添加
                            </div>
                        </div>
                    </div>
                    <div v-if="!rewardForm.ranks || rewardForm.ranks.length === 0" class="text-center text-muted py-4 border rounded">
                        暂无排名奖励配置，点击"添加排名奖励"添加
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeRewardModal">取消</CButton>
                <CButton color="primary" @click="saveReward" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 编辑抽水配置 Modal -->
        <CModal :visible="showWaterModal" @close="closeWaterModal" size="lg">
            <CModalHeader>
                <CModalTitle>编辑抽水配置 (比赛ID: {{ editingMatchID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <CRow class="mb-3">
                        <CCol :md="6">
                            <CFormLabel>抽水类型</CFormLabel>
                            <select class="form-select" v-model.number="waterForm.type">
                                <option :value="RewardDefine.GameWaterType.None">无</option>
                                <option :value="RewardDefine.GameWaterType.Ju">局</option>
                                <option :value="RewardDefine.GameWaterType.Round">轮</option>
                            </select>
                        </CCol>
                        <CCol :md="6">
                            <CFormLabel>抽水目标</CFormLabel>
                            <select class="form-select" v-model.number="waterForm.target">
                                <option :value="RewardDefine.GameWaterTarget.Everyone">所有人</option>
                                <option :value="RewardDefine.GameWaterTarget.Winner">赢家</option>
                            </select>
                        </CCol>
                    </CRow>
                    <CRow class="mb-3">
                        <CCol :md="6">
                            <FormSlider v-model="waterForm.percent" label="抽水百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                        </CCol>
                        <CCol :md="6">
                            <CFormLabel>最小抽水值</CFormLabel>
                            <CFormInput
                                v-model="waterForm.minValue"
                                placeholder="请输入最小抽水值"
                            />
                        </CCol>
                    </CRow>
                    <CRow class="mb-3">
                        <CCol :md="6">
                            <CFormLabel>最大抽水值</CFormLabel>
                            <CFormInput
                                v-model="waterForm.maxValue"
                                placeholder="请输入最大抽水值"
                            />
                        </CCol>
                    </CRow>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeWaterModal">取消</CButton>
                <CButton color="primary" @click="saveWater" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 查看比赛详情 Modal -->
        <CModal :visible="showViewModal" @close="closeViewModal" size="xl">
            <CModalHeader>
                <CModalTitle>比赛详情 (比赛ID: {{ viewingMatchID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CTabs v-model="viewTab">
                    <CNav variant="tabs">
                        <CNavItem>
                            <CNavLink :active="viewTab === 0" @click="viewTab = 0">
                                排名
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink :active="viewTab === 1" @click="viewTab = 1">
                                报名记录
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink :active="viewTab === 2" @click="viewTab = 2">
                                运行时数据
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink :active="viewTab === 3" @click="viewTab = 3">
                                执行器房间
                            </CNavLink>
                        </CNavItem>
                    </CNav>
                    <CTabContent>
                        <CTabPane :visible="viewTab === 0">
                            <div class="mt-3">
                                <div v-if="rankLoading" class="text-center py-4">
                                    <CSpinner />
                                    <div class="mt-2">加载中...</div>
                                </div>
                                <div v-else>
                                    <CTable hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>排名</CTableHeaderCell>
                                                <CTableHeaderCell>用户ID</CTableHeaderCell>
                                                <CTableHeaderCell>分数</CTableHeaderCell>
                                                <CTableHeaderCell>其他信息</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow v-for="(item, index) in rankList" :key="index">
                                                <CTableDataCell>{{ index + 1 }}</CTableDataCell>
                                                <CTableDataCell>{{ item.userID || '-' }}</CTableDataCell>
                                                <CTableDataCell>{{ item.score || '-' }}</CTableDataCell>
                                                <CTableDataCell>
                                                    <pre class="mb-0" style="max-width: 300px; overflow: auto;">{{ JSON.stringify(item, null, 2) }}</pre>
                                                </CTableDataCell>
                                            </CTableRow>
                                            <CTableRow v-if="!rankList || rankList.length === 0">
                                                <CTableDataCell colspan="4" class="text-center text-muted py-4">
                                                    暂无排名数据
                                                </CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <div class="text-muted">
                                            共 {{ rankCount }} 条记录
                                        </div>
                                        <div @click.prevent="handleRankPaginationClick">
                                            <CSmartPagination
                                                v-if="rankTotalPages > 0"
                                                :pages="rankTotalPages"
                                                :active-page="rankCurrentPage + 1"
                                                @active-page-change="handleRankPageChange"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CTabPane>
                        <CTabPane :visible="viewTab === 1">
                            <div class="mt-3">
                                <div v-if="signupLoading" class="text-center py-4">
                                    <CSpinner />
                                    <div class="mt-2">加载中...</div>
                                </div>
                                <div v-else>
                                    <CTable hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>用户ID</CTableHeaderCell>
                                                <CTableHeaderCell>报名时间</CTableHeaderCell>
                                                <CTableHeaderCell>其他信息</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow v-for="(item, index) in signupList" :key="index">
                                                <CTableDataCell>{{ item.userID || '-' }}</CTableDataCell>
                                                <CTableDataCell>{{ formatDate(item.timestamp) }}</CTableDataCell>
                                                <CTableDataCell>
                                                    <pre class="mb-0" style="max-width: 300px; overflow: auto;">{{ JSON.stringify(item, null, 2) }}</pre>
                                                </CTableDataCell>
                                            </CTableRow>
                                            <CTableRow v-if="!signupList || signupList.length === 0">
                                                <CTableDataCell colspan="3" class="text-center text-muted py-4">
                                                    暂无报名记录
                                                </CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <div class="text-muted">
                                            共 {{ signupCount }} 条记录
                                        </div>
                                        <div @click.prevent="handleSignupPaginationClick">
                                            <CSmartPagination
                                                v-if="signupTotalPages > 0"
                                                :pages="signupTotalPages"
                                                :active-page="signupCurrentPage + 1"
                                                @active-page-change="handleSignupPageChange"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CTabPane>
                        <CTabPane :visible="viewTab === 2">
                            <div class="mt-3">
                                <div v-if="runtimeLoading" class="text-center py-4">
                                    <CSpinner />
                                    <div class="mt-2">加载中...</div>
                                </div>
                                <div v-else>
                                    <CTable hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>用户ID</CTableHeaderCell>
                                                <CTableHeaderCell>状态</CTableHeaderCell>
                                                <CTableHeaderCell>分数</CTableHeaderCell>
                                                <CTableHeaderCell>其他信息</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow v-for="(item, index) in runtimeList" :key="index">
                                                <CTableDataCell>{{ item.userID || '-' }}</CTableDataCell>
                                                <CTableDataCell>{{ item.status || '-' }}</CTableDataCell>
                                                <CTableDataCell>{{ item.score || '-' }}</CTableDataCell>
                                                <CTableDataCell>
                                                    <pre class="mb-0" style="max-width: 300px; overflow: auto;">{{ JSON.stringify(item, null, 2) }}</pre>
                                                </CTableDataCell>
                                            </CTableRow>
                                            <CTableRow v-if="!runtimeList || runtimeList.length === 0">
                                                <CTableDataCell colspan="4" class="text-center text-muted py-4">
                                                    暂无运行时数据
                                                </CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <div class="text-muted">
                                            共 {{ runtimeCount }} 条记录
                                        </div>
                                        <div @click.prevent="handleRuntimePaginationClick">
                                            <CSmartPagination
                                                v-if="runtimeTotalPages > 0"
                                                :pages="runtimeTotalPages"
                                                :active-page="runtimeCurrentPage + 1"
                                                @active-page-change="handleRuntimePageChange"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CTabPane>
                        <CTabPane :visible="viewTab === 3">
                            <div class="mt-3">
                                <div v-if="roomLoading" class="text-center py-4">
                                    <CSpinner />
                                    <div class="mt-2">加载中...</div>
                                </div>
                                <div v-else>
                                    <CTable hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>房间ID</CTableHeaderCell>
                                                <CTableHeaderCell>其他信息</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow v-for="(item, index) in roomList" :key="index">
                                                <CTableDataCell>{{ item.roomID || '-' }}</CTableDataCell>
                                                <CTableDataCell>
                                                    <pre class="mb-0" style="max-width: 500px; overflow: auto;">{{ JSON.stringify(item, null, 2) }}</pre>
                                                </CTableDataCell>
                                            </CTableRow>
                                            <CTableRow v-if="!roomList || roomList.length === 0">
                                                <CTableDataCell colspan="2" class="text-center text-muted py-4">
                                                    暂无执行器房间信息
                                                </CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <div class="text-muted">
                                            共 {{ roomCount }} 条记录
                                        </div>
                                        <div @click.prevent="handleRoomPaginationClick">
                                            <CSmartPagination
                                                v-if="roomTotalPages > 0"
                                                :pages="roomTotalPages"
                                                :active-page="roomCurrentPage + 1"
                                                @active-page-change="handleRoomPageChange"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CTabPane>
                    </CTabContent>
                </CTabs>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeViewModal">关闭</CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
    matchGetmatchlist,
    matchCreatematch,
    matchDelmatch,
    matchUpdatedisplay,
    matchUpdatedata,
    matchUpdatereward,
    matchUpdatewater,
    matchGetuserruntimes,
    matchGetrank,
    matchGetsignuprecord,
    matchGetexecuterroominfos,
} from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { Toast } from '@/composables/useToast'
import { CSmartPagination } from '@coreui/vue-pro'
import GameIDSelect from '@/components/GameIDSelect.vue'
import ItemSelect from '@/components/ItemSelect.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { showConfirm } from '@/utils/message'
import { RewardDefine } from 'pp-base-define/RewardDefine'
import { MatchDefine } from 'pp-base-define/MatchDefine'
import { RoomDefine } from 'pp-base-define/RoomDefine'
import { ClubDefine } from 'pp-base-define/ClubDefine'
import { GameSet } from 'pp-base-define/GameSet'
import { GameID } from 'pp-base-define/GameIDDefine'
import { GameConfig_Texas } from '@/games/GameConfig_Texas'
import FormSlider from '@/components/FormSlider.vue'

// Type alias for match list item
type MatchListItem = AdminReqDefine.tMatchGetmatchlistRes['datas'][0]

const loading = ref(false)
const saving = ref(false)
const matchList = ref<MatchListItem[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)

const filter = ref({
    name: '' as string | undefined,
    gameID: undefined as number | undefined,
})

const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// Modal states
const showMatchModal = ref(false)
const showDisplayModal = ref(false)
const showRewardModal = ref(false)
const showWaterModal = ref(false)
const showViewModal = ref(false)
const editingMatch = ref<MatchListItem | null>(null)
const editingMatchID = ref<number>(0)
const viewingMatchID = ref<number>(0)
const viewTab = ref(0)
const matchFormTab = ref(0)

// Match form
const matchForm = ref<{
    data: Partial<MatchDefine.tData>
    display: Partial<MatchDefine.tDisplay>
    reward: Partial<MatchDefine.tReward>
    water?: Partial<MatchDefine.tWater>
}>({
    data: {
        matchID: 0,
        name: '',
        signup: [],
        gameData: { gameID: 0, bSets: [], iSets: [] },
        status: MatchDefine.MatchStatus.Signup,
        changeStatusTimestamp: 0,
        combineStartUserCount: 0,
        combineMinUserCount: 0,
        itemID: '',
        lockItemCount: '0',
        maxEnterCount: 0,
        signupStartTime: 0,
        signupEndTime: 0,
        startTime: 0,
        duration: 0,
    },
    display: {
        matchID: 0,
        rules: [],
        list: {
            iconUrl: '',
            title: '',
            content: '',
        },
    },
    reward: {
        matchID: 0,
        ranks: [],
    },
    water: undefined,
})

const matchFormDataJson = ref('{}')

// Time string helpers for datetime-local inputs
const signupStartTimeStr = ref('')
const signupEndTimeStr = ref('')
const startTimeStr = ref('')
const durationHours = ref<number>(0)

// Game config (for create match, like 匹配管理)
const gameConfig = ref<any>(null)
const gameDataForm = ref<{
    gameID: number
    userCount: number
    baseScore: number
    sets: any[]
    payType: RoomDefine.PayType
    payValue: string | number
    winnerRate: number
}>({
    gameID: 0,
    userCount: 8,
    baseScore: 1,
    sets: [],
    payType: RoomDefine.PayType.Item,
    payValue: '',
    winnerRate: 0,
})
const durationRef = ref<Record<number, { h: number; m: number; s: number }>>({})

const valueIndexList = computed(() => {
    const list: { label: string; value: number }[] = []
    for (const key in ClubDefine.ValueIndex) {
        if (isNaN(Number(key))) {
            list.push({
                label: key,
                value: ClubDefine.ValueIndex[key as keyof typeof ClubDefine.ValueIndex],
            })
        }
    }
    return list
})

const convertTimeToSeconds = (obj: { h: number; m: number; s: number }): number => {
    return obj.h * 3600 + obj.m * 60 + obj.s
}
const setDurationFromSeconds = (seconds: number, group: number) => {
    const hours = Math.floor(seconds / 3600)
    const remainingSecondsAfterHours = seconds % 3600
    const minutes = Math.floor(remainingSecondsAfterHours / 60)
    const secs = remainingSecondsAfterHours % 60
    durationRef.value[group] = { h: hours, m: minutes, s: secs }
}

watch(durationRef, () => {
    if (!gameConfig.value) return
    gameConfig.value.lobby_setting.extension.forEach((option: any) => {
        if (option.type === 'time' && durationRef.value[option.group]) {
            gameDataForm.value.sets[option.group] = convertTimeToSeconds(durationRef.value[option.group])
        }
    })
}, { deep: true })

// 创建比赛时选择 gameID 后加载游戏配置（与匹配管理一致）
const onMatchGameIDChange = async () => {
    if (editingMatch.value) return
    await nextTick()
    const gameID = matchForm.value.data.gameData?.gameID
    if (!gameID) {
        gameConfig.value = null
        return
    }
    if (gameID === GameID.Texas) {
        let gameConfig_Texas = GameConfig_Texas
        let extension = GameConfig_Texas.lobby_setting.extension.filter((v)=>v.title != "持续时长")
        gameConfig_Texas.lobby_setting.extension = extension
        gameConfig.value = gameConfig_Texas 
    } else {
        gameConfig.value = null
        return
    }
    if (!gameConfig.value) return
    const setting = gameConfig.value.lobby_setting
    gameDataForm.value.gameID = gameID
    gameDataForm.value.userCount = setting.user_count_default
    gameDataForm.value.baseScore = setting.base_score[0]
    gameDataForm.value.payType = RoomDefine.PayType.Item
    gameDataForm.value.payValue = ''
    gameDataForm.value.winnerRate = 0
    gameDataForm.value.sets = []
    setting.extension.forEach((option: any) => {
        if (option.type === 'normal') {
            gameDataForm.value.sets[option.group] = []
            option.names.forEach((_: string, index: number) => {
                const hasDefault = (option.defaults && (option.defaults[0] & (1 << index))) !== 0
                gameDataForm.value.sets[option.group][index] = hasDefault
            })
        } else if (option.type === 'mutex') {
            gameDataForm.value.sets[option.group] = option.defaults?.length ? option.defaults[0] - 1 : 0
        } else if (option.type === 'int') {
            gameDataForm.value.sets[option.group] = option.defaults?.[0] ?? 0
        } else if (option.type === 'time') {
            const defaultSeconds = option.defaults?.[0] ?? 30
            gameDataForm.value.sets[option.group] = defaultSeconds
            setDurationFromSeconds(defaultSeconds, option.group)
        }
    })
}

// Convert timestamp to datetime-local string
const timestampToLocalString = (timestamp: number): string => {
    if (!timestamp || timestamp === 0) return ''
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Convert datetime-local string to timestamp
const localStringToTimestamp = (str: string): number => {
    if (!str) return 0
    return new Date(str).getTime()
}

// Display form
const displayForm = ref<Partial<MatchDefine.tDisplay>>({
    matchID: 0,
    rules: [],
    list: {
        iconUrl: '',
        title: '',
        content: '',
    },
})

// Reward form
const rewardForm = ref<MatchDefine.tReward>({
    matchID: 0,
    ranks: [],
})

// Water form
const waterForm = ref<MatchDefine.tWater>({
    matchID: 0,
    type: RewardDefine.GameWaterType.None,
    target: RewardDefine.GameWaterTarget.Everyone,
    percent: 0,
    minValue: '0',
    maxValue: '0',
})

// View data
const rankList = ref<MatchDefine.tUserRank[]>([])
const rankCount = ref(0)
const rankCurrentPage = ref(0)
const rankTotalPages = computed(() => Math.ceil(rankCount.value / pageSize.value))
const rankLoading = ref(false)

const signupList = ref<MatchDefine.tUserSignupRecord[]>([])
const signupCount = ref(0)
const signupCurrentPage = ref(0)
const signupTotalPages = computed(() => Math.ceil(signupCount.value / pageSize.value))
const signupLoading = ref(false)

const runtimeList = ref<MatchDefine.tUserRuntime[]>([])
const runtimeCount = ref(0)
const runtimeCurrentPage = ref(0)
const runtimeTotalPages = computed(() => Math.ceil(runtimeCount.value / pageSize.value))
const runtimeLoading = ref(false)

const roomList = ref<MatchDefine.tExecuterRoomInfo[]>([])
const roomCount = ref(0)
const roomCurrentPage = ref(0)
const roomTotalPages = computed(() => Math.ceil(roomCount.value / pageSize.value))
const roomLoading = ref(false)

// Watch matchFormDataJson changes
watch(matchFormDataJson, (newVal) => {
    try {
        matchForm.value.data = { ...matchForm.value.data, ...JSON.parse(newVal) }
    } catch (e) {
        // Invalid JSON, ignore
    }
})

// Watch time strings and update timestamps
watch(signupStartTimeStr, (newVal) => {
    matchForm.value.data.signupStartTime = localStringToTimestamp(newVal)
})

watch(signupEndTimeStr, (newVal) => {
    matchForm.value.data.signupEndTime = localStringToTimestamp(newVal)
})

watch(startTimeStr, (newVal) => {
    matchForm.value.data.startTime = localStringToTimestamp(newVal)
})

watch(durationHours, (newVal) => {
    matchForm.value.data.duration = newVal * 60 * 60 * 1000 // Convert hours to milliseconds
})

// Add signup item
const addSignupItem = () => {
    if (!matchForm.value.data.signup) {
        matchForm.value.data.signup = []
    }
    matchForm.value.data.signup.push({
        itemID: '',
        count: '0',
    })
}

// Remove signup item
const removeSignupItem = (index: number) => {
    if (matchForm.value.data.signup) {
        matchForm.value.data.signup.splice(index, 1)
    }
}

// 当前操作的是创建比赛表单中的奖励还是独立奖励弹窗
const rewardRanks = () => {
    if (showMatchModal.value && !editingMatch.value) {
        if (!matchForm.value.reward!.ranks) matchForm.value.reward!.ranks = []
        return matchForm.value.reward!.ranks
    }
    return rewardForm.value.ranks
}

// Add reward rank
const addRewardRank = () => {
    rewardRanks().push({
        minRank: 1,
        maxRank: 1,
        items: [],
    })
}

// Remove reward rank
const removeRewardRank = (index: number) => {
    rewardRanks().splice(index, 1)
}

// Add reward item
const addRewardItem = (rankIndex: number) => {
    const ranks = rewardRanks()
    if (!ranks[rankIndex].items) ranks[rankIndex].items = []
    ranks[rankIndex].items.push({
        itemID: '',
        count: '0',
    })
}

// Remove reward item
const removeRewardItem = (rankIndex: number, itemIndex: number) => {
    rewardRanks()[rankIndex].items.splice(itemIndex, 1)
}

// Load matches
const loadMatches = async () => {
    loading.value = true
    try {
        const params: AdminReqDefine.tMatchGetmatchlistReq = {
            page: currentPage.value,
            limit: pageSize.value,
        }

        if (filter.value.name && filter.value.name.trim()) {
            params.name = filter.value.name.trim()
        }

        if (filter.value.gameID !== undefined && filter.value.gameID !== null) {
            params.gameID = filter.value.gameID
        }

        const response = await matchGetmatchlist(params)

        if (response.errCode) {
            Toast.error(response.errMsg || '加载比赛列表失败')
            matchList.value = []
            totalCount.value = 0
            return
        }

        matchList.value = response.datas || []
        totalCount.value = response.count || 0
    } catch (error) {
        console.error('Load matches error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Search
const handleSearch = () => {
    currentPage.value = 0
    loadMatches()
}

// Clear search
const clearSearch = () => {
    filter.value = {
        name: '',
        gameID: undefined,
    }
    currentPage.value = 0
    loadMatches()
}

// Pagination
const handlePaginationClick = (event: Event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()
        const pageText = link.textContent?.trim()
        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
                currentPage.value = newPage
                loadMatches()
            }
        }
    }
}

const handlePageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
        currentPage.value = newPage
        loadMatches()
    }
}

// Status helpers
const getStatusName = (status: MatchDefine.MatchStatus | undefined | null): string => {
    if (status === undefined || status === null) return '未知'
    const statusMap: Record<MatchDefine.MatchStatus, string> = {
        [MatchDefine.MatchStatus.Signup]: '报名中',
        [MatchDefine.MatchStatus.Running]: '进行中',
        [MatchDefine.MatchStatus.Ended]: '已结束',
        [MatchDefine.MatchStatus.FullyEnded]: '完全结束',
    }
    return statusMap[status] || String(status)
}

const getStatusColor = (status: MatchDefine.MatchStatus | undefined | null): string => {
    if (status === undefined || status === null) return 'secondary'
    const colorMap: Record<MatchDefine.MatchStatus, string> = {
        [MatchDefine.MatchStatus.Signup]: 'info',
        [MatchDefine.MatchStatus.Running]: 'success',
        [MatchDefine.MatchStatus.Ended]: 'warning',
        [MatchDefine.MatchStatus.FullyEnded]: 'secondary',
    }
    return colorMap[status] || 'info'
}

// Create match
const addMatch = () => {
    editingMatch.value = null
    matchFormTab.value = 0
    matchForm.value = {
        data: {
            matchID: 0,
            name: '',
            signup: [],
            gameData: { gameID: 0, bSets: [], iSets: [] },
            status: MatchDefine.MatchStatus.Signup,
            changeStatusTimestamp: 0,
            combineStartUserCount: 0,
            combineMinUserCount: 0,
            itemID: '',
            lockItemCount: '0',
            maxEnterCount: 0,
            signupStartTime: 0,
            signupEndTime: 0,
            startTime: 0,
            duration: 0,
        },
        display: {
            matchID: 0,
            rules: [],
            list: {
                iconUrl: '',
                title: '',
                content: '',
            },
        },
        reward: {
            matchID: 0,
            ranks: [],
        },
        water: {
            matchID: 0,
            type: RewardDefine.GameWaterType.None,
            target: RewardDefine.GameWaterTarget.Everyone,
            percent: 0,
            minValue: '0',
            maxValue: '0',
        },
    }
    matchFormDataJson.value = '{}'
    signupStartTimeStr.value = ''
    signupEndTimeStr.value = ''
    startTimeStr.value = ''
    durationHours.value = 0
    gameConfig.value = null
    gameDataForm.value = { gameID: 0, userCount: 8, baseScore: 1, sets: [], payType: RoomDefine.PayType.Item, payValue: '', winnerRate: 0 }
    durationRef.value = {}
    showMatchModal.value = true
}

// Edit match
const editMatch = (match: MatchListItem) => {
    editingMatch.value = match
    matchFormTab.value = 0
    const matchID = match.data?.matchID || 0
    matchForm.value = {
        data: match.data || {
            matchID,
            name: '',
            signup: [],
            gameData: { gameID: 0, bSets: [], iSets: [] },
            status: MatchDefine.MatchStatus.Signup,
            changeStatusTimestamp: 0,
            combineStartUserCount: 0,
            combineMinUserCount: 0,
            itemID: '',
            lockItemCount: '0',
            maxEnterCount: 0,
            signupStartTime: 0,
            signupEndTime: 0,
            startTime: 0,
            duration: 0,
        },
        display: match.display || {
            matchID,
            rules: [],
            list: { iconUrl: '', title: '', content: '' },
        },
        reward: match.reward || { matchID, ranks: [] },
        water: match.water,
    }
    matchFormDataJson.value = JSON.stringify(match.data || {}, null, 2)
    // Set time strings
    signupStartTimeStr.value = timestampToLocalString(match.data?.signupStartTime || 0)
    signupEndTimeStr.value = timestampToLocalString(match.data?.signupEndTime || 0)
    startTimeStr.value = timestampToLocalString(match.data?.startTime || 0)
    durationHours.value = (match.data?.duration || 0) / (60 * 60 * 1000) // Convert milliseconds to hours
    showMatchModal.value = true
}

// Save match
const saveMatch = async () => {
    if (!matchForm.value.data.gameData?.gameID) {
        Toast.error('请选择游戏ID')
        return
    }
    if (!matchForm.value.display.list?.title) {
        Toast.error('请输入比赛名称')
        return
    }
    if (!matchForm.value.data.signupStartTime || !matchForm.value.data.signupEndTime) {
        Toast.error('请设置报名开始和结束时间')
        return
    }
    if (!matchForm.value.data.startTime) {
        Toast.error('请设置比赛开始时间')
        return
    }
    if (!matchForm.value.data.duration || matchForm.value.data.duration <= 0) {
        Toast.error('请设置比赛时长')
        return
    }

    saving.value = true
    try {
        if (editingMatch.value) {
            // Update match data
            const matchID = editingMatch.value.data?.matchID || 0
            const data: MatchDefine.tData = {
                ...matchForm.value.data,
                matchID,
                name: matchForm.value.display.list?.title || '',
                gameData: {
                    ...matchForm.value.data.gameData,
                    gameID: matchForm.value.data.gameData?.gameID || 0,
                },
            } as MatchDefine.tData
            const response = await matchUpdatedata({
                data,
            })
            if (response.errCode) {
                Toast.error(response.errMsg || '更新比赛失败')
                return
            }
            Toast.success('更新成功')
        } else {
            // Create match：从游戏配置表单生成 gameData（与匹配管理一致）
            if (!gameConfig.value) {
                Toast.error('请先选择游戏以加载游戏配置')
                saving.value = false
                return
            }
            if (gameDataForm.value.payType === RoomDefine.PayType.Item && (gameDataForm.value.payValue === '' || gameDataForm.value.payValue === undefined)) {
                Toast.error('支付类型为道具时请选择道具')
                saving.value = false
                return
            }
            const gameID = matchForm.value.data.gameData?.gameID || 0
            const gameSet = new GameSet(gameID)
            gameSet.setUserCount(gameDataForm.value.userCount)
            gameSet.setScore(gameDataForm.value.baseScore)
            gameSet.setWinnerRate(gameDataForm.value.winnerRate)
            gameSet.setPayType(RoomDefine.makePayType(gameDataForm.value.payType, gameDataForm.value.payValue))
            const setting = gameConfig.value.lobby_setting
            setting.extension.forEach((option: any) => {
                const value = gameDataForm.value.sets[option.group]
                if (option.type === 'normal' && Array.isArray(value)) {
                    value.forEach((checked: boolean, index: number) => {
                        if (checked) gameSet.addRule(option.group, 1 << index)
                    })
                } else if (option.type === 'mutex' && typeof value === 'number') {
                    gameSet.addRule(option.group, option.group < 2 ? 1 << value : value)
                } else if (option.type === 'int' && typeof value === 'number') {
                    gameSet.addRule(option.group, value)
                } else if (option.type === 'time' && typeof value === 'number') {
                    gameSet.addRule(option.group, value)
                }
            })
            const builtGameData = gameSet.gameData

            const data: MatchDefine.tData = {
                matchID: 0,
                name: matchForm.value.display.list?.title || '',
                signup: matchForm.value.data.signup || [],
                gameData: builtGameData,
                status: MatchDefine.MatchStatus.Signup,
                changeStatusTimestamp: 0,
                combineStartUserCount: matchForm.value.data.combineStartUserCount || 0,
                combineMinUserCount: matchForm.value.data.combineMinUserCount || 0,
                itemID: matchForm.value.data.itemID || '',
                lockItemCount: matchForm.value.data.lockItemCount || '0',
                maxEnterCount: matchForm.value.data.maxEnterCount || 0,
                signupStartTime: matchForm.value.data.signupStartTime || 0,
                signupEndTime: matchForm.value.data.signupEndTime || 0,
                startTime: matchForm.value.data.startTime || 0,
                duration: matchForm.value.data.duration || 0,
                buyin: matchForm.value.data.buyin,
            } as MatchDefine.tData
            const display: MatchDefine.tDisplay = {
                matchID: 0,
                rules: matchForm.value.display.rules || [],
                list: matchForm.value.display.list || {
                    iconUrl: '',
                    title: '',
                    content: '',
                },
            } as MatchDefine.tDisplay
            const reward: MatchDefine.tReward = {
                matchID: 0,
                ranks: matchForm.value.reward.ranks || [],
            } as MatchDefine.tReward
            const water: MatchDefine.tWater | undefined = matchForm.value.water ? {
                matchID: 0,
                type: matchForm.value.water.type,
                target: matchForm.value.water.target,
                percent: matchForm.value.water.percent || 0,
                minValue: matchForm.value.water.minValue || '0',
                maxValue: matchForm.value.water.maxValue || '0',
            } : undefined

            const response = await matchCreatematch({
                data,
                display,
                reward,
                water,
            })
            if (response.errCode) {
                Toast.error(response.errMsg || '创建比赛失败')
                return
            }
            Toast.success('创建成功')
        }
        closeMatchModal()
        loadMatches()
    } catch (error) {
        console.error('Save match error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Close match modal
const closeMatchModal = () => {
    showMatchModal.value = false
    editingMatch.value = null
    gameConfig.value = null
    gameDataForm.value = { gameID: 0, userCount: 8, baseScore: 1, sets: [], payType: RoomDefine.PayType.Item, payValue: '', winnerRate: 0 }
    durationRef.value = {}
}

// 显示配置：添加/删除规则
const addDisplayRule = () => {
    if (!displayForm.value.rules) displayForm.value.rules = []
    displayForm.value.rules.push({ content: '', iconUrl: '' })
}
const removeDisplayRule = (index: number) => {
    if (displayForm.value.rules) displayForm.value.rules.splice(index, 1)
}

// 创建比赛表单：添加/删除显示规则
const addMatchDisplayRule = () => {
    if (!matchForm.value.display!.rules) matchForm.value.display!.rules = []
    matchForm.value.display!.rules.push({ content: '', iconUrl: '' })
}
const removeMatchDisplayRule = (index: number) => {
    if (matchForm.value.display!.rules) matchForm.value.display!.rules.splice(index, 1)
}

// Edit display
const editDisplay = (match: MatchListItem) => {
    editingMatchID.value = match.data?.matchID || 0
    displayForm.value = {
        matchID: editingMatchID.value,
        rules: match.display?.rules ? match.display.rules.map((r) => ({ content: r.content ?? '', iconUrl: r.iconUrl ?? '' })) : [],
        list: match.display?.list || {
            iconUrl: '',
            title: '',
            content: '',
        },
    }
    showDisplayModal.value = true
}

// Save display
const saveDisplay = async () => {
    if (!displayForm.value.list?.title) {
        Toast.error('请输入比赛名称')
        return
    }

    saving.value = true
    try {
        const display: MatchDefine.tDisplay = {
            matchID: editingMatchID.value,
            ...displayForm.value,
        } as MatchDefine.tDisplay
        const response = await matchUpdatedisplay({
            display,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '更新显示配置失败')
            return
        }
        Toast.success('更新成功')
        closeDisplayModal()
        loadMatches()
    } catch (error) {
        console.error('Save display error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Close display modal
const closeDisplayModal = () => {
    showDisplayModal.value = false
    editingMatchID.value = 0
}

// Edit reward
const editReward = (match: MatchListItem) => {
    editingMatchID.value = match.data?.matchID || 0
    if (match.reward && match.reward.ranks) {
        rewardForm.value = {
            matchID: editingMatchID.value,
            ranks: match.reward.ranks.map((rank) => ({
                minRank: rank.minRank || 1,
                maxRank: rank.maxRank || 1,
                items: (rank.items || []).map((item) => ({
                    itemID: item.itemID || '',
                    count: item.count || '0',
                })),
            })),
        }
    } else {
        rewardForm.value = {
            matchID: editingMatchID.value,
            ranks: [],
        }
    }
    showRewardModal.value = true
}

// Save reward
const saveReward = async () => {
    // Validate ranks
    for (const rank of rewardForm.value.ranks) {
        if (!rank.minRank || !rank.maxRank) {
            Toast.error('请填写完整的排名范围')
            return
        }
        if (rank.minRank > rank.maxRank) {
            Toast.error('最小排名不能大于最大排名')
            return
        }
        for (const item of rank.items) {
            if (!item.itemID) {
                Toast.error('请选择道具ID')
                return
            }
            if (!item.count || item.count === '0') {
                Toast.error('请填写道具数量')
                return
            }
        }
    }

    saving.value = true
    try {
        const rewardData: MatchDefine.tReward = {
            matchID: editingMatchID.value,
            ranks: rewardForm.value.ranks.map(rank => ({
                minRank: rank.minRank,
                maxRank: rank.maxRank,
                items: rank.items.filter(item => item.itemID && item.count),
            })),
        }

        const response = await matchUpdatereward({
            reward: rewardData,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '更新奖励配置失败')
            return
        }
        Toast.success('更新成功')
        closeRewardModal()
        loadMatches()
    } catch (error) {
        console.error('Save reward error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Close reward modal
const closeRewardModal = () => {
    showRewardModal.value = false
    editingMatchID.value = 0
    rewardForm.value = {
        matchID: 0,
        ranks: [],
    }
}

// Edit water
const editWater = (match: MatchListItem) => {
    editingMatchID.value = match.data?.matchID || 0
    if (match.water) {
        waterForm.value = {
            ...match.water,
            matchID: editingMatchID.value,
        }
    } else {
        waterForm.value = {
            matchID: editingMatchID.value,
            type: RewardDefine.GameWaterType.None,
            target: RewardDefine.GameWaterTarget.Everyone,
            percent: 0,
            minValue: '0',
            maxValue: '0',
        }
    }
    showWaterModal.value = true
}

// Save water
const saveWater = async () => {
    saving.value = true
    try {
        const response = await matchUpdatewater({
            water: waterForm.value,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '更新抽水配置失败')
            return
        }
        Toast.success('更新成功')
        closeWaterModal()
        loadMatches()
    } catch (error) {
        console.error('Save water error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Close water modal
const closeWaterModal = () => {
    showWaterModal.value = false
    editingMatchID.value = 0
}

// View match
const viewMatch = (match: MatchListItem) => {
    viewingMatchID.value = match.data?.matchID || 0
    viewTab.value = 0
    showViewModal.value = true
    loadRankData()
}

// Load rank data
const loadRankData = async () => {
    rankLoading.value = true
    try {
        const response = await matchGetrank({
            matchID: viewingMatchID.value,
            page: rankCurrentPage.value,
            limit: pageSize.value,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '加载排名失败')
            rankList.value = []
            rankCount.value = 0
            return
        }
        rankList.value = response.datas || []
        rankCount.value = response.count || 0
    } catch (error) {
        console.error('Load rank error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        rankLoading.value = false
    }
}

// Load signup data
const loadSignupData = async () => {
    signupLoading.value = true
    try {
        const response = await matchGetsignuprecord({
            matchID: viewingMatchID.value,
            page: signupCurrentPage.value,
            limit: pageSize.value,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '加载报名记录失败')
            signupList.value = []
            signupCount.value = 0
            return
        }
        signupList.value = response.datas || []
        signupCount.value = response.count || 0
    } catch (error) {
        console.error('Load signup error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        signupLoading.value = false
    }
}

// Load runtime data
const loadRuntimeData = async () => {
    runtimeLoading.value = true
    try {
        const response = await matchGetuserruntimes({
            matchID: viewingMatchID.value,
            page: runtimeCurrentPage.value,
            limit: pageSize.value,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '加载运行时数据失败')
            runtimeList.value = []
            runtimeCount.value = 0
            return
        }
        runtimeList.value = response.datas || []
        runtimeCount.value = response.count || 0
    } catch (error) {
        console.error('Load runtime error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        runtimeLoading.value = false
    }
}

// Load room data
const loadRoomData = async () => {
    roomLoading.value = true
    try {
        const response = await matchGetexecuterroominfos({
            matchID: viewingMatchID.value,
            page: roomCurrentPage.value,
            limit: pageSize.value,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '加载执行器房间信息失败')
            roomList.value = []
            roomCount.value = 0
            return
        }
        roomList.value = response.datas || []
        roomCount.value = response.count || 0
    } catch (error) {
        console.error('Load room error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        roomLoading.value = false
    }
}

// Watch view tab changes
watch(viewTab, (newTab) => {
    if (!showViewModal.value) return
    if (newTab === 0) {
        loadRankData()
    } else if (newTab === 1) {
        loadSignupData()
    } else if (newTab === 2) {
        loadRuntimeData()
    } else if (newTab === 3) {
        loadRoomData()
    }
})

// Pagination handlers for view modals
const handleRankPaginationClick = (event: Event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()
        const pageText = link.textContent?.trim()
        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== rankCurrentPage.value && newPage >= 0 && newPage < rankTotalPages.value) {
                rankCurrentPage.value = newPage
                loadRankData()
            }
        }
    }
}

const handleRankPageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== rankCurrentPage.value && newPage >= 0 && newPage < rankTotalPages.value) {
        rankCurrentPage.value = newPage
        loadRankData()
    }
}

const handleSignupPaginationClick = (event: Event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()
        const pageText = link.textContent?.trim()
        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== signupCurrentPage.value && newPage >= 0 && newPage < signupTotalPages.value) {
                signupCurrentPage.value = newPage
                loadSignupData()
            }
        }
    }
}

const handleSignupPageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== signupCurrentPage.value && newPage >= 0 && newPage < signupTotalPages.value) {
        signupCurrentPage.value = newPage
        loadSignupData()
    }
}

const handleRuntimePaginationClick = (event: Event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()
        const pageText = link.textContent?.trim()
        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== runtimeCurrentPage.value && newPage >= 0 && newPage < runtimeTotalPages.value) {
                runtimeCurrentPage.value = newPage
                loadRuntimeData()
            }
        }
    }
}

const handleRuntimePageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== runtimeCurrentPage.value && newPage >= 0 && newPage < runtimeTotalPages.value) {
        runtimeCurrentPage.value = newPage
        loadRuntimeData()
    }
}

const handleRoomPaginationClick = (event: Event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()
        const pageText = link.textContent?.trim()
        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== roomCurrentPage.value && newPage >= 0 && newPage < roomTotalPages.value) {
                roomCurrentPage.value = newPage
                loadRoomData()
            }
        }
    }
}

const handleRoomPageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== roomCurrentPage.value && newPage >= 0 && newPage < roomTotalPages.value) {
        roomCurrentPage.value = newPage
        loadRoomData()
    }
}

// Close view modal
const closeViewModal = () => {
    showViewModal.value = false
    viewingMatchID.value = 0
    viewTab.value = 0
}

// Delete match
const deleteMatch = async (matchID: number) => {
    const confirmed = await showConfirm(`确定要删除比赛 ID: ${matchID} 吗？此操作不可恢复。`, { 
        title: '确认删除',
        type: 'danger' 
    })
    if (!confirmed) return

    try {
        const response = await matchDelmatch({ matchID })
        if (response.errCode) {
            Toast.error(response.errMsg || '删除比赛失败')
            return
        }
        Toast.success('删除成功')
        loadMatches()
    } catch (error) {
        console.error('Delete match error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Format date
const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

onMounted(() => {
    loadMatches()
})
</script>
