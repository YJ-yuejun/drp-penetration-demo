<template>
  <div class="panel block full-page">
    <h2 class="panel-title">风险整改与销号（流程模拟）</h2>
    <p class="desc">点击下方按钮推进状态，用于现场演示「识别 → 预警 → 工单 → 整改 → 销号」闭环。</p>

    <div class="flow">
      <div v-for="s in steps" :key="s.step" class="node panel" :class="{ on: s.step <= active, cur: s.step === active }">
        <div class="num">{{ s.step }}</div>
        <div class="body">
          <strong>{{ s.name }}</strong>
          <p>{{ s.desc }}</p>
        </div>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="btn btn-primary" :disabled="active >= 5" @click="next">推进到下一阶段</button>
      <button type="button" class="btn" :disabled="active <= 1" @click="active--">回退（演示）</button>
      <RouterLink class="btn" to="/work-orders">查看关联工单</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RECTIFICATION_FLOW } from '@/mock/index.js'

const steps = RECTIFICATION_FLOW
const active = ref(3)

function next() {
  if (active.value < 5) active.value += 1
}
</script>

<style scoped>
.block {
  padding: 16px 18px;
  max-width: 1000px;
}
.desc {
  color: var(--text-muted);
  margin-bottom: 16px;
}
.flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.node {
  display: flex;
  gap: 14px;
  padding: 12px 14px;
  opacity: 0.45;
  border-color: rgba(59, 130, 246, 0.15);
}
.node.on {
  opacity: 1;
  border-color: rgba(59, 130, 246, 0.35);
}
.node.cur {
  box-shadow: var(--glow);
}
.num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  background: rgba(59, 130, 246, 0.25);
  color: var(--text);
  flex-shrink: 0;
}
.body p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.actions .btn {
  text-decoration: none;
}
</style>
