<template>
  <div class="dbrd" :class="{ 'cockpit-compact': !drillMode }">
    <!-- ==================== 驾驶舱模式 ==================== -->
    <template v-if="!drillMode">
      <!-- 预警 Toast -->
      <div v-if="toastShow" class="toast-bar risk-pulse" @click="onClickToast" style="cursor:pointer" title="点击跳转到对应穿透模块">
        <span class="toast-dot"></span>
        <strong>实时预警</strong>：{{ toastText }}
        <span class="toast-arrow">↗</span>
        <button class="toast-close" @click.stop="toastShow = false">×</button>
      </div>

      <!-- 三列主体 -->
      <div class="dbrd-body">
        <!-- LEFT COLUMN 25% -->
        <div class="col col-left">
          <!-- Panel 1: 风险分布饼图 -->
          <section class="panel-lg">
            <h3 class="p-title">风险等级分布</h3>
            <EChart class="p-chart" :option="riskDonutOption" />
          </section>

          <!-- Panel 2: 板块风险柱状图 -->
          <section class="panel-lg">
            <h3 class="p-title">板块风险得分</h3>
            <EChart class="p-chart" :option="sectorRiskBarOption" />
          </section>

          <!-- Panel 3: 资金池 KPI 微卡片 -->
          <section class="panel-lg">
            <h3 class="p-title">资金池实时监控</h3>
            <div class="funds-micro-grid">
              <div class="fm-card" v-for="fk in fundsMicroKPIs" :key="fk.label">
                <span class="fm-icon">{{ fk.icon }}</span>
                <span class="fm-val">{{ fk.value }}</span>
                <span class="fm-label">{{ fk.label }}</span>
              </div>
            </div>
          </section>

          <!-- Panel 4: 合同履约进度 -->
          <section class="panel-lg">
            <h3 class="p-title">合同履约监控</h3>
            <div class="contract-perf-list">
              <div v-for="ct in topContracts" :key="ct.id" class="cp-item">
                <div class="cp-header">
                  <span class="cp-name">{{ ct.name }}</span>
                  <RiskBadge :level="ct.level" />
                </div>
                <div class="cp-bar-wrap">
                  <div class="cp-bar">
                    <div
                      class="cp-fill"
                      :class="{ 'cp-overpay': ct.id === 'CT-2026-0312' && ct.performance < 80 && ct.id === 'CT-2026-0312' }"
                      :style="{ width: ct.performance + '%', background: ct.performance < 50 ? 'var(--risk-red)' : ct.performance < 70 ? 'var(--risk-orange)' : 'var(--risk-green)' }"
                    ></div>
                  </div>
                  <span class="cp-pct">{{ ct.performance }}%</span>
                </div>
              </div>
            </div>
            <div v-if="overpayWarning" class="overpay-warn">
              ⚠ {{ overpayWarning }}
            </div>
          </section>
        </div>

        <!-- CENTER COLUMN 50% -->
        <div class="col col-center">
          <!-- Row 1: 6 KPI 大数字 -->
          <section class="kpi-row">
            <div v-for="k in centerKPIs" :key="k.label" class="kpi-card" :class="{ 'kpi-risk': k.isRisk }">
              <div class="kpi-num">{{ k.display }}</div>
              <div class="kpi-lbl">{{ k.label }}</div>
              <div class="kpi-sub">{{ k.sub }}</div>
            </div>
          </section>

          <!-- Row 2: 风险热力图 -->
          <section class="panel-lg panel-heatmap">
            <h3 class="p-title">风险热力图 · 板块 × 风险域</h3>
            <EChart class="p-chart heat-chart" :option="heatmapOption" />
          </section>

          <!-- Row 3: 风险样本表格 -->
          <section class="panel-lg panel-table">
            <h3 class="p-title">风险样本 · 点击进入风险中心</h3>
            <div class="compact-table-wrap">
              <table class="compact-table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>风险类别</th>
                    <th>描述</th>
                    <th>等级</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in dashboardRiskSamples" :key="r.id" @click="goScene(r)" class="ct-row">
                    <td class="ct-mono">{{ r.id }}</td>
                    <td>{{ r.type }}</td>
                    <td class="ct-desc">{{ r.summary }}</td>
                    <td><RiskBadge :level="r.level" /></td>
                    <td><span class="ct-status" :class="'sts-' + r.level">{{ r.level === 'critical' ? '处置中' : r.level === 'high' ? '监控中' : '已记录' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- 核心业务看板 2×2 -->
          <section class="module-boards">
            <h3 class="p-title">核心业务穿透 · 点击下钻</h3>
            <div class="board-grid">
              <div class="board-card" @click="openInvestmentPage">
                <div class="bd-header"><span class="bd-icon">📊</span><span class="bd-name">投资管理</span><RiskBadge :level="investmentBoardRiskLevel" /></div>
                <div class="bd-kpis">
                  <span class="bd-kpi"><strong>{{ investmentBoardProjectCount }}</strong><small>个项目</small></span>
                  <span class="bd-kpi warn"><strong>{{ investmentBoardFocusProject.code }}</strong><small>超预算{{ investmentBoardFocusProject.overBudgetRate }}</small></span>
                  <span class="bd-kpi"><strong>{{ investmentBoardBudgetTotal }}</strong><small>亿计划</small></span>
                </div>
                <EChart class="bd-chart" :option="boardInvestChart" />
              </div>
              <div class="board-card" @click="openFundsPage">
                <div class="bd-header"><span class="bd-icon">💰</span><span class="bd-name">资金管理</span><RiskBadge :level="fundsBoardRiskLevel" /></div>
                <div class="bd-kpis">
                  <span class="bd-kpi"><strong>{{ fundsBoardStats.totalBalanceYi }}</strong><small>亿样本余额</small></span>
                  <span class="bd-kpi warn"><strong>{{ fundsBoardStats.riskAmountWan }}</strong><small>万异常支付</small></span>
                  <span class="bd-kpi"><strong>{{ fundsBoardStats.healthRate }}</strong><small>安全占比</small></span>
                </div>
                <EChart class="bd-chart" :option="boardFundsChart" />
              </div>
              <div class="board-card" @click="openProcurementPage">
                <div class="bd-header"><span class="bd-icon">📦</span><span class="bd-name">采购招标</span><RiskBadge :level="procurementBoardRiskLevel" /></div>
                <div class="bd-kpis">
                  <span class="bd-kpi"><strong>{{ procurementBoardStats.packageCount }}</strong><small>在途标段</small></span>
                  <span class="bd-kpi warn"><strong>{{ procurementBoardStats.maxAiScore }}</strong><small>围标概率</small></span>
                  <span class="bd-kpi"><strong>{{ procurementBoardStats.alertCount }}</strong><small>触发预警</small></span>
                </div>
                <EChart class="bd-chart" :option="boardProcurementChart" />
              </div>
              <div class="board-card" @click="enterDrill('contract')">
                <div class="bd-header"><span class="bd-icon">📋</span><span class="bd-name">合同总览</span><RiskBadge :level="contractBoardRiskLevel" /></div>
                <div class="bd-kpis contract-kpis">
                  <span class="bd-kpi"><strong>{{ contractBoardTotal }}</strong><small>份合同</small></span>
                  <span class="bd-kpi"><strong>{{ contractBoardAmount }}</strong><small>亿元</small></span>
                  <span class="bd-kpi warn"><strong>{{ contractBoardHighRisk }}</strong><small>高风险</small></span>
                  <span class="bd-kpi"><strong>{{ contractBoardExpiring }}</strong><small>本月到期</small></span>
                </div>
                <EChart class="bd-chart" :option="boardContractOverviewChart" />
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN 25% -->
        <div class="col col-right">
          <!-- Panel 5: 预警趋势图 -->
          <section class="panel-lg">
            <h3 class="p-title">预警趋势 · 近12月</h3>
            <EChart class="p-chart" :option="alertTrendOption" />
          </section>

          <!-- Panel 6: AI智能助手入口 -->
          <section class="panel-lg panel-ai-btn">
            <h3 class="p-title">🤖 AI 智能中台</h3>
            <button class="ai-launcher" @click="showAIDialog = true">
              <span class="ai-launch-icon">💬</span>
              <span class="ai-launch-text">打开 AI 智能助手</span>
              <span class="ai-launch-arrow">→</span>
            </button>
            <div class="ai-alerts">
              <div class="ai-alerts-title">⚡ 主动预警</div>
              <div
                v-for="a in proactiveAlerts"
                :key="a.id"
                class="ai-alert-item"
                @click="openAIAlert(a)"
              >
                <div class="aa-header">
                  <span class="aa-dot" :class="'aa-' + a.level"></span>
                  <span class="aa-title">{{ a.title }}</span>
                  <span class="aa-time">{{ a.time }}</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </template>

    <!-- ==================== 穿透面板 ==================== -->
    <template v-if="drillMode">
      <div class="drill-overlay">
        <div class="drill-header-row">
          <button class="btn" @click="exitDrill">← 返回驾驶舱</button>
          <div class="drill-breadcrumb">
            <span>驾驶舱</span><span class="sep">›</span>
            <span>{{ drillModuleLabel }}</span>
            <template v-for="(p, pi) in drillPath" :key="p.id">
              <span class="sep">›</span>
              <span class="drill-bc-link" @click="drillBackTo(pi)">{{ p.label }}</span>
            </template>
          </div>
        </div>
        <div class="drill-body-wrap" style="display:block">
          <div class="drill-detail-content" style="width:100%;flex:1" ref="drillDetailRef">
            <!-- ====== 投资穿透 ====== -->
            <template v-if="drillMode.module === 'investment'">
              <!-- L0: 集团投资总览 -->
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团投资总览</h3>
                <div class="detail-meta-row" style="margin-bottom:10px">
                  <div class="dm-item" v-for="item in investmentCockpitKPIs" :key="item.label">
                    <span class="dm-k">{{ item.label }}</span>
                    <span class="dm-v" :style="{ color: item.warn ? 'var(--risk-red)' : '' }">{{ item.value }}</span>
                  </div>
                </div>
                <EChart class="drill-chart" :option="investOverviewChart" />
                <div class="compact-table-wrap" style="margin-top:10px">
                  <table class="compact-table">
                    <thead><tr><th>板块</th><th>在投项目</th><th>完成率</th><th>预算(亿)</th><th>实际(亿)</th><th>超预算项目</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="s in investSectorSummary" :key="s.name">
                        <td>{{ s.name }}</td><td>{{ s.count }}</td><td>{{ s.progress }}%</td>
                        <td>{{ s.totalBudget }}</td><td>{{ s.totalActual }}</td><td :style="{ color: s.overBudgetCount > 0 ? 'var(--risk-red)' : '' }">{{ s.overBudgetCount }}</td>
                        <td><RiskBadge :level="s.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <!-- L1: 板块子公司列表 -->
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>子公司</th><th>城市</th><th>风险等级</th></tr></thead>
                    <tbody>
                      <tr v-for="c in filterCompaniesBySector" :key="c.id">
                        <td>{{ c.name }}</td><td>{{ c.city }}</td><td><RiskBadge :level="c.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <!-- L2: 项目列表 -->
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>项目</th><th>预算(亿)</th><th>实际(亿)</th><th>进度</th><th>状态</th><th>阶段</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="p in filterProjectsByCompany" :key="p.id">
                        <td>{{ p.name }}</td><td>{{ p.budgetYi }}</td><td :style="{ color: p.actualYi > p.budgetYi ? 'var(--risk-red)' : '' }">{{ p.actualYi }}</td>
                        <td>{{ p.progress }}%</td><td>{{ p.status }}</td><td>{{ p.phase }}</td><td><RiskBadge :level="p.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <!-- L3: 项目详情 -->
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="detail-meta-row" v-if="investProjectDetail">
                  <div class="dm-item"><span class="dm-k">项目名称</span><span class="dm-v">{{ investProjectDetail.name }}</span></div>
                  <div class="dm-item"><span class="dm-k">预算</span><span class="dm-v">{{ investProjectDetail.budgetYi }} 亿</span></div>
                  <div class="dm-item"><span class="dm-k">实际</span><span class="dm-v" :style="{ color: investProjectDetail.actualYi > investProjectDetail.budgetYi ? 'var(--risk-red)' : '' }">{{ investProjectDetail.actualYi }} 亿</span></div>
                  <div class="dm-item"><span class="dm-k">进度</span><span class="dm-v">{{ investProjectProfile.progress }}%</span></div>
                  <div class="dm-item"><span class="dm-k">状态</span><span class="dm-v"><RiskBadge :level="investProjectDetail.risk" /></span></div>
                  <div class="dm-item"><span class="dm-k">阶段</span><span class="dm-v">{{ investProjectDetail.phase }}</span></div>
                  <div class="dm-item"><span class="dm-k">超预算偏差</span><span class="dm-v" :style="{ color: investProjectProfile.overBudgetRate > 0 ? 'var(--risk-red)' : 'var(--risk-green)' }">{{ signedPercentText(investProjectProfile.overBudgetRate) }}</span></div>
                  <div class="dm-item"><span class="dm-k">关联交易占比</span><span class="dm-v" :style="{ color: investmentProjectRiskLevel !== 'low' ? 'var(--risk-orange)' : '' }">{{ toPercentText(investProjectProfile.relatedTradeRatio) }}</span></div>
                  <div class="dm-item"><span class="dm-k">风险结论</span><span class="dm-v">{{ investmentProjectRiskText }}</span></div>
                </div>
                <div class="detail-meta-row" v-if="investProjectProfile" style="margin-top:8px">
                  <div class="dm-item"><span class="dm-k">原因分析</span><span class="dm-v">{{ investProjectProfile.causeAnalysis }}</span></div>
                  <div class="dm-item"><span class="dm-k">里程碑状态</span><span class="dm-v">{{ investProjectProfile.milestoneStatus }}</span></div>
                  <div class="dm-item"><span class="dm-k">关联交易金额</span><span class="dm-v">{{ toYiText(investProjectProfile.relatedTradeAmountYi) }} 亿</span></div>
                  <div class="dm-item"><span class="dm-k">隐蔽关联方</span><span class="dm-v">{{ investProjectProfile.hiddenRelationCount }} 个</span></div>
                </div>
                <button class="btn ai-btn" @click="triggerAIAnalysis('investment')" style="margin:6px 0">🤖 AI 综合分析</button>
                <KnowledgeGraph :graphData="investProjectGraph" :height="240" style="margin-top:10px" />
                <div class="compact-table-wrap" style="margin-top:10px" v-if="investProjectProfile">
                  <table class="compact-table">
                    <thead><tr><th>里程碑</th><th>计划</th><th>实际</th><th>状态</th><th>说明</th></tr></thead>
                    <tbody>
                      <tr v-for="item in investProjectProfile.milestones" :key="item.name">
                        <td>{{ item.name }}</td><td>{{ item.planned }}</td><td>{{ item.actual }}</td><td>{{ milestoneText(item.status) }}</td><td>{{ item.note }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <!-- L4: 单据工单 -->
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>单据类型</th><th>编号</th><th>状态</th><th>关联工单</th></tr></thead>
                    <tbody>
                      <tr v-for="row in investDocRows" :key="`${row.type}-${row.id}`">
                        <td>{{ row.type }}</td><td>{{ row.id }}</td><td>{{ row.status }}</td><td>{{ row.workOrderId }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>

            <!-- ====== 资金穿透 ====== -->
            <template v-if="drillMode.module === 'funds'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团资金总览</h3>
                <div class="funds-mini-row">
                  <div class="fm-kpi" v-for="fk in fundsPoolKPIs" :key="fk.label">
                    <span class="fmk-label">{{ fk.label }}</span><span class="fmk-val">{{ fk.value }}</span>
                  </div>
                </div>
                <div style="display:flex;gap:10px;margin-top:10px">
                  <EChart class="drill-chart half" :option="fundsPieChart" />
                  <EChart class="drill-chart half" :option="fundsTrendChart" />
                </div>
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 资金汇总</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>子公司</th><th>账户数</th><th>资金余额(万)</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="c in filterCompaniesBySector" :key="c.id">
                        <td>{{ c.name }}</td>
                        <td>{{ accountsByCompany(c.id).length }}</td>
                        <td>{{ accountsTotal(c.id).toLocaleString() }}</td>
                        <td><RiskBadge :level="c.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>账户</th><th>银行</th><th>余额(万)</th><th>类型</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="a in filterAccountsByCompany" :key="a.id" :class="{ 'row-risk': a.riskFlag }">
                        <td>{{ a.id }}</td><td>{{ a.bank }}</td><td>{{ a.balanceWan.toLocaleString() }}</td>
                        <td>{{ a.type }}</td>
                        <td><RiskBadge v-if="a.riskFlag" level="high" /><span v-else class="sts-safe">正常</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="detail-meta-row" v-if="fundAccountDetail">
                  <div class="dm-item"><span class="dm-k">账户</span><span class="dm-v">{{ fundAccountDetail.id }}</span></div>
                  <div class="dm-item"><span class="dm-k">银行</span><span class="dm-v">{{ fundAccountDetail.bank }}</span></div>
                  <div class="dm-item"><span class="dm-k">余额</span><span class="dm-v">¥{{ fundAccountDetail.balanceWan.toLocaleString() }} 万</span></div>
                  <div class="dm-item"><span class="dm-k">类型</span><span class="dm-v">{{ fundAccountDetail.type }}</span></div>
                </div>
                <button class="btn ai-btn" @click="triggerAIAnalysis('funds')" style="margin:6px 0">🤖 AI 风险研判</button>
                <div class="compact-table-wrap" style="margin-top:10px">
                  <table class="compact-table">
                    <thead><tr><th>ID</th><th>来源</th><th>去向</th><th>金额(万)</th><th>时间</th><th>关联合同</th></tr></thead>
                    <tbody>
                      <tr v-for="f in FUND_FLOWS" :key="f.id" :class="{ 'row-risk': f.risk }">
                        <td>{{ f.id }}</td><td>{{ f.from }}</td><td>{{ f.to }}</td>
                        <td>{{ f.amountWan.toLocaleString() }}</td><td>{{ f.time }}</td><td>{{ f.contractRef }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>凭证号</th><th>日期</th><th>摘要</th><th>金额(万)</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="f in FUND_FLOWS" :key="f.id" :class="{ 'row-risk': f.risk }">
                        <td>PZ-{{ f.id }}</td><td>{{ f.time }}</td><td>{{ f.from }} → {{ f.to }}</td>
                        <td>{{ f.amountWan.toLocaleString() }}</td>
                        <td><RiskBadge v-if="f.risk" level="high" /><span v-else class="sts-safe">正常</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style="margin-top:10px;text-align:center">
                  <button class="btn btn-primary">生成核查工单：异常支付流水</button>
                </div>
              </template>
            </template>

            <!-- ====== 采购穿透 ====== -->
            <template v-if="drillMode.module === 'procurement'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">AI 围标概率分析</h3>
                <EChart class="drill-chart" :option="procurementOverviewChart" />
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>子公司</th><th>标段数</th><th>最高围标分</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="c in filterCompaniesBySector" :key="c.id">
                        <td>{{ c.name }}</td>
                        <td>{{ procurementByCompany(c.id).length }}</td>
                        <td>{{ maxAiScore(c.id) }}</td>
                        <td><RiskBadge :level="c.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>标段</th><th>名称</th><th>预算(万)</th><th>AI围标分</th><th>投标人数</th></tr></thead>
                    <tbody>
                      <tr v-for="pkg in filterProcurementByCompany" :key="pkg.id">
                        <td>{{ pkg.id }}</td><td>{{ pkg.title }}</td><td>{{ pkg.budgetWan }}</td>
                        <td><span :style="{ color: pkg.aiScore > 0.7 ? 'var(--risk-red)' : 'var(--risk-green)' }">{{ (pkg.aiScore * 100).toFixed(0) }}%</span></td>
                        <td>{{ pkg.bidders.length }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap" v-if="procurementDetail">
                  <table class="compact-table">
                    <thead><tr><th>投标人</th><th>IP 地址</th><th>MAC 地址</th><th>报价(万)</th></tr></thead>
                    <tbody>
                      <tr v-for="b in procurementDetail.bidders" :key="b.name" :class="{ 'row-risk': procurementDetail.aiScore > 0.7 }">
                        <td>{{ b.name }}</td><td>{{ b.ip }}</td><td>{{ b.mac }}</td><td>{{ b.quoteWan }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button class="btn ai-btn" @click="triggerAIAnalysis('procurement')" style="margin:6px 0">🤖 AI 交叉验证分析</button>
                <KnowledgeGraph :graphData="GRAPH_PROCUREMENT" :height="200" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="ai-conclusion-box" v-if="procurementDetail">
                  <div class="ai-conc-title">🤖 AI 研判结论</div>
                  <p>标段 <strong>{{ procurementDetail.id }}</strong>（{{ procurementDetail.title }}）</p>
                  <p v-if="procurementDetail.aiScore > 0.7" class="conc-high">
                    ⚠ 围标概率 {{ (procurementDetail.aiScore * 100).toFixed(0) }}%，建议立即启动核查程序。
                    关键证据：三家投标单位 IP/MAC 完全相同，报价呈阶梯分布。
                  </p>
                  <p v-else class="conc-safe">✅ 围标概率较低，投标过程无明显异常。</p>
                </div>
                <div style="margin-top:10px;text-align:center" v-if="procurementDetail?.aiScore > 0.7">
                  <button class="btn btn-primary">生成核查工单 WO-2026-0042</button>
                </div>
              </template>
            </template>

            <!-- ====== 合同穿透 ====== -->
            <template v-if="drillMode.module === 'contract'">
              <section class="contract-center-screen">
                <div class="contract-topbar glass-panel">
                  <div class="contract-topbar-left">
                    <h2 class="contract-screen-title glow-title">{{ contractCenterData.title }}</h2>
                    <div class="contract-scene-tabs">
                      <button
                        v-for="tab in contractCenterData.sceneTabs"
                        :key="tab"
                        type="button"
                        class="contract-scene-tab"
                        :class="{ active: contractScene === tab }"
                        @click="contractScene = tab"
                      >
                        {{ tab }}
                      </button>
                    </div>
                  </div>
                  <div class="contract-topbar-right">
                    <div class="contract-top-info">
                      <span class="contract-top-label">实时刷新</span>
                      <strong>{{ contractCurrentTime }}</strong>
                    </div>
                    <div class="contract-top-info success">
                      <span class="contract-top-label">状态</span>
                      <strong>{{ contractCenterData.refreshText }}</strong>
                    </div>
                  </div>
                </div>

                <div class="contract-kpi-grid">
                  <div
                    v-for="item in contractCenterData.kpis"
                    :key="item.label"
                    class="contract-kpi-card breath-glow"
                    :class="item.status"
                  >
                    <div class="contract-kpi-head">
                      <span class="contract-kpi-title">{{ item.label }}</span>
                      <span class="contract-kpi-icon">{{ contractKpiIcon(item.icon) }}</span>
                    </div>
                    <div class="contract-kpi-main">
                      <strong class="contract-kpi-num">{{ displayAnimatedValue(item) }}</strong>
                      <span class="contract-kpi-unit">{{ item.unit }}</span>
                    </div>
                    <svg class="contract-trend-svg" viewBox="0 0 120 32" preserveAspectRatio="none">
                      <defs>
                        <linearGradient :id="`trend-${item.label}`" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="#0ea5e9" />
                          <stop offset="100%" :stop-color="contractStatusColor(item.status)" />
                        </linearGradient>
                      </defs>
                      <polyline :points="sparklinePoints(item.trend)" :stroke="`url(#trend-${item.label})`" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="contract-kpi-status">{{ contractStatusText(item.status) }}</div>
                  </div>
                </div>

                <div class="contract-main-grid">
                  <div class="contract-left-column">
                    <div class="contract-pie-row">
                      <section class="glass-panel contract-chart-card breath-glow">
                        <div class="contract-section-head">
                          <h3 class="contract-section-title glow-title">合同风险等级分布</h3>
                          <span class="contract-section-sub">hover 查看详情，点击图例筛选下方列表</span>
                        </div>
                        <EChart class="contract-chart-host" :option="contractRiskDistributionOption" />
                        <div class="contract-legend-row">
                          <button
                            v-for="item in contractCenterData.riskDistribution"
                            :key="item.name"
                            type="button"
                            class="contract-legend-chip"
                            :class="{ active: contractRiskFilter === item.name }"
                            @click="toggleContractRiskFilter(item.name)"
                          >
                            <span class="contract-legend-dot" :style="{ background: item.color }"></span>
                            {{ item.name }} {{ item.value }}%
                          </button>
                        </div>
                      </section>
                      <section class="glass-panel contract-chart-card breath-glow">
                        <div class="contract-section-head">
                          <h3 class="contract-section-title glow-title">合同履约状态分布</h3>
                          <span class="contract-section-sub">科技风联动筛选</span>
                        </div>
                        <EChart class="contract-chart-host" :option="contractStatusDistributionOption" />
                        <div class="contract-legend-row">
                          <button
                            v-for="item in contractCenterData.statusDistribution"
                            :key="item.name"
                            type="button"
                            class="contract-legend-chip"
                            :class="{ active: contractStatusFilter === item.name }"
                            @click="toggleContractStatusFilter(item.name)"
                          >
                            <span class="contract-legend-dot" :style="{ background: item.color }"></span>
                            {{ item.name }}
                          </button>
                        </div>
                      </section>
                    </div>

                    <section class="glass-panel contract-list-card breath-glow">
                      <div class="contract-section-head">
                        <h3 class="contract-section-title glow-title">合同主列表</h3>
                        <span class="contract-section-sub">点击任意行，右侧 AI 面板自动加载详情</span>
                      </div>
                      <div class="contract-list-toolbar">
                        <div class="contract-toolbar-group">
                          <span class="contract-toolbar-chip">当前场景：{{ contractScene }}</span>
                          <span class="contract-toolbar-chip">筛选后 {{ contractFilteredList.length }} 份</span>
                          <span class="contract-toolbar-chip">默认演示：{{ contractCenterData.defaultContractId }}</span>
                        </div>
                        <div class="contract-toolbar-group">
                          <span
                            v-for="tag in selectedContractTags"
                            :key="tag"
                            class="contract-toolbar-chip warn"
                          >
                            {{ tag }}
                          </span>
                        </div>
                      </div>
                      <div class="contract-table-wrap">
                        <table class="contract-main-table">
                          <thead>
                            <tr>
                              <th>合同编号</th>
                              <th>合同名称</th>
                              <th>签约单位</th>
                              <th>合作方供应商</th>
                              <th>合同金额（亿元）</th>
                              <th>签订日期</th>
                              <th>风险等级</th>
                              <th>履约状态</th>
                              <th>操作按钮</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="ct in contractFilteredList"
                              :key="ct.id"
                              class="contract-main-row float-row"
                              :class="[contractRiskClass(ct.riskLevel), { active: selectedContractId === ct.id }]"
                              @click="selectContract(ct.id)"
                            >
                              <td><span v-if="ct.riskLevel === 'high'" class="risk-live-dot"></span>{{ ct.id }}</td>
                              <td>{{ ct.name }}</td>
                              <td>{{ ct.company }}</td>
                              <td>{{ ct.supplier }}</td>
                              <td>{{ ct.amountYi.toFixed(2) }}</td>
                              <td>{{ ct.signDate }}</td>
                              <td><span class="risk-chip" :class="contractRiskClass(ct.riskLevel)">{{ contractRiskLabel(ct.riskLevel) }}</span></td>
                              <td>{{ ct.status }}</td>
                              <td>
                                <div class="contract-op-row">
                                  <button type="button" class="mini-op-btn" @click.stop="selectContract(ct.id)">查看详情</button>
                                  <button type="button" class="mini-op-btn" @click.stop="focusContractBottom">履约监控</button>
                                  <button type="button" class="mini-op-btn warning" @click.stop="launchContractWorkOrder">派发工单</button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>

                  <aside class="glass-panel contract-ai-panel breath-glow">
                    <div class="contract-section-head">
                      <h3 class="contract-section-title glow-title">AI 合同智能解析中心</h3>
                      <span class="contract-ai-badge">{{ selectedContract?.badge || '自动解析中' }}</span>
                    </div>
                    <div class="contract-ai-meta">
                      <div class="contract-ai-meta-card">
                        <span class="contract-ai-meta-label">交付进度</span>
                        <strong>{{ selectedContract?.deliveryProgress ?? 0 }}%</strong>
                      </div>
                      <div class="contract-ai-meta-card warning">
                        <span class="contract-ai-meta-label">付款进度</span>
                        <strong>{{ selectedContract?.paymentProgress ?? 0 }}%</strong>
                      </div>
                      <div class="contract-ai-meta-card">
                        <span class="contract-ai-meta-label">场景分类</span>
                        <strong>{{ selectedContract?.scene || contractScene }}</strong>
                      </div>
                    </div>
                    <div class="contract-risk-tags">
                      <span v-for="tag in selectedContractTags" :key="tag" class="contract-risk-tag">{{ tag }}</span>
                    </div>

                    <section class="contract-ai-section">
                      <h4 class="contract-ai-title">合同基础信息卡片</h4>
                      <div class="contract-info-grid">
                        <div v-for="item in selectedContractInfoItems" :key="item.label" class="contract-info-item">
                          <span class="contract-info-label">{{ item.label }}</span>
                          <strong class="contract-info-value" :class="{ risk: item.risk }">{{ item.value }}</strong>
                        </div>
                      </div>
                    </section>

                    <section class="contract-ai-section">
                      <h4 class="contract-ai-title">合同原文展示 + AI 风险条款智能标红</h4>
                      <div class="contract-clause-list">
                        <div
                          v-for="(clause, index) in selectedContractClauses"
                          :key="`${clause.article}-${index}`"
                          class="contract-clause-item"
                          :class="{ highlight: clause.risk, active: contractClauseIndex >= index && clause.risk }"
                        >
                          <div class="contract-clause-head">
                            <span class="clause-warning" v-if="clause.risk">▲</span>
                            <strong>{{ clause.article }}</strong>
                            <span class="contract-clause-tag" v-if="clause.risk">{{ clause.tag }}</span>
                          </div>
                          <div class="contract-clause-text">{{ clause.text }}</div>
                        </div>
                      </div>
                    </section>

                    <section class="contract-ai-section">
                      <h4 class="contract-ai-title">合规依据 + 风险说明</h4>
                      <div class="contract-compliance-list">
                        <div v-for="item in selectedContractCompliance" :key="item.violated" class="contract-compliance-item">
                          <div class="contract-compliance-head">
                            <span class="risk-chip high">{{ item.level }}</span>
                            <strong>{{ item.violated }}</strong>
                          </div>
                          <div class="contract-compliance-line"><span>违反条款：</span>{{ item.rule }}</div>
                          <div class="contract-compliance-line"><span>合规依据：</span>{{ item.basis }}</div>
                          <div class="contract-compliance-line"><span>整改建议：</span>{{ item.suggestion }}</div>
                        </div>
                      </div>
                    </section>

                    <section class="contract-ai-section">
                      <h4 class="contract-ai-title">AI 研判结论</h4>
                      <div class="contract-ai-summary">
                        <div class="contract-ai-summary-level">风险等级：{{ selectedContractConclusion.level }}</div>
                        <ol class="contract-ai-summary-list">
                          <li v-for="item in selectedContractConclusion.summary" :key="item">{{ item }}</li>
                        </ol>
                        <div class="contract-ai-advice">{{ selectedContractConclusion.advice }}</div>
                      </div>
                    </section>

                    <div class="contract-ai-actions">
                      <button type="button" class="contract-action-btn" @click="focusContractBottom">查看履约</button>
                      <button type="button" class="contract-action-btn" @click="pushContractToast('检测到高风险合同，已联动查询关联支付流水')">查看关联支付</button>
                      <button type="button" class="contract-action-btn" @click="pushContractToast('已定位关联采购项目 CG-2026-0300')">查看采购项目</button>
                      <button type="button" class="contract-action-btn warning" @click="pushContractToast('检测到高风险合同，已生成预警工单')">发起预警</button>
                      <button type="button" class="contract-action-btn primary" :class="{ pulse: contractDemoStarted }" @click="launchContractWorkOrder">派发整改工单</button>
                    </div>
                  </aside>
                </div>

                <section ref="contractBottomRef" class="glass-panel contract-bottom-panel breath-glow">
                  <div class="contract-section-head">
                    <h3 class="contract-section-title glow-title">履约进度对比双轴图</h3>
                    <span class="contract-section-sub">超进度付款风险 → 已自动预警</span>
                  </div>
                  <EChart class="contract-bottom-chart" :option="contractPerformanceOption" />
                </section>
              </section>
            </template>

            <!-- ====== 产权穿透 ====== -->
            <template v-if="drillMode.module === 'property'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团产权架构穿透</h3>
                <EChart class="drill-chart" :option="propertyTreeChart" />
                <div class="funds-mini-row" style="margin-top:10px">
                  <div class="fm-kpi" v-for="pk in propertyKPIs" :key="pk.label">
                    <span class="fmk-label">{{ pk.label }}</span><span class="fmk-val">{{ pk.value }}</span>
                  </div>
                </div>
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 产权分布</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>子公司</th><th>持股比例</th><th>层级</th><th>SPV 数量</th><th>风险节点</th></tr></thead>
                    <tbody>
                      <tr v-for="c in filterCompaniesBySector" :key="c.id">
                        <td>{{ c.name }}</td>
                        <td>{{ c.id === 'c4' ? '100%' : c.id === 'c1' ? '100%' : '85%' }}</td>
                        <td>{{ c.id === 'c1' ? 5 : c.id === 'c4' ? 3 : 2 }}</td>
                        <td>{{ c.id === 'c1' ? 3 : c.id === 'c4' ? 2 : 1 }}</td>
                        <td><RiskBadge :level="c.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }} · 股权结构</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>层级</th><th>主体名称</th><th>持股比例</th><th>类型</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="pr in filterPropertyByCompany" :key="pr.id">
                        <td>{{ pr.layers }}</td><td>{{ pr.label }}</td><td>{{ pr.share || '-' }}</td>
                        <td>{{ pr.type || '-' }}</td><td><RiskBadge :level="pr.level || 'low'" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="detail-meta-row">
                  <div class="dm-item" v-for="r in PROPERTY_RISK_NODES" :key="r.id">
                    <span class="dm-k">{{ r.label }}</span>
                    <span class="dm-v" style="color:var(--risk-red)">{{ r.note }}</span>
                  </div>
                </div>
                <KnowledgeGraph :graphData="GRAPH_PROPERTY" :height="220" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="ai-conclusion-box">
                  <div class="ai-conc-title">🔍 关联方识别结论</div>
                  <p>SPV-A1（BVI）→ SPV-A2（开曼）存在 5 层嵌套架构，实控人穿透失败。某贸易公司与华东电力存在关联交易嫌疑。</p>
                  <p class="conc-high">⚠ 建议立即启动实控人穿透核查，将 SPV-A1/A2 标记为高风险关联方。</p>
                </div>
                <div class="compact-table-wrap" style="margin-top:10px">
                  <table class="compact-table">
                    <thead><tr><th>工单编号</th><th>标题</th><th>状态</th><th>负责人</th></tr></thead>
                    <tbody>
                      <tr><td>WO-2026-0051</td><td>SPV-A1/BVI 实控人穿透核查</td><td>待派单</td><td>合规部-陈某</td></tr>
                      <tr><td>WO-2026-0052</td><td>华东电力关联交易回溯</td><td>核查中</td><td>审计部-李某</td></tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>

            <!-- ====== 财务穿透 ====== -->
            <template v-if="drillMode.module === 'finance'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团财务总览</h3>
                <div class="funds-mini-row">
                  <div class="fm-kpi" v-for="fk in FINANCE_KPIS" :key="fk.label">
                    <span class="fmk-label">{{ fk.label }}</span>
                    <span class="fmk-val" :style="{ color: fk.warn ? 'var(--risk-red)' : '#3b82f6' }">{{ fk.value }}</span>
                  </div>
                </div>
                <EChart class="drill-chart" :option="financeSectorChart" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 财务指标</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>指标</th><th>本期</th><th>同比</th><th>预算完成率</th><th>状态</th></tr></thead>
                    <tbody>
                      <tr v-for="f in filteredFinanceBySector" :key="f.id">
                        <td>{{ f.account }}</td><td>{{ f.actualWan }}万</td>
                        <td>{{ f.deviation }}</td>
                        <td>{{ ((f.actualWan / f.budgetWan) * 100).toFixed(1) }}%</td>
                        <td><RiskBadge :level="f.level" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }} · 财务明细</h3>
                <div class="detail-meta-row">
                  <div class="dm-item"><span class="dm-k">营业收入</span><span class="dm-v">¥{{ drillNode.id === 'c3' ? '620' : '1,280' }} 亿</span></div>
                  <div class="dm-item"><span class="dm-k">管理费用</span><span class="dm-v" style="color:var(--risk-red)">¥{{ drillNode.id === 'c3' ? '86' : '72' }} 亿</span></div>
                  <div class="dm-item"><span class="dm-k">同比变化</span><span class="dm-v" style="color:var(--risk-red)">+34%</span></div>
                  <div class="dm-item"><span class="dm-k">预算偏差</span><span class="dm-v" style="color:var(--risk-red)">+48%</span></div>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>ID</th><th>科目</th><th>预算(万)</th><th>实际(万)</th><th>偏差</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="f in FINANCE_EXPENSES" :key="f.id" :class="{ 'row-risk': f.level === 'high' }">
                        <td>{{ f.id }}</td><td>{{ f.account }}</td><td>{{ f.budgetWan }}</td>
                        <td :style="{ color: f.level === 'high' ? 'var(--risk-red)' : '' }">{{ f.actualWan }}</td>
                        <td :style="{ color: f.level === 'high' ? 'var(--risk-red)' : '' }">{{ f.deviation }}</td>
                        <td><RiskBadge :level="f.level" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>凭证号</th><th>日期</th><th>科目</th><th>金额(万)</th><th>收款方</th><th>风险标记</th></tr></thead>
                    <tbody>
                      <tr v-for="v in FINANCE_VOUCHERS" :key="v.id" :class="{ 'row-risk': v.risk }">
                        <td>{{ v.id }}</td><td>{{ v.date }}</td><td>{{ v.account }}</td>
                        <td>{{ v.amountWan }}</td><td>{{ v.payee }}</td>
                        <td><span v-if="v.risk" style="color:var(--risk-red)">{{ v.riskNote }}</span><span v-else class="sts-safe">正常</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style="margin-top:10px;text-align:center">
                  <button class="btn btn-primary" @click="goScene(RISK_SAMPLES.find(r=>r.id==='R03'))">生成管理费用审计工单</button>
                </div>
              </template>
            </template>

            <!-- ====== 薪酬穿透 ====== -->
            <template v-if="drillMode.module === 'salary'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团薪酬总览</h3>
                <div class="funds-mini-row">
                  <div class="fm-kpi"><span class="fmk-label">年度薪酬总额</span><span class="fmk-val">329.0 亿</span></div>
                  <div class="fm-kpi"><span class="fmk-label">人均薪酬</span><span class="fmk-val">9.8 万</span></div>
                  <div class="fm-kpi"><span class="fmk-label">同比增幅</span><span class="fmk-val" style="color:var(--risk-orange)">+8.7%</span></div>
                  <div class="fm-kpi"><span class="fmk-label">异常科目</span><span class="fmk-val" style="color:var(--risk-red)">4 项</span></div>
                </div>
                <div style="display:flex;gap:10px;margin-top:10px">
                  <EChart class="drill-chart half" :option="salaryBarChart" />
                  <EChart class="drill-chart half" :option="salaryPieChart" />
                </div>
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 薪酬汇总</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>子公司</th><th>人数</th><th>薪酬总额(亿)</th><th>人均(万)</th><th>同比</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="s in SALARY_DATA.filter(x => (drillNode.id === 's3' && x.sector === '工程建设') || (drillNode.id === 's5' && x.sector === '科创与其他'))" :key="s.sector" :class="{ 'row-risk': s.warn }">
                        <td>{{ s.sector === '工程建设' ? '海外工程总承包公司' : '数字科技公司' }}</td>
                        <td>{{ s.headcount }}</td>
                        <td>{{ (s.totalSalaryWan / 10000).toFixed(1) }}</td>
                        <td>{{ s.avgSalaryWan }}</td>
                        <td :style="{ color: s.warn ? 'var(--risk-red)' : '' }">{{ s.deviation }}</td>
                        <td><RiskBadge :level="s.warn ? 'high' : 'low'" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }} · 薪酬明细</h3>
                <div class="detail-meta-row">
                  <div class="dm-item"><span class="dm-k">员工人数</span><span class="dm-v">{{ drillNode.id === 'c4' ? '8,200' : '1,200' }}</span></div>
                  <div class="dm-item"><span class="dm-k">人均薪酬</span><span class="dm-v">{{ drillNode.id === 'c4' ? '8.78万' : '12.50万' }}</span></div>
                  <div class="dm-item"><span class="dm-k">同比增幅</span><span class="dm-v" style="color:var(--risk-red)">{{ drillNode.id === 'c4' ? '+14.3%' : '+11.6%' }}</span></div>
                  <div class="dm-item"><span class="dm-k">异常标记</span><span class="dm-v" style="color:var(--risk-red)">{{ drillNode.id === 'c7' ? '隐性薪酬' : '奖金超预算' }}</span></div>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>ID</th><th>科目</th><th>收款方</th><th>金额(万)</th><th>频次</th><th>风险判定</th></tr></thead>
                    <tbody>
                      <tr v-for="an in SALARY_ANOMALIES" :key="an.id" class="row-risk">
                        <td>{{ an.id }}</td><td>{{ an.account }}</td><td>{{ an.payee }}</td>
                        <td style="color:var(--risk-red)">{{ an.amountWan }}</td>
                        <td>{{ an.frequency }}</td>
                        <td><span style="color:var(--risk-red)">{{ an.risk }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <KnowledgeGraph :graphData="GRAPH_SALARY" :height="200" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>凭证号</th><th>日期</th><th>科目</th><th>收款方</th><th>金额(万)</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="an in SALARY_ANOMALIES" :key="an.id" class="row-risk">
                        <td>PZ-SAL-{{ an.id }}</td><td>2026-04-{{ 10 + parseInt(an.id.slice(1)) }}</td>
                        <td>{{ an.account }}</td><td>{{ an.payee }}</td>
                        <td>{{ an.amountWan }}</td>
                        <td><RiskBadge level="high" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style="margin-top:10px;text-align:center">
                  <button class="btn btn-primary">生成隐性薪酬核查工单</button>
                </div>
              </template>
            </template>

            <!-- ====== 境外穿透 ====== -->
            <template v-if="drillMode.module === 'overseas'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">全球资产分布总览</h3>
                <div class="funds-mini-row">
                  <div class="fm-kpi"><span class="fmk-label">覆盖国家</span><span class="fmk-val">15 国</span></div>
                  <div class="fm-kpi"><span class="fmk-label">境外机构</span><span class="fmk-val">32 家</span></div>
                  <div class="fm-kpi"><span class="fmk-label">境外总资产</span><span class="fmk-val">405 亿</span></div>
                  <div class="fm-kpi"><span class="fmk-label">高风险区域</span><span class="fmk-val" style="color:var(--risk-red)">2 个</span></div>
                </div>
                <EChart class="drill-chart" :option="overseasRegionChart" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 资产汇总</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>国家/地区</th><th>资产(亿)</th><th>账户数</th><th>项目数</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="oa in filteredOverseasByRegion" :key="oa.country" :class="{ 'row-risk': oa.riskLevel === 'high' }">
                        <td>{{ oa.country }}</td><td>{{ (oa.assetsWan / 10000).toFixed(1) }}</td>
                        <td>{{ oa.accounts }}</td><td>{{ oa.projects }}</td>
                        <td><RiskBadge :level="oa.riskLevel" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }} · 项目详情</h3>
                <div class="detail-meta-row" v-if="overseasProjectDetail">
                  <div class="dm-item"><span class="dm-k">项目名称</span><span class="dm-v">{{ overseasProjectDetail.name }}</span></div>
                  <div class="dm-item"><span class="dm-k">合同金额</span><span class="dm-v">{{ overseasProjectDetail.contractYi }} 亿</span></div>
                  <div class="dm-item"><span class="dm-k">进度</span><span class="dm-v">{{ overseasProjectDetail.progress }}</span></div>
                  <div class="dm-item"><span class="dm-k">风险</span><span class="dm-v"><RiskBadge :level="overseasProjectDetail.level" /></span></div>
                </div>
                <div class="compact-table-wrap" style="margin-top:10px">
                  <table class="compact-table">
                    <thead><tr><th>账户</th><th>银行</th><th>余额(万)</th><th>币种</th><th>最后活跃</th><th>延迟</th></tr></thead>
                    <tbody>
                      <tr v-for="oa in filteredOverseasAccounts" :key="oa.id" :class="{ 'row-risk': oa.delay }">
                        <td>{{ oa.id }}</td><td>{{ oa.bank }}</td><td>{{ oa.balanceWan }}</td>
                        <td>{{ oa.currency }}</td><td>{{ oa.lastActivity }}</td>
                        <td><span v-if="oa.delay" style="color:var(--risk-red)">⚠ 延迟</span><span v-else class="sts-safe">正常</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="ai-conclusion-box">
                  <div class="ai-conc-title">🔍 资金合规审查</div>
                  <p>项目：某国路桥 PPP（合同 12.4 亿，进度 72%，超预算 18.6%）</p>
                  <p class="conc-high">⚠ 境外账户回款延迟 >45 天，Bangkok Bank 账户最后活跃 2026-03-15。</p>
                  <p>渣打银行(新加坡)账户余额 3.12 亿 SGD，资金归集率仅 62%，低于集团 75% 要求。</p>
                </div>
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="ai-conclusion-box">
                  <div class="ai-conc-title">📋 合规结论</div>
                  <p class="conc-high">⚠ 东南亚区域存在 2 项合规风险：回款延迟 + 资金归集率不达标。</p>
                  <p>建议措施：(1) 启动境外资金回流专项 (2) 对延迟账户设置自动预警 (3) 评估 ZZ 风险敞口。</p>
                </div>
                <div class="compact-table-wrap" style="margin-top:10px">
                  <table class="compact-table">
                    <thead><tr><th>工单编号</th><th>标题</th><th>状态</th><th>负责人</th></tr></thead>
                    <tbody>
                      <tr><td>WO-2026-0061</td><td>境外资金回款延迟核查</td><td>待派单</td><td>合规部-赵某</td></tr>
                      <tr><td>WO-2026-0062</td><td>东南亚区域资金归集整改</td><td>待派单</td><td>司库中心-钱某</td></tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>

            <!-- ====== 金融穿透 ====== -->
            <template v-if="drillMode.module === 'banking'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团金融业务总览</h3>
                <div class="funds-mini-row">
                  <div class="fm-kpi" v-for="bk in BANKING_RISK_EXPOSURES" :key="bk.label">
                    <span class="fmk-label">{{ bk.label }}</span>
                    <span class="fmk-val" :style="{ color: bk.warn ? 'var(--risk-red)' : '#3b82f6' }">{{ bk.value }}</span>
                  </div>
                </div>
                <EChart class="drill-chart" :option="bankingGaugeChart" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 金融业务汇总</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>子公司</th><th>业务类型</th><th>金额(亿)</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="b in BANKING_OVERVIEW" :key="b.id">
                        <td>{{ b.counterparty }}</td><td>{{ b.type }}</td><td>{{ b.amountYi }}</td>
                        <td><RiskBadge :level="b.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }} · 金融交易</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>ID</th><th>类型</th><th>对手方</th><th>金额(亿)</th><th>利率</th><th>到期日</th><th>风险</th></tr></thead>
                    <tbody>
                      <tr v-for="b in BANKING_OVERVIEW" :key="b.id" :class="{ 'row-risk': b.risk === 'high' }">
                        <td>{{ b.id }}</td><td>{{ b.type }}</td><td>{{ b.counterparty }}</td>
                        <td>{{ b.amountYi }}</td><td>{{ b.rate }}</td><td>{{ b.maturity }}</td>
                        <td><RiskBadge :level="b.risk" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="detail-meta-row">
                  <div class="dm-item"><span class="dm-k">交易类型</span><span class="dm-v">债券投资</span></div>
                  <div class="dm-item"><span class="dm-k">对手方</span><span class="dm-v" style="color:var(--risk-red)">某地产集团</span></div>
                  <div class="dm-item"><span class="dm-k">金额</span><span class="dm-v">3.2 亿</span></div>
                  <div class="dm-item"><span class="dm-k">利率</span><span class="dm-v">6.50%</span></div>
                  <div class="dm-item"><span class="dm-k">到期日</span><span class="dm-v">2026-12</span></div>
                  <div class="dm-item"><span class="dm-k">风险标记</span><span class="dm-v" style="color:var(--risk-red)">⚠ 主体评级下调</span></div>
                </div>
                <KnowledgeGraph :graphData="GRAPH_BANKING" :height="200" style="margin-top:10px" />
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="ai-conclusion-box">
                  <div class="ai-conc-title">📋 风险评估结论</div>
                  <p class="conc-high">⚠ 某地产集团债券（B03）主体评级已下调至 BB，存在违约风险。</p>
                  <p>单一客户集中度 14.2%，接近监管上限 15%，建议暂停新增同类投资。</p>
                  <p>建议：(1) 启动信用风险应急处置 (2) 评估债券减值的财务影响 (3) 向董事会报告。</p>
                </div>
                <div style="margin-top:10px;text-align:center">
                  <button class="btn btn-primary">生成信用风险警示工单</button>
                </div>
              </template>
            </template>

            <!-- ====== 会计穿透 ====== -->
            <template v-if="drillMode.module === 'accounting'">
              <template v-if="drillNode?.level === 0">
                <h3 class="p-title">集团会计质量总览</h3>
                <EChart class="drill-chart" :option="accountingScoreChart" />
                <div class="funds-mini-row" style="margin-top:10px">
                  <div class="fm-kpi"><span class="fmk-label">最高评分</span><span class="fmk-val" style="color:#22c55e">92</span></div>
                  <div class="fm-kpi"><span class="fmk-label">最低评分</span><span class="fmk-val" style="color:var(--risk-red)">78</span></div>
                  <div class="fm-kpi"><span class="fmk-label">问题条目</span><span class="fmk-val" style="color:var(--risk-orange)">9 条</span></div>
                  <div class="fm-kpi"><span class="fmk-label">需整改</span><span class="fmk-val" style="color:var(--risk-red)">4 条</span></div>
                </div>
              </template>
              <template v-if="drillNode?.level === 1">
                <h3 class="p-title">{{ drillNode.label }} · 会计质量</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>板块</th><th>质量评分</th><th>问题数</th><th>主要问题</th></tr></thead>
                    <tbody>
                      <tr v-for="aq in ACCOUNTING_QUALITY.filter(x => (drillNode.id === 's2' && x.sector === '装备制造') || (drillNode.id === 's3' && x.sector === '工程建设'))" :key="aq.sector">
                        <td>{{ aq.sector }}</td>
                        <td :style="{ color: aq.score < 85 ? 'var(--risk-red)' : aq.score < 90 ? 'var(--risk-orange)' : '#22c55e' }">{{ aq.score }}</td>
                        <td>{{ aq.issues }}</td>
                        <td>{{ aq.details }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 2">
                <h3 class="p-title">{{ drillNode.label }} · 会计质量明细</h3>
                <div class="detail-meta-row">
                  <div class="dm-item"><span class="dm-k">质量评分</span><span class="dm-v" :style="{ color: drillNode.id === 'c4' ? 'var(--risk-red)' : 'var(--risk-orange)' }">{{ drillNode.id === 'c4' ? '78' : '85' }}</span></div>
                  <div class="dm-item"><span class="dm-k">问题数</span><span class="dm-v">{{ drillNode.id === 'c4' ? '4' : '2' }}</span></div>
                  <div class="dm-item"><span class="dm-k">主要问题</span><span class="dm-v" style="color:var(--risk-red)">{{ drillNode.id === 'c4' ? '完工百分比偏差' : '提前确认收入' }}</span></div>
                </div>
              </template>
              <template v-if="drillNode?.level === 3">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>ID</th><th>日期</th><th>分录</th><th>金额(万)</th><th>风险</th><th>说明</th></tr></thead>
                    <tbody>
                      <tr v-for="e in ACCOUNTING_ENTRIES" :key="e.id" :class="{ 'row-risk': e.risk }">
                        <td>{{ e.id }}</td><td>{{ e.date }}</td><td class="ct-desc" style="max-width:250px">{{ e.entry }}</td>
                        <td>{{ e.amountWan }}</td>
                        <td><RiskBadge :level="e.risk ? 'high' : 'low'" /></td>
                        <td :style="{ color: e.risk ? 'var(--risk-red)' : '', fontSize: '10px' }">{{ e.riskNote }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="drillNode?.level === 4">
                <h3 class="p-title">{{ drillNode.label }}</h3>
                <div class="ai-conclusion-box">
                  <div class="ai-conc-title">📋 审计结论</div>
                  <p class="conc-high">⚠ 发现 4 条需整改的会计分录异常：</p>
                  <p>1. 海外工程公司完工百分比与实际进度偏离 ≥15%（E001）</p>
                  <p>2. 重型装备集团提前确认收入，合同尚未验收（E002）</p>
                  <p>3. 数字科技公司研发支出资本化条件存疑（E004）</p>
                  <p>建议：启动专项审计，要求各单位限期整改并在下月报告。</p>
                </div>
                <div class="compact-table-wrap" style="margin-top:10px">
                  <table class="compact-table">
                    <thead><tr><th>工单编号</th><th>标题</th><th>状态</th><th>负责人</th></tr></thead>
                    <tbody>
                      <tr><td>WO-2026-0071</td><td>会计质量专项审计</td><td>待派单</td><td>审计部-周某</td></tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>

            <!-- 未选节点 -->
            <div v-if="!drillNode" class="drill-empty-state">
              <div style="font-size:40px;margin-bottom:10px">📂</div>
              <p>请从左侧树形结构中选择一个节点</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== FOOTER ==================== -->
    <footer class="dbrd-footer">
      <button
        v-for="t in footerTabs"
        :key="t.routeName"
        class="ft-tab"
        :class="{ 'ft-sel': $route.name === t.routeName }"
        @click="router.push({ name: t.routeName })"
      >{{ t.label }}</button>
    </footer>

    <!-- ==================== AI 智能助手弹窗 ==================== -->
    <Teleport to="body">
      <div v-if="showAIDialog" class="ai-dialog-backdrop" @click.self="showAIDialog = false">
        <div class="ai-dialog">
          <div class="ai-dialog-header">
            <span class="ai-dialog-title">🤖 AI 智能中台</span>
            <button class="ai-dialog-close" @click="showAIDialog = false">✕</button>
          </div>
          <!-- Agent 选择器 -->
          <div class="ai-agent-selector">
            <button
              class="ai-agent-btn"
              :class="{ 'ai-agent-sel': aiAgent === 'qa' }"
              @click="switchAgent('qa')"
            >💬 智能问数</button>
            <button
              class="ai-agent-btn"
              :class="{ 'ai-agent-sel': aiAgent === 'compliance' }"
              @click="switchAgent('compliance')"
            >⚖️ 合规审查</button>
            <button
              class="ai-agent-btn"
              :class="{ 'ai-agent-sel': aiAgent === 'risk' }"
              @click="switchAgent('risk')"
            >🔍 风险研判</button>
          </div>
          <div class="ai-dialog-tabs">
            <button
              v-for="tab in aiTabs"
              :key="tab"
              class="ai-dtab"
              :class="{ 'ai-dtab-sel': aiActiveTab === tab }"
              @click="aiActiveTab = tab"
            >{{ tab }}</button>
          </div>
          <div class="ai-dialog-body">
            <!-- 智能问数 / 合规审查 / 风险研判 -->
            <div v-if="aiActiveTab === '智能问数'" class="ai-qa-full">
              <!-- 语音提问模拟 -->
              <div class="ai-voice-bar">
                <button
                  class="ai-voice-btn"
                  :class="{ 'ai-voice-active': voiceListening }"
                  @click="simulateVoice"
                  :disabled="aiStreaming"
                  title="语音提问"
                >🎤</button>
                <span v-if="voiceListening" class="ai-voice-text">{{ voiceText }}</span>
                <span v-else class="ai-voice-hint">点击麦克风体验语音提问</span>
              </div>
              <div class="ai-presets-row">
                <button v-for="q in getCurrentPresets()" :key="q" class="ai-preset-btn" @click="askAI(q)" :disabled="aiStreaming">{{ q }}</button>
              </div>
              <div v-if="aiThinking.length" class="ai-thinking-lg">
                <div class="ai-think-title">🧠 AI 思考过程（{{ aiAgent === 'compliance' ? '合规审查' : aiAgent === 'risk' ? '风险研判' : '智能问数' }} Agent）</div>
                <div v-for="(step, i) in aiThinking" :key="i" class="ai-think-line">
                  <span class="ai-think-dot"></span>{{ step }}
                </div>
              </div>
              <div v-if="aiAnswer" class="ai-answer-lg">
                <div class="ai-answer-title">📋 {{ aiAgent === 'compliance' ? '合规审查结论' : aiAgent === 'risk' ? '风险研判报告' : '答案' }}</div>
                <div class="ai-answer-content">{{ aiAnswer }}</div>
              </div>
              <div v-if="aiChart" class="ai-chart-full">
                <EChart class="ai-dialog-chart" :option="aiChartOption" />
              </div>
            </div>
            <!-- 主动预警 -->
            <div v-if="aiActiveTab === '主动预警'" class="ai-alerts-full">
              <div v-for="a in proactiveAlerts" :key="a.id" class="ai-alert-card" @click="a.expanded = !a.expanded">
                <div class="aac-header">
                  <span class="aac-dot" :class="'aa-' + a.level"></span>
                  <span class="aac-title">{{ a.title }}</span>
                  <span class="aac-time">{{ a.time }}</span>
                </div>
                <div v-if="a.expanded" class="aac-detail">{{ a.detail }}</div>
              </div>
            </div>
            <!-- 关联分析 -->
            <div v-if="aiActiveTab === '关联分析'" class="ai-graph-full">
              <div class="ai-graph-input-row">
                <input v-model="graphQuery" class="ai-graph-input" placeholder="输入供应商/人员名称进行关联分析..." @keyup.enter="runGraphAnalysis" />
                <button class="btn btn-primary" @click="runGraphAnalysis">分析</button>
              </div>
              <div v-if="graphThinking.length" class="ai-thinking-lg">
                <div v-for="(step, i) in graphThinking" :key="i" class="ai-think-line"><span class="ai-think-dot"></span>{{ step }}</div>
              </div>
              <KnowledgeGraph v-if="graphReady" :graph-data="graphData" :height="280" />
              <!-- 结构化分析结论 -->
              <div v-if="graphAnalysisResult" class="graph-analysis-result">
                <div class="gar-title">📊 关联分析结论</div>
                <div class="gar-grid">
                  <div class="gar-item">
                    <span class="gar-label">实际控制人</span>
                    <span class="gar-value" :style="{ color: graphAnalysisResult.riskLevel === 'high' ? 'var(--risk-red)' : 'var(--risk-orange)' }">{{ graphAnalysisResult.controller }}</span>
                  </div>
                  <div class="gar-item">
                    <span class="gar-label">关联企业数量</span>
                    <span class="gar-value">{{ graphAnalysisResult.relatedCount }} 家</span>
                  </div>
                  <div class="gar-item">
                    <span class="gar-label">风险等级</span>
                    <span class="gar-value">
                      <RiskBadge :level="graphAnalysisResult.riskLevel" />
                    </span>
                  </div>
                </div>
                <div class="gar-paths">
                  <div class="gar-subtitle">🔗 风险路径（最短路径）</div>
                  <div v-for="(path, i) in graphAnalysisResult.riskPaths" :key="i" class="gar-path">{{ path }}</div>
                </div>
                <div class="gar-note">💡 {{ graphAnalysisResult.riskNote }}</div>
              </div>
            </div>
            <!-- 报告生成 -->
            <div v-if="aiActiveTab === '报告生成'" class="ai-report-full">
              <button class="btn btn-primary" @click="generateReport" :disabled="reportGenerating">生成本月风险分析报告</button>
              <div v-if="reportThinking.length" class="ai-thinking-lg" style="margin-top:12px">
                <div v-for="(step, i) in reportThinking" :key="i" class="ai-think-line"><span class="ai-think-dot"></span>{{ step }}</div>
              </div>
              <div v-if="reportContent" class="ai-answer-lg" style="margin-top:12px">{{ reportContent }}</div>
            </div>
            <!-- 决策建议 -->
            <div v-if="aiActiveTab === '决策建议'" class="ai-decision-full">
              <button class="btn btn-primary" @click="getSuggestions">分析近6个月数据并给出建议</button>
              <div v-for="(s, i) in suggestions" :key="i" class="suggestion-card" v-if="suggestions.length" style="margin-top:12px">
                <div class="sug-header">
                  <span class="sug-level" :class="'sug-' + s.level">{{ s.level === 'critical' ? '重大' : s.level === 'high' ? '高' : '中' }}</span>
                  <span class="sug-title">{{ s.title }}</span>
                </div>
                <div class="sug-body">{{ s.detail }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import EChart from '@/components/EChart.vue'
import RiskBadge from '@/components/RiskBadge.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import {
  KPI, SECTORS, COMPANIES, RISK_SAMPLES, heatmapCells,
  INVESTMENT_PROJECTS, ACCOUNTS, FUND_FLOWS,
  INVESTMENT_PROJECT_PROFILES, INVESTMENT_RELATION_GRAPHS,
  CONTRACTS, PROCUREMENT_PACKAGES, CONTRACT_DETAILS, CONTRACT_COMMAND_CENTER,
  GRAPH_INVESTMENT, GRAPH_PROCUREMENT, GRAPH_CONTRACT,
  WORK_ORDERS, RECTIFICATION_FLOW, CONTRACT_NLP_STEPS,
  // 新增6大穿透模块数据
  FINANCE_EXPENSES, FINANCE_VOUCHERS, FINANCE_KPIS,
  SALARY_DATA, SALARY_ANOMALIES,
  OVERSEAS_ASSETS, OVERSEAS_ACCOUNTS, OVERSEAS_PROJECTS,
  BANKING_OVERVIEW, BANKING_RISK_EXPOSURES,
  ACCOUNTING_QUALITY, ACCOUNTING_ENTRIES,
  PROPERTY_TREE, PROPERTY_RISK_NODES,
  GRAPH_PROPERTY, GRAPH_FINANCE, GRAPH_SALARY,
  GRAPH_OVERSEAS, GRAPH_BANKING,
} from '@/mock/index.js'
import { getRiskCenterLocation, getPenetrationLocation } from '@/utils/navigation.js'

const router = useRouter()
import { matchQA, QA_PRESETS, AI_PROACTIVE_ALERTS, GRAPH_SUPPLIER_DATA } from '@/mock/qa.js'

// ==================== 核心状态 ====================
const drillMode = ref(null)
const drillNode = ref(null)
const drillPath = ref([])
const drillDetailRef = ref(null)
const toastShow = ref(true)
const toastText = ref('工程建设板块围标串标预警已触发')
const toastModule = ref('procurement')

const toastQueue = [
  { text: '工程建设板块围标串标预警已触发', module: 'procurement' },
  { text: '电力能源板块大额异常支付待司库复核', module: 'funds' },
  { text: '采购穿透：CG-2026-0501 围标概率 0.94', module: 'procurement' },
  { text: '装备制造板块管理费用同比 +34%', module: 'finance' },
  { text: '海外工程总承包公司境外回款延迟 >45天', module: 'overseas' },
  { text: '合同 CT-2026-0312 预付100%+无质保金 AI 已标红', module: 'contract' },
  { text: '数字科技公司隐性薪酬类支付频次上升', module: 'salary' },
  { text: '华东电力 SPV 多层嵌套待穿透核查', module: 'property' },
  { text: '某地产集团债券主体评级下调', module: 'banking' },
  { text: '海外工程公司完工百分比与实际进度偏离', module: 'accounting' },
]
let toastIndex = 0
let contractClockTimer
let contractDemoTimer
let contractClauseTimer
let contractKpiTimer

function onClickToast() {
  if (toastModule.value) {
    enterDrill(toastModule.value)
  }
}

// ==================== 日期 ====================
const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
const contractCenterData = CONTRACT_COMMAND_CENTER
const contractScene = ref(CONTRACT_COMMAND_CENTER.sceneTabs[0])
const selectedContractId = ref(CONTRACT_COMMAND_CENTER.defaultContractId)
const contractRiskFilter = ref('')
const contractStatusFilter = ref('')
const contractCurrentTime = ref(formatContractTime())
const contractDemoStarted = ref(false)
const contractClauseIndex = ref(-1)
const contractBottomRef = ref(null)
const contractAnimatedValues = reactive(Object.fromEntries(CONTRACT_COMMAND_CENTER.kpis.map((item) => [item.label, 0])))

// ==================== Footer Tabs ====================
const footerTabs = [
  { label: '驾驶舱总览', routeName: 'dashboard' },
  { label: '智能中台', routeName: 'smart' },
  { label: '风险预警', routeName: 'risk-center' },
  { label: '闭环处置', routeName: 'rectification' },
  { label: '价值对比', routeName: 'comparison' },
]

// ==================== 四模块看板图表 ====================
const boardInvestChart = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 8, right: 8, top: 8, bottom: 20 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: investmentBoardChartProjects.value.map((p) => p.id), axisLabel: { color: '#8ba3c7', fontSize: 10 } },
  yAxis: { type: 'value', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.08)' } } },
  series: [
    { name: '预算', type: 'bar', data: investmentBoardChartProjects.value.map((p) => p.budgetYi), itemStyle: { color: '#3b82f6' } },
    {
      name: '实际',
      type: 'bar',
      data: investmentBoardChartProjects.value.map((p) => ({
        value: p.actualYi,
        itemStyle: { color: p.actualYi > p.budgetYi ? '#ef4444' : '#22c55e' },
      })),
    },
  ],
}))

const boardFundsChart = computed(() => ({
  backgroundColor: 'transparent',
  series: [{ type: 'gauge', radius: '85%', center: ['50%', '55%'], startAngle: 200, endAngle: -20,
    axisLine: { lineStyle: { width: 6, color: [[fundsBoardStats.value.healthRateValue / 100, '#22c55e'], [1, '#3b82f6']] } },
    pointer: { length: '55%', width: 3, itemStyle: { color: '#e8f1ff' } },
    detail: { valueAnimation: true, formatter: '{value}%', fontSize: 14, color: '#e8f1ff', offsetCenter: [0, '65%'] },
    data: [{ value: fundsBoardStats.value.healthRateValue, name: '安全占比' }],
  }],
}))

const boardProcurementChart = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 8, right: 8, top: 8, bottom: 20 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: procurementBoardChart.value.map((item) => item.id.replace('CG-2026-', '')), axisLabel: { color: '#8ba3c7', fontSize: 10 } },
  yAxis: { type: 'value', max: 1, axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(59,130,246,0.08)' } } },
  series: [{
    type: 'bar', data: procurementBoardChart.value.map((item) => ({
      value: item.aiScore,
      itemStyle: { color: item.aiScore > 0.8 ? '#ef4444' : item.aiScore > 0.3 ? '#f97316' : '#22c55e' },
    })),
  }],
}))

// ==================== 合同驾驶舱总览 ====================
const contractBoardTotal = computed(() => contractCenterData.kpis[0].value)
const contractBoardAmount = computed(() => contractCenterData.kpis[1].value.toFixed(2))
const contractBoardHighRisk = computed(() => contractCenterData.kpis[2].value)
const contractBoardExpiring = computed(() => contractCenterData.kpis[4].value)
const contractBoardRiskLevel = computed(() => 'high')

const investmentProjectDetails = computed(() =>
  INVESTMENT_PROJECTS.map((p) => ({
    ...p,
    ...(INVESTMENT_PROJECT_PROFILES[p.id] || {}),
  }))
)

const investmentBoardProjectCount = computed(() => investmentProjectDetails.value.length)
const investmentBoardBudgetTotal = computed(() => toYiText(investmentProjectDetails.value.reduce((sum, p) => sum + p.budgetYi, 0)))
const investmentBoardRiskLevel = computed(() => investmentProjectDetails.value.some((p) => p.risk === 'critical') ? 'critical' : 'high')
const investmentBoardFocusNode = computed(() =>
  [...investmentProjectDetails.value].sort((a, b) => (b.overBudgetRate || 0) - (a.overBudgetRate || 0))[0] || investmentProjectDetails.value[0]
)
const investmentBoardFocusProject = computed(() => ({
  code: investmentBoardFocusNode.value?.id || 'P06',
  overBudgetRate: toPercentText(investmentBoardFocusNode.value?.overBudgetRate || 0),
}))
const investmentBoardChartProjects = computed(() =>
  [...investmentProjectDetails.value]
    .sort((a, b) => (b.overBudgetRate || 0) - (a.overBudgetRate || 0))
    .slice(0, 4)
)
const investmentCockpitKPIs = computed(() => {
  const totalBudget = investmentProjectDetails.value.reduce((sum, p) => sum + p.budgetYi, 0)
  const totalActual = investmentProjectDetails.value.reduce((sum, p) => sum + p.actualYi, 0)
  const overBudgetCount = investmentProjectDetails.value.filter((p) => p.actualYi > p.budgetYi).length
  const focus = investmentBoardFocusNode.value
  return [
    { label: '总投资计划', value: `${toYiText(totalBudget)} 亿` },
    { label: '已完成投资', value: `${toYiText(totalActual)} 亿` },
    { label: '项目总数', value: `${investmentProjectDetails.value.length} 个` },
    { label: '超预算项目', value: `${overBudgetCount} 个`, warn: overBudgetCount > 0 },
    { label: '重点预警项目', value: focus ? `${focus.name}` : '-' },
    { label: '重点偏差', value: focus ? signedPercentText(focus.overBudgetRate || 0) : '-', warn: !!focus && (focus.overBudgetRate || 0) > 0 },
  ]
})

const boardContractOverviewChart = computed(() => {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['50%', '50%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 11, color: '#e8f1ff' } },
      data: contractCenterData.riskDistribution.map((item) => ({ name: item.name, value: item.value })),
      itemStyle: { borderColor: '#040d1a', borderWidth: 2 },
      color: contractCenterData.riskDistribution.map((item) => item.color),
    }],
  }
})

const fundsBoardStats = computed(() => {
  const totalBalanceWan = ACCOUNTS.reduce((sum, account) => sum + account.balanceWan, 0)
  const riskyFlowAmountWan = FUND_FLOWS.filter((item) => item.risk).reduce((sum, item) => sum + item.amountWan, 0)
  const safeBalanceWan = ACCOUNTS.filter((account) => !account.riskFlag).reduce((sum, account) => sum + account.balanceWan, 0)
  const healthRateValue = totalBalanceWan ? Number(((safeBalanceWan / totalBalanceWan) * 100).toFixed(1)) : 0
  return {
    totalBalanceWan,
    riskAmountWan: riskyFlowAmountWan.toLocaleString(),
    totalBalanceYi: (totalBalanceWan / 10000).toFixed(1).replace(/\.0$/, ''),
    healthRateValue,
    healthRate: `${healthRateValue}%`,
  }
})

const fundsBoardRiskLevel = computed(() => FUND_FLOWS.some((item) => item.risk) ? 'high' : 'low')
const procurementBoardChart = computed(() =>
  [...PROCUREMENT_PACKAGES]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5)
)
const procurementBoardStats = computed(() => ({
  packageCount: PROCUREMENT_PACKAGES.length,
  maxAiScore: Math.max(...PROCUREMENT_PACKAGES.map((item) => item.aiScore), 0).toFixed(2),
  alertCount: PROCUREMENT_PACKAGES.filter((item) => item.aiScore >= 0.8).length,
}))
const procurementBoardRiskLevel = computed(() => procurementBoardStats.value.alertCount > 0 ? 'critical' : 'medium')

// ==================== LEFT COLUMN ====================

const dashboardRiskBuckets = computed(() => {
  const levelMap = {
    critical: { label: '重大', color: '#ef4444' },
    high: { label: '高', color: '#f97316' },
    medium: { label: '中', color: '#eab308' },
    low: { label: '低', color: '#22c55e' },
  }
  const rawCounts = Object.keys(levelMap).map((level) => ({
    level,
    ...levelMap[level],
    count: RISK_SAMPLES.filter((item) => item.level === level).length,
  }))
  const totalRaw = rawCounts.reduce((sum, item) => sum + item.count, 0) || 1
  let assigned = 0
  const scaled = rawCounts.map((item, index) => {
    if (index === rawCounts.length - 1) {
      return { ...item, value: KPI.openRisks - assigned }
    }
    const value = Math.max(1, Math.round((item.count / totalRaw) * KPI.openRisks))
    assigned += value
    return { ...item, value }
  })
  return scaled
})

// Panel 1: 风险分布环形图
const riskDonutOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['55%', '75%'], center: ['50%', '50%'],
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 12, color: '#e8f1ff' } },
    data: dashboardRiskBuckets.value.map((item) => ({
      value: item.value,
      name: item.label,
      itemStyle: { color: item.color },
    })),
    itemStyle: { borderColor: '#040d1a', borderWidth: 3 },
  }],
  graphic: [{
    type: 'text', left: 'center', top: 'center',
    style: { text: String(KPI.openRisks), fill: '#e8f1ff', fontSize: 28, fontWeight: 'bold', fontFamily: 'ui-monospace, monospace' },
  }, {
    type: 'text', left: 'center', top: '58%',
    style: { text: '总风险', fill: '#8ba3c7', fontSize: 10 },
  }],
}))

// Panel 2: 板块风险柱状图
const sectorRiskBarOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 8, right: 16, top: 8, bottom: 36 },
  xAxis: {
    type: 'category', data: SECTORS.map((s) => s.name),
    axisLabel: { color: '#8ba3c7', fontSize: 10, rotate: 30 },
    axisLine: { lineStyle: { color: 'rgba(0,229,255,0.15)' } },
  },
  yAxis: {
    type: 'value', max: 100,
    axisLabel: { color: '#8ba3c7', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } },
  },
  series: [{
    type: 'bar', barWidth: 18,
    data: SECTORS.map((s) => ({
      value: s.riskScore,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: s.riskScore > 65 ? '#ef4444' : s.riskScore > 55 ? '#f97316' : '#3b82f6' },
            { offset: 1, color: s.riskScore > 65 ? '#991b1b' : s.riskScore > 55 ? '#9a3412' : '#1d4ed8' },
          ],
        },
      },
    })),
    label: { show: true, position: 'top', color: '#e8f1ff', fontSize: 11, fontWeight: 'bold',
      formatter: (p) => {
        const s = SECTORS[p.dataIndex]
        return s.riskScore > 65 ? '高' : s.riskScore > 55 ? '中' : '低'
      },
    },
  }],
}))

// Panel 3: 资金池 KPI 微卡片
const fundsMicroKPIs = computed(() => {
  const totalBalanceWan = ACCOUNTS.reduce((sum, item) => sum + item.balanceWan, 0)
  const riskyBalanceWan = ACCOUNTS.filter((item) => item.riskFlag).reduce((sum, item) => sum + item.balanceWan, 0)
  const safeBalanceWan = totalBalanceWan - riskyBalanceWan
  return [
    { icon: '💵', label: '样本资金池', value: `${(totalBalanceWan / 10000).toFixed(1).replace(/\.0$/, '')}亿` },
    { icon: '✅', label: '安全余额', value: `${(safeBalanceWan / 10000).toFixed(1).replace(/\.0$/, '')}亿` },
    { icon: '📊', label: '流水样本', value: `${FUND_FLOWS.length}` },
    { icon: '🛡️', label: '异常支付', value: `${FUND_FLOWS.filter((item) => item.risk).length}` },
    { icon: '🚚', label: '风险余额', value: `${(riskyBalanceWan / 10000).toFixed(1).replace(/\.0$/, '')}亿` },
    { icon: '🏢', label: '法人总数', value: `${KPI.legalEntities}` },
  ]
})

// Panel 4: 合同履约
const topContracts = computed(() => CONTRACTS.slice(0, 4))
const dashboardRiskSamples = computed(() => RISK_SAMPLES.slice(0, 8))
const overpayWarning = computed(() => {
  const ct = CONTRACT_DETAILS['CT-2026-0312']
  if (ct?.performance?.overpaymentWarning) return 'CT-2026-0312 已全额付款，交付仅60%！'
  return null
})

// ==================== CENTER COLUMN ====================

// Row 1: 6 KPI 大数字
const centerKPIs = computed(() => [
  { label: '法人', display: String(KPI.legalEntities), sub: '全级次纳入', isRisk: false },
  { label: '账户', display: KPI.bankAccounts.toLocaleString('zh-CN'), sub: '司库全景池', isRisk: false },
  { label: '项目', display: String(KPI.investmentProjects), sub: '投资可下钻', isRisk: false },
  { label: '风险', display: String(KPI.openRisks), sub: '闭环可跟踪', isRisk: true },
  { label: '合同', display: String(contractBoardTotal.value), sub: 'AI条款智能解析', isRisk: false },
  { label: '样本资金', display: `${fundsBoardStats.value.totalBalanceYi}亿`, sub: '实时穿透监控', isRisk: FUND_FLOWS.some((item) => item.risk) },
])

// Row 2: 热力图
const { domains: hmDomains, cells: hmCells } = heatmapCells()
const heatmapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { position: 'top' },
  grid: { left: 72, right: 16, top: 8, bottom: 46 },
  xAxis: {
    type: 'category', data: hmDomains, splitArea: { show: true },
    axisLabel: { color: '#8ba3c7', fontSize: 10, interval: 0, rotate: 25 },
  },
  yAxis: {
    type: 'category', data: SECTORS.map((s) => s.name), splitArea: { show: true },
    axisLabel: { color: '#8ba3c7', fontSize: 10 },
  },
  visualMap: {
    min: 0, max: 100, calculable: true, orient: 'horizontal',
    left: 'center', bottom: 2, textStyle: { color: '#8ba3c7', fontSize: 10 },
    inRange: { color: ['#0a1628', '#1e40af', '#ea580c', '#dc2626'] },
  },
  series: [{
    type: 'heatmap', data: hmCells,
    label: { show: true, color: '#e8f1ff', fontSize: 9 },
    emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' } },
  }],
}))

// ==================== RIGHT COLUMN ====================

const dashboardAlertTrend = computed(() => {
  const monthLabels = Array.from({ length: 12 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - index))
    return `${date.getMonth() + 1}月`
  })
  const highRisk = monthLabels.map(() => 0)
  const mediumRisk = monthLabels.map(() => 0)
  WORK_ORDERS.forEach((item) => {
    const due = new Date(item.due)
    if (Number.isNaN(due.getTime())) return
    const label = `${due.getMonth() + 1}月`
    const index = monthLabels.findIndex((month) => month === label)
    if (index === -1) return
    const risk = RISK_SAMPLES.find((sample) => sample.id === item.riskId)
    if (risk?.level === 'critical' || risk?.level === 'high') highRisk[index] += 1
    else mediumRisk[index] += 1
  })
  return { monthLabels, highRisk, mediumRisk }
})

// Panel 5: 预警趋势
const alertTrendOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { data: ['高风险', '中低风险'], textStyle: { color: '#8ba3c7', fontSize: 10 }, top: 0, right: 0 },
  grid: { left: 8, right: 16, top: 32, bottom: 12 },
  xAxis: {
    type: 'category', boundaryGap: false,
    data: dashboardAlertTrend.value.monthLabels,
    axisLabel: { color: '#8ba3c7', fontSize: 9 },
  },
  yAxis: { type: 'value', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [
    {
      name: '高风险', type: 'line', smooth: true, symbol: 'none',
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.35)' }, { offset: 1, color: 'rgba(239,68,68,0.02)' }] } },
      lineStyle: { color: '#ef4444', width: 1.5 },
      data: dashboardAlertTrend.value.highRisk,
    },
    {
      name: '中低风险', type: 'line', smooth: true, symbol: 'none',
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(249,115,22,0.25)' }, { offset: 1, color: 'rgba(249,115,22,0.02)' }] } },
      lineStyle: { color: '#f97316', width: 1.5 },
      data: dashboardAlertTrend.value.mediumRisk,
    },
  ],
}))

// Panel 6: AI 智能助手
const showAIDialog = ref(false)
const aiPresets = ['新能源板块投资回报率', '围标串标风险态势', '资金归集率分析']
const aiThinking = ref([])
const aiAnswer = ref('')
const aiChart = ref(null)
const aiStreaming = ref(false)

// AI Agent 选择器
const aiAgent = ref('qa') // qa | compliance | risk
const voiceListening = ref(false)
const voiceText = ref('')

const compliancePresets = ['CT-2026-0312合同是否合规？', '华东电力9200万支付是否符合资金管理规定？']
const riskPresets = ['海外工程总承包公司综合风险评级？', '工程建设板块近6个月风险趋势？']

// 关联分析增强
const graphAnalysisResult = ref(null)

function switchAgent(agent) {
  aiAgent.value = agent
  aiThinking.value = []
  aiAnswer.value = ''
  aiChart.value = null
  graphAnalysisResult.value = null
}

function getCurrentPresets() {
  if (aiAgent.value === 'compliance') return compliancePresets
  if (aiAgent.value === 'risk') return riskPresets
  return aiPresets
}

async function simulateVoice() {
  if (voiceListening.value || aiStreaming.value) return
  voiceListening.value = true
  voiceText.value = '正在聆听...'
  await delay(1500)
  voiceText.value = '识别中...'
  await delay(800)
  const preset = getCurrentPresets()
  voiceText.value = preset[0]
  await delay(500)
  voiceListening.value = false
  voiceText.value = ''
  // 自动填入并开始回答
  askAIEnhanced(preset[0])
}

const proactiveAlerts = reactive(
  AI_PROACTIVE_ALERTS.map((a) => ({ ...a, expanded: false }))
)

function openAIAlert(alert) {
  showAIDialog.value = true
  aiActiveTab.value = '主动预警'
  nextTick(() => {
    const found = proactiveAlerts.find(p => p.id === alert.id)
    if (found) found.expanded = true
  })
}

const aiChartOption = computed(() => {
  if (!aiChart.value) return {}
  const c = aiChart.value
  if (c.type === 'bar') {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      xAxis: { type: 'category', data: c.x, axisLabel: { color: '#8ba3c7', fontSize: 10, rotate: 30 } },
      yAxis: { type: 'value', axisLabel: { color: '#8ba3c7', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
      series: [{ type: 'bar', data: c.y, itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] } }],
    }
  }
  if (c.type === 'pie') {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '55%'], label: { color: '#e8f1ff', fontSize: 10 },
        data: c.series, itemStyle: { borderColor: '#040d1a', borderWidth: 2 } }],
    }
  }
  if (c.type === 'line') {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      xAxis: { type: 'category', data: c.x, axisLabel: { color: '#8ba3c7', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#8ba3c7', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
      series: [{ type: 'line', smooth: true, data: c.y, lineStyle: { color: '#3b82f6', width: 2 }, areaStyle: { color: 'rgba(59,130,246,0.15)' } }],
    }
  }
  return {}
})

async function askAI(question) {
  if (aiStreaming.value) return
  aiStreaming.value = true
  aiThinking.value = []
  aiAnswer.value = ''
  aiChart.value = null
  graphAnalysisResult.value = null

  if (aiAgent.value === 'compliance') {
    await askCompliance(question)
  } else if (aiAgent.value === 'risk') {
    await askRisk(question)
  } else {
    await askQA(question)
  }

  aiStreaming.value = false
}

async function askEnhanced(question) {
  // For backward compat
  await askAI(question)
}

// 智能问数 Agent
async function askQA(question) {
  const qa = matchQA(question)
  if (!qa) { aiStreaming.value = false; return }

  for (const step of qa.thinking) {
    await delay(500 + Math.random() * 400)
    aiThinking.value.push(step)
  }
  await delay(400)

  const chars = qa.answer.split('')
  for (let i = 0; i < chars.length; i++) {
    aiAnswer.value += chars[i]
    await delay(25 + Math.random() * 20)
  }

  if (qa.chart) {
    await delay(300)
    aiChart.value = qa.chart
  }
}

// 合规审查 Agent
async function askCompliance(question) {
  const thinking = [
    '正在加载合规规则库... 共加载 217 条合规规则',
    '规则匹配中：合同条款·资金管理·关联交易...',
    '交叉比对合同数据库与资金流水...',
  ]
  let answer = ''

  if (question.includes('CT-2026-0312') || question.includes('合同')) {
    thinking.push('命中规则 R-0003（预付比例异常）、R-0017（质保金缺失）、R-0055（违约金上限）')
    answer = `【合规审查结论】\n\n合同 CT-2026-0312 存在 2 项重大合规风险：\n\n① 条款第二条 - 预付 100%，无分期保障（违反规则 R-0003）\n   《资金管理规定》第28条：大型设备采购预付款不得超过合同总额 30%。\n   当前约定：签约后 10 个工作日支付 100%（2.3 亿元），甲方丧失全部资金杠杆。\n\n② 条款第三条 - 缺失质保金条款（违反规则 R-0017）\n   《合同管理办法》第12条：大型设备采购应预留 5-10% 质保金。\n   当前约定：未设置质保金扣留机制，乙方在质保期内缺乏履约约束。\n\n附加风险：违约金上限未明确（条款第五条），逾期交付罚则无上限约束。\n\n整体合规评级：重大违规（2/8 项重大违规 + 1 项附加风险）\n\n建议：紧急冻结合同执行，修改付款方式为分阶段支付，补充质保金条款。`
  } else if (question.includes('9200万') || question.includes('支付')) {
    thinking.push('命中规则 R-0056（大额支付合同关联）、R-0072（关联方交易识别）')
    answer = `【合规审查结论】\n\n华东电力有限公司对「某设备贸易商行」9200 万元支付存在 2 项合规违规：\n\n① 大额支付未关联合同（违反规则 R-0056）\n   《资金管理规定》第35条：单笔 ≥5000 万元支付须关联有效合同编号。\n   当前状态：该笔支付无任何合同引用，无法核实交易真实性。\n\n② 疑似关联方交易（违反规则 R-0072）\n   《关联交易管理办法》第8条：与关联方交易须事前审批并充分披露。\n   当前状态：收款方与华东电力前采购副经理存在关联，未履行审批程序。\n\n整体合规评级：严重违规\n\n建议：立即冻结该笔支付，启动关联交易专项核查，追究相关人员责任。`
  } else {
    answer = '【合规审查结论】\n\n未匹配到具体规则，请提供合同编号或具体的交易信息以进行合规审查。'
  }

  for (const step of thinking) {
    await delay(500 + Math.random() * 400)
    aiThinking.value.push(step)
  }
  await delay(400)

  const chars = answer.split('')
  for (let i = 0; i < chars.length; i++) {
    aiAnswer.value += chars[i]
    await delay(15 + Math.random() * 15)
  }
}

// 风险研判 Agent
async function askRisk(question) {
  const thinking = [
    '正在加载风险指标数据库... 覆盖 82 家法人，10 大风险域',
    '运行风险评分模型：历史事件 × 行业对比 × 趋势分析...',
    '计算综合风险评分...',
  ]
  let answer = ''

  if (question.includes('海外工程') || question.includes('综合风险')) {
    thinking.push('风险指标：6个月触发预警 14 次（均值 3.2 倍），含 3 次重大风险')
    thinking.push('子维度拆解：投资风险 85/100 · 资金风险 72/100 · 合同风险 68/100 · 境外风险 80/100')
    answer = `【风险研判报告】\n\n被评估主体：海外工程总承包公司\n\n综合风险评分：78/100（高风险）\n风险等级：🔴 红色\n\n各维度评分：\n• 投资风险：85/100（超预算 18.6%）\n• 资金风险：72/100（境外回款延迟）\n• 合同风险：68/100（背靠背条款集中）\n• 境外风险：80/100（合规不确定性高）\n\n6 个月趋势：\n• 近 6 月触发预警 14 次，为全集团均值 3.2 倍\n• 最近 2 个月占比 50%，呈加速上升态势\n• 含 3 次重大风险、5 次高风险\n\n建议措施：\n1. 建议风险等级：橙色 → 红色 🔴\n2. 对在途项目实行月度穿透检查\n3. 立即启动境外资金回流专项\n4. 建议在下一次风控委员会上专题汇报`
  } else if (question.includes('工程建设') || question.includes('趋势')) {
    thinking.push('板块趋势分析：11月2次 → 12月3次 → 1月2次 → 2月4次 → 3月5次 → 4月6次')
    thinking.push('围标串标类占比 60%，资金异常占比 25%，合同风险占比 15%')
    answer = `【板块风险趋势报告】\n\n被评估板块：工程建设板块\n\n近 6 个月预警走势：\n• 11月：2 次 | 12月：3 次 | 1月：2 次\n• 2月：4 次 | 3月：5 次 | 4月：6 次\n📈 趋势：加速上升（近 3 月环比 +50%）\n\n风险类型分布：\n• 围标串标：60%（3 个标段触发预警）\n• 资金异常：25%（境外回款延迟为主）\n• 合同风险：15%\n\n综合风险评分：71/100（高风险）\n\n建议措施：\n1. 对工程建设板块实施采购前置审查\n2. 建立高风险标段准入熔断机制\n3. 加强境外资金归集管理\n4. 建议在未来 3 个月内完成板块级风控自查`
  } else {
    answer = '【风险研判报告】\n\n请提供具体的主体名称或板块名称，以便进行风险评分分析。'
  }

  for (const step of thinking) {
    await delay(500 + Math.random() * 400)
    aiThinking.value.push(step)
  }
  await delay(400)

  const chars = answer.split('')
  for (let i = 0; i < chars.length; i++) {
    aiAnswer.value += chars[i]
    await delay(12 + Math.random() * 12)
  }
}

// 增强版（带 Agent 路由）
async function askAIEnhanced(question) {
  await askAI(question)
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }

// ==================== AI 中台视图 ====================
const aiTabs = ['智能问数', '主动预警', '关联分析', '报告生成', '决策建议']
const aiActiveTab = ref('智能问数')
const graphQuery = ref('')
const graphData = ref(null)
const graphThinking = ref([])
const graphReady = ref(false)
const reportThinking = ref([])

function searchGraph() {
  if (graphQuery.value.includes('设备贸易商') || graphQuery.value.includes('供应商')) {
    graphData.value = GRAPH_SUPPLIER_DATA
  } else if (graphQuery.value.includes('宏基')) {
    graphData.value = GRAPH_CONTRACT
  } else {
    graphData.value = GRAPH_PROCUREMENT
  }
}

const reportGenerating = ref(false)
const reportContent = ref([])

async function generateReport() {
  if (reportGenerating.value) return
  reportGenerating.value = true
  reportContent.value = []
  const lines = [
    '══════ 2026年4月风险分析报告 ══════',
    '',
    '一、风险态势总览',
    '· 全集团开放风险 37 条，重大 4 条，高风险 11 条',
    '· 新增预警 55 条，环比 +17%',
    '· 已处置 42 条，闭环率 76.4%',
    '',
    '二、风险域分布',
    '· 采购域 22% · 资金域 16% · 投资域 14%',
    '· 合同域 13% · 财务域 12% · 其他 23%',
    '',
    '三、关键风险事件',
    '· 围标串标 CG-2026-0501（AI概率 0.94）',
    '· 大额异常支付 ¥9200万（无合同关联）',
    '· 投资超预算 P01（超预算 18.6%）',
    '',
    '四、建议措施',
    '1. 暂停海外营地物资采购开标程序',
    '2. 冻结华东电力异常支付并启动回溯',
    '3. 对工程建设板块实施前置采购审查',
    '4. 提升闭环率至 85%+（当前 76.4%）',
    '',
    '══════ 报告完毕 ══════',
  ]
  for (const line of lines) {
    reportContent.value.push(line)
    await delay(80 + Math.random() * 60)
  }
  reportGenerating.value = false
}

async function runGraphAnalysis() {
  if (!graphQuery.value.trim()) return
  graphThinking.value = []
  graphReady.value = false
  graphAnalysisResult.value = null
  const steps = ['正在匹配主体信息...', '检索股权关联路径...', '识别实际控制人与一致行动人...', '构建关联图谱...', '计算风险路径与风险等级...']
  for (const step of steps) {
    await delay(400)
    graphThinking.value.push(step)
  }
  searchGraph()
  graphReady.value = true

  // 输出结构化分析结论
  await delay(300)
  if (graphQuery.value.includes('设备贸易商') || graphQuery.value.includes('供应商')) {
    graphAnalysisResult.value = {
      controller: '张某（曾任华东电力采购部副经理）',
      relatedCount: 4,
      riskPaths: ['某设备贸易商行 → 张某（控股） → 华东电力（曾任副经理）', '某设备贸易商行 → 某关联公司（张某法人代表） → 华东电力（交易关系）'],
      riskLevel: 'high',
      riskNote: '实际控制人张某与华东电力存在利益冲突，建议将某设备贸易商行标记为关联方并对历史交易回溯审查',
    }
  } else if (graphQuery.value.includes('宏基')) {
    graphAnalysisResult.value = {
      controller: '宏基土木集团控股股东',
      relatedCount: 3,
      riskPaths: ['宏基土木集团 → 钢材贸易商（采购） → 城市基建投资（同一供应链重叠）'],
      riskLevel: 'medium',
      riskNote: '宏基土木与钢材贸易商存在采购关系，需关注供应链集中度风险',
    }
  } else {
    graphAnalysisResult.value = {
      controller: '未完全穿透（待进一步核查）',
      relatedCount: 3,
      riskPaths: ['盛通供应链 ↔ 联创商贸（同MAC） ↔ 远航物资（同MAC） → 自然人王某（参股）'],
      riskLevel: 'high',
      riskNote: '三家投标单位 IP/MAC 完全一致，均与王某存在股权关联，围标嫌疑极高',
    }
  }
}

const suggestions = ref([])
async function getSuggestions() {
  suggestions.value = []
  await delay(350)
  suggestions.value = decisions.map(d => ({ ...d, detail: d.desc }))
}

const decisions = [
  { title: '暂停海外营地物资采购开标', desc: 'CG-2026-0501 AI围标概率 0.94，三家投标单位IP/MAC完全相同', level: 'critical', dept: '采购部' },
  { title: '升级海外工程总承包公司风险等级', desc: '橙色→红色：6个月触发预警14次，含3次重大风险', level: 'critical', dept: '风控部' },
  { title: '冻结华东电力异常支付', desc: '对某设备贸易商行 ¥9200万支付无合同关联，需CFO审批', level: 'high', dept: '司库中心' },
  { title: '启动管理费用专项审计', desc: '装备制造板块管理费用同比+34%，业务招待费+咨询费超预算48%', level: 'high', dept: '审计部' },
  { title: '加强工程建设板块采购前置审查', desc: '近30天3个标段触发围标预警，建议实施准入熔断', level: 'medium', dept: '采购部' },
]

// ==================== 穿透面板 ====================

// 模块树形数据
const moduleTrees = {
  investment: [
    { id: 'root', label: '集团投资总览', level: 0, icon: '🏢' },
    { id: 's1', label: '电力能源板块', level: 1, parentId: 'root', risk: 'critical' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 's2', label: '装备制造板块', level: 1, parentId: 'root', risk: 'low' },
    { id: 'c1', label: '华东电力有限公司', level: 2, parentId: 's1', risk: 'high' },
    { id: 'c2', label: '西北新能源投资公司', level: 2, parentId: 's1', risk: 'critical' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'c5', label: '城市基建投资公司', level: 2, parentId: 's3', risk: 'high' },
    { id: 'c3', label: '重型装备集团', level: 2, parentId: 's2', risk: 'low' },
    { id: 'P06', label: '陇东风电基地二期', level: 3, parentId: 'c2', risk: 'critical' },
    { id: 'P01', label: '东南亚某国路桥PPP', level: 3, parentId: 'c4', risk: 'critical' },
    { id: 'P02', label: '风光储一体化基地', level: 3, parentId: 'c2', risk: 'low' },
    { id: 'P03', label: '煤电灵活性改造', level: 3, parentId: 'c1', risk: 'low' },
    { id: 'P04', label: '片区综合开发', level: 3, parentId: 'c5', risk: 'high' },
    { id: 'docs_invest', label: '单据·凭证·工单', level: 4, parentId: 'P06' },
  ],
  funds: [
    { id: 'root', label: '集团资金总览', level: 0, icon: '💰' },
    { id: 's1', label: '电力能源板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'critical' },
    { id: 's4', label: '金融服务板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 'c1', label: '华东电力有限公司', level: 2, parentId: 's1', risk: 'high' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'c6', label: '集团财务公司', level: 2, parentId: 's4', risk: 'medium' },
    { id: 'A1002', label: '一般户 · 建设银行', level: 3, parentId: 'c1', risk: 'high' },
    { id: 'A1001', label: '基本户 · 工商银行', level: 3, parentId: 'c1', risk: 'low' },
    { id: 'A2001', label: '境外户 · 中国银行', level: 3, parentId: 'c4', risk: 'high' },
    { id: 'A2002', label: '境外户 · 渣打银行', level: 3, parentId: 'c4', risk: 'low' },
    { id: 'docs_funds', label: '凭证·流水明细', level: 4, parentId: 'A1002' },
  ],
  procurement: [
    { id: 'root', label: '集团采购总览', level: 0, icon: '📦' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'critical' },
    { id: 's1', label: '电力能源板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 's2', label: '装备制造板块', level: 1, parentId: 'root', risk: 'low' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'c5', label: '城市基建投资公司', level: 2, parentId: 's3', risk: 'high' },
    { id: 'c1', label: '华东电力有限公司', level: 2, parentId: 's1', risk: 'high' },
    { id: 'c2', label: '西北新能源投资公司', level: 2, parentId: 's1', risk: 'medium' },
    { id: 'c3', label: '重型装备集团', level: 2, parentId: 's2', risk: 'low' },
    { id: 'PKG1', label: 'CG-2026-0501', level: 3, parentId: 'c4', risk: 'critical' },
    { id: 'PKG2', label: 'CG-2026-0300', level: 3, parentId: 'c5', risk: 'medium' },
    { id: 'docs_proc', label: 'AI研判·工单', level: 4, parentId: 'PKG1' },
  ],
  contract: [
    { id: 'root', label: '集团合同总览', level: 0, icon: '📋' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 's1', label: '电力能源板块', level: 1, parentId: 'root', risk: 'low' },
    { id: 's4', label: '金融服务板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 'c5', label: '城市基建投资公司', level: 2, parentId: 's3', risk: 'high' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'c1', label: '华东电力有限公司', level: 2, parentId: 's1', risk: 'low' },
    { id: 'c6', label: '集团财务公司', level: 2, parentId: 's4', risk: 'medium' },
    { id: 'CT0312', label: 'CT-2026-0312', level: 3, parentId: 'c5', risk: 'high' },
    { id: 'CT4412', label: 'CT-2025-4412', level: 3, parentId: 'c4', risk: 'medium' },
    { id: 'docs_contract', label: '履约·超付·工单', level: 4, parentId: 'CT0312' },
  ],
  // ===== 产权穿透 =====
  property: [
    { id: 'root', label: '集团产权总览', level: 0, icon: '🏛️' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 's1', label: '电力能源板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'c1', label: '华东电力有限公司', level: 2, parentId: 's1', risk: 'high' },
    { id: 'prop_c1', label: '华东电力→SPV-A→BVI→开曼', level: 3, parentId: 'c1', risk: 'high' },
    { id: 'prop_c4', label: '海外工程→有限合伙', level: 3, parentId: 'c4', risk: 'medium' },
    { id: 'docs_property', label: '关联方识别·工单', level: 4, parentId: 'prop_c1' },
  ],
  // ===== 财务穿透 =====
  finance: [
    { id: 'root', label: '集团财务总览', level: 0, icon: '📊' },
    { id: 's2', label: '装备制造板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 's1', label: '电力能源板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 'c3', label: '重型装备集团', level: 2, parentId: 's2', risk: 'high' },
    { id: 'c1', label: '华东电力有限公司', level: 2, parentId: 's1', risk: 'medium' },
    { id: 'fin_c3_exp', label: '管理费用-业务招待费', level: 3, parentId: 'c3', risk: 'high' },
    { id: 'fin_c1_exp', label: '管理费用-咨询费', level: 3, parentId: 'c1', risk: 'high' },
    { id: 'docs_finance', label: '凭证·工单', level: 4, parentId: 'fin_c3_exp' },
  ],
  // ===== 薪酬穿透 =====
  salary: [
    { id: 'root', label: '集团薪酬总览', level: 0, icon: '💳' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 's5', label: '科创与其他板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'c7', label: '数字科技公司', level: 2, parentId: 's5', risk: 'medium' },
    { id: 'sal_c7_1', label: '技术服务费→王某（月付）', level: 3, parentId: 'c7', risk: 'high' },
    { id: 'sal_c7_2', label: '劳务费→李某（季付）', level: 3, parentId: 'c7', risk: 'high' },
    { id: 'docs_salary', label: '凭证·工单', level: 4, parentId: 'sal_c7_1' },
  ],
  // ===== 境外穿透 =====
  overseas: [
    { id: 'root', label: '全球资产总览', level: 0, icon: '🌍' },
    { id: 'sea', label: '东南亚区域', level: 1, parentId: 'root', risk: 'high' },
    { id: 'me', label: '中东区域', level: 1, parentId: 'root', risk: 'medium' },
    { id: 'af', label: '非洲区域', level: 1, parentId: 'root', risk: 'high' },
    { id: 'ov_sea_proj', label: '某国路桥 PPP（东南亚）', level: 2, parentId: 'sea', risk: 'critical' },
    { id: 'ov_me_proj', label: '光伏 EPC 总包（中东）', level: 2, parentId: 'me', risk: 'low' },
    { id: 'ov_sea_detail', label: '资金合规审查', level: 3, parentId: 'ov_sea_proj', risk: 'high' },
    { id: 'docs_overseas', label: '合规结论·工单', level: 4, parentId: 'ov_sea_detail' },
  ],
  // ===== 金融穿透 =====
  banking: [
    { id: 'root', label: '金融业务总览', level: 0, icon: '🏦' },
    { id: 's1', label: '华东电力板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 's4', label: '金融服务板块', level: 1, parentId: 'root', risk: 'medium' },
    { id: 'c5', label: '城市基建投资公司', level: 2, parentId: 's1', risk: 'high' },
    { id: 'c6', label: '集团财务公司', level: 2, parentId: 's4', risk: 'medium' },
    { id: 'bank_txn', label: '债券投资·某地产集团', level: 3, parentId: 'c6', risk: 'high' },
    { id: 'docs_banking', label: '风险结论·工单', level: 4, parentId: 'bank_txn' },
  ],
  // ===== 会计穿透 =====
  accounting: [
    { id: 'root', label: '会计质量总览', level: 0, icon: '🧾' },
    { id: 's2', label: '装备制造板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 's3', label: '工程建设板块', level: 1, parentId: 'root', risk: 'high' },
    { id: 'c3', label: '重型装备集团', level: 2, parentId: 's2', risk: 'medium' },
    { id: 'c4', label: '海外工程总承包公司', level: 2, parentId: 's3', risk: 'critical' },
    { id: 'acc_e002', label: '提前确认收入·分录异常', level: 3, parentId: 'c3', risk: 'high' },
    { id: 'acc_e001', label: '完工百分比偏离·分录异常', level: 3, parentId: 'c4', risk: 'high' },
    { id: 'docs_accounting', label: '审计结论·工单', level: 4, parentId: 'acc_e001' },
  ],
}

function enterDrill(modId) {
  drillMode.value = { module: modId }
  drillNode.value = { level: 0, label: '集团总览', id: 'root' }
  drillPath.value = []
}

function openInvestmentPage() {
  router.push(getPenetrationLocation('investment'))
}

function openFundsPage() {
  router.push(getPenetrationLocation('funds'))
}

function openProcurementPage() {
  router.push(getPenetrationLocation('procurement'))
}

function exitDrill() {
  drillMode.value = null
  drillNode.value = null
  drillPath.value = []
}

function drillToLevel(level, id, label) {
  drillNode.value = { level, id, label }
  const path = [...drillPath.value]
  while (path.length > level) path.pop()
  if (level > 0) path.push({ id, label, level })
  drillPath.value = path
}

function drillBackTo(idx) {
  if (idx === -1) { exitDrill(); return }
  const target = drillPath.value[idx]
  if (target) {
    drillNode.value = { level: target.level, id: target.id, label: target.label }
    drillPath.value = drillPath.value.slice(0, idx + 1)
  }

function triggerAIAnalysis(context) {
  showAIDialog.value = true;
  const agents = { investment: "risk", funds: "risk", procurement: "qa", contract: "compliance" };
  aiAgent.value = agents[context] || "qa";
  aiActiveTab.value = "智能问数";
  const qs = {
    investment: "东南亚某国路桥PPP项目超预算18.6%的综合风险分析",
    funds: "华东电力账户A1002异常支付9200万的风险研判",
    procurement: "CG-2026-0501围标串标的四维交叉验证分析",
    contract: "CT-2026-0312合同高风险条款的法律合规审查",
  };
  nextTick(() => askAI(qs[context] || "风险综合分析"));
}
}

function selectTreeNode(node) {
  drillToLevel(node.level, node.id, node.label)
}

const drillModuleLabel = computed(() => {
  const map = {
    investment: '投资穿透', funds: '资金穿透', procurement: '采购穿透',
    contract: '合同穿透', property: '产权穿透', finance: '财务穿透',
    salary: '薪酬穿透', overseas: '境外穿透', banking: '金融穿透',
    accounting: '会计穿透',
  }
  return map[drillMode.value?.module] || ''
})

// 场景跳转 - 风险样本→穿透模块
function goScene(r) {
  if (!r) return
  router.push(getRiskCenterLocation(r))
}
// ==================== 穿透数据辅助 ====================
const filterCompaniesBySector = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 1) return []
  return COMPANIES.filter((c) => c.sectorId === drillNode.value.id)
})
const filterProjectsByCompany = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 2) return []
  return investmentProjectDetails.value.filter((p) => p.companyId === drillNode.value.id)
})
const filterAccountsByCompany = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 2) return []
  return ACCOUNTS.filter((a) => a.companyId === drillNode.value.id)
})
const filterProcurementByCompany = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 2) return []
  return PROCUREMENT_PACKAGES.filter((p) => p.companyId === drillNode.value.id)
})
const filterContractsByCompany = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 2) return []
  return CONTRACTS.filter((c) => c.companyId === drillNode.value.id)
})
function accountsTotal(cid) { return ACCOUNTS.filter((a) => a.companyId === cid).reduce((s, a) => s + a.balanceWan, 0) }
function maxAiScore(cid) { const ps = PROCUREMENT_PACKAGES.filter((p) => p.companyId === cid); return ps.length ? Math.max(...ps.map((p) => p.aiScore)) : 0 }
function contractsTotal(cid) { return CONTRACTS.filter((c) => c.companyId === cid).reduce((s, c) => s + c.amountYi, 0) }
const fundAccountDetail = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 3 || drillMode.value?.module !== 'funds') return null
  return ACCOUNTS.find((a) => a.id === drillNode.value.id) || null
})

const procurementDetail = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 3 || drillMode.value?.module !== 'procurement') return null
  const pkgId = drillNode.value.id === 'PKG1' ? 'CG-2026-0501' : 'CG-2026-0300'
  return PROCUREMENT_PACKAGES.find((p) => p.id === pkgId) || null
})

const contractFullDetail = computed(() => {
  if (!drillNode.value || drillNode.value.level === undefined || !drillMode.value) return null
  if (drillMode.value.module !== 'contract') return null
  const ctId = drillNode.value.id === 'CT0312' ? 'CT-2026-0312' : (drillNode.value.id === 'CT4412' ? 'CT-2025-4412' : null)
  return ctId ? (CONTRACT_DETAILS[ctId] || null) : null
})

const contractCenterContracts = computed(() => contractCenterData.contracts)

const selectedContract = computed(() =>
  contractCenterContracts.value.find((item) => item.id === selectedContractId.value) || contractCenterContracts.value[0]
)

const selectedContractDetail = computed(() => {
  const direct = contractCenterData.contractDetails[selectedContractId.value]
  if (direct) return direct
  const basic = selectedContract.value
  if (!basic) return { basicInfo: {}, clauses: [], compliance: [], conclusion: { level: '关注', summary: [], advice: '' } }
  return {
    basicInfo: {
      name: basic.name,
      id: basic.id,
      amount: `${basic.amountYi.toFixed(2)} 亿元`,
      supplier: basic.supplier,
      signDate: basic.signDate,
      cycle: basic.cycle,
      paymentMethod: basic.paymentMethod,
      warranty: basic.warrantyStatus,
      legalReview: basic.legalReview,
    },
    clauses: [
      { article: '第一条 合同概述', text: `${basic.name}，签约主体 ${basic.company}，合作方 ${basic.supplier}。`, risk: false, tag: '' },
      { article: '第二条 付款方式', text: basic.paymentMethod, risk: basic.paymentMethod.includes('100%') || basic.paymentMethod.includes('预付'), tag: '关注' },
      { article: '第三条 质保约定', text: basic.warrantyStatus, risk: basic.warrantyStatus.includes('未设置'), tag: '关注' },
    ],
    compliance: [
      {
        level: contractRiskLabel(basic.riskLevel),
        violated: '履约风险扫描',
        rule: '参照集团合同管理标准库自动比对',
        basis: `${basic.status}，交付进度 ${basic.deliveryProgress}% ，付款进度 ${basic.paymentProgress}%。`,
        suggestion: '建议继续跟踪供应商履约和付款匹配情况。',
      },
    ],
    conclusion: {
      level: contractRiskLabel(basic.riskLevel),
      summary: [
        `${basic.name} 当前履约状态为 ${basic.status}。`,
        `付款进度 ${basic.paymentProgress}% ，交付进度 ${basic.deliveryProgress}% 。`,
      ],
      advice: '建议持续关注履约进度与付款节奏。',
    },
  }
})

const selectedContractInfoItems = computed(() => {
  const info = selectedContractDetail.value.basicInfo || {}
  return [
    { label: '合同名称', value: info.name },
    { label: '合同编号', value: info.id },
    { label: '合同金额', value: info.amount },
    { label: '供应商', value: info.supplier },
    { label: '签订日期', value: info.signDate },
    { label: '履约周期', value: info.cycle },
    { label: '付款方式', value: info.paymentMethod, risk: String(info.paymentMethod || '').includes('100%') },
    { label: '质保金状态', value: info.warranty, risk: String(info.warranty || '').includes('未设置') },
    { label: '法务审核状态', value: info.legalReview, risk: String(info.legalReview || '').includes('未') },
  ]
})

const selectedContractClauses = computed(() => selectedContractDetail.value.clauses || [])
const selectedContractCompliance = computed(() => selectedContractDetail.value.compliance || [])
const selectedContractConclusion = computed(() => selectedContractDetail.value.conclusion || { level: '关注', summary: [], advice: '' })
const selectedContractTags = computed(() => selectedContract.value?.abnormal?.length ? selectedContract.value.abnormal : ['条款完整', '履约正常'])

const contractFilteredList = computed(() => contractCenterContracts.value.filter((item) => {
  const sceneMatched = !contractScene.value || item.scene === contractScene.value
  const riskMatched = !contractRiskFilter.value || contractRiskLabel(item.riskLevel) === contractRiskFilter.value
  const statusMatched = !contractStatusFilter.value || item.status === contractStatusFilter.value
  return sceneMatched && riskMatched && statusMatched
}))

const contractRiskDistributionOption = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 1200,
  tooltip: { trigger: 'item' },
  legend: { show: false },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    center: ['50%', '48%'],
    selectedMode: 'single',
    itemStyle: {
      borderWidth: 2,
      borderColor: 'rgba(4, 13, 26, 0.8)',
      shadowBlur: 18,
      shadowColor: 'rgba(14, 165, 233, 0.35)',
    },
    label: { color: '#d9f7ff', formatter: '{b}\n{d}%', fontSize: 11 },
    emphasis: { scale: true, scaleSize: 10, itemStyle: { shadowBlur: 28, shadowColor: 'rgba(6, 182, 212, 0.55)' } },
    data: contractCenterData.riskDistribution.map((item) => ({
      name: item.name,
      value: item.value,
      selected: contractRiskFilter.value === item.name,
      itemStyle: { color: item.color },
    })),
  }],
}))

const contractStatusDistributionOption = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 1200,
  tooltip: { trigger: 'item' },
  legend: { show: false },
  series: [{
    type: 'pie',
    radius: ['42%', '68%'],
    center: ['50%', '48%'],
    roseType: 'radius',
    itemStyle: {
      borderWidth: 2,
      borderColor: 'rgba(4, 13, 26, 0.8)',
      shadowBlur: 16,
      shadowColor: 'rgba(14, 165, 233, 0.28)',
    },
    label: { color: '#d9f7ff', formatter: '{b}', fontSize: 10 },
    emphasis: { scale: true, scaleSize: 9, itemStyle: { shadowBlur: 24, shadowColor: 'rgba(6, 182, 212, 0.52)' } },
    data: contractCenterData.statusDistribution.map((item) => ({
      name: item.name,
      value: item.value,
      selected: contractStatusFilter.value === item.name,
      itemStyle: { color: item.color },
    })),
  }],
}))

const contractPerformanceOption = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 1400,
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['交付进度', '付款进度', '累计付款金额'],
    top: 0,
    textStyle: { color: '#d8f5ff', fontSize: 11 },
  },
  grid: { left: 54, right: 54, top: 42, bottom: 40 },
  xAxis: {
    type: 'category',
    data: contractCenterData.progressNodes,
    axisLabel: { color: '#9fc6df', fontSize: 10 },
    axisLine: { lineStyle: { color: 'rgba(110, 208, 255, 0.28)' } },
  },
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 100,
      name: '进度%',
      axisLabel: { color: '#9fc6df', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(14, 165, 233, 0.1)' } },
    },
    {
      type: 'value',
      min: 0,
      max: 2.5,
      name: '亿元',
      axisLabel: { color: '#9fc6df' },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '交付进度',
      type: 'line',
      smooth: true,
      symbolSize: 10,
      yAxisIndex: 0,
      data: contractCenterData.progressDelivery,
      lineStyle: { width: 3, color: '#0ea5e9' },
      itemStyle: { color: '#06b6d4', shadowBlur: 12, shadowColor: 'rgba(14, 165, 233, 0.8)' },
      areaStyle: { color: 'rgba(14, 165, 233, 0.18)' },
      label: { show: true, color: '#dff8ff', formatter: '{c}%' },
    },
    {
      name: '付款进度',
      type: 'line',
      smooth: true,
      symbolSize: 10,
      yAxisIndex: 0,
      data: contractCenterData.progressPayment,
      lineStyle: { width: 3, color: '#ff8800' },
      itemStyle: { color: '#facc16', shadowBlur: 12, shadowColor: 'rgba(255, 136, 0, 0.72)' },
      areaStyle: { color: 'rgba(255, 136, 0, 0.16)' },
      label: { show: true, color: '#fff2c2', formatter: '{c}%' },
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(245, 63, 63, 0.14)' },
        data: [[{ xAxis: '预付款' }, { xAxis: '最终验收' }]],
      },
      markPoint: {
        symbolSize: 56,
        data: [{ coord: ['安装调试', 100], value: '预警', itemStyle: { color: '#f53f3f' } }],
        label: { color: '#fff', formatter: '预警' },
      },
    },
    {
      name: '累计付款金额',
      type: 'bar',
      yAxisIndex: 1,
      barWidth: 14,
      data: contractCenterData.progressAmountYi.map((value) => ({
        value,
        itemStyle: { color: value >= 2.3 ? '#f53f3f' : '#0ea5e9', borderRadius: [8, 8, 0, 0] },
      })),
    },
  ],
  graphic: [
    {
      type: 'text',
      right: 32,
      top: 18,
      style: {
        text: '超进度付款风险 -> 已自动预警',
        fill: '#fda4af',
        font: 'bold 14px sans-serif',
        shadowBlur: 12,
        shadowColor: 'rgba(245, 63, 63, 0.85)',
      },
    },
  ],
}))

const activeInvestmentProjectId = computed(() => {
  if (drillMode.value?.module !== 'investment' || !drillNode.value) return 'P06'
  if (drillNode.value.level === 3) return drillNode.value.id
  if (drillNode.value.level === 4) {
    const latestProject = [...drillPath.value].reverse().find((item) => item.level === 3)
    return latestProject?.id || 'P06'
  }
  return 'P06'
})

const investProjectDetail = computed(() =>
  INVESTMENT_PROJECTS.find((p) => p.id === activeInvestmentProjectId.value) || INVESTMENT_PROJECTS[0]
)

const investProjectProfile = computed(() =>
  INVESTMENT_PROJECT_PROFILES[activeInvestmentProjectId.value] || {}
)

const investProjectGraph = computed(() =>
  INVESTMENT_RELATION_GRAPHS[activeInvestmentProjectId.value] || GRAPH_INVESTMENT
)

const investmentProjectRiskLevel = computed(() => {
  const profile = investProjectProfile.value
  if (!profile || !Object.keys(profile).length) return 'low'
  let score = 0
  if ((profile.relatedTradeRatio || 0) >= 30) score += 3
  else if ((profile.relatedTradeRatio || 0) >= 15) score += 2
  else if ((profile.relatedTradeRatio || 0) >= 8) score += 1
  if ((profile.hiddenRelationCount || 0) >= 3) score += 3
  else if ((profile.hiddenRelationCount || 0) >= 1) score += 2
  if ((profile.overBudgetRate || 0) >= 10) score += 1
  if (score >= 6) return 'critical'
  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
})

const investmentProjectRiskText = computed(() => {
  const map = { critical: '重大关联风险', high: '高关联风险', medium: '中关联风险', low: '低关联风险' }
  return map[investmentProjectRiskLevel.value] || '低关联风险'
})

const investDocRows = computed(() => {
  const project = investProjectDetail.value
  const profile = investProjectProfile.value || {}
  const alertRows = (profile.alerts || []).map((alert) => {
    const workOrder = WORK_ORDERS.find((item) => item.id === alert.workOrderId)
    return {
      type: '核查工单',
      id: alert.workOrderId || '待生成',
      status: workOrder?.status || '待派单',
      workOrderId: alert.workOrderId || '-',
    }
  })
  return [
    { type: '可行性研究批复', id: 'FK-2024-0188', status: '已批复', workOrderId: '-' },
    { type: '月度投资报告', id: 'YZ-2026-04', status: '已归档', workOrderId: alertRows[0]?.workOrderId || '-' },
    { type: '关联交易台账', id: 'RT-2026-INV', status: `${toPercentText(profile.relatedTradeRatio || 0)} 占比`, workOrderId: alertRows[1]?.workOrderId || alertRows[0]?.workOrderId || '-' },
    { type: '预算调整申请', id: project.actualYi > project.budgetYi ? 'YS-2026-0012' : '未触发', status: project.actualYi > project.budgetYi ? '待审批' : '正常', workOrderId: '-' },
    ...alertRows,
  ]
})

// ==================== 投资穿透图表 ====================
const investOverviewChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { data: ['预算(亿)', '实际(亿)'], textStyle: { color: '#8ba3c7', fontSize: 10 } },
  grid: { left: 44, right: 16, top: 32, bottom: 28 },
  xAxis: { type: 'category', data: investmentProjectDetails.value.map((p) => p.name.length > 6 ? p.name.slice(0, 6) + '..' : p.name), axisLabel: { color: '#8ba3c7', fontSize: 10, rotate: 20 } },
  yAxis: { type: 'value', axisLabel: { color: '#8ba3c7', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [
    { name: '预算(亿)', type: 'bar', data: investmentProjectDetails.value.map((p) => p.budgetYi), itemStyle: { color: '#60a5fa', borderRadius: [3, 3, 0, 0] } },
    {
      name: '实际(亿)',
      type: 'bar',
      data: investmentProjectDetails.value.map((p) => ({
        value: p.actualYi,
        itemStyle: { color: p.actualYi > p.budgetYi ? '#ef4444' : '#22c55e', borderRadius: [3, 3, 0, 0] },
      })),
    },
  ],
}))

const investSectorSummary = computed(() => SECTORS.map((s) => {
  const projs = investmentProjectDetails.value.filter((p) => p.sectorId === s.id)
  const totalB = projs.reduce((sum, p) => sum + p.budgetYi, 0)
  const totalA = projs.reduce((sum, p) => sum + p.actualYi, 0)
  const progress = projs.length ? Math.round(projs.reduce((sum, p) => sum + (p.progress || 0), 0) / projs.length) : 0
  const overBudgetCount = projs.filter((p) => p.actualYi > p.budgetYi).length
  return {
    name: s.name,
    count: projs.length,
    progress,
    totalBudget: totalB.toFixed(1),
    totalActual: totalA.toFixed(1),
    overBudgetCount,
    risk: projs.some((p) => p.risk === 'critical') ? 'critical' : projs.some((p) => p.risk === 'high') ? 'high' : 'low',
  }
}))

function toYiText(value) {
  return Number(value || 0).toFixed(1).replace(/\.0$/, '')
}

function toPercentText(value) {
  return `${Number(value || 0).toFixed(1).replace(/\.0$/, '')}%`
}

function signedPercentText(value) {
  const num = Number(value || 0)
  return `${num > 0 ? '+' : ''}${toPercentText(num)}`
}

function milestoneText(status) {
  if (status === 'done') return '已完成'
  if (status === 'delay') return '延期'
  return '进行中'
}

function formatContractTime() {
  return new Date().toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function contractStatusColor(status) {
  return {
    high: '#f53f3f',
    medium: '#ff8800',
    watch: '#facc16',
    normal: '#22c55e',
  }[status] || '#0ea5e9'
}

function contractStatusText(status) {
  return {
    high: '红色预警',
    medium: '橙色预警',
    watch: '重点关注',
    normal: '运行正常',
  }[status] || '实时监控'
}

function contractKpiIcon(icon) {
  return {
    file: '▦',
    amount: '◈',
    risk: '▲',
    legal: '◎',
    delay: '◌',
    new: '✦',
  }[icon] || '◦'
}

function contractRiskLabel(level) {
  return {
    high: '高风险',
    medium: '中风险',
    watch: '关注',
    normal: '正常',
    critical: '高风险',
  }[level] || '关注'
}

function contractRiskClass(level) {
  return {
    high: 'high',
    critical: 'high',
    medium: 'medium',
    watch: 'watch',
    normal: 'normal',
  }[level] || 'watch'
}

function sparklinePoints(values) {
  if (!values?.length) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  return values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 120
    const y = max === min ? 16 : 28 - ((value - min) / (max - min)) * 24
    return `${x},${y}`
  }).join(' ')
}

function displayAnimatedValue(item) {
  const current = contractAnimatedValues[item.label] ?? item.value
  return typeof item.value === 'number' && !Number.isInteger(item.value) ? current.toFixed(2) : Math.round(current)
}

function toggleContractRiskFilter(name) {
  contractRiskFilter.value = contractRiskFilter.value === name ? '' : name
}

function toggleContractStatusFilter(name) {
  contractStatusFilter.value = contractStatusFilter.value === name ? '' : name
}

function selectContract(id) {
  selectedContractId.value = id
  contractClauseIndex.value = -1
  if (contractDemoStarted.value) {
    window.clearInterval(contractClauseTimer)
    contractClauseTimer = window.setInterval(() => {
      if (contractClauseIndex.value >= selectedContractClauses.value.length - 1) {
        window.clearInterval(contractClauseTimer)
        return
      }
      contractClauseIndex.value += 1
    }, 650)
  }
}

function focusContractBottom() {
  contractBottomRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function pushContractToast(message) {
  toastText.value = message
  toastShow.value = true
  toastModule.value = 'contract'
}

function launchContractWorkOrder() {
  pushContractToast('检测到高风险合同，已生成预警工单')
}

function animateContractKPIs() {
  contractCenterData.kpis.forEach((item) => { contractAnimatedValues[item.label] = 0 })
  let step = 0
  window.clearInterval(contractKpiTimer)
  contractKpiTimer = window.setInterval(() => {
    step += 1
    const progress = Math.min(step / 18, 1)
    contractCenterData.kpis.forEach((item) => {
      contractAnimatedValues[item.label] = item.value * progress
    })
    if (progress >= 1) window.clearInterval(contractKpiTimer)
  }, 60)
}

function stopContractDemo() {
  window.clearInterval(contractClockTimer)
  window.clearTimeout(contractDemoTimer)
  window.clearInterval(contractClauseTimer)
  window.clearInterval(contractKpiTimer)
  contractDemoStarted.value = false
}

function startContractDemo() {
  stopContractDemo()
  contractCurrentTime.value = formatContractTime()
  contractClockTimer = window.setInterval(() => {
    contractCurrentTime.value = formatContractTime()
  }, 1000)
  animateContractKPIs()
  selectedContractId.value = contractCenterData.defaultContractId
  contractRiskFilter.value = ''
  contractStatusFilter.value = ''
  contractClauseIndex.value = -1
  contractDemoTimer = window.setTimeout(() => {
    contractDemoStarted.value = true
    selectContract(contractCenterData.defaultContractId)
    pushContractToast('检测到高风险合同，已生成预警工单')
  }, 2000)
}

// ==================== 资金穿透图表 ====================
const fundsPoolKPIs = computed(() => {
  const total = ACCOUNTS.reduce((s, a) => s + a.balanceWan, 0)
  const riskN = ACCOUNTS.filter((a) => a.riskFlag).length
  return [
    { label: '账户总数', value: `${ACCOUNTS.length} 户` },
    { label: '资金余额', value: `${(total / 10000).toFixed(1)} 亿` },
    { label: '风险账户', value: `${riskN} 户` },
    { label: '近30日流水', value: `${FUND_FLOWS.length} 笔` },
  ]
})

const fundsPieChart = computed(() => {
  const bySector = {}
  ACCOUNTS.forEach((a) => {
    const c = COMPANIES.find((c) => c.id === a.companyId)
    const s = c ? { s1: '电力能源', s2: '装备制造', s3: '工程建设', s4: '金融服务', s5: '科创与其他' }[c.sectorId] || '其他' : '其他'
    bySector[s] = (bySector[s] || 0) + a.balanceWan
  })
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '55%'], label: { color: '#e8f1ff', fontSize: 9 },
      data: Object.entries(bySector).map(([n, v]) => ({ name: n, value: +(v / 10000).toFixed(1) })),
      itemStyle: { borderColor: '#040d1a', borderWidth: 2 },
    }],
  }
})

const fundsTrendChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 12, top: 20, bottom: 24 },
  xAxis: { type: 'category', data: ['11月', '12月', '1月', '2月', '3月', '4月'], axisLabel: { color: '#8ba3c7', fontSize: 9 } },
  yAxis: { type: 'value', name: '亿', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [{ type: 'line', smooth: true, symbol: 'none', areaStyle: { color: 'rgba(6,182,212,0.15)' }, lineStyle: { color: '#06b6d4', width: 1.5 }, data: [32, 28, 35, 41, 37, 45] }],
}))

// ==================== 采购穿透图表 ====================
const procurementOverviewChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 16, top: 20, bottom: 28 },
  xAxis: { type: 'category', data: PROCUREMENT_PACKAGES.map((p) => p.id), axisLabel: { color: '#8ba3c7', fontSize: 9 } },
  yAxis: { type: 'value', max: 1, name: '概率', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [{
    type: 'bar', barWidth: 16,
    data: PROCUREMENT_PACKAGES.map((p) => ({ value: p.aiScore, itemStyle: { color: p.aiScore > 0.7 ? '#ef4444' : p.aiScore > 0.3 ? '#f97316' : '#22c55e', borderRadius: [3, 3, 0, 0] } })),
    markLine: { data: [{ yAxis: 0.7, label: { formatter: '阈值' }, lineStyle: { color: '#ef4444', type: 'dashed' } }] },
  }],
}))

// ==================== 合同穿透图表 ====================
const contractKPIs = computed(() => {
  const total = CONTRACTS.reduce((s, c) => s + c.amountYi, 0)
  const hi = CONTRACTS.filter((c) => c.level === 'high' || c.level === 'critical').length
  const avg = Math.round(CONTRACTS.reduce((s, c) => s + c.performance, 0) / CONTRACTS.length)
  return [
    { label: '合同总数', value: `${CONTRACTS.length} 份` },
    { label: '合同总金额', value: `${total.toFixed(1)} 亿` },
    { label: '高风险合同', value: `${hi} 份` },
    { label: '平均履约率', value: `${avg}%` },
  ]
})

const contractAmountChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 12, top: 20, bottom: 24 },
  xAxis: { type: 'category', data: CONTRACTS.map((c) => c.id), axisLabel: { color: '#8ba3c7', fontSize: 9 } },
  yAxis: { type: 'value', name: '亿', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [{ type: 'bar', barWidth: 14, data: CONTRACTS.map((c) => ({ value: c.amountYi, itemStyle: { color: c.level === 'high' || c.level === 'critical' ? '#ef4444' : c.level === 'medium' ? '#f97316' : '#22c55e', borderRadius: [3, 3, 0, 0] } })) }],
}))

const contractRiskPieChart = computed(() => {
  const dist = { '重大': 0, '高': 0, '中': 0, '低': 0 }
  CONTRACTS.forEach((c) => {
    if (c.level === 'critical') dist['重大']++; else if (c.level === 'high') dist['高']++; else if (c.level === 'medium') dist['中']++; else dist['低']++
  })
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '55%'], label: { color: '#e8f1ff', fontSize: 9 },
      data: Object.entries(dist).filter(([, v]) => v > 0).map(([n, v]) => ({ name: n, value: v })),
      itemStyle: { borderColor: '#040d1a', borderWidth: 2, color: (p) => ['#ef4444', '#f97316', '#eab308', '#22c55e'][p.dataIndex] },
    }],
  }
})

// ==================== 产权穿透图表 ====================
const propertyKPIs = [
  { label: '直投子公司', value: '7 家' },
  { label: 'SPV 主体', value: '12 个' },
  { label: '离岸架构', value: '4 层+' },
  { label: '穿透待查', value: '3 项' },
]

function buildPropertyTreeChartData(node) {
  const result = { name: node.label }
  if (node.share) result.value = node.share
  if (node.children && node.children.length > 0) {
    result.children = node.children.map(buildPropertyTreeChartData)
  }
  return result
}

const propertyTreeChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', triggerOn: 'mousemove' },
  series: [{
    type: 'tree',
    data: [buildPropertyTreeChartData(PROPERTY_TREE)],
    top: '5%', left: '8%', bottom: '5%', right: '20%',
    symbolSize: 10,
    label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: 9, color: '#8ba3c7' },
    leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
    emphasis: { focus: 'descendant' },
    expandAndCollapse: true,
    animationDuration: 550,
    animationDurationUpdate: 750,
  }],
}))

function filterPropertyByCompany() {
  if (!drillNode.value || drillNode.value.level !== 2) return []
  const cid = getCompanyIdFromNode(drillNode.value.id)
  if (cid === 'c1') return [
    { id: 'pr_l1', label: '华东电力有限公司', share: '100%', type: '直投', layers: 1, level: 'low' },
    { id: 'pr_l2', label: '华东电力新能源', share: '65%', type: '子公司', layers: 2, level: 'low' },
    { id: 'pr_l3', label: '某参股 SPV-A', share: '30%', type: 'SPV', layers: 3, level: 'medium' },
    { id: 'pr_l4', label: 'SPV-A1 (BVI)', share: '100%', type: '离岸', layers: 4, level: 'high' },
    { id: 'pr_l5', label: 'SPV-A2 (开曼)', share: '100%', type: '离岸', layers: 5, level: 'high' },
  ]
  if (cid === 'c4') return [
    { id: 'pr_c4l1', label: '海外工程总承包公司', share: '100%', type: '直投', layers: 1, level: 'low' },
    { id: 'pr_c4l2', label: '东南亚项目 SPV', share: '70%', type: 'SPV', layers: 2, level: 'medium' },
    { id: 'pr_c4l3', label: '某有限合伙', share: '45%', type: '有限合伙', layers: 3, level: 'medium' },
  ]
  return []
}

// ==================== 财务穿透图表 ====================
const financeSectorChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 44, right: 16, top: 20, bottom: 28 },
  xAxis: { type: 'category', data: SECTORS.map(s => s.name), axisLabel: { color: '#8ba3c7', fontSize: 10, rotate: 20 } },
  yAxis: { type: 'value', name: '亿', axisLabel: { color: '#8ba3c7', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [
    { name: '收入(亿)', type: 'bar', data: SECTORS.map(s => s.revenueYi), itemStyle: { color: '#60a5fa', borderRadius: [3, 3, 0, 0] } },
    { name: '费用(亿)', type: 'bar', data: SECTORS.map(s => Math.round(s.revenueYi * 0.08)), itemStyle: { color: '#ef4444', borderRadius: [3, 3, 0, 0] } },
  ],
  legend: { data: ['收入(亿)', '费用(亿)'], textStyle: { color: '#8ba3c7', fontSize: 10 }, top: 0 },
}))

const filteredFinanceBySector = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 1) return []
  const sectorMap = { s2: '装备制造', s1: '电力能源' }
  const sn = sectorMap[drillNode.value.id]
  return FINANCE_EXPENSES.filter(f => f.sector === sn)
})

// ==================== 薪酬穿透图表 ====================
const salaryBarChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 44, right: 16, top: 20, bottom: 28 },
  xAxis: { type: 'category', data: SALARY_DATA.map(s => s.sector), axisLabel: { color: '#8ba3c7', fontSize: 9, rotate: 20 } },
  yAxis: { type: 'value', name: '万元', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [
    { name: '人均薪酬', type: 'bar', barWidth: 18,
      data: SALARY_DATA.map(s => ({ value: s.avgSalaryWan, itemStyle: { color: s.warn ? '#ef4444' : '#3b82f6', borderRadius: [3, 3, 0, 0] } })),
    },
  ],
}))

const salaryPieChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '55%'], label: { color: '#e8f1ff', fontSize: 9 },
    data: SALARY_DATA.map(s => ({ name: s.sector, value: s.totalSalaryWan / 10000 })),
    itemStyle: { borderColor: '#040d1a', borderWidth: 2 },
  }],
}))

// ==================== 境外穿透图表 ====================
const overseasRegionChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 44, right: 16, top: 20, bottom: 28 },
  xAxis: { type: 'category', data: OVERSEAS_ASSETS.map(o => o.country), axisLabel: { color: '#8ba3c7', fontSize: 9, rotate: 20 } },
  yAxis: { type: 'value', name: '亿', axisLabel: { color: '#8ba3c7', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [{
    type: 'bar', barWidth: 18,
    data: OVERSEAS_ASSETS.map(o => ({ value: +(o.assetsWan / 10000).toFixed(1), itemStyle: { color: o.riskLevel === 'high' ? '#ef4444' : o.riskLevel === 'medium' ? '#f97316' : '#22c55e', borderRadius: [3, 3, 0, 0] } })),
  }],
}))

const filteredOverseasByRegion = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 1) return []
  const regionMap = { sea: ['东南亚某国'], me: ['中东某国'], af: ['非洲某国'] }
  const countries = regionMap[drillNode.value.id] || []
  return OVERSEAS_ASSETS.filter(o => countries.includes(o.country))
})

const overseasProjectDetail = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 2) return null
  if (drillNode.value.id === 'ov_sea_proj') return OVERSEAS_PROJECTS.find(p => p.id === 'OP01')
  if (drillNode.value.id === 'ov_me_proj') return OVERSEAS_PROJECTS.find(p => p.id === 'OP02')
  return null
})

const filteredOverseasAccounts = computed(() => {
  if (!drillNode.value || drillNode.value.level !== 2) return []
  const project = overseasProjectDetail.value
  if (!project) return []
  return OVERSEAS_ACCOUNTS.filter(a => a.country === project.country)
})

// ==================== 金融穿透图表 ====================
const bankingGaugeChart = computed(() => ({
  backgroundColor: 'transparent',
  series: [
    { type: 'gauge', center: ['25%', '55%'], radius: '70%', startAngle: 200, endAngle: -20,
      min: 0, max: 100, splitNumber: 5,
      axisLine: { lineStyle: { width: 8, color: [[0.3, '#22c55e'], [0.7, '#eab308'], [1, '#ef4444']] } },
      pointer: { length: '60%', width: 3, itemStyle: { color: '#8ba3c7' } },
      detail: { formatter: '{value}%', color: '#e8f1ff', fontSize: 14, offsetCenter: [0, '60%'] },
      title: { offsetCenter: [0, '85%'], color: '#8ba3c7', fontSize: 10 },
      data: [{ value: 67.4, name: '信用风险' }],
    },
    { type: 'gauge', center: ['75%', '55%'], radius: '70%', startAngle: 200, endAngle: -20,
      min: 0, max: 100, splitNumber: 5,
      axisLine: { lineStyle: { width: 8, color: [[0.3, '#ef4444'], [0.7, '#eab308'], [1, '#22c55e']] } },
      pointer: { length: '60%', width: 3, itemStyle: { color: '#8ba3c7' } },
      detail: { formatter: '{value}%', color: '#e8f1ff', fontSize: 14, offsetCenter: [0, '60%'] },
      title: { offsetCenter: [0, '85%'], color: '#8ba3c7', fontSize: 10 },
      data: [{ value: 94.7, name: '集中度' }],
    },
  ],
}))

// ==================== 会计穿透图表 ====================
const accountingScoreChart = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 16, top: 20, bottom: 28 },
  xAxis: { type: 'category', data: ACCOUNTING_QUALITY.map(a => a.sector), axisLabel: { color: '#8ba3c7', fontSize: 10, rotate: 20 } },
  yAxis: { type: 'value', min: 60, max: 100, name: '分', axisLabel: { color: '#8ba3c7', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)' } } },
  series: [{
    type: 'bar', barWidth: 20,
    data: ACCOUNTING_QUALITY.map(a => ({ value: a.score, itemStyle: { color: a.score >= 90 ? '#22c55e' : a.score >= 85 ? '#3b82f6' : a.score >= 80 ? '#f97316' : '#ef4444', borderRadius: [3, 3, 0, 0] } })),
    markLine: { data: [{ yAxis: 85, label: { formatter: '合格线' }, lineStyle: { color: '#eab308', type: 'dashed' } }] },
  }],
}))

// ==================== 定时器 ====================
let toastTimer
watch(() => drillMode.value?.module, (module) => {
  if (module === 'contract') startContractDemo()
  else stopContractDemo()
})

watch(contractFilteredList, (list) => {
  if (!list.length) return
  if (!list.some((item) => item.id === selectedContractId.value)) {
    selectedContractId.value = list[0].id
  }
})

onMounted(() => {
  toastTimer = setInterval(() => {
    toastShow.value = true
    toastIndex = (toastIndex + 1) % toastQueue.length
    const item = toastQueue[toastIndex]
    toastText.value = item.text
    toastModule.value = item.module
  }, 14000)
  contractCurrentTime.value = formatContractTime()
})
onUnmounted(() => {
  clearInterval(toastTimer)
  stopContractDemo()
})
</script>

<style scoped>
/* ==================== ROOT ==================== */
.dbrd {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #040d1a 0%, #0a1929 100%);
  overflow: hidden;
  position: relative;
}

/* ==================== TOAST ==================== */
.toast-bar {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 50;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; font-size: 12px;
  background: rgba(20, 10, 10, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  max-width: 600px;
  white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.toast-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
.toast-arrow { margin-left: 4px; color: rgba(239, 68, 68, 0.6); font-size: 12px; }
.toast-close { margin-left: 8px; background: none; border: none; color: #8ba3c7; font-size: 16px; cursor: pointer; }

/* ==================== BODY ==================== */
.dbrd-body {
  flex: 1;
  display: flex;
  gap: 6px;
  padding: 6px;
  min-height: 0;
  overflow: hidden;
}
.col { display: flex; flex-direction: column; gap: 6px; min-height: 0; min-width: 0; overflow: hidden; }
.col-left { flex: 0 0 25%; width: 25%; }
.col-center { flex: 0 0 50%; width: 50%; }
.col-right { flex: 0 0 25%; width: 25%; }

/* ==================== PANEL ==================== */
.panel-lg {
  background: rgba(10, 40, 70, 0.55);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 8px;
  padding: 8px;
  min-height: 0;
  overflow: hidden;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.panel-lg:hover { border-color: rgba(0, 229, 255, 0.25); }
.panel-lg::before, .panel-lg::after {
  content: ''; position: absolute; width: 6px; height: 6px;
  border-color: rgba(0, 229, 255, 0.5); border-style: solid; pointer-events: none; z-index: 1;
}
.panel-lg::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; border-radius: 8px 0 0 0; }
.panel-lg::after { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; border-radius: 0 0 8px 0; }

.p-title {
  font-size: 11px; font-weight: 600; color: #e8f1ff;
  margin: 0 0 4px; display: flex; align-items: center; gap: 5px;
  letter-spacing: 0.02em;
}
.p-title::before { content: ''; width: 3px; height: 10px; border-radius: 2px; background: linear-gradient(180deg, #3b82f6, #06b6d4); }

.p-chart { flex: 1; min-height: 0; }
.heat-chart { flex: 1; min-height: 0; }
.half { flex: 1; min-height: 0; }

/* Panel heights */
.col-left .panel-lg:nth-child(1) { flex: 1; }
.col-left .panel-lg:nth-child(2) { flex: 1.2; }
.col-left .panel-lg:nth-child(3) { flex: 1.5; }
.col-left .panel-lg:nth-child(4) { flex: 1.3; }

.col-right .panel-lg:nth-child(1) { flex: 1; }
.col-right .panel-lg:nth-child(2) { flex: 2; }
.col-right .panel-lg:nth-child(3) { flex: 1.2; }

/* ==================== CENTER KPI ROW ==================== */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px;
  flex: 0 0 auto;
}
.kpi-card {
  background: rgba(10, 40, 70, 0.55);
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex; flex-direction: column; justify-content: center;
  position: relative;
}
.kpi-card::before {
  content: ''; position: absolute; top: -1px; left: -1px;
  width: 5px; height: 5px; border: 1px solid rgba(0, 229, 255, 0.5); border-width: 1px 0 0 1px;
}
.kpi-card::after {
  content: ''; position: absolute; bottom: -1px; right: -1px;
  width: 5px; height: 5px; border: 1px solid rgba(0, 229, 255, 0.5); border-width: 0 1px 1px 0;
}
.kpi-card.kpi-risk { border-color: rgba(239, 68, 68, 0.3); }
.kpi-card.kpi-risk::before, .kpi-card.kpi-risk::after { border-color: rgba(239, 68, 68, 0.5); }
.kpi-num { font-size: 24px; font-weight: 800; font-family: ui-monospace, 'SF Mono', monospace; color: #e8f1ff; letter-spacing: 0.02em; }
.kpi-lbl { font-size: 10px; color: #8ba3c7; margin-top: 1px; }
.kpi-sub { font-size: 9px; color: #5a7a9a; margin-top: 1px; }

/* ==================== CENTER Heatmap/Table/Entries ==================== */
.panel-heatmap { flex: 1.6; min-height: 140px; }
.panel-table { flex: 1.2; min-height: 100px; overflow: auto; }

/* ==================== FUNDS MICRO CARDS ==================== */
.funds-micro-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  height: calc(100% - 22px);
}
.fm-card {
  background: rgba(10, 40, 70, 0.35);
  border: 1px solid rgba(0, 229, 255, 0.08);
  border-radius: 6px;
  padding: 6px 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: border-color 0.2s;
}
.fm-card:hover { border-color: rgba(0, 229, 255, 0.25); }
.fm-icon { font-size: 14px; }
.fm-val { font-size: 15px; font-weight: 700; font-family: ui-monospace, monospace; color: #e8f1ff; margin-top: 2px; }
.fm-label { font-size: 9px; color: #8ba3c7; margin-top: 1px; }

/* ==================== CONTRACT PERFORMANCE ==================== */
.contract-perf-list { display: flex; flex-direction: column; gap: 6px; }
.cp-item { display: flex; flex-direction: column; gap: 3px; }
.cp-header { display: flex; align-items: center; justify-content: space-between; }
.cp-name { font-size: 11px; color: #c0d0e0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }
.cp-bar-wrap { display: flex; align-items: center; gap: 6px; }
.cp-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.cp-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.cp-fill.cp-overpay { animation: overpayPulse 1.2s ease-in-out infinite; }
@keyframes overpayPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); } }
.cp-pct { font-size: 10px; color: #8ba3c7; font-family: ui-monospace, monospace; min-width: 30px; text-align: right; }
.overpay-warn {
  margin-top: 6px; padding: 6px 8px;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px; font-size: 10px; color: #fca5a5;
  animation: riskPulse 1.5s ease-in-out infinite;
}

/* ==================== COMPACT TABLE ==================== */
.compact-table-wrap {
  overflow: auto; border-radius: 6px;
  border: 1px solid rgba(0, 229, 255, 0.1);
  max-height: 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,229,255,0.15) transparent;
}
.compact-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.compact-table th, .compact-table td { padding: 5px 7px; text-align: left; border-bottom: 1px solid rgba(0, 229, 255, 0.06); white-space: nowrap; }
.compact-table th { background: rgba(0, 229, 255, 0.06); color: #8ba3c7; font-weight: 500; font-size: 10px; }
.compact-table tr:nth-child(even) td { background: rgba(0, 229, 255, 0.02); }
.ct-row { cursor: pointer; transition: background 0.15s; }
.ct-row:hover td { background: rgba(0, 229, 255, 0.08) !important; }
.ct-mono { font-family: ui-monospace, monospace; font-size: 10px; color: #8ba3c7; }
.ct-desc { max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
.ct-status { font-size: 10px; padding: 1px 6px; border-radius: 999px; }
.sts-critical { background: rgba(239,68,68,0.15); color: #fca5a5; }
.sts-high { background: rgba(249,115,22,0.15); color: #fdba74; }
.sts-medium { background: rgba(234,179,8,0.15); color: #fde047; }
.sts-safe { color: #22c55e; }

.row-risk td { background: rgba(239,68,68,0.1) !important; color: #fca5a5; }

/* ==================== MODULE BOARDS (2x2) ==================== */
.module-boards { flex: 2; min-height: 0; overflow: auto; padding: 8px 8px 4px; background: rgba(10, 40, 70, 0.55); border: 1px solid rgba(0, 229, 255, 0.12); border-radius: 8px; display: flex; flex-direction: column; }
.board-grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 6px; min-height: 240px; }
.board-card {
  background: rgba(8, 30, 55, 0.6); border: 1px solid rgba(0, 229, 255, 0.1);
  border-radius: 7px; padding: 6px 8px; cursor: pointer;
  display: flex; flex-direction: column; gap: 2px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  overflow: hidden;
}
.board-card:hover { border-color: rgba(0, 229, 255, 0.35); box-shadow: 0 0 16px rgba(0, 229, 255, 0.12); transform: translateY(-1px); }
.bd-header { display: flex; align-items: center; gap: 5px; margin-bottom: 1px; }
.bd-icon { font-size: 14px; }
.bd-name { font-size: 11px; font-weight: 600; color: #e8f1ff; }
.bd-kpis { display: flex; gap: 8px; margin-bottom: 2px; }
.bd-kpi { display: flex; flex-direction: column; align-items: flex-start; }
.bd-kpi strong { font-size: 13px; font-weight: 700; font-family: ui-monospace, monospace; color: #e8f1ff; }
.bd-kpi small { font-size: 8px; color: #5a7a9a; }
.bd-kpi.warn strong { color: #ef4444; }
.bd-chart { flex: 1; min-height: 45px; }

/* ==================== BREADCRUMB NAVIGATION ==================== */
.drill-bc-link { cursor: pointer; color: #93c5fd; transition: color 0.15s; }
.drill-bc-link:hover { color: #e8f1ff; text-decoration: underline; }
.drill-bc-cur { color: #e8f1ff; font-weight: 600; }

/* ==================== AI PANEL ==================== */
.panel-ai { display: flex; flex-direction: column; overflow: hidden; }
.selected td { background: rgba(59, 130, 246, 0.12) !important; }

.cockpit-compact .toast-bar {
  top: 6px;
  padding: 6px 12px;
  font-size: 11px;
  max-width: 540px;
}

.cockpit-compact .dbrd-body {
  gap: 6px;
  padding: 6px;
}

.cockpit-compact .col-left { flex: 0 0 23%; width: 23%; }
.cockpit-compact .col-center { flex: 0 0 54%; width: 54%; }
.cockpit-compact .col-right { flex: 0 0 23%; width: 23%; }

.cockpit-compact .panel-lg {
  padding: 8px 9px;
  border-radius: 7px;
}

.cockpit-compact .p-title {
  font-size: 11px;
  margin-bottom: 4px;
}

.cockpit-compact .p-title::before {
  height: 10px;
}

.cockpit-compact .p-chart {
  min-height: 92px;
}

.cockpit-compact .heat-chart {
  min-height: 142px;
}

.cockpit-compact .col-left .panel-lg:nth-child(1) { flex: 0.92; }
.cockpit-compact .col-left .panel-lg:nth-child(2) { flex: 1.02; }
.cockpit-compact .col-left .panel-lg:nth-child(3) { flex: 1.05; }
.cockpit-compact .col-left .panel-lg:nth-child(4) { flex: 0.96; }

.cockpit-compact .col-right .panel-lg:nth-child(1) { flex: 0.9; }
.cockpit-compact .col-right .panel-lg:nth-child(2) { flex: 1.08; }

.cockpit-compact .kpi-row {
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-template-rows: 1fr;
  gap: 5px;
}

.cockpit-compact .kpi-card {
  padding: 7px 9px;
  min-height: 66px;
}

.cockpit-compact .kpi-num {
  font-size: 20px;
}

.cockpit-compact .kpi-lbl {
  font-size: 9px;
}

.cockpit-compact .kpi-sub {
  font-size: 8px;
}

.cockpit-compact .panel-heatmap {
  flex: 1.12;
  min-height: 128px;
}

.cockpit-compact .panel-table {
  flex: 0.94;
  min-height: 92px;
}

.cockpit-compact .compact-table {
  font-size: 10px;
}

.cockpit-compact .compact-table th,
.cockpit-compact .compact-table td {
  padding: 4px 6px;
}

.cockpit-compact .ct-desc {
  max-width: 120px;
}

.cockpit-compact .funds-micro-grid {
  gap: 3px;
}

.cockpit-compact .fm-card {
  padding: 5px 6px;
}

.cockpit-compact .fm-icon {
  font-size: 12px;
}

.cockpit-compact .fm-val {
  font-size: 13px;
}

.cockpit-compact .fm-label {
  font-size: 8px;
}

.cockpit-compact .contract-perf-list {
  gap: 4px;
}

.cockpit-compact .cp-name {
  font-size: 10px; max-width: 90px;
}

.cockpit-compact .cp-bar {
  height: 4px;
}

.cockpit-compact .cp-pct {
  font-size: 9px;
  min-width: 26px;
}

.cockpit-compact .overpay-warn {
  margin-top: 4px;
  padding: 5px 6px;
  font-size: 9px;
}

.cockpit-compact .module-boards {
  flex: 1.2;
  min-height: 214px;
  overflow: hidden;
  padding: 8px 8px 5px;
}

.cockpit-compact .board-grid {
  min-height: 184px;
  gap: 5px;
}

.cockpit-compact .board-card {
  padding: 5px 7px;
  gap: 1px;
}

.cockpit-compact .bd-icon {
  font-size: 12px;
}

.cockpit-compact .bd-name {
  font-size: 10px;
}

.cockpit-compact .bd-kpis {
  gap: 6px;
}

.cockpit-compact .bd-kpi strong {
  font-size: 12px;
}

.cockpit-compact .bd-kpi small {
  font-size: 7px;
}

.cockpit-compact .bd-chart {
  min-height: 34px;
}

.cockpit-compact .panel-ai-btn {
  gap: 6px;
}

.cockpit-compact .ai-launcher {
  padding: 10px 12px;
  margin: 4px 0 6px;
  font-size: 12px;
}

.cockpit-compact .ai-launch-icon {
  font-size: 16px;
}

.cockpit-compact .ai-alerts {
  margin-top: 4px;
  padding-top: 4px;
}

.cockpit-compact .ai-alerts-title {
  margin-bottom: 4px;
  font-size: 10px;
}

.cockpit-compact .ai-alert-item {
  padding: 5px 6px;
  margin-bottom: 3px;
}

.cockpit-compact .aa-title {
  font-size: 9px;
}

.cockpit-compact .aa-time {
  font-size: 8px;
}

@media (max-width: 1600px) {
  .dbrd-body {
    display: grid;
    grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.45fr);
    align-items: start;
  }
  .col-left,
  .col-center,
  .col-right {
    width: auto;
    flex: initial;
  }
  .col-right {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1200px) {
  .dbrd-body {
    grid-template-columns: 1fr;
  }
  .cockpit-compact .kpi-row,
  .board-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
  .cockpit-compact .module-boards {
    overflow: auto;
  }
  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }
}
.ai-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.ai-presets { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
.ai-preset-btn {
  width: 100%; padding: 5px 8px; font-size: 10px;
  background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px; color: #93c5fd; cursor: pointer; text-align: left;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ai-preset-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); }
.ai-preset-btn:disabled { opacity: 0.5; cursor: wait; }
.ai-thinking { margin-bottom: 6px; }
.ai-think-line {
  font-size: 10px; color: #6b9fd4; display: flex; align-items: center; gap: 5px;
  padding: 2px 0; animation: fadeInLine 0.3s ease;
}
@keyframes fadeInLine { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.ai-think-dot { width: 4px; height: 4px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
.ai-answer {
  font-size: 11px; color: #c0d0e0; padding: 6px 8px;
  background: rgba(59, 130, 246, 0.06); border-radius: 6px;
  border-left: 2px solid #3b82f6;
  line-height: 1.5; max-height: 80px; overflow-y: auto;
  scrollbar-width: thin;
}
.ai-mini-chart { height: 120px; }

/* AI 主动预警 */
.ai-alerts { margin-top: 8px; border-top: 1px solid rgba(0, 229, 255, 0.1); padding-top: 6px; }
.ai-alerts-title { font-size: 11px; font-weight: 600; color: #f97316; margin-bottom: 6px; }
.ai-alert-item {
  padding: 6px 8px; background: rgba(10, 40, 70, 0.3);
  border-radius: 5px; margin-bottom: 4px; cursor: pointer;
  transition: background 0.15s;
}
.ai-alert-item:hover { background: rgba(10, 40, 70, 0.5); }
.aa-header { display: flex; align-items: center; gap: 6px; }
.aa-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.aa-critical { background: #ef4444; }
.aa-high { background: #f97316; }
.aa-medium { background: #eab308; }
.aa-title { font-size: 10px; color: #c0d0e0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aa-time { font-size: 9px; color: #5a7a9a; flex-shrink: 0; }
.aa-detail { font-size: 10px; color: #8ba3c7; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(0,229,255,0.06); line-height: 1.4; }

/* ==================== DRILL OVERLAY ==================== */
.drill-overlay {
  position: absolute; inset: 0;
  background: rgba(4, 13, 26, 0.97);
  z-index: 30;
  display: flex; flex-direction: column;
}
.drill-header-row {
  display: flex; align-items: center; gap: 14px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
  flex-shrink: 0;
}
.drill-breadcrumb { font-size: 12px; color: #8ba3c7; }
.drill-breadcrumb .sep { margin: 0 6px; color: rgba(0,229,255,0.2); }
.drill-body-wrap { display: flex; flex: 1; min-height: 0; }

/* 详情内容 */
.drill-detail-content {
  flex: 1; padding: 12px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: rgba(0,229,255,0.15) transparent;
}
.drill-chart { height: 260px; }
.drill-chart.half { height: 210px; }
.drill-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #8ba3c7; }

/* 详情元数据行 */
.detail-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.dm-item {
  padding: 7px 10px; background: rgba(59,130,246,0.06);
  border-radius: 5px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;
}
.dm-k { color: #8ba3c7; }
.dm-v { color: #e8f1ff; font-weight: 600; }

/* 资金 KPI 行 */
.funds-mini-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.fm-kpi { background: rgba(59,130,246,0.08); border-radius: 6px; padding: 8px; text-align: center; }
.fmk-label { font-size: 10px; color: #8ba3c7; }
.fmk-val { font-size: 16px; font-weight: 700; font-family: ui-monospace, monospace; color: #3b82f6; margin-top: 2px; }

/* 迷你进度条 */
.mini-bar { display: flex; align-items: center; gap: 4px; }
.mini-fill { height: 5px; border-radius: 3px; min-width: 3px; }
.mini-pct { font-size: 10px; color: #8ba3c7; }

/* AI 结论 */
.ai-conclusion-box {
  background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 6px; padding: 12px;
}
.ai-conc-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.conc-high { color: #fca5a5; line-height: 1.6; }
.conc-safe { color: #22c55e; }

/* 风险条款 */
.risk-clause-box {
  background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.15);
  border-radius: 6px; padding: 10px; margin-bottom: 6px;
}
.rc-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 12px; }
.rc-body { font-size: 11px; color: #8ba3c7; line-height: 1.5; }
.rc-sug { font-size: 11px; color: #3b82f6; margin-top: 4px; }

/* 履约 */
.perf-section { margin-top: 8px; }
.perf-summary-row { display: flex; gap: 16px; font-size: 12px; color: #c0d0e0; flex-wrap: wrap; }

/* ==================== FOOTER ==================== */
.dbrd-footer {
  height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; gap: 0;
  background: rgba(10, 25, 47, 0.95);
  border-top: 1px solid rgba(0, 229, 255, 0.12);
  z-index: 10;
}
.ft-tab {
  padding: 0 20px; height: 100%;
  background: none; border: none; border-bottom: 2px solid transparent;
  color: #8ba3c7; font-size: 12px; cursor: pointer;
  transition: all 0.2s;
}
.ft-tab:hover { color: #c0d0e0; }
.ft-tab.ft-sel { color: #3b82f6; border-bottom-color: #3b82f6; font-weight: 600; }

/* ==================== ALTERNATE VIEWS ==================== */
.alt-view {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}
.alt-header {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
  flex-shrink: 0;
}
.alt-header h3 { font-size: 14px; margin: 0; color: #e8f1ff; }
.alt-body { flex: 1; padding: 12px 16px; overflow-y: auto; scrollbar-width: thin; }

.alt-tabs { display: flex; gap: 8px; }
.alt-tab {
  padding: 6px 14px; font-size: 12px;
  background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);
  border-radius: 6px; color: #8ba3c7; cursor: pointer;
  transition: all 0.15s;
}
.alt-tab:hover { background: rgba(59,130,246,0.15); }
.alt-tab-sel { background: rgba(59,130,246,0.2); border-color: #3b82f6; color: #e8f1ff; }

/* AI 中台全屏 */
.ai-qa-full { display: flex; flex-direction: column; }
.ai-presets-row { display: flex; gap: 8px; margin-bottom: 12px; }
.ai-preset-btn.lg { flex: 1; padding: 8px 12px; font-size: 12px; }
.ai-thinking-lg { margin-bottom: 10px; }
.ai-answer-lg {
  font-size: 13px; color: #c0d0e0; padding: 10px 12px;
  background: rgba(59,130,246,0.06); border-radius: 8px;
  border-left: 3px solid #3b82f6; line-height: 1.6;
}

.ai-alerts-full { display: flex; flex-direction: column; gap: 10px; }
.alert-card {
  padding: 14px; border-radius: 8px;
  background: rgba(10, 40, 70, 0.4); border: 1px solid rgba(0, 229, 255, 0.1);
}
.alert-card.ac-critical { border-color: rgba(239,68,68,0.3); }
.alert-card.ac-high { border-color: rgba(249,115,22,0.25); }
.alert-card.ac-medium { border-color: rgba(234,179,8,0.2); }
.ac-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ac-dot { width: 6px; height: 6px; border-radius: 50%; }
.ac-time { font-size: 10px; color: #5a7a9a; margin-left: auto; }
.ac-detail { font-size: 12px; color: #8ba3c7; line-height: 1.5; }
.ac-actions { margin-top: 8px; display: flex; gap: 6px; }
.btn.sm { padding: 4px 10px; font-size: 11px; }

.input-row { display: flex; gap: 10px; }
.graph-input {
  flex: 1; padding: 8px 12px;
  background: rgba(10,40,70,0.5); border: 1px solid rgba(0,229,255,0.15);
  border-radius: 6px; color: #e8f1ff; font-size: 13px;
  outline: none;
}
.graph-input:focus { border-color: #3b82f6; }
.empty-hint { margin-top: 40px; text-align: center; color: #5a7a9a; font-size: 13px; }

.lg-btn { width: 100%; padding: 12px; font-size: 14px; margin-bottom: 12px; }
.report-output {
  background: rgba(10,40,70,0.4); border: 1px solid rgba(0,229,255,0.1);
  border-radius: 8px; padding: 14px; font-family: ui-monospace, monospace;
}
.report-line { font-size: 12px; color: #8ba3c7; line-height: 1.7; white-space: pre-wrap; }

/* 决策建议 */
.decision-list { display: flex; flex-direction: column; gap: 10px; }
.decision-card {
  display: flex; gap: 12px; padding: 12px 14px;
  background: rgba(10,40,70,0.4); border: 1px solid rgba(0,229,255,0.1);
  border-radius: 8px;
}
.dc-no { font-size: 20px; font-weight: 800; color: #3b82f6; font-family: ui-monospace, monospace; flex-shrink: 0; line-height: 1; }
.dc-body { flex: 1; }
.dc-title { font-size: 13px; font-weight: 600; color: #e8f1ff; margin-bottom: 4px; }
.dc-desc { font-size: 11px; color: #8ba3c7; line-height: 1.5; margin-bottom: 4px; }
.dc-meta { font-size: 10px; color: #5a7a9a; }

/* 风险中心 */
.risk-center-grid { }

/* 闭环流程 */
.rect-flow { display: flex; gap: 8px; flex-wrap: wrap; }
.rf-step {
  flex: 1; min-width: 140px; padding: 14px;
  background: rgba(10,40,70,0.4); border: 1px solid rgba(0,229,255,0.1);
  border-radius: 8px; display: flex; align-items: center; gap: 10px;
  opacity: 0.5;
}
.rf-step.rf-done { border-color: rgba(34,197,94,0.3); opacity: 1; }
.rf-step.rf-current { border-color: rgba(59,130,246,0.5); opacity: 1; box-shadow: 0 0 8px rgba(59,130,246,0.15); }
.rf-num { font-size: 22px; font-weight: 800; color: #3b82f6; font-family: ui-monospace, monospace; }
.rf-info { flex: 1; }
.rf-name { font-size: 12px; font-weight: 600; color: #e8f1ff; }
.rf-desc { font-size: 10px; color: #8ba3c7; margin-top: 2px; }
.rf-check, .rf-spin { font-size: 18px; }

/* 价值对比 */
.compare-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.cmp-card {
  background: rgba(10,40,70,0.4); border: 1px solid rgba(0,229,255,0.1);
  border-radius: 8px; padding: 14px; text-align: center;
}
.cmp-label { font-size: 11px; color: #8ba3c7; margin-bottom: 8px; }
.cmp-values { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
.cmp-val { font-size: 13px; font-weight: 600; font-family: ui-monospace, monospace; }
.cmp-val.old { color: #ef4444; text-decoration: line-through; }
.cmp-val.new { color: #22c55e; }
.cmp-arrow { color: #5a7a9a; }
.cmp-save { font-size: 10px; color: #3b82f6; font-weight: 600; }

/* ==================== SCROLLBAR ==================== */
* { scrollbar-width: thin; scrollbar-color: rgba(0, 229, 255, 0.1) transparent; }

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1400px) {
  .dbrd-body { flex-wrap: wrap; }
  .col-left, .col-right { flex: 0 0 50%; width: 50%; }
  .col-center { flex: 0 0 100%; width: 100%; order: -1; }
  .compare-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .col-left, .col-right { flex: 0 0 100%; width: 100%; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .compare-grid { grid-template-columns: 1fr; }
}

/* ==================== AI LAUNCHER ==================== */
.panel-ai-btn { display: flex; flex-direction: column; }
.ai-launcher {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 14px 16px; margin: 8px 0 10px;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15));
  border: 1px solid rgba(59,130,246,0.35);
  border-radius: 10px;
  color: #e8f1ff; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
}
.ai-launcher:hover { background: linear-gradient(135deg, rgba(59,130,246,0.35), rgba(6,182,212,0.25)); border-color: rgba(59,130,246,0.6); box-shadow: 0 0 20px rgba(59,130,246,0.2); }
.ai-launch-icon { font-size: 20px; }
.ai-launch-arrow { font-size: 16px; color: rgba(59,130,246,0.7); transition: transform 0.2s; }
.ai-launcher:hover .ai-launch-arrow { transform: translateX(3px); }

/* ==================== AI DIALOG ==================== */
.ai-dialog-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(4, 13, 26, 0.85); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
}
.ai-dialog {
  width: 820px; max-width: 92vw; max-height: 85vh;
  background: linear-gradient(180deg, #0a1929 0%, #040d1a 100%);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 14px;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 229, 255, 0.1);
  overflow: hidden;
}
.ai-dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
  flex-shrink: 0;
}
.ai-dialog-title { font-size: 17px; font-weight: 700; color: #e8f1ff; }
.ai-dialog-close {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.12); background: none;
  color: #8ba3c7; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.ai-dialog-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

/* Agent 选择器 */
.ai-agent-selector {
  display: flex; gap: 6px;
  padding: 10px 16px; flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
}
.ai-agent-btn {
  padding: 6px 14px; font-size: 12px; border-radius: 6px;
  border: 1px solid rgba(0, 229, 255, 0.12); background: rgba(10, 40, 70, 0.35);
  color: #8ba3c7; cursor: pointer; transition: all 0.2s;
}
.ai-agent-btn:hover { border-color: rgba(0, 229, 255, 0.3); color: #c0d8f0; }
.ai-agent-btn.ai-agent-sel {
  background: rgba(59, 130, 246, 0.2); border-color: #3b82f6;
  color: #e8f1ff; font-weight: 600;
}

/* 语音提问 */
.ai-voice-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; margin-bottom: 10px;
  background: rgba(10, 40, 70, 0.3); border: 1px solid rgba(0, 229, 255, 0.1);
  border-radius: 8px;
}
.ai-voice-btn {
  width: 40px; height: 40px; border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.1);
  font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.ai-voice-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.25); border-color: rgba(59, 130, 246, 0.5); }
.ai-voice-btn:disabled { opacity: 0.5; cursor: wait; }
.ai-voice-btn.ai-voice-active { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); animation: voicePulse 0.8s ease-in-out infinite; }
@keyframes voicePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
.ai-voice-text { font-size: 13px; color: #f97316; animation: fadeInLine 0.3s ease; }
.ai-voice-hint { font-size: 12px; color: #5a7a9a; }

/* 关联分析结论 */
.graph-analysis-result {
  margin-top: 12px; padding: 14px;
  background: rgba(10, 40, 70, 0.4); border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
}
.gar-title { font-size: 14px; font-weight: 600; color: #e8f1ff; margin-bottom: 10px; }
.gar-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.gar-item { padding: 8px; background: rgba(59,130,246,0.06); border-radius: 6px; text-align: center; }
.gar-label { font-size: 10px; color: #8ba3c7; display: block; margin-bottom: 4px; }
.gar-value { font-size: 12px; color: #e8f1ff; font-weight: 600; }
.gar-paths { margin-bottom: 8px; }
.gar-subtitle { font-size: 12px; font-weight: 600; color: #c0d8f0; margin-bottom: 6px; }
.gar-path { font-size: 11px; color: #93c5fd; padding: 4px 8px; background: rgba(59,130,246,0.08); border-radius: 4px; margin-bottom: 4px; font-family: ui-monospace, monospace; }
.gar-note { font-size: 11px; color: #f97316; line-height: 1.5; padding: 6px 8px; background: rgba(249,115,22,0.06); border-radius: 4px; border-left: 2px solid #f97316; }

.ai-dialog-tabs {
  display: flex; gap: 0;
  padding: 0 16px; flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
}
.ai-dtab {
  padding: 10px 18px; font-size: 13px; color: #8ba3c7;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.2s;
}
.ai-dtab:hover { color: #c0d8f0; }
.ai-dtab-sel { color: #3b82f6; border-bottom-color: #3b82f6; font-weight: 600; }
.ai-dialog-body {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  scrollbar-width: thin;
}
.ai-presets-row { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.ai-think-title, .ai-answer-title { font-size: 13px; font-weight: 600; color: #e8f1ff; margin-bottom: 8px; }
.ai-thinking-lg {
  background: rgba(59,130,246,0.06); border: 1px dashed rgba(59,130,246,0.2);
  border-radius: 8px; padding: 12px; margin-bottom: 14px;
}
.ai-think-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: #3b82f6; margin-right: 8px; flex-shrink: 0;
}
.ai-answer-lg {
  background: rgba(10, 40, 70, 0.4); border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 8px; padding: 14px; margin-bottom: 14px;
}
.ai-answer-content { font-size: 13px; color: #c0d8f0; line-height: 1.7; white-space: pre-wrap; }
.ai-chart-full { margin-top: 14px; height: 280px; }
.ai-dialog-chart { width: 100%; height: 100%; }
.ai-alerts-full { display: flex; flex-direction: column; gap: 8px; }
.ai-alert-card {
  padding: 12px 14px; background: rgba(10, 40, 70, 0.35);
  border: 1px solid rgba(0, 229, 255, 0.1); border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
}
.ai-alert-card:hover { border-color: rgba(0, 229, 255, 0.25); background: rgba(10, 40, 70, 0.5); }
.aac-header { display: flex; align-items: center; gap: 8px; }
.aac-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.aac-title { font-size: 13px; color: #e8f1ff; flex: 1; }
.aac-time { font-size: 11px; color: #5a7a9a; }
.aac-detail { margin-top: 8px; font-size: 12px; color: #8ba3c7; line-height: 1.6; padding-left: 14px; border-left: 2px solid rgba(59,130,246,0.2); }
.ai-graph-full { display: flex; flex-direction: column; min-height: 300px; }
.ai-graph-input-row { display: flex; gap: 10px; margin-bottom: 14px; }
.ai-graph-input {
  flex: 1; padding: 10px 14px; border-radius: 8px;
  border: 1px solid rgba(0, 229, 255, 0.2); background: rgba(0,0,0,0.25);
  color: #e8f1ff; font-size: 13px;
}
.ai-graph-input::placeholder { color: #5a7a9a; }
.ai-report-full { min-height: 200px; }
.ai-decision-full { min-height: 200px; }
.suggestion-card {
  padding: 12px 14px; background: rgba(10, 40, 70, 0.35);
  border: 1px solid rgba(0, 229, 255, 0.1); border-radius: 8px;
  margin-bottom: 8px;
}
.sug-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.sug-level { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.sug-critical { background: rgba(239,68,68,0.15); color: #ef4444; }
.sug-high { background: rgba(249,115,22,0.15); color: #f97316; }
.sug-medium { background: rgba(234,179,8,0.15); color: #eab308; }
.sug-title { font-size: 14px; font-weight: 600; color: #e8f1ff; }
.sug-body { font-size: 12px; color: #8ba3c7; line-height: 1.6; }

/* ==================== DRILL BREADCRUMB ==================== */
.drill-bc-link { color: #93c5fd; cursor: pointer; transition: color 0.15s; }
.drill-bc-link:hover { color: #3b82f6; text-decoration: underline; }
.drill-bc-cur { color: #e8f1ff; font-weight: 600; }
.drill-bc-sep { color: rgba(0,229,255,0.2); margin: 0 4px; }
.drill-detail-content { overflow-y: auto; scrollbar-width: thin; padding: 16px 20px; }
.ai-btn { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15)); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; }
.ai-btn:hover { background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.25)); color: #e8f1ff; }

/* ==================== CONTRACT CENTER ==================== */
.contract-center-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  color: #e6f7ff;
  font-family: "Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  overflow: visible;
}
.glass-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(8, 23, 42, 0.88), rgba(4, 12, 24, 0.74));
  border: 1px solid rgba(14, 165, 233, 0.22);
  border-radius: 18px;
  box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.08) inset, 0 18px 48px rgba(2, 12, 27, 0.45);
  backdrop-filter: blur(14px);
}
.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.04) 16%, transparent 34%, transparent 100%);
  transform: translateX(-120%);
  animation: panelSweep 7.5s linear infinite;
  pointer-events: none;
}
.breath-glow {
  animation: panelBreath 3.4s ease-in-out infinite;
}
.float-row {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.float-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(4, 18, 38, 0.38);
}
.glow-title {
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.36), 0 0 18px rgba(6, 182, 212, 0.22);
}
.contract-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
}
.contract-topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.contract-screen-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.contract-scene-tabs {
  display: flex;
  gap: 10px;
}
.contract-scene-tab {
  border: 1px solid rgba(14, 165, 233, 0.24);
  background: rgba(10, 34, 58, 0.6);
  color: #8edcff;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.contract-scene-tab.active,
.contract-scene-tab:hover {
  color: #fff;
  border-color: rgba(6, 182, 212, 0.58);
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.24);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.34), rgba(6, 182, 212, 0.2));
}
.contract-topbar-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.contract-top-info {
  min-width: 190px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(10, 34, 58, 0.54);
  border: 1px solid rgba(14, 165, 233, 0.18);
}
.contract-top-info.success {
  border-color: rgba(34, 197, 94, 0.28);
}
.contract-top-label {
  display: block;
  font-size: 11px;
  color: #83b8cf;
  margin-bottom: 4px;
}
.contract-top-info strong {
  font-size: 14px;
  color: #f5fbff;
}
.contract-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
.contract-kpi-card {
  position: relative;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(7, 29, 51, 0.92), rgba(5, 19, 35, 0.84));
  border: 1px solid rgba(14, 165, 233, 0.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px rgba(2, 10, 24, 0.38);
}
.contract-kpi-card::after {
  content: '';
  position: absolute;
  left: -30%;
  right: -30%;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  animation: sweepLine 3.8s linear infinite;
}
.contract-kpi-card.high { border-color: rgba(245, 63, 63, 0.42); box-shadow: 0 0 18px rgba(245, 63, 63, 0.16); }
.contract-kpi-card.medium { border-color: rgba(255, 136, 0, 0.38); }
.contract-kpi-card.watch { border-color: rgba(250, 204, 22, 0.36); }
.contract-kpi-card.normal { border-color: rgba(6, 182, 212, 0.28); }
.contract-kpi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.contract-kpi-title {
  font-size: 12px;
  color: #9ad9f0;
}
.contract-kpi-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  font-size: 15px;
}
.contract-kpi-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.contract-kpi-num {
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
  color: #ffffff;
  text-shadow: 0 0 16px rgba(14, 165, 233, 0.34);
}
.contract-kpi-unit {
  font-size: 12px;
  color: #8ec9e1;
}
.contract-trend-svg {
  width: 100%;
  height: 34px;
  margin-top: 10px;
  opacity: 0.96;
}
.contract-kpi-status {
  margin-top: 8px;
  font-size: 11px;
  color: #8cc5d9;
}
.contract-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(360px, 0.9fr);
  gap: 16px;
  align-items: stretch;
  min-height: 0;
}
.contract-left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}
.contract-pie-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.contract-chart-card,
.contract-list-card,
.contract-ai-panel,
.contract-bottom-panel {
  padding: 16px 18px;
}
.contract-chart-card,
.contract-list-card {
  min-width: 0;
}
.contract-chart-host {
  height: 270px;
}
.contract-bottom-chart {
  height: 330px;
}
.contract-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.contract-section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.contract-section-sub {
  font-size: 12px;
  color: #83b8cf;
}
.contract-legend-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.contract-legend-chip {
  border: 1px solid rgba(14, 165, 233, 0.18);
  background: rgba(7, 24, 41, 0.72);
  color: #d9f7ff;
  border-radius: 999px;
  padding: 7px 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.contract-legend-chip.active,
.contract-legend-chip:hover {
  transform: translateY(-1px) scale(1.02);
  border-color: rgba(6, 182, 212, 0.45);
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.2);
}
.contract-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 12px currentColor;
}
.contract-list-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.contract-list-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.contract-toolbar-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.contract-toolbar-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #d7f6ff;
  background: rgba(10, 34, 58, 0.62);
  border: 1px solid rgba(14, 165, 233, 0.16);
}
.contract-toolbar-chip.warn {
  border-color: rgba(245, 63, 63, 0.24);
  color: #ffd7d7;
  background: rgba(62, 15, 21, 0.38);
}
.contract-table-wrap {
  overflow: auto;
  flex: 1;
  min-height: 360px;
  max-height: 560px;
  border-radius: 16px;
  border: 1px solid rgba(14, 165, 233, 0.14);
}
.contract-main-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}
.contract-main-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: center;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.28), rgba(6, 182, 212, 0.16));
  color: #ebfbff;
  font-weight: 700;
}
.contract-main-table tbody tr {
  cursor: pointer;
}
.contract-main-table tbody tr:nth-child(odd) {
  background: rgba(255,255,255,0.025);
}
.contract-main-table tbody tr:nth-child(even) {
  background: rgba(4, 18, 38, 0.3);
}
.contract-main-table td {
  padding: 12px 10px;
  text-align: center;
  color: #d4edf8;
  border-bottom: 1px solid rgba(14, 165, 233, 0.08);
}
.contract-main-row.active {
  background: rgba(14, 165, 233, 0.12) !important;
  box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.25);
}
.contract-main-row.high {
  background: linear-gradient(90deg, rgba(245, 63, 63, 0.16), rgba(245, 63, 63, 0.06)) !important;
}
.contract-main-row.medium {
  background: linear-gradient(90deg, rgba(255, 136, 0, 0.12), rgba(255, 136, 0, 0.04)) !important;
}
.risk-live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 12px rgba(245, 63, 63, 0.95);
  animation: riskBlink 1s ease-in-out infinite;
}
.risk-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
  color: #fff;
}
.risk-chip.high { background: linear-gradient(135deg, #f53f3f, #fb7185); }
.risk-chip.medium { background: linear-gradient(135deg, #ff8800, #fb923c); }
.risk-chip.watch { background: linear-gradient(135deg, #facc16, #fde68a); color: #3a2500; }
.risk-chip.normal { background: linear-gradient(135deg, #22c55e, #4ade80); }
.contract-op-row {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}
.mini-op-btn,
.contract-action-btn {
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: rgba(7, 24, 41, 0.76);
  color: #d9f7ff;
  border-radius: 10px;
  padding: 7px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mini-op-btn:hover,
.contract-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(2, 10, 24, 0.35);
  background: rgba(14, 165, 233, 0.16);
}
.mini-op-btn.warning,
.contract-action-btn.warning {
  border-color: rgba(245, 63, 63, 0.4);
  color: #ffd1d1;
}
.contract-action-btn.primary {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.34), rgba(6, 182, 212, 0.24));
  border-color: rgba(6, 182, 212, 0.44);
}
.contract-action-btn.pulse {
  animation: ctaPulse 1.25s ease-in-out infinite;
}
.contract-ai-panel {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: calc(100vh - 140px);
  overflow: auto;
  min-width: 0;
}
.contract-ai-badge {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(245, 63, 63, 0.14);
  color: #ffd2d2;
  border: 1px solid rgba(245, 63, 63, 0.24);
  font-size: 11px;
}
.contract-ai-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.contract-ai-meta-card {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(14, 165, 233, 0.12);
}
.contract-ai-meta-card.warning {
  border-color: rgba(255, 136, 0, 0.26);
}
.contract-ai-meta-label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: #83b8cf;
}
.contract-ai-meta-card strong {
  font-size: 15px;
  color: #f4fcff;
}
.contract-risk-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.contract-risk-tag {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff2d1;
  background: rgba(250, 204, 22, 0.12);
  border: 1px solid rgba(250, 204, 22, 0.22);
}
.contract-ai-section {
  padding: 14px;
  border-radius: 16px;
  background: rgba(6, 20, 34, 0.66);
  border: 1px solid rgba(14, 165, 233, 0.12);
  min-width: 0;
}
.contract-ai-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: #f3fbff;
}
.contract-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.contract-info-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(14, 165, 233, 0.09);
}
.contract-info-label {
  display: block;
  font-size: 11px;
  color: #86b7cd;
  margin-bottom: 4px;
}
.contract-info-value {
  font-size: 13px;
  color: #f8feff;
}
.contract-info-value.risk {
  color: #ffb4b4;
}
.contract-clause-list,
.contract-compliance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 260px;
  overflow: auto;
  padding-right: 4px;
}
.contract-clause-item {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(14, 165, 233, 0.1);
  background: rgba(255,255,255,0.02);
}
.contract-clause-item.highlight {
  border-color: rgba(245, 63, 63, 0.2);
}
.contract-clause-item.active {
  background: linear-gradient(135deg, rgba(245, 63, 63, 0.22), rgba(245, 63, 63, 0.12));
  box-shadow: 0 0 18px rgba(245, 63, 63, 0.18);
}
.contract-clause-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #fff;
}
.clause-warning {
  color: #facc16;
  text-shadow: 0 0 12px rgba(250, 204, 22, 0.55);
}
.contract-clause-tag {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
  background: #f53f3f;
}
.contract-clause-text {
  line-height: 1.7;
  color: #f4fbff;
}
.contract-compliance-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(14, 165, 233, 0.1);
}
.contract-compliance-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.contract-compliance-line {
  font-size: 12px;
  line-height: 1.7;
  color: #d6eef8;
}
.contract-compliance-line span {
  color: #8dbed4;
}
.contract-ai-summary {
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(245, 63, 63, 0.14), rgba(14, 165, 233, 0.08));
  border: 1px solid rgba(245, 63, 63, 0.18);
}
.contract-ai-summary-level {
  font-size: 14px;
  font-weight: 800;
  color: #ffb7b7;
  margin-bottom: 8px;
}
.contract-ai-summary-list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.8;
}
.contract-ai-summary-list li {
  color: #f7fcff;
  font-size: 13px;
}
.contract-ai-advice {
  margin-top: 10px;
  color: #ffe4e4;
  font-size: 13px;
}
.contract-ai-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.contract-bottom-panel {
  margin-bottom: 8px;
}

@keyframes panelSweep {
  0% { transform: translateX(-120%); }
  50% { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}
@keyframes panelBreath {
  0%, 100% { box-shadow: 0 18px 48px rgba(2, 12, 27, 0.45), 0 0 0 rgba(6, 182, 212, 0); }
  50% { box-shadow: 0 18px 48px rgba(2, 12, 27, 0.45), 0 0 26px rgba(6, 182, 212, 0.12); }
}
@keyframes sweepLine {
  0% { transform: translateX(-40%); opacity: 0.1; }
  50% { transform: translateX(40%); opacity: 0.85; }
  100% { transform: translateX(80%); opacity: 0.1; }
}
@keyframes riskBlink {
  0%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(245, 63, 63, 0.9); }
  50% { opacity: 0.45; box-shadow: 0 0 22px rgba(245, 63, 63, 0.95); }
}
@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(14, 165, 233, 0); }
  50% { box-shadow: 0 0 22px rgba(14, 165, 233, 0.42); }
}

@media (max-width: 1440px) {
  .contract-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .contract-main-grid {
    grid-template-columns: 1fr;
  }
  .contract-ai-panel {
    position: relative;
    top: 0;
    max-height: none;
  }
}
@media (max-width: 1200px) {
  .contract-pie-row,
  .contract-ai-meta,
  .contract-ai-actions {
    grid-template-columns: 1fr;
  }
  .contract-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .contract-topbar-right {
    width: 100%;
    justify-content: flex-start;
  }
}
@media (max-width: 980px) {
  .contract-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .contract-screen-title {
    font-size: 22px;
  }
  .contract-table-wrap {
    min-height: 280px;
  }
  .contract-main-table {
    min-width: 960px;
  }
  .contract-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
