<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Libro de Reclamaciones</h1>
        <p class="text-sm text-gray-500 mt-1">
          Reclamos y quejas registrados desde el landing page de la plataforma.
        </p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <button
        type="button"
        class="bg-white rounded-xl border border-gray-200 p-4 text-left transition hover:border-primary-300 hover:shadow-sm"
        :class="{ 'ring-2 ring-primary-500': store.filters.status === 'all' }"
        @click="applyStatus('all')"
      >
        <div class="text-xs text-gray-500 uppercase tracking-wide">Total</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ store.stats?.total ?? '—' }}</div>
      </button>
      <button
        type="button"
        class="bg-white rounded-xl border border-gray-200 p-4 text-left transition hover:border-amber-300 hover:shadow-sm"
        :class="{ 'ring-2 ring-amber-500': store.filters.status === 'pending' }"
        @click="applyStatus('pending')"
      >
        <div class="text-xs text-gray-500 uppercase tracking-wide">Pendientes</div>
        <div class="text-2xl font-bold text-amber-600 mt-1">{{ store.stats?.pending ?? '—' }}</div>
      </button>
      <button
        type="button"
        class="bg-white rounded-xl border border-gray-200 p-4 text-left transition hover:border-green-300 hover:shadow-sm"
        :class="{ 'ring-2 ring-green-500': store.filters.status === 'attended' }"
        @click="applyStatus('attended')"
      >
        <div class="text-xs text-gray-500 uppercase tracking-wide">Atendidos</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ store.stats?.attended ?? '—' }}</div>
      </button>
      <button
        type="button"
        class="bg-white rounded-xl border border-gray-200 p-4 text-left transition hover:border-red-300 hover:shadow-sm"
        :class="{ 'ring-2 ring-red-500': store.filters.status === 'unseen' }"
        @click="applyStatus('unseen')"
      >
        <div class="text-xs text-gray-500 uppercase tracking-wide">No vistos</div>
        <div class="text-2xl font-bold text-red-600 mt-1">{{ store.stats?.unseen ?? '—' }}</div>
      </button>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="text-xs text-gray-500 uppercase tracking-wide">Reclamos / Quejas</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">
          {{ store.stats?.reclamos ?? '—' }} <span class="text-gray-400">/</span>
          {{ store.stats?.quejas ?? '—' }}
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
      <span class="p-input-icon-left md:col-span-2">
        <i class="pi pi-search" />
        <InputText
          v-model="searchInput"
          placeholder="Buscar por código, nombre, email, documento o tienda..."
          class="w-full"
          @keyup.enter="applySearch"
        />
      </span>
      <Dropdown
        v-model="typeFilter"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo"
        showClear
        @change="applyType"
      />
      <Calendar
        v-model="dateFromInput"
        placeholder="Desde"
        dateFormat="dd/mm/yy"
        showIcon
        @date-select="applyDates"
        @clear-click="applyDates"
      />
      <Calendar
        v-model="dateToInput"
        placeholder="Hasta"
        dateFormat="dd/mm/yy"
        showIcon
        @date-select="applyDates"
        @clear-click="applyDates"
      />
    </div>

    <div v-if="store.error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {{ store.error }}
    </div>

    <div v-if="store.isLoading && !store.items.length" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="!store.items.length" class="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <i class="pi pi-inbox text-gray-300 text-5xl mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Sin reclamos</h3>
      <p class="text-gray-500">No hay registros para los filtros seleccionados.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="store.items"
        stripedRows
        responsiveLayout="scroll"
        :loading="store.isLoading"
      >
        <Column header="Código" style="width: 140px">
          <template #body="{ data }">
            <div class="font-mono text-xs text-gray-700">{{ data.code || '—' }}</div>
            <div v-if="!data.seen" class="mt-1">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold uppercase">Nuevo</span>
            </div>
          </template>
        </Column>
        <Column header="Fecha" style="width: 140px">
          <template #body="{ data }">
            <div class="text-sm text-gray-700">{{ formatDate(data.created_at || data.date) }}</div>
          </template>
        </Column>
        <Column header="Tipo" style="width: 100px">
          <template #body="{ data }">
            <span :class="typeTagClass(data.complaint_type_id)">
              {{ data.complaint_type || '—' }}
            </span>
          </template>
        </Column>
        <Column header="Cliente">
          <template #body="{ data }">
            <div class="font-medium text-gray-900">{{ data.name || '—' }}</div>
            <div class="text-xs text-gray-500">
              {{ data.document_type }} {{ data.document_number }} · {{ data.email }}
            </div>
          </template>
        </Column>
        <Column header="Tienda">
          <template #body="{ data }">
            <span v-if="data.tienda_id" class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
              <i class="pi pi-shop mr-1" />
              {{ data.tienda_nombre || '#' + data.tienda_id }}
            </span>
            <span v-else class="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-xs font-medium">
              <i class="pi pi-globe mr-1" />
              Plataforma
            </span>
          </template>
        </Column>
        <Column header="Estado" style="width: 110px">
          <template #body="{ data }">
            <span :class="statusTagClass(data.status)">
              {{ data.status === 'pending' ? 'Pendiente' : 'Atendido' }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 80px">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              text
              rounded
              v-tooltip.top="'Ver detalle'"
              @click="goToDetail(data.id)"
            />
          </template>
        </Column>
      </DataTable>

      <div v-if="store.pagination.totalPages > 1" class="flex items-center justify-between p-4 border-t border-gray-200 text-sm">
        <div class="text-gray-600">
          Mostrando {{ pageStart }}–{{ pageEnd }} de {{ store.pagination.total }}
        </div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-angle-left"
            text
            :disabled="store.pagination.page <= 1"
            @click="goToPage(store.pagination.page - 1)"
          />
          <span class="text-gray-700">
            Página {{ store.pagination.page }} / {{ store.pagination.totalPages }}
          </span>
          <Button
            icon="pi pi-angle-right"
            text
            :disabled="!store.pagination.hasMore"
            @click="goToPage(store.pagination.page + 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'
import { useComplaintsStore } from '@/stores/complaints.store'
import type { ComplaintStatusFilter, ComplaintTypeFilter } from '@/types/complaint.types'

const router = useRouter()
const store = useComplaintsStore()

const searchInput = ref(store.filters.search ?? '')
const typeFilter = ref<ComplaintTypeFilter>((store.filters.type ?? '') as ComplaintTypeFilter)
const dateFromInput = ref<Date | null>(store.filters.date_from ? new Date(store.filters.date_from) : null)
const dateToInput = ref<Date | null>(store.filters.date_to ? new Date(store.filters.date_to) : null)

const typeOptions = [
  { label: 'Reclamo', value: '1' },
  { label: 'Queja', value: '2' }
]

const pageStart = computed(() => {
  if (!store.pagination.total) return 0
  return (store.pagination.page - 1) * store.pagination.perPage + 1
})
const pageEnd = computed(() => {
  return Math.min(store.pagination.page * store.pagination.perPage, store.pagination.total)
})

function formatDate(s?: string | null) {
  if (!s) return '—'
  try {
    return format(new Date(s.replace(' ', 'T')), 'dd MMM yyyy')
  } catch {
    return s
  }
}

function statusTagClass(s: string) {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  return s === 'pending' ? `${base} bg-amber-100 text-amber-800` : `${base} bg-green-100 text-green-800`
}

function typeTagClass(typeId: number) {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  return typeId === 1 ? `${base} bg-blue-100 text-blue-800` : `${base} bg-purple-100 text-purple-800`
}

function applyStatus(status: ComplaintStatusFilter) {
  store.setFilters({ status })
  store.fetchAll()
}

function applyType() {
  store.setFilters({ type: typeFilter.value })
  store.fetchAll()
}

function applySearch() {
  store.setFilters({ search: searchInput.value.trim() })
  store.fetchAll()
}

function applyDates() {
  store.setFilters({
    date_from: dateFromInput.value ? toISODate(dateFromInput.value) : null,
    date_to: dateToInput.value ? toISODate(dateToInput.value) : null
  })
  store.fetchAll()
}

function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function goToPage(page: number) {
  store.setPage(page)
  store.fetchAll()
}

function goToDetail(id: number) {
  router.push({ name: 'ComplaintDetail', params: { id } })
}

onMounted(() => {
  store.fetchAll()
  store.fetchStats()
})
</script>
