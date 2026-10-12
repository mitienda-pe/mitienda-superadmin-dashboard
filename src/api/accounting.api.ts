import api from './axios'
import type {
  Expense, ExpenseCategory, ExpenseFilters, ExpenseInput, ExpensePayments, ExpenseSummary, Payee, PayeeInput
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

export function accountingErrorMessage(e: any): string {
  return e?.response?.data?.messages?.error || e?.response?.data?.message || e?.message || 'Error inesperado'
}
