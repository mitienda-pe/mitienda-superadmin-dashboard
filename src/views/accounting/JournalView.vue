<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Libro diario y mayor</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Asientos armados con lo registrado: compras del mes (con su destino 9x), comprobantes emitidos y movimientos
          de los bancos según su conciliación. Las cuentas salen del Plan de cuentas. Todavía no incluye la planilla
          devengada ni los préstamos (sus pagos sí aparecen en bancos).
        </p>
      </div>
      <div class="flex items-center gap-2">
        <InputText v-model="period" type="month" class="w-44" @change="load" />
        <Button label="Exportar CSV" icon="pi pi-download" outlined :disabled="!journal" :loading="exporting" @click="exportCsv" />
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>
    <div v-else-if="loading && !journal" class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <template v-if="journal">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4" :class="{ 'opacity-60': loading }">
        <div v-for="card in cards" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="text-xs text-gray-500">{{ card.label }}</div>
          <div class="text-xl font-semibold text-gray-900 tabular-nums mt-1">{{ card.value }}</div>
        </div>
      </div>

      <div v-if="journal.warnings.length || journal.summary.pending_movements" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <div v-if="journal.summary.pending_movements">
          {{ journal.summary.pending_movements }} movimientos del banco sin conciliar van a "por identificar": concílialos en Bancos.
        </div>
        <div v-for="warning in journal.warnings" :key="warning">{{ warning }}</div>
      </div>

      <SelectButton v-model="view" :options="VIEWS" optionLabel="label" optionValue="value" :allowEmpty="false" />

      <!-- Mayor -->
      <div v-if="view === 'ledger'" class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable :value="journal.ledger" size="small" class="text-sm">
          <Column field="account" header="Cuenta" sortable style="width: 110px" />
          <Column field="name" header="Nombre" sortable>
            <template #body="{ data: row }">
              <span :class="{ 'text-red-600': !row.name }">{{ row.name ?? 'No está en el plan de cuentas' }}</span>
            </template>
          </Column>
          <Column field="debit" header="Debe" sortable class="text-right">
            <template #body="{ data: row }"><span class="tabular-nums">{{ money(row.debit) }}</span></template>
          </Column>
          <Column field="credit" header="Haber" sortable class="text-right">
            <template #body="{ data: row }"><span class="tabular-nums">{{ money(row.credit) }}</span></template>
          </Column>
          <Column field="balance" header="Saldo" sortable class="text-right">
            <template #body="{ data: row }">
              <span class="tabular-nums font-medium">{{ money(Math.abs(row.balance)) }} {{ row.balance >= 0 ? 'D' : 'A' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Diario -->
      <div v-else class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <SelectButton v-model="subdiary" :options="SUBDIARIES" optionLabel="label" optionValue="value" :allowEmpty="false" />
          <InputText v-model="search" placeholder="Buscar en glosas, cuentas o documentos" class="w-72" />
          <label class="flex items-center gap-2 text-sm text-gray-600">
            <input v-model="onlyPending" type="checkbox" /> Solo por identificar
          </label>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-gray-500 border-b border-gray-200">
                <th class="px-3 py-2 text-left">Asiento</th>
                <th class="px-3 py-2 text-left">Cuenta</th>
                <th class="px-3 py-2 text-left">Glosa</th>
                <th class="px-3 py-2 text-left">Anexo / documento</th>
                <th class="px-3 py-2 text-right">Debe</th>
                <th class="px-3 py-2 text-right">Haber</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="entry in visibleEntries" :key="entry.subdiary + entry.number">
                <tr v-for="(line, i) in entry.lines" :key="i" :class="i === entry.lines.length - 1 ? 'border-b border-gray-200' : ''">
                  <td class="px-3 py-1 align-top whitespace-nowrap">
                    <template v-if="i === 0">
                      <div class="font-medium text-gray-800">{{ SUBDIARY_LABELS[entry.subdiary] }} {{ entry.number }}</div>
                      <div class="text-xs text-gray-500">{{ formatDate(entry.date) }}<template v-if="entry.currency !== 'PEN'"> · {{ entry.currency }} {{ entry.exchange_rate }}</template></div>
                      <span v-if="entry.pending" class="text-xs text-amber-700">por identificar</span>
                    </template>
                  </td>
                  <td class="px-3 py-1 tabular-nums" :title="accountName(line.account)">{{ line.account }}</td>
                  <td class="px-3 py-1 text-gray-700">{{ line.glosa }}</td>
                  <td class="px-3 py-1 text-xs text-gray-500">{{ [line.anexo, line.doc_number].filter(Boolean).join(' · ') }}</td>
                  <td class="px-3 py-1 text-right tabular-nums">{{ line.debit ? money(line.debit) : '' }}</td>
                  <td class="px-3 py-1 text-right tabular-nums">{{ line.credit ? money(line.credit) : '' }}</td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-if="filteredEntries.length > visibleEntries.length" class="p-3 text-center">
            <Button :label="`Ver más (${filteredEntries.length - visibleEntries.length} asientos)`" text size="small" @click="limit += 100" />
          </div>
          <div v-if="!filteredEntries.length" class="p-8 text-center text-gray-500">Sin asientos.</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { accountingErrorMessage } from '@/api/accounting.api'
import { getJournal, downloadJournalCsv, type Journal } from '@/api/books.api'

const VIEWS = [{ label: 'Diario', value: 'journal' }, { label: 'Mayor', value: 'ledger' }]
const SUBDIARY_LABELS: Record<string, string> = { compras: 'Compras', ventas: 'Ventas', bancos: 'Bancos' }
const SUBDIARIES = [{ label: 'Todos', value: 'all' }, ...Object.entries(SUBDIARY_LABELS).map(([value, label]) => ({ label, value }))]

const now = new Date()
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
const period = ref(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`)
const journal = ref<Journal | null>(null)
const loading = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)
const view = ref<'journal' | 'ledger'>('journal')
const subdiary = ref('all')
const search = ref('')
const onlyPending = ref(false)
const limit = ref(100)

const names = computed(() => Object.fromEntries((journal.value?.ledger ?? []).map(row => [row.account, row.name ?? ''])))

const cards = computed(() => {
  const s = journal.value?.summary
  if (!s) return []
  return [
    { label: 'Asientos', value: s.entries },
    { label: 'Compras', value: s.by_subdiary.compras ?? 0 },
    { label: 'Ventas', value: s.by_subdiary.ventas ?? 0 },
    { label: 'Bancos', value: s.by_subdiary.bancos ?? 0 },
    { label: 'Debe = Haber', value: money(s.debit) }
  ]
})

const filteredEntries = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (journal.value?.entries ?? []).filter(entry => {
    if (subdiary.value !== 'all' && entry.subdiary !== subdiary.value) return false
    if (onlyPending.value && !entry.pending) return false
    if (!term) return true
    return entry.glosa.toLowerCase().includes(term)
      || entry.lines.some(l => l.account.startsWith(term) || (l.doc_number ?? '').toLowerCase().includes(term) || l.anexo.includes(term))
  })
})
const visibleEntries = computed(() => filteredEntries.value.slice(0, limit.value))
watch([subdiary, search, onlyPending], () => { limit.value = 100 })

function money(value: number): string {
  return value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value: string): string {
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

function accountName(code: string): string {
  return names.value[code] ?? ''
}

async function load() {
  if (!period.value) return
  loading.value = true
  error.value = null
  try {
    journal.value = await getJournal(period.value)
    limit.value = 100
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function exportCsv() {
  exporting.value = true
  try {
    await downloadJournalCsv(period.value)
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    exporting.value = false
  }
}

onMounted(load)
</script>
