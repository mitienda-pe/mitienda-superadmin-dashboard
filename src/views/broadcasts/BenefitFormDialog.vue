<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    :header="isEdit ? 'Editar beneficio' : 'Nuevo beneficio'"
    :modal="true"
    :style="{ width: '960px' }"
    :breakpoints="{ '1000px': '95vw' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pt-2">
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <RadioButton v-model="form.kind" inputId="kind-partner" value="partner" /> Partner
            </label>
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <RadioButton v-model="form.kind" inputId="kind-own" value="own_app" /> App propia (POS, Kiosco…)
            </label>
          </div>
        </div>

        <div v-if="form.kind === 'own_app'">
          <label class="block text-sm font-medium text-gray-700 mb-2">Ocultar a quien ya la usa</label>
          <Dropdown
            v-model="hideChoice"
            :options="hideOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel text="Partner o app *" :value="form.partner_name" :max="LIMITS.partner_name" />
            <InputText v-model="form.partner_name" :maxlength="LIMITS.partner_name" placeholder="Doppler" class="w-full" />
          </div>
          <div>
            <FieldLabel text="Código (opcional)" :value="form.promo_code ?? ''" :max="LIMITS.promo_code" />
            <InputText v-model="form.promo_code" :maxlength="LIMITS.promo_code" placeholder="MITIENDA20" class="w-full" />
          </div>
        </div>

        <div>
          <FieldLabel text="Título *" :value="form.title" :max="LIMITS.title" />
          <InputText v-model="form.title" :maxlength="LIMITS.title" class="w-full" />
        </div>

        <div>
          <FieldLabel text="Texto *" :value="form.body" :max="LIMITS.body" />
          <Textarea v-model="form.body" :maxlength="LIMITS.body" rows="3" autoResize class="w-full" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
          <div>
            <FieldLabel text="Botón *" :value="form.cta_label" :max="LIMITS.cta_label" />
            <InputText v-model="form.cta_label" :maxlength="LIMITS.cta_label" placeholder="Activar" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Enlace del botón *</label>
            <InputText v-model="form.cta_url" placeholder="https://…?utm_source=mitienda" maxlength="500" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Imagen (URL)</label>
          <InputText v-model="form.image_url" placeholder="https://…" maxlength="500" class="w-full" />
          <p class="text-xs text-gray-500 mt-1.5">260×200 px (se ve a 130×100). JPG, PNG o WebP, hasta 150 KB.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Dónde aparece</label>
          <div class="space-y-2">
            <label v-for="(label, slot) in BENEFIT_SLOT_LABELS" :key="slot" class="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox v-model="form.slots" :inputId="`slot-${slot}`" :value="slot" />
              <span>{{ label }}</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-1.5">Siempre aparece en la página "Beneficios", marques o no.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Desde *</label>
            <Calendar v-model="publishedAtDate" showTime hourFormat="24" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <Calendar v-model="expiresAtDate" showTime hourFormat="24" dateFormat="yy-mm-dd" showButtonBar class="w-full" />
            <p class="text-xs text-gray-500 mt-1.5">Vacío = sin fecha de fin.</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
          <Dropdown v-model="form.weight" :options="weightOptions" optionLabel="label" optionValue="value" class="w-full" />
          <p class="text-xs text-gray-500 mt-1.5">Cuando varios beneficios comparten un espacio, rotan según esto.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <RadioButton v-model="form.target_scope" inputId="scope-global" value="global" /> Todas las tiendas
            </label>
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <RadioButton v-model="form.target_scope" inputId="scope-stores" value="stores" /> Una lista de tiendas
            </label>
          </div>
          <div v-if="form.target_scope === 'stores'" class="mt-3 space-y-2">
            <div class="flex gap-2">
              <InputText v-model="pastedIds" placeholder="IDs: 12, 34, 56" class="flex-1" @keydown.enter.prevent="addPastedIds" />
              <Button label="Agregar" severity="secondary" :loading="resolvingIds" @click="addPastedIds" />
            </div>
            <p v-if="missingIds.length" class="text-xs text-red-600">No existen y no se agregaron: {{ missingIds.join(', ') }}</p>
            <div v-if="selectedStores.length" class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              <span
                v-for="st in selectedStores"
                :key="st.id"
                class="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 pl-2.5 pr-1 py-0.5 text-xs text-gray-700"
              >
                {{ st.nombre || 'Tienda' }} <span class="text-gray-400">#{{ st.id }}</span>
                <button
                  type="button"
                  class="ml-0.5 rounded-full w-4 h-4 inline-flex items-center justify-center text-gray-400 hover:text-red-600"
                  :aria-label="'Quitar ' + (st.nombre || st.id)"
                  @click="selectedStores = selectedStores.filter((s) => s.id !== st.id)"
                >
                  <i class="pi pi-times" style="font-size: 0.6rem" />
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista previa -->
      <div class="space-y-6 md:sticky md:top-0 self-start">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Inicio y pantallas</p>
          <div class="rounded-lg border border-gray-200 bg-white p-3 flex gap-3">
            <div class="w-[130px] h-[100px] shrink-0 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
              <img v-if="form.image_url" :src="form.image_url" alt="" class="w-full h-full object-cover" />
              <i v-else class="pi pi-image text-gray-300 text-2xl" />
            </div>
            <div class="min-w-0 flex flex-col">
              <span class="text-[10px] uppercase tracking-wide text-gray-400">Beneficio · {{ form.partner_name || 'Partner' }}</span>
              <span class="text-sm font-semibold text-gray-900 leading-snug mt-0.5">{{ form.title || 'Título del beneficio' }}</span>
              <span class="text-xs text-gray-600 leading-snug mt-1">{{ form.body || 'Texto breve del beneficio.' }}</span>
              <div class="mt-auto pt-2 flex flex-wrap items-center gap-2">
                <span v-if="form.promo_code" class="px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-[11px] font-mono text-gray-700">
                  {{ form.promo_code }}
                </span>
                <span class="text-xs font-medium text-[#00b2a6]">{{ form.cta_label || 'Botón' }} →</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="form.slots.includes('sidebar')">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Menú lateral</p>
          <div class="w-[232px] rounded-lg border border-gray-200 bg-white p-2.5">
            <div class="flex gap-2.5">
              <div class="w-[78px] h-[60px] shrink-0 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                <img v-if="form.image_url" :src="form.image_url" alt="" class="w-full h-full object-cover" />
                <i v-else class="pi pi-image text-gray-300" />
              </div>
              <div class="min-w-0">
                <span class="block text-[10px] uppercase tracking-wide text-gray-400 truncate">{{ form.partner_name || 'Partner' }}</span>
                <span class="block text-xs font-semibold text-gray-900 leading-snug line-clamp-3">{{ form.title || 'Título del beneficio' }}</span>
              </div>
            </div>
            <span class="block mt-2 text-xs font-medium text-[#00b2a6]">{{ form.cta_label || 'Botón' }} →</span>
          </div>
          <p class="text-xs text-gray-500 mt-1.5">En el menú solo entra el título: el texto se lee en la página.</p>
        </div>

        <p v-if="validationError" class="text-sm text-red-600">
          <i class="pi pi-exclamation-triangle mr-1" />{{ validationError }}
        </p>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text :disabled="saving" @click="$emit('update:visible', false)" />
      <Button :label="isEdit ? 'Guardar cambios' : 'Crear beneficio'" :loading="saving" @click="handleSubmit" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import { resolveBroadcastStores } from '@/api/broadcasts.api'
import type { Benefit, BenefitFormInput, BenefitStoreRef, BenefitUsageKey } from '@/types/benefit.types'
import { BENEFIT_SLOT_LABELS, BENEFIT_TEXT_LIMITS, BENEFIT_USAGE_LABELS } from '@/types/benefit.types'

interface Props {
  visible: boolean
  record: Benefit | null
  saving?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', payload: BenefitFormInput): void
}>()

const LIMITS = BENEFIT_TEXT_LIMITS

/** Etiqueta con contador: se pone en ámbar en los últimos 10 caracteres. */
const FieldLabel = defineComponent({
  props: { text: String, value: { type: String, default: '' }, max: { type: Number, required: true } },
  setup(p) {
    return () => {
      const used = (p.value ?? '').length
      return h('div', { class: 'flex items-baseline justify-between mb-2' }, [
        h('label', { class: 'text-sm font-medium text-gray-700' }, p.text),
        h('span', { class: ['text-[11px] tabular-nums', p.max - used <= 10 ? 'text-amber-600' : 'text-gray-400'] }, `${used}/${p.max}`)
      ])
    }
  }
})

const isEdit = computed(() => !!props.record?.id)

function emptyForm(): BenefitFormInput {
  return {
    kind: 'partner',
    partner_name: '',
    title: '',
    body: '',
    image_url: null,
    promo_code: null,
    cta_label: '',
    cta_url: '',
    slots: ['dashboard'],
    hide_if_uses: null,
    weight: 1,
    target_scope: 'global',
    tienda_ids: [],
    published_at: formatDate(new Date()),
    expires_at: null,
    activo: true
  }
}

const form = ref<BenefitFormInput>(emptyForm())
const publishedAtDate = ref<Date | null>(new Date())
const expiresAtDate = ref<Date | null>(null)
const selectedStores = ref<BenefitStoreRef[]>([])
const pastedIds = ref('')
const missingIds = ref<number[]>([])
const resolvingIds = ref(false)
const validationError = ref<string | null>(null)

// PrimeVue 3 Dropdown no muestra elegida una opción con valor null: centinela ''.
const hideOptions = [
  { label: 'No ocultar', value: '' },
  ...(Object.keys(BENEFIT_USAGE_LABELS) as BenefitUsageKey[]).map((value) => ({ value, label: BENEFIT_USAGE_LABELS[value] }))
]
const hideChoice = computed<string>({
  get: () => form.value.hide_if_uses ?? '',
  set: (v) => { form.value.hide_if_uses = v ? (v as BenefitUsageKey) : null }
})

const weightOptions = [
  { label: 'Normal', value: 1 },
  { label: 'El doble', value: 2 },
  { label: 'El triple', value: 3 },
  { label: 'Casi siempre', value: 10 }
]

watch(() => props.visible, (v) => { if (v) resetFromRecord(props.record) })
watch(publishedAtDate, (d) => { if (d) form.value.published_at = formatDate(d) })
watch(expiresAtDate, (d) => { form.value.expires_at = d ? formatDate(d) : null })
watch(() => form.value.kind, (k) => { if (k !== 'own_app') form.value.hide_if_uses = null })

function resetFromRecord(r: Benefit | null) {
  validationError.value = null
  missingIds.value = []
  pastedIds.value = ''
  if (!r) {
    form.value = emptyForm()
    publishedAtDate.value = new Date()
    expiresAtDate.value = null
    selectedStores.value = []
    return
  }
  form.value = {
    kind: r.kind,
    partner_name: r.partner_name,
    title: r.title,
    body: r.body,
    image_url: r.image_url,
    promo_code: r.promo_code,
    cta_label: r.cta_label,
    cta_url: r.cta_url,
    slots: [...r.slots],
    hide_if_uses: r.hide_if_uses,
    weight: weightOptions.some((o) => o.value === r.weight) ? r.weight : 1,
    target_scope: r.target_scope,
    tienda_ids: [...r.tienda_ids],
    published_at: r.published_at,
    expires_at: r.expires_at,
    activo: r.activo
  }
  publishedAtDate.value = new Date(r.published_at.replace(' ', 'T'))
  expiresAtDate.value = r.expires_at ? new Date(r.expires_at.replace(' ', 'T')) : null
  selectedStores.value = [...r.tiendas]
}

async function addPastedIds() {
  const ids = [...new Set(pastedIds.value.split(/[\s,;]+/).filter((t) => /^\d+$/.test(t)).map(Number).filter((n) => n > 0))]
  missingIds.value = []
  if (!ids.length) return
  resolvingIds.value = true
  try {
    const res = await resolveBroadcastStores(ids)
    if (res.success) {
      const known = new Set(selectedStores.value.map((s) => s.id))
      selectedStores.value = [...selectedStores.value, ...res.data.found.filter((s) => !known.has(s.id))]
      missingIds.value = res.data.missing
      pastedIds.value = res.data.missing.join(', ')
    }
  } catch (e: any) {
    validationError.value = e?.response?.data?.message || 'No se pudieron validar los IDs'
  } finally {
    resolvingIds.value = false
  }
}

const isHttpUrl = (u: string) => /^https?:\/\/\S+$/i.test(u)

function handleSubmit() {
  validationError.value = null
  const f = form.value
  const trimmed = {
    partner_name: f.partner_name.trim(),
    title: f.title.trim(),
    body: f.body.trim(),
    cta_label: f.cta_label.trim(),
    cta_url: f.cta_url.trim(),
    image_url: f.image_url?.trim() || null,
    promo_code: f.promo_code?.trim() || null
  }

  if (!trimmed.partner_name || !trimmed.title || !trimmed.body || !trimmed.cta_label || !trimmed.cta_url) {
    return (validationError.value = 'Completa partner, título, texto, botón y enlace')
  }
  if (!isHttpUrl(trimmed.cta_url)) {
    return (validationError.value = 'El enlace debe empezar con https://')
  }
  if (trimmed.image_url && !isHttpUrl(trimmed.image_url)) {
    return (validationError.value = 'La URL de la imagen debe empezar con https://')
  }
  if (f.expires_at && new Date(f.expires_at) <= new Date(f.published_at)) {
    return (validationError.value = 'La fecha de fin debe ser posterior a la de inicio')
  }
  if (f.target_scope === 'stores' && selectedStores.value.length === 0) {
    return (validationError.value = 'Agrega al menos una tienda o elige "Todas las tiendas"')
  }

  emit('submit', {
    ...f,
    ...trimmed,
    tienda_ids: f.target_scope === 'stores' ? selectedStores.value.map((s) => s.id) : []
  })
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}
</script>
