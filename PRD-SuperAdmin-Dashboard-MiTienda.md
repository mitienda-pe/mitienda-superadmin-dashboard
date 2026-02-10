# MiTienda.pe — Super Admin Dashboard
## Product Requirements Document

**Sistema de Inteligencia Comercial y Reportes**

| | |
|---|---|
| **Autor** | Carlos — CPO / Co-founder |
| **Equipo** | Producto & Ingeniería |
| **Fecha** | Febrero 2026 |
| **Versión** | 1.0 |
| **Estado** | Draft |
| **Prioridad** | Alta |
| **Clasificación** | Confidencial |

---

## 1. Resumen Ejecutivo

MiTienda.pe es una plataforma SaaS de e-commerce que atiende a **300+ tiendas activas** y procesa **más de S/ 10 millones anuales** en transacciones. Actualmente la plataforma genera un MRR de **S/ 156,199** (ARR ~S/ 1.87M) con 246 suscripciones activas.

Este documento define los requerimientos para un Super Admin Dashboard que centralice la inteligencia comercial de la plataforma, permita monitorear la salud de cada tienda, predecir riesgos de churn y presentar métricas clave a inversionistas de forma inmediata.

### 1.1 Problema

- **Sin visibilidad operativa:** No existe un panel unificado para ver la salud del negocio. Los datos se extraen manualmente con queries SQL ad-hoc.
- **Churn reactivo:** En 2025 se perdieron 111 tiendas pagadas (48.3% churn bruto). No hay alertas tempranas ni indicadores predictivos.
- **Presentación a inversionistas:** Cada vez que se necesitan métricas para reuniones con inversionistas, se requieren horas de preparación manual.
- **Decisiones a ciegas:** No hay forma rápida de identificar qué tiendas están creciendo, cuáles están estancadas y cuáles necesitan intervención.

### 1.2 Objetivos

1. Reducir el churn mensual del 3.3% promedio a menos del 2% en 6 meses.
2. Tener métricas investor-ready disponibles en tiempo real, sin preparación manual.
3. Detectar tiendas en riesgo con al menos 30 días de anticipación para ejecutar acciones de retención.
4. Dar visibilidad tienda por tienda del rendimiento comercial para el equipo de Customer Success.

---

## 2. Contexto de Negocio

Estos son los números reales de la plataforma al cierre de esta fecha, extraídos directamente de la base de datos de producción.

### 2.1 Métricas Clave Actuales

| Métrica | Valor |
|---|---|
| MRR (Monthly Recurring Revenue) | S/ 156,199 |
| ARR (Annual Recurring Revenue) | S/ 1,874,390 |
| Suscripciones activas pagadas | 246 |
| ARPU (Avg Revenue Per User) | S/ 635 / mes |
| GMV último año (todas las tiendas) | S/ 10.38M |
| Órdenes procesadas último año | 45,595 |
| Ticket promedio | S/ 228 |
| Crecimiento ventas YoY | +3.6% |

### 2.2 Distribución de Revenue por Plan

| Plan | Clientes | MRR | % MRR | ARPU |
|---|---|---|---|---|
| Large | 47 | S/ 70,859 | 45.4% | S/ 1,508 |
| Medium | 68 | S/ 49,310 | 31.6% | S/ 725 |
| Small | 69 | S/ 32,468 | 20.8% | S/ 470 |
| Micro | 14 | S/ 3,513 | 2.2% | S/ 251 |

### 2.3 Análisis de Churn 2025

El churn es el principal desafío de crecimiento de la plataforma. Durante 2025, la pérdida de clientes superó la adquisición por un margen significativo.

| Mes | Inicio | Perdidas | Nuevas | Final | Churn % |
|---|---|---|---|---|---|
| Ene | 230 | 8 | 0 | 222 | 3.5% |
| Feb | 222 | 5 | 11 | 228 | 2.3% |
| Mar | 228 | 8 | 3 | 223 | 3.5% |
| Abr | 223 | 12 | 10 | 221 | 5.4% |
| May | 221 | 6 | 3 | 218 | 2.7% |
| Jun | 218 | 6 | 3 | 215 | 2.8% |
| Jul | 215 | 7 | 5 | 213 | 3.3% |
| Ago | 213 | 6 | 4 | 211 | 2.8% |
| Sep | 211 | 10 | 0 | 201 | 4.7% |
| Oct | 201 | 9 | 4 | 196 | 4.5% |
| Nov | 196 | 2 | 10 | 204 | 1.0% |
| **Dic** | **204** | **32** | **5** | **177** | **15.7%** |

El plan **Small concentra el 58.6% del churn** (65 de 111 tiendas). El churn mensual promedio es 3.3% (excluyendo diciembre). La pérdida neta fue de 62 clientes pagos en el año.

---

## 3. Arquitectura del Sistema

El Super Admin Dashboard se organiza en 5 módulos principales, cada uno diseñado para un caso de uso específico.

| Módulo | Propósito | Usuarios | Frecuencia |
|---|---|---|---|
| **Overview** | Vista ejecutiva del negocio. KPIs principales, tendencias y alertas. | CEO, CPO, Inversionistas | Diaria |
| **Revenue** | Análisis detallado de ingresos: MRR, ARR, churn, LTV, cohortes. | CEO, Finance, Inversionistas | Semanal |
| **Tiendas** | Vista individual de cada tienda: ventas, actividad, salud, riesgo. | Customer Success, Soporte | Diaria |
| **Alertas** | Sistema de detección temprana de riesgo de churn y anomalías. | Customer Success, CPO | En tiempo real |
| **Investor** | Vista optimizada para presentaciones: métricas limpias y exportables. | CEO, CPO | Bajo demanda |

---

## 4. Módulo: Overview Dashboard

Panel principal que muestra el estado general del negocio en una sola vista. Diseñado para ser la primera pantalla al abrir el sistema.

### 4.1 KPI Cards (fila superior)

Cada card muestra el valor actual, la variación porcentual vs. período anterior y una micro-sparkline de tendencia de los últimos 12 meses.

| KPI | Definición | Comparación |
|---|---|---|
| MRR | Suma de pagos mensualizados de suscripciones activas | vs. mes anterior + tendencia 12m |
| Tiendas Activas Pagadas | Tiendas con plan pago vigente (precio > 0) | vs. mes anterior |
| GMV Plataforma | Gross Merchandise Value total procesado por todas las tiendas | vs. mismo período año anterior |
| Churn Rate | % de tiendas que no renovaron en el mes actual | vs. promedio 3 meses |
| ARPU | MRR / total tiendas pagadas activas | vs. mes anterior |
| Net Revenue Retention | (MRR inicio - churn + expansion) / MRR inicio | vs. mes anterior |

### 4.2 Gráficos Principales

- **Evolución MRR (12 meses):** Gráfico de área con línea de tendencia. Segmentado por plan (Large, Medium, Small, Micro) como áreas apiladas.
- **Churn vs. Nuevos Clientes (12 meses):** Gráfico de barras dual: barras rojas (churn) vs. verdes (nuevos). Línea superpuesta mostrando neto mensual.
- **GMV por Mes (12 meses):** Barras con línea de tendencia. Opción de filtrar por origen (web, POS, API).
- **Distribución de Tiendas por Plan:** Donut chart con breakdown actual y comparación con inicio de año.

### 4.3 Tabla Resumen de Actividad

Tabla de las 20 tiendas con mayor actividad reciente, mostrando: nombre, plan, ventas del mes, ventas mes anterior, variación %, órdenes del mes, último pedido y un semáforo de salud (verde/amarillo/rojo).

---

## 5. Módulo: Revenue Intelligence

Análisis profundo de ingresos de la plataforma. Orientado a entender la dinámica financiera del negocio SaaS y a detectar oportunidades de crecimiento.

### 5.1 Métricas de Suscripciones

- **MRR Breakdown:** New MRR (nuevas suscripciones), Expansion MRR (upgrades), Contraction MRR (downgrades), Churned MRR (cancelaciones), Net New MRR.
- **Cohort Analysis:** Retención por cohorte mensual de adquisición. Tabla de calor mostrando % de retención en meses 1, 3, 6 y 12.
- **LTV (Lifetime Value):** ARPU / churn rate mensual. Segmentado por plan. Incluye LTV:CAC ratio cuando se disponga de datos de adquisición.
- **Plan Migration:** Sankey diagram o tabla mostrando upgrades y downgrades entre planes en un período.

### 5.2 GMV y Comisiones

- **GMV Total:** Volumen total de transacciones procesadas. Desglose por origen (web, POS, API), método de pago (Culqi, Niubiz, transferencia, etc.) y categoría de tienda.
- **Take Rate:** Revenue plataforma / GMV total. Evolución mensual para medir si estamos capturando más valor.
- **Top 10 Tiendas por GMV:** Con % de concentración. Alerta si una tienda representa más del 10% del GMV total (riesgo de dependencia).

### 5.3 Análisis de Churn Detallado

- **Churn por Plan:** Tasa mensual de churn segmentada por plan. Identificar qué segmentos pierden más clientes.
- **Revenue Churn vs. Logo Churn:** Distinguir si se pierden muchas tiendas pequeñas vs. pocas tiendas grandes. Impacto real en MRR.
- **Survival Curve:** Probabilidad de que una tienda siga activa después de 1, 3, 6 y 12 meses desde su primera suscripción pagada.
- **Motivos de Baja:** Campo estructurado (a implementar) para registrar razón de cancelación. Dashboard con distribución de motivos.

---

## 6. Módulo: Ficha de Tienda

Vista detallada tienda por tienda. Permite al equipo de Customer Success tener una **fotografía completa** de cada cliente en una sola pantalla. Esta es la herramienta principal para intervención proactiva.

### 6.1 Encabezado de Tienda

Barra superior con: logo de la tienda, nombre, slug, plan actual, fecha de vencimiento del plan, semáforo de salud (Health Score) y botón de acceso directo al storefront.

### 6.2 Health Score

Indicador compuesto de 0-100 que resume la salud de la tienda. Se calcula en base a los siguientes factores ponderados:

| Factor | Peso | Cálculo |
|---|---|---|
| Tendencia de ventas (30d vs 30d anteriores) | 30% | Positiva = 100, Estable (<-10%) = 60, Caída (-10% a -30%) = 30, Caída fuerte (>-30%) = 0 |
| Frecuencia de órdenes | 20% | Órdenes últimos 7 días vs. promedio semanal histórico. Sin órdenes en 7 días = 0 |
| Días para vencimiento del plan | 20% | >90 días = 100, 60-90 = 80, 30-60 = 50, <30 = 20, Vencido = 0 |
| Actividad en admin (logins) | 15% | Login en últimas 48h = 100, última semana = 60, último mes = 20, más = 0 |
| Productos activos y catálogo | 15% | >50 productos = 100, 20-50 = 70, 5-20 = 40, <5 = 10 |

**Clasificación:** 🟢 Saludable (80-100) | 🟡 En observación (50-79) | 🟠 En riesgo (20-49) | 🔴 Crítico (0-19)

### 6.3 Panel de Ventas

- **Ventas del Mes / Mes Anterior / Mismo Mes Año Anterior:** Cards con variación porcentual.
- **Gráfico de Ventas Diarias:** Línea con los últimos 90 días. Indicador de tendencia (pendiente de regresión lineal).
- **Distribución por Día de la Semana:** Heatmap mostrando qué días vende más la tienda.
- **Top Productos:** Los 10 productos más vendidos por revenue y por cantidad.
- **Órdenes Recientes:** Tabla con las últimas 20 órdenes: fecha, monto, estado de pago, método de pago.

### 6.4 Panel de Suscripción

- **Plan Actual:** Nombre, precio, fecha inicio, fecha vencimiento, días restantes.
- **Historial de Planes:** Timeline visual de todos los planes que ha tenido la tienda (upgrades, downgrades, renovaciones).
- **LTV Acumulado:** Total pagado a MiTienda.pe desde el primer plan.
- **Predicción de Renovación:** Probabilidad estimada de que renueve basada en Health Score y comportamiento histórico.

### 6.5 Panel de Configuración y Uso

- **Integraciones activas:** Pasarelas de pago, couriers, facturación electrónica, NetSuite.
- **Features utilizadas:** Cupones, combos, blogs, páginas personalizadas, link de pago, QR.
- **Métricas de catálogo:** Total productos, productos activos, categorías, variantes.
- **Último login:** Fecha y frecuencia de acceso del administrador de la tienda.

---

## 7. Módulo: Alertas y Predicción de Churn

Sistema proactivo que identifica tiendas en riesgo antes de que cancelen, dando tiempo al equipo de Customer Success para intervenir.

### 7.1 Señales de Riesgo

El sistema monitorea las siguientes señales y genera alertas automáticas cuando se detectan patrones negativos:

| Señal | Severidad | Trigger | Acción Sugerida |
|---|---|---|---|
| Caída de ventas >30% vs mes anterior | Alta | Automático diario | Contacto directo en 48h |
| Sin órdenes en 14+ días | Alta | Automático diario | Email automatizado + seguimiento |
| Sin login en 30+ días | Media | Automático semanal | Email de re-engagement |
| Plan vence en <30 días + Health Score <50 | Crítica | Automático diario | Llamada de retención |
| Downgrade de plan | Media | Evento inmediato | Encuesta + oferta personalizada |
| Ventas estancadas 3 meses consecutivos | Media | Automático mensual | Sesión de consultoría gratuita |
| Primera semana sin configurar tienda | Baja | Automático semanal | Onboarding guiado |

### 7.2 Score de Riesgo de Churn

Cada tienda recibe un Risk Score de 0-100 (inverso al Health Score). El score se recalcula diariamente y alimenta un ranking de priorización para el equipo de retención.

- **Riesgo Bajo (0-25):** Tienda saludable, sin acción requerida.
- **Riesgo Moderado (26-50):** Monitorear. Incluir en lista de seguimiento semanal.
- **Riesgo Alto (51-75):** Intervenir. Contactar proactivamente esta semana.
- **Riesgo Crítico (76-100):** Urgente. Acción inmediata: llamada, oferta de retención, escalamiento.

### 7.3 Dashboard de Alertas

- Feed cronológico de alertas con filtros por severidad, tipo de señal, plan y fecha.
- Contador de alertas activas por severidad en el header del módulo.
- Cada alerta es accionable: botón para ver ficha de tienda, marcar como atendida o asignar a un miembro del equipo.
- Resumen semanal automatizado por email al equipo con las tiendas más críticas.

---

## 8. Módulo: Investor View

Vista simplificada y optimizada para presentaciones a inversionistas. Muestra solo las métricas que importan para evaluar el negocio, con diseño limpio y exportable.

### 8.1 Métricas Principales

Cards grandes con las métricas que todo inversionista quiere ver de un SaaS:

| Métrica | Valor Actual | Contexto |
|---|---|---|
| MRR | S/ 156,199 | Evolución 12m con CAGR |
| ARR | S/ 1,874,390 | Run rate anualizado |
| Tiendas Pagadas | 168 | Solo planes con pago efectivo |
| ARPU | S/ 635/mes | Tendencia y distribución por plan |
| Net Revenue Retention | Por calcular | Meta: >100% |
| Gross Churn | 3.3% mensual | Meta: <2% |
| GMV Procesado | S/ 10.38M/año | Crecimiento YoY: +3.6% |
| LTV Promedio | Por calcular | LTV:CAC ratio |

### 8.2 Gráficos para Inversionistas

- **MRR Evolution (24 meses):** Línea limpia con hitos marcados (lanzamientos, partnerships, etc).
- **Revenue Composition:** Stacked area por plan mostrando diversificación de ingresos.
- **Unit Economics:** ARPU, LTV, payback period en un solo gráfico de barras comparativo.
- **Cohort Retention:** Heatmap de retención por cohorte. La métrica más reveladora para un inversionista SaaS.

### 8.3 Exportación

- Exportar vista completa como PDF branded con logo MiTienda.
- Exportar datos en CSV/Excel para due diligence.
- Modo presentación: pantalla completa optimizada para proyectar en reuniones.
- Snapshot mensual automático: guardar estado de métricas al cierre de cada mes como registro histórico.

---

## 9. Requerimientos Técnicos

### 9.1 Stack Tecnológico

Alineado con el stack actual de MiTienda.pe para maximizar la velocidad de desarrollo y el conocimiento existente del equipo.

| Componente | Tecnología |
|---|---|
| Backend | PHP 8 + CodeIgniter 4 (extensión del backend existente de MiTienda) |
| Frontend | Vue 3 (Composition API) + Chart.js o Apache ECharts para visualizaciones |
| Base de Datos | MySQL 8 (misma instancia de producción, con read replica para queries pesadas) |
| Cache | Redis para métricas precalculadas y Health Scores |
| Jobs/Cron | CI4 Tasks para recalcular scores diariamente y enviar alertas |
| Autenticación | Sistema existente de MiTienda con rol `super_admin` |
| Exportación | DOMPDF para reportes PDF, PhpSpreadsheet para Excel |

### 9.2 Arquitectura de Datos

- **Read Replica:** Las queries de reportería NO deben ejecutarse sobre la base de datos principal. Usar una read replica de MySQL para evitar impacto en producción. Esto es crítico dado los problemas previos de metadata locks.
- **Tablas de Métricas Precalculadas:** Crear tablas intermedias (`tiendas_metricas_diarias`, `tiendas_health_scores`) que se actualicen via cron jobs nocturnos. El dashboard lee de estas tablas, nunca hace queries pesados en tiempo real.
- **Cache Layer:** Redis para KPI cards del Overview y métricas que no cambian más de una vez al día. TTL de 1 hora para datos de ventas, 24h para métricas de suscripción.
- **Multi-tenant Awareness:** Todas las queries deben estar scopeadas por `tienda_id`. Nunca asumir que `user_id = tienda_id`. Un usuario puede tener múltiples tiendas.

### 9.3 Performance

- Overview dashboard debe cargar en menos de 2 segundos (lectura desde cache/tablas precalculadas).
- Ficha de tienda debe cargar en menos de 3 segundos.
- Queries de reportería no deben exceder 5 segundos.
- Health Score se recalcula para todas las tiendas en el cron nocturno (no en tiempo real).

---

## 10. Roadmap de Implementación

El desarrollo se divide en 4 fases incrementales. Cada fase entrega valor utilizable al equipo.

| Fase | Timeline | Entregables | Impacto |
|---|---|---|---|
| **Fase 1** | Semanas 1-3 | Overview Dashboard: KPI cards, gráficos MRR/Churn, tabla de actividad. Infraestructura base (read replica, tablas precalculadas, cache). | Visibilidad inmediata del negocio. Elimina queries manuales. |
| **Fase 2** | Semanas 4-6 | Ficha de Tienda: Health Score, panel de ventas, panel de suscripción, historial. Listado de tiendas con filtros y búsqueda. | Customer Success puede actuar sobre datos concretos por tienda. |
| **Fase 3** | Semanas 7-9 | Revenue Intelligence: Cohort analysis, MRR breakdown, LTV, plan migration. Módulo de Alertas: señales de riesgo, feed de alertas, notificaciones. | Capacidad predictiva. Intervención proactiva antes del churn. |
| **Fase 4** | Semanas 10-12 | Investor View: métricas limpias, exportación PDF/Excel, modo presentación. Refinamiento UX y performance optimization. | Listo para presentar a inversionistas sin preparación. |

---

## 11. Métricas de Éxito

El éxito del proyecto se medirá contra los siguientes KPIs, evaluados 6 meses después del lanzamiento completo:

1. **Churn mensual < 2%:** Reducción del 3.3% actual gracias a la detección temprana y acciones de retención.
2. **Tiempo de preparación para inversionistas < 5 minutos:** Vs. las 2-4 horas actuales de queries manuales.
3. **100% de tiendas en riesgo contactadas antes de vencimiento:** Ninguna tienda con Risk Score >75 debe vencer sin haber sido contactada.
4. **NRR (Net Revenue Retention) > 95%:** Demostrar que los clientes existentes mantienen o incrementan su gasto.
5. **Adopción: equipo usa el dashboard diariamente:** Medido por logins al panel admin. Meta: 5+ sesiones semanales por miembro del equipo.

---

## 12. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Queries pesadas impactan producción | Alto: podría afectar la experiencia de las tiendas | Read replica obligatoria + tablas precalculadas + caching agresivo |
| Health Score no predice churn con precisión | Medio: falsas alarmas o tiendas no detectadas | Calibrar pesos con data histórica de 2025. Iterar mensualmente |
| Equipo no adopta el dashboard | Medio: inversión sin retorno | Involucrar CS desde Fase 1. Diseñar para sus workflows reales |
| Scope creep por feature requests | Medio: retraso en entregas | Roadmap fijo por fase. Features nuevas van a Fase N+1 |
| Datos históricos incompletos | Bajo: métricas de cohorte limitadas | Empezar tracking desde día 1. Usar data existente donde sea posible |
