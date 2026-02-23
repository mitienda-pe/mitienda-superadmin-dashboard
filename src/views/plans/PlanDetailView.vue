<template>
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <Button
        icon="pi pi-arrow-left"
        label="Volver a Planes"
        text
        size="small"
        severity="secondary"
        @click="router.push('/plans')"
      />
    </div>

    <!-- Loading -->
    <div v-if="plansStore.isLoading && !plansStore.currentPlan" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
    </div>

    <!-- Error -->
    <div v-else-if="plansStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
      <p class="text-red-700">{{ plansStore.error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="plan" class="space-y-6">
      <!-- Plan Info -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Informacion del Plan
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
            <InputText v-model="form.name" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Max Productos</label>
            <InputNumber v-model="form.max_items" :min="0" class="w-full" />
            <p class="text-xs text-gray-400 mt-1">0 = ilimitado</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Max Paginas</label>
            <InputNumber v-model="form.max_pages" :min="0" class="w-full" />
            <p class="text-xs text-gray-400 mt-1">0 = ilimitado</p>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <Button
            label="Guardar Info"
            icon="pi pi-save"
            size="small"
            :loading="savingInfo"
            @click="saveInfo"
          />
        </div>
      </div>

      <!-- Modules -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Modulos del Plan
            <span class="text-xs font-normal text-gray-400 ml-2">
              {{ enabledCount }} de {{ plan.modules.length }} habilitados
            </span>
          </h3>
          <div class="flex gap-2">
            <Button label="Seleccionar todos" text size="small" @click="selectAll" />
            <Button label="Deseleccionar todos" text size="small" severity="secondary" @click="deselectAll" />
          </div>
        </div>

        <!-- Group by category -->
        <div class="space-y-4">
          <div v-for="(groupModules, groupName) in modulesByGroup" :key="groupName">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {{ groupLabel(groupName as string) }}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <label
                v-for="mod in groupModules"
                :key="mod.id"
                class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="selectedModuleIds.has(mod.id)
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'"
              >
                <Checkbox
                  :modelValue="selectedModuleIds.has(mod.id)"
                  :binary="true"
                  @update:modelValue="toggleModule(mod.id)"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ mod.name }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ mod.code }}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <Button
            label="Guardar Modulos"
            icon="pi pi-save"
            size="small"
            :loading="savingModules"
            @click="saveModules"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlansStore } from '@/stores/plans.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'

const route = useRoute()
const router = useRouter()
const plansStore = usePlansStore()
const toast = useToast()

const savingInfo = ref(false)
const savingModules = ref(false)

const form = reactive({
  name: '',
  max_items: 0,
  max_pages: 0
})

const selectedModuleIds = ref(new Set<number>())

const plan = computed(() => plansStore.currentPlan)

const enabledCount = computed(() => selectedModuleIds.value.size)

const modulesByGroup = computed(() => {
  if (!plan.value) return {}
  const groups: Record<string, typeof plan.value.modules> = {}
  for (const mod of plan.value.modules) {
    const group = mod.group || 'otros'
    if (!groups[group]) groups[group] = []
    groups[group].push(mod)
  }
  return groups
})

function groupLabel(group: string): string {
  const labels: Record<string, string> = {
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
  return labels[group] || group.charAt(0).toUpperCase() + group.slice(1)
}

function toggleModule(id: number) {
  const s = new Set(selectedModuleIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedModuleIds.value = s
}

function selectAll() {
  if (!plan.value) return
  selectedModuleIds.value = new Set(plan.value.modules.map(m => m.id))
}

function deselectAll() {
  selectedModuleIds.value = new Set()
}

function syncForm() {
  if (!plan.value) return
  form.name = plan.value.name
  form.max_items = plan.value.max_items
  form.max_pages = plan.value.max_pages
  selectedModuleIds.value = new Set(
    plan.value.modules.filter(m => m.enabled).map(m => m.id)
  )
}

watch(plan, () => syncForm())

onMounted(async () => {
  const id = Number(route.params.id)
  if (id) {
    await plansStore.fetchPlanDetail(id)
    syncForm()
  }
})

async function saveInfo() {
  savingInfo.value = true
  try {
    const id = Number(route.params.id)
    await plansStore.savePlan(id, {
      name: form.name,
      max_items: form.max_items,
      max_pages: form.max_pages
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Info del plan actualizada', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar info', life: 5000 })
  } finally {
    savingInfo.value = false
  }
}

async function saveModules() {
  savingModules.value = true
  try {
    const id = Number(route.params.id)
    await plansStore.savePlanModules(id, Array.from(selectedModuleIds.value))
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Modulos actualizados', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar modulos', life: 5000 })
  } finally {
    savingModules.value = false
  }
}
</script>
