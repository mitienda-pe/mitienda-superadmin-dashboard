<template>
  <div class="rounded-lg border border-gray-200 p-3 space-y-2">
    <div class="text-sm font-medium text-gray-700">{{ title }}</div>
    <div v-if="loading" class="text-sm text-gray-400">Buscando cuotas…</div>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="candidates.length === 0" class="text-sm text-gray-400">
      No hay cuotas de préstamos de banco que venzan cerca de esta fecha. Revisa que el cronograma esté cargado en Préstamos.
    </p>
    <template v-else>
      <label v-for="c in candidates" :key="c.id" class="flex items-start gap-2 text-sm cursor-pointer">
        <RadioButton v-model="picked" :value="c.id" class="mt-0.5" />
        <span>
          <span class="font-medium text-gray-800">{{ c.loan_name }}</span>
          · cuota {{ c.number }} · vence {{ formatDate(c.due_date) }}
          · <span class="tabular-nums">{{ money(c.total) }}</span>
          <span v-if="c.open < c.total - 0.004" class="text-xs text-gray-500"> (falta {{ money(c.open) }})</span>
          <span v-if="c.exact" class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-700">calza</span>
          <span v-if="c.paid_at" class="ml-1 text-xs text-amber-700">figura pagada el {{ formatDate(c.paid_at) }} sin débito enlazado</span>
        </span>
      </label>
      <p class="text-xs text-gray-500">
        La cuota queda pagada con la fecha del movimiento y deja de esperarse en el flujo de caja. Deshacer la conciliación la
        vuelve a dejar pendiente.
      </p>
      <div class="flex justify-end">
        <Button label="Enlazar con la cuota" size="small" :disabled="!picked" :loading="saving" @click="submit" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import { useFormatters } from '@/composables/useFormatters'
import { getLoanInstallmentCandidates, reconcileBankMovement, accountingErrorMessage, type LoanInstallmentCandidate } from '@/api/accounting.api'
import type { BankMovement } from '@/types/accounting.types'

const props = defineProps<{ movementId: number; currency: string; title: string }>()
const emit = defineEmits<{ linked: [result: { message: string; data: BankMovement; undo?: string }] }>()

const { formatDate } = useFormatters()

const candidates = ref<LoanInstallmentCandidate[]>([])
const picked = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

function money(value: number) {
  return `${props.currency === 'USD' ? 'US$' : 'S/'} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

onMounted(async () => {
  loading.value = true
  try {
    candidates.value = await getLoanInstallmentCandidates(props.movementId)
    // Vienen ordenadas: la primera que calza y no figura pagada es la más cercana a la fecha.
    picked.value = candidates.value.find((c) => c.exact && !c.paid_at)?.id ?? null
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (!picked.value) return
  saving.value = true
  error.value = null
  try {
    emit('linked', await reconcileBankMovement(props.movementId, { kind: 'cuota', installment_id: picked.value }))
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>
