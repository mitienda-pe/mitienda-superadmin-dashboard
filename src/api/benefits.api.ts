import api from './axios'
import type { Benefit, BenefitFormInput } from '@/types/benefit.types'

type ApiList = { success: boolean; data: Benefit[]; message?: string }
type ApiItem = { success: boolean; data: Benefit; message?: string }
type ApiMsg = { success: boolean; message?: string }

export async function listBenefits() {
  const res = await api.get<ApiList>('/superadmin/benefits')
  return res.data
}

export async function createBenefit(payload: BenefitFormInput) {
  const res = await api.post<ApiItem>('/superadmin/benefits', payload)
  return res.data
}

export async function updateBenefit(id: number, payload: Partial<BenefitFormInput>) {
  const res = await api.put<ApiItem>(`/superadmin/benefits/${id}`, payload)
  return res.data
}

export async function deleteBenefit(id: number) {
  const res = await api.delete<ApiMsg>(`/superadmin/benefits/${id}`)
  return res.data
}
