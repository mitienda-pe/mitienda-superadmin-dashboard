<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Planilla</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          El cálculo del mes por persona: del sueldo pactado al neto, con AFP, renta de quinta y EsSalud. Al cerrar el
          mes quedan sus gastos al costo real, uno por cada pago que sale del banco.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button label="Parámetros" icon="pi pi-sliders-h" severity="secondary" outlined @click="settingsVisible = true" />
        <Button label="Personal" icon="pi pi-users" severity="secondary" outlined @click="employeesVisible = true" />
      </div>
    </div>

    <!-- El año de un vistazo -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <InputText v-model="period" type="month" class="w-44" @change="load" />
        <div class="flex flex-wrap gap-1">
          <button
            v-for="month in yearMonths"
            :key="month.period"
            type="button"
            class="px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors"
            :class="month.period === period
              ? 'border-primary bg-primary text-white'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
            v-tooltip.top="month.hint"
            @click="pick(month.period)"
          >
            {{ month.label }}
            <i v-if="month.icon" :class="month.icon" class="ml-1 text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <div v-else-if="loading && !data" class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <template v-else-if="data">
      <div
        v-if="data.settings.inherited"
        class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3"
      >
        <span>
          {{ data.settings.year }} todavía usa los parámetros de un año anterior (UIT {{ money(data.settings.uit) }}).
          Confírmalos antes de calcular: la UIT cambia cada enero.
        </span>
        <Button label="Revisar parámetros" size="small" severity="warning" outlined @click="settingsVisible = true" />
      </div>

      <!-- Mes sin planilla -->
      <div v-if="!data.payroll" class="bg-white rounded-xl border border-gray-200 p-8">
        <div class="text-center">
          <i class="pi pi-id-card text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-700 font-medium">{{ periodLabel }} todavía no tiene planilla</p>
        </div>
        <div v-if="data.pending.length" class="max-w-xl mx-auto mt-5 divide-y divide-gray-100 border border-gray-100 rounded-lg">
          <div v-for="person in data.pending" :key="person.payee_id" class="flex items-center justify-between px-4 py-2 text-sm">
            <span class="text-gray-800">{{ person.name }}</span>
            <span v-if="person.ready" class="text-emerald-600"><i class="pi pi-check mr-1"></i>entra</span>
            <span v-else class="text-amber-600">{{ person.problem }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center mt-3">
          No hay personal activo para ese mes. Agrégalo en Proveedores y personal, y completa su ficha en Personal.
        </p>
        <div class="flex flex-col items-center gap-3 mt-6">
          <div class="flex items-center gap-2">
            <Checkbox v-model="historyOnly" inputId="history" binary />
            <label for="history" class="text-sm text-gray-600">
              Es un mes pasado: cargarlo solo como historial, sin generar gastos
            </label>
          </div>
          <Button label="Calcular planilla" icon="pi pi-calculator" :loading="working" :disabled="!canPrepare" @click="prepare(false)" />
          <Button v-if="!canPrepare && data.pending.length" label="Completar fichas" text size="small" @click="employeesVisible = true" />
        </div>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" :class="statusClass">{{ statusLabel }}</span>
            <span v-if="!data.payroll.with_expenses" class="text-xs text-gray-500">Historial: no genera gastos</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <template v-if="isDraft">
              <Button
                label="Recalcular"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                :loading="working"
                v-tooltip.top="'Vuelve a leer sueldo y pensiones de cada ficha. Lo variable del mes se conserva.'"
                @click="prepare(true)"
              />
              <Button
                :label="data.payroll.with_expenses ? 'Cerrar y generar gastos' : 'Cerrar como historial'"
                icon="pi pi-lock"
                :loading="working"
                @click="close"
              />
            </template>
            <Button v-else label="Reabrir" icon="pi pi-lock-open" severity="secondary" outlined :loading="working" @click="reopen" />
          </div>
        </div>

        <div
          v-if="isDraft && data.pending.length"
          class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3"
        >
          <span>
            Falta en esta planilla:
            <span v-for="(person, index) in data.pending" :key="person.payee_id">
              {{ index ? ', ' : '' }}{{ person.name }}<template v-if="person.problem"> ({{ person.problem.toLowerCase() }})</template>
            </span>
          </span>
          <Button
            v-if="data.pending.some(p => p.ready)"
            label="Incluir"
            size="small"
            severity="warning"
            outlined
            :loading="working"
            @click="prepare(false)"
          />
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div v-for="card in cards" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-sm text-gray-500">{{ card.label }}</div>
            <div class="text-xl font-bold mt-1" :class="card.strong ? 'text-primary' : 'text-gray-900'">{{ money(card.value) }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ card.hint }}</div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 border-b border-gray-200">
                <th class="px-4 py-3 font-medium">Persona</th>
                <th class="px-3 py-3 font-medium text-right">Básico</th>
                <th class="px-3 py-3 font-medium text-right">Cond. de trabajo</th>
                <th class="px-3 py-3 font-medium text-right">Variable</th>
                <th class="px-3 py-3 font-medium text-right">Bruto</th>
                <th class="px-3 py-3 font-medium text-right">Pensiones</th>
                <th class="px-3 py-3 font-medium text-right">Renta de quinta</th>
                <th class="px-3 py-3 font-medium text-right">Neto</th>
                <th class="px-3 py-3 font-medium text-right">EsSalud</th>
                <th class="px-3 py-3 font-medium text-right">Costo</th>
                <th class="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in data.lines" :key="line.id" class="border-b border-gray-100">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-800">{{ line.payee_name }}</div>
                  <div class="text-xs text-gray-400">
                    {{ [line.position, line.pension_name].filter(Boolean).join(' · ') }}
                    <span v-if="line.days_worked < 30"> · {{ line.days_worked }} días</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(line.basic + line.family_allowance) }}</td>
                <td class="px-3 py-3 text-right tabular-nums text-gray-600">{{ plain(line.work_condition) }}</td>
                <td class="px-3 py-3 text-right tabular-nums text-gray-600">{{ plain(variable(line)) }}</td>
                <td class="px-3 py-3 text-right tabular-nums font-medium">{{ plain(line.gross) }}</td>
                <td class="px-3 py-3 text-right tabular-nums text-gray-600">{{ plain(line.pension) }}</td>
                <td class="px-3 py-3 text-right tabular-nums text-gray-600">
                  {{ plain(line.income_tax) }}
                  <div v-if="line.income_tax_manual" class="text-[10px] text-amber-600">a mano</div>
                </td>
                <td class="px-3 py-3 text-right tabular-nums font-medium text-gray-900">{{ plain(line.net) }}</td>
                <td class="px-3 py-3 text-right tabular-nums text-gray-600">{{ plain(line.essalud) }}</td>
                <td class="px-3 py-3 text-right tabular-nums font-medium">{{ plain(line.cost) }}</td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <Button
                    icon="pi pi-file-pdf"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    :loading="payslipLoading === line.id"
                    v-tooltip.top="'Boleta de pago'"
                    @click="openPayslip(line)"
                  />
                  <Button
                    :icon="isDraft ? 'pi pi-pencil' : 'pi pi-eye'"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    v-tooltip.top="isDraft ? 'Editar lo del mes' : 'Ver el detalle'"
                    @click="openLine(line)"
                  />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-50 font-medium text-gray-900">
                <td class="px-4 py-3">Total ({{ data.lines.length }})</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.basic) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.work_condition) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">
                  {{ plain(data.totals.commissions + data.totals.bonus + data.totals.gratification + data.totals.gratification_bonus) }}
                </td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.gross) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.pension) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.income_tax) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.net) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.essalud) }}</td>
                <td class="px-3 py-3 text-right tabular-nums">{{ plain(data.totals.cost) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Lo que dejó en Gastos -->
        <div v-if="data.expenses.length" class="bg-white rounded-xl border border-gray-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h2 class="text-sm font-semibold text-gray-800">Gastos de esta planilla</h2>
              <p class="text-xs text-gray-500">Uno por cada pago: se concilian con el banco desde Bancos.</p>
            </div>
            <router-link :to="`/accounting/expenses`" class="text-sm text-primary hover:underline">Ver en Gastos</router-link>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="expense in data.expenses" :key="expense.id" class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <div>
                <span class="text-gray-800 font-medium">{{ expense.payee_name }}</span>
                <span class="text-gray-500"> · {{ expense.description }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="tabular-nums text-gray-900">{{ money(expense.total) }}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="paymentClass[expense.payment_status]">
                  {{ paymentLabel(expense) }}
                </span>
              </div>
            </div>
          </div>
          <p v-if="isDraft" class="px-4 py-2 text-xs text-amber-700 bg-amber-50 rounded-b-xl">
            La planilla está reabierta: estos gastos se actualizan al volver a cerrarla.
          </p>
        </div>
      </template>
    </template>

    <!-- Boleta: lo del mes -->
    <Dialog v-model:visible="lineVisible" modal :header="lineTitle" :style="{ width: '44rem' }">
      <div v-if="editingLine" class="space-y-5">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Sueldo pactado</label>
            <InputNumber v-model="lineForm.base_salary" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Condición de trabajo</label>
            <InputNumber v-model="lineForm.work_condition_full" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Días trabajados</label>
            <InputNumber v-model="lineForm.days_worked" :min="0" :max="30" :maxFractionDigits="1" :disabled="!isDraft" class="w-full" />
          </div>
        </div>
        <p class="text-xs text-gray-500 -mt-3">
          Vienen de la ficha. Cámbialos acá solo si este mes fue distinto; un aumento se registra en Personal.
        </p>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Comisiones</label>
            <InputNumber v-model="lineForm.commissions" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Otros ingresos afectos</label>
            <InputNumber v-model="lineForm.bonus" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
          <div class="flex items-end pb-2 gap-2">
            <Checkbox v-model="lineForm.has_family_allowance" inputId="family" binary :disabled="!isDraft" />
            <label for="family" class="text-sm text-gray-600">Asignación familiar</label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Gratificación</label>
            <InputNumber v-model="lineForm.gratification" v-bind="moneyInput" :disabled="!isDraft" class="w-full" @update:modelValue="syncBonus" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Bonificación 9 %</label>
            <InputNumber v-model="lineForm.gratification_bonus" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Adelantos</label>
            <InputNumber v-model="lineForm.advances" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Otros descuentos</label>
            <InputNumber v-model="lineForm.other_deductions" v-bind="moneyInput" :disabled="!isDraft" class="w-full" />
          </div>
        </div>

        <!-- Renta de quinta -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm font-medium text-gray-700">Renta de quinta</div>
            <div class="flex items-center gap-2">
              <Checkbox v-model="lineForm.tax_manual" inputId="taxmanual" binary :disabled="!isDraft" />
              <label for="taxmanual" class="text-sm text-gray-600">Poner la retención a mano</label>
              <InputNumber v-if="lineForm.tax_manual" v-model="lineForm.income_tax" v-bind="moneyInput" :disabled="!isDraft" class="w-36" />
            </div>
          </div>
          <dl v-if="taxDetail" class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
            <dt>Renta proyectada del año</dt><dd class="text-right tabular-nums">{{ money(taxDetail.projected) }}</dd>
            <dt>Menos 7 UIT</dt><dd class="text-right tabular-nums">− {{ money(taxDetail.deduction) }}</dd>
            <dt>Impuesto del año</dt><dd class="text-right tabular-nums">{{ money(taxDetail.annual_tax) }}</dd>
            <dt>Ya retenido que se descuenta</dt><dd class="text-right tabular-nums">− {{ money(taxDetail.withheld) }}</dd>
            <dt>Se reparte entre</dt><dd class="text-right tabular-nums">{{ taxDetail.divisor }} {{ taxDetail.divisor === 1 ? 'mes' : 'meses' }}</dd>
            <template v-if="taxDetail.extra > 0">
              <dt>Por comisiones y otros ingresos del mes</dt><dd class="text-right tabular-nums">+ {{ money(taxDetail.extra) }}</dd>
            </template>
            <dt class="font-medium text-gray-800">Retención que calcula el sistema</dt>
            <dd class="text-right tabular-nums font-medium text-gray-800">{{ money(taxDetail.amount) }}</dd>
          </dl>
          <p v-if="editingLine.income_tax_manual && taxDetail" class="text-xs text-amber-700">
            Esta boleta lleva {{ money(editingLine.income_tax) }} puestos a mano, no lo calculado.
          </p>
        </div>

        <!-- Resultado -->
        <div class="grid grid-cols-4 gap-3 text-sm">
          <div><div class="text-gray-500 text-xs">Bruto</div><div class="font-semibold tabular-nums">{{ money(editingLine.gross) }}</div></div>
          <div><div class="text-gray-500 text-xs">Descuentos</div><div class="font-semibold tabular-nums">{{ money(editingLine.deductions) }}</div></div>
          <div><div class="text-gray-500 text-xs">Neto</div><div class="font-semibold tabular-nums text-primary">{{ money(editingLine.net) }}</div></div>
          <div><div class="text-gray-500 text-xs">Costo para la empresa</div><div class="font-semibold tabular-nums">{{ money(editingLine.cost) }}</div></div>
        </div>
        <p v-if="isDraft" class="text-xs text-gray-400 -mt-3">Los totales se actualizan al guardar.</p>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nota</label>
          <InputText v-model="lineForm.note" maxlength="255" :disabled="!isDraft" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button
          v-if="isDraft"
          label="Quitar de la planilla"
          icon="pi pi-trash"
          text
          severity="danger"
          class="mr-auto"
          :loading="working"
          @click="removeLine"
        />
        <Button :label="isDraft ? 'Cancelar' : 'Cerrar'" text severity="secondary" @click="lineVisible = false" />
        <Button v-if="isDraft" label="Guardar y recalcular" icon="pi pi-check" :loading="working" @click="submitLine" />
      </template>
    </Dialog>

    <PayrollEmployeesDialog v-model:visible="employeesVisible" @changed="load" />
    <PayrollSettingsDialog v-model:visible="settingsVisible" :year="year" @changed="load" />
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import PayrollEmployeesDialog from '@/components/accounting/PayrollEmployeesDialog.vue'
import PayrollSettingsDialog from '@/components/accounting/PayrollSettingsDialog.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import {
  getPayroll, getPayrollPeriods, preparePayroll, closePayroll, reopenPayroll, updatePayrollLine, deletePayrollLine,
  getPayslipUrl, accountingErrorMessage
} from '@/api/accounting.api'
import type { Payroll, PayrollExpense, PayrollLine, PayrollPeriod } from '@/types/accounting.types'

const toast = useToast()
const confirm = useConfirm()

const now = new Date()
const period = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const data = ref<Payroll | null>(null)
const periods = ref<PayrollPeriod[]>([])
const loading = ref(false)
const working = ref(false)
const error = ref<string | null>(null)
const historyOnly = ref(false)
const employeesVisible = ref(false)
const settingsVisible = ref(false)

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const year = computed(() => Number(period.value.slice(0, 4)))
const periodLabel = computed(() => {
  const name = MONTH_NAMES[Number(period.value.slice(5, 7)) - 1] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year.value}`
})

const yearMonths = computed(() =>
  MONTHS.map((label, index) => {
    const key = `${year.value}-${String(index + 1).padStart(2, '0')}`
    const found = periods.value.find(p => p.period === key)
    let icon = ''
    let hint = 'Sin planilla'
    if (found) {
      const closed = found.status === 'cerrada'
      icon = closed ? (found.with_expenses ? 'pi pi-lock' : 'pi pi-history') : 'pi pi-pencil'
      hint = `${closed ? (found.with_expenses ? 'Cerrada' : 'Historial') : 'Borrador'} · costo ${money(found.cost)}`
    }
    return { period: key, label, icon, hint }
  })
)

const isDraft = computed(() => data.value?.payroll?.status === 'borrador')
const canPrepare = computed(() => !!data.value?.pending.some(p => p.ready))

const statusLabel = computed(() => {
  if (isDraft.value) return 'Borrador'
  return data.value?.payroll?.with_expenses ? 'Cerrada' : 'Cerrada · historial'
})
const statusClass = computed(() => (isDraft.value ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'))

const cards = computed(() => {
  const totals = data.value?.totals ?? {}
  const value = (key: string) => totals[key] ?? 0
  return [
    { label: 'Remuneración bruta', value: value('gross'), hint: 'Lo que gana el personal', strong: false },
    { label: 'Retenido', value: value('pension') + value('income_tax'), hint: 'AFP u ONP y renta de quinta', strong: false },
    { label: 'Neto a pagar', value: value('net'), hint: 'Lo que recibe el personal', strong: false },
    { label: 'Aportes de la empresa', value: value('essalud') + value('life_insurance'), hint: 'EsSalud y seguro de vida ley', strong: false },
    { label: 'Costo del mes', value: value('cost'), hint: 'Bruto más aportes', strong: true }
  ]
})

const paymentClass: Record<PayrollExpense['payment_status'], string> = {
  pendiente: 'bg-amber-50 text-amber-700',
  parcial: 'bg-gray-100 text-gray-700',
  pagado: 'bg-emerald-50 text-emerald-700'
}

function paymentLabel(expense: PayrollExpense): string {
  if (expense.payment_status === 'pagado') return 'Pagado'
  if (expense.payment_status === 'parcial') return `Falta ${money(Math.max(expense.total - expense.paid_amount, 0))}`
  return 'Por pagar'
}

function plain(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function money(amount: number): string {
  return `S/ ${plain(amount)}`
}

function variable(line: PayrollLine): number {
  return line.commissions + line.bonus + line.gratification + line.gratification_bonus
}

// Solo se muestra la última respuesta: cambiar de mes rápido no deja datos de otro.
let sequence = 0

async function load() {
  if (!/^\d{4}-\d{2}$/.test(period.value)) return

  const current = ++sequence
  loading.value = true
  error.value = null
  try {
    const [payroll, list] = await Promise.all([getPayroll(period.value), getPayrollPeriods(year.value)])
    if (current !== sequence) return
    data.value = payroll
    periods.value = list
    historyOnly.value = false
  } catch (e) {
    if (current !== sequence) return
    data.value = null
    error.value = accountingErrorMessage(e)
  } finally {
    if (current === sequence) loading.value = false
  }
}

function pick(value: string) {
  period.value = value
  load()
}

/** Corre una acción que devuelve la planilla ya actualizada. */
async function run(action: () => Promise<{ message: string; data: Payroll }>, failure: string): Promise<boolean> {
  working.value = true
  try {
    const res = await action()
    data.value = res.data
    toast.add({ severity: 'success', summary: res.message, life: 4000 })
    getPayrollPeriods(year.value).then(list => (periods.value = list)).catch(() => {})
    return true
  } catch (e) {
    toast.add({ severity: 'error', summary: failure, detail: accountingErrorMessage(e), life: 8000 })
    return false
  } finally {
    working.value = false
  }
}

function prepare(refresh: boolean) {
  const options = refresh ? { refresh: true } : { with_expenses: data.value?.payroll ? undefined : !historyOnly.value }
  run(() => preparePayroll(period.value, options), 'No se pudo calcular')
}

function close() {
  const withExpenses = data.value?.payroll?.with_expenses
  confirm.require({
    header: `Cerrar ${periodLabel.value}`,
    message: withExpenses
      ? 'Se crean o actualizan los gastos del mes: el neto de cada persona, lo retenido para cada AFP, y la renta de quinta y EsSalud para SUNAT.'
      : 'Queda como historial: alimenta la renta de quinta del año y no genera gastos.',
    acceptLabel: 'Cerrar',
    rejectLabel: 'Cancelar',
    accept: () => run(() => closePayroll(period.value), 'No se pudo cerrar')
  })
}

function reopen() {
  run(() => reopenPayroll(period.value), 'No se pudo reabrir')
}

// --- Boleta ---
const lineVisible = ref(false)
const editingLine = ref<PayrollLine | null>(null)
const payslipLoading = ref<number | null>(null)
const moneyInput = { minFractionDigits: 2, maxFractionDigits: 2, min: 0 }
const lineForm = reactive({
  base_salary: 0,
  work_condition_full: 0,
  days_worked: 30,
  has_family_allowance: false,
  commissions: 0,
  bonus: 0,
  gratification: 0,
  gratification_bonus: 0,
  advances: 0,
  other_deductions: 0,
  tax_manual: false,
  income_tax: 0,
  note: ''
})

const lineTitle = computed(() => (editingLine.value ? `${editingLine.value.payee_name} · ${periodLabel.value}` : ''))
const taxDetail = computed(() => editingLine.value?.income_tax_detail ?? null)

function openLine(line: PayrollLine) {
  editingLine.value = line
  lineForm.base_salary = line.base_salary
  lineForm.work_condition_full = line.work_condition_full
  lineForm.days_worked = line.days_worked
  lineForm.has_family_allowance = line.has_family_allowance
  lineForm.commissions = line.commissions
  lineForm.bonus = line.bonus
  lineForm.gratification = line.gratification
  lineForm.gratification_bonus = line.gratification_bonus
  lineForm.advances = line.advances
  lineForm.other_deductions = line.other_deductions
  lineForm.tax_manual = line.income_tax_manual
  lineForm.income_tax = line.income_tax
  lineForm.note = line.note ?? ''
  lineVisible.value = true
}

function syncBonus(value: number | null) {
  const rate = data.value?.settings.essalud_rate ?? 0.09
  lineForm.gratification_bonus = Math.round((value ?? 0) * rate * 100) / 100
}

async function submitLine() {
  const line = editingLine.value
  if (!line) return

  const done = await run(
    () =>
      updatePayrollLine(line.id, {
        base_salary: lineForm.base_salary ?? 0,
        work_condition_full: lineForm.work_condition_full ?? 0,
        days_worked: lineForm.days_worked ?? 30,
        has_family_allowance: lineForm.has_family_allowance,
        commissions: lineForm.commissions ?? 0,
        bonus: lineForm.bonus ?? 0,
        gratification: lineForm.gratification ?? 0,
        gratification_bonus: lineForm.gratification_bonus ?? 0,
        advances: lineForm.advances ?? 0,
        other_deductions: lineForm.other_deductions ?? 0,
        income_tax: lineForm.tax_manual ? (lineForm.income_tax ?? 0) : null,
        note: lineForm.note.trim()
      }),
    'No se pudo guardar'
  )
  if (done) lineVisible.value = false
}

function removeLine() {
  const line = editingLine.value
  if (!line) return

  confirm.require({
    header: 'Quitar de la planilla',
    message: `${line.payee_name} sale de la planilla de ${periodLabel.value}. Se puede volver a incluir.`,
    acceptLabel: 'Quitar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      if (await run(() => deletePayrollLine(line.id), 'No se pudo quitar')) lineVisible.value = false
    }
  })
}

async function openPayslip(line: PayrollLine) {
  payslipLoading.value = line.id
  try {
    window.open(await getPayslipUrl(line.id), '_blank')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo abrir la boleta', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    payslipLoading.value = null
  }
}

onMounted(load)
</script>
