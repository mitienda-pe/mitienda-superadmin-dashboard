<template>
  <div class="space-y-6">
    <SectionTabs :tabs="INVOICES_TABS" />

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Comprobantes</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Todo lo que MiTienda emitió, incluido lo emitido directo en Nubefact, con su estado de cobro. Lo anterior a
        2026 se dio por cobrado; lo de este año queda "por confirmar" hasta que se registre su cobro.
      </p>
    </div>

    <!-- Cuentas por cobrar: no cambian al filtrar por estado de cobro -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" :class="{ 'opacity-60': loading }">
      <button
        v-for="card in cards"
        :key="card.filter"
        type="button"
        class="bg-white rounded-xl border p-5 text-left transition-colors hover:border-primary-300"
        :class="filters.payment === card.filter ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200'"
        @click="setPayment(card.filter)"
      >
        <div class="text-sm text-gray-500">{{ card.label }}</div>
        <div class="text-2xl font-bold mt-1" :class="card.color">{{ money(card.amount, 'PEN') }}</div>
        <div class="text-xs text-gray-400 mt-1">
          {{ formatNumber(card.count) }} comprobantes
          <template v-if="card.usd > 0"> · además {{ money(card.usd, 'USD') }}</template>
        </div>
        <div class="text-xs text-gray-400 mt-0.5">{{ card.hint }}</div>
      </button>
    </div>

    <!-- Quién debe más -->
    <div v-if="summary.debtors.length > 0" class="bg-white rounded-xl border border-gray-200 p-5">
      <button type="button" class="flex w-full items-center justify-between text-left" @click="showDebtors = !showDebtors">
        <span class="text-sm font-semibold text-gray-800">
          Mayores saldos sin cobrar
          <span class="font-normal text-gray-400">· pendiente y por confirmar, en soles</span>
        </span>
        <i class="pi text-gray-400" :class="showDebtors ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
      </button>
      <table v-if="showDebtors" class="w-full text-sm mt-3">
        <tbody>
          <tr v-for="debtor in summary.debtors" :key="debtor.customer_document + debtor.customer_name" class="border-t border-gray-100">
            <td class="py-1.5 pr-3">
              <button type="button" class="text-left text-gray-700 hover:text-primary-600" @click="searchCustomer(debtor)">
                {{ debtor.customer_name || '(sin nombre)' }}
              </button>
              <span class="text-xs text-gray-400 font-mono ml-2">{{ debtor.customer_document }}</span>
            </td>
            <td class="py-1.5 text-right text-xs text-gray-400 whitespace-nowrap">
              {{ debtor.invoices }} comprobantes · el más antiguo del {{ formatDate(debtor.oldest) }}
            </td>
            <td class="py-1.5 pl-4 text-right tabular-nums font-semibold text-gray-800 w-32">{{ money(debtor.amount, 'PEN') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar comprobante, RUC, razón social..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <Dropdown
          v-model="filters.payment"
          :options="paymentOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="reload"
        />
        <Dropdown
          v-model="yearFilter"
          :options="yearOptions"
          optionLabel="label"
          optionValue="value"
          class="w-36"
          @change="onYearChange"
        />
        <InputText v-model="monthFilter" type="month" class="w-44" v-tooltip.top="'Un mes en particular'" @change="reload" />
        <Dropdown
          v-model="originFilter"
          :options="originOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="reload"
        />
        <Button
          v-if="hasActiveFilters"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="clearFilters"
          v-tooltip="'Limpiar filtros'"
        />
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!loading && invoices.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin comprobantes</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron comprobantes con los filtros seleccionados</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <!-- Barra del lote: solo con algo seleccionado -->
      <div
        v-if="selected.length > 0"
        class="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3"
      >
        <span class="text-sm font-medium text-gray-700">
          {{ selected.length }} seleccionado{{ selected.length === 1 ? '' : 's' }} ·
          {{ money(selectedTotal, 'PEN') }}
        </span>
        <Button label="Registrar cobro" icon="pi pi-check" size="small" @click="openPayment(selected)" />
        <Button label="Quitar selección" size="small" text severity="secondary" @click="selected = []" />
      </div>

      <DataTable
        v-model:selection="selected"
        :value="invoices"
        :loading="loading"
        dataKey="id"
        stripedRows
        class="p-datatable-sm"
      >
        <Column selectionMode="multiple" style="width: 3rem" />

        <Column header="Comprobante" style="min-width: 150px">
          <template #body="{ data: row }">
            <a
              v-if="row.pdf_url"
              :href="row.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              {{ row.number }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
            <span v-else class="text-sm text-gray-700 font-medium">{{ row.number }}</span>
            <div class="text-xs text-gray-400">{{ documentLabel(row) }} · {{ originLabel(row.origin) }}</div>
          </template>
        </Column>

        <Column header="Cliente" style="min-width: 220px">
          <template #body="{ data: row }">
            <router-link
              v-if="row.tienda_id"
              :to="`/stores/${row.tienda_id}`"
              class="text-sm text-gray-700 hover:text-primary-600"
            >
              {{ row.customer_name || '(sin nombre)' }}
            </router-link>
            <span v-else class="text-sm text-gray-700">{{ row.customer_name || '(sin nombre)' }}</span>
            <div class="text-xs text-gray-400 font-mono">{{ row.customer_document }}</div>
          </template>
        </Column>

        <Column header="Concepto" style="min-width: 200px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600 line-clamp-2">{{ row.concept }}</span>
            <span v-if="row.line_count > 1" class="text-xs text-gray-400">y {{ row.line_count - 1 }} línea(s) más</span>
          </template>
        </Column>

        <Column header="Emisión" style="width: 130px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.issue_date) }}</span>
            <div v-if="row.due_date && row.due_date !== row.issue_date" class="text-xs" :class="row.is_overdue ? 'text-red-600' : 'text-gray-400'">
              vence {{ formatDate(row.due_date) }}
            </div>
          </template>
        </Column>

        <Column header="Total" style="min-width: 120px">
          <template #body="{ data: row }">
            <span
              class="text-sm font-semibold block text-right tabular-nums"
              :class="row.status === 1 ? 'text-gray-800' : 'text-gray-400 line-through'"
            >
              {{ money(row.total, row.currency) }}
            </span>
            <span v-if="row.credited > 0" class="text-xs text-gray-400 block text-right">
              NC por {{ money(row.credited, row.currency) }}
            </span>
          </template>
        </Column>

        <Column header="Cobro" style="min-width: 190px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="paymentBadge(row).class"
            >
              {{ paymentBadge(row).label }}
            </span>
            <div v-if="paymentDetail(row)" class="text-xs text-gray-400 mt-0.5">{{ paymentDetail(row) }}</div>
          </template>
        </Column>

        <Column header="" style="width: 130px">
          <template #body="{ data: row }">
            <Button
              v-if="row.payment_status"
              :label="row.balance > 0 ? 'Registrar' : 'Corregir'"
              icon="pi pi-wallet"
              size="small"
              :outlined="row.balance > 0"
              :text="row.balance === 0"
              @click="openPayment([row])"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ meta.current_page }} de {{ meta.total_pages }} ({{ formatNumber(meta.total) }} comprobantes)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="meta.current_page <= 1"
            @click="goToPage(meta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== meta.current_page"
            :outlined="p === meta.current_page"
            rounded
            size="small"
            @click="goToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="meta.current_page >= meta.total_pages"
            @click="goToPage(meta.current_page + 1)"
          />
        </div>
      </div>
    </div>

    <!-- Registrar cobro -->
    <Dialog
      v-model:visible="paymentVisible"
      modal
      :header="paymentTargets.length === 1 ? `Cobro de ${paymentTargets[0].number}` : `Cobro de ${paymentTargets.length} comprobantes`"
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-3 text-sm">
          <template v-if="paymentTargets.length === 1">
            <div class="text-gray-700">{{ paymentTargets[0].customer_name }}</div>
            <div class="flex justify-between text-gray-500 mt-1">
              <span>Total del comprobante</span>
              <span class="font-semibold text-gray-800">{{ money(paymentTargets[0].total, paymentTargets[0].currency) }}</span>
            </div>
          </template>
          <div v-else class="flex justify-between text-gray-500">
            <span>{{ paymentTargets.length }} comprobantes</span>
            <span class="font-semibold text-gray-800">{{ money(targetsTotal, 'PEN') }}</span>
          </div>
          <p v-if="targetsFromPlans > 0" class="text-xs text-gray-500 mt-2">
            {{ targetsFromPlans === paymentTargets.length ? 'Es' : `${targetsFromPlans} son` }} de un plan: el cobro
            queda registrado también en la suscripción de la tienda.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Estado *</label>
          <SelectButton
            v-model="paymentForm.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
        </div>

        <template v-if="paymentForm.status === 'cobrado'">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Fecha del abono *</label>
              <Calendar v-model="paymentForm.date" dateFormat="yy-mm-dd" :maxDate="new Date()" showIcon class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Medio *</label>
              <Dropdown
                v-model="paymentForm.method"
                :options="PLAN_PAYMENT_METHODS"
                editable
                placeholder="BCP, Yape…"
                class="w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">N.º de operación</label>
              <InputText v-model="paymentForm.reference" maxlength="100" class="w-full" />
            </div>
            <div v-if="paymentTargets.length === 1">
              <label class="block text-sm font-medium text-gray-600 mb-1">Monto recibido</label>
              <InputNumber
                v-model="paymentForm.paid_amount"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :max="paymentTargets[0].total"
                :placeholder="paymentTargets[0].total.toFixed(2)"
                class="w-full"
              />
            </div>
          </div>
          <p v-if="paymentTargets.length === 1" class="text-xs text-gray-500">
            Deja el monto vacío si se recibió el total. Con detracción, anota lo que entró a la cuenta (el resto va al
            Banco de la Nación).
          </p>
        </template>

        <div v-else-if="paymentForm.status === 'pendiente'">
          <label class="block text-sm font-medium text-gray-600 mb-1">Vence el</label>
          <Calendar v-model="paymentForm.due_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
          <p class="text-xs text-gray-500 mt-1">Vacío conserva el vencimiento que ya tenía.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">
            Nota{{ paymentForm.status === 'incobrable' ? ' *' : '' }}
          </label>
          <Textarea
            v-model="paymentForm.note"
            rows="2"
            maxlength="255"
            class="w-full"
            :placeholder="paymentForm.status === 'incobrable' ? 'Por qué se da por incobrable' : 'Opcional'"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="paymentVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="savePayment" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { INVOICES_TABS } from '@/config/sections.config'
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { getLedgerInvoices, registerInvoicePayment, ledgerErrorMessage } from '@/api/ledger.api'
import { PLAN_PAYMENT_METHODS } from '@/config/plan-payment.config'
import { toIsoDate } from '@/utils/dates'
import type {
  InvoicePaymentFilter, InvoicePaymentInput, LedgerInvoice, LedgerInvoiceFilters, ReceivablesByCurrency, ReceivablesSummary
} from '@/types/ledger.types'

const toast = useToast()
const { formatDate, formatNumber } = useFormatters()

const invoices = ref<LedgerInvoice[]>([])
const summary = ref<ReceivablesSummary>({ by_currency: {}, debtors: [] })
const meta = ref({ current_page: 1, per_page: 25, total: 0, total_pages: 1 })
const loading = ref(false)
const error = ref<string | null>(null)
const selected = ref<LedgerInvoice[]>([])
const showDebtors = ref(false)

// --- Filtros ---
const currentYear = String(new Date().getFullYear())
const searchQuery = ref('')
const yearFilter = ref(currentYear)
const monthFilter = ref('')
// El desplegable no pinta una opción de valor vacío: "todos" lleva su propio valor.
const ALL = 'all'
const originFilter = ref(ALL)
const filters = reactive<LedgerInvoiceFilters>({ payment: 'all', period: currentYear, origin: '', search: '', page: 1 })

const yearOptions = [
  { label: 'Todos los años', value: ALL },
  ...Array.from({ length: 6 }, (_, i) => {
    const year = String(Number(currentYear) - i)
    return { label: year, value: year }
  })
]

const paymentOptions: { label: string; value: InvoicePaymentFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Sin cobrar', value: 'open' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Por confirmar', value: 'por_confirmar' },
  { label: 'Vencidos', value: 'vencido' },
  { label: 'Cobrados', value: 'cobrado' },
  { label: 'Incobrables', value: 'incobrable' }
]

const ORIGIN_LABELS: Record<string, string> = {
  suscripcion: 'Suscripción',
  comision: 'Comisión',
  importado: 'Emitido en Nubefact',
  manual: 'Emitido a mano',
  otros: 'Otros'
}
const originOptions = [
  { label: 'Todos los orígenes', value: ALL },
  ...Object.entries(ORIGIN_LABELS).map(([value, label]) => ({ label, value }))
]

function originLabel(origin: string): string {
  return ORIGIN_LABELS[origin] ?? origin
}

const hasActiveFilters = computed(() =>
  !!searchQuery.value || filters.payment !== 'all' || originFilter.value !== ALL || !!monthFilter.value || yearFilter.value !== currentYear
)

function money(amount: number, currency: string): string {
  const value = amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency === 'USD' ? 'US$' : 'S/'} ${value}`
}

function documentLabel(row: LedgerInvoice): string {
  return row.document_type === 3 ? 'Nota de crédito' : row.document_type === 2 ? 'Boleta' : 'Factura'
}

// --- Tarjetas ---
const EMPTY: ReceivablesByCurrency = {
  invoices: 0, invoiced: 0, pending_count: 0, pending: 0, unconfirmed_count: 0, unconfirmed: 0,
  overdue_count: 0, overdue: 0, paid_count: 0, paid: 0
}

const cards = computed(() => {
  const pen = summary.value.by_currency.PEN ?? EMPTY
  const usd = summary.value.by_currency.USD ?? EMPTY
  return [
    {
      filter: 'pendiente' as const, label: 'Por cobrar', color: 'text-orange-600',
      amount: pen.pending, usd: usd.pending, count: pen.pending_count + usd.pending_count,
      hint: 'Se sabe que no se han cobrado'
    },
    {
      filter: 'por_confirmar' as const, label: 'Por confirmar', color: 'text-gray-900',
      amount: pen.unconfirmed, usd: usd.unconfirmed, count: pen.unconfirmed_count + usd.unconfirmed_count,
      hint: 'Emitidos, sin dato de cobro'
    },
    {
      filter: 'vencido' as const, label: 'Vencido', color: 'text-red-600',
      amount: pen.overdue, usd: usd.overdue, count: pen.overdue_count + usd.overdue_count,
      hint: 'Pendientes, o a crédito con la fecha pasada'
    },
    {
      filter: 'cobrado' as const, label: 'Cobrado', color: 'text-green-600',
      amount: pen.paid, usd: usd.paid, count: pen.paid_count + usd.paid_count,
      hint: 'Importe facturado de lo ya cobrado'
    }
  ]
})

// --- Estado de cobro de cada fila ---
function paymentBadge(row: LedgerInvoice): { label: string; class: string } {
  if (row.status === 2) return { label: 'Anulado', class: 'bg-gray-100 text-gray-500' }
  if (row.status === 3) return { label: 'No aceptado', class: 'bg-gray-100 text-gray-500' }
  if (row.document_type === 3) return { label: 'Nota de crédito', class: 'bg-gray-100 text-gray-500' }
  if (row.credited >= row.total && row.total > 0) return { label: 'Anulado con NC', class: 'bg-gray-100 text-gray-500' }

  switch (row.payment_status) {
    case 'cobrado':
      return row.payment_source === 'supuesto'
        ? { label: 'Cobrado (supuesto)', class: 'bg-green-50 text-green-600' }
        : { label: 'Cobrado', class: 'bg-green-100 text-green-700' }
    case 'pendiente':
      return row.is_overdue
        ? { label: 'Vencido', class: 'bg-red-100 text-red-700' }
        : { label: 'Pendiente', class: 'bg-orange-100 text-orange-700' }
    case 'por_confirmar':
      return row.is_overdue
        ? { label: 'Por confirmar · vencido', class: 'bg-red-50 text-red-700' }
        : { label: 'Por confirmar', class: 'bg-amber-50 text-amber-700' }
    case 'incobrable':
      return { label: 'Incobrable', class: 'bg-gray-200 text-gray-700' }
    case 'sin_cargo':
      return { label: 'Sin cargo', class: 'bg-gray-100 text-gray-600' }
    default:
      return { label: '-', class: 'text-gray-300' }
  }
}

function paymentDetail(row: LedgerInvoice): string {
  if (row.payment_status === 'cobrado') {
    const parts = [
      row.payment_date ? formatDate(row.payment_date) : '',
      row.payment_method ?? '',
      row.payment_reference ? `op. ${row.payment_reference}` : '',
      row.paid_amount !== null && row.paid_amount !== row.total ? `recibido ${money(row.paid_amount, row.currency)}` : ''
    ].filter(Boolean)
    return parts.join(' · ')
  }
  if (row.balance > 0 && row.days_since_issue !== null) {
    return `hace ${row.days_since_issue} ${row.days_since_issue === 1 ? 'día' : 'días'}`
  }
  return row.payment_note ?? ''
}

// --- Carga ---
// Cada carga lleva su número: una respuesta lenta no pisa a la más reciente.
let loadSeq = 0

async function load() {
  const seq = ++loadSeq
  loading.value = true
  error.value = null
  filters.period = monthFilter.value || (yearFilter.value === ALL ? '' : yearFilter.value)
  filters.origin = originFilter.value === ALL ? '' : originFilter.value
  try {
    const res = await getLedgerInvoices(filters)
    if (seq !== loadSeq) return
    invoices.value = res.data ?? []
    summary.value = res.summary
    meta.value = res.meta
    selected.value = []
  } catch (e) {
    if (seq === loadSeq) error.value = ledgerErrorMessage(e)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function reload() {
  filters.page = 1
  load()
}

function goToPage(page: number) {
  filters.page = page
  load()
}

function applySearch() {
  filters.search = searchQuery.value
  reload()
}

function onYearChange() {
  monthFilter.value = ''
  reload()
}

function setPayment(value: InvoicePaymentFilter) {
  filters.payment = filters.payment === value ? 'all' : value
  reload()
}

function searchCustomer(debtor: { customer_document: string; customer_name: string }) {
  searchQuery.value = debtor.customer_document || debtor.customer_name
  filters.search = searchQuery.value
  filters.payment = 'open'
  reload()
}

function clearFilters() {
  searchQuery.value = ''
  monthFilter.value = ''
  yearFilter.value = currentYear
  filters.search = ''
  originFilter.value = ALL
  filters.payment = 'all'
  reload()
}

const visiblePages = computed(() => {
  const pages: number[] = []
  for (let i = Math.max(1, meta.value.current_page - 2); i <= Math.min(meta.value.total_pages, meta.value.current_page + 2); i++) {
    pages.push(i)
  }
  return pages
})

const selectedTotal = computed(() => selected.value.reduce((sum, row) => sum + (row.currency === 'PEN' ? row.total : 0), 0))

// --- Registrar cobro ---
const paymentVisible = ref(false)
const saving = ref(false)
const paymentTargets = ref<LedgerInvoice[]>([])
const paymentForm = reactive({
  status: 'cobrado' as InvoicePaymentInput['status'],
  date: new Date() as Date | null,
  method: '',
  reference: '',
  paid_amount: null as number | null,
  due_date: null as Date | null,
  note: ''
})

const statusOptions = [
  { label: 'Cobrado', value: 'cobrado' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Incobrable', value: 'incobrable' },
  { label: 'Por confirmar', value: 'por_confirmar' }
]

const targetsTotal = computed(() => paymentTargets.value.reduce((sum, row) => sum + (row.currency === 'PEN' ? row.total : 0), 0))
const targetsFromPlans = computed(() => paymentTargets.value.filter(row => row.plan_backed).length)

function openPayment(rows: LedgerInvoice[]) {
  // Anulados y notas de crédito no se cobran: se quedan fuera del lote.
  const targets = rows.filter(row => row.payment_status !== null)
  if (targets.length === 0) {
    toast.add({ severity: 'warn', summary: 'Nada que cobrar', detail: 'Lo seleccionado está anulado o es nota de crédito', life: 5000 })
    return
  }

  const single = targets.length === 1 ? targets[0] : null
  paymentTargets.value = targets
  paymentForm.status = 'cobrado'
  paymentForm.date = single?.payment_date ? new Date(`${single.payment_date}T00:00:00`) : new Date()
  paymentForm.method = single?.payment_method ?? ''
  paymentForm.reference = single?.payment_reference ?? ''
  paymentForm.paid_amount = single?.paid_amount ?? null
  paymentForm.due_date = null
  paymentForm.note = single?.payment_note ?? ''
  paymentVisible.value = true
}

async function savePayment() {
  const payload: InvoicePaymentInput = {
    invoice_ids: paymentTargets.value.map(row => row.id),
    status: paymentForm.status,
    note: paymentForm.note.trim() || undefined
  }

  if (paymentForm.status === 'cobrado') {
    if (!paymentForm.date || !paymentForm.method.trim()) {
      toast.add({ severity: 'warn', summary: 'Falta el cobro', detail: 'Indica la fecha del abono y el medio de pago', life: 5000 })
      return
    }
    payload.date = toIsoDate(paymentForm.date)
    payload.method = paymentForm.method.trim()
    payload.reference = paymentForm.reference.trim() || undefined
    if (paymentTargets.value.length === 1 && paymentForm.paid_amount) payload.paid_amount = paymentForm.paid_amount
  } else if (paymentForm.status === 'pendiente' && paymentForm.due_date) {
    payload.due_date = toIsoDate(paymentForm.due_date)
  } else if (paymentForm.status === 'incobrable' && !payload.note) {
    toast.add({ severity: 'warn', summary: 'Falta la nota', detail: 'Indica por qué se da por incobrable', life: 5000 })
    return
  }

  saving.value = true
  try {
    const res = await registerInvoicePayment(payload)
    const skipped = res.data.skipped.length
    toast.add({
      severity: skipped > 0 ? 'warn' : 'success',
      summary: res.message,
      detail: skipped > 0 ? `No se tocaron ${skipped}: ${res.data.skipped[0].reason}` : undefined,
      life: skipped > 0 ? 8000 : 4000
    })
    paymentVisible.value = false
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: ledgerErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
