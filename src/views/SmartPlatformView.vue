<template>
  <div class="smart-platform">
    <!-- 顶部 Tab 切换 -->
    <div class="tab-bar panel">
      <button
        v-for="tab in tabs" :key="tab.key" type="button"
        class="tab-btn" :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- ====== Tab 1: 智能问数 ====== -->
    <div v-if="activeTab === 'qa'" class="tab-content">
      <section class="panel block">
        <h2 class="panel-title">💬 智能问数 — 自然语言即问即答</h2>
        <p class="desc">AI 智能体自动解析意图 → 调用数据中台 → 流式返回分析结果</p>

        <!-- 对话区 -->
        <div class="chat-area" ref="chatArea">
          <div v-for="(msg, i) in chatHistory" :key="i" class="chat-msg" :class="msg.role">
            <div class="chat-bubble">
              <div v-if="msg.role === 'user'" class="msg-text">{{ msg.text }}</div>
              <template v-else>
                <!-- 流式思考过程 -->
                <div v-if="msg.thinkingLines && msg.thinkingLines.length" class="thinking-box">
                  <div class="thinking-header">
                    <span class="dot-pulse" />
                    <span>AI 智能体思考中...</span>
                  </div>
                  <div
                    v-for="(t, ti) in msg.thinkingLines" :key="ti"
                    class="think-line"
                    :style="{ animationDelay: ti * 0.8 + 's' }"
                  >
                    <span class="think-prefix">▸</span> {{ t }}
                  </div>
                </div>
                <!-- 流式回答 -->
                <div v-if="msg.streamedText !== undefined" class="msg-text">
                  {{ msg.streamedText }}
                  <span v-if="msg.streaming" class="cursor-blink">|</span>
                </div>
                <!-- 图表 -->
                <div v-if="msg.chartOption" class="msg-chart" ref="msgChartArea">
                  <EChart :option="msg.chartOption" class="qchart" />
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="input-area">
          <div class="chips-row">
            <button v-for="h in hintQuestions" :key="h" type="button" class="chip" @click="askStream(h)">{{ h }}</button>
          </div>
          <div class="qa-row">
            <input
              ref="inputRef" v-model="inputQ" class="input"
              type="text"
              placeholder="输入自然语言问题，AI 智能体流式回答..."
              @keyup.enter="askStream(inputQ)"
            />
            <button type="button" class="btn btn-primary" :disabled="isStreaming" @click="askStream(inputQ)">
              {{ isStreaming ? '回答中...' : '问数' }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- ====== Tab 2: AI 主动预警 ====== -->
    <div v-if="activeTab === 'alert'" class="tab-content">
      <section class="panel block">
        <h2 class="panel-title">🔔 AI 主动预警 — 「数找人」而非「人找数」</h2>
        <p class="desc">AI 智能体 24×7 持续扫描，自动发现异常并推送，无需人工发起查询。</p>

        <div class="alerts-list">
          <div v-for="(a, i) in proactiveAlerts" :key="a.id" class="alert-card panel" :class="'level-' + a.level" :style="{ animationDelay: i * 0.3 + 's' }">
            <div class="alert-head">
              <span class="alert-level">
                <RiskBadge :level="a.level" />
              </span>
              <span class="alert-time">{{ a.time }}</span>
              <span v-if="i === 0" class="new-badge">NEW</span>
            </div>
            <h3 class="alert-title">{{ a.title }}</h3>
            <p class="alert-detail">{{ a.detail }}</p>
            <div class="alert-actions">
              <button v-for="act in a.actions" :key="act" type="button" class="btn" @click="handleAlertAction(a, act)">
                {{ act }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ====== Tab 3: 关联分析 ====== -->
    <div v-if="activeTab === 'graph'" class="tab-content">
      <section class="panel block">
        <h2 class="panel-title">🔗 关联分析 — 知识图谱秒级呈现</h2>
        <p class="desc">输入供应商、人员或企业名称，AI 自动展开多层关联关系网络。</p>

        <div class="qa-row">
          <input v-model="graphQuery" class="input" type="text" placeholder="例如：某设备贸易商行、华东电力、张某..." @keyup.enter="runGraphAnalysis" />
          <button type="button" class="btn btn-primary" @click="runGraphAnalysis">关联分析</button>
        </div>

        <div v-if="graphResult" class="graph-result">
          <div class="thinking-box" v-if="graphThinking.length">
            <div class="thinking-header">
              <span class="dot-pulse" />
              <span>知识图谱展开中...</span>
            </div>
            <div v-for="(t, ti) in graphThinking" :key="ti" class="think-line" :style="{ animationDelay: ti * 0.6 + 's' }">
              <span class="think-prefix">▸</span> {{ t }}
            </div>
          </div>
          <KnowledgeGraph :graph-data="graphResult" :height="340" />
          <p class="graph-conclusion">{{ graphConclusion }}</p>
        </div>
      </section>
    </div>

    <!-- ====== Tab 4: 报告生成 ====== -->
    <div v-if="activeTab === 'report'" class="tab-content">
      <section class="panel block">
        <h2 class="panel-title">📊 智能报告 — AI 自动汇总生成</h2>
        <p class="desc">输入指令，AI 自动聚合数据 → 分析趋势 → 输出结构化报告（含图表）</p>

        <div class="qa-row">
          <button type="button" class="btn btn-primary" :disabled="reportGenerating" @click="generateReport">
            {{ reportGenerating ? '生成中...' : '生成本月风险分析报告' }}
          </button>
        </div>

        <div v-if="reportContent" class="report-area">
          <!-- 流式思考 -->
          <div class="thinking-box">
            <div class="thinking-header">
              <span class="dot-pulse" />
              <span>AI 报告引擎工作中...</span>
            </div>
            <div v-for="(t, ti) in reportThinking" :key="ti" class="think-line" :style="{ animationDelay: ti * 0.8 + 's' }">
              <span class="think-prefix">▸</span> {{ t }}
            </div>
          </div>
          <!-- 报告正文 -->
          <div class="report panel inner">
            <div class="report-stream">
              <template v-for="(line, li) in reportLines" :key="li">
                <h4 v-if="line.startsWith('##')">{{ line.replace('## ', '') }}</h4>
                <p v-else>{{ line }}</p>
              </template>
              <span v-if="reportGenerating" class="cursor-blink">|</span>
            </div>
          </div>
          <!-- 报告图表 -->
          <EChart v-if="reportChart" class="report-chart" :option="reportChart" />
        </div>
      </section>
    </div>

    <!-- ====== Tab 5: 决策建议 ====== -->
    <div v-if="activeTab === 'advice'" class="tab-content">
      <section class="panel block">
        <h2 class="panel-title">🎯 AI 决策建议 — 从数据到行动</h2>
        <p class="desc">AI 基于历史数据与规则模型，自动输出风险等级调整建议与处置动作。</p>

        <div class="qa-row">
          <button type="button" class="btn btn-primary" @click="runDecisionAnalysis">分析近 6 个月数据并给出建议</button>
        </div>

        <div v-if="decisionResult" class="decision-area">
          <div class="thinking-box">
            <div class="thinking-header">
              <span class="dot-pulse" />
              <span>AI 决策引擎分析中...</span>
            </div>
            <div v-for="(t, ti) in decisionThinking" :key="ti" class="think-line" :style="{ animationDelay: ti * 0.8 + 's' }">
              <span class="think-prefix">▸</span> {{ t }}
            </div>
          </div>

          <div class="decision-cards">
            <div v-for="(d, di) in decisionItems" :key="di" class="decision-card panel" :style="{ animationDelay: di * 0.5 + 's' }">
              <div class="dc-head">
                <span class="dc-company">{{ d.company }}</span>
                <span class="dc-change">
                  <span class="old-level"><RiskBadge :level="d.from" /></span>
                  <span class="arrow">→</span>
                  <span class="new-level"><RiskBadge :level="d.to" /></span>
                </span>
              </div>
              <p class="dc-reason">{{ d.reason }}</p>
              <div class="dc-action">
                <span class="dc-label">建议处置：</span> {{ d.action }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { matchQA, AI_PROACTIVE_ALERTS, GRAPH_SUPPLIER_DATA } from '@/mock/qa.js'

const router = useRouter()

// ===== Tabs =====
const tabs = [
  { key: 'qa', icon: '💬', label: '智能问数' },
  { key: 'alert', icon: '🔔', label: '主动预警' },
  { key: 'graph', icon: '🔗', label: '关联分析' },
  { key: 'report', icon: '📊', label: '报告生成' },
  { key: 'advice', icon: '🎯', label: '决策建议' },
]

const activeTab = ref('qa')
const inputRef = ref(null)

// ===== Tab 1: 智能问数（流式） =====
const inputQ = ref('')
const chatHistory = ref([])
const isStreaming = ref(false)

const hintQuestions = [
  '新能源板块本季度投资回报率是多少？',
  '集团整体风险态势如何？',
  '采购环节是否存在围标串标？',
  '生成本月风险分析报告',
]

async function askStream(text) {
  const q = (text || inputQ.value).trim()
  if (!q || isStreaming.value) return
  inputQ.value = ''

  const qaData = matchQA(q)
  const msgIndex = chatHistory.value.length

  // 添加用户消息
  chatHistory.value.push({ role: 'user', text: q })

  // 添加 AI 消息占位
  chatHistory.value.push({
    role: 'ai',
    thinkingLines: [],
    streamedText: '',
    streaming: true,
    chartOption: null,
  })

  isStreaming.value = true
  scrollToBottom()

  // 流式展示思考过程
  const thinkingSteps = qaData.thinking || ['正在分析您的问题...']
  for (let i = 0; i < thinkingSteps.length; i++) {
    await sleep(600 + Math.random() * 400)
    chatHistory.value[msgIndex + 1].thinkingLines.push(thinkingSteps[i])
  }

  await sleep(400)

  // 流式输出回答文本
  const answerText = qaData.answer || ''
  for (let i = 0; i < answerText.length; i++) {
    await sleep(25 + Math.random() * 15)
    chatHistory.value[msgIndex + 1].streamedText += answerText[i]
    scrollToBottom()
  }

  chatHistory.value[msgIndex + 1].streaming = false

  // 延迟展示图表
  if (qaData.chart) {
    await sleep(400)
    const chartOption = buildChartOption(qaData.chart)
    chatHistory.value[msgIndex + 1].chartOption = chartOption
  }

  isStreaming.value = false
  scrollToBottom()
}

function buildChartOption(c) {
  if (!c) return null
  if (c.type === 'pie') {
    return {
      backgroundColor: 'transparent',
      title: { text: c.title, left: 'center', textStyle: { color: '#8ba3c7', fontSize: 13 } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: '58%', label: { color: '#e8f1ff' },
        data: c.series.map(x => ({ name: x.name, value: x.value })),
        itemStyle: { borderColor: '#0c1c34', borderWidth: 2 },
      }],
    }
  }
  if (c.type === 'bar') {
    return {
      backgroundColor: 'transparent',
      title: { text: c.title, left: 'center', textStyle: { color: '#8ba3c7', fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 12, top: 40, bottom: 36 },
      xAxis: { type: 'category', data: c.x, axisLabel: { color: '#8ba3c7', rotate: c.x?.length > 5 ? 20 : 0 } },
      yAxis: { type: 'value', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
      series: [{ type: 'bar', data: c.y, itemStyle: { color: '#3b82f6' } }],
    }
  }
  if (c.type === 'line') {
    return {
      backgroundColor: 'transparent',
      title: { text: c.title, left: 'center', textStyle: { color: '#8ba3c7', fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 8, top: 40, bottom: 28 },
      xAxis: { type: 'category', data: c.x, axisLabel: { color: '#8ba3c7' } },
      yAxis: { type: 'value', axisLabel: { color: '#8ba3c7' }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.12)' } } },
      series: [{ type: 'line', smooth: true, areaStyle: { color: 'rgba(59,130,246,0.2)' }, data: c.y, lineStyle: { color: '#3b82f6', width: 2 } }],
    }
  }
  return null
}

// ===== Tab 2: AI 主动预警 =====
const proactiveAlerts = ref(AI_PROACTIVE_ALERTS)

function handleAlertAction(alert, action) {
  if (action.includes('采购')) router.push('/procurement')
  else if (action.includes('财务')) router.push('/finance')
  else if (action.includes('关联')) { activeTab.value = 'graph'; graphQuery.value = '某设备贸易商行' }
  else if (action.includes('核查')) router.push('/work-orders')
}

// ===== Tab 3: 关联分析 =====
const graphQuery = ref('')
const graphResult = ref(null)
const graphThinking = ref([])
const graphConclusion = ref('')

async function runGraphAnalysis() {
  if (!graphQuery.value.trim()) return
  graphResult.value = null
  graphThinking.value = []
  graphConclusion.value = ''

  const steps = [
    '以「' + graphQuery.value.trim() + '」为起点展开知识图谱...',
    '第一层：直接关联节点检索...',
    '发现关联企业 3 家，关联人员 1 人，关联公司 1 家',
    '第二层：间接关联穿透...',
    '命中高风险路径：张某(前采购副经理) → 控股 → 某设备贸易商行',
    '关联度评分：高（直接关联 + 时间重叠）',
    '图谱生成完成，已高亮风险路径',
  ]

  for (let i = 0; i < steps.length; i++) {
    await sleep(500 + Math.random() * 300)
    graphThinking.value.push(steps[i])
  }

  graphResult.value = GRAPH_SUPPLIER_DATA
  graphConclusion.value = '结论：某设备贸易商行控股股东张某曾任华东电力采购部副经理，存在利益冲突。建议立即标记为关联方，对历史交易启动专项审计。'
}

// ===== Tab 4: 报告生成 =====
const reportGenerating = ref(false)
const reportContent = ref(false)
const reportThinking = ref([])
const reportLines = ref([])
const reportChart = ref(null)

async function generateReport() {
  if (reportGenerating.value) return
  reportGenerating.value = true
  reportContent.value = true
  reportThinking.value = []
  reportLines.value = []
  reportChart.value = null

  const thinkSteps = [
    '自动汇总 2026 年 4 月全集团风险数据...',
    '统计完成：新增预警 55 条，环比 +17%，已处置 42 条，闭环率 76.4%',
    '风险域分布：采购 22%、资金 16%、投资 14%、合同 13%、财务 10%、其他 25%',
    '趋势识别：围标串标类预警同比 +300%，集中在工程建设板块',
    '生成结构化报告，含图表、结论与建议...',
  ]

  for (let i = 0; i < thinkSteps.length; i++) {
    await sleep(700 + Math.random() * 400)
    reportThinking.value.push(thinkSteps[i])
  }

  await sleep(500)

  const report = [
    '## 一、总体结论',
    '2026 年 4 月全集团共新增风险预警 55 条，环比增长 17%。其中重大风险 4 条，高风险 11 条，中风险 14 条，低风险 26 条。工程建设与电力能源板块贡献主要增量。',
    '## 二、风险域分析',
    '采购域新增预警 12 条（占比 22%），其中围标串标类 6 条，同比暴增 300%。资金域新增 9 条（16%），以异常支付为主。投资域新增 8 条（14%），集中在境外项目超预算。',
    '## 三、重点关注清单',
    '1. 围标串标：CG-2026-0501（AI 围标概率 0.94）— 建议暂停开标\n2. 大额支付：华东电力 9200 万元无合同支付 — 已触发拦截\n3. 投资超预算：东南亚某国路桥 PPP 超预算 18.6% — 核查中\n4. 重大风险合同：CT-2026-0312 预付100%+无质保金 — 紧急冻结履约',
    '## 四、建议处置',
    '① 优先完成工单 WO-2026-0042/0037 核查闭环\n② 对工程建设板块采购实施前置交叉比对\n③ 将海外工程总承包公司风险等级从橙色调升至红色\n④ 对某设备贸易商行启动关联交易专项审计',
  ]

  for (let i = 0; i < report.length; i++) {
    await sleep(200 + Math.random() * 150)
    reportLines.value.push(report[i])
  }

  reportGenerating.value = false

  await sleep(300)
  reportChart.value = {
    backgroundColor: 'transparent',
    title: { text: '风险域分布（4月）', left: 'center', textStyle: { color: '#8ba3c7', fontSize: 13 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: '58%', label: { color: '#e8f1ff' },
      data: [
        { name: '采购', value: 12 },
        { name: '资金', value: 9 },
        { name: '投资', value: 8 },
        { name: '合同', value: 7 },
        { name: '财务', value: 6 },
        { name: '其他', value: 13 },
      ],
      itemStyle: { borderColor: '#0c1c34', borderWidth: 2 },
    }],
  }
}

// ===== Tab 5: 决策建议 =====
const decisionResult = ref(false)
const decisionThinking = ref([])
const decisionItems = ref([])

async function runDecisionAnalysis() {
  decisionResult.value = true
  decisionThinking.value = []
  decisionItems.value = []

  const steps = [
    '加载近 6 个月风险事件数据库（2025.11 - 2026.04）...',
    '分析 82 家法人单位预警频次与趋势...',
    '海外工程总承包公司：6 个月触发 14 次预警，为均值 3.2 倍，最近 2 个月加速',
    '数字科技公司：隐性薪酬类支付频次持续上升，连续 4 个月超阈值',
    '综合研判完成，输出 2 条等级调整建议...',
  ]

  for (let i = 0; i < steps.length; i++) {
    await sleep(600 + Math.random() * 400)
    decisionThinking.value.push(steps[i])
  }

  await sleep(400)

  decisionItems.value = [
    {
      company: '海外工程总承包公司',
      from: 'high', to: 'critical',
      reason: '近 6 个月触发预警 14 次（含 3 次重大风险），超过同板块均值 3.2 倍，且最近 2 个月预警频次加速上升，呈风险恶化趋势。',
      action: '建议在下次风控委员会上审议，调升至红色等级，配套实施月度专项审计和投资审批前置管控。',
    },
    {
      company: '数字科技公司',
      from: 'low', to: 'medium',
      reason: '近 6 个月「技术服务费」「劳务费」类对自然人支付频次持续上升，连续 4 个月超正常阈值，疑似变相薪酬模式。',
      action: '建议调升至黄色等级，要求限期提供支付合理性说明，必要时启动费用合规专项检查。',
    },
  ]
}

// ===== Utils =====
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function scrollToBottom() {
  nextTick(() => {
    const el = document.querySelector('.chat-area')
    if (el) el.scrollTop = el.scrollHeight
  })
}

onMounted(() => {
  // 初始自动发一条欢迎消息
  chatHistory.value.push({
    role: 'ai',
    thinkingLines: [],
    streamedText: '您好，我是 DRP 智能体中台。您可以用自然语言向我提问，我会自动解析意图、调用数据中台并流式返回分析结果。试试问我：新能源板块投资回报率？集团风险态势？采购是否围标？',
    streaming: false,
    chartOption: null,
  })
})
</script>

<style scoped>
.smart-platform { max-width: 1400px; height: 100%; overflow: hidden; display: flex; flex-direction: column; padding: 0 16px; }

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 12px;
}
.tab-btn {
  flex: 1;
  padding: 10px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}
.tab-btn:hover { background: rgba(59,130,246,0.1); color: var(--text); }
.tab-btn.active { background: rgba(59,130,246,0.2); color: var(--text); box-shadow: var(--glow); }
.tab-icon { font-size: 16px; }

/* Common */
.tab-content { min-height: 0; flex: 1; overflow-y: auto; }
.block { padding: 16px 20px; }
.desc { color: var(--text-muted); font-size: 13px; margin-bottom: 14px; }

/* Chat */
.chat-area {
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 8px 0;
}
.chat-msg { margin-bottom: 14px; }
.chat-msg.user .chat-bubble {
  background: rgba(59,130,246,0.18);
  border: 1px solid rgba(59,130,246,0.25);
  margin-left: 60px;
  border-radius: 12px 4px 12px 12px;
}
.chat-msg.ai .chat-bubble {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  margin-right: 20px;
  border-radius: 4px 12px 12px 12px;
}
.chat-bubble { padding: 14px 16px; }

/* Thinking Box */
.thinking-box {
  background: rgba(59,130,246,0.06);
  border: 1px dashed rgba(59,130,246,0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}
.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 8px;
  font-weight: 600;
}
.dot-pulse {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: dotPulse 1.2s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.think-line {
  font-size: 12px;
  color: var(--text-muted);
  padding: 3px 0;
  font-family: var(--font-mono);
  opacity: 0;
  animation: fadeSlideIn 0.5s ease forwards;
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.think-prefix { color: var(--accent); margin-right: 4px; }

/* Streaming */
.msg-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
}
.cursor-blink {
  color: var(--accent);
  animation: blink 0.8s infinite;
  font-weight: 100;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.msg-chart { margin-top: 12px; animation: fadeIn 0.5s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.qchart { height: 260px; }

/* Input */
.input-area { margin-top: 8px; }
.chips-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.chip {
  font-size: 12px; padding: 6px 10px;
  border-radius: 999px; border: 1px solid var(--border);
  background: transparent; color: var(--text-muted); cursor: pointer;
}
.chip:hover { border-color: var(--accent); color: var(--text); }
.qa-row { display: flex; gap: 10px; }
.input {
  flex: 1; min-width: 0;
  padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.25); color: var(--text); font-size: 14px;
}

/* Alerts */
.alerts-list { display: flex; flex-direction: column; gap: 12px; }
.alert-card {
  padding: 16px 18px;
  opacity: 0;
  animation: fadeSlideIn 0.6s ease forwards;
}
.alert-card.level-critical { border-color: rgba(239,68,68,0.4); }
.alert-card.level-high { border-color: rgba(249,115,22,0.3); }
.alert-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.alert-time { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.new-badge {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: rgba(239,68,68,0.2); color: var(--risk-red); font-weight: 700;
}
.alert-title { margin: 0 0 8px; font-size: 15px; color: var(--text); }
.alert-detail { margin: 0 0 12px; font-size: 13px; color: var(--text-muted); line-height: 1.6; }
.alert-actions { display: flex; gap: 8px; }

/* Graph */
.graph-result { margin-top: 16px; animation: fadeIn 0.5s ease; }
.graph-conclusion { margin-top: 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(239,68,68,0.06); color: #fecaca; font-size: 13px; line-height: 1.6; }

/* Report */
.report-area { margin-top: 16px; }
.report { padding: 18px; margin-top: 12px; }
.report-stream { color: var(--text-muted); line-height: 1.8; font-size: 14px; }
.report-stream h4 { color: var(--text); margin: 16px 0 8px; font-size: 15px; }
.report-stream p { margin: 0 0 8px; }
.report-chart { height: 280px; margin-top: 16px; animation: fadeIn 0.5s ease; }

/* Decision */
.decision-area { margin-top: 16px; }
.decision-cards { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.decision-card {
  padding: 16px 18px;
  opacity: 0;
  animation: fadeSlideIn 0.6s ease forwards;
}
.dc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dc-company { font-size: 15px; font-weight: 700; color: var(--text); }
.dc-change { display: flex; align-items: center; gap: 8px; }
.arrow { color: var(--accent); font-weight: 700; font-size: 16px; }
.dc-reason { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 10px; }
.dc-action { font-size: 13px; color: var(--text); padding: 10px 12px; border-radius: 8px; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15); }
.dc-label { color: var(--accent); font-weight: 600; }

.inner { background: rgba(0,0,0,0.2); }

@media (max-width: 800px) {
  .tab-bar { flex-wrap: wrap; }
  .tab-btn { flex: auto; min-width: 80px; }
  .chat-msg.user .chat-bubble { margin-left: 20px; }
}
</style>
