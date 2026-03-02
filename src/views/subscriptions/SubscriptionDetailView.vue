<template>
  <div class="space-y-6">
    <!-- Back button -->
    <router-link to="/subscriptions" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
      <i class="pi pi-arrow-left text-xs"></i>
      Volver a Suscripciones
    </router-link>

    <!-- Loading -->
    <div v-if="store.detailLoading" class="space-y-4">
      <div class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="flex gap-6">
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div class="grid grid-cols-4 gap-4">
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.detailError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.detailError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="loadSubscription" />
    </div>

    <!-- Content -->
    <template v-else-if="sub">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column (2/3) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Header Card -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="text-xl font-bold text-gray-900">
                  {{ sub.tienda_nombre || `Tienda #${sub.tienda_id}` }}
                </h2>
                <p class="text-sm text-gray-500 mt-0.5">
                  {{ sub.plan?.name || 'Sin plan' }} &middot; Suscripción #{{ sub.id }}
                </p>
              </div>
              <SubscriptionStatusBadge :status="sub.status" />
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Monto</p>
                <p class="text-lg font-bold text-gray-900">{{ formatCurrency((sub.amount_centavos || 0) / 100) }}</p>
                <p class="text-xs text-gray-400">{{ sub.payment_type === 'automatic' ? 'Automático' : 'Manual' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Período Actual</p>
                <p class="text-sm font-semibold text-gray-900">{{ formatDate(sub.current_period_start) }}</p>
                <p class="text-xs text-gray-400">→ {{ formatDate(sub.current_period_end) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Próximo Cobro</p>
                <p class="text-sm font-semibold text-gray-900">{{ sub.next_charge_at ? formatDate(sub.next_charge_at) : '-' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Cobros Fallidos</p>
                <p class="text-lg font-bold" :class="sub.failed_charge_count > 0 ? 'text-red-600' : 'text-gray-900'">
                  {{ sub.failed_charge_count }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <TabView>
            <!-- Tab: Detalles -->
            <TabPanel header="Detalles">
              <div class="space-y-4 p-2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-3">
                    <h4 class="text-sm font-semibold text-gray-700">Información del Cliente</h4>
                    <div class="text-sm">
                      <span class="text-gray-400">Email:</span>
                      <span class="ml-2 text-gray-800">{{ sub.customer?.email || sub.customer_email || '-' }}</span>
                    </div>
                    <div class="text-sm">
                      <span class="text-gray-400">Nombre:</span>
                      <span class="ml-2 text-gray-800">{{ customerName }}</span>
                    </div>
                    <div class="text-sm">
                      <span class="text-gray-400">Documento:</span>
                      <span class="ml-2 text-gray-800">
                        {{ sub.customer?.document_type || '' }} {{ sub.customer?.document_number || '-' }}
                      </span>
                    </div>
                    <div class="text-sm">
                      <span class="text-gray-400">Gateway:</span>
                      <span class="ml-2 text-gray-800">{{ sub.customer?.gateway || '-' }}</span>
                    </div>
                  </div>
                  <div class="space-y-3">
                    <h4 class="text-sm font-semibold text-gray-700">Información del Plan</h4>
                    <div class="text-sm">
                      <span class="text-gray-400">Plan:</span>
                      <span class="ml-2 text-gray-800">{{ sub.plan?.name || '-' }} ({{ sub.plan?.slug || '' }})</span>
                    </div>
                    <div class="text-sm">
                      <span class="text-gray-400">Precio:</span>
                      <span class="ml-2 text-gray-800">
                        {{ sub.price ? `${formatCurrency(sub.price.amount_centavos / 100)} / ${sub.price.label || sub.price.interval_unit}` : '-' }}
                      </span>
                    </div>
                    <div class="text-sm">
                      <span class="text-gray-400">Límites:</span>
                      <span class="ml-2 text-gray-800">
                        {{ sub.plan?.max_products ?? '∞' }} productos,
                        {{ sub.plan?.max_pages ?? '∞' }} páginas,
                        {{ sub.plan?.max_users ?? '∞' }} usuarios
                      </span>
                    </div>
                    <div v-if="sub.payment_method" class="text-sm">
                      <span class="text-gray-400">Tarjeta:</span>
                      <span class="ml-2 text-gray-800">
                        {{ sub.payment_method.brand }} **** {{ sub.payment_method.last_four }}
                        ({{ sub.payment_method.exp_month }}/{{ sub.payment_method.exp_year }})
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Trial / Cancel Info -->
                <div v-if="sub.trial_starts_at || sub.canceled_at" class="border-t border-gray-100 pt-4 mt-4">
                  <div v-if="sub.trial_starts_at" class="text-sm mb-2">
                    <span class="text-gray-400">Trial:</span>
                    <span class="ml-2 text-gray-800">{{ formatDate(sub.trial_starts_at) }} → {{ formatDate(sub.trial_ends_at!) }}</span>
                  </div>
                  <div v-if="sub.canceled_at" class="text-sm mb-2">
                    <span class="text-gray-400">Cancelado:</span>
                    <span class="ml-2 text-gray-800">{{ formatDate(sub.canceled_at) }}</span>
                  </div>
                  <div v-if="sub.cancellation_reason" class="text-sm">
                    <span class="text-gray-400">Razón:</span>
                    <span class="ml-2 text-gray-800">{{ sub.cancellation_reason }}</span>
                  </div>
                </div>

                <div class="border-t border-gray-100 pt-4 mt-4">
                  <div class="text-sm">
                    <span class="text-gray-400">Creado:</span>
                    <span class="ml-2 text-gray-800">{{ formatDate(sub.created_at) }}</span>
                  </div>
                  <div v-if="sub.legacy_tiendaplan_id" class="text-sm mt-1">
                    <span class="text-gray-400">ID Legacy:</span>
                    <span class="ml-2 text-gray-800">#{{ sub.legacy_tiendaplan_id }}</span>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Tab: Cobros -->
            <TabPanel header="Cobros">
              <div v-if="!sub.charges || sub.charges.length === 0" class="text-center py-8 text-gray-400 text-sm">
                Sin cobros registrados
              </div>
              <DataTable
                v-else
                :value="sub.charges"
                stripedRows
                class="p-datatable-sm"
              >
                <Column header="Tipo" style="width: 100px">
                  <template #body="{ data: charge }">
                    <span class="text-sm text-gray-700 capitalize">{{ chargeTypeLabel(charge.charge_type) }}</span>
                  </template>
                </Column>
                <Column header="Monto" style="width: 100px">
                  <template #body="{ data: charge }">
                    <span class="text-sm font-semibold text-gray-800">{{ formatCurrency((charge.amount_centavos || 0) / 100) }}</span>
                  </template>
                </Column>
                <Column header="Estado" style="width: 120px">
                  <template #body="{ data: charge }">
                    <ChargeStatusBadge :status="charge.status" />
                  </template>
                </Column>
                <Column header="Gateway" style="width: 120px">
                  <template #body="{ data: charge }">
                    <span class="text-sm text-gray-600">{{ gatewayLabel(charge.gateway) }}</span>
                  </template>
                </Column>
                <Column header="Referencia" style="min-width: 120px">
                  <template #body="{ data: charge }">
                    <span class="text-sm text-gray-600">{{ charge.manual_reference || charge.gateway_payment_id || '-' }}</span>
                  </template>
                </Column>
                <Column header="Fecha" style="width: 120px">
                  <template #body="{ data: charge }">
                    <span class="text-sm text-gray-600">{{ formatDate(charge.charged_at || charge.created_at) }}</span>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <!-- Tab: Eventos -->
            <TabPanel header="Eventos">
              <div v-if="!sub.events || sub.events.length === 0" class="text-center py-8 text-gray-400 text-sm">
                Sin eventos registrados
              </div>
              <div v-else class="space-y-3 p-2 max-h-[500px] overflow-y-auto">
                <div
                  v-for="event in sub.events"
                  :key="event.id"
                  class="flex gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div class="shrink-0 mt-0.5">
                    <i
                      :class="event.event_type.includes('charge') ? 'pi pi-credit-card' : 'pi pi-arrow-right'"
                      class="text-sm text-gray-400"
                    ></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-medium text-gray-700 capitalize">{{ event.event_type.replace(/_/g, ' ') }}</span>
                      <span class="text-[10px] text-gray-400">{{ formatDate(event.created_at) }}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">{{ event.actor_type }}</span>
                    </div>
                    <p v-if="event.description" class="text-sm text-gray-600">{{ event.description }}</p>
                    <p v-if="event.from_status || event.to_status" class="text-xs text-gray-400 mt-1">
                      {{ event.from_status || '?' }} → {{ event.to_status || '?' }}
                    </p>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>

        <!-- Right column (1/3) -->
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Estado</h3>
            <SubscriptionStatusBadge :status="sub.status" />
            <p class="text-xs text-gray-400 mt-2">Última actualización: {{ formatDate(sub.updated_at) }}</p>
          </div>

          <!-- Actions Card -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Acciones</h3>
            <div class="space-y-2">
              <Button
                v-if="sub.status !== 'active'"
                label="Activar"
                icon="pi pi-check-circle"
                severity="success"
                size="small"
                class="w-full"
                :loading="store.actionLoading"
                @click="handleActivate"
              />
              <Button
                v-if="sub.status === 'active' || sub.status === 'trialing'"
                label="Suspender"
                icon="pi pi-pause"
                severity="warning"
                size="small"
                class="w-full"
                @click="showSuspendDialog = true"
              />
              <Button
                label="Registrar Pago"
                icon="pi pi-wallet"
                severity="info"
                size="small"
                class="w-full"
                @click="showPaymentDialog = true"
              />
            </div>
          </div>

          <!-- Quick Links -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Enlaces</h3>
            <div class="space-y-2">
              <router-link
                :to="`/stores/${sub.tienda_id}`"
                class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <i class="pi pi-shop text-gray-400"></i>
                Ver detalle de tienda
              </router-link>
              <a
                v-if="sub.tienda_slug"
                :href="`https://${sub.tienda_slug}.mitienda.pe`"
                target="_blank"
                class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <i class="pi pi-external-link text-gray-400"></i>
                Abrir storefront
              </a>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Suspend Dialog -->
    <Dialog
      v-model:visible="showSuspendDialog"
      header="Suspender Suscripción"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-yellow-500 text-xl mt-0.5"></i>
        <div>
          <p class="text-gray-900">
            ¿Estás seguro de suspender la suscripción de
            <strong>{{ sub?.tienda_nombre || `Tienda #${sub?.tienda_id}` }}</strong>?
          </p>
          <p class="text-sm text-gray-500 mt-2">
            La tienda perderá acceso a las funcionalidades del plan.
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showSuspendDialog = false" :disabled="store.actionLoading" />
        <Button label="Suspender" severity="warning" icon="pi pi-pause" :loading="store.actionLoading" @click="handleSuspend" />
      </template>
    </Dialog>

    <!-- Record Payment Dialog -->
    <Dialog
      v-model:visible="showPaymentDialog"
      header="Registrar Pago Manual"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
          <InputText
            v-model="paymentForm.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="49.00"
            class="w-full"
            :disabled="store.actionLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
          <Dropdown
            v-model="paymentForm.gateway"
            :options="gatewayOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar método"
            class="w-full"
            :disabled="store.actionLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Referencia / Nro. Operación</label>
          <InputText
            v-model="paymentForm.reference"
            placeholder="Ej: OP-123456"
            class="w-full"
            :disabled="store.actionLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <Textarea
            v-model="paymentForm.notes"
            placeholder="Notas adicionales..."
            rows="2"
            class="w-full"
            :autoResize="true"
            :disabled="store.actionLoading"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showPaymentDialog = false" :disabled="store.actionLoading" />
        <Button
          label="Registrar Pago"
          icon="pi pi-check"
          :loading="store.actionLoading"
          :disabled="!isPaymentFormValid"
          @click="handleRecordPayment"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import SubscriptionStatusBadge from '@/components/subscriptions/SubscriptionStatusBadge.vue'
import ChargeStatusBadge from '@/components/subscriptions/ChargeStatusBadge.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useFormatters } from '@/composables/useFormatters'
import { GATEWAY_LABELS, type ManualGateway } from '@/types/subscriptions.types'

const route = useRoute()
const store = useSubscriptionsStore()
const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

const sub = computed(() => store.currentSubscription)

// Dialogs
const showSuspendDialog = ref(false)
const showPaymentDialog = ref(false)

// Payment form
const paymentForm = ref({
  amount: '',
  gateway: '' as ManualGateway | '',
  reference: '',
  notes: '',
})

const gatewayOptions = [
  { label: 'Transferencia Bancaria', value: 'manual_transfer' },
  { label: 'Depósito Bancario', value: 'manual_deposit' },
  { label: 'Yape', value: 'manual_yape' },
  { label: 'Plin', value: 'manual_plin' },
  { label: 'Otro', value: 'manual_other' },
]

const isPaymentFormValid = computed(() =>
  paymentForm.value.amount &&
  Number(paymentForm.value.amount) > 0 &&
  paymentForm.value.gateway &&
  paymentForm.value.reference.trim()
)

const customerName = computed(() => {
  if (!sub.value?.customer) return '-'
  const { first_name, last_name } = sub.value.customer
  if (!first_name && !last_name) return '-'
  return [first_name, last_name].filter(Boolean).join(' ')
})

function chargeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    initial: 'Inicial',
    renewal: 'Renovación',
    refund: 'Reembolso',
    manual: 'Manual',
  }
  return labels[type] || type
}

function gatewayLabel(gateway: string): string {
  return GATEWAY_LABELS[gateway] || gateway
}

function loadSubscription() {
  const id = Number(route.params.id)
  if (id) {
    store.fetchDetail(id)
  }
}

async function handleActivate() {
  if (!sub.value) return
  const success = await store.activate(sub.value.id)
  if (success) {
    toast.add({ severity: 'success', summary: 'Suscripción activada', life: 2000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error al activar suscripción', life: 3000 })
  }
}

async function handleSuspend() {
  if (!sub.value) return
  const success = await store.suspend(sub.value.id)
  showSuspendDialog.value = false
  if (success) {
    toast.add({ severity: 'success', summary: 'Suscripción suspendida', life: 2000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error al suspender suscripción', life: 3000 })
  }
}

async function handleRecordPayment() {
  if (!sub.value || !isPaymentFormValid.value) return
  const success = await store.doRecordPayment(sub.value.id, {
    amount: Number(paymentForm.value.amount),
    gateway: paymentForm.value.gateway as ManualGateway,
    reference: paymentForm.value.reference.trim(),
    notes: paymentForm.value.notes.trim() || undefined,
  })
  showPaymentDialog.value = false
  if (success) {
    toast.add({ severity: 'success', summary: 'Pago registrado exitosamente', life: 2000 })
    paymentForm.value = { amount: '', gateway: '', reference: '', notes: '' }
  } else {
    toast.add({ severity: 'error', summary: 'Error al registrar pago', life: 3000 })
  }
}

onMounted(() => {
  loadSubscription()
})
</script>
