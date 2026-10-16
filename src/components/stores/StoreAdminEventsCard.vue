<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
      <h3 class="text-base font-semibold text-gray-800">Historial de cambios</h3>
      <Button icon="pi pi-refresh" text rounded size="small" :loading="loading" aria-label="Actualizar" @click="load" />
    </div>
    <div v-if="loading || error || events.length === 0" class="p-5">
      <div v-if="loading" class="text-center text-gray-400 py-6">Cargando…</div>
      <div v-else-if="error" class="text-center text-red-600 py-6 text-sm">{{ error }}</div>
      <div v-else class="text-center text-gray-400 py-6 text-sm">
        Sin cambios registrados. Se registran bloqueos, estado, configuración y módulos desde el {{ HISTORIAL_DESDE }}.
      </div>
    </div>
    <DataTable v-else :value="events" :rows="10" paginator stripedRows class="p-datatable-sm">
      <Column header="Fecha">
        <template #body="{ data }">
          <span class="whitespace-nowrap text-xs">{{ data.created_at }}</span>
        </template>
      </Column>
      <Column header="Cambio">
        <template #body="{ data }">
          <ul class="text-xs space-y-0.5">
            <li v-for="line in describe(data)" :key="line">{{ line }}</li>
          </ul>
        </template>
      </Column>
      <Column header="Quién">
        <template #body="{ data }">
          <span class="text-xs">{{ data.user_name || '—' }}</span>
        </template>
      </Column>
      <Column header="Motivo">
        <template #body="{ data }">
          <span class="text-xs text-gray-600">{{ data.reason || '—' }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { getStoreAdminEvents } from '@/api/stores.api'
import type { StoreAdminEvent } from '@/types/store.types'

const props = defineProps<{ storeId: number }>()

const HISTORIAL_DESDE = '16 de octubre de 2026'

const events = ref<StoreAdminEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const COLUMN_LABELS: Record<string, string> = {
  tienda_bloqueada: 'Bloqueada',
  tienda_nombre_comercial: 'Nombre comercial',
  tienda_flag: 'Flag',
  tienda_test: 'Tienda de prueba',
  tienda_marketplace: 'Marketplace',
  tienda_directorio: 'Directorio',
  tienda_ssl: 'SSL',
  tienda_dominio: 'Dominio',
  tienda_dominio_verificado: 'Dominio verificado',
  tienda_grupo: 'Grupo',
  tienda_swintegracionfb: 'Integración Facebook',
  tienda_sw_alerta_pago: 'Alerta de pago',
  tienda_umami_website_id: 'Umami'
}

const BOOLEAN_COLUMNS = new Set([
  'tienda_bloqueada', 'tienda_test', 'tienda_marketplace', 'tienda_directorio', 'tienda_ssl',
  'tienda_dominio_verificado', 'tienda_swintegracionfb', 'tienda_sw_alerta_pago'
])

function valueLabel(column: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '(vacío)'
  if (BOOLEAN_COLUMNS.has(column)) return Number(value) === 1 ? 'Sí' : 'No'
  return String(value)
}

function describe(event: StoreAdminEvent): string[] {
  if (event.action === 'modules') {
    const added = (event.changes.added as string[] | undefined) ?? []
    const removed = (event.changes.removed as string[] | undefined) ?? []
    return [
      ...(added.length ? [`Módulos agregados: ${added.join(', ')}`] : []),
      ...(removed.length ? [`Módulos quitados: ${removed.join(', ')}`] : [])
    ]
  }
  return Object.entries(event.changes).map(([column, pair]) => {
    const [before, after] = Array.isArray(pair) ? pair : [null, pair]
    return `${COLUMN_LABELS[column] ?? column}: ${valueLabel(column, before)} → ${valueLabel(column, after)}`
  })
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await getStoreAdminEvents(props.storeId)
    events.value = res.data ?? []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el historial'
  } finally {
    loading.value = false
  }
}

watch(() => props.storeId, load, { immediate: true })

defineExpose({ load })
</script>
