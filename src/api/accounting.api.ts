import api from './axios'
import type {
  Expense, ExpenseCategory, ExpenseFilters, ExpenseInput, ExpensePayments, ExpenseSummary, Payee, PayeeInput,
  SireImportResult, BankAccount, BankImportResult, BankMovement, BankMovementFilters, BankMovementSummary,
  InvoiceSuggestion, ExpenseSuggestion, ReconcileInput, CustomerOpenInvoices, BenefitConcept, BenefitDebts, CashAccount, CashFlow, CashPlanItem, CashPlanItemInput, IncomeStatement, StatementFunction, PayrollSettings, PensionFund, Employee, Payroll, PayrollLineInput,
  PayrollPeriod
} from '@/types/accounting.types'
import type { InvoiceInstallmentInput } from '@/types/ledger.types'

const BASE = '/superadmin/accounting'

// --- Categorías ---

export async function getExpenseCategories() {
  const res = await api.get<{ data: ExpenseCategory[] }>(`${BASE}/categories`)
  return res.data.data
}

export async function saveExpenseCategory(
  id: number | null,
  payload: { name: string; group_name: string; is_payroll?: boolean; is_active?: boolean; statement_function?: StatementFunction }
) {
  const res = id === null
    ? await api.post<{ data: ExpenseCategory[] }>(`${BASE}/categories`, payload)
    : await api.put<{ data: ExpenseCategory[] }>(`${BASE}/categories/${id}`, payload)
  return res.data.data
}

// --- Proveedores y personal ---

export async function getPayees(filters: { kind?: string; search?: string; includeInactive?: boolean } = {}) {
  const params: Record<string, string> = {}
  if (filters.kind) params.kind = filters.kind
  if (filters.search) params.search = filters.search
  if (filters.includeInactive) params.include_inactive = '1'

  const res = await api.get<{ data: Payee[] }>(`${BASE}/payees`, { params })
  return res.data.data
}

export async function savePayee(id: number | null, payload: PayeeInput) {
  const res = id === null
    ? await api.post<{ data: Payee }>(`${BASE}/payees`, payload)
    : await api.put<{ data: Payee }>(`${BASE}/payees/${id}`, payload)
  return res.data.data
}

// --- Gastos ---

function expenseParams(filters: ExpenseFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { payment: filters.payment, page: filters.page }
  if (filters.period) params.period = filters.period
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.kind) params.kind = filters.kind
  if (filters.search) params.search = filters.search
  if (filters.include_voided) params.include_voided = '1'
  if (filters.status) params.status = filters.status
  return params
}

/** Compras personales con factura a nombre de la empresa: dejan de ser gasto. */
export async function markPersonalExpenses(ids: number[], note: string) {
  const res = await api.post<{ message: string; data: { affected: number } }>(`${BASE}/expenses/personal`, { expense_ids: ids, note })
  return res.data
}

/** Deshace "compra personal": vuelve a ser un gasto de la empresa. */
export async function unmarkPersonalExpense(id: number) {
  const res = await api.post<{ message: string }>(`${BASE}/expenses/${id}/company`)
  return res.data
}

/** Baja en CSV (se abre en Excel) todos los gastos de esos filtros, sin paginar. */
export async function downloadExpensesCsv(filters: ExpenseFilters): Promise<void> {
  const { page: _page, ...params } = expenseParams(filters)
  const res = await api.get<Blob>(`${BASE}/expenses/export`, { params, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `gastos-${filters.period || 'todos'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function getExpenses(filters: ExpenseFilters) {
  const params = expenseParams(filters)

  const res = await api.get<{
    data: Expense[]
    summary: ExpenseSummary
    meta: { current_page: number; per_page: number; total: number; total_pages: number }
  }>(`${BASE}/expenses`, { params })
  return res.data
}

export async function saveExpense(id: number | null, payload: ExpenseInput) {
  const res = id === null
    ? await api.post<{ message: string; data: Expense }>(`${BASE}/expenses`, payload)
    : await api.put<{ message: string; data: Expense }>(`${BASE}/expenses/${id}`, payload)
  return res.data
}

export async function voidExpense(id: number, reason: string) {
  const res = await api.post<{ message: string; data: Expense }>(`${BASE}/expenses/${id}/void`, { reason })
  return res.data
}

/** Cambia la categoría de varios gastos; `businessLine` undefined no toca la línea. */
export async function classifyExpenses(expenseIds: number[], categoryId: number, businessLine?: string) {
  const payload: Record<string, unknown> = { expense_ids: expenseIds, category_id: categoryId }
  if (businessLine !== undefined) payload.business_line = businessLine

  const res = await api.put<{ message: string; data: { affected: number } }>(`${BASE}/expenses/classify`, payload)
  return res.data
}

/** Registro de compras del SIRE (CSV). Sin `execute` solo devuelve qué entraría. */
export async function importSire(file: File, execute: boolean) {
  const form = new FormData()
  form.append('file', file)
  if (execute) form.append('execute', '1')

  const res = await api.post<{ message: string; data: SireImportResult }>(`${BASE}/import-sire`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

// --- Pagos de un gasto ---

export async function getExpensePayments(expenseId: number) {
  const res = await api.get<{ data: ExpensePayments }>(`${BASE}/expenses/${expenseId}/payments`)
  return res.data.data
}

export async function addExpensePayment(expenseId: number, payload: InvoiceInstallmentInput) {
  const res = await api.post<{ message: string; data: ExpensePayments }>(`${BASE}/expenses/${expenseId}/payments`, payload)
  return res.data
}

export async function deleteExpensePayment(paymentId: number) {
  const res = await api.delete<{ message: string; data: ExpensePayments }>(`${BASE}/expense-payments/${paymentId}`)
  return res.data
}

// --- Bancos ---

export async function getBankAccounts() {
  const res = await api.get<{ data: BankAccount[]; meta: { other_labels: Record<string, string> } }>(`${BASE}/bank-accounts`)
  return res.data
}

export async function saveBankAccount(
  id: number | null,
  payload: { bank: string; name: string; number?: string; cci?: string; currency: 'PEN' | 'USD'; is_active?: boolean }
) {
  const res = id === null
    ? await api.post<{ data: BankAccount[] }>(`${BASE}/bank-accounts`, payload)
    : await api.put<{ data: BankAccount[] }>(`${BASE}/bank-accounts/${id}`, payload)
  return res.data.data
}

/** Excel de BBVA o BCP, CSV de Culqi o PDF de la tarjeta BBVA. Sin `execute` solo devuelve qué entraría. */
export async function importBankFile(file: File, accountId: number | null, execute: boolean, pdfPassword = '') {
  const form = new FormData()
  form.append('file', file)
  if (pdfPassword) form.append('pdf_password', pdfPassword)
  if (accountId) form.append('account_id', String(accountId))
  if (execute) form.append('execute', '1')

  const res = await api.post<{ message: string; data: BankImportResult }>(`${BASE}/bank-import`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function getBankMovements(filters: BankMovementFilters) {
  const params: Record<string, string | number> = { status: filters.status, page: filters.page }
  if (filters.account_id) params.account_id = filters.account_id
  if (filters.period) params.period = filters.period
  if (filters.direction) params.direction = filters.direction
  if (filters.search) params.search = filters.search

  const res = await api.get<{
    data: BankMovement[]
    summary: BankMovementSummary
    meta: { current_page: number; per_page: number; total: number; total_pages: number }
  }>(`${BASE}/bank-movements`, { params })
  return res.data
}

export async function getBankSuggestions(movementId: number) {
  const res = await api.get<{ data: { invoices: InvoiceSuggestion[]; expenses: ExpenseSuggestion[] } }>(
    `${BASE}/bank-movements/${movementId}/suggestions`
  )
  return res.data.data
}

/** Conciliar crea el abono del comprobante o el pago del gasto. */
export async function reconcileBankMovement(movementId: number, payload: ReconcileInput) {
  const res = await api.post<{ message: string; data: BankMovement }>(`${BASE}/bank-movements/${movementId}/reconcile`, payload)
  return res.data
}

/** El otro lado de una transferencia entre cuentas propias (con la comisión que se llevó el banco). */
export interface TransferCandidate {
  id: number
  account_name: string
  op_date: string
  description: string
  amount: number
  fee: number
  /** Moneda del otro lado si es distinta (cambio de moneda entre cuentas propias). */
  currency?: 'PEN' | 'USD'
  /** TC implícito (soles ÷ dólares) y el oficial del día. */
  fx?: { rate: number; official: number }
}

/** Gastos por pagar para juntar en un pago (proveedor, descripción o número). */
export async function searchBankExpenses(movementId: number, q: string) {
  const res = await api.get<{ data: ExpenseSuggestion[] }>(`${BASE}/bank-movements/${movementId}/expenses`, { params: { q } })
  return res.data.data
}

export async function getTransferCandidates(movementId: number) {
  const res = await api.get<{ data: TransferCandidate[] }>(`${BASE}/bank-movements/${movementId}/transfer-candidates`)
  return res.data.data
}

/** Todo lo que el cliente tiene sin cobrar en la moneda del movimiento. */
export async function getCustomerOpenInvoices(movementId: number, customerDocument: string) {
  const res = await api.post<{ data: CustomerOpenInvoices }>(`${BASE}/bank-movements/${movementId}/reconcile`, {
    kind: 'cliente',
    customer_document: customerDocument,
    preview: true
  })
  return res.data.data
}

export async function markBankMovements(movementIds: number[], label: string) {
  const res = await api.post<{ message: string; data: { affected: number } }>(`${BASE}/bank-movements/mark`, {
    movement_ids: movementIds,
    label
  })
  return res.data
}

/** Concilia lo que tiene prueba fuerte: cobros de Culqi por código y sus abonos al banco. */
export async function autoReconcileBanks() {
  const res = await api.post<{
    message: string
    data: { charges: number; charges_skipped: number; transfers: number; expenses: number; expenses_ambiguous: number }
  }>(
    `${BASE}/bank-auto-reconcile`
  )
  return res.data
}

/** Deshace esa parte y quita el abono o pago que había creado. */
export async function unlinkBankMovement(linkId: number) {
  const res = await api.delete<{ message: string; data: BankMovement }>(`${BASE}/bank-links/${linkId}`)
  return res.data
}

/** Estado de resultados por función, mes a mes (solo Master: reparte el costo de cada persona). */
export async function getIncomeStatement(year: number) {
  const res = await api.get<{ data: IncomeStatement }>(`${BASE}/income-statement`, { params: { year } })
  return res.data.data
}

// --- Flujo de caja (solo Master) ---

export async function getCashFlow() {
  const res = await api.get<{ data: CashFlow }>(`${BASE}/cash-flow`)
  return res.data.data
}

/** `balance: null` deja la cuenta sin saldo conocido. */
export async function setCashBalance(accountId: number, balance: number | null) {
  const res = await api.put<{ data: CashAccount[] }>(`${BASE}/cash-flow/balances/${accountId}`, { balance })
  return res.data.data
}

export async function saveCashPlanItem(id: number | null, payload: CashPlanItemInput) {
  const res = id === null
    ? await api.post<{ data: CashPlanItem[] }>(`${BASE}/cash-flow/plan`, payload)
    : await api.put<{ data: CashPlanItem[] }>(`${BASE}/cash-flow/plan/${id}`, payload)
  return res.data.data
}

export async function deleteCashPlanItem(id: number) {
  const res = await api.delete<{ data: CashPlanItem[] }>(`${BASE}/cash-flow/plan/${id}`)
  return res.data.data
}

// --- Beneficios adeudados (solo Master) ---

export async function getBenefitDebts() {
  const res = await api.get<{ data: BenefitDebts }>(`${BASE}/payroll/benefit-debts`)
  return res.data.data
}

export async function addBenefitDebt(payload: { payee_id: number; concept: BenefitConcept; due_date: string; amount: number; label?: string }) {
  const res = await api.post<{ message: string; data: BenefitDebts }>(`${BASE}/payroll/benefit-debts`, payload)
  return res.data
}

// --- Planilla (solo Master) ---

const PAYROLL = `${BASE}/payroll`

export async function getPayrollSettings(year: number) {
  const res = await api.get<{ data: { settings: PayrollSettings; funds: PensionFund[] } }>(`${PAYROLL}/settings`, { params: { year } })
  return res.data.data
}

export async function savePayrollSettings(year: number, payload: Omit<PayrollSettings, 'year' | 'inherited'>) {
  const res = await api.put<{ data: PayrollSettings }>(`${PAYROLL}/settings/${year}`, payload)
  return res.data.data
}

export async function savePensionFund(id: number | null, payload: Omit<PensionFund, 'id'>) {
  const res = id === null
    ? await api.post<{ data: PensionFund[] }>(`${PAYROLL}/funds`, payload)
    : await api.put<{ data: PensionFund[] }>(`${PAYROLL}/funds/${id}`, payload)
  return res.data.data
}

export async function getEmployees() {
  const res = await api.get<{ data: Employee[] }>(`${PAYROLL}/employees`)
  return res.data.data
}

export async function saveEmployee(
  payeeId: number,
  payload: {
    position: string
    start_date: string | null
    end_date: string | null
    pension_fund_id: number | null
    cuspp: string
    vacation_opening_date: string | null
    vacation_opening_days: number | null
    share_cost: number
    share_sales: number
  }
) {
  const res = await api.put<{ data: Employee }>(`${PAYROLL}/employees/${payeeId}`, payload)
  return res.data.data
}

/** Con una fecha de vigencia que ya existe, corrige ese sueldo. */
export async function saveEmployeeSalary(
  payeeId: number,
  payload: { effective_from: string; base_salary: number; work_condition: number; family_allowance: boolean; note: string }
) {
  const res = await api.post<{ data: Employee }>(`${PAYROLL}/employees/${payeeId}/salaries`, payload)
  return res.data.data
}

export async function deleteEmployeeSalary(salaryId: number) {
  const res = await api.delete<{ data: Employee }>(`${PAYROLL}/salaries/${salaryId}`)
  return res.data.data
}

export async function getPayrollPeriods(year: number) {
  const res = await api.get<{ data: PayrollPeriod[] }>(`${PAYROLL}/periods`, { params: { year } })
  return res.data.data
}

/** Lo que se digita en el PLAME Web del mes, por trabajador y código. */
export interface PlameConcept { code: string; name: string; group: 'ingreso' | 'aporte_trabajador' | 'aporte_empleador'; amount: number; confirm?: boolean }
export interface PlameWorker { document: string; name: string; days: number; hours: number; concepts: PlameConcept[]; net: number }
export interface PlameData { period: string; workers: PlameWorker[]; totals: PlameConcept[] }

export async function getPayrollPlame(period: string) {
  const res = await api.get<{ data: PlameData }>(`${PAYROLL}/periods/${period}/plame`)
  return res.data.data
}

export async function getPayroll(period: string) {
  const res = await api.get<{ data: Payroll }>(`${PAYROLL}/periods/${period}`)
  return res.data.data
}

/** Abre el mes o suma a quien falte. `refresh` relee las fichas; `with_expenses: false` lo carga como historial. */
export async function preparePayroll(period: string, options: { with_expenses?: boolean; refresh?: boolean } = {}) {
  const res = await api.post<{ message: string; data: Payroll }>(`${PAYROLL}/periods/${period}/prepare`, options)
  return res.data
}

export async function closePayroll(period: string) {
  const res = await api.post<{ message: string; data: Payroll }>(`${PAYROLL}/periods/${period}/close`)
  return res.data
}

export async function reopenPayroll(period: string) {
  const res = await api.post<{ message: string; data: Payroll }>(`${PAYROLL}/periods/${period}/reopen`)
  return res.data
}

export async function updatePayrollLine(lineId: number, payload: PayrollLineInput) {
  const res = await api.put<{ message: string; data: Payroll }>(`${PAYROLL}/lines/${lineId}`, payload)
  return res.data
}

export async function deletePayrollLine(lineId: number) {
  const res = await api.delete<{ message: string; data: Payroll }>(`${PAYROLL}/lines/${lineId}`)
  return res.data
}

/** La boleta de pago en PDF, como URL local para abrirla en otra pestaña. */
export async function getPayslipUrl(lineId: number) {
  const res = await api.get<Blob>(`${PAYROLL}/lines/${lineId}/payslip`, { responseType: 'blob' })
  return URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
}

export function accountingErrorMessage(e: any): string {
  return e?.response?.data?.messages?.error || e?.response?.data?.message || e?.message || 'Error inesperado'
}

// --- Impuestos ---

export interface TaxRetention {
  id: number
  document_number: string
  issue_date: string
  agent_document: string
  agent_name: string
  total_pen: number
  note: string | null
  items: { invoice_id: number | null; invoice_number: string; currency: string; invoice_total: number; retained: number; retained_pen: number; applied: boolean }[]
}

export interface TaxRetentionInput {
  document_number: string
  issue_date: string
  agent_document?: string
  agent_name?: string
  note?: string
  items: { invoice_number: string; retained?: number | null; retained_pen?: number | null }[]
}

export interface TaxSettlement {
  period: string
  igv: {
    sales_base: number; sales_tax: number; sales_count: number
    exports_base: number; exports_count: number
    purchases_base: number; purchases_tax: number; purchases_count: number
    month_tax: number; previous_igv_credit: number; previous_retention_credit: number
    retentions: number; to_pay: number; next_igv_credit: number; next_retention_credit: number
  }
  renta: { income: number; rate: number; tax: number; credit: number; to_pay: number; income_year_to_date: number; limit_300_uit: number }
  payroll: { essalud: number; fifth: number; closed: boolean }
  total: number
}

export async function getTaxSettlement(period: string, rentaCredit = 0) {
  const res = await api.get<{ data: TaxSettlement }>(`${BASE}/tax-settlement`, { params: { period, renta_credit: rentaCredit || undefined } })
  return res.data.data
}

export async function getTaxRetentions(period: string) {
  const res = await api.get<{ data: TaxRetention[] }>(`${BASE}/retentions`, { params: { period } })
  return res.data.data
}

export async function createTaxRetention(input: TaxRetentionInput) {
  const res = await api.post<{ message: string; data: TaxRetention }>(`${BASE}/retentions`, input)
  return res.data
}

export async function deleteTaxRetention(id: number) {
  const res = await api.delete<{ message: string }>(`${BASE}/retentions/${id}`)
  return res.data
}
