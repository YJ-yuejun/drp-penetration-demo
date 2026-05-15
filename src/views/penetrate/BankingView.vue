<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- Step 0: 金融业务总览 -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">集团金融业务总览（演示）</h2>
      <p class="desc">以集团财务公司为视角，展示同业拆借、委托贷款、债券投资、融资租赁、理财等核心金融业务。</p>
      <div class="gauges">
        <div v-for="r in parsedExposures" :key="r.label" class="gauge panel" :class="{ 'gauge-warn': r.warn }">
          <div class="g-label">{{ r.label }}</div>
          <div class="g-value">{{ r.value }}</div>
          <div class="g-bar-bg"><div class="g-bar-fill" :class="{ fillWarn: r.warn || r.usagePct > 90 }" :style="{ width: r.usagePct + '%' }" /></div>
          <div class="g-limit">限额 {{ r.limit }}</div>
        </div>
      </div>
      <EChart class="chart-wide" :option="chartBank" />
    </div>

    <!-- Step 1: 业务类型 -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">按业务类型查看</h2>
      <table class="data-table">
        <thead><tr><th>编号</th><th>类型</th><th>对手方</th><th>金额(亿)</th><th>利率</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="b in BANKING_OVERVIEW" :key="b.id" class="cursor-row" @click="pickBiz(b)">
            <td>{{ b.id }}</td><td>{{ b.type }}</td><td>{{ b.counterparty }}</td><td>{{ b.amountYi }}</td>
            <td>{{ b.rate }}</td><td><RiskBadge :level="b.risk" /></td>
            <td><span class="link">穿透</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: 交易详情 -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">交易详情：{{ biz?.type }}</h2>
      <div class="detail">
        <div class="d-item"><span class="d-label">对手方</span><span>{{ biz?.counterparty }}</span></div>
        <div class="d-item"><span class="d-label">金额</span><span class="big">{{ biz?.amountYi }} 亿</span></div>
        <div class="d-item"><span class="d-label">利率</span><span>{{ biz?.rate }}</span></div>
        <div class="d-item"><span class="d-label">到期日</span><span>{{ biz?.maturity }}</span></div>
        <div class="d-item"><span class="d-label">风险等级</span><RiskBadge :level="biz?.risk || 'low'" /></div>
      </div>
      <p v-if="biz?.riskNote" class="desc warn">{{ biz?.riskNote }}</p>
    </div>

    <!-- Step 3: 风险分析 -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">风险敞口分析</h2>
      <div class="gauges">
        <div v-for="r in parsedExposures" :key="r.label" class="gauge panel" :class="{ 'gauge-warn': r.warn }">
          <div class="g-label">{{ r.label }}</div>
          <div class="g-value">{{ r.value }}</div>
          <div class="g-bar-bg"><div class="g-bar-fill" :class="{ fillWarn: r.warn || r.usagePct > 90 }" :style="{ width: r.usagePct + '%' }" /></div>
          <div class="g-limit">限额 {{ r.limit }}</div>
        </div>
      </div>
    </div>

    <!-- Step 4: 关联图谱 -->
    <div v-else class="panel block">
      <h2 class="panel-title">金融业务关联图谱</h2>
      <KnowledgeGraph :graph-data="GRAPH_BANKING" :height="300" />
      <p class="desc">知识图谱：财务公司—对手方资金链路。债券投资对手方评级下调已标红。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DrillStepBar from '@/components/DrillStepBar.vue'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { BANKING_OVERVIEW, BANKING_RISK_EXPOSURES, GRAPH_BANKING } from '@/mock/index.js'

// 解析 risk exposures 的字符串值
const parsedExposures = BANKING_RISK_EXPOSURES.map(r => {
  const valStr = String(r.value)
  const numMatch = valStr.match(/^([\d.]+)/)
  const unitMatch = valStr.match(/[亿%]+/)
  const usageRaw = String(r.usage || '')
  const usageMatch = usageRaw.match(/^([\d.]+)/)
  return {
    ...r,
    numVal: numMatch ? parseFloat(numMatch[1]) : 0,
    unit: unitMatch ? unitMatch[0] : '',
    usagePct: usageMatch ? parseFloat(usageMatch[1]) : 0,
  }
})

const steps = [
  { key: 'b0', label: '总览' },
  { key: 'b1', label: '业务类型' },
  { key: 'b2', label: '交易详情' },
  { key: 'b3', label: '风险分析' },
  { key: 'b4', label: '关联图谱' },
]

const route = useRoute()
const step = ref(0)
const bizId = ref(null)

const biz = computed(() => BANKING_OVERVIEW.find(b => b.id === bizId.value))

const chartBank = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 8, top: 24, bottom: 28 },
  xAxis: { type: 'category', data: BANKING_OVERVIEW.map(b => b.type), axisLabel: { color: '#8ba3c7', rotate: 20 } },
  yAxis: { type: 'value', name: '亿', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [{
    name: '金额', type: 'bar',
    data: BANKING_OVERVIEW.map(b => ({ value: b.amountYi, itemStyle: { color: b.risk === 'high' ? '#ef4444' : b.risk === 'medium' ? '#eab308' : '#3b82f6' } })),
  }],
}))

function pickBiz(b) { bizId.value = b.id; step.value = 2 }

function applyRouteQuery() {
  const biz = BANKING_OVERVIEW.find((item) => item.id === route.query.businessId)
  if (!biz) return
  bizId.value = biz.id
  step.value = 2
}

watch(
  () => route.query.businessId,
  () => applyRouteQuery(),
  { immediate: true }
)
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
.desc.warn { color: var(--risk-red); }
.gauges { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.gauge { padding: 14px; }
.gauge-warn { border-color: rgba(239,68,68,0.35); }
.g-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.g-value { font-size: 20px; font-weight: 800; font-family: var(--font-mono); }
.g-bar-bg { height: 6px; border-radius: 3px; background: rgba(59,130,246,0.12); margin: 10px 0 4px; }
.g-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #3b82f6, #06b6d4); transition: width 0.4s; }
.g-bar-fill.fillWarn { background: linear-gradient(90deg, #f97316, #ef4444); }
.g-limit { font-size: 11px; color: var(--text-muted); }
.chart-wide { min-height: 260px; }
.detail { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.d-item { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.15); }
.d-label { font-size: 12px; color: var(--text-muted); }
.big { font-size: 18px; font-weight: 700; font-family: var(--font-mono); }
.link { color: var(--accent); cursor: pointer; }
.muted { color: var(--text-muted); }
.warn { color: var(--risk-red); font-weight: 600; }
@media (max-width: 1000px) { .gauges { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .gauges { grid-template-columns: 1fr; } .detail { grid-template-columns: 1fr; } }
</style>
