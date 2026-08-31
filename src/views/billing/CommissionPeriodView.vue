<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Cierre de comisiones</h1>
      <p class="text-sm text-gray-500 mt-1">
        Comisiones del periodo calculadas sobre las ventas de cada comercio
      </p>
    </div>

    <!--
      El entorno del emisor tiene que estar SIEMPRE a la vista: en demo se emite
      igual, pero la comision no queda registrada.
    -->
    <div
      v-if="data && data.environment !== 'production'"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <i class="pi pi-exclamation-triangle text-amber-500 mt-0.5"></i>
      <div class="text-sm">
        <p class="font-medium text-amber-900">Emision en modo PRUEBAS</p>
        <p class="text-amber-800 mt-0.5">
          Los comprobantes salen contra el ambiente demo de Nubefact y
          <strong>la comision no queda registrada</strong>.
        </p>
      </div>
    </div>

    <!--
      A quien se le emite comision lo decide una persona, no este listado. El
      panel legacy mostraba todas las tiendas con ventas y el operador marcaba a
      mano; se replica ese criterio porque no esta escrito en ningun lado.
    -->
    <div class="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <i class="pi pi-info-circle text-primary mt-0.5"></i>
      <p class="text-sm text-gray-700">
        Este listado muestra <strong>todas</strong> las tiendas con ventas del periodo cuyo plan
        paga comision. Historicamente no se le emitia a todas: la seleccion es manual.
      </p>
    </div>

    <!-- Periodo + resumen -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">Periodo</label>
          <InputText v-model="period" type="month" class="w-44" @change="load" />
        </div>
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          :loading="loading"
          @click="load"
          v-tooltip="'Recalcular'"
        />
        <div v-if="data" class="flex-1 flex flex-wrap justify-end gap-6 text-sm">
          <div>
            <span class="text-gray-500">Tiendas con ventas:</span>
            <strong class="ml-1 text-gray-900">{{ data.rows.length }}</strong>
          </div>
          <div>
            <span class="text-gray-500">Sin facturar:</span>
            <strong class="ml-1 text-orange-500">{{ data.pendientes }}</strong>
          </div>
          <div>
            <span class="text-gray-500">Suma sin facturar:</span>
            <strong class="ml-1 text-gray-900">{{ formatCurrency(data.total_a_facturar) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !data" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <!-- Empty -->
    <div v-else-if="data && data.rows.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin comisiones en {{ period }}</p>
      <p class="text-sm text-gray-400 mt-1">Ninguna tienda con plan que pague comision tuvo ventas</p>
    </div>

    <!-- Tabla -->
    <div v-else-if="data" class="bg-white rounded-xl border border-gray-200">
      <!-- Barra del lote: solo aparece con algo seleccionado -->
      <div
        v-if="selectedIds.length > 0"
        class="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3"
      >
        <span class="text-sm font-medium text-gray-700">
          {{ selectedIds.length }} seleccionada{{ selectedIds.length === 1 ? '' : 's' }}
          · {{ formatCurrency(selectedTotal) }}
        </span>
        <div class="flex items-center gap-2">
          <Checkbox v-model="batchSendEmail" inputId="batchEmail" binary />
          <label for="batchEmail" class="text-sm text-gray-600">Enviar por correo al comercio</label>
        </div>
        <div class="flex-1"></div>
        <Button label="Limpiar" severity="secondary" text size="small" @click="selectedIds = []" />
        <Button
          label="Emitir seleccionadas"
          icon="pi pi-file-check"
          size="small"
          :loading="batchRunning"
          @click="confirmBatch"
        />
      </div>

      <DataTable :value="data.rows" dataKey="tienda_id" responsiveLayout="scroll" class="text-sm">
        <Column headerStyle="width: 3rem">
          <template #body="{ data: row }">
            <Checkbox
              v-if="row.can_emit"
              :modelValue="selectedIds.includes(row.tienda_id)"
              binary
              @update:modelValue="toggle(row.tienda_id)"
            />
          </template>
        </Column>

        <Column field="tienda" header="Tienda">
          <template #body="{ data: row }">
            <div class="font-medium text-gray-900">{{ row.tienda }}</div>
            <div class="text-xs text-gray-400">#{{ row.tienda_id }} · {{ row.plan || 'Sin plan' }}</div>
          </template>
        </Column>

        <Column field="base" header="Ventas del periodo">
          <template #body="{ data: row }">
            <span class="text-gray-900">{{ formatCurrency(row.base) }}</span>
            <span class="text-xs text-gray-400 ml-1">({{ row.ventas }})</span>
          </template>
        </Column>

        <Column field="rate" header="Tasa">
          <template #body="{ data: row }">
            {{ (row.rate * 100).toFixed(2) }}%
            <i
              v-if="row.rate_is_custom"
              class="pi pi-star-fill text-amber-400 text-[10px] ml-1"
              v-tooltip="'Tasa propia, no la del plan'"
            ></i>
          </template>
        </Column>

        <Column field="commission_with_tax" header="Comision (con IGV)">
          <template #body="{ data: row }">
            <span class="font-medium text-gray-900">{{ formatCurrency(row.commission_with_tax) }}</span>
          </template>
        </Column>

        <Column header="Estado">
          <template #body="{ data: row }">
            <span
              v-if="row.comprobante"
              class="inline-block rounded px-2 py-0.5 text-xs bg-green-50 text-green-700"
            >
              {{ row.comprobante }}
            </span>
            <span
              v-else-if="row.exonerated"
              class="inline-block rounded px-2 py-0.5 text-xs bg-purple-50 text-purple-700"
              v-tooltip="row.exoneration_reason || 'Sin motivo registrado'"
            >
              Exonerada
            </span>
            <span
              v-else-if="row.can_emit"
              class="inline-block rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600"
            >
              Sin facturar
            </span>
            <span v-else class="text-xs text-gray-500">{{ row.blocking_reason }}</span>
          </template>
        </Column>

        <Column headerStyle="width: 9rem">
          <template #body="{ data: row }">
            <div class="flex justify-end gap-1">
              <Button
                v-if="row.can_emit"
                label="Emitir"
                size="small"
                outlined
                :loading="previewingId === row.tienda_id"
                @click="openEmitDialog(row)"
              />
              <Button
                icon="pi pi-ban"
                size="small"
                :severity="row.exonerated ? 'help' : 'secondary'"
                text
                @click="openSettings(row)"
                v-tooltip="row.exonerated ? 'Quitar exoneracion' : 'Exonerar de comision'"
              />
              <Button
                v-if="row.tiendacomision_id"
                icon="pi pi-envelope"
                size="small"
                severity="secondary"
                text
                :loading="emailingId === row.tiendacomision_id"
                @click="sendEmail(row)"
                v-tooltip="'Enviar comprobante por correo'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Confirmacion de emision individual -->
    <Dialog v-model:visible="emitDialogVisible" header="Emitir comprobante" modal :style="{ width: '32rem' }">
      <div v-if="preview" class="space-y-3 text-sm">
        <div
          v-if="!preview.serie_active"
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800"
        >
          La serie {{ preview.serie }} esta inactiva: no se puede emitir hasta darla de alta.
        </div>

        <div class="grid grid-cols-3 gap-2">
          <span class="text-gray-500">Comprobante</span>
          <span class="col-span-2 font-medium">
            {{ preview.document_type_name }} {{ preview.serie }}-{{ preview.next_correlative }}
          </span>

          <span class="text-gray-500">Receptor</span>
          <span class="col-span-2">{{ preview.client?.business_name }}</span>

          <span class="text-gray-500">Documento</span>
          <span class="col-span-2">{{ preview.client?.document_number }}</span>

          <span class="text-gray-500">Periodo</span>
          <span class="col-span-2">{{ preview.period }}</span>

          <span class="text-gray-500">Ventas</span>
          <span class="col-span-2">{{ formatCurrency(preview.base || 0) }}</span>

          <span class="text-gray-500">Total</span>
          <span class="col-span-2 font-semibold">
            {{ preview.currency }} {{ (preview.total_with_tax || 0).toFixed(2) }}
          </span>
        </div>

        <p class="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Emitir es irreversible: consume correlativo y llega a SUNAT.
        </p>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="emitDialogVisible = false" />
        <Button
          label="Emitir"
          icon="pi pi-file-check"
          :loading="emitting"
          :disabled="!preview?.can_emit || !preview?.serie_active"
          @click="confirmEmit"
        />
      </template>
    </Dialog>

    <!-- Exoneracion -->
    <Dialog
      v-model:visible="settingsVisible"
      :header="settingsRow?.exonerated ? 'Quitar exoneracion' : 'Exonerar de comision'"
      modal
      :style="{ width: '30rem' }"
    >
      <div v-if="settingsRow" class="space-y-3 text-sm">
        <p class="text-gray-700">
          <strong>{{ settingsRow.tienda }}</strong> — plan {{ settingsRow.plan || 'sin plan' }},
          tasa {{ (settingsRow.rate * 100).toFixed(2) }}%.
        </p>

        <template v-if="settingsRow.exonerated">
          <p class="text-gray-600">
            Vuelve a la comision de su plan y aparecera como emitible en los proximos cierres.
          </p>
          <p v-if="settingsRow.exoneration_reason" class="text-xs text-gray-500">
            Motivo actual: {{ settingsRow.exoneration_reason }}
          </p>
        </template>

        <template v-else>
          <p class="text-gray-600">
            Deja de ofrecerse para emitir, en este periodo y en los siguientes, hasta que alguien
            la reactive. Sigue apareciendo en el listado, marcada.
          </p>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Motivo (obligatorio)</label>
            <InputText v-model="settingsMotivo" class="w-full" placeholder="Ej: acuerdo comercial 2026" />
          </div>
        </template>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="settingsVisible = false" />
        <Button
          :label="settingsRow?.exonerated ? 'Quitar exoneracion' : 'Exonerar'"
          :severity="settingsRow?.exonerated ? 'secondary' : 'help'"
          :loading="savingSettings"
          :disabled="!settingsRow?.exonerated && settingsMotivo.trim() === ''"
          @click="saveSettings"
        />
      </template>
    </Dialog>

    <!-- Resultado del lote -->
    <Dialog v-model:visible="batchResultVisible" header="Resultado del lote" modal :style="{ width: '38rem' }">
      <div v-if="batchResult" class="space-y-3 text-sm">
        <p class="text-gray-700">
          {{ batchResult.emitted }} emitida{{ batchResult.emitted === 1 ? '' : 's' }},
          {{ batchResult.failed }} con error, {{ batchResult.skipped }} omitida{{ batchResult.skipped === 1 ? '' : 's' }}<span
            v-if="batchResult.pending > 0"
          >, {{ batchResult.pending }} sin procesar</span>.
        </p>
        <div class="max-h-80 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
          <div v-for="r in batchResult.results" :key="r.tienda_id" class="flex items-center gap-3 px-3 py-2">
            <span class="rounded px-2 py-0.5 text-xs" :class="batchStatusClass(r.status)">
              {{ batchStatusLabel(r.status) }}
            </span>
            <span class="text-gray-500">#{{ r.tienda_id }}</span>
            <span class="text-gray-700 truncate">{{ r.comprobante || r.message }}</span>
          </div>
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
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useFormatters } from '@/composables/useFormatters'
import {
  getCommissionPeriod,
  previewCommissionInvoice,
  emitCommissionInvoice,
  emitCommissionsBatch,
  sendCommissionInvoiceEmail,
  updateCommissionSettings
} from '@/api/billing.api'
import type {
  CommissionPeriodResponse,
  CommissionPeriodRow,
  CommissionInvoicePreview,
  CommissionBatchResult
} from '@/types/billing.types'

const toast = useToast()
const confirm = useConfirm()
const { formatCurrency } = useFormatters()

const data = ref<CommissionPeriodResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/** El cierre se corre sobre el mes anterior: el actual todavia no termino. */
function previousMonth(): string {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
}

const period = ref(previousMonth())

async function load() {
  loading.value = true
  error.value = null
  selectedIds.value = []
  try {
    data.value = await getCommissionPeriod(period.value)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}

// --- Seleccion ---
// Checkbox por fila en vez del selectionMode de PrimeVue: el "seleccionar todo"
// de la cabecera marcaria decenas de comercios a los que historicamente no se
// les emitia, y emitir es irreversible.
const selectedIds = ref<number[]>([])

function toggle(tiendaId: number) {
  const i = selectedIds.value.indexOf(tiendaId)
  i === -1 ? selectedIds.value.push(tiendaId) : selectedIds.value.splice(i, 1)
}

const selectedTotal = computed(() =>
  (data.value?.rows ?? [])
    .filter(r => selectedIds.value.includes(r.tienda_id))
    .reduce((sum, r) => sum + r.commission_with_tax, 0)
)

// --- Emision individual ---
const emitDialogVisible = ref(false)
const preview = ref<CommissionInvoicePreview | null>(null)
const previewingId = ref<number | null>(null)
const emitting = ref(false)

async function openEmitDialog(row: CommissionPeriodRow) {
  previewingId.value = row.tienda_id
  preview.value = null
  try {
    // Se pide el preview ANTES de abrir para no mostrar un dialogo vacio si el
    // backend ya sabe que esa comision no se puede facturar.
    preview.value = await previewCommissionInvoice(row.tienda_id, period.value)
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

async function confirmEmit() {
  if (!preview.value) return

  emitting.value = true
  try {
    const res = await emitCommissionInvoice(preview.value.tienda_id, period.value)
    emitDialogVisible.value = false

    toast.add({
      // En demo se emitio de verdad pero la comision NO quedo registrada: no es
      // un exito completo y el mensaje no debe sugerir que la cola se cerro.
      severity: res.data.persisted ? 'success' : 'warn',
      summary: res.data.persisted ? 'Comprobante emitido' : 'Emitido en PRUEBAS',
      detail: res.message,
      life: 8000
    })

    if (res.data.persisted) load()
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

// --- Emision por lote ---
const batchSendEmail = ref(false)
const batchRunning = ref(false)
const batchResult = ref<CommissionBatchResult | null>(null)
const batchResultVisible = ref(false)

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
  const n = selectedIds.value.length
  confirm.require({
    header: 'Emitir en lote',
    message:
      `Se emitiran ${n} comprobante${n === 1 ? '' : 's'} por ${formatCurrency(selectedTotal.value)}` +
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
    const res = await emitCommissionsBatch(selectedIds.value, period.value, batchSendEmail.value)
    batchResult.value = res.data
    batchResultVisible.value = true
    load()
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

// --- Exoneracion ---
const settingsVisible = ref(false)
const settingsRow = ref<CommissionPeriodRow | null>(null)
const settingsMotivo = ref('')
const savingSettings = ref(false)

function openSettings(row: CommissionPeriodRow) {
  settingsRow.value = row
  settingsMotivo.value = ''
  settingsVisible.value = true
}

async function saveSettings() {
  if (!settingsRow.value) return

  const quitar = settingsRow.value.exonerated
  savingSettings.value = true
  try {
    // Al quitar la exoneracion no se manda tasa: la tienda vuelve entera a la
    // regla de su plan, que es lo que espera quien aprieta "quitar".
    const res = await updateCommissionSettings(settingsRow.value.tienda_id, {
      exonerada: !quitar,
      motivo: quitar ? undefined : settingsMotivo.value.trim()
    })
    settingsVisible.value = false
    toast.add({ severity: 'success', summary: 'Listo', detail: res.message, life: 6000 })
    load()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo guardar',
      detail: e?.response?.data?.message || e.message,
      life: 8000
    })
  } finally {
    savingSettings.value = false
  }
}

// --- Correo ---
const emailingId = ref<number | null>(null)

async function sendEmail(row: CommissionPeriodRow) {
  if (!row.tiendacomision_id) return

  emailingId.value = row.tiendacomision_id
  try {
    const res = await sendCommissionInvoiceEmail(row.tiendacomision_id)
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

onMounted(load)
</script>
