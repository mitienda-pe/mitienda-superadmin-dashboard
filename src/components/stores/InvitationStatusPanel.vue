<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
          <i class="pi pi-user-plus text-primary-600"></i>
          Onboarding del titular
        </h3>
        <p class="text-sm text-gray-500 mt-0.5">
          Estado de la invitación para definir contraseña y acceder al panel.
        </p>
      </div>
      <Button
        v-if="status && status.estado !== 'activado'"
        label="Reenviar invitación"
        icon="pi pi-envelope"
        size="small"
        :loading="resending"
        @click="onResend"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mt-5 animate-pulse space-y-3">
      <div class="h-5 bg-gray-100 rounded w-1/3"></div>
      <div class="h-4 bg-gray-100 rounded w-2/3"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="mt-5 text-sm text-red-600 flex items-center gap-2">
      <i class="pi pi-exclamation-triangle"></i>
      {{ error }}
      <Button label="Reintentar" icon="pi pi-refresh" size="small" text @click="load" />
    </div>

    <!-- Content -->
    <div v-else-if="status" class="mt-5 space-y-5">
      <!-- Estado + email -->
      <div class="flex flex-wrap items-center gap-3">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          :class="estadoClass(status.estado)"
        >
          {{ estadoLabel(status.estado) }}
        </span>
        <span v-if="status.email" class="text-sm text-gray-600">{{ status.email }}</span>
        <span v-else class="text-sm text-gray-400">Sin administrador asignado</span>
      </div>

      <!-- Alerta de entrega -->
      <div
        v-if="deliveryProblem"
        class="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 flex items-center gap-2"
      >
        <i class="pi pi-times-circle"></i>
        <span>El correo {{ deliveryProblem }} (revisa la dirección o reenvía la invitación).</span>
      </div>

      <!-- Timeline -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Enviado -->
        <div class="rounded-lg border border-gray-100 p-3">
          <div class="flex items-center gap-2 text-sm font-medium" :class="sentAt ? 'text-gray-800' : 'text-gray-400'">
            <i class="pi" :class="sentAt ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-300'"></i>
            Enviado
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ sentAt ? formatDateTime(sentAt) : 'Sin registro de envío' }}</p>
        </div>

        <!-- Abierto (best-effort) -->
        <div class="rounded-lg border border-gray-100 p-3">
          <div class="flex items-center gap-2 text-sm font-medium" :class="openedAt ? 'text-gray-800' : 'text-gray-400'">
            <i class="pi" :class="openedAt ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-300'"></i>
            Abrió el email
            <i
              class="pi pi-info-circle text-gray-300 text-xs cursor-help"
              v-tooltip.top="'Señal aproximada (pixel de seguimiento). El bloqueo de imágenes puede ocultar aperturas reales y algunos clientes (Apple Mail) las precargan automáticamente.'"
            ></i>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            <template v-if="openedAt">
              {{ formatDateTime(openedAt) }}
              <span v-if="status.email_delivery && status.email_delivery.open_count > 1" class="text-gray-400">
                ({{ status.email_delivery.open_count }} aperturas)
              </span>
            </template>
            <template v-else>Sin apertura registrada</template>
          </p>
        </div>

        <!-- Contraseña creada / ingresó -->
        <div class="rounded-lg border border-gray-100 p-3">
          <div class="flex items-center gap-2 text-sm font-medium" :class="status.estado === 'activado' ? 'text-gray-800' : 'text-gray-400'">
            <i class="pi" :class="status.estado === 'activado' ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-300'"></i>
            Contraseña creada
          </div>
          <p class="text-xs text-gray-500 mt-1">
            <template v-if="status.ultimo_ingreso">Último ingreso: {{ formatDate(status.ultimo_ingreso) }}</template>
            <template v-else-if="passwordSetAt">Definida: {{ formatDateTime(passwordSetAtUnix) }}</template>
            <template v-else>Aún no define su contraseña</template>
          </p>
        </div>
      </div>

      <!-- Expiración del enlace -->
      <p v-if="status.estado === 'pendiente' && status.token?.expires_at" class="text-xs text-gray-400">
        El enlace de activación vence el {{ formatDate(status.token.expires_at) }}.
      </p>
      <p v-else-if="status.estado === 'expirado'" class="text-xs text-amber-600">
        El enlace de activación venció. Reenvía la invitación para generar uno nuevo (válido 72 h).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Tooltip from 'primevue/tooltip'
import { useToast } from 'primevue/usetoast'
import { getInvitationStatus, resendStoreInvitation, type InvitationStatus, type InvitationEstado } from '@/api/stores.api'

const props = defineProps<{ storeId: number }>()
const toast = useToast()
const vTooltip = Tooltip

const status = ref<InvitationStatus | null>(null)
const loading = ref(false)
const error = ref('')
const resending = ref(false)

const sentAt = computed(() => status.value?.email_delivery?.sent_at ?? null)
const openedAt = computed(() => status.value?.email_delivery?.opened_at ?? null)
const passwordSetAt = computed(() => status.value?.token?.used_at ?? null)
const passwordSetAtUnix = computed(() =>
  passwordSetAt.value ? Math.floor(new Date(passwordSetAt.value.replace(' ', 'T')).getTime() / 1000) : null
)
const deliveryProblem = computed(() => {
  const s = status.value?.email_delivery?.status
  if (s === 'bounced') return 'rebotó'
  if (s === 'complained') return 'fue marcado como spam'
  if (s === 'failed') return 'no pudo enviarse'
  return null
})

const estadoLabels: Record<InvitationEstado, string> = {
  activado: 'Activado',
  pendiente: 'Pendiente',
  expirado: 'Token expirado',
  sin_invitacion: 'Sin invitación'
}
function estadoLabel(e: InvitationEstado) {
  return estadoLabels[e] || e
}
function estadoClass(e: InvitationEstado) {
  switch (e) {
    case 'activado': return 'bg-green-50 text-green-700'
    case 'pendiente': return 'bg-amber-50 text-amber-700'
    case 'expirado': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return d.slice(0, 10)
}
function formatDateTime(unix: number | null) {
  if (!unix) return '—'
  return new Date(unix * 1000).toLocaleString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await getInvitationStatus(props.storeId)
    status.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || 'No se pudo cargar el estado de la invitación.'
  } finally {
    loading.value = false
  }
}

async function onResend() {
  resending.value = true
  try {
    const res = await resendStoreInvitation(props.storeId)
    toast.add({
      severity: res.email_sent ? 'success' : 'warn',
      summary: res.email_sent ? 'Invitación reenviada' : 'No se pudo enviar',
      detail: res.message,
      life: 6000
    })
    if (res.email_sent) await load()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.message || e.message || 'Error inesperado',
      life: 6000
    })
  } finally {
    resending.value = false
  }
}

onMounted(load)
</script>
