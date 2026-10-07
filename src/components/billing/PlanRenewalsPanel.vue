<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Vencidos</div>
        <div class="text-2xl font-bold text-red-600 mt-1">{{ summary.expired }}</div>
        <div class="text-xs text-gray-400 mt-1">en los últimos {{ filters.days }} días</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Por vencer</div>
        <div class="text-2xl font-bold text-orange-500 mt-1">{{ summary.upcoming }}</div>
        <div class="text-xs text-gray-400 mt-1">en los próximos {{ filters.days }} días</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Por vender</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(summary.amount) }}</div>
        <div class="text-xs text-gray-400 mt-1">al precio que venían pagando, con IGV</div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="filters.search"
              placeholder="Buscar tienda, RUC, razón social..."
              class="w-full"
              @keyup.enter="reload"
            />
          </span>
        </div>
        <Dropdown
          v-model="filters.scope"
          :options="scopeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="reload"
        />
        <Dropdown
          v-model="filters.type"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="reload"
        />
        <Dropdown
          v-model="filters.days"
          :options="daysOptions"
          optionLabel="label"
          optionValue="value"
          class="w-36"
          @change="reload"
        />
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="fetch" />
    </div>

    <div
      v-else-if="!loading && items.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-check-circle text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Nada por renovar</p>
      <p class="text-sm text-gray-400 mt-1">Ninguna tienda vence en la ventana elegida</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable :value="items" :loading="loading" dataKey="tienda_id" stripedRows>
        <Column header="Tienda" style="min-width: 200px">
          <template #body="{ data: row }">
            <router-link
              :to="`/stores/${row.tienda_id}`"
              class="text-sm font-medium text-gray-900 hover:text-primary-600"
            >
              {{ row.tienda_nombre || 'Sin nombre' }}
            </router-link>
            <div class="text-xs text-gray-400">#{{ row.tienda_id }}</div>
          </template>
        </Column>

        <Column header="Plan vigente" style="min-width: 140px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.plan }}</span>
            <div class="text-xs text-gray-400">
              {{ row.is_trial ? 'Prueba gratis' : row.frequency === 'annual' ? 'Anual' : 'Mensual' }}
            </div>
          </template>
        </Column>

        <Column header="Precio" style="width: 120px">
          <template #body="{ data: row }">
            <span v-if="!row.is_trial" class="text-sm text-gray-700">{{ formatCurrency(row.precio) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column header="Vencimiento" style="width: 170px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ formatDate(row.fecha_final) }}</span>
            <div class="text-xs" :class="row.days_left < 0 ? 'text-red-600' : 'text-orange-600'">
              {{ daysLabel(row.days_left) }}
            </div>
          </template>
        </Column>

        <Column header="Receptor" style="min-width: 200px">
          <template #body="{ data: row }">
            <span v-if="row.documento" class="text-sm text-gray-600 font-mono">{{ row.documento }}</span>
            <span v-else class="text-xs text-amber-600">Sin documento</span>
            <div v-if="row.razon_social" class="text-xs text-gray-400">{{ row.razon_social }}</div>
          </template>
        </Column>

        <Column header="" style="width: 190px">
          <template #body="{ data: row }">
            <Button
              label="Renovar y emitir"
              icon="pi pi-refresh"
              size="small"
              outlined
              @click="openRenew(row)"
            />
            <div v-if="row.auto_charge" class="text-xs text-amber-600 mt-1">
              Cargo automático de Culqi
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-if="meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ meta.current_page }} de {{ meta.total_pages }} · {{ meta.total }} tiendas
        </span>
        <div class="flex items-center gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="meta.current_page <= 1"
            @click="goToPage(meta.current_page - 1)"
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

    <RenewPlanDialog
      v-model:visible="renewVisible"
      :store-id="renewing?.tienda_id ?? null"
      :store-name="renewing?.tienda_nombre"
      submit-label="Renovar y emitir"
      @renewed="onRenewed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { useFormatters } from '@/composables/useFormatters'
import { getPlanRenewals } from '@/api/billing.api'
import type { RenewStorePlanResult } from '@/api/stores.api'
import type { BillingMeta, PlanRenewalFilters, PlanRenewalItem, PlanRenewalSummary } from '@/types/billing.types'
import RenewPlanDialog from '@/components/stores/RenewPlanDialog.vue'

/**
 * Cola de lo que falta vender: tiendas con el plan vencido hace poco o por
 * vencer. Renovar acá registra la venta y entrega la fila nueva al padre, que
 * abre la vista previa del comprobante.
 */
const emit = defineEmits<{ (e: 'renewed', result: RenewStorePlanResult): void }>()

const confirm = useConfirm()
const { formatCurrency, formatDate } = useFormatters()

const items = ref<PlanRenewalItem[]>([])
const summary = ref<PlanRenewalSummary>({ count: 0, expired: 0, upcoming: 0, amount: 0 })
const meta = ref<BillingMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
const loading = ref(false)
const error = ref<string | null>(null)

const filters = reactive<PlanRenewalFilters>({ scope: 'all', type: 'paid', days: 30, search: '', page: 1 })

const scopeOptions = [
  { label: 'Vencidos y por vencer', value: 'all' },
  { label: 'Solo vencidos', value: 'expired' },
  { label: 'Solo por vencer', value: 'upcoming' }
]
const typeOptions = [
  { label: 'Planes de pago', value: 'paid' },
  { label: 'Pruebas gratis', value: 'trial' },
  { label: 'Todos', value: 'all' }
]
const daysOptions = [
  { label: '± 15 días', value: 15 },
  { label: '± 30 días', value: 30 },
  { label: '± 60 días', value: 60 },
  { label: '± 90 días', value: 90 }
]

function daysLabel(days: number): string {
  if (days === 0) return 'Vence hoy'
  const n = Math.abs(days)
  const unit = n === 1 ? 'día' : 'días'
  return days < 0 ? `Venció hace ${n} ${unit}` : `Vence en ${n} ${unit}`
}

async function fetch() {
  loading.value = true
  error.value = null
  try {
    const res = await getPlanRenewals(filters)
    items.value = res.data || []
    if (res.summary) summary.value = res.summary
    if (res.meta) meta.value = res.meta
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || 'Error al cargar las renovaciones'
  } finally {
    loading.value = false
  }
}

function reload() {
  filters.page = 1
  fetch()
}

function goToPage(page: number) {
  filters.page = page
  fetch()
}

// --- Renovar ---
const renewVisible = ref(false)
const renewing = ref<PlanRenewalItem | null>(null)

function openRenew(row: PlanRenewalItem) {
  const open = () => {
    renewing.value = row
    renewVisible.value = true
  }

  if (!row.auto_charge) return open()

  // Culqi cobra estas suscripciones a la tarjeta y la emisión automática las
  // factura sola: anotarla a mano además duplicaría la venta y la factura.
  confirm.require({
    header: 'Suscripción con cargo automático',
    message: `El último período de ${row.tienda_nombre} lo cobró Culqi a la tarjeta. `
      + 'Regístrala a mano solo si ese cargo no va a ocurrir (tarjeta vencida, suscripción cancelada).',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Renovar igual',
    rejectLabel: 'Cancelar',
    accept: open
  })
}

function onRenewed(result: RenewStorePlanResult) {
  fetch()
  emit('renewed', result)
}

onMounted(fetch)

defineExpose({ fetch })
</script>
