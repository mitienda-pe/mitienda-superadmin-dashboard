<template>
  <Dialog :draggable="false" :visible="visible" modal :header="`Datos para el PLAME Web · ${periodLabel}`" :style="{ width: '52rem' }" @update:visible="v => emit('update:visible', v)">
    <p class="text-sm text-gray-500 mb-4">
      Lo que se digita en el Formulario Virtual 0601 (PLAME Web), trabajador por trabajador, en el orden del reporte
      "Datos de boleta de pago". Las comisiones van dentro del 0121 y las condiciones de trabajo no se declaran, como
      en sus declaraciones anteriores.
    </p>

    <div v-if="loading" class="py-8 text-center text-gray-400"><i class="pi pi-spin pi-spinner text-xl"></i></div>
    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
    <div v-else-if="data && !data.workers.length" class="text-sm text-gray-500">La planilla del mes no tiene trabajadores.</div>

    <div v-else-if="data" class="space-y-4">
      <div v-for="worker in data.workers" :key="worker.document" class="rounded-lg border border-gray-200">
        <div class="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2 bg-gray-50 rounded-t-lg">
          <div class="font-medium text-gray-900">{{ worker.name }} <span class="text-xs text-gray-500">· DNI {{ worker.document || '—' }}</span></div>
          <div class="text-xs text-gray-600">Días laborados {{ worker.days }} · Jornada {{ worker.hours }} h</div>
        </div>
        <table class="w-full text-sm">
          <tbody>
            <template v-for="group in GROUPS" :key="group.key">
              <tr v-if="worker.concepts.some(c => c.group === group.key)">
                <td colspan="3" class="px-4 pt-2 text-xs font-medium text-gray-500">{{ group.label }}</td>
              </tr>
              <tr v-for="c in worker.concepts.filter(c => c.group === group.key)" :key="c.code">
                <td class="px-4 py-0.5 w-16 font-mono text-gray-700">{{ c.code }}</td>
                <td class="py-0.5 text-gray-700">
                  {{ c.name }}
                  <span v-if="c.confirm" class="ml-1 text-xs text-amber-700" title="Código estándar de SUNAT; aún no aparece en una declaración suya para contrastarlo">por confirmar</span>
                </td>
                <td class="px-4 py-0.5 text-right tabular-nums">{{ money(c.amount) }}</td>
              </tr>
            </template>
            <tr class="border-t border-gray-100">
              <td class="px-4 py-1.5"></td>
              <td class="py-1.5 font-medium text-gray-800">Ingreso neto</td>
              <td class="px-4 py-1.5 text-right tabular-nums font-medium">{{ money(worker.net) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rounded-lg border border-gray-200 p-4">
        <div class="text-sm font-medium text-gray-800 mb-2">Totales por código</div>
        <div v-for="t in data.totals" :key="t.code" class="flex justify-between text-sm py-0.5">
          <span><span class="font-mono text-gray-600 mr-2">{{ t.code }}</span>{{ t.name }}</span>
          <span class="tabular-nums">{{ money(t.amount) }}</span>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { getPayrollPlame, accountingErrorMessage, type PlameData } from '@/api/accounting.api'

const props = defineProps<{ visible: boolean; period: string }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const GROUPS = [
  { key: 'ingreso', label: 'Ingresos' },
  { key: 'aporte_trabajador', label: 'Aportes del trabajador' },
  { key: 'aporte_empleador', label: 'Aportes del empleador' }
] as const
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']

const data = ref<PlameData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const periodLabel = computed(() => `${MONTHS[Number(props.period.slice(5, 7)) - 1]} ${props.period.slice(0, 4)}`)

function money(value: number): string {
  return value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

watch(() => [props.visible, props.period], async ([visible]) => {
  if (!visible) return
  loading.value = true
  error.value = null
  try {
    data.value = await getPayrollPlame(props.period)
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>
