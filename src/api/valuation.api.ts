import api from './axios'
import type { CostMapEntry, Valuation, ValuationAssumptions, ValuationCurrency, ValuationScenarioRef } from '@/types/valuation.types'

const BASE = '/superadmin/valuation'

/** Valoración con los supuestos de un escenario guardado (sin id, el predeterminado). */
export async function getValuation(scenarioId: number | null, currency: ValuationCurrency, refresh = false) {
  const params: Record<string, string | number> = { currency }
  if (scenarioId !== null) params.scenario_id = scenarioId
  if (refresh) params.refresh = 1
  const res = await api.get<{ data: Valuation }>(BASE, { params })
  return res.data.data
}

/** Recalcula con supuestos sin guardar. */
export async function previewValuation(scenarioId: number | null, currency: ValuationCurrency, assumptions: ValuationAssumptions) {
  const res = await api.post<{ data: Valuation }>(`${BASE}/preview`, { scenario_id: scenarioId, currency, assumptions })
  return res.data.data
}

export async function saveValuationScenario(
  id: number | null,
  input: { name: string; assumptions: ValuationAssumptions; is_default?: boolean }
) {
  const res = id === null
    ? await api.post<{ message: string; data: ValuationScenarioRef }>(`${BASE}/scenarios`, input)
    : await api.put<{ message: string; data: ValuationScenarioRef }>(`${BASE}/scenarios/${id}`, input)
  return res.data
}

export async function deleteValuationScenario(id: number) {
  const res = await api.delete<{ message: string }>(`${BASE}/scenarios/${id}`)
  return res.data
}

export async function getValuationCostMap() {
  const res = await api.get<{ data: CostMapEntry[] }>(`${BASE}/cost-map`)
  return res.data.data
}

/** `null` devuelve la categoría a su rubro por defecto. */
export async function saveValuationCostMap(map: Record<number, string | null>) {
  const res = await api.put<{ message: string; data: CostMapEntry[] }>(`${BASE}/cost-map`, { map })
  return res.data
}
