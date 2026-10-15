<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Flujo de caja</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Las próximas 13 semanas: con qué plata se llega a cada una. Mezcla lo que ya se sabe (planilla, cuotas, lo
          facturado y lo registrado por pagar) con lo que se estima por el promedio de los últimos tres meses. Las líneas
          estimadas se pueden apagar para ver el caso sin ellas.
        </p>
      </div>
      <Button label="Programar un pago o cobro" icon="pi pi-plus" @click="openItem(null)" />
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <div v-else-if="loading && !data" class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Saldos -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-800">Con cuánto se parte</h2>
            <span class="text-xs text-gray-400">Dólares a S/ {{ data.exchange_rate.toFixed(3) }}</span>
          </div>
          <div class="divide-y divide-gray-100 mt-2">
            <div v-for="account in data.accounts" :key="account.id" class="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <span class="text-sm text-gray-800">{{ account.name }}</span>
                <span v-if="account.balance_at" class="text-xs text-gray-400 ml-2">al {{ shortDate(account.balance_at) }}</span>
                <span v-else class="text-xs text-amber-600 ml-2">sin saldo: no suma</span>
              </div>
              <div class="flex items-center gap-2">
                <InputNumber
                  v-model="balances[account.id]"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  :prefix="account.currency === 'USD' ? 'US$ ' : 'S/ '"
                  placeholder="Saldo"
                  inputClass="w-36 text-right"
                />
                <Button
                  icon="pi pi-check"
                  text
                  rounded
                  size="small"
                  :disabled="balances[account.id] === account.balance"
                  :loading="savingBalance === account.id"
                  v-tooltip.top="'Guardar el saldo de hoy'"
                  @click="saveBalance(account)"
                />
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            El saldo se actualiza solo al importar los movimientos de BBVA. BCP no lo informa en su archivo: ponlo a mano.
            La tarjeta de crédito no es caja; déjala vacía.
          </p>
        </div>

        <!-- Lo esencial -->
        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Saldo hoy</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ money(opening) }}</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Punto más bajo</div>
            <div class="text-2xl font-bold mt-1" :class="lowest.amount < 0 ? 'text-red-600' : 'text-gray-900'">{{ money(lowest.amount) }}</div>
            <div class="text-xs text-gray-400 mt-1">semana del {{ weekLabel(lowest.index) }}</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Al cabo de 13 semanas</div>
            <div class="text-2xl font-bold mt-1" :class="closing[closing.length - 1] < 0 ? 'text-red-600' : 'text-primary'">
              {{ money(closing[closing.length - 1] ?? 0) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="data.notes.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <div class="font-medium">Fuera de la proyección</div>
        <ul class="list-disc pl-5 space-y-0.5">
          <li v-for="note in data.notes" :key="note.text">
            <span class="font-medium">{{ money(note.amount) }}</span> {{ note.text }}
          </li>
        </ul>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table class="w-full text-sm whitespace-nowrap">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="sticky left-0 bg-white px-4 py-3 text-left font-medium min-w-[300px]">Semana del</th>
              <th v-for="(week, index) in data.weeks" :key="week.start" class="px-3 py-3 text-right font-medium">{{ weekLabel(index) }}</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-gray-50">
              <td class="sticky left-0 bg-gray-50 px-4 py-2 font-medium text-gray-700">Saldo al empezar</td>
              <td v-for="(value, index) in openings" :key="index" class="px-3 py-2 text-right tabular-nums" :class="value < 0 ? 'text-red-600' : 'text-gray-700'">
                {{ format(value) }}
              </td>
              <td></td>
            </tr>

            <template v-for="section in SECTIONS" :key="section.key">
              <tr>
                <td class="sticky left-0 bg-white px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500" :colspan="1">
                  {{ section.title }}
                </td>
                <td :colspan="data.weeks.length + 1"></td>
              </tr>
              <tr v-for="line in linesOf(section.key)" :key="line.key" :class="{ 'opacity-40': disabled[line.key] }">
                <td class="sticky left-0 bg-white px-4 py-1.5 pl-6">
                  <div class="flex items-center gap-2">
                    <Checkbox v-if="line.estimated" v-model="enabled[line.key]" binary v-tooltip.top="'Incluir esta estimación'" />
                    <span class="text-gray-700" v-tooltip.top="line.basis">{{ line.label }}</span>
                    <Button
                      v-if="line.plan_item_id"
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      severity="secondary"
                      class="!w-6 !h-6"
                      @click="openItem(planItem(line.plan_item_id))"
                    />
                  </div>
                </td>
                <td v-for="(value, index) in line.values" :key="index" class="px-3 py-1.5 text-right tabular-nums text-gray-700">{{ format(value) }}</td>
                <td class="px-4 py-1.5 text-right tabular-nums font-medium text-gray-700">{{ format(sum(line.values)) }}</td>
              </tr>
              <tr class="border-t border-gray-200">
                <td class="sticky left-0 bg-white px-4 py-2 font-semibold text-gray-900">{{ section.total }}</td>
                <td v-for="(value, index) in totals[section.key]" :key="index" class="px-3 py-2 text-right tabular-nums font-semibold text-gray-900">
                  {{ format(value) }}
                </td>
                <td class="px-4 py-2 text-right tabular-nums font-semibold text-gray-900">{{ format(sum(totals[section.key])) }}</td>
              </tr>
            </template>

            <tr class="border-t border-gray-200">
              <td class="sticky left-0 bg-white px-4 py-2 font-semibold text-gray-900">Entra menos sale</td>
              <td v-for="(value, index) in net" :key="index" class="px-3 py-2 text-right tabular-nums font-semibold" :class="value < 0 ? 'text-red-600' : 'text-gray-900'">
                {{ format(value) }}
              </td>
              <td class="px-4 py-2 text-right tabular-nums font-semibold" :class="sum(net) < 0 ? 'text-red-600' : 'text-gray-900'">{{ format(sum(net)) }}</td>
            </tr>
            <tr class="bg-gray-50 border-y border-gray-200">
              <td class="sticky left-0 bg-gray-50 px-4 py-2 font-bold text-gray-900">Saldo al terminar</td>
              <td v-for="(value, index) in closing" :key="index" class="px-3 py-2 text-right tabular-nums font-bold" :class="value < 0 ? 'text-red-600' : 'text-gray-900'">
                {{ format(value) }}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-gray-500">
        Pasa el cursor por una línea para ver de dónde sale. Importes en soles, con IGV. Lo marcado con casilla es
        estimación; lo demás viene de la planilla, de comprobantes o gastos con vencimiento, o de lo que programaste.
      </p>

      <!-- Préstamos -->
      <div v-if="data.loans.length" class="bg-white rounded-xl border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-800">Préstamos</h2>
          <p class="text-xs text-gray-500">
            Según su cronograma, dando por pagada toda cuota ya vencida. De cada cuota, solo el interés y el seguro son
            gasto; la amortización devuelve capital.
          </p>
        </div>
        <div class="divide-y divide-gray-100">
          <div v-for="loan in data.loans" :key="loan.id" class="px-4 py-3 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-sm">
                <span class="font-medium text-gray-800">{{ loan.name }}</span>
                <span class="text-gray-500">
                  · {{ loanMoney(loan, loan.principal) }}<template v-if="loan.annual_rate"> al {{ loan.annual_rate }} % anual</template>
                  · cuota {{ loan.paid_count }} de {{ loan.installments }} pagada
                </span>
              </div>
              <span v-if="loan.next" class="text-xs text-gray-500">
                Próxima: {{ loanMoney(loan, loan.next.total) }} el {{ shortDate(loan.next.due_date) }}
                <template v-if="loan.last_due && loan.last_due !== loan.next.due_date"> · termina el {{ shortDate(loan.last_due) }} de {{ loan.last_due.slice(0, 4) }}</template>
                <template v-else> · es la última</template>
              </span>
              <span v-else class="text-xs text-emerald-700">Terminado de pagar</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><div class="text-xs text-gray-500">Capital por devolver</div><div class="font-semibold tabular-nums">{{ loanMoney(loan, loan.outstanding) }}</div></div>
              <div><div class="text-xs text-gray-500">Falta pagar en total</div><div class="font-semibold tabular-nums">{{ loanMoney(loan, loan.remaining) }}</div></div>
              <div><div class="text-xs text-gray-500">Capital pagado este año</div><div class="tabular-nums text-gray-700">{{ loanMoney(loan, loan.year_principal) }}</div></div>
              <div><div class="text-xs text-gray-500">Interés pagado este año</div><div class="tabular-nums text-gray-700">{{ loanMoney(loan, loan.year_interest) }}</div></div>
              <div><div class="text-xs text-gray-500">Desgravamen este año</div><div class="tabular-nums text-gray-700">{{ loanMoney(loan, loan.year_insurance) }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Compromisos programados -->
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-800">Pagos y cobros programados</h2>
          <p class="text-xs text-gray-500">
            Lo que se sabe que viene y no está como comprobante ni como gasto: cuotas de préstamos, el fraccionamiento de
            SUNAT, un cobro pactado.
          </p>
        </div>
        <div v-if="data.plan_items.length === 0" class="px-4 py-6 text-sm text-gray-400 text-center">Nada programado todavía.</div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="item in data.plan_items"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
            :class="{ 'opacity-50': !item.is_active }"
          >
            <div>
              <span class="font-medium text-gray-800">{{ item.name }}</span>
              <span class="text-gray-500"> · {{ describe(item) }}</span>
              <div v-if="item.note" class="text-xs text-gray-400">{{ item.note }}</div>
            </div>
            <div class="flex items-center gap-3">
              <span class="tabular-nums" :class="item.kind === 'ingreso' ? 'text-emerald-700' : 'text-gray-900'">
                {{ item.kind === 'ingreso' ? '+' : '−' }} {{ item.currency === 'USD' ? 'US$' : 'S/' }} {{ plain(item.amount) }}
              </span>
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openItem(item)" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="itemVisible" modal :header="editing ? 'Editar' : 'Programar un pago o cobro'" :style="{ width: '32rem' }">
      <div class="space-y-4">
        <SelectButton v-model="form.kind" :options="KINDS" optionLabel="label" optionValue="value" :allowEmpty="false" />
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">De qué se trata *</label>
          <InputText v-model="form.name" maxlength="120" placeholder="Cuota del préstamo BBVA" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Importe por vez *</label>
            <InputNumber v-model="form.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Moneda</label>
            <SelectButton v-model="form.currency" :options="CURRENCIES" optionLabel="label" optionValue="value" :allowEmpty="false" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Cada cuánto</label>
          <SelectButton v-model="form.frequency" :options="FREQUENCIES" optionLabel="label" optionValue="value" :allowEmpty="false" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ form.frequency === 'unica' ? 'Fecha *' : 'Primera cuota *' }}</label>
            <InputText v-model="form.start_date" type="date" class="w-full" />
          </div>
          <div v-if="form.frequency !== 'unica'">
            <label class="block text-sm font-medium text-gray-600 mb-1">Última cuota</label>
            <InputText v-model="form.end_date" type="date" class="w-full" />
          </div>
        </div>
        <p v-if="form.frequency === 'mensual'" class="text-xs text-gray-500 -mt-2">
          Se repite el mismo día de cada mes. Sin última cuota, sigue sin fin.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nota</label>
          <InputText v-model="form.note" maxlength="255" class="w-full" />
        </div>
        <div v-if="editing" class="flex items-center gap-2">
          <Checkbox v-model="form.is_active" inputId="planActive" binary />
          <label for="planActive" class="text-sm text-gray-600">Cuenta en la proyección</label>
        </div>
      </div>
      <template #footer>
        <Button v-if="editing" label="Eliminar" icon="pi pi-trash" text severity="danger" class="mr-auto" :loading="saving" @click="removeItem" />
        <Button label="Cancelar" text severity="secondary" @click="itemVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="submitItem" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { getCashFlow, setCashBalance, saveCashPlanItem, deleteCashPlanItem, accountingErrorMessage } from '@/api/accounting.api'
import type { CashAccount, CashFlow, CashFlowLine, CashPlanItem, LoanSummary } from '@/types/accounting.types'

type Section = 'in' | 'out'

const SECTIONS: { key: Section; title: string; total: string }[] = [
  { key: 'in', title: 'Entra', total: 'Total que entra' },
  { key: 'out', title: 'Sale', total: 'Total que sale' }
]
const KINDS = [
  { label: 'Pago (sale)', value: 'egreso' },
  { label: 'Cobro (entra)', value: 'ingreso' }
]
const CURRENCIES = [
  { label: 'Soles', value: 'PEN' },
  { label: 'Dólares', value: 'USD' }
]
const FREQUENCIES = [
  { label: 'Una vez', value: 'unica' },
  { label: 'Cada mes', value: 'mensual' },
  { label: 'Cada semana', value: 'semanal' }
]
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']

const toast = useToast()
const data = ref<CashFlow | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
// Estimaciones encendidas; todas al entrar.
const enabled = reactive<Record<string, boolean>>({})
const balances = reactive<Record<number, number | null>>({})
const savingBalance = ref<number | null>(null)

function plain(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function money(amount: number): string {
  return `${amount < 0 ? '−' : ''}S/ ${plain(Math.abs(amount))}`
}

// Sin céntimos: trece semanas más el total no entran con ellos. Negativos entre paréntesis.
function format(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return '-'
  const text = Math.abs(rounded).toLocaleString('es-PE')
  return rounded < 0 ? `(${text})` : text
}

function loanMoney(loan: LoanSummary, amount: number): string {
  return `${loan.currency === 'USD' ? 'US$' : 'S/'} ${plain(amount)}`
}

function shortDate(value: string): string {
  return `${Number(value.slice(8, 10))} ${MONTHS[Number(value.slice(5, 7)) - 1]}`
}

function weekLabel(index: number): string {
  const week = data.value?.weeks[index]
  return week ? shortDate(week.start) : ''
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

const disabled = computed<Record<string, boolean>>(() => {
  const map: Record<string, boolean> = {}
  for (const line of data.value?.lines ?? []) map[line.key] = line.estimated && enabled[line.key] === false
  return map
})

function linesOf(section: Section): CashFlowLine[] {
  return (data.value?.lines ?? []).filter(line => line.section === section)
}

const totals = computed<Record<Section, number[]>>(() => {
  const count = data.value?.weeks.length ?? 0
  const result: Record<Section, number[]> = { in: Array(count).fill(0), out: Array(count).fill(0) }
  for (const line of data.value?.lines ?? []) {
    if (disabled.value[line.key]) continue
    line.values.forEach((value, index) => (result[line.section][index] += value))
  }
  return result
})

const net = computed(() => totals.value.in.map((value, index) => value - (totals.value.out[index] ?? 0)))

// Parte de los saldos guardados: uno que se está tipeando no mueve la tabla hasta guardarlo.
const opening = computed(() => sum((data.value?.accounts ?? []).map(account => account.balance_pen ?? 0)))

const closing = computed(() => {
  let running = opening.value
  return net.value.map(value => (running += value))
})

const openings = computed(() => closing.value.map((_, index) => (index === 0 ? opening.value : (closing.value[index - 1] ?? 0))))

const lowest = computed(() => {
  let index = 0
  closing.value.forEach((value, i) => {
    if (value < (closing.value[index] ?? 0)) index = i
  })
  return { index, amount: closing.value[index] ?? 0 }
})

function apply(flow: CashFlow) {
  data.value = flow
  for (const line of flow.lines) {
    if (line.estimated && enabled[line.key] === undefined) enabled[line.key] = true
  }
  for (const account of flow.accounts) balances[account.id] = account.balance
}

async function load() {
  loading.value = true
  error.value = null
  try {
    apply(await getCashFlow())
  } catch (e) {
    data.value = null
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveBalance(account: CashAccount) {
  savingBalance.value = account.id
  try {
    const accounts = await setCashBalance(account.id, balances[account.id] ?? null)
    if (data.value) data.value = { ...data.value, accounts }
    for (const row of accounts) balances[row.id] = row.balance
    toast.add({ severity: 'success', summary: 'Saldo guardado', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    savingBalance.value = null
  }
}

// --- Compromisos programados ---
const itemVisible = ref(false)
const saving = ref(false)
const editing = ref<CashPlanItem | null>(null)
const form = reactive({
  kind: 'egreso' as CashPlanItem['kind'],
  name: '',
  amount: null as number | null,
  currency: 'PEN' as CashPlanItem['currency'],
  frequency: 'unica' as CashPlanItem['frequency'],
  start_date: '',
  end_date: '',
  note: '',
  is_active: true
})

function planItem(id: number): CashPlanItem | null {
  return data.value?.plan_items.find(item => item.id === id) ?? null
}

function describe(item: CashPlanItem): string {
  if (item.frequency === 'unica') return `el ${shortDate(item.start_date)} de ${item.start_date.slice(0, 4)}`
  const every = item.frequency === 'mensual' ? `cada mes, el día ${Number(item.start_date.slice(8, 10))}` : 'cada semana'
  return item.end_date ? `${every}, hasta el ${shortDate(item.end_date)} de ${item.end_date.slice(0, 4)}` : `${every}, sin fin`
}

function openItem(item: CashPlanItem | null) {
  editing.value = item
  form.kind = item?.kind ?? 'egreso'
  form.name = item?.name ?? ''
  form.amount = item?.amount ?? null
  form.currency = item?.currency ?? 'PEN'
  form.frequency = item?.frequency ?? 'unica'
  form.start_date = item?.start_date ?? ''
  form.end_date = item?.end_date ?? ''
  form.note = item?.note ?? ''
  form.is_active = item?.is_active ?? true
  itemVisible.value = true
}

async function submitItem() {
  if (!form.name.trim() || !form.amount || !form.start_date) {
    toast.add({ severity: 'warn', summary: 'Indica de qué se trata, el importe y la fecha', life: 4000 })
    return
  }

  saving.value = true
  try {
    await saveCashPlanItem(editing.value?.id ?? null, {
      kind: form.kind,
      name: form.name.trim(),
      amount: form.amount,
      currency: form.currency,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.frequency === 'unica' ? null : form.end_date || null,
      note: form.note.trim() || null,
      is_active: form.is_active
    })
    itemVisible.value = false
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

async function removeItem() {
  if (!editing.value) return

  saving.value = true
  try {
    await deleteCashPlanItem(editing.value.id)
    itemVisible.value = false
    toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo eliminar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
