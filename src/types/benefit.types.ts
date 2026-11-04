export type BenefitKind = 'partner' | 'own_app'
export type BenefitSlot = 'sidebar' | 'dashboard' | 'orders' | 'products' | 'customers'
export type BenefitUsageKey = 'pos' | 'kiosk'
export type BenefitScope = 'global' | 'stores'

export interface BenefitStoreRef {
  id: number
  nombre: string | null
}

export interface Benefit {
  id: number
  kind: BenefitKind
  partner_name: string
  title: string
  body: string
  image_url: string | null
  promo_code: string | null
  cta_label: string
  cta_url: string
  slots: BenefitSlot[]
  hide_if_uses: BenefitUsageKey | null
  weight: number
  target_scope: BenefitScope
  tiendas: BenefitStoreRef[]
  tienda_ids: number[]
  published_at: string
  expires_at: string | null
  activo: boolean
  clicks_30d?: number
}

export interface BenefitFormInput {
  kind: BenefitKind
  partner_name: string
  title: string
  body: string
  image_url: string | null
  promo_code: string | null
  cta_label: string
  cta_url: string
  slots: BenefitSlot[]
  hide_if_uses: BenefitUsageKey | null
  weight: number
  target_scope: BenefitScope
  tienda_ids: number[]
  published_at: string
  expires_at: string | null
  activo: boolean
}

export const BENEFIT_SLOT_LABELS: Record<BenefitSlot, string> = {
  sidebar: 'Menú lateral (todas las pantallas)',
  dashboard: 'Inicio',
  orders: 'Pedidos',
  products: 'Productos',
  customers: 'Clientes'
}

/** Igual que PlatformBenefitPayload::TEXT_LIMITS en la API. */
export const BENEFIT_TEXT_LIMITS = {
  partner_name: 40,
  title: 60,
  body: 140,
  cta_label: 25,
  promo_code: 30
} as const

export const BENEFIT_USAGE_LABELS: Record<BenefitUsageKey, string> = {
  pos: 'Ya vende con el POS',
  kiosk: 'Ya tiene un kiosco'
}
