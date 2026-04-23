import api from './axios'
import type {
  Complaint,
  ComplaintDetail,
  ComplaintListFilters,
  ComplaintPagination,
  ComplaintStats
} from '@/types/complaint.types'

type ApiList = {
  success: boolean
  data: Complaint[]
  pagination: ComplaintPagination
}
type ApiDetail = { success: boolean; data: ComplaintDetail; message?: string }
type ApiStats = { success: boolean; data: ComplaintStats }
type ApiMsg = { success: boolean; message?: string; data?: unknown }

export async function listComplaints(filters: ComplaintListFilters = {}) {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.type) params.type = filters.type
  if (filters.tienda_id) params.tienda_id = filters.tienda_id
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order

  const res = await api.get<ApiList>('/superadmin/complaints', { params })
  return res.data
}

export async function getComplaint(id: number) {
  const res = await api.get<ApiDetail>(`/superadmin/complaints/${id}`)
  return res.data
}

export async function getComplaintStats() {
  const res = await api.get<ApiStats>('/superadmin/complaints/stats')
  return res.data
}

export async function setComplaintSeen(id: number, seen: boolean) {
  const res = await api.put<ApiMsg>(`/superadmin/complaints/${id}/seen`, { seen })
  return res.data
}

export async function respondComplaint(id: number, response: string) {
  const res = await api.post<ApiMsg>(`/superadmin/complaints/${id}/respond`, { response })
  return res.data
}
