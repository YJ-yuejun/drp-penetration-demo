import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '全景监管驾驶舱' } },
      { path: 'investment', name: 'investment', component: () => import('@/views/penetrate/InvestmentView.vue'), meta: { title: '投资穿透' } },
      { path: 'property', name: 'property', component: () => import('@/views/penetrate/PropertyView.vue'), meta: { title: '产权穿透' } },
      { path: 'funds', name: 'funds', component: () => import('@/views/penetrate/FundsView.vue'), meta: { title: '资金穿透' } },
      { path: 'finance', name: 'finance', component: () => import('@/views/penetrate/FinanceView.vue'), meta: { title: '财务穿透' } },
      { path: 'contract', name: 'contract', component: () => import('@/views/penetrate/ContractView.vue'), meta: { title: '合同穿透' } },
      { path: 'procurement', name: 'procurement', component: () => import('@/views/penetrate/ProcurementView.vue'), meta: { title: '采购穿透' } },
      { path: 'salary', name: 'salary', component: () => import('@/views/penetrate/SalaryView.vue'), meta: { title: '薪酬穿透' } },
      { path: 'overseas', name: 'overseas', component: () => import('@/views/penetrate/OverseasView.vue'), meta: { title: '境外穿透' } },
      { path: 'banking', name: 'banking', component: () => import('@/views/penetrate/BankingView.vue'), meta: { title: '金融穿透' } },
      { path: 'accounting', name: 'accounting', component: () => import('@/views/penetrate/AccountingView.vue'), meta: { title: '会计穿透' } },
      { path: 'smart', name: 'smart', component: () => import('@/views/SmartPlatformView.vue'), meta: { title: '智能中台' } },
      { path: 'risk-center', name: 'risk-center', component: () => import('@/views/RiskCenterView.vue'), meta: { title: '风险预警中心' } },
      { path: 'work-orders', name: 'work-orders', component: () => import('@/views/WorkOrdersView.vue'), meta: { title: '核查工单' } },
      { path: 'rectification', name: 'rectification', component: () => import('@/views/RectificationView.vue'), meta: { title: '整改销号' } },
      { path: 'comparison', name: 'comparison', component: () => import('@/views/ComparisonView.vue'), meta: { title: '价值对比' } },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.afterEach((to) => {
  const base = 'DRP · 全域数字化资源管理平台'
  document.title = to.meta?.title ? `${to.meta.title} · DRP` : base
})

export default router
