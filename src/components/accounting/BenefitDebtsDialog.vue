<template>
  <Dialog :visible="visible" modal header="Beneficios adeudados" :style="{ width: '56rem' }" @update:visible="emit('update:visible', $event)">
    <div v-if="loading && !data" class="py-10 text-center text-gray-400"><i class="pi pi-spin pi-spinner text-2xl"></i></div>

    <div v-else-if="data" class="space-y-5">
      <p class="text-sm text-gray-500">
        Gratificaciones y CTS que tocaba pagar y no se pagaron. Cada una es un gasto por pagar de la persona: un abono
        registrado acá (o conciliado desde Bancos) baja su saldo. No suman al estado de resultados: ese costo ya está en
        la planilla de cada mes.
      </p>

      <div class="grid grid-cols-3 gap-3">
        <div class="bg-gray-50 rounded-lg p-3"><div class="text-xs text-gray-500">Adeudado</div><div class="text-lg font-bold tabular-nums">{{ money(data.totals.owed) }}</div></div>
        <div class="bg-gray-50 rounded-lg p-3"><div class="text-xs text-gray-500">Pagado</div><div class="text-lg font-bold tabular-nums text-emerald-700">{{ money(data.totals.paid) }}</div></div>
        <div class="bg-gray-50 rounded-lg p-3"><div class="text-xs text-gray-500">Saldo por pagar</div><div class="text-lg font-bold tabular-nums text-red-600">{{ money(data.totals.balance) }}</div></div>
      </div>

      <div v-if="data.people.length === 0" class="text-sm text-gray-400 text-center py-4">No hay beneficios adeudados registrados.</div>

      <div v-for="person in data.people" :key="person.payee_id" class="border border-gray-200 rounded-lg">
        <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 rounded-t-lg">
          <span class="font-medium text-gray-800">{{ person.name }}</span>
          <span class="text-sm text-gray-600">
            saldo <span class="font-semibold tabular-nums" :class="person.balance > 0 ? 'text-red-600' : 'text-emerald-700'">{{ money(person.balance) }}</span>
            <span class="text-gray-400"> de {{ money(person.owed) }}</span>
          </span>
        </div>
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="item in person.items" :key="item.expense_id" class="border-t border-gray-100">
              <td class="px-4 py-2 text-gray-700">{{ item.description.replace(/^Adeudado: /, '').replace(' (según la hoja de planilla)', '') }}</td>
              <td class="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">vencía {{ shortDate(item.due_date) }}</td>
              <td class="px-3 py-2 text-right tabular-nums whitespace-nowrap">{{ money(item.total) }}</td>
              <td class="px-3 py-2 text-right tabular-nums text-xs whitespace-nowrap" :class="item.balance > 0 ? 'text-red-600' : 'text-emerald-700'">
                {{ item.balance > 0 ? (item.paid > 0 ? `faltan ${money(item.balance)}` : 'por pagar') : 'pagado' }}
              </td>
              <td class="px-3 py-2 text-right whitespace-nowrap">
                <Button v-if="item.balance > 0" label="Registrar pago" size="small" text @click="openPayment(person.name, item)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Agregar -->
      <div class="bg-gray-50 rounded-lg p-3 space-y-3">
        <div class="text-sm font-medium text-gray-700">Agregar una deuda</div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Dropdown v-model="form.payee_id" :options="people" optionLabel="name" optionValue="payee_id" placeholder="Persona" class="w-full" />
          <Dropdown v-model="form.concept" :options="CONCEPTS" optionLabel="label" optionValue="value" class="w-full" />
          <InputText v-model="form.due_date" type="date" class="w-full" v-tooltip.top="'Cuándo debió pagarse'" />
          <InputNumber v-model="form.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" placeholder="Importe" class="w-full" />
          <Button label="Agregar" icon="pi pi-plus" :loading="saving" @click="submitDebt" />
        </div>
        <InputText v-model="form.label" maxlength="120" placeholder="Detalle (opcional): Gratificación de diciembre 2025" class="w-full" />
      </div>
    </div>

    <!-- Pago -->
    <Dialog v-model:visible="paymentVisible" modal :header="paymentTitle" :style="{ width: '28rem' }">
      <div v-if="paying" class="space-y-3">
        <p class="text-sm text-gray-500">Saldo: {{ money(paying.balance) }}. Si el pago ya está en Bancos, mejor concílialo desde ahí: queda enlazado al movimiento.</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
            <InputText v-model="payment.date" type="date" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Importe</label>
            <InputNumber v-model="payment.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Cómo se pagó</label>
          <InputText v-model="payment.method" maxlength="40" class="w-full" placeholder="Transferencia BBVA" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nota</label>
          <InputText v-model="payment.note" maxlength="255" class="w-full" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="paymentVisible = false" />
        <Button label="Registrar" icon="pi pi-check" :loading="saving" @click="submitPayment" />
      </template>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import { getBenefitDebts, addBenefitDebt, addExpensePayment, getEmployees, accountingErrorMessage } from '@/api/accounting.api'
import type { BenefitConcept, BenefitDebtItem, BenefitDebts } from '@/types/accounting.types'

// Lo que se le debe al personal por beneficios atrasados, y sus abonos.
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const CONCEPTS: { label: string; value: BenefitConcept }[] = [
  { label: 'Gratificación', value: 'gratificacion' },
  { label: 'CTS', value: 'cts' },
  { label: 'Vacaciones', value: 'vacaciones' },
  { label: 'Otro', value: 'otro' }
]
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']

const toast = useToast()
const data = ref<BenefitDebts | null>(null)
const people = ref<{ payee_id: number; name: string }[]>([])
const loading = ref(false)
const saving = ref(false)
const form = reactive({ payee_id: null as number | null, concept: 'gratificacion' as BenefitConcept, due_date: '', amount: null as number | null, label: '' })

function money(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function shortDate(value: string): string {
  return `${Number(value.slice(8, 10))} ${MONTHS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`
}

async function load() {
  loading.value = true
  try {
    const [debts, employees] = await Promise.all([getBenefitDebts(), getEmployees()])
    data.value = debts
    people.value = employees.map(e => ({ payee_id: e.payee_id, name: e.name }))
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar los beneficios adeudados', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loading.value = false
  }
}

async function submitDebt() {
  if (!form.payee_id || !form.due_date || !form.amount) {
    toast.add({ severity: 'warn', summary: 'Indica la persona, cuándo debió pagarse y el importe', life: 4000 })
    return
  }
  saving.value = true
  try {
    const res = await addBenefitDebt({ payee_id: form.payee_id, concept: form.concept, due_date: form.due_date, amount: form.amount, label: form.label.trim() || undefined })
    data.value = res.data
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    form.amount = null
    form.label = ''
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

// --- Pago ---
const paymentVisible = ref(false)
const paying = ref<BenefitDebtItem | null>(null)
const payingName = ref('')
const payment = reactive({ date: '', amount: null as number | null, method: '', note: '' })
const paymentTitle = computed(() => `Pago a ${payingName.value}`)

function openPayment(name: string, item: BenefitDebtItem) {
  paying.value = item
  payingName.value = name
  payment.date = new Date().toISOString().slice(0, 10)
  payment.amount = item.balance
  payment.method = ''
  payment.note = ''
  paymentVisible.value = true
}

async function submitPayment() {
  if (!paying.value || !payment.date || !payment.amount || !payment.method.trim()) {
    toast.add({ severity: 'warn', summary: 'Indica fecha, importe y cómo se pagó', life: 4000 })
    return
  }
  saving.value = true
  try {
    const res = await addExpensePayment(paying.value.expense_id, {
      date: payment.date,
      amount: payment.amount,
      method: payment.method.trim(),
      note: payment.note.trim() || undefined
    })
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    paymentVisible.value = false
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar el pago', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) load()
  }
)
</script>
