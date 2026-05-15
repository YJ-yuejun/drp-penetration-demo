<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- Step 0: 集团财务总览 -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">集团财务总览（演示）</h2>
      <div class="kpi-row">
        <div v-for="k in parsedKPIs" :key="k.label" class="mini panel" :class="{ 'kpi-warn': k.warn }">
          <div class="t">{{ k.label }}</div>
          <div class="v">{{ k.value }}<span class="unit">{{ k.unit }}</span></div>
          <div class="sub" :class="{ red: k.warn }">{{ k.trend }}</div>
        </div>
      </div>
      <div class="row">
        <EChart class="chart" :option="chartRevenue" />
        <EChart class="chart" :option="chartExpense" />
      </div>
    </div>

    <!-- Step 1: 业务板块 -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">按板块查看财务数据</h2>
      <table class="data-table">
        <thead><tr><th>板块</th><th>收入(亿)</th><th>风险评分</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="s in SECTORS" :key="s.id" class="cursor-row" @click="pickSector(s)">
            <td>{{ s.name }}</td><td>{{ s.revenueYi }}</td>
            <td><RiskBadge :level="s.riskScore > 65 ? 'high' : s.riskScore > 50 ? 'medium' : 'low'" /></td>
            <td><span class="link">下钻</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: 子公司 -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">子公司：{{ sector?.name }}</h2>
      <table class="data-table">
        <thead><tr><th>单位</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in companiesInSector" :key="c.id" class="cursor-row" @click="pickCompany(c)">
            <td>{{ c.name }}</td><td><RiskBadge :level="c.risk" /></td>
            <td><span class="link">费用穿透</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 3: 费用科目明细 -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">费用科目：{{ company?.name }}</h2>
      <p class="desc">管理费用偏离度标红，点击行进入凭证层。</p>
      <table class="data-table">
        <thead><tr><th>科目</th><th>预算(万)</th><th>实际(万)</th><th>偏离度</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="e in filteredExpenses" :key="e.id" class="cursor-row" @click="step = 4">
            <td>{{ e.account }}</td><td>{{ e.budgetWan.toLocaleString() }}</td>
            <td :class="{ warn: e.level === 'high' }">{{ e.actualWan.toLocaleString() }}</td>
            <td :class="{ warn: e.level === 'high' }">+{{ e.deviation }}%</td>
            <td><RiskBadge :level="e.level" /></td>
            <td><span class="link">凭证</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 4: 凭证穿透 + 关联图谱 -->
    <div v-else class="panel block">
      <h2 class="panel-title">凭证穿透与关联图谱</h2>
      <div class="row-btm">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>日期</th><th>科目</th><th>金额(万)</th><th>收款方</th><th>风险</th></tr></thead>
            <tbody>
              <tr v-for="v in FINANCE_VOUCHERS" :key="v.id" :class="{ danger: v.risk }">
                <td>{{ v.date }}</td><td>{{ v.account }}</td><td>{{ v.amountWan }}</td><td>{{ v.payee }}</td>
                <td><span v-if="v.risk" class="warn">{{ v.riskNote }}</span><span v-else class="muted">-</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <KnowledgeGraph :graph-data="GRAPH_FINANCE" :height="280" />
      <p class="desc">知识图谱：费用支付方—收款方—关联方网络。高管关联节点已高亮。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DrillStepBar from '@/components/DrillStepBar.vue'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { SECTORS, COMPANIES, FINANCE_KPIS, FINANCE_EXPENSES, FINANCE_VOUCHERS, GRAPH_FINANCE } from '@/mock/index.js'

// 解析 KPI 值为数字+单位
function parseKPI(k) {
  const m = String(k.value).match(/^([\d,+.%]+)\s*(.*)$/)
  return { value: m ? m[1] : k.value, unit: m ? m[2] : '', trend: k.trend, warn: k.warn }
}
const parsedKPIs = FINANCE_KPIS.map(parseKPI)

function parseDeviation(d) {
  return parseFloat(String(d.deviation).replace('%', '').replace('+', ''))
}

const steps = [
  { key: 'f0', label: '集团总览' },
  { key: 'f1', label: '业务板块' },
  { key: 'f2', label: '子公司' },
  { key: 'f3', label: '费用科目' },
  { key: 'f4', label: '凭证/图谱' },
]

const step = ref(0)
const sectorId = ref(null)
const companyId = ref(null)

const sector = computed(() => SECTORS.find(s => s.id === sectorId.value))
const company = computed(() => COMPANIES.find(c => c.id === companyId.value))
const companiesInSector = computed(() => COMPANIES.filter(c => c.sectorId === sectorId.value))
const filteredExpenses = computed(() => FINANCE_EXPENSES.filter(e => e.company === company.value?.name))

const chartRevenue = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 24, top: 40, bottom: 28 },
  xAxis: { type: 'category', data: SECTORS.map(s => s.name), axisLabel: { color: '#8ba3c7', rotate: 20 } },
  yAxis: { type: 'value', name: '亿元', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [
    { name: '营业收入', type: 'bar', data: SECTORS.map(s => s.revenueYi), itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#1d4ed8' }] } } },
    { name: '净利润', type: 'bar', data: [96, 42, 58, 18, 12], itemStyle: { color: '#06b6d4' } },
  ],
}))

const chartExpense = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 8, top: 40, bottom: 28 },
  xAxis: { type: 'category', data: FINANCE_EXPENSES.map(e => e.account.slice(0, 8)), axisLabel: { color: '#8ba3c7', rotate: 25 } },
  yAxis: { type: 'value', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [
    { name: '预算', type: 'bar', data: FINANCE_EXPENSES.map(e => e.budgetWan), itemStyle: { color: '#3b82f6' } },
    { name: '实际', type: 'bar', data: FINANCE_EXPENSES.map(e => e.actualWan), itemStyle: { color: '#f97316' } },
  ],
}))

function pickSector(s) { sectorId.value = s.id; step.value = 2 }
function pickCompany(c) { companyId.value = c.id; step.value = 3 }
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
.kpi-row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.mini { padding: 12px; }
.mini .t { font-size: 12px; color: var(--text-muted); }
.mini .v { font-size: 18px; font-weight: 700; margin-top: 6px; }
.mini .v .unit { font-size: 12px; color: var(--text-muted); margin-left: 2px; }
.mini .sub { font-size: 11px; color: var(--risk-green); margin-top: 4px; }
.mini .sub.red { color: var(--risk-red); }
.kpi-warn { border-color: rgba(239,68,68,0.35); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.row-btm { margin-bottom: 14px; }
.chart { min-height: 260px; }
.link { color: var(--accent); cursor: pointer; }
.muted { color: var(--text-muted); }
.warn { color: var(--risk-red); font-weight: 600; }
.danger { background: rgba(239,68,68,0.08); }
@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } .row { grid-template-columns: 1fr; } }
</style>
