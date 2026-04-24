<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import {
  assignPlugin,
  createPlugin,
  listAssignments,
  listPluginCatalog,
  removeAssignment,
  updateAssignment,
  type AssignPluginPayload,
  type PluginAssignment,
  type PluginCatalogEntry,
} from '@/api/plugins.api'

const toast = useToast()

const catalog = ref<PluginCatalogEntry[]>([])
const isLoadingCatalog = ref(false)

const tiendaIdInput = ref<number | null>(null)
const assignments = ref<PluginAssignment[]>([])
const isLoadingAssignments = ref(false)

const showAssignDialog = ref(false)
const assignForm = ref<AssignPluginPayload>({
  tienda_id: 0,
  plugin_id: 0,
  producto_id: null,
  categoria_id: null,
  config: {},
  activo: true,
})
const assignConfigText = ref('{}')

const showPluginDialog = ref(false)
const pluginForm = ref({
  slug: '',
  name: '',
  description: '',
  version: '1.0.0',
  slots: 'product-detail,cart-item',
  pricingMode: 'per_unit',
  configSchema: '{}',
  activo: true,
})

async function loadCatalog() {
  isLoadingCatalog.value = true
  try {
    const res = await listPluginCatalog()
    catalog.value = res.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message ?? 'No se pudo cargar el catálogo', life: 5000 })
  } finally {
    isLoadingCatalog.value = false
  }
}

async function loadAssignments() {
  if (!tiendaIdInput.value) return
  isLoadingAssignments.value = true
  try {
    const res = await listAssignments(tiendaIdInput.value)
    assignments.value = res.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message ?? 'No se pudo cargar las asignaciones', life: 5000 })
  } finally {
    isLoadingAssignments.value = false
  }
}

function openAssignDialog() {
  if (!tiendaIdInput.value) {
    toast.add({ severity: 'warn', summary: 'Tienda requerida', detail: 'Ingresa un tienda_id primero', life: 4000 })
    return
  }
  assignForm.value = {
    tienda_id: tiendaIdInput.value,
    plugin_id: catalog.value[0]?.plugin_id ?? 0,
    producto_id: null,
    categoria_id: null,
    config: {},
    activo: true,
  }
  assignConfigText.value = '{}'
  showAssignDialog.value = true
}

async function submitAssign() {
  try {
    const config = assignConfigText.value ? JSON.parse(assignConfigText.value) : {}
    await assignPlugin({ ...assignForm.value, config })
    toast.add({ severity: 'success', summary: 'Plugin asignado', life: 3000 })
    showAssignDialog.value = false
    await loadAssignments()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo asignar',
      detail: e?.message || e?.response?.data?.message || 'Error',
      life: 5000,
    })
  }
}

async function toggleAssignment(row: PluginAssignment) {
  try {
    await updateAssignment(row.assignment_id, { activo: !row.assignment_activo })
    toast.add({ severity: 'success', summary: 'Actualizado', life: 2000 })
    await loadAssignments()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message ?? 'Fallo la actualización', life: 4000 })
  }
}

async function deleteAssignment(row: PluginAssignment) {
  if (!confirm(`¿Desactivar asignación del plugin "${row.plugin_name}"?`)) return
  try {
    await removeAssignment(row.assignment_id)
    toast.add({ severity: 'success', summary: 'Desactivada', life: 2000 })
    await loadAssignments()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message ?? 'Fallo', life: 4000 })
  }
}

function openCreatePluginDialog() {
  pluginForm.value = {
    slug: '',
    name: '',
    description: '',
    version: '1.0.0',
    slots: 'product-detail,cart-item',
    pricingMode: 'per_unit',
    configSchema: '{}',
    activo: true,
  }
  showPluginDialog.value = true
}

async function submitCreatePlugin() {
  try {
    const slots = pluginForm.value.slots.split(',').map((s) => s.trim()).filter(Boolean)
    const configSchema = pluginForm.value.configSchema ? JSON.parse(pluginForm.value.configSchema) : null
    await createPlugin({
      slug: pluginForm.value.slug,
      name: pluginForm.value.name,
      description: pluginForm.value.description,
      version: pluginForm.value.version,
      slots,
      pricingMode: pluginForm.value.pricingMode,
      configSchema,
      activo: pluginForm.value.activo,
    } as any)
    toast.add({ severity: 'success', summary: 'Plugin creado', life: 3000 })
    showPluginDialog.value = false
    await loadCatalog()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.message || e?.response?.data?.message || 'Fallo', life: 5000 })
  }
}

const pluginOptions = computed(() =>
  catalog.value.map((p) => ({ label: `${p.plugin_name} (${p.plugin_slug})`, value: p.plugin_id })),
)

onMounted(loadCatalog)
</script>

<template>
  <div class="space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Plugins</h1>
        <p class="mt-1 text-sm text-gray-500">
          Catálogo de plugins de la plataforma y asignaciones por tienda.
        </p>
      </div>
      <Button label="Nuevo plugin" icon="pi pi-plus" @click="openCreatePluginDialog" />
    </header>

    <!-- Catálogo -->
    <section class="bg-white rounded-xl border border-gray-200">
      <div class="px-4 py-3 border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-900">Catálogo</h2>
      </div>
      <div v-if="isLoadingCatalog" class="flex justify-center py-10">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
      <DataTable v-else :value="catalog" stripedRows responsiveLayout="scroll">
        <Column field="plugin_id" header="ID" style="width: 4rem" />
        <Column field="plugin_slug" header="Slug" />
        <Column field="plugin_name" header="Nombre" />
        <Column header="Slots">
          <template #body="{ data }">
            <span class="text-xs text-gray-600">{{ Array.isArray(data.plugin_slots) ? data.plugin_slots.join(', ') : '—' }}</span>
          </template>
        </Column>
        <Column field="plugin_pricing_mode" header="Pricing" />
        <Column field="plugin_version" header="Versión" />
        <Column header="Activo">
          <template #body="{ data }">
            <span :class="data.plugin_activo ? 'text-emerald-600' : 'text-gray-400'">
              {{ data.plugin_activo ? 'Sí' : 'No' }}
            </span>
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- Asignaciones por tienda -->
    <section class="bg-white rounded-xl border border-gray-200">
      <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">Asignaciones por tienda</h2>
        <div class="flex items-center gap-2">
          <InputNumber v-model="tiendaIdInput" placeholder="tienda_id" :useGrouping="false" class="w-32" />
          <Button label="Buscar" icon="pi pi-search" severity="secondary" @click="loadAssignments" />
          <Button label="Asignar plugin" icon="pi pi-plus" :disabled="!tiendaIdInput" @click="openAssignDialog" />
        </div>
      </div>

      <div v-if="isLoadingAssignments" class="flex justify-center py-10">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>

      <div v-else-if="!tiendaIdInput" class="p-8 text-center text-sm text-gray-500">
        Ingresa un tienda_id para ver sus asignaciones.
      </div>

      <div v-else-if="assignments.length === 0" class="p-8 text-center text-sm text-gray-500">
        Esta tienda no tiene plugins asignados.
      </div>

      <DataTable v-else :value="assignments" stripedRows responsiveLayout="scroll">
        <Column field="assignment_id" header="ID" style="width: 4rem" />
        <Column field="plugin_slug" header="Plugin" />
        <Column header="Producto">
          <template #body="{ data }">
            {{ data.producto_id ?? 'todos' }}
          </template>
        </Column>
        <Column header="Categoría">
          <template #body="{ data }">
            {{ data.categoria_id ?? 'todas' }}
          </template>
        </Column>
        <Column header="Activo">
          <template #body="{ data }">
            <span :class="data.assignment_activo ? 'text-emerald-600' : 'text-gray-400'">
              {{ data.assignment_activo ? 'Sí' : 'No' }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 14rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button size="small" severity="secondary" :label="data.assignment_activo ? 'Desactivar' : 'Activar'" @click="toggleAssignment(data)" />
              <Button size="small" severity="danger" label="Eliminar" @click="deleteAssignment(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- Dialog: asignar plugin -->
    <Dialog
      v-model:visible="showAssignDialog"
      header="Asignar plugin a tienda"
      modal
      :style="{ width: '40rem' }"
      :pt="{
        header: { class: 'px-8 pt-6 pb-4' },
        content: { class: 'px-8 pb-6' },
        footer: { class: 'px-8 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-2' }
      }"
    >
      <div class="space-y-5 pt-2">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Plugin</label>
          <select v-model="assignForm.plugin_id" class="w-full rounded border border-gray-300 px-3 py-2 text-sm">
            <option v-for="opt in pluginOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">producto_id (opcional)</label>
          <InputNumber v-model="assignForm.producto_id" :useGrouping="false" class="w-full" inputClass="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">categoria_id (opcional)</label>
          <InputNumber v-model="assignForm.categoria_id" :useGrouping="false" class="w-full" inputClass="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Config inicial (JSON)</label>
          <Textarea v-model="assignConfigText" rows="6" class="w-full font-mono text-xs" />
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="assignForm.activo" binary />
          <span class="text-sm text-gray-700">Activar al crear</span>
        </label>
      </div>
      <template #footer>
        <Button severity="secondary" label="Cancelar" @click="showAssignDialog = false" />
        <Button label="Asignar" @click="submitAssign" />
      </template>
    </Dialog>

    <!-- Dialog: nuevo plugin -->
    <Dialog
      v-model:visible="showPluginDialog"
      header="Registrar nuevo plugin"
      modal
      :style="{ width: '45rem' }"
      :pt="{
        header: { class: 'px-8 pt-6 pb-4' },
        content: { class: 'px-8 pb-6' },
        footer: { class: 'px-8 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-2' }
      }"
    >
      <div class="grid grid-cols-2 gap-x-6 gap-y-5 pt-2">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Slug (único, kebab-case)</label>
          <InputText v-model="pluginForm.slug" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
          <InputText v-model="pluginForm.name" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <Textarea v-model="pluginForm.description" rows="2" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Versión</label>
          <InputText v-model="pluginForm.version" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Pricing mode</label>
          <select v-model="pluginForm.pricingMode" class="w-full rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="none">none</option>
            <option value="per_unit">per_unit</option>
            <option value="base_plus_addons">base_plus_addons</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Slots (coma-separado)</label>
          <InputText v-model="pluginForm.slots" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Config schema (JSON)</label>
          <Textarea v-model="pluginForm.configSchema" rows="6" class="w-full font-mono text-xs" />
        </div>
        <label class="col-span-2 flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="pluginForm.activo" binary />
          <span class="text-sm text-gray-700">Activo en el catálogo</span>
        </label>
      </div>
      <template #footer>
        <Button severity="secondary" label="Cancelar" @click="showPluginDialog = false" />
        <Button label="Crear" @click="submitCreatePlugin" />
      </template>
    </Dialog>
  </div>
</template>
