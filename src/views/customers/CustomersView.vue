<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Clientes</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Quien paga (la razón social y el RUC a los que se factura) y sus tiendas. Busca por cualquier dato: RUC o DNI,
        razón social, nombre comercial, subdominio, dominio, número de tienda, o el correo, teléfono o nombre de quien
        la contrató.
      </p>
    </div>

    <div class="relative max-w-2xl">
      <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
      <InputText v-model="query" placeholder="RUC, razón social, tienda, dominio, correo o teléfono…" class="w-full pl-10" autofocus />
    </div>

    <div v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Buscando…</div>
    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
    <div v-else-if="searched && !results.customers.length && !results.stores_without_customer.length" class="text-sm text-gray-500">
      Sin resultados para "{{ searched }}".
    </div>

    <div v-if="results.customers.length" class="space-y-3">
      <div v-for="c in results.customers" :key="c.id" class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <router-link :to="`/customers/${c.id}`" class="min-w-0 group">
            <div class="font-semibold text-gray-900 group-hover:text-primary">{{ c.name }}</div>
            <div class="text-xs text-gray-500 font-mono">{{ c.document_type }} {{ c.document }}</div>
            <div v-if="c.email || c.phone" class="text-xs text-gray-500 mt-0.5">{{ [c.email, c.phone].filter(Boolean).join(' · ') }}</div>
          </router-link>
          <div class="text-right text-xs text-gray-500">
            <div>{{ c.invoice_count }} comprobantes · {{ money(c.billed) }}</div>
            <div v-if="c.last_seen">Último movimiento {{ formatDate(c.last_seen) }}</div>
          </div>
        </div>
        <div v-if="c.stores.length" class="mt-3 flex flex-wrap gap-2">
          <router-link
            v-for="s in c.stores"
            :key="s.tienda_id"
            :to="`/stores/${s.tienda_id}`"
            class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:border-primary"
            :class="s.is_current ? 'border-gray-300 text-gray-800' : 'border-dashed border-gray-200 text-gray-500'"
            :title="s.is_current ? 'Se le factura con este documento' : 'Se le facturó con este documento antes'"
          >
            <i class="pi pi-shop text-xs"></i>
            <span>{{ s.name }}</span>
            <span class="text-xs text-gray-400">{{ s.domain || `${s.slug}.mitienda.pe` }}</span>
            <span v-if="s.plan" class="text-xs" :class="s.active ? 'text-green-700' : 'text-gray-400'">
              {{ s.plan }}{{ s.active ? '' : ' · vencido' }}
            </span>
          </router-link>
        </div>
        <div v-else class="mt-2 text-xs text-gray-400">Sin tienda vinculada (comprobantes emitidos a mano).</div>
      </div>
    </div>

    <div v-if="results.stores_without_customer.length" class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="text-sm font-medium text-gray-800 mb-2">Tiendas que nunca se facturaron</div>
      <div class="flex flex-wrap gap-2">
        <router-link
          v-for="s in results.stores_without_customer"
          :key="s.tienda_id"
          :to="`/stores/${s.tienda_id}`"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-primary"
        >
          <i class="pi pi-shop text-xs"></i>{{ s.name }}
          <span class="text-xs text-gray-400">{{ s.domain || `${s.slug}.mitienda.pe` }}</span>
          <span v-if="s.contact" class="text-xs text-gray-500">· {{ s.contact }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import { searchCustomers, type PlatformCustomer, type CustomerStore } from '@/api/customers.api'

const route = useRoute()
const router = useRouter()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searched = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const results = reactive<{ customers: PlatformCustomer[]; stores_without_customer: CustomerStore[] }>({ customers: [], stores_without_customer: [] })

function money(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatDate(value: string): string {
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

let timer: ReturnType<typeof setTimeout> | null = null
let sequence = 0
async function run(q: string) {
  const current = ++sequence
  if (q.trim().length < 2) {
    results.customers = []
    results.stores_without_customer = []
    searched.value = ''
    return
  }
  loading.value = true
  error.value = null
  try {
    const data = await searchCustomers(q.trim())
    if (current !== sequence) return
    results.customers = data.customers
    results.stores_without_customer = data.stores_without_customer
    searched.value = q.trim()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo buscar'
  } finally {
    if (current === sequence) loading.value = false
  }
}

watch(query, (q) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    router.replace({ query: q.trim() ? { q: q.trim() } : {} })
    run(q)
  }, 350)
}, { immediate: true })
</script>
