<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center">
            <strong>我的信息</strong>
            <CButton color="primary" size="sm" @click="loadDisplay">
              <CIcon icon="cil-reload" class="me-1" />
              刷新
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          <div v-if="loading" class="text-center py-4">
            <CSpinner />
            <div class="mt-2">加载中...</div>
          </div>
          <div v-else-if="errMsg" class="text-center py-4 text-danger">
            {{ errMsg }}
          </div>
          <div v-else>
            <!-- 邀请码 -->
            <CListGroup class="mb-4">
              <CListGroupItem class="d-flex justify-content-between align-items-center">
                <span>邀请码</span>
                <div class="d-flex align-items-center gap-2">
                  <strong class="text-primary">{{ display.leaderTag || '-' }}</strong>
                  <CButton
                    v-if="display.leaderTag"
                    color="secondary"
                    size="sm"
                    @click="copyLeaderTag"
                  >
                    <CIcon icon="cil-copy" class="me-1" />
                    复制
                  </CButton>
                </div>
              </CListGroupItem>
            </CListGroup>

            <!-- 推广关系 -->
            <div v-if="display.relation" class="mb-4">
              <h6 class="mb-3">推广关系</h6>
              <CListGroup>
                <CListGroupItem class="d-flex justify-content-between align-items-center">
                  <span>用户ID</span>
                  <strong>{{ display.relation.userID }}</strong>
                </CListGroupItem>
                <CListGroupItem class="d-flex justify-content-between align-items-center">
                  <span>等级</span>
                  <strong>{{ display.relation.level }}</strong>
                </CListGroupItem>
                <CListGroupItem v-if="display.relation.performance !== undefined" class="d-flex justify-content-between align-items-center">
                  <span>业绩</span>
                  <strong>{{ display.relation.performance }}</strong>
                </CListGroupItem>
                <CListGroupItem class="d-flex justify-content-between align-items-center">
                  <span>直接下级人数</span>
                  <strong>{{ display.relation.subs?.length ?? 0 }} 人</strong>
                </CListGroupItem>
              </CListGroup>

              <template v-if="display.relation.leaders?.length">
                <h6 class="mt-3 mb-2">上级链条（由近及远）</h6>
                <CListGroup>
                  <CListGroupItem class="d-flex flex-wrap gap-2">
                    <CBadge v-for="(id, i) in display.relation.leaders" :key="i" color="info">
                      {{ id }}
                    </CBadge>
                  </CListGroupItem>
                </CListGroup>
              </template>

              <template v-if="display.relation.subs?.length">
                <h6 class="mt-3 mb-2">直接下级用户ID</h6>
                <CListGroup>
                  <CListGroupItem class="d-flex flex-wrap gap-2">
                    <CBadge v-for="(id, i) in display.relation.subs" :key="i" color="secondary">
                      {{ id }}
                    </CBadge>
                  </CListGroupItem>
                </CListGroup>
              </template>
            </div>
            <div v-else class="text-muted small">
              暂无推广关系数据
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userGetdisplay } from '@/web/ProxyReq'
import { Toast } from '@/composables/useToast'
import type { ProxyReqDefine } from 'pp-base-define/ProxyReqDefine'
import ClipboardJS from 'clipboard'

const loading = ref(false)
const errMsg = ref('')
const display = ref<ProxyReqDefine.tUserGetdisplayRes>({
  leaderTag: '',
})

async function loadDisplay() {
  loading.value = true
  errMsg.value = ''
  try {
    const res = await userGetdisplay({})
    if (res.errCode) {
      errMsg.value = res.errMsg || '加载失败'
      return
    }
    display.value = {
      leaderTag: res.leaderTag ?? '',
      relation: res.relation,
    }
  } catch {
    errMsg.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}


let text_:HTMLTextAreaElement
let btn_:HTMLButtonElement
function initClipboard() {
  let mA = document.createElement("textarea")
  document.body.appendChild(mA)
  mA.id = "id_text"
  mA.value = "asd"
  mA.className = "number"
  //mA.style.display = "none"
  text_ = mA

  let mbtn = document.createElement("button")
  document.body.appendChild(mbtn);   
  mbtn.setAttribute("data-clipboard-target","#id_text")
  mbtn.setAttribute("data-clipboard-action","copy")
  mbtn.onclick = ()=>{}
  mbtn.id = "id_copy"
  mbtn.className = "btn"
  mbtn.style.position = "absoulte"
  mbtn.style.display = "none"
  mbtn.style.visibility = "hidden"
  mbtn.style.cursor = "pointer"
  btn_ = mbtn
}
async function copyLeaderTag() {
  const tag = display.value.leaderTag
  if (!tag) return
  try {
    // await navigator.clipboard.writeText(tag)
		if(!text_) {
			initClipboard()
		}
		text_.value = tag
		let entity = new ClipboardJS("#id_copy")
		entity.on("success",function(e) {
		})
		entity.on("error",function(e) {
		})
		btn_.click()
	
		text_.remove()
		btn_.remove()
    // @ts-ignore
		text_ = null 
    // @ts-ignore
		btn_ = null
    Toast.success('已复制到剪贴板', '复制成功')
  } catch(e) {
    console.error('复制邀请码失败', e)
    Toast.error('复制失败', '错误')
  }
}

onMounted(() => {
  loadDisplay()
})
</script>
