/**
 * Module codes that have been migrated to the Vue3 backoffice.
 * These modules have both frontend routes (MODULE_ROUTE_MAP in backoffice)
 * and backend API routes (ModuleRoutes.php).
 *
 * Used to filter the superadmin plans matrix to only show relevant modules.
 * Update this list as new modules are migrated from the legacy CI3 app.
 */
export const MIGRATED_MODULE_CODES = new Set([
  // Sales
  'mod_ventas',
  'mod_opiniones',
  'mod_reclamaciones',

  // Reports
  'mod_reportes_ventas',

  // Catalog
  'mod_productos',
  'mod_carga_productos_lote',
  'mod_categorias',
  'mod_marcas',
  'mod_gammas',
  'mod_listas_productos',
  'mod_atributos',
  'mod_etiquetas',

  // Marketing
  'mod_promociones',
  'mod_upsales',
  'mod_combos',
  'mod_barras_anuncios',
  'mod_carrito_abandonado',
  'mod_referidos',

  // Content
  'mod_paginas',
  'mod_blog',
  'mod_carrusel',
  'mod_imagenes',
  'mod_terminos',
  'mod_plantillas',

  // Appearance
  'mod_apariencia',
  'mod_menu',

  // Billing
  'mod_facturacion_electronica',

  // Shipping
  'mod_tarifas_envio',

  // Store settings
  'mod_varios_usuarios',
  'mod_informacion',
  'mod_preferencias',
  'mod_seo',
  'mod_tienda_facebook',
  'mod_tiktok',
  'mod_dominio_propio',
  'mod_formas_pago',

  // Integrations
  'mod_integraciones',
  'mod_netsuite',

  // API
  'mod_api'
])
