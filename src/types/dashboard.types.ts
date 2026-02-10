// KPI data — matches backend response
export interface KpiValue {
  current: number
  previous: number
  change: number
  sparkline: number[]
}

export interface DashboardKPIs {
  mrr: KpiValue
  active_paid_stores: KpiValue
  gmv: KpiValue
  churn_rate: KpiValue
  arpu: KpiValue
  nrr: KpiValue
}

// MRR Evolution — backend returns array directly
export interface MrrEvolutionMonth {
  month: string
  large: number
  medium: number
  small: number
  micro: number
  total: number
}

// Churn vs New — backend uses 'new' and 'churned'
export interface ChurnVsNewMonth {
  month: string
  new: number
  churned: number
  net: number
}

// GMV Monthly
export interface GmvMonth {
  month: string
  gmv: number
  orders: number
}

// Plan Distribution — backend returns { current: [...] }
export interface PlanSegment {
  plan: string
  count: number
  mrr: number
}

// Activity Table — matches backend response
export interface StoreActivity {
  id: number
  name: string
  slug: string
  plan: string
  current_month_sales: number
  prev_month_sales: number
  change_percent: number
  current_month_orders: number
  last_order: string | null
  plan_expires_at: string | null
  health_score: number
  classification: string
}
