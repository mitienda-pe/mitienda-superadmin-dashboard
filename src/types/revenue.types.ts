// Phase 3: Revenue Intelligence types

export interface MrrBreakdownMonth {
  month: string
  new_mrr: number
  churned_mrr: number
  expansion_mrr: number
  net_new_mrr: number
  total_mrr: number
}

export interface CohortData {
  month: string
  size: number
  retention: number[] // percentage retained at each month offset
}

export interface LtvByPlan {
  plan: string
  stores: number
  arpu: number
  avg_lifetime_months: number
  ltv: number
  mrr: number
}

export interface ChurnByPlanMonth {
  month: string
  large_start: number
  large_churned: number
  large_rate: number
  medium_start: number
  medium_churned: number
  medium_rate: number
  small_start: number
  small_churned: number
  small_rate: number
  micro_start: number
  micro_churned: number
  micro_rate: number
}

export interface GmvTopStore {
  id: number
  name: string
  gmv: number
  orders: number
  percentage: number
}

export interface GmvAnalysis {
  total_gmv: number
  total_orders: number
  top_stores: GmvTopStore[]
  top10_concentration: number
}

// Phase 3: Alerts types

export interface AlertStore {
  id: number
  name: string
  slug: string
  plan: string
}

export interface Alert {
  store: AlertStore
  type: 'sales_drop' | 'no_orders' | 'expiring_at_risk' | 'expiring_soon' | 'stagnant_sales' | 'low_catalog'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  detail: string
}

export interface AlertsSummary {
  critical: number
  high: number
  medium: number
  low: number
}

export interface AlertsResponse {
  summary: AlertsSummary
  total: number
  alerts: Alert[]
}

// Phase 4: Investor types

export interface InvestorMrrPoint {
  month: string
  mrr: number
}

export interface InvestorStoresPoint {
  month: string
  stores: number
}

export interface InvestorKpis {
  mrr: number
  arr: number
  active_paid_stores: number
  arpu: number
  nrr: number
  gross_churn: number
  ltv: number
  gmv_annual: number
  gmv_growth_yoy: number
  mrr_evolution: InvestorMrrPoint[]
  stores_trend: InvestorStoresPoint[]
}
