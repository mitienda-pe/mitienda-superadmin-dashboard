import api from './axios'

export type UserActivationEstado = 'activado' | 'pendiente' | 'expirado' | 'sin_invitacion'

export interface AdminUserItem {
  usuario_id: number
  tienda_id: number
  nombre: string
  email: string
  rol: string
  tienda: string
  slug: string
  plan: string | null
  creado: string
  ultimo_ingreso: string | null
  estado: UserActivationEstado
}

export interface AdminUsersMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface AdminUsersFilters {
  search: string
  status: string // all | activado | pendiente | expirado
  page: number
  per_page: number
}

export async function getAdminUsers(filters: Partial<AdminUsersFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<{ success: boolean; data: AdminUserItem[]; meta: AdminUsersMeta }>(
    '/superadmin/dashboard/users',
    { params }
  )
  return res.data
}

export async function resendActivation(userId: number, tiendaId?: number) {
  const res = await api.post<{ success: boolean; message: string; email_sent: boolean }>(
    `/superadmin/dashboard/users/${userId}/resend-activation`,
    tiendaId ? { tienda_id: tiendaId } : {}
  )
  return res.data
}
