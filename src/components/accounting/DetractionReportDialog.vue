<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    modal
    header="Reporte de detracciones de SUNAT"
    :style="{ width: '56rem' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        En SUNAT Operaciones en Línea, "Consulta de pago de detracciones": descarga el reporte en CSV o TXT y súbelo
        aquí. Cada constancia dice a qué comprobante corresponde: los depósitos de clientes en la cuenta del BN se
        concilian como cobro de su factura, y las detracciones que pagamos quedan como pago del gasto. Primero ves qué
        haría; subir el mismo reporte otra vez no duplica nada.
      </p>
      <input type="file" accept=".csv,.txt" class="block w-full text-sm text-gray-600" @change="onFile" />

      <p v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Leyendo el reporte…</p>

      <template v-if="result">
        <div class="flex flex-wrap gap-2 text-xs">
          <span v-for="s in STATUS_ORDER" v-show="result.counts[s]" :key="s" class="px-2 py-1 rounded-full" :class="STATUS[s].badge">
            {{ STATUS[s].label }}: {{ result.counts[s] }}
          </span>
        </div>

        <div class="overflow-x-auto border border-gray-200 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="text-left px-3 py-2">Fecha</th>
                <th class="text-left px-3 py-2">Tipo</th>
                <th class="text-left px-3 py-2">Comprobante</th>
                <th class="text-right px-3 py-2">Detracción</th>
                <th class="text-left px-3 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.rows" :key="row.constancia" class="border-t border-gray-100 align-top">
                <td class="px-3 py-2 whitespace-nowrap text-gray-600">{{ formatDate(row.date) }}</td>
                <td class="px-3 py-2 whitespace-nowrap">{{ row.side === 'venta' ? 'Venta' : row.side === 'compra' ? 'Compra' : '—' }}</td>
                <td class="px-3 py-2">
                  <div class="font-medium text-gray-800 whitespace-nowrap">{{ row.document }}</div>
                  <div class="text-xs text-gray-500">{{ row.side === 'venta' ? row.buyer_name : row.supplier_name }}</div>
                </td>
                <td class="px-3 py-2 text-right tabular-nums whitespace-nowrap">{{ money(row.amount, 'PEN') }}</td>
                <td class="px-3 py-2">
                  <span class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" :class="STATUS[row.status].badge">{{ STATUS[row.status].label }}</span>
                  <div class="text-xs text-gray-600 mt-1">{{ row.message }}</div>
                  <RouterLink
                    v-if="row.movement_id"
                    :to="{ name: 'AccountingBanks', query: { search: `#${row.movement_id}` } }"
                    class="text-xs text-primary-600 hover:underline"
                    @click="emit('update:visible', false)"
                  >Movimiento #{{ row.movement_id }}</RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <template #footer>
      <Button :label="result?.executed ? 'Cerrar' : 'Cancelar'" text severity="secondary" @click="emit('update:visible', false)" />
      <Button
        v-if="!result?.executed"
        label="Aplicar"
        icon="pi pi-check"
        :loading="saving"
        :disabled="!result || pending === 0"
        @click="apply"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { importDetractionReport, accountingErrorMessage } from '@/api/accounting.api'
import type { DetractionReportResult, DetractionRowStatus } from '@/types/accounting.types'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; applied: [] }>()

const toast = useToast()
const { formatDate } = useFormatters()

const STATUS_ORDER: DetractionRowStatus[] = ['conciliado', 'anotado', 'ya_estaba', 'no_encontrado', 'aviso']
const STATUS: Record<DetractionRowStatus, { label: string; badge: string }> = {
  conciliado: { label: 'Se concilia', badge: 'bg-primary-50 text-primary-700' },
  anotado: { label: 'Se anota el pago', badge: 'bg-primary-50 text-primary-700' },
  ya_estaba: { label: 'Ya estaba', badge: 'bg-gray-100 text-gray-600' },
  no_encontrado: { label: 'No encontrado', badge: 'bg-amber-50 text-amber-700' },
  aviso: { label: 'Revisar', badge: 'bg-red-50 text-red-700' }
}

const file = ref<File | null>(null)
const result = ref<DetractionReportResult | null>(null)
const loading = ref(false)
const saving = ref(false)

/** Lo que el botón "Aplicar" cambiaría. */
const pending = computed(() => (result.value?.counts.conciliado ?? 0) + (result.value?.counts.anotado ?? 0))

function money(value: number, currency: string) {
  return `${currency === 'USD' ? 'US$' : 'S/'} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function onFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
  result.value = null
  if (!file.value) return
  loading.value = true
  try {
    result.value = (await importDetractionReport(file.value, false)).data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Reporte de detracciones', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loading.value = false
  }
}

async function apply() {
  if (!file.value) return
  saving.value = true
  try {
    result.value = (await importDetractionReport(file.value, true)).data
    toast.add({ severity: 'success', summary: 'Reporte de detracciones', detail: `${pending.value} constancias aplicadas`, life: 4000 })
    emit('applied')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Reporte de detracciones', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}
</script>
