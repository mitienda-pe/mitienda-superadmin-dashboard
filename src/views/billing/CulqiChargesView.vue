<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Cobros de Culqi por revisar</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Cargos de suscripción que Culqi cobró y que no se aplicaron solos: no se supo de qué tienda eran, la tienda ya
        figuraba pagada o hubo un error. Si nadie los revisa, el cobro se pierde o se carga a mano dos veces. Revisa aquí
        antes de registrar a mano una venta pagada por Culqi.
      </p>
    </div>

    <p v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Cargando…</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div v-else-if="items.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
      <i class="pi pi-check-circle text-primary text-2xl mb-2 block"></i>
      No hay cobros de Culqi pendientes de revisar.
    </div>

    <div v-else class="space-y-4">
      <p class="text-sm text-gray-600">{{ items.length }} {{ items.length === 1 ? 'cobro' : 'cobros' }} por revisar</p>

      <div v-for="item in items" :key="item.event_id" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-lg font-semibold tabular-nums text-gray-900">{{ money(item) }}</span>
              <span class="text-sm text-gray-500">cobrado el {{ formatDate(item.charge_date) }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="STATUS[item.status].class">{{ STATUS[item.status].label }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ item.reason }}</p>
            <p class="text-xs text-gray-400 font-mono break-all">
              {{ item.charge_id ?? 'sin id de cargo' }}<template v-if="item.subscription_id"> · {{ item.subscription_id }}</template>
            </p>
          </div>
          <div class="text-right text-sm">
            <router-link v-if="tiendaOf(item)" :to="`/stores/${tiendaOf(item)!.id}`" class="text-primary hover:underline font-medium">
              {{ tiendaOf(item)!.name }} · tienda {{ tiendaOf(item)!.id }}
            </router-link>
            <span v-else class="text-amber-700 font-medium">Sin tienda</span>
            <div v-if="item.payer_email" class="text-xs text-gray-500">{{ item.payer_email }}</div>
          </div>
        </div>

        <!-- Sin tienda: se indica cuál es -->
        <div v-if="!item.tienda" class="flex flex-wrap items-end gap-2">
          <div>
            <label :for="`store-${item.event_id}`" class="block text-xs font-medium text-gray-600 mb-1">¿De qué tienda es?</label>
            <InputNumber v-model="state(item).storeId" :input-id="`store-${item.event_id}`" placeholder="N.º de tienda" :use-grouping="false" input-class="w-36" />
          </div>
          <Button label="Ver sus ventas" size="small" outlined :disabled="!state(item).storeId" :loading="state(item).loadingStore" @click="loadStore(item)" />
        </div>

        <!-- Ventas recientes de la tienda -->
        <div v-if="plansOf(item).length" class="overflow-x-auto border border-gray-100 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 w-8"></th>
                <th class="text-left px-3 py-2">Venta</th>
                <th class="text-left px-3 py-2">Período</th>
                <th class="text-left px-3 py-2">Comprobante</th>
                <th class="text-left px-3 py-2">Cobro</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in plansOf(item)" :key="plan.id" class="border-t border-gray-100" :class="{ 'text-gray-400': !plan.active }">
                <td class="px-3 py-2">
                  <RadioButton
                    v-model="state(item).planId"
                    :value="plan.id"
                    :input-id="`plan-${item.event_id}-${plan.id}`"
                    :disabled="!plan.active || !!plan.culqi_charge"
                  />
                </td>
                <td class="px-3 py-2">
                  <label :for="`plan-${item.event_id}-${plan.id}`">#{{ plan.id }} · {{ plan.plan }}</label>
                  <span v-if="!plan.active" class="ml-1 text-xs">(anulada)</span>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">{{ formatDate(plan.start) }} → {{ formatDate(plan.end) }}</td>
                <td class="px-3 py-2">{{ plan.invoice ?? '—' }}</td>
                <td class="px-3 py-2 text-xs">
                  <span v-if="plan.culqi_charge" class="font-mono">{{ plan.culqi_charge }}</span>
                  <span v-else-if="plan.paid_via" class="text-amber-700">{{ plan.paid_via }}, sin cargo enlazado</span>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="state(item).error" class="text-sm text-red-600">{{ state(item).error }}</p>

        <div v-if="state(item).dismissing" class="space-y-2">
          <label :for="`note-${item.event_id}`" class="block text-xs font-medium text-gray-600">¿Por qué se descarta?</label>
          <InputText :id="`note-${item.event_id}`" v-model="state(item).note" class="w-full" maxlength="255" placeholder="Ej. Cargo de prueba devuelto en Culqi" />
          <div class="flex gap-2">
            <Button label="Descartar cobro" size="small" severity="danger" :disabled="state(item).note.trim().length < 5" :loading="state(item).saving" @click="dismiss(item)" />
            <Button label="Cancelar" size="small" text severity="secondary" @click="state(item).dismissing = false" />
          </div>
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <Button
            v-if="item.charge_id"
            label="Es el cobro de la venta elegida"
            icon="pi pi-link"
            size="small"
            :disabled="!state(item).planId"
            :loading="state(item).saving"
            @click="link(item)"
          />
          <Button
            v-if="item.charge_id"
            label="Registrar renovación"
            icon="pi pi-refresh"
            size="small"
            outlined
            :disabled="!tiendaOf(item)"
            :loading="state(item).saving"
            v-tooltip.top="'Crea la venta del período siguiente al vencimiento vigente, cobrada con este cargo'"
            @click="renew(item)"
          />
          <Button label="Descartar" size="small" text severity="secondary" @click="state(item).dismissing = true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import {
  getPendingCulqiCharges, getCulqiChargeStorePlans, linkCulqiCharge, renewWithCulqiCharge, dismissCulqiCharge,
  culqiChargeErrorMessage, type CulqiChargeReviewItem, type CulqiChargePlanRow
} from '@/api/culqiCharges.api'

const toast = useToast()
const { formatDate } = useFormatters()

const STATUS: Record<CulqiChargeReviewItem['status'], { label: string; class: string }> = {
  unmatched: { label: 'Sin tienda asociada', class: 'bg-amber-50 text-amber-800' },
  already_covered: { label: 'La tienda ya figuraba pagada', class: 'bg-amber-50 text-amber-800' },
  error: { label: 'Error al procesar', class: 'bg-red-50 text-red-700' },
  rejected: { label: 'Culqi no lo confirmó', class: 'bg-red-50 text-red-700' }
}

interface ItemState {
  storeId: number | null
  store: { id: number; name: string } | null
  plans: CulqiChargePlanRow[]
  loadingStore: boolean
  planId: number | null
  saving: boolean
  dismissing: boolean
  note: string
  error: string | null
}

const items = ref<CulqiChargeReviewItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const states = reactive<Record<string, ItemState>>({})

function state(item: CulqiChargeReviewItem): ItemState {
  states[item.event_id] ??= {
    storeId: null, store: null, plans: [], loadingStore: false, planId: null, saving: false, dismissing: false, note: '', error: null
  }
  return states[item.event_id]
}

function tiendaOf(item: CulqiChargeReviewItem) {
  return item.tienda ?? state(item).store
}

function plansOf(item: CulqiChargeReviewItem) {
  return item.tienda ? item.plans : state(item).plans
}

function money(item: CulqiChargeReviewItem) {
  if (item.amount === null) return 'Monto desconocido'
  return `${item.currency === 'USD' ? 'US$' : 'S/'} ${item.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = (await getPendingCulqiCharges()).items
  } catch (e) {
    error.value = culqiChargeErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function loadStore(item: CulqiChargeReviewItem) {
  const s = state(item)
  if (!s.storeId) return
  s.loadingStore = true
  s.error = null
  try {
    const data = await getCulqiChargeStorePlans(s.storeId)
    s.store = data.tienda
    s.plans = data.plans
    s.planId = null
  } catch (e) {
    s.error = culqiChargeErrorMessage(e)
  } finally {
    s.loadingStore = false
  }
}

async function run(item: CulqiChargeReviewItem, action: () => Promise<{ message: string }>) {
  const s = state(item)
  s.saving = true
  s.error = null
  try {
    const res = await action()
    toast.add({ severity: 'success', summary: 'Cobro revisado', detail: res.message, life: 8000 })
    items.value = items.value.filter((i) => i.event_id !== item.event_id)
  } catch (e) {
    s.error = culqiChargeErrorMessage(e)
  } finally {
    s.saving = false
  }
}

function link(item: CulqiChargeReviewItem) {
  const s = state(item)
  if (!s.planId) return
  run(item, () => linkCulqiCharge(item.event_id, s.planId!, item.tienda ? undefined : s.store?.id))
}

function renew(item: CulqiChargeReviewItem) {
  run(item, () => renewWithCulqiCharge(item.event_id, item.tienda ? undefined : state(item).store?.id))
}

function dismiss(item: CulqiChargeReviewItem) {
  run(item, () => dismissCulqiCharge(item.event_id, state(item).note.trim()))
}

onMounted(load)
</script>
