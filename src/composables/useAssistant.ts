import { ref, computed } from 'vue'
import apiClient from '@/api/axios'

/**
 * El asistente del superadmin: preguntas sobre la plataforma en lenguaje natural.
 *
 * Habla con el backend RAG, que consulta el MCP de MiTienda **con el token de
 * esta sesion**. Solo lee: las herramientas que escriben y el SQL libre no se le
 * ofrecen al modelo, y eso se decide en el servidor, no aca.
 */

const ASSISTANT_URL = (
  import.meta.env.VITE_ASSISTANT_URL || 'https://rag.tiendabox.co'
).replace(/\/+$/, '')

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Se esta escribiendo ahora mismo. */
  streaming?: boolean
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Estado a nivel de modulo: la conversacion sobrevive a cerrar y abrir el panel.
const messages = ref<AssistantMessage[]>([])
const isLoading = ref(false)
const progressLabel = ref<string | null>(null)
const sessionId = ref(generateId())
const lastError = ref<string | null>(null)

const SESION_VENCIDA = 'Tu sesión expiró. Vuelve a entrar al panel.'

/**
 * El token vigente sale de localStorage y no del store: cuando el interceptor
 * de axios renueva la sesion, es ahi donde deja el nuevo.
 */
function tokenActual(): string | null {
  return localStorage.getItem('access_token')
}

/**
 * Renueva la sesion pasando por axios.
 *
 * El asistente usa fetch porque necesita leer la respuesta por partes, asi que
 * no pasa por el interceptor que renueva el token. Una llamada barata a la API
 * hace ese trabajo: si el token vencio, el interceptor lo cambia y la repite.
 */
async function renovarSesion(): Promise<string | null> {
  try {
    await apiClient.get('/superadmin/check')
    return tokenActual()
  } catch {
    return null
  }
}

export function useAssistant() {
  const hasConversation = computed(() => messages.value.length > 0)

  function reset() {
    messages.value = []
    sessionId.value = generateId()
    progressLabel.value = null
    lastError.value = null
  }

  async function send(text: string) {
    const message = text.trim()
    if (!message || isLoading.value) return

    const token = tokenActual()
    if (!token) {
      lastError.value = SESION_VENCIDA
      return
    }

    // El historial se arma antes de agregar este turno: lo que viaja como
    // `history` es lo ya conversado, y la pregunta va aparte.
    const history = messages.value.map(m => ({ role: m.role, content: m.content }))

    messages.value.push({ id: generateId(), role: 'user', content: message })
    isLoading.value = true
    lastError.value = null

    const replyId = generateId()
    messages.value.push({ id: replyId, role: 'assistant', content: '', streaming: true })

    const actual = () => messages.value.find(m => m.id === replyId)
    const descartarRespuesta = () => {
      messages.value = messages.value.filter(m => m.id !== replyId)
    }

    const pedir = (conToken: string) =>
      fetch(`${ASSISTANT_URL}/superadmin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${conToken}`
        },
        body: JSON.stringify({ message, session_id: sessionId.value, history })
      })

    try {
      let response = await pedir(token)

      // El token pudo vencer con el panel abierto: se renueva una vez y se
      // reintenta antes de mandar a nadie al login.
      if (response.status === 401) {
        const renovado = await renovarSesion()
        if (renovado) response = await pedir(renovado)
      }

      if (response.status === 401 || response.status === 403) {
        descartarRespuesta()
        lastError.value =
          response.status === 403 ? 'El asistente es solo para superadministradores.' : SESION_VENCIDA
        return
      }

      if (response.status === 502) {
        descartarRespuesta()
        lastError.value = 'No pude conectarme a los datos de la plataforma. Intenta de nuevo en un momento.'
        return
      }

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Los eventos van separados por una linea en blanco, y un fragmento de
        // red puede cortar a la mitad de uno: lo incompleto espera al siguiente.
        const bloques = buffer.split('\n\n')
        buffer = bloques.pop() ?? ''

        for (const bloque of bloques) {
          const linea = bloque.split('\n').find(l => l.startsWith('data:'))
          if (!linea) continue

          let evento: { type?: string; label?: string; text?: string; reply?: string; message?: string }
          try {
            evento = JSON.parse(linea.slice(5).trim())
          } catch {
            continue
          }

          const msg = actual()
          if (!msg) continue

          switch (evento.type) {
            case 'progress':
              progressLabel.value = evento.label ?? null
              break
            case 'text_delta':
              progressLabel.value = null
              msg.content += evento.text ?? ''
              break
            case 'text_reset':
              // Escribio algo y despues fue a consultar: era divagacion.
              msg.content = ''
              break
            case 'done':
              if (evento.reply) msg.content = evento.reply
              msg.streaming = false
              break
            case 'error':
              msg.content = evento.message ?? 'No pude completar tu consulta.'
              msg.streaming = false
              break
          }
        }
      }

      const msg = actual()
      if (msg) msg.streaming = false
    } catch (err) {
      console.error('[Asistente] Falló la consulta:', err)
      const msg = actual()
      if (msg && !msg.content) {
        descartarRespuesta()
        lastError.value = 'No pude conectarme al asistente. Intenta de nuevo.'
      } else if (msg) {
        msg.streaming = false
      }
    } finally {
      isLoading.value = false
      progressLabel.value = null
    }
  }

  return {
    messages,
    isLoading,
    progressLabel,
    lastError,
    hasConversation,
    send,
    reset
  }
}
