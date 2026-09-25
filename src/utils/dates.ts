/**
 * Fechas de calendario (sin hora) que vienen del API como 'YYYY-MM-DD'.
 *
 * `new Date('2026-09-10')` las interpreta como medianoche UTC, que en Lima
 * (UTC−5) es el 9 a las 19:00: al mostrarlas salía un día antes y, al
 * reenviarlas, el formulario del plan le restaba un día al vencimiento en cada
 * guardado. Estas funciones las tratan como fecha local.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** 'YYYY-MM-DD' → Date a medianoche local. Cualquier otro valor pasa a `new Date`. */
export function parseLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value
  const m = DATE_ONLY.exec(value)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(value)
}

/** Date → 'YYYY-MM-DD' con los componentes locales. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
