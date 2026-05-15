<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- Step 0: 集团总览 -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">薪酬总额全景（演示）</h2>
      <p class="desc">各板块人均薪酬对比，异常偏离标红。点击板块下钻。</p>
      <div class="row">
        <EChart class="chart" :option="chartBar" />
        <EChart class="chart" :option="chartDeviation" />
      </div>
    </div>

    <!-- Step 1: 业务板块 -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">按板块</h2>
      <table class="data-table">
        <thead><tr><th>板块</th><th>薪酬总额(万)</th><th>人均(万)</th><th>同比变动</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="d in SALARY_DATA" :key="d.sector" class="cursor-row" @click="pickSector(d)">
            <td>{{ d.sector }}</td><td>{{ d.totalSalaryWan.toLocaleString() }}</td>
            <td :class="{ warn: d.warn }">{{ d.avgSalaryWan }}</td>
            <td :class="{ warn: d.warn }">{{ d.deviation }}</td>
            <td><span class="link">下钻</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: 子公司 -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">子公司：{{ sectorName }}</h2>
      <table class="data-table">
        <thead><tr><th>单位</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in companiesInSector" :key="c.id" class="cursor-row" @click="pickCompany(c)">
            <td>{{ c.name }}</td><td><RiskBadge :level="c.risk" /></td>
            <td><span class="link">费用拆解</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 3: 费用科目拆解 -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">费用科目拆解：{{ company?.name }}</h2>
      <p class="desc">非薪酬类科目向自然人高频支付，疑似变相薪酬。</p>
      <table class="data-table">
        <thead><tr><th>编号</th><th>科目</th><th>收款方</th><th>金额(万)</th><th>频率</th><th>风险</th></tr></thead>
        <tbody>
          <tr v-for="a in filteredAnomalies" :key="a.id" :class="{ danger: a.level === 'high' }">
            <td>{{ a.id }}</td><td>{{ a.account }}</td><td>{{ a.payee }}</td>
            <td :class="{ warn: a.level === 'high' }">{{ a.amountWan }}</td>
            <td>{{ a.frequency }}</td>
            <td><RiskBadge :level="a.level" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 4: 异常穿透 + 图谱 -->
    <div v-else class="panel block">
      <h2 class="panel-title">薪酬异常穿透 · 关联图谱</h2>
      <table class="data-table">
        <thead><tr><th>编号</th><th>单位</th><th>科目</th><th>收款方</th><th>风险标签</th><th>等级</th></tr></thead>
        <tbody>
          <tr v-for="a in SALARY_ANOMALIES" :key="a.id" :class="{ danger: a.level === 'high' }">
            <td>{{ a.id }}</td><td>{{ a.company }}</td><td>{{ a.account }}</td><td>{{ a.payee }}</td>
            <td class="warn">{{ a.risk }}</td><td><RiskBadge :level="a.level" /></td>
          </tr>
        </tbody>
      </table>
      <KnowledgeGraph :graph-data="GRAPH_SALARY" :height="280" />
      <p class="desc">知识图谱：支付方—收款自然人—关联企业网络，疑似变相薪酬路径高亮。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DrillStepBar from '@/components/DrillStepBar.vue'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { SECTORS, COMPANIES, SALARY_DATA, SALARY_ANOMALIES, GRAPH_SALARY } from '@/mock/index.js'

// ctx parse deviations from strings like '+4.3%' to numbers
function parseDev(d) { return parseFloat(String(d).replace('%', '').replace('+', '')) }

const steps = [
  { key: 's0', label: '集团总览' },
  { key: 's1', label: '业务板块' },
  { key: 's2', label: '子公司' },
  { key: 's3', label: '费用科目' },
  { key: 's4', label: '异常/图谱' },
]

const step = ref(0)
const sectorId = ref(null)
const companyId = ref(null)

// 板块名到 sectorId 的映射
const sectorMap = { '电力能源': 's1', '装备制造': 's2', '工程建设': 's3', '金融服务': 's4', '科创与其他': 's5' }

const sectorName = computed(() => SALARY_DATA.find(d => d.sector === sectorId.value)?.sector || '')
const company = computed(() => COMPANIES.find(c => c.id === companyId.value))
const companiesInSector = computed(() => {
  const sid = sectorMap[sectorId.value]
  return COMPANIES.filter(c => c.sectorId === sid)
})
const filteredAnomalies = computed(() => SALARY_ANOMALIES.filter(a => a.company === company.value?.name))

const chartBar = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 24, top: 40, bottom: 28 },
  xAxis: { type: 'category', data: SALARY_DATA.map(d => d.sector), axisLabel: { color: '#8ba3c7', rotate: 20 } },
  yAxis: { type: 'value', name: '万元', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [
    { name: '人均薪酬(本年)', type: 'bar', data: SALARY_DATA.map(d => d.avgSalaryWan), itemStyle: { color: '#3b82f6' } },
    { name: '人均薪酬(上年)', type: 'bar', data: SALARY_DATA.map(d => d.lastYearAvg), itemStyle: { color: '#64748b' } },
  ],
}))

const chartDeviation = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 8, top: 40, bottom: 28 },
  xAxis: { type: 'category', data: SALARY_DATA.map(d => d.sector), axisLabel: { color: '#8ba3c7', rotate: 20 } },
  yAxis: { type: 'value', name: '%', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [{
    name: '同比增幅', type: 'bar',
    data: SALARY_DATA.map(d => ({ value: parseDev(d.deviation), itemStyle: { color: d.warn ? '#ef4444' : '#22c55e' } })),
  }],
}))

function pickSector(d) { sectorId.value = d.sector; step.value = 2 }
function pickCompany(c) { companyId.value = c.id; step.value = 3 }
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chart { min-height: 260px; }
.link { color: var(--accent); cursor: pointer; }
.muted { color: var(--text-muted); }
.warn { color: var(--risk-red); font-weight: 600; }
.danger { background: rgba(239,68,68,0.08); }
@media (max-width: 900px) { .row { grid-template-columns: 1fr; } }
</style>
