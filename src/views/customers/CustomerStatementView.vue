<template>
  <div class="min-h-screen bg-gray-100 print:bg-white">
    <!-- Controles: no salen al imprimir -->
    <div class="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <router-link :to="`/customers/${id}`" class="text-sm text-gray-500 hover:text-primary"><i class="pi pi-arrow-left text-xs mr-1"></i>Ficha del cliente</router-link>
        <div class="flex-1"></div>
        <label class="text-sm text-gray-600">Desde</label>
        <InputText v-model="from" type="date" class="w-40" @change="load" />
        <label class="text-sm text-gray-600">hasta</label>
        <InputText v-model="to" type="date" class="w-40" @change="load" />
        <Button label="Imprimir o guardar PDF" icon="pi pi-print" size="small" :disabled="!statement" @click="print" />
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
      <div v-if="loading" class="text-gray-400"><i class="pi pi-spin pi-spinner"></i></div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{{ error }}</div>

      <div v-else-if="statement" class="bg-white rounded-xl border border-gray-200 p-8 print:border-0 print:rounded-none print:p-0 text-sm text-gray-800">
        <!-- Encabezado -->
        <div class="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-4">
          <div>
            <div class="text-lg font-bold text-gray-900">Estado de cuenta</div>
            <div class="text-gray-500">Del {{ formatDate(statement.from) }} al {{ formatDate(statement.to) }}</div>
          </div>
          <div class="text-right text-xs text-gray-500">
            <div class="font-semibold text-gray-800">{{ COMPANY.name }}</div>
            <div>RUC {{ COMPANY.ruc }}</div>
            <div>Emitido el {{ formatDate(today) }}</div>
          </div>
        </div>

        <div class="py-4 border-b border-gray-200">
          <div class="text-xs uppercase tracking-wide text-gray-400">Cliente</div>
          <div class="font-semibold text-gray-900">{{ statement.customer.name }}</div>
          <div class="text-gray-600">{{ statement.customer.document_type ?? 'Doc.' }} {{ statement.customer.document }}</div>
          <div v-if="statement.customer.address" class="text-gray-500 text-xs">{{ statement.customer.address }}</div>
        </div>

        <p v-if="statement.currencies.length === 0" class="py-8 text-center text-gray-500">Sin movimientos ni saldo en este periodo.</p>

        <!-- Una sección por moneda -->
        <section v-for="c in statement.currencies" :key="c.currency" class="pt-6 break-inside-avoid-page">
          <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <h2 class="font-semibold text-gray-900">{{ c.currency === 'USD' ? 'En dólares' : 'En soles' }}</h2>
            <div class="text-gray-600">
              Saldo por cobrar al {{ formatDate(statement.to) }}:
              <span class="font-bold tabular-nums" :class="c.closing > 0.004 ? 'text-orange-700' : 'text-green-700'">{{ money(c.closing, c.currency) }}</span>
            </div>
          </div>

          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 border-b border-gray-300">
                <th class="py-1.5 text-left w-24">Fecha</th>
                <th class="py-1.5 text-left w-28">Comprobante</th>
                <th class="py-1.5 text-left">Detalle</th>
                <th class="py-1.5 text-right w-28">Cargo</th>
                <th class="py-1.5 text-right w-28">Abono</th>
                <th class="py-1.5 text-right w-28">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-100 text-gray-600">
                <td class="py-1.5">{{ formatDate(statement.from) }}</td>
                <td></td>
                <td class="py-1.5 italic">Saldo inicial</td>
                <td></td>
                <td></td>
                <td class="py-1.5 text-right tabular-nums font-medium">{{ plain(c.opening) }}</td>
              </tr>
              <tr v-for="(r, i) in c.rows" :key="i" class="border-b border-gray-100 align-top">
                <td class="py-1.5 whitespace-nowrap">{{ formatDate(r.date) }}</td>
                <td class="py-1.5 font-mono text-xs whitespace-nowrap">{{ r.document }}</td>
                <td class="py-1.5 text-gray-600">
                  <span v-if="r.kind === 'nota_credito'" class="text-gray-800">{{ r.description }}</span>
                  <span v-else-if="r.debit > 0">{{ r.description || (r.kind === 'boleta' ? 'Boleta' : 'Factura') }}</span>
                  <span v-else>{{ r.description }}</span>
                </td>
                <td class="py-1.5 text-right tabular-nums">{{ r.debit > 0 ? plain(r.debit) : '' }}</td>
                <td class="py-1.5 text-right tabular-nums">{{ r.credit > 0 ? plain(r.credit) : '' }}</td>
                <td class="py-1.5 text-right tabular-nums">{{ plain(r.balance) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-gray-300 font-semibold">
                <td colspan="3" class="py-1.5">Totales del periodo</td>
                <td class="py-1.5 text-right tabular-nums">{{ plain(c.debit) }}</td>
                <td class="py-1.5 text-right tabular-nums">{{ plain(c.credit) }}</td>
                <td class="py-1.5 text-right tabular-nums">{{ plain(c.closing) }}</td>
              </tr>
            </tfoot>
          </table>

          <div v-if="c.open.length > 0" class="mt-5 break-inside-avoid">
            <h3 class="font-semibold text-gray-900 mb-1">Comprobantes por cobrar</h3>
            <table class="w-full">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-300">
                  <th class="py-1.5 text-left w-28">Comprobante</th>
                  <th class="py-1.5 text-left w-24">Emisión</th>
                  <th class="py-1.5 text-left w-24">Vencimiento</th>
                  <th class="py-1.5 text-left">Concepto</th>
                  <th class="py-1.5 text-right w-24">Total</th>
                  <th class="py-1.5 text-right w-24">Saldo</th>
                  <th class="py-1.5 text-right w-20">Días vencido</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in c.open" :key="o.document" class="border-b border-gray-100 align-top">
                  <td class="py-1.5 font-mono text-xs">{{ o.document }}</td>
                  <td class="py-1.5">{{ formatDate(o.issue_date) }}</td>
                  <td class="py-1.5">{{ formatDate(o.due_date) }}</td>
                  <td class="py-1.5 text-gray-600">{{ o.concept }}</td>
                  <td class="py-1.5 text-right tabular-nums">{{ plain(o.total) }}</td>
                  <td class="py-1.5 text-right tabular-nums font-medium">{{ plain(o.balance) }}</td>
                  <td class="py-1.5 text-right tabular-nums" :class="o.days_overdue > 30 ? 'text-red-600' : 'text-gray-600'">{{ o.days_overdue || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p class="pt-8 text-xs text-gray-400">
          Importes con IGV. Los abonos incluyen las detracciones y retenciones aplicadas a cada comprobante. Si encuentra
          alguna diferencia, escríbanos con el detalle de su pago.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { getCustomerStatement, type CustomerStatement } from '@/api/customers.api'

const COMPANY = { name: 'TIENDAS VIRTUALES LATINOAMERICANA S.A.C.', ruc: '20603317204' }

const route = useRoute()
const id = computed(() => Number(route.params.id))

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const today = iso(new Date())
const from = ref(typeof route.query.from === 'string' ? route.query.from : `${new Date().getFullYear()}-01-01`)
const to = ref(typeof route.query.to === 'string' ? route.query.to : today)

const statement = ref<CustomerStatement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function plain(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function money(amount: number, currency: string): string {
  return `${currency === 'USD' ? 'US$' : 'S/'} ${plain(amount)}`
}

async function load() {
  if (!from.value || !to.value) return
  loading.value = true
  error.value = null
  try {
    statement.value = await getCustomerStatement(id.value, from.value, to.value)
    document.title = `Estado de cuenta · ${statement.value.customer.name}`
  } catch (e: any) {
    error.value = e?.response?.data?.messages?.error ?? e?.response?.data?.message ?? 'No se pudo cargar el estado de cuenta'
  } finally {
    loading.value = false
  }
}

function print() {
  window.print()
}

onMounted(load)
</script>
