// Contabilidad de gestión: gastos de MiTienda (la empresa), no de un comercio.

export interface ExpenseCategory {
  id: number
  /** Agrupa en el estado de resultados: Planilla, Operación, Impuestos… */
  group_name: string
  name: string
  is_payroll: boolean
  is_active: boolean
}

export type PayeeKind = 'proveedor' | 'empleado'

export interface Payee {
  id: number
  kind: PayeeKind
  document: string
  name: string
  default_category_id: number | null
  default_category_name: string | null
  /** Empleado: lo que se le paga al mes; con esto se genera la planilla. */
  default_amount: number | null
  notes: string | null
  is_active: boolean
  expense_count: number
}

export interface PayeeInput {
  kind: PayeeKind
  name: string
  document?: string
  default_category_id?: number | null
  default_amount?: number | null
  notes?: string
  is_active?: boolean
}

export type ExpenseDocumentKind = 'factura' | 'boleta' | 'recibo_honorarios' | 'planilla' | 'sin_comprobante' | 'otro'
export type ExpensePaymentStatus = 'pendiente' | 'parcial' | 'pagado'
export type ExpensePaymentFilter = 'all' | 'open' | 'vencido' | 'pagado'

export interface Expense {
  id: number
  payee_id: number
  payee_name: string
  payee_kind: PayeeKind
  payee_document: string
  category_id: number
  category_name: string
  category_group: string
  document_kind: ExpenseDocumentKind
  document_number: string | null
  issue_date: string
  due_date: string | null
  /** AAAA-MM al que corresponde el gasto; puede no ser el mes de la fecha. */
  period: string
  currency: 'PEN' | 'USD'
  exchange_rate: number | null
  net: number
  tax: number
  total: number
  description: string | null
  business_line: string | null
  /** 1 vigente, 2 anulado. */
  status: number
  /** null si está anulado. */
  payment_status: ExpensePaymentStatus | null
  paid_amount: number
  balance: number
  is_overdue: boolean
  source: 'manual' | 'sire' | 'planilla'
}

export interface ExpenseInput {
  payee_id: number
  category_id: number
  issue_date: string
  total: number
  tax?: number
  document_kind?: ExpenseDocumentKind
  document_number?: string
  due_date?: string
  period?: string
  currency?: 'PEN' | 'USD'
  exchange_rate?: number
  description?: string
  business_line?: string
}

/** Importes en soles; lo que está en dólares va convertido con su tipo de cambio. */
export interface ExpenseSummary {
  expenses: number
  total: number
  net: number
  tax: number
  unpaid_count: number
  unpaid: number
  overdue_count: number
  overdue: number
  by_category: { group_name: string; name: string; expenses: number; net: number; total: number }[]
}

export interface ExpenseFilters {
  period: string
  category_id: number | null
  kind: PayeeKind | ''
  payment: ExpensePaymentFilter
  search: string
  page: number
}

export interface ExpensePayment {
  id: number
  paid_at: string
  amount: number
  method: string
  reference: string | null
  note: string | null
}

export interface ExpensePayments {
  expense: Expense
  payments: ExpensePayment[]
}
