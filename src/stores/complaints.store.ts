import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  listComplaints,
  getComplaint,
  getComplaintStats,
  setComplaintSeen,
  respondComplaint
} from '@/api/complaints.api'
import type {
  Complaint,
  ComplaintDetail,
  ComplaintListFilters,
  ComplaintPagination,
  ComplaintStats
} from '@/types/complaint.types'

const defaultPagination: ComplaintPagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  hasMore: false
}

export const useComplaintsStore = defineStore('complaints', () => {
  const items = ref<Complaint[]>([])
  const current = ref<ComplaintDetail | null>(null)
  const pagination = ref<ComplaintPagination>({ ...defaultPagination })
  const stats = ref<ComplaintStats | null>(null)
  const filters = ref<ComplaintListFilters>({
    search: '',
    status: 'all',
    type: '',
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc'
  })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      const res = await listComplaints(filters.value)
      if (res.success) {
        items.value = res.data || []
        pagination.value = res.pagination || { ...defaultPagination }
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar reclamos'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStats() {
    try {
      const res = await getComplaintStats()
      if (res.success) stats.value = res.data
    } catch {
      // swallow — stats are informational
    }
  }

  async function fetchOne(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const res = await getComplaint(id)
      if (res.success) current.value = res.data
      return res
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar reclamo'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function toggleSeen(id: number, seen: boolean) {
    const res = await setComplaintSeen(id, seen)
    if (res.success) {
      const found = items.value.find(c => c.id === id)
      if (found) found.seen = seen
      if (current.value?.id === id) current.value.seen = seen
    }
    return res
  }

  async function submitResponse(id: number, response: string) {
    isSaving.value = true
    try {
      const res = await respondComplaint(id, response)
      if (res.success && current.value?.id === id) {
        current.value.response = response
        current.value.response_date =
          (res.data as { response_date?: string | null })?.response_date ?? new Date().toISOString()
        current.value.status = 'attended'
      }
      return res
    } finally {
      isSaving.value = false
    }
  }

  function setFilters(partial: Partial<ComplaintListFilters>) {
    filters.value = { ...filters.value, ...partial }
    if (!('page' in partial)) filters.value.page = 1
  }

  function setPage(page: number) {
    filters.value.page = page
  }

  return {
    items,
    current,
    pagination,
    stats,
    filters,
    isLoading,
    isSaving,
    error,
    fetchAll,
    fetchStats,
    fetchOne,
    toggleSeen,
    submitResponse,
    setFilters,
    setPage
  }
})
