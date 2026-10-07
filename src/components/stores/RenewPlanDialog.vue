<template>
  <Dialog
    :visible="visible"
    modal
    :header="storeName ? `Renovar plan · ${storeName}` : 'Renovar plan'"
    :style="{ width: '34rem' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="loading" class="py-10 text-center text-sm text-gray-400">
      <i class="pi pi-spin pi-spinner mr-2"></i>Cargando plan vigente…
    </div>

    <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div v-else class="space-y-4">
      <p class="text-sm text-gray-500">
        Registra la venta: se crea un período nuevo extendiendo desde el vencimiento vigente
        y se preservan los módulos/add-ons (POS) de la tienda.
      </p>
      <div
        v-if="context?.is_trial"
        class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
      >
        La tienda está en prueba gratis: elige el plan que compró y completa los datos del receptor.
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Plan</label>
        <Dropdown
          v-model="form.plan_id"
          :options="plans"
          optionLabel="plan_titulo"
          optionValue="plan_id"
          placeholder="Seleccionar plan"
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Frecuencia</label>
        <SelectButton
          v-model="form.frequency"
          :options="frequencyOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
        />
        <p v-if="selectedPlan && !selectedDetail" class="text-xs text-amber-600 mt-1">
          Este plan no tiene precio {{ form.frequency === 'annual' ? 'anual' : 'mensual' }} publicado.
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Precio (PEN, con IGV)</label>
        <InputNumber
          v-model="form.price"
          mode="currency"
          currency="PEN"
          locale="es-PE"
          :minFractionDigits="2"
          class="w-full"
        />
        <p v-if="selectedDetail && form.price !== selectedDetail.precio" class="text-xs text-gray-500 mt-1">
          Precio de lista: S/ {{ selectedDetail.precio.toFixed(2) }}. Se propone lo que la tienda venía pagando.
        </p>
      </div>

      <!-- Receptor: lo que sale impreso en el comprobante -->
      <div class="rounded-lg border border-gray-200 p-3 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">Receptor del comprobante</span>
          <span class="text-xs text-gray-500">{{ documentKindLabel }}</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">RUC / DNI</label>
            <InputText v-model="form.document_number" maxlength="15" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Correo</label>
            <InputText v-model="form.email" type="email" maxlength="200" class="w-full" />
          </div>
        </div>
        <div v-if="isCompany">
          <label class="block text-sm font-medium text-gray-600 mb-1">Razón social *</label>
          <InputText v-model="form.business_name" maxlength="200" class="w-full" />
        </div>
        <div v-else class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Nombres *</label>
            <InputText v-model="form.first_name" maxlength="200" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
            <InputText v-model="form.last_name" maxlength="200" class="w-full" />
          </div>
        </div>
        <p v-if="!form.document_number.trim()" class="text-xs text-amber-600">
          Sin documento la venta se registra igual, pero no se podrá emitir el comprobante.
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Nota de pago</label>
        <Textarea
          v-model="form.payment_note"
          rows="2"
          class="w-full"
          placeholder="Ej: Transferencia BCP op. 12345 — 2026-07-10"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Cobro *</label>
        <SelectButton
          v-model="form.payment_status"
          :options="paymentStatusOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
        />
      </div>
      <template v-if="form.payment_status === 'cobrado'">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Fecha del abono *</label>
            <Calendar v-model="form.payment_date" dateFormat="yy-mm-dd" :maxDate="new Date()" showIcon class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Medio *</label>
            <Dropdown
              v-model="form.payment_method"
              :options="PLAN_PAYMENT_METHODS"
              editable
              placeholder="BCP, Yape…"
              class="w-full"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">N.º de operación</label>
          <InputText v-model="form.payment_reference" maxlength="100" class="w-full" />
        </div>
      </template>
      <div v-else-if="form.payment_status === 'pendiente'">
        <label class="block text-sm font-medium text-gray-600 mb-1">Fecha límite de pago *</label>
        <Calendar v-model="form.due_date" dateFormat="yy-mm-dd" :minDate="new Date()" showIcon class="w-full" />
        <p class="text-xs text-gray-500 mt-1">
          La tienda sigue activa hasta esa fecha. Si es factura, sale a crédito con esa fecha de vencimiento.
        </p>
      </div>
      <div class="bg-gray-50 rounded-lg p-3 text-sm">
        <div class="flex justify-between text-gray-500">
          <span>Vencimiento vigente</span>
          <span class="font-medium text-gray-700">{{ currentExpiryLabel }}</span>
        </div>
        <div class="flex justify-between text-gray-500 mt-1">
          <span>Nuevo vencimiento</span>
          <span class="font-semibold text-primary-700">{{ previewExpiryLabel }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text severity="secondary" @click="emit('update:visible', false)" />
      <Button
        :label="submitLabel"
        icon="pi pi-check"
        :loading="renewing"
        :disabled="loading || !!loadError || !selectedDetail"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import type { AvailablePlan, PlanPaymentUpdate } from '@/types/store.types'
import {
  getAvailablePlans,
  getRenewalContext,
  renewStorePlan,
  type PlanBillingData,
  type RenewalContext,
  type RenewStorePlanResult
} from '@/api/stores.api'
import { parseLocalDate, toIsoDate } from '@/utils/dates'
import { PLAN_PAYMENT_METHODS, CREDIT_DAYS_DEFAULT } from '@/config/plan-payment.config'

/**
 * Renovación manual de un plan: inserta el período nuevo y deja listos los
 * datos del receptor para emitir el comprobante. Lo usan la ficha de la tienda
 * y la cola "Por renovar" de Ventas de planes.
 */
const props = withDefaults(defineProps<{
  visible: boolean
  storeId: number | null
  storeName?: string
  submitLabel?: string
}>(), {
  storeName: '',
  submitLabel: 'Renovar'
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'renewed', result: RenewStorePlanResult): void
}>()

const toast = useToast()

const loading = ref(false)
const loadError = ref<string | null>(null)
const renewing = ref(false)
const context = ref<RenewalContext | null>(null)
const plans = ref<AvailablePlan[]>([])

const frequencyOptions = [
  { label: 'Mensual', value: 'monthly' as const },
  { label: 'Anual', value: 'annual' as const }
]
const paymentStatusOptions = [
  { label: 'Cobrado', value: 'cobrado' as const },
  { label: 'Pendiente de cobro', value: 'pendiente' as const }
]

const form = reactive({
  plan_id: null as number | null,
  frequency: 'monthly' as 'monthly' | 'annual',
  price: 0,
  document_number: '',
  business_name: '',
  first_name: '',
  last_name: '',
  email: '',
  // Sin valor inicial a propósito: hay que declarar si se cobró.
  payment_status: null as 'cobrado' | 'pendiente' | null,
  payment_date: new Date() as Date | null,
  payment_method: '',
  payment_reference: '',
  due_date: null as Date | null,
  payment_note: ''
})

const selectedPlan = computed<AvailablePlan | null>(
  () => plans.value.find(p => p.plan_id === form.plan_id) ?? null
)
const selectedDetail = computed(() => {
  const p = selectedPlan.value
  if (!p) return null
  return form.frequency === 'annual' ? p.annual : p.monthly
})

// Mismo criterio que el emisor: 11 dígitos = RUC = factura (13 en Ecuador).
const documentDigits = computed(() => form.document_number.replace(/\D/g, ''))
const isCompany = computed(() => [11, 13].includes(documentDigits.value.length))
const documentKindLabel = computed(() => {
  if (!documentDigits.value) return ''
  return isCompany.value ? 'Sale factura' : 'Sale boleta'
})

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const currentExpiryDate = computed<Date | null>(
  () => context.value?.expires_at ? parseLocalDate(context.value.expires_at) : null
)
const currentExpiryLabel = computed(
  () => currentExpiryDate.value ? formatDateLabel(currentExpiryDate.value) : '—'
)

// Inicio del período nuevo: el vencimiento vigente o hoy si ya venció. Es
// indicativo; el backend calcula la fecha final real.
const renewalStart = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cur = currentExpiryDate.value
  return cur && cur.getTime() >= today.getTime() ? new Date(cur) : today
})

const previewExpiryLabel = computed(() => {
  const base = new Date(renewalStart.value)
  if (form.frequency === 'annual') base.setFullYear(base.getFullYear() + 1)
  else base.setMonth(base.getMonth() + 1)
  return formatDateLabel(base)
})

function defaultDueDate(): Date {
  const d = new Date(renewalStart.value)
  d.setDate(d.getDate() + CREDIT_DAYS_DEFAULT)
  return d
}

// El precio sigue al plan/frecuencia elegidos, salvo en la carga inicial,
// donde se propone lo que la tienda venía pagando.
let prefilling = false
watch(selectedDetail, (detail) => {
  if (detail && !prefilling) form.price = detail.precio
})

async function load(storeId: number) {
  loading.value = true
  loadError.value = null
  context.value = null
  try {
    const [ctx, available] = await Promise.all([
      getRenewalContext(storeId),
      plans.value.length ? Promise.resolve(null) : getAvailablePlans()
    ])
    if (available?.data) plans.value = available.data
    context.value = ctx.data

    prefilling = true
    form.plan_id = ctx.data.plan_id
    form.frequency = ctx.data.frequency
    const sameDetail = !ctx.data.is_trial && selectedDetail.value
    form.price = sameDetail && ctx.data.price > 0 ? ctx.data.price : (selectedDetail.value?.precio ?? 0)
    Object.assign(form, ctx.data.billing)
    form.payment_note = ''
    form.payment_status = null
    form.payment_date = new Date()
    form.payment_method = ''
    form.payment_reference = ''
    form.due_date = defaultDueDate()
  } catch (e: any) {
    loadError.value = e?.response?.data?.messages?.error || e?.response?.data?.message
      || 'No se pudo cargar el plan vigente de la tienda'
  } finally {
    loading.value = false
    // El watcher corre después de este tick: se libera recién entonces.
    setTimeout(() => { prefilling = false })
  }
}

watch(() => props.visible, (open) => {
  if (open && props.storeId) load(props.storeId)
})

function warn(summary: string, detail: string): null {
  toast.add({ severity: 'warn', summary, detail, life: 5000 })
  return null
}

function buildPayment(): PlanPaymentUpdate | null {
  if (form.payment_status === 'cobrado') {
    if (!form.payment_date || !form.payment_method.trim()) {
      return warn('Falta el cobro', 'Indica la fecha del abono y el medio de pago')
    }
    return {
      status: 'cobrado',
      date: toIsoDate(form.payment_date),
      method: form.payment_method.trim(),
      reference: form.payment_reference.trim() || undefined
    }
  }

  if (form.payment_status === 'pendiente') {
    if (!form.due_date) return warn('Falta el cobro', 'Indica la fecha límite de pago')
    return { status: 'pendiente', due_date: toIsoDate(form.due_date) }
  }

  return warn('Falta el cobro', 'Indica si la renovación está cobrada o pendiente de cobro')
}

/** undefined = no se manda receptor y la fila hereda el anterior. */
function buildBilling(): PlanBillingData | undefined | null {
  const number = form.document_number.trim()
  if (!number) return undefined

  if (isCompany.value && !form.business_name.trim()) {
    return warn('Falta el receptor', 'Indica la razón social')
  }
  if (!isCompany.value && !form.first_name.trim()) {
    return warn('Falta el receptor', 'Indica el nombre de la persona')
  }

  return {
    document_number: number,
    // Una boleta va a nombre de la persona: se limpia la razón social heredada.
    business_name: isCompany.value ? form.business_name.trim() : '',
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim()
  }
}

async function submit() {
  const detail = selectedDetail.value
  if (!detail || !props.storeId) return

  const billing = buildBilling()
  if (billing === null) return

  const payment = buildPayment()
  if (!payment) return

  renewing.value = true
  try {
    const res = await renewStorePlan(props.storeId, {
      plandetalle_id: detail.plandetalle_id,
      price: form.price,
      payment_note: form.payment_note || undefined,
      payment,
      billing
    })
    const cobro = res.data.payment_status === 'pendiente' && res.data.payment_due_date
      ? ` · cobro pendiente hasta ${res.data.payment_due_date}`
      : ''
    toast.add({
      severity: 'success',
      summary: 'Plan renovado',
      detail: `Nuevo vencimiento: ${res.data.tiendaplan_fechafinal}${cobro}`,
      life: 5000
    })
    emit('update:visible', false)
    emit('renewed', res.data)
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.response?.data?.messages?.error || e?.response?.data?.message || 'No se pudo renovar el plan',
      life: 5000
    })
  } finally {
    renewing.value = false
  }
}
</script>
