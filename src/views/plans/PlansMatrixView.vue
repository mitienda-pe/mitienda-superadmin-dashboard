<template>
  <div>
    <!-- Loading -->
    <div v-if="plansStore.isMatrixLoading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
    </div>

    <!-- Error -->
    <div v-else-if="plansStore.matrixError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
      <p class="text-red-700 mt-2">{{ plansStore.matrixError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" size="small" class="mt-3" @click="plansStore.fetchMatrix()" />
    </div>

    <!-- Matrix Content -->
    <div v-else-if="matrixPlans.length" class="space-y-4">
      <!-- Action Bar -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/plans/list" class="text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <i class="pi pi-list text-xs mr-1"></i>
            Vista lista
          </router-link>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="isDirty" class="text-sm text-orange-600 flex items-center gap-1">
            <i class="pi pi-exclamation-circle text-xs"></i>
            Cambios sin guardar
          </span>
          <Button
            label="Descartar"
            icon="pi pi-undo"
            size="small"
            severity="secondary"
            text
            :disabled="!isDirty"
            @click="resetForm"
          />
          <Button
            label="Guardar Cambios"
            icon="pi pi-save"
            size="small"
            :loading="plansStore.isSavingMatrix"
            :disabled="!isDirty"
            @click="saveAll"
          />
        </div>
      </div>

      <!-- Matrix Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table class="w-full">
          <!-- Sticky header -->
          <thead class="sticky top-0 z-10 bg-white border-b-2 border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 min-w-[240px] text-sm font-semibold text-gray-700 bg-gray-50 sticky left-0 z-20">
                Caracteristica
              </th>
              <th
                v-for="plan in matrixPlans"
                :key="plan.id"
                class="text-center px-4 py-3 min-w-[160px] bg-gray-50"
              >
                <div class="text-sm font-semibold text-gray-800">{{ plan.name }}</div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ plan.active_stores }} tiendas activas
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Max Products row -->
            <tr class="border-b border-gray-100">
              <td class="px-4 py-3 text-sm font-medium text-gray-700 bg-white sticky left-0 z-[5]">
                <i class="pi pi-box text-xs text-gray-400 mr-2"></i>
                Max Productos
              </td>
              <td
                v-for="plan in matrixPlans"
                :key="'items-' + plan.id"
                class="px-4 py-3 text-center"
                :class="{ 'bg-amber-50': isQuotaChanged(plan.id, 'max_items') }"
              >
                <InputNumber
                  v-model="form[plan.id].max_items"
                  :min="0"
                  class="w-24 mx-auto"
                  inputClass="text-center text-sm"
                />
                <p class="text-xs text-gray-400 mt-0.5">0 = ilimitado</p>
              </td>
            </tr>

            <!-- Max Pages row -->
            <tr class="border-b border-gray-200">
              <td class="px-4 py-3 text-sm font-medium text-gray-700 bg-white sticky left-0 z-[5]">
                <i class="pi pi-file text-xs text-gray-400 mr-2"></i>
                Max Paginas
              </td>
              <td
                v-for="plan in matrixPlans"
                :key="'pages-' + plan.id"
                class="px-4 py-3 text-center"
                :class="{ 'bg-amber-50': isQuotaChanged(plan.id, 'max_pages') }"
              >
                <InputNumber
                  v-model="form[plan.id].max_pages"
                  :min="0"
                  class="w-24 mx-auto"
                  inputClass="text-center text-sm"
                />
                <p class="text-xs text-gray-400 mt-0.5">0 = ilimitado</p>
              </td>
            </tr>

            <!-- Module groups -->
            <template v-for="(groupModules, groupName) in modulesByGroup" :key="groupName">
              <!-- Group header row -->
              <tr class="bg-gray-50 border-b border-gray-200">
                <td class="px-4 py-2 bg-gray-50 sticky left-0 z-[5]">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {{ formatGroupLabel(groupName as string) }}
                  </span>
                  <span class="text-xs text-gray-400 ml-1">({{ groupModules.length }})</span>
                </td>
                <td
                  v-for="plan in matrixPlans"
                  :key="'gh-' + groupName + '-' + plan.id"
                  class="px-4 py-2 text-center bg-gray-50"
                >
                  <button
                    class="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                    @click="toggleGroupForPlan(plan.id, groupModules)"
                  >
                    {{ allGroupEnabled(plan.id, groupModules) ? 'Quitar todos' : 'Agregar todos' }}
                  </button>
                </td>
              </tr>

              <!-- Module rows -->
              <tr
                v-for="mod in groupModules"
                :key="mod.id"
                class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-4 py-2 bg-white sticky left-0 z-[5]">
                  <div class="text-sm text-gray-700">{{ mod.name }}</div>
                  <div class="text-xs text-gray-400">{{ mod.code }}</div>
                </td>
                <td
                  v-for="plan in matrixPlans"
                  :key="mod.id + '-' + plan.id"
                  class="px-4 py-2 text-center"
                  :class="{ 'bg-amber-50': isModuleChanged(plan.id, mod.id) }"
                >
                  <Checkbox
                    :modelValue="form[plan.id].module_ids.has(mod.id)"
                    :binary="true"
                    @update:modelValue="toggleModule(plan.id, mod.id)"
                  />
                </td>
              </tr>
            </template>

            <!-- Summary row -->
            <tr class="bg-gray-50 border-t-2 border-gray-200">
              <td class="px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 sticky left-0 z-[5]">
                Total Modulos
              </td>
              <td
                v-for="plan in matrixPlans"
                :key="'total-' + plan.id"
                class="px-4 py-3 text-center bg-gray-50"
              >
                <span class="text-sm font-semibold text-primary-600">
                  {{ form[plan.id].module_ids.size }}
                </span>
                <span class="text-xs text-gray-400">
                  / {{ totalModules }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sticky save bar at bottom when dirty -->
      <Transition name="slide-up">
        <div
          v-if="isDirty"
          class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex items-center justify-between shadow-lg z-30"
        >
          <span class="text-sm text-orange-600">
            <i class="pi pi-exclamation-circle mr-1"></i>
            Tienes cambios sin guardar
          </span>
          <div class="flex gap-3">
            <Button label="Descartar" severity="secondary" text size="small" @click="resetForm" />
            <Button
              label="Guardar Cambios"
              icon="pi pi-save"
              size="small"
              :loading="plansStore.isSavingMatrix"
              @click="saveAll"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { usePlansStore } from '@/stores/plans.store'
import { useToast } from 'primevue/usetoast'
import type { ModuleDefinition, MatrixPlanUpdate } from '@/types/plans.types'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'

const plansStore = usePlansStore()
const toast = useToast()

interface PlanFormState {
  name: string
  max_items: number
  max_pages: number
  module_ids: Set<number>
}

const form = ref<Record<number, PlanFormState>>({})
const originalSnapshot = ref('')

const MAIN_PLAN_IDS = [1, 2, 3, 4, 8] // Micro, Small, Medium, Large, Prueba Gratis
const matrixPlans = computed(() =>
  (plansStore.matrixData?.plans ?? []).filter(p => MAIN_PLAN_IDS.includes(p.id))
)
const allModules = computed(() => plansStore.matrixData?.modules ?? [])
const totalModules = computed(() => allModules.value.length)

const modulesByGroup = computed(() => {
  const groups: Record<string, ModuleDefinition[]> = {}
  for (const mod of allModules.value) {
    const group = mod.group || 'otros'
    if (!groups[group]) groups[group] = []
    groups[group].push(mod)
  }
  return groups
})

function serializeForm(): string {
  const data: Record<number, { name: string; max_items: number; max_pages: number; modules: number[] }> = {}
  for (const [planId, state] of Object.entries(form.value)) {
    data[Number(planId)] = {
      name: state.name,
      max_items: state.max_items,
      max_pages: state.max_pages,
      modules: Array.from(state.module_ids).sort((a, b) => a - b)
    }
  }
  return JSON.stringify(data)
}

const isDirty = computed(() => serializeForm() !== originalSnapshot.value)

function initForm() {
  const newForm: Record<number, PlanFormState> = {}
  for (const plan of matrixPlans.value) {
    newForm[plan.id] = {
      name: plan.name,
      max_items: plan.max_items,
      max_pages: plan.max_pages,
      module_ids: new Set(plan.module_ids)
    }
  }
  form.value = newForm
  originalSnapshot.value = serializeForm()
}

function resetForm() {
  initForm()
}

function toggleModule(planId: number, moduleId: number) {
  const s = new Set(form.value[planId].module_ids)
  if (s.has(moduleId)) s.delete(moduleId)
  else s.add(moduleId)
  form.value[planId].module_ids = s
}

function toggleGroupForPlan(planId: number, groupModules: ModuleDefinition[]) {
  const allEnabled = allGroupEnabled(planId, groupModules)
  const s = new Set(form.value[planId].module_ids)
  for (const mod of groupModules) {
    if (allEnabled) s.delete(mod.id)
    else s.add(mod.id)
  }
  form.value[planId].module_ids = s
}

function allGroupEnabled(planId: number, groupModules: ModuleDefinition[]): boolean {
  if (!form.value[planId]) return false
  return groupModules.every(mod => form.value[planId].module_ids.has(mod.id))
}

function formatGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    'Ventas': 'Ventas',
    'Catálogo': 'Catalogo',
    'Apariencia': 'Apariencia',
    'Configuración': 'Configuracion',
    'Tu tienda': 'Tu Tienda',
    'Reportes': 'Reportes',
    'Clientes': 'Clientes',
    'Imágenes': 'Imagenes',
    'Blog': 'Blog',
    'Plantillas': 'Plantillas',
    'Reclamaciones': 'Reclamaciones',
    'Estadísticas': 'Estadisticas',
    'Despacho': 'Despacho',
    'Servicios': 'Servicios',
    'Api': 'API',
    'Link de pago': 'Link de Pago',
    'Movimientos': 'Movimientos',
    ventas: 'Ventas',
    catalogo: 'Catalogo',
    marketing: 'Marketing',
    integraciones: 'Integraciones',
    configuracion: 'Configuracion',
    otros: 'Otros'
  }
  return labels[group] || group
}

function isModuleChanged(planId: number, moduleId: number): boolean {
  const original = plansStore.matrixData?.plans.find(p => p.id === planId)
  if (!original || !form.value[planId]) return false
  const wasEnabled = original.module_ids.includes(moduleId)
  const isNowEnabled = form.value[planId].module_ids.has(moduleId)
  return wasEnabled !== isNowEnabled
}

function isQuotaChanged(planId: number, field: 'max_items' | 'max_pages'): boolean {
  const original = plansStore.matrixData?.plans.find(p => p.id === planId)
  if (!original || !form.value[planId]) return false
  return original[field] !== form.value[planId][field]
}

async function saveAll() {
  const plansPayload: MatrixPlanUpdate[] = matrixPlans.value.map(plan => ({
    id: plan.id,
    name: form.value[plan.id].name,
    max_items: form.value[plan.id].max_items,
    max_pages: form.value[plan.id].max_pages,
    module_ids: Array.from(form.value[plan.id].module_ids)
  }))

  try {
    const response = await plansStore.saveMatrix(plansPayload)
    if (response?.success) {
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Matriz de planes actualizada', life: 3000 })
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la matriz', life: 5000 })
  }
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  await plansStore.fetchMatrix()
  initForm()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

watch(() => plansStore.matrixData, () => {
  if (plansStore.matrixData) initForm()
})

onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value) {
    const answer = window.confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardar?')
    if (!answer) return next(false)
  }
  next()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
