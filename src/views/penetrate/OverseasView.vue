<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- Step 0: 全球总览 -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">全球境外资产热力图（演示）</h2>
      <p class="desc">集团境外资产 {{ totalAssets }} 万，覆盖 {{ OVERSEAS_ASSETS.length }} 个国家/地区。点击国别下钻。</p>
      <div class="kpi-row">
        <div v-for="x in overseasKpis" :key="x.label" class="mini panel" :class="{ 'kpi-warn': x.warn }">
          <div class="t">{{ x.label }}</div><div class="v">{{ x.value }}</div>
        </div>
      </div>
      <div class="row">
        <EChart class="chart" :option="chartMap" />
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>国家/地区</th><th>资产(万)</th><th>账户</th><th>项目</th><th>风险</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="a in OVERSEAS_ASSETS" :key="a.country" class="cursor-row" @click="pickCountry(a)">
                <td>{{ a.country }}</td><td>{{ a.assetsWan.toLocaleString() }}</td><td>{{ a.accounts }}</td>
                <td>{{ a.projects }}</td><td><RiskBadge :level="a.riskLevel" /></td>
                <td><span class="link">下钻</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Step 1: 国别详情 -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">{{ country?.country }}</h2>
      <p class="desc">资产 {{ country?.assetsWan?.toLocaleString() }} 万 · {{ country?.riskNote }}</p>
      <EChart class="chart-wide" :option="chartCountry" />
      <div class="actions">
        <button type="button" class="btn btn-primary" @click="step = 2">查看账户明细</button>
        <button type="button" class="btn" @click="step = 3">查看项目穿透</button>
      </div>
    </div>

    <!-- Step 2: 账户明细 -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">境外账户：{{ country?.country }}</h2>
      <table class="data-table">
        <thead><tr><th>账号</th><th>银行</th><th>余额(万)</th><th>币种</th><th>最后活动</th><th>状态</th></tr></thead>
        <tbody>
          <tr v-for="a in filteredAccounts" :key="a.id" :class="{ danger: a.delay }">
            <td>{{ a.id }}</td><td>{{ a.bank }}</td><td>{{ a.balanceWan.toLocaleString() }}</td>
            <td>{{ a.currency }}</td><td>{{ a.lastActivity }}</td>
            <td><span v-if="a.delay" class="warn">回款延迟</span><span v-else class="ok">正常</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 3: 项目穿透 -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">境外项目：{{ country?.country }}</h2>
      <table class="data-table">
        <thead><tr><th>编号</th><th>项目名称</th><th>合同额(亿)</th><th>进度</th><th>风险</th><th>等级</th></tr></thead>
        <tbody>
          <tr v-for="p in filteredProjects" :key="p.id" :class="{ danger: p.level === 'critical' || p.level === 'high' }">
            <td>{{ p.id }}</td><td>{{ p.name }}</td><td>{{ p.contractYi }}</td><td>{{ p.progress }}%</td>
            <td class="warn">{{ p.risk }}</td><td><RiskBadge :level="p.level" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 4: 合规图谱 -->
    <div v-else class="panel block">
      <h2 class="panel-title">跨境合规与资产安全</h2>
      <KnowledgeGraph :graph-data="GRAPH_OVERSEAS" :height="320" />
      <p class="desc">知识图谱：集团—海外公司—SPV—合资方控股链路。BVI/开曼节点已标红。</p>
      <div class="table-wrap" style="margin-top:14px">
        <table class="data-table">
          <thead><tr><th>检查项</th><th>状态</th><th>说明</th></tr></thead>
          <tbody>
            <tr><td>境外账户回款周期监控</td><td class="warn">异常</td><td>东南亚/非洲/BVI 账户延迟 >45天</td></tr>
            <tr><td>跨境资金流动合规</td><td class="ok">通过</td><td>本季度无重大合规问题</td></tr>
            <tr><td>离岸 SPV 穿透核查</td><td class="warn">待核查</td><td>BVI/开曼多层架构实控人需进一步穿透</td></tr>
            <tr><td>ZZ风险国别敞口</td><td class="warn">关注</td><td>非洲某国水电站扩建项目</td></tr>
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
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { OVERSEAS_ASSETS, OVERSEAS_ACCOUNTS, OVERSEAS_PROJECTS, GRAPH_OVERSEAS } from '@/mock/index.js'

const steps = [
  { key: 'o0', label: '全球总览' },
  { key: 'o1', label: '国别详情' },
  { key: 'o2', label: '账户明细' },
  { key: 'o3', label: '项目穿透' },
  { key: 'o4', label: '合规/图谱' },
]

const step = ref(0)
const countryId = ref(null)

const country = computed(() => OVERSEAS_ASSETS.find(a => a.country === countryId.value))
const filteredAccounts = computed(() => OVERSEAS_ACCOUNTS.filter(a => a.country === countryId.value))
const filteredProjects = computed(() => OVERSEAS_PROJECTS.filter(p => p.country === countryId.value))
const totalAssets = computed(() => OVERSEAS_ASSETS.reduce((s, a) => s + a.assetsWan, 0).toLocaleString())

const overseasKpis = computed(() => [
  { label: '境外总资产', value: totalAssets.value + ' 万', warn: false },
  { label: '境外账户', value: OVERSEAS_ACCOUNTS.length + ' 个', warn: false },
  { label: '境外项目', value: OVERSEAS_PROJECTS.length + ' 个', warn: false },
  { label: '延迟账户', value: OVERSEAS_ACCOUNTS.filter(a => a.delay).length + ' 个', warn: true },
])

const chartMap = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 8, top: 24, bottom: 28 },
  xAxis: { type: 'category', data: OVERSEAS_ASSETS.map(a => a.country), axisLabel: { color: '#8ba3c7', rotate: 15 } },
  yAxis: { type: 'value', name: '万', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
  series: [{
    name: '境外资产', type: 'bar',
    data: OVERSEAS_ASSETS.map(a => ({ value: a.assetsWan, itemStyle: { color: a.riskLevel === 'high' ? '#ef4444' : a.riskLevel === 'medium' ? '#eab308' : '#22c55e' } })),
  }],
}))

const chartCountry = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['40%', '65%'],
    label: { color: '#e8f1ff' },
    data: [
      { name: '项目资产', value: filteredProjects.value.reduce((s, p) => s + p.contractYi * 10000, 0) || 50000 },
      { name: '账户余额', value: filteredAccounts.value.reduce((s, a) => s + a.balanceWan, 0) || 30000 },
      { name: '其他', value: (country.value?.assetsWan || 0) * 0.3 },
    ],
    itemStyle: { borderColor: '#0c1c34', borderWidth: 2 },
  }],
}))

function pickCountry(a) { countryId.value = a.country; step.value = 1 }
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.mini { padding: 12px; }
.mini .t { font-size: 12px; color: var(--text-muted); }
.mini .v { font-size: 18px; font-weight: 700; margin-top: 6px; }
.kpi-warn { border-color: rgba(239,68,68,0.35); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chart { min-height: 280px; }
.chart-wide { min-height: 240px; margin-bottom: 14px; }
.actions { display: flex; gap: 10px; }
.link { color: var(--accent); cursor: pointer; }
.muted { color: var(--text-muted); }
.warn { color: var(--risk-red); font-weight: 600; }
.ok { color: var(--risk-green); }
.danger { background: rgba(239,68,68,0.08); }
@media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } .row { grid-template-columns: 1fr; } }
</style>
