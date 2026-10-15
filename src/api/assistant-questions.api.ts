import api from './axios'

/**
 * Lo que los comerciantes le preguntan al asistente del panel ("Preguntar").
 *
 * Solo la pregunta, la pantalla, las herramientas que usó y cómo terminó: la
 * respuesta no se guarda porque trae datos privados de la tienda.
 */

export type AssistantTurnResult = 'resuelto' | 'derivado' | 'error'
export type AssistantFeedbackFilter = 'up' | 'down' | 'none' | 'any'

export interface AssistantTurn {
  id: number
  turno_id: string
  tienda_id: number
  tienda_nombre: string | null
  user_id: number | null
  impersonando: boolean
  session_id: string | null
  pantalla: string | null
  /** null si el voto llegó y el registro del turno no. */
  pregunta: string | null
  herramientas: string[]
  resultado: AssistantTurnResult | null
  duracion_ms: number | null
  feedback: 1 | -1 | null
  feedback_at: string | null
  created_at: string
}

export interface AssistantTurnFilters {
  desde?: string
  hasta?: string
  tienda_id?: number | null
  pantalla?: string | null
  resultado?: AssistantTurnResult | null
  feedback?: AssistantFeedbackFilter | null
  impersonando?: '0' | '1' | null
  page?: number
  limit?: number
}

export interface AssistantTurnsSummary {
  turnos: number
  tiendas: number
  duracion_promedio_ms: number | null
  feedback: {
    up: number
    down: number
    votos: number
    tasa_positiva: number | null
    tasa_voto: number | null
  }
  por_resultado: Array<{ resultado: AssistantTurnResult | null; total: number }>
  por_pantalla: Array<{ pantalla: string | null; total: number; derivados: number; up: number; down: number }>
  top_preguntas: Array<{ pregunta: string; total: number; tiendas: number; down: number }>
}

export interface AssistantTurnsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

type ApiList = {
  success: boolean
  data: AssistantTurn[]
  pagination: AssistantTurnsPagination
  retencion_dias: number
}
type ApiSummary = { success: boolean; data: AssistantTurnsSummary; retencion_dias: number }

function toParams(filters: AssistantTurnFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') params[key] = value as string | number
  }
  return params
}

export async function listAssistantTurns(filters: AssistantTurnFilters = {}) {
  const res = await api.get<ApiList>('/superadmin/assistant/merchant-turns', { params: toParams(filters) })
  return res.data
}

export async function getAssistantTurnsSummary(filters: AssistantTurnFilters = {}) {
  // El resumen usa los mismos filtros que el listado, sin la paginación.
  const params = toParams(filters)
  delete params.page
  delete params.limit
  const res = await api.get<ApiSummary>('/superadmin/assistant/merchant-turns/summary', { params })
  return res.data
}
