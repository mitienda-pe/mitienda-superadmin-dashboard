<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Proveedores y personal</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          A quién le paga MiTienda. El personal lleva su monto mensual: con eso se genera la planilla del mes desde Gastos.
        </p>
      </div>
      <Button v-if="authStore.canWriteFinance" label="Agregar" icon="pi pi-plus" @click="open(null)" />
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar por nombre o documento..." class="w-full" @keyup.enter="load" />
          </span>
        </div>
        <SelectButton v-model="kind" :options="kindOptions" optionLabel="label" optionValue="value" :allowEmpty="false" @change="load" />
        <div class="flex items-center gap-2">
          <Checkbox v-model="includeInactive" inputId="inactive" binary @change="load" />
          <label for="inactive" class="text-sm text-gray-600">Ver inactivos</label>
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <div v-else-if="!loading && payees.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-users text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Nadie registrado todavía</p>
      <p class="text-sm text-gray-400 mt-1">Agrega a los proveedores y a las personas del equipo antes de cargar gastos.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable :value="payees" :loading="loading" dataKey="id" stripedRows class="p-datatable-sm">
        <Column header="Nombre" style="min-width: 240px">
          <template #body="{ data: row }">
            <span class="text-sm font-medium" :class="row.is_active ? 'text-gray-800' : 'text-gray-400'">{{ row.name }}</span>
            <div class="text-xs text-gray-400 font-mono">{{ row.document }}</div>
          </template>
        </Column>
        <Column header="Tipo" style="width: 130px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.kind === 'empleado' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ row.kind === 'empleado' ? 'Personal' : 'Proveedor' }}
            </span>
            <span v-if="!row.is_active" class="text-xs text-gray-400 ml-1">inactivo</span>
          </template>
        </Column>
        <Column header="Categoría habitual" style="min-width: 180px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.default_category_name || '-' }}</span>
          </template>
        </Column>
        <Column header="Monto mensual" style="width: 150px">
          <template #body="{ data: row }">
            <span v-if="row.default_amount" class="text-sm tabular-nums text-gray-800 block text-right">{{ money(row.default_amount) }}</span>
            <span v-else class="text-sm text-gray-300 block text-right">-</span>
          </template>
        </Column>
        <Column header="Gastos" style="width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600 block text-right">{{ row.expense_count }}</span>
          </template>
        </Column>
        <Column header="" style="width: 70px">
          <template #body="{ data: row }">
            <Button v-if="authStore.canWriteFinance" icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="open(row)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="visible" modal :header="editing ? 'Editar' : 'Agregar proveedor o persona'" :style="{ width: '32rem' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Tipo *</label>
          <SelectButton v-model="form.kind" :options="formKindOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ form.kind === 'empleado' ? 'Nombre completo' : 'Razón social o nombre' }} *
            </label>
            <InputText v-model="form.name" maxlength="200" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ form.kind === 'empleado' ? 'DNI' : 'RUC' }}</label>
            <InputText v-model="form.document" maxlength="20" class="w-full" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Categoría habitual</label>
            <Dropdown
              v-model="form.default_category_id"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              filter
              showClear
              placeholder="Se propone al cargar un gasto"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Monto mensual (S/)</label>
            <InputNumber v-model="form.default_amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
        </div>
        <p v-if="form.kind === 'empleado'" class="text-xs text-gray-500">
          Para que entre en "Planilla del mes" necesita categoría y monto mensual. Pon el costo total de la persona o
          regístralo por partes (sueldo, EsSalud…) como gastos separados.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Notas</label>
          <InputText v-model="form.notes" maxlength="255" class="w-full" />
        </div>
        <div v-if="editing" class="flex items-center gap-2">
          <Checkbox v-model="form.is_active" inputId="active" binary />
          <label for="active" class="text-sm text-gray-600">Activo</label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="visible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="submit" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { getPayees, savePayee, getExpenseCategories, accountingErrorMessage } from '@/api/accounting.api'
import type { ExpenseCategory, Payee, PayeeKind } from '@/types/accounting.types'

const toast = useToast()
const authStore = useAuthStore()

const payees = ref<Payee[]>([])
const categories = ref<ExpenseCategory[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const kind = ref('all')
const includeInactive = ref(false)

const kindOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Proveedores', value: 'proveedor' },
  { label: 'Personal', value: 'empleado' }
]
const formKindOptions = kindOptions.slice(1)

const categoryOptions = computed(() =>
  categories.value.filter(c => c.is_active).map(c => ({ label: `${c.group_name} · ${c.name}`, value: c.id }))
)

function money(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function load() {
  loading.value = true
  error.value = null
  try {
    payees.value = await getPayees({
      kind: kind.value === 'all' ? undefined : kind.value,
      search: search.value.trim() || undefined,
      includeInactive: includeInactive.value
    })
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

// --- Agregar / editar ---
const visible = ref(false)
const saving = ref(false)
const editing = ref<Payee | null>(null)
const form = reactive({
  kind: 'proveedor' as PayeeKind,
  name: '',
  document: '',
  default_category_id: null as number | null,
  default_amount: null as number | null,
  notes: '',
  is_active: true
})

function open(row: Payee | null) {
  editing.value = row
  form.kind = row?.kind ?? (kind.value === 'empleado' ? 'empleado' : 'proveedor')
  form.name = row?.name ?? ''
  form.document = row?.document ?? ''
  form.default_category_id = row?.default_category_id ?? null
  form.default_amount = row?.default_amount ?? null
  form.notes = row?.notes ?? ''
  form.is_active = row?.is_active ?? true
  visible.value = true
}

async function submit() {
  if (!form.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Falta el nombre', life: 4000 })
    return
  }

  saving.value = true
  try {
    await savePayee(editing.value?.id ?? null, {
      kind: form.kind,
      name: form.name.trim(),
      document: form.document.trim() || undefined,
      default_category_id: form.default_category_id,
      default_amount: form.default_amount,
      notes: form.notes.trim() || undefined,
      is_active: form.is_active
    })
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
    visible.value = false
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  load()
  try {
    categories.value = await getExpenseCategories()
  } catch {
    // Sin categorías el formulario sigue sirviendo: solo no propone la habitual.
  }
})
</script>
