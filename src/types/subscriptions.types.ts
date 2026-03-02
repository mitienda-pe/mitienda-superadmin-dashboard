export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'grace_period'
  | 'scheduled_cancel'
  | 'canceled'

export type ChargeStatus = 'pending' | 'processing' | 'succeeded' | 'rejected' | 'error'

export type PaymentType = 'automatic' | 'manual'

export type ManualGateway =
  | 'manual_transfer'
  | 'manual_deposit'
  | 'manual_yape'
  | 'manual_plin'
  | 'manual_other'

export interface SubscriptionPlan {
  id: number
  legacy_plan_id: number | null
  slug: string
  name: string
  description: string | null
  max_products: number | null
  max_pages: number | null
  max_users: number | null
  trial_days: number
  is_published: boolean
  sort_order: number
  metadata: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionItem {
  id: number
  tienda_id: number
  tienda_nombre: string | null
  tienda_slug: string | null
  billing_customer_id: number
  billing_plan_id: number
  billing_plan_price_id: number
  billing_payment_method_id: number | null
  legacy_tiendaplan_id: number | null
  payment_type: PaymentType
  status: SubscriptionStatus
  trial_starts_at: string | null
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string
  cancel_at: string | null
  canceled_at: string | null
  cancellation_reason: string | null
  grace_period_ends_at: string | null
  next_charge_at: string | null
  last_charge_at: string | null
  failed_charge_count: number
  amount_centavos: number
  currency: string
  metadata: string | null
  created_at: string
  updated_at: string
  plan: SubscriptionPlan | null
  customer_email: string | null
  amount_display: string
}

export interface SubscriptionEvent {
  id: number
  billing_subscription_id: number
  event_type: string
  from_status: string | null
  to_status: string | null
  billing_charge_id: number | null
  actor_type: 'system' | 'admin' | 'customer'
  actor_id: number | null
  description: string | null
  metadata: string | null
  created_at: string
}

export interface ChargeItem {
  id: number
  billing_subscription_id: number
  billing_payment_method_id: number | null
  idempotency_key: string
  charge_type: 'initial' | 'renewal' | 'refund' | 'manual'
  amount_centavos: number
  currency: string
  status: ChargeStatus
  gateway: string
  gateway_payment_id: string | null
  gateway_status: string | null
  gateway_status_detail: string | null
  gateway_response: string | null
  manual_reference: string | null
  manual_notes: string | null
  confirmed_by: number | null
  attempt_number: number
  error_message: string | null
  charged_at: string | null
  created_at: string
  updated_at: string
  amount_display: string
}

export interface BillingCustomer {
  id: number
  tienda_id: number
  usuario_id: number | null
  gateway: string
  gateway_customer_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  document_type: string | null
  document_number: string | null
  phone: string | null
  metadata: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SubscriptionDetail extends SubscriptionItem {
  events: SubscriptionEvent[]
  charges: ChargeItem[]
  customer: BillingCustomer | null
  price: {
    id: number
    billing_plan_id: number
    interval_unit: string
    interval_count: number
    amount_centavos: number
    currency: string
    label: string | null
    is_published: boolean
    created_at: string
    updated_at: string
  } | null
  payment_method: {
    id: number
    brand: string
    last_four: string
    exp_month: number
    exp_year: number
  } | null
}

export interface SubscriptionFilters {
  status: string
  payment_type: string
  search: string
  page: number
  per_page: number
}

export interface SubscriptionMeta {
  page: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface RecordPaymentData {
  amount: number
  gateway: ManualGateway
  reference: string
  notes?: string
}

// Status display config
export interface StatusConfig {
  label: string
  color: string
  bg: string
  icon: string
}

export const SUBSCRIPTION_STATUS_CONFIG: Record<SubscriptionStatus, StatusConfig> = {
  trialing: { label: 'En Prueba', color: '#1d4ed8', bg: '#dbeafe', icon: 'pi pi-clock' },
  active: { label: 'Activo', color: '#047857', bg: '#d1fae5', icon: 'pi pi-check-circle' },
  past_due: { label: 'Vencido', color: '#c2410c', bg: '#ffedd5', icon: 'pi pi-exclamation-triangle' },
  grace_period: { label: 'Período de Gracia', color: '#a16207', bg: '#fef9c3', icon: 'pi pi-hourglass' },
  scheduled_cancel: { label: 'Cancelación Prog.', color: '#7c3aed', bg: '#f5f3ff', icon: 'pi pi-calendar-times' },
  canceled: { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', icon: 'pi pi-times-circle' },
}

export const CHARGE_STATUS_CONFIG: Record<ChargeStatus, StatusConfig> = {
  pending: { label: 'Pendiente', color: '#a16207', bg: '#fef9c3', icon: 'pi pi-clock' },
  processing: { label: 'Procesando', color: '#1d4ed8', bg: '#dbeafe', icon: 'pi pi-spin pi-spinner' },
  succeeded: { label: 'Exitoso', color: '#047857', bg: '#d1fae5', icon: 'pi pi-check-circle' },
  rejected: { label: 'Rechazado', color: '#dc2626', bg: '#fef2f2', icon: 'pi pi-times-circle' },
  error: { label: 'Error', color: '#dc2626', bg: '#fef2f2', icon: 'pi pi-exclamation-circle' },
}

export const GATEWAY_LABELS: Record<string, string> = {
  mercadopago: 'MercadoPago',
  manual_transfer: 'Transferencia',
  manual_deposit: 'Depósito',
  manual_yape: 'Yape',
  manual_plin: 'Plin',
  manual_other: 'Otro',
}
