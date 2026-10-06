// Tipo de recurrencia de una fuente de ingreso. Lo define el API
// (LedgerTagService::RECURRENCES); aca van los textos y el orden de presentacion.

/** Alcance del resumen: todo el negocio o una sola linea. */
export type IncomeScope = 'all' | 'b2c' | 'b2b'

export const INCOME_SCOPE_OPTIONS: { value: IncomeScope; label: string }[] = [
  { value: 'all', label: 'Combinado' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b', label: 'B2B' }
]

export type LedgerRecurrence = 'recurrente' | 'variable' | 'extraordinario'

export interface RecurrenceOption {
  value: LedgerRecurrence
  label: string
  hint: string
  /** Color fijo por tipo: el mismo en el resumen y en el reporte. */
  color: string
}

// El orden es el de apilado en los graficos: la base recurrente abajo.
export const RECURRENCE_OPTIONS: RecurrenceOption[] = [
  { value: 'recurrente', label: 'Recurrente', hint: 'Monto fijo contratado que se repite: suscripciones', color: '#00b2a6' },
  { value: 'variable', label: 'Variable', hint: 'Se repite, pero depende del uso: comisiones', color: '#3b82f6' },
  { value: 'extraordinario', label: 'Extraordinario', hint: 'Puntual: setup, desarrollo, dominios, capacitaciones', color: '#f59e0b' }
]

export const RECURRENCE_ORDER: string[] = RECURRENCE_OPTIONS.map(o => o.value)

export function recurrenceLabel(value: string | null | undefined): string {
  return RECURRENCE_OPTIONS.find(o => o.value === value)?.label ?? 'Sin clasificar'
}
