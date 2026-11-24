<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <div>
      <h1 class="text-2xl font-bold text-gray-900">Socios</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Cuenta corriente de cada socio: lo que puso en la empresa y lo que sacó. Sale de los movimientos del banco conciliados
        como «Aporte o retiro de socios». Un préstamo del socio es plata que la empresa le debe; un gasto personal pagado por la
        empresa es plata que el socio le debe a ella; el capital no se devuelve.
      </p>
    </div>

    <p v-if="loading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Cargando…</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="ledger">
      <!-- Saldo por socio -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="p in ledger.partners" :key="p.id" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div class="flex items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-gray-900">{{ p.name }}</h2>
            <span class="text-xs text-gray-400">{{ p.movements.length }} movimientos</span>
          </div>

          <p v-if="!Object.keys(p.balances).length" class="text-sm text-gray-500">Sin movimientos asignados.</p>
          <div v-for="(b, currency) in p.balances" :key="currency" class="space-y-1 text-sm">
            <div class="flex justify-between"><span class="text-gray-600">Entró del socio</span><span class="tabular-nums">{{ money(b!.in, currency) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-600">Salió hacia el socio</span><span class="tabular-nums">{{ money(-b!.out, currency) }}</span></div>
            <div class="border-t border-gray-100 my-1"></div>
            <div class="flex justify-between"><span class="text-gray-600">Préstamos por devolverle</span><span class="tabular-nums">{{ money(b!.loans, currency) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-600">Gastos personales que debe</span><span class="tabular-nums">{{ money(-b!.advances, currency) }}</span></div>
            <div v-if="b!.capital" class="flex justify-between"><span class="text-gray-600">Capital aportado</span><span class="tabular-nums">{{ money(b!.capital, currency) }}</span></div>
            <div class="flex justify-between font-semibold" :class="b!.net >= 0 ? 'text-gray-900' : 'text-amber-700'">
              <span>{{ b!.net >= 0 ? 'La empresa le debe' : 'Le debe a la empresa' }}</span>
              <span class="tabular-nums">{{ money(Math.abs(b!.net), currency) }}</span>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Sueldos y beneficios por pagarle</span>
              <span class="tabular-nums font-medium">{{ money(p.payroll_payable.total, 'PEN') }}</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Aparte: se le paga por planilla. Solo lo registrado como gasto a su nombre y sin pagar.
            </p>
          </div>
        </div>
      </div>

      <!-- Sin asignar -->
      <div v-if="ledger.unassigned.length" class="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
        <div>
          <h2 class="text-base font-semibold text-gray-900">Sin asignar · {{ ledger.unassigned.length }}</h2>
          <p class="text-sm text-gray-500">Marcados como socios, pero sin decir de quién son ni qué son. No entran en ningún saldo.</p>
        </div>
        <MovementsTable :rows="ledger.unassigned" assigning />
      </div>

      <!-- Movimientos de un socio -->
      <div v-if="ledger.partners.length" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-gray-900">Movimientos</h2>
          <SelectButton v-model="selected" :options="ledger.partners" optionLabel="name" optionValue="id" :allowEmpty="false" />
        </div>
        <MovementsTable :rows="selectedPartner?.movements ?? []" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, type PropType } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import { getPartnerLedger, assignPartnerLink, accountingErrorMessage } from '@/api/accounting.api'
import type { PartnerKind, PartnerLedger, PartnerMovement } from '@/types/accounting.types'

const toast = useToast()
const authStore = useAuthStore()
const { formatDate } = useFormatters()

const ledger = ref<PartnerLedger | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const selected = ref<number | null>(null)
const selectedPartner = computed(() => ledger.value?.partners.find(p => p.id === selected.value) ?? null)

function money(value: number, currency: string) {
  const sign = value < 0 ? '−' : ''
  return `${sign}${currency === 'USD' ? 'US$' : 'S/'} ${Math.abs(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function load() {
  loading.value = ledger.value === null
  error.value = null
  try {
    ledger.value = await getPartnerLedger()
    if (selected.value === null || !ledger.value.partners.some(p => p.id === selected.value)) {
      selected.value = ledger.value.partners[0]?.id ?? null
    }
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

// Edición de cada fila: socio y tipo. Se guarda al tocar «Guardar».
const drafts = reactive<Record<number, { partnerId: number | null; kind: PartnerKind | null; saving: boolean }>>({})

function draft(row: PartnerMovement) {
  drafts[row.link_id] ??= { partnerId: row.partner_id, kind: row.kind, saving: false }
  return drafts[row.link_id]
}

async function save(row: PartnerMovement) {
  const d = draft(row)
  if ((d.partnerId === null) !== (d.kind === null)) {
    toast.add({ severity: 'warn', summary: 'Falta un dato', detail: 'Indica el socio y qué es, o deja los dos vacíos', life: 4000 })
    return
  }
  d.saving = true
  try {
    await assignPartnerLink(row.link_id, d.partnerId, d.kind)
    delete drafts[row.link_id]
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se guardó', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    d.saving = false
  }
}

const kindOptions = computed(() => Object.entries(ledger.value?.kinds ?? {}).map(([value, label]) => ({ value, label })))
const partnerOptions = computed(() => ledger.value?.partners.map(p => ({ value: p.id, label: p.name })) ?? [])

const MovementsTable = defineComponent({
  props: {
    rows: { type: Array as PropType<PartnerMovement[]>, required: true },
    assigning: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      if (!props.rows.length) return h('p', { class: 'text-sm text-gray-500' }, 'Sin movimientos.')
      const canEdit = authStore.canWriteFinance
      return h('div', { class: 'overflow-x-auto' }, h('table', { class: 'w-full text-sm' }, [
        h('thead', { class: 'text-xs uppercase text-gray-500 bg-gray-50' }, h('tr', [
          h('th', { class: 'text-left px-3 py-2' }, 'Fecha'),
          h('th', { class: 'text-left px-3 py-2' }, 'Movimiento'),
          h('th', { class: 'text-right px-3 py-2' }, 'Monto'),
          ...(props.assigning ? [h('th', { class: 'text-left px-3 py-2' }, 'Socio')] : []),
          h('th', { class: 'text-left px-3 py-2' }, 'Qué es'),
          ...(canEdit ? [h('th', { class: 'px-3 py-2' })] : [])
        ])),
        h('tbody', props.rows.map(row => {
          const d = draft(row)
          const dirty = d.partnerId !== row.partner_id || d.kind !== row.kind
          return h('tr', { key: row.link_id, class: 'border-t border-gray-100 align-top' }, [
            h('td', { class: 'px-3 py-2 whitespace-nowrap' }, formatDate(row.date)),
            h('td', { class: 'px-3 py-2' }, [
              h(RouterLink, { to: { name: 'AccountingBanks', query: { search: `#${row.movement_id}` } }, class: 'text-primary hover:underline' }, () => `#${row.movement_id}`),
              h('span', { class: 'text-gray-700' }, ` · ${row.description}`),
              h('div', { class: 'text-xs text-gray-400' }, [row.account, row.note ? ` · ${row.note}` : ''].join(''))
            ]),
            h('td', { class: ['px-3 py-2 text-right tabular-nums whitespace-nowrap', row.signed > 0 ? 'text-emerald-700' : 'text-gray-900'] }, money(row.signed, row.currency)),
            ...(props.assigning
              ? [h('td', { class: 'px-3 py-2 min-w-[11rem]' }, canEdit
                  ? h(Dropdown, { modelValue: d.partnerId, options: partnerOptions.value, optionLabel: 'label', optionValue: 'value', placeholder: 'Socio', showClear: true, class: 'w-full', 'onUpdate:modelValue': (v: number | null) => { d.partnerId = v ?? null } })
                  : '—')]
              : []),
            h('td', { class: 'px-3 py-2 min-w-[14rem]' }, canEdit
              ? h(Dropdown, { modelValue: d.kind, options: kindOptions.value, optionLabel: 'label', optionValue: 'value', placeholder: 'Qué es', showClear: props.assigning, class: 'w-full', 'onUpdate:modelValue': (v: PartnerKind | null) => { d.kind = v ?? null } })
              : (row.kind ? ledger.value?.kinds[row.kind] : '—')),
            ...(canEdit
              ? [h('td', { class: 'px-3 py-2' }, h(Button, { label: 'Guardar', size: 'small', disabled: !dirty, loading: d.saving, onClick: () => save(row) }))]
              : [])
          ])
        }))
      ]))
    }
  }
})

onMounted(load)
</script>
