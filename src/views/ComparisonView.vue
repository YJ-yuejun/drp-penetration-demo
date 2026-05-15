<template>
  <div class="comp-view">
    <!-- 标题 -->
    <section class="panel hero">
      <h1 class="hero-title">DRP 穿透式监管 · 价值对比</h1>
      <p class="hero-sub">从「看不见、管不住」到「看得见、管得住」—— 数字化监管的范式转变</p>
    </section>

    <!-- 核心对比卡片 -->
    <div class="grid-2">
      <section class="panel before-box">
        <h2 class="panel-title dim">❌ 没有 DRP 时</h2>
        <div class="stat-grid">
          <div v-for="s in beforeStats" :key="s.label" class="stat">
            <div class="stat-val red">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
        <div class="pain-list">
          <div v-for="p in painPoints" :key="p" class="pain-item">
            <span class="pain-icon">✗</span> {{ p }}
          </div>
        </div>
      </section>

      <section class="panel after-box">
        <h2 class="panel-title bright">✅ 有了 DRP 后</h2>
        <div class="stat-grid">
          <div v-for="s in afterStats" :key="s.label" class="stat">
            <div class="stat-val green">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
        <div class="gain-list">
          <div v-for="g in gainPoints" :key="g" class="gain-item">
            <span class="gain-icon">✓</span> {{ g }}
          </div>
        </div>
      </section>
    </div>

    <!-- 量化对比表 -->
    <section class="panel block">
      <h2 class="panel-title">核心指标对比</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>指标</th><th class="col-bad">无 DRP</th><th class="col-good">有 DRP</th><th>提升</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in comparisonRows" :key="r.metric">
              <td class="metric-name">{{ r.metric }}</td>
              <td class="bad">{{ r.before }}</td>
              <td class="good">{{ r.after }}</td>
              <td class="improve">{{ r.improvement }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 场景对比 -->
    <section class="panel block">
      <h2 class="panel-title">典型场景对比</h2>
      <div class="scene-grid">
        <div v-for="s in sceneComparisons" :key="s.title" class="scene-card panel">
          <h3 class="scene-title">{{ s.title }}</h3>
          <div class="scene-vs">
            <div class="scene-before">
              <div class="scene-label">过去</div>
              <p>{{ s.before }}</p>
            </div>
            <div class="scene-divider">→</div>
            <div class="scene-after">
              <div class="scene-label">现在</div>
              <p>{{ s.after }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 行动号召 -->
    <section class="panel cta">
      <div class="cta-content">
        <h2>2030 年倒计时</h2>
        <p class="cta-desc">
          国务院国资委明确要求：到 2030 年，中央企业基本建成穿透式监管体系。<br/>
          您的企业，走到哪一步了？
        </p>
        <div class="cta-timeline">
          <div v-for="(t, i) in timeline" :key="i" class="tl-node" :class="{ done: t.done, current: t.current }">
            <div class="tl-dot" />
            <div class="tl-year">{{ t.year }}</div>
            <div class="tl-label">{{ t.label }}</div>
          </div>
        </div>
        <div class="cta-actions">
          <RouterLink class="btn btn-primary btn-lg" to="/">返回驾驶舱体验穿透式监管</RouterLink>
          <RouterLink class="btn" to="/smart">体验 AI 智能体</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const beforeStats = [
  { label: '信息获取时间', value: '3-5 天' },
  { label: '风险发现率', value: '<30%' },
  { label: '检查覆盖率', value: '抽样 15%' },
  { label: '问题闭环周期', value: '45-90 天' },
  { label: '跨系统数据一致性', value: '不可保证' },
  { label: '穿透深度', value: '最多 2 级' },
]

const afterStats = [
  { label: '信息获取时间', value: '<30 秒' },
  { label: '风险发现率', value: '>85%' },
  { label: '检查覆盖率', value: '全量 100%' },
  { label: '问题闭环周期', value: '7-14 天' },
  { label: '跨系统数据一致性', value: '实时校验' },
  { label: '穿透深度', value: '无限级次' },
]

const painPoints = [
  '各系统数据割裂，集团领导想看全貌需要等各板块手工汇总',
  '风险发现靠审计抽查，大量问题永远发现不了',
  '发现问题后靠电话邮件催办，闭环周期以月计',
  '股权嵌套、关联交易等复杂关系依赖人工梳理，效率极低',
  '境外资产管理基本靠报表，资金延迟数月才发现',
]

const gainPoints = [
  '一屏统揽：驾驶舱实时展示全集团经营态势，信息获取从天级到秒级',
  '全量监测：规则引擎 7×24 自动扫描，从"抽样检查"到"全量监测"',
  '自动闭环：AI 预警 → 自动派单 → 限期整改 → 验收销号，全流程线上化',
  '知识图谱：秒级呈现多层股权、关联交易、围标串标关系网络',
  '境外穿透：全球资产热力图 + 账户实时余额 + 跨境合规一键检查',
]

const comparisonRows = [
  { metric: '信息获取时间', before: '3-5 天', after: '<30 秒', improvement: '提升 99.7%' },
  { metric: '风险发现率', before: '<30%', after: '>85%', improvement: '提升 2.8 倍' },
  { metric: '检查覆盖率', before: '抽样 ~15%', after: '全量 100%', improvement: '提升 6.7 倍' },
  { metric: '闭环周期', before: '45-90 天', after: '7-14 天', improvement: '缩短 80%' },
  { metric: '穿透深度', before: '≤2 级次', after: '无限级次', improvement: '质的飞跃' },
  { metric: '预警联动', before: '人工邮件', after: '自动派单+超期升级', improvement: '全自动化' },
  { metric: 'AI 辅助', before: '无', after: '智能问数+主动预警+决策建议', improvement: '从 0 到 1' },
]

const sceneComparisons = [
  {
    title: '发现大额异常支付',
    before: '审计部每季度抽查 5% 凭证，9200 万异常支付可能 3 个月后才被发现，资金早已转出。',
    after: '司库系统实时拦截，AI 秒级发现 → 自动冻结 → 推送到 CFO 审批，资金安全零时差。',
  },
  {
    title: '识别围标串标',
    before: '评标专家人工审核资质文件，IP/MAC 信息不比对，三家围标单位轻松过关。',
    after: '投标文件自动交叉比对 IP/MAC/报价/股权，AI 围标概率 0.94，自动暂停开标。',
  },
  {
    title: '穿透股权嵌套',
    before: '法务部手动查阅工商档案，5 层 BVI/开曼架构需要数周才能理清。',
    after: '知识图谱秒级展开多层股权树，实际控制人一键溯源，离岸 SPV 无处遁形。',
  },
  {
    title: '监控境外资产',
    before: '境外项目按月报汇总报表，东南亚某账户回款延迟 45 天，集团 2 个月后才知情。',
    after: '全球资产热力图实时展示，境外账户余额 T+1 可见，回款延迟自动标红预警。',
  },
]

const timeline = [
  { year: '2025', label: '政策出台', done: true, current: false },
  { year: '2026', label: '试点建设（当前）', done: true, current: true },
  { year: '2027', label: '全面推广', done: false, current: false },
  { year: '2028', label: '深化应用', done: false, current: false },
  { year: '2029', label: '持续优化', done: false, current: false },
  { year: '2030', label: '基本建成', done: false, current: false },
]
</script>

<style scoped>
.comp-view { max-width: 1400px; display: flex; flex-direction: column; gap: 14px; height: 100%; overflow-y: auto; padding: 12px 16px; }

.hero {
  padding: 32px 24px;
  text-align: center;
  background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.08));
}
.hero-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub { margin: 0; color: var(--text-muted); font-size: 15px; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.before-box {
  padding: 20px;
  border-color: rgba(239,68,68,0.2);
  background: linear-gradient(180deg, rgba(239,68,68,0.05), rgba(0,0,0,0.1));
}
.before-box .panel-title.dim { color: var(--text-muted); }
.before-box .panel-title.dim::before { background: linear-gradient(180deg, #ef4444, #f97316); }

.after-box {
  padding: 20px;
  border-color: rgba(34,197,94,0.25);
  background: linear-gradient(180deg, rgba(34,197,94,0.06), rgba(0,0,0,0.1));
}
.after-box .panel-title.bright { color: var(--text); }
.after-box .panel-title.bright::before { background: linear-gradient(180deg, #22c55e, #06b6d4); }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.stat { text-align: center; padding: 8px; }
.stat-val { font-size: 20px; font-weight: 800; font-family: var(--font-mono); }
.stat-val.red { color: var(--risk-red); }
.stat-val.green { color: var(--risk-green); }
.stat-label { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

.pain-list, .gain-list { display: flex; flex-direction: column; gap: 8px; }
.pain-item, .gain-item { font-size: 13px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
.pain-item { color: var(--text-muted); }
.gain-item { color: var(--text); }
.pain-icon { color: var(--risk-red); flex-shrink: 0; }
.gain-icon { color: var(--risk-green); flex-shrink: 0; font-weight: 700; }

/* Table */
.block { padding: 16px 20px; }
.col-bad { color: #fca5a5 !important; }
.col-good { color: #86efac !important; }
.metric-name { color: var(--text); font-weight: 500; }
.bad { color: var(--risk-red); font-family: var(--font-mono); }
.good { color: var(--risk-green); font-family: var(--font-mono); font-weight: 600; }
.improve { color: var(--accent); font-weight: 700; }

/* Scene cards */
.scene-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.scene-card { padding: 16px; }
.scene-title { margin: 0 0 12px; font-size: 14px; color: var(--text); }
.scene-vs { display: flex; gap: 12px; align-items: stretch; }
.scene-before, .scene-after { flex: 1; }
.scene-label { font-size: 11px; font-weight: 600; margin-bottom: 6px; }
.scene-before .scene-label { color: var(--risk-red); }
.scene-after .scene-label { color: var(--risk-green); }
.scene-before p, .scene-after p { margin: 0; font-size: 12px; line-height: 1.6; }
.scene-before p { color: var(--text-muted); }
.scene-after p { color: var(--text); }
.scene-divider {
  display: flex; align-items: center;
  color: var(--accent); font-size: 20px; font-weight: 700;
  flex-shrink: 0;
}

/* CTA */
.cta {
  padding: 32px 24px;
  text-align: center;
  background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.1));
}
.cta-content { max-width: 700px; margin: 0 auto; }
.cta h2 { margin: 0 0 8px; font-size: 22px; }
.cta-desc { color: var(--text-muted); font-size: 14px; line-height: 1.8; margin-bottom: 20px; }
.cta-timeline {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
  padding: 0 20px;
}
.tl-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  flex: 1;
}
.tl-node::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: rgba(59,130,246,0.15);
  z-index: 0;
}
.tl-node:last-child::after { display: none; }
.tl-dot {
  width: 16px; height: 16px;
  border-radius: 50%;
  background: rgba(59,130,246,0.2);
  border: 2px solid var(--border);
  position: relative;
  z-index: 1;
}
.tl-node.done .tl-dot { background: var(--risk-green); border-color: var(--risk-green); }
.tl-node.current .tl-dot {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(59,130,246,0.6);
  animation: dotPulse 1.5s infinite;
}
@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.4); }
  50% { box-shadow: 0 0 20px rgba(59,130,246,0.8); }
}
.tl-year { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); }
.tl-node.done .tl-year, .tl-node.current .tl-year { color: var(--text); }
.tl-label { font-size: 10px; color: var(--text-muted); white-space: nowrap; }
.cta-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.btn-lg { padding: 12px 24px; font-size: 15px; }

@media (max-width: 900px) {
  .grid-2, .scene-grid { grid-template-columns: 1fr; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .scene-vs { flex-direction: column; }
  .scene-divider { transform: rotate(90deg); }
}
</style>
