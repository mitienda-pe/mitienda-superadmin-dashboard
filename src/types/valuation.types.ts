// Valoración de la empresa (solo Master). Espejo de App\Services\Valuation\ValuationModel.

export type ValuationCurrency = 'USD' | 'PEN'

export type CostBucket =
  | 'infraestructura' | 'terceros' | 'pasarela' | 'soporte' | 'onboarding'
  | 'servicios' | 'comercial' | 'gasto_operativo'

export interface ProjectionYearAssumption {
  budget_usd: number | null
  cac_usd: number | null
  monthly_churn: number | null
  price_growth: number
  gmv_growth: number
  take_rate: number | null
  services_growth: number
}

export interface ValuationAssumptions {
  multiples: { fixed: number; variable: number; services: number }
  gross_margin_target: number | null
  staff_split: { servicios: number; soporte: number; onboarding: number }
  commercial_adjustment_usd: number
  projection: ProjectionYearAssumption[]
}

export interface RevenueBucket {
  key: 'fijo' | 'variable' | 'servicios'
  name: string
  values: number[]
  total: number
  share: number
}

export interface RevenueSource {
  key: string
  name: string
  bucket: RevenueBucket['key']
  values: number[]
  total: number
}

export interface CostRubro {
  key: CostBucket
  name: string
  values: number[]
  total: number
  share_of_revenue: number | null
}

export interface ChurnMonth {
  month: string
  opening: number
  closing: number
  lost: number
  gained: number
  rate: number | null
}

export interface ProjectionYear {
  year: number
  budget: number
  budget_source: 'supuesto' | 'actual' | null
  cac: number | null
  cac_source: 'supuesto' | 'medido' | null
  monthly_churn: number
  customers_start: number
  customers_new: number
  customers_lost: number
  customers_end: number
  arpu_fixed: number
  gmv: number
  take_rate: number
  fixed: number
  variable: number
  services: number
  total: number
  growth: number | null
  fixed_arr_end: number
  gross_profit: number
  ltv_cac: number | null
}

export interface ValuationSignal {
  key: string
  label: string
  value: number | null
  target: string
  unit: string
  status: 'ok' | 'alerta' | 'sin_dato'
}

export interface ValuationScenarioRef {
  id: number
  name: string
  is_default: boolean
  updated_at?: string | null
}

export interface Valuation {
  currency: ValuationCurrency
  as_of: string
  ref_month: string
  months: string[]
  fx: { spot: number; monthly: Record<string, number>; missing: string[] }
  revenue: { buckets: RevenueBucket[]; sources: RevenueSource[]; untagged: number; total: number }
  recurring: {
    mrr_subscriptions: number
    other_fixed_monthly: number
    mrr_equivalent: number
    arr_equivalent: number
    mrr_invoiced_last_month: number
    variable_12m: number
    services_12m: number
    customers: number
    mrr_history: number[]
    customers_history: number[]
  }
  costs: {
    rubros: CostRubro[]
    saas_revenue: number
    saas_cogs: number
    gross_profit: number
    gross_margin_hist: number | null
    gross_margin_expected: number | null
    gross_margin_source: 'supuesto' | 'historico'
    services: { revenue: number; cost: number; margin: number | null }
    commercial_12m: number
    opex_12m: number
    coverage: { missing_payroll: string[]; missing_expenses: string[] }
  }
  churn: { months: ChurnMonth[]; average: number | null }
  cac: {
    months: string[]
    spend_recorded: number
    adjustment: number
    spend: number
    new_customers: number
    new_by_month: number[]
    cac: number | null
  }
  ltv: {
    arpu: number | null
    arpu_fixed: number | null
    arpu_variable: number | null
    gross_margin: number | null
    churn: number | null
    lifetime_months: number | null
    ltv: number | null
    ltv_cac: number | null
    payback_months: number | null
  }
  nrr: {
    from: string
    to: string
    initial: number
    expansion: number
    contraction: number
    churn: number
    final: number
    nrr: number | null
    grr: number | null
    customers: number
    customers_expanded: number
    customers_contracted: number
    customers_churned: number
  }
  projection: {
    base: {
      customers: number
      arpu_fixed: number
      gmv_per_customer: number
      gmv_12m: number
      take_rate: number | null
      services: number
      gross_margin: number | null
      services_margin: number | null
      churn: number | null
      cac: number | null
      commercial_annual: number
      fixed_arr: number
      variable_12m: number
    }
    years: ProjectionYear[]
  }
  valuation: {
    components: { key: string; name: string; base: number; multiple: number; value: number }[]
    total: number
    low: number
    high: number
    implied_revenue_multiple: number | null
  }
  signals: ValuationSignal[]
  assumptions: ValuationAssumptions
  scenario: ValuationScenarioRef | null
  scenarios: ValuationScenarioRef[]
}

export interface CostMapEntry {
  id: number
  name: string
  statement_function: string
  bucket: CostBucket
  is_default: boolean
}
