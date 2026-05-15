<template>
  <div class="view">
    <DrillStepBar v-model="step" :steps="steps" />

    <!-- Step 0: 集团总览 -->
    <div v-if="step === 0" class="panel block">
      <h2 class="panel-title">集团产权树总览</h2>
      <p class="desc">全级次产权穿透，多层股权嵌套自动标红。点击板块下钻。</p>
      <div class="row">
        <EChart class="chart tall" :option="chartTree" />
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>板块</th><th>控股子公司</th><th>嵌套风险节点</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in SECTORS" :key="s.id" class="cursor-row" @click="pickSector(s)">
                <td>{{ s.name }}</td>
                <td>{{ propCount(s.id) }}</td>
                <td><RiskBadge :level="propRisk(s.id)" /></td>
                <td><span class="link">下钻</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Step 1: 业务板块 -->
    <div v-else-if="step === 1" class="panel block">
      <h2 class="panel-title">板块：{{ sector?.name }}</h2>
      <p class="desc">选择子公司查看股权结构。</p>
      <table class="data-table">
        <thead><tr><th>子公司</th><th>持股比例</th><th>股权层级</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in companiesInSector" :key="c.id" class="cursor-row" @click="pickCompany(c)">
            <td>{{ c.name }}</td>
            <td>{{ c.share || 100 }}%</td>
            <td>{{ c.layers || 1 }}</td>
            <td><RiskBadge :level="c.risk || 'low'" /></td>
            <td><span class="link">穿透股权</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: 子公司股权明细 -->
    <div v-else-if="step === 2" class="panel block">
      <h2 class="panel-title">股权结构：{{ company?.name }}</h2>
      <div class="badges">
        <span class="pill">直接持股：{{ company?.share || 100 }}%</span>
        <RiskBadge :level="company?.risk || 'low'" />
      </div>
      <div class="tree-render">
        <div v-for="n in treeFlat" :key="n.id" class="tnode" :style="{ marginLeft: n.level * 32 + 'px' }" :class="{ warn: n.warn }">
          <span class="tconn" v-if="n.level > 0">└─</span>
          <span class="tlabel">{{ n.label }}</span>
          <span class="tshare">{{ n.share }}%</span>
          <RiskBadge v-if="n.warn" :level="'high'" />
        </div>
      </div>
      <KnowledgeGraph :graph-data="GRAPH_PROPERTY" :height="300" />
      <p class="desc">知识图谱：股权穿透路径，点击节点高亮关联。多层 BVI/开曼架构已标红。</p>
    </div>

    <!-- Step 3: 风险节点 -->
    <div v-else-if="step === 3" class="panel block">
      <h2 class="panel-title">嵌套风险节点（演示）</h2>
      <table class="data-table">
        <thead><tr><th>节点</th><th>穿透路径</th><th>层级</th><th>风险</th><th>说明</th></tr></thead>
        <tbody>
          <tr v-for="r in PROPERTY_RISK_NODES" :key="r.id">
            <td>{{ r.label }}</td>
            <td>{{ r.path }}</td>
            <td>{{ r.layers }} 层</td>
            <td><RiskBadge :level="r.level" /></td>
            <td class="warn">{{ r.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 4: 关联交易 -->
    <div v-else class="panel block">
      <h2 class="panel-title">关联交易穿透</h2>
      <table class="data-table">
        <thead><tr><th>编号</th><th>关联方</th><th>交易类型</th><th>金额(万)</th><th>风险</th><th>操作</th></tr></thead>
        <tbody>
          <tr>
            <td>RT-2026-0041</td><td>某贸易公司</td><td>采购</td><td>3,200</td>
            <td><RiskBadge level="high" /></td>
            <td><span class="link" @click="$router.push('/procurement')">穿透采购</span></td>
          </tr>
          <tr>
            <td>RT-2026-0038</td><td>SPV-A1 (BVI)</td><td>往来款</td><td>8,500</td>
            <td><RiskBadge level="medium" /></td>
            <td><span class="link" @click="$router.push('/funds')">穿透资金</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DrillStepBar from '@/components/DrillStepBar.vue'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { SECTORS, COMPANIES, PROPERTY_TREE, PROPERTY_RISK_NODES, GRAPH_PROPERTY } from '@/mock/index.js'

const steps = [
  { key: 'p0', label: '集团总览' },
  { key: 'p1', label: '业务板块' },
  { key: 'p2', label: '股权结构' },
  { key: 'p3', label: '风险节点' },
  { key: 'p4', label: '关联交易' },
]

const step = ref(0)
const sectorId = ref(null)
const companyId = ref(null)

const sector = computed(() => SECTORS.find(s => s.id === sectorId.value))
const company = computed(() => COMPANIES.find(c => c.id === companyId.value))
const companiesInSector = computed(() => COMPANIES.filter(c => c.sectorId === sectorId.value).map(c => ({
  ...c, share: [100, 100, 85, 100, 100][COMPANIES.indexOf(c)] || 100,
  layers: [3, 2, 3, 3, 1][COMPANIES.indexOf(c)] || 1,
})))

// 简化的子节点计数
const propMap = { s1: 2, s2: 0, s3: 2, s4: 1, s5: 0 }
const riskMap = { s1: 'high', s2: 'low', s3: 'medium', s4: 'low', s5: 'low' }
function propCount(sid) { return propMap[sid] || 0 }
function propRisk(sid) { return riskMap[sid] || 'low' }

function flattenTree(node, level = 0) {
  const result = [{ id: node.id, label: node.label, share: node.share, level, warn: node.type === 'offshore' || node.type === 'spv' }]
  if (node.children) {
    node.children.forEach(c => result.push(...flattenTree(c, level + 1)))
  }
  return result
}

const treeFlat = computed(() => flattenTree(PROPERTY_TREE))

const chartTree = computed(() => {
  const data = [{ name: '集团公司', children: SECTORS.map((s, i) => ({
    name: s.name,
    children: COMPANIES.filter(c => c.sectorId === s.id).map(c => ({
      name: c.name,
      value: c.risk === 'critical' ? 4 : c.risk === 'high' ? 3 : c.risk === 'medium' ? 2 : 1,
      itemStyle: { color: c.risk === 'critical' ? '#ef4444' : c.risk === 'high' ? '#f97316' : c.risk === 'medium' ? '#eab308' : '#22c55e' }
    }))
  })) }]
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{
      type: 'treemap', data, width: '100%', height: '100%', roam: false,
      label: { show: true, color: '#e8f1ff', fontSize: 12 },
      upperLabel: { show: true, height: 28, color: '#8ba3c7' },
      itemStyle: { borderColor: '#0c1c34', borderWidth: 2, gapWidth: 1 },
      levels: [
        { colorMappingBy: 'id', itemStyle: { color: '#0f172a' } },
        { itemStyle: { color: '#1e293b' } },
        { itemStyle: { color: '#334155' } },
      ]
    }]
  }
})

function pickSector(s) { sectorId.value = s.id; step.value = 1 }
function pickCompany(c) { companyId.value = c.id; step.value = 2 }
</script>

<style scoped>
.view { max-width: 1600px; height: 100%; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
.row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; align-items: start; }
.chart { min-height: 280px; }
.chart.tall { min-height: 380px; }
.badges { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.pill { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--text-muted); }
.tree-render { padding: 12px 0; margin-bottom: 16px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.15); }
.tnode { display: flex; align-items: center; gap: 8px; padding: 6px 12px; font-size: 13px; }
.tnode.warn { background: rgba(239,68,68,0.08); }
.tconn { color: var(--text-muted); font-family: var(--font-mono); }
.tlabel { color: var(--text); font-weight: 500; }
.tshare { color: var(--accent); font-family: var(--font-mono); font-size: 12px; }
.link { color: var(--accent); cursor: pointer; }
.warn { color: var(--risk-red); }
@media (max-width: 900px) { .row { grid-template-columns: 1fr; } }
</style>
