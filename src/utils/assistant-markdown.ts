import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Las respuestas del asistente son datos de la plataforma: casi siempre traen
// tablas, que el markdown de los avisos no permite.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'code', 'pre',
  'ul', 'ol', 'li',
  'blockquote',
  'h3', 'h4',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
]

/**
 * Sin enlaces a proposito: el texto lo escribe un modelo a partir de datos que
 * cargan los comercios (nombres de tienda, notas), y un enlace es justo lo que
 * alguien intentaria colar por ahi.
 */
export function renderAssistantMarkdown(input: string | null | undefined): string {
  if (!input) return ''
  const raw = String(marked.parse(input, { async: false, breaks: true, gfm: true }))
  return String(DOMPurify.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR: [] }))
}
