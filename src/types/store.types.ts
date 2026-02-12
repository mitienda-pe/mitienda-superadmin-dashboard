// Phase 2: Store listing + detail types

export type StoreFlag = 'internal' | 'corporate' | null
export type StoreStatus = 'vigente' | 'vencido'

export interface StoreListItem {
  id: number
  name: string
  slug: string
  domain: string | null
  logo: string | null
  created_at: string
  flag: StoreFlag
  status: StoreStatus
  seniority_months: number
  owner_name: string | null
  owner_email: string | null
  plan: string
  plan_category: 'large' | 'medium' | 'small' | 'micro'
  plan_price: number
  plan_period: string
  plan_expires_at: string | null
  current_month_sales: number
  prev_month_sales: number
  change_percent: number
  current_month_orders: number
  prev_month_orders: number
  last_order: string | null
  product_count: number
  health_score: number
  classification: 'healthy' | 'observation' | 'at_risk' | 'critical'
}

export interface StoreListMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface StoreListFilters {
  search: string
  plan: string
  classification: string
  status: string
  flag: string
  sort: string
  order: 'ASC' | 'DESC'
  page: number
  per_page: number
}

export interface StorePlan {
  name: string
  price: number
  mrr: number
  period: string
  started_at: string
  expires_at: string
  days_remaining: number
  plan_id: number
  max_items: number
  max_pages: number
  payment_note: string
}

export interface StoreConfig {
  flag: StoreFlag
  blocked: boolean
  is_test: boolean
  ssl_enabled: boolean
  domain: string | null
  domain_verified: boolean
  marketplace: boolean
  directory: boolean
  group_id: number
  fb_integration: boolean
  payment_alert: boolean
}

export type StoreConfigUpdate = Partial<StoreConfig>

export interface StorePlanConfigUpdate {
  expires_at?: string
  price?: number
  max_items?: number
  max_pages?: number
  payment_note?: string
}

export interface StoreSales {
  current_month: number
  prev_month: number
  change_percent: number
  current_month_orders: number
  prev_month_orders: number
  last_order: string | null
  lifetime_total: number
  lifetime_orders: number
}

export interface StoreDetail {
  id: number
  name: string
  slug: string
  logo: string | null
  url: string
  email: string | null
  phone: string | null
  ruc: string | null
  razon_social: string | null
  created_at: string
  owner_name: string | null
  owner_email: string | null
  config: StoreConfig
  plan: StorePlan | null
  sales: StoreSales
  product_count: number
  health_score: number
  classification: 'healthy' | 'observation' | 'at_risk' | 'critical'
}

export interface DailySales {
  date: string
  sales: number
  orders: number
}

export interface StoreOrder {
  id: number
  order_number: string | null
  reference_code: string | null
  date: string
  total: number
  paid: boolean
  status: string
  customer_name: string
  customer_email: string | null
  item_count: number
}

export interface SubscriptionHistory {
  id: number
  plan_name: string
  price: number
  mrr: number
  period: string
  started_at: string
  expires_at: string
  status: 'active' | 'expired' | 'inactive'
}

export interface TopProduct {
  name: string
  quantity_sold: number
  revenue: number
  order_count: number
}
