export type BroadcastPlacement = 'bar' | 'modal'
export type BroadcastSeverity = 'info' | 'warning' | 'danger'
export type BroadcastStatusFilter = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive'
export type BroadcastScope = 'all' | 'global' | 'tenant'
export type BroadcastPlanSlug = 'micro' | 'small' | 'medium' | 'large' | 'trial'
export type BroadcastTargetStatus = 'all' | 'active' | 'expired'
export type BroadcastTargetScope = 'global' | 'stores'

export interface BroadcastStoreRef {
  id: number
  nombre: string | null
}

export interface BroadcastStoresResolution {
  found: BroadcastStoreRef[]
  missing: number[]
}

export const BROADCAST_PLAN_LABELS: Record<BroadcastPlanSlug, string> = {
  micro: 'Micro',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  trial: 'Prueba gratis'
}

export const BROADCAST_TARGET_STATUS_LABELS: Record<BroadcastTargetStatus, string> = {
  all: 'Todos',
  active: 'Activos',
  expired: 'Vencidos'
}

export interface Broadcast {
  id: number
  target_scope: BroadcastTargetScope
  tienda_ids: number[]
  tiendas: BroadcastStoreRef[]
  target_plans: BroadcastPlanSlug[] | null
  target_status: BroadcastTargetStatus
  title: string
  body: string
  placement: BroadcastPlacement
  severity: BroadcastSeverity
  is_dismissible: boolean | 0 | 1
  dismiss_delay_seconds: number | null
  reshow_after_minutes: number | null
  cta_label: string | null
  cta_url: string | null
  image_url: string | null
  published_at: string
  expires_at: string
  created_by_superadmin_id: number | null
  activo: boolean | 0 | 1
  created_at: string | null
  updated_at: string | null
  dismissals_count?: number
}

export interface BroadcastFormInput {
  target_scope: BroadcastTargetScope
  tienda_ids: number[]
  target_plans: BroadcastPlanSlug[] | null
  target_status: BroadcastTargetStatus
  title: string
  body: string
  placement: BroadcastPlacement
  severity: BroadcastSeverity
  is_dismissible: boolean
  /** Segundos a la vista antes de poder cerrarlo. null = de inmediato. */
  dismiss_delay_seconds: number | null
  /** Tras cerrarlo, reaparece a los N minutos. null = no vuelve; 0 = en la siguiente pantalla. */
  reshow_after_minutes: number | null
  cta_label: string | null
  cta_url: string | null
  image_url: string | null
  published_at: string
  expires_at: string
  activo: boolean
}

export interface BroadcastListFilters {
  scope?: BroadcastScope
  tienda_id?: number | null
  status?: BroadcastStatusFilter
  placement?: BroadcastPlacement
  severity?: BroadcastSeverity
  target_plan?: BroadcastPlanSlug | null
  target_status?: 'active' | 'expired' | null
}
