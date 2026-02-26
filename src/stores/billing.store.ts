import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  CommissionItem, CommissionSummary,
  InvoiceItem, InvoiceSummary, InvoiceFilters,
  PlanSaleItem, PlanSaleSummary, PlanSaleFilters,
  BillingFilters, BillingMeta
} from '@/types/billing.types'
import { getCommissions, getInvoices, getPlanSales } from '@/api/billing.api'

export const useBillingStore = defineStore('billing', () => {
  // Commissions state
  const commissions = ref<CommissionItem[]>([])
  const commissionsSummary = ref<CommissionSummary>({ total_comisiones: 0, total_pagado: 0, total_pendiente: 0, count: 0 })
  const commissionsMeta = ref<BillingMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
  const commissionsFilters = ref<BillingFilters>({
    status: 'all',
    period: '',
    search: '',
    page: 1,
    per_page: 20
  })
  const commissionsLoading = ref(false)
  const commissionsError = ref<string | null>(null)

  // Invoices state
  const invoices = ref<InvoiceItem[]>([])
  const invoicesSummary = ref<InvoiceSummary>({ total_monto: 0, count: 0 })
  const invoicesMeta = ref<BillingMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
  const invoicesFilters = ref<InvoiceFilters>({
    origen: 'all',
    period: '',
    search: '',
    page: 1,
    per_page: 20
  })
  const invoicesLoading = ref(false)
  const invoicesError = ref<string | null>(null)

  async function fetchCommissions() {
    commissionsLoading.value = true
    commissionsError.value = null
    try {
      const res = await getCommissions(commissionsFilters.value)
      commissions.value = res.data || []
      if (res.summary) commissionsSummary.value = res.summary
      if (res.meta) commissionsMeta.value = res.meta
    } catch (e: any) {
      commissionsError.value = e.message || 'Error al cargar comisiones'
    } finally {
      commissionsLoading.value = false
    }
  }

  async function fetchInvoices() {
    invoicesLoading.value = true
    invoicesError.value = null
    try {
      const res = await getInvoices(invoicesFilters.value)
      invoices.value = res.data || []
      if (res.summary) invoicesSummary.value = res.summary
      if (res.meta) invoicesMeta.value = res.meta
    } catch (e: any) {
      invoicesError.value = e.message || 'Error al cargar facturas'
    } finally {
      invoicesLoading.value = false
    }
  }

  function updateCommissionsFilters(newFilters: Partial<BillingFilters>) {
    Object.assign(commissionsFilters.value, newFilters)
    if (newFilters.status !== undefined || newFilters.period !== undefined || newFilters.search !== undefined) {
      commissionsFilters.value.page = 1
    }
    fetchCommissions()
  }

  function updateInvoicesFilters(newFilters: Partial<InvoiceFilters>) {
    Object.assign(invoicesFilters.value, newFilters)
    if (newFilters.origen !== undefined || newFilters.period !== undefined || newFilters.search !== undefined) {
      invoicesFilters.value.page = 1
    }
    fetchInvoices()
  }

  function commissionsGoToPage(page: number) {
    commissionsFilters.value.page = page
    fetchCommissions()
  }

  function invoicesGoToPage(page: number) {
    invoicesFilters.value.page = page
    fetchInvoices()
  }

  // Plan Sales state
  const planSales = ref<PlanSaleItem[]>([])
  const planSalesSummary = ref<PlanSaleSummary>({ total_ventas: 0, total_facturado: 0, total_pendiente: 0, count: 0 })
  const planSalesMeta = ref<BillingMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
  const planSalesFilters = ref<PlanSaleFilters>({
    invoiced: 'all',
    period: '',
    plan: '',
    search: '',
    page: 1,
    per_page: 20
  })
  const planSalesLoading = ref(false)
  const planSalesError = ref<string | null>(null)

  async function fetchPlanSales() {
    planSalesLoading.value = true
    planSalesError.value = null
    try {
      const res = await getPlanSales(planSalesFilters.value)
      planSales.value = res.data || []
      if (res.summary) planSalesSummary.value = res.summary
      if (res.meta) planSalesMeta.value = res.meta
    } catch (e: any) {
      planSalesError.value = e.message || 'Error al cargar ventas de planes'
    } finally {
      planSalesLoading.value = false
    }
  }

  function updatePlanSalesFilters(newFilters: Partial<PlanSaleFilters>) {
    Object.assign(planSalesFilters.value, newFilters)
    if (newFilters.invoiced !== undefined || newFilters.period !== undefined || newFilters.plan !== undefined || newFilters.search !== undefined) {
      planSalesFilters.value.page = 1
    }
    fetchPlanSales()
  }

  function planSalesGoToPage(page: number) {
    planSalesFilters.value.page = page
    fetchPlanSales()
  }

  return {
    commissions, commissionsSummary, commissionsMeta, commissionsFilters,
    commissionsLoading, commissionsError,
    invoices, invoicesSummary, invoicesMeta, invoicesFilters,
    invoicesLoading, invoicesError,
    planSales, planSalesSummary, planSalesMeta, planSalesFilters,
    planSalesLoading, planSalesError,
    fetchCommissions, fetchInvoices, fetchPlanSales,
    updateCommissionsFilters, updateInvoicesFilters, updatePlanSalesFilters,
    commissionsGoToPage, invoicesGoToPage, planSalesGoToPage
  }
})
