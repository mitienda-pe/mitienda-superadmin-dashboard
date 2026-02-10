# MiTienda.pe — Pipeline & Trial Intelligence
## Product Requirements Document

**Módulo de Conversión de Trials, Lead Scoring y Pseudo-CRM**

| | |
|---|---|
| **Autor** | Carlos — CPO / Co-founder |
| **Equipo** | Producto & Ingeniería |
| **Fecha** | Febrero 2026 |
| **Versión** | 1.0 |
| **Estado** | Draft |
| **Prioridad** | Alta |
| **Clasificación** | Confidencial |
| **Dependencia** | PRD Super Admin Dashboard v1.0 |

---

## 1. Resumen Ejecutivo

MiTienda.pe recibe en promedio **120 registros de prueba gratis cada mes**, pero solo convierte el **1.6%** a planes pagados. No existe visibilidad sobre qué hacen estos trials, cuáles están listos para comprar ni cuándo contactarlos. El equipo no tiene herramientas para priorizar ni hacer seguimiento.

Este documento define los requerimientos para un módulo de Pipeline & Trial Intelligence integrado al Super Admin Dashboard. El objetivo es convertir el flujo actual de trials — que hoy es un agujero negro — en un pipeline de ventas gestionable, con scoring automático, seguimiento estructurado y automatizaciones que multipliquen la tasa de conversión.

### 1.1 Problema

- **91.6% de los trials no hacen nada:** De cada 120 registros mensuales, ~110 nunca cargan un producto. No hay forma de distinguir a los interesados reales de los curiosos.
- **Sin priorización:** El equipo no sabe cuáles trials están activamente configurando su tienda, cuáles ya vendieron y cuáles abandonaron. Todos se ven iguales.
- **Sin seguimiento:** No existe registro de si alguien contactó a un trial, qué se habló, ni cuándo hacer follow-up. Cada intento de venta parte de cero.
- **Conversión invisible:** No se mide el funnel de activación ni se entiende en qué paso se pierden los potenciales clientes.
- **Costo de oportunidad enorme:** Los datos muestran que un trial que carga 20+ productos convierte al 81.3%, y uno que logra su primera venta convierte al 64.3%. Estos leads se están perdiendo por falta de acción.

### 1.2 Objetivos

1. Aumentar la tasa de conversión de trial a pago del 1.6% al 5% en 6 meses (de ~2 clientes nuevos/mes a ~6).
2. Reducir el tiempo de conversión de 23 días promedio a 15 días.
3. Asegurar que el 100% de los Hot Leads (score >70) sean contactados dentro de 48 horas.
4. Tener visibilidad completa del pipeline de ventas: cuántos leads, en qué etapa, qué valor representan.
5. Establecer un proceso repetible y medible de ventas para el equipo.

### 1.3 Impacto en el Negocio

| Escenario | Trials/mes | Conversión | Nuevos clientes/mes | Revenue mensual nuevo (ARPU S/ 635) |
|---|---|---|---|---|
| **Actual** | 120 | 1.6% | ~2 | S/ 1,270 |
| **Objetivo (6m)** | 120 | 5% | 6 | S/ 3,810 |
| **Optimista (12m)** | 120 | 8% | ~10 | S/ 6,350 |

Con el churn actual de ~7 bajas/mes, pasar de 2 a 6 nuevos clientes/mes invierte la ecuación: de perder 5 clientes netos/mes a perder solo 1. Combinado con las iniciativas de retención del Super Admin Dashboard, el negocio pasa a crecimiento neto.

---

## 2. Contexto: Data Real del Funnel Actual

Todos los datos de esta sección fueron extraídos de la base de datos de producción en febrero 2026.

### 2.1 Volumen de Trials

En promedio, MiTienda registra **120 nuevos trials por mes** (rango: 55-232). La tendencia de 2025 muestra estabilidad con picos estacionales en abril, agosto y noviembre.

| Período | Promedio mensual | Total |
|---|---|---|
| 2024 | 151 trials/mes | 1,816 |
| 2025 | 110 trials/mes | 1,324 |

### 2.2 Conversión por Cohorte

La conversión histórica es baja y errática, sin tendencia de mejora:

| Cohorte | Trials | Convertidos | Conversión |
|---|---|---|---|
| Q1 2024 | 444 | 8 | 1.8% |
| Q2 2024 | 425 | 10 | 2.4% |
| Q3 2024 | 509 | 4 | 0.8% |
| Q4 2024 | 438 | 8 | 1.8% |
| Q1 2025 | 312 | 4 | 1.3% |
| Q2 2025 | 355 | 8 | 2.3% |
| Q3 2025 | 333 | 6 | 1.8% |
| Q4 2025 | 360 | 5 | 1.4% |

### 2.3 Señales Predictivas de Conversión

El hallazgo más importante: **la actividad del trial durante los primeros días predice la conversión con altísima precisión.**

**Por nivel de catálogo:**

| Productos cargados | Tiendas | Convertidas | Conversión |
|---|---|---|---|
| 0 productos | 1,325 | 4 | **0.3%** |
| 1-5 productos | 66 | 3 | **4.5%** |
| 6-20 productos | 39 | 3 | **7.7%** |
| 20+ productos | 16 | 13 | **81.3%** |

**Por ventas durante trial:**

| Ventas realizadas | Tiendas | Convertidas | Conversión |
|---|---|---|---|
| 0 ventas | 1,367 | 5 | **0.4%** |
| 1-5 ventas | 65 | 9 | **13.8%** |
| 5+ ventas | 14 | 9 | **64.3%** |

**Por segmento combinado:**

| Segmento | Definición | Tiendas | Conversión |
|---|---|---|---|
| 🔥 Hot Lead | Pasarela + productos + ventas | 33 | **48.5%** |
| 🟡 Warm Lead | Pasarela + productos, sin ventas | 19 | **10.5%** |
| 🔵 Configurando | Solo productos, sin pasarela | 69 | **1.4%** |
| ⚪ Inactivo | Nada configurado | 1,325 | **0.3%** |

**Tiempo promedio de conversión:** 23 días desde registro hasta primer pago.

### 2.4 Conclusión del Análisis

El 92% de los trials son inactivos y no vale la pena invertir tiempo humano en ellos. El valor está en identificar rápidamente al ~8% que sí muestra actividad y enfocar toda la energía de ventas en ellos. Un sistema de scoring automático haría esto posible sin esfuerzo manual.

---

## 3. Arquitectura del Módulo

El módulo se compone de 5 subcomponentes que trabajan juntos:

| Componente | Función | Actualización |
|---|---|---|
| **Funnel Dashboard** | Visualización del embudo de conversión y métricas del pipeline | Tiempo real |
| **Lead Scoring Engine** | Calcula automáticamente el Readiness Score de cada trial | Cron cada 6 horas |
| **Pipeline Board** | Vista Kanban para gestionar el pipeline de ventas | Manual + automático |
| **Ficha de Lead** | Vista detallada de cada trial con historial y acciones | Tiempo real |
| **Motor de Automatizaciones** | Emails y alertas automáticas basadas en triggers | Event-driven + cron |

---

## 4. Funnel Dashboard

Panel principal del módulo. Muestra el estado general del pipeline y la eficiencia de conversión.

### 4.1 KPI Cards (fila superior)

| KPI | Definición | Comparación |
|---|---|---|
| Trials este mes | Nuevos registros de Prueba Gratis en el mes actual | vs. mes anterior |
| Tasa de activación | % de trials que cargaron al menos 1 producto | vs. mes anterior |
| Hot Leads activos | Trials con Readiness Score >70 que no han convertido | Absoluto |
| Conversión del mes | Trials que pagaron un plan / total trials del mes | vs. promedio 3 meses |
| Tiempo a conversión | Mediana de días desde registro hasta primer pago | vs. mes anterior |
| Pipeline Value | (Hot Leads x 48.5% x ARPU) + (Warm Leads x 10.5% x ARPU) | Proyección de revenue |

### 4.2 Gráfico de Funnel

Embudo visual con 5 etapas, mostrando cantidad absoluta y % de paso entre etapas:

1. **Registro** → % que carga productos →
2. **Productos cargados** → % que configura pasarela →
3. **Pasarela configurada** → % que logra primera venta →
4. **Primera venta** → % que paga plan →
5. **Convertido a pago**

Con selector de período (mes actual, último trimestre, último año) para ver evolución.

### 4.3 Gráficos Complementarios

- **Trials & Conversiones por Mes (12 meses):** Barras grises (trials) con barras verdes superpuestas (convertidos). Línea de tasa de conversión.
- **Distribución de Readiness Scores:** Histograma mostrando cuántos trials hay en cada rango de score. Permite ver de un vistazo si hay leads calientes sin atender.
- **Tiempo a Conversión:** Distribución de días hasta conversión. Identificar si hay un "sweet spot" temporal para contactar.
- **Funel de Drop-off:** Dónde se pierden los trials. Qué % abandona en cada paso del setup.

---

## 5. Lead Scoring Engine

### 5.1 Readiness Score

Cada trial recibe un score de 0-100, calculado automáticamente cada 6 horas. El score se basa en señales observables que correlacionan con la probabilidad de conversión según data histórica.

| Señal | Puntos | Justificación |
|---|---|---|
| **Catálogo** | | |
| 1-5 productos cargados | +10 | Inicio de configuración |
| 6-20 productos cargados | +20 | Configuración seria |
| 20+ productos cargados | +30 | Catálogo completo → 81% conversión histórica |
| **Pagos** | | |
| Pasarela de pago configurada | +25 | Señal fuerte de intención comercial |
| **Ventas** | | |
| 1-5 ventas realizadas | +20 | Validó el modelo → 14% conversión histórica |
| 5+ ventas realizadas | +30 | Product-market fit → 64% conversión histórica |
| **Engagement** | | |
| Login en últimas 48 horas | +10 | Activamente usando la plataforma |
| Configuró logo/branding | +5 | Invirtió tiempo en personalización |
| Configuró envíos/coberturas | +10 | Setup operativo avanzado |
| **Urgencia** | | |
| Trial vence en <7 días | +5 | Ventana de conversión natural |

**Score máximo teórico: 100** (catálogo completo + pasarela + ventas + engagement + urgencia).

### 5.2 Clasificación Automática

| Rango | Etiqueta | Color | Acción esperada | Conversión histórica |
|---|---|---|---|---|
| 70-100 | 🔥 Hot Lead | Rojo | Contactar HOY. Llamada o WhatsApp. | ~48% |
| 40-69 | 🟡 Warm Lead | Amarillo | Contactar esta semana. Ofrecer ayuda. | ~10% |
| 15-39 | 🔵 Nurture | Azul | Email automatizado con tips. | ~2% |
| 0-14 | ⚪ Inactive | Gris | No invertir tiempo humano. Solo automations. | <0.5% |

### 5.3 Score Decay

El score decrece si la tienda deja de mostrar actividad:

- Sin login en 7 días: -5 puntos
- Sin login en 14 días: -10 puntos
- Sin login en 30 días: -20 puntos

Esto evita que leads abandonados permanezcan como "warm" indefinidamente.

### 5.4 Reglas de Recálculo

- **Cada 6 horas:** Recálculo completo de todos los trials activos (plan Prueba Gratis no vencido y no convertidos).
- **On-event:** Recálculo inmediato cuando se detecta: nuevo producto cargado, pasarela configurada, primera venta, o nuevo login.
- **Historial de score:** Guardar snapshot diario para poder ver la evolución del score de un lead en el tiempo.

---

## 6. Pipeline Board

### 6.1 Vista Kanban

Vista de columnas arrastrables para gestionar el pipeline de ventas. Las columnas representan etapas del ciclo de vida:

| Columna | Descripción | Entrada automática | Salida |
|---|---|---|---|
| **Registro** | Trial recién creado, sin actividad | Al crear cuenta | Auto → Configurando cuando carga producto |
| **Configurando** | Cargó productos pero no tiene pasarela | Score ≥15 | Auto → Listo cuando configura pasarela |
| **Listo para Vender** | Tiene productos + pasarela, sin ventas | Score ≥40 | Auto → Con Ventas al primera venta |
| **Con Ventas** | Ya generó al menos 1 venta | Score ≥60 | Manual → Contactado |
| **Contactado** | El equipo se comunicó con el trial | Manual | Manual → Negociando / Convertido / Perdido |
| **Negociando** | En proceso de cierre | Manual | Manual → Convertido / Perdido |
| **Convertido** | Pagó un plan | Automático al detectar pago | Fin del pipeline |
| **Perdido** | Trial venció sin conversión o declinó | Auto al vencer / Manual | Fin del pipeline |

### 6.2 Tarjeta de Lead

Cada tarjeta en el Kanban muestra:

```
┌─────────────────────────────────┐
│ 🔥 85  Dulcería La Abuela       │
│ ────────────────────────────────│
│ 📦 32 productos  🛒 8 ventas    │
│ 💳 Culqi activo  📅 Día 12/14   │
│ 👤 Asignado a: María            │
│ 📝 "Llamar el jueves para..."   │
│ ⏰ Follow-up: mañana            │
└─────────────────────────────────┘
```

- **Score** con color de clasificación
- **Nombre** de la tienda
- **Métricas clave**: productos, ventas, pasarela
- **Días en trial** / días restantes
- **Asignación** al miembro del equipo
- **Última nota** resumida
- **Próximo follow-up** si existe

### 6.3 Filtros y Ordenamiento

- Filtrar por: clasificación (Hot/Warm/Nurture/Inactive), asignado a, días en trial, con/sin follow-up pendiente
- Ordenar por: score (desc), fecha de registro, próximo follow-up, última actividad
- Vista alternativa: tabla/lista para cuando el Kanban tiene muchas tarjetas

---

## 7. Ficha de Lead

Vista detallada de un trial individual. Se accede al hacer clic en una tarjeta del Kanban o desde la lista de leads.

### 7.1 Encabezado

Barra superior con: nombre de tienda, slug, Readiness Score (gauge visual), clasificación, días en trial, días restantes, botón de acceso al storefront, y botones de acción rápida (WhatsApp, email, nota).

### 7.2 Panel de Actividad (columna izquierda)

Información extraída automáticamente de la base de datos:

- **Progreso de Setup:** Checklist visual mostrando qué ha configurado y qué falta:
  - ☑ Cuenta creada
  - ☑ Logo/branding configurado
  - ☑ Productos cargados (32)
  - ☑ Categorías creadas (5)
  - ☑ Pasarela de pago (Culqi)
  - ☐ Envíos/coberturas
  - ☐ Dominio personalizado
  - ☑ Primera venta
- **Métricas de Uso:**
  - Último login: hace 2 horas
  - Logins esta semana: 8
  - Productos: 32 activos
  - Ventas en trial: 8 (S/ 2,340)
  - Ticket promedio: S/ 293
- **Timeline de Actividad:** Feed cronológico de acciones del trial: "Cargó 5 productos", "Configuró Culqi", "Recibió primera venta", "Login desde móvil", etc.
- **Evolución del Score:** Mini gráfico de línea mostrando cómo ha evolucionado el Readiness Score en los últimos 14 días.

### 7.3 Panel de Gestión (columna derecha)

Información gestionada manualmente por el equipo:

- **Estado en Pipeline:** Dropdown para cambiar etapa manualmente
- **Asignado a:** Selector de miembro del equipo
- **Tags:** Etiquetas como "interesado en Small", "pidió demo", "comparando con Shopify", "problema técnico", "referido por X"
- **Próximo Follow-up:** Date picker para agendar siguiente contacto
- **Plan Recomendado:** Sugerencia automática basada en tamaño de catálogo y volumen de ventas
- **Notas e Historial de Contacto:**
  - Campo para agregar nueva nota
  - Tipo de contacto: llamada / WhatsApp / email / reunión / otro
  - Feed cronológico de todas las notas con autor y fecha

### 7.4 Acciones Rápidas

Botones en el header:

- **📞 Llamar:** Registra nota de tipo "llamada" con timestamp
- **💬 WhatsApp:** Abre WhatsApp con el número de la tienda (si existe), registra contacto
- **📧 Email:** Abre composer con template pre-llenado según etapa del pipeline
- **📋 Copiar Info:** Copia al clipboard un resumen del lead para compartir internamente

---

## 8. Lista de Acción Diaria

Vista priorizada que el equipo de ventas consulta cada mañana. Sin configuración ni filtros: muestra exactamente qué hacer hoy.

### 8.1 Secciones (en orden de prioridad)

**🔴 Urgente: Hot Leads sin contactar**
Trials con score >70 que no tienen notas de contacto registradas. Estos se están convirtiendo solos al 48% — con una llamada podrían subir al 70%+.

**🟠 Hoy: Follow-ups programados**
Leads con `next_followup_date = hoy`. Muestra la última nota para tener contexto antes de llamar.

**🟡 Esta semana: Warm Leads con actividad reciente**
Trials con score 40-69 que tuvieron login en las últimas 48h. Están activos y receptivos.

**🔵 Atención: Trials por vencer en 7 días**
Trials con score >25 cuyo plan de prueba vence en menos de 7 días. Última oportunidad antes de que pierdan acceso.

**⚪ Revisar: Nuevos registros (últimas 24h)**
Los trials de ayer para quick-scan. Marcar los que ya muestran señales de actividad temprana.

### 8.2 Formato de cada ítem

```
🔥 85  Dulcería La Abuela                    32 prods | 8 ventas | S/ 2,340
       Trial día 12 de 14 | Último login: 2h    [WhatsApp] [Nota] [Ver ficha]
       
🟡 52  Tech Parts Lima                        8 prods | 0 ventas | Culqi ✓
       Trial día 8 de 14 | Último login: ayer    [WhatsApp] [Nota] [Ver ficha]
```

---

## 9. Motor de Automatizaciones

### 9.1 Emails Automáticos al Trial

Secuencia basada en días desde registro y actividad:

| Trigger | Día | Condición | Email | Objetivo |
|---|---|---|---|---|
| Bienvenida | 0 | Siempre | "¡Bienvenido! Tu tienda está lista. Empieza aquí →" | Activación inmediata |
| Nudge catálogo | 3 | 0 productos | "¿Necesitas ayuda para cargar tu catálogo? Así de fácil es →" | Primer paso de setup |
| Nudge pasarela | 7 | Productos > 0, sin pasarela | "Ya tienes productos. Activa tus cobros en 5 minutos →" | Desbloquear ventas |
| Tips de venta | 10 | Pasarela activa, 0 ventas | "5 tips para conseguir tu primera venta en MiTienda →" | Primera venta |
| Social proof | 14 | Score < 40 | "Mira cómo X tienda vendió S/ 5,000 en su primer mes →" | Motivación |
| Urgencia | Trial - 3 días | Score > 25 | "Tu prueba gratis vence en 3 días. No pierdas tu progreso →" | Conversión |
| Último día | Trial - 1 día | Score > 25 | "Último día de prueba. Elige tu plan y sigue vendiendo →" | Conversión |
| Win-back | Trial + 7 días | No convirtió, score > 40 | "Tu tienda sigue aquí. Vuelve con 20% de descuento →" | Recuperación |

### 9.2 Alertas Internas al Equipo

Notificaciones al equipo de ventas/CS:

| Trigger | Canal | Mensaje |
|---|---|---|
| Nuevo Hot Lead (score cruza 70) | Slack/Dashboard | "🔥 [Tienda] alcanzó score 70. Productos: X, Ventas: Y. Contactar hoy." |
| Primera venta de un trial | Slack/Dashboard | "🛒 [Tienda] logró su primera venta (S/ X). Score: Y. Oportunidad de conversión." |
| Trial con ventas vence en 7 días | Email diario | "⚠️ [Tienda] tiene X ventas por S/ Y y su trial vence el [fecha]. Llamar." |
| Lead asignado sin contacto en 48h | Dashboard | "⏰ [Tienda] fue asignada hace 48h sin registro de contacto." |
| Score drop >20 pts en 7 días | Dashboard | "📉 [Tienda] bajó de score X a Y. Posible abandono." |

### 9.3 Reglas de No-Contacto

- No enviar emails a trials con score 0 después del día 7 (son bots o registros abandonados)
- Máximo 1 email automático por semana por trial
- Si el trial marca "no me contacten" o se desuscribe, respetar inmediatamente
- No enviar emails de urgencia si el trial nunca cargó un producto

---

## 10. Modelo de Datos

### 10.1 Nuevas Tablas

```sql
-- Pipeline principal
CREATE TABLE tiendas_pipeline (
    pipeline_id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    stage ENUM('registro','configurando','listo','con_ventas',
               'contactado','negociando','convertido','perdido') 
        DEFAULT 'registro',
    readiness_score INT DEFAULT 0,
    readiness_updated_at DATETIME,
    assigned_to INT NULL COMMENT 'usuario_id del vendedor asignado',
    last_contact_date DATETIME NULL,
    next_followup_date DATETIME NULL,
    loss_reason VARCHAR(255) NULL,
    recommended_plan VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tienda (tienda_id),
    KEY idx_stage (stage),
    KEY idx_score (readiness_score),
    KEY idx_assigned (assigned_to),
    KEY idx_followup (next_followup_date)
);

-- Historial de notas y contactos
CREATE TABLE tiendas_pipeline_notas (
    nota_id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('nota','llamada','whatsapp','email','reunion','otro') 
        DEFAULT 'nota',
    contenido TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tienda (tienda_id),
    KEY idx_fecha (created_at)
);

-- Tags/etiquetas de leads
CREATE TABLE tiendas_pipeline_tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tienda_tag (tienda_id, tag),
    KEY idx_tag (tag)
);

-- Historial de scores (para evolución)
CREATE TABLE tiendas_pipeline_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    score INT NOT NULL,
    stage VARCHAR(50),
    snapshot_date DATE NOT NULL,
    KEY idx_tienda_fecha (tienda_id, snapshot_date)
);

-- Emails enviados (para no-duplicar y medir)
CREATE TABLE tiendas_pipeline_emails (
    email_id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    opened_at DATETIME NULL,
    clicked_at DATETIME NULL,
    KEY idx_tienda (tienda_id),
    KEY idx_template (template_key)
);
```

### 10.2 Tabla Precalculada de Métricas de Trial

```sql
-- Se actualiza cada 6 horas via cron
CREATE TABLE tiendas_trial_metrics (
    tienda_id INT PRIMARY KEY,
    trial_start DATE,
    trial_end DATE,
    dias_en_trial INT,
    dias_restantes INT,
    total_productos INT DEFAULT 0,
    total_categorias INT DEFAULT 0,
    tiene_pasarela TINYINT(1) DEFAULT 0,
    pasarela_nombre VARCHAR(100) NULL,
    total_ventas INT DEFAULT 0,
    total_gmv DECIMAL(12,2) DEFAULT 0,
    ticket_promedio DECIMAL(10,2) DEFAULT 0,
    tiene_logo TINYINT(1) DEFAULT 0,
    tiene_envios TINYINT(1) DEFAULT 0,
    tiene_dominio TINYINT(1) DEFAULT 0,
    ultimo_login DATETIME NULL,
    logins_semana INT DEFAULT 0,
    readiness_score INT DEFAULT 0,
    clasificacion ENUM('hot','warm','nurture','inactive') DEFAULT 'inactive',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_score (readiness_score),
    KEY idx_clasificacion (clasificacion),
    KEY idx_trial_end (trial_end)
);
```

### 10.3 Queries Principales

**Recalcular Readiness Score (cron cada 6h):**

```sql
UPDATE tiendas_trial_metrics SET
  readiness_score = 
    CASE 
      WHEN total_productos > 20 THEN 30
      WHEN total_productos BETWEEN 6 AND 20 THEN 20
      WHEN total_productos BETWEEN 1 AND 5 THEN 10
      ELSE 0
    END
    + CASE WHEN tiene_pasarela = 1 THEN 25 ELSE 0 END
    + CASE 
        WHEN total_ventas > 5 THEN 30
        WHEN total_ventas BETWEEN 1 AND 5 THEN 20
        ELSE 0
      END
    + CASE WHEN ultimo_login >= DATE_SUB(NOW(), INTERVAL 48 HOUR) THEN 10 ELSE 0 END
    + CASE WHEN tiene_logo = 1 THEN 5 ELSE 0 END
    + CASE WHEN tiene_envios = 1 THEN 10 ELSE 0 END
    + CASE WHEN dias_restantes BETWEEN 0 AND 7 THEN 5 ELSE 0 END
    -- Score decay
    - CASE 
        WHEN ultimo_login < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 20
        WHEN ultimo_login < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 10
        WHEN ultimo_login < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 5
        ELSE 0
      END,
  clasificacion = CASE
    WHEN readiness_score >= 70 THEN 'hot'
    WHEN readiness_score >= 40 THEN 'warm'
    WHEN readiness_score >= 15 THEN 'nurture'
    ELSE 'inactive'
  END,
  updated_at = NOW()
WHERE trial_end >= NOW();
```

---

## 11. Requerimientos Técnicos

### 11.1 Stack

| Componente | Tecnología | Notas |
|---|---|---|
| Backend API | PHP 8 + CodeIgniter 4 | Nuevos controllers bajo `/admin/pipeline/` |
| Frontend | Vue 3 (Composition API) | Componente Kanban con drag-and-drop (vue-draggable o SortableJS) |
| Base de Datos | MySQL 8 (read replica para consultas, write a master) | 5 tablas nuevas |
| Cache | Redis | Scores cacheados, lista de acción diaria pre-generada |
| Cron Jobs | CI4 Tasks | Score recalc cada 6h, email sequencing diario, snapshot diario |
| Email | Template engine existente de MiTienda | Nuevos templates para la secuencia de nurturing |
| Notificaciones | Slack webhook + notificaciones in-app | Para alertas internas |

### 11.2 API Endpoints

```
GET    /admin/api/pipeline/dashboard      → KPIs y datos del funnel
GET    /admin/api/pipeline/leads          → Lista de leads con filtros
GET    /admin/api/pipeline/leads/:id      → Ficha completa de un lead
PUT    /admin/api/pipeline/leads/:id      → Actualizar stage, asignación, tags
POST   /admin/api/pipeline/leads/:id/nota → Agregar nota
GET    /admin/api/pipeline/board          → Datos para el Kanban
PUT    /admin/api/pipeline/board/move     → Mover lead entre columnas
GET    /admin/api/pipeline/action-list    → Lista de acción diaria
GET    /admin/api/pipeline/scores/history → Historial de scores para gráficos
```

### 11.3 Performance

- Dashboard y Kanban cargan en <2 segundos (datos precalculados en `tiendas_trial_metrics`)
- Ficha de lead carga en <1 segundo
- Recálculo de scores para ~500 trials activos debe completarse en <30 segundos
- Lista de acción diaria se pre-genera a las 6:00 AM y se cachea en Redis

### 11.4 Permisos

| Rol | Acceso |
|---|---|
| super_admin | Todo: ver, editar, asignar, configurar automatizaciones |
| vendedor | Ver pipeline, agregar notas, mover leads asignados |
| soporte | Solo lectura de fichas de lead (para contexto en tickets) |

---

## 12. Roadmap de Implementación

| Fase | Timeline | Entregables | Impacto |
|---|---|---|---|
| **Fase 1** | Semanas 1-2 | Modelo de datos + cron de métricas de trial + Lead Scoring Engine. Lista de leads con scores y clasificación. | Se puede ver por primera vez quiénes son los Hot Leads. |
| **Fase 2** | Semanas 3-4 | Funnel Dashboard + KPI cards. Lista de acción diaria. Ficha de lead básica (sin notas). | El equipo tiene una pantalla diaria de qué hacer. |
| **Fase 3** | Semanas 5-7 | Pipeline Board (Kanban). Ficha de lead completa con notas, tags, asignación, follow-ups. | Pseudo-CRM funcional para gestión de ventas. |
| **Fase 4** | Semanas 8-10 | Motor de automatizaciones: secuencia de emails + alertas Slack + score decay. Métricas de efectividad de emails. | Pipeline funciona solo. El equipo solo atiende lo importante. |

---

## 13. Métricas de Éxito

Evaluadas 6 meses post-lanzamiento:

| Métrica | Actual | Objetivo | Cómo se mide |
|---|---|---|---|
| Tasa de conversión trial → pago | 1.6% | 5% | Convertidos / trials del mes |
| Tiempo a conversión | 23 días | 15 días | Mediana de días registro → pago |
| Hot Leads contactados en <48h | 0% (no se mide) | 100% | Leads con score >70 que tienen nota de contacto |
| Tasa de activación (carga 1+ producto) | ~8% | 15% | Trials con productos / total trials |
| Pipeline Value accuracy | N/A | ±20% | Revenue real vs. proyectado por pipeline |
| Nuevos clientes pagos/mes | ~2 | 6 | Conversiones mensuales |

---

## 14. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Scoring no predice bien la conversión | Alto: equipo persigue leads incorrectos | Calibrar pesos con data 2024-2025. A/B test los primeros 2 meses. Ajustar trimestralmente. |
| Equipo no adopta el pipeline | Alto: herramienta sin uso | Diseñar la lista de acción diaria como homepage obligatoria. Medir adopción desde semana 1. |
| Emails automáticos generan spam/rechazo | Medio: daño a la marca | Empezar con solo 3 emails (bienvenida, nudge, urgencia). Medir open rates. Expandir gradualmente. |
| Sobrecarga del equipo con leads | Medio: parálisis por volumen | El scoring filtra: solo Hot + Warm requieren acción humana (~10% del total). |
| Datos de actividad incompletos | Bajo: scores imprecisos | Empezar con señales que ya existen en BD (productos, pasarela, ventas). Agregar tracking de login en Fase 1. |
| Trial muy corto para mostrar valor | Medio: no da tiempo a activarse | Analizar si extender el trial de 14 a 21 días mejora activación. Decisión basada en data post-lanzamiento. |
