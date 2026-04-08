<template>
  <div class="space-y-6">
    <!-- Section 1: Classification & Status -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Clasificación y Estado</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Flag</label>
          <Dropdown
            v-model="configForm.flag"
            :options="flagOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Orgánica"
            class="w-full"
          />
        </div>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.blocked" />
            <label class="text-sm text-gray-600">Bloqueada</label>
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.marketplace" />
            <label class="text-sm text-gray-600">Marketplace</label>
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.directory" />
            <label class="text-sm text-gray-600">Directorio</label>
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <Button
          label="Guardar Estado"
          icon="pi pi-save"
          size="small"
          :loading="savingSection === 'status'"
          @click="saveStatus"
        />
      </div>
    </div>

    <!-- Section 2: Technical Config -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Configuración Técnica</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Dominio</label>
          <InputText v-model="configForm.domain" placeholder="midominio.com" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Grupo</label>
          <InputNumber v-model="configForm.group_id" :min="0" class="w-full" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-600 mb-1">Umami Website ID</label>
          <InputText v-model="configForm.umami_website_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full font-mono text-sm" />
          <p class="text-xs text-gray-400 mt-1">UUID del website en Umami Analytics. Dejar vacío si no está configurado.</p>
        </div>
        <div class="flex items-center gap-6 md:col-span-2 flex-wrap">
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.ssl_enabled" />
            <label class="text-sm text-gray-600">SSL</label>
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.domain_verified" />
            <label class="text-sm text-gray-600">Dominio Verificado</label>
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.fb_integration" />
            <label class="text-sm text-gray-600">Integración Facebook</label>
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="configForm.payment_alert" />
            <label class="text-sm text-gray-600">Alerta de Pago</label>
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <Button
          label="Guardar Config"
          icon="pi pi-save"
          size="small"
          :loading="savingSection === 'config'"
          @click="saveConfig"
        />
      </div>
    </div>

    <!-- Section 3: Plan Config -->
    <div v-if="plan" class="bg-white rounded-xl border border-gray-200 p-6">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
        Plan Actual
        <span class="text-xs font-normal text-gray-400 ml-2">{{ plan.name }}</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Fecha de Vencimiento</label>
          <Calendar
            v-model="planForm.expires_at"
            dateFormat="yy-mm-dd"
            :showIcon="true"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Precio (PEN)</label>
          <InputNumber
            v-model="planForm.price"
            mode="currency"
            currency="PEN"
            locale="es-PE"
            :minFractionDigits="2"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Max Items</label>
          <InputNumber v-model="planForm.max_items" :min="0" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Max Páginas</label>
          <InputNumber v-model="planForm.max_pages" :min="0" class="w-full" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-600 mb-1">Nota de Pago</label>
          <Textarea v-model="planForm.payment_note" rows="2" class="w-full" />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <Button
          label="Guardar Plan"
          icon="pi pi-save"
          size="small"
          :loading="savingSection === 'plan'"
          @click="savePlan"
        />
      </div>
    </div>

    <div v-else class="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-gray-400">
      <i class="pi pi-info-circle text-xl mb-2"></i>
      <p class="text-sm">Esta tienda no tiene un plan activo.</p>
    </div>

    <!-- Section 4: Store Modules -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Modulos de la Tienda
          </h3>
          <span v-if="storeModulesLoaded" class="text-xs text-gray-400">
            {{ selectedStoreModuleIds.size }} habilitados
          </span>
          <span
            v-if="storeModulesLoaded && plansStore.storeModulesData?.has_overrides"
            class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
          >
            Personalizado
          </span>
          <span
            v-else-if="storeModulesLoaded && plansStore.storeModulesData"
            class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
          >
            Heredado del plan {{ plansStore.storeModulesData.plan_name }}
          </span>
        </div>
        <div v-if="storeModulesLoaded" class="flex items-center gap-2">
          <Button label="Todos" text size="small" @click="selectAllModules" />
          <Button label="Ninguno" text size="small" severity="secondary" @click="deselectAllModules" />
          <Button
            v-if="plansStore.storeModulesData?.has_overrides"
            label="Restaurar del Plan"
            text
            size="small"
            severity="warning"
            icon="pi pi-replay"
            :loading="savingSection === 'reset'"
            @click="resetToDefaults"
          />
        </div>
      </div>

      <!-- Filter -->
      <div v-if="storeModulesLoaded" class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <Checkbox v-model="showOnlyMigrated" :binary="true" />
          Solo modulos migrados
        </label>
        <span class="text-xs text-gray-400">
          ({{ filteredModuleCount }}/{{ totalModuleCount }})
        </span>
      </div>

      <div v-if="loadingModules" class="flex justify-center py-6">
        <i class="pi pi-spin pi-spinner text-2xl text-primary-600"></i>
      </div>

      <div v-else-if="storeModulesLoaded">
        <div class="space-y-4">
          <div v-for="(groupModules, groupName) in storeModulesByGroup" :key="groupName">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {{ groupLabel(groupName as string) }}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <label
                v-for="mod in groupModules"
                :key="mod.id"
                class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="selectedStoreModuleIds.has(mod.id)
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'"
              >
                <Checkbox
                  :modelValue="selectedStoreModuleIds.has(mod.id)"
                  :binary="true"
                  @update:modelValue="toggleStoreModule(mod.id)"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ mod.name }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ mod.code }}</p>
                </div>
                <span
                  v-if="isModuleOverridden(mod)"
                  class="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 whitespace-nowrap"
                >
                  custom
                </span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-6">
          <Button
            label="Guardar Modulos"
            icon="pi pi-save"
            size="small"
            :loading="savingSection === 'modules'"
            @click="saveStoreModules"
          />
        </div>
      </div>

      <div v-else class="text-center py-4">
        <p class="text-sm text-red-500">No se pudo cargar los modulos.</p>
        <p v-if="modulesError" class="text-xs text-red-400 mt-1">{{ modulesError }}</p>
        <Button label="Reintentar" text size="small" icon="pi pi-refresh" class="mt-2" @click="loadStoreModules" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import type { StoreConfig, StorePlan } from '@/types/store.types'
import type { StoreModule } from '@/types/plans.types'
import { useStoresStore } from '@/stores/stores.store'
import { usePlansStore } from '@/stores/plans.store'
import { MIGRATED_MODULE_CODES } from '@/config/migrated-modules.config'

const props = defineProps<{
  config: StoreConfig
  plan: StorePlan | null
  storeId: number
}>()

const toast = useToast()
const storesStore = useStoresStore()
const plansStore = usePlansStore()
const savingSection = ref<'status' | 'config' | 'plan' | 'modules' | 'reset' | null>(null)
const loadingModules = ref(false)
const storeModulesLoaded = ref(false)
const modulesError = ref<string | null>(null)
const selectedStoreModuleIds = ref(new Set<number>())
const showOnlyMigrated = ref(true)

const filteredModules = computed(() => {
  const data = plansStore.storeModulesData
  if (!data) return []
  if (!showOnlyMigrated.value) return data.modules
  return data.modules.filter(m => MIGRATED_MODULE_CODES.has(m.code))
})

const filteredModuleCount = computed(() => filteredModules.value.length)
const totalModuleCount = computed(() => plansStore.storeModulesData?.modules.length ?? 0)

const storeModulesByGroup = computed(() => {
  const groups: Record<string, StoreModule[]> = {}
  for (const mod of filteredModules.value) {
    const group = mod.group || 'otros'
    if (!groups[group]) groups[group] = []
    groups[group].push(mod)
  }
  return groups
})

const GROUP_LABELS: Record<string, string> = {
  ventas: 'Ventas',
  catalogo: 'Catalogo',
  marketing: 'Marketing',
  contenido: 'Contenido',
  apariencia: 'Apariencia',
  configuracion: 'Configuracion',
  facturacion: 'Facturacion',
  envios: 'Envios',
  integraciones: 'Integraciones',
  reportes: 'Reportes',
  otros: 'Otros'
}

function groupLabel(group: string): string {
  return GROUP_LABELS[group] || group.charAt(0).toUpperCase() + group.slice(1)
}

function toggleStoreModule(id: number) {
  const s = new Set(selectedStoreModuleIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedStoreModuleIds.value = s
}

function selectAllModules() {
  const ids = filteredModules.value.map(m => m.id)
  const s = new Set(selectedStoreModuleIds.value)
  ids.forEach(id => s.add(id))
  selectedStoreModuleIds.value = s
}

function deselectAllModules() {
  const ids = new Set(filteredModules.value.map(m => m.id))
  const s = new Set(selectedStoreModuleIds.value)
  ids.forEach(id => s.delete(id))
  selectedStoreModuleIds.value = s
}

function isModuleOverridden(mod: StoreModule): boolean {
  const isEnabled = selectedStoreModuleIds.value.has(mod.id)
  return isEnabled !== mod.plan_enabled
}

async function loadStoreModules() {
  loadingModules.value = true
  modulesError.value = null
  try {
    await plansStore.fetchStoreModules(props.storeId)
    if (plansStore.storeModulesData) {
      selectedStoreModuleIds.value = new Set(
        plansStore.storeModulesData.modules.filter(m => m.enabled).map(m => m.id)
      )
      storeModulesLoaded.value = true
    }
  } catch (e: any) {
    storeModulesLoaded.value = false
    modulesError.value = e?.response?.data?.message || e?.message || 'Error desconocido'
  } finally {
    loadingModules.value = false
  }
}

async function saveStoreModules() {
  savingSection.value = 'modules'
  try {
    await plansStore.saveStoreModules(props.storeId, Array.from(selectedStoreModuleIds.value))
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Modulos actualizados', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar modulos', life: 5000 })
  } finally {
    savingSection.value = null
  }
}

async function resetToDefaults() {
  savingSection.value = 'reset'
  try {
    await plansStore.resetStoreModules(props.storeId)
    if (plansStore.storeModulesData) {
      selectedStoreModuleIds.value = new Set(
        plansStore.storeModulesData.modules.filter(m => m.enabled).map(m => m.id)
      )
    }
    toast.add({ severity: 'success', summary: 'Restaurado', detail: 'Modulos restaurados a los defaults del plan', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al restaurar modulos', life: 5000 })
  } finally {
    savingSection.value = null
  }
}

onMounted(() => {
  loadStoreModules()
})

const flagOptions = [
  { label: 'Orgánica', value: null },
  { label: 'Interna', value: 'internal' },
  { label: 'Corporativa', value: 'corporate' }
]

// Reactive form state for config
const configForm = reactive({
  flag: props.config.flag,
  blocked: props.config.blocked,
  marketplace: props.config.marketplace,
  directory: props.config.directory,
  ssl_enabled: props.config.ssl_enabled,
  domain: props.config.domain || '',
  domain_verified: props.config.domain_verified,
  fb_integration: props.config.fb_integration,
  payment_alert: props.config.payment_alert,
  group_id: props.config.group_id,
  umami_website_id: props.config.umami_website_id || ''
})

// Reactive form state for plan
const planForm = reactive({
  expires_at: props.plan?.expires_at ? new Date(props.plan.expires_at) : null as Date | null,
  price: props.plan?.price ?? 0,
  max_items: props.plan?.max_items ?? 0,
  max_pages: props.plan?.max_pages ?? 0,
  payment_note: props.plan?.payment_note ?? ''
})

// Reset forms when props change
watch(() => props.config, (c) => {
  configForm.flag = c.flag
  configForm.blocked = c.blocked
  configForm.marketplace = c.marketplace
  configForm.directory = c.directory
  configForm.ssl_enabled = c.ssl_enabled
  configForm.domain = c.domain || ''
  configForm.domain_verified = c.domain_verified
  configForm.fb_integration = c.fb_integration
  configForm.payment_alert = c.payment_alert
  configForm.group_id = c.group_id
  configForm.umami_website_id = c.umami_website_id || ''
}, { deep: true })

watch(() => props.plan, (p) => {
  planForm.expires_at = p?.expires_at ? new Date(p.expires_at) : null
  planForm.price = p?.price ?? 0
  planForm.max_items = p?.max_items ?? 0
  planForm.max_pages = p?.max_pages ?? 0
  planForm.payment_note = p?.payment_note ?? ''
}, { deep: true })

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function saveStatus() {
  savingSection.value = 'status'
  try {
    await storesStore.saveStoreConfig(props.storeId, {
      flag: configForm.flag,
      blocked: configForm.blocked,
      marketplace: configForm.marketplace,
      directory: configForm.directory
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Estado actualizado', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: storesStore.configError || 'Error al guardar', life: 5000 })
  } finally {
    savingSection.value = null
  }
}

async function saveConfig() {
  savingSection.value = 'config'
  try {
    await storesStore.saveStoreConfig(props.storeId, {
      ssl_enabled: configForm.ssl_enabled,
      domain: configForm.domain || null,
      domain_verified: configForm.domain_verified,
      fb_integration: configForm.fb_integration,
      payment_alert: configForm.payment_alert,
      group_id: configForm.group_id,
      umami_website_id: configForm.umami_website_id || null
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: storesStore.configError || 'Error al guardar', life: 5000 })
  } finally {
    savingSection.value = null
  }
}

async function savePlan() {
  savingSection.value = 'plan'
  try {
    await storesStore.saveStorePlanConfig(props.storeId, {
      expires_at: planForm.expires_at ? formatDate(planForm.expires_at) : undefined,
      price: planForm.price,
      max_items: planForm.max_items,
      max_pages: planForm.max_pages,
      payment_note: planForm.payment_note
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Plan actualizado', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: storesStore.configError || 'Error al guardar', life: 5000 })
  } finally {
    savingSection.value = null
  }
}
</script>
