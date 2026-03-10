<template>
  <div>
    <!-- Loading -->
    <div v-if="plansStore.isPricingLoading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
    </div>

    <!-- Error -->
    <div v-else-if="plansStore.pricingError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
      <p class="text-red-700 mt-2">{{ plansStore.pricingError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" size="small" class="mt-3" @click="plansStore.fetchPricing()" />
    </div>

    <!-- Content -->
    <div v-else-if="mainPlans.length" class="space-y-6">
      <!-- Action Bar -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/plans" class="text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <i class="pi pi-th-large text-xs mr-1"></i>
            Matriz de Modulos
          </router-link>
          <span class="text-gray-300">|</span>
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
            :loading="plansStore.isSavingPricing"
            :disabled="!isDirty"
            @click="saveAll"
          />
        </div>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid gap-6" :style="{ gridTemplateColumns: `repeat(${mainPlans.length}, minmax(220px, 1fr))` }">
        <div
          v-for="plan in mainPlans"
          :key="plan.id"
          class="bg-white rounded-xl border-2 transition-all flex flex-col"
          :class="plan.name === 'Medium' ? 'border-primary-400 shadow-lg shadow-primary-100' : 'border-gray-200'"
        >
          <!-- Plan Header -->
          <div class="p-5 text-center border-b border-gray-100">
            <div
              v-if="plan.name === 'Medium'"
              class="text-xs font-semibold text-primary-600 bg-primary-50 rounded-full px-3 py-1 inline-block mb-2"
            >
              Mas Popular
            </div>
            <h3 class="text-lg font-bold text-gray-800">{{ plan.name }}</h3>
            <div v-if="plan.monthly_price != null" class="mt-2">
              <span class="text-3xl font-bold text-gray-900">S/ {{ plan.monthly_price }}</span>
              <span class="text-sm text-gray-500">/mes</span>
            </div>
            <div v-if="plan.yearly_price != null" class="text-xs text-gray-400 mt-1">
              S/ {{ plan.yearly_price }}/año
            </div>
            <div v-else class="mt-2 text-2xl font-bold text-gray-400">Gratis</div>
            <div class="text-xs text-gray-400 mt-2">
              {{ plan.active_stores }} tiendas activas
            </div>
          </div>

          <!-- Quotas -->
          <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 space-y-1">
            <div class="flex items-center justify-between text-xs text-gray-600">
              <span>Productos</span>
              <span class="font-semibold">{{ plan.max_items === 0 ? 'Ilimitados' : plan.max_items }}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-600">
              <span>Paginas</span>
              <span class="font-semibold">{{ plan.max_pages === 0 ? 'Ilimitadas' : plan.max_pages }}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-600">
              <span>Usuarios</span>
              <span class="font-semibold">{{ plan.max_users === 0 ? 'Ilimitados' : plan.max_users }}</span>
            </div>
          </div>

          <!-- Inheritance -->
          <div class="px-5 pt-4 pb-2">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Hereda de
            </label>
            <Dropdown
              v-model="form[plan.id].inherits_from"
              :options="inheritOptions(plan.id)"
              optionLabel="label"
              optionValue="value"
              placeholder="Ninguno"
              class="w-full"
              :pt="{ root: { class: 'text-sm' } }"
            />
            <div
              v-if="form[plan.id].inherits_from"
              class="mt-2 text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2"
            >
              <i class="pi pi-info-circle mr-1"></i>
              Incluye todo lo del plan {{ getPlanName(form[plan.id].inherits_from) }}
            </div>
          </div>

          <!-- Features List -->
          <div class="px-5 py-3 flex-1">
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Caracteristicas propias
              </label>
              <button
                class="text-xs text-primary-600 hover:text-primary-800"
                @click="addFeature(plan.id)"
              >
                <i class="pi pi-plus text-xs mr-0.5"></i>
                Agregar
              </button>
            </div>

            <draggable
              v-model="form[plan.id].features"
              item-key="key"
              handle=".drag-handle"
              :animation="200"
              class="space-y-2"
            >
              <template #item="{ element: feature, index }">
                <div
                  class="group flex items-start gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100"
                  :class="{ 'border-primary-200 bg-primary-50/50': feature.highlighted }"
                >
                  <button class="drag-handle mt-1 cursor-grab text-gray-300 hover:text-gray-500">
                    <i class="pi pi-bars text-xs"></i>
                  </button>
                  <div class="flex-1 min-w-0">
                    <InputText
                      v-model="feature.text"
                      class="w-full !text-sm !py-1 !px-2"
                      placeholder="Ej: Dominio Propio"
                    />
                    <div class="flex items-center gap-2 mt-1.5">
                      <InputText
                        v-model="feature.category"
                        class="!text-xs !py-0.5 !px-1.5 flex-1"
                        placeholder="Categoria"
                      />
                      <label class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
                        <Checkbox v-model="feature.highlighted" :binary="true" class="!w-4 !h-4" />
                        <span>Destacar</span>
                      </label>
                    </div>
                  </div>
                  <button
                    class="mt-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="removeFeature(plan.id, index)"
                  >
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </template>
            </draggable>

            <div
              v-if="form[plan.id].features.length === 0"
              class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg"
            >
              Sin caracteristicas propias.
              <button class="text-primary-600 hover:underline ml-1" @click="addFeature(plan.id)">
                Agregar una
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="mt-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="pi pi-eye text-gray-400 mr-2"></i>
          Vista Previa - Pricing Table
        </h2>
        <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th class="text-left px-6 py-4 min-w-[200px] bg-gray-50"></th>
                <th
                  v-for="plan in mainPlans"
                  :key="'prev-h-' + plan.id"
                  class="text-center px-4 py-4 min-w-[180px]"
                  :class="plan.name === 'Medium' ? 'bg-primary-50' : 'bg-gray-50'"
                >
                  <div class="text-base font-bold text-gray-800">{{ plan.name }}</div>
                  <div v-if="plan.monthly_price != null" class="text-sm text-primary-600 font-semibold mt-1">
                    S/ {{ plan.monthly_price }}/mes
                  </div>
                  <div v-else class="text-sm text-gray-400 mt-1">Gratis</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Quotas rows -->
              <tr class="border-b border-gray-100">
                <td class="px-6 py-3 text-sm text-gray-700 font-medium">Productos</td>
                <td
                  v-for="plan in mainPlans"
                  :key="'prev-items-' + plan.id"
                  class="px-4 py-3 text-center text-sm"
                  :class="plan.name === 'Medium' ? 'bg-primary-50/30' : ''"
                >
                  {{ plan.max_items === 0 ? 'Ilimitados' : plan.max_items }}
                </td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="px-6 py-3 text-sm text-gray-700 font-medium">Paginas</td>
                <td
                  v-for="plan in mainPlans"
                  :key="'prev-pages-' + plan.id"
                  class="px-4 py-3 text-center text-sm"
                  :class="plan.name === 'Medium' ? 'bg-primary-50/30' : ''"
                >
                  {{ plan.max_pages === 0 ? 'Ilimitadas' : plan.max_pages }}
                </td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="px-6 py-3 text-sm text-gray-700 font-medium">Usuarios</td>
                <td
                  v-for="plan in mainPlans"
                  :key="'prev-users-' + plan.id"
                  class="px-4 py-3 text-center text-sm"
                  :class="plan.name === 'Medium' ? 'bg-primary-50/30' : ''"
                >
                  {{ plan.max_users === 0 ? 'Ilimitados' : plan.max_users }}
                </td>
              </tr>

              <!-- Feature rows from resolved features -->
              <tr
                v-for="(featureRow, idx) in previewFeatureRows"
                :key="'prev-feat-' + idx"
                class="border-b border-gray-100"
              >
                <td class="px-6 py-3 text-sm text-gray-700" :class="{ 'font-semibold': featureRow.isCategory }">
                  {{ featureRow.label }}
                </td>
                <td
                  v-for="plan in mainPlans"
                  :key="'prev-feat-' + idx + '-' + plan.id"
                  class="px-4 py-3 text-center"
                  :class="plan.name === 'Medium' ? 'bg-primary-50/30' : ''"
                >
                  <template v-if="featureRow.isCategory">
                    <!-- category header, leave empty -->
                  </template>
                  <template v-else>
                    <i
                      v-if="featureRow.planHas[plan.id]"
                      class="pi pi-check-circle text-primary-500"
                    ></i>
                    <i
                      v-else
                      class="pi pi-minus text-gray-300"
                    ></i>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sticky save bar -->
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
              :loading="plansStore.isSavingPricing"
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
import type { PricingPlanUpdate } from '@/types/plans.types'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import draggable from 'vuedraggable'

const plansStore = usePlansStore()
const toast = useToast()

const MAIN_PLAN_IDS = [1, 2, 3, 4, 8]

interface FeatureFormItem {
  key: string
  text: string
  category: string
  highlighted: boolean
}

interface PlanFormState {
  inherits_from: number | null
  features: FeatureFormItem[]
}

const form = ref<Record<number, PlanFormState>>({})
const originalSnapshot = ref('')
let keyCounter = 0

const mainPlans = computed(() =>
  plansStore.pricingPlans.filter(p => MAIN_PLAN_IDS.includes(p.id))
)

function generateKey(): string {
  return `feat_${++keyCounter}`
}

function serializeForm(): string {
  const data: Record<number, { inherits_from: number | null; features: { text: string; category: string; highlighted: boolean }[] }> = {}
  for (const [planId, state] of Object.entries(form.value)) {
    data[Number(planId)] = {
      inherits_from: state.inherits_from,
      features: state.features.map(f => ({ text: f.text, category: f.category, highlighted: f.highlighted }))
    }
  }
  return JSON.stringify(data)
}

const isDirty = computed(() => serializeForm() !== originalSnapshot.value)

function initForm() {
  const newForm: Record<number, PlanFormState> = {}
  for (const plan of mainPlans.value) {
    newForm[plan.id] = {
      inherits_from: plan.inherits_from,
      features: plan.features.map(f => ({
        key: generateKey(),
        text: f.text,
        category: f.category || '',
        highlighted: f.highlighted
      }))
    }
  }
  form.value = newForm
  originalSnapshot.value = serializeForm()
}

function resetForm() {
  initForm()
}

function addFeature(planId: number) {
  form.value[planId].features.push({
    key: generateKey(),
    text: '',
    category: '',
    highlighted: false
  })
}

function removeFeature(planId: number, index: number) {
  form.value[planId].features.splice(index, 1)
}

function inheritOptions(planId: number) {
  const options: { label: string; value: number | null }[] = [
    { label: 'Ninguno', value: null }
  ]
  for (const plan of mainPlans.value) {
    if (plan.id !== planId) {
      options.push({ label: plan.name, value: plan.id })
    }
  }
  return options
}

function getPlanName(planId: number | null): string {
  if (!planId) return ''
  return mainPlans.value.find(p => p.id === planId)?.name || ''
}

// Build the resolved feature list for the preview table
// Each plan inherits features from its parent, then adds its own
const previewFeatureRows = computed(() => {
  const rows: { label: string; isCategory: boolean; planHas: Record<number, boolean> }[] = []
  const allFeatureTexts = new Set<string>()
  const allCategories = new Set<string>()

  // Resolve full feature set per plan (inherited + own)
  const resolvedFeatures: Record<number, Set<string>> = {}
  for (const plan of mainPlans.value) {
    resolvedFeatures[plan.id] = resolveFeatures(plan.id)
    for (const text of resolvedFeatures[plan.id]) {
      allFeatureTexts.add(text)
    }
  }

  // Collect categories from form
  for (const plan of mainPlans.value) {
    const state = form.value[plan.id]
    if (!state) continue
    for (const f of state.features) {
      if (f.category) allCategories.add(f.category)
    }
    // Also check inherited plan features
    if (state.inherits_from) {
      const parentState = form.value[state.inherits_from]
      if (parentState) {
        for (const f of parentState.features) {
          if (f.category) allCategories.add(f.category)
        }
      }
    }
  }

  // Build feature texts grouped by category
  const featuresByCategory: Record<string, string[]> = { '': [] }
  for (const cat of allCategories) {
    featuresByCategory[cat] = []
  }

  // Collect all features ordered by plan hierarchy
  const orderedFeatures: { text: string; category: string }[] = []
  const seenTexts = new Set<string>()

  for (const plan of mainPlans.value) {
    const state = form.value[plan.id]
    if (!state) continue

    // Inherited features first
    if (state.inherits_from) {
      const parentState = form.value[state.inherits_from]
      if (parentState) {
        for (const f of parentState.features) {
          if (f.text && !seenTexts.has(f.text)) {
            seenTexts.add(f.text)
            orderedFeatures.push({ text: f.text, category: f.category })
          }
        }
      }
    }

    for (const f of state.features) {
      if (f.text && !seenTexts.has(f.text)) {
        seenTexts.add(f.text)
        orderedFeatures.push({ text: f.text, category: f.category })
      }
    }
  }

  // Group by category
  for (const f of orderedFeatures) {
    const cat = f.category || ''
    if (!featuresByCategory[cat]) featuresByCategory[cat] = []
    featuresByCategory[cat].push(f.text)
  }

  // Build rows
  for (const [category, texts] of Object.entries(featuresByCategory)) {
    if (texts.length === 0) continue
    if (category) {
      rows.push({
        label: category,
        isCategory: true,
        planHas: {}
      })
    }
    for (const text of texts) {
      const planHas: Record<number, boolean> = {}
      for (const plan of mainPlans.value) {
        planHas[plan.id] = resolvedFeatures[plan.id]?.has(text) ?? false
      }
      rows.push({ label: text, isCategory: false, planHas })
    }
  }

  return rows
})

function resolveFeatures(planId: number, visited: Set<number> = new Set()): Set<string> {
  if (visited.has(planId)) return new Set()
  visited.add(planId)

  const state = form.value[planId]
  if (!state) return new Set()

  const features = new Set<string>()

  // Inherit from parent
  if (state.inherits_from) {
    const parentFeatures = resolveFeatures(state.inherits_from, visited)
    for (const f of parentFeatures) features.add(f)
  }

  // Add own features
  for (const f of state.features) {
    if (f.text) features.add(f.text)
  }

  return features
}

async function saveAll() {
  const plansPayload: PricingPlanUpdate[] = mainPlans.value.map(plan => ({
    id: plan.id,
    inherits_from: form.value[plan.id].inherits_from,
    features: form.value[plan.id].features
      .filter(f => f.text.trim() !== '')
      .map(f => ({
        text: f.text.trim(),
        category: f.category || null,
        icon: null,
        highlighted: f.highlighted
      }))
  }))

  try {
    const response = await plansStore.savePricing(plansPayload)
    if (response?.success) {
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Pricing table actualizada', life: 3000 })
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar pricing', life: 5000 })
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
  await plansStore.fetchPricing()
  initForm()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

watch(() => plansStore.pricingPlans, () => {
  if (plansStore.pricingPlans.length) initForm()
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
