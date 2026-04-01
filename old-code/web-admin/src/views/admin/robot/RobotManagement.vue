<template>
  <CRow>
    <CCol xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <strong>机器人管理</strong>
        </CCardHeader>
        <CCardBody>
          <CTabs v-model="activeTab">
            <CNav variant="tabs">
              <CNavItem>
                <CNavLink :active="activeTab === 0" @click="activeTab = 0">
                  全局控制
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink :active="activeTab === 1" @click="activeTab = 1">
                  充值库存
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink :active="activeTab === 2" @click="activeTab = 2">
                  性格配置
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink :active="activeTab === 3" @click="activeTab = 3">
                  匹配计划
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink :active="activeTab === 4" @click="activeTab = 4">
                  比赛计划
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink :active="activeTab === 5" @click="activeTab = 5">
                  游戏记录
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink :active="activeTab === 6" @click="activeTab = 6">
                  机器人面板
                </CNavLink>
              </CNavItem>
            </CNav>
            <CTabContent>
              <CTabPane :visible="activeTab === 0">
                <div class="mt-3">
                  <GlobalControl v-if="activeTab === 0" />
                </div>
              </CTabPane>
              <CTabPane :visible="activeTab === 1">
                <div class="mt-3">
                  <ChargeStore v-if="activeTab === 1" />
                </div>
              </CTabPane>
              <CTabPane :visible="activeTab === 2">
                <div class="mt-3">
                  <PersonalityConfig v-if="activeTab === 2" />
                </div>
              </CTabPane>
              <CTabPane :visible="activeTab === 3">
                <div class="mt-3">
                  <GroupPlan v-if="activeTab === 3" />
                </div>
              </CTabPane>
              <CTabPane :visible="activeTab === 4">
                <div class="mt-3">
                  <MatchPlan v-if="activeTab === 4" />
                </div>
              </CTabPane>
              <CTabPane :visible="activeTab === 5">
                <div class="mt-3">
                  <SerialQuery v-if="activeTab === 5" />
                </div>
              </CTabPane>
              <CTabPane :visible="activeTab === 6">
                <div class="mt-3">
                  <RobotPanel v-if="activeTab === 6" />
                </div>
              </CTabPane>
            </CTabContent>
          </CTabs>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GlobalControl from './components/GlobalControl.vue'
import ChargeStore from './components/ChargeStore.vue'
import PersonalityConfig from './components/PersonalityConfig.vue'
import GroupPlan from './components/GroupPlan.vue'
import MatchPlan from './components/MatchPlan.vue'
import SerialQuery from './components/SerialQuery.vue'
import RobotPanel from './components/RobotPanel.vue'

const activeTab = ref(0)
</script>

