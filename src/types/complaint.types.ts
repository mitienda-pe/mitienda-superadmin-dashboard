export type ComplaintStatusFilter = 'all' | 'pending' | 'attended' | 'unseen'
export type ComplaintTypeFilter = '' | '1' | '2'

export interface Complaint {
  id: number
  code: string | null
  date: string | null
  created_at: string | null
  tienda_id: number | null
  tienda_nombre: string | null
  name: string | null
  email: string | null
  phone: string | null
  document_type: string | null
  document_type_id: number
  document_number: string | null
  complaint_type: string | null
  complaint_type_id: number
  good_type: string | null
  good_type_id: number
  seen: boolean
  status: 'pending' | 'attended'
}

export interface ComplaintDetail extends Complaint {
  address: string | null
  good_description: string | null
  complaint_detail: string | null
  response: string | null
  response_date: string | null
  hash: string | null
  tienda_slug: string | null
  tienda_email: string | null
}

export interface ComplaintListFilters {
  search?: string
  status?: ComplaintStatusFilter
  type?: ComplaintTypeFilter
  tienda_id?: number | null
  date_from?: string | null
  date_to?: string | null
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface ComplaintStats {
  total: number
  pending: number
  attended: number
  unseen: number
  reclamos: number
  quejas: number
}

export interface ComplaintPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasMore: boolean
}
