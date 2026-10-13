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

/** `nota_credito` solo llega por importación del SIRE, con importes negativos. */
export type ExpenseDocumentKind =
  | 'factura' | 'boleta' | 'recibo_honorarios' | 'planilla' | 'sin_comprobante' | 'otro' | 'nota_credito'
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
  source: 'manual' | 'sire' | 'planilla' | 'xml'
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

/** Resultado de importar (o previsualizar) el registro de compras del SIRE. */
export interface SireImportResult {
  executed: boolean
  read: number
  created: number
  duplicates: number
  new_payees: number
  new_payee_names: string[]
  /** Entran en "Por clasificar": el SIRE no dice para qué fue la compra. */
  unclassified: number
  /** Cargos de banco y notas de crédito: entran como ya pagados. */
  settled: number
  total_pen: number
  by_month: Record<string, number>
  skipped: { id: string; reason: string }[]
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

// --- Bancos ---

export interface BankAccount {
  id: number
  bank: string
  name: string
  number: string
  cci: string
  currency: 'PEN' | 'USD'
  /** Último saldo que informó el banco en un archivo importado. */
  balance: number | null
  balance_at: string | null
  is_active: boolean
  movements: number
  /** Movimientos sin conciliar del todo. */
  pending: number
  first_date: string | null
  last_date: string | null
}

export interface BankMovementLink {
  id: number
  kind: 'cobro' | 'pago' | 'otro'
  amount: number
  label: string | null
  /** Texto ya armado: "Cobro de F003-1916 · Cliente". */
  text: string
  note: string | null
  invoice_id: number | null
  expense_id: number | null
}

export interface BankMovement {
  id: number
  account_id: number
  account_name: string
  bank: string
  currency: 'PEN' | 'USD'
  op_date: string
  description: string
  /** Ingreso positivo, salida negativa. */
  amount: number
  itf: number
  reference: string | null
  status: 'pendiente' | 'parcial' | 'conciliado'
  /** Lo que falta conciliar, sin signo. */
  remaining: number
  links: BankMovementLink[]
}

export interface BankMovementFilters {
  account_id: number | null
  period: string
  status: 'all' | 'pending' | 'done'
  direction: '' | 'in' | 'out'
  search: string
  page: number
}

export interface BankMovementSummary {
  movements: number
  pending: number
  inflow: number
  outflow: number
  itf: number
}

export interface BankImportResult {
  executed: boolean
  bank: string
  account_number: string | null
  currency: 'PEN' | 'USD'
  balance: number | null
  account_id: number | null
  account_name: string | null
  will_create_account: boolean
  /** El archivo no dice de qué cuenta es: hay que elegirla. */
  needs_account: boolean
  read: number
  created: number
  duplicates: number
  /** Entraron ya conciliados porque el archivo dice qué son (abonos de Culqi al banco). */
  auto_marked?: number
  from: string | null
  to: string | null
  inflow: number
  outflow: number
}

export interface InvoiceSuggestion {
  id: number
  number: string
  issue_date: string
  customer_name: string
  customer_document: string
  total: number
  open_amount: number
  currency: string
  same_amount: boolean
  net_of_detraction: boolean
  name_match: boolean
  number_match: boolean
}

export interface ExpenseSuggestion {
  id: number
  payee_name: string
  payee_kind: PayeeKind
  category_name: string
  document_number: string | null
  issue_date: string
  period: string
  total: number
  open_amount: number
  currency: string
  same_amount: boolean
  name_match: boolean
}

export type ReconcileInput =
  | { kind: 'cobro'; invoice_id: number; amount?: number }
  | { kind: 'pago'; expense_id: number; amount?: number }
  | { kind: 'gasto'; payee_id: number; category_id: number; document_kind?: string; tax?: number; period?: string; description?: string }
  | { kind: 'otro'; label: string; note?: string }
