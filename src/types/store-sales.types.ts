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
}

export interface StoreSalesReport {
  start: string
  end: string
  totals: StoreSalesTotals
  store_count: number
  stores: StoreSalesRow[]
}
