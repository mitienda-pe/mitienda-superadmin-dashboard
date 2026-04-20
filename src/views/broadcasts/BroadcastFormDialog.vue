<template>
  <Dialog
    :visible="visible"
    :header="isEdit ? 'Editar broadcast' : 'Nuevo broadcast'"
    :modal="true"
    :style="{ width: '900px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Formulario -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alcance</label>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-2 text-sm">
              <RadioButton v-model="scopeLocal" inputId="scope-global" value="global" />
              <span>Global (todas las tiendas)</span>
            </label>
            <label class="inline-flex items-center gap-2 text-sm">
              <RadioButton v-model="scopeLocal" inputId="scope-tenant" value="tenant" />
              <span>Tienda específica</span>
            </label>
          </div>
        </div>

        <div v-if="scopeLocal === 'tenant'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Tienda</label>
          <AutoComplete
            v-model="selectedStore"
            :suggestions="storeSuggestions"
            optionLabel="name"
            placeholder="Buscar tienda por nombre..."
            class="w-full"
            @complete="searchStoresHandler"
          />
          <p v-if="selectedStore?.id" class="text-xs text-gray-500 mt-1">
            ID: {{ selectedStore.id }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <InputText v-model="form.title" maxlength="200" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
          <Textarea v-model="form.body" rows="4" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-2 text-sm">
                <RadioButton v-model="form.placement" inputId="pl-bar" value="bar" />
                <span>Barra</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm">
                <RadioButton v-model="form.placement" inputId="pl-modal" value="modal" />
                <span>Modal</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Severidad *</label>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-2 text-sm">
                <RadioButton v-model="form.severity" inputId="sv-info" value="info" />
                <span>Anuncio</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm">
                <RadioButton v-model="form.severity" inputId="sv-warning" value="warning" />
                <span>Warning</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm">
                <RadioButton v-model="form.severity" inputId="sv-danger" value="danger" />
                <span>Danger</span>
              </label>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Publicación *</label>
            <Calendar
              v-model="publishedAtDate"
              showTime
              hourFormat="24"
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Expiración *</label>
            <Calendar
              v-model="expiresAtDate"
              showTime
              hourFormat="24"
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <InputSwitch v-model="form.is_dismissible" inputId="switch-dismiss" />
          <label for="switch-dismiss" class="text-sm text-gray-700">
            Cerrable por el usuario
          </label>
        </div>
        <p v-if="!form.is_dismissible" class="text-xs text-orange-600 -mt-2">
          El mensaje será bloqueante hasta su fecha de expiración.
        </p>

        <div class="border-t border-gray-200 pt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">CTA (opcional)</p>
          <div class="grid grid-cols-2 gap-4">
            <InputText v-model="form.cta_label" placeholder="Texto del botón" maxlength="100" class="w-full" />
            <InputText v-model="form.cta_url" placeholder="https://..." maxlength="500" class="w-full" />
          </div>
        </div>

        <div v-if="form.placement === 'modal'" class="border-t border-gray-200 pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
          <InputText v-model="form.image_url" placeholder="https://..." maxlength="500" class="w-full" />
        </div>

        <div class="flex items-center gap-2">
          <InputSwitch v-model="form.activo" inputId="switch-activo" />
          <label for="switch-activo" class="text-sm text-gray-700">Activo</label>
        </div>

        <div v-if="validationError" class="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {{ validationError }}
        </div>
      </div>

      <!-- Preview -->
      <div class="space-y-3">
        <p class="text-sm font-medium text-gray-700">Vista previa</p>
        <div v-if="form.placement === 'bar'" class="rounded-lg overflow-hidden border border-gray-200">
          <div :class="['px-4 py-3 flex items-center gap-3 text-sm', barClasses]">
            <i :class="severityIcon" />
            <div class="flex-1">
              <div class="font-semibold">{{ form.title || 'Título del anuncio' }}</div>
              <div class="opacity-90">{{ form.body || 'Contenido del anuncio' }}</div>
            </div>
            <a v-if="form.cta_label && form.cta_url" class="px-3 py-1 bg-white/20 rounded text-white text-xs font-medium">
              {{ form.cta_label }}
            </a>
            <i v-if="form.is_dismissible" class="pi pi-times opacity-70" />
            <i v-else class="pi pi-lock opacity-70" title="Bloqueante" />
          </div>
        </div>

        <div v-else class="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <img v-if="form.image_url" :src="form.image_url" class="w-full max-h-48 object-cover" />
          <div class="p-4 bg-white">
            <div :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mb-2', severityBadgeClasses]">
              <i :class="severityIcon" />
              {{ severityLabel }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{{ form.title || 'Título del modal' }}</h3>
            <p class="text-sm text-gray-600 mt-2 whitespace-pre-line">{{ form.body || 'Contenido del modal' }}</p>
            <div class="mt-4 flex items-center justify-end gap-2">
              <Button v-if="form.is_dismissible" label="Cerrar" severity="secondary" text />
              <Button v-if="form.cta_label" :label="form.cta_label || 'Acción'" />
            </div>
            <p v-if="!form.is_dismissible" class="text-xs text-orange-600 mt-3">
              <i class="pi pi-lock mr-1" /> Mensaje bloqueante — el usuario no podrá cerrarlo.
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        text
        :disabled="saving"
        @click="$emit('update:visible', false)"
      />
      <Button
        :label="isEdit ? 'Guardar cambios' : 'Crear broadcast'"
        :loading="saving"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Calendar from 'primevue/calendar'
import InputSwitch from 'primevue/inputswitch'
import AutoComplete from 'primevue/autocomplete'
import { getStoresList } from '@/api/stores.api'
import type { StoreListItem } from '@/types/store.types'
import type { Broadcast, BroadcastFormInput } from '@/types/broadcast.types'

interface Props {
  visible: boolean
  record: Broadcast | null
  saving: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', payload: BroadcastFormInput): void
}>()

const isEdit = computed(() => !!props.record?.id)

const emptyForm = (): BroadcastFormInput => ({
  tienda_id: null,
  title: '',
  body: '',
  placement: 'bar',
  severity: 'info',
  is_dismissible: true,
  cta_label: null,
  cta_url: null,
  image_url: null,
  published_at: formatDate(new Date()),
  expires_at: formatDate(addDays(new Date(), 7)),
  activo: true
})

const form = ref<BroadcastFormInput>(emptyForm())
const scopeLocal = ref<'global' | 'tenant'>('global')
const selectedStore = ref<{ id: number; name: string } | null>(null)
const storeSuggestions = ref<Array<{ id: number; name: string }>>([])
const publishedAtDate = ref<Date>(new Date())
const expiresAtDate = ref<Date>(addDays(new Date(), 7))
const validationError = ref<string | null>(null)

watch(
  () => props.visible,
  (open) => {
    if (open) {
      resetFromRecord(props.record)
    } else {
      validationError.value = null
    }
  }
)

watch(
  () => props.record,
  (r) => {
    if (props.visible) resetFromRecord(r)
  }
)

watch(publishedAtDate, (d) => { if (d) form.value.published_at = formatDate(d) })
watch(expiresAtDate,   (d) => { if (d) form.value.expires_at = formatDate(d) })

watch(scopeLocal, (s) => {
  if (s === 'global') {
    selectedStore.value = null
    form.value.tienda_id = null
  }
})

watch(selectedStore, (s) => {
  form.value.tienda_id = s?.id ?? null
})

watch(() => form.value.placement, (p) => {
  if (p === 'bar') form.value.image_url = null
})

function resetFromRecord(r: Broadcast | null) {
  if (r) {
    form.value = {
      tienda_id: r.tienda_id,
      title: r.title,
      body: r.body,
      placement: r.placement,
      severity: r.severity,
      is_dismissible: !!r.is_dismissible,
      cta_label: r.cta_label,
      cta_url: r.cta_url,
      image_url: r.image_url,
      published_at: r.published_at,
      expires_at: r.expires_at,
      activo: !!r.activo
    }
    publishedAtDate.value = new Date(r.published_at.replace(' ', 'T'))
    expiresAtDate.value = new Date(r.expires_at.replace(' ', 'T'))
    scopeLocal.value = r.tienda_id ? 'tenant' : 'global'
    selectedStore.value = r.tienda_id
      ? { id: r.tienda_id, name: r.tienda_nombre || `Tienda #${r.tienda_id}` }
      : null
  } else {
    form.value = emptyForm()
    publishedAtDate.value = new Date()
    expiresAtDate.value = addDays(new Date(), 7)
    scopeLocal.value = 'global'
    selectedStore.value = null
  }
  validationError.value = null
}

async function searchStoresHandler(ev: { query: string }) {
  if (!ev.query || ev.query.length < 2) {
    storeSuggestions.value = []
    return
  }
  try {
    const res = await getStoresList({ search: ev.query, per_page: 15 })
    if (res.success) {
      storeSuggestions.value = (res.data || []).map((s: StoreListItem) => ({
        id: s.id,
        name: `${s.name} (ID ${s.id})`
      }))
    }
  } catch {
    storeSuggestions.value = []
  }
}

function handleSubmit() {
  validationError.value = null
  const f = form.value

  if (!f.title.trim()) return (validationError.value = 'El título es requerido')
  if (!f.body.trim()) return (validationError.value = 'El mensaje es requerido')
  if (scopeLocal.value === 'tenant' && !f.tienda_id) {
    return (validationError.value = 'Seleccioná una tienda o cambiá a alcance global')
  }
  if (new Date(f.expires_at) <= new Date(f.published_at)) {
    return (validationError.value = 'La fecha de expiración debe ser posterior a la de publicación')
  }
  const hasLabel = !!(f.cta_label && f.cta_label.trim())
  const hasUrl = !!(f.cta_url && f.cta_url.trim())
  if (hasLabel !== hasUrl) {
    return (validationError.value = 'El CTA requiere tanto texto como URL')
  }

  emit('submit', {
    ...f,
    title: f.title.trim(),
    body: f.body.trim(),
    cta_label: hasLabel ? f.cta_label!.trim() : null,
    cta_url: hasUrl ? f.cta_url!.trim() : null,
    image_url: f.placement === 'modal' && f.image_url ? f.image_url.trim() : null
  })
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}
function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

const severityIcon = computed(() => {
  switch (form.value.severity) {
    case 'danger': return 'pi pi-exclamation-circle'
    case 'warning': return 'pi pi-exclamation-triangle'
    default: return 'pi pi-megaphone'
  }
})
const severityLabel = computed(() => ({
  info: 'Anuncio',
  warning: 'Advertencia',
  danger: 'Crítico'
})[form.value.severity])

const barClasses = computed(() => ({
  info: 'bg-[#00b2a6] text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-600 text-white'
})[form.value.severity])

const severityBadgeClasses = computed(() => ({
  info: 'bg-teal-100 text-teal-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800'
})[form.value.severity])
</script>
