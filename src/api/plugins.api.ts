import api from './axios'

export interface PluginCatalogEntry {
  plugin_id: number
  plugin_slug: string
  plugin_name: string
  plugin_description?: string | null
  plugin_version: string
  plugin_slots: string[] | null
  plugin_pricing_mode: 'none' | 'per_unit' | 'base_plus_addons'
  plugin_config_schema: Record<string, any> | null
  plugin_activo: number | boolean
  created_at?: string
  updated_at?: string
}

export interface PluginAssignment {
  assignment_id: number
  tienda_id: number
  plugin_id: number
  producto_id: number | null
  categoria_id: number | null
  assignment_config: Record<string, any> | null
  assignment_activo: number | boolean
  assigned_at?: string | null
  plugin_slug: string
  plugin_name: string
  plugin_slots: string[] | null
  plugin_pricing_mode: string
  plugin_version: string
  plugin_catalog_activo?: number | boolean
}

export interface AssignPluginPayload {
  tienda_id: number
  plugin_id: number
  producto_id?: number | null
  categoria_id?: number | null
  config?: Record<string, any> | null
  activo?: boolean
}

export interface UpdateAssignmentPayload {
  producto_id?: number | null
  categoria_id?: number | null
  config?: Record<string, any> | null
  activo?: boolean
}

type ApiList<T> = { error: number; data: T[] }
type ApiItem<T> = { error: number; data: T; message?: string }
type ApiMsg = { error: number; message?: string }

export async function listPluginCatalog() {
  const res = await api.get<ApiList<PluginCatalogEntry>>('/superadmin/plugins')
  return res.data
}

export async function createPlugin(payload: Partial<PluginCatalogEntry> & { slug: string; name: string; slots: string[] }) {
  const res = await api.post<ApiItem<PluginCatalogEntry>>('/superadmin/plugins', payload)
  return res.data
}

export async function updatePlugin(id: number, payload: Partial<PluginCatalogEntry>) {
  const res = await api.put<ApiItem<PluginCatalogEntry>>(`/superadmin/plugins/${id}`, payload)
  return res.data
}

export async function listAssignments(tiendaId: number) {
  const res = await api.get<ApiList<PluginAssignment>>('/superadmin/plugins/assignments', {
    params: { tienda_id: tiendaId },
  })
  return res.data
}

export async function assignPlugin(payload: AssignPluginPayload) {
  const res = await api.post<ApiItem<PluginAssignment>>('/superadmin/plugins/assign', payload)
  return res.data
}

export async function updateAssignment(id: number, payload: UpdateAssignmentPayload) {
  const res = await api.put<ApiItem<PluginAssignment>>(`/superadmin/plugins/assignments/${id}`, payload)
  return res.data
}

export async function removeAssignment(id: number) {
  const res = await api.delete<ApiMsg>(`/superadmin/plugins/assignments/${id}`)
  return res.data
}
