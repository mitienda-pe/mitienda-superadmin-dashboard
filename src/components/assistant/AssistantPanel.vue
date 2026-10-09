<template>
  <div class="flex flex-col h-full">
    <!-- Conversación -->
    <div ref="scroller" class="flex-1 overflow-y-auto px-1 py-2 space-y-4" aria-live="polite">
      <!-- Vacío: qué se puede preguntar -->
      <div v-if="!hasConversation" class="py-4">
        <p class="text-sm text-gray-600 mb-4">
          Pregúntame por tiendas, ventas, suscripciones, pedidos, el pipeline o el tráfico
          web. Solo consulto: no puedo cambiar nada.
        </p>
        <div class="flex flex-col gap-2">
          <button
            v-for="s in SUGERENCIAS"
            :key="s"
            type="button"
            class="text-left text-sm px-3 py-2 rounded-lg border border-gray-200
                   text-gray-700 hover:border-primary-500 hover:text-primary-700 transition-colors"
            @click="usarSugerencia(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div
        v-for="m in messages"
        :key="m.id"
        class="flex"
        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="rounded-2xl px-4 py-2.5 text-sm"
          :class="m.role === 'user'
            ? 'max-w-[85%] bg-primary-600 text-white rounded-br-md'
            : 'max-w-full min-w-0 bg-gray-100 text-gray-800 rounded-bl-md'"
        >
          <div
            v-if="m.role === 'assistant'"
            class="assistant-markdown"
            v-html="renderAssistantMarkdown(m.content)"
          />
          <span v-else class="whitespace-pre-wrap">{{ m.content }}</span>

          <!-- Cursor mientras se escribe, solo si todavía no hay texto visible -->
          <span
            v-if="m.streaming && !m.content"
            class="inline-block w-2 h-4 align-middle bg-gray-400 animate-pulse rounded-sm"
          />
        </div>
      </div>

      <!-- Qué está haciendo -->
      <div v-if="progressLabel" class="flex justify-start">
        <div class="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
          <i class="pi pi-spin pi-spinner text-xs"></i>
          {{ progressLabel }}
        </div>
      </div>

      <div
        v-if="lastError"
        role="alert"
        class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
      >
        {{ lastError }}
      </div>
    </div>

    <!-- Entrada -->
    <div class="border-t border-gray-200 pt-3 mt-2">
      <form class="flex items-end gap-2" @submit.prevent="submit">
        <textarea
          v-model="draft"
          rows="2"
          placeholder="Escribe tu pregunta…"
          aria-label="Pregunta para el asistente"
          class="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          :disabled="isLoading"
          @keydown.enter.exact.prevent="submit"
        />
        <button
          type="submit"
          class="shrink-0 w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center
                 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
          :disabled="isLoading || !draft.trim()"
          aria-label="Enviar"
        >
          <i class="pi" :class="isLoading ? 'pi-spin pi-spinner' : 'pi-send'"></i>
        </button>
      </form>

      <div class="flex items-center justify-between mt-2">
        <p class="text-[11px] text-gray-400">
          El asistente puede equivocarse. Verifica los datos importantes.
        </p>
        <button
          v-if="hasConversation"
          type="button"
          class="text-[11px] text-gray-400 hover:text-primary-700 transition-colors"
          @click="reset"
        >
          Nueva conversación
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { renderAssistantMarkdown } from '@/utils/assistant-markdown'
import { useAssistant } from '@/composables/useAssistant'

const { messages, isLoading, progressLabel, lastError, hasConversation, send, reset } = useAssistant()

const draft = ref('')
const scroller = ref<HTMLElement | null>(null)

/**
 * Preguntas de arranque.
 *
 * Un chat vacio no comunica que sabe hacer. Cada una toca un grupo distinto de
 * herramientas, asi que ademas de invitar, enseñan el alcance.
 */
const SUGERENCIAS = [
  '¿Cómo va el MRR este mes?',
  '¿Qué tiendas vendieron más en los últimos 30 días?',
  '¿Qué suscripciones vencen en los próximos 7 días?',
  '¿Hay pedidos con problemas de pago o de facturación?'
]

async function scrollAlFinal() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

async function submit() {
  const texto = draft.value
  draft.value = ''
  await scrollAlFinal()
  await send(texto)
}

function usarSugerencia(texto: string) {
  draft.value = texto
  submit()
}

// El texto crece sin que cambie la cantidad de mensajes: se sigue el largo del
// ultimo para que el scroll acompañe mientras se escribe.
watch(() => messages.value[messages.value.length - 1]?.content.length, scrollAlFinal)
watch(() => messages.value.length, scrollAlFinal)
</script>

<style scoped>
/* El markdown del asistente: listas, negritas y tablas legibles en la burbuja. */
.assistant-markdown { overflow-x: auto; }
.assistant-markdown :deep(p) { margin: 0 0 0.5rem; }
.assistant-markdown :deep(p:last-child) { margin-bottom: 0; }
.assistant-markdown :deep(ul),
.assistant-markdown :deep(ol) { margin: 0.25rem 0 0.5rem; padding-left: 1.1rem; }
.assistant-markdown :deep(ul) { list-style: disc; }
.assistant-markdown :deep(ol) { list-style: decimal; }
.assistant-markdown :deep(li) { margin-bottom: 0.15rem; }
.assistant-markdown :deep(strong) { font-weight: 600; }
.assistant-markdown :deep(h3),
.assistant-markdown :deep(h4) { font-weight: 600; margin: 0.5rem 0 0.25rem; }
.assistant-markdown :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
  font-size: 0.9em;
}
.assistant-markdown :deep(table) {
  border-collapse: collapse;
  margin: 0.25rem 0 0.5rem;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.assistant-markdown :deep(th),
.assistant-markdown :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.5rem;
  text-align: left;
  white-space: nowrap;
  background: #fff;
}
.assistant-markdown :deep(th) { font-weight: 600; background: #f9fafb; }
</style>
