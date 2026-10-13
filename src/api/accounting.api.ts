import api from './axios'
import type {
  Expense, ExpenseCategory, ExpenseFilters, ExpenseInput, ExpensePayments, ExpenseSummary, Payee, PayeeInput,
  SireImportResult, BankAccount, BankImportResult, BankMovement, BankMovementFilters, BankMovementSummary,
  InvoiceSuggestion, ExpenseSuggestion, ReconcileInput
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
  payload: { name: string; group_name: string; is_payroll?: boolean; is_active?: boolean }
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

export async function getExpenses(filters: ExpenseFilters) {
  const params: Record<string, string | number> = { payment: filters.payment, page: filters.page }
  if (filters.period) params.period = filters.period
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.kind) params.kind = filters.kind
  if (filters.search) params.search = filters.search

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

export async function voidExpense(id: number) {
  const res = await api.post<{ message: string; data: Expense }>(`${BASE}/expenses/${id}/void`)
  return res.data
}

/** Un gasto por empleado activo con monto mensual; no repite lo ya generado. */
export async function generatePayroll(period: string) {
  const res = await api.post<{ message: string; data: { created: number; skipped: number; period: string } }>(
    `${BASE}/payroll`,
    { period }
  )
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

export function accountingErrorMessage(e: any): string {
  return e?.response?.data?.messages?.error || e?.response?.data?.message || e?.message || 'Error inesperado'
}
