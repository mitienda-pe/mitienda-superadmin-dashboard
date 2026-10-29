<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    modal
    :header="mode === 'invoice' ? 'Reenviar por correo' : 'Recordatorio de pago por correo'"
    :style="{ width: '44rem' }"
    @update:visible="close"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        <template v-if="mode === 'invoice'">
          Cada comprobante va en un correo a su cliente, con el PDF y el XML.
        </template>
        <template v-else>
          Un correo por cliente con sus comprobantes pendientes, el saldo y las cuentas donde pagar (las de Bancos con
          CCI). Los que están cobrados o por confirmar no se recuerdan.
        </template>
        Sale a nombre de miTienda; las respuestas llegan a facturacion@mitienda.pe.
      </p>

      <p v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Revisando destinatarios…</p>
      <p v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

      <template v-else-if="summary">
        <!-- Un solo cliente: se puede cambiar el destinatario -->
        <div v-if="canOverride">
          <label class="block text-sm font-medium text-gray-600 mb-1">Enviar a</label>
          <InputText v-model="override" type="email" class="w-full" :disabled="done" placeholder="correo@cliente.com" />
          <small class="text-gray-400">
            {{ summary.results[0]?.to ? 'Es el correo de su ficha; cámbialo si va a otra persona.' : 'El cliente no tiene correo en su ficha: escribe uno.' }}
          </small>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th class="pb-1">Cliente</th>
              <th class="pb-1">Comprobantes</th>
              <th class="pb-1">Correo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in summary.results" :key="i" class="border-t border-gray-100 align-top">
              <td class="py-1.5 pr-2 text-gray-700">{{ row.customer_name || row.customer_document }}</td>
              <td class="py-1.5 pr-2 text-gray-600 font-mono text-xs">{{ row.invoices.join(', ') }}</td>
              <td class="py-1.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="badge(row).class">
                  {{ badge(row).label }}
                </span>
                <div v-if="row.to && !canOverride" class="text-xs text-gray-500 mt-0.5 break-all">{{ row.to }}</div>
                <div v-if="row.status === 'failed' || row.status === 'skipped'" class="text-xs text-gray-400 mt-0.5">{{ row.message }}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-if="!done && summary.no_email > 0 && !canOverride" class="text-xs text-amber-700">
          {{ summary.no_email }} sin correo: agrégalo en la ficha del cliente (Clientes) y vuelve a intentarlo.
        </p>
      </template>
    </div>

    <template #footer>
      <Button :label="done ? 'Cerrar' : 'Cancelar'" text severity="secondary" @click="close(false)" />
      <Button
        v-if="!done"
        :label="sendCount === 1 ? 'Enviar 1 correo' : `Enviar ${sendCount} correos`"
        icon="pi pi-send"
        :loading="sending"
        :disabled="loading || sendCount === 0"
        @click="send"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import {
  ledgerErrorMessage, sendInvoiceEmails, sendPaymentReminderEmails,
  type InvoiceEmailResult, type InvoiceEmailSummary
} from '@/api/ledger.api'

const props = defineProps<{
  visible: boolean
  mode: 'invoice' | 'reminder'
  invoiceIds: number[]
}>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const toast = useToast()
const loading = ref(false)
const sending = ref(false)
const done = ref(false)
const error = ref('')
const summary = ref<InvoiceEmailSummary | null>(null)
const override = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Reenvío de comprobantes de un solo cliente: se puede corregir el correo. */
const canOverride = computed(() =>
  props.mode === 'invoice' && !!summary.value && new Set(summary.value.results.map(r => r.customer_document)).size === 1
)
const overrideChanged = computed(() => canOverride.value && override.value.trim() !== (summary.value?.results[0]?.to ?? ''))

const sendCount = computed(() => {
  if (!summary.value) return 0
  if (canOverride.value) return EMAIL_RE.test(override.value.trim()) ? summary.value.results.length : 0
  return summary.value.ready
})

function badge(row: InvoiceEmailResult) {
  switch (row.status) {
    case 'sent': return { label: 'Enviado', class: 'bg-green-100 text-green-700' }
    case 'failed': return { label: 'No se envió', class: 'bg-red-100 text-red-700' }
    case 'no_email': return { label: 'Sin correo', class: 'bg-amber-100 text-amber-700' }
    case 'skipped': return { label: 'No se recuerda', class: 'bg-gray-100 text-gray-500' }
    default: return { label: 'Listo', class: 'bg-primary/10 text-primary' }
  }
}

function request(preview: boolean) {
  if (props.mode === 'reminder') return sendPaymentReminderEmails(props.invoiceIds, { preview })
  return sendInvoiceEmails(props.invoiceIds, { preview, email: overrideChanged.value ? override.value.trim() : undefined })
}

async function load() {
  loading.value = true
  done.value = false
  error.value = ''
  summary.value = null
  try {
    summary.value = await request(true)
    override.value = summary.value.results[0]?.to ?? ''
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function send() {
  sending.value = true
  try {
    const result = await request(false)
    summary.value = result
    done.value = true
    const problems = result.failed + result.no_email
    toast.add({
      severity: problems > 0 ? 'warn' : 'success',
      summary: result.sent === 1 ? '1 correo enviado' : `${result.sent} correos enviados`,
      detail: problems > 0 ? `${problems} no se enviaron: revisa el detalle.` : undefined,
      life: 6000
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo enviar', detail: ledgerErrorMessage(e), life: 7000 })
  } finally {
    sending.value = false
  }
}

function close(value = false) {
  if (!value) emit('update:visible', false)
}

watch(() => props.visible, open => { if (open) load() })
</script>
