<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    header="Dar de baja ante SUNAT"
    modal
    :style="{ width: '34rem' }"
    :breakpoints="{ '640px': '96vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="loading" class="py-6 text-center text-sm text-gray-500">Revisando el comprobante…</div>
    <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
    <template v-else-if="preview">
      <dl class="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <dt class="text-gray-500">Comprobante</dt>
        <dd class="col-span-2 font-medium text-gray-900">
          {{ preview.document_type === 1 ? 'Factura' : 'Boleta' }} {{ preview.comprobante }}
        </dd>
        <dt class="text-gray-500">Cliente</dt>
        <dd class="col-span-2 text-gray-900">
          {{ preview.customer_name }}
          <span class="block font-mono text-gray-500">{{ preview.customer_document }}</span>
        </dd>
        <dt class="text-gray-500">Total</dt>
        <dd class="col-span-2 font-semibold tabular-nums text-gray-900">{{ money(preview.total) }}</dd>
        <dt class="text-gray-500">Emitida</dt>
        <dd class="col-span-2 text-gray-900">
          {{ formatDate(preview.issue_date) }}
          <span class="text-gray-500">
            · hace {{ preview.days }} {{ preview.days === 1 ? 'día' : 'días' }} · baja posible hasta el {{ formatDate(preview.deadline) }}
          </span>
        </dd>
      </dl>

      <div v-if="!preview.can_void" class="mt-4 space-y-2">
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ preview.blocked_reason }}</p>
        <p v-if="preview.credit_note_instead" class="text-sm text-gray-600">
          Para dejarlo sin efecto, emite la nota de crédito desde
          <router-link to="/billing/ledger" class="text-primary hover:underline" @click="emit('update:visible', false)">
            el libro de comprobantes
          </router-link>.
        </p>
      </div>

      <div v-else class="mt-4 space-y-4">
        <div>
          <label for="void-reason" class="block text-sm font-medium text-gray-700 mb-1">Motivo (se envía a SUNAT)</label>
          <InputText id="void-reason" v-model="reason" class="w-full" maxlength="100" placeholder="Ej. Monto errado: debió ser S/ 149" />
          <span class="text-xs text-gray-400">Entre 5 y 100 caracteres.</span>
        </div>
        <p v-if="preview.releases_plan" class="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Salió de una venta de plan: la venta vuelve a <b>pendiente de facturar</b> para emitirla de nuevo con el monto correcto.
          Si el error está en el precio del plan, corrígelo antes de volver a facturar.
        </p>
        <p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          La baja es irreversible: el comprobante queda anulado ante SUNAT y deja de contar como venta y como cuenta por cobrar.
        </p>
        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>
      </div>
    </template>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text :disabled="saving" @click="emit('update:visible', false)" />
      <Button
        v-if="preview?.can_void"
        label="Dar de baja"
        icon="pi pi-ban"
        severity="danger"
        :loading="saving"
        :disabled="reason.trim().length < 5"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useFormatters } from '@/composables/useFormatters'
import { previewInvoiceVoid, voidInvoice } from '@/api/billing.api'
import { ledgerErrorMessage } from '@/api/ledger.api'
import type { InvoiceVoidPreview } from '@/types/billing.types'

const props = defineProps<{ visible: boolean; invoiceId: number | null }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; voided: [message: string] }>()

const { formatDate } = useFormatters()

const preview = ref<InvoiceVoidPreview | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
const reason = ref('')
const saving = ref(false)
const saveError = ref<string | null>(null)

function money(value: number) {
  const symbol = preview.value?.currency === 'USD' ? 'US$' : 'S/'
  return `${symbol} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function load(id: number) {
  loading.value = true
  loadError.value = null
  saveError.value = null
  preview.value = null
  reason.value = ''
  try {
    preview.value = await previewInvoiceVoid(id)
  } catch (e) {
    loadError.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!preview.value) return
  saving.value = true
  saveError.value = null
  try {
    const res = await voidInvoice(preview.value.invoice_id, reason.value.trim())
    emit('voided', res.message)
    emit('update:visible', false)
  } catch (e) {
    saveError.value = ledgerErrorMessage(e)
  } finally {
    saving.value = false
  }
}

watch(() => [props.visible, props.invoiceId] as const, ([open, id]) => {
  if (open && id) load(id)
}, { immediate: true })
</script>
