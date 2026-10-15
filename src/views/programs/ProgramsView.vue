<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ program?.name ?? 'Programas' }}</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Tiendas inscritas en el programa y su avance. Mes 1 gratis por inscribirse; mes 2 al configurar la tienda
          (productos, forma de pago y envío o entrega); mes 3 al conectar un dominio propio. Los meses cuentan desde la
          inscripción.
          <template v-if="program?.enroll_until">Inscripciones hasta el {{ formatDate(program.enroll_until) }}.</template>
        </p>
      </div>
      <Dropdown
        v-if="programs.length > 1"
        v-model="programId"
        :options="programs"
        optionLabel="name"
        optionValue="id"
        class="w-72"
        @change="loadStores"
      />
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="card in summary" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="text-xs text-gray-500">{{ card.label }}</div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ card.value }}</div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable :value="stores" :loading="loading" size="small" sortField="enrolled_at" :sortOrder="-1" class="text-sm">
          <template #empty>
            <div class="text-center text-gray-500 py-8">Todavía no hay tiendas inscritas.</div>
          </template>
          <Column field="name" header="Tienda" sortable style="min-width: 220px">
            <template #body="{ data: row }">
              <div class="font-medium text-gray-900">{{ row.name }}</div>
              <a :href="storeUrl(row)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">
                {{ row.domain || `${row.subdomain}.mitienda.pe` }}
              </a>
            </template>
          </Column>
          <Column header="Contacto" style="min-width: 160px">
            <template #body="{ data: row }">
              <div>{{ row.contact || '—' }}</div>
              <div class="text-xs text-gray-500">{{ row.phone || '' }}</div>
            </template>
          </Column>
          <Column field="enrolled_at" header="Inscrita" sortable>
            <template #body="{ data: row }">
              <div>{{ formatDate(row.enrolled_at) }}</div>
              <div class="text-xs text-gray-500">{{ SOURCE[row.source] }}</div>
            </template>
          </Column>
          <Column field="status" header="Estado" sortable>
            <template #body="{ data: row }">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="STATUS_CLASS[row.status]">{{ STATUS[row.status] }}</span>
              <div class="text-xs text-gray-500 mt-1">
                {{ row.status === 'pagado' ? 'Plan pagado' : `Prueba hasta ${formatDate(row.covered_until)}` }}
              </div>
            </template>
          </Column>
          <Column field="months_earned" header="Meses ganados" sortable class="text-center">
            <template #body="{ data: row }">
              <span class="tabular-nums">{{ row.months_earned }} / 3</span>
              <div v-if="row.month" class="text-xs text-gray-500">va en el mes {{ row.month }}</div>
            </template>
          </Column>
          <Column header="Configuración" style="min-width: 200px">
            <template #body="{ data: row }">
              <div class="flex flex-wrap gap-1">
                <span v-for="item in checks(row)" :key="item.label" class="px-1.5 py-0.5 rounded text-xs"
                      :class="item.done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                  <i class="pi text-[10px] mr-0.5" :class="item.done ? 'pi-check' : 'pi-minus'"></i>{{ item.label }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="products" header="Productos" sortable class="text-right">
            <template #body="{ data: row }"><span class="tabular-nums">{{ row.products }}</span></template>
          </Column>
          <Column header="Descuento anual">
            <template #body="{ data: row }">
              <span class="text-xs" :class="row.discount_used ? 'text-gray-700' : 'text-gray-400'">
                {{ row.discount_used ? 'Usado' : 'Disponible' }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { getPrograms, getProgramStores, type Program, type ProgramStore } from '@/api/programs.api'

const STATUS: Record<string, string> = { prueba: 'En prueba', vencida: 'Vencida', pagado: 'Pagando' }
const STATUS_CLASS: Record<string, string> = {
  prueba: 'bg-teal-50 text-teal-700',
  vencida: 'bg-gray-100 text-gray-600',
  pagado: 'bg-green-50 text-green-700'
}
const SOURCE: Record<string, string> = {
  registro: 'Registro con enlace',
  backoffice: 'Activó el código',
  superadmin: 'Inscrita por MiTienda'
}

const programs = ref<Program[]>([])
const programId = ref<number | null>(null)
const program = computed(() => programs.value.find(p => p.id === programId.value) ?? null)
const stores = ref<ProgramStore[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const summary = computed(() => [
  { label: 'Inscritas', value: stores.value.length },
  { label: 'Configuradas', value: stores.value.filter(s => s.signals.configured).length },
  { label: 'Con dominio propio', value: stores.value.filter(s => s.signals.domain).length },
  { label: 'Pagando', value: stores.value.filter(s => s.status === 'pagado').length }
])

function checks(row: ProgramStore) {
  return [
    { label: 'Productos', done: row.signals.products },
    { label: 'Pago', done: row.signals.payment },
    { label: 'Envío', done: row.signals.shipping },
    { label: 'Dominio', done: row.signals.domain }
  ]
}

function storeUrl(row: ProgramStore): string {
  return row.domain ? `https://${row.domain}` : `https://${row.subdomain}.mitienda.pe`
}

function formatDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function message(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } } }
  return err.response?.data?.message || 'No se pudo cargar el programa'
}

async function loadStores() {
  if (!programId.value) return
  loading.value = true
  error.value = null
  try {
    stores.value = (await getProgramStores(programId.value)).data.stores
  } catch (e) {
    error.value = message(e)
  } finally {
    loading.value = false
  }
}

async function load() {
  error.value = null
  try {
    programs.value = (await getPrograms()).data
    programId.value ??= programs.value[0]?.id ?? null
    await loadStores()
  } catch (e) {
    error.value = message(e)
  }
}

onMounted(load)
</script>
