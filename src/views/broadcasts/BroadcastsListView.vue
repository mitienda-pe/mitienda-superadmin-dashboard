<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Avisos Backoffice</h1>
        <p class="text-sm text-gray-500 mt-1">
          Publicá barras y modales dentro del backoffice para todos los tenants o para una tienda específica.
        </p>
      </div>
      <Button label="Nuevo broadcast" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
      <Dropdown
        v-model="store.filters.scope"
        :options="scopeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Alcance"
        @change="store.fetchAll()"
      />
      <Dropdown
        v-model="store.filters.status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        @change="store.fetchAll()"
      />
      <Dropdown
        v-model="store.filters.placement"
        :options="placementOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo"
        showClear
        @change="store.fetchAll()"
      />
      <Dropdown
        v-model="store.filters.severity"
        :options="severityOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Severidad"
        showClear
        @change="store.fetchAll()"
      />
    </div>

    <div v-if="store.error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {{ store.error }}
    </div>

    <div v-if="store.isLoading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="store.items.length === 0" class="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <i class="pi pi-megaphone text-gray-300 text-5xl mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Sin broadcasts</h3>
      <p class="text-gray-500 mb-6">No hay mensajes para el filtro seleccionado.</p>
      <Button label="Crear primero" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable :value="store.items" stripedRows responsiveLayout="scroll">
        <Column field="title" header="Título" sortable>
          <template #body="{ data }">
            <div class="font-medium text-gray-900">{{ data.title }}</div>
            <div class="text-xs text-gray-500 truncate max-w-md">{{ data.body }}</div>
          </template>
        </Column>
        <Column header="Alcance">
          <template #body="{ data }">
            <span v-if="data.tienda_id === null" class="inline-flex items-center px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-medium">
              <i class="pi pi-globe mr-1" /> Global
            </span>
            <span v-else class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
              <i class="pi pi-shop mr-1" />
              {{ data.tienda_nombre || 'Tienda #' + data.tienda_id }}
            </span>
          </template>
        </Column>
        <Column header="Tipo">
          <template #body="{ data }">
            <span class="inline-flex items-center gap-1 text-xs text-gray-600">
              <i :class="data.placement === 'modal' ? 'pi pi-window-maximize' : 'pi pi-bars'" />
              {{ data.placement === 'modal' ? 'Modal' : 'Barra' }}
            </span>
          </template>
        </Column>
        <Column header="Severidad">
          <template #body="{ data }">
            <span :class="severityTagClass(data.severity)">
              {{ severityLabel(data.severity) }}
            </span>
          </template>
        </Column>
        <Column header="Vigencia">
          <template #body="{ data }">
            <div class="text-xs text-gray-600">
              {{ formatDate(data.published_at) }} →
              {{ formatDate(data.expires_at) }}
            </div>
            <span :class="statusTagClass(statusOf(data))" class="mt-1 inline-block">
              {{ statusLabel(statusOf(data)) }}
            </span>
          </template>
        </Column>
        <Column header="Cerrable">
          <template #body="{ data }">
            <i v-if="data.is_dismissible" class="pi pi-check text-green-600" />
            <i v-else class="pi pi-lock text-orange-600" title="Bloqueante" />
          </template>
        </Column>
        <Column header="Cerrados">
          <template #body="{ data }">
            <span class="inline-flex items-center gap-1 text-xs text-gray-600">
              <i class="pi pi-eye-slash" />
              {{ data.dismissals_count ?? 0 }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 170px">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" text rounded v-tooltip.top="'Editar'" @click="openEdit(data)" />
            <Button
              icon="pi pi-refresh"
              text
              rounded
              severity="info"
              v-tooltip.top="'Resetear vistas (volver a mostrar a todos)'"
              :disabled="!(data.dismissals_count ?? 0)"
              @click="confirmReset(data)"
            />
            <Button icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="'Eliminar'" @click="confirmDelete(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <BroadcastFormDialog
      v-model:visible="showForm"
      :record="editingRecord"
      :saving="store.isSaving"
      @submit="handleSave"
    />

    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar broadcast"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <p class="text-gray-700">
        ¿Eliminar <strong>{{ deleteTarget?.title }}</strong>? Se dejará de mostrar inmediatamente.
      </p>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="Eliminar" severity="danger" icon="pi pi-trash" :loading="isDeleting" @click="handleDelete" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showResetDialog"
      header="Resetear vistas"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="space-y-3 text-gray-700">
        <p>
          Volver a mostrar <strong>{{ resetTarget?.title }}</strong> a todos los usuarios que ya lo habían cerrado.
        </p>
        <p class="text-sm text-gray-500">
          Se borrarán <strong>{{ resetTarget?.dismissals_count ?? 0 }}</strong> registros de cierre.
          Los usuarios verán de nuevo el mensaje en su próximo poll (hasta 5 min) o al recargar.
        </p>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showResetDialog = false" />
        <Button label="Resetear" severity="info" icon="pi pi-refresh" :loading="isResetting" @click="handleReset" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { format } from 'date-fns'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import type { Broadcast, BroadcastFormInput, BroadcastSeverity } from '@/types/broadcast.types'
import BroadcastFormDialog from './BroadcastFormDialog.vue'

const store = useBroadcastsStore()
const toast = useToast()

const showForm = ref(false)
const editingRecord = ref<Broadcast | null>(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref<Broadcast | null>(null)
const isDeleting = ref(false)
const showResetDialog = ref(false)
const resetTarget = ref<Broadcast | null>(null)
const isResetting = ref(false)

const scopeOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Global', value: 'global' },
  { label: 'Por tienda', value: 'tenant' }
]
const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Vigentes', value: 'active' },
  { label: 'Programados', value: 'scheduled' },
  { label: 'Expirados', value: 'expired' },
  { label: 'Inactivos', value: 'inactive' }
]
const placementOptions = [
  { label: 'Barra', value: 'bar' },
  { label: 'Modal', value: 'modal' }
]
const severityOptions = [
  { label: 'Anuncio', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' }
]

function openCreate() {
  editingRecord.value = null
  showForm.value = true
}
function openEdit(record: Broadcast) {
  editingRecord.value = record
  showForm.value = true
}
function confirmDelete(record: Broadcast) {
  deleteTarget.value = record
  showDeleteDialog.value = true
}
function confirmReset(record: Broadcast) {
  resetTarget.value = record
  showResetDialog.value = true
}

async function handleSave(payload: BroadcastFormInput) {
  if (editingRecord.value) {
    const res = await store.update(editingRecord.value.id, payload)
    if (res.success) showForm.value = false
  } else {
    const res = await store.create(payload)
    if (res.success) showForm.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await store.remove(deleteTarget.value.id)
    showDeleteDialog.value = false
  } finally {
    isDeleting.value = false
    deleteTarget.value = null
  }
}

async function handleReset() {
  if (!resetTarget.value) return
  isResetting.value = true
  try {
    const res = await store.resetDismissals(resetTarget.value.id)
    if (res.success) {
      toast.add({
        severity: 'success',
        summary: 'Vistas reseteadas',
        detail: res.message,
        life: 4000
      })
      showResetDialog.value = false
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al resetear',
      detail: e?.response?.data?.message || e?.message || 'No se pudo resetear',
      life: 5000
    })
  } finally {
    isResetting.value = false
    resetTarget.value = null
  }
}

function formatDate(s: string | null) {
  if (!s) return '—'
  try { return format(new Date(s.replace(' ', 'T')), 'dd MMM yyyy HH:mm') } catch { return s }
}

type Status = 'scheduled' | 'active' | 'expired' | 'inactive'
function statusOf(b: Broadcast): Status {
  if (!b.activo) return 'inactive'
  const now = Date.now()
  if (new Date(b.published_at.replace(' ', 'T')).getTime() > now) return 'scheduled'
  if (new Date(b.expires_at.replace(' ', 'T')).getTime() < now) return 'expired'
  return 'active'
}
function statusLabel(s: Status) {
  return ({ scheduled: 'Programado', active: 'Vigente', expired: 'Expirado', inactive: 'Inactivo' })[s]
}
function statusTagClass(s: Status) {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  return `${base} ` + ({
    scheduled: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
    inactive: 'bg-red-100 text-red-700'
  })[s]
}
function severityLabel(s: BroadcastSeverity) {
  return ({ info: 'Anuncio', warning: 'Warning', danger: 'Danger' })[s]
}
function severityTagClass(s: BroadcastSeverity) {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  return `${base} ` + ({
    info: 'bg-teal-100 text-teal-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700'
  })[s]
}

onMounted(() => store.fetchAll())
</script>
