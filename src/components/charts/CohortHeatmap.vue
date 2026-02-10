<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">Retención por Cohorte</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr>
            <th class="text-left py-2 px-3 text-xs text-gray-400 font-medium">Cohorte</th>
            <th class="text-center py-2 px-3 text-xs text-gray-400 font-medium">Tamaño</th>
            <th
              v-for="m in maxMonths"
              :key="m"
              class="text-center py-2 px-1 text-xs text-gray-400 font-medium"
            >M{{ m - 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cohort in validCohorts" :key="cohort.month" class="border-t border-gray-50">
            <td class="py-2 px-3 text-xs font-medium text-gray-700">{{ formatShortMonth(cohort.month) }}</td>
            <td class="py-2 px-3 text-center text-xs text-gray-600">{{ cohort.size }}</td>
            <td
              v-for="(val, idx) in cohort.retention"
              :key="idx"
              class="py-2 px-1 text-center text-xs font-medium"
              :style="{ backgroundColor: getHeatColor(val), color: val > 60 ? '#fff' : '#374151' }"
            >{{ val }}%</td>
            <td
              v-for="empty in maxMonths - cohort.retention.length"
              :key="'e' + empty"
              class="py-2 px-1"
            ></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/useFormatters'
import type { CohortData } from '@/types/revenue.types'

const props = defineProps<{ data: CohortData[] }>()
const { formatShortMonth } = useFormatters()

const validCohorts = computed(() => props.data.filter(c => c.size > 0))
const maxMonths = computed(() => {
  let max = 0
  validCohorts.value.forEach(c => { if (c.retention.length > max) max = c.retention.length })
  return max
})

function getHeatColor(val: number): string {
  if (val >= 80) return '#059669'
  if (val >= 60) return '#10b981'
  if (val >= 40) return '#fbbf24'
  if (val >= 20) return '#f97316'
  return '#ef4444'
}
</script>
