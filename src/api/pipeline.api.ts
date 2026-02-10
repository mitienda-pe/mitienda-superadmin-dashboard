import api from './axios'
import type {
  PipelineLead, PipelineLeadDetail, PipelineListMeta, PipelineLeadFilters,
  PipelineDashboard, PipelineNote, PipelineFollowUp,
  AddNoteRequest, ChangeStageRequest, AddFollowUpRequest, UpdateTagsRequest,
  SuperAdminUser
} from '@/types/pipeline.types'

export async function getDashboard() {
  const res = await api.get<{ success: boolean; data: PipelineDashboard }>(
    '/superadmin/pipeline/dashboard'
  )
  return res.data
}

export async function getLeads(filters: Partial<PipelineLeadFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.stage) params.stage = filters.stage
  if (filters.score_min != null) params.score_min = filters.score_min
  if (filters.score_max != null) params.score_max = filters.score_max
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<{ success: boolean; data: PipelineLead[]; meta: PipelineListMeta }>(
    '/superadmin/pipeline/leads',
    { params }
  )
  return res.data
}

export async function getLeadDetail(id: number) {
  const res = await api.get<{ success: boolean; data: PipelineLeadDetail }>(
    `/superadmin/pipeline/leads/${id}`
  )
  return res.data
}

export async function addNote(tiendaId: number, data: AddNoteRequest) {
  const res = await api.post<{ success: boolean; data: PipelineNote }>(
    `/superadmin/pipeline/leads/${tiendaId}/notes`,
    data
  )
  return res.data
}

export async function changeStage(tiendaId: number, data: ChangeStageRequest) {
  const res = await api.put<{ success: boolean; data: { from_stage: string; to_stage: string } }>(
    `/superadmin/pipeline/leads/${tiendaId}/stage`,
    data
  )
  return res.data
}

export async function addFollowUp(tiendaId: number, data: AddFollowUpRequest) {
  const res = await api.post<{ success: boolean; data: PipelineFollowUp }>(
    `/superadmin/pipeline/leads/${tiendaId}/follow-ups`,
    data
  )
  return res.data
}

export async function completeFollowUp(followUpId: number) {
  const res = await api.put<{ success: boolean }>(
    `/superadmin/pipeline/follow-ups/${followUpId}/complete`
  )
  return res.data
}

export async function updateTags(tiendaId: number, data: UpdateTagsRequest) {
  const res = await api.put<{ success: boolean; data: { tags: string[] } }>(
    `/superadmin/pipeline/leads/${tiendaId}/tags`,
    data
  )
  return res.data
}

export async function listSuperAdmins() {
  const res = await api.get<{ success: boolean; data: SuperAdminUser[] }>(
    '/superadmin/pipeline/superadmins'
  )
  return res.data
}
