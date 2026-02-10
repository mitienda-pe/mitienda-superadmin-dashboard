# MiTienda Super Admin Dashboard

Panel de administración interno para monitoreo y gestión de la plataforma MiTienda. Permite a los super administradores visualizar métricas globales, gestionar tiendas, analizar revenue y hacer seguimiento del pipeline de trials.

## Tech Stack

- **Vue 3** + TypeScript + Composition API
- **Pinia** — State management
- **PrimeVue 3.52** — Component library
- **Tailwind CSS 3.4** — Utility-first styling
- **ECharts** (via vue-echarts) — Gráficos interactivos
- **Vite 5** — Build tool
- **date-fns** — Manejo de fechas
- **Axios** — HTTP client con interceptor JWT

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| **Overview Dashboard** | `/dashboard` | KPIs globales: MRR, tiendas activas, GMV, churn rate, gráficos de tendencia |
| **Tiendas** | `/stores` | Lista de tiendas con filtros, búsqueda y detalle individual (ventas, suscripción, productos top) |
| **Pipeline** | `/pipeline` | Pipeline de trials con readiness score, etapas automáticas, filtros por score/etapa |
| **Revenue Intelligence** | `/revenue` | MRR breakdown, análisis de cohortes, LTV por plan, churn por plan, análisis GMV |
| **Alertas** | `/alerts` | Feed de alertas por severidad (critical, high, medium, low) con filtrado |
| **Vista Inversionistas** | `/investor` | KPIs ejecutivos (MRR, ARR, ARPU, NRR, LTV), gráficos de evolución, exportación CSV |

## Estructura del Proyecto

```
src/
├── api/              # Clientes HTTP (axios interceptors, endpoints por módulo)
├── assets/           # Estilos globales
├── components/
│   ├── dashboard/    # Componentes del overview (KPI cards, charts)
│   ├── layout/       # DashboardLayout, SidebarNav
│   ├── pipeline/     # ReadinessScoreBadge, PipelineStageBadge
│   └── stores/       # Componentes de detalle de tienda
├── composables/      # useFormatters, useChartTheme
├── layouts/          # AuthLayout, DashboardLayout
├── router/           # Vue Router config con guards de autenticación
├── stores/           # Pinia stores (auth, dashboard, stores, pipeline, revenue)
├── types/            # TypeScript interfaces y tipos
└── views/            # Vistas por módulo (auth, dashboard, stores, pipeline, etc.)
```

## Backend

API REST en **PHP 8.4 + CodeIgniter 4** desplegada en `api2.mitienda.pe`.

Endpoints principales:
- `GET /superadmin/dashboard/*` — Métricas del dashboard
- `GET /superadmin/stores/*` — CRUD y detalle de tiendas
- `GET /superadmin/pipeline/leads` — Lista de leads del pipeline
- `GET /superadmin/pipeline/leads/:id` — Detalle de lead
- `GET /superadmin/revenue/*` — Revenue intelligence
- `GET /superadmin/alerts` — Alertas del sistema
- `GET /superadmin/investor/*` — KPIs para inversionistas

Comando de cálculo de métricas:
```bash
php spark pipeline:calculate-metrics         # Calcular métricas
php spark pipeline:calculate-metrics --dry-run  # Solo visualizar sin escribir
```

## Setup

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.development .env.local
# Editar VITE_API_BASE_URL si es necesario

# Servidor de desarrollo
npm run dev

# Type-check + build producción
npm run build

# Preview del build
npm run preview
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de la API | `https://api2.mitienda.pe/api/v1` |

## Autenticación

El dashboard requiere credenciales de super administrador. La autenticación usa JWT con refresh token automático. Los usuarios deben existir en la tabla `superadministradores` del backend.
