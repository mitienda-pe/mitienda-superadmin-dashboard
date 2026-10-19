<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Links de pago</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Cobra con tarjeta (Culqi), en soles o dólares, cuando Mercado Pago no sirve. El cliente paga desde el link y la
        constancia le llega a su correo. Los links que se generaban en el superadmin anterior también se ven aquí.
      </p>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4 max-w-3xl">
      <div class="flex flex-wrap items-end gap-2">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Precargar desde una tienda</label>
          <InputNumber v-model="storeId" placeholder="N.º de tienda" :useGrouping="false" inputClass="w-36" />
        </div>
        <Button label="Precargar" icon="pi pi-download" outlined size="small" :disabled="!storeId" :loading="prefilling" @click="prefill" />
        <span v-if="prefillNote" class="text-xs text-gray-500">{{ prefillNote }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nombres o razón social *</label>
          <InputText v-model="form.first_name" maxlength="250" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
          <InputText v-model="form.last_name" maxlength="250" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Documento</label>
          <InputText v-model="form.document" maxlength="20" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Correo *</label>
          <InputText v-model="form.email" type="email" maxlength="150" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
          <InputText v-model="form.phone" maxlength="100" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Moneda</label>
            <SelectButton v-model="form.currency" :options="currencyOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Monto *</label>
            <InputNumber v-model="form.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" inputClass="w-full" class="w-full" />
          </div>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Concepto *</label>
        <Textarea v-model="form.concept" rows="2" maxlength="2000" class="w-full" placeholder="Ej.: Renovación anual del plan Medium — Altea Costa Rica (#25198)" />
      </div>
      <div class="flex justify-end">
        <Button label="Generar link" icon="pi pi-link" :loading="creating" @click="create" />
      </div>

      <div v-if="created" class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm space-y-2">
        <div class="font-medium text-green-800">
          Link generado: {{ created.currency === 'USD' ? 'US$' : 'S/' }} {{ number(created.amount) }} para {{ created.first_name }} {{ created.last_name }}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a :href="created.url" target="_blank" rel="noopener" class="font-mono text-xs text-primary break-all hover:underline">{{ created.url }}</a>
          <Button :label="copied ? 'Copiado' : 'Copiar'" :icon="copied ? 'pi pi-check' : 'pi pi-copy'" size="small" text @click="copy(created.url)" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 class="font-semibold text-gray-900">Links generados</h2>
        <InputText v-model="query" placeholder="Buscar por cliente, correo o concepto" class="w-72" />
      </div>
      <div v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Cargando…</div>
      <div v-else-if="!links.length" class="text-sm text-gray-500">Sin links.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-200">
              <th class="py-2 text-left">Fecha</th>
              <th class="py-2 text-left">Cliente</th>
              <th class="py-2 text-left">Concepto</th>
              <th class="py-2 text-right">Monto</th>
              <th class="py-2 text-left pl-4">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in links" :key="l.id" class="border-b border-gray-100 last:border-0">
              <td class="py-2 text-gray-600 whitespace-nowrap">{{ formatDate(l.created_at) }}</td>
              <td class="py-2 text-gray-800">
                {{ l.first_name }} {{ l.last_name }}
                <div class="text-xs text-gray-400">{{ l.email }}</div>
              </td>
              <td class="py-2 text-gray-600 max-w-xs truncate" :title="l.concept">{{ l.concept }}</td>
              <td class="py-2 text-right tabular-nums whitespace-nowrap">{{ l.currency === 'USD' ? 'US$' : 'S/' }} {{ number(l.amount) }}</td>
              <td class="py-2 pl-4 text-xs">
                <span :class="STATUS_CLASS[l.status]">{{ STATUS_LABEL[l.status] }}</span>
                <div v-if="l.payment_code" class="font-mono text-gray-400">{{ l.payment_code }}</div>
              </td>
              <td class="py-2 text-right">
                <Button v-if="l.status !== 'pagado'" v-tooltip.left="'Copiar link'" icon="pi pi-copy" text rounded size="small" severity="secondary" @click="copy(l.url)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { listPaymentLinks, createPaymentLink, type PaymentLink, type PaymentLinkInput } from '@/api/paymentLinks.api'
import { getRenewalContext } from '@/api/stores.api'

const STATUS_LABEL: Record<PaymentLink['status'], string> = { pendiente: 'Pendiente', pagado: 'Pagado', rechazado: 'Rechazado' }
const STATUS_CLASS: Record<PaymentLink['status'], string> = { pendiente: 'text-amber-700', pagado: 'text-green-700', rechazado: 'text-red-600' }
const currencyOptions = [{ label: 'Soles', value: 'PEN' }, { label: 'Dólares', value: 'USD' }]

const toast = useToast()
const links = ref<PaymentLink[]>([])
const loading = ref(false)
const query = ref('')
const creating = ref(false)
const created = ref<PaymentLink | null>(null)
const copied = ref(false)
const storeId = ref<number | null>(null)
const prefilling = ref(false)
const prefillNote = ref('')

const empty = (): PaymentLinkInput => ({ first_name: '', last_name: '', document: '', email: '', phone: '', currency: 'PEN', amount: null, concept: '' })
const form = reactive<PaymentLinkInput>(empty())

function errorMessage(e: any, fallback: string): string {
  const data = e?.response?.data
  const first = data?.messages && typeof data.messages === 'object' ? Object.values(data.messages)[0] : null
  return typeof first === 'string' ? first : data?.message || fallback
}
function number(value: number): string {
  return value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

async function load() {
  loading.value = true
  try {
    links.value = await listPaymentLinks(query.value.trim())
  } catch (e: any) {
    toast.add({ severity: 'error', summary: errorMessage(e, 'No se pudieron cargar los links'), life: 5000 })
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
watch(query, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 350)
})
onMounted(load)

// Datos fiscales y precio del plan vigente de la tienda: lo mismo que propone la renovación.
async function prefill() {
  if (!storeId.value) return
  prefilling.value = true
  prefillNote.value = ''
  try {
    const { data: ctx } = await getRenewalContext(storeId.value)
    const b = ctx.billing
    const c = ctx.customer
    form.first_name = b.business_name || b.first_name || c?.name || ''
    form.last_name = b.business_name ? '' : b.last_name
    form.document = b.document_number || c?.document || ''
    form.email = b.email || c?.email || ''
    form.amount = ctx.price > 0 ? ctx.price : form.amount
    form.concept = `Renovación ${ctx.frequency === 'annual' ? 'anual' : 'mensual'} del plan ${ctx.plan} — ${ctx.store_name} (#${ctx.store_id})`
    prefillNote.value = 'Revisa la moneda y el monto antes de generar.'
  } catch (e: any) {
    prefillNote.value = errorMessage(e, 'No se pudo leer la tienda')
  } finally {
    prefilling.value = false
  }
}

async function create() {
  creating.value = true
  try {
    created.value = await createPaymentLink({ ...form })
    copied.value = false
    Object.assign(form, empty())
    storeId.value = null
    prefillNote.value = ''
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: errorMessage(e, 'No se pudo generar el link'), life: 5000 })
  } finally {
    creating.value = false
  }
}

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    toast.add({ severity: 'success', summary: 'Link copiado', life: 2000 })
  } catch {
    toast.add({ severity: 'warn', summary: 'No se pudo copiar: selecciónalo a mano', life: 4000 })
  }
}
</script>
