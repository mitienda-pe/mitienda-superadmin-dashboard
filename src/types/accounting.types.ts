// Contabilidad de gestión: gastos de MiTienda (la empresa), no de un comercio.

export interface ExpenseCategory {
  id: number
  /** Agrupa en el estado de resultados: Planilla, Operación, Impuestos… */
  group_name: string
  name: string
  is_payroll: boolean
  is_active: boolean
  /** Bloque del estado de resultados donde cae. */
  statement_function: StatementFunction
}

export type StatementFunction = 'costo' | 'admin' | 'ventas' | 'financiero' | 'excluido'

export interface IncomeStatementRow {
  type: 'section' | 'group' | 'line' | 'subtotal' | 'total' | 'result'
  label: string
  /** Un valor por mes, en el orden de `periods`; vacío en los títulos. */
  values: number[]
  total: number | null
  note: string | null
}

export interface IncomeStatement {
  year: number
  periods: string[]
  rows: IncomeStatementRow[]
  coverage: {
    payroll_months: string[]
    expense_months: string[]
    unclassified: number
    untagged_income: number
  }
  /** Ventas y gastos directos por línea de negocio; lo común no se reparte. */
  by_line?: {
    lines: Array<{ key: string; name: string; revenue: number; direct: number; contribution: number }>
    common_costs: number
    result: number
    tagged_costs: number
  }
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
  /** Cómo aparece en el estado de cuenta, separado por comas: sus consumos se vuelven gasto solos. */
  match_terms: string
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
  match_terms?: string
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
  /** Mes del servicio (devengado) si no es el del comprobante. */
  service_period?: string | null
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
  /** Compra personal con factura a nombre de la empresa: no es un gasto de la empresa. */
  is_personal?: boolean
  source: 'manual' | 'sire' | 'planilla' | 'xml'
  /** Solo en un gasto anulado: por qué, cuándo y quién (null si fue una corrección del sistema). */
  void_reason?: string | null
  voided_at?: string | null
  voided_by_name?: string | null
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
  service_period?: string
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
  /** Compras personales del periodo (no son de la empresa): su IGV se excluye del SIRE. */
  personal?: { count: number; tax: number; total: number }
  by_category: { group_name: string; name: string; expenses: number; net: number; total: number }[]
}

export interface ExpenseFilters {
  period: string
  category_id: number | null
  kind: PayeeKind | ''
  payment: ExpensePaymentFilter
  search: string
  page: number
  /** Los anulados no salen si no se piden. */
  include_voided?: boolean
  /** 'personal': solo las compras personales (no son de la empresa). */
  status?: 'personal' | null
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
  /** Caja de efectivo: sin estado de cuenta, sus movimientos se anotan a mano; el saldo es la suma de ellos. */
  is_cash?: boolean
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
  /** Anotado a mano en una caja: se puede borrar mientras no esté conciliado. */
  manual?: boolean
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
  /** Lo que el archivo trae y no se carga (p. ej. ventas de Culqi en otra moneda). */
  warnings?: string[]
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
  /** El importe del movimiento es la detracción (12 % o 10 %) de este comprobante. */
  detraction_match?: boolean
  /** El RUC de quien depositó es el del cliente. */
  document_match?: boolean
  name_match: boolean
  number_match: boolean
  /** Este depósito confirma un cobro ya anotado (hoja de ingresos, a mano): no crea otro abono. */
  confirms_payment?: { paid_at: string; method: string | null; amount: number }
  /** Hallada con el buscador: factura en dólares en la cuenta de detracciones (soles). */
  foreign_detraction?: boolean
  /** El depósito en soles es la detracción de esta factura en dólares. */
  usd_detraction?: {
    usd: number
    pct: number
    implied_rate: number
    invoice_rate: number
    official_rate: number | null
    /** Con el TC oficial de la fecha de la factura sale exacto el depósito. */
    rate_match: boolean
  }
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
  description?: string | null
}

export type ReconcileInput =
  | { kind: 'cobro'; invoice_id: number; amount?: number }
  | { kind: 'pago'; expense_id: number; amount?: number }
  | { kind: 'pagos'; items: { expense_id: number; amount: number }[] }
  | { kind: 'gasto'; payee_id: number; category_id: number; document_kind?: string; tax?: number; period?: string; description?: string }
  | { kind: 'otro'; label: string; note?: string }
  | { kind: 'transferencia'; counterpart_id: number }
  | { kind: 'detraccion_usd'; invoice_id: number }
  /** Retiro del banco que fue a la caja (o depósito que salió de ella): crea el otro lado en la caja. */
  | { kind: 'caja'; cash_account_id: number }
  | { kind: 'cliente'; customer_document: string; invoice_ids: number[] }

/** Lo que un cliente tiene sin cobrar, de lo más antiguo a lo más nuevo. */
export interface CustomerOpenInvoices {
  customer_name: string
  customer_document: string
  invoices: {
    id: number
    number: string
    issue_date: string
    due_date: string | null
    total: number
    open_amount: number
    /** "Por confirmar": puede que ya esté cobrada y falte registrarlo. */
    unconfirmed: boolean
  }[]
}

// --- Planilla ---

export interface PayrollSettings {
  year: number
  /** Son los de un año anterior: falta confirmar los de este. */
  inherited: boolean
  uit: number
  minimum_wage: number
  /** Tasas como fracción: 0.09 es 9 %. */
  essalud_rate: number
  /** Sueldos por gratificación: 0.5 en pequeña empresa. */
  gratification_factor: number
  insurance_cap: number
  life_insurance: number
  /** Remuneraciones diarias de CTS y días de vacaciones por año: 15 y 15 en pequeña empresa. */
  cts_days: number
  vacation_days: number
}

export interface PensionFund {
  id: number
  name: string
  kind: 'afp' | 'onp' | 'ninguno'
  payee_name: string | null
  contribution_rate: number
  insurance_rate: number
  commission_rate: number
  is_active: boolean
}

export interface EmployeeSalary {
  id: number
  effective_from: string
  base_salary: number
  work_condition: number
  family_allowance: boolean
  note: string | null
}

export interface Employee {
  payee_id: number
  name: string
  document: string
  is_active: boolean
  position: string | null
  start_date: string | null
  end_date: string | null
  pension_fund_id: number | null
  pension_name: string | null
  cuspp: string | null
  /** Saldo inicial de vacaciones; sin él no hay saldo que mostrar. */
  vacation_opening_days: number | null
  vacation_opening_date: string | null
  vacation_taken: number
  vacation_balance: number | null
  /** Reparto de su costo en el estado de resultados; suman 100. */
  share_cost: number
  share_admin: number
  share_sales: number
  current_salary: EmployeeSalary | null
  salaries: EmployeeSalary[]
}

/** Cómo salió la retención de renta de quinta del mes. */
export interface IncomeTaxDetail {
  projected: number
  deduction: number
  annual_tax: number
  withheld: number
  divisor: number
  extra: number
  amount: number
}

export interface PayrollLine {
  id: number
  payee_id: number
  payee_name: string
  payee_document: string
  position: string | null
  pension_name: string | null
  days_worked: number
  has_family_allowance: boolean
  /** Lo pactado para el mes; `basic` y `work_condition` son lo pagado según los días. */
  base_salary: number
  work_condition_full: number
  basic: number
  family_allowance: number
  work_condition: number
  commissions: number
  bonus: number
  gratification: number
  gratification_bonus: number
  gratification_manual: boolean
  /** Depósito de CTS del mes: no es parte del neto. */
  cts: number
  cts_manual: boolean
  vacation_days: number
  vacation_pay: number
  /** Lo que se devenga en el mes por cada beneficio, se pague o no. */
  accrual_gratification: number
  accrual_cts: number
  accrual_vacation: number
  accruals: number
  /** Costo con los beneficios cuando se ganan, no cuando se pagan. */
  accrued_cost: number
  taxable: number
  gross: number
  onp: number
  afp_contribution: number
  afp_insurance: number
  afp_commission: number
  /** ONP o AFP: lo retenido para pensiones. */
  pension: number
  income_tax: number
  income_tax_manual: boolean
  income_tax_detail: IncomeTaxDetail | null
  advances: number
  other_deductions: number
  deductions: number
  net: number
  essalud: number
  life_insurance: number
  /** Bruto más aportes del empleador. */
  cost: number
  note: string | null
}

export interface PayrollLineInput {
  days_worked?: number
  base_salary?: number
  work_condition_full?: number
  has_family_allowance?: boolean
  commissions?: number
  bonus?: number
  /** null deja que el sistema la calcule (julio y diciembre). */
  gratification?: number | null
  gratification_bonus?: number
  /** null deja que el sistema la calcule (mayo y noviembre). */
  cts?: number | null
  vacation_days?: number
  advances?: number
  other_deductions?: number
  /** null vuelve al cálculo del sistema. */
  income_tax?: number | null
  note?: string
}

export interface PayrollExpense {
  id: number
  payee_name: string
  category_name: string
  description: string | null
  due_date: string | null
  total: number
  paid_amount: number
  payment_status: 'pendiente' | 'parcial' | 'pagado'
}

export interface Payroll {
  period: string
  settings: PayrollSettings
  payroll: { id: number; status: 'borrador' | 'cerrada'; with_expenses: boolean; closed_at: string | null } | null
  lines: PayrollLine[]
  totals: Record<string, number>
  /** Personal del mes que aún no está en la planilla; `problem` dice qué le falta. */
  pending: { payee_id: number; name: string; ready: boolean; problem: string | null }[]
  expenses: PayrollExpense[]
}

export interface PayrollPeriod {
  period: string
  status: 'borrador' | 'cerrada'
  with_expenses: boolean
  people: number
  gross: number
  net: number
  cost: number
}

// --- Flujo de caja ---

export interface CashAccount {
  id: number
  name: string
  currency: 'PEN' | 'USD'
  /** null = el banco no lo informa y nadie lo puso: no suma al saldo inicial. */
  balance: number | null
  balance_at: string | null
  balance_pen: number | null
}

export interface CashFlowLine {
  key: string
  section: 'in' | 'out'
  label: string
  /** Un importe por semana, sin signo. */
  values: number[]
  /** Sale de un promedio, no de un documento: se puede apagar. */
  estimated: boolean
  basis: string
  plan_item_id?: number
}

export interface CashPlanItem {
  id: number
  kind: 'ingreso' | 'egreso'
  name: string
  amount: number
  currency: 'PEN' | 'USD'
  frequency: 'unica' | 'mensual' | 'semanal'
  start_date: string
  end_date: string | null
  note: string | null
  is_active: boolean
}

export type CashPlanItemInput = Omit<CashPlanItem, 'id'>

export interface CashFlow {
  today: string
  weeks: { start: string; end: string }[]
  exchange_rate: number
  accounts: CashAccount[]
  lines: CashFlowLine[]
  notes: { kind: 'receivable' | 'payable'; amount: number; text: string }[]
  loans: LoanSummary[]
  plan_items: CashPlanItem[]
}

/** Un préstamo según su cronograma: da por pagada toda cuota ya vencida. */
export interface LoanSummary {
  id: number
  lender: string
  name: string
  currency: 'PEN' | 'USD'
  principal: number
  annual_rate: number | null
  installments: number
  paid_count: number
  /** Capital que falta devolver. */
  outstanding: number
  /** Todo lo que falta pagar, con intereses y seguro. */
  remaining: number
  next: { due_date: string; total: number } | null
  last_due: string | null
  /** Del año en curso: el capital no es gasto; el interés y el seguro sí. */
  year_principal: number
  year_interest: number
  year_insurance: number
}

// --- Beneficios adeudados ---

export type BenefitConcept = 'gratificacion' | 'cts' | 'vacaciones' | 'otro'

export interface BenefitDebtItem {
  /** Cada deuda es un gasto por pagar: sus pagos son los del gasto. */
  expense_id: number
  concept: BenefitConcept
  description: string
  due_date: string
  total: number
  paid: number
  balance: number
}

export interface BenefitDebts {
  people: { payee_id: number; name: string; owed: number; paid: number; balance: number; items: BenefitDebtItem[] }[]
  totals: { owed: number; paid: number; balance: number }
}

/** Arqueo de una caja: lo contado contra lo anotado. */
export interface CashCountResult {
  date: string
  system: number
  counted: number
  difference: number
  /** La diferencia, anotada como movimiento por conciliar (null si cuadró). */
  movement: BankMovement | null
}
