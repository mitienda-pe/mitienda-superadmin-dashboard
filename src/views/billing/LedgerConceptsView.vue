<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Conceptos facturados</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Las líneas facturadas agrupadas por código de producto. Etiquetar un concepto clasifica de una vez todas sus
        líneas; las que ya tienen etiqueta se respetan, salvo que pidas reemplazarlas.
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="search"
              placeholder="Buscar por código, descripción o cliente..."
              class="w-full"
              @keyup.enter="load"
            />
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="onlyPending" inputId="conceptsPending" binary @change="load" />
          <label for="conceptsPending" class="text-sm text-gray-600">Solo con líneas pendientes</label>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && concepts.length === 0" class="space-y-4">
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
    <div v-else-if="concepts.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-check-circle text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">
        {{ onlyPending ? 'No quedan conceptos con líneas pendientes' : 'Sin conceptos' }}
      </p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <div class="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
        {{ formatNumber(concepts.length) }} conceptos · {{ formatNumber(totalPending) }} líneas pendientes
      </div>

      <DataTable :value="concepts" :loading="loading" dataKey="code" responsiveLayout="scroll" class="p-datatable-sm">
        <Column header="Concepto" style="min-width: 300px">
          <template #body="{ data: row }">
            <div class="text-sm font-semibold text-gray-800 font-mono">{{ row.code || '(sin código)' }}</div>
            <div v-for="(sample, i) in row.samples" :key="i" class="text-xs text-gray-500 truncate max-w-md">
              {{ sample }}
            </div>
          </template>
        </Column>

        <Column header="Líneas" style="min-width: 110px">
          <template #body="{ data: row }">
            <router-link
              :to="{ name: 'BillingLedger', query: { code: row.code } }"
              class="text-sm text-primary-600 hover:underline font-medium"
            >
              {{ formatNumber(row.lines) }}
            </router-link>
            <div v-if="row.pending_lines > 0" class="text-xs font-medium text-amber-600">
              {{ formatNumber(row.pending_lines) }} pendiente{{ row.pending_lines === 1 ? '' : 's' }}
            </div>
            <div v-else class="text-xs text-gray-400">completo</div>
          </template>
        </Column>

        <Column header="Clientes" style="width: 90px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatNumber(row.customers) }}</span>
          </template>
        </Column>

        <Column header="Sin IGV" style="min-width: 120px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.net_pen, 0) }}</span>
            <div class="text-xs text-gray-400">{{ yearRange(row) }}</div>
          </template>
        </Column>

        <Column v-for="dimension in activeDimensions" :key="dimension.id" :header="dimension.name" style="min-width: 150px">
          <template #body="{ data: row }">
            <template v-if="usageOf(row, dimension.id).length > 0">
              <div v-for="usage in usageOf(row, dimension.id).slice(0, 2)" :key="usage.value_id" class="text-xs text-gray-600">
                {{ usage.value_name }}
                <span class="text-gray-400">· {{ formatNumber(usage.lines) }}</span>
              </div>
              <div v-if="usageOf(row, dimension.id).length > 2" class="text-xs text-gray-400">
                y {{ usageOf(row, dimension.id).length - 2 }} más
              </div>
            </template>
            <span v-else-if="dimension.is_required" class="text-xs font-medium text-amber-600">Falta</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column headerStyle="width: 7rem">
          <template #body="{ data: row }">
            <Button label="Etiquetar" icon="pi pi-tags" text size="small" @click="openAssign(row)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Etiquetar concepto -->
    <Dialog v-model:visible="assignVisible" header="Etiquetar concepto" modal :style="{ width: '32rem' }">
      <template v-if="assignConcept">
        <p class="text-sm text-gray-600 mb-4">
          <strong class="font-mono">{{ assignConcept.code || '(sin código)' }}</strong>
          · {{ formatNumber(assignConcept.lines) }} línea{{ assignConcept.lines === 1 ? '' : 's' }} de
          {{ formatNumber(assignConcept.customers) }} cliente{{ assignConcept.customers === 1 ? '' : 's' }}.
          Las dimensiones en "No cambiar" quedan como están.
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
          <div class="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
            <Checkbox v-model="assignOverwrite" inputId="conceptOverwrite" binary class="mt-0.5" />
            <label for="conceptOverwrite" class="text-sm text-gray-600">
              Reemplazar también en las líneas que ya tienen etiqueta. Sin marcar, solo se completan las que no
              tienen, y las excepciones puestas a mano se conservan.
            </label>
          </div>
        </div>
      </template>
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
import { useFormatters } from '@/composables/useFormatters'
import {
  getLedgerDimensions, getLedgerConcepts, assignLedgerConceptTags, ledgerErrorMessage
} from '@/api/ledger.api'
import { orderedValues } from '@/config/ledger.config'
import type { LedgerConcept, LedgerConceptTagUsage, LedgerTagDimension } from '@/types/ledger.types'

const toast = useToast()
const { formatCurrency, formatNumber } = useFormatters()

// Valores centinela del dialogo: no cambiar la dimension, o quitarle la etiqueta.
const KEEP = 0
const CLEAR = -1

const dimensions = ref<LedgerTagDimension[]>([])
const concepts = ref<LedgerConcept[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const onlyPending = ref(true)

const activeDimensions = computed(() => dimensions.value.filter(d => d.is_active))
const totalPending = computed(() => concepts.value.reduce((sum, c) => sum + c.pending_lines, 0))

function usageOf(concept: LedgerConcept, dimensionId: number): LedgerConceptTagUsage[] {
  return concept.tags[dimensionId] ?? []
}

function yearRange(concept: LedgerConcept): string {
  const from = concept.first_date.slice(0, 4)
  const to = concept.last_date.slice(0, 4)
  return from === to ? from : `${from}–${to}`
}

async function load() {
  loading.value = true
  error.value = null
  try {
    concepts.value = await getLedgerConcepts({ pending: onlyPending.value, search: search.value.trim() })
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

// --- Etiquetar ---
const assignVisible = ref(false)
const assigning = ref(false)
const assignConcept = ref<LedgerConcept | null>(null)
const assignOverwrite = ref(false)
const assignChoice = reactive<Record<number, number>>({})

function assignOptions(dimension: LedgerTagDimension) {
  return [
    { label: 'No cambiar', value: KEEP },
    ...orderedValues(dimension).filter(v => v.is_active).map(v => ({ label: v.name, value: v.id })),
    { label: 'Quitar etiqueta', value: CLEAR }
  ]
}

const assignHasChanges = computed(() => activeDimensions.value.some(d => assignChoice[d.id] !== KEEP))

function openAssign(concept: LedgerConcept) {
  assignConcept.value = concept
  assignOverwrite.value = false
  // Siempre se parte de "no cambiar": un concepto puede tener lineas con
  // etiquetas distintas y preseleccionar la mas frecuente invitaria a pisarlas.
  for (const dimension of activeDimensions.value) {
    assignChoice[dimension.id] = KEEP
  }
  assignVisible.value = true
}

async function saveAssign() {
  if (!assignConcept.value) return

  const tags: Record<number, number | null> = {}
  for (const dimension of activeDimensions.value) {
    const choice = assignChoice[dimension.id]
    if (choice === KEEP) continue
    tags[dimension.id] = choice === CLEAR ? null : choice
  }

  assigning.value = true
  try {
    const affected = await assignLedgerConceptTags(assignConcept.value.code, tags, assignOverwrite.value)
    assignVisible.value = false
    toast.add({
      severity: affected > 0 ? 'success' : 'info',
      summary: affected > 0 ? 'Concepto etiquetado' : 'Sin cambios',
      detail:
        affected > 0
          ? `${affected} etiqueta${affected === 1 ? '' : 's'} actualizada${affected === 1 ? '' : 's'}`
          : 'Todas las líneas ya tenían etiqueta en esas dimensiones. Marca "Reemplazar" para cambiarlas.',
      life: 6000
    })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: ledgerErrorMessage(e), life: 8000 })
  } finally {
    assigning.value = false
  }
}

onMounted(async () => {
  try {
    dimensions.value = await getLedgerDimensions()
  } catch (e) {
    error.value = ledgerErrorMessage(e)
    return
  }
  load()
})
</script>
