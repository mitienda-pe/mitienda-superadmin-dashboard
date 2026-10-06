import api from './axios'
import type {
  LedgerTagDimension, LedgerTagValue, LedgerItemFilters, LedgerItemsResponse, LedgerConcept, LedgerReport
} from '@/types/ledger.types'

const BASE = '/superadmin/platform-ledger'

export async function getLedgerDimensions() {
  const res = await api.get<{ data: LedgerTagDimension[] }>(`${BASE}/dimensions`)
  return res.data.data
}

export async function createLedgerDimension(payload: { name: string; description?: string; is_required?: boolean }) {
  const res = await api.post<{ data: LedgerTagDimension }>(`${BASE}/dimensions`, payload)
  return res.data.data
}

export async function updateLedgerDimension(
  id: number,
  payload: Partial<Pick<LedgerTagDimension, 'name' | 'description' | 'is_required' | 'is_active' | 'sort_order'>>
) {
  const res = await api.put<{ data: LedgerTagDimension }>(`${BASE}/dimensions/${id}`, payload)
  return res.data.data
}

export async function createLedgerValue(dimensionId: number, name: string) {
  const res = await api.post<{ data: LedgerTagValue }>(`${BASE}/dimensions/${dimensionId}/values`, { name })
  return res.data.data
}

export async function updateLedgerValue(
  id: number,
  payload: Partial<Pick<LedgerTagValue, 'name' | 'is_active' | 'sort_order'>>
) {
  const res = await api.put<{ data: LedgerTagValue }>(`${BASE}/values/${id}`, payload)
  return res.data.data
}

/** Responde 409 si alguna linea usa el valor: en ese caso se desactiva. */
export async function deleteLedgerValue(id: number) {
  await api.delete(`${BASE}/values/${id}`)
}

export async function getLedgerItems(filters: Partial<LedgerItemFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.pending) params.pending = 1
  if (filters.period) params.period = filters.period
  if (filters.origin && filters.origin !== 'all') params.origin = filters.origin
  if (filters.value_id) params.value_id = filters.value_id
  if (filters.code !== null && filters.code !== undefined) params.code = filters.code
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<LedgerItemsResponse>(`${BASE}/items`, { params })
  return res.data
}

/**
 * `tags` es `dimension_id -> value_id`. Un `null` quita la etiqueta de esa
 * dimension; las dimensiones que no van en el objeto no se tocan.
 */
export async function assignLedgerTags(itemIds: number[], tags: Record<number, number | null>) {
  const res = await api.put<{ data: { affected: number } }>(`${BASE}/items/tags`, { item_ids: itemIds, tags })
  return res.data.data.affected
}

export async function getLedgerConcepts(filters: { pending?: boolean; search?: string } = {}) {
  const params: Record<string, string | number> = {}
  if (filters.pending) params.pending = 1
  if (filters.search) params.search = filters.search

  const res = await api.get<{ data: LedgerConcept[] }>(`${BASE}/concepts`, { params })
  return res.data.data
}

/**
 * Etiqueta todas las lineas de un codigo. Sin `overwrite` solo completa las que
 * no tienen esa dimension, asi las excepciones puestas a mano se conservan.
 */
export async function assignLedgerConceptTags(
  code: string,
  tags: Record<number, number | null>,
  overwrite = false
) {
  const res = await api.put<{ data: { affected: number } }>(`${BASE}/concepts/tags`, { code, tags, overwrite })
  return res.data.data.affected
}

/**
 * Ingresos facturados sin IGV, en soles, por fecha de emision. `valueIds`
 * filtra: la linea debe tener todos esos valores.
 */
export async function getLedgerReport(query: {
  from: string
  to: string
  group_by: string
  granularity: 'month' | 'year'
  valueIds?: number[]
}) {
  const params: Record<string, string> = {
    from: query.from,
    to: query.to,
    group_by: query.group_by,
    granularity: query.granularity
  }
  if (query.valueIds?.length) params.value_ids = query.valueIds.join(',')

  const res = await api.get<{ data: LedgerReport }>(`${BASE}/report`, { params })
  return res.data.data
}

/** Los errores de validacion de CI4 llegan en `messages.error`, no en `message`. */
export function ledgerErrorMessage(e: any): string {
  return e?.response?.data?.messages?.error || e?.response?.data?.message || e?.message || 'Error inesperado'
}
