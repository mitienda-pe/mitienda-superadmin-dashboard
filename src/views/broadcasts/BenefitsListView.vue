<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Beneficios para comercios</h1>
        <p class="text-sm text-gray-500 mt-1">
          Tarjetas de partners y de nuestras apps (POS, Kiosco) en el backoffice. Todas aparecen también en la página
          "Beneficios" del comerciante.
        </p>
      </div>
      <Button label="Nuevo beneficio" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{{ error }}</div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="items.length === 0" class="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <i class="pi pi-gift text-gray-300 text-5xl mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Todavía no hay beneficios</h3>
      <p class="text-gray-500 mb-6">Crea el primero: un partner como Doppler o una de nuestras apps.</p>
      <Button label="Crear beneficio" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable :value="items" stripedRows responsiveLayout="scroll">
        <Column header="Beneficio">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <img
                v-if="data.image_url"
                :src="data.image_url"
                alt=""
                class="w-[65px] h-[50px] object-cover rounded border border-gray-100 shrink-0"
              />
              <div class="min-w-0">
                <div class="text-[11px] uppercase tracking-wide text-gray-400">{{ data.partner_name }}</div>
                <div class="font-medium text-gray-900">{{ data.title }}</div>
                <div class="text-xs text-gray-500 truncate max-w-md">{{ data.body }}</div>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Tipo">
          <template #body="{ data }">
            <span
              :class="['px-2 py-0.5 rounded text-xs font-medium',
                data.kind === 'own_app' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-700']"
            >
              {{ data.kind === 'own_app' ? 'App propia' : 'Partner' }}
            </span>
            <div v-if="data.hide_if_uses" class="text-[11px] text-gray-500 mt-1">
              Oculto si: {{ BENEFIT_USAGE_LABELS[data.hide_if_uses as BenefitUsageKey].toLowerCase() }}
            </div>
          </template>
        </Column>
        <Column header="Dónde">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1 max-w-[220px]">
              <span
                v-for="slot in data.slots"
                :key="slot"
                class="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-[11px] text-gray-600"
              >
                {{ shortSlot(slot) }}
              </span>
              <span v-if="!data.slots.length" class="text-[11px] text-gray-400">Solo en la página</span>
            </div>
          </template>
        </Column>
        <Column header="Alcance">
          <template #body="{ data }">
            <span class="text-xs text-gray-600">
              {{ data.target_scope === 'stores' ? `${data.tiendas.length} tiendas` : 'Todas' }}
            </span>
          </template>
        </Column>
        <Column header="Vigencia">
          <template #body="{ data }">
            <div class="text-xs text-gray-600">
              {{ formatDate(data.published_at) }} → {{ data.expires_at ? formatDate(data.expires_at) : 'sin fin' }}
            </div>
            <span :class="statusClass(statusOf(data))" class="mt-1 inline-block">{{ statusLabel(statusOf(data)) }}</span>
          </template>
        </Column>
        <Column header="Clics 30 d">
          <template #body="{ data }">
            <span class="text-sm text-gray-700 tabular-nums">{{ data.clicks_30d ?? 0 }}</span>
          </template>
        </Column>
        <Column header="" style="width: 150px">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1 whitespace-nowrap">
              <InputSwitch
                :modelValue="data.activo"
                v-tooltip.top="data.activo ? 'Pausar' : 'Activar'"
                @update:modelValue="toggleActive(data, $event)"
              />
              <Button icon="pi pi-pencil" text rounded v-tooltip.top="'Editar'" @click="openEdit(data)" />
              <Button icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="'Eliminar'" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <BenefitFormDialog v-model:visible="showForm" :record="editingRecord" :saving="isSaving" @submit="handleSave" />

    <Dialog
      :draggable="false"
      v-model:visible="showDeleteDialog"
      header="Eliminar beneficio"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <p class="text-gray-700">
        ¿Eliminar <strong>{{ deleteTarget?.title }}</strong>? Deja de mostrarse de inmediato. Si solo quieres pausarlo,
        usa el interruptor.
      </p>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="Eliminar" severity="danger" icon="pi pi-trash" :loading="isDeleting" @click="handleDelete" />
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
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { createBenefit, deleteBenefit, listBenefits, updateBenefit } from '@/api/benefits.api'
import type { Benefit, BenefitFormInput, BenefitSlot, BenefitUsageKey } from '@/types/benefit.types'
import { BENEFIT_USAGE_LABELS } from '@/types/benefit.types'
import BenefitFormDialog from './BenefitFormDialog.vue'

const toast = useToast()

const items = ref<Benefit[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

const showForm = ref(false)
const editingRecord = ref<Benefit | null>(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref<Benefit | null>(null)
const isDeleting = ref(false)

function apiMessage(e: any, fallback: string) {
  return e?.response?.data?.message || e?.message || fallback
}

async function fetchAll() {
  isLoading.value = true
  error.value = null
  try {
    const res = await listBenefits()
    items.value = res.data ?? []
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar los beneficios')
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  editingRecord.value = null
  showForm.value = true
}
function openEdit(record: Benefit) {
  editingRecord.value = record
  showForm.value = true
}
function confirmDelete(record: Benefit) {
  deleteTarget.value = record
  showDeleteDialog.value = true
}

async function handleSave(payload: BenefitFormInput) {
  isSaving.value = true
  try {
    if (editingRecord.value) {
      await updateBenefit(editingRecord.value.id, payload)
    } else {
      await createBenefit(payload)
    }
    showForm.value = false
    toast.add({ severity: 'success', summary: 'Beneficio guardado', life: 3000 })
    await fetchAll()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: apiMessage(e, 'Error al guardar'), life: 5000 })
  } finally {
    isSaving.value = false
  }
}

async function toggleActive(record: Benefit, value: boolean) {
  const previous = record.activo
  record.activo = value
  try {
    await updateBenefit(record.id, { activo: value })
  } catch (e) {
    record.activo = previous
    toast.add({ severity: 'error', summary: 'No se pudo cambiar', detail: apiMessage(e, 'Error'), life: 5000 })
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await deleteBenefit(deleteTarget.value.id)
    showDeleteDialog.value = false
    await fetchAll()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo eliminar', detail: apiMessage(e, 'Error'), life: 5000 })
  } finally {
    isDeleting.value = false
    deleteTarget.value = null
  }
}

function shortSlot(slot: BenefitSlot) {
  return ({ sidebar: 'Menú', dashboard: 'Inicio', orders: 'Pedidos', products: 'Productos', customers: 'Clientes' })[slot]
}

function formatDate(s: string | null) {
  if (!s) return '—'
  try { return format(new Date(s.replace(' ', 'T')), 'dd MMM yyyy') } catch { return s }
}

type Status = 'scheduled' | 'active' | 'expired' | 'inactive'
function statusOf(b: Benefit): Status {
  if (!b.activo) return 'inactive'
  const now = Date.now()
  if (new Date(b.published_at.replace(' ', 'T')).getTime() > now) return 'scheduled'
  if (b.expires_at && new Date(b.expires_at.replace(' ', 'T')).getTime() < now) return 'expired'
  return 'active'
}
function statusLabel(s: Status) {
  return ({ scheduled: 'Programado', active: 'Vigente', expired: 'Terminado', inactive: 'Pausado' })[s]
}
function statusClass(s: Status) {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  return `${base} ` + ({
    scheduled: 'bg-amber-100 text-amber-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
    inactive: 'bg-red-100 text-red-700'
  })[s]
}

onMounted(fetchAll)
</script>
