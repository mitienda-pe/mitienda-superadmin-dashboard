<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div>
      <h1 class="text-2xl font-bold text-gray-900">Plan de cuentas</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Con qué cuentas se arman los asientos del libro diario. El catálogo es el PCGE 2026 oficial; las
        asignaciones son una propuesta para revisar con el estudio. El elemento 9 sigue la NIIF 18 (91 operación,
        93 financiamiento), con subcuentas propias para costo, administración y ventas.
      </p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <template v-if="chart">
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Cuentas de control -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h2 class="font-semibold text-gray-900 mb-1">Cuentas de control</h2>
          <p class="text-xs text-gray-500 mb-3">Clientes, proveedores, IGV, ventas, la 79, los destinos 9x y a qué cuenta va cada tipo de movimiento del banco.</p>
          <div v-for="setting in chart.settings" :key="setting.setting_key" class="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0">
            <span class="text-sm text-gray-700">{{ setting.label }}</span>
            <Dropdown
              :modelValue="setting.account_code"
              :options="accountOptions"
              optionLabel="label"
              optionValue="value"
              filter
              showClear
              :virtualScrollerOptions="{ itemSize: 36 }"
              placeholder="Sin cuenta"
              class="w-64"
              :disabled="!canWrite"
              @update:modelValue="code => assign('setting', setting.setting_key, code)"
            />
          </div>
        </div>

        <div class="space-y-6">
          <!-- Categorías -->
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h2 class="font-semibold text-gray-900 mb-1">Categorías de gasto → cuenta 6</h2>
            <p class="text-xs text-gray-500 mb-3">El destino (9x) sale del bloque de cada categoría en Resultados.</p>
            <div v-for="category in chart.categories" :key="category.id" class="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0">
              <span class="text-sm text-gray-700">
                {{ category.name }}
                <span class="text-xs text-gray-400">· {{ FUNCTION_LABELS[category.statement_function] ?? category.statement_function }}</span>
              </span>
              <Dropdown
                :modelValue="category.account_code"
                :options="expenseOptions"
                optionLabel="label"
                optionValue="value"
                filter
                showClear
                :virtualScrollerOptions="{ itemSize: 36 }"
                placeholder="Sin cuenta"
                class="w-64"
                :disabled="!canWrite"
                @update:modelValue="code => assign('category', category.id, code)"
              />
            </div>
          </div>

          <!-- Bancos -->
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h2 class="font-semibold text-gray-900 mb-3">Bancos → cuenta 10</h2>
            <div v-for="bank in chart.banks" :key="bank.id" class="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0">
              <span class="text-sm text-gray-700">{{ bank.name }} <span class="text-xs text-gray-400">· {{ bank.currency }}</span></span>
              <Dropdown
                :modelValue="bank.ledger_code"
                :options="accountOptions"
                optionLabel="label"
                optionValue="value"
                filter
                showClear
                :virtualScrollerOptions="{ itemSize: 36 }"
                placeholder="Sin cuenta"
                class="w-64"
                :disabled="!canWrite"
                @update:modelValue="code => assign('bank', bank.id, code)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Catálogo -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="flex flex-wrap items-end justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 class="font-semibold text-gray-900">Catálogo</h2>
          <form v-if="canWrite" class="flex flex-wrap items-end gap-2" @submit.prevent="addAccount">
            <InputText v-model="draft.code" placeholder="Código" class="w-28" />
            <InputText v-model="draft.name" placeholder="Nombre" class="w-64" />
            <Dropdown v-model="draft.kind" :options="KIND_OPTIONS" optionLabel="label" optionValue="value" class="w-40" />
            <Button type="submit" label="Agregar o cambiar" icon="pi pi-plus" :disabled="!draft.code || !draft.name" />
          </form>
        </div>
        <DataTable :value="chart.accounts" size="small" :rows="25" paginator :globalFilterFields="['code', 'name']" :filters="tableFilters" class="text-sm">
          <template #header>
            <InputText v-model="tableFilters.global.value" placeholder="Buscar código o nombre" class="w-72" />
          </template>
          <Column field="code" header="Código" sortable style="width: 120px" />
          <Column field="name" header="Nombre" sortable />
          <Column field="kind" header="Tipo" sortable style="width: 140px">
            <template #body="{ data: row }">{{ KIND_LABELS[row.kind] ?? row.kind }}</template>
          </Column>
          <Column field="origin" header="Origen" sortable style="width: 120px">
            <template #body="{ data: row }">
              <span class="text-xs px-2 py-0.5 rounded" :class="row.origin === 'propia' ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-600'">
                {{ row.origin === 'propia' ? 'Propia' : 'PCGE 2026' }}
              </span>
            </template>
          </Column>
          <Column v-if="canWrite" style="width: 60px">
            <template #body="{ data: row }">
              <Button icon="pi pi-pencil" text rounded size="small" @click="edit(row)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useToast } from 'primevue/usetoast'
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { useAuthStore } from '@/stores/auth.store'
import { accountingErrorMessage } from '@/api/accounting.api'
import { getChart, saveLedgerAccount, assignLedgerAccount, type ChartOfAccounts, type LedgerAccount, type AccountKind } from '@/api/books.api'

const KIND_LABELS: Record<string, string> = {
  activo: 'Activo', pasivo: 'Pasivo', patrimonio: 'Patrimonio', gasto: 'Gasto (6)', ingreso: 'Ingreso (7)', saldo: 'Saldos (8)', destino: 'Destino (9)', puente: 'Puente (79)'
}
const KIND_OPTIONS = Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))
const FUNCTION_LABELS: Record<string, string> = { costo: 'costo', admin: 'administración', ventas: 'ventas', financiero: 'financiero', excluido: 'no va a resultados' }

const toast = useToast()
const auth = useAuthStore()
const canWrite = computed(() => auth.canWrite('accounting'))
const chart = ref<ChartOfAccounts | null>(null)
const error = ref<string | null>(null)
const draft = reactive({ code: '', name: '', kind: 'gasto' as AccountKind })
const tableFilters = ref({ global: { value: null as string | null, matchMode: 'contains' } })

const accountOptions = computed(() => (chart.value?.accounts ?? []).map(a => ({ value: a.code, label: `${a.code} · ${a.name}` })))
const expenseOptions = computed(() =>
  (chart.value?.accounts ?? []).filter(a => a.kind === 'gasto').map(a => ({ value: a.code, label: `${a.code} · ${a.name}` }))
)

async function load() {
  try {
    chart.value = await getChart()
  } catch (e) {
    error.value = accountingErrorMessage(e)
  }
}

async function assign(target: 'setting' | 'category' | 'bank', id: string | number, code: string | null) {
  try {
    chart.value = await assignLedgerAccount({ target, id, code: code ?? null })
    toast.add({ severity: 'success', summary: 'Cuenta asignada', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo asignar', detail: accountingErrorMessage(e), life: 5000 })
  }
}

function edit(row: LedgerAccount) {
  Object.assign(draft, { code: row.code, name: row.name, kind: row.kind })
}

async function addAccount() {
  try {
    chart.value = await saveLedgerAccount({ code: draft.code.trim(), name: draft.name.trim(), kind: draft.kind })
    toast.add({ severity: 'success', summary: `Cuenta ${draft.code} guardada`, life: 2000 })
    Object.assign(draft, { code: '', name: '' })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 5000 })
  }
}

onMounted(load)
</script>
