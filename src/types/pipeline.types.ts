// Pipeline & Trial Intelligence types

export type PipelineStage =
  | 'new_signup'
  | 'exploring'
  | 'building'
  | 'ready_to_sell'
  | 'first_sale'
  | 'activated'
  | 'stalled'
  | 'expired'
  | 'converted'

export interface PipelineLead {
  id: number
  name: string
  slug: string
  email: string
  whatsapp: string | null
  owner_name: string | null
  owner_email: string | null
  trial_start: string
  trial_end: string
  days_remaining: number
  readiness_score: number
  pipeline_stage: PipelineStage
  published_product_count: number
  has_gateway: number
  paid_orders: number
  total_revenue: number
  has_logo: number
  has_shipping_config: number
  has_custom_domain: number
  assigned_to: number | null
  tags: string[]
  metrics_calculated_at: string
}

export interface PipelineNote {
  id: number
  user_name: string
  content: string
  note_type: 'nota' | 'llamada' | 'whatsapp' | 'email' | 'reunion' | 'otro'
  created_at: string
}

export interface PipelineStageHistory {
  id: number
  from_stage: string | null
  to_stage: string
  changed_by: 'system' | 'manual'
  reason: string | null
  created_at: string
}

export interface PipelineFollowUp {
  id: number
  user_name: string
  due_date: string
  description: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface PipelineLeadDetail extends PipelineLead {
  owner_phone: string | null
  store_created_at: string
  product_count: number
  total_orders: number
  gateway_names: string[]
  stage_changed_at: string | null
  stage_changed_by: 'system' | 'manual'
  notes: PipelineNote[]
  stage_history: PipelineStageHistory[]
  follow_ups: PipelineFollowUp[]
}

export interface PipelineListMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface PipelineLeadFilters {
  search: string
  stage: PipelineStage | ''
  score_min: number | null
  score_max: number | null
  sort: string
  order: 'ASC' | 'DESC'
  page: number
  per_page: number
}

export const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string; icon: string }[] = [
  { value: 'new_signup', label: 'Nuevo', color: '#6366f1', icon: 'pi pi-star' },
  { value: 'exploring', label: 'Explorando', color: '#8b5cf6', icon: 'pi pi-search' },
  { value: 'building', label: 'Construyendo', color: '#3b82f6', icon: 'pi pi-wrench' },
  { value: 'ready_to_sell', label: 'Listo p/ vender', color: '#f59e0b', icon: 'pi pi-check-circle' },
  { value: 'first_sale', label: 'Primera venta', color: '#10b981', icon: 'pi pi-shopping-cart' },
  { value: 'activated', label: 'Activado', color: '#059669', icon: 'pi pi-bolt' },
  { value: 'stalled', label: 'Estancado', color: '#ef4444', icon: 'pi pi-pause' },
  { value: 'expired', label: 'Expirado', color: '#6b7280', icon: 'pi pi-times-circle' },
  { value: 'converted', label: 'Convertido', color: '#16a34a', icon: 'pi pi-trophy' },
]
