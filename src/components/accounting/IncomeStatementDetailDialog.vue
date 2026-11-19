<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    modal
    :header="title"
    :style="{ width: '60rem' }"
    :breakpoints="{ '768px': '96vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        {{ subtitle }} Los importes van con el signo del estado de resultados: el total es la cifra de la celda.
      </p>

      <p v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Buscando de dónde sale…</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

      <template v-else-if="detail">
        <p v-if="detail.items.length === 0" class="text-sm text-gray-400">No hay registros detrás de esta cifra.</p>

        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <SelectButton v-model="view" :options="VIEWS" optionLabel="label" optionValue="value" :allowEmpty="false" />
            <span class="text-sm text-gray-600">
              {{ detail.count }} {{ detail.count === 1 ? 'registro' : 'registros' }} · total
              <span class="font-semibold tabular-nums text-gray-900">{{ money(detail.total) }}</span>
            </span>
          </div>

          <!-- Resumen: cuánto aporta cada uno -->
          <div v-if="view === 'groups'" class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th class="text-left px-3 py-2">{{ whoLabel }}</th>
                  <th class="text-right px-3 py-2">Registros</th>
                  <th class="text-right px-3 py-2">Importe</th>
                  <th class="text-right px-3 py-2">%</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="group in detail.groups"
                  :key="group.who"
                  class="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                  @click="filterBy(group.who)"
                >
                  <td class="px-3 py-2 text-gray-800">{{ group.who }}</td>
                  <td class="px-3 py-2 text-right tabular-nums text-gray-500">{{ group.count }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ money(group.amount) }}</td>
                  <td class="px-3 py-2 text-right tabular-nums text-gray-500">{{ percent(group.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cada registro -->
          <template v-else>
            <div v-if="who" class="flex items-center gap-2 text-sm">
              <span class="text-gray-600">Solo {{ who }}</span>
              <Button label="Ver todos" size="small" text @click="who = null" />
            </div>
            <div class="overflow-x-auto border border-gray-200 rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th class="text-left px-3 py-2">{{ detail.kind === 'payroll' ? 'Mes' : 'Fecha' }}</th>
                    <th class="text-left px-3 py-2">{{ whoLabel }}</th>
                    <th class="text-left px-3 py-2">{{ detail.kind === 'payroll' ? 'Concepto' : 'Documento' }}</th>
                    <th class="text-right px-3 py-2">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in items" :key="i" class="border-t border-gray-100 align-top">
                    <td class="px-3 py-2 whitespace-nowrap text-gray-600">{{ item.date ? formatDate(item.date) : monthName(item.period) }}</td>
                    <td class="px-3 py-2 text-gray-800">{{ item.who }}</td>
                    <td class="px-3 py-2">
                      <RouterLink v-if="linkTo(item)" :to="linkTo(item)!" class="text-primary hover:underline" @click="emit('update:visible', false)">
                        {{ item.document ?? (detail.kind === 'payroll' ? item.description : 'Abrir') }}
                      </RouterLink>
                      <span v-else class="text-gray-700">{{ item.document ?? item.description ?? '—' }}</span>
                      <div v-if="item.document && item.description" class="text-xs text-gray-500">{{ item.description }}</div>
                      <div v-if="item.original" class="text-xs text-gray-400">{{ item.original }}</div>
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums whitespace-nowrap">{{ money(item.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </template>
      </template>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { useFormatters } from '@/composables/useFormatters'
import { getIncomeStatementDetail, accountingErrorMessage } from '@/api/accounting.api'
import type { IncomeStatementDetail, IncomeStatementDetailItem, IncomeStatementSource } from '@/types/accounting.types'

const props = defineProps<{
  visible: boolean
  year: number
  /** AAAA-MM; null es el año entero (la columna Total). */
  period: string | null
  label: string
  source: IncomeStatementSource
}>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { formatDate } = useFormatters()

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
const VIEWS = [
  { label: 'Resumen', value: 'groups' },
  { label: 'Detalle', value: 'items' }
]

const detail = ref<IncomeStatementDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const view = ref<'groups' | 'items'>('groups')
const who = ref<string | null>(null)

function monthName(period: string): string {
  return `${MONTH_NAMES[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`
}

const title = computed(() => `${props.label} · ${props.period ? monthName(props.period) : `todo ${props.year}`}`)
const subtitle = computed(() => ({
  revenue: 'Los comprobantes del libro de ventas con líneas de esta fuente, sin IGV y en soles.',
  payroll: 'Lo devengado de cada boleta en este concepto, por la parte de la persona que va a este bloque.',
  expense: 'Los gastos de esta categoría por el mes al que corresponden, sin IGV y en soles.'
}[props.source.kind]))
const whoLabel = computed(() => ({ revenue: 'Cliente', payroll: 'Persona', expense: 'Proveedor' }[props.source.kind]))

const items = computed(() => (detail.value?.items ?? []).filter((i) => !who.value || i.who === who.value))

function money(value: number): string {
  const text = Math.abs(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return value < 0 ? `(S/ ${text})` : `S/ ${text}`
}

function percent(amount: number): string {
  const total = detail.value?.total ?? 0
  return total !== 0 ? `${((amount / total) * 100).toFixed(1)} %` : '-'
}

function filterBy(name: string) {
  who.value = name
  view.value = 'items'
}

function linkTo(item: IncomeStatementDetailItem): RouteLocationRaw | null {
  const link = item.link
  if (link.type === 'expense' && link.search) return { name: 'AccountingExpenses', query: { search: link.search } }
  if (link.type === 'invoice' && link.search) return { name: 'BillingInvoices', query: { search: link.search } }
  if (link.type === 'payroll') return { name: 'AccountingPayroll' }
  return null
}

async function load() {
  loading.value = true
  error.value = null
  detail.value = null
  who.value = null
  try {
    detail.value = await getIncomeStatementDetail(props.year, props.period, props.source)
    // Pocos registros: directo al detalle.
    view.value = (detail.value.groups.length <= 1 || detail.value.count <= 5) ? 'items' : 'groups'
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(() => [props.visible, props.period, props.label] as const, ([open]) => { if (open) load() }, { immediate: true })
</script>
