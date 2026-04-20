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
  const filters = ref<BroadcastListFilters>({ scope: 'all', status: 'all' })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      const res = await listBroadcasts(filters.value)
      if (res.success) items.value = res.data || []
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar broadcasts'
    } finally {
      isLoading.value = false
    }
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
    isLoading,
    isSaving,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    resetDismissals,
    setFilters
  }
})
