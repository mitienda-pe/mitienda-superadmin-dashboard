export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  user: User
  store_id?: number
}

export interface User {
  id: number
  name: string
  email: string
  role?: string
  avatar?: string
  created_at?: string | null
}

export interface Store {
  id: number
  name: string
  slug: string
  logo?: string
  url?: string
  plan: string
  status: string
}

export interface SuperAdminInfo {
  /** Solo el equipo (Master). Un rol acotado no lo es: ver `areas`. */
  is_superadmin: boolean
  role?: 'master' | 'contabilidad' | 'contabilidad_lectura' | null
  /** Partes del panel que puede ver: 'platform' (todo) y/o 'finance'. */
  areas?: string[]
  finance_write?: boolean
  superadmin_type_id?: number
  superadmin_type_name?: string
  partner_id?: number
  partner_name?: string
}
