export interface McpToken {
  id: number
  superadmin_id: number
  token_prefix: string
  label: string
  permissions: Record<string, unknown> | null
  is_active: number
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface McpTokenCreateResponse {
  token: string
  id: number
  label: string
  token_prefix: string
  created_at: string
}
