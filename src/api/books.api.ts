import api from './axios'

const BASE = '/superadmin/accounting/ledger'

export type AccountKind = 'activo' | 'pasivo' | 'patrimonio' | 'gasto' | 'ingreso' | 'destino' | 'puente'

export interface LedgerAccount {
  id: number
  code: string
  name: string
  kind: AccountKind
  is_active: number | string
}

export interface ChartOfAccounts {
  accounts: LedgerAccount[]
  settings: Array<{ setting_key: string; account_code: string | null; label: string }>
  categories: Array<{ id: number; name: string; statement_function: string; account_code: string | null }>
  banks: Array<{ id: number; bank: string; name: string; currency: string; ledger_code: string | null }>
}

export interface JournalLine {
  account: string
  debit: number
  credit: number
  original: number
  glosa: string
  anexo: string
  doc_type: string | number | null
  doc_number: string | null
}

export interface JournalEntry {
  subdiary: 'compras' | 'ventas' | 'bancos'
  number: string
  date: string
  currency: string
  exchange_rate: number
  glosa: string
  source: [string, number]
  lines: JournalLine[]
  pending: boolean
}

export interface Journal {
  period: string
  entries: JournalEntry[]
  ledger: Array<{ account: string; name: string | null; debit: number; credit: number; balance: number; lines: number }>
  summary: { entries: number; by_subdiary: Record<string, number>; pending_movements: number; debit: number; credit: number }
  warnings: string[]
}

export async function getChart() {
  const res = await api.get<{ data: ChartOfAccounts }>(`${BASE}/chart`)
  return res.data.data
}

export async function saveLedgerAccount(input: { code: string; name: string; kind: AccountKind; is_active?: number }) {
  const res = await api.post<{ data: ChartOfAccounts }>(`${BASE}/accounts`, input)
  return res.data.data
}

export async function assignLedgerAccount(input: { target: 'setting' | 'category' | 'bank'; id: string | number; code: string | null }) {
  const res = await api.put<{ data: ChartOfAccounts }>(`${BASE}/assign`, input)
  return res.data.data
}

export async function getJournal(period: string) {
  const res = await api.get<{ data: Journal }>(`${BASE}/journal`, { params: { period } })
  return res.data.data
}

export async function downloadJournalCsv(period: string): Promise<void> {
  const res = await api.get<Blob>(`${BASE}/export`, { params: { period }, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `diario-${period}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
