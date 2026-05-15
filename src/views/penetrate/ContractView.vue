<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- ===== Step 0: 合同总览（增强版） ===== -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">集团合同数据总览</h2>
      <p class="desc">存量合同 {{ contractStats.total }} 份，总额 {{ contractStats.totalAmount }} 亿元。AI 已自动扫描识别高风险条款。</p>
      <div class="kpi-row">
        <div v-for="k in contractKpis" :key="k.label" class="mini panel" :class="{ 'kpi-warn': k.warn }">
          <div class="t">{{ k.label }}</div><div class="v">{{ k.value }}<span class="unit">{{ k.unit }}</span></div>
          <div class="sub" :class="{ red: k.warn }">{{ k.sub }}</div>
        </div>
      </div>
      <div class="row">
        <EChart class="chart" :option="chartOverview" />
        <EChart class="chart" :option="chartRiskDist" />
      </div>
    </div>

    <!-- ===== Step 1: 业务板块 ===== -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">按板块筛选</h2>
      <table class="data-table">
        <thead><tr><th>板块</th><th>合同数</th><th>高风险数</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="s in SECTORS" :key="s.id" class="cursor-row" @click="pickSector(s)">
            <td>{{ s.name }}</td><td>{{ 120 + s.projects * 3 }}</td>
            <td><RiskBadge :level="s.riskScore > 65 ? 'high' : s.riskScore > 50 ? 'medium' : 'low'" /></td>
            <td><span class="link">下钻</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== Step 2: 子公司 ===== -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">子公司列表：{{ sector?.name }}</h2>
      <table class="data-table">
        <thead><tr><th>单位</th><th>所在地</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in companiesInSector" :key="c.id" class="cursor-row" @click="pickCompany(c)">
            <td>{{ c.name }}</td><td>{{ c.city }}</td><td><RiskBadge :level="c.risk" /></td>
            <td><span class="link">查看合同</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== Step 3: 合同列表 ===== -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">合同列表：{{ company?.name }}</h2>
      <table class="data-table">
        <thead><tr><th>编号</th><th>名称</th><th>金额(亿)</th><th>相对方</th><th>NLP 风险</th><th>履约</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="ct in contractsOfCompany" :key="ct.id" class="cursor-row" @click="selectContract(ct)">
            <td>{{ ct.id }}</td><td>{{ ct.name }}</td><td>{{ ct.amountYi }}</td><td>{{ ct.partyB }}</td>
            <td><RiskBadge :level="ct.level" /></td>
            <td><span :class="{ 'perf-warn': ct.id === 'CT-2026-0312' }">{{ ct.performance }}%</span></td>
            <td><span class="link">AI 解析</span></td>
          </tr>
        </tbody>
      </table>
      <p class="desc" style="margin-top:10px">选择合同后，AI 将自动进行 NLP 解析与条款风险识别。</p>
    </div>

    <!-- ===== Step 4: AI NLP 智能解析（核心展示） ===== -->
    <div v-else-if="step === 4" class="panel block">
      <h2 class="panel-title">🤖 AI NLP 智能解析 — {{ contract?.id }} {{ contract?.name }}</h2>

      <!-- AI 思考过程 -->
      <div class="ai-section">
        <div class="ai-header">
          <span class="dot-pulse" />
          <span>AI 智能体分析中 — 正在通过 NLP 引擎解析合同全文...</span>
        </div>
        <div class="thinking-box">
          <div v-for="(t, ti) in nlpThinking" :key="ti" class="think-line" :style="{ animationDelay: ti * 0.15 + 's' }">
            <span class="think-prefix">▸</span> {{ t }}
          </div>
        </div>
      </div>

      <!-- 关键要素提取 -->
      <div v-if="nlpPhase >= 1" class="extraction-box panel inner fade-in">
        <h3>📋 AI 关键要素提取</h3>
        <div class="extract-grid">
          <div v-for="e in detail?.aiExtraction?.keyHighlights || []" :key="e.label" class="extract-item" :class="{ 'extract-risk': e.risk }">
            <span class="extract-label">{{ e.label }}</span>
            <span class="extract-value" :class="{ warn: e.risk }">{{ e.value }}</span>
            <span v-if="e.riskNote" class="extract-note">{{ e.riskNote }}</span>
          </div>
        </div>
      </div>

      <!-- 合同全文 + 风险条款标红 -->
      <div v-if="nlpPhase >= 2" class="contract-text-box panel inner fade-in">
        <h3>📄 合同全文 · 风险条款标红</h3>
        <div v-for="(art, ai) in detail?.fullText || []" :key="ai" class="contract-article" :class="{ 'article-risk': art.content.includes('⚠') }">
          <div class="art-header">
            <span class="art-num">{{ art.article }}</span>
            <RiskBadge v-if="art.content.includes('⚠')" level="high" />
          </div>
          <p class="art-content" v-html="highlightRisk(art.content)" />
        </div>
      </div>

      <!-- 风险条款分析 -->
      <div v-if="nlpPhase >= 3" class="risk-analysis-box fade-in">
        <h3 class="panel-title">🔍 AI 风险条款深度分析</h3>
        <div v-for="(rc, ri) in detail?.riskClauses || []" :key="ri" class="risk-clause-card panel" :style="{ animationDelay: ri * 0.3 + 's' }">
          <div class="rc-header">
            <RiskBadge :level="rc.risk" />
            <span class="rc-clause">{{ rc.clause }}</span>
          </div>
          <div class="rc-body">
            <div class="rc-row">
              <span class="rc-tag analysis">AI 分析</span>
              <span>{{ rc.analysis }}</span>
            </div>
            <div class="rc-row">
              <span class="rc-tag suggestion">修改建议</span>
              <span>{{ rc.suggestion }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="step-actions" v-if="nlpPhase >= 3">
        <button type="button" class="btn btn-primary" @click="step = 5">穿透关联 →</button>
      </div>
    </div>

    <!-- ===== Step 5: 关联穿透 + 履约监控 ===== -->
    <div v-else-if="step === 5" class="panel block">
      <h2 class="panel-title">关联穿透 · 履约监控</h2>

      <!-- 关联穿透 -->
      <div class="section-box fade-in">
        <h3>🔗 合同 — 采购 — 供应商关联穿透</h3>
        <div class="link-cards">
          <div class="link-card panel">
            <div class="lc-title">关联采购订单</div>
            <div class="lc-body" v-if="detail?.relatedProcurement">
              <span>{{ detail.relatedProcurement.id }} {{ detail.relatedProcurement.title }}</span>
              <span class="muted">{{ detail.relatedProcurement.matchNote }}</span>
            </div>
            <span v-else class="muted">未发现关联采购订单</span>
          </div>
          <div class="link-card panel">
            <div class="lc-title">关联合同</div>
            <div class="lc-body" v-if="detail?.relatedContracts?.length">
              <div v-for="rc in detail.relatedContracts" :key="rc.id">
                <span>{{ rc.id }} {{ rc.name }}</span>
                <span class="muted">{{ rc.relation }}</span>
              </div>
            </div>
            <span v-else class="muted">未发现关联合同</span>
          </div>
        </div>
        <KnowledgeGraph :graph-data="GRAPH_CONTRACT" :height="260" />
      </div>

      <!-- 供应商画像 -->
      <div class="section-box fade-in" style="animation-delay: 0.3s">
        <h3>🏢 供应商画像：宏基土木集团</h3>
        <div class="profile-grid">
          <div class="pf-item"><span class="pf-label">注册资本</span><span>{{ supplierProfile.regCapital }}</span></div>
          <div class="pf-item"><span class="pf-label">成立时间</span><span>{{ supplierProfile.established }} 年</span></div>
          <div class="pf-item"><span class="pf-label">员工规模</span><span>{{ supplierProfile.employees }}</span></div>
          <div class="pf-item"><span class="pf-label">信用评级</span><span class="rating">{{ supplierProfile.rating }}</span></div>
          <div class="pf-item"><span class="pf-label">合作年限</span><span>{{ supplierProfile.cooperationYears }} 年</span></div>
          <div class="pf-item"><span class="pf-label">累计签约</span><span>{{ supplierProfile.totalContractAmount }}</span></div>
        </div>
        <div v-if="supplierProfile.riskFlags?.length" class="supplier-risks">
          <div v-for="(f, fi) in supplierProfile.riskFlags" :key="fi" class="supplier-risk-item">
            <span class="warn">⚠</span> {{ f }}
          </div>
        </div>
      </div>

      <!-- 履约监控 -->
      <div class="section-box fade-in" style="animation-delay: 0.6s" v-if="detail?.performance">
        <h3>📈 履约进度监控</h3>
        <div class="perf-overview">
          <div class="perf-bar-wrap">
            <div class="perf-label-row">
              <span>实际交付进度</span><span class="perf-pct">{{ detail.performance.deliveryPercent }}%</span>
            </div>
            <div class="perf-bar-bg"><div class="perf-bar delivery" :style="{ width: detail.performance.deliveryPercent + '%' }" /></div>
          </div>
          <div class="perf-bar-wrap">
            <div class="perf-label-row">
              <span>已付款进度</span><span class="perf-pct" :class="{ warn: detail.performance.overpaymentWarning }">{{ detail.performance.paidPercent }}%</span>
            </div>
            <div class="perf-bar-bg"><div class="perf-bar payment" :class="{ over: detail.performance.overpaymentWarning }" :style="{ width: detail.performance.paidPercent + '%' }" /></div>
          </div>
        </div>

        <!-- 超付预警 -->
        <div v-if="detail.performance.overpaymentWarning" class="overpay-alert panel risk-pulse">
          <span class="alert-icon">🚨</span>
          <div>
            <strong>重大超付预警：付款进度 {{ detail.performance.paidPercent }}% 超前于交付进度 {{ detail.performance.deliveryPercent }}%</strong>
            <p class="alert-detail">合同款项已全额支付 {{ detail.performance.totalPaidYi }} 亿元，但设备交付仅完成 {{ detail.performance.deliveryPercent }}%。甲方已丧失全部资金杠杆，建议立即暂停合同执行，通知采购部冻结后续履约。</p>
          </div>
        </div>

        <!-- 交付明细 -->
        <div class="table-wrap" style="margin-top:12px">
          <table class="data-table">
            <thead><tr><th>交付节点</th><th>计划日期</th><th>实际日期</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="d in detail.performance.deliverables" :key="d.item" :class="{ 'row-delay': d.delay }">
                <td>{{ d.item }}</td><td>{{ d.planned }}</td><td :class="{ warn: d.delay }">{{ d.actual }}</td>
                <td><span v-if="d.done" class="ok">✓ 已完成</span><span v-else class="pending">◷ 进行中</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 付款明细 -->
        <div class="table-wrap" style="margin-top:12px">
          <table class="data-table">
            <thead><tr><th>付款节点</th><th>金额(亿)</th><th>计划日期</th><th>实际日期</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="p in detail.performance.payments" :key="p.phase">
                <td>{{ p.phase }}</td><td>{{ p.amountYi }}</td><td>{{ p.planned }}</td><td>{{ p.actual }}</td>
                <td><span v-if="p.paid" class="ok">✓ 已付</span><span v-else class="pending">待付（建议暂停）</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="step-actions" style="margin-top:16px">
        <button type="button" class="btn btn-primary" @click="generateWorkOrder">生成预警工单 →</button>
      </div>
    </div>

    <!-- ===== Step 6: 生成预警工单（可编辑） ===== -->
    <div v-else class="panel block">
      <h2 class="panel-title">📝 生成预警工单</h2>
      <p class="desc">以下工单由 AI 根据 NLP 解析结果自动生成，您可以修改内容后手动发送。</p>

      <!-- AI 思考 -->
      <div class="thinking-box" v-if="woThinking.length">
        <div class="thinking-header"><span class="dot-pulse" /><span>AI 自动生成工单中...</span></div>
        <div v-for="(t, ti) in woThinking" :key="ti" class="think-line" :style="{ animationDelay: ti * 0.15 + 's' }">
          <span class="think-prefix">▸</span> {{ t }}
        </div>
      </div>

      <!-- 可编辑工单 -->
      <div class="wo-form panel inner fade-in">
        <div class="form-row">
          <label>工单编号</label>
          <input v-model="workOrder.id" class="form-input" type="text" />
        </div>
        <div class="form-row">
          <label>标题</label>
          <input v-model="workOrder.title" class="form-input" type="text" />
        </div>
        <div class="form-row">
          <label>关联合同</label>
          <span class="form-static">{{ contract?.id }} {{ contract?.name }}</span>
        </div>
        <div class="form-row">
          <label>风险摘要</label>
          <textarea v-model="workOrder.summary" class="form-textarea" rows="3" />
        </div>
        <div class="form-row">
          <label>风险等级</label>
          <select v-model="workOrder.level" class="form-select">
            <option value="critical">重大风险</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
          </select>
        </div>
        <div class="form-row">
          <label>责任人</label>
          <input v-model="workOrder.owner" class="form-input" type="text" />
        </div>
        <div class="form-row">
          <label>处置时限</label>
          <input v-model="workOrder.due" class="form-input" type="text" />
        </div>
        <div class="form-row">
          <label>处置建议</label>
          <textarea v-model="workOrder.suggestions" class="form-textarea" rows="4" />
        </div>

        <div class="wo-actions">
          <button type="button" class="btn btn-primary" :disabled="woSent" @click="sendWorkOrder">
            {{ woSent ? '✅ 已发送' : '📤 发送工单' }}
          </button>
          <button type="button" class="btn" @click="resetWorkOrder">重置为 AI 建议</button>
        </div>

        <div v-if="woSent" class="wo-sent-toast panel">
          ✅ 预警工单 {{ workOrder.id }} 已发送至 {{ workOrder.owner }} · 处置截止日期 {{ workOrder.due }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import DrillStepBar from '@/components/DrillStepBar.vue'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { SECTORS, COMPANIES, CONTRACTS, GRAPH_CONTRACT, companyById, CONTRACT_DETAILS, CONTRACT_NLP_STEPS, SUPPLIER_PROFILE } from '@/mock/index.js'

const route = useRoute()
const steps = [
  { key: 'c0', label: '合同总览' },
  { key: 'c1', label: '业务板块' },
  { key: 'c2', label: '子公司' },
  { key: 'c3', label: '合同列表' },
  { key: 'c4', label: 'AI 智能解析（每个条款都可解析）' },
  { key: 'c5', label: '关联/履约' },
  { key: 'c6', label: '生成工单' },
]

const step = ref(0)
const sectorId = ref(null)
const companyId = ref(null)
const contractId = ref(null)

const sector = computed(() => SECTORS.find(s => s.id === sectorId.value))
const company = computed(() => companyById(companyId.value))
const contract = computed(() => CONTRACTS.find(c => c.id === contractId.value))
const detail = computed(() => contractId.value ? CONTRACT_DETAILS[contractId.value] : null)

const companiesInSector = computed(() => COMPANIES.filter(c => c.sectorId === sectorId.value))
const contractsOfCompany = computed(() => CONTRACTS.filter(c => c.companyId === companyId.value))

const supplierProfile = computed(() => contract.value?.partyB ? SUPPLIER_PROFILE[contract.value.partyB] || {} : {})

// AI NLP 流式展示
const nlpThinking = ref([])
const nlpPhase = ref(0)

// 合同统计
const contractStats = computed(() => ({
  total: CONTRACTS.length,
  totalAmount: CONTRACTS.reduce((s, c) => s + c.amountYi, 0),
  highRisk: CONTRACTS.filter(c => c.level === 'high' || c.level === 'critical').length,
}))

const contractKpis = computed(() => [
  { label: '存量合同', value: CONTRACTS.length, unit: '份', sub: '演示子集', warn: false },
  { label: '合同总额', value: contractStats.value.totalAmount, unit: '亿', sub: '', warn: false },
  { label: '高风险合同', value: contractStats.value.highRisk, unit: '份', sub: 'AI 标红', warn: true },
  { label: '本月到期', value: 3, unit: '份', sub: '', warn: false },
  { label: '履约异常', value: 1, unit: '份', sub: '含超付预警', warn: true },
  { label: '平均审批周期', value: 12, unit: '天', sub: '', warn: false },
])

// charts
const chartOverview = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 8, top: 40, bottom: 28 },
  legend: { data: ['合同金额(亿)', '风险得分'], textStyle: { color: '#8ba3c7' } },
  xAxis: { type: 'category', data: CONTRACTS.map(c => c.id), axisLabel: { color: '#8ba3c7', rotate: 25 } },
  yAxis: [
    { type: 'value', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
    { type: 'value', axisLabel: { color: '#8ba3c7' }, splitLine: { show: false } },
  ],
  series: [
    { name: '合同金额(亿)', type: 'bar', data: CONTRACTS.map(c => c.amountYi), itemStyle: { color: '#3b82f6' } },
    { name: '风险得分', type: 'line', yAxisIndex: 1, smooth: true, data: CONTRACTS.map(c => c.level === 'high' ? 72 : c.level === 'medium' ? 45 : 15), itemStyle: { color: '#f97316' } },
  ],
}))

const chartRiskDist = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  series: [{ type: 'pie', radius: ['40%', '68%'], label: { color: '#e8f1ff' },
    data: [
      { value: 3, name: '高风险', itemStyle: { color: '#ef4444' } },
      { value: 5, name: '中风险', itemStyle: { color: '#eab308' } },
      { value: 10, name: '低风险', itemStyle: { color: '#22c55e' } },
    ],
    itemStyle: { borderColor: '#0c1c34', borderWidth: 2 },
  }],
}))

// AI NLP 解析流程
async function runNLPAnalysis() {
  nlpPhase.value = 0
  nlpThinking.value = []

  // Phase 1: 解析
  for (const line of CONTRACT_NLP_STEPS.parse) {
    await sleep(350 + Math.random() * 250)
    nlpThinking.value.push(line)
  }
  nlpPhase.value = 1
  await sleep(400)

  // Phase 2: 合同全文
  nlpPhase.value = 2
  await sleep(400)

  // Phase 3: 风险分析
  for (const line of CONTRACT_NLP_STEPS.analyze) {
    await sleep(400 + Math.random() * 300)
    nlpThinking.value.push(line)
  }
  nlpPhase.value = 3
}

// 选择合同后自动触发 AI 解析
async function selectContract(ct) {
  contractId.value = ct.id
  step.value = 4
  await nextTick()
  runNLPAnalysis()
}

function highlightRisk(text) {
  return text.replace(/⚠.+$/g, '<span class="text-risk">$&</span>')
}

// 工单生成
const woThinking = ref([])
const woSent = ref(false)

const defaultWorkOrder = computed(() => ({
  id: 'WO-2026-0051',
  title: '重大风险合同条款整改 — ' + (contract.value?.id || ''),
  summary: 'NLP 引擎解析发现以下高风险条款：\n1. 预付 100%，无分期保障（第二条）\n2. 缺失质保金条款（第三条）\n3. 违约金上限未明确（第五条）\n\n履约监控发现：付款进度 100% 超前于交付进度 60%，甲方已丧失全部资金杠杆。',
  level: 'critical',
  owner: '采购部-陈某、法务部-周某',
  due: '2026-05-20',
  suggestions: '1. 采购部：立即暂停合同执行，冻结后续履约\n2. 法务部：修改第二条付款方式为分阶段支付（30%-30%-30%-10%）\n3. 采购部：补充质保金条款（建议扣留 8%，约 1,840 万元）\n4. 法务部：明确违约金上限（不超过合同总额 20%）\n5. 审计部：排查 100% 预付是否涉及利益输送',
}))

const workOrder = ref({
  id: '', title: '', summary: '', level: 'high', owner: '', due: '', suggestions: ''
})

async function generateWorkOrder() {
  step.value = 6
  woThinking.value = []
  woSent.value = false
  workOrder.value = { ...defaultWorkOrder.value }

  await nextTick()
  for (const line of CONTRACT_NLP_STEPS.workOrder) {
    await sleep(350 + Math.random() * 200)
    woThinking.value.push(line)
  }
}

function sendWorkOrder() {
  woSent.value = true
}

function resetWorkOrder() {
  workOrder.value = { ...defaultWorkOrder.value }
  woSent.value = false
}

function pickSector(s) { sectorId.value = s.id; step.value = 2 }
function pickCompany(c) { companyId.value = c.id; step.value = 3 }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

watch(
  () => route.query.contractId,
  async (contractId) => {
    const target = CONTRACTS.find((item) => item.id === contractId)
    if (!target) return
    companyId.value = target.companyId
    sectorId.value = companyById(target.companyId)?.sectorId || null
    await selectContract(target)
  },
  { immediate: true }
)
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }

/* KPI */
.kpi-row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.mini { padding: 12px; }
.mini .t { font-size: 12px; color: var(--text-muted); }
.mini .v { font-size: 20px; font-weight: 800; font-family: var(--font-mono); margin-top: 6px; }
.mini .v .unit { font-size: 12px; color: var(--text-muted); margin-left: 2px; }
.mini .sub { font-size: 11px; color: var(--risk-green); margin-top: 4px; }
.mini .sub.red { color: var(--risk-red); }
.kpi-warn { border-color: rgba(239,68,68,0.35); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chart { min-height: 270px; }

/* AI Section */
.ai-section { margin-bottom: 16px; }
.ai-header { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--accent); font-weight: 600; margin-bottom: 8px; }
.thinking-box { background: rgba(59,130,246,0.06); border: 1px dashed rgba(59,130,246,0.2); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.thinking-header { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--accent); margin-bottom: 6px; }
.dot-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: dotPulse 1.2s ease-in-out infinite; }
@keyframes dotPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
.think-line { font-size: 12px; color: var(--text-muted); padding: 3px 0; font-family: var(--font-mono); opacity: 0; animation: fadeSlide 0.5s ease forwards; }
@keyframes fadeSlide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
.think-prefix { color: var(--accent); margin-right: 4px; }

/* Extraction */
.extraction-box { padding: 16px; margin-bottom: 14px; }
.extraction-box h3 { margin: 0 0 12px; font-size: 14px; }
.extract-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.extract-item { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; background: rgba(0,0,0,0.15); }
.extract-risk { border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.06); }
.extract-label { font-size: 11px; color: var(--text-muted); }
.extract-value { font-size: 13px; font-weight: 600; color: var(--text); }
.extract-value.warn { color: var(--risk-red); }
.extract-note { font-size: 11px; color: var(--risk-red); width: 100%; }

/* Contract text */
.contract-text-box { padding: 16px; margin-bottom: 14px; }
.contract-text-box h3 { margin: 0 0 12px; font-size: 14px; }
.contract-article { padding: 10px 0; border-bottom: 1px solid rgba(59,130,246,0.08); }
.contract-article.article-risk { background: rgba(239,68,68,0.04); padding: 10px; border-radius: 6px; margin-bottom: 4px; }
.art-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.art-num { font-size: 12px; font-weight: 700; color: var(--accent); }
.art-content { margin: 0; font-size: 13px; line-height: 1.7; color: var(--text-muted); }
.art-content :deep(.text-risk) { color: #fecaca; background: rgba(239,68,68,0.15); padding: 1px 4px; border-radius: 3px; }

/* Risk analysis */
.risk-analysis-box { margin-bottom: 14px; }
.risk-clause-card { padding: 14px; margin-bottom: 10px; opacity: 0; animation: fadeSlide 0.5s ease forwards; }
.rc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.rc-clause { font-size: 14px; font-weight: 600; color: var(--text); }
.rc-body { display: flex; flex-direction: column; gap: 8px; }
.rc-row { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; line-height: 1.6; color: var(--text-muted); }
.rc-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
.rc-tag.analysis { background: rgba(59,130,246,0.15); color: var(--accent); }
.rc-tag.suggestion { background: rgba(34,197,94,0.15); color: var(--risk-green); }

/* Step 5 */
.section-box { margin-bottom: 18px; }
.section-box h3 { font-size: 14px; margin: 0 0 10px; color: var(--text); }
.link-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.link-card { padding: 12px; }
.lc-title { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.lc-body { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }

.profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.pf-item { padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.15); }
.pf-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
.rating { color: var(--risk-green); font-weight: 600; }
.supplier-risks { display: flex; flex-direction: column; gap: 6px; }
.supplier-risk-item { font-size: 12px; color: var(--risk-red); }

/* Performance */
.perf-overview { display: flex; flex-direction: column; gap: 14px; margin-bottom: 12px; }
.perf-bar-wrap { }
.perf-label-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: var(--text-muted); }
.perf-pct { font-weight: 700; font-family: var(--font-mono); }
.perf-pct.warn { color: var(--risk-red); }
.perf-bar-bg { height: 10px; border-radius: 5px; background: rgba(59,130,246,0.1); overflow: hidden; }
.perf-bar { height: 100%; border-radius: 5px; transition: width 0.8s ease; }
.perf-bar.delivery { background: linear-gradient(90deg, #3b82f6, #06b6d4); }
.perf-bar.payment { background: linear-gradient(90deg, #f97316, #eab308); }
.perf-bar.over { background: linear-gradient(90deg, #ef4444, #f97316); animation: pulseBar 2s ease infinite; }
@keyframes pulseBar { 0%,100%{opacity:1} 50%{opacity:.7} }

.overpay-alert { display: flex; gap: 12px; padding: 14px 16px; margin-bottom: 12px; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.06); }
.alert-icon { font-size: 24px; flex-shrink: 0; }
.overpay-alert strong { color: var(--risk-red); font-size: 14px; display: block; }
.alert-detail { margin: 6px 0 0; font-size: 12px; color: var(--text-muted); line-height: 1.6; }

/* Step 6 Work Order */
.wo-form { padding: 18px; margin-top: 12px; }
.form-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.form-row label { width: 90px; flex-shrink: 0; font-size: 13px; color: var(--text-muted); padding-top: 8px; }
.form-input, .form-select { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: rgba(0,0,0,0.25); color: var(--text); font-size: 13px; }
.form-textarea { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: rgba(0,0,0,0.25); color: var(--text); font-size: 13px; resize: vertical; font-family: inherit; }
.form-static { padding-top: 8px; font-size: 13px; color: var(--text); }
.wo-actions { display: flex; gap: 10px; margin-top: 16px; }
.wo-sent-toast { margin-top: 14px; padding: 12px; border-color: rgba(34,197,94,0.35); color: var(--risk-green); }

/* Misc */
.fade-in { animation: fadeIn 0.5s ease forwards; }
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.step-actions { margin-top: 16px; display: flex; gap: 10px; }
.link { color: var(--accent); cursor: pointer; }
.muted { color: var(--text-muted); font-size: 12px; }
.warn { color: var(--risk-red); font-weight: 600; }
.ok { color: var(--risk-green); }
.pending { color: var(--text-muted); }
.perf-warn { color: var(--risk-red); font-weight: 700; }
.row-delay { background: rgba(234,179,8,0.08); }
.inner { background: rgba(0,0,0,0.2); }

@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 900px) { .row, .extract-grid, .link-cards, .profile-grid { grid-template-columns: 1fr; } .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
