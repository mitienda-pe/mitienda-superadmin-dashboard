import api from './axios'

export type UserActivationEstado = 'activado' | 'pendiente' | 'expirado' | 'sin_invitacion'

export type StoreEstado = 'vigente' | 'vencido'

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
  estado_tienda: StoreEstado
}

export interface AdminUsersMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface AdminUsersFilters {
  search: string
  status: string // all | activado | pendiente | expirado | sin_invitacion
  store_status: string // all | vigente | vencido
  rol: string // all | principal | colaborador
  page: number
  per_page: number
}

export async function getAdminUsers(filters: Partial<AdminUsersFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.store_status && filters.store_status !== 'all') params.store_status = filters.store_status
  if (filters.rol && filters.rol !== 'all') params.rol = filters.rol
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
