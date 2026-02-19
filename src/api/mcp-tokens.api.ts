import api from './axios'
import type { McpToken, McpTokenCreateResponse } from '@/types/mcp-token.types'

/**
 * List all MCP tokens for the current superadmin
 */
export async function getMcpTokens() {
  const res = await api.get<{ success: boolean; data: McpToken[] }>(
    '/superadmin/mcp/tokens'
  )
  return res.data
}

/**
 * Create a new MCP token
 */
export async function createMcpToken(label: string) {
  const res = await api.post<{ success: boolean; data: McpTokenCreateResponse; message: string }>(
    '/superadmin/mcp/tokens',
    { label }
  )
  return res.data
}

/**
 * Update a token's label
 */
export async function updateMcpToken(tokenId: number, data: { label?: string; expires_at?: string }) {
  const res = await api.put<{ success: boolean; message: string }>(
    `/superadmin/mcp/tokens/${tokenId}`,
    data
  )
  return res.data
}

/**
 * Revoke (soft-delete) a token
 */
export async function revokeMcpToken(tokenId: number) {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/superadmin/mcp/tokens/${tokenId}`
  )
  return res.data
}
