import api from './axios'
import type { Broadcast, BroadcastFormInput, BroadcastListFilters } from '@/types/broadcast.types'

type ApiList = { success: boolean; data: Broadcast[] }
type ApiItem = { success: boolean; data: Broadcast; message?: string }
type ApiMsg = { success: boolean; message?: string }

export async function listBroadcasts(filters: BroadcastListFilters = {}) {
  const params: Record<string, string | number> = {}
  if (filters.scope && filters.scope !== 'all') params.scope = filters.scope
  if (filters.tienda_id) params.tienda_id = filters.tienda_id
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.placement) params.placement = filters.placement
  if (filters.severity) params.severity = filters.severity

  const res = await api.get<ApiList>('/superadmin/broadcasts', { params })
  return res.data
}

export async function getBroadcast(id: number) {
  const res = await api.get<ApiItem>(`/superadmin/broadcasts/${id}`)
  return res.data
}

export async function createBroadcast(payload: BroadcastFormInput) {
  const res = await api.post<ApiItem>('/superadmin/broadcasts', payload)
  return res.data
}

export async function updateBroadcast(id: number, payload: BroadcastFormInput) {
  const res = await api.put<ApiItem>(`/superadmin/broadcasts/${id}`, payload)
  return res.data
}

export async function deleteBroadcast(id: number) {
  const res = await api.delete<ApiMsg>(`/superadmin/broadcasts/${id}`)
  return res.data
}

export async function resetBroadcastDismissals(id: number) {
  const res = await api.post<{
    success: boolean
    data: { dismissals_cleared: number }
    message: string
  }>(`/superadmin/broadcasts/${id}/reset-dismissals`)
  return res.data
}
