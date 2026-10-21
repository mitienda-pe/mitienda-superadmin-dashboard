// Pantallas que comparten una entrada del menu lateral y se alternan con
// pestañas (ver SectionTabs). La primera de cada lista es la que abre el menu;
// SidebarNav usa las demas para saber que entrada resaltar.

export interface SectionTab {
  to: string
  label: string
  icon?: string
}

export const HOME_TABS: SectionTab[] = [
  { to: '/dashboard', label: 'Resumen', icon: 'pi pi-home' },
  { to: '/alerts', label: 'Alertas', icon: 'pi pi-bell' }
]

export const STORES_TABS: SectionTab[] = [
  { to: '/stores', label: 'Tiendas', icon: 'pi pi-shop' },
  { to: '/users', label: 'Usuarios', icon: 'pi pi-users' }
]

export const INVOICES_TABS: SectionTab[] = [
  { to: '/billing/invoices', label: 'Todos los comprobantes', icon: 'pi pi-file-edit' },
  { to: '/billing/commissions', label: 'Comisiones emitidas', icon: 'pi pi-percentage' }
]

export const ACCOUNTING_TABS: SectionTab[] = [
  { to: '/accounting/expenses', label: 'Gastos', icon: 'pi pi-wallet' },
  { to: '/accounting/banks', label: 'Bancos', icon: 'pi pi-building-columns' },
  { to: '/accounting/payroll', label: 'Planilla', icon: 'pi pi-id-card' },
  { to: '/accounting/results', label: 'Resultados', icon: 'pi pi-chart-bar' },
  { to: '/accounting/cash-flow', label: 'Flujo de caja', icon: 'pi pi-calendar' },
  { to: '/accounting/taxes', label: 'Impuestos', icon: 'pi pi-percentage' },
  { to: '/accounting/journal', label: 'Libro diario y mayor', icon: 'pi pi-book' },
  { to: '/accounting/payees', label: 'Proveedores y personal', icon: 'pi pi-users' },
  { to: '/accounting/categories', label: 'Categorías', icon: 'pi pi-tags' },
  { to: '/accounting/chart', label: 'Plan de cuentas', icon: 'pi pi-sitemap' }
]

export const MRR_TABS: SectionTab[] = [
  { to: '/revenue', label: 'MRR y retención', icon: 'pi pi-dollar' },
  { to: '/subscriptions/movement', label: 'Movimiento de suscripciones', icon: 'pi pi-chart-line' }
]
