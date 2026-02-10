# MiTienda Super Admin Dashboard — Implementation Plan

> **Backup del plan de implementacion** — Febrero 2026

## Context

MiTienda.pe is a SaaS e-commerce platform with 300+ stores, S/156K MRR, processing S/10M+ annually. Currently there is **no unified dashboard** for platform-wide metrics. Data is extracted via manual SQL queries. The churn rate is 3.3%/month and there are no early warning systems.

This plan covers building a **Super Admin Dashboard** (Vue 3 frontend + CI4 backend API) following the PRD at `PRD-SuperAdmin-Dashboard-MiTienda.md`. We'll follow the exact patterns from the existing backoffice project.

### Decisions Confirmed

- **Chart library:** Apache ECharts (via `vue-echarts`)
- **Scope:** Phase 1 fully built + placeholder views for all 5 modules
- **Data strategy:** Live SQL queries first, no precalculated tables yet

---

## Phase 1: Foundation + Overview Dashboard

### 1.1 Backend — Auth Trait (shared with existing SuperAdminController)

**New file:** `mitienda-api-ci4/app/Libraries/SuperAdminAuthTrait.php`

Extract `requireAuth()`, `getSuperAdminInfo()`, and `getBearerToken()` from the existing `SuperAdminController.php` into a reusable trait. Both the existing controller and the new dashboard controller will use it.

Reference: `mitienda-api-ci4/app/Controllers/V1/SuperAdminController.php` lines 749-836

### 1.2 Backend — New Controller

**New file:** `mitienda-api-ci4/app/Controllers/V1/SuperAdminDashboardController.php`

Uses the `SuperAdminAuthTrait`. Routes go inside the existing `filter => 'auth'` group (line 668 of Routes.php). The AuthFilter requires `store_id` in the JWT (line 56 of AuthFilter.php), which works because superadmin users log in with an associated store. The controller then verifies superadmin status via `getSuperAdminInfo()`.

Queries use `\Config\Database::connect('mitienda')` directly (raw query builder) for cross-store aggregation — same pattern as the existing `SuperAdminController`.

**Phase 1 endpoints:**

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/v1/superadmin/dashboard/overview` | All 6 KPI cards with sparkline data (12mo) |
| `GET` | `/api/v1/superadmin/dashboard/mrr-evolution` | 12-month MRR stacked by plan |
| `GET` | `/api/v1/superadmin/dashboard/churn-vs-new` | 12-month churn vs new stores |
| `GET` | `/api/v1/superadmin/dashboard/gmv-monthly` | 12-month GMV |
| `GET` | `/api/v1/superadmin/dashboard/plan-distribution` | Store distribution by plan (donut) |
| `GET` | `/api/v1/superadmin/dashboard/activity-table` | Top 20 stores by recent activity |

**Key SQL patterns:**
- MRR: `SUM()` from `tiendasplanes` where `tiendaplan_status=1`, `tiendaplan_precio > 0`, `tiendaplan_fechafinal >= CURDATE()`, normalized to monthly (divide annual by 12, etc.)
- Active Paid Stores: `COUNT(DISTINCT tienda_id)` from same table
- GMV: `SUM(tiendaventa_totalpagar)` from `tiendasventas` where `tiendaventa_pagado=1`
- Churn: stores whose plan expired in the period vs start count
- Activity table: join `tiendas` + latest `tiendasplanes` + `tiendasventas` aggregated by month

### 1.3 Backend — Routes Update

**File to modify:** `mitienda-api-ci4/app/Config/Routes.php` (line ~674, after existing superadmin routes)

Add 6 GET routes inside the existing `filter => 'auth'` group.

### 1.4 Backend — CORS Update

**File to modify:** `mitienda-api-ci4/app/Filters/CorsFilter.php`

Add `http://localhost:5174` (Vite dev) and the production domain for the dashboard.

### 1.5 Frontend — Project Scaffolding

**Root:** `/Users/carlosvidal/www/mitienda/mitienda-superdadmin-dashboard-Vue3/`

Initialize with Vite + Vue 3 + TypeScript. Install dependencies matching backoffice:

```
vue@^3.4.21, vue-router@^4.3.0, pinia@^2.1.7, primevue@^3.52.0, primeicons@^7.0.0,
axios@^1.6.8, date-fns@^3.6.0, tailwindcss@^3.4.3, echarts@^5.5.0, vue-echarts@^7.0.0
```

**Config files to create:**
- `package.json` — deps matching backoffice + echarts
- `vite.config.ts` — port 5174, proxy `/api/v1` and `/auth` → `https://api2.mitienda.pe`
- `tsconfig.json` — copy from backoffice
- `tailwind.config.js` — same colors (primary #00b2a6, secondary #333333)
- `postcss.config.js` — tailwindcss + autoprefixer
- `index.html` — title "MiTienda - Super Admin"
- `.env.development` — `VITE_API_BASE_URL=/api/v1`
- `.env.example`

### 1.6 Frontend — Core Files

**Copy/adapt from backoffice:**
- `src/api/axios.ts` — identical interceptor pattern (Bearer token, response normalization, token refresh queue)
- `src/assets/styles/main.css` — Tailwind directives + PrimeVue CSS variable mapping

**New files:**
- `src/main.ts` — createApp, Pinia, Router, PrimeVue, ToastService
- `src/App.vue` — root component with Toast + ConfirmDialog
- `src/vite-env.d.ts` — env type declarations

### 1.7 Frontend — Auth

**Files:**
- `src/types/auth.types.ts` — User, LoginCredentials, SuperAdminInfo interfaces
- `src/types/api.types.ts` — ApiResponse<T> interface (copy from backoffice)
- `src/api/auth.api.ts` — login, checkSuperAdmin, getStores, selectStore, logout, refresh
- `src/stores/auth.store.ts` — simplified from backoffice: login → fetchStores → selectStore → checkSuperAdmin. **Must verify `isSuperAdmin` is true after login, redirect to error/denied if not.**
- `src/views/auth/LoginView.vue` — login form with email/password
- `src/layouts/AuthLayout.vue` — centered card layout for login

### 1.8 Frontend — Layout + Router

**Files:**
- `src/layouts/DashboardLayout.vue` — header + sidebar + main content area. Sidebar nav: Overview, Tiendas, Revenue, Alertas, Inversionistas.
- `src/components/layout/SidebarNav.vue` — nav items with active state
- `src/router/index.ts` — routes with `meta: { requiresAuth: true, requiresSuperAdmin: true }`, navigation guard, lazy-loaded views

**Routes (all 5 modules scaffolded as placeholders):**

```
/login → LoginView (AuthLayout)
/dashboard → OverviewDashboardView (DashboardLayout) ← fully built in Phase 1
/stores → StoresListView (DashboardLayout) ← placeholder "Coming soon"
/stores/:id → StoreDetailView (DashboardLayout) ← placeholder
/revenue → RevenueView (DashboardLayout) ← placeholder
/alerts → AlertsView (DashboardLayout) ← placeholder
/investor → InvestorView (DashboardLayout) ← placeholder
```

### 1.9 Frontend — Dashboard Overview

**Types:**
- `src/types/dashboard.types.ts` — KpiValue, DashboardKPIs, MrrEvolutionData, ChurnVsNewData, GmvMonthlyData, PlanDistributionData, StoreActivity

**API:**
- `src/api/dashboard.api.ts` — getOverview, getMrrEvolution, getChurnVsNew, getGmvMonthly, getPlanDistribution, getActivityTable

**Store:**
- `src/stores/dashboard.store.ts` — state for all overview data, `fetchAll()` calls all endpoints in parallel

**Components:**
- `src/components/ui/KpiCard.vue` — card with formatted value, change %, sparkline (PEN currency, %, number formats)
- `src/components/ui/SparklineChart.vue` — mini ECharts sparkline
- `src/components/ui/HealthBadge.vue` — colored badge (green/yellow/orange/red)
- `src/components/ui/LoadingState.vue` — skeleton placeholder
- `src/components/charts/MrrEvolutionChart.vue` — stacked area (ECharts)
- `src/components/charts/ChurnVsNewChart.vue` — dual bar + net line (ECharts)
- `src/components/charts/GmvMonthlyChart.vue` — bar + trend line (ECharts)
- `src/components/charts/PlanDistributionChart.vue` — donut chart (ECharts)
- `src/components/dashboard/ActivityTable.vue` — PrimeVue DataTable with health badge

**Composables:**
- `src/composables/useFormatters.ts` — formatCurrency (S/), formatPercent, formatNumber, formatDate
- `src/composables/useChartTheme.ts` — ECharts color palette and defaults

**View:**
- `src/views/dashboard/OverviewDashboardView.vue` — assembles KPI row + 2x2 chart grid + activity table

---

## Phase 2: Store Listing + Store Detail

### Backend

Add to `SuperAdminDashboardController`:

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/v1/superadmin/dashboard/stores` | Enhanced store list with health, sales, filters |
| `GET` | `/api/v1/superadmin/dashboard/stores/:id` | Full store detail (ficha) |
| `GET` | `/api/v1/superadmin/dashboard/stores/:id/sales` | 90-day daily sales chart |
| `GET` | `/api/v1/superadmin/dashboard/stores/:id/orders` | Last 20 orders |
| `GET` | `/api/v1/superadmin/dashboard/stores/:id/subscription-history` | Plan timeline |
| `GET` | `/api/v1/superadmin/dashboard/stores/:id/top-products` | Top 10 products |

Health Score calculation (0-100): sales trend 30%, order frequency 20%, plan expiry 20%, admin logins 15%, catalog size 15%.

### Frontend

- `src/views/stores/StoresListView.vue` — PrimeVue DataTable, filters (plan, health, search), pagination
- `src/views/stores/StoreDetailView.vue` — tabbed: Sales, Subscription, Usage
- `src/stores/stores.store.ts` + `src/api/stores.api.ts` + `src/types/store.types.ts`
- `src/components/stores/StoreHeader.vue`, `HealthScoreGauge.vue`, `SalesPanel.vue`, `SubscriptionPanel.vue`
- `src/components/charts/DailySalesChart.vue`, `WeekdayHeatmap.vue`

---

## Phase 3: Revenue Intelligence + Alerts

### Backend

Revenue endpoints: MRR breakdown, cohort analysis, LTV by plan, plan migration, GMV analysis, churn analysis, survival curve.

Alerts: new `superadmin_alerts` table + cron command `php spark superadmin:generate-alerts` for daily risk signal detection.

### Frontend

- Revenue view with tabs (Subscriptions, GMV, Churn)
- Cohort heatmap, MRR breakdown waterfall, survival curve
- Alerts feed with severity filters, action buttons

---

## Phase 4: Investor View + Exports

### Backend

Clean investor KPIs endpoint, 24-month MRR, unit economics. PDF/CSV export endpoints using DOMPDF + PhpSpreadsheet.

### Frontend

- Clean, presentation-ready view with large KPI cards
- Export buttons (PDF, CSV)
- Presentation mode (fullscreen, hide sidebar)

---

## Implementation Order (Phase 1)

1. Backend: Create `SuperAdminAuthTrait` ✅
2. Backend: Create `SuperAdminDashboardController` with all Phase 1 endpoints ✅
3. Backend: Add routes + update CORS filter
4. Frontend: Vite scaffolding + install deps + config files
5. Frontend: `axios.ts` + `main.ts` + `App.vue` + styles
6. Frontend: Auth (types, API, store, LoginView, AuthLayout)
7. Frontend: Router + DashboardLayout + SidebarNav
8. Frontend: Dashboard types + API + store
9. Frontend: KpiCard + SparklineChart + formatters
10. Frontend: 4 chart components (MRR, Churn, GMV, Plan Distribution)
11. Frontend: ActivityTable
12. Frontend: OverviewDashboardView (wire everything together)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `mitienda-api-ci4/app/Controllers/V1/SuperAdminController.php` | Auth pattern to reuse (requireAuth, getSuperAdminInfo) |
| `mitienda-api-ci4/app/Filters/AuthFilter.php:56` | Requires `store_id != 0` in JWT |
| `mitienda-api-ci4/app/Config/Routes.php:668-674` | Where to add new routes |
| `mitienda-api-ci4/app/Filters/CorsFilter.php` | Add new origin |
| `mitienda-backoffice-Vue3/src/api/axios.ts` | Copy for API client |
| `mitienda-backoffice-Vue3/src/stores/auth.store.ts` | Auth store pattern |
| `mitienda-backoffice-Vue3/package.json` | Dependency versions |
| `mitienda-backoffice-Vue3/vite.config.ts` | Vite config pattern |
| `mitienda-backoffice-Vue3/tailwind.config.js` | Tailwind theme |

---

## Files Created So Far

### Backend (CI4)

| File | Status |
|------|--------|
| `app/Libraries/SuperAdminAuthTrait.php` | Created |
| `app/Controllers/V1/SuperAdminDashboardController.php` | Created |

### Frontend (Vue 3)

Pending — starting from step 3 onwards.

---

## Verification

1. **Backend:** Call each endpoint with a superadmin JWT and verify JSON response structure
2. **Frontend:** `npm run dev` → login with superadmin credentials → verify Overview loads with KPI cards + charts + table
3. **Auth guard:** Non-superadmin users should be redirected to an access-denied page
4. **CORS:** Verify no CORS errors from `localhost:5174`
