<template>
  <Dialog :visible="visible" modal header="Personal" :style="{ width: '56rem' }" @update:visible="emit('update:visible', $event)">
    <div v-if="loading" class="py-10 text-center text-gray-400"><i class="pi pi-spin pi-spinner text-2xl"></i></div>

    <div v-else-if="employees.length === 0" class="py-8 text-center text-sm text-gray-500">
      Todavía no hay personal. Agrégalo en Proveedores y personal (tipo "Personal") y vuelve para completar su ficha.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- Quién -->
      <div class="space-y-1">
        <button
          v-for="employee in employees"
          :key="employee.payee_id"
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg border transition-colors"
          :class="employee.payee_id === selectedId ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'"
          @click="select(employee)"
        >
          <div class="text-sm font-medium text-gray-800">{{ employee.name }}</div>
          <div class="text-xs" :class="employee.current_salary && employee.pension_fund_id ? 'text-gray-500' : 'text-amber-600'">
            {{ summary(employee) }}
          </div>
        </button>
      </div>

      <div v-if="selected" class="md:col-span-2 space-y-5">
        <!-- Ficha -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-800">Ficha de {{ selected.name }}</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Cargo</label>
              <InputText v-model="form.position" maxlength="80" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Sistema de pensiones *</label>
              <Dropdown v-model="form.pension_fund_id" :options="fundOptions" optionLabel="label" optionValue="value" placeholder="Elegir" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Fecha de ingreso</label>
              <InputText v-model="form.start_date" type="date" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Fecha de cese</label>
              <InputText v-model="form.end_date" type="date" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">CUSPP</label>
              <InputText v-model="form.cuspp" maxlength="20" class="w-full" />
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 space-y-2">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Vacaciones pendientes</label>
                <InputNumber v-model="form.vacation_opening_days" :maxFractionDigits="1" :min="-60" :max="365" suffix=" días" inputClass="w-28" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">al día</label>
                <InputText v-model="form.vacation_opening_date" type="date" />
              </div>
              <div v-if="selected.vacation_balance !== null" class="text-sm text-gray-700 pb-2">
                Saldo hoy: <span class="font-semibold">{{ selected.vacation_balance }} días</span>
                <span class="text-xs text-gray-500"> ({{ selected.vacation_taken }} gozados desde entonces)</span>
              </div>
            </div>
            <p class="text-xs text-gray-500">
              El saldo parte de lo pendiente a una fecha, suma lo que se gana cada mes y resta los días que se anotan en
              cada boleta. Sin ese punto de partida no se muestra saldo.
            </p>
          </div>
          <div class="flex justify-end">
            <Button label="Guardar ficha" icon="pi pi-check" :loading="saving" @click="submitRecord" />
          </div>
        </div>

        <!-- Sueldos -->
        <div class="space-y-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-800">Historial de sueldos</h3>
            <p class="text-xs text-gray-500">
              Cada planilla usa el sueldo vigente al cierre de su mes. Un aumento es un sueldo nuevo con su fecha; los
              anteriores quedan.
            </p>
          </div>
          <table v-if="selected.salaries.length" class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 border-b border-gray-200">
                <th class="py-2 font-medium">Desde</th>
                <th class="py-2 font-medium text-right">Sueldo</th>
                <th class="py-2 font-medium text-right">Cond. de trabajo</th>
                <th class="py-2 font-medium pl-4">Nota</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="salary in selected.salaries" :key="salary.id" class="border-b border-gray-100">
                <td class="py-2 text-gray-800">
                  {{ shortDate(salary.effective_from) }}
                  <span v-if="salary.id === selected.current_salary?.id" class="ml-1 text-[10px] text-emerald-600">vigente</span>
                </td>
                <td class="py-2 text-right tabular-nums">{{ money(salary.base_salary) }}</td>
                <td class="py-2 text-right tabular-nums text-gray-600">{{ money(salary.work_condition) }}</td>
                <td class="py-2 pl-4 text-xs text-gray-500">
                  {{ salary.note }}<span v-if="salary.family_allowance"> · asignación familiar</span>
                </td>
                <td class="py-2 text-right whitespace-nowrap">
                  <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="editSalary(salary)" />
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" :loading="saving" @click="removeSalary(salary)" />
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-sm text-amber-600">Sin sueldo registrado: no entra a la planilla.</p>

          <div class="bg-gray-50 rounded-lg p-3 space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Rige desde *</label>
                <InputText v-model="salaryForm.effective_from" type="date" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Sueldo afecto *</label>
                <InputNumber v-model="salaryForm.base_salary" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Condición de trabajo</label>
                <InputNumber v-model="salaryForm.work_condition" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <InputText v-model="salaryForm.note" maxlength="255" placeholder="Nota (opcional)" class="flex-1 min-w-[160px]" />
              <div class="flex items-center gap-2">
                <Checkbox v-model="salaryForm.family_allowance" inputId="salaryfamily" binary />
                <label for="salaryfamily" class="text-sm text-gray-600">Asignación familiar</label>
              </div>
              <Button label="Guardar sueldo" icon="pi pi-plus" size="small" :loading="saving" @click="submitSalary" />
            </div>
            <p class="text-xs text-gray-500">
              El sueldo afecto paga AFP, EsSalud y renta de quinta. La condición de trabajo no. Con una fecha que ya
              existe se corrige ese sueldo.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import {
  getEmployees, getPayrollSettings, saveEmployee, saveEmployeeSalary, deleteEmployeeSalary, accountingErrorMessage
} from '@/api/accounting.api'
import type { Employee, EmployeeSalary, PensionFund } from '@/types/accounting.types'

// Ficha laboral e historial de sueldos de cada persona. La persona en sí
// (nombre, DNI) se crea en Proveedores y personal.
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; changed: [] }>()

const toast = useToast()
const employees = ref<Employee[]>([])
const funds = ref<PensionFund[]>([])
const loading = ref(false)
const saving = ref(false)
const selectedId = ref<number | null>(null)

const selected = computed(() => employees.value.find(e => e.payee_id === selectedId.value) ?? null)
const fundOptions = computed(() => funds.value.filter(f => f.is_active).map(f => ({ label: f.name, value: f.id })))

const form = reactive({
  position: '',
  pension_fund_id: null as number | null,
  start_date: '',
  end_date: '',
  cuspp: '',
  vacation_opening_days: null as number | null,
  vacation_opening_date: ''
})
const salaryForm = reactive({ effective_from: '', base_salary: null as number | null, work_condition: 0 as number | null, family_allowance: false, note: '' })

function money(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function shortDate(value: string): string {
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

function summary(employee: Employee): string {
  if (!employee.pension_fund_id) return 'Falta su ficha'
  if (!employee.current_salary) return 'Falta su sueldo'
  return `${employee.position || 'Sin cargo'} · ${money(employee.current_salary.base_salary)}`
}

function select(employee: Employee) {
  selectedId.value = employee.payee_id
  form.position = employee.position ?? ''
  form.pension_fund_id = employee.pension_fund_id
  form.start_date = employee.start_date ?? ''
  form.end_date = employee.end_date ?? ''
  form.cuspp = employee.cuspp ?? ''
  form.vacation_opening_days = employee.vacation_opening_days
  form.vacation_opening_date = employee.vacation_opening_date ?? ''
  resetSalary()
}

function resetSalary() {
  salaryForm.effective_from = ''
  salaryForm.base_salary = null
  salaryForm.work_condition = 0
  salaryForm.family_allowance = false
  salaryForm.note = ''
}

function editSalary(salary: EmployeeSalary) {
  salaryForm.effective_from = salary.effective_from
  salaryForm.base_salary = salary.base_salary
  salaryForm.work_condition = salary.work_condition
  salaryForm.family_allowance = salary.family_allowance
  salaryForm.note = salary.note ?? ''
}

function replace(employee: Employee) {
  employees.value = employees.value.map(e => (e.payee_id === employee.payee_id ? employee : e))
  emit('changed')
}

async function load() {
  loading.value = true
  try {
    const [list, settings] = await Promise.all([getEmployees(), getPayrollSettings(new Date().getFullYear())])
    employees.value = list
    funds.value = settings.funds
    const first = list.find(e => e.payee_id === selectedId.value) ?? list[0]
    if (first) select(first)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cargar el personal', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loading.value = false
  }
}

async function save(action: () => Promise<Employee>, done: string): Promise<boolean> {
  saving.value = true
  try {
    replace(await action())
    toast.add({ severity: 'success', summary: done, life: 3000 })
    return true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 7000 })
    return false
  } finally {
    saving.value = false
  }
}

function submitRecord() {
  if (!selected.value) return
  const payeeId = selected.value.payee_id
  save(
    () =>
      saveEmployee(payeeId, {
        position: form.position.trim(),
        pension_fund_id: form.pension_fund_id,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        cuspp: form.cuspp.trim(),
        vacation_opening_date: form.vacation_opening_date || null,
        vacation_opening_days: form.vacation_opening_date ? (form.vacation_opening_days ?? 0) : null
      }),
    'Ficha guardada'
  )
}

async function submitSalary() {
  if (!selected.value) return
  if (!salaryForm.effective_from || !salaryForm.base_salary) {
    toast.add({ severity: 'warn', summary: 'Indica la fecha y el sueldo', life: 4000 })
    return
  }
  const payeeId = selected.value.payee_id
  const done = await save(
    () =>
      saveEmployeeSalary(payeeId, {
        effective_from: salaryForm.effective_from,
        base_salary: salaryForm.base_salary ?? 0,
        work_condition: salaryForm.work_condition ?? 0,
        family_allowance: salaryForm.family_allowance,
        note: salaryForm.note.trim()
      }),
    'Sueldo guardado'
  )
  if (done) resetSalary()
}

function removeSalary(salary: EmployeeSalary) {
  save(() => deleteEmployeeSalary(salary.id), 'Sueldo eliminado')
}

watch(
  () => props.visible,
  visible => {
    if (visible) load()
  }
)
</script>
