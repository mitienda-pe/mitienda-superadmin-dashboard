<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    modal
    header="Ingresos por origen"
    :style="{ width: '52rem' }"
    :breakpoints="{ '640px': '96vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        Lo que entró a las cuentas de banco en el período, según cómo se concilió cada abono. Las transferencias entre
        cuentas propias no suman: se contarían dos veces. Lo que llega desde Culqi, Mercado Pago o la caja sí suma, porque
        recién ahí entra al banco.
      </p>

      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm text-gray-600">
          Desde
          <input v-model="from" type="date" class="block mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <label class="text-sm text-gray-600">
          Hasta
          <input v-model="to" type="date" class="block mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <div class="flex flex-wrap gap-2">
          <Button v-for="p in PRESETS" :key="p.label" :label="p.label" size="small" severity="secondary" outlined @click="applyPreset(p.range)" />
        </div>
      </div>

      <p v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Calculando…</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

      <template v-else-if="data">
        <div class="overflow-x-auto border border-gray-200 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="text-left px-3 py-2">Origen</th>
                <th class="text-right px-3 py-2">Soles</th>
                <th class="text-right px-3 py-2">Dólares</th>
                <th class="text-right px-3 py-2">Total en S/</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in counted" :key="row.key">
                <tr class="border-t border-gray-100">
                  <td class="px-3 py-2">
                    {{ row.label }}
                    <span class="text-xs text-gray-400">· {{ row.movements }} mov.</span>
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ amount(row.PEN, 'PEN') }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ amount(row.USD, 'USD') }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ amount(row.soles, 'PEN') }}</td>
                </tr>
                <tr v-if="row.key === LAST_SALES" class="border-t border-gray-200 bg-gray-50 font-medium">
                  <td class="px-3 py-2">Plata de ventas</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.sales.PEN, 'PEN') }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.sales.USD, 'USD') }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.sales.soles, 'PEN') }}</td>
                </tr>
              </template>
              <tr class="border-t-2 border-gray-300 font-semibold text-gray-900">
                <td class="px-3 py-2">Total que entró</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.total.PEN, 'PEN') }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.total.USD, 'USD') }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-primary-700">{{ amount(data.total.soles, 'PEN') }}</td>
              </tr>
              <tr class="border-t border-gray-100 text-gray-400">
                <td class="px-3 py-2">No suman: transferencias entre cuentas propias</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.own_transfers.PEN, 'PEN') }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.own_transfers.USD, 'USD') }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(data.own_transfers.soles, 'PEN') }}</td>
              </tr>
              <tr v-for="row in flagged" :key="row.key" class="border-t border-gray-100 text-amber-700">
                <td class="px-3 py-2">
                  No suman: {{ row.label.toLowerCase() }}
                  <span class="text-xs">· {{ row.movements }} mov.</span>
                </td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(row.PEN, 'PEN') }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(row.USD, 'USD') }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ amount(row.soles, 'PEN') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="flagged.length > 0" class="text-xs text-amber-700">
          Hay abonos marcados como transferencia sin su otro lado: no se sabe si vienen de una cuenta propia. Búscalos con
          el filtro "Sin pareja" y enlázalos, o cámbiales la etiqueta si vienen de afuera.
        </p>
        <p v-if="data.missing_rates > 0" class="text-xs text-red-600">
          {{ data.missing_rates }} abonos en dólares no tienen tipo de cambio: no están en la columna "Total en S/".
        </p>
        <p class="text-xs text-gray-500">
          Cuentas:
          <span v-for="(account, i) in data.accounts" :key="account.id">
            {{ account.name }} (último movimiento {{ account.last_date ? formatDate(account.last_date) : '—' }}){{ i < data.accounts.length - 1 ? ' · ' : '' }}
          </span>.
          Lo que no se importó del extracto no está en la suma.
        </p>
      </template>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useFormatters } from '@/composables/useFormatters'
import { getBankInflows, accountingErrorMessage } from '@/api/accounting.api'
import type { BankInflows } from '@/types/accounting.types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { formatDate } = useFormatters()

/** Detrás de esta fila va el subtotal "Plata de ventas" (cobros, Culqi y Mercado Pago). */
const LAST_SALES = 'mercado_pago'

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const today = new Date()
const PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: 'Este año', range: () => [`${today.getFullYear()}-01-01`, iso(today)] },
  { label: 'Este mes', range: () => [iso(new Date(today.getFullYear(), today.getMonth(), 1)), iso(today)] },
  { label: 'Mes pasado', range: () => [iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)), iso(new Date(today.getFullYear(), today.getMonth(), 0))] },
  { label: 'Año pasado', range: () => [`${today.getFullYear() - 1}-01-01`, `${today.getFullYear() - 1}-12-31`] }
]

const from = ref(`${today.getFullYear()}-01-01`)
const to = ref(iso(today))
const data = ref<BankInflows | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const counted = computed(() => data.value?.origins.filter((o) => o.in_total && (o.PEN !== 0 || o.USD !== 0)) ?? [])
const flagged = computed(() => data.value?.origins.filter((o) => !o.in_total && (o.PEN !== 0 || o.USD !== 0)) ?? [])

function amount(value: number, currency: 'PEN' | 'USD') {
  if (value === 0) return '—'
  return `${currency === 'USD' ? 'US$' : 'S/'} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function applyPreset(range: () => [string, string]) {
  ;[from.value, to.value] = range()
}

let requestId = 0
async function load() {
  if (!from.value || !to.value) return
  const id = ++requestId
  loading.value = true
  error.value = null
  try {
    const result = await getBankInflows(from.value, to.value)
    if (id === requestId) data.value = result
  } catch (e) {
    if (id === requestId) error.value = accountingErrorMessage(e)
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch([from, to], load)
watch(() => props.visible, (open) => { if (open) load() }, { immediate: true })
</script>
