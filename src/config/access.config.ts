// Qué parte del panel ve cada rol. El API es quien decide de verdad
// (App\Libraries\SuperAdminAccess); esto solo evita mostrar entradas que
// responderían 403.

export type PanelArea = 'platform' | 'finance'

/**
 * Rutas del área de finanzas: comprobantes, cobros, etiquetado, ingresos y
 * la contabilidad de gestión (gastos).
 * Todo lo demás es `platform`, que solo ve el equipo (Master).
 */
const FINANCE_PATHS = [
  '/billing/invoices', '/billing/ledger', '/billing/concepts', '/billing/tags', '/billing/income',
  '/accounting'
]

/** Dentro de finanzas pero solo para Master: los sueldos de cada persona. */
const MASTER_ONLY_PATHS = ['/accounting/payroll', '/accounting/results', '/accounting/cash-flow']

export function areaOfPath(path: string): PanelArea {
  if (MASTER_ONLY_PATHS.some(base => path === base || path.startsWith(`${base}/`))) return 'platform'
  return FINANCE_PATHS.some(base => path === base || path.startsWith(`${base}/`)) ? 'finance' : 'platform'
}

/** A dónde va cada quien al entrar: la primera pantalla que su rol puede ver. */
export function homePathFor(areas: string[]): string {
  if (areas.includes('platform')) return '/dashboard'
  if (areas.includes('finance')) return '/billing/invoices'
  return '/access-denied'
}
