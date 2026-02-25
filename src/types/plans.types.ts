export interface PlanListItem {
  id: number
  name: string
  max_items: number
  max_pages: number
  max_users: number
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

// Pricing Matrix types
export interface MatrixPlan {
  id: number
  name: string
  max_items: number
  max_pages: number
  max_users: number
  active: boolean
  active_stores: number
  module_ids: number[]
}

export interface MatrixData {
  plans: MatrixPlan[]
  modules: ModuleDefinition[]
}

export interface MatrixPlanUpdate {
  id: number
  name: string
  max_items: number
  max_pages: number
  max_users: number
  module_ids: number[]
}

export interface StoreModule {
  id: number
  code: string
  name: string
  group: string
  enabled: boolean
  is_override: boolean
  plan_enabled: boolean
}

export interface StoreModulesData {
  plan_id: number | null
  plan_name: string
  tiendaplan_id: number | null
  has_overrides: boolean
  modules: StoreModule[]
}
