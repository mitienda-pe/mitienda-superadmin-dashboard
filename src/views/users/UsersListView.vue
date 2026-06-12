<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p class="text-sm text-gray-500 mt-1">{{ usersStore.meta.total }} administradores de tiendas</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[220px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por nombre, correo o tienda..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Activación"
          class="w-48"
          @change="applyFilters"
        />
        <Dropdown
          v-model="storeStatusFilter"
          :options="storeStatusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Estado tienda"
          class="w-48"
          @change="applyFilters"
        />
        <Dropdown
          v-model="rolFilter"
          :options="rolOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Rol"
          class="w-48"
          @change="applyFilters"
        />
      </div>
    </div>

    <!-- Error -->
    <div v-if="usersStore.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ usersStore.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="usersStore.fetchUsers()" />
    </div>

    <!-- Tabla -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="usersStore.users"
        :loading="usersStore.isLoading"
        stripedRows
        class="p-datatable-sm"
        @sort="onSort"
        :sortField="usersStore.filters.sort"
        :sortOrder="usersStore.filters.order === 'ASC' ? 1 : -1"
      >
        <Column field="nombre" header="Usuario" :sortable="true" style="min-width: 240px">
          <template #body="{ data: row }">
            <div>
              <span class="font-medium text-gray-800 block">{{ row.nombre || '—' }}</span>
              <span class="text-xs text-gray-400">{{ row.email }}</span>
            </div>
          </template>
        </Column>

        <Column field="tienda" header="Tienda" :sortable="true" style="min-width: 180px">
          <template #body="{ data: row }">
            <router-link :to="`/stores/${row.tienda_id}`" class="text-gray-700 hover:text-primary-600">
              {{ row.tienda }}
            </router-link>
            <div class="text-xs text-gray-400">{{ row.plan || '—' }}</div>
          </template>
        </Column>

        <Column field="estado_tienda" header="Estado tienda" :sortable="true" style="width: 120px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.estado_tienda === 'vigente' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            >
              {{ row.estado_tienda === 'vigente' ? 'Vigente' : 'Vencido' }}
            </span>
          </template>
        </Column>

        <Column field="rol" header="Rol" :sortable="true" style="min-width: 140px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.rol }}</span>
          </template>
        </Column>

        <Column field="creado" header="Creado" :sortable="true" style="min-width: 130px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.creado) }}</span>
          </template>
        </Column>

        <Column field="ultimo_ingreso" header="Último ingreso" :sortable="true" style="min-width: 140px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.ultimo_ingreso) }}</span>
          </template>
        </Column>

        <Column field="estado" header="Estado" :sortable="true" style="width: 150px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="estadoClass(row.estado)"
            >
              {{ estadoLabel(row.estado) }}
            </span>
          </template>
        </Column>

        <Column header="" style="width: 130px">
          <template #body="{ data: row }">
            <Button
              v-if="row.estado === 'pendiente' || row.estado === 'expirado'"
              label="Reenviar"
              icon="pi pi-envelope"
              size="small"
              text
              :loading="usersStore.resendingId === row.usuario_id"
              @click="onResend(row)"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Paginación -->
      <div v-if="usersStore.meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ usersStore.meta.current_page }} de {{ usersStore.meta.total_pages }}
          ({{ usersStore.meta.total }} usuarios)
        </span>
        <div class="flex gap-1">
          <Button icon="pi pi-chevron-left" text rounded size="small"
            :disabled="usersStore.meta.current_page <= 1"
            @click="usersStore.goToPage(usersStore.meta.current_page - 1)" />
          <Button icon="pi pi-chevron-right" text rounded size="small"
            :disabled="usersStore.meta.current_page >= usersStore.meta.total_pages"
            @click="usersStore.goToPage(usersStore.meta.current_page + 1)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useUsersStore } from '@/stores/users.store'
import type { AdminUserItem, UserActivationEstado } from '@/api/users.api'

const usersStore = useUsersStore()
const toast = useToast()

const searchQuery = ref('')
const statusFilter = ref('all')
const storeStatusFilter = ref('vigente')
const rolFilter = ref('all')

const statusOptions = [
  { label: 'Toda activación', value: 'all' },
  { label: 'Activado', value: 'activado' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Token expirado', value: 'expirado' },
  { label: 'Sin invitación', value: 'sin_invitacion' }
]

const storeStatusOptions = [
  { label: 'Toda tienda', value: 'all' },
  { label: 'Tienda vigente', value: 'vigente' },
  { label: 'Tienda vencida', value: 'vencido' }
]

const rolOptions = [
  { label: 'Todo rol', value: 'all' },
  { label: 'Administrador principal', value: 'principal' },
  { label: 'Colaborador', value: 'colaborador' }
]

function applySearch() {
  usersStore.updateFilters({ search: searchQuery.value })
}
function applyFilters() {
  usersStore.updateFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    store_status: storeStatusFilter.value,
    rol: rolFilter.value
  })
}

function onSort(event: any) {
  usersStore.updateFilters({
    sort: event.sortField,
    order: event.sortOrder === 1 ? 'ASC' : 'DESC'
  })
}

const estadoLabels: Record<UserActivationEstado, string> = {
  activado: 'Activado',
  pendiente: 'Pendiente',
  expirado: 'Token expirado',
  sin_invitacion: 'Sin invitación'
}
function estadoLabel(e: UserActivationEstado) {
  return estadoLabels[e] || e
}
function estadoClass(e: UserActivationEstado) {
  switch (e) {
    case 'activado': return 'bg-green-50 text-green-700'
    case 'pendiente': return 'bg-amber-50 text-amber-700'
    case 'expirado': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function formatDate(d: string | null) {
  if (!d) return 'Nunca'
  return d.slice(0, 10)
}

async function onResend(row: AdminUserItem) {
  try {
    const sent = await usersStore.resendActivation(row.usuario_id, row.tienda_id)
    toast.add({
      severity: sent ? 'success' : 'warn',
      summary: sent ? 'Email reenviado' : 'No se pudo enviar',
      detail: sent
        ? `Se reenvió el enlace de activación a ${row.email} (válido 72h).`
        : 'El email no pudo enviarse. Revisa los logs.',
      life: 6000
    })
    if (sent) usersStore.fetchUsers()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.message || 'Error inesperado', life: 6000 })
  }
}

onMounted(() => usersStore.fetchUsers())
</script>
