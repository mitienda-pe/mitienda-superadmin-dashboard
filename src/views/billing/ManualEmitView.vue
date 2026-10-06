<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Emitir comprobante</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Factura o boleta de MiTienda para lo que no sale de un plan o de un cierre de comisiones. Un comprobante puede
        llevar varias líneas; cada línea se etiqueta para el reporte de ingresos y esas etiquetas no se imprimen.
      </p>
    </div>

    <!-- El entorno del emisor tiene que estar SIEMPRE a la vista -->
    <div
      v-if="status && !status.is_production"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <i class="pi pi-exclamation-triangle text-amber-500 mt-0.5"></i>
      <div class="text-sm">
        <p class="font-medium text-amber-900">Emisión en modo PRUEBAS</p>
        <p class="text-amber-800 mt-0.5">
          Los comprobantes se emiten contra el ambiente demo de Nubefact, no llegan a SUNAT y
          <strong>no quedan en el libro de ingresos</strong>.
        </p>
      </div>
    </div>

    <!-- Receptor -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-base font-semibold text-gray-800 mb-3">A quién se le factura</h2>

      <div v-if="client" class="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-gray-50 p-4">
        <div class="text-sm">
          <p class="font-semibold text-gray-900">{{ client.name }}</p>
          <p class="text-gray-600 font-mono">{{ client.document_number }}</p>
          <p class="text-gray-500">{{ client.address || 'Sin dirección fiscal' }}</p>
          <p class="text-gray-400 text-xs mt-1">{{ client.hint }}{{ client.email ? ' · ' + client.email : '' }}</p>
        </div>
        <Button label="Cambiar" severity="secondary" text size="small" @click="clearClient" />
      </div>

      <div v-else>
        <div class="flex flex-wrap items-center gap-3">
          <span class="p-input-icon-left flex-1 min-w-[240px]">
            <i class="pi pi-search" />
            <InputText
              v-model="clientSearch"
              placeholder="Buscar por razón social, RUC o nombre de la tienda..."
              class="w-full"
              @input="onClientSearch"
            />
          </span>
          <Button label="Nuevo cliente" icon="pi pi-plus" severity="secondary" outlined @click="openNewClient" />
        </div>

        <ul v-if="clientResults.length > 0" class="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
          <li
            v-for="result in clientResults"
            :key="result.type + result.id"
            class="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50"
            @click="selectClient(result)"
          >
            <div class="text-sm">
              <span class="font-medium text-gray-800">{{ result.name }}</span>
              <span class="ml-2 font-mono text-gray-500">{{ result.document_number }}</span>
            </div>
            <span class="text-xs text-gray-400">{{ result.hint }}</span>
          </li>
        </ul>
        <p v-else-if="clientSearch.trim().length >= 2 && !searching" class="mt-3 text-sm text-gray-500">
          Sin resultados. Si no es una tienda, créalo con "Nuevo cliente".
        </p>
      </div>
    </div>

    <!-- Comprobante -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex flex-wrap items-end gap-6">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <SelectButton
            v-model="documentType"
            :options="documentTypeOptions"
            optionLabel="label"
            optionValue="value"
            optionDisabled="disabled"
            :allowEmpty="false"
          />
        </div>
        <div class="flex items-center gap-2 pb-2">
          <Checkbox v-model="pricesIncludeTax" inputId="pricesIncludeTax" binary />
          <label for="pricesIncludeTax" class="text-sm text-gray-600">Los precios que escribo ya incluyen IGV</label>
        </div>
        <div v-if="documentType === 1" class="flex items-center gap-2 pb-2">
          <Checkbox v-model="onCredit" inputId="onCredit" binary />
          <label for="onCredit" class="text-sm text-gray-600">A crédito, vence el</label>
          <InputText v-model="creditDueDate" type="date" class="w-44" :disabled="!onCredit" :min="tomorrow" />
        </div>
      </div>
      <p v-if="client && !client.can_invoice" class="mt-3 text-sm text-amber-700">
        Este cliente tiene DNI: solo puede recibir boleta.
      </p>
    </div>

    <!-- Lineas -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="px-5 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-800">Líneas</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Si escribes un código ya usado, se proponen las etiquetas con las que se facturó antes.
        </p>
      </div>

      <div v-for="(line, index) in lines" :key="line.key" class="px-5 py-4 border-b border-gray-100">
        <div class="grid grid-cols-12 gap-3">
          <div class="col-span-12 md:col-span-2">
            <label class="block text-xs font-medium text-gray-500 mb-1">Código</label>
            <InputText
              v-model="line.code"
              class="w-full"
              maxlength="50"
              list="known-concepts"
              @change="suggestTags(line)"
            />
          </div>
          <div class="col-span-12 md:col-span-5">
            <label class="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <InputText v-model="line.description" class="w-full" maxlength="500" />
          </div>
          <div class="col-span-4 md:col-span-1">
            <label class="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
            <input v-model.number="line.quantity" type="number" min="0" step="any" class="p-inputtext p-component w-full" />
          </div>
          <div class="col-span-4 md:col-span-2">
            <label class="block text-xs font-medium text-gray-500 mb-1">
              Precio unitario {{ pricesIncludeTax ? 'con IGV' : 'sin IGV' }}
            </label>
            <input v-model.number="line.unit_price" type="number" min="0" step="any" class="p-inputtext p-component w-full" />
          </div>
          <div class="col-span-4 md:col-span-2 flex items-end justify-between gap-2">
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">Sin IGV</div>
              <div class="py-2.5 text-sm font-semibold tabular-nums text-gray-800">{{ formatCurrency(lineNet(line), 2) }}</div>
            </div>
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              :disabled="lines.length === 1"
              v-tooltip.left="'Quitar línea'"
              @click="lines.splice(index, 1)"
            />
          </div>
        </div>

        <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div v-for="dimension in activeDimensions" :key="dimension.id">
            <label class="block text-xs font-medium text-gray-500 mb-1">
              {{ dimension.name }}
              <span v-if="dimension.is_required" class="text-red-500">*</span>
            </label>
            <Dropdown
              v-model="line.tags[dimension.id]"
              :options="dimension.values.filter(v => v.is_active).map(v => ({ label: v.name, value: v.id }))"
              optionLabel="label"
              optionValue="value"
              placeholder="Sin etiqueta"
              :showClear="!dimension.is_required"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <datalist id="known-concepts">
        <option v-for="concept in concepts" :key="concept.code" :value="concept.code">{{ concept.samples[0] }}</option>
      </datalist>

      <div class="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <Button label="Agregar línea" icon="pi pi-plus" text size="small" @click="addLine" />
        <table class="text-sm">
          <tbody>
            <tr>
              <td class="pr-6 text-gray-500">Subtotal sin IGV</td>
              <td class="text-right tabular-nums text-gray-800">{{ formatCurrency(totals.net, 2) }}</td>
            </tr>
            <tr>
              <td class="pr-6 text-gray-500">IGV</td>
              <td class="text-right tabular-nums text-gray-800">{{ formatCurrency(totals.tax, 2) }}</td>
            </tr>
            <tr class="font-semibold">
              <td class="pr-6 pt-1 text-gray-900">Total</td>
              <td class="pt-1 text-right tabular-nums text-gray-900">{{ formatCurrency(totals.total, 2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Observaciones y accion -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <label class="block text-xs font-medium text-gray-500 mb-1">Observaciones (se imprimen en el comprobante)</label>
      <InputText v-model="observations" class="w-full" maxlength="500" />

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm" :class="blocker ? 'text-amber-700' : 'text-gray-400'">
          {{ blocker || 'Antes de emitir verás el comprobante armado para confirmarlo.' }}
        </p>
        <Button
          label="Revisar y emitir"
          icon="pi pi-arrow-right"
          iconPos="right"
          :disabled="!!blocker"
          :loading="previewing"
          @click="openPreview"
        />
      </div>
    </div>

    <!-- Confirmacion -->
    <Dialog v-model:visible="previewVisible" header="Confirmar emisión" modal :style="{ width: '34rem' }">
      <template v-if="preview">
        <dl class="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <dt class="text-gray-500">Comprobante</dt>
          <dd class="col-span-2 font-medium text-gray-900">
            {{ preview.document_type === 1 ? 'Factura' : 'Boleta' }} {{ preview.serie }}-{{ preview.next_number }}
            <span class="block text-xs font-normal text-gray-400">
              El número puede variar: se confirma con Nubefact al emitir.
            </span>
          </dd>
          <dt class="text-gray-500">Receptor</dt>
          <dd class="col-span-2 text-gray-900">
            {{ preview.client.name }}
            <span class="block font-mono text-gray-500">{{ preview.client.document_number }}</span>
          </dd>
          <dt class="text-gray-500">Dirección fiscal</dt>
          <dd class="col-span-2 text-gray-700">{{ preview.client.address || '-' }}</dd>
          <dt class="text-gray-500">Forma de pago</dt>
          <dd class="col-span-2 text-gray-700">
            {{ preview.credit_due_date ? `Crédito, vence el ${formatDate(preview.credit_due_date)}` : 'Contado' }}
          </dd>
          <dt class="text-gray-500">Subtotal</dt>
          <dd class="col-span-2 tabular-nums text-gray-700">{{ formatCurrency(preview.total_net, 2) }}</dd>
          <dt class="text-gray-500">IGV</dt>
          <dd class="col-span-2 tabular-nums text-gray-700">{{ formatCurrency(preview.total_tax, 2) }}</dd>
          <dt class="font-semibold text-gray-900">Total</dt>
          <dd class="col-span-2 tabular-nums font-semibold text-gray-900">{{ formatCurrency(preview.total, 2) }}</dd>
        </dl>

        <p v-if="preview.blocked_reason" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ preview.blocked_reason }}
        </p>
        <p v-else class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <template v-if="preview.is_production">
            Emitir es irreversible: consume el número de serie y llega a SUNAT.
          </template>
          <template v-else>Modo PRUEBAS: se emite en el ambiente demo y no queda en el libro.</template>
        </p>
      </template>
      <template #footer>
        <Button label="Volver" severity="secondary" text :disabled="emitting" @click="previewVisible = false" />
        <Button
          label="Emitir comprobante"
          icon="pi pi-file-check"
          :loading="emitting"
          :disabled="!preview?.can_emit"
          @click="emitInvoice"
        />
      </template>
    </Dialog>

    <!-- Resultado -->
    <Dialog v-model:visible="resultVisible" header="Comprobante emitido" modal :closable="false" :style="{ width: '30rem' }">
      <template v-if="result">
        <p class="text-lg font-semibold text-gray-900">{{ result.comprobante }}</p>
        <p class="mt-1 text-sm text-gray-600">
          {{ result.persisted ? 'Quedó registrado en el libro de ingresos con sus etiquetas.' : 'Emitido en modo PRUEBAS: no quedó en el libro.' }}
        </p>
        <a
          v-if="result.pdf_url"
          :href="result.pdf_url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
        >
          Abrir el PDF <i class="pi pi-external-link text-xs"></i>
        </a>
      </template>
      <template #footer>
        <Button label="Emitir otro" icon="pi pi-plus" @click="reset" />
      </template>
    </Dialog>

    <!-- Nuevo cliente -->
    <Dialog v-model:visible="newClientVisible" header="Nuevo cliente" modal :style="{ width: '30rem' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">RUC o DNI</label>
          <div class="flex gap-2">
            <InputText v-model="newClient.document_number" class="flex-1" maxlength="11" @keyup.enter="lookupDocument" />
            <Button label="Consultar" severity="secondary" outlined :loading="lookingUp" @click="lookupDocument" />
          </div>
          <p v-if="lookupMessage" class="mt-1 text-xs text-amber-700">{{ lookupMessage }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Razón social o nombre</label>
          <InputText v-model="newClient.name" class="w-full" maxlength="500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dirección fiscal</label>
          <InputText v-model="newClient.address" class="w-full" maxlength="500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
          <InputText v-model="newClient.email" type="email" class="w-full" maxlength="150" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="newClientVisible = false" />
        <Button
          label="Guardar y usar"
          icon="pi pi-check"
          :loading="savingClient"
          :disabled="!newClient.document_number.trim() || !newClient.name.trim()"
          @click="saveNewClient"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import {
  getPlatformInvoiceStatus, searchManualInvoiceClients, createManualInvoiceClient,
  lookupManualInvoiceDocument, previewManualInvoice, emitManualInvoice
} from '@/api/billing.api'
import { getLedgerDimensions, getLedgerConcepts, ledgerErrorMessage } from '@/api/ledger.api'
import type {
  PlatformInvoiceStatus, ManualInvoiceClient, ManualInvoiceInput, ManualInvoicePreview, ManualInvoiceResult
} from '@/types/billing.types'
import type { LedgerConcept, LedgerTagDimension } from '@/types/ledger.types'

const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

// El IGV solo se usa para mostrar totales mientras se escribe: los que valen
// son los que calcula el API en la confirmacion.
const IGV = 0.18

interface Line {
  key: number
  code: string
  description: string
  quantity: number
  unit_price: number
  tags: Record<number, number | null>
}

const status = ref<PlatformInvoiceStatus | null>(null)
const dimensions = ref<LedgerTagDimension[]>([])
const concepts = ref<LedgerConcept[]>([])

const activeDimensions = computed(() => dimensions.value.filter(d => d.is_active))

// --- Receptor ---
const client = ref<ManualInvoiceClient | null>(null)
const clientSearch = ref('')
const clientResults = ref<ManualInvoiceClient[]>([])
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchSeq = 0

function onClientSearch() {
  clearTimeout(searchTimer)
  const term = clientSearch.value.trim()
  if (term.length < 2) {
    clientResults.value = []
    return
  }

  searching.value = true
  searchTimer = setTimeout(async () => {
    // Solo cuenta la respuesta de la ultima busqueda: una lenta que llega tarde
    // no debe pisar a la mas reciente.
    const seq = ++searchSeq
    try {
      const results = await searchManualInvoiceClients(term)
      if (seq === searchSeq) clientResults.value = results
    } catch (e) {
      if (seq === searchSeq) toast.add({ severity: 'error', summary: 'No se pudo buscar', detail: ledgerErrorMessage(e), life: 6000 })
    } finally {
      if (seq === searchSeq) searching.value = false
    }
  }, 300)
}

function selectClient(selected: ManualInvoiceClient) {
  client.value = selected
  clientResults.value = []
  clientSearch.value = ''
}

function clearClient() {
  client.value = null
}

// --- Tipo y forma de pago ---
const documentType = ref<1 | 2>(1)
const pricesIncludeTax = ref(false)
const onCredit = ref(false)
const creditDueDate = ref('')
const observations = ref('')

const documentTypeOptions = computed(() => [
  { label: 'Factura', value: 1, disabled: !!client.value && !client.value.can_invoice },
  { label: 'Boleta', value: 2, disabled: false }
])

watch(client, value => {
  if (value && !value.can_invoice) documentType.value = 2
})

const tomorrow = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

// --- Lineas ---
let lineKey = 0

function emptyLine(): Line {
  return { key: ++lineKey, code: '', description: '', quantity: 1, unit_price: 0, tags: {} }
}

const lines = ref<Line[]>([emptyLine()])

function addLine() {
  const line = emptyLine()
  // La linea de negocio casi siempre es la misma en todo el comprobante.
  const previous = lines.value[lines.value.length - 1]
  const lineDimension = activeDimensions.value.find(d => d.slug === 'linea_negocio')
  if (previous && lineDimension && previous.tags[lineDimension.id]) {
    line.tags[lineDimension.id] = previous.tags[lineDimension.id]
  }
  lines.value.push(line)
}

/** Propone las etiquetas mas usadas con ese codigo, sin pisar las ya elegidas. */
function suggestTags(line: Line) {
  const concept = concepts.value.find(c => c.code === line.code.trim().toUpperCase())
  if (!concept) return

  for (const dimension of activeDimensions.value) {
    const usage = concept.tags[dimension.id]?.[0]
    const stillActive = usage && dimension.values.some(v => v.id === usage.value_id && v.is_active)
    if (stillActive && !line.tags[dimension.id]) line.tags[dimension.id] = usage.value_id
  }
}

function lineNet(line: Line): number {
  const amount = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0)
  return pricesIncludeTax.value ? amount / (1 + IGV) : amount
}

const totals = computed(() => {
  const net = lines.value.reduce((sum, line) => sum + lineNet(line), 0)
  return { net, tax: net * IGV, total: net * (1 + IGV) }
})

/** Lo primero que falta para poder emitir, o null si esta todo. */
const blocker = computed<string | null>(() => {
  if (!client.value) return 'Elige a quién se le factura.'

  for (const [i, line] of lines.value.entries()) {
    const n = lines.value.length > 1 ? ` de la línea ${i + 1}` : ''
    if (!line.description.trim()) return `Falta la descripción${n}.`
    if (!(Number(line.quantity) > 0)) return `La cantidad${n} debe ser mayor a cero.`
    if (!(Number(line.unit_price) > 0)) return `Falta el precio${n}.`
    const missing = activeDimensions.value.find(d => d.is_required && !line.tags[d.id])
    if (missing) return `Falta la etiqueta "${missing.name}"${n}.`
  }

  if (documentType.value === 1 && onCredit.value && !creditDueDate.value) return 'Indica la fecha límite de pago.'

  return null
})

function payload(): ManualInvoiceInput {
  return {
    document_type: documentType.value,
    client: { type: client.value!.type, id: client.value!.id },
    prices_include_tax: pricesIncludeTax.value,
    lines: lines.value.map(line => ({
      code: line.code.trim(),
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      tags: line.tags
    })),
    observations: observations.value.trim(),
    credit_due_date: documentType.value === 1 && onCredit.value ? creditDueDate.value : null
  }
}

// --- Confirmacion y emision ---
const previewVisible = ref(false)
const previewing = ref(false)
const preview = ref<ManualInvoicePreview | null>(null)
const emitting = ref(false)
const resultVisible = ref(false)
const result = ref<ManualInvoiceResult | null>(null)

async function openPreview() {
  previewing.value = true
  try {
    preview.value = await previewManualInvoice(payload())
    previewVisible.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Revisa el comprobante', detail: ledgerErrorMessage(e), life: 8000 })
  } finally {
    previewing.value = false
  }
}

async function emitInvoice() {
  emitting.value = true
  try {
    const res = await emitManualInvoice(payload())
    result.value = res.data
    previewVisible.value = false
    resultVisible.value = true
  } catch (e) {
    // El formulario se conserva: tras un rechazo se corrige y se reintenta.
    toast.add({ severity: 'error', summary: 'No se emitió', detail: ledgerErrorMessage(e), life: 12000 })
  } finally {
    emitting.value = false
  }
}

function reset() {
  resultVisible.value = false
  result.value = null
  preview.value = null
  client.value = null
  lines.value = [emptyLine()]
  observations.value = ''
  onCredit.value = false
  creditDueDate.value = ''
}

// --- Nuevo cliente ---
const newClientVisible = ref(false)
const savingClient = ref(false)
const lookingUp = ref(false)
const lookupMessage = ref('')
const newClient = reactive({ document_number: '', name: '', address: '', email: '' })

function openNewClient() {
  // Si lo que se busco parece un documento, se lleva al formulario.
  const digits = clientSearch.value.replace(/\D/g, '')
  newClient.document_number = digits.length === 8 || digits.length === 11 ? digits : ''
  newClient.name = ''
  newClient.address = ''
  newClient.email = ''
  lookupMessage.value = ''
  newClientVisible.value = true
}

async function lookupDocument() {
  const number = newClient.document_number.replace(/\D/g, '')
  if (number.length !== 8 && number.length !== 11) {
    lookupMessage.value = 'Un DNI tiene 8 dígitos y un RUC 11.'
    return
  }

  lookingUp.value = true
  lookupMessage.value = ''
  try {
    const found = await lookupManualInvoiceDocument(number)
    if (found.status === 'found' && found.data) {
      newClient.name = found.data.razonSocial || found.data.nombreCompleto || newClient.name
      newClient.address = found.data.direccion || newClient.address
    } else {
      lookupMessage.value = found.message || 'No se pudo consultar; completa los datos a mano.'
    }
  } catch (e) {
    lookupMessage.value = 'No se pudo consultar; completa los datos a mano.'
  } finally {
    lookingUp.value = false
  }
}

async function saveNewClient() {
  savingClient.value = true
  try {
    selectClient(await createManualInvoiceClient({
      document_number: newClient.document_number,
      name: newClient.name.trim(),
      address: newClient.address.trim(),
      email: newClient.email.trim()
    }))
    newClientVisible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: ledgerErrorMessage(e), life: 8000 })
  } finally {
    savingClient.value = false
  }
}

onMounted(async () => {
  try {
    const [platformStatus, tagDimensions] = await Promise.all([getPlatformInvoiceStatus(), getLedgerDimensions()])
    status.value = platformStatus
    dimensions.value = tagDimensions
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cargar', detail: ledgerErrorMessage(e), life: 8000 })
  }

  // Las sugerencias de etiquetas son una ayuda: si fallan, el formulario sirve igual.
  try {
    concepts.value = await getLedgerConcepts()
  } catch {
    concepts.value = []
  }
})
</script>
