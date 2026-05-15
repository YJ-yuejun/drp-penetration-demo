<template>
  <div class="panel block full-page">
    <h2 class="panel-title">核查工单管理</h2>
    <p class="desc">支持通过 `riskId / workOrderId` 定位关联工单，便于从驾驶舱或风险中心一键衔接闭环处置。</p>
    <div class="layout">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>工单号</th>
              <th>标题</th>
              <th>关联风险</th>
              <th>责任人</th>
              <th>截止日期</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="w in WORK_ORDERS"
              :key="w.id"
              class="cursor-row"
              :class="{ selected: w.id === selectedId }"
              @click="selectWorkOrder(w.id)"
            >
              <td>{{ w.id }}</td>
              <td>{{ w.title }}</td>
              <td>{{ w.riskId }}</td>
              <td>{{ w.owner }}</td>
              <td>{{ w.due }}</td>
              <td>
                <span class="st" :class="cls(w.status)">{{ w.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="selectedWorkOrder" class="detail panel">
        <div class="detail-id">{{ selectedWorkOrder.id }}</div>
        <h3 class="detail-title">{{ selectedWorkOrder.title }}</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">关联风险</span>
            <strong>{{ selectedWorkOrder.riskId }}</strong>
          </div>
          <div class="detail-item">
            <span class="label">当前状态</span>
            <strong>{{ selectedWorkOrder.status }}</strong>
          </div>
          <div class="detail-item">
            <span class="label">责任人</span>
            <strong>{{ selectedWorkOrder.owner }}</strong>
          </div>
          <div class="detail-item">
            <span class="label">截止日期</span>
            <strong>{{ selectedWorkOrder.due }}</strong>
          </div>
        </div>
        <p class="foot">当前已定位工单：{{ selectedWorkOrder.id }}，可继续联动风险中心或整改页面展示闭环状态。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { WORK_ORDERS } from '@/mock/index.js'

const route = useRoute()
const router = useRouter()

const selectedId = computed(() => {
  const workOrderId = String(route.query.workOrderId || '')
  if (WORK_ORDERS.some((item) => item.id === workOrderId)) return workOrderId
  const riskId = String(route.query.riskId || '')
  return WORK_ORDERS.find((item) => item.riskId === riskId)?.id || WORK_ORDERS[0]?.id || ''
})

const selectedWorkOrder = computed(() =>
  WORK_ORDERS.find((item) => item.id === selectedId.value) || WORK_ORDERS[0] || null
)

function selectWorkOrder(workOrderId) {
  const workOrder = WORK_ORDERS.find((item) => item.id === workOrderId)
  if (!workOrder) return
  router.replace({
    name: 'work-orders',
    query: {
      workOrderId: workOrder.id,
      riskId: workOrder.riskId,
      scene: String(route.query.scene || ''),
    },
  })
}

function cls(status) {
  if (status === '已销号') return 'ok'
  if (status === '整改中' || status === '核查中' || status === '待验收') return 'run'
  return 'wait'
}
</script>

<style scoped>
.block {
  padding: 16px 18px;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(300px, 0.9fr);
  gap: 12px;
}
.desc {
  color: var(--text-muted);
  margin-bottom: 12px;
}
.selected td {
  background: rgba(59, 130, 246, 0.12);
}
.detail {
  padding: 14px 16px;
}
.detail-id {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
}
.detail-title {
  margin: 4px 0 12px;
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
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.12);
}
.label {
  color: var(--text-muted);
  font-size: 12px;
}
.st {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.st.ok {
  color: var(--risk-green);
  border-color: rgba(34, 197, 94, 0.35);
}
.st.run {
  color: var(--risk-orange);
  border-color: rgba(249, 115, 22, 0.35);
}
.st.wait {
  color: var(--risk-yellow);
  border-color: rgba(234, 179, 8, 0.35);
}
.foot {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-muted);
}
@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
