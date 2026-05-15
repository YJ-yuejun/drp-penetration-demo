<template>
  <div class="panel block full-page">
    <h2 class="panel-title">风险预警中心</h2>
    <p class="desc">风险条目统一落到风险中心处理；支持定位关联工单，再一键回到对应穿透页面继续演示。</p>
    <div class="row">
      <EChart class="chart" :option="optBar" />
      <div class="right-col">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>类型</th>
                <th>等级</th>
                <th>摘要</th>
                <th>场景</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in RISK_SAMPLES"
                :key="r.id"
                class="cursor-row"
                :class="{ selected: r.id === selectedRiskId }"
                @click="selectRisk(r.id)"
              >
                <td>{{ r.id }}</td>
                <td>{{ r.type }}</td>
                <td><RiskBadge :level="r.level" /></td>
                <td>{{ r.summary }}</td>
                <td>{{ sceneLabel(r.scene) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="selectedRisk" class="detail panel">
          <div class="detail-head">
            <div>
              <div class="detail-id">{{ selectedRisk.id }}</div>
              <h3 class="detail-title">{{ selectedRisk.type }}</h3>
            </div>
            <RiskBadge :level="selectedRisk.level" />
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">所属板块</span>
              <strong>{{ selectedRisk.sector }}</strong>
            </div>
            <div class="detail-item">
              <span class="label">责任单位</span>
              <strong>{{ selectedRisk.company }}</strong>
            </div>
            <div class="detail-item full">
              <span class="label">风险摘要</span>
              <strong>{{ selectedRisk.summary }}</strong>
            </div>
            <div class="detail-item" v-if="relatedWorkOrder">
              <span class="label">关联工单</span>
              <strong>{{ relatedWorkOrder.id }}</strong>
            </div>
            <div class="detail-item" v-if="relatedWorkOrder">
              <span class="label">工单状态</span>
              <strong>{{ relatedWorkOrder.status }}</strong>
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-primary" @click="openWorkOrder">定位工单</button>
            <button type="button" class="btn" @click="openPenetration">打开穿透</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import { RISK_SAMPLES, WORK_ORDERS } from '@/mock/index.js'
import { getPenetrationLocation, getWorkOrderLocation } from '@/utils/navigation.js'

const route = useRoute()
const router = useRouter()

const selectedRiskId = computed(() => {
  const riskId = String(route.query.riskId || '')
  return RISK_SAMPLES.some((item) => item.id === riskId) ? riskId : (RISK_SAMPLES[0]?.id || '')
})

const selectedRisk = computed(() =>
  RISK_SAMPLES.find((item) => item.id === selectedRiskId.value) || RISK_SAMPLES[0] || null
)

const relatedWorkOrder = computed(() => {
  const workOrderId = String(route.query.workOrderId || '')
  if (workOrderId) {
    return WORK_ORDERS.find((item) => item.id === workOrderId) || null
  }
  const location = getWorkOrderLocation(selectedRisk.value)
  return WORK_ORDERS.find((item) => item.id === location.query.workOrderId) || null
})

const types = computed(() => {
  const countMap = {}
  RISK_SAMPLES.forEach((item) => {
    countMap[item.type] = (countMap[item.type] || 0) + 1
  })
  return Object.entries(countMap).map(([name, value]) => ({ name, value }))
})

const optBar = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 132, right: 12, top: 8, bottom: 8 },
  xAxis: {
    type: 'value',
    axisLabel: { color: '#8ba3c7' },
    splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } },
  },
  yAxis: {
    type: 'category',
    data: types.value.map((item) => item.name),
    axisLabel: { color: '#8ba3c7', fontSize: 11 },
  },
  series: [
    {
      type: 'bar',
      data: types.value.map((item) => item.value),
      itemStyle: { color: '#3b82f6', borderRadius: [0, 6, 6, 0] },
    },
  ],
}))

watch(
  () => route.query.riskId,
  (riskId) => {
    if (!riskId && RISK_SAMPLES[0]) {
      selectRisk(RISK_SAMPLES[0].id, false)
    }
  },
  { immediate: true }
)

function selectRisk(riskId, push = true) {
  const risk = RISK_SAMPLES.find((item) => item.id === riskId)
  if (!risk) return
  const workOrderQuery = getWorkOrderLocation(risk).query
  const target = {
    name: 'risk-center',
    query: {
      riskId: risk.id,
      scene: risk.scene,
      workOrderId: workOrderQuery.workOrderId,
    },
  }
  if (push) {
    router.replace(target)
  }
}

function openPenetration() {
  if (!selectedRisk.value) return
  router.push(getPenetrationLocation(selectedRisk.value))
}

function openWorkOrder() {
  if (!selectedRisk.value) return
  router.push(getWorkOrderLocation(selectedRisk.value))
}

function sceneLabel(scene) {
  const labels = {
    investment: '投资穿透',
    funds: '资金穿透',
    finance: '财务穿透',
    property: '产权穿透',
    contract: '合同穿透',
    procurement: '采购穿透',
    salary: '薪酬穿透',
    overseas: '境外穿透',
    banking: '金融穿透',
    accounting: '会计穿透',
  }
  return labels[scene] || scene
}
</script>

<style scoped>
.block {
  padding: 16px 18px;
}
.desc {
  color: var(--text-muted);
  margin-bottom: 12px;
}
.row {
  display: grid;
  grid-template-columns: 0.9fr 1.4fr;
  gap: 12px;
  align-items: stretch;
}
.right-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.chart {
  min-height: 360px;
}
.selected td {
  background: rgba(59, 130, 246, 0.12);
}
.detail {
  padding: 14px 16px;
}
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.detail-id {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.detail-title {
  margin: 4px 0 0;
  font-size: 18px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.12);
}
.detail-item.full {
  grid-column: 1 / -1;
}
.label {
  color: var(--text-muted);
  font-size: 12px;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
@media (max-width: 1000px) {
  .row {
    grid-template-columns: 1fr;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
