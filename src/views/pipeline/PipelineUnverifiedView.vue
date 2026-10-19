<template>
  <div class="space-y-6">
    <PipelineSubNav />

    <div class="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
      <i class="pi pi-info-circle text-primary mr-1.5"></i>
      Personas que pidieron el código de verificación y nunca lo ingresaron. La cuenta se crea
      recién al verificar, así que no aparecen en Leads ni en Tiendas.
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="bg-white rounded-xl border border-gray-200 p-4"
        :class="{ 'cursor-pointer hover:shadow-md transition-shadow': card.reason, 'ring-2 ring-primary': card.reason && reasonFilter === card.reason }"
        @click="card.reason && toggleReason(card.reason)"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600">
            <i :class="card.icon" class="text-sm"></i>
          </span>
          <span class="text-2xl font-bold text-gray-900">{{ card.value }}</span>
        </div>
        <p class="text-xs text-gray-500 font-medium">{{ card.label }}</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar nombre, correo o teléfono..." class="w-full" />
          </span>
        </div>

        <Dropdown
          v-model="rangeDays"
          :options="rangeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-44"
          @change="load"
        />

        <MultiSelect
          v-model="sourceFilter"
          :options="sourceOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Origen"
          class="w-56"
          :maxSelectedLabels="1"
          selectedItemsLabel="{0} orígenes"
          @change="load"
        />

        <label class="flex items-center gap-2 text-sm text-gray-600">
          <InputSwitch v-model="showWithAccount" />
          Con cuenta
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <InputSwitch v-model="showSuspicious" />
          Sospechosos
        </label>

        <Button icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading" @click="load" v-tooltip="'Actualizar'" />
      </div>
    </div>

    <!-- Resultados -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center">
        <ProgressSpinner style="width: 40px; height: 40px" />
        <p class="text-sm text-gray-500 mt-3">Cargando registros...</p>
      </div>

      <div v-else-if="error" class="p-12 text-center">
        <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3"></i>
        <p class="text-sm text-red-600">{{ error }}</p>
        <Button label="Reintentar" icon="pi pi-refresh" size="small" class="mt-3" @click="load" />
      </div>

      <div v-else-if="visibleRows.length === 0" class="p-12 text-center">
        <i class="pi pi-inbox text-3xl text-gray-300 mb-3"></i>
        <p class="text-sm text-gray-500">No hay registros sin verificar con estos filtros</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Persona</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Origen</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Qué pasó</th>
              <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Envíos</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Último intento</th>
              <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Contactar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in visibleRows" :key="row.channel + row.recipient" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ row.name || 'Sin nombre' }}
                    <span v-if="row.has_account" class="ml-1 text-xs font-normal text-gray-500">(ya tiene cuenta)</span>
                    <span v-if="row.suspicious" class="ml-1 text-xs font-normal text-orange-500">(sospechoso)</span>
                  </p>
                  <p v-if="row.email" class="text-xs text-gray-500 truncate">{{ row.email }}</p>
                  <p v-if="row.typo_suggestion" class="text-xs text-orange-600">
                    ¿Quiso escribir {{ row.typo_suggestion }}?
                  </p>
                  <p v-if="row.phone" class="text-xs text-gray-500">{{ row.phone }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-xs text-gray-600">{{ sourceLabel(row) }}</td>
              <td class="px-4 py-3 text-xs text-gray-600">
                {{ UNVERIFIED_REASON_LABELS[row.reason] }}
                <span v-if="row.channel === 'whatsapp'" class="block text-gray-400">por WhatsApp</span>
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-700">{{ row.sessions }}</td>
              <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{{ formatDateTime(row.last_at) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <a
                    v-if="whatsappLink(row)"
                    :href="whatsappLink(row)!"
                    target="_blank"
                    rel="noopener"
                    class="p-button p-button-text p-button-sm p-button-rounded"
                    v-tooltip="'Escribir por WhatsApp'"
                  >
                    <i class="pi pi-whatsapp text-green-600"></i>
                  </a>
                  <a
                    v-if="row.email || row.typo_suggestion"
                    :href="`mailto:${row.typo_suggestion || row.email}`"
                    class="p-button p-button-text p-button-sm p-button-rounded"
                    v-tooltip="row.typo_suggestion ? 'Escribir al correo corregido' : 'Escribir por correo'"
                  >
                    <i class="pi pi-envelope text-primary"></i>
                  </a>
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    v-tooltip="'Copiar datos'"
                    @click="copyContact(row)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="visibleRows.length" class="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
        {{ visibleRows.length }} de {{ rows.length }} registros
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import PipelineSubNav from '@/components/pipeline/PipelineSubNav.vue'
import { getUnverifiedSignups } from '@/api/pipeline.api'
import {
  UNVERIFIED_REASON_LABELS,
  UNVERIFIED_SOURCE_LABELS,
  type UnverifiedSignup,
  type UnverifiedSignupReason,
  type UnverifiedSignupSummary,
} from '@/types/pipeline.types'

const toast = useToast()

const rows = ref<UnverifiedSignup[]>([])
const summary = ref<UnverifiedSignupSummary | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const search = ref('')
const rangeDays = ref(30)
const sourceFilter = ref<string[]>([])
const reasonFilter = ref<UnverifiedSignupReason | null>(null)
const showWithAccount = ref(false)
const showSuspicious = ref(false)

const rangeOptions = [
  { label: 'Últimos 7 días', value: 7 },
  { label: 'Últimos 30 días', value: 30 },
  { label: 'Últimos 90 días', value: 90 },
  { label: 'Últimos 12 meses', value: 365 },
]

const sourceOptions = Object.entries(UNVERIFIED_SOURCE_LABELS).map(([value, label]) => ({ value, label }))

const summaryCards = computed(() => {
  const s = summary.value
  return [
    { key: 'actionable', label: 'Para contactar', value: s?.actionable ?? 0, icon: 'pi pi-users', reason: null },
    { key: 'never_typed', label: UNVERIFIED_REASON_LABELS.never_typed, value: s?.never_typed ?? 0, icon: 'pi pi-inbox', reason: 'never_typed' as const },
    { key: 'retried', label: UNVERIFIED_REASON_LABELS.retried, value: s?.retried ?? 0, icon: 'pi pi-replay', reason: 'retried' as const },
    { key: 'wrong_code', label: UNVERIFIED_REASON_LABELS.wrong_code, value: s?.wrong_code ?? 0, icon: 'pi pi-times-circle', reason: 'wrong_code' as const },
    { key: 'typos', label: 'Correo mal escrito', value: s?.typos ?? 0, icon: 'pi pi-pencil', reason: null },
  ]
})

const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter(row => {
    if (!showWithAccount.value && row.has_account) return false
    if (!showSuspicious.value && row.suspicious) return false
    if (reasonFilter.value && row.reason !== reasonFilter.value) return false
    if (!q) return true
    return [row.name, row.email, row.phone, row.recipient].some(v => v?.toLowerCase().includes(q))
  })
})

function toggleReason(reason: UnverifiedSignupReason) {
  reasonFilter.value = reasonFilter.value === reason ? null : reason
}

function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const until = new Date()
    const since = new Date()
    since.setDate(since.getDate() - rangeDays.value)
    const res = await getUnverifiedSignups({
      since: isoDate(since),
      until: isoDate(until),
      source: sourceFilter.value,
    })
    rows.value = res.data ?? []
    summary.value = res.summary ?? null
  } catch {
    error.value = 'No se pudieron cargar los registros sin verificar'
  } finally {
    isLoading.value = false
  }
}

function sourceLabel(row: UnverifiedSignup): string {
  if (!row.sources.length) return UNVERIFIED_SOURCE_LABELS.unknown
  return row.sources.map(s => UNVERIFIED_SOURCE_LABELS[s] ?? s).join(', ')
}

function formatDateTime(value: string): string {
  const d = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Prefijo internacional por país de la tienda de origen. Los teléfonos que
// guarda la landing son locales (9 dígitos en PE); los de WhatsApp ya traen +.
const COUNTRY_PREFIX: Record<string, string> = { PE: '51', EC: '593', CO: '57', CR: '506' }

function whatsappLink(row: UnverifiedSignup): string | null {
  const raw = row.phone ?? ''
  let digits = raw.replace(/\D/g, '')
  if (digits.length < 8) return null
  if (!raw.trim().startsWith('+')) {
    const prefix = COUNTRY_PREFIX[row.country ?? 'PE'] ?? '51'
    if (!digits.startsWith(prefix) || digits.length <= 10) {
      digits = prefix + digits.replace(/^0+/, '')
    }
  }
  return `https://wa.me/${digits}`
}

async function copyContact(row: UnverifiedSignup) {
  const text = [row.name, row.typo_suggestion || row.email, row.phone].filter(Boolean).join(' · ')
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ severity: 'success', summary: 'Copiado', detail: text, life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo copiar', life: 3000 })
  }
}

onMounted(load)
</script>
