<template>
  <div class="procurement-screen">
    <section class="glass-panel procurement-topbar">
      <div>
        <div class="screen-kicker">全景监管驾驶舱 · 采购穿透</div>
        <h1 class="screen-title">采购全景穿透、围标识别预警、异常关系可溯、工单闭环可追</h1>
        <p class="screen-desc">
          聚焦“围标串标识别”核心场景，围绕同 IP、同 MAC、报价等差、股权/人员关联四维交叉比对，
          打通采购全景、招标项目、投标单位、关联图谱、风险预警、工单派发、合同/资金穿透完整链路。
        </p>
      </div>
      <div class="topbar-meta">
        <div class="meta-card">
          <span class="meta-label">实时时间</span>
          <strong>{{ currentTime }}</strong>
        </div>
        <div class="meta-card success">
          <span class="meta-label">刷新状态</span>
          <strong>{{ refreshText }}</strong>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <article
        v-for="card in summaryCards"
        :key="card.key"
        class="glass-panel kpi-card"
        :class="card.status"
      >
        <div class="kpi-head">
          <span class="kpi-title">{{ card.label }}</span>
          <span class="kpi-chip">{{ statusText(card.status) }}</span>
        </div>
        <div class="kpi-main">
          <strong>{{ displayMetric(card) }}</strong>
          <span>{{ card.unit }}</span>
        </div>
        <div class="kpi-foot">
          <span>{{ card.tip }}</span>
          <span>{{ card.source }}</span>
        </div>
        <svg class="kpi-trend" viewBox="0 0 140 28" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="`proc-kpi-${card.key}`" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0ea5e9" />
              <stop offset="100%" :stop-color="statusColor(card.status)" />
            </linearGradient>
          </defs>
          <polyline
            :points="sparklinePoints(card.trend)"
            :stroke="`url(#proc-kpi-${card.key})`"
            fill="none"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </article>
    </section>

    <section class="visual-grid">
      <div class="glass-panel chart-panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">项目分布柱状图</h2>
            <p class="panel-sub">按五大板块展示招标项目数量，围标风险项目柱体标红；点击柱子自动筛选下方项目列表。</p>
          </div>
          <div class="panel-tags">
            <span class="tag focus">蓝色 全部项目</span>
            <span class="tag danger">红色 围标风险项目</span>
          </div>
        </div>
        <EChart class="visual-chart" :option="boardBarOption" :events="boardChartEvents" />
      </div>

      <div class="glass-panel chart-panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">围标风险等级分布</h2>
            <p class="panel-sub">高风险、可疑、关注、正常四色分布；点击任意扇区联动主表和右侧抽屉。</p>
          </div>
          <div class="panel-tags">
            <span class="tag danger">高风险</span>
            <span class="tag medium">可疑</span>
            <span class="tag watch">关注</span>
            <span class="tag ok">正常</span>
          </div>
        </div>
        <EChart class="visual-chart" :option="riskPieOption" :events="riskPieEvents" />
      </div>
    </section>

    <section class="glass-panel table-panel">
      <div class="panel-head table-head">
        <div>
          <h2 class="panel-title">招标项目列表</h2>
          <p class="panel-sub">主表格承载采购全景与围标识别主交互，点击任意项目自动打开右侧详情抽屉。</p>
        </div>
        <div class="table-summary">
          <span>当前筛选：{{ activeFilterSummary }}</span>
          <span>结果：{{ filteredProjects.length }} 个项目</span>
        </div>
      </div>

      <div class="filter-bar">
        <label>
          <span>采购单位</span>
          <select v-model="unitFilter">
            <option value="all">全部单位</option>
            <option v-for="item in unitOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <span>板块</span>
          <select v-model="boardFilter">
            <option value="all">全部板块</option>
            <option v-for="item in boardOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <span>风险等级</span>
          <select v-model="riskFilter">
            <option value="all">全部等级</option>
            <option v-for="item in riskOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <span>围标概率</span>
          <select v-model="probabilityFilter">
            <option value="all">全部概率</option>
            <option v-for="item in probabilityOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <span>招标状态</span>
          <select v-model="statusFilter">
            <option value="all">全部状态</option>
            <option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
      </div>

      <div class="table-shell">
        <table class="project-table">
          <thead>
            <tr>
              <th>招标编号</th>
              <th>项目名称</th>
              <th>采购单位</th>
              <th>预算金额（亿元）</th>
              <th>投标单位数</th>
              <th>中标单位</th>
              <th>中标金额</th>
              <th>风险等级</th>
              <th>围标概率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredProjects"
              :key="item.id"
              :class="['project-row', rowTone(item.riskLevel), { active: selectedProjectId === item.id }]"
              @click="openProjectDetail(item.id)"
            >
              <td class="mono">{{ item.tenderNo }}</td>
              <td class="align-left">
                <div class="project-name">
                  <span v-if="item.id === demoProjectId" class="live-dot"></span>
                  <strong>{{ item.projectName }}</strong>
                </div>
              </td>
              <td class="align-left">{{ item.procurementUnit }}</td>
              <td>{{ formatYi(item.budgetYi) }}</td>
              <td>{{ item.bidderCount }}</td>
              <td class="align-left">{{ item.winnerName }}</td>
              <td>{{ formatYi(item.winningAmountYi) }}</td>
              <td>
                <span class="risk-pill" :class="riskClass(item.riskLevel)">{{ item.riskLabel }}</span>
              </td>
              <td>
                <div class="probability-cell">
                  <strong>{{ item.collusionProbability }}%</strong>
                  <span class="probability-bar">
                    <em :style="{ width: `${item.collusionProbability}%`, background: probabilityColor(item.collusionProbability) }"></em>
                  </span>
                </div>
              </td>
              <td>
                <div class="action-row">
                  <button type="button" class="op-btn" @click.stop="openProjectDetail(item.id)">查看详情</button>
                  <button type="button" class="op-btn" @click.stop="focusGraph(item.id)">查看图谱</button>
                  <button type="button" class="op-btn primary" @click.stop="dispatchWorkOrder(item)">派发工单</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="glass-panel bottom-panel">
      <div class="bottom-grid">
        <div class="bottom-card">
          <div class="panel-title small">风险研判与预警结论</div>
          <div class="reason-box">
            <div class="reason-title">AI 研判</div>
            <p>
              {{ selectedAnalysis.aiConclusion }}
            </p>
          </div>
          <div class="reason-box">
            <div class="reason-title">命中规则</div>
            <ul class="reason-list">
              <li v-for="item in DRP_RISK_RULE" :key="item.id">{{ item.ruleName }}：{{ item.threshold }}</li>
            </ul>
          </div>
          <div class="bottom-actions">
            <button type="button" class="op-btn primary" @click="openRiskCenter(selectedProject)">查看风险事件</button>
            <button type="button" class="op-btn" @click="openContract(selectedProject)">关联合同</button>
            <button type="button" class="op-btn" @click="openFunds(selectedProject)">关联资金</button>
          </div>
        </div>

        <div class="bottom-card">
          <div class="panel-title small">审计核查工单入口</div>
          <div class="result-metrics">
            <div>
              <span>风险事件</span>
              <strong>{{ activeRiskEvent?.id || '待生成' }}</strong>
            </div>
            <div>
              <span>核查工单</span>
              <strong>{{ activeWorkOrder?.id || '待派发' }}</strong>
            </div>
            <div>
              <span>整改状态</span>
              <strong :class="{ danger: !activeRectification, success: !!activeRectification }">
                {{ activeRectification?.status || '待启动' }}
              </strong>
            </div>
          </div>
          <ul class="timeline-list">
            <li v-for="item in eventTimeline" :key="item.id">
              <span>{{ item.createdAt }}</span>
              <strong>{{ item.title }}</strong>
              <em>{{ item.status }}</em>
            </li>
          </ul>
          <div class="bottom-actions">
            <button type="button" class="op-btn primary" @click="dispatchWorkOrder(selectedProject)">
              {{ activeWorkOrder ? '查看工单' : '派发工单' }}
            </button>
            <button type="button" class="op-btn" @click="openWorkOrder(selectedProject)">核查工单</button>
            <button type="button" class="op-btn" @click="openRectification(selectedProject)">整改闭环</button>
          </div>
        </div>
      </div>
    </section>

    <transition name="alert-rise">
      <div v-if="warningVisible" class="warning-banner">
        <div class="warning-title">围标串标高风险预警</div>
        <div class="warning-text">
          检测到 3 家投标单位 IP/MAC 完全一致、报价呈等差分布、存在股权关联，围标概率 95%。
        </div>
        <div class="warning-actions">
          <button type="button" class="op-btn primary" @click="openProjectDetail(demoProjectId)">查看详情</button>
          <button type="button" class="op-btn" @click="dispatchWorkOrder(selectedProject)">已生成审计核查工单</button>
        </div>
      </div>
    </transition>

    <transition name="drawer-slide">
      <aside v-if="drawerVisible && selectedProject" class="drawer">
        <div class="drawer-head">
          <div>
            <div class="drawer-kicker">采购项目详情抽屉</div>
            <h2>{{ selectedProject.projectName }}</h2>
          </div>
          <button type="button" class="drawer-close" @click="drawerVisible = false">×</button>
        </div>

        <section class="drawer-section">
          <div class="section-title">招标项目基础信息</div>
          <div class="detail-grid">
            <div><span>项目名称</span><strong>{{ selectedProject.projectName }}</strong></div>
            <div><span>招标编号</span><strong>{{ selectedProject.tenderNo }}</strong></div>
            <div><span>预算金额</span><strong>{{ formatYi(selectedProject.budgetYi) }}</strong></div>
            <div><span>采购方式</span><strong>{{ selectedProject.procurementMethod }}</strong></div>
            <div><span>开标时间</span><strong>{{ selectedProject.openBidDate }}</strong></div>
            <div><span>当前状态</span><strong>{{ selectedProject.status }}</strong></div>
          </div>
          <div class="drawer-actions">
            <button type="button" class="op-btn" @click="openContract(selectedProject)">查看关联合同</button>
            <button type="button" class="op-btn" @click="openFunds(selectedProject)">查看关联资金</button>
            <button type="button" class="op-btn" @click="openRiskCenter(selectedProject)">风险事件详情</button>
            <button type="button" class="op-btn" @click="openRectification(selectedProject)">整改闭环</button>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">投标单位明细表</div>
          <div class="drawer-table-shell">
            <table class="bidder-table">
              <thead>
                <tr>
                  <th>投标单位名称</th>
                  <th>报价金额</th>
                  <th>报价排名</th>
                  <th>上传IP</th>
                  <th>上传MAC</th>
                  <th>投标时间</th>
                  <th>实际控制人</th>
                  <th>是否中标</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in selectedProjectBidders"
                  :key="item.id"
                  :class="[
                    'bidder-row',
                    {
                      'same-device': item.sameIp || item.sameMac,
                      arithmetic: selectedAnalysis.arithmeticQuote && item.arithmeticQuote,
                      suspicious: item.suspicious && demoStarted,
                      active: selectedSupplierId === item.supplierId,
                    },
                  ]"
                >
                  <td class="align-left">
                    <div class="supplier-name">
                      <strong>{{ item.supplierName }}</strong>
                      <span v-if="item.suspicious" class="mini-tag danger">围标疑似</span>
                    </div>
                  </td>
                  <td>{{ formatYi(item.quoteAmountYi) }}</td>
                  <td>{{ item.quoteRank }}</td>
                  <td class="mono">{{ item.uploadIp }}</td>
                  <td class="mono">{{ item.uploadMac }}</td>
                  <td>{{ item.bidTime }}</td>
                  <td>{{ item.controllerName }}</td>
                  <td>{{ item.isWinner ? '是' : '否' }}</td>
                  <td>
                    <button type="button" class="op-btn" @click="openSupplierProfile(item.supplierId)">客商画像</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">围标串标四维识别面板</div>
          <div class="dimension-grid">
            <div class="dimension-card" :class="{ hit: selectedAnalysis.sameIp }">
              <span>IP 地址相同</span>
              <strong>{{ yesNo(selectedAnalysis.sameIp) }}</strong>
              <em>{{ selectedAnalysis.sameIp ? selectedAnalysis.sharedIp : '未发现相同 IP' }}</em>
            </div>
            <div class="dimension-card" :class="{ hit: selectedAnalysis.sameMac }">
              <span>MAC 地址相同</span>
              <strong>{{ yesNo(selectedAnalysis.sameMac) }}</strong>
              <em>{{ selectedAnalysis.sameMac ? selectedAnalysis.sharedMac : '未发现相同 MAC' }}</em>
            </div>
            <div class="dimension-card" :class="{ hit: selectedAnalysis.arithmeticQuote }">
              <span>报价等差规律</span>
              <strong>{{ yesNo(selectedAnalysis.arithmeticQuote) }}</strong>
              <em>{{ selectedAnalysis.arithmeticQuote ? `步长 ${selectedAnalysis.quoteStep} 亿元` : '未发现等差规律' }}</em>
            </div>
            <div class="dimension-card" :class="{ hit: selectedAnalysis.shareholdingRelated }">
              <span>股权/人员关联</span>
              <strong>{{ yesNo(selectedAnalysis.shareholdingRelated) }}</strong>
              <em>{{ selectedAnalysis.shareholdingRelated ? '存在共同控制与交叉任职' : '未识别显著关联' }}</em>
            </div>
          </div>
          <div class="ai-box critical">
            <p>【AI 研判】围标串标概率：{{ selectedProject.collusionProbability }}%，{{ selectedAnalysis.aiConclusion }}</p>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">关联客商画像</div>
          <div class="profile-card">
            <div class="profile-head">
              <div>
                <strong>{{ selectedSupplierProfile.name }}</strong>
                <span>{{ selectedSupplierProfile.category }}</span>
              </div>
              <span class="risk-pill" :class="profileRiskClass(selectedSupplierProfile.relationScore)">
                关联分 {{ selectedSupplierProfile.relationScore || 0 }}
              </span>
            </div>
            <div class="detail-grid compact">
              <div><span>实控人</span><strong>{{ selectedSupplierProfile.owner || '-' }}</strong></div>
              <div><span>注册资本</span><strong>{{ selectedSupplierProfile.registeredCapital || '-' }}</strong></div>
              <div><span>注册地址</span><strong>{{ selectedSupplierProfile.address || '-' }}</strong></div>
              <div><span>关注标签</span><strong>{{ (selectedSupplierProfile.tags || []).join(' / ') || '-' }}</strong></div>
            </div>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">关联关系图谱</div>
          <div class="graph-note">
            红色路径为异常关联，支持缩放、拖拽和聚焦；点击节点可定位客商画像。
          </div>
          <KnowledgeGraph
            :graph-data="selectedGraph"
            :height="318"
            :highlight-nodes="graphHighlightNodes"
            :highlight-edges="graphHighlightEdges"
            @select="handleGraphSelect"
          />
        </section>

        <section class="drawer-section">
          <div class="section-title">工单与整改联动</div>
          <div class="detail-grid compact">
            <div><span>风险事件</span><strong>{{ activeRiskEvent?.id || '待生成' }}</strong></div>
            <div><span>核查工单</span><strong>{{ activeWorkOrder?.id || '待派发' }}</strong></div>
            <div><span>责任人</span><strong>{{ activeWorkOrder?.owner || '待指定' }}</strong></div>
            <div><span>整改状态</span><strong>{{ activeRectification?.status || '待启动' }}</strong></div>
          </div>
          <div class="drawer-actions">
            <button type="button" class="op-btn primary" @click="dispatchWorkOrder(selectedProject)">派发工单</button>
            <button type="button" class="op-btn" @click="openWorkOrder(selectedProject)">查看工单</button>
            <button type="button" class="op-btn" @click="openRectification(selectedProject)">整改闭环</button>
          </div>
        </section>
      </aside>
    </transition>

    <transition name="toast-rise">
      <div v-if="toastMessage" class="toast-banner">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EChart from '@/components/EChart.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import {
  DRP_BID_SUPPLIER,
  DRP_PROCUREMENT_OVERVIEW,
  DRP_PROCUREMENT_PROJECT,
  DRP_PROCUREMENT_RECTIFICATION,
  DRP_PROCUREMENT_RELATION_GRAPHS,
  DRP_PROCUREMENT_RESULT,
  DRP_PROCUREMENT_RISK_EVENT,
  DRP_PROCUREMENT_SUPPLIER_PROFILE,
  DRP_PROCUREMENT_WORK_ORDER,
  DRP_RISK_RULE,
  DRP_TENDER,
} from '@/mock/index.js'

const route = useRoute()
const router = useRouter()

const currentTime = ref('')
const refreshText = ref(DRP_PROCUREMENT_OVERVIEW.refreshText)
const animatedMetrics = ref({})
const boardFilter = ref('all')
const unitFilter = ref('all')
const riskFilter = ref('all')
const probabilityFilter = ref('all')
const statusFilter = ref('all')
const drawerVisible = ref(false)
const warningVisible = ref(false)
const demoStarted = ref(false)
const selectedProjectId = ref(DRP_PROCUREMENT_OVERVIEW.defaultProjectId)
const selectedSupplierId = ref('')
const generatedRiskEvents = ref([...DRP_PROCUREMENT_RISK_EVENT])
const generatedWorkOrders = ref([...DRP_PROCUREMENT_WORK_ORDER])
const generatedRectifications = ref([...DRP_PROCUREMENT_RECTIFICATION])
const toastMessage = ref('')

let clockTimer = null
let refreshTimer = null
let toastTimer = null
const demoTimers = []

const demoProjectId = DRP_PROCUREMENT_OVERVIEW.defaultProjectId
const tenderMap = Object.fromEntries(DRP_TENDER.map((item) => [item.projectId, item]))
const resultMap = Object.fromEntries(DRP_PROCUREMENT_RESULT.map((item) => [item.projectId, item]))

const summaryCards = computed(() =>
  DRP_PROCUREMENT_OVERVIEW.kpis.map((item) => ({
    ...item,
    tip: item.status === 'critical' ? '高风险项目持续攀升' : item.status === 'high' ? '重点项目需专项核查' : '采购全景实时刷新',
    source: '来源: 采购项目/招标/投标/结果表',
  }))
)

const allProjects = computed(() =>
  DRP_PROCUREMENT_PROJECT.map((item) => {
    const tender = tenderMap[item.id] || null
    const result = resultMap[item.id] || null
    const bidders = DRP_BID_SUPPLIER
      .filter((bidder) => bidder.projectId === item.id)
      .slice()
      .sort((a, b) => a.quoteRank - b.quoteRank)
    const workOrder = generatedWorkOrders.value.find((record) => record.projectId === item.id) || null
    const riskEvent = generatedRiskEvents.value.find((record) => record.projectId === item.id) || null
    const rectification = workOrder
      ? generatedRectifications.value.find((record) => record.workOrderId === workOrder.id) || null
      : null
    return {
      ...item,
      tender,
      result,
      bidders,
      workOrder,
      riskEvent,
      rectification,
    }
  })
)

const boardOptions = computed(() => Array.from(new Set(allProjects.value.map((item) => item.board))))
const unitOptions = computed(() => Array.from(new Set(allProjects.value.map((item) => item.procurementUnit))))
const riskOptions = ['高风险', '可疑', '关注', '正常']
const probabilityOptions = ['90%以上', '70%-89%', '50%-69%', '50%以下']
const statusOptions = computed(() => Array.from(new Set(allProjects.value.map((item) => item.tenderStatus))))

const filteredProjects = computed(() =>
  allProjects.value.filter((item) => {
    const probabilityMatched = matchProbability(item.collusionProbability, probabilityFilter.value)
    return (unitFilter.value === 'all' || item.procurementUnit === unitFilter.value)
      && (boardFilter.value === 'all' || item.board === boardFilter.value)
      && (riskFilter.value === 'all' || item.riskLabel === riskFilter.value)
      && probabilityMatched
      && (statusFilter.value === 'all' || item.tenderStatus === statusFilter.value)
  })
)

const selectedProject = computed(() =>
  allProjects.value.find((item) => item.id === selectedProjectId.value) || filteredProjects.value[0] || allProjects.value[0] || null
)

const selectedProjectBidders = computed(() => selectedProject.value?.bidders || [])

const selectedAnalysis = computed(() => analyzeBidders(selectedProjectBidders.value, selectedProject.value))

const selectedSupplierProfile = computed(() => {
  const supplierId = selectedSupplierId.value || selectedAnalysis.value.suspiciousSupplierIds[0] || selectedProjectBidders.value[0]?.supplierId || ''
  const bidder = selectedProjectBidders.value.find((item) => item.supplierId === supplierId)
  return DRP_PROCUREMENT_SUPPLIER_PROFILE[supplierId] || {
    supplierId,
    name: bidder?.supplierName || '未选择客商',
    category: '投标单位',
    owner: bidder?.controllerName || '-',
    registeredCapital: '-',
    relationScore: bidder?.suspicious ? 76 : 40,
    address: '-',
    tags: bidder?.tags || [],
  }
})

const selectedGraph = computed(() => {
  const current = DRP_PROCUREMENT_RELATION_GRAPHS[selectedProjectId.value]
  return current || {
    nodes: selectedProjectBidders.value.map((item) => ({ id: item.supplierId, label: item.supplierName, type: 'bidder' })),
    edges: [],
  }
})

const graphHighlightNodes = computed(() => {
  if (!demoStarted.value) return selectedSupplierId.value ? [selectedSupplierId.value] : []
  const focus = new Set(selectedAnalysis.value.suspiciousSupplierIds)
  if (selectedSupplierId.value) focus.add(selectedSupplierId.value)
  if (selectedProjectId.value === demoProjectId) focus.add('ps-004')
  return Array.from(focus)
})

const graphHighlightEdges = computed(() => {
  if (selectedProjectId.value !== demoProjectId || !demoStarted.value) return []
  return [
    { source: 'cp-101', target: 'cp-102' },
    { source: 'cp-102', target: 'cp-103' },
    { source: 'cp-101', target: 'ps-004' },
    { source: 'cp-103', target: 'ps-004' },
  ]
})

const activeRiskEvent = computed(() => selectedProject.value?.riskEvent || null)
const activeWorkOrder = computed(() => selectedProject.value?.workOrder || null)
const activeRectification = computed(() => selectedProject.value?.rectification || null)

const eventTimeline = computed(() => {
  const currentProjectId = selectedProjectId.value
  return generatedRiskEvents.value
    .filter((item) => item.projectId === currentProjectId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

const activeFilterSummary = computed(() => {
  const items = []
  if (unitFilter.value !== 'all') items.push(unitFilter.value)
  if (boardFilter.value !== 'all') items.push(boardFilter.value)
  if (riskFilter.value !== 'all') items.push(riskFilter.value)
  if (probabilityFilter.value !== 'all') items.push(probabilityFilter.value)
  if (statusFilter.value !== 'all') items.push(statusFilter.value)
  return items.length ? items.join(' / ') : '全部项目'
})

const boardBarOption = computed(() => {
  const boards = ['电力能源', '装备制造', '工程建设', '金融服务', '科创与其他']
  const totalData = boards.map((board) => allProjects.value.filter((item) => item.board === board).length)
  const riskData = boards.map((board) =>
    allProjects.value.filter((item) => item.board === board && (item.riskLevel === 'critical' || item.riskLevel === 'high')).length
  )
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['项目数量', '围标风险项目'], textStyle: { color: '#dce7ff' }, top: 0 },
    grid: { left: 44, right: 18, top: 40, bottom: 28 },
    xAxis: {
      type: 'category',
      data: boards,
      axisLabel: { color: '#c6d6ff' },
      axisLine: { lineStyle: { color: 'rgba(125,163,255,0.22)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9db3de' },
      splitLine: { lineStyle: { color: 'rgba(125,163,255,0.12)' } },
    },
    series: [
      {
        name: '项目数量',
        type: 'bar',
        barWidth: 18,
        data: boards.map((board, index) => ({
          value: totalData[index],
          itemStyle: {
            color: board === boardFilter.value ? '#36cfc9' : 'rgba(59,130,246,0.9)',
            borderRadius: [8, 8, 0, 0],
          },
        })),
      },
      {
        name: '围标风险项目',
        type: 'bar',
        barWidth: 12,
        data: boards.map((board, index) => ({
          value: riskData[index],
          itemStyle: {
            color: riskData[index] > 0 ? '#f53f3f' : 'rgba(255,255,255,0.2)',
            shadowColor: riskData[index] > 0 ? 'rgba(245,63,63,0.45)' : 'transparent',
            shadowBlur: riskData[index] > 0 ? 16 : 0,
            borderRadius: [8, 8, 0, 0],
          },
        })),
      },
    ],
  }
})

const riskPieOption = computed(() => {
  const items = [
    { name: '高风险', value: allProjects.value.filter((item) => item.riskLevel === 'critical').length, color: '#f53f3f' },
    { name: '可疑', value: allProjects.value.filter((item) => item.riskLevel === 'high').length, color: '#ff8800' },
    { name: '关注', value: allProjects.value.filter((item) => item.riskLevel === 'medium').length, color: '#facc16' },
    { name: '正常', value: allProjects.value.filter((item) => item.riskLevel === 'low').length, color: '#22c55e' },
  ]
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#dce7ff' } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '44%'],
        label: { color: '#eef4ff', formatter: '{b}\n{c}' },
        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.4)' } },
        itemStyle: { borderColor: 'rgba(4,10,25,0.9)', borderWidth: 4 },
        data: items.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color, shadowBlur: 18, shadowColor: `${item.color}66` },
        })),
      },
    ],
  }
})

const boardChartEvents = {
  click: ({ name }) => {
    if (!name) return
    boardFilter.value = boardFilter.value === name ? 'all' : name
  },
}

const riskPieEvents = {
  click: ({ name }) => {
    if (!name) return
    riskFilter.value = riskFilter.value === name ? 'all' : name
  },
}

watch(
  () => route.query.packageId,
  (packageId) => {
    const targetId = String(packageId || DRP_PROCUREMENT_OVERVIEW.defaultProjectId)
    if (allProjects.value.some((item) => item.id === targetId)) {
      selectedProjectId.value = targetId
      drawerVisible.value = true
    }
  },
  { immediate: true }
)

watch(
  () => route.query.supplierId,
  (supplierId) => {
    if (supplierId) selectedSupplierId.value = String(supplierId)
  },
  { immediate: true }
)

watch(selectedProject, (project) => {
  if (!project) return
  if (!project.bidders.some((item) => item.supplierId === selectedSupplierId.value)) {
    selectedSupplierId.value = analyzeBidders(project.bidders, project).suspiciousSupplierIds[0] || project.bidders[0]?.supplierId || ''
  }
})

watch(filteredProjects, (list) => {
  if (!list.length) return
  if (!list.some((item) => item.id === selectedProjectId.value)) {
    selectedProjectId.value = list[0].id
  }
})

onMounted(() => {
  updateClock()
  clockTimer = window.setInterval(updateClock, 1000)
  refreshTimer = window.setInterval(updateRefreshText, 1000)
  animateKpis()
  runDemo()
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  window.clearInterval(refreshTimer)
  window.clearTimeout(toastTimer)
  demoTimers.forEach((timer) => window.clearTimeout(timer))
})

function updateClock() {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function updateRefreshText() {
  const match = refreshText.value.match(/(\d+)/)
  const next = match ? Number(match[1]) + 1 : 7
  refreshText.value = `数据已刷新 ${String(next).padStart(2, '0')} 秒前`
}

function animateKpis() {
  summaryCards.value.forEach((card) => {
    animatedMetrics.value[card.key] = 0
    const frames = 18
    const stepValue = Number(card.value) / frames
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      animatedMetrics.value[card.key] = count >= frames ? Number(card.value) : Number((stepValue * count).toFixed(1))
      if (count >= frames) window.clearInterval(timer)
    }, 40)
    demoTimers.push(timer)
  })
}

function runDemo() {
  const openTimer = window.setTimeout(() => {
    openProjectDetail(demoProjectId)
    demoStarted.value = true
  }, 2000)
  const warningTimer = window.setTimeout(() => {
    warningVisible.value = true
  }, 2600)
  const workOrderTimer = window.setTimeout(() => {
    showToast('已生成审计核查工单')
  }, 3200)
  demoTimers.push(openTimer, warningTimer, workOrderTimer)
}

function openProjectDetail(projectId) {
  if (!projectId) return
  selectedProjectId.value = projectId
  drawerVisible.value = true
  syncRoute(projectId, selectedSupplierId.value)
}

function focusGraph(projectId) {
  openProjectDetail(projectId)
  showToast('已定位到关联关系图谱')
}

function openSupplierProfile(supplierId) {
  if (!supplierId) return
  selectedSupplierId.value = supplierId
  syncRoute(selectedProjectId.value, supplierId)
  showToast('已定位到关联客商画像')
}

function openContract(project) {
  const target = project?.result?.contractId
  if (!target) {
    showToast('当前项目暂未关联合同')
    return
  }
  router.push({ name: 'contract', query: { contractId: target, packageId: project.id, scene: 'procurement' } })
}

function openFunds(project) {
  const paymentOrderId = project?.result?.paymentOrderId
  if (!paymentOrderId) {
    showToast('当前项目暂无关联资金支付记录')
    return
  }
  router.push({ name: 'funds', query: { paymentOrderId, packageId: project.id, scene: 'procurement' } })
}

function openRiskCenter(project) {
  if (!project?.riskId) {
    showToast('当前项目暂无风险事件详情')
    return
  }
  router.push({
    name: 'risk-center',
    query: {
      riskId: project.riskId,
      workOrderId: project.workOrderId || project.workOrder?.id,
      packageId: project.id,
      scene: 'procurement',
    },
  })
}

function openWorkOrder(project) {
  const workOrder = project?.workOrder || generatedWorkOrders.value.find((item) => item.projectId === project?.id)
  if (!workOrder) {
    dispatchWorkOrder(project)
    return
  }
  router.push({
    name: 'work-orders',
    query: {
      workOrderId: workOrder.id,
      riskId: workOrder.riskId,
      packageId: project.id,
      scene: 'procurement',
    },
  })
}

function openRectification(project) {
  const workOrder = project?.workOrder || generatedWorkOrders.value.find((item) => item.projectId === project?.id)
  if (!workOrder) {
    dispatchWorkOrder(project)
    return
  }
  const rectification = generatedRectifications.value.find((item) => item.workOrderId === workOrder.id)
  router.push({
    name: 'rectification',
    query: {
      workOrderId: workOrder.id,
      rectificationId: rectification?.id,
      riskId: workOrder.riskId,
      packageId: project.id,
      scene: 'procurement',
    },
  })
}

function dispatchWorkOrder(project) {
  if (!project) return
  const existing = generatedWorkOrders.value.find((item) => item.projectId === project.id)
  if (existing) {
    showToast(`已存在核查工单 ${existing.id}`)
    openWorkOrder(project)
    return
  }
  const riskId = project.riskId || 'R06'
  const workOrderId = `WO-2026-${String(generatedWorkOrders.value.length + 60).padStart(4, '0')}`
  const rectificationId = `RC-2026-${String(generatedRectifications.value.length + 30).padStart(4, '0')}`
  const createdAt = new Date().toLocaleString('zh-CN', { hour12: false })

  generatedRiskEvents.value = [
    {
      id: `PRE-2026-${String(generatedRiskEvents.value.length + 20).padStart(4, '0')}`,
      projectId: project.id,
      riskId,
      title: `${project.projectName}围标串标高风险预警`,
      status: '待处置',
      level: project.riskLevel,
      createdAt,
      detail: '系统自动识别同IP/同MAC/等差报价/股权关联并触发专项核查。',
    },
    ...generatedRiskEvents.value,
  ]

  generatedWorkOrders.value = [
    {
      id: workOrderId,
      projectId: project.id,
      riskId,
      title: `${project.projectName}围标核查`,
      status: '已派发',
      owner: '审计部-系统派单',
      due: '2026-05-30',
      rectificationId,
      sourceTable: 'drp_work_order',
    },
    ...generatedWorkOrders.value,
  ]

  generatedRectifications.value = [
    {
      id: rectificationId,
      workOrderId,
      projectId: project.id,
      status: '整改中',
      currentStep: '已自动生成整改任务',
      eta: '2026-06-05',
    },
    ...generatedRectifications.value,
  ]

  showToast(`已派发核查工单 ${workOrderId}`)
}

function handleGraphSelect(payload) {
  if (payload?.type === 'node' && payload.data?.id?.startsWith('cp-')) {
    openSupplierProfile(payload.data.id)
    return
  }
  if (payload?.type === 'edge') {
    showToast(`${payload.data.label}：已高亮关联路径`)
  }
}

function syncRoute(projectId, supplierId) {
  router.replace({
    name: 'procurement',
    query: cleanQuery({
      ...route.query,
      packageId: projectId,
      supplierId,
      scene: 'procurement',
    }),
  })
}

function cleanQuery(query) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function analyzeBidders(bidders, project) {
  const quoteValues = bidders.map((item) => Number(item.quoteAmountYi)).sort((a, b) => a - b)
  const diffs = quoteValues.slice(1).map((value, index) => Number((value - quoteValues[index]).toFixed(2)))
  const sameIpGroups = groupRepeats(bidders.map((item) => item.uploadIp))
  const sameMacGroups = groupRepeats(bidders.map((item) => item.uploadMac))
  const sameIp = sameIpGroups.length > 0
  const sameMac = sameMacGroups.length > 0
  const arithmeticQuote = diffs.length >= 2 && diffs.every((value) => value === diffs[0])
  const shareholdingRelated = bidders.some((item) => item.shareholdingRelated)
  const suspiciousSupplierIds = bidders.filter((item) => item.suspicious).map((item) => item.supplierId)
  const probability = project?.collusionProbability || 0
  let aiConclusion = '建议继续跟踪价格、地址与历史合作轨迹。'
  if (probability >= 90) aiConclusion = '建议立即废标并启动审计核查。'
  else if (probability >= 70) aiConclusion = '建议暂停定标并补充股权穿透核验。'
  else if (probability >= 50) aiConclusion = '建议纳入持续观察清单。'

  return {
    sameIp,
    sameMac,
    arithmeticQuote,
    shareholdingRelated,
    suspiciousSupplierIds,
    sharedIp: sameIp ? sameIpGroups[0] : '',
    sharedMac: sameMac ? sameMacGroups[0] : '',
    quoteStep: arithmeticQuote ? diffs[0].toFixed(2) : '0.00',
    aiConclusion,
  }
}

function groupRepeats(values) {
  const counts = values.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1
    return map
  }, {})
  return Object.keys(counts).filter((key) => counts[key] > 1)
}

function matchProbability(value, bucket) {
  if (bucket === 'all') return true
  if (bucket === '90%以上') return value >= 90
  if (bucket === '70%-89%') return value >= 70 && value < 90
  if (bucket === '50%-69%') return value >= 50 && value < 70
  if (bucket === '50%以下') return value < 50
  return true
}

function displayMetric(card) {
  const value = animatedMetrics.value[card.key]
  if (value === undefined) return card.value
  if (card.unit === '亿元') return Number(value).toFixed(1)
  return Math.round(Number(value)).toLocaleString('zh-CN')
}

function sparklinePoints(values) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)
  return values.map((value, index) => {
    const x = (index / (values.length - 1 || 1)) * 140
    const y = 24 - ((value - min) / range) * 18
    return `${x},${y}`
  }).join(' ')
}

function showToast(message) {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 2400)
}

function yesNo(value) {
  return value ? '是' : '否'
}

function formatYi(value) {
  return `${Number(value).toFixed(2)}`
}

function rowTone(level) {
  return {
    critical: 'tone-critical',
    high: 'tone-high',
    medium: 'tone-medium',
    low: 'tone-low',
  }[level] || 'tone-low'
}

function riskClass(level) {
  return {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  }[level] || 'low'
}

function profileRiskClass(score) {
  if (score >= 90) return 'critical'
  if (score >= 75) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

function probabilityColor(probability) {
  if (probability >= 90) return '#f53f3f'
  if (probability >= 70) return '#ff8800'
  if (probability >= 50) return '#facc16'
  return '#22c55e'
}

function statusText(status) {
  return {
    critical: '红色预警',
    high: '橙色高亮',
    medium: '黄色关注',
    normal: '实时监测',
  }[status] || '实时监测'
}

function statusColor(status) {
  return {
    critical: '#f53f3f',
    high: '#ff8800',
    medium: '#facc16',
    normal: '#22c55e',
  }[status] || '#22c55e'
}
</script>

<style scoped>
.procurement-screen {
  position: relative;
  height: 100%;
  padding: 8px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  color: #edf5ff;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 26%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 24%),
    linear-gradient(180deg, #06101f 0%, #081525 48%, #07111f 100%);
}

.glass-panel {
  position: relative;
  border: 1px solid rgba(116, 154, 255, 0.18);
  background: rgba(8, 20, 40, 0.76);
  box-shadow: 0 16px 38px rgba(2, 8, 23, 0.34), inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.glass-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(64, 146, 255, 0.45), rgba(255, 255, 255, 0.06), rgba(0, 209, 255, 0.35));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.procurement-topbar {
  border-radius: 18px;
  padding: 10px 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-shrink: 0;
}

.screen-kicker,
.drawer-kicker,
.meta-label,
.reason-title,
.graph-note {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #7cc9ff;
  text-transform: uppercase;
}

.screen-title {
  margin: 2px 0 4px;
  font-size: 18px;
  line-height: 1.24;
}

.screen-desc,
.panel-sub,
.graph-note {
  margin: 0;
  font-size: 11px;
  color: rgba(217, 232, 255, 0.78);
  line-height: 1.4;
}

.topbar-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 220px));
  gap: 14px;
}

.meta-card {
  min-height: 90px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(10, 28, 54, 0.8);
  border: 1px solid rgba(82, 130, 232, 0.22);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.meta-card strong {
  font-size: 18px;
  color: #f3f8ff;
}

.meta-card.success {
  box-shadow: inset 0 0 16px rgba(34, 197, 94, 0.15);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  flex-shrink: 0;
}

.kpi-card {
  border-radius: 16px;
  padding: 8px 12px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.kpi-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 18px 36px rgba(2, 8, 23, 0.42);
}

.kpi-card.normal {
  box-shadow: inset 0 0 22px rgba(14, 165, 233, 0.12);
}

.kpi-card.medium {
  box-shadow: inset 0 0 22px rgba(250, 204, 22, 0.14);
}

.kpi-card.high {
  box-shadow: inset 0 0 22px rgba(255, 136, 0, 0.18);
}

.kpi-card.critical {
  box-shadow: inset 0 0 24px rgba(245, 63, 63, 0.2);
}

.kpi-head,
.kpi-foot,
.panel-head,
.table-head,
.drawer-head,
.profile-head,
.warning-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kpi-title {
  font-size: 13px;
  color: #cae0ff;
}

.kpi-chip,
.tag,
.mini-tag,
.risk-pill,
.status-pill,
.tag-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.kpi-chip {
  background: rgba(255, 255, 255, 0.05);
  color: #dce7ff;
}

.kpi-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 14px;
}

.kpi-main strong {
  font-size: 32px;
  line-height: 1;
  text-shadow: 0 0 16px rgba(125, 211, 252, 0.36);
}

.kpi-main span,
.kpi-foot {
  color: rgba(217, 232, 255, 0.76);
  font-size: 12px;
}

.kpi-trend {
  width: 100%;
  height: 30px;
  margin-top: 12px;
}

.visual-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  flex-shrink: 0;
}

.chart-panel,
.drawer {
  border-radius: 16px;
  padding: 10px 14px;
}

.chart-panel {
  padding: 16px 18px 12px;
  display: flex;
  flex-direction: column;
}

.panel-title {
  margin: 0;
  font-size: 18px;
}

.panel-title.small {
  font-size: 16px;
  margin-bottom: 14px;
}

.panel-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255, 255, 255, 0.05);
  color: #dfe9ff;
}

.tag.ok,
.risk-pill.low {
  color: #8df0b0;
  border-color: rgba(34, 197, 94, 0.34);
  background: rgba(34, 197, 94, 0.12);
}

.tag.watch,
.risk-pill.medium {
  color: #ffe387;
  border-color: rgba(250, 204, 22, 0.32);
  background: rgba(250, 204, 22, 0.14);
}

.tag.medium,
.risk-pill.high {
  color: #ffc58f;
  border-color: rgba(255, 136, 0, 0.32);
  background: rgba(255, 136, 0, 0.14);
}

.tag.danger,
.mini-tag.danger,
.risk-pill.critical {
  color: #ffb0b0;
  border-color: rgba(245, 63, 63, 0.38);
  background: rgba(245, 63, 63, 0.14);
}

.tag.focus {
  color: #96deff;
  border-color: rgba(14, 165, 233, 0.32);
  background: rgba(14, 165, 233, 0.12);
}

.visual-chart {
  height: 200px;
  margin-top: 6px;
}

.bottom-panel {
  padding: 10px 14px;
}

.table-panel {
  padding: 10px 14px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-summary {
  display: flex;
  gap: 14px;
  color: rgba(220, 233, 255, 0.76);
  font-size: 13px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.filter-bar label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #bad3fa;
  font-size: 13px;
}

.filter-bar select {
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(108, 143, 223, 0.18);
  background: rgba(8, 20, 40, 0.8);
  color: #edf5ff;
  padding: 0 12px;
  outline: none;
}

.table-shell,
.drawer-table-shell {
  margin-top: 14px;
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(116, 154, 255, 0.14);
  background: rgba(5, 14, 28, 0.68);
}

.project-table,
.bidder-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1180px;
}

.project-table th,
.project-table td,
.bidder-table th,
.bidder-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(116, 154, 255, 0.1);
  text-align: center;
  font-size: 13px;
}

.project-table thead th,
.bidder-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(13, 29, 58, 0.96);
  color: #cfe2ff;
}

.align-left {
  text-align: left !important;
}

.mono {
  font-family: 'Consolas', 'Courier New', monospace;
}

.project-row,
.bidder-row {
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.project-row:hover,
.bidder-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.project-row.active {
  box-shadow: inset 3px 0 0 #36cfc9;
}

.tone-critical {
  background: linear-gradient(90deg, rgba(245, 63, 63, 0.14), transparent 42%);
}

.tone-high {
  background: linear-gradient(90deg, rgba(255, 136, 0, 0.14), transparent 42%);
}

.tone-medium {
  background: linear-gradient(90deg, rgba(250, 204, 22, 0.12), transparent 42%);
}

.tone-low {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.08), transparent 42%);
}

.project-name,
.supplier-name,
.probability-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.probability-cell {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.probability-bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.probability-bar em {
  display: block;
  height: 100%;
  border-radius: inherit;
  box-shadow: 0 0 12px currentColor;
}

.action-row,
.drawer-actions,
.bottom-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.op-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(116, 154, 255, 0.22);
  background: rgba(8, 20, 40, 0.74);
  color: #eaf2ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.op-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(137, 170, 255, 0.42);
}

.op-btn.primary {
  background: linear-gradient(90deg, rgba(36, 99, 235, 0.9), rgba(14, 165, 233, 0.85));
  border-color: transparent;
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.bottom-card {
  border-radius: 18px;
  padding: 16px;
  background: rgba(9, 22, 42, 0.72);
  border: 1px solid rgba(116, 154, 255, 0.14);
}

.reason-box {
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(5, 14, 28, 0.56);
  border: 1px solid rgba(116, 154, 255, 0.12);
  margin-bottom: 12px;
}

.reason-box p {
  margin: 8px 0 0;
  line-height: 1.7;
  color: rgba(237, 245, 255, 0.84);
}

.reason-list,
.timeline-list {
  margin: 10px 0 0;
  padding-left: 18px;
  color: rgba(237, 245, 255, 0.84);
}

.reason-list li,
.timeline-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.result-metrics > div {
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(5, 14, 28, 0.56);
  border: 1px solid rgba(116, 154, 255, 0.12);
}

.result-metrics span,
.detail-grid span {
  display: block;
  color: rgba(187, 206, 238, 0.7);
  font-size: 12px;
}

.result-metrics strong,
.detail-grid strong {
  display: block;
  margin-top: 4px;
  font-size: 15px;
  color: #f6fbff;
}

.result-metrics .danger {
  color: #ff9e9e;
}

.result-metrics .success {
  color: #9af3bf;
}

.warning-banner {
  position: sticky;
  top: 10px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(124, 18, 18, 0.95), rgba(185, 28, 28, 0.88));
  border: 1px solid rgba(248, 113, 113, 0.4);
  box-shadow: 0 16px 32px rgba(127, 29, 29, 0.36);
}

.warning-title {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.warning-text {
  flex: 1;
  line-height: 1.6;
  color: rgba(255, 245, 245, 0.92);
}

.drawer {
  position: fixed;
  top: 72px;
  right: 16px;
  bottom: 16px;
  width: min(720px, calc(100vw - 32px));
  z-index: 24;
  padding: 18px;
  overflow: auto;
  background: rgba(7, 17, 33, 0.96);
}

.drawer-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  font-size: 20px;
}

.drawer-section {
  margin-top: 16px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(116, 154, 255, 0.14);
  background: rgba(10, 23, 43, 0.8);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.detail-grid > div {
  min-height: 72px;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(5, 14, 28, 0.56);
  border: 1px solid rgba(116, 154, 255, 0.1);
}

.detail-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.same-device {
  background: rgba(250, 204, 22, 0.12);
}

.bidder-row.arithmetic {
  box-shadow: inset 0 0 0 1px rgba(255, 196, 0, 0.2);
}

.bidder-row.suspicious {
  background: linear-gradient(90deg, rgba(245, 63, 63, 0.12), rgba(250, 204, 22, 0.08));
}

.bidder-row.active {
  box-shadow: inset 3px 0 0 #36cfc9;
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.dimension-card {
  border-radius: 14px;
  padding: 14px;
  background: rgba(5, 14, 28, 0.56);
  border: 1px solid rgba(116, 154, 255, 0.1);
}

.dimension-card span,
.dimension-card em {
  display: block;
}

.dimension-card strong {
  display: block;
  margin: 8px 0;
  font-size: 20px;
}

.dimension-card em {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(210, 224, 250, 0.72);
}

.dimension-card.hit {
  border-color: rgba(245, 63, 63, 0.26);
  box-shadow: inset 0 0 20px rgba(245, 63, 63, 0.12);
}

.ai-box {
  margin-top: 14px;
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(5, 14, 28, 0.56);
  border: 1px solid rgba(116, 154, 255, 0.12);
}

.ai-box.critical {
  border-color: rgba(245, 63, 63, 0.3);
  background: rgba(67, 10, 10, 0.22);
}

.ai-box p {
  margin: 0;
  line-height: 1.7;
}

.profile-card {
  border-radius: 16px;
  padding: 14px;
  background: rgba(5, 14, 28, 0.56);
  border: 1px solid rgba(116, 154, 255, 0.12);
}

.profile-head strong {
  display: block;
  font-size: 17px;
}

.profile-head span {
  font-size: 12px;
  color: rgba(210, 224, 250, 0.72);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff5252;
  box-shadow: 0 0 12px #ff5252;
  animation: pulse 1.4s infinite ease-in-out;
}

.toast-banner {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 30;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(7, 17, 33, 0.96);
  border: 1px solid rgba(54, 207, 201, 0.32);
  box-shadow: 0 12px 28px rgba(2, 8, 23, 0.42);
}

.alert-rise-enter-active,
.alert-rise-leave-active,
.drawer-slide-enter-active,
.drawer-slide-leave-active,
.toast-rise-enter-active,
.toast-rise-leave-active {
  transition: all 0.28s ease;
}

.alert-rise-enter-from,
.alert-rise-leave-to {
  transform: translateY(-12px);
  opacity: 0;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

.toast-rise-enter-from,
.toast-rise-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.45);
    opacity: 0.45;
  }
}

@media (max-width: 1480px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .visual-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .visual-chart {
    height: 320px;
  }

  .dimension-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .procurement-topbar,
  .topbar-meta {
    flex-direction: column;
    grid-template-columns: 1fr;
  }

  .kpi-grid,
  .filter-bar,
  .dimension-grid,
  .detail-grid,
  .detail-grid.compact,
  .result-metrics {
    grid-template-columns: 1fr;
  }

  .visual-chart {
    height: 280px;
  }

  .warning-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .drawer {
    width: calc(100vw - 20px);
    right: 10px;
    left: 10px;
  }
}
</style>
