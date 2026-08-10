<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Ventas de Planes</h1>
      <p class="text-sm text-gray-500 mt-1">Renovaciones y pagos de suscripciones</p>
    </div>

    <!--
      El entorno del emisor tiene que estar SIEMPRE a la vista: en demo se emite
      igual, pero la suscripcion no queda marcada como facturada. Sin este aviso
      es facil creer que se cerro la cola cuando no se cerro.
    -->
    <div
      v-if="platformStatus && !platformStatus.is_production"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <i class="pi pi-exclamation-triangle text-amber-500 mt-0.5"></i>
      <div class="text-sm">
        <p class="font-medium text-amber-900">Emision en modo PRUEBAS</p>
        <p class="text-amber-800 mt-0.5">
          Los comprobantes se emiten contra el ambiente demo de Nubefact y
          <strong>no se marcan como facturados</strong>. Series
          {{ platformStatus.series.factura?.serie }} / {{ platformStatus.series.boleta?.serie }}.
        </p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total Ventas</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.planSalesSummary.total_ventas) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ store.planSalesSummary.count }} transacciones</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Facturado</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(store.planSalesSummary.total_facturado) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Pendiente Facturar</div>
        <div class="text-2xl font-bold text-orange-500 mt-1">{{ formatCurrency(store.planSalesSummary.total_pendiente) }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar tienda, referencia, RUC..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <InputText
          v-model="periodFilter"
          type="month"
          class="w-44"
          @change="applyFilters"
        />
        <Dropdown
          v-model="invoicedFilter"
          :options="invoicedOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Facturacion"
          class="w-44"
          @change="applyFilters"
        />
        <Dropdown
          v-model="planFilter"
          :options="planOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Plan"
          class="w-36"
          @change="applyFilters"
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

    <!-- Loading -->
    <div v-if="store.planSalesLoading && store.planSales.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.planSalesError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.planSalesError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchPlanSales()" />
    </div>

    <!-- Empty -->
    <div v-else-if="!store.planSalesLoading && store.planSales.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin ventas de planes</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron transacciones con los filtros seleccionados</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <!-- Barra de acciones del lote: solo aparece con algo seleccionado -->
      <div
        v-if="selectedPending.length > 0"
        class="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3"
      >
        <span class="text-sm font-medium text-gray-700">
          {{ selectedPending.length }} seleccionada{{ selectedPending.length === 1 ? '' : 's' }}
          sin facturar
        </span>
        <div class="flex items-center gap-2">
          <Checkbox v-model="batchSendEmail" inputId="batchSendEmail" binary />
          <label for="batchSendEmail" class="text-sm text-gray-600">Enviar por correo</label>
        </div>
        <Button
          label="Emitir seleccionadas"
          icon="pi pi-file-edit"
          size="small"
          class="ml-auto"
          :loading="batchRunning"
          @click="confirmBatch"
        />
      </div>

      <DataTable
        v-model:selection="selectedRows"
        :value="store.planSales"
        :loading="store.planSalesLoading"
        dataKey="id"
        stripedRows
        class="p-datatable-sm"
      >
        <Column selectionMode="multiple" style="width: 40px" />
        <Column field="tienda_nombre" header="Tienda" style="min-width: 180px">
          <template #body="{ data: row }">
            <router-link
              v-if="row.tienda_id"
              :to="`/stores/${row.tienda_id}`"
              class="text-primary-600 hover:underline font-medium"
            >
              {{ row.tienda_nombre }}
            </router-link>
            <span v-else class="text-sm text-gray-400">{{ row.tienda_nombre }}</span>
          </template>
        </Column>

        <Column field="plan" header="Plan" style="width: 90px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="planBadgeClass(row.plan)"
            >
              {{ row.plan }}
            </span>
          </template>
        </Column>

        <Column field="precio" header="Monto" style="min-width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">{{ formatCurrency(row.precio) }}</span>
          </template>
        </Column>

        <Column field="fecha_pago" header="Fecha Pago" style="width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.fecha_pago" class="text-sm text-gray-600">{{ formatDate(row.fecha_pago) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="fecha_final" header="Vigencia" style="width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.fecha_final" class="text-sm text-gray-600">{{ formatDate(row.fecha_final) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="referencia" header="Referencia" style="width: 120px">
          <template #body="{ data: row }">
            <span class="text-xs text-gray-500 font-mono">{{ row.referencia }}</span>
          </template>
        </Column>

        <Column field="documento" header="Documento" style="min-width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.documento" class="text-sm text-gray-600 font-mono">{{ row.documento }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="razon_social" header="Razon Social" style="min-width: 160px">
          <template #body="{ data: row }">
            <span v-if="row.razon_social" class="text-sm text-gray-700">{{ row.razon_social }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="sw_facturado" header="Facturado" style="width: 110px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.sw_facturado === 1 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'"
            >
              {{ row.sw_facturado === 1 ? 'Facturado' : 'Pendiente' }}
            </span>
          </template>
        </Column>

        <Column field="comprobante" header="Comprobante" style="width: 150px">
          <template #body="{ data: row }">
            <a
              v-if="row.pdf_url"
              :href="row.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              {{ row.comprobante }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
            <span v-else-if="row.comprobante" class="text-sm text-gray-600">{{ row.comprobante }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column header="" style="width: 140px">
          <template #body="{ data: row }">
            <Button
              v-if="row.sw_facturado !== 1"
              label="Emitir"
              icon="pi pi-file-edit"
              size="small"
              outlined
              :loading="previewingId === row.id"
              @click="openEmitDialog(row)"
            />
            <Button
              v-else
              label="Enviar"
              icon="pi pi-envelope"
              size="small"
              text
              :loading="emailingId === row.id"
              v-tooltip="'Enviar el comprobante por correo al comercio'"
              @click="sendEmail(row)"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="store.planSalesMeta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Pagina {{ store.planSalesMeta.current_page }} de {{ store.planSalesMeta.total_pages }}
          ({{ store.planSalesMeta.total }} registros)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="store.planSalesMeta.current_page <= 1"
            @click="store.planSalesGoToPage(store.planSalesMeta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== store.planSalesMeta.current_page"
            :outlined="p === store.planSalesMeta.current_page"
            rounded
            size="small"
            @click="store.planSalesGoToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="store.planSalesMeta.current_page >= store.planSalesMeta.total_pages"
            @click="store.planSalesGoToPage(store.planSalesMeta.current_page + 1)"
          />
        </div>
      </div>
    </div>

    <!--
      Confirmacion con el detalle real del comprobante. Emitir es irreversible
      (consume correlativo y llega a SUNAT), asi que el superadmin ve tipo de
      documento, receptor y total ANTES de apretar.
    -->
    <Dialog
      v-model:visible="emitDialogVisible"
      modal
      header="Emitir comprobante"
      :style="{ width: '520px' }"
    >
      <div v-if="preview" class="space-y-4">
        <div
          v-if="!preview.can_emit"
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {{ preview.blocking_reason }}
        </div>

        <div
          v-else-if="!preview.serie_active"
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          La serie {{ preview.serie }} esta inactiva. Se habilita recien cuando este
          dada de alta en Nubefact.
        </div>

        <dl class="divide-y divide-gray-100 text-sm">
          <div class="flex justify-between py-2">
            <dt class="text-gray-500">Tipo</dt>
            <dd class="font-medium text-gray-900">{{ preview.document_type_name }}</dd>
          </div>
          <div class="flex justify-between py-2">
            <dt class="text-gray-500">Comprobante</dt>
            <dd class="font-mono text-gray-900">
              {{ preview.serie }}-{{ String(preview.next_correlative ?? 0).padStart(8, '0') }}
            </dd>
          </div>
          <div class="flex justify-between py-2">
            <dt class="text-gray-500">Receptor</dt>
            <dd class="text-right font-medium text-gray-900">{{ preview.client.business_name }}</dd>
          </div>
          <div class="flex justify-between py-2">
            <dt class="text-gray-500">Documento</dt>
            <dd class="font-mono text-gray-900">{{ preview.client.document_number }}</dd>
          </div>
          <div class="flex justify-between py-2">
            <dt class="text-gray-500">Domicilio fiscal</dt>
            <dd class="text-right text-gray-700">{{ preview.client.address }}</dd>
          </div>
          <div class="flex justify-between py-2">
            <dt class="text-gray-500">Total (IGV incluido)</dt>
            <dd class="text-base font-bold text-gray-900">
              {{ formatCurrency(preview.total_with_tax) }}
            </dd>
          </div>
        </dl>

        <p v-if="preview.environment !== 'production'" class="text-xs text-amber-700">
          Entorno de pruebas: se emitira contra el demo de Nubefact y la suscripcion
          NO quedara marcada como facturada.
        </p>
      </div>

      <div v-else class="py-6 text-center text-sm text-gray-400">Cargando...</div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="emitDialogVisible = false" />
        <Button
          label="Emitir"
          icon="pi pi-check"
          :loading="emitting"
          :disabled="!preview?.can_emit || !preview?.serie_active"
          @click="confirmEmit"
        />
      </template>
    </Dialog>

    <!-- Resultado del lote: detalle por item, para que quede claro que salio -->
    <Dialog
      v-model:visible="batchResultVisible"
      modal
      header="Resultado de la emision"
      :style="{ width: '640px' }"
    >
      <div v-if="batchResult" class="space-y-4">
        <div class="flex flex-wrap gap-4 text-sm">
          <span class="font-medium text-green-700">{{ batchResult.emitted }} emitidas</span>
          <span v-if="batchResult.failed" class="font-medium text-red-700">
            {{ batchResult.failed }} con error
          </span>
          <span v-if="batchResult.skipped" class="font-medium text-gray-500">
            {{ batchResult.skipped }} omitidas
          </span>
          <span v-if="batchResult.pending" class="font-medium text-amber-700">
            {{ batchResult.pending }} sin procesar
          </span>
        </div>

        <div
          v-if="batchResult.pending"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Se agoto el tiempo del proceso. Las {{ batchResult.pending }} restantes
          <strong>no se emitieron</strong>: volve a seleccionarlas y emitilas en otro lote.
        </div>

        <div class="max-h-80 overflow-y-auto rounded-lg border border-gray-100">
          <table class="w-full text-sm">
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in batchResult.results" :key="item.tiendaplan_id">
                <td class="px-3 py-2 font-mono text-xs text-gray-400">#{{ item.tiendaplan_id }}</td>
                <td class="px-3 py-2">
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="batchStatusClass(item.status)"
                  >
                    {{ batchStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-3 py-2 text-gray-700">
                  <span v-if="item.comprobante" class="font-mono">{{ item.comprobante }}</span>
                  <span v-else>{{ item.message }}</span>
                  <span v-if="item.email_error" class="block text-xs text-amber-700">
                    Comprobante emitido, pero el correo no salio: {{ item.email_error }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" @click="batchResultVisible = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useBillingStore } from '@/stores/billing.store'
import { useFormatters } from '@/composables/useFormatters'
import {
  getPlatformInvoiceStatus,
  previewPlanSaleInvoice,
  emitPlanSaleInvoice,
  emitPlanSalesBatch,
  sendPlanSaleInvoiceEmail
} from '@/api/billing.api'
import type {
  PlanSaleItem,
  PlatformInvoiceStatus,
  PlatformInvoicePreview,
  PlatformBatchResult
} from '@/types/billing.types'

const store = useBillingStore()
const toast = useToast()
const confirm = useConfirm()
const { formatCurrency, formatDate } = useFormatters()

// --- Emision de comprobantes de plataforma ---
const platformStatus = ref<PlatformInvoiceStatus | null>(null)
const emitDialogVisible = ref(false)
const preview = ref<PlatformInvoicePreview | null>(null)
const previewingId = ref<number | null>(null)
const emitting = ref(false)

async function openEmitDialog(row: PlanSaleItem) {
  previewingId.value = row.id
  preview.value = null
  try {
    // Se pide el preview ANTES de abrir para no mostrar un dialogo vacio si el
    // backend ya sabe que esa fila no se puede facturar.
    preview.value = await previewPlanSaleInvoice(row.id)
    emitDialogVisible.value = true
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo preparar el comprobante',
      detail: e?.response?.data?.message || e.message,
      life: 6000
    })
  } finally {
    previewingId.value = null
  }
}

// --- Emision por lote ---
const selectedRows = ref<PlanSaleItem[]>([])
const batchSendEmail = ref(false)
const batchRunning = ref(false)
const batchResult = ref<PlatformBatchResult | null>(null)
const batchResultVisible = ref(false)
const emailingId = ref<number | null>(null)

// Solo las pendientes: seleccionar una ya facturada no deberia sumar al lote
// (el backend la omitiria igual, pero el contador mentiria sobre cuantas se van
// a emitir).
const selectedPending = computed(() => selectedRows.value.filter(r => r.sw_facturado !== 1))

function batchStatusLabel(status: string): string {
  return { emitted: 'Emitida', failed: 'Error', skipped: 'Omitida' }[status] || status
}

function batchStatusClass(status: string): string {
  return {
    emitted: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    skipped: 'bg-gray-100 text-gray-600'
  }[status] || 'bg-gray-100 text-gray-600'
}

function confirmBatch() {
  const n = selectedPending.value.length
  confirm.require({
    header: 'Emitir en lote',
    message:
      `Se emitiran ${n} comprobante${n === 1 ? '' : 's'}` +
      (batchSendEmail.value ? ' y se enviaran por correo al comercio' : '') +
      '. Emitir es irreversible: consume correlativo y llega a SUNAT.',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Emitir',
    rejectLabel: 'Cancelar',
    accept: runBatch
  })
}

async function runBatch() {
  batchRunning.value = true
  try {
    const res = await emitPlanSalesBatch(
      selectedPending.value.map(r => r.id),
      batchSendEmail.value
    )
    batchResult.value = res.data
    batchResultVisible.value = true
    selectedRows.value = []
    store.fetchPlanSales()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo emitir el lote',
      detail: e?.response?.data?.message || e.message,
      life: 8000
    })
  } finally {
    batchRunning.value = false
  }
}

async function sendEmail(row: PlanSaleItem) {
  emailingId.value = row.id
  try {
    const res = await sendPlanSaleInvoiceEmail(row.id)
    toast.add({ severity: 'success', summary: 'Correo enviado', detail: res.message, life: 6000 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo enviar',
      detail: e?.response?.data?.message || e.message,
      life: 8000
    })
  } finally {
    emailingId.value = null
  }
}

async function confirmEmit() {
  if (!preview.value) return

  emitting.value = true
  try {
    const res = await emitPlanSaleInvoice(preview.value.tiendaplan_id)
    emitDialogVisible.value = false

    toast.add({
      // En demo se emitio de verdad pero la fila NO quedo marcada: no es un
      // exito completo y el mensaje no debe sugerir que la cola se cerro.
      severity: res.data.persisted ? 'success' : 'warn',
      summary: res.data.persisted ? 'Comprobante emitido' : 'Emitido en PRUEBAS',
      detail: res.message,
      life: 8000
    })

    if (res.data.persisted) store.fetchPlanSales()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo emitir',
      detail: e?.response?.data?.message || e.message,
      life: 8000
    })
  } finally {
    emitting.value = false
  }
}

function getPreviousMonth(): string {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const y = prev.getFullYear()
  const m = String(prev.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const searchQuery = ref('')
const periodFilter = ref(getPreviousMonth())
const invoicedFilter = ref('all')
const planFilter = ref('')

const invoicedOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Facturado', value: 'yes' },
  { label: 'Pendiente', value: 'no' }
]

const planOptions = [
  { label: 'Todos', value: '' },
  { label: 'Micro', value: 'micro' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' }
]

const hasActiveFilters = computed(() =>
  searchQuery.value || periodFilter.value || invoicedFilter.value !== 'all' || planFilter.value
)

const visiblePages = computed(() => {
  const current = store.planSalesMeta.current_page
  const total = store.planSalesMeta.total_pages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function planBadgeClass(plan: string): string {
  const classes: Record<string, string> = {
    Micro: 'bg-gray-100 text-gray-600',
    Small: 'bg-blue-50 text-blue-700',
    Medium: 'bg-purple-50 text-purple-700',
    Large: 'bg-amber-50 text-amber-700'
  }
  return classes[plan] || 'bg-gray-100 text-gray-600'
}

function applySearch() {
  store.updatePlanSalesFilters({ search: searchQuery.value })
}

function applyFilters() {
  store.updatePlanSalesFilters({
    search: searchQuery.value,
    period: periodFilter.value,
    invoiced: invoicedFilter.value,
    plan: planFilter.value
  })
}

function clearFilters() {
  searchQuery.value = ''
  periodFilter.value = ''
  invoicedFilter.value = 'all'
  planFilter.value = ''
  store.updatePlanSalesFilters({ search: '', period: '', invoiced: 'all', plan: '', page: 1 })
}

onMounted(async () => {
  store.updatePlanSalesFilters({ period: periodFilter.value })

  try {
    platformStatus.value = await getPlatformInvoiceStatus()
  } catch {
    // Si el estado no carga, la tabla sigue funcionando: solo se pierde el
    // aviso de entorno. No vale romper la vista por eso.
  }
})
</script>
