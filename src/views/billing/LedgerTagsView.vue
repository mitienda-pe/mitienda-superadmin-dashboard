<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Etiquetas de ingresos</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Dimensiones con las que se clasifica cada línea facturada. Una línea lleva un solo valor por dimensión, así
          cada reporte suma exactamente lo facturado. No aparecen en el comprobante.
        </p>
      </div>
      <Button label="Nueva dimensión" icon="pi pi-plus" @click="openDimensionDialog()" />
    </div>

    <!-- Loading -->
    <div v-if="loading && dimensions.length === 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
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

    <!-- Dimensiones -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div
        v-for="dimension in dimensions"
        :key="dimension.id"
        class="bg-white rounded-xl border border-gray-200"
        :class="{ 'opacity-60': !dimension.is_active }"
      >
        <div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base font-semibold text-gray-900">{{ dimension.name }}</h2>
              <span
                v-if="dimension.is_required"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
              >
                Obligatoria
              </span>
              <span
                v-if="!dimension.is_active"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              >
                Desactivada
              </span>
            </div>
            <p v-if="dimension.description" class="text-sm text-gray-500 mt-1">{{ dimension.description }}</p>
          </div>
          <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.left="'Editar dimensión'" @click="openDimensionDialog(dimension)" />
        </div>

        <ul class="divide-y divide-gray-100">
          <li v-for="value in dimension.values" :key="value.id" class="flex items-center gap-3 px-5 py-2.5">
            <span class="flex-1 text-sm" :class="value.is_active ? 'text-gray-700' : 'text-gray-400 line-through'">
              {{ value.name }}
            </span>
            <span class="text-xs text-gray-400">
              {{ value.items_count === 0 ? 'sin uso' : formatNumber(value.items_count) + (value.items_count === 1 ? ' línea' : ' líneas') }}
            </span>
            <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.top="'Renombrar'" @click="openValueDialog(dimension, value)" />
            <Button
              :icon="value.is_active ? 'pi pi-eye-slash' : 'pi pi-eye'"
              text
              rounded
              size="small"
              severity="secondary"
              v-tooltip.top="value.is_active ? 'Desactivar: deja de ofrecerse, las líneas la conservan' : 'Activar'"
              @click="toggleValue(value)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              :disabled="value.items_count > 0"
              v-tooltip.top="value.items_count > 0 ? 'En uso: solo se puede desactivar' : 'Borrar'"
              @click="removeValue(value)"
            />
          </li>
          <li v-if="dimension.values.length === 0" class="px-5 py-4 text-sm text-gray-400">Sin valores todavía</li>
        </ul>

        <div class="px-5 py-3 border-t border-gray-100">
          <Button label="Agregar valor" icon="pi pi-plus" text size="small" @click="openValueDialog(dimension)" />
        </div>
      </div>
    </div>

    <!-- Dimension -->
    <Dialog
      v-model:visible="dimensionDialogVisible"
      :header="dimensionForm.id ? 'Editar dimensión' : 'Nueva dimensión'"
      modal
      :style="{ width: '30rem' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <InputText v-model="dimensionForm.name" class="w-full" maxlength="80" placeholder="Ej. Canal de venta" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <InputText v-model="dimensionForm.description" class="w-full" maxlength="255" />
        </div>
        <div class="flex items-start gap-2">
          <Checkbox v-model="dimensionForm.is_required" inputId="dimRequired" binary class="mt-0.5" />
          <label for="dimRequired" class="text-sm text-gray-600">
            Obligatoria: una línea sin esta dimensión cuenta como pendiente de etiquetar.
          </label>
        </div>
        <div v-if="dimensionForm.id" class="flex items-start gap-2">
          <Checkbox v-model="dimensionForm.is_active" inputId="dimActive" binary class="mt-0.5" />
          <label for="dimActive" class="text-sm text-gray-600">
            Activa. Desactivada deja de ofrecerse al etiquetar; las líneas conservan lo que ya tienen.
          </label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="dimensionDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" :disabled="!dimensionForm.name.trim()" @click="saveDimension" />
      </template>
    </Dialog>

    <!-- Valor -->
    <Dialog
      v-model:visible="valueDialogVisible"
      :header="valueForm.id ? 'Renombrar valor' : `Nuevo valor en ${valueForm.dimensionName}`"
      modal
      :style="{ width: '26rem' }"
    >
      <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
      <InputText v-model="valueForm.name" class="w-full" maxlength="120" autofocus @keyup.enter="saveValue" />
      <p v-if="valueForm.id" class="text-xs text-gray-400 mt-2">
        El cambio de nombre se refleja en todas las líneas que ya lo usan, también en reportes de periodos pasados.
      </p>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="valueDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" :disabled="!valueForm.name.trim()" @click="saveValue" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useFormatters } from '@/composables/useFormatters'
import {
  getLedgerDimensions, createLedgerDimension, updateLedgerDimension,
  createLedgerValue, updateLedgerValue, deleteLedgerValue, ledgerErrorMessage
} from '@/api/ledger.api'
import type { LedgerTagDimension, LedgerTagValue } from '@/types/ledger.types'

const toast = useToast()
const confirm = useConfirm()
const { formatNumber } = useFormatters()

const dimensions = ref<LedgerTagDimension[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    dimensions.value = await getLedgerDimensions()
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function fail(e: unknown) {
  toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: ledgerErrorMessage(e), life: 8000 })
}

// --- Dimension ---
const dimensionDialogVisible = ref(false)
const dimensionForm = reactive({ id: 0, name: '', description: '', is_required: false, is_active: true })

function openDimensionDialog(dimension?: LedgerTagDimension) {
  dimensionForm.id = dimension?.id ?? 0
  dimensionForm.name = dimension?.name ?? ''
  dimensionForm.description = dimension?.description ?? ''
  dimensionForm.is_required = dimension?.is_required ?? false
  dimensionForm.is_active = dimension?.is_active ?? true
  dimensionDialogVisible.value = true
}

async function saveDimension() {
  saving.value = true
  try {
    const payload = {
      name: dimensionForm.name.trim(),
      description: dimensionForm.description.trim(),
      is_required: dimensionForm.is_required
    }
    if (dimensionForm.id) {
      await updateLedgerDimension(dimensionForm.id, { ...payload, is_active: dimensionForm.is_active })
    } else {
      await createLedgerDimension(payload)
    }
    dimensionDialogVisible.value = false
    await load()
  } catch (e) {
    fail(e)
  } finally {
    saving.value = false
  }
}

// --- Valor ---
const valueDialogVisible = ref(false)
const valueForm = reactive({ id: 0, dimensionId: 0, dimensionName: '', name: '' })

function openValueDialog(dimension: LedgerTagDimension, value?: LedgerTagValue) {
  valueForm.id = value?.id ?? 0
  valueForm.dimensionId = dimension.id
  valueForm.dimensionName = dimension.name
  valueForm.name = value?.name ?? ''
  valueDialogVisible.value = true
}

async function saveValue() {
  const name = valueForm.name.trim()
  if (!name || saving.value) return

  saving.value = true
  try {
    if (valueForm.id) {
      await updateLedgerValue(valueForm.id, { name })
    } else {
      await createLedgerValue(valueForm.dimensionId, name)
    }
    valueDialogVisible.value = false
    await load()
  } catch (e) {
    fail(e)
  } finally {
    saving.value = false
  }
}

async function toggleValue(value: LedgerTagValue) {
  try {
    await updateLedgerValue(value.id, { is_active: !value.is_active })
    await load()
  } catch (e) {
    fail(e)
  }
}

function removeValue(value: LedgerTagValue) {
  confirm.require({
    header: 'Borrar valor',
    message: `Se borra "${value.name}". Ninguna línea lo usa.`,
    icon: 'pi pi-trash',
    acceptLabel: 'Borrar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteLedgerValue(value.id)
        await load()
      } catch (e) {
        fail(e)
      }
    }
  })
}

onMounted(load)
</script>
