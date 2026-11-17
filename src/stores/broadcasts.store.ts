import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  listBroadcasts,
  getBroadcast,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  resetBroadcastDismissals
} from '@/api/broadcasts.api'
import type { Broadcast, BroadcastFormInput, BroadcastListFilters } from '@/types/broadcast.types'

export const useBroadcastsStore = defineStore('broadcasts', () => {
  const items = ref<Broadcast[]>([])
  const current = ref<Broadcast | null>(null)
  // Arranca en los manuales: los automáticos de vencimiento de plan son cientos.
  const filters = ref<BroadcastListFilters>({ scope: 'all', status: 'all', origin: 'manual', q: '' })
  const page = ref(1)
  const perPage = ref(25)
  const total = ref(0)
  let requestSeq = 0
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    // La búsqueda dispara varias peticiones seguidas: solo vale la última.
    const seq = ++requestSeq
    isLoading.value = true
    error.value = null
    try {
      const res = await listBroadcasts(filters.value, page.value, perPage.value)
      if (seq !== requestSeq) return
      if (res.success) {
        items.value = res.data || []
        total.value = res.pagination?.total ?? items.value.length
      }
    } catch (e: any) {
      if (seq !== requestSeq) return
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar broadcasts'
    } finally {
      if (seq === requestSeq) isLoading.value = false
    }
  }

  /** Cambio de filtro o búsqueda: vuelve a la primera página. */
  function applyFilters() {
    page.value = 1
    return fetchAll()
  }

  function setPage(newPage: number, newPerPage?: number) {
    page.value = newPage
    if (newPerPage) perPage.value = newPerPage
    return fetchAll()
  }

  async function fetchOne(id: number) {
    const res = await getBroadcast(id)
    if (res.success) current.value = res.data
    return res
  }

  async function create(payload: BroadcastFormInput) {
    isSaving.value = true
    try {
      const res = await createBroadcast(payload)
      if (res.success) await fetchAll()
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function update(id: number, payload: BroadcastFormInput) {
    isSaving.value = true
    try {
      const res = await updateBroadcast(id, payload)
      if (res.success) await fetchAll()
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function remove(id: number) {
    const res = await deleteBroadcast(id)
    if (res.success) await fetchAll()
    return res
  }

  async function resetDismissals(id: number) {
    const res = await resetBroadcastDismissals(id)
    if (res.success) await fetchAll()
    return res
  }

  function setFilters(partial: Partial<BroadcastListFilters>) {
    filters.value = { ...filters.value, ...partial }
  }

  return {
    items,
    current,
    filters,
    page,
    perPage,
    total,
    isLoading,
    isSaving,
    error,
    fetchAll,
    applyFilters,
    setPage,
    fetchOne,
    create,
    update,
    remove,
    resetDismissals,
    setFilters
  }
})
