<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- Step 0: 会计质量总览 -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">会计信息质量监控（演示）</h2>
      <p class="desc">各板块会计质量评分，工程建设板块完工百分比估算偏差需重点关注。</p>
      <div class="row">
        <EChart class="chart" :option="chartQuality" />
        <EChart class="chart" :option="chartIssues" />
      </div>
    </div>

    <!-- Step 1: 业务板块 -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">按板块查看会计质量</h2>
      <table class="data-table">
        <thead><tr><th>板块</th><th>质量评分</th><th>问题数</th><th>主要问题</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="q in ACCOUNTING_QUALITY" :key="q.sector" class="cursor-row" @click="pickSector(q)">
            <td>{{ q.sector }}</td>
            <td :class="{ warn: q.score < 80 }">{{ q.score }}</td><td>{{ q.issues }}</td>
            <td>{{ q.details }}</td><td><span class="link">下钻</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: 子公司 -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">子公司：{{ sectorQ?.sector }}</h2>
      <table class="data-table">
        <thead><tr><th>单位</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in companiesInSector" :key="c.id" class="cursor-row" @click="pickCompany(c)">
            <td>{{ c.name }}</td><td><RiskBadge :level="c.risk" /></td>
            <td><span class="link">分录穿透</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 3: 会计分录明细 -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">会计分录：{{ company?.name }}</h2>
      <p class="desc">关键分录自动标记，异常分录标红。点击行查看合规检查结果。</p>
      <table class="data-table">
        <thead><tr><th>编号</th><th>日期</th><th>分录</th><th>金额(万)</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="e in filteredEntries" :key="e.id" class="cursor-row" @click="step = 4" :class="{ danger: e.risk }">
            <td>{{ e.id }}</td><td>{{ e.date }}</td><td class="entry">{{ e.entry }}</td>
            <td>{{ e.amountWan.toLocaleString() }}</td>
            <td><RiskBadge :level="e.risk ? 'high' : 'low'" /></td>
            <td><span class="link">合规检查</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 4: 合规检查 + 政策一致性 -->
    <div v-else class="panel block">
      <h2 class="panel-title">会计政策一致性检查</h2>
      <div class="check-list">
        <div v-for="(c, i) in complianceChecks" :key="i" class="check-item panel" :class="{ fail: !c.pass }">
          <span class="check-icon">{{ c.pass ? '✓' : '✗' }}</span>
          <div>
            <strong>{{ c.label }}</strong>
            <p>{{ c.detail }}</p>
          </div>
        </div>
      </div>
      <div class="table-wrap" style="margin-top:14px">
        <table class="data-table">
          <thead><tr><th>编号</th><th>日期</th><th>分录摘要</th><th>金额(万)</th><th>风险说明</th></tr></thead>
          <tbody>
            <tr v-for="e in ACCOUNTING_ENTRIES.filter(e => e.risk)" :key="e.id">
              <td>{{ e.id }}</td><td>{{ e.date }}</td><td class="entry">{{ e.entry }}</td><td>{{ e.amountWan.toLocaleString() }}</td>
              <td class="warn">{{ e.riskNote }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DrillStepBar from '@/components/DrillStepBar.vue'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import { SECTORS, COMPANIES, ACCOUNTING_QUALITY, ACCOUNTING_ENTRIES } from '@/mock/index.js'

const steps = [
  { key: 'a0', label: '集团总览' },
  { key: 'a1', label: '业务板块' },
  { key: 'a2', label: '子公司' },
  { key: 'a3', label: '分录明细' },
  { key: 'a4', label: '合规检查' },
]

const step = ref(0)
const sectorId = ref(null)
const companyId = ref(null)

// 板块名到 sectorId 的映射
const sectorQ = computed(() => ACCOUNTING_QUALITY.find(q => q.sector === sectorId.value))
const company = computed(() => COMPANIES.find(c => c.id === companyId.value))

const sectorMap = { '电力能源': 's1', '装备制造': 's2', '工程建设': 's3', '金融服务': 's4', '科创与其他': 's5' }
const companiesInSector = computed(() => {
  const sid = sectorMap[sectorId.value]
  return COMPANIES.filter(c => c.sectorId === sid)
})
const filteredEntries = computed(() => ACCOUNTING_ENTRIES.filter(e => e.company === company.value?.name))

const complianceChecks = [
  { label: '收入确认政策一致性', pass: false, detail: '装备制造板块部分单位提前确认收入，合同尚未验收' },
  { label: '完工百分比法应用', pass: false, detail: '工程建设板块完工百分比与实际进度偏离 ≥15%' },
  { label: '研发支出资本化', pass: false, detail: '数字科技公司资本化条件存疑，同行均费用化' },
  { label: '折旧政策一致性', pass: true, detail: '全集团折旧政策一致，无异常' },
  { label: '关联交易定价公允性', pass: true, detail: '本季度未发现显失公允的关联交易' },
]

const chartQuality = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 24, top: 40, bottom: 28 },
  xAxis: { type: 'category', data: ACCOUNTING_QUALITY.map(q => q.sector), axisLabel: { color: '#8ba3c7', rotate: 20 } },
  yAxis: { type: 'value', min: 60, max: 100, name: '分', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [{
    name: '质量评分', type: 'bar',
    data: ACCOUNTING_QUALITY.map(q => ({ value: q.score, itemStyle: { color: q.score >= 90 ? '#22c55e' : q.score >= 80 ? '#eab308' : '#ef4444' } })),
    markLine: { data: [{ yAxis: 80, label: { formatter: '警戒线', color: '#f97316' }, lineStyle: { color: '#f97316', type: 'dashed' } }] },
  }],
}))

const chartIssues = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 8, top: 40, bottom: 28 },
  xAxis: { type: 'category', data: ACCOUNTING_QUALITY.map(q => q.sector), axisLabel: { color: '#8ba3c7', rotate: 20 } },
  yAxis: { type: 'value', name: '个', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [{ name: '问题数', type: 'line', smooth: true, areaStyle: { color: 'rgba(239,68,68,0.2)' }, lineStyle: { color: '#ef4444', width: 2 }, data: ACCOUNTING_QUALITY.map(q => q.issues) }],
}))

function pickSector(q) { sectorId.value = q.sector; step.value = 2 }
function pickCompany(c) { companyId.value = c.id; step.value = 3 }
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chart { min-height: 260px; }
.entry { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.check-list { display: flex; flex-direction: column; gap: 8px; }
.check-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; opacity: 0.7; }
.check-item.fail { opacity: 1; border-color: rgba(239,68,68,0.35); }
.check-icon { font-size: 18px; font-weight: 800; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.check-item:not(.fail) .check-icon { color: var(--risk-green); background: rgba(34,197,94,0.1); }
.check-item.fail .check-icon { color: var(--risk-red); background: rgba(239,68,68,0.1); }
.check-item strong { display: block; margin-bottom: 4px; }
.check-item p { margin: 0; font-size: 12px; color: var(--text-muted); }
.check-item.fail p { color: #fecaca; }
.link { color: var(--accent); cursor: pointer; }
.warn { color: var(--risk-red); font-weight: 600; }
.danger { background: rgba(239,68,68,0.08); }
@media (max-width: 900px) { .row { grid-template-columns: 1fr; } }
</style>
