<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Acciones Rápidas</h3>

    <div class="space-y-2">
      <router-link
        :to="`/stores/${lead.id}`"
        class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
      >
        <i class="pi pi-shop text-gray-400"></i>
        Ver detalle de tienda
      </router-link>

      <a
        :href="`https://${lead.slug}.mitienda.pe`"
        target="_blank"
        class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
      >
        <i class="pi pi-external-link text-gray-400"></i>
        Abrir storefront
      </a>

      <button
        class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 w-full text-left"
        @click="copyUrl"
      >
        <i class="pi pi-copy text-gray-400"></i>
        {{ copied ? 'Copiado!' : 'Copiar URL' }}
      </button>

      <a
        v-if="lead.whatsapp"
        :href="`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`"
        target="_blank"
        class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-green-50 transition-colors text-sm text-green-700"
      >
        <i class="pi pi-whatsapp text-green-500"></i>
        Contactar por WhatsApp
      </a>

      <a
        v-if="lead.email"
        :href="`mailto:${lead.email}`"
        class="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm text-blue-700"
      >
        <i class="pi pi-envelope text-blue-500"></i>
        Enviar email
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PipelineLeadDetail } from '@/types/pipeline.types'

const props = defineProps<{
  lead: PipelineLeadDetail
}>()

const copied = ref(false)

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(`https://${props.lead.slug}.mitienda.pe`)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
  }
}
</script>
