import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type {
  PipelineLead, PipelineLeadDetail, PipelineListMeta, PipelineLeadFilters
} from '@/types/pipeline.types'
import { getLeads, getLeadDetail } from '@/api/pipeline.api'

export const usePipelineStore = defineStore('pipeline', () => {
  // Lead list state
  const leads = ref<PipelineLead[]>([])
  const meta = ref<PipelineListMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
  const filters = reactive<PipelineLeadFilters>({
    search: '',
    stage: '',
    score_min: null,
    score_max: null,
    sort: 'readiness_score',
    order: 'DESC',
    page: 1,
    per_page: 20,
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Lead detail state
  const currentLead = ref<PipelineLeadDetail | null>(null)
  const isDetailLoading = ref(false)
  const detailError = ref<string | null>(null)

  async function fetchLeads() {
    isLoading.value = true
    error.value = null
    try {
      const res = await getLeads(filters)
      leads.value = res.data
      meta.value = res.meta
    } catch (e: any) {
      error.value = e.message || 'Error loading pipeline leads'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLeadDetail(id: number) {
    isDetailLoading.value = true
    detailError.value = null
    try {
      const res = await getLeadDetail(id)
      currentLead.value = res.data
    } catch (e: any) {
      detailError.value = e.message || 'Error loading lead detail'
    } finally {
      isDetailLoading.value = false
    }
  }

  function setPage(page: number) {
    filters.page = page
    fetchLeads()
  }

  function resetFilters() {
    filters.search = ''
    filters.stage = ''
    filters.score_min = null
    filters.score_max = null
    filters.sort = 'readiness_score'
    filters.order = 'DESC'
    filters.page = 1
    fetchLeads()
  }

  return {
    leads, meta, filters, isLoading, error,
    currentLead, isDetailLoading, detailError,
    fetchLeads, fetchLeadDetail, setPage, resetFilters
  }
})
