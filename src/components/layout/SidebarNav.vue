<template>
  <nav class="space-y-4">
    <div v-for="group in visibleGroups" :key="group.id">
      <button
        v-if="group.label"
        type="button"
        class="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
        :aria-expanded="isOpen(group)"
        @click="toggle(group)"
      >
        <span>{{ group.label }}</span>
        <i class="pi text-[10px]" :class="isOpen(group) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
      </button>

      <div v-show="isOpen(group)" class="space-y-1" :class="{ 'mt-1': group.label }">
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.path)
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
        >
          <i :class="item.icon" class="text-lg w-5 text-center"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRoute } from 'vue-router'
import {
  HOME_TABS, STORES_TABS, INVOICES_TABS, MRR_TABS, ACCOUNTING_TABS, type SectionTab
} from '@/config/sections.config'

interface NavItem {
  path: string
  label: string
  icon: string
  /** Rutas hermanas que se abren como pestañas dentro de esta entrada. */
  also?: string[]
}

interface NavGroup {
  id: string
  /** Sin etiqueta el grupo no tiene cabecera y no se puede plegar. */
  label?: string
  items: NavItem[]
}

const route = useRoute()
const authStore = useAuthStore()

/** Las pestañas de una seccion menos la primera, que es la ruta de la entrada. */
function siblings(tabs: SectionTab[]): string[] {
  return tabs.slice(1).map(tab => tab.to)
}

const ACCOUNTING_OWN_ENTRIES = ['/accounting/banks', '/accounting/payroll', '/accounting/results', '/accounting/cash-flow', '/accounting/taxes', '/accounting/journal', '/accounting/chart']

// El menu se agrupa por lo que la persona viene a hacer, no por el orden en
// que se fueron agregando los modulos. Las rutas no cambian.
const navGroups: NavGroup[] = [
  {
    id: 'home',
    items: [
      { path: '/dashboard', label: 'Resumen y alertas', icon: 'pi pi-home', also: siblings(HOME_TABS) }
    ]
  },
  {
    id: 'customers',
    label: 'Clientes',
    items: [
      { path: '/customers', label: 'Directorio de clientes', icon: 'pi pi-id-card' },
      { path: '/stores', label: 'Tiendas y usuarios', icon: 'pi pi-shop', also: siblings(STORES_TABS) },
      { path: '/pipeline', label: 'Pipeline de trials', icon: 'pi pi-filter' },
      { path: '/programs', label: 'Programas', icon: 'pi pi-gift' },
      { path: '/complaints', label: 'Reclamos', icon: 'pi pi-flag' }
    ]
  },
  {
    id: 'billing',
    label: 'Facturación',
    items: [
      { path: '/billing/emit', label: 'Emitir comprobante', icon: 'pi pi-file-plus' },
      { path: '/billing/plan-sales', label: 'Ventas de planes', icon: 'pi pi-receipt' },
      { path: '/billing/payment-links', label: 'Links de pago', icon: 'pi pi-credit-card' },
      { path: '/billing/commission-period', label: 'Cierre de comisiones', icon: 'pi pi-calendar-clock' },
      { path: '/billing/invoices', label: 'Comprobantes', icon: 'pi pi-file-edit', also: siblings(INVOICES_TABS) },
      { path: '/billing/ledger', label: 'Líneas facturadas', icon: 'pi pi-list' },
      { path: '/billing/concepts', label: 'Conceptos facturados', icon: 'pi pi-th-large' },
      { path: '/billing/tags', label: 'Etiquetas', icon: 'pi pi-tags' }
    ]
  },
  {
    id: 'accounting',
    label: 'Contabilidad',
    items: [
      // Cada módulo tiene su entrada; de Gastos cuelgan sus catálogos
      // (proveedores y personal, categorías), que solo viven como pestaña.
      {
        path: '/accounting/expenses',
        label: 'Gastos',
        icon: 'pi pi-wallet',
        also: siblings(ACCOUNTING_TABS).filter(path => !ACCOUNTING_OWN_ENTRIES.includes(path))
      },
      { path: '/accounting/banks', label: 'Bancos', icon: 'pi pi-building-columns' },
      { path: '/accounting/payroll', label: 'Planilla', icon: 'pi pi-id-card' },
      { path: '/accounting/results', label: 'Resultados', icon: 'pi pi-chart-bar' },
      { path: '/accounting/cash-flow', label: 'Flujo de caja', icon: 'pi pi-calendar' },
      { path: '/accounting/taxes', label: 'Impuestos', icon: 'pi pi-percentage' },
      { path: '/accounting/journal', label: 'Libro diario y mayor', icon: 'pi pi-book', also: ['/accounting/chart'] }
    ]
  },
  {
    id: 'reports',
    label: 'Reportes',
    items: [
      { path: '/billing/income', label: 'Ingresos facturados', icon: 'pi pi-chart-bar' },
      { path: '/revenue', label: 'MRR y suscripciones', icon: 'pi pi-dollar', also: siblings(MRR_TABS) },
      { path: '/store-sales', label: 'Ventas de tiendas', icon: 'pi pi-shopping-cart' }
    ]
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones y planes',
    items: [
      { path: '/subscriptions', label: 'Suscripciones', icon: 'pi pi-sync' },
      { path: '/plans', label: 'Planes', icon: 'pi pi-credit-card' }
    ]
  },
  {
    id: 'platform',
    label: 'Plataforma',
    items: [
      { path: '/broadcasts', label: 'Avisos a comercios', icon: 'pi pi-megaphone' },
      { path: '/assistant-questions', label: 'Preguntas al asistente', icon: 'pi pi-comments' },
      { path: '/plugins', label: 'Plugins', icon: 'pi pi-microchip' },
      { path: '/mcp-tokens', label: 'MCP Tokens', icon: 'pi pi-key' }
    ]
  }
]

const navItems = navGroups.flatMap(group => group.items)

// Solo las entradas que el rol puede abrir; un grupo que queda vacío no se muestra.
const visibleGroups = computed(() =>
  navGroups
    .map(group => ({ ...group, items: group.items.filter(item => authStore.canPath(item.path)) }))
    .filter(group => group.items.length > 0)
)

function isActive(path: string): boolean {
  if (route.path === path) return true

  // Una ruta que es pestaña de otra entrada resalta a su dueña y a nadie mas:
  // `/subscriptions/movement` vive bajo "MRR y suscripciones", no bajo
  // "Suscripciones", aunque su path empiece igual.
  const owner = navItems.find(item => item.also?.includes(route.path))
  if (owner) return owner.path === path

  // Avoid parent path matching when a more specific nav item exists
  const hasMoreSpecificMatch = navItems.some(
    item => item.path !== path && item.path.startsWith(path + '/') && (route.path === item.path || route.path.startsWith(item.path + '/'))
  )
  if (hasMoreSpecificMatch) return false
  return route.path.startsWith(path + '/')
}

// --- Grupos plegables ---
// Se recuerda cuales cerro cada persona. Es una comodidad: si el navegador no
// deja usar localStorage, el menu simplemente abre todo desplegado.
const STORAGE_KEY = 'superadmin.nav.collapsed'

function readCollapsed(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}

const collapsed = ref<string[]>(readCollapsed())

function isOpen(group: NavGroup): boolean {
  // El grupo de la pagina actual siempre se ve, aunque este marcado como
  // cerrado: perder de vista donde se esta parado desorienta.
  if (!group.label || group.items.some(item => isActive(item.path))) return true
  return !collapsed.value.includes(group.id)
}

function toggle(group: NavGroup) {
  // El grupo de la pagina actual no se pliega (ver isOpen): no se guarda nada.
  if (group.items.some(item => isActive(item.path))) return

  collapsed.value = isOpen(group)
    ? [...collapsed.value.filter(id => id !== group.id), group.id]
    : collapsed.value.filter(id => id !== group.id)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed.value))
  } catch {
    // Sin almacenamiento el estado dura lo que dura la pagina.
  }
}
</script>
