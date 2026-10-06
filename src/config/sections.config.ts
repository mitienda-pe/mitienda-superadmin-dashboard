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

export const MRR_TABS: SectionTab[] = [
  { to: '/revenue', label: 'MRR y retención', icon: 'pi pi-dollar' },
  { to: '/subscriptions/movement', label: 'Movimiento de suscripciones', icon: 'pi pi-chart-line' }
]
