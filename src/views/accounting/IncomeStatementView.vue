<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Estado de resultados</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Por función y mes a mes, con la forma del que prepara el estudio contable. Ventas del libro de comprobantes sin
          IGV, planilla por lo devengado y gastos en el mes al que corresponden. No incluye depreciación ni amortización:
          eso lo lleva el estudio.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button icon="pi pi-chevron-left" text rounded severity="secondary" @click="shift(-1)" />
        <span class="text-lg font-semibold text-gray-800 tabular-nums">{{ year }}</span>
        <Button icon="pi pi-chevron-right" text rounded severity="secondary" :disabled="year >= currentYear" @click="shift(1)" />
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <div v-else-if="loading && !data" class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <template v-else-if="data">
      <!-- Qué tan completo está: un mes sin planilla o sin gastos parece un mes bueno -->
      <div v-if="warnings.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <div class="font-medium">Antes de leer los resultados</div>
        <ul class="list-disc pl-5 space-y-0.5">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto" :class="{ 'opacity-60': loading }">
        <table class="w-full text-sm whitespace-nowrap">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="sticky left-0 bg-white px-4 py-3 text-left font-medium min-w-[260px]"></th>
              <th
                v-for="(period, index) in data.periods"
                :key="period"
                class="px-3 py-3 text-right font-medium"
                :class="{ 'text-gray-300': !hasData(index) }"
              >
                {{ MONTHS[index] }}
              </th>
              <th class="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in data.rows" :key="index" :class="rowClass(row)">
              <td class="sticky left-0 px-4 py-1.5" :class="[labelClass(row), stickyBg(row)]">
                {{ row.label }}
                <span v-if="row.note" class="ml-1 text-xs font-normal text-gray-400">({{ row.note }})</span>
              </td>
              <template v-if="row.values.length">
                <td v-for="(value, i) in row.values" :key="i" class="px-3 py-1.5 text-right tabular-nums" :class="valueClass(row, value)">
                  {{ format(value) }}
                </td>
                <td class="px-4 py-1.5 text-right tabular-nums font-medium" :class="valueClass(row, row.total ?? 0)">
                  {{ format(row.total ?? 0) }}
                </td>
              </template>
              <td v-else :colspan="data.periods.length + 1"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-gray-500">
        Cada categoría de gasto cae en el bloque que tiene asignado en Categorías; el costo de cada persona se reparte
        según su ficha en Planilla → Personal. Los gastos van en negativo.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import { getIncomeStatement, accountingErrorMessage } from '@/api/accounting.api'
import type { IncomeStatement, IncomeStatementRow } from '@/types/accounting.types'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const currentYear = new Date().getFullYear()
const year = ref(currentYear)
const data = ref<IncomeStatement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function money(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Sin decimales: doce meses más el total no entran con céntimos. Negativos entre paréntesis.
function format(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return '-'
  const text = Math.abs(rounded).toLocaleString('es-PE')
  return rounded < 0 ? `(${text})` : text
}

function monthList(periods: string[]): string {
  return periods.map(p => MONTH_NAMES[Number(p.slice(5, 7)) - 1]).join(', ')
}

/** Un mes futuro, o uno sin nada cargado, se atenúa en la cabecera. */
function hasData(index: number): boolean {
  return data.value?.rows.some(row => row.type === 'line' && Math.abs(row.values[index] ?? 0) >= 0.5) ?? false
}

const warnings = computed(() => {
  const coverage = data.value?.coverage
  if (!coverage || !data.value) return []

  const list: string[] = []
  const now = new Date()
  const elapsed = data.value.periods.filter(p => p <= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const noPayroll = elapsed.filter(p => !coverage.payroll_months.includes(p))
  if (noPayroll.length) list.push(`Sin planilla: ${monthList(noPayroll)}. Esos meses no tienen costo de personal.`)

  const noExpenses = elapsed.filter(p => !coverage.expense_months.includes(p))
  if (noExpenses.length) list.push(`Sin gastos cargados: ${monthList(noExpenses)}. Falta importar su registro de compras (SIRE).`)

  if (coverage.unclassified > 0) {
    list.push(`Hay ${money(coverage.unclassified)} en gastos "Por clasificar": están contados como administrativos hasta que se clasifiquen.`)
  }
  if (coverage.untagged_income > 0) {
    list.push(`Hay ${money(coverage.untagged_income)} de ventas sin etiquetar su fuente.`)
  }
  return list
})

function rowClass(row: IncomeStatementRow): string {
  if (row.type === 'section') return 'border-t border-gray-200'
  if (row.type === 'total') return 'border-t border-gray-200'
  if (row.type === 'result') return 'bg-gray-50 border-y border-gray-200'
  return ''
}

function stickyBg(row: IncomeStatementRow): string {
  return row.type === 'result' ? 'bg-gray-50' : 'bg-white'
}

function labelClass(row: IncomeStatementRow): string {
  switch (row.type) {
    case 'section': return 'pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500'
    case 'group': return 'pl-6 text-xs font-semibold text-gray-600'
    case 'line': return 'pl-9 text-gray-700'
    case 'subtotal': return 'pl-9'
    case 'total': return 'font-semibold text-gray-900'
    default: return 'font-bold text-gray-900'
  }
}

function valueClass(row: IncomeStatementRow, value: number): string {
  if (row.type === 'result') return value < 0 ? 'font-bold text-red-600' : 'font-bold text-gray-900'
  if (row.type === 'total') return 'font-semibold text-gray-900'
  if (row.type === 'subtotal') return 'text-gray-500 border-t border-gray-200'
  return 'text-gray-700'
}

// Solo se muestra la última respuesta: cambiar de año rápido no deja datos de otro.
let sequence = 0

async function load() {
  const current = ++sequence
  loading.value = true
  error.value = null
  try {
    const statement = await getIncomeStatement(year.value)
    if (current === sequence) data.value = statement
  } catch (e) {
    if (current === sequence) {
      data.value = null
      error.value = accountingErrorMessage(e)
    }
  } finally {
    if (current === sequence) loading.value = false
  }
}

function shift(delta: number) {
  year.value += delta
  load()
}

onMounted(load)
</script>
