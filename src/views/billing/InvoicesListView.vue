<template>
  <div class="space-y-6">
    <SectionTabs :tabs="INVOICES_TABS" />

    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
      <h1 class="text-2xl font-bold text-gray-900">Comprobantes</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-3xl">
        Todo lo que MiTienda emitió, incluido lo emitido directo en Nubefact, con su estado de cobro. Lo anterior a
        2026 se dio por cobrado; lo de este año queda "por confirmar" hasta que se registre su cobro.
      </p>
      </div>
      <div v-if="authStore.canWrite('finance')" class="flex flex-wrap gap-2">
      <Button
        v-tooltip.left="'Trae ahora lo emitido desde el superadmin y el panel (renovaciones, comisiones). Se hace solo cada hora, al minuto 40.'"
        label="Sincronizar"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :loading="syncing"
        @click="runSync"
      />
      <Button
        v-tooltip.left="'El registro de ventas del SIRE (trae lo emitido en la web de SUNAT y compara todo con SUNAT) o el XML de un comprobante'"
        label="Importar de SUNAT"
        icon="pi pi-upload"
        severity="secondary"
        outlined
        @click="sunatVisible = true"
      />
      </div>
    </div>

    <Dialog :draggable="false" v-model:visible="sunatVisible" header="Importar de SUNAT" modal :style="{ width: '46rem' }" @hide="resetSunat">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Sube el <strong>registro de ventas del SIRE</strong> (la propuesta del RVIE exportada a CSV): entra lo que el libro no
          tiene —como lo emitido en la web de SUNAT (E001)— y se compara todo lo demás con SUNAT. También acepta el
          <strong>XML</strong> de un comprobante suelto emitido en la web de SUNAT.
        </p>
        <input type="file" accept=".csv,.txt,.xml" class="block w-full text-sm text-gray-600" @change="onSunatFile" />
        <div v-if="sunatResult" class="space-y-3 text-sm">
          <div class="rounded-lg bg-gray-50 p-3 grid grid-cols-2 gap-x-6 gap-y-1">
            <span class="text-gray-500">Período del archivo</span>
            <span class="text-gray-800">{{ formatDate(sunatResult.period.from) }} al {{ formatDate(sunatResult.period.to) }}</span>
            <span class="text-gray-500">Comprobantes en SUNAT</span><span class="text-gray-800">{{ sunatResult.total }}</span>
            <span class="text-gray-500">Coinciden con el libro</span><span class="text-green-700">{{ sunatResult.matched }}</span>
            <span class="text-gray-500">Faltan en el libro</span>
            <span :class="sunatResult.missing.length ? 'text-amber-700 font-medium' : 'text-gray-800'">
              {{ sunatResult.missing.length }}<template v-if="sunatResult.executed"> · importados {{ sunatResult.imported }}</template>
            </span>
            <span class="text-gray-500">Monto distinto</span><span :class="sunatResult.amount_diff.length ? 'text-red-600' : 'text-gray-800'">{{ sunatResult.amount_diff.length }}</span>
            <span class="text-gray-500">Anulado en uno y no en otro</span><span :class="sunatResult.status_diff.length ? 'text-red-600' : 'text-gray-800'">{{ sunatResult.status_diff.length }}</span>
            <span class="text-gray-500">En el libro y no en SUNAT</span><span :class="sunatResult.extra.length ? 'text-red-600' : 'text-gray-800'">{{ sunatResult.extra.length }}</span>
          </div>
          <div v-for="group in sunatGroups" :key="group.title">
            <div class="font-medium text-gray-700 mb-1">{{ group.title }}</div>
            <div class="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              <div v-for="row in group.rows" :key="group.title + row.number + row.type" class="flex justify-between gap-3 px-3 py-1.5 text-xs">
                <span class="font-mono text-gray-800">{{ row.type === 3 ? 'NC ' : '' }}{{ row.number }}</span>
                <span class="text-gray-500">{{ formatDate(row.issue_date) }}</span>
                <span class="flex-1 truncate text-gray-600">{{ row.customer_name }}</span>
                <span class="tabular-nums text-gray-800">{{ group.amount(row) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" text @click="sunatVisible = false" />
        <Button
          v-if="sunatResult && !sunatResult.executed && sunatResult.missing.length > 0"
          :label="`Importar ${sunatResult.missing.length} que faltan`"
          icon="pi pi-check"
          :loading="sunatLoading"
          @click="runSunat(true)"
        />
      </template>
    </Dialog>

    <!-- Cuentas por cobrar: no cambian al filtrar por estado de cobro -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" :class="{ 'opacity-60': loading }">
      <button
        v-for="card in cards"
        :key="card.filter"
        type="button"
        class="bg-white rounded-xl border p-5 text-left transition-colors hover:border-primary-300"
        :class="filters.payment === card.filter ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200'"
        @click="setPayment(card.filter)"
      >
        <div class="text-sm text-gray-500">{{ card.label }}</div>
        <!-- Solo dólares (p. ej. un cliente que se factura en US$): el número grande va en dólares -->
        <div class="text-2xl font-bold mt-1" :class="card.color">
          {{ card.amount === 0 && card.usd > 0 ? money(card.usd, 'USD') : money(card.amount, 'PEN') }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ formatNumber(card.count) }} comprobantes
          <template v-if="card.usd > 0 && card.amount !== 0"> · además {{ money(card.usd, 'USD') }}</template>
        </div>
        <div class="text-xs text-gray-400 mt-0.5">{{ card.hint }}</div>
      </button>
    </div>

    <!-- Quién debe más -->
    <div v-if="summary.debtors.length > 0" class="bg-white rounded-xl border border-gray-200 p-5">
      <button type="button" class="flex w-full items-center justify-between text-left" @click="showDebtors = !showDebtors">
        <span class="text-sm font-semibold text-gray-800">
          Mayores saldos sin cobrar
          <span class="font-normal text-gray-400">· pendiente y por confirmar, en soles</span>
        </span>
        <i class="pi text-gray-400" :class="showDebtors ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
      </button>
      <table v-if="showDebtors" class="w-full text-sm mt-3">
        <tbody>
          <tr v-for="debtor in summary.debtors" :key="debtor.customer_document + debtor.customer_name" class="border-t border-gray-100">
            <td class="py-1.5 pr-3">
              <button type="button" class="text-left text-gray-700 hover:text-primary-600" @click="searchCustomer(debtor)">
                {{ debtor.customer_name || '(sin nombre)' }}
              </button>
              <span class="text-xs text-gray-400 font-mono ml-2">{{ debtor.customer_document }}</span>
            </td>
            <td class="py-1.5 text-right text-xs text-gray-400 whitespace-nowrap">
              {{ debtor.invoices }} comprobantes · el más antiguo del {{ formatDate(debtor.oldest) }}
            </td>
            <td class="py-1.5 pl-4 text-right tabular-nums font-semibold text-gray-800 w-32">{{ money(debtor.amount, 'PEN') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar comprobante, RUC, razón social, tienda o dominio..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <Dropdown
          v-model="filters.payment"
          :options="paymentOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="reload"
        />
        <Dropdown
          v-model="yearFilter"
          :options="yearOptions"
          optionLabel="label"
          optionValue="value"
          class="w-36"
          @change="onYearChange"
        />
        <InputText v-model="monthFilter" type="month" class="w-44" v-tooltip.top="'Un mes en particular'" @change="reload" />
        <Dropdown
          v-model="originFilter"
          :options="originOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="reload"
        />
        <Button
          v-if="hasActiveFilters"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="clearFilters"
          v-tooltip="'Limpiar filtros'"
        />
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!loading && invoices.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin comprobantes</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron comprobantes con los filtros seleccionados</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <!-- Barra del lote: solo con algo seleccionado -->
      <div
        v-if="selected.length > 0"
        class="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3"
      >
        <span class="text-sm font-medium text-gray-700">
          {{ selected.length }} seleccionado{{ selected.length === 1 ? '' : 's' }} ·
          {{ money(selectedTotal, 'PEN') }}
        </span>
        <Button v-if="authStore.canWrite('collections')" label="Registrar cobro" icon="pi pi-check" size="small" @click="openPayment(selected)" />
        <Button
          v-if="authStore.canWrite('platform')"
          v-tooltip.top="'Crea un aviso en el backoffice de las tiendas de estos clientes'"
          label="Aviso en el panel"
          icon="pi pi-megaphone"
          size="small"
          severity="secondary"
          outlined
          :loading="reminderLoading"
          @click="openReminder"
        />
        <template v-if="authStore.canWrite('collections')">
          <Button
            v-tooltip.top="'Un correo por cliente con lo que tiene pendiente y las cuentas donde pagar'"
            label="Recordatorio por correo"
            icon="pi pi-envelope"
            size="small"
            severity="secondary"
            outlined
            @click="openEmail('reminder', selected)"
          />
          <Button label="Reenviar por correo" icon="pi pi-send" size="small" severity="secondary" outlined @click="openEmail('invoice', selected)" />
        </template>
        <Button label="Quitar selección" size="small" text severity="secondary" @click="selected = []" />
      </div>

      <DataTable
        v-model:selection="selected"
        :value="invoices"
        :loading="loading"
        dataKey="id"
        stripedRows
        class="p-datatable-sm"
      >
        <Column selectionMode="multiple" style="width: 3rem" />

        <Column header="Comprobante" style="min-width: 150px">
          <template #body="{ data: row }">
            <a
              v-if="row.pdf_url"
              :href="row.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              {{ row.number }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
            <span v-else class="text-sm text-gray-700 font-medium">{{ row.number }}</span>
            <div class="text-xs text-gray-400">{{ documentLabel(row) }} · {{ originLabel(row.origin) }}</div>
          </template>
        </Column>

        <Column header="Cliente" style="min-width: 220px">
          <template #body="{ data: row }">
            <router-link
              v-if="row.tienda_id"
              :to="`/stores/${row.tienda_id}`"
              class="text-sm text-gray-700 hover:text-primary-600"
            >
              {{ row.customer_name || '(sin nombre)' }}
            </router-link>
            <span v-else class="text-sm text-gray-700">{{ row.customer_name || '(sin nombre)' }}</span>
            <div class="text-xs text-gray-400 font-mono">{{ row.customer_document }}</div>
            <div v-if="row.store_names" class="text-xs text-gray-500 truncate max-w-xs" :title="row.store_names">
              <i class="pi pi-shop text-[10px] mr-0.5"></i>{{ row.store_names }}
            </div>
          </template>
        </Column>

        <Column header="Concepto" style="min-width: 200px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600 line-clamp-2">{{ row.concept }}</span>
            <span v-if="row.line_count > 1" class="text-xs text-gray-400">y {{ row.line_count - 1 }} línea(s) más</span>
          </template>
        </Column>

        <Column header="Emisión" style="width: 130px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.issue_date) }}</span>
            <div v-if="row.due_date && row.due_date !== row.issue_date" class="text-xs" :class="row.is_overdue ? 'text-red-600' : 'text-gray-400'">
              vence {{ formatDate(row.due_date) }}
            </div>
          </template>
        </Column>

        <Column header="Total" style="min-width: 120px">
          <template #body="{ data: row }">
            <span
              class="text-sm font-semibold block text-right tabular-nums"
              :class="row.status === 1 ? 'text-gray-800' : 'text-gray-400 line-through'"
            >
              {{ money(row.total, row.currency) }}
            </span>
            <span v-if="row.credited > 0" class="text-xs text-gray-400 block text-right">
              NC por {{ money(row.credited, row.currency) }}
            </span>
          </template>
        </Column>

        <Column header="Cobro" style="min-width: 190px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="paymentBadge(row).class"
            >
              {{ paymentBadge(row).label }}
            </span>
            <div v-if="paymentDetail(row)" class="text-xs text-gray-400 mt-0.5">{{ paymentDetail(row) }}</div>
          </template>
        </Column>

        <Column header="" style="width: 170px">
          <template #body="{ data: row }">
            <Button
              v-if="row.status === 1 && authStore.canWrite('collections')"
              v-tooltip.top="'Reenviar por correo'"
              icon="pi pi-envelope"
              size="small"
              text
              rounded
              severity="secondary"
              @click="openEmail('invoice', [row])"
            />
            <!-- Anotar un cobro a mano; quien solo concilia lo hace desde Bancos -->
            <Button
              v-if="row.payment_status && authStore.canWrite('collections')"
              :label="row.balance > 0 ? 'Registrar' : 'Corregir'"
              icon="pi pi-wallet"
              size="small"
              :outlined="row.balance > 0"
              :text="row.balance === 0"
              @click="openPayment([row])"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ meta.current_page }} de {{ meta.total_pages }} ({{ formatNumber(meta.total) }} comprobantes)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="meta.current_page <= 1"
            @click="goToPage(meta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== meta.current_page"
            :outlined="p === meta.current_page"
            rounded
            size="small"
            @click="goToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="meta.current_page >= meta.total_pages"
            @click="goToPage(meta.current_page + 1)"
          />
        </div>
      </div>
    </div>

    <!-- Registrar cobro -->
    <Dialog :draggable="false"
      v-model:visible="paymentVisible"
      modal
      :header="single ? `Cobro de ${single.number}` : `Cobro de ${paymentTargets.length} comprobantes`"
      :style="{ width: '36rem' }"
    >
      <div class="space-y-4">
        <!-- Un comprobante: saldo y abonos -->
        <template v-if="single">
          <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <div class="text-gray-700">{{ single.customer_name }}</div>
            <div class="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-gray-500">
              <span>Emisión</span>
              <span class="text-right tabular-nums text-gray-800">
                {{ formatDate(single.issue_date) }}
                <span v-if="single.due_date && single.due_date !== single.issue_date" :class="single.is_overdue ? 'text-red-600' : 'text-gray-400'">
                  · vence {{ formatDate(single.due_date) }}
                </span>
              </span>
              <span>Total del comprobante</span>
              <span class="text-right tabular-nums text-gray-800">{{ money(single.total, single.currency) }}</span>
              <template v-if="single.credited > 0">
                <span>Notas de crédito</span>
                <span class="text-right tabular-nums text-gray-800">− {{ money(single.credited, single.currency) }}</span>
              </template>
              <span>Abonado</span>
              <span class="text-right tabular-nums text-gray-800">{{ money(installments?.invoice.paid ?? 0, single.currency) }}</span>
              <span class="font-semibold text-gray-700">Saldo</span>
              <span class="text-right tabular-nums font-semibold" :class="remaining > 0 ? 'text-orange-600' : 'text-green-600'">
                {{ money(remaining, single.currency) }}
              </span>
            </div>
            <p v-if="single.plan_backed" class="text-xs text-gray-500 mt-2">
              Es de un plan: la suscripción de la tienda sigue pendiente hasta que el saldo llegue a cero.
            </p>
          </div>

          <p v-if="loadingInstallments" class="text-sm text-gray-400">
            <i class="pi pi-spin pi-spinner mr-2"></i>Cargando abonos…
          </p>

          <table v-else-if="installments && installments.payments.length > 0" class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th class="pb-1">Abonos</th>
                <th class="pb-1">Medio</th>
                <th class="pb-1 text-right">Monto</th>
                <th class="pb-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in installments.payments" :key="payment.id" class="border-t border-gray-100">
                <td class="py-1.5 text-gray-600 whitespace-nowrap">{{ formatDate(payment.paid_at) }}</td>
                <td class="py-1.5 text-gray-600">
                  {{ payment.method }}
                  <span v-if="payment.reference" class="text-xs text-gray-400">· op. {{ payment.reference }}</span>
                  <div v-if="payment.note" class="text-xs text-gray-400">{{ payment.note }}</div>
                </td>
                <td class="py-1.5 text-right tabular-nums text-gray-800">{{ money(payment.amount, single.currency) }}</td>
                <td class="py-1.5 text-right">
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    :loading="deletingId === payment.id"
                    v-tooltip.top="'Quitar este abono'"
                    @click="removeInstallment(payment.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <p
            v-else-if="installments && single.payment_status === 'cobrado'"
            class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            Figura cobrado, pero sin abonos detallados
            ({{ single.payment_source === 'supuesto' ? 'se dio por cobrado' : 'lo indica la venta del plan' }}). Si
            agregas un abono menor al total, el comprobante se reabre y queda con saldo.
          </p>
        </template>

        <!-- Un saldo de céntimos: se cierra como redondeo (va a la 6599), no como cobro -->
        <div
          v-if="single && remaining > 0 && remaining <= 1 && authStore.canWrite('collections')"
          class="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
        >
          <span class="text-amber-800">Queda un saldo de {{ money(remaining, single.currency) }}: probablemente un redondeo.</span>
          <Button label="Cerrar como redondeo" size="small" severity="secondary" outlined :loading="roundingSaving" @click="closeAsRounding" />
        </div>

        <!-- Varios: solo cambio de estado -->
        <div v-else class="bg-gray-50 rounded-lg p-3 text-sm">
          <div class="flex justify-between text-gray-500">
            <span>{{ paymentTargets.length }} comprobantes</span>
            <span class="font-semibold text-gray-800">{{ money(targetsTotal, 'PEN') }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            "Cobrado" salda el saldo completo de cada uno. Para un pago por partes, abre el comprobante solo.
            <template v-if="targetsFromPlans > 0">
              {{ targetsFromPlans }} son de un plan: el cobro queda también en la suscripción.
            </template>
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Qué registrar</label>
          <SelectButton
            v-model="paymentForm.action"
            :options="actionOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
        </div>

        <template v-if="paymentForm.action === 'abono' || paymentForm.action === 'cobrado'">
          <p v-if="single && remaining <= 0" class="text-sm text-gray-500">
            El comprobante no tiene saldo: no admite más abonos.
          </p>
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Fecha del abono *</label>
                <Calendar v-model="paymentForm.date" dateFormat="yy-mm-dd" :maxDate="new Date()" showIcon class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Medio *</label>
                <Dropdown
                  v-model="paymentForm.method"
                  :options="INSTALLMENT_METHODS"
                  editable
                  placeholder="BCP, Yape…"
                  class="w-full"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-if="single">
                <label class="block text-sm font-medium text-gray-600 mb-1">Monto *</label>
                <InputNumber
                  v-model="paymentForm.amount"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  :min="0"
                  class="w-full"
                />
                <button
                  v-if="paymentForm.amount !== remaining"
                  type="button"
                  class="text-xs text-primary-600 hover:underline mt-1"
                  @click="paymentForm.amount = remaining"
                >
                  Poner todo el saldo ({{ money(remaining, single.currency) }})
                </button>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">N.º de operación</label>
                <InputText v-model="paymentForm.reference" maxlength="100" class="w-full" />
              </div>
            </div>
            <p v-if="single" class="text-xs text-gray-500">
              Un pago en partes es un abono por cada parte. Con detracción: un abono por lo que entró a la cuenta y otro,
              con medio "Detracción (Banco de la Nación)", por el resto.
            </p>
          </template>
        </template>

        <div v-else-if="paymentForm.action === 'pendiente'">
          <label class="block text-sm font-medium text-gray-600 mb-1">Vence el</label>
          <Calendar v-model="paymentForm.due_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
          <p class="text-xs text-gray-500 mt-1">
            Se sabe que no se ha cobrado. Vacío conserva el vencimiento que ya tenía.
          </p>
        </div>

        <div v-if="!(single && remaining <= 0 && paymentForm.action === 'abono')">
          <label class="block text-sm font-medium text-gray-600 mb-1">
            Nota{{ paymentForm.action === 'incobrable' ? ' *' : '' }}
          </label>
          <Textarea
            v-model="paymentForm.note"
            rows="2"
            maxlength="255"
            class="w-full"
            :placeholder="paymentForm.action === 'incobrable' ? 'Por qué se da por incobrable' : 'Opcional'"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" text severity="secondary" @click="closePayment" />
        <Button
          :label="paymentForm.action === 'abono' ? 'Agregar abono' : 'Guardar'"
          icon="pi pi-check"
          :loading="saving"
          :disabled="!!single && paymentForm.action === 'abono' && remaining <= 0"
          @click="savePayment"
        />
      </template>
    </Dialog>
    <InvoiceEmailDialog v-model:visible="emailVisible" :mode="emailMode" :invoice-ids="emailIds" />
    <BroadcastFormDialog v-model:visible="reminderVisible" :record="reminderDraft" :saving="reminderSaving" @submit="saveReminder" />
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { INVOICES_TABS } from '@/config/sections.config'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import {
  getLedgerInvoices, registerInvoicePayment, getInvoiceInstallments, addInvoiceInstallment, deleteInvoiceInstallment,
  ledgerErrorMessage, importFromSunat, syncLedger, type SunatImportResult, type SunatAuditRow
} from '@/api/ledger.api'
import { PLAN_PAYMENT_METHODS } from '@/config/plan-payment.config'
import { toIsoDate } from '@/utils/dates'
import BroadcastFormDialog from '@/views/broadcasts/BroadcastFormDialog.vue'
import InvoiceEmailDialog from './InvoiceEmailDialog.vue'
import { createBroadcast, resolveBroadcastStores } from '@/api/broadcasts.api'
import type { Broadcast, BroadcastFormInput } from '@/types/broadcast.types'
import type {
  InvoiceInstallments, InvoicePaymentFilter, InvoicePaymentInput, LedgerInvoice, LedgerInvoiceFilters,
  ReceivablesByCurrency, ReceivablesSummary
} from '@/types/ledger.types'

const toast = useToast()
const authStore = useAuthStore()

// --- Correos al cliente: reenviar el comprobante o recordarle el pago ---
const emailVisible = ref(false)
const emailMode = ref<'invoice' | 'reminder'>('invoice')
const emailIds = ref<number[]>([])

function openEmail(mode: 'invoice' | 'reminder', rows: LedgerInvoice[]) {
  emailMode.value = mode
  emailIds.value = rows.map(r => r.id)
  emailVisible.value = true
}

// --- Recordatorio de pago: un aviso (broadcast) a las tiendas de los clientes ---
const reminderLoading = ref(false)
const reminderVisible = ref(false)
const reminderSaving = ref(false)
const reminderDraft = ref<Broadcast | null>(null)

function broadcastDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/** Un cliente: el detalle de lo que debe. Varios: un texto común (el aviso es el mismo para todos). */
function reminderBody(rows: LedgerInvoice[]): string {
  const customers = new Set(rows.map(r => r.customer_document || r.customer_name))
  const owed = (r: LedgerInvoice) => (r.balance > 0 ? r.balance : r.total - r.credited - (r.paid_amount ?? 0))
  const closing = 'Si ya realizaste el pago, respóndenos con la constancia para registrarlo. ¡Gracias!'
  if (customers.size > 1) {
    return `Tienes comprobantes de MiTienda pendientes de pago. Por favor, regulariza el pago para evitar la suspensión del servicio.\n\n${closing}`
  }
  const lines = rows.map(r => `- **${r.number}** · emitido el ${formatDate(r.issue_date)} · ${money(owed(r), r.currency)}`)
  const totals = ['PEN', 'USD']
    .map(c => ({ c, sum: rows.filter(r => r.currency === c).reduce((a, r) => a + owed(r), 0) }))
    .filter(t => t.sum > 0)
    .map(t => money(t.sum, t.c))
    .join(' + ')
  return `Hola, **${rows[0].customer_name}**. Tienes ${rows.length === 1 ? 'un comprobante' : 'comprobantes'} de MiTienda pendiente${rows.length === 1 ? '' : 's'} de pago:\n\n${lines.join('\n')}\n\nTotal pendiente: **${totals}**. Por favor, regulariza el pago para evitar la suspensión del servicio.\n\n${closing}`
}

async function openReminder() {
  const rows = selected.value.filter(r => (r.store_ids ?? []).length > 0)
  const withoutStore = selected.value.filter(r => (r.store_ids ?? []).length === 0)
  if (rows.length === 0) {
    toast.add({ severity: 'warn', summary: 'Sin tiendas a quién avisar', detail: 'Ninguno de los comprobantes elegidos está vinculado a una tienda de MiTienda.', life: 7000 })
    return
  }
  reminderLoading.value = true
  try {
    const ids = [...new Set(rows.flatMap(r => r.store_ids ?? []))]
    const res = await resolveBroadcastStores(ids)
    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 86400000)
    reminderDraft.value = {
      id: 0,
      target_scope: 'stores',
      tienda_ids: res.data.found.map(t => t.id),
      tiendas: res.data.found,
      target_plans: null,
      target_status: 'all',
      title: 'Recordatorio de pago',
      body: reminderBody(rows),
      placement: 'modal',
      severity: 'warning',
      is_dismissible: true,
      dismiss_delay_seconds: 15,
      reshow_after_minutes: 1440,
      cta_label: null,
      cta_url: null,
      image_url: null,
      published_at: broadcastDate(now),
      expires_at: broadcastDate(expires),
      created_by_superadmin_id: null,
      activo: true,
      created_at: null,
      updated_at: null
    }
    reminderVisible.value = true
    if (withoutStore.length > 0) {
      toast.add({
        severity: 'warn',
        summary: `${withoutStore.length} sin tienda vinculada`,
        detail: `No reciben el aviso: ${withoutStore.map(r => `${r.number} (${r.customer_name})`).join(', ')}`,
        life: 9000
      })
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo preparar el aviso', detail: ledgerErrorMessage(e), life: 7000 })
  } finally {
    reminderLoading.value = false
  }
}

async function saveReminder(payload: BroadcastFormInput) {
  reminderSaving.value = true
  try {
    await createBroadcast(payload)
    reminderVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Recordatorio publicado',
      detail: `Lo verán ${payload.tienda_ids.length} tienda${payload.tienda_ids.length === 1 ? '' : 's'} en su backoffice. Se edita o desactiva en Avisos a comerciantes.`,
      life: 7000
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo publicar', detail: ledgerErrorMessage(e), life: 7000 })
  } finally {
    reminderSaving.value = false
  }
}

// --- Sincronizar a demanda (lo mismo que el cron horario) ---
const syncing = ref(false)

async function runSync() {
  syncing.value = true
  try {
    const res = await syncLedger()
    const added = res.added.length
    toast.add({
      severity: 'success',
      summary: added > 0 ? `${added} comprobante${added === 1 ? '' : 's'} nuevo${added === 1 ? '' : 's'} en el libro` : 'El libro ya estaba al día',
      detail: added > 0 ? res.added.slice(0, 10).join(', ') + (added > 10 ? '…' : '') : undefined,
      life: 6000
    })
    if (added > 0 || res.payments > 0) await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo sincronizar', detail: ledgerErrorMessage(e), life: 7000 })
  } finally {
    syncing.value = false
  }
}

// --- Importar de SUNAT (registro de ventas del SIRE o XML) ---
const sunatVisible = ref(false)
const sunatFile = ref<File | null>(null)
const sunatResult = ref<SunatImportResult | null>(null)
const sunatLoading = ref(false)

function resetSunat() {
  sunatFile.value = null
  sunatResult.value = null
}
function onSunatFile(event: Event) {
  sunatFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
  sunatResult.value = null
  if (sunatFile.value) runSunat(false)
}
async function runSunat(execute: boolean) {
  if (!sunatFile.value) return
  sunatLoading.value = true
  try {
    const res = await importFromSunat(sunatFile.value, execute)
    sunatResult.value = res.data
    if (execute) {
      toast.add({ severity: 'success', summary: res.message, life: 4000 })
      load()
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo leer el archivo', detail: ledgerErrorMessage(e), life: 7000 })
  } finally {
    sunatLoading.value = false
  }
}
const sunatGroups = computed(() => {
  const r = sunatResult.value
  if (!r) return []
  const sunat = (row: SunatAuditRow) => money(row.sunat_total ?? 0, row.currency)
  return [
    { title: r.executed ? 'Importados (estaban en SUNAT y no en el libro)' : 'Faltan en el libro (se importan)', rows: r.missing, amount: sunat },
    { title: 'Monto distinto (SUNAT · libro)', rows: r.amount_diff, amount: (row: SunatAuditRow) => `${sunat(row)} · ${money(row.ledger_total ?? 0, row.currency)}` },
    { title: 'Anulado en uno y no en el otro', rows: r.status_diff, amount: (row: SunatAuditRow) => (row.sunat_status === 2 ? 'anulado en SUNAT' : 'anulado en el libro') },
    { title: 'En el libro y no en SUNAT', rows: r.extra, amount: (row: SunatAuditRow) => money(row.ledger_total ?? 0, row.currency) },
  ].filter(g => g.rows.length > 0)
})
const { formatDate, formatNumber } = useFormatters()

const invoices = ref<LedgerInvoice[]>([])
const summary = ref<ReceivablesSummary>({ by_currency: {}, debtors: [] })
const meta = ref({ current_page: 1, per_page: 25, total: 0, total_pages: 1 })
const loading = ref(false)
const error = ref<string | null>(null)
const selected = ref<LedgerInvoice[]>([])
const showDebtors = ref(false)

// --- Filtros ---
const currentYear = String(new Date().getFullYear())
const searchQuery = ref('')
const yearFilter = ref(currentYear)
const monthFilter = ref('')
// El desplegable no pinta una opción de valor vacío: "todos" lleva su propio valor.
const ALL = 'all'
const originFilter = ref(ALL)
const filters = reactive<LedgerInvoiceFilters>({ payment: 'all', period: currentYear, origin: '', search: '', page: 1 })

const yearOptions = [
  { label: 'Todos los años', value: ALL },
  ...Array.from({ length: 6 }, (_, i) => {
    const year = String(Number(currentYear) - i)
    return { label: year, value: year }
  })
]

const paymentOptions: { label: string; value: InvoicePaymentFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Sin cobrar', value: 'open' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Cobro parcial', value: 'parcial' },
  { label: 'Por confirmar', value: 'por_confirmar' },
  { label: 'Vencidos', value: 'vencido' },
  { label: 'Cobrados', value: 'cobrado' },
  { label: 'Incobrables', value: 'incobrable' }
]

const ORIGIN_LABELS: Record<string, string> = {
  suscripcion: 'Suscripción',
  comision: 'Comisión',
  importado: 'Emitido en Nubefact',
  manual: 'Emitido a mano',
  otros: 'Otros'
}
const originOptions = [
  { label: 'Todos los orígenes', value: ALL },
  ...Object.entries(ORIGIN_LABELS).map(([value, label]) => ({ label, value }))
]

function originLabel(origin: string): string {
  return ORIGIN_LABELS[origin] ?? origin
}

const hasActiveFilters = computed(() =>
  !!searchQuery.value || filters.payment !== 'all' || originFilter.value !== ALL || !!monthFilter.value || yearFilter.value !== currentYear
)

function money(amount: number, currency: string): string {
  const value = amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency === 'USD' ? 'US$' : 'S/'} ${value}`
}

function documentLabel(row: LedgerInvoice): string {
  return row.document_type === 3 ? 'Nota de crédito' : row.document_type === 2 ? 'Boleta' : 'Factura'
}

// --- Tarjetas ---
const EMPTY: ReceivablesByCurrency = {
  invoices: 0, invoiced: 0, pending_count: 0, pending: 0, partial_count: 0, unconfirmed_count: 0, unconfirmed: 0,
  overdue_count: 0, overdue: 0, paid_count: 0, paid: 0
}

const cards = computed(() => {
  const pen = summary.value.by_currency.PEN ?? EMPTY
  const usd = summary.value.by_currency.USD ?? EMPTY
  return [
    {
      filter: 'pendiente' as const, label: 'Por cobrar', color: 'text-orange-600',
      amount: pen.pending, usd: usd.pending, count: pen.pending_count + usd.pending_count,
      hint: pen.partial_count + usd.partial_count > 0
        ? `Saldos sin cobrar · ${pen.partial_count + usd.partial_count} con cobro parcial`
        : 'Se sabe que no se han cobrado'
    },
    {
      filter: 'por_confirmar' as const, label: 'Por confirmar', color: 'text-gray-900',
      amount: pen.unconfirmed, usd: usd.unconfirmed, count: pen.unconfirmed_count + usd.unconfirmed_count,
      hint: 'Emitidos, sin dato de cobro'
    },
    {
      filter: 'vencido' as const, label: 'Vencido', color: 'text-red-600',
      amount: pen.overdue, usd: usd.overdue, count: pen.overdue_count + usd.overdue_count,
      hint: 'Pendientes, o a crédito con la fecha pasada'
    },
    {
      filter: 'cobrado' as const, label: 'Cobrado', color: 'text-green-600',
      amount: pen.paid, usd: usd.paid, count: pen.paid_count + usd.paid_count,
      hint: 'Comprobantes saldados más lo abonado de los parciales'
    }
  ]
})

// --- Estado de cobro de cada fila ---
function paymentBadge(row: LedgerInvoice): { label: string; class: string } {
  if (row.status === 2) return { label: 'Anulado', class: 'bg-gray-100 text-gray-500' }
  if (row.status === 3) return { label: 'No aceptado', class: 'bg-gray-100 text-gray-500' }
  if (row.document_type === 3) return { label: 'Nota de crédito', class: 'bg-gray-100 text-gray-500' }
  if (row.credited >= row.total && row.total > 0) return { label: 'Anulado con NC', class: 'bg-gray-100 text-gray-500' }

  switch (row.payment_status) {
    case 'cobrado':
      if (row.payment_source === 'supuesto') return { label: 'Cobrado (supuesto)', class: 'bg-green-50 text-green-600' }
      // Anotado (a mano o desde la hoja de ingresos) sin depósito del banco que lo respalde.
      if (unconfirmed(row) > 0.99) return { label: 'Cobrado · sin confirmar en banco', class: 'bg-amber-50 text-amber-700' }
      return { label: 'Cobrado', class: 'bg-green-100 text-green-700' }
    case 'pendiente':
      return row.is_overdue
        ? { label: 'Vencido', class: 'bg-red-100 text-red-700' }
        : { label: 'Pendiente', class: 'bg-orange-100 text-orange-700' }
    case 'parcial':
      return row.is_overdue
        ? { label: 'Cobro parcial · vencido', class: 'bg-red-100 text-red-700' }
        : { label: 'Cobro parcial', class: 'bg-orange-100 text-orange-700' }
    case 'por_confirmar':
      return row.is_overdue
        ? { label: 'Por confirmar · vencido', class: 'bg-red-50 text-red-700' }
        : { label: 'Por confirmar', class: 'bg-amber-50 text-amber-700' }
    case 'incobrable':
      return { label: 'Incobrable', class: 'bg-gray-200 text-gray-700' }
    case 'sin_cargo':
      return { label: 'Sin cargo', class: 'bg-gray-100 text-gray-600' }
    default:
      return { label: '-', class: 'text-gray-300' }
  }
}

/**
 * Lo cobrado que ningún movimiento del banco confirma todavía. Un "Cobrado"
 * sin abonos detallados (la renovación marcada como cobrada al renovar) no
 * tiene respaldo hasta que se concilia su depósito: cuenta entero.
 */
function unconfirmed(row: LedgerInvoice): number {
  if (row.payment_status !== 'cobrado' || row.payment_source === 'supuesto') return 0
  if (row.paid_amount == null) return Math.max(row.total - row.credited, 0)
  if (row.bank_confirmed == null) return 0
  return Math.max(row.paid_amount - row.bank_confirmed, 0)
}

function paymentDetail(row: LedgerInvoice): string {
  if (row.payment_status === 'cobrado' && unconfirmed(row) > 0.99) {
    if (row.paid_amount == null) {
      const how = [row.payment_date ? formatDate(row.payment_date) : '', row.payment_method ?? ''].filter(Boolean).join(' · ')
      return `anotado como cobrado${how ? ` (${how})` : ''}; falta conciliar el depósito en Bancos`
    }
    return `confirmado en banco ${money(row.bank_confirmed ?? 0, row.currency)} de ${money(row.paid_amount ?? 0, row.currency)}`
  }
  if (row.payment_status === 'cobrado') {
    const parts = [
      row.payment_date ? formatDate(row.payment_date) : '',
      row.payment_method ?? '',
      row.payment_reference ? `op. ${row.payment_reference}` : ''
    ].filter(Boolean)
    return parts.join(' · ')
  }
  if (row.payment_status === 'parcial') {
    return `abonado ${money(row.paid_amount ?? 0, row.currency)} · saldo ${money(row.balance, row.currency)}`
  }
  if (row.balance > 0 && row.days_since_issue !== null) {
    return `hace ${row.days_since_issue} ${row.days_since_issue === 1 ? 'día' : 'días'}`
  }
  return row.payment_note ?? ''
}

// --- Carga ---
// Cada carga lleva su número: una respuesta lenta no pisa a la más reciente.
let loadSeq = 0

async function load() {
  const seq = ++loadSeq
  loading.value = true
  error.value = null
  filters.period = monthFilter.value || (yearFilter.value === ALL ? '' : yearFilter.value)
  filters.origin = originFilter.value === ALL ? '' : originFilter.value
  try {
    const res = await getLedgerInvoices(filters)
    if (seq !== loadSeq) return
    invoices.value = res.data ?? []
    summary.value = res.summary
    meta.value = res.meta
    selected.value = []
  } catch (e) {
    if (seq === loadSeq) error.value = ledgerErrorMessage(e)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function reload() {
  filters.page = 1
  load()
}

function goToPage(page: number) {
  filters.page = page
  load()
}

function applySearch() {
  filters.search = searchQuery.value
  reload()
}

function onYearChange() {
  monthFilter.value = ''
  reload()
}

function setPayment(value: InvoicePaymentFilter) {
  filters.payment = filters.payment === value ? 'all' : value
  reload()
}

function searchCustomer(debtor: { customer_document: string; customer_name: string }) {
  searchQuery.value = debtor.customer_document || debtor.customer_name
  filters.search = searchQuery.value
  filters.payment = 'open'
  reload()
}

function clearFilters() {
  searchQuery.value = ''
  monthFilter.value = ''
  yearFilter.value = currentYear
  filters.search = ''
  originFilter.value = ALL
  filters.payment = 'all'
  reload()
}

const visiblePages = computed(() => {
  const pages: number[] = []
  for (let i = Math.max(1, meta.value.current_page - 2); i <= Math.min(meta.value.total_pages, meta.value.current_page + 2); i++) {
    pages.push(i)
  }
  return pages
})

const selectedTotal = computed(() => selected.value.reduce((sum, row) => sum + (row.currency === 'PEN' ? row.total : 0), 0))

// --- Registrar cobro ---
// Un comprobante: se cobra con abonos (uno o varios). Varios a la vez: solo
// cambio de estado, y "cobrado" salda el saldo de cada uno.
type PaymentAction = 'abono' | 'cobrado' | 'pendiente' | 'incobrable' | 'por_confirmar'

/** El BN no es un medio de pago del cliente, pero es adonde va la detracción. */
const INSTALLMENT_METHODS = [...PLAN_PAYMENT_METHODS, 'Detracción (Banco de la Nación)']

const paymentVisible = ref(false)
const saving = ref(false)
const paymentTargets = ref<LedgerInvoice[]>([])
const installments = ref<InvoiceInstallments | null>(null)
const loadingInstallments = ref(false)
const deletingId = ref<number | null>(null)
// Si algo cambió dentro del diálogo, la lista se recarga al cerrarlo.
let paymentsChanged = false

const paymentForm = reactive({
  action: 'abono' as PaymentAction,
  date: new Date() as Date | null,
  method: '',
  reference: '',
  amount: null as number | null,
  due_date: null as Date | null,
  note: ''
})

const single = computed(() => (paymentTargets.value.length === 1 ? paymentTargets.value[0] : null))
const remaining = computed(() => installments.value?.invoice.remaining ?? 0)

const actionOptions = computed(() => [
  single.value ? { label: 'Abono', value: 'abono' } : { label: 'Cobrado', value: 'cobrado' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Incobrable', value: 'incobrable' },
  { label: 'Por confirmar', value: 'por_confirmar' }
])

const targetsTotal = computed(() => paymentTargets.value.reduce((sum, row) => sum + (row.currency === 'PEN' ? row.total : 0), 0))
const targetsFromPlans = computed(() => paymentTargets.value.filter(row => row.plan_backed).length)

function resetPaymentForm() {
  paymentForm.date = new Date()
  paymentForm.reference = ''
  paymentForm.amount = remaining.value > 0 ? remaining.value : null
  paymentForm.due_date = null
  paymentForm.note = ''
}

async function openPayment(rows: LedgerInvoice[]) {
  // Anulados y notas de crédito no se cobran: se quedan fuera del lote.
  const targets = rows.filter(row => row.payment_status !== null)
  if (targets.length === 0) {
    toast.add({ severity: 'warn', summary: 'Nada que cobrar', detail: 'Lo seleccionado está anulado o es nota de crédito', life: 5000 })
    return
  }

  paymentTargets.value = targets
  installments.value = null
  paymentsChanged = false
  paymentForm.action = targets.length === 1 ? 'abono' : 'cobrado'
  paymentForm.method = ''
  resetPaymentForm()
  paymentVisible.value = true

  if (targets.length === 1) {
    loadingInstallments.value = true
    try {
      installments.value = await getInvoiceInstallments(targets[0].id)
      paymentForm.amount = remaining.value > 0 ? remaining.value : null
    } catch (e) {
      toast.add({ severity: 'error', summary: 'No se pudieron cargar los abonos', detail: ledgerErrorMessage(e), life: 6000 })
    } finally {
      loadingInstallments.value = false
    }
  }
}

function closePayment() {
  paymentVisible.value = false
}

// También al cerrar con la X o con Escape: si hubo cambios, la lista se recarga.
watch(paymentVisible, visible => {
  if (!visible && paymentsChanged) {
    paymentsChanged = false
    load()
  }
})

// Saldo de céntimos (menos de 1) que dejó un pago: abono "Redondeo", que el diario lleva a la 6599.
const roundingSaving = ref(false)
async function closeAsRounding() {
  if (!single.value) return
  roundingSaving.value = true
  try {
    const res = await addInvoiceInstallment(single.value.id, {
      date: toIsoDate(new Date()),
      method: 'Redondeo',
      amount: remaining.value,
      note: 'Saldo de céntimos dado por cerrado'
    })
    installments.value = res.data
    paymentsChanged = true
    resetPaymentForm()
    toast.add({ severity: 'success', summary: 'Saldo cerrado como redondeo', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cerrar', detail: ledgerErrorMessage(e), life: 6000 })
  } finally {
    roundingSaving.value = false
  }
}

async function removeInstallment(paymentId: number) {
  deletingId.value = paymentId
  try {
    const res = await deleteInvoiceInstallment(paymentId)
    installments.value = res.data
    paymentsChanged = true
    resetPaymentForm()
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo quitar', detail: ledgerErrorMessage(e), life: 6000 })
  } finally {
    deletingId.value = null
  }
}

function warn(summary: string, detail: string) {
  toast.add({ severity: 'warn', summary, detail, life: 5000 })
}

async function savePayment() {
  const action = paymentForm.action
  const note = paymentForm.note.trim() || undefined

  if ((action === 'abono' || action === 'cobrado') && (!paymentForm.date || !paymentForm.method.trim())) {
    return warn('Falta el cobro', 'Indica la fecha del abono y el medio de pago')
  }
  if (action === 'incobrable' && !note) {
    return warn('Falta la nota', 'Indica por qué se da por incobrable')
  }

  saving.value = true
  try {
    if (action === 'abono' && single.value) {
      if (!paymentForm.amount || paymentForm.amount <= 0) {
        return warn('Falta el monto', 'Indica cuánto se abonó')
      }
      const res = await addInvoiceInstallment(single.value.id, {
        date: toIsoDate(paymentForm.date!),
        method: paymentForm.method.trim(),
        amount: paymentForm.amount,
        reference: paymentForm.reference.trim() || undefined,
        note
      })
      installments.value = res.data
      paymentsChanged = true
      toast.add({ severity: 'success', summary: res.message, life: 4000 })

      // Con saldo, el diálogo queda abierto para el siguiente abono.
      if (res.data.invoice.remaining <= 0) closePayment()
      else resetPaymentForm()
      return
    }

    const payload: InvoicePaymentInput = {
      invoice_ids: paymentTargets.value.map(row => row.id),
      status: action === 'abono' ? 'cobrado' : action,
      note
    }
    if (action === 'cobrado') {
      payload.date = toIsoDate(paymentForm.date!)
      payload.method = paymentForm.method.trim()
      payload.reference = paymentForm.reference.trim() || undefined
    } else if (action === 'pendiente' && paymentForm.due_date) {
      payload.due_date = toIsoDate(paymentForm.due_date)
    }

    const res = await registerInvoicePayment(payload)
    const skipped = res.data.skipped.length
    toast.add({
      severity: skipped > 0 ? 'warn' : 'success',
      summary: res.message,
      detail: skipped > 0 ? `No se tocaron ${skipped}: ${res.data.skipped[0].reason}` : undefined,
      life: skipped > 0 ? 8000 : 4000
    })
    paymentsChanged = true
    closePayment()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: ledgerErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
