<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button icon="pi pi-arrow-left" text rounded @click="router.push('/complaints')" />
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ detail?.complaint_type || 'Reclamo' }}
          <span v-if="detail?.code" class="text-gray-400 font-normal text-lg ml-2">{{ detail.code }}</span>
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Registrado {{ formatDateTime(detail?.created_at) }}
        </p>
      </div>
      <span v-if="detail" :class="statusTagClass(detail.status)">
        {{ detail.status === 'pending' ? 'Pendiente' : 'Atendido' }}
      </span>
    </div>

    <div v-if="store.isLoading && !detail" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {{ store.error }}
    </div>

    <div v-else-if="detail" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cliente -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Cliente</h2>
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-gray-500">Nombre</dt>
            <dd class="font-medium text-gray-900">{{ detail.name || '—' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">{{ detail.document_type || 'Documento' }}</dt>
            <dd class="font-medium text-gray-900">{{ detail.document_number || '—' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Email</dt>
            <dd class="font-medium text-gray-900 break-all">
              <a :href="`mailto:${detail.email}`" class="text-primary-700 hover:underline">
                {{ detail.email || '—' }}
              </a>
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Teléfono</dt>
            <dd class="font-medium text-gray-900">{{ detail.phone || '—' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Domicilio</dt>
            <dd class="text-gray-700">{{ detail.address || '—' }}</dd>
          </div>
        </dl>
      </div>

      <!-- Reclamo -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Detalle del reclamo</h2>
        <dl class="space-y-4 text-sm">
          <div class="flex flex-wrap gap-3">
            <span :class="typeTagClass(detail.complaint_type_id)">
              {{ detail.complaint_type }}
            </span>
            <span class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
              {{ detail.good_type }}
            </span>
            <span
              v-if="detail.tienda_id"
              class="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-xs font-medium inline-flex items-center"
            >
              <i class="pi pi-shop mr-1" />
              {{ detail.tienda_nombre || 'Tienda #' + detail.tienda_id }}
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium inline-flex items-center"
            >
              <i class="pi pi-globe mr-1" />
              Plataforma
            </span>
          </div>
          <div>
            <dt class="text-gray-500">Descripción del bien contratado</dt>
            <dd class="text-gray-900 whitespace-pre-wrap">{{ detail.good_description || '—' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Detalle de la reclamación</dt>
            <dd class="text-gray-900 whitespace-pre-wrap">{{ detail.complaint_detail || '—' }}</dd>
          </div>
        </dl>
      </div>

      <!-- Respuesta -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-3">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Respuesta / acción adoptada</h2>
          <span v-if="detail.response_date" class="text-xs text-gray-500">
            Respondido {{ formatDateTime(detail.response_date) }}
          </span>
        </div>

        <div v-if="detail.response && !editing" class="space-y-3">
          <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
            {{ detail.response }}
          </div>
          <Button label="Editar respuesta" icon="pi pi-pencil" text @click="startEdit" />
        </div>

        <div v-else class="space-y-3">
          <Textarea
            v-model="responseDraft"
            :rows="5"
            class="w-full"
            placeholder="Escribe la acción tomada o respuesta al cliente..."
          />
          <div class="flex gap-2">
            <Button
              label="Guardar respuesta"
              icon="pi pi-check"
              :loading="store.isSaving"
              :disabled="!responseDraft.trim()"
              @click="handleRespond"
            />
            <Button
              v-if="detail.response"
              label="Cancelar"
              text
              @click="cancelEdit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useComplaintsStore } from '@/stores/complaints.store'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const store = useComplaintsStore()
const toast = useToast()

const { current: detail } = storeToRefs(store)
const responseDraft = ref('')
const editing = ref(false)

function formatDateTime(s?: string | null) {
  if (!s) return '—'
  try {
    return format(new Date(s.replace(' ', 'T')), "dd MMM yyyy 'a las' HH:mm")
  } catch {
    return s
  }
}

function statusTagClass(s: string) {
  const base = 'px-3 py-1 rounded-full text-sm font-medium'
  return s === 'pending' ? `${base} bg-amber-100 text-amber-800` : `${base} bg-green-100 text-green-800`
}

function typeTagClass(typeId: number) {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  return typeId === 1 ? `${base} bg-blue-100 text-blue-800` : `${base} bg-purple-100 text-purple-800`
}

function startEdit() {
  responseDraft.value = detail.value?.response ?? ''
  editing.value = true
}

function cancelEdit() {
  responseDraft.value = ''
  editing.value = false
}

async function handleRespond() {
  if (!detail.value) return
  const text = responseDraft.value.trim()
  if (!text) return

  try {
    const res = await store.submitResponse(detail.value.id, text)
    if (res.success) {
      toast.add({
        severity: 'success',
        summary: 'Respuesta registrada',
        detail: 'La acción adoptada quedó guardada.',
        life: 4000
      })
      editing.value = false
      responseDraft.value = ''
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.response?.data?.message || e?.message || 'No se pudo guardar',
      life: 5000
    })
  }
}

watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    await store.fetchOne(Number(id))
  },
  { immediate: false }
)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) return
  await store.fetchOne(id)
})
</script>
