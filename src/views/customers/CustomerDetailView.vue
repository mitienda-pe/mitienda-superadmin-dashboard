<template>
  <div class="space-y-6">
    <router-link to="/customers" class="text-sm text-gray-500 hover:text-primary"><i class="pi pi-arrow-left text-xs mr-1"></i>Clientes</router-link>

    <div v-if="loading" class="text-gray-400"><i class="pi pi-spin pi-spinner"></i></div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{{ error }}</div>

    <template v-else-if="customer">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ customer.name }}</h1>
          <div class="text-sm text-gray-500 font-mono">{{ customer.document_type }} {{ customer.document }}</div>
          <div v-if="customer.email || customer.phone" class="text-sm text-gray-500 mt-1">{{ [customer.email, customer.phone].filter(Boolean).join(' · ') }}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-500">Facturado (vigente)</div>
          <div class="text-xl font-semibold text-gray-900 tabular-nums">{{ money(customer.totals.billed) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-500">Por cobrar o confirmar</div>
          <div class="text-xl font-semibold tabular-nums" :class="customer.totals.open > 0 ? 'text-amber-700' : 'text-gray-900'">{{ money(customer.totals.open) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-500">Tiendas</div>
          <div class="text-xl font-semibold text-gray-900">{{ customer.stores.length }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-500">Comprobantes anulados</div>
          <div class="text-xl font-semibold text-gray-900">{{ customer.totals.voided }}</div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <h2 class="font-semibold text-gray-900 mb-3">Tiendas</h2>
        <div v-if="!customer.stores.length" class="text-sm text-gray-500">Sin tienda vinculada: sus comprobantes se emitieron a mano.</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="py-2 text-left">Tienda</th>
              <th class="py-2 text-left">Contratante</th>
              <th class="py-2 text-left">Plan</th>
              <th class="py-2 text-left">Vence</th>
              <th class="py-2 text-left">Se le factura</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in customer.stores" :key="s.tienda_id" class="border-b border-gray-100 last:border-0">
              <td class="py-2">
                <router-link :to="`/stores/${s.tienda_id}`" class="font-medium text-gray-800 hover:text-primary">{{ s.name }}</router-link>
                <div class="text-xs text-gray-400">{{ s.domain || `${s.slug}.mitienda.pe` }} · #{{ s.tienda_id }}</div>
              </td>
              <td class="py-2 text-gray-700">
                {{ s.contact || '—' }}
                <div class="text-xs text-gray-400">{{ [s.contact_email, s.contact_phone].filter(Boolean).join(' · ') }}</div>
              </td>
              <td class="py-2 text-gray-700">{{ s.plan || '—' }}<span v-if="s.price" class="text-xs text-gray-400"> · {{ money(s.price) }}</span></td>
              <td class="py-2" :class="s.active ? 'text-gray-700' : 'text-red-600'">{{ s.expires_at ? formatDate(s.expires_at) : '—' }}</td>
              <td class="py-2 text-xs" :class="s.is_current ? 'text-green-700' : 'text-gray-400'">
                {{ s.is_current ? 'Con este documento' : 'Antes; hoy con otro' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <h2 class="font-semibold text-gray-900 mb-3">Comprobantes <span class="text-xs font-normal text-gray-400">(los últimos 100)</span></h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="py-2 text-left">Número</th>
              <th class="py-2 text-left">Fecha</th>
              <th class="py-2 text-left">Concepto</th>
              <th class="py-2 text-left">Tienda</th>
              <th class="py-2 text-right">Total</th>
              <th class="py-2 text-left pl-4">Cobro</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in customer.invoices" :key="inv.id" class="border-b border-gray-100 last:border-0" :class="{ 'opacity-50': inv.voided }">
              <td class="py-1.5 font-mono text-gray-800">{{ inv.number }}<span v-if="inv.document_type === 3" class="text-xs text-gray-500"> (NC)</span></td>
              <td class="py-1.5 text-gray-600">{{ formatDate(inv.issue_date) }}</td>
              <td class="py-1.5 text-gray-600 max-w-xs truncate" :title="inv.concept ?? ''">{{ inv.concept }}</td>
              <td class="py-1.5 text-gray-600">{{ storeName(inv.tienda_id) }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ inv.currency === 'USD' ? 'US$' : 'S/' }} {{ number(inv.total) }}</td>
              <td class="py-1.5 pl-4 text-xs">
                <span v-if="inv.voided" class="text-red-600">Anulado</span>
                <span v-else :class="PAYMENT[inv.payment_status ?? -1]?.cls ?? 'text-gray-400'">{{ PAYMENT[inv.payment_status ?? -1]?.label ?? '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomer, type CustomerDetail } from '@/api/customers.api'

const PAYMENT: Record<number, { label: string; cls: string }> = {
  0: { label: 'Pendiente', cls: 'text-amber-700' },
  1: { label: 'Cobrado', cls: 'text-green-700' },
  2: { label: 'Incobrable', cls: 'text-red-600' },
  3: { label: 'Sin cargo', cls: 'text-gray-500' },
  4: { label: 'Por confirmar', cls: 'text-gray-600' },
  5: { label: 'Cobro parcial', cls: 'text-amber-700' }
}

const route = useRoute()
const customer = ref<CustomerDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function money(value: number): string {
  return `S/ ${number(value)}`
}
function number(value: number): string {
  return value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function storeName(id: number | null): string {
  if (!id) return '—'
  return customer.value?.stores.find(s => s.tienda_id === id)?.name ?? `#${id}`
}

watch(() => route.params.id, async (id) => {
  if (!id) return
  loading.value = true
  error.value = null
  try {
    customer.value = await getCustomer(Number(id))
  } catch (e: any) {
    error.value = e?.response?.data?.messages?.error || e?.response?.data?.message || 'No se pudo cargar el cliente'
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>
