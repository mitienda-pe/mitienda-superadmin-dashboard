<template>
  <nav class="space-y-4">
    <div v-for="group in navGroups" :key="group.id">
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
import { ref } from 'vue'
import { useRoute } from 'vue-router'

interface NavItem {
  path: string
  label: string
  icon: string
}

interface NavGroup {
  id: string
  /** Sin etiqueta el grupo no tiene cabecera y no se puede plegar. */
  label?: string
  items: NavItem[]
}

const route = useRoute()

// El menu se agrupa por lo que la persona viene a hacer, no por el orden en
// que se fueron agregando los modulos. Las rutas no cambian.
const navGroups: NavGroup[] = [
  {
    id: 'home',
    items: [
      { path: '/dashboard', label: 'Resumen', icon: 'pi pi-home' },
      { path: '/alerts', label: 'Alertas', icon: 'pi pi-bell' }
    ]
  },
  {
    id: 'customers',
    label: 'Clientes',
    items: [
      { path: '/stores', label: 'Tiendas', icon: 'pi pi-shop' },
      { path: '/users', label: 'Usuarios', icon: 'pi pi-users' },
      { path: '/pipeline', label: 'Pipeline de trials', icon: 'pi pi-filter' },
      { path: '/complaints', label: 'Reclamos', icon: 'pi pi-flag' }
    ]
  },
  {
    id: 'billing',
    label: 'Facturación',
    items: [
      { path: '/billing/plan-sales', label: 'Ventas de planes', icon: 'pi pi-receipt' },
      { path: '/billing/commission-period', label: 'Cierre de comisiones', icon: 'pi pi-calendar-clock' },
      { path: '/billing/commissions', label: 'Comisiones emitidas', icon: 'pi pi-percentage' },
      { path: '/billing/invoices', label: 'Comprobantes', icon: 'pi pi-file-edit' },
      { path: '/billing/ledger', label: 'Líneas facturadas', icon: 'pi pi-list' },
      { path: '/billing/concepts', label: 'Conceptos facturados', icon: 'pi pi-th-large' },
      { path: '/billing/tags', label: 'Etiquetas', icon: 'pi pi-tags' }
    ]
  },
  {
    id: 'reports',
    label: 'Reportes',
    items: [
      { path: '/billing/income', label: 'Ingresos facturados', icon: 'pi pi-chart-bar' },
      { path: '/revenue', label: 'MRR y retención', icon: 'pi pi-dollar' },
      { path: '/subscriptions/movement', label: 'Movimiento de suscripciones', icon: 'pi pi-chart-line' },
      { path: '/store-sales', label: 'Ventas de tiendas', icon: 'pi pi-shopping-cart' },
      { path: '/investor', label: 'Inversionistas', icon: 'pi pi-briefcase' }
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
      { path: '/plugins', label: 'Plugins', icon: 'pi pi-microchip' },
      { path: '/mcp-tokens', label: 'MCP Tokens', icon: 'pi pi-key' }
    ]
  }
]

const navItems = navGroups.flatMap(group => group.items)

function isActive(path: string): boolean {
  if (route.path === path) return true
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
