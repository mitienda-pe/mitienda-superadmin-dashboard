<template>
  <Dialog :visible="visible" modal :header="`Parámetros de planilla ${year}`" :style="{ width: '48rem' }" @update:visible="emit('update:visible', $event)">
    <div v-if="loading" class="py-10 text-center text-gray-400"><i class="pi pi-spin pi-spinner text-2xl"></i></div>

    <div v-else class="space-y-6">
      <div class="space-y-3">
        <p v-if="inherited" class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {{ year }} no tiene parámetros propios: estos son los del último año que sí. Revísalos y guarda.
        </p>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">UIT</label>
            <InputNumber v-model="form.uit" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Sueldo mínimo</label>
            <InputNumber v-model="form.minimum_wage" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">EsSalud (%)</label>
            <InputNumber v-model="form.essalud_pct" :minFractionDigits="2" :maxFractionDigits="3" :min="0" :max="50" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Gratificación (sueldos)</label>
            <InputNumber v-model="form.gratification_factor" :minFractionDigits="1" :maxFractionDigits="2" :min="0" :max="1" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Tope del seguro de AFP</label>
            <InputNumber v-model="form.insurance_cap" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Seguro de vida ley (mes)</label>
            <InputNumber v-model="form.life_insurance" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">CTS (días por año)</label>
            <InputNumber v-model="form.cts_days" :maxFractionDigits="1" :min="0" :max="30" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Vacaciones (días por año)</label>
            <InputNumber v-model="form.vacation_days" :maxFractionDigits="1" :min="0" :max="30" class="w-full" />
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-gray-500 max-w-md">
            Pequeña empresa: gratificación de medio sueldo (0.5), CTS de 15 días y 15 días de vacaciones. Régimen
            general: 1, 30 y 30. Con la UIT se calcula la renta de quinta.
          </p>
          <Button label="Guardar parámetros" icon="pi pi-check" :loading="saving" @click="submitSettings" />
        </div>
      </div>

      <div class="space-y-2">
        <div>
          <h3 class="text-sm font-semibold text-gray-800">Sistemas de pensiones</h3>
          <p class="text-xs text-gray-500">
            Tasas vigentes, en porcentaje. Cambiarlas afecta a las planillas que se calculen desde ahora, no a las cerradas.
          </p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 border-b border-gray-200">
              <th class="py-2 font-medium">Sistema</th>
              <th class="py-2 font-medium">Aporte</th>
              <th class="py-2 font-medium">Seguro</th>
              <th class="py-2 font-medium">Comisión</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fund in rows" :key="fund.id" class="border-b border-gray-100">
              <td class="py-1.5 text-gray-800">{{ fund.name }}</td>
              <template v-if="fund.kind === 'ninguno'">
                <td colspan="4" class="py-1.5 text-xs text-gray-400">Sin descuento</td>
              </template>
              <template v-else>
                <td class="py-1.5 pr-2"><InputNumber v-model="fund.contribution" v-bind="pctInput" inputClass="w-20" /></td>
                <td class="py-1.5 pr-2">
                  <InputNumber v-if="fund.kind === 'afp'" v-model="fund.insurance" v-bind="pctInput" inputClass="w-20" />
                </td>
                <td class="py-1.5 pr-2">
                  <InputNumber v-if="fund.kind === 'afp'" v-model="fund.commission" v-bind="pctInput" inputClass="w-20" />
                </td>
                <td class="py-1.5 text-right">
                  <Button icon="pi pi-check" text rounded size="small" :loading="savingFund === fund.id" v-tooltip.top="'Guardar tasas'" @click="submitFund(fund)" />
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { getPayrollSettings, savePayrollSettings, savePensionFund, accountingErrorMessage } from '@/api/accounting.api'
import type { PensionFund } from '@/types/accounting.types'

// Lo que cambia por año (UIT, sueldo mínimo) y las tasas de cada AFP.
const props = defineProps<{ visible: boolean; year: number }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; changed: [] }>()

interface FundRow extends PensionFund {
  // Las tasas se editan en porcentaje; el API las guarda como fracción.
  contribution: number | null
  insurance: number | null
  commission: number | null
}

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const savingFund = ref<number | null>(null)
const inherited = ref(false)
const rows = ref<FundRow[]>([])
const pctInput = { minFractionDigits: 2, maxFractionDigits: 3, min: 0, max: 50 }
const form = reactive({
  uit: 0 as number | null,
  minimum_wage: 0 as number | null,
  essalud_pct: 9 as number | null,
  gratification_factor: 0.5 as number | null,
  insurance_cap: 0 as number | null,
  life_insurance: 0 as number | null,
  cts_days: 15 as number | null,
  vacation_days: 15 as number | null
})

const pct = (rate: number) => Math.round(rate * 100000) / 1000
const fraction = (value: number | null) => Math.round((value ?? 0) * 1000) / 100000

function toRows(funds: PensionFund[]): FundRow[] {
  return funds.map(f => ({ ...f, contribution: pct(f.contribution_rate), insurance: pct(f.insurance_rate), commission: pct(f.commission_rate) }))
}

async function load() {
  loading.value = true
  try {
    const { settings, funds } = await getPayrollSettings(props.year)
    inherited.value = settings.inherited
    form.uit = settings.uit
    form.minimum_wage = settings.minimum_wage
    form.essalud_pct = pct(settings.essalud_rate)
    form.gratification_factor = settings.gratification_factor
    form.insurance_cap = settings.insurance_cap
    form.life_insurance = settings.life_insurance
    form.cts_days = settings.cts_days
    form.vacation_days = settings.vacation_days
    rows.value = toRows(funds)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar los parámetros', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loading.value = false
  }
}

async function submitSettings() {
  saving.value = true
  try {
    const saved = await savePayrollSettings(props.year, {
      uit: form.uit ?? 0,
      minimum_wage: form.minimum_wage ?? 0,
      essalud_rate: fraction(form.essalud_pct),
      gratification_factor: form.gratification_factor ?? 0,
      insurance_cap: form.insurance_cap ?? 0,
      life_insurance: form.life_insurance ?? 0,
      cts_days: form.cts_days ?? 0,
      vacation_days: form.vacation_days ?? 0
    })
    inherited.value = saved.inherited
    toast.add({ severity: 'success', summary: 'Parámetros guardados', detail: 'Usa "Recalcular" en las planillas en borrador.', life: 5000 })
    emit('changed')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    saving.value = false
  }
}

async function submitFund(fund: FundRow) {
  savingFund.value = fund.id
  try {
    rows.value = toRows(
      await savePensionFund(fund.id, {
        name: fund.name,
        kind: fund.kind,
        payee_name: fund.payee_name,
        contribution_rate: fraction(fund.contribution),
        insurance_rate: fraction(fund.insurance),
        commission_rate: fraction(fund.commission),
        is_active: fund.is_active
      })
    )
    toast.add({ severity: 'success', summary: `${fund.name}: tasas guardadas`, life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    savingFund.value = null
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) load()
  }
)
</script>
