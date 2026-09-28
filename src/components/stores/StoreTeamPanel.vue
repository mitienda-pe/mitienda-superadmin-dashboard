<template>
  <div class="space-y-6">
    <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
      <i class="pi pi-spinner pi-spin text-2xl"></i>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-3" severity="danger" outlined size="small" @click="load" />
    </div>

    <template v-else-if="team">
      <!-- Resumen -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Usuarios</p>
          <p class="text-2xl font-semibold text-gray-800">
            {{ team.summary.users }}
            <span class="text-sm font-normal text-gray-400">
              / {{ team.summary.max_users > 0 ? team.summary.max_users : 'sin límite' }}
            </span>
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Cupo {{ team.summary.max_users_source === 'store' ? 'propio de la tienda' : `del plan ${team.summary.plan_name ?? ''}` }}
          </p>
          <p v-if="team.summary.extra_users > 0" class="mt-2">
            <Tag :value="`${team.summary.extra_users} adicional${team.summary.extra_users === 1 ? '' : 'es'}`" severity="warning" />
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Sucursales</p>
          <p class="text-2xl font-semibold text-gray-800">{{ team.summary.branches }}</p>
          <p class="text-xs text-gray-400 mt-1">
            {{ team.summary.branches_published }} publicadas ·
            {{ team.summary.branches_with_cashiers }} con cajeros
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Cajeros POS activos</p>
          <p class="text-2xl font-semibold text-gray-800">{{ team.summary.cashiers_active }}</p>
          <p class="text-xs text-gray-400 mt-1">No ocupan cupo de usuarios</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">PIN incorrectos (30 días)</p>
          <p class="text-2xl font-semibold" :class="team.summary.failed_pin_30d > 0 ? 'text-amber-600' : 'text-gray-800'">
            {{ team.summary.failed_pin_30d }}
          </p>
        </div>
      </div>

      <!-- Usuarios -->
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="p-5 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-800">Usuarios del backoffice</h3>
        </div>
        <div v-if="team.users.length === 0" class="p-8 text-center text-gray-400">Sin usuarios</div>
        <DataTable v-else :value="team.users" stripedRows class="p-datatable-sm">
          <Column header="Usuario" style="min-width: 220px">
            <template #body="{ data: row }">
              <p class="text-sm font-medium text-gray-800">{{ row.name || '—' }}</p>
              <p class="text-xs text-gray-400">{{ row.email }}</p>
            </template>
          </Column>
          <Column header="Rol">
            <template #body="{ data: row }">
              <Tag :value="row.role" :severity="roleSeverity(row.role_id)" />
            </template>
          </Column>
          <Column header="Sucursales">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600">{{ row.branches_assigned > 0 ? row.branches_assigned : 'Todas' }}</span>
            </template>
          </Column>
          <Column header="Último ingreso">
            <template #body="{ data: row }">
              <span
                v-tooltip.top="row.last_login_this_store ? 'En esta tienda' : 'En cualquiera de sus tiendas'"
                class="text-sm text-gray-600"
              >
                {{ formatDateTime(row.last_login_this_store ?? row.last_login_any_store) }}
              </span>
            </template>
          </Column>
          <Column field="logins_30d" header="Ingresos 30 d" :sortable="true">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600">{{ row.logins_30d }}</span>
            </template>
          </Column>
          <Column header="Alta">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-500">{{ row.created_at ? formatDate(row.created_at) : '—' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Sucursales -->
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="p-5 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-800">Sucursales</h3>
        </div>
        <div v-if="team.branches.length === 0" class="p-8 text-center text-gray-400">Sin sucursales</div>
        <DataTable v-else :value="team.branches" stripedRows class="p-datatable-sm">
          <Column header="Sucursal" style="min-width: 220px">
            <template #body="{ data: row }">
              <p class="text-sm font-medium text-gray-800">{{ row.name }}</p>
              <p class="text-xs text-gray-400">{{ row.address || '—' }}</p>
            </template>
          </Column>
          <Column header="Tipo">
            <template #body="{ data: row }">
              <div class="flex flex-wrap gap-1">
                <Tag v-if="row.published" value="Publicada" severity="success" />
                <Tag v-if="row.warehouse" value="Almacén" severity="secondary" />
                <span v-if="!row.published && !row.warehouse" class="text-sm text-gray-400">—</span>
              </div>
            </template>
          </Column>
          <Column field="cashiers" header="Cajeros" :sortable="true">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600">{{ row.cashiers }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Cajeros -->
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="p-5 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-800">Cajeros del POS (ingreso con PIN)</h3>
        </div>
        <div v-if="team.cashiers.length === 0" class="p-8 text-center text-gray-400">Sin cajeros</div>
        <DataTable v-else :value="team.cashiers" stripedRows class="p-datatable-sm">
          <Column header="Cajero" style="min-width: 200px">
            <template #body="{ data: row }">
              <span class="text-sm font-medium" :class="row.active ? 'text-gray-800' : 'text-gray-400'">{{ row.name }}</span>
            </template>
          </Column>
          <Column header="Rol">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600 capitalize">{{ row.role }}</span>
            </template>
          </Column>
          <Column header="Estado">
            <template #body="{ data: row }">
              <Tag :value="row.active ? 'Activo' : 'Inactivo'" :severity="row.active ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="Último ingreso">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600">{{ formatDateTime(row.last_login) }}</span>
            </template>
          </Column>
          <Column field="logins_30d" header="Ingresos 30 d" :sortable="true">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600">{{ row.logins_30d }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <p class="text-xs text-gray-400">
        Los ingresos por tienda se registran desde el 28/09/2026; antes solo existe el último ingreso global de cada usuario.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Tooltip from 'primevue/tooltip'
import { getStoreTeam } from '@/api/stores.api'
import { useFormatters } from '@/composables/useFormatters'
import type { StoreTeam } from '@/types/store.types'

const props = defineProps<{ storeId: number }>()
const vTooltip = Tooltip

const { formatDate } = useFormatters()

const team = ref<StoreTeam | null>(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await getStoreTeam(props.storeId)
    team.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo cargar el equipo'
  } finally {
    loading.value = false
  }
}

/** 1 propietario, 3 administrador, 2 invitado (`usuariostipos`). */
function roleSeverity(roleId: number): 'success' | 'warning' | 'info' {
  if (roleId === 1) return 'success'
  if (roleId === 3) return 'warning'
  return 'info'
}

/** Las fechas llegan como 'YYYY-MM-DD HH:MM:SS' (hora del servidor). */
function formatDateTime(value: string | null): string {
  if (!value) return 'Nunca'
  const d = new Date(value.replace(' ', 'T'))
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(load)
watch(() => props.storeId, load)
</script>
