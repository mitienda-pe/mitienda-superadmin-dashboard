<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Líneas facturadas</h1>
      <p class="text-sm text-gray-500 mt-1">
        Cada línea de los comprobantes emitidos por MiTienda, con su clasificación. Las etiquetas son de control
        interno: no aparecen en el comprobante.
      </p>
    </div>

    <!-- Pendientes -->
    <div
      v-if="pendingTotal > 0"
      class="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <i class="pi pi-tag text-amber-500"></i>
      <span class="text-sm text-amber-800">
        <strong>{{ formatNumber(pendingTotal) }}</strong>
        {{ pendingTotal === 1 ? 'línea sin clasificar' : 'líneas sin clasificar' }}: les falta
        {{ requiredNames }}. No entran bien en el reporte de ingresos hasta etiquetarlas.
      </span>
      <div class="flex-1"></div>
      <Button
        v-if="!filters.pending"
        label="Ver solo pendientes"
        size="small"
        severity="warning"
        outlined
        @click="setPending(true)"
      />
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="filters.search"
              placeholder="Buscar comprobante, RUC, cliente o descripción..."
              class="w-full"
              @keyup.enter="reload"
            />
          </span>
        </div>
        <InputText v-model="filters.period" type="month" class="w-44" @change="reload" />
        <Dropdown
          v-model="filters.origin"
          :options="originOptions"
          optionLabel="label"
          optionValue="value"
          class="w-44"
          @change="reload"
        />
        <Dropdown
          v-model="filters.value_id"
          :options="valueFilterOptions"
          optionLabel="label"
          optionValue="value"
          optionGroupLabel="label"
          optionGroupChildren="items"
          placeholder="Etiqueta"
          showClear
          class="w-56"
          @change="reload"
        />
        <span
          v-if="filters.code !== null"
          class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
        >
          Concepto: <strong>{{ filters.code || 'sin código' }}</strong>
          <i class="pi pi-times cursor-pointer text-xs text-gray-400 hover:text-gray-600" @click="clearCode"></i>
        </span>
        <div class="flex items-center gap-2">
          <Checkbox :modelValue="filters.pending" inputId="onlyPending" binary @update:modelValue="setPending" />
          <label for="onlyPending" class="text-sm text-gray-600">Solo pendientes</label>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && items.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-check-circle text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">
        {{ filters.pending ? 'No hay líneas pendientes con estos filtros' : 'Sin líneas' }}
      </p>
      <p class="text-sm text-gray-400 mt-1">Prueba con otro periodo o quita filtros</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <div
        v-if="selectedIds.length > 0"
        class="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3"
      >
        <span class="text-sm font-medium text-gray-700">
          {{ selectedIds.length }} seleccionada{{ selectedIds.length === 1 ? '' : 's' }}
          · {{ formatCurrency(selectedNet, 2) }} sin IGV
        </span>
        <div class="flex-1"></div>
        <Button label="Limpiar" severity="secondary" text size="small" @click="selectedIds = []" />
        <Button label="Etiquetar seleccionadas" icon="pi pi-tags" size="small" @click="openAssign(selectedIds)" />
      </div>

      <!-- Todo el filtro, no solo la pagina: para clasificar por lo que la linea
           dice (una busqueda, un cliente) cuando el codigo no agrupa bien. -->
      <div
        v-else-if="canTagAll"
        class="flex flex-wrap items-center gap-4 border-b border-gray-200 px-4 py-3"
      >
        <span class="text-sm text-gray-600">
          <strong class="font-semibold text-gray-800">{{ formatNumber(meta.total) }}</strong>
          {{ meta.total === 1 ? 'línea cumple' : 'líneas cumplen' }} este filtro
          · {{ formatCurrency(totalNet, 2) }} sin IGV
        </span>
        <div class="flex-1"></div>
        <Button
          label="Etiquetar todos los resultados"
          icon="pi pi-tags"
          size="small"
          outlined
          @click="openAssignAll"
        />
      </div>

      <DataTable :value="items" :loading="loading" dataKey="id" responsiveLayout="scroll" class="p-datatable-sm">
        <Column headerStyle="width: 3rem">
          <template #header>
            <Checkbox :modelValue="allSelected" binary @update:modelValue="toggleAll" />
          </template>
          <template #body="{ data: row }">
            <Checkbox :modelValue="selectedIds.includes(row.id)" binary @update:modelValue="toggle(row.id)" />
          </template>
        </Column>

        <Column header="Comprobante" style="min-width: 130px">
          <template #body="{ data: row }">
            <a
              v-if="row.pdf_url"
              :href="row.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              {{ row.comprobante }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
            <span v-else class="text-sm text-gray-700 font-medium">{{ row.comprobante }}</span>
            <div class="text-xs text-gray-400">{{ formatDate(row.issue_date) }}</div>
          </template>
        </Column>

        <Column header="Cliente" style="min-width: 180px">
          <template #body="{ data: row }">
            <div class="text-sm text-gray-700">{{ row.customer_name || '-' }}</div>
            <div class="text-xs text-gray-400 font-mono">{{ row.customer_document }}</div>
          </template>
        </Column>

        <Column header="Línea" style="min-width: 260px">
          <template #body="{ data: row }">
            <div class="text-sm text-gray-700">{{ row.description }}</div>
            <div class="text-xs text-gray-400">{{ originLabel(row.origin) }}</div>
          </template>
        </Column>

        <Column header="Sin IGV" style="min-width: 110px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">
              {{ row.currency === 'USD' ? 'US$ ' + row.net_amount.toFixed(2) : formatCurrency(row.net_amount, 2) }}
            </span>
          </template>
        </Column>

        <Column v-for="dimension in activeDimensions" :key="dimension.id" :header="dimension.name" style="min-width: 130px">
          <template #body="{ data: row }">
            <span
              v-if="tagOf(row, dimension.id)"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="tagOf(row, dimension.id)!.source === 'manual' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'"
              v-tooltip.top="tagOf(row, dimension.id)!.source === 'manual' ? 'Puesta a mano' : 'Puesta por regla'"
            >
              {{ tagOf(row, dimension.id)!.value_name }}
            </span>
            <span v-else-if="dimension.is_required" class="text-xs font-medium text-amber-600">Falta</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column headerStyle="width: 3rem">
          <template #body="{ data: row }">
            <Button icon="pi pi-tag" text rounded size="small" v-tooltip.left="'Etiquetar'" @click="openAssign([row.id])" />
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ meta.current_page }} de {{ meta.total_pages }} ({{ formatNumber(meta.total) }} líneas)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="meta.current_page <= 1"
            @click="goToPage(meta.current_page - 1)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="meta.current_page >= meta.total_pages"
            @click="goToPage(meta.current_page + 1)"
          />
        </div>
      </div>
    </div>

    <!-- Etiquetar -->
    <Dialog v-model:visible="assignVisible" header="Etiquetar líneas" modal :style="{ width: '32rem' }">
      <p v-if="assignScope === 'filter'" class="text-sm text-gray-600 mb-4">
        Se etiquetan <strong>las {{ formatNumber(assignAllTotal) }} líneas del filtro</strong>
        ({{ formatCurrency(totalNet, 2) }} sin IGV), no solo las de esta página:
        <span class="text-gray-800">{{ filterSummary }}</span>.
        Las dimensiones que dejes en "No cambiar" quedan como están.
      </p>
      <p v-else class="text-sm text-gray-600 mb-4">
        {{ assignIds.length === 1 ? 'Se etiqueta 1 línea.' : `Se etiquetan ${assignIds.length} líneas.` }}
        Las dimensiones que dejes en "No cambiar" quedan como están.
      </p>
      <div class="space-y-4">
        <div v-for="dimension in activeDimensions" :key="dimension.id">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ dimension.name }}
            <span v-if="dimension.is_required" class="text-xs font-normal text-gray-400">(obligatoria)</span>
          </label>
          <Dropdown
            v-model="assignChoice[dimension.id]"
            :options="assignOptions(dimension)"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div v-if="assignScope === 'filter'" class="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
          <Checkbox v-model="assignOverwrite" inputId="filterOverwrite" binary class="mt-0.5" />
          <label for="filterOverwrite" class="text-sm text-gray-600">
            Reemplazar también en las líneas que ya tienen etiqueta. Sin marcar, solo se completan las que no tienen.
          </label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="assignVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="assigning" :disabled="!assignHasChanges" @click="saveAssign" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useRoute } from 'vue-router'
import { useFormatters } from '@/composables/useFormatters'
import {
  getLedgerDimensions, getLedgerItems, assignLedgerTags, assignLedgerTagsByFilter, ledgerErrorMessage
} from '@/api/ledger.api'
import { orderedValues } from '@/config/ledger.config'
import type {
  LedgerItem, LedgerItemFilters, LedgerItemTag, LedgerOrigin, LedgerTagDimension
} from '@/types/ledger.types'

const toast = useToast()
const route = useRoute()
const { formatCurrency, formatDate, formatNumber } = useFormatters()

// Valores centinela del dialogo: no cambiar la dimension, o quitarle la etiqueta.
const KEEP = 0
const CLEAR = -1

const dimensions = ref<LedgerTagDimension[]>([])
const items = ref<LedgerItem[]>([])
const meta = ref({ current_page: 1, per_page: 50, total: 0, total_pages: 1 })
const pendingTotal = ref(0)
const totalNet = ref(0)
// Los filtros con los que se cargo lo que esta en pantalla. Lo que se escribe en
// el buscador no cuenta hasta buscar: "todos los resultados" son los que se ven.
const appliedFilters = ref<LedgerItemFilters | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Se abre en pendientes y sin periodo: lo que hay que resolver puede ser de
// cualquier mes, y filtrar por el mes actual lo escondería.
const filters = reactive<LedgerItemFilters>({
  pending: true,
  period: '',
  origin: 'all',
  value_id: null,
  code: null,
  search: '',
  page: 1,
  per_page: 50
})

const originLabels: Record<LedgerOrigin, string> = {
  suscripcion: 'Suscripción',
  comision: 'Comisión',
  otros: 'Otros conceptos',
  manual: 'Emisión manual',
  importado: 'Importado'
}

const originOptions = [
  { label: 'Todos los orígenes', value: 'all' },
  ...Object.entries(originLabels).map(([value, label]) => ({ label, value }))
]

function originLabel(origin: LedgerOrigin): string {
  return originLabels[origin] ?? origin
}

const activeDimensions = computed(() => dimensions.value.filter(d => d.is_active))

const requiredNames = computed(() =>
  activeDimensions.value
    .filter(d => d.is_required)
    .map(d => d.name.toLowerCase())
    .join(' o ')
)

const valueFilterOptions = computed(() =>
  activeDimensions.value.map(d => ({
    label: d.name,
    items: orderedValues(d).map(v => ({ label: v.name, value: v.id }))
  }))
)

function tagOf(row: LedgerItem, dimensionId: number): LedgerItemTag | undefined {
  return row.tags.find(t => t.dimension_id === dimensionId)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const requested = { ...filters }
    const res = await getLedgerItems(requested)
    items.value = res.data
    meta.value = res.meta
    pendingTotal.value = res.summary.pending_total
    totalNet.value = res.summary.total_net
    appliedFilters.value = requested
    // La seleccion no sobrevive a un cambio de pagina o de filtro: etiquetar
    // lineas que ya no se ven seria etiquetar a ciegas.
    selectedIds.value = []
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function reload() {
  filters.page = 1
  load()
}

function setPending(value: boolean) {
  filters.pending = value
  reload()
}

function clearCode() {
  filters.code = null
  reload()
}

function goToPage(page: number) {
  filters.page = page
  load()
}

// --- Seleccion ---
const selectedIds = ref<number[]>([])

const allSelected = computed(() => items.value.length > 0 && selectedIds.value.length === items.value.length)

const selectedNet = computed(() =>
  items.value.filter(i => selectedIds.value.includes(i.id)).reduce((sum, i) => sum + i.net_amount, 0)
)

function toggle(id: number) {
  const i = selectedIds.value.indexOf(id)
  i === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(i, 1)
}

function toggleAll(value: boolean) {
  selectedIds.value = value ? items.value.map(i => i.id) : []
}

// --- Etiquetar ---
const assignVisible = ref(false)
const assigning = ref(false)
const assignIds = ref<number[]>([])
const assignChoice = reactive<Record<number, number>>({})

function assignOptions(dimension: LedgerTagDimension) {
  return [
    { label: 'No cambiar', value: KEEP },
    ...orderedValues(dimension).filter(v => v.is_active).map(v => ({ label: v.name, value: v.id })),
    { label: 'Quitar etiqueta', value: CLEAR }
  ]
}

const assignHasChanges = computed(() => activeDimensions.value.some(d => assignChoice[d.id] !== KEEP))

// "selection": las lineas marcadas. "filter": todas las del filtro aplicado.
const assignScope = ref<'selection' | 'filter'>('selection')
const assignOverwrite = ref(false)
const assignAllTotal = ref(0)

// Etiquetar todo solo se ofrece con el listado acotado: sin filtro serian todas
// las lineas del libro, y "solo pendientes" por si solo no acota lo suficiente.
const canTagAll = computed(() => {
  const f = appliedFilters.value
  if (!f || meta.value.total === 0) return false
  return !!f.search.trim() || f.code !== null || !!f.period || f.origin !== 'all' || !!f.value_id
})

/** El filtro aplicado, en palabras, para confirmar a que se le va a poner la etiqueta. */
const filterSummary = computed(() => {
  const f = appliedFilters.value
  if (!f) return ''

  const parts: string[] = []
  if (f.search.trim()) parts.push(`búsqueda "${f.search.trim()}"`)
  if (f.code !== null) parts.push(`concepto ${f.code || 'sin código'}`)
  if (f.period) parts.push(`periodo ${f.period}`)
  if (f.origin !== 'all') parts.push(`origen ${originLabel(f.origin)}`)
  if (f.value_id) {
    const value = activeDimensions.value.flatMap(d => d.values).find(v => v.id === f.value_id)
    if (value) parts.push(`con etiqueta ${value.name}`)
  }
  if (f.pending) parts.push('solo pendientes')

  return parts.join(', ')
})

function openAssignAll() {
  assignScope.value = 'filter'
  assignOverwrite.value = false
  assignAllTotal.value = meta.value.total
  for (const dimension of activeDimensions.value) {
    assignChoice[dimension.id] = KEEP
  }
  assignVisible.value = true
}

function openAssign(ids: number[]) {
  assignScope.value = 'selection'
  assignIds.value = [...ids]
  const single = ids.length === 1 ? items.value.find(i => i.id === ids[0]) : undefined

  for (const dimension of activeDimensions.value) {
    // Con una sola linea se parte de lo que ya tiene; con varias, de "no
    // cambiar", para no pisar por accidente lo que difiere entre ellas.
    const current = single ? tagOf(single, dimension.id) : undefined
    const stillOffered = current && dimension.values.some(v => v.id === current.value_id && v.is_active)
    assignChoice[dimension.id] = stillOffered ? current!.value_id : KEEP
  }

  assignVisible.value = true
}

async function saveAssign() {
  const tags: Record<number, number | null> = {}
  for (const dimension of activeDimensions.value) {
    const choice = assignChoice[dimension.id]
    if (choice === KEEP) continue
    tags[dimension.id] = choice === CLEAR ? null : choice
  }

  assigning.value = true
  try {
    if (assignScope.value === 'filter' && appliedFilters.value) {
      const result = await assignLedgerTagsByFilter(appliedFilters.value, tags, assignOverwrite.value, assignAllTotal.value)
      assignVisible.value = false
      toast.add({
        severity: result.affected > 0 ? 'success' : 'info',
        summary: result.affected > 0 ? 'Etiquetas guardadas' : 'Sin cambios',
        detail:
          result.affected > 0
            ? `${result.affected} etiqueta${result.affected === 1 ? '' : 's'} en ${result.matched} línea${result.matched === 1 ? '' : 's'}`
            : 'Todas las líneas ya tenían etiqueta en esas dimensiones. Marca "Reemplazar" para cambiarlas.',
        life: 6000
      })
    } else {
      const affected = await assignLedgerTags(assignIds.value, tags)
      assignVisible.value = false
      toast.add({
        severity: 'success',
        summary: 'Etiquetas guardadas',
        detail: affected === 1 ? '1 línea actualizada' : `${affected} líneas actualizadas`,
        life: 4000
      })
    }
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: ledgerErrorMessage(e), life: 8000 })
    // Si el API rechazo porque los resultados cambiaron, se recarga para que
    // la persona vea el total actual antes de reintentar.
    if (assignScope.value === 'filter') {
      assignVisible.value = false
      load()
    }
  } finally {
    assigning.value = false
  }
}

onMounted(async () => {
  // Desde "Conceptos" se llega con ?code=XXX (vacio = lineas sin codigo). Ahi
  // interesa ver todo el concepto, no solo lo pendiente.
  if (typeof route.query.code === 'string') {
    filters.code = route.query.code
    filters.pending = route.query.pending === '1'
  }

  try {
    dimensions.value = await getLedgerDimensions()
  } catch (e) {
    error.value = ledgerErrorMessage(e)
    return
  }
  load()
})
</script>
