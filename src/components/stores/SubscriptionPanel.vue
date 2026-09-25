<template>
  <div class="space-y-6">
    <!-- Current plan summary -->
    <div v-if="currentPlan" class="bg-white rounded-xl border border-gray-200 p-6">
      <h3 class="text-base font-semibold text-gray-800 mb-4">Plan Actual</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">Plan</p>
          <p class="text-lg font-bold text-gray-900">{{ currentPlan.name }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">Precio</p>
          <p class="text-lg font-bold text-gray-900">{{ formatCurrency(currentPlan.price) }}</p>
          <p class="text-xs text-gray-400">{{ periodLabel(currentPlan.period) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">MRR</p>
          <p class="text-lg font-bold text-primary-600">{{ formatCurrency(currentPlan.mrr) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">Vencimiento</p>
          <p class="text-lg font-bold" :class="currentPlan.days_remaining > 30 ? 'text-green-600' : currentPlan.days_remaining > 7 ? 'text-yellow-600' : 'text-red-600'">
            {{ currentPlan.days_remaining }} días
          </p>
          <p class="text-xs text-gray-400">{{ formatDate(currentPlan.expires_at) }}</p>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800">Historial de Suscripciones</h3>
      </div>
      <div class="p-5">
        <div v-if="paidHistory.length === 0" class="text-center text-gray-400 py-8">
          Sin historial de suscripciones
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="sub in paidHistory"
            :key="sub.id"
            class="flex items-start gap-4 p-4 rounded-lg border"
            :class="sub.status === 'active' ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'"
          >
            <div class="flex-shrink-0 mt-1">
              <div
                class="w-3 h-3 rounded-full"
                :class="sub.status === 'active' ? 'bg-green-500' : sub.status === 'expired' ? 'bg-gray-400' : 'bg-yellow-500'"
              ></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-gray-800">{{ sub.plan_name }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'expired' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'"
                  >{{ statusLabel(sub.status) }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="paymentClass(sub.payment.status)"
                    :title="paymentTitle(sub)"
                  >{{ paymentLabel(sub) }}</span>
                  <span v-if="sub.invoice" class="text-xs text-gray-500">
                    <i class="pi pi-file text-[10px]"></i> {{ sub.invoice }}
                  </span>
                  <span v-else-if="sub.price > 0" class="text-xs text-gray-400">Sin comprobante</span>
                </div>
                <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(sub.price) }}</span>
              </div>
              <div class="flex gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                <span>MRR: {{ formatCurrency(sub.mrr) }}</span>
                <span>{{ periodLabel(sub.period) }}</span>
                <span>{{ formatDate(sub.started_at) }} → {{ formatDate(sub.expires_at) }}</span>
                <span v-if="sub.registered_at">Registrado {{ formatDate(sub.registered_at) }}</span>
                <span v-if="sub.observation">Obs.: {{ sub.observation }}</span>
              </div>
              <p v-if="sub.expiry_mismatch && sub.expiry_diff_days !== null" class="mt-1 text-xs text-amber-700">
                <i class="pi pi-exclamation-triangle text-[10px]"></i>
                Vence {{ Math.abs(sub.expiry_diff_days) }} días {{ sub.expiry_diff_days > 0 ? 'después' : 'antes' }}
                de lo que corresponde a su duración ({{ formatDate(sub.expected_expires_at!) }}).
              </p>
              <div v-if="sub.price > 0 && sub.raw_status !== 9" class="mt-2 flex gap-2">
                <Button
                  v-if="sub.payment.status !== 'cobrado' || sub.payment.source === 'backfill'"
                  label="Confirmar cobro"
                  icon="pi pi-check"
                  size="small"
                  text
                  @click="openPaymentDialog(sub, 'cobrado')"
                />
                <Button
                  v-if="sub.payment.status === 'cobrado' || sub.payment.status === 'sin_clasificar'"
                  label="Marcar pendiente"
                  icon="pi pi-clock"
                  size="small"
                  text
                  severity="secondary"
                  @click="openPaymentDialog(sub, 'pendiente')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bitácora de vigencia -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <h3 class="text-base font-semibold text-gray-800">Cambios de vigencia</h3>
        <div v-if="changes" class="flex gap-4 text-xs">
          <span class="text-gray-500">
            Días agregados a mano: <strong class="text-amber-700">{{ changes.granted_days }}</strong>
          </span>
          <span class="text-gray-500">
            Días quitados: <strong class="text-gray-700">{{ changes.removed_days }}</strong>
          </span>
        </div>
      </div>
      <div class="p-5">
        <div v-if="changesLoading" class="text-center text-gray-400 py-6">Cargando…</div>
        <div v-else-if="changesError" class="text-center text-red-600 py-6 text-sm">{{ changesError }}</div>
        <div v-else-if="!changes || changes.changes.length === 0" class="text-center text-gray-400 py-6 text-sm">
          Sin cambios registrados. La bitácora empezó a registrar el {{ BITACORA_DESDE }}.
        </div>
        <DataTable v-else :value="changes.changes" :rows="20" paginator stripedRows class="p-datatable-sm">
          <Column header="Fecha">
            <template #body="{ data }">
              <span class="whitespace-nowrap text-xs">{{ data.created_at }}</span>
            </template>
          </Column>
          <Column header="Fila" field="plan_row_id" />
          <Column header="Cambio">
            <template #body="{ data }">
              <span class="text-xs">
                <strong>{{ fieldLabel(data.field) }}</strong>
                <template v-if="data.field === 'alta'">: {{ data.new_value }}</template>
                <template v-else>: {{ valueLabel(data.field, data.old_value) }} → {{ valueLabel(data.field, data.new_value) }}</template>
              </span>
            </template>
          </Column>
          <Column header="Días">
            <template #body="{ data }">
              <span
                v-if="data.days_delta !== null && data.field !== 'alta'"
                class="text-xs font-semibold"
                :class="data.days_delta > 0 ? 'text-amber-700' : 'text-gray-600'"
              >{{ data.days_delta > 0 ? '+' : '' }}{{ data.days_delta }}</span>
              <span v-else-if="data.field === 'alta' && data.days_delta !== null" class="text-xs text-gray-400">
                {{ data.days_delta }} de duración
              </span>
            </template>
          </Column>
          <Column header="Quién">
            <template #body="{ data }">
              <span class="text-xs">
                {{ data.user_name || originLabel(data.origin) }}
                <span v-if="data.origin === 'externo'" class="text-gray-400" :title="data.db_user || ''">(sin usuario)</span>
              </span>
            </template>
          </Column>
          <Column header="Motivo">
            <template #body="{ data }">
              <span class="text-xs text-gray-600">{{ data.reason || '—' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Confirmar cobro / marcar pendiente -->
    <Dialog
      v-model:visible="paymentDialog.visible"
      :header="paymentDialog.status === 'cobrado' ? 'Confirmar cobro' : 'Marcar como pendiente'"
      modal
      :style="{ width: '28rem' }"
    >
      <div v-if="paymentDialog.row" class="space-y-4">
        <p class="text-sm text-gray-600">
          {{ paymentDialog.row.plan_name }} · {{ formatCurrency(paymentDialog.row.price) }} ·
          {{ formatDate(paymentDialog.row.started_at) }} → {{ formatDate(paymentDialog.row.expires_at) }}
        </p>
        <template v-if="paymentDialog.status === 'cobrado'">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Fecha del abono *</label>
            <Calendar v-model="paymentDialog.date" dateFormat="yy-mm-dd" :maxDate="today" showIcon class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Medio *</label>
            <Dropdown
              v-model="paymentDialog.method"
              :options="PAYMENT_METHODS"
              editable
              placeholder="BCP, BBVA, Yape…"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">N.º de operación</label>
            <InputText v-model="paymentDialog.reference" maxlength="100" class="w-full" />
          </div>
        </template>
        <p v-else class="text-sm text-gray-600">
          La tienda sigue activa: esto solo registra que el dinero todavía no entró.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nota</label>
          <InputText v-model="paymentDialog.note" maxlength="255" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="paymentDialog.visible = false" />
        <Button
          :label="paymentDialog.status === 'cobrado' ? 'Confirmar' : 'Marcar pendiente'"
          :loading="paymentDialog.saving"
          @click="savePayment"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { getPlanChanges, updatePlanPayment } from '@/api/stores.api'
import { toIsoDate } from '@/utils/dates'
import type { PlanChangesResult, StorePlan, SubscriptionHistory } from '@/types/store.types'

const props = defineProps<{
  storeId: number
  currentPlan: StorePlan | null
  history: SubscriptionHistory[]
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

/** Día en que se desplegaron los triggers: antes de eso no hay bitácora. */
const BITACORA_DESDE = '25 de septiembre de 2026'
const PAYMENT_METHODS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Yape', 'Plin', 'Mercado Pago', 'Culqi']
const today = new Date()

// Los checkouts que nunca se pagaron (status 9) no son historia de suscripción.
const paidHistory = computed(() => props.history.filter(s => s.raw_status !== 9))

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo', expired: 'Vencido', inactive: 'Inactivo'
  }
  return labels[status] || status
}

function periodLabel(period: string): string {
  const labels: Record<string, string> = {
    mensual: 'Mensual', trimestre: 'Trimestral', semestre: 'Semestral', anual: 'Anual',
    months: 'Mensual', years: 'Anual', days: 'Días'
  }
  return labels[period] || period
}

function paymentLabel(sub: SubscriptionHistory): string {
  const p = sub.payment
  switch (p.status) {
    case 'cobrado':
      return p.source === 'backfill' ? 'Cobrado (sin verificar)' : 'Cobrado'
    case 'pendiente': return 'Pendiente de cobro'
    case 'incobrable': return 'Incobrable'
    case 'sin_cargo': return 'Sin cargo'
    default: return 'Cobro sin clasificar'
  }
}

function paymentTitle(sub: SubscriptionHistory): string {
  const p = sub.payment
  const parts = [p.method, p.date, p.reference ? `Op. ${p.reference}` : null].filter(Boolean)
  if (p.source === 'backfill') parts.push('Inferido de la observación, nadie lo confirmó')
  return parts.join(' · ')
}

function paymentClass(status: string): string {
  switch (status) {
    case 'cobrado': return 'bg-green-50 text-green-700 border border-green-200'
    case 'pendiente': return 'bg-amber-100 text-amber-800'
    case 'incobrable': return 'bg-red-100 text-red-700'
    case 'sin_cargo': return 'bg-gray-100 text-gray-500'
    default: return 'bg-gray-100 text-gray-600'
  }
}

// ── Bitácora ──────────────────────────────────────────────────────────────
const changes = ref<PlanChangesResult | null>(null)
const changesLoading = ref(false)
const changesError = ref<string | null>(null)

async function loadChanges() {
  changesLoading.value = true
  changesError.value = null
  try {
    const res = await getPlanChanges(props.storeId)
    changes.value = res.data
  } catch {
    changesError.value = 'No se pudo cargar la bitácora'
  } finally {
    changesLoading.value = false
  }
}

watch(() => props.storeId, loadChanges, { immediate: true })

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    alta: 'Alta', fechainicio: 'Inicio', fechafinal: 'Vencimiento', status: 'Estado',
    precio: 'Precio', plan_id: 'Plan', plandetalle_id: 'Tarifa', cobro_estado: 'Cobro'
  }
  return labels[field] || field
}

function valueLabel(field: string, value: string | null): string {
  if (value === null) return '—'
  if (field === 'cobro_estado') {
    const labels: Record<string, string> = { '0': 'pendiente', '1': 'cobrado', '2': 'incobrable', '3': 'sin cargo' }
    return labels[value] || value
  }
  if (field === 'status') {
    const labels: Record<string, string> = { '1': 'activa', '3': 'reemplazada', '9': 'sin completar' }
    return labels[value] || value
  }
  return value
}

function originLabel(origin: string | null): string {
  if (origin === 'externo') return 'Panel legacy / SQL'
  if (origin === 'comando') return 'Proceso automático'
  return origin || '—'
}

// ── Cobro ─────────────────────────────────────────────────────────────────
const paymentDialog = reactive({
  visible: false,
  saving: false,
  status: 'cobrado' as 'cobrado' | 'pendiente',
  row: null as SubscriptionHistory | null,
  date: null as Date | null,
  method: '',
  reference: '',
  note: ''
})

function openPaymentDialog(row: SubscriptionHistory, status: 'cobrado' | 'pendiente') {
  paymentDialog.row = row
  paymentDialog.status = status
  paymentDialog.date = new Date()
  paymentDialog.method = row.payment.method ?? ''
  paymentDialog.reference = row.payment.reference ?? ''
  paymentDialog.note = ''
  paymentDialog.visible = true
}

async function savePayment() {
  const row = paymentDialog.row
  if (!row) return

  if (paymentDialog.status === 'cobrado' && (!paymentDialog.date || !paymentDialog.method.trim())) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Indica la fecha del abono y el medio', life: 4000 })
    return
  }

  paymentDialog.saving = true
  try {
    await updatePlanPayment(props.storeId, row.id, paymentDialog.status === 'cobrado'
      ? {
          status: 'cobrado',
          date: toIsoDate(paymentDialog.date!),
          method: paymentDialog.method.trim(),
          reference: paymentDialog.reference.trim() || undefined,
          note: paymentDialog.note.trim() || undefined
        }
      : { status: 'pendiente', note: paymentDialog.note.trim() || undefined })

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: paymentDialog.status === 'cobrado' ? 'Cobro confirmado' : 'Marcado como pendiente',
      life: 3000
    })
    paymentDialog.visible = false
    emit('changed')
    loadChanges()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { messages?: { error?: string }; message?: string } } })
      ?.response?.data
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: msg?.messages?.error || msg?.message || 'No se pudo guardar',
      life: 5000
    })
  } finally {
    paymentDialog.saving = false
  }
}
</script>
