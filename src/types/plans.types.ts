export interface PlanListItem {
  id: number
  name: string
  max_items: number
  max_pages: number
  active: boolean
  module_count: number
  active_stores: number
}

export interface PlanModuleAssignment {
  id: number
  code: string
  name: string
  group: string
  published: boolean
  enabled: boolean
}

export interface PlanDetail extends PlanListItem {
  modules: PlanModuleAssignment[]
}

export interface ModuleDefinition {
  id: number
  code: string
  name: string
  group: string
  published: boolean
  order: number
}

export interface StoreModulesData {
  plan_id: number | null
  tiendaplan_id: number | null
  modules: Array<{
    id: number
    code: string
    name: string
    group: string
    enabled: boolean
  }>
}
