/**
 * Cobro de los planes de las tiendas (tiendaplan_cobro_*).
 * Plan: mitienda-docs-internal/docs/plans/cobro-planes-superadmin.md
 */

/** Medios que se proponen al registrar un cobro; el campo acepta otros. */
export const PLAN_PAYMENT_METHODS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Yape', 'Plin', 'Mercado Pago', 'Culqi']

/**
 * Días de crédito que se proponen al renovar sin cobro, contados desde que
 * arranca el período nuevo. Mismo valor que PlanCobroInput::DIAS_CREDITO_DEFAULT
 * del API, que lo aplica si el formulario no manda fecha.
 */
export const CREDIT_DAYS_DEFAULT = 7
