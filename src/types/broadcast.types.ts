export type BroadcastPlacement = 'bar' | 'modal'
export type BroadcastSeverity = 'info' | 'warning' | 'danger'
export type BroadcastStatusFilter = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive'
export type BroadcastScope = 'all' | 'global' | 'tenant'

export interface Broadcast {
  id: number
  tienda_id: number | null
  tienda_nombre?: string | null
  title: string
  body: string
  placement: BroadcastPlacement
  severity: BroadcastSeverity
  is_dismissible: boolean | 0 | 1
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
  tienda_id: number | null
  title: string
  body: string
  placement: BroadcastPlacement
  severity: BroadcastSeverity
  is_dismissible: boolean
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
}
