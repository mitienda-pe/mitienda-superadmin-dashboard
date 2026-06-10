<template>
  <div class="space-y-6 max-w-3xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <router-link to="/stores">
        <Button icon="pi pi-arrow-left" text rounded severity="secondary" v-tooltip="'Volver a tiendas'" />
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Crear tienda</h1>
        <p class="text-sm text-gray-500 mt-1">Afilia un nuevo comercio sin verificación OTP. Se enviará un email de bienvenida con un enlace para definir la contraseña.</p>
      </div>
    </div>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- Datos del local -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datos del local</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre comercial del local <span class="text-red-500">*</span></label>
            <InputText v-model="form.business_name" class="w-full" :class="{ 'p-invalid': errors.business_name }" placeholder="Ej. Bodega San Jorge" />
            <small v-if="errors.business_name" class="text-red-500">{{ errors.business_name }}</small>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">RUC</label>
            <InputText v-model="form.ruc" class="w-full" placeholder="20123456789" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Razón social</label>
            <InputText v-model="form.razon_social" class="w-full" placeholder="San Jorge S.A.C." />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección del local</label>
            <Textarea v-model="form.address" class="w-full" rows="2" autoResize placeholder="Dirección donde se usará la solución MiTienda" />
            <small class="text-gray-400">Se usará como dirección de la sucursal "Principal".</small>
          </div>
        </div>
      </div>

      <!-- Titular / contacto -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Titular y contacto</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del titular o representante legal <span class="text-red-500">*</span></label>
            <InputText v-model="form.admin_name" class="w-full" :class="{ 'p-invalid': errors.admin_name }" placeholder="Nombre y apellido" />
            <small v-if="errors.admin_name" class="text-red-500">{{ errors.admin_name }}</small>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Correo de comunicaciones <span class="text-red-500">*</span></label>
            <InputText v-model="form.email" type="email" class="w-full" :class="{ 'p-invalid': errors.email }" placeholder="correo@ejemplo.com" />
            <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
            <small v-else class="text-gray-400">Aquí llegará el email de bienvenida.</small>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Celular</label>
            <InputText v-model="form.phone" class="w-full" placeholder="999888777" />
          </div>
        </div>
      </div>

      <!-- Plan -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Plan y suscripción</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plan <span class="text-red-500">*</span></label>
            <Dropdown
              v-model="form.plan_id"
              :options="planOptions"
              optionLabel="label"
              optionValue="value"
              :loading="loadingPlans"
              placeholder="Selecciona un plan"
              class="w-full"
              :class="{ 'p-invalid': errors.plan_id }"
            />
            <small v-if="errors.plan_id" class="text-red-500">{{ errors.plan_id }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">País</label>
            <Dropdown
              v-model="form.country"
              :options="countryOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de suscripción</label>
            <SelectButton
              v-model="form.subscription_type"
              :options="subscriptionTypeOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
            <SelectButton
              v-model="form.billing_frequency"
              :options="frequencyOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio <span class="text-red-500">*</span></label>
            <Calendar v-model="startDate" dateFormat="yy-mm-dd" showIcon class="w-full" :class="{ 'p-invalid': errors.start_date }" />
            <small v-if="errors.start_date" class="text-red-500">{{ errors.start_date }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de fin <span class="text-red-500">*</span></label>
            <Calendar v-model="endDate" dateFormat="yy-mm-dd" showIcon class="w-full" :class="{ 'p-invalid': errors.end_date }" />
            <small v-if="errors.end_date" class="text-red-500">{{ errors.end_date }}</small>
          </div>
        </div>

        <!-- Resumen precio -->
        <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <span class="text-sm text-gray-600">
            {{ form.subscription_type === 'trial' ? 'Suscripción de cortesía (trial)' : 'Suscripción pagada' }}
            · {{ form.billing_frequency === 'annual' ? 'Anual' : 'Mensual' }}
          </span>
          <span class="text-lg font-semibold text-gray-900">{{ priceDisplay }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <router-link to="/stores">
          <Button label="Cancelar" severity="secondary" text type="button" />
        </router-link>
        <Button label="Crear tienda" icon="pi pi-check" type="submit" :loading="storesStore.isCreating" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useStoresStore } from '@/stores/stores.store'
import type { CreateStorePayload } from '@/types/store.types'

const router = useRouter()
const toast = useToast()
const storesStore = useStoresStore()

const loadingPlans = ref(false)

const form = reactive<CreateStorePayload>({
  business_name: '',
  admin_name: '',
  email: '',
  phone: '',
  ruc: '',
  razon_social: '',
  address: '',
  country: 'PE',
  plan_id: 0,
  subscription_type: 'paid',
  billing_frequency: 'monthly',
  start_date: '',
  end_date: ''
})

const startDate = ref<Date | null>(new Date())
const endDate = ref<Date | null>(null)
let endDateTouched = false
let suppressTouch = false

const errors = reactive<Record<string, string>>({})

const subscriptionTypeOptions = [
  { label: 'Pagada', value: 'paid' },
  { label: 'Trial', value: 'trial' }
]
const frequencyOptions = [
  { label: 'Mensual', value: 'monthly' },
  { label: 'Anual', value: 'annual' }
]
const countryOptions = [
  { label: 'Perú', value: 'PE' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Colombia', value: 'CO' }
]

const planOptions = computed(() =>
  storesStore.availablePlans.map(p => ({ label: p.plan_titulo, value: p.plan_id }))
)

const selectedPlan = computed(() =>
  storesStore.availablePlans.find(p => p.plan_id === form.plan_id) || null
)

const currencySymbol = computed(() => (form.country === 'CO' ? '$' : form.country === 'EC' ? '$' : 'S/'))

const priceDisplay = computed(() => {
  if (form.subscription_type === 'trial') return `${currencySymbol.value} 0.00`
  const detail = form.billing_frequency === 'annual' ? selectedPlan.value?.annual : selectedPlan.value?.monthly
  if (!detail) return 'Sin tarifa definida'
  return `${currencySymbol.value} ${detail.precio.toFixed(2)}`
})

function toIsoDate(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Sugerir fecha de fin = inicio + 1 mes/año según frecuencia (hasta que el
// superadmin la edite manualmente).
function suggestEndDate() {
  if (endDateTouched || !startDate.value) return
  const base = new Date(startDate.value)
  if (form.billing_frequency === 'annual') {
    base.setFullYear(base.getFullYear() + 1)
  } else {
    base.setMonth(base.getMonth() + 1)
  }
  suppressTouch = true
  endDate.value = base
}

watch(() => startDate.value, suggestEndDate)
watch(() => form.billing_frequency, suggestEndDate)
watch(endDate, () => {
  // Ignora los cambios provenientes de la sugerencia automática; cualquier
  // edición manual del superadmin desactiva futuras sugerencias.
  if (suppressTouch) {
    suppressTouch = false
    return
  }
  endDateTouched = true
})

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.business_name.trim()) errors.business_name = 'Obligatorio'
  if (!form.admin_name.trim()) errors.admin_name = 'Obligatorio'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = 'Correo inválido'
  if (!form.plan_id) errors.plan_id = 'Selecciona un plan'
  if (!startDate.value) errors.start_date = 'Obligatorio'
  if (!endDate.value) errors.end_date = 'Obligatorio'
  if (startDate.value && endDate.value && toIsoDate(endDate.value) < toIsoDate(startDate.value)) {
    errors.end_date = 'La fecha de fin no puede ser anterior a la de inicio'
  }
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) {
    toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Hay campos obligatorios sin completar.', life: 4000 })
    return
  }

  const payload: CreateStorePayload = {
    ...form,
    business_name: form.business_name.trim(),
    admin_name: form.admin_name.trim(),
    email: form.email.trim().toLowerCase(),
    start_date: toIsoDate(startDate.value),
    end_date: toIsoDate(endDate.value)
  }

  try {
    const result = await storesStore.createStore(payload)
    toast.add({
      severity: 'success',
      summary: 'Tienda creada',
      detail: result.email_sent
        ? 'Se envió el email de bienvenida con el enlace para definir contraseña.'
        : 'La tienda se creó, pero el email de bienvenida no pudo enviarse.',
      life: 6000
    })
    router.push(`/stores/${result.store_id}`)
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo crear la tienda',
      detail: storesStore.createError || e.message || 'Error inesperado',
      life: 6000
    })
  }
}

onMounted(async () => {
  loadingPlans.value = true
  try {
    const plans = await storesStore.fetchAvailablePlans()
    // Preseleccionar el plan PDV (POS) si existe, si no el primero.
    const pdv = plans.find(p => p.plan_titulo.toUpperCase() === 'PDV')
    form.plan_id = pdv?.plan_id || plans[0]?.plan_id || 0
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los planes.', life: 5000 })
  } finally {
    loadingPlans.value = false
  }
  suggestEndDate()
})
</script>
