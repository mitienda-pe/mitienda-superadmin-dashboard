// Phase 2: Store listing + detail types

export type StoreFlag = 'internal' | 'corporate' | null
export type StoreStatus = 'vigente' | 'vencido'

/**
 * A qué servidor resuelve el hostname público de la tienda. Lo escribe el cron
 * `stores:check-migration` en la API; no se edita a mano.
 *
 * - `nuevo`: storefront Nuxt 3.
 * - `legacy`: storefront viejo (CI3 / Apache). Es lo que falta migrar.
 * - `nxdomain`: dominio propio que ya no resuelve. Cuenta como migrada — el
 *   comprador entra por el subdominio, que está en el server nuevo.
 * - `externo`: IP de terceros (CDN, proxy, hosting propio). Hay que mirarla.
 * - `null`: nunca chequeada.
 */
export type StorefrontDnsStatus = 'nuevo' | 'legacy' | 'nxdomain' | 'externo' | 'error' | null

export interface StorefrontStatus {
  status: StorefrontDnsStatus
  /** null cuando nunca se chequeó. */
  migrated: boolean | null
  ip: string | null
  checked_at: string | null
  legacy_orders_30d: number
  last_legacy_order: string | null
  /**
   * DNS ya en el server nuevo pero siguen entrando pedidos creados fuera de CI4:
   * cutover a medias. Mirar `last_legacy_order` antes de alarmarse — una tienda
   * recién migrada arrastra su cola de pedidos dentro de la ventana de 30 días.
   */
  mismatch: boolean
}

export interface StoreListItem {
  id: number
  name: string
  slug: string
  domain: string | null
  logo: string | null
  created_at: string
  flag: StoreFlag
  status: StoreStatus
  storefront: StorefrontStatus
  seniority_months: number
  owner_name: string | null
  owner_email: string | null
  plan: string
  plan_detail: string
  plan_category: 'large' | 'medium' | 'small' | 'micro'
  plan_price: number
  plan_period: string
  plan_period_qty: number
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
  plan_categories?: string[]
}

export interface StoreListFilters {
  search: string
  plan: string
  classification: string
  status: string
  flag: string
  /** migrado | pendiente | mismatch | sin_datos | nuevo | legacy | nxdomain | externo */
  storefront: string
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
  max_users: number
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
  umami_website_id: string | null
}

export type StoreConfigUpdate = Partial<StoreConfig> & { name?: string }

export interface StorePlanConfigUpdate {
  plan_id?: number
  expires_at?: string
  price?: number
  max_items?: number
  max_pages?: number
  max_users?: number
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

// Alta manual de tiendas (superadmin)

export interface AvailablePlanDetail {
  plandetalle_id: number
  precio: number
}

export interface AvailablePlan {
  plan_id: number
  plan_titulo: string
  plan_descripcion: string
  max_items: number
  max_pages: number
  max_users: number
  is_superadmin: boolean
  has_pos: boolean
  monthly: AvailablePlanDetail | null
  annual: AvailablePlanDetail | null
}

export interface CreateStorePayload {
  business_name: string
  admin_name: string
  email: string
  phone?: string
  ruc?: string
  razon_social?: string
  address?: string
  // Ubigeo opcional de la sucursal (solo necesario si despachará pedidos)
  ubigeo?: number
  dpto?: string
  prov?: string
  dist?: string
  country?: string
  plan_id: number
  // Add-on PDV sobre un plan e-commerce (1 caja, +S/30/mes o +S/300/año)
  include_pos?: boolean
  subscription_type: 'trial' | 'paid'
  billing_frequency: 'monthly' | 'annual'
  start_date: string
  end_date: string
}

export interface CreateStoreResult {
  store_id: number
  slug: string
  usuario_id: number
  email_sent: boolean
  attached_existing_user: boolean
}
