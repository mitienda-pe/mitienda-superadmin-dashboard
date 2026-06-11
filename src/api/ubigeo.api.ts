import api from './axios'

export interface UbigeoItem {
  id: number
  name: string
  codPais: number
  codDpto?: number
  codProv?: number
  codDist?: number
  iso2?: string
}

export async function getUbigeoCountries() {
  const res = await api.get<{ success: boolean; data: UbigeoItem[] }>('/ubigeo/countries')
  return res.data.data
}

export async function getUbigeoRegions(codPais: number) {
  const res = await api.get<{ success: boolean; data: UbigeoItem[] }>('/ubigeo/regions', {
    params: { codPais }
  })
  return res.data.data
}

export async function getUbigeoProvinces(codPais: number, codDpto: number) {
  const res = await api.get<{ success: boolean; data: UbigeoItem[] }>('/ubigeo/provinces', {
    params: { codPais, codDpto }
  })
  return res.data.data
}

export async function getUbigeoDistricts(codPais: number, codDpto: number, codProv: number) {
  const res = await api.get<{ success: boolean; data: UbigeoItem[] }>('/ubigeo/districts', {
    params: { codPais, codDpto, codProv }
  })
  return res.data.data
}
