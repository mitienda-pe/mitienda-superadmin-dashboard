<template>
  <div class="space-y-6">
    <!-- Encabezado: escenario, moneda y acciones -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Valoración</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Métricas para estimar el valor de la empresa con los últimos 12 meses cerrados
          <template v-if="data">({{ monthLabel(data.months[0]) }} – {{ monthLabel(data.ref_month) }})</template>.
          Ingresos del libro de comprobantes sin IGV, clientes = tiendas con plan pagado vigente, costos del estado de
          resultados. Los supuestos de la proyección y los múltiplos se guardan por escenario.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Dropdown
          v-model="scenarioId"
          :options="scenarioOptions"
          option-label="label"
          option-value="value"
          placeholder="Supuestos por defecto"
          class="w-56"
          :disabled="loading"
          @change="load()"
        />
        <SelectButton v-model="currency" :options="currencyOptions" option-label="label" option-value="value" :allow-empty="false" @change="recalculate()" />
        <Button icon="pi pi-refresh" text rounded severity="secondary" title="Volver a leer los datos" :loading="loading" @click="load(true)" />
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load()" />
    </div>

    <div v-else-if="loading && !data" class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
      <p class="text-sm mt-3">Armando los 12 meses: ingresos, costos, churn y cohortes…</p>
    </div>

    <template v-else-if="data && draft">
      <!-- Supuestos sin guardar -->
      <div v-if="dirty" class="sticky top-0 z-10 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm text-amber-800">
          {{ stale ? 'Cambiaste supuestos: recalcula para ver su efecto.' : 'Los números en pantalla usan supuestos sin guardar.' }}
        </span>
        <div class="flex flex-wrap gap-2">
          <Button label="Descartar" size="small" text severity="secondary" @click="resetDraft" />
          <Button v-if="stale" label="Recalcular" icon="pi pi-calculator" size="small" :loading="loading" @click="recalculate()" />
          <Button v-if="data.scenario" :label="`Guardar en «${data.scenario.name}»`" icon="pi pi-save" size="small" outlined :loading="saving" @click="save(data.scenario.id)" />
          <Button label="Guardar como…" icon="pi pi-copy" size="small" outlined @click="openSaveAs" />
        </div>
      </div>
      <div v-else class="flex flex-wrap justify-end gap-2 -mt-3">
        <Button label="Guardar como escenario nuevo" icon="pi pi-copy" size="small" text @click="openSaveAs" />
        <Button v-if="data.scenario" label="Eliminar escenario" icon="pi pi-trash" size="small" text severity="danger" @click="removeScenario" />
      </div>

      <div v-if="warnings.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <div class="font-medium">Antes de leer los números</div>
        <ul class="list-disc pl-5 space-y-0.5">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>

      <TabView v-model:active-index="tab" :class="{ 'opacity-60 pointer-events-none': loading }">
        <!-- ============ RESUMEN ============ -->
        <TabPanel header="Resumen">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-1">
              <div class="text-xs uppercase tracking-wide text-gray-500">Valor estimado por múltiplos</div>
              <div class="text-3xl font-bold text-gray-900 tabular-nums mt-1">{{ money(data.valuation.total) }}</div>
              <div class="text-sm text-gray-500 mt-1 tabular-nums">
                Rango {{ money(data.valuation.low) }} – {{ money(data.valuation.high) }}
                <span class="text-gray-400">(múltiplos ±25 %)</span>
              </div>
              <div v-if="data.valuation.implied_revenue_multiple !== null" class="text-xs text-gray-500 mt-2">
                Equivale a {{ num(data.valuation.implied_revenue_multiple, 2) }}× el ingreso de los 12 meses.
              </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 lg:col-span-2 overflow-x-auto">
              <table class="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr class="text-xs text-gray-500 border-b border-gray-200">
                    <th class="px-4 py-2 text-left font-medium">Componente</th>
                    <th class="px-4 py-2 text-right font-medium">Base</th>
                    <th class="px-4 py-2 text-right font-medium">Múltiplo</th>
                    <th class="px-4 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="component in data.valuation.components" :key="component.key" class="border-b border-gray-100">
                    <td class="px-4 py-2 text-gray-800">{{ component.name }}</td>
                    <td class="px-4 py-2 text-right tabular-nums">{{ money(component.base) }}</td>
                    <td class="px-4 py-2 text-right">
                      <InputNumber
                        v-model="draft.multiples[component.key as 'fixed' | 'variable' | 'services']"
                        :min="0" :max="100" :min-fraction-digits="1" :max-fraction-digits="2" suffix="×"
                        input-class="w-20 text-right py-1"
                      />
                    </td>
                    <td class="px-4 py-2 text-right tabular-nums font-medium">{{ money(component.value) }}</td>
                  </tr>
                  <tr class="bg-gray-50 font-semibold">
                    <td class="px-4 py-2" colspan="3">Total</td>
                    <td class="px-4 py-2 text-right tabular-nums">{{ money(data.valuation.total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Métricas clave -->
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mt-4">
            <div v-for="kpi in kpis" :key="kpi.label" class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{{ kpi.label }}</div>
              <div class="text-xl font-semibold text-gray-900 tabular-nums mt-1">{{ kpi.value }}</div>
              <div v-if="kpi.hint" class="text-xs text-gray-400 mt-0.5">{{ kpi.hint }}</div>
            </div>
          </div>

          <!-- Señales para el múltiplo y la tasa de descuento -->
          <div class="bg-white rounded-xl border border-gray-200 mt-4">
            <div class="px-4 pt-4">
              <h2 class="text-base font-semibold text-gray-900">¿Sostiene un múltiplo menos castigado?</h2>
              <p class="text-xs text-gray-500 mt-1 max-w-3xl">
                Referencias habituales para un SaaS de pymes. Un NRR sobre 100 % y un LTV/CAC de 3 o más son los dos
                argumentos para pedir una tasa de descuento más baja.
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              <div
                v-for="signal in data.signals"
                :key="signal.key"
                class="rounded-lg border px-4 py-3 flex items-center justify-between gap-3"
                :class="signalClass(signal.status)"
              >
                <div>
                  <div class="text-sm font-medium">{{ signal.label }}</div>
                  <div class="text-xs opacity-75">Referencia {{ signal.target }}</div>
                </div>
                <div class="text-lg font-semibold tabular-nums">{{ signalValue(signal) }}</div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ============ INGRESOS ============ -->
        <TabPanel header="Ingresos">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="text-xs text-gray-500">MRR de planes vigentes</div>
              <div class="text-xl font-semibold tabular-nums">{{ money(data.recurring.mrr_subscriptions) }}</div>
              <div class="text-xs text-gray-400">Anuales ÷ 12, sin IGV, al cierre de {{ monthLabel(data.ref_month) }}</div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="text-xs text-gray-500">Otros fijos al mes</div>
              <div class="text-xl font-semibold tabular-nums">{{ money(data.recurring.other_fixed_monthly) }}</div>
              <div class="text-xs text-gray-400">Facturación electrónica y demás recurrentes, promedio de 3 meses</div>
            </div>
            <div class="bg-white rounded-xl border border-primary/40 p-4">
              <div class="text-xs text-gray-500">MRR equivalente</div>
              <div class="text-xl font-semibold tabular-nums text-primary">{{ money(data.recurring.mrr_equivalent) }}</div>
              <div class="text-xs text-gray-400">Facturado en {{ monthLabel(data.ref_month) }}: {{ money(data.recurring.mrr_invoiced_last_month) }}</div>
            </div>
            <div class="bg-white rounded-xl border border-primary/40 p-4">
              <div class="text-xs text-gray-500">ARR equivalente</div>
              <div class="text-xl font-semibold tabular-nums text-primary">{{ money(data.recurring.arr_equivalent) }}</div>
              <div class="text-xs text-gray-400">MRR × 12 · base de la proyección de fijos</div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-4 mt-4">
            <VChart :option="revenueChart" autoresize class="h-72" />
          </div>

          <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto mt-4">
            <table class="w-full text-sm whitespace-nowrap">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-200">
                  <th class="sticky left-0 bg-white px-4 py-2 text-left font-medium min-w-[240px]"></th>
                  <th v-for="month in data.months" :key="month" class="px-3 py-2 text-right font-medium">{{ shortMonth(month) }}</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-700">12 meses</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-700">%</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="bucket in data.revenue.buckets" :key="bucket.key">
                  <tr class="bg-gray-50 font-semibold border-b border-gray-100">
                    <td class="sticky left-0 bg-gray-50 px-4 py-1.5">{{ bucket.name }}</td>
                    <td v-for="(value, i) in bucket.values" :key="i" class="px-3 py-1.5 text-right tabular-nums">{{ compact(value) }}</td>
                    <td class="px-4 py-1.5 text-right tabular-nums">{{ compact(bucket.total) }}</td>
                    <td class="px-4 py-1.5 text-right tabular-nums">{{ num(bucket.share, 1) }} %</td>
                  </tr>
                  <tr v-for="source in sourcesOf(bucket.key)" :key="source.key" class="border-b border-gray-100 text-gray-600">
                    <td class="sticky left-0 bg-white px-4 py-1.5 pl-8">{{ source.name }}</td>
                    <td v-for="(value, i) in source.values" :key="i" class="px-3 py-1.5 text-right tabular-nums">{{ compact(value) }}</td>
                    <td class="px-4 py-1.5 text-right tabular-nums">{{ compact(source.total) }}</td>
                    <td></td>
                  </tr>
                </template>
                <tr class="font-semibold">
                  <td class="sticky left-0 bg-white px-4 py-2">Total</td>
                  <td v-for="(value, i) in monthTotals" :key="i" class="px-3 py-2 text-right tabular-nums">{{ compact(value) }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ compact(data.revenue.total) }}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            El bloque de cada fuente sale de su tipo en Facturación → Etiquetas (recurrente, variable, extraordinario).
            Los servicios se muestran aparte y fuera del MRR: el ARR de un SaaS no incluye consultoría.
            <template v-if="data.revenue.untagged">Sin etiquetar, fuera del cálculo: {{ money(data.revenue.untagged) }}.</template>
          </p>
        </TabPanel>

        <!-- ============ COSTOS ============ -->
        <TabPanel header="Costos y margen">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="text-xs text-gray-500">Ventas SaaS (fijos + variables)</div>
              <div class="text-xl font-semibold tabular-nums">{{ money(data.costs.saas_revenue) }}</div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="text-xs text-gray-500">Costo de ventas SaaS</div>
              <div class="text-xl font-semibold tabular-nums">{{ money(data.costs.saas_cogs) }}</div>
            </div>
            <div class="bg-white rounded-xl border border-primary/40 p-4">
              <div class="text-xs text-gray-500">Margen bruto SaaS histórico</div>
              <div class="text-xl font-semibold tabular-nums text-primary">{{ pct(data.costs.gross_margin_hist) }}</div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="text-xs text-gray-500">Margen bruto esperado</div>
              <InputNumber
                v-model="draft.gross_margin_target"
                :min="0" :max="100" :max-fraction-digits="1" suffix=" %"
                :placeholder="`Histórico: ${pct(data.costs.gross_margin_hist)}`"
                input-class="w-full py-1"
              />
              <div class="text-xs text-gray-400 mt-1">Vacío = el histórico. Se usa en LTV y proyección.</div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto mt-4">
            <table class="w-full text-sm whitespace-nowrap">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-200">
                  <th class="sticky left-0 bg-white px-4 py-2 text-left font-medium min-w-[280px]">Rubro</th>
                  <th v-for="month in data.months" :key="month" class="px-3 py-2 text-right font-medium">{{ shortMonth(month) }}</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-700">12 meses</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-700">% ventas SaaS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rubro in data.costs.rubros" :key="rubro.key" class="border-b border-gray-100">
                  <td class="sticky left-0 bg-white px-4 py-1.5 text-gray-800">{{ rubro.name }}</td>
                  <td v-for="(value, i) in rubro.values" :key="i" class="px-3 py-1.5 text-right tabular-nums text-gray-600">{{ compact(value) }}</td>
                  <td class="px-4 py-1.5 text-right tabular-nums font-medium">{{ compact(rubro.total) }}</td>
                  <td class="px-4 py-1.5 text-right tabular-nums text-gray-500">{{ pct(rubro.share_of_revenue) }}</td>
                </tr>
                <tr class="bg-gray-50 font-semibold">
                  <td class="sticky left-0 bg-gray-50 px-4 py-2" :colspan="1">Total costo de ventas SaaS</td>
                  <td :colspan="data.months.length"></td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ compact(data.costs.saas_cogs) }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ pct(100 - (data.costs.gross_margin_hist ?? 100)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <!-- Reparto del personal en costo -->
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <h2 class="text-base font-semibold text-gray-900">Personal en costo de servicio</h2>
              <p class="text-xs text-gray-500 mt-1">
                La parte de planilla que el estado de resultados pone en costo (ficha de cada persona en Planilla). Lo que
                es desarrollo a la medida va contra los servicios, no contra el margen del SaaS. Debe sumar 100 %.
              </p>
              <div class="grid grid-cols-3 gap-3 mt-3">
                <label v-for="part in STAFF_PARTS" :key="part.key" class="flex flex-col gap-1 text-xs text-gray-600">
                  <span>{{ part.label }}</span>
                  <InputNumber v-model="draft.staff_split[part.key]" :min="0" :max="100" suffix=" %" input-class="w-full py-1" />
                </label>
              </div>
              <p v-if="Math.abs(staffTotal - 100) > 0.01" class="text-xs text-red-600 mt-2">Suma {{ num(staffTotal, 1) }} %: debe ser 100 %.</p>
              <div class="mt-4 text-sm text-gray-700 space-y-1">
                <div class="flex justify-between"><span>Servicios: ventas 12 meses</span><span class="tabular-nums">{{ money(data.costs.services.revenue) }}</span></div>
                <div class="flex justify-between"><span>Servicios: costo de personal</span><span class="tabular-nums">{{ money(data.costs.services.cost) }}</span></div>
                <div class="flex justify-between font-medium"><span>Margen de servicios</span><span class="tabular-nums">{{ pct(data.costs.services.margin) }}</span></div>
                <div class="flex justify-between text-gray-500 pt-2"><span>Fuera del margen: comercial (CAC)</span><span class="tabular-nums">{{ money(data.costs.commercial_12m) }}</span></div>
                <div class="flex justify-between text-gray-500"><span>Fuera del margen: gastos operativos</span><span class="tabular-nums">{{ money(data.costs.opex_12m) }}</span></div>
              </div>
            </div>

            <!-- Rubro de cada categoría de gasto -->
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Rubro de cada categoría de gasto</h2>
                  <p class="text-xs text-gray-500 mt-1">
                    Otro corte que el del estado de resultados: para valorar un SaaS, las pasarelas son costo directo.
                  </p>
                </div>
                <Button v-if="!costMap" label="Editar" icon="pi pi-pencil" size="small" text @click="loadCostMap" />
              </div>
              <div v-if="costMap" class="mt-3 space-y-2 max-h-96 overflow-y-auto">
                <div v-for="entry in costMap" :key="entry.id" class="flex items-center justify-between gap-3 text-sm">
                  <span class="text-gray-700">{{ entry.name }}</span>
                  <Dropdown v-model="costMapDraft[entry.id]" :options="BUCKET_OPTIONS" option-label="label" option-value="value" class="w-60" />
                </div>
                <div class="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white">
                  <Button label="Cancelar" size="small" text severity="secondary" @click="costMap = null" />
                  <Button label="Guardar rubros" icon="pi pi-save" size="small" :loading="savingCostMap" @click="saveCostMap" />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ============ CHURN, CAC, LTV ============ -->
        <TabPanel header="Churn, CAC y LTV">
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <div class="px-4 pt-4">
                <h2 class="text-base font-semibold text-gray-900">Churn mensual</h2>
                <p class="text-xs text-gray-500 mt-1">Clientes perdidos ÷ promedio de clientes (inicio + fin de mes).</p>
              </div>
              <table class="w-full text-sm whitespace-nowrap mt-2">
                <thead>
                  <tr class="text-xs text-gray-500 border-b border-gray-200">
                    <th class="px-4 py-2 text-left font-medium">Mes</th>
                    <th class="px-3 py-2 text-right font-medium">Inicio</th>
                    <th class="px-3 py-2 text-right font-medium">Fin</th>
                    <th class="px-3 py-2 text-right font-medium">Perdidos</th>
                    <th class="px-4 py-2 text-right font-medium">Churn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in data.churn.months" :key="row.month" class="border-b border-gray-100">
                    <td class="px-4 py-1.5">{{ monthLabel(row.month) }}</td>
                    <td class="px-3 py-1.5 text-right tabular-nums">{{ row.opening }}</td>
                    <td class="px-3 py-1.5 text-right tabular-nums">{{ row.closing }}</td>
                    <td class="px-3 py-1.5 text-right tabular-nums">{{ row.lost }}</td>
                    <td class="px-4 py-1.5 text-right tabular-nums">{{ pct(row.rate) }}</td>
                  </tr>
                  <tr class="bg-gray-50 font-semibold">
                    <td class="px-4 py-2" colspan="4">Promedio 6 meses</td>
                    <td class="px-4 py-2 text-right tabular-nums">{{ pct(data.churn.average) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <h2 class="text-base font-semibold text-gray-900">CAC · último trimestre</h2>
              <p class="text-xs text-gray-500 mt-1">
                Gasto comercial ({{ data.cac.months.map(monthLabel).join(', ') }}) ÷ tiendas que pagaron por primera vez.
                El gasto es marketing + la parte de planilla en ventas (ficha de cada persona).
              </p>
              <div class="mt-3 text-sm text-gray-700 space-y-1.5">
                <div class="flex justify-between"><span>Gasto registrado</span><span class="tabular-nums">{{ money(data.cac.spend_recorded) }}</span></div>
                <div class="flex justify-between items-center gap-3">
                  <span>Ajuste no registrado (US$)</span>
                  <InputNumber v-model="draft.commercial_adjustment_usd" :min="0" mode="currency" currency="USD" locale="es-PE" input-class="w-32 text-right py-1" />
                </div>
                <div class="flex justify-between font-medium border-t border-gray-100 pt-1.5"><span>Gasto del trimestre</span><span class="tabular-nums">{{ money(data.cac.spend) }}</span></div>
                <div class="flex justify-between"><span>Clientes nuevos</span><span class="tabular-nums">{{ data.cac.new_customers }} <span class="text-gray-400">({{ data.cac.new_by_month.join(' + ') }})</span></span></div>
                <div class="flex justify-between text-lg font-semibold text-primary pt-1"><span>CAC</span><span class="tabular-nums">{{ money(data.cac.cac) }}</span></div>
              </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <h2 class="text-base font-semibold text-gray-900">LTV</h2>
              <p class="text-xs text-gray-500 mt-1">ARPU del trimestre × margen bruto ÷ churn mensual.</p>
              <div class="mt-3 text-sm text-gray-700 space-y-1.5">
                <div class="flex justify-between"><span>ARPU mensual</span><span class="tabular-nums">{{ money(data.ltv.arpu) }}</span></div>
                <div class="flex justify-between text-gray-500 pl-3"><span>fijo</span><span class="tabular-nums">{{ money(data.ltv.arpu_fixed) }}</span></div>
                <div class="flex justify-between text-gray-500 pl-3"><span>variable</span><span class="tabular-nums">{{ money(data.ltv.arpu_variable) }}</span></div>
                <div class="flex justify-between"><span>× Margen bruto</span><span class="tabular-nums">{{ pct(data.ltv.gross_margin) }}</span></div>
                <div class="flex justify-between"><span>÷ Churn mensual</span><span class="tabular-nums">{{ pct(data.ltv.churn) }}</span></div>
                <div class="flex justify-between text-gray-500"><span>Vida media</span><span class="tabular-nums">{{ num(data.ltv.lifetime_months, 1) }} meses</span></div>
                <div class="flex justify-between text-lg font-semibold text-primary border-t border-gray-100 pt-1.5"><span>LTV</span><span class="tabular-nums">{{ money(data.ltv.ltv) }}</span></div>
                <div class="flex justify-between font-medium"><span>LTV / CAC</span><span class="tabular-nums">{{ num(data.ltv.ltv_cac, 2) }}×</span></div>
                <div class="flex justify-between"><span>Recuperación del CAC</span><span class="tabular-nums">{{ num(data.ltv.payback_months, 1) }} meses</span></div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ============ NRR ============ -->
        <TabPanel header="NRR">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl border border-gray-200 lg:col-span-2 overflow-x-auto">
              <div class="px-4 pt-4">
                <h2 class="text-base font-semibold text-gray-900">Cohorte del {{ dateLabel(data.nrr.from) }} al {{ dateLabel(data.nrr.to) }}</h2>
                <p class="text-xs text-gray-500 mt-1 max-w-2xl">
                  Las {{ data.nrr.customers }} tiendas que generaban ingresos hace 12 meses (plan vigente + comisión), cada
                  una comparada consigo misma hoy. Ingreso mensual llevado a 12 meses; la comisión es el promedio de 3
                  meses. Las tiendas que entraron en el año no cuentan: son la cohorte del próximo periodo.
                </p>
              </div>
              <table class="w-full text-sm whitespace-nowrap mt-3">
                <tbody>
                  <tr class="border-b border-gray-100"><td class="px-4 py-2">Ventas iniciales a la cohorte</td><td class="px-4 py-2 text-right tabular-nums">{{ money(data.nrr.initial) }}</td><td class="px-4 py-2 text-right text-gray-500">{{ data.nrr.customers }} tiendas</td></tr>
                  <tr class="border-b border-gray-100"><td class="px-4 py-2">+ Expansión (upgrades, más comisión)</td><td class="px-4 py-2 text-right tabular-nums text-primary">+{{ money(data.nrr.expansion) }}</td><td class="px-4 py-2 text-right text-gray-500">{{ data.nrr.customers_expanded }} tiendas</td></tr>
                  <tr class="border-b border-gray-100"><td class="px-4 py-2">− Contracción (downgrades, menos comisión)</td><td class="px-4 py-2 text-right tabular-nums text-amber-700">−{{ money(data.nrr.contraction) }}</td><td class="px-4 py-2 text-right text-gray-500">{{ data.nrr.customers_contracted }} tiendas</td></tr>
                  <tr class="border-b border-gray-100"><td class="px-4 py-2">− Churn en dinero</td><td class="px-4 py-2 text-right tabular-nums text-red-600">−{{ money(data.nrr.churn) }}</td><td class="px-4 py-2 text-right text-gray-500">{{ data.nrr.customers_churned }} tiendas</td></tr>
                  <tr class="bg-gray-50 font-semibold"><td class="px-4 py-2">Ventas actuales de la cohorte</td><td class="px-4 py-2 text-right tabular-nums">{{ money(data.nrr.final) }}</td><td></td></tr>
                </tbody>
              </table>
            </div>
            <div class="space-y-3">
              <div class="bg-white rounded-xl border p-5" :class="(data.nrr.nrr ?? 0) > 100 ? 'border-primary/50' : 'border-red-200'">
                <div class="text-xs text-gray-500">Net Revenue Retention</div>
                <div class="text-3xl font-bold tabular-nums" :class="(data.nrr.nrr ?? 0) > 100 ? 'text-primary' : 'text-red-600'">{{ pct(data.nrr.nrr) }}</div>
                <div class="text-xs text-gray-400 mt-1">(inicial + expansión − contracción − churn) ÷ inicial · objetivo &gt; 100 %</div>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500">Gross Revenue Retention</div>
                <div class="text-2xl font-semibold tabular-nums">{{ pct(data.nrr.grr) }}</div>
                <div class="text-xs text-gray-400 mt-1">Sin expansión: cuánto del ingreso inicial se conserva.</div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ============ PROYECCIÓN ============ -->
        <TabPanel header="Proyección 5 años">
          <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <div class="px-4 pt-4">
              <h2 class="text-base font-semibold text-gray-900">Supuestos por año</h2>
              <p class="text-xs text-gray-500 mt-1 max-w-3xl">
                Clientes nuevos = presupuesto comercial ÷ CAC. Vacío = el dato actual: presupuesto
                {{ money(data.projection.base.commercial_annual) }}/año (gasto comercial del trimestre × 4), CAC
                {{ money(data.projection.base.cac) }}, churn {{ pct(data.projection.base.churn) }} y take rate
                {{ pct(data.projection.base.take_rate, 3) }}. Los montos se ingresan en US$.
              </p>
            </div>
            <table class="w-full text-sm whitespace-nowrap mt-3">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-200">
                  <th class="px-4 py-2 text-left font-medium min-w-[240px]"></th>
                  <th v-for="(_, i) in draft.projection" :key="i" class="px-2 py-2 text-right font-medium">Año {{ i + 1 }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in YEAR_FIELDS" :key="field.key" class="border-b border-gray-100">
                  <td class="px-4 py-1.5 text-gray-700">{{ field.label }}</td>
                  <td v-for="(year, i) in draft.projection" :key="i" class="px-2 py-1 text-right">
                    <InputNumber
                      v-model="year[field.key]"
                      :min="field.min" :max="field.max"
                      :max-fraction-digits="field.digits"
                      :suffix="field.suffix" :prefix="field.prefix"
                      :placeholder="field.placeholder"
                      input-class="w-28 text-right py-1"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-4 mt-4">
            <VChart :option="projectionChart" autoresize class="h-80" />
          </div>

          <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto mt-4">
            <table class="w-full text-sm whitespace-nowrap">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-200">
                  <th class="px-4 py-2 text-left font-medium min-w-[240px]"></th>
                  <th class="px-3 py-2 text-right font-medium" title="ARR fijo de hoy + variables y servicios de los últimos 12 meses">Base hoy</th>
                  <th v-for="year in data.projection.years" :key="year.year" class="px-3 py-2 text-right font-medium">Año {{ year.year }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in projectionRows" :key="row.label" :class="row.strong ? 'bg-gray-50 font-semibold' : 'border-b border-gray-100'">
                  <td class="px-4 py-1.5" :class="row.indent ? 'pl-8 text-gray-600' : ''">{{ row.label }}</td>
                  <td class="px-3 py-1.5 text-right tabular-nums text-gray-500">{{ row.base }}</td>
                  <td v-for="(value, i) in row.values" :key="i" class="px-3 py-1.5 text-right tabular-nums">{{ value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-gray-500 mt-2 max-w-4xl">
            * Sin presupuesto ingresado: el gasto comercial actual anualizado. La base de los fijos es el ARR de hoy, no lo
            facturado en los 12 meses. Los clientes que ya estaban se quedan a razón de (1 − churn)<sup>12</sup>; los nuevos entran a lo largo del año
            y se quedan a (1 − churn)<sup>6</sup>. El ingreso de cada año se calcula sobre el promedio de clientes. Fijos =
            clientes × ARPU fijo × 12; variables = GMV procesado × take rate, con el GMV por cliente como segunda métrica
            operativa.
          </p>
        </TabPanel>
      </TabView>

      <p class="text-xs text-gray-400">
        Al {{ dateLabel(data.as_of) }} · tipo de cambio venta {{ num(data.fx.spot, 3) }}. Los flujos de cada mes van a su
        tipo de cambio; las cifras de un momento (MRR, ARPU, CAC, NRR) al del día.
      </p>
    </template>

    <Dialog v-model:visible="saveAsVisible" header="Guardar escenario" modal :style="{ width: '24rem' }">
      <div class="space-y-3">
        <InputText v-model="saveAsName" placeholder="Base, conservador, agresivo…" class="w-full" maxlength="80" autofocus />
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox v-model="saveAsDefault" binary /> Usarlo como predeterminado
        </label>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="saveAsVisible = false" />
        <Button label="Guardar" icon="pi pi-save" :disabled="!saveAsName.trim()" :loading="saving" @click="save(null)" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { useToast } from 'primevue/usetoast'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  getValuation, previewValuation, saveValuationScenario, deleteValuationScenario, getValuationCostMap, saveValuationCostMap
} from '@/api/valuation.api'
import { accountingErrorMessage } from '@/api/accounting.api'
import type {
  CostBucket, CostMapEntry, ProjectionYearAssumption, Valuation, ValuationAssumptions, ValuationCurrency, ValuationSignal
} from '@/types/valuation.types'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const toast = useToast()

const COLORS = { fijo: '#00b2a6', variable: '#f59e0b', servicios: '#94a3b8', clientes: '#334155' }
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const STAFF_PARTS = [
  { key: 'servicios', label: 'Desarrollo a la medida' },
  { key: 'soporte', label: 'Soporte' },
  { key: 'onboarding', label: 'Onboarding' }
] as const

const BUCKET_OPTIONS: { value: CostBucket; label: string }[] = [
  { value: 'infraestructura', label: 'Costo · Infraestructura y cloud' },
  { value: 'terceros', label: 'Costo · APIs y herramientas de terceros' },
  { value: 'pasarela', label: 'Costo · Pasarelas' },
  { value: 'soporte', label: 'Costo · Soporte' },
  { value: 'onboarding', label: 'Costo · Onboarding' },
  { value: 'servicios', label: 'Costo de servicios a la medida' },
  { value: 'comercial', label: 'Comercial (entra al CAC)' },
  { value: 'gasto_operativo', label: 'Gasto operativo (fuera del margen)' }
]

type YearField = {
  key: keyof ProjectionYearAssumption
  label: string
  min: number
  max: number
  digits: number
  suffix?: string
  prefix?: string
  placeholder?: string
}

const YEAR_FIELDS: YearField[] = [
  { key: 'budget_usd', label: 'Presupuesto comercial (US$)', min: 0, max: 100_000_000, digits: 0, prefix: '$ ', placeholder: 'actual' },
  { key: 'cac_usd', label: 'CAC (US$)', min: 0, max: 1_000_000, digits: 2, prefix: '$ ', placeholder: 'medido' },
  { key: 'monthly_churn', label: 'Churn mensual', min: 0, max: 100, digits: 2, suffix: ' %', placeholder: 'medido' },
  { key: 'price_growth', label: 'Alza del ARPU fijo', min: -100, max: 1000, digits: 1, suffix: ' %' },
  { key: 'gmv_growth', label: 'Crecimiento del GMV por cliente', min: -100, max: 1000, digits: 1, suffix: ' %' },
  { key: 'take_rate', label: 'Take rate sobre GMV', min: 0, max: 100, digits: 3, suffix: ' %', placeholder: 'medido' },
  { key: 'services_growth', label: 'Crecimiento de servicios', min: -100, max: 1000, digits: 1, suffix: ' %' }
]

const currencyOptions = [{ label: 'US$', value: 'USD' }, { label: 'S/', value: 'PEN' }]

const data = ref<Valuation | null>(null)
const draft = ref<ValuationAssumptions | null>(null)
const scenarioId = ref<number | null>(null)
const currency = ref<ValuationCurrency>('USD')
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const tab = ref(0)

const saveAsVisible = ref(false)
const saveAsName = ref('')
const saveAsDefault = ref(false)

const costMap = ref<CostMapEntry[] | null>(null)
const costMapDraft = ref<Record<number, CostBucket>>({})
const savingCostMap = ref(false)

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

/** Lo que tiene guardado el escenario (o los supuestos por defecto): contra eso se mide "sin guardar". */
const saved = ref<ValuationAssumptions | null>(null)
const dirty = computed(() => !!draft.value && !!saved.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value))
/** El borrador cambió desde el último cálculo: lo de la pantalla no lo refleja. */
const stale = computed(() => !!data.value && !!draft.value && JSON.stringify(draft.value) !== JSON.stringify(data.value.assumptions))
const staffTotal = computed(() => draft.value ? Object.values(draft.value.staff_split).reduce((a, b) => a + (Number(b) || 0), 0) : 100)

const scenarioOptions = computed(() => [
  { label: 'Supuestos por defecto', value: null as number | null },
  ...(data.value?.scenarios ?? []).map(s => ({ label: s.is_default ? `${s.name} (predeterminado)` : s.name, value: s.id as number | null }))
])

// --- Formato ---

function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: currency.value, maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2
  }).format(value)
}
function compact(value: number): string {
  if (Math.round(value) === 0) return '·'
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(value)
}
function num(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-PE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}
function pct(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined ? '—' : `${num(value, digits)} %`
}
function monthLabel(month: string): string {
  const [y, m] = month.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}
function shortMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}
function dateLabel(date: string): string {
  const [y, m, d] = date.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`
}

function signalValue(signal: ValuationSignal): string {
  if (signal.value === null) return '—'
  if (signal.unit === 'x') return `${num(signal.value, 2)}×`
  if (signal.unit === 'meses') return `${num(signal.value, 1)} m`
  return pct(signal.value)
}
function signalClass(status: ValuationSignal['status']): string {
  if (status === 'ok') return 'border-primary/40 bg-primary/5 text-gray-800'
  if (status === 'alerta') return 'border-red-200 bg-red-50 text-red-800'
  return 'border-gray-200 bg-gray-50 text-gray-500'
}

// --- Datos derivados ---

const warnings = computed(() => {
  const d = data.value
  if (!d) return []
  const list: string[] = []
  if (d.costs.coverage.missing_payroll.length) {
    list.push(`Sin planilla cargada: ${d.costs.coverage.missing_payroll.map(monthLabel).join(', ')}. El costo de soporte y el CAC salen más bajos.`)
  }
  if (d.costs.coverage.missing_expenses.length) {
    list.push(`Sin gastos cargados: ${d.costs.coverage.missing_expenses.map(monthLabel).join(', ')}.`)
  }
  if (d.revenue.untagged > 0) list.push(`Hay ${money(d.revenue.untagged)} facturados sin fuente: quedan fuera de la composición. Etiquétalos en Líneas facturadas.`)
  if (d.fx.missing.length) list.push(`Sin tipo de cambio del BCRP para: ${d.fx.missing.join(', ')}. Se usó el más cercano.`)
  if (d.cac.new_customers === 0) list.push('No hubo clientes nuevos en el trimestre: el CAC no se puede medir y la proyección no suma clientes salvo que pongas un CAC.')
  return list
})

const kpis = computed(() => {
  const d = data.value!
  return [
    { label: 'ARR equivalente', value: money(d.recurring.arr_equivalent), hint: `MRR ${money(d.recurring.mrr_equivalent)}` },
    { label: 'Ingresos 12 meses', value: money(d.revenue.total), hint: `${num(d.revenue.buckets[0]?.share, 0)} % fijos` },
    { label: 'Clientes pagando', value: num(d.recurring.customers), hint: `al cierre de ${monthLabel(d.ref_month)}` },
    { label: 'Margen bruto SaaS', value: pct(d.costs.gross_margin_expected), hint: d.costs.gross_margin_source === 'supuesto' ? 'supuesto' : 'histórico' },
    { label: 'Churn mensual', value: pct(d.churn.average, 2), hint: 'promedio 6 meses' },
    { label: 'CAC', value: money(d.cac.cac), hint: `${d.cac.new_customers} nuevos en el trimestre` },
    { label: 'LTV', value: money(d.ltv.ltv), hint: `ARPU ${money(d.ltv.arpu)}` },
    { label: 'LTV / CAC', value: d.ltv.ltv_cac === null ? '—' : `${num(d.ltv.ltv_cac, 2)}×`, hint: `recupera en ${num(d.ltv.payback_months, 1)} meses` },
    { label: 'NRR', value: pct(d.nrr.nrr), hint: `GRR ${pct(d.nrr.grr)}` },
    { label: 'GMV procesado 12m', value: money(d.projection.base.gmv_12m), hint: `take rate ${pct(d.projection.base.take_rate, 2)}` }
  ]
})

function sourcesOf(bucket: string) {
  return (data.value?.revenue.sources ?? []).filter(s => s.bucket === bucket)
}

const monthTotals = computed(() => {
  const d = data.value
  if (!d) return []
  return d.months.map((_, i) => d.revenue.buckets.reduce((sum, b) => sum + (b.values[i] ?? 0), 0))
})

const revenueChart = computed(() => {
  const d = data.value!
  return {
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => money(v) },
    legend: { bottom: 0 },
    grid: { left: 60, right: 50, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: d.months.map(shortMonth) },
    yAxis: [{ type: 'value' }, { type: 'value', name: 'Clientes', splitLine: { show: false } }],
    series: [
      ...d.revenue.buckets.map(b => ({
        name: b.key === 'fijo' ? 'Fijos' : b.key === 'variable' ? 'Variables' : 'Servicios',
        type: 'bar', stack: 'ingresos', data: b.values, itemStyle: { color: COLORS[b.key] }
      })),
      {
        name: 'Clientes pagando', type: 'line', yAxisIndex: 1, data: d.recurring.customers_history,
        itemStyle: { color: COLORS.clientes }, tooltip: { valueFormatter: (v: number) => num(v) }
      }
    ]
  }
})

const projectionChart = computed(() => {
  const d = data.value!
  const labels = ['Base hoy', ...d.projection.years.map(y => `Año ${y.year}`)]
  const base = d.projection.base
  return {
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => money(v) },
    legend: { bottom: 0 },
    grid: { left: 70, right: 50, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: labels },
    yAxis: [{ type: 'value' }, { type: 'value', name: 'Clientes', splitLine: { show: false } }],
    series: [
      { name: 'Fijos', type: 'bar', stack: 'p', data: [base.fixed_arr, ...d.projection.years.map(y => y.fixed)], itemStyle: { color: COLORS.fijo } },
      { name: 'Variables', type: 'bar', stack: 'p', data: [base.variable_12m, ...d.projection.years.map(y => y.variable)], itemStyle: { color: COLORS.variable } },
      { name: 'Servicios', type: 'bar', stack: 'p', data: [base.services, ...d.projection.years.map(y => y.services)], itemStyle: { color: COLORS.servicios } },
      {
        name: 'Clientes al cierre', type: 'line', yAxisIndex: 1, data: [base.customers, ...d.projection.years.map(y => y.customers_end)],
        itemStyle: { color: COLORS.clientes }, tooltip: { valueFormatter: (v: number) => num(v) }
      }
    ]
  }
})

const projectionRows = computed(() => {
  const d = data.value!
  const b = d.projection.base
  const y = d.projection.years
  const row = (label: string, base: string, values: string[], opts: { strong?: boolean; indent?: boolean } = {}) => ({ label, base, values, ...opts })
  return [
    row('Presupuesto comercial', money(b.commercial_annual), y.map(x => money(x.budget) + (x.budget_source === 'actual' ? '*' : ''))),
    row('CAC', money(b.cac), y.map(x => money(x.cac))),
    row('Clientes al inicio', '', y.map(x => num(x.customers_start)), { indent: true }),
    row('+ Nuevos (presupuesto ÷ CAC)', '', y.map(x => num(x.customers_new)), { indent: true }),
    row('− Perdidos (churn)', '', y.map(x => num(x.customers_lost)), { indent: true }),
    row('Clientes al cierre', num(b.customers), y.map(x => num(x.customers_end)), { strong: true }),
    row('ARPU fijo mensual', money(b.arpu_fixed), y.map(x => money(x.arpu_fixed))),
    row('GMV procesado', money(b.gmv_12m), y.map(x => money(x.gmv))),
    row('Ingresos fijos', money(b.fixed_arr), y.map(x => money(x.fixed)), { indent: true }),
    row('Ingresos variables', money(b.variable_12m), y.map(x => money(x.variable)), { indent: true }),
    row('Servicios', money(b.services), y.map(x => money(x.services)), { indent: true }),
    row('Ingresos totales', money(b.fixed_arr + b.variable_12m + b.services), y.map(x => money(x.total)), { strong: true }),
    row('Crecimiento', '', y.map(x => pct(x.growth))),
    row('ARR fijo al cierre', money(b.fixed_arr), y.map(x => money(x.fixed_arr_end))),
    row('Utilidad bruta', '', y.map(x => money(x.gross_profit))),
    row('LTV / CAC', d.ltv.ltv_cac === null ? '—' : `${num(d.ltv.ltv_cac, 2)}×`, y.map(x => (x.ltv_cac === null ? '—' : `${num(x.ltv_cac, 2)}×`)))
  ]
})

// --- Acciones ---

async function load(refresh = false) {
  loading.value = true
  error.value = null
  try {
    data.value = await getValuation(scenarioId.value, currency.value, refresh)
    scenarioId.value = data.value.scenario?.id ?? null
    saved.value = clone(data.value.assumptions)
    draft.value = clone(data.value.assumptions)
  } catch (e) {
    error.value = accountingErrorMessage(e)
  } finally {
    loading.value = false
  }
}

/** Recalcula con el borrador (o, sin cambios, con la moneda nueva). */
async function recalculate() {
  if (!draft.value) return load()
  if (Math.abs(staffTotal.value - 100) > 0.01) {
    toast.add({ severity: 'warn', summary: 'El reparto del personal en costo debe sumar 100 %', life: 4000 })
    return
  }
  loading.value = true
  try {
    const keep = clone(draft.value)
    data.value = await previewValuation(scenarioId.value, currency.value, keep)
    // Lo normalizado por el API pasa a ser el borrador: así "sin cambios" vuelve a ser cierto.
    draft.value = clone(data.value.assumptions)
  } catch (e) {
    toast.add({ severity: 'error', summary: accountingErrorMessage(e), life: 5000 })
  } finally {
    loading.value = false
  }
}

async function resetDraft() {
  if (!saved.value) return
  const recalc = JSON.stringify(data.value?.assumptions) !== JSON.stringify(saved.value)
  draft.value = clone(saved.value)
  if (recalc) await recalculate()
}

function openSaveAs() {
  saveAsName.value = ''
  saveAsDefault.value = !(data.value?.scenarios.length)
  saveAsVisible.value = true
}

async function save(id: number | null) {
  if (!draft.value || !data.value) return
  saving.value = true
  try {
    const name = id === null ? saveAsName.value.trim() : data.value.scenario!.name
    const res = await saveValuationScenario(id, {
      name,
      assumptions: draft.value,
      is_default: id === null ? saveAsDefault.value : data.value.scenario!.is_default
    })
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    saveAsVisible.value = false
    scenarioId.value = res.data.id
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: accountingErrorMessage(e), life: 5000 })
  } finally {
    saving.value = false
  }
}

async function removeScenario() {
  const scenario = data.value?.scenario
  if (!scenario || !window.confirm(`¿Eliminar el escenario «${scenario.name}»?`)) return
  try {
    const res = await deleteValuationScenario(scenario.id)
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    scenarioId.value = null
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: accountingErrorMessage(e), life: 5000 })
  }
}

async function loadCostMap() {
  try {
    costMap.value = await getValuationCostMap()
    costMapDraft.value = Object.fromEntries(costMap.value.map(entry => [entry.id, entry.bucket]))
  } catch (e) {
    toast.add({ severity: 'error', summary: accountingErrorMessage(e), life: 5000 })
  }
}

async function saveCostMap() {
  if (!costMap.value) return
  savingCostMap.value = true
  try {
    // Solo lo que cambió: una categoría que sigue en su rubro por defecto no se fija.
    const changes: Record<number, string> = {}
    for (const entry of costMap.value) {
      if (costMapDraft.value[entry.id] !== entry.bucket) changes[entry.id] = costMapDraft.value[entry.id]
    }
    if (Object.keys(changes).length) {
      const res = await saveValuationCostMap(changes)
      toast.add({ severity: 'success', summary: res.message, life: 3000 })
    }
    costMap.value = null
    if (dirty.value) {
      await recalculate()
    } else {
      await load()
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: accountingErrorMessage(e), life: 5000 })
  } finally {
    savingCostMap.value = false
  }
}

onMounted(() => load())
</script>
