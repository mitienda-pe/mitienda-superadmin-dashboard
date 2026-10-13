<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorías de gasto</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          En qué se gasta. El grupo junta las categorías en los reportes; las de planilla son las que suman al costo de
          personal.
        </p>
      </div>
      <Button v-if="authStore.canWriteFinance" label="Nueva categoría" icon="pi pi-plus" @click="open(null)" />
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4" :class="{ 'opacity-60': loading }">
      <div v-for="group in groups" :key="group.name" class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-2">{{ group.name }}</h3>
        <ul>
          <li
            v-for="category in group.items"
            :key="category.id"
            class="flex items-center justify-between border-t border-gray-100 py-1.5 first:border-0"
          >
            <span class="text-sm" :class="category.is_active ? 'text-gray-700' : 'text-gray-400 line-through'">
              {{ category.name }}
              <span v-if="category.is_payroll" class="text-xs text-purple-600 ml-1">planilla</span>
              <span class="text-xs text-gray-400 ml-1">· {{ functionLabel(category.statement_function) }}</span>
            </span>
            <Button
              v-if="authStore.canWriteFinance"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              @click="open(category)"
            />
          </li>
        </ul>
      </div>
    </div>

    <Dialog v-model:visible="visible" modal :header="editing ? 'Editar categoría' : 'Nueva categoría'" :style="{ width: '28rem' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
          <InputText v-model="form.name" maxlength="80" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Grupo *</label>
          <Dropdown v-model="form.group_name" :options="groupNames" editable placeholder="Operación, Planilla…" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">En el estado de resultados va en</label>
          <Dropdown v-model="form.statement_function" :options="FUNCTIONS" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.is_payroll" inputId="payroll" binary />
          <label for="payroll" class="text-sm text-gray-600">Es costo de personal (planilla)</label>
        </div>
        <div v-if="editing" class="flex items-center gap-2">
          <Checkbox v-model="form.is_active" inputId="catActive" binary />
          <label for="catActive" class="text-sm text-gray-600">Activa (se ofrece al cargar un gasto)</label>
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
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { getExpenseCategories, saveExpenseCategory, accountingErrorMessage } from '@/api/accounting.api'
import type { ExpenseCategory, StatementFunction } from '@/types/accounting.types'

const toast = useToast()
const authStore = useAuthStore()

const categories = ref<ExpenseCategory[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const groups = computed(() => {
  const map = new Map<string, { name: string; items: ExpenseCategory[] }>()
  for (const category of categories.value) {
    const group = map.get(category.group_name) ?? { name: category.group_name, items: [] }
    group.items.push(category)
    map.set(category.group_name, group)
  }
  return [...map.values()]
})
const groupNames = computed(() => groups.value.map(g => g.name))

async function load() {
  loading.value = true
  error.value = null
  try {
    categories.value = await getExpenseCategories()
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

const visible = ref(false)
const saving = ref(false)
const editing = ref<ExpenseCategory | null>(null)
const FUNCTIONS: { label: string; value: StatementFunction }[] = [
  { label: 'Costo de servicio', value: 'costo' },
  { label: 'Gasto administrativo', value: 'admin' },
  { label: 'Gasto de venta', value: 'ventas' },
  { label: 'Gasto financiero', value: 'financiero' },
  { label: 'No va al estado de resultados', value: 'excluido' }
]

function functionLabel(value: StatementFunction): string {
  return FUNCTIONS.find(f => f.value === value)?.label.toLowerCase() ?? value
}

const form = reactive({ name: '', group_name: '', is_payroll: false, is_active: true, statement_function: 'admin' as StatementFunction })

function open(row: ExpenseCategory | null) {
  editing.value = row
  form.name = row?.name ?? ''
  form.group_name = row?.group_name ?? ''
  form.is_payroll = row?.is_payroll ?? false
  form.is_active = row?.is_active ?? true
  form.statement_function = row?.statement_function ?? 'admin'
  visible.value = true
}

async function submit() {
  if (!form.name.trim() || !form.group_name.trim()) {
    toast.add({ severity: 'warn', summary: 'Indica el nombre y el grupo', life: 4000 })
    return
  }

  saving.value = true
  try {
    categories.value = await saveExpenseCategory(editing.value?.id ?? null, {
      name: form.name.trim(),
      group_name: form.group_name.trim(),
      is_payroll: form.is_payroll,
      is_active: form.is_active,
      statement_function: form.statement_function
    })
    visible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
