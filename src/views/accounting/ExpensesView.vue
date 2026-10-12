<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gastos</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Lo que MiTienda gasta: proveedores y planilla. Cada gasto cuenta en el mes al que corresponde, se pague cuando
          se pague. Importes en soles; lo que está en dólares va convertido con su tipo de cambio.
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          v-if="authStore.canWriteFinance"
          label="Planilla del mes"
          icon="pi pi-users"
          severity="secondary"
          outlined
          @click="payrollVisible = true"
        />
        <Button v-if="authStore.canWriteFinance" label="Registrar gasto" icon="pi pi-plus" @click="openExpense(null)" />
      </div>
    </div>

    <!-- Totales: no cambian al filtrar por estado de pago -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" :class="{ 'opacity-60': loading }">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Gasto del período, sin IGV</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ money(summary.net) }}</div>
        <div class="text-xs text-gray-400 mt-1">
          {{ formatNumber(summary.expenses) }} gastos · IGV {{ money(summary.tax) }} · con IGV {{ money(summary.total) }}
        </div>
      </div>
      <button
        type="button"
        class="bg-white rounded-xl border p-5 text-left transition-colors hover:border-primary-300"
        :class="filters.payment === 'open' ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200'"
        @click="setPayment('open')"
      >
        <div class="text-sm text-gray-500">Por pagar</div>
        <div class="text-2xl font-bold text-orange-600 mt-1">{{ money(summary.unpaid) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ formatNumber(summary.unpaid_count) }} gastos con saldo</div>
      </button>
      <button
        type="button"
        class="bg-white rounded-xl border p-5 text-left transition-colors hover:border-primary-300"
        :class="filters.payment === 'vencido' ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200'"
        @click="setPayment('vencido')"
      >
        <div class="text-sm text-gray-500">Vencido</div>
        <div class="text-2xl font-bold text-red-600 mt-1">{{ money(summary.overdue) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ formatNumber(summary.overdue_count) }} con la fecha pasada</div>
      </button>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Planilla del período</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ money(payrollNet) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ payrollShare }} del gasto</div>
      </div>
    </div>

    <!-- En qué se gasta -->
    <div v-if="groups.length > 0" class="bg-white rounded-xl border border-gray-200 p-5">
      <button type="button" class="flex w-full items-center justify-between text-left" @click="showCategories = !showCategories">
        <span class="text-sm font-semibold text-gray-800">
          En qué se gasta <span class="font-normal text-gray-400">· sin IGV</span>
        </span>
        <i class="pi text-gray-400" :class="showCategories ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
      </button>
      <table v-if="showCategories" class="w-full text-sm mt-3">
        <tbody>
          <template v-for="group in groups" :key="group.name">
            <tr class="border-t border-gray-200">
              <td class="py-1.5 font-semibold text-gray-800">{{ group.name }}</td>
              <td class="py-1.5 text-right tabular-nums font-semibold text-gray-800">{{ money(group.net) }}</td>
              <td class="py-1.5 pl-3 text-right tabular-nums text-gray-400 w-14">{{ share(group.net) }}</td>
            </tr>
            <tr v-for="category in group.categories" :key="category.name" class="border-t border-gray-100">
              <td class="py-1 pl-4 text-gray-600">
                {{ category.name }} <span class="text-xs text-gray-400">· {{ category.expenses }}</span>
              </td>
              <td class="py-1 text-right tabular-nums text-gray-600">{{ money(category.net) }}</td>
              <td class="py-1 pl-3 text-right tabular-nums text-gray-400 w-14">{{ share(category.net) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar proveedor, RUC, comprobante, descripción..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <Dropdown v-model="yearFilter" :options="yearOptions" optionLabel="label" optionValue="value" class="w-36" @change="onYearChange" />
        <InputText v-model="monthFilter" type="month" class="w-44" v-tooltip.top="'Un mes en particular'" @change="reload" />
        <Dropdown v-model="categoryFilter" :options="categoryOptions" optionLabel="label" optionValue="value" filter class="w-56" @change="reload" />
        <Dropdown v-model="kindFilter" :options="kindOptions" optionLabel="label" optionValue="value" class="w-40" @change="reload" />
        <Dropdown v-model="filters.payment" :options="paymentOptions" optionLabel="label" optionValue="value" class="w-40" @change="reload" />
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <!-- Empty -->
    <div v-else-if="!loading && expenses.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-wallet text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin gastos</p>
      <p class="text-sm text-gray-400 mt-1">
        No hay gastos con estos filtros. Registra el primero o genera la planilla del mes.
      </p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable :value="expenses" :loading="loading" dataKey="id" stripedRows class="p-datatable-sm">
        <Column header="A quién" style="min-width: 220px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-800 font-medium">{{ row.payee_name }}</span>
            <div class="text-xs text-gray-400">
              {{ row.payee_kind === 'empleado' ? 'Personal' : 'Proveedor' }}
              <span v-if="row.payee_document" class="font-mono">· {{ row.payee_document }}</span>
            </div>
          </template>
        </Column>

        <Column header="Categoría" style="min-width: 190px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.category_name }}</span>
            <div class="text-xs text-gray-400">
              {{ row.category_group }}<template v-if="row.business_line"> · {{ lineLabel(row.business_line) }}</template>
            </div>
          </template>
        </Column>

        <Column header="Comprobante" style="min-width: 170px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.document_number || kindLabel(row.document_kind) }}</span>
            <div class="text-xs text-gray-400 line-clamp-1">
              <template v-if="row.document_number">{{ kindLabel(row.document_kind) }}</template>
              <template v-if="row.description"> {{ row.document_number ? '· ' : '' }}{{ row.description }}</template>
            </div>
          </template>
        </Column>

        <Column header="Fecha" style="width: 140px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.issue_date) }}</span>
            <div v-if="row.period !== row.issue_date.slice(0, 7)" class="text-xs text-gray-400">
              corresponde a {{ formatMonthYear(row.period) }}
            </div>
            <div v-else-if="row.due_date && row.due_date !== row.issue_date" class="text-xs" :class="row.is_overdue ? 'text-red-600' : 'text-gray-400'">
              vence {{ formatDate(row.due_date) }}
            </div>
          </template>
        </Column>

        <Column header="Total" style="min-width: 120px">
          <template #body="{ data: row }">
            <span
              class="text-sm font-semibold block text-right tabular-nums"
              :class="row.status === 1 ? 'text-gray-800' : 'text-gray-400 line-through'"
            >
              {{ money(row.total, row.currency) }}
            </span>
            <span v-if="row.tax > 0" class="text-xs text-gray-400 block text-right">IGV {{ money(row.tax, row.currency) }}</span>
          </template>
        </Column>

        <Column header="Pago" style="min-width: 160px">
          <template #body="{ data: row }">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="paymentBadge(row).class">
              {{ paymentBadge(row).label }}
            </span>
            <div v-if="row.payment_status === 'parcial'" class="text-xs text-gray-400 mt-0.5">
              saldo {{ money(row.balance, row.currency) }}
            </div>
          </template>
        </Column>

        <Column header="" style="width: 150px">
          <template #body="{ data: row }">
            <div v-if="row.status === 1" class="flex items-center justify-end gap-1">
              <Button
                :label="row.balance > 0 ? 'Pagar' : 'Pagos'"
                icon="pi pi-wallet"
                size="small"
                :outlined="row.balance > 0"
                :text="row.balance === 0"
                @click="openPayments(row)"
              />
              <Button
                v-if="authStore.canWriteFinance"
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.left="'Editar'"
                @click="openExpense(row)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-if="meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ meta.current_page }} de {{ meta.total_pages }} ({{ formatNumber(meta.total) }} gastos)
        </span>
        <div class="flex gap-1">
          <Button icon="pi pi-chevron-left" text rounded size="small" :disabled="meta.current_page <= 1" @click="goToPage(meta.current_page - 1)" />
          <Button icon="pi pi-chevron-right" text rounded size="small" :disabled="meta.current_page >= meta.total_pages" @click="goToPage(meta.current_page + 1)" />
        </div>
      </div>
    </div>

    <!-- Registrar / editar gasto -->
    <Dialog v-model:visible="expenseVisible" modal :header="editing ? 'Editar gasto' : 'Registrar gasto'" :style="{ width: '38rem' }">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">A quién se paga *</label>
            <Dropdown
              v-model="form.payee_id"
              :options="payees"
              optionLabel="name"
              optionValue="id"
              filter
              placeholder="Proveedor o persona"
              class="w-full"
              @change="onPayeeChange"
            >
              <template #option="{ option }">
                {{ option.name }}
                <span class="text-xs text-gray-400 ml-1">{{ option.kind === 'empleado' ? 'personal' : option.document }}</span>
              </template>
            </Dropdown>
            <router-link :to="{ name: 'AccountingPayees' }" class="text-xs text-primary-600 hover:underline">
              ¿No está? Agrégalo en Proveedores y personal
            </router-link>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Categoría *</label>
            <Dropdown
              v-model="form.category_id"
              :options="activeCategories"
              optionLabel="name"
              optionValue="id"
              optionGroupLabel="label"
              optionGroupChildren="items"
              filter
              placeholder="En qué se gasta"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Comprobante</label>
            <Dropdown v-model="form.document_kind" :options="kindSelectOptions" optionLabel="label" optionValue="value" class="w-full" @change="onKindChange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Serie y número</label>
            <InputText v-model="form.document_number" maxlength="30" placeholder="F001-123" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Fecha *</label>
            <Calendar v-model="form.issue_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Total *</label>
            <InputNumber v-model="form.total" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" @update:modelValue="recalcTax" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">IGV incluido</label>
            <InputNumber v-model="form.tax" :minFractionDigits="2" :maxFractionDigits="2" :min="0" :disabled="!form.has_tax" class="w-full" />
            <div class="flex items-center gap-2 mt-1">
              <Checkbox v-model="form.has_tax" inputId="hasTax" binary @change="recalcTax" />
              <label for="hasTax" class="text-xs text-gray-500">Lleva IGV (18%)</label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Moneda</label>
            <SelectButton v-model="form.currency" :options="currencyOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
            <InputNumber
              v-if="form.currency === 'USD'"
              v-model="form.exchange_rate"
              :minFractionDigits="3"
              :maxFractionDigits="4"
              placeholder="Tipo de cambio *"
              class="w-full mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Corresponde al mes</label>
            <InputText v-model="form.period" type="month" class="w-full" />
            <p class="text-xs text-gray-400 mt-1">Vacío: el mes de la fecha.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Vence el</label>
            <Calendar v-model="form.due_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Línea de negocio</label>
            <Dropdown v-model="form.business_line" :options="lineOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
          <InputText v-model="form.description" maxlength="255" class="w-full" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button
          v-if="editing && editing.paid_amount === 0"
          label="Anular gasto"
          icon="pi pi-ban"
          text
          severity="danger"
          class="mr-auto"
          :loading="voiding"
          @click="voidCurrent"
        />
        <Button label="Cancelar" text severity="secondary" @click="expenseVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="submitExpense" />
      </template>
    </Dialog>

    <!-- Pagos de un gasto -->
    <Dialog v-model:visible="paymentsVisible" modal :header="`Pagos · ${paying?.payee_name ?? ''}`" :style="{ width: '34rem' }">
      <div v-if="paying" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-3 text-sm">
          <div class="text-gray-700">
            {{ paying.category_name }}<template v-if="paying.document_number"> · {{ paying.document_number }}</template>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-gray-500">
            <span>Total</span>
            <span class="text-right tabular-nums text-gray-800">{{ money(paying.total, paying.currency) }}</span>
            <span>Pagado</span>
            <span class="text-right tabular-nums text-gray-800">{{ money(paying.paid_amount, paying.currency) }}</span>
            <span class="font-semibold text-gray-700">Saldo</span>
            <span class="text-right tabular-nums font-semibold" :class="paying.balance > 0 ? 'text-orange-600' : 'text-green-600'">
              {{ money(paying.balance, paying.currency) }}
            </span>
          </div>
        </div>

        <table v-if="paymentRows.length > 0" class="w-full text-sm">
          <tbody>
            <tr v-for="payment in paymentRows" :key="payment.id" class="border-t border-gray-100">
              <td class="py-1.5 text-gray-600 whitespace-nowrap">{{ formatDate(payment.paid_at) }}</td>
              <td class="py-1.5 text-gray-600">
                {{ payment.method }}
                <span v-if="payment.reference" class="text-xs text-gray-400">· op. {{ payment.reference }}</span>
              </td>
              <td class="py-1.5 text-right tabular-nums text-gray-800">{{ money(payment.amount, paying.currency) }}</td>
              <td class="py-1.5 text-right w-8">
                <Button
                  v-if="authStore.canWriteFinance"
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  :loading="deletingId === payment.id"
                  v-tooltip.top="'Quitar este pago'"
                  @click="removePayment(payment.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <template v-if="authStore.canWriteFinance && paying.balance > 0">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Fecha del pago *</label>
              <Calendar v-model="payForm.date" dateFormat="yy-mm-dd" :maxDate="new Date()" showIcon class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Desde *</label>
              <Dropdown v-model="payForm.method" :options="PLAN_PAYMENT_METHODS" editable placeholder="BCP, BBVA…" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Monto *</label>
              <InputNumber v-model="payForm.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">N.º de operación</label>
              <InputText v-model="payForm.reference" maxlength="100" class="w-full" />
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <Button label="Cerrar" text severity="secondary" @click="paymentsVisible = false" />
        <Button
          v-if="authStore.canWriteFinance && paying && paying.balance > 0"
          label="Registrar pago"
          icon="pi pi-check"
          :loading="saving"
          @click="submitPayment"
        />
      </template>
    </Dialog>

    <!-- Planilla del mes -->
    <Dialog v-model:visible="payrollVisible" modal header="Planilla del mes" :style="{ width: '28rem' }">
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Crea un gasto por cada persona activa con monto mensual definido, por pagar. Si el mes ya se generó, no repite.
          El monto de cada uno se edita después si ese mes fue distinto.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Mes</label>
          <InputText v-model="payrollPeriod" type="month" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="payrollVisible = false" />
        <Button label="Generar" icon="pi pi-check" :loading="saving" :disabled="!payrollPeriod" @click="submitPayroll" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import {
  getExpenses, getExpenseCategories, getPayees, saveExpense, voidExpense, generatePayroll,
  getExpensePayments, addExpensePayment, deleteExpensePayment, accountingErrorMessage
} from '@/api/accounting.api'
import { PLAN_PAYMENT_METHODS } from '@/config/plan-payment.config'
import { parseLocalDate, toIsoDate } from '@/utils/dates'
import type {
  Expense, ExpenseCategory, ExpenseDocumentKind, ExpenseFilters, ExpenseInput, ExpensePayment, ExpensePaymentFilter,
  ExpenseSummary, Payee
} from '@/types/accounting.types'

const toast = useToast()
const authStore = useAuthStore()
const { formatDate, formatNumber, formatMonthYear } = useFormatters()

const IGV = 0.18
const ALL = 'all'

const expenses = ref<Expense[]>([])
const summary = ref<ExpenseSummary>({
  expenses: 0, total: 0, net: 0, tax: 0, unpaid_count: 0, unpaid: 0, overdue_count: 0, overdue: 0, by_category: []
})
const meta = ref({ current_page: 1, per_page: 25, total: 0, total_pages: 1 })
const categories = ref<ExpenseCategory[]>([])
const payees = ref<Payee[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showCategories = ref(true)

// --- Filtros ---
const currentYear = String(new Date().getFullYear())
const searchQuery = ref('')
const yearFilter = ref(currentYear)
const monthFilter = ref('')
const categoryFilter = ref<number | typeof ALL>(ALL)
const kindFilter = ref<string>(ALL)
const filters = reactive<ExpenseFilters>({ period: currentYear, category_id: null, kind: '', payment: 'all', search: '', page: 1 })

const yearOptions = [
  { label: 'Todos los años', value: ALL },
  ...Array.from({ length: 4 }, (_, i) => {
    const year = String(Number(currentYear) - i)
    return { label: year, value: year }
  })
]
const kindOptions = [
  { label: 'Todos', value: ALL },
  { label: 'Proveedores', value: 'proveedor' },
  { label: 'Personal', value: 'empleado' }
]
const paymentOptions: { label: string; value: ExpensePaymentFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Por pagar', value: 'open' },
  { label: 'Vencidos', value: 'vencido' },
  { label: 'Pagados', value: 'pagado' }
]
const categoryOptions = computed(() => [
  { label: 'Todas las categorías', value: ALL },
  ...categories.value.map(c => ({ label: `${c.group_name} · ${c.name}`, value: c.id }))
])

const KIND_LABELS: Record<ExpenseDocumentKind, string> = {
  factura: 'Factura',
  boleta: 'Boleta',
  recibo_honorarios: 'Recibo por honorarios',
  planilla: 'Planilla',
  sin_comprobante: 'Sin comprobante',
  otro: 'Otro'
}
const kindSelectOptions = Object.entries(KIND_LABELS).map(([value, label]) => ({ label, value }))

function kindLabel(kind: ExpenseDocumentKind): string {
  return KIND_LABELS[kind] ?? kind
}

const LINE_LABELS: Record<string, string> = { b2c: 'B2C', b2b: 'B2B', extraordinario: 'Otros' }
const lineOptions = [
  { label: 'Común a toda la empresa', value: '' },
  ...Object.entries(LINE_LABELS).map(([value, label]) => ({ label, value }))
]

function lineLabel(line: string): string {
  return LINE_LABELS[line] ?? line
}

const currencyOptions = [
  { label: 'S/', value: 'PEN' },
  { label: 'US$', value: 'USD' }
]

function money(amount: number, currency = 'PEN'): string {
  const value = amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency === 'USD' ? 'US$' : 'S/'} ${value}`
}

// --- En qué se gasta ---
const groups = computed(() => {
  const map = new Map<string, { name: string; net: number; categories: ExpenseSummary['by_category'] }>()
  for (const row of summary.value.by_category) {
    const group = map.get(row.group_name) ?? { name: row.group_name, net: 0, categories: [] }
    group.net += row.net
    group.categories.push(row)
    map.set(row.group_name, group)
  }
  return [...map.values()]
})

function share(amount: number): string {
  return summary.value.net > 0 ? `${((amount / summary.value.net) * 100).toFixed(0)}%` : '-'
}

const payrollNames = computed(() => new Set(categories.value.filter(c => c.is_payroll).map(c => c.name)))
const payrollNet = computed(() =>
  summary.value.by_category.filter(row => payrollNames.value.has(row.name)).reduce((sum, row) => sum + row.net, 0)
)
const payrollShare = computed(() => share(payrollNet.value))

function paymentBadge(row: Expense): { label: string; class: string } {
  if (row.status !== 1) return { label: 'Anulado', class: 'bg-gray-100 text-gray-500' }
  if (row.payment_status === 'pagado') return { label: 'Pagado', class: 'bg-green-100 text-green-700' }
  if (row.is_overdue) return { label: row.payment_status === 'parcial' ? 'Parcial · vencido' : 'Vencido', class: 'bg-red-100 text-red-700' }
  if (row.payment_status === 'parcial') return { label: 'Pago parcial', class: 'bg-orange-100 text-orange-700' }
  return { label: 'Por pagar', class: 'bg-orange-100 text-orange-700' }
}

// --- Carga ---
// Cada carga lleva su número: una respuesta lenta no pisa a la más reciente.
let loadSeq = 0

async function load() {
  const seq = ++loadSeq
  loading.value = true
  error.value = null
  filters.period = monthFilter.value || (yearFilter.value === ALL ? '' : yearFilter.value)
  filters.category_id = categoryFilter.value === ALL ? null : categoryFilter.value
  filters.kind = kindFilter.value === ALL ? '' : (kindFilter.value as ExpenseFilters['kind'])
  try {
    const res = await getExpenses(filters)
    if (seq !== loadSeq) return
    expenses.value = res.data ?? []
    summary.value = res.summary
    meta.value = res.meta
  } catch (e) {
    if (seq === loadSeq) error.value = accountingErrorMessage(e)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function reload() {
  filters.page = 1
  load()
}

function goToPage(page: number) {
  filters.page = page
  load()
}

function applySearch() {
  filters.search = searchQuery.value
  reload()
}

function onYearChange() {
  monthFilter.value = ''
  reload()
}

function setPayment(value: ExpensePaymentFilter) {
  filters.payment = filters.payment === value ? 'all' : value
  reload()
}

async function loadCatalogs() {
  try {
    const [cats, people] = await Promise.all([getExpenseCategories(), getPayees()])
    categories.value = cats
    payees.value = people
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar las listas', detail: accountingErrorMessage(e), life: 6000 })
  }
}

// --- Registrar / editar ---
const expenseVisible = ref(false)
const saving = ref(false)
const voiding = ref(false)
const editing = ref<Expense | null>(null)
const form = reactive({
  payee_id: null as number | null,
  category_id: null as number | null,
  document_kind: 'factura' as ExpenseDocumentKind,
  document_number: '',
  issue_date: new Date() as Date | null,
  due_date: null as Date | null,
  period: '',
  currency: 'PEN' as 'PEN' | 'USD',
  exchange_rate: null as number | null,
  total: null as number | null,
  tax: 0 as number | null,
  has_tax: true,
  description: '',
  business_line: ''
})

// Agrupadas para el desplegable: Planilla, Operación…
const activeCategories = computed(() => {
  const map = new Map<string, { label: string; items: ExpenseCategory[] }>()
  for (const category of categories.value.filter(c => c.is_active || c.id === form.category_id)) {
    const group = map.get(category.group_name) ?? { label: category.group_name, items: [] }
    group.items.push(category)
    map.set(category.group_name, group)
  }
  return [...map.values()]
})

function recalcTax() {
  form.tax = form.has_tax && form.total ? Math.round((form.total - form.total / (1 + IGV)) * 100) / 100 : 0
}

// Solo la factura da crédito fiscal: el resto se propone sin IGV.
function onKindChange() {
  form.has_tax = form.document_kind === 'factura'
  recalcTax()
}

function onPayeeChange() {
  const payee = payees.value.find(p => p.id === form.payee_id)
  if (!payee || editing.value) return
  if (payee.default_category_id) form.category_id = payee.default_category_id
  if (payee.kind === 'empleado') {
    form.document_kind = 'planilla'
    if (payee.default_amount) form.total = payee.default_amount
    onKindChange()
  }
}

function openExpense(row: Expense | null) {
  editing.value = row
  form.payee_id = row?.payee_id ?? null
  form.category_id = row?.category_id ?? null
  form.document_kind = row?.document_kind ?? 'factura'
  form.document_number = row?.document_number ?? ''
  form.issue_date = row ? parseLocalDate(row.issue_date) : new Date()
  form.due_date = row?.due_date ? parseLocalDate(row.due_date) : null
  form.period = row && row.period !== row.issue_date.slice(0, 7) ? row.period : ''
  form.currency = row?.currency ?? 'PEN'
  form.exchange_rate = row?.exchange_rate ?? null
  form.total = row?.total ?? null
  form.tax = row?.tax ?? 0
  form.has_tax = row ? row.tax > 0 : true
  form.description = row?.description ?? ''
  form.business_line = row?.business_line ?? ''
  expenseVisible.value = true
}

function warn(summaryText: string, detail: string) {
  toast.add({ severity: 'warn', summary: summaryText, detail, life: 5000 })
}

async function submitExpense() {
  if (!form.payee_id) return warn('Falta un dato', 'Indica a quién se le paga')
  if (!form.category_id) return warn('Falta un dato', 'Indica la categoría')
  if (!form.issue_date) return warn('Falta un dato', 'Indica la fecha')
  if (!form.total || form.total <= 0) return warn('Falta un dato', 'Indica el total')
  if (form.currency === 'USD' && !form.exchange_rate) return warn('Falta un dato', 'Indica el tipo de cambio')

  const payload: ExpenseInput = {
    payee_id: form.payee_id,
    category_id: form.category_id,
    issue_date: toIsoDate(form.issue_date),
    total: form.total,
    tax: form.has_tax ? form.tax ?? 0 : 0,
    document_kind: form.document_kind,
    document_number: form.document_number.trim() || undefined,
    due_date: form.due_date ? toIsoDate(form.due_date) : undefined,
    period: form.period || undefined,
    currency: form.currency,
    exchange_rate: form.currency === 'USD' ? form.exchange_rate ?? undefined : undefined,
    description: form.description.trim() || undefined,
    business_line: form.business_line || undefined
  }

  saving.value = true
  try {
    const res = await saveExpense(editing.value?.id ?? null, payload)
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    expenseVisible.value = false
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

async function voidCurrent() {
  if (!editing.value) return
  voiding.value = true
  try {
    const res = await voidExpense(editing.value.id)
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    expenseVisible.value = false
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo anular', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    voiding.value = false
  }
}

// --- Pagos ---
const paymentsVisible = ref(false)
const paying = ref<Expense | null>(null)
const paymentRows = ref<ExpensePayment[]>([])
const deletingId = ref<number | null>(null)
let paymentsChanged = false
const payForm = reactive({ date: new Date() as Date | null, method: '', amount: null as number | null, reference: '' })

function resetPayForm() {
  payForm.date = new Date()
  payForm.reference = ''
  payForm.amount = paying.value && paying.value.balance > 0 ? paying.value.balance : null
}

async function openPayments(row: Expense) {
  paying.value = row
  paymentRows.value = []
  paymentsChanged = false
  payForm.method = ''
  resetPayForm()
  paymentsVisible.value = true
  try {
    const data = await getExpensePayments(row.id)
    paying.value = data.expense
    paymentRows.value = data.payments
    resetPayForm()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar los pagos', detail: accountingErrorMessage(e), life: 6000 })
  }
}

async function submitPayment() {
  if (!paying.value) return
  if (!payForm.date || !payForm.method.trim()) return warn('Falta el pago', 'Indica la fecha y desde dónde se pagó')
  if (!payForm.amount || payForm.amount <= 0) return warn('Falta el monto', 'Indica cuánto se pagó')

  saving.value = true
  try {
    const res = await addExpensePayment(paying.value.id, {
      date: toIsoDate(payForm.date),
      method: payForm.method.trim(),
      amount: payForm.amount,
      reference: payForm.reference.trim() || undefined
    })
    paying.value = res.data.expense
    paymentRows.value = res.data.payments
    paymentsChanged = true
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    if (res.data.expense.balance <= 0) paymentsVisible.value = false
    else resetPayForm()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

async function removePayment(paymentId: number) {
  deletingId.value = paymentId
  try {
    const res = await deleteExpensePayment(paymentId)
    paying.value = res.data.expense
    paymentRows.value = res.data.payments
    paymentsChanged = true
    resetPayForm()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo quitar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    deletingId.value = null
  }
}

// También al cerrar con la X o con Escape: si hubo cambios, la lista se recarga.
watch(paymentsVisible, visible => {
  if (!visible && paymentsChanged) {
    paymentsChanged = false
    load()
  }
})

// --- Planilla ---
const payrollVisible = ref(false)
const payrollPeriod = ref(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

async function submitPayroll() {
  saving.value = true
  try {
    const res = await generatePayroll(payrollPeriod.value)
    toast.add({ severity: res.data.created > 0 ? 'success' : 'info', summary: res.message, life: 5000 })
    payrollVisible.value = false
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo generar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCatalogs()
  load()
})
</script>
