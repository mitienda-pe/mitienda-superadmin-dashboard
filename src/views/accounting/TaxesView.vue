<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Impuestos</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          La liquidación del mes calculada con lo que ya está en el sistema: ventas del libro de comprobantes, compras por
          el mes en que se anotaron en el SIRE, retenciones que nos hicieron y la planilla. Es un control: lo que manda es lo
          declarado en el PDT 621 y el PLAME.
        </p>
      </div>
      <InputText v-model="period" type="month" class="w-44" @change="load" />
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="settlement" class="grid grid-cols-1 xl:grid-cols-3 gap-4" :class="{ 'opacity-60': loading }">
      <!-- IGV -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 xl:col-span-2">
        <h2 class="font-semibold text-gray-900 mb-3">IGV · PDT 621</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="py-1.5 text-left font-medium"></th>
              <th class="py-1.5 text-right font-medium">Base</th>
              <th class="py-1.5 text-right font-medium">IGV</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr>
              <td class="py-1.5 text-gray-700">Ventas gravadas <span class="text-xs text-gray-400">({{ s.igv.sales_count }} comprobantes)</span></td>
              <td class="py-1.5 text-right tabular-nums">{{ money(s.igv.sales_base) }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ whole(s.igv.sales_tax) }}</td>
            </tr>
            <tr>
              <td class="py-1.5 text-gray-700">Exportaciones (sin IGV) <span class="text-xs text-gray-400">({{ s.igv.exports_count }})</span></td>
              <td class="py-1.5 text-right tabular-nums">{{ money(s.igv.exports_base) }}</td>
              <td class="py-1.5 text-right text-gray-300">—</td>
            </tr>
            <tr>
              <td class="py-1.5 text-gray-700">
                (−) Compras anotadas en el SIRE este mes <span class="text-xs text-gray-400">({{ s.igv.purchases_count }})</span>
                <div v-if="s.igv.purchases_count === 0" class="text-xs text-amber-700">Sin compras: ¿falta importar el SIRE de compras de este mes en Gastos?</div>
              </td>
              <td class="py-1.5 text-right tabular-nums">{{ money(s.igv.purchases_base) }}</td>
              <td class="py-1.5 text-right tabular-nums">−{{ whole(s.igv.purchases_tax) }}</td>
            </tr>
            <tr class="font-medium">
              <td class="py-1.5">IGV del mes</td><td></td>
              <td class="py-1.5 text-right tabular-nums">{{ whole(s.igv.month_tax) }}</td>
            </tr>
            <tr v-if="s.igv.previous_igv_credit">
              <td class="py-1.5 text-gray-700">(−) Saldo a favor del mes anterior</td><td></td>
              <td class="py-1.5 text-right tabular-nums">−{{ whole(s.igv.previous_igv_credit) }}</td>
            </tr>
            <tr>
              <td class="py-1.5 text-gray-700">
                (−) Retenciones
                <span class="text-xs text-gray-400">del mes{{ s.igv.previous_retention_credit ? ` y ${whole(s.igv.previous_retention_credit)} no aplicadas antes` : '' }}</span>
              </td><td></td>
              <td class="py-1.5 text-right tabular-nums">−{{ whole(s.igv.retentions + s.igv.previous_retention_credit) }}</td>
            </tr>
            <tr class="font-semibold text-gray-900 border-t-2 border-gray-200">
              <td class="py-2">IGV a pagar</td><td></td>
              <td class="py-2 text-right tabular-nums">{{ whole(s.igv.to_pay) }}</td>
            </tr>
            <tr v-if="s.igv.next_igv_credit || s.igv.next_retention_credit" class="text-xs text-gray-500">
              <td class="py-1" colspan="3">
                Pasa al mes siguiente: saldo a favor {{ whole(s.igv.next_igv_credit) }} · retenciones no aplicadas {{ whole(s.igv.next_retention_credit) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Renta y planilla -->
      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="font-semibold text-gray-900 mb-3">Renta MYPE (RMT)</h2>
          <div class="text-sm space-y-1">
            <div class="flex justify-between"><span class="text-gray-500">Ingresos netos del mes</span><span class="tabular-nums">{{ money(s.renta.income) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Tasa</span><span>{{ (s.renta.rate * 100).toFixed(1) }} %</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Pago a cuenta</span><span class="tabular-nums">{{ whole(s.renta.tax) }}</span></div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-gray-500">(−) Saldo a favor de renta</span>
              <InputNumber v-model="rentaCredit" :min="0" :useGrouping="false" inputClass="w-24 text-right text-sm" @update:modelValue="load" />
            </div>
            <div class="flex justify-between font-semibold border-t border-gray-200 pt-1"><span>Renta a pagar</span><span class="tabular-nums">{{ whole(s.renta.to_pay) }}</span></div>
            <p class="text-xs text-gray-400">
              Ingresos del año: {{ money(s.renta.income_year_to_date) }} (el 1.5 % aplica sobre 300 UIT: {{ money(s.renta.limit_300_uit) }}).
            </p>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="font-semibold text-gray-900 mb-3">Planilla · PLAME</h2>
          <div class="text-sm space-y-1">
            <div class="flex justify-between"><span class="text-gray-500">EsSalud</span><span class="tabular-nums">{{ whole(s.payroll.essalud) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Renta de quinta retenida</span><span class="tabular-nums">{{ whole(s.payroll.fifth) }}</span></div>
            <p v-if="!s.payroll.closed" class="text-xs text-amber-700">La planilla del mes no está cerrada.</p>
          </div>
        </div>
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-4 flex justify-between text-sm font-semibold">
          <span>Total del mes</span><span class="tabular-nums">{{ whole(s.total) }}</span>
        </div>
      </div>
    </div>

    <!-- Retenciones -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 class="font-semibold text-gray-900">Retenciones que nos hicieron</h2>
          <p class="text-xs text-gray-500">
            El cliente agente de retención paga el 97 % y entrega el 3 % a SUNAT con un comprobante de retención. Al registrarlo,
            ese 3 % cierra el saldo de cada factura y se descuenta del IGV del mes.
          </p>
        </div>
        <Button v-if="authStore.canWrite('accounting')" label="Registrar retención" icon="pi pi-plus" size="small" @click="openRetention" />
      </div>
      <div v-if="!retentions.length" class="text-sm text-gray-500">Sin retenciones en el período.</div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="r in retentions" :key="r.id" class="py-2 text-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="font-mono font-medium text-gray-800">{{ r.document_number }}</span>
              · {{ formatDate(r.issue_date) }} · {{ r.agent_name }} <span class="text-xs text-gray-400">{{ r.agent_document }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="tabular-nums font-medium">{{ money(r.total_pen) }}</span>
              <Button
                v-if="authStore.canWrite('accounting')"
                v-tooltip.left="'Quitar (también quita los abonos de las facturas)'"
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="secondary"
                @click="removeRetention(r)"
              />
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-0.5">
            <span v-for="(i, k) in r.items" :key="k">
              {{ k ? ' · ' : '' }}{{ i.invoice_number }} {{ i.currency === 'USD' ? `US$ ${i.retained.toFixed(2)} (${money(i.retained_pen)})` : money(i.retained) }}
            </span>
          </div>
          <div v-if="r.note" class="text-xs text-gray-400">{{ r.note }}</div>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="retentionVisible" header="Registrar comprobante de retención" modal :style="{ width: '36rem' }">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Comprobante *</label>
            <InputText v-model="form.document_number" placeholder="R001-9152" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Fecha de emisión *</label>
            <InputText v-model="form.issue_date" type="date" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Facturas que cubre *</label>
          <p class="text-xs text-gray-500 mb-1">Una por línea: número y, si no es el 3 % exacto, lo retenido. Ej.: <span class="font-mono">F002-6542 8.97</span></p>
          <Textarea v-model="form.lines" rows="5" class="w-full font-mono text-sm" placeholder="F002-6542&#10;FF01-599 3.88" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nota</label>
          <InputText v-model="form.note" maxlength="255" class="w-full" />
        </div>
        <p class="text-xs text-gray-500">El agente (cliente) se toma de las facturas. En facturas en dólares, lo retenido va en dólares y se convierte al TC del día.</p>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="retentionVisible = false" />
        <Button label="Registrar" icon="pi pi-check" :loading="saving" @click="saveRetention" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { useAuthStore } from '@/stores/auth.store'
import {
  getTaxSettlement, getTaxRetentions, createTaxRetention, deleteTaxRetention, accountingErrorMessage,
  type TaxSettlement, type TaxRetention
} from '@/api/accounting.api'

const toast = useToast()
const authStore = useAuthStore()

// Por defecto el mes anterior: es el que se declara.
const lastMonth = new Date()
lastMonth.setDate(1)
lastMonth.setMonth(lastMonth.getMonth() - 1)
const period = ref(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`)
const rentaCredit = ref<number | null>(null)
const settlement = ref<TaxSettlement | null>(null)
const retentions = ref<TaxRetention[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const s = computed(() => settlement.value as TaxSettlement)

function money(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function whole(value: number): string {
  return `S/ ${Math.round(value).toLocaleString('es-PE')}`
}
function formatDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

let seq = 0
async function load() {
  if (!/^\d{4}-\d{2}$/.test(period.value)) return
  const mine = ++seq
  loading.value = true
  error.value = null
  try {
    const [calc, list] = await Promise.all([getTaxSettlement(period.value, rentaCredit.value ?? 0), getTaxRetentions(period.value)])
    if (mine !== seq) return
    settlement.value = calc
    retentions.value = list
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    if (mine === seq) loading.value = false
  }
}

// --- Retenciones ---
const retentionVisible = ref(false)
const saving = ref(false)
const form = reactive({ document_number: '', issue_date: '', lines: '', note: '' })

function openRetention() {
  Object.assign(form, { document_number: '', issue_date: `${period.value}-01`, lines: '', note: '' })
  retentionVisible.value = true
}

async function saveRetention() {
  const items = form.lines.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const [invoice, amount] = l.split(/\s+/)
    return { invoice_number: invoice.toUpperCase(), retained: amount ? Number(amount.replace(',', '.')) : null }
  })
  saving.value = true
  try {
    const res = await createTaxRetention({
      document_number: form.document_number.trim().toUpperCase(),
      issue_date: form.issue_date,
      note: form.note.trim() || undefined,
      items
    })
    toast.add({ severity: 'success', summary: res.message, life: 4000 })
    retentionVisible.value = false
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    saving.value = false
  }
}

async function removeRetention(r: TaxRetention) {
  try {
    const res = await deleteTaxRetention(r.id)
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo quitar', detail: accountingErrorMessage(e), life: 6000 })
  }
}

onMounted(load)
</script>
