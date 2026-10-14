// Qué parte del panel ve cada rol. El API es quien decide de verdad
// (App\Libraries\SuperAdminAccess); esto solo evita mostrar entradas que
// responderían 403.
//
//   master                → todo
//   desarrollo            → plataforma, emisión y cobros (no contabilidad)
//   ventas                → emisión, ver comprobantes y conciliar ingresos en Bancos
//   contabilidad          → cobros y contabilidad
//   contabilidad_lectura  → cobros y contabilidad, sin modificar
//   programa              → solo las tiendas del programa de su partner (Tu Empresa)

export type PanelArea = 'platform' | 'billing' | 'finance' | 'collections' | 'reconcile' | 'accounting' | 'programs'

export const ALL_AREAS: PanelArea[] = ['platform', 'billing', 'finance', 'collections', 'reconcile', 'accounting', 'programs']

/** Emitir: ventas de planes (y su renovación), comisiones, emisión manual. */
const BILLING_PATHS = ['/billing/emit', '/billing/plan-sales', '/billing/commission-period']

/** Lo emitido y lo cobrado: comprobantes, abonos, líneas, conceptos, etiquetas, ingresos. */
const FINANCE_PATHS = [
  '/billing/invoices', '/billing/commissions', '/billing/ledger', '/billing/concepts', '/billing/tags', '/billing/income'
]

/** Bancos: para conciliar ingresos alcanza con `reconcile` (dentro, se ve solo lo suyo). */
const RECONCILE_PATHS = ['/accounting/banks']

/** Contabilidad de la empresa: gastos, planilla, resultados, flujo de caja. */
const ACCOUNTING_PATHS = ['/accounting']

/** Programas de convenio (Tu Empresa) y sus tiendas inscritas. */
const PROGRAMS_PATHS = ['/programs']

function under(path: string, bases: string[]): boolean {
  return bases.some(base => path === base || path.startsWith(`${base}/`))
}

export function areaOfPath(path: string): PanelArea {
  if (under(path, BILLING_PATHS)) return 'billing'
  if (under(path, FINANCE_PATHS)) return 'finance'
  if (under(path, RECONCILE_PATHS)) return 'reconcile'
  if (under(path, ACCOUNTING_PATHS)) return 'accounting'
  if (under(path, PROGRAMS_PATHS)) return 'programs'
  return 'platform'
}

/** A dónde va cada quien al entrar: la primera pantalla que su rol puede ver. */
export function homePathFor(areas: string[]): string {
  if (areas.includes('platform')) return '/dashboard'
  if (areas.includes('billing')) return '/billing/plan-sales'
  if (areas.includes('finance')) return '/billing/invoices'
  if (areas.includes('accounting')) return '/accounting/expenses'
  if (areas.includes('reconcile')) return '/accounting/banks'
  if (areas.includes('programs')) return '/programs'
  return '/access-denied'
}
