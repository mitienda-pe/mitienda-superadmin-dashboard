export type LegacyStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9 | 12

export type LegacyComputedStatus = 'active' | 'trial' | 'expired' | 'inactive'

export interface LegacySubscriptionItem {
  id: number
  tienda_id: number
  tienda_nombre: string | null
  tienda_slug: string | null
  plan_titulo: string
  plandetalle_titulo: string | null
  precio: number
  mrr: number
  fecha_inicio: string
  fecha_final: string
  status: LegacyStatus
  computed_status: LegacyComputedStatus
  is_trial: boolean
  tipo_cargo: string | null
  periodo: string | null
  periodo_cantidad: number | null
  referencia: string | null
  metodo_pago: string | null
  correo_comprador: string | null
  nombre_comprador: string | null
  max_productos: number
  max_paginas: number
  max_usuarios: number
}

export interface LegacyFilters {
  status: string
  search: string
  plan: string
  page: number
  per_page: number
}

export interface LegacyMeta {
  page: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface LegacyStatusConfig {
  label: string
  color: string
  bg: string
}

export const LEGACY_STATUS_MAP: Record<number, LegacyStatusConfig> = {
  0: { label: 'Rechazado', color: '#dc2626', bg: '#fef2f2' },
  1: { label: 'Activo', color: '#047857', bg: '#d1fae5' },
  2: { label: 'Pendiente', color: '#a16207', bg: '#fef9c3' },
  3: { label: 'Vencido', color: '#c2410c', bg: '#ffedd5' },
  4: { label: 'Devuelto', color: '#6b7280', bg: '#f3f4f6' },
  5: { label: 'Obsequiado', color: '#7c3aed', bg: '#f5f3ff' },
  6: { label: 'Bloqueado', color: '#dc2626', bg: '#fef2f2' },
  7: { label: 'Prueba', color: '#1d4ed8', bg: '#dbeafe' },
  9: { label: 'Creado', color: '#6b7280', bg: '#f3f4f6' },
  12: { label: 'Expirado', color: '#c2410c', bg: '#ffedd5' },
}
