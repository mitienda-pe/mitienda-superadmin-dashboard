<template>
  <Dialog
    :visible="visible"
    :header="isEdit ? 'Editar broadcast' : 'Nuevo broadcast'"
    :modal="true"
    :style="{ width: '960px' }"
    :pt="{
      root: { class: 'broadcast-form-dialog' },
      header: { class: 'px-8 pt-6 pb-4' },
      content: { class: 'px-8 pb-6' },
      footer: { class: 'px-8 pb-6 pt-4 border-t border-gray-100' }
    }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pt-2">
      <!-- Formulario -->
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <RadioButton v-model="form.target_scope" inputId="scope-global" value="global" />
              <span>Global (todas las tiendas)</span>
            </label>
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <RadioButton v-model="form.target_scope" inputId="scope-stores" value="stores" />
              <span>Tiendas específicas</span>
            </label>
          </div>
        </div>

        <div v-if="form.target_scope === 'stores'" class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar y agregar</label>
            <AutoComplete
              v-model="storeQuery"
              :suggestions="storeSuggestions"
              optionLabel="name"
              placeholder="Buscar tienda por nombre..."
              class="w-full"
              inputClass="w-full"
              @complete="searchStoresHandler"
              @item-select="onStoreSelected"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">O pegar IDs</label>
            <div class="flex gap-2">
              <InputText
                v-model="pastedIds"
                placeholder="Ej: 1203, 1377, 9082"
                class="w-full"
                @keydown.enter.prevent="addPastedIds"
              />
              <Button
                label="Agregar"
                severity="secondary"
                outlined
                :loading="resolvingIds"
                :disabled="!pastedIds.trim()"
                @click="addPastedIds"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1.5">Separados por comas, espacios o saltos de línea.</p>
            <p v-if="missingIds.length" class="text-xs text-red-600 mt-1.5">
              <i class="pi pi-exclamation-triangle mr-1" />
              No existen y no se agregaron: {{ missingIds.join(', ') }}
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">
                {{ selectedStores.length }} {{ selectedStores.length === 1 ? 'tienda' : 'tiendas' }}
              </span>
              <button
                v-if="selectedStores.length"
                type="button"
                class="text-xs text-gray-500 hover:text-red-600"
                @click="selectedStores = []"
              >
                Quitar todas
              </button>
            </div>
            <div v-if="selectedStores.length" class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              <span
                v-for="st in selectedStores"
                :key="st.id"
                class="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 pl-2.5 pr-1 py-0.5 text-xs text-gray-700"
              >
                {{ st.nombre || 'Tienda' }} <span class="text-gray-400">#{{ st.id }}</span>
                <button
                  type="button"
                  class="ml-0.5 rounded-full w-4 h-4 inline-flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50"
                  :aria-label="'Quitar ' + (st.nombre || st.id)"
                  @click="removeStore(st.id)"
                >
                  <i class="pi pi-times" style="font-size: 0.6rem" />
                </button>
              </span>
            </div>
            <p v-else class="text-xs text-gray-500">Todavía no agregaste tiendas.</p>
          </div>
        </div>

        <div v-if="form.target_scope === 'global'" class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-4">
          <p class="text-xs font-medium text-gray-600 uppercase tracking-wide">Filtros de audiencia</p>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label
                v-for="plan in planOptions"
                :key="plan.value"
                class="inline-flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  v-model="form.target_plans"
                  :inputId="`plan-${plan.value}`"
                  :value="plan.value"
                />
                <span>{{ plan.label }}</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-1.5">
              Vacío = todos los planes.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Vigencia del plan</label>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label
                v-for="opt in targetStatusOptions"
                :key="opt.value"
                class="inline-flex items-center gap-2 text-sm cursor-pointer"
              >
                <RadioButton
                  v-model="form.target_status"
                  :inputId="`tgt-${opt.value}`"
                  :value="opt.value"
                />
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <p class="text-xs text-gray-600 italic">
            <i class="pi pi-users mr-1" />
            {{ audienceSummary }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Título *</label>
          <InputText v-model="form.title" maxlength="200" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Mensaje *</label>
          <Textarea v-model="form.body" rows="5" class="w-full font-mono text-sm" autoResize />
          <p class="text-xs text-gray-500 mt-1.5">
            Markdown soportado: <code>**negrita**</code>, <code>*cursiva*</code>, listas con <code>- item</code>,
            enlaces <code>[texto](url)</code>, <code>`código`</code>.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <RadioButton v-model="form.placement" inputId="pl-bar" value="bar" />
                <span>Barra</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <RadioButton v-model="form.placement" inputId="pl-modal" value="modal" />
                <span>Modal</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Severidad *</label>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <RadioButton v-model="form.severity" inputId="sv-info" value="info" />
                <span>Anuncio</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <RadioButton v-model="form.severity" inputId="sv-warning" value="warning" />
                <span>Warning</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <RadioButton v-model="form.severity" inputId="sv-danger" value="danger" />
                <span>Danger</span>
              </label>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Publicación *</label>
            <Calendar
              v-model="publishedAtDate"
              showTime
              hourFormat="24"
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Expiración *</label>
            <Calendar
              v-model="expiresAtDate"
              showTime
              hourFormat="24"
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
          <div class="flex items-center gap-3">
            <InputSwitch v-model="form.is_dismissible" inputId="switch-dismiss" />
            <label for="switch-dismiss" class="text-sm text-gray-700 cursor-pointer">
              Cerrable por el usuario
            </label>
          </div>
          <p v-if="!form.is_dismissible" class="text-xs text-orange-600 flex items-center gap-1">
            <i class="pi pi-lock" />
            El mensaje será bloqueante hasta su fecha de expiración.
          </p>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Se puede cerrar</label>
              <Dropdown
                v-model="delayChoice"
                :options="delayOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Después de cerrarlo</label>
              <Dropdown
                v-model="reshowChoice"
                :options="reshowOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
            <p class="sm:col-span-2 text-xs text-gray-600 italic">
              <i class="pi pi-info-circle mr-1" />
              {{ dismissSummary }}
            </p>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-5 space-y-3">
          <p class="text-sm font-medium text-gray-700">CTA (opcional)</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputText v-model="form.cta_label" placeholder="Texto del botón" maxlength="100" class="w-full" />
            <InputText v-model="form.cta_url" placeholder="https://..." maxlength="500" class="w-full" />
          </div>
        </div>

        <div v-if="form.placement === 'modal'" class="border-t border-gray-200 pt-5 space-y-2">
          <label class="block text-sm font-medium text-gray-700">Imagen (URL)</label>
          <InputText v-model="form.image_url" placeholder="https://..." maxlength="500" class="w-full" />
        </div>

        <div class="flex items-center gap-3 pt-2 border-t border-gray-200">
          <InputSwitch v-model="form.activo" inputId="switch-activo" />
          <label for="switch-activo" class="text-sm text-gray-700 cursor-pointer">Activo</label>
        </div>

        <div v-if="validationError" class="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {{ validationError }}
        </div>
      </div>

      <!-- Preview -->
      <div class="space-y-3 md:sticky md:top-0 md:self-start">
        <p class="text-sm font-medium text-gray-700">Vista previa</p>
        <div v-if="form.placement === 'bar'" class="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <div :class="['px-4 py-3 flex items-center gap-3 text-sm', barClasses]">
            <i :class="severityIcon" class="text-base shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold">{{ form.title || 'Título del anuncio' }}</div>
              <div
                class="opacity-90 broadcast-preview-bar"
                v-html="form.body ? renderInlineMd(form.body) : 'Contenido del anuncio'"
              />
            </div>
            <a v-if="form.cta_label && form.cta_url" class="shrink-0 px-3 py-1 bg-white/20 rounded text-white text-xs font-medium">
              {{ form.cta_label }}
            </a>
            <span v-if="form.is_dismissible && form.dismiss_delay_seconds" class="shrink-0 inline-flex items-center gap-1 text-xs opacity-80 tabular-nums">
              <i class="pi pi-clock text-xs" /> {{ formatCountdown(form.dismiss_delay_seconds) }}
            </span>
            <i v-else-if="form.is_dismissible" class="pi pi-times opacity-70 shrink-0" />
            <i v-else class="pi pi-lock opacity-70 shrink-0" title="Bloqueante" />
          </div>
        </div>

        <div v-else class="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
          <img v-if="form.image_url" :src="form.image_url" class="w-full max-h-48 object-cover" />
          <div class="p-5">
            <div :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mb-3', severityBadgeClasses]">
              <i :class="severityIcon" />
              {{ severityLabel }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{{ form.title || 'Título del modal' }}</h3>
            <div
              class="text-sm text-gray-600 mt-2 broadcast-preview-modal"
              v-html="form.body ? renderBlockMd(form.body) : 'Contenido del modal'"
            />
            <div v-if="form.cta_label" class="mt-5 flex items-center justify-end gap-2">
              <span class="inline-flex items-center gap-2 rounded-md bg-[#00b2a6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
                {{ form.cta_label }}
              </span>
            </div>
            <p v-if="!form.is_dismissible" class="text-xs text-orange-600 mt-4 flex items-center gap-1">
              <i class="pi pi-lock" /> Mensaje bloqueante — el usuario no podrá cerrarlo.
            </p>
            <p v-else-if="form.dismiss_delay_seconds" class="text-xs text-gray-500 mt-4 flex items-center gap-1 tabular-nums">
              <i class="pi pi-clock" /> Podrás cerrar este aviso en {{ formatCountdown(form.dismiss_delay_seconds) }}
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
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import InputSwitch from 'primevue/inputswitch'
import AutoComplete from 'primevue/autocomplete'
import Dropdown from 'primevue/dropdown'
import { getStoresList } from '@/api/stores.api'
import { resolveBroadcastStores } from '@/api/broadcasts.api'
import type { StoreListItem } from '@/types/store.types'
import type {
  Broadcast,
  BroadcastFormInput,
  BroadcastPlanSlug,
  BroadcastStoreRef,
  BroadcastTargetStatus
} from '@/types/broadcast.types'
import { BROADCAST_PLAN_LABELS, BROADCAST_TARGET_STATUS_LABELS } from '@/types/broadcast.types'
import {
  renderBroadcastMarkdownInline,
  renderBroadcastMarkdownBlock
} from '@/utils/broadcast-markdown'

const renderInlineMd = renderBroadcastMarkdownInline
const renderBlockMd = renderBroadcastMarkdownBlock

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
  target_scope: 'global',
  tienda_ids: [],
  target_plans: [],
  target_status: 'all',
  title: '',
  body: '',
  placement: 'bar',
  severity: 'info',
  is_dismissible: true,
  dismiss_delay_seconds: null,
  reshow_after_minutes: null,
  cta_label: null,
  cta_url: null,
  image_url: null,
  published_at: formatDate(new Date()),
  expires_at: formatDate(addDays(new Date(), 7)),
  activo: true
})

const planOptions: { value: BroadcastPlanSlug; label: string }[] = (
  Object.keys(BROADCAST_PLAN_LABELS) as BroadcastPlanSlug[]
).map((value) => ({ value, label: BROADCAST_PLAN_LABELS[value] }))

const targetStatusOptions: { value: BroadcastTargetStatus; label: string }[] = (
  Object.keys(BROADCAST_TARGET_STATUS_LABELS) as BroadcastTargetStatus[]
).map((value) => ({ value, label: BROADCAST_TARGET_STATUS_LABELS[value] }))

// El Dropdown de PrimeVue 3 no muestra como elegida una opción con valor null,
// así que en el select "de inmediato" es 0 y "no vuelve" es -1; el form
// guarda null en ambos casos.
type TimingOption = { label: string; value: number }
const RESHOW_NEVER = -1

const DELAY_PRESETS: TimingOption[] = [
  { label: 'De inmediato', value: 0 },
  { label: 'A los 15 segundos', value: 15 },
  { label: 'A los 30 segundos', value: 30 },
  { label: 'Al minuto', value: 60 },
  { label: 'A los 2 minutos', value: 120 },
  { label: 'A los 3 minutos', value: 180 },
  { label: 'A los 5 minutos', value: 300 }
]
const RESHOW_PRESETS: TimingOption[] = [
  { label: 'No vuelve a aparecer', value: RESHOW_NEVER },
  { label: 'Reaparece en cada pantalla', value: 0 },
  { label: 'Reaparece a los 10 min', value: 10 },
  { label: 'Reaparece a los 30 min', value: 30 },
  { label: 'Reaparece cada hora', value: 60 },
  { label: 'Reaparece cada 4 horas', value: 240 },
  { label: 'Reaparece una vez al día', value: 1440 }
]

const form = ref<BroadcastFormInput>(emptyForm())
const selectedStores = ref<BroadcastStoreRef[]>([])
const storeQuery = ref<{ id: number; name: string; nombre: string } | string | null>(null)
const storeSuggestions = ref<Array<{ id: number; name: string; nombre: string }>>([])
const pastedIds = ref('')
const missingIds = ref<number[]>([])
const resolvingIds = ref(false)
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

watch(() => form.value.target_scope, (s) => {
  if (s === 'stores') {
    // Targeting (plan/vigencia) no aplica a tiendas específicas
    form.value.target_plans = []
    form.value.target_status = 'all'
  }
})

watch(() => form.value.is_dismissible, (d) => {
  if (!d) {
    form.value.dismiss_delay_seconds = null
    form.value.reshow_after_minutes = null
  }
})

const delayChoice = computed<number>({
  get: () => form.value.dismiss_delay_seconds ?? 0,
  set: (v) => { form.value.dismiss_delay_seconds = v > 0 ? v : null }
})
const reshowChoice = computed<number>({
  get: () => form.value.reshow_after_minutes ?? RESHOW_NEVER,
  set: (v) => { form.value.reshow_after_minutes = v === RESHOW_NEVER ? null : v }
})

/** Opciones con el valor guardado incluido aunque no sea uno de los presets. */
function withCurrent(presets: TimingOption[], current: number, label: (v: number) => string) {
  if (presets.some((o) => o.value === current)) return presets
  return [...presets, { label: label(current), value: current }]
}
const delayOptions = computed(() =>
  withCurrent(DELAY_PRESETS, delayChoice.value, (v) => `A los ${v} segundos`)
)
const reshowOptions = computed(() =>
  withCurrent(RESHOW_PRESETS, reshowChoice.value, (v) => `Reaparece a los ${v} min`)
)

const dismissSummary = computed(() => {
  const delay = form.value.dismiss_delay_seconds
  const reshow = form.value.reshow_after_minutes
  const wait = delay ? `debe tenerlo a la vista ${formatCountdown(delay)} antes de cerrarlo` : 'puede cerrarlo de inmediato'
  const back = reshow === null
    ? 'y no vuelve a verlo'
    : reshow === 0
      ? 'y vuelve a aparecer en cada pantalla que abra'
      : `y vuelve a aparecer ${RESHOW_PRESETS.find((o) => o.value === reshow)?.label.replace('Reaparece ', '') ?? `a los ${reshow} min`}`
  return `El usuario ${wait}, ${back}.`
})

function onStoreSelected(ev: { value: { id: number; nombre: string } }) {
  addStores([{ id: ev.value.id, nombre: ev.value.nombre }])
  storeQuery.value = null
}

function addStores(stores: BroadcastStoreRef[]) {
  const known = new Set(selectedStores.value.map((s) => s.id))
  const fresh = stores.filter((s) => !known.has(s.id))
  if (fresh.length) selectedStores.value = [...selectedStores.value, ...fresh]
}

function removeStore(id: number) {
  selectedStores.value = selectedStores.value.filter((s) => s.id !== id)
}

async function addPastedIds() {
  const ids = [...new Set(
    pastedIds.value
      .split(/[\s,;]+/)
      .filter((t) => /^\d+$/.test(t))
      .map(Number)
      .filter((n) => n > 0)
  )]
  missingIds.value = []
  if (!ids.length) return
  resolvingIds.value = true
  try {
    const res = await resolveBroadcastStores(ids)
    if (res.success) {
      addStores(res.data.found)
      missingIds.value = res.data.missing
      pastedIds.value = res.data.missing.join(', ')
    } else {
      validationError.value = res.message || 'No se pudieron validar los IDs'
    }
  } catch (e: any) {
    validationError.value = e?.response?.data?.message || 'No se pudieron validar los IDs'
  } finally {
    resolvingIds.value = false
  }
}

watch(() => form.value.placement, (p) => {
  if (p === 'bar') form.value.image_url = null
})

function resetFromRecord(r: Broadcast | null) {
  if (r) {
    form.value = {
      target_scope: r.target_scope ?? 'global',
      tienda_ids: [...(r.tienda_ids ?? [])],
      target_plans: r.target_plans ? [...r.target_plans] : [],
      target_status: r.target_status ?? 'all',
      title: r.title,
      body: r.body,
      placement: r.placement,
      severity: r.severity,
      is_dismissible: !!r.is_dismissible,
      dismiss_delay_seconds: r.dismiss_delay_seconds ?? null,
      reshow_after_minutes: r.reshow_after_minutes ?? null,
      cta_label: r.cta_label,
      cta_url: r.cta_url,
      image_url: r.image_url,
      published_at: r.published_at,
      expires_at: r.expires_at,
      activo: !!r.activo
    }
    publishedAtDate.value = new Date(r.published_at.replace(' ', 'T'))
    expiresAtDate.value = new Date(r.expires_at.replace(' ', 'T'))
    selectedStores.value = (r.tiendas ?? []).map((t) => ({ ...t }))
  } else {
    form.value = emptyForm()
    publishedAtDate.value = new Date()
    expiresAtDate.value = addDays(new Date(), 7)
    selectedStores.value = []
  }
  storeQuery.value = null
  pastedIds.value = ''
  missingIds.value = []
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
        nombre: s.name,
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
  const isGlobal = f.target_scope === 'global'
  if (!isGlobal && selectedStores.value.length === 0) {
    return (validationError.value = 'Agregá al menos una tienda o cambiá a alcance global')
  }
  if (new Date(f.expires_at) <= new Date(f.published_at)) {
    return (validationError.value = 'La fecha de expiración debe ser posterior a la de publicación')
  }
  const hasLabel = !!(f.cta_label && f.cta_label.trim())
  const hasUrl = !!(f.cta_url && f.cta_url.trim())
  if (hasLabel !== hasUrl) {
    return (validationError.value = 'El CTA requiere tanto texto como URL')
  }

  const targetPlans = isGlobal && f.target_plans && f.target_plans.length > 0
    ? f.target_plans
    : null
  const targetStatus = isGlobal ? f.target_status : 'all'

  emit('submit', {
    ...f,
    tienda_ids: isGlobal ? [] : selectedStores.value.map((s) => s.id),
    target_plans: targetPlans,
    target_status: targetStatus,
    dismiss_delay_seconds: f.is_dismissible ? f.dismiss_delay_seconds : null,
    reshow_after_minutes: f.is_dismissible ? f.reshow_after_minutes : null,
    title: f.title.trim(),
    body: f.body.trim(),
    cta_label: hasLabel ? f.cta_label!.trim() : null,
    cta_url: hasUrl ? f.cta_url!.trim() : null,
    image_url: f.placement === 'modal' && f.image_url ? f.image_url.trim() : null
  })
}

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
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

const audienceSummary = computed(() => {
  const plans = form.value.target_plans ?? []
  const plansLabel = plans.length === 0
    ? 'todos los planes'
    : plans.map((p) => BROADCAST_PLAN_LABELS[p]).join(', ')
  const statusLabel = ({
    all: 'cualquier vigencia',
    active: 'plan activo',
    expired: 'plan vencido'
  })[form.value.target_status]
  return `Llega a tiendas con ${plansLabel} (${statusLabel}).`
})
</script>

<style scoped>
:deep(.p-radiobutton .p-radiobutton-box) {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  background: #fff;
  transition: border-color 0.15s ease, background 0.15s ease;
}
:deep(.p-radiobutton:hover .p-radiobutton-box) {
  border-color: #00b2a6;
}
:deep(.p-radiobutton.p-highlight .p-radiobutton-box),
:deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
  border-color: #00b2a6;
  background: #00b2a6;
}
:deep(.p-radiobutton .p-radiobutton-box .p-radiobutton-icon) {
  background: #fff;
}

:deep(.p-checkbox .p-checkbox-box) {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  background: #fff;
  border-radius: 4px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
:deep(.p-checkbox:hover .p-checkbox-box) {
  border-color: #00b2a6;
}
:deep(.p-checkbox.p-highlight .p-checkbox-box),
:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  border-color: #00b2a6;
  background: #00b2a6;
}

/* Preview bar (markdown inline) */
.broadcast-preview-bar :deep(a) { text-decoration: underline; }
.broadcast-preview-bar :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  padding: 0 4px;
  border-radius: 3px;
  font-size: 0.85em;
}

/* Preview modal (markdown block) */
.broadcast-preview-modal :deep(p) { margin: 0 0 0.75rem; }
.broadcast-preview-modal :deep(p:last-child) { margin-bottom: 0; }
.broadcast-preview-modal :deep(ul),
.broadcast-preview-modal :deep(ol) { margin: 0 0 0.75rem; padding-left: 1.25rem; }
.broadcast-preview-modal :deep(ul) { list-style: disc; }
.broadcast-preview-modal :deep(ol) { list-style: decimal; }
.broadcast-preview-modal :deep(li) { margin: 0.15rem 0; }
.broadcast-preview-modal :deep(strong) { font-weight: 600; color: #111827; }
.broadcast-preview-modal :deep(a) { color: #00b2a6; text-decoration: underline; }
.broadcast-preview-modal :deep(code) {
  background: #f3f4f6;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.85em;
}
.broadcast-preview-modal :deep(blockquote) {
  border-left: 3px solid #e5e7eb;
  padding-left: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.75rem;
}
</style>
