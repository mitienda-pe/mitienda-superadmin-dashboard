export interface StoreSalesTotals {
  transactions: number
  total_amount: number
  avg_ticket: number
  highest_ticket: number
  lowest_ticket: number
}

export interface StoreSalesRow extends StoreSalesTotals {
  id: number
  name: string
  slug: string
  flag: string | null
  plan: string | null
  status: 'vigente' | 'vencido'
}

export interface StoreSalesReport {
  start: string
  end: string
  totals: StoreSalesTotals
  store_count: number
  stores: StoreSalesRow[]
}

export interface StoreSalesFilters {
  start: string
  end: string
  plan?: string
  status?: string
  flag?: string
}
