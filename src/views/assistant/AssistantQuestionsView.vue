<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Preguntas al asistente</h1>
      <p class="text-sm text-gray-500 mt-1">
        Lo que los comerciantes le preguntan al asistente del panel ("Preguntar"), cómo terminó y
        cómo lo calificaron. Solo se guarda la pregunta: la respuesta trae datos privados de la tienda.
        Se conservan {{ retencionDias }} días.
      </p>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Calendar v-model="desde" placeholder="Desde" dateFormat="dd/mm/yy" showIcon @date-select="aplicar" />
      <Calendar v-model="hasta" placeholder="Hasta" dateFormat="dd/mm/yy" showIcon @date-select="aplicar" />
      <InputNumber
        v-model="tiendaId"
        placeholder="ID de tienda"
        :useGrouping="false"
        inputClass="w-full"
        @keyup.enter="aplicar"
        @blur="aplicar"
      />
      <Dropdown
        v-model="resultado"
        :options="opcionesResultado"
        optionLabel="label"
        optionValue="value"
        placeholder="Resultado"
        showClear
        @change="aplicar"
      />
      <Dropdown
        v-model="feedback"
        :options="opcionesFeedback"
        optionLabel="label"
        optionValue="value"
        placeholder="Calificación"
        showClear
        @change="aplicar"
      />
      <Dropdown
        v-model="impersonando"
        :options="opcionesOrigen"
        optionLabel="label"
        optionValue="value"
        placeholder="Quién pregunta"
        showClear
        @change="aplicar"
      />
    </div>

    <div v-if="pantalla" class="flex items-center gap-2 text-sm">
      <span class="text-gray-500">Pantalla:</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-mono text-xs">
        {{ pantalla }}
        <button type="button" class="ml-1 hover:text-primary-900" aria-label="Quitar filtro de pantalla" @click="filtrarPantalla(null)">
          <i class="pi pi-times text-[10px]" />
        </button>
      </span>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="text-xs text-gray-500 uppercase tracking-wide">Preguntas</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ resumen?.turnos ?? '—' }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ resumen ? `${resumen.tiendas} tienda(s)` : '' }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="text-xs text-gray-500 uppercase tracking-wide">Resueltas</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ porResultado('resuelto') }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ pct(porResultado('resuelto'), resumen?.turnos) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="text-xs text-gray-500 uppercase tracking-wide">Derivadas a soporte</div>
        <div class="text-2xl font-bold text-amber-600 mt-1">{{ porResultado('derivado') }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ pct(porResultado('derivado'), resumen?.turnos) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="text-xs text-gray-500 uppercase tracking-wide">Con error</div>
        <div class="text-2xl font-bold text-red-600 mt-1">{{ porResultado('error') }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ pct(porResultado('error'), resumen?.turnos) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="text-xs text-gray-500 uppercase tracking-wide">Calificación</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">
          {{ resumen?.feedback.tasa_positiva != null ? `${Math.round(resumen.feedback.tasa_positiva * 100)}%` : '—' }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          <i class="pi pi-thumbs-up text-[10px]" /> {{ resumen?.feedback.up ?? 0 }}
          · <i class="pi pi-thumbs-down text-[10px]" /> {{ resumen?.feedback.down ?? 0 }}
          · votó el {{ resumen?.feedback.tasa_voto != null ? Math.round(resumen.feedback.tasa_voto * 100) : 0 }}%
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Por pantalla -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">Por pantalla</div>
        <DataTable :value="resumen?.por_pantalla ?? []" size="small" :loading="cargandoResumen">
          <template #empty><span class="text-sm text-gray-500">Sin datos.</span></template>
          <Column header="Pantalla">
            <template #body="{ data }">
              <button
                v-if="data.pantalla"
                type="button"
                class="font-mono text-xs text-primary-700 hover:underline text-left"
                @click="filtrarPantalla(data.pantalla)"
              >
                {{ data.pantalla }}
              </button>
              <span v-else class="text-xs text-gray-400">Sin pantalla</span>
            </template>
          </Column>
          <Column field="total" header="Preguntas" style="width: 90px" />
          <Column header="Derivadas" style="width: 90px">
            <template #body="{ data }">{{ data.derivados }}</template>
          </Column>
          <Column header="👍 / 👎" style="width: 90px">
            <template #body="{ data }">{{ data.up }} / {{ data.down }}</template>
          </Column>
        </DataTable>
      </div>

      <!-- Más repetidas -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">Preguntas más repetidas</div>
        <DataTable :value="resumen?.top_preguntas ?? []" size="small" :loading="cargandoResumen">
          <template #empty><span class="text-sm text-gray-500">Sin datos.</span></template>
          <Column header="Pregunta">
            <template #body="{ data }"><span class="text-sm text-gray-800">{{ data.pregunta }}</span></template>
          </Column>
          <Column field="total" header="Veces" style="width: 70px" />
          <Column field="tiendas" header="Tiendas" style="width: 70px" />
          <Column header="👎" style="width: 50px">
            <template #body="{ data }">{{ data.down }}</template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Listado -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable :value="turnos" stripedRows responsiveLayout="scroll" :loading="cargando">
        <template #empty>
          <div class="py-8 text-center text-sm text-gray-500">No hay preguntas para los filtros seleccionados.</div>
        </template>
        <Column header="Fecha" style="width: 140px">
          <template #body="{ data }">
            <div class="text-sm text-gray-700 whitespace-nowrap">{{ formatDate(data.created_at) }}</div>
            <div v-if="data.duracion_ms" class="text-xs text-gray-400">{{ (data.duracion_ms / 1000).toFixed(1) }} s</div>
          </template>
        </Column>
        <Column header="Tienda" style="width: 180px">
          <template #body="{ data }">
            <div class="text-sm text-gray-900">{{ data.tienda_nombre || `#${data.tienda_id}` }}</div>
            <div class="text-xs text-gray-400">
              #{{ data.tienda_id }}
              <span v-if="data.impersonando" class="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">equipo</span>
            </div>
          </template>
        </Column>
        <Column header="Pregunta">
          <template #body="{ data }">
            <div v-if="data.pregunta" class="text-sm text-gray-800 whitespace-pre-line">{{ data.pregunta }}</div>
            <div v-else class="text-sm italic text-gray-400">Sin registrar (llegó solo el voto)</div>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-if="data.pantalla" class="font-mono text-[11px] text-gray-500">{{ data.pantalla }}</span>
              <span
                v-for="h in data.herramientas"
                :key="h"
                class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-mono"
              >{{ h }}</span>
            </div>
          </template>
        </Column>
        <Column header="Resultado" style="width: 110px">
          <template #body="{ data }">
            <span v-if="data.resultado" :class="resultadoClass(data.resultado)">{{ etiquetaResultado(data.resultado) }}</span>
            <span v-else class="text-gray-400">—</span>
          </template>
        </Column>
        <Column header="Voto" style="width: 70px">
          <template #body="{ data }">
            <i v-if="data.feedback === 1" class="pi pi-thumbs-up-fill text-green-600" aria-label="Le sirvió" />
            <i v-else-if="data.feedback === -1" class="pi pi-thumbs-down-fill text-red-500" aria-label="No le sirvió" />
            <span v-else class="text-gray-300">—</span>
          </template>
        </Column>
      </DataTable>

      <div v-if="pagination.pages > 1" class="flex items-center justify-between p-4 border-t border-gray-200 text-sm">
        <div class="text-gray-600">{{ pagination.total }} pregunta(s)</div>
        <div class="flex items-center gap-2">
          <Button icon="pi pi-angle-left" text :disabled="pagination.page <= 1" @click="irAPagina(pagination.page - 1)" />
          <span class="text-gray-700">Página {{ pagination.page }} / {{ pagination.pages }}</span>
          <Button icon="pi pi-angle-right" text :disabled="pagination.page >= pagination.pages" @click="irAPagina(pagination.page + 1)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { format, subDays } from 'date-fns'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import {
  listAssistantTurns,
  getAssistantTurnsSummary,
  type AssistantTurn,
  type AssistantTurnFilters,
  type AssistantTurnResult,
  type AssistantFeedbackFilter,
  type AssistantTurnsSummary,
  type AssistantTurnsPagination
} from '@/api/assistant-questions.api'

const desde = ref<Date | null>(subDays(new Date(), 29))
const hasta = ref<Date | null>(new Date())
const tiendaId = ref<number | null>(null)
const resultado = ref<AssistantTurnResult | null>(null)
const feedback = ref<AssistantFeedbackFilter | null>(null)
const impersonando = ref<'0' | '1' | null>(null)
const pantalla = ref<string | null>(null)

const turnos = ref<AssistantTurn[]>([])
const resumen = ref<AssistantTurnsSummary | null>(null)
const pagination = ref<AssistantTurnsPagination>({ page: 1, limit: 50, total: 0, pages: 0 })
const retencionDias = ref(90)
const cargando = ref(false)
const cargandoResumen = ref(false)
const error = ref<string | null>(null)

const opcionesResultado = [
  { label: 'Resuelta', value: 'resuelto' },
  { label: 'Derivada a soporte', value: 'derivado' },
  { label: 'Error', value: 'error' }
]
const opcionesFeedback = [
  { label: '👍 Le sirvió', value: 'up' },
  { label: '👎 No le sirvió', value: 'down' },
  { label: 'Con voto', value: 'any' },
  { label: 'Sin voto', value: 'none' }
]
const opcionesOrigen = [
  { label: 'Comerciantes', value: '0' },
  { label: 'Equipo (impersonando)', value: '1' }
]

function filtros(): AssistantTurnFilters {
  return {
    desde: desde.value ? format(desde.value, 'yyyy-MM-dd') : undefined,
    hasta: hasta.value ? format(hasta.value, 'yyyy-MM-dd') : undefined,
    tienda_id: tiendaId.value || null,
    pantalla: pantalla.value,
    resultado: resultado.value,
    feedback: feedback.value,
    impersonando: impersonando.value
  }
}

async function cargarListado(page = 1) {
  cargando.value = true
  error.value = null
  try {
    const res = await listAssistantTurns({ ...filtros(), page, limit: pagination.value.limit })
    turnos.value = res.data ?? []
    if (res.pagination) pagination.value = res.pagination
    if (res.retencion_dias) retencionDias.value = res.retencion_dias
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar las preguntas.'
  } finally {
    cargando.value = false
  }
}

async function cargarResumen() {
  cargandoResumen.value = true
  try {
    const res = await getAssistantTurnsSummary(filtros())
    resumen.value = res.data ?? null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el resumen.'
  } finally {
    cargandoResumen.value = false
  }
}

function aplicar() {
  cargarListado(1)
  cargarResumen()
}

function filtrarPantalla(valor: string | null) {
  pantalla.value = valor
  aplicar()
}

function irAPagina(page: number) {
  cargarListado(page)
}

function porResultado(r: AssistantTurnResult): number {
  return resumen.value?.por_resultado.find(x => x.resultado === r)?.total ?? 0
}

function pct(n: number, total?: number): string {
  if (!total) return ''
  return `${Math.round((n / total) * 100)}%`
}

function etiquetaResultado(r: AssistantTurnResult): string {
  return { resuelto: 'Resuelta', derivado: 'Derivada', error: 'Error' }[r]
}

function resultadoClass(r: AssistantTurnResult): string {
  const base = 'px-2 py-0.5 rounded text-xs font-medium'
  if (r === 'resuelto') return `${base} bg-green-100 text-green-800`
  if (r === 'derivado') return `${base} bg-amber-100 text-amber-800`
  return `${base} bg-red-100 text-red-800`
}

function formatDate(s?: string | null) {
  if (!s) return '—'
  try {
    return format(new Date(s.replace(' ', 'T')), 'dd/MM/yyyy HH:mm')
  } catch {
    return s
  }
}

onMounted(aplicar)
</script>
