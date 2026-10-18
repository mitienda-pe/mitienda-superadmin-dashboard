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
          <div v-if="customer.address" class="text-sm text-gray-500 mt-1">{{ customer.address }}</div>
          <div v-if="customer.sunat" class="text-xs mt-2 flex flex-wrap gap-2 items-center">
            <span class="rounded px-2 py-0.5" :class="sunatOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
              {{ customer.document_type === 'DNI' ? 'RENIEC' : 'SUNAT' }}{{ customer.sunat.status ? `: ${customer.sunat.status}` : '' }}{{ customer.sunat.condition ? ` · ${customer.sunat.condition}` : '' }}
            </span>
            <span class="text-gray-400">consultado {{ formatDate(customer.sunat.checked_at) }}</span>
            <span v-if="customer.sunat.name && customer.sunat.name !== customer.name" class="text-amber-700">
              Allí figura como "{{ customer.sunat.name }}"
            </span>
          </div>
          <div v-if="customer.notes" class="text-sm text-gray-700 mt-2 whitespace-pre-line bg-amber-50 rounded-lg px-3 py-2 max-w-2xl">{{ customer.notes }}</div>
          <div v-if="customer.edited_at" class="text-xs text-gray-400 mt-1">Editado a mano el {{ formatDate(customer.edited_at) }}: el armado automático ya no cambia nombre, correo ni teléfono.</div>
        </div>
        <div v-if="canEdit" class="flex flex-wrap gap-2">
          <Button v-if="customer.document_type !== 'OTRO'" :label="customer.document_type === 'DNI' ? 'Consultar RENIEC' : 'Consultar SUNAT'" icon="pi pi-search" outlined size="small" :loading="verifying" @click="verify(false)" />
          <Button label="Editar" icon="pi pi-pencil" outlined size="small" @click="openEdit" />
        </div>
      </div>

      <div v-if="lookupNote" class="rounded-xl border p-3 text-sm flex flex-wrap items-center justify-between gap-3" :class="lookupNote.cls">
        <span>{{ lookupNote.text }}</span>
        <Button v-if="lookupNote.canApply" label="Usar razón social y domicilio fiscal" size="small" :loading="verifying" @click="verify(true)" />
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
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="font-semibold text-gray-900">Tiendas</h2>
          <form v-if="canEdit" class="flex flex-wrap items-center gap-2 text-sm" @submit.prevent="assign">
            <InputNumber v-model="link.tienda_id" placeholder="N.º de tienda" :useGrouping="false" inputClass="w-32" />
            <label class="flex items-center gap-1 text-gray-600"><Checkbox v-model="link.current" binary /> se le factura desde ahora</label>
            <Button type="submit" label="Vincular" icon="pi pi-link" size="small" outlined :disabled="!link.tienda_id" :loading="linking" />
          </form>
        </div>
        <div v-if="!customer.stores.length" class="text-sm text-gray-500">Sin tienda vinculada: sus comprobantes se emitieron a mano.</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="py-2 text-left">Tienda</th>
              <th class="py-2 text-left">Contratante</th>
              <th class="py-2 text-left">Plan</th>
              <th class="py-2 text-left">Vence</th>
              <th class="py-2 text-left">Se le factura</th>
              <th v-if="canEdit"></th>
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
                <span v-if="s.manual" class="text-gray-400"> · a mano</span>
              </td>
              <td v-if="canEdit" class="py-2 text-right whitespace-nowrap">
                <Button v-if="!s.is_current" v-tooltip.left="'Facturarle esta tienda a este cliente desde ahora'" icon="pi pi-check-circle" text rounded size="small" severity="secondary" @click="assignExisting(s.tienda_id)" />
                <Button v-if="s.manual" v-tooltip.left="'Quitar el vínculo puesto a mano'" icon="pi pi-times" text rounded size="small" severity="secondary" @click="unassign(s.tienda_id)" />
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

    <Dialog v-model:visible="editing" header="Editar ficha" modal :style="{ width: '32rem' }">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Razón social o nombre *</label>
          <InputText v-model="form.name" maxlength="500" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Domicilio fiscal</label>
          <InputText v-model="form.address" maxlength="500" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Correo para comprobantes</label>
            <InputText v-model="form.email" type="email" maxlength="255" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
            <InputText v-model="form.phone" maxlength="40" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Notas internas</label>
          <Textarea v-model="form.notes" rows="3" maxlength="1000" class="w-full" placeholder="Ej.: factura a nombre del holding; pide orden de compra" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="editing = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import {
  getCustomer, updateCustomer, verifyCustomer, assignCustomerStore, unassignCustomerStore, customerErrorMessage,
  type CustomerDetail, type CustomerInput
} from '@/api/customers.api'

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
const toast = useToast()
const authStore = useAuthStore()
const canEdit = computed(() => authStore.canWrite('billing') || authStore.canWrite('finance'))

const sunatOk = computed(() => {
  const s = customer.value?.sunat
  if (!s) return false
  if (customer.value?.document_type === 'DNI') return true
  return (s.status ?? '').toUpperCase() === 'ACTIVO' && (s.condition ?? '').toUpperCase() === 'HABIDO'
})

const editing = ref(false)
const saving = ref(false)
const form = reactive<CustomerInput>({ name: '', address: '', email: '', phone: '', notes: '' })
function openEdit() {
  const c = customer.value
  if (!c) return
  Object.assign(form, { name: c.name, address: c.address ?? '', email: c.email ?? '', phone: c.phone ?? '', notes: c.notes ?? '' })
  editing.value = true
}
async function save() {
  if (!customer.value) return
  saving.value = true
  try {
    customer.value = await updateCustomer(customer.value.id, { ...form })
    editing.value = false
    toast.add({ severity: 'success', summary: 'Ficha guardada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: customerErrorMessage(e, 'No se pudo guardar'), life: 5000 })
  } finally {
    saving.value = false
  }
}

const verifying = ref(false)
const lookupNote = ref<{ text: string; cls: string; canApply: boolean } | null>(null)
async function verify(apply: boolean) {
  if (!customer.value) return
  verifying.value = true
  try {
    const { customer: updated, lookup } = await verifyCustomer(customer.value.id, apply)
    customer.value = updated
    if (lookup.status !== 'found') {
      lookupNote.value = { text: lookup.message || 'No se encontró el documento', cls: 'border-amber-200 bg-amber-50 text-amber-800', canApply: false }
    } else if (apply) {
      lookupNote.value = null
      toast.add({ severity: 'success', summary: 'Datos tomados de ' + (updated.document_type === 'DNI' ? 'RENIEC' : 'SUNAT'), life: 3000 })
    } else {
      const differs = lookup.name !== updated.name || (lookup.address !== '' && lookup.address !== (updated.address ?? ''))
      lookupNote.value = differs
        ? { text: `Figura como "${lookup.name}"${lookup.address ? ` — ${lookup.address}` : ''}.`, cls: 'border-gray-200 bg-gray-50 text-gray-700', canApply: true }
        : { text: 'Coincide con lo registrado.', cls: 'border-green-200 bg-green-50 text-green-800', canApply: false }
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: customerErrorMessage(e, 'No se pudo consultar'), life: 5000 })
  } finally {
    verifying.value = false
  }
}

const link = reactive<{ tienda_id: number | null; current: boolean }>({ tienda_id: null, current: true })
const linking = ref(false)
async function assignStore(tiendaId: number, current: boolean) {
  if (!customer.value) return
  linking.value = true
  try {
    customer.value = await assignCustomerStore(customer.value.id, tiendaId, current)
    link.tienda_id = null
  } catch (e: any) {
    toast.add({ severity: 'error', summary: customerErrorMessage(e, 'No se pudo vincular'), life: 5000 })
  } finally {
    linking.value = false
  }
}
function assign() {
  if (link.tienda_id) assignStore(link.tienda_id, link.current)
}
function assignExisting(tiendaId: number) {
  assignStore(tiendaId, true)
}
async function unassign(tiendaId: number) {
  if (!customer.value) return
  try {
    customer.value = await unassignCustomerStore(customer.value.id, tiendaId)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: customerErrorMessage(e, 'No se pudo quitar'), life: 5000 })
  }
}

function storeName(id: number | null): string {
  if (!id) return '—'
  return customer.value?.stores.find(s => s.tienda_id === id)?.name ?? `#${id}`
}

watch(() => route.params.id, async (id) => {
  if (!id) return
  loading.value = true
  error.value = null
  lookupNote.value = null
  try {
    customer.value = await getCustomer(Number(id))
  } catch (e: any) {
    error.value = e?.response?.data?.messages?.error || e?.response?.data?.message || 'No se pudo cargar el cliente'
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>
