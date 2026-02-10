import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type {
  PipelineLead, PipelineLeadDetail, PipelineListMeta, PipelineLeadFilters,
  PipelineDashboard, PipelineStage, SuperAdminUser
} from '@/types/pipeline.types'
import {
  getLeads, getLeadDetail, getDashboard,
  addNote as apiAddNote, changeStage as apiChangeStage,
  addFollowUp as apiAddFollowUp, completeFollowUp as apiCompleteFollowUp,
  updateTags as apiUpdateTags, listSuperAdmins as apiListSuperAdmins
} from '@/api/pipeline.api'

export const usePipelineStore = defineStore('pipeline', () => {
  // Dashboard state
  const dashboard = ref<PipelineDashboard | null>(null)
  const isDashboardLoading = ref(false)
  const dashboardError = ref<string | null>(null)

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

  // SuperAdmins list (for assignment)
  const superAdmins = ref<SuperAdminUser[]>([])

  async function fetchDashboard() {
    isDashboardLoading.value = true
    dashboardError.value = null
    try {
      const res = await getDashboard()
      dashboard.value = res.data
    } catch (e: any) {
      dashboardError.value = e.message || 'Error loading dashboard'
    } finally {
      isDashboardLoading.value = false
    }
  }

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

  // CRM actions
  async function addNote(tiendaId: number, content: string, noteType: string) {
    const res = await apiAddNote(tiendaId, { content, note_type: noteType })
    if (currentLead.value && currentLead.value.id === tiendaId) {
      currentLead.value.notes.unshift(res.data)
    }
    return res.data
  }

  async function changeLeadStage(tiendaId: number, stage: PipelineStage, reason?: string) {
    const res = await apiChangeStage(tiendaId, { stage, reason })
    if (currentLead.value && currentLead.value.id === tiendaId) {
      currentLead.value.pipeline_stage = stage
      currentLead.value.stage_changed_at = new Date().toISOString()
      currentLead.value.stage_changed_by = 'manual'
      // Refresh to get updated history
      await fetchLeadDetail(tiendaId)
    }
    return res.data
  }

  async function addLeadFollowUp(tiendaId: number, dueDate: string, description: string) {
    const res = await apiAddFollowUp(tiendaId, { due_date: dueDate, description })
    if (currentLead.value && currentLead.value.id === tiendaId) {
      currentLead.value.follow_ups.push({
        ...res.data,
        user_name: res.data.user_name || 'Admin',
      })
    }
    return res.data
  }

  async function markFollowUpComplete(followUpId: number) {
    await apiCompleteFollowUp(followUpId)
    if (currentLead.value) {
      const fu = currentLead.value.follow_ups.find(f => f.id === followUpId)
      if (fu) {
        fu.completed = true
        fu.completed_at = new Date().toISOString()
      }
    }
  }

  async function updateLeadTags(tiendaId: number, tags: string[]) {
    const res = await apiUpdateTags(tiendaId, { tags })
    if (currentLead.value && currentLead.value.id === tiendaId) {
      currentLead.value.tags = res.data.tags
    }
    return res.data
  }

  async function fetchSuperAdmins() {
    if (superAdmins.value.length > 0) return // cache
    try {
      const res = await apiListSuperAdmins()
      superAdmins.value = res.data
    } catch {
      // silent fail
    }
  }

  return {
    // Dashboard
    dashboard, isDashboardLoading, dashboardError, fetchDashboard,
    // Leads list
    leads, meta, filters, isLoading, error,
    fetchLeads, setPage, resetFilters,
    // Lead detail
    currentLead, isDetailLoading, detailError, fetchLeadDetail,
    // CRM actions
    addNote, changeLeadStage, addLeadFollowUp, markFollowUpComplete,
    updateLeadTags, fetchSuperAdmins, superAdmins,
  }
})
