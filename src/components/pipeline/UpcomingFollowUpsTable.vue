<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Seguimientos Pendientes</h3>

    <div v-if="data.length === 0" class="text-center py-8 text-gray-400 text-sm">
      <i class="pi pi-check-circle text-2xl mb-2 block"></i>
      No hay seguimientos pendientes
    </div>

    <div v-else class="space-y-2 max-h-[300px] overflow-y-auto">
      <router-link
        v-for="item in data"
        :key="item.id"
        :to="`/pipeline/${item.tienda_id}`"
        class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ item.store_name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ item.description }}</p>
        </div>
        <div class="text-right shrink-0">
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="isOverdue(item.due_date)
              ? 'bg-red-50 text-red-600'
              : 'bg-blue-50 text-blue-600'"
          >
            {{ formatDueDate(item.due_date) }}
          </span>
          <p class="text-[10px] text-gray-400 mt-1">{{ item.user_name }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UpcomingFollowUp } from '@/types/pipeline.types'

defineProps<{
  data: UpcomingFollowUp[]
}>()

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0])
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `Hace ${Math.abs(diff)}d`
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Manana'
  return `En ${diff}d`
}
</script>
