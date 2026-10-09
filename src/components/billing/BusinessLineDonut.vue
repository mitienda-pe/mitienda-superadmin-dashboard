<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5" :class="{ 'opacity-60': loading }">
    <h3 class="text-base font-semibold text-gray-800">Ingreso neto por línea de negocio</h3>
    <p class="text-sm text-gray-500 mt-0.5 mb-4">Todo el rango elegido, sin IGV.</p>

    <p v-if="error" class="text-sm text-red-600">
      No se pudo cargar el reparto: {{ error }}
      <button class="underline" @click="load">Reintentar</button>
    </p>

    <div v-else-if="segments.length > 0" class="flex flex-wrap items-center gap-6">
      <v-chart :option="chartOption" :autoresize="true" class="donut-chart" />
      <table class="flex-1 min-w-[16rem] text-sm">
        <tbody>
          <tr v-for="segment in segments" :key="segment.key" class="border-b border-gray-100 last:border-0">
            <td class="py-1.5 pr-3">
              <span class="inline-flex items-center gap-2" :class="segment.untagged ? 'text-amber-700' : 'text-gray-700'">
                <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: segment.color }"></span>
                {{ segment.name }}
              </span>
            </td>
            <td class="py-1.5 text-right tabular-nums text-gray-800">{{ formatCurrency(segment.amount) }}</td>
            <td class="py-1.5 pl-3 text-right tabular-nums text-gray-400 w-12">{{ segment.share }}</td>
          </tr>
          <tr>
            <td class="pt-2 pr-3 font-medium text-gray-700">Total</td>
            <td class="pt-2 text-right tabular-nums font-semibold text-gray-900">{{ formatCurrency(total) }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { getLedgerReport, ledgerErrorMessage } from '@/api/ledger.api'
import type { LedgerReport, LedgerTagDimension } from '@/types/ledger.types'

use([PieChart, TooltipComponent, CanvasRenderer])

/**
 * Compara las líneas de negocio (B2C, B2B y Otros) sobre el rango del reporte.
 * Siempre agrupa por línea, sea cual sea la agrupación de la tabla.
 */
const props = defineProps<{
  from: string
  to: string
  /** Dimensión "línea de negocio": da nombres, orden y color de cada valor. */
  dimension: LedgerTagDimension
  /** Filtros de las demás dimensiones. */
  valueIds: number[]
}>()

const UNTAGGED = 'untagged'

const { colors, palette } = useChartTheme()
const { formatCurrency } = useFormatters()

const report = ref<LedgerReport | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const segments = computed(() => {
  const groups = report.value?.groups ?? []

  // Las líneas de la dimensión se muestran siempre, aunque alguna no haya
  // facturado en el rango; lo que quedó sin línea, solo si tiene importe.
  const rows = props.dimension.values.map((value, index) => ({
    key: value.slug,
    name: value.name,
    amount: groups.find(g => g.key === value.slug)?.total ?? 0,
    // Mismo color que la serie del valor cuando el reporte agrupa por línea.
    color: palette[index] ?? colors.gray[500],
    untagged: false
  }))

  const untagged = groups.find(g => g.key === UNTAGGED)?.total ?? 0
  if (Math.round(untagged) !== 0) {
    rows.push({ key: UNTAGGED, name: 'Sin línea de negocio', amount: untagged, color: colors.gray[300], untagged: true })
  }

  const sum = rows.reduce((acc, row) => acc + row.amount, 0)

  return rows.map(row => ({
    ...row,
    share: sum > 0 ? `${((row.amount / sum) * 100).toFixed(0)}%` : '-'
  }))
})

const total = computed(() => segments.value.reduce((acc, row) => acc + row.amount, 0))

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) =>
      `<div class="font-medium">${params.name}</div>
       <div class="text-sm">${formatCurrency(params.value)} (${params.percent}%)</div>`
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '85%'],
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      // Una línea con más notas de crédito que facturas no puede dibujarse como porción.
      data: segments.value.map(segment => ({
        name: segment.name,
        value: Math.max(0, Math.round(segment.amount)),
        itemStyle: { color: segment.color }
      }))
    }
  ]
}))

async function load() {
  if (!props.from || !props.to) return

  loading.value = true
  error.value = null
  try {
    report.value = await getLedgerReport({
      from: props.from,
      to: props.to,
      group_by: props.dimension.slug,
      granularity: 'year',
      valueIds: props.valueIds
    })
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(() => [props.from, props.to, props.valueIds.join(',')], load)
onMounted(load)
</script>

<style scoped>
.donut-chart {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}
</style>
