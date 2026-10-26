<template>
  <div class="space-y-6">
    <SectionTabs :tabs="ACCOUNTING_TABS" />

    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Bancos</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Los movimientos que descargas de cada banco. Conciliar uno es decir a qué corresponde: al hacerlo queda
          registrado el cobro del comprobante o el pago del gasto, con la fecha y la referencia del banco.
        </p>
      </div>
      <div v-if="authStore.canWriteFinance" class="flex gap-2">
        <Button
          v-if="accounts.length > 0"
          label="Conciliar automáticamente"
          icon="pi pi-bolt"
          severity="secondary"
          outlined
          :loading="autoRunning"
          v-tooltip.bottom="'Cobros de Culqi por su código, sus abonos al banco, y consumos de proveedores que se reconocen por la glosa'"
          @click="runAuto"
        />
        <Button label="Nueva cuenta" icon="pi pi-plus" severity="secondary" outlined @click="openAccount(null)" />
        <Button label="Importar movimientos" icon="pi pi-upload" @click="openImport" />
      </div>
    </div>

    <!-- Cuentas -->
    <div v-if="accounts.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <button
        v-for="account in accounts"
        :key="account.id"
        type="button"
        class="bg-white rounded-xl border p-5 text-left transition-colors hover:border-primary-300"
        :class="filters.account_id === account.id ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200'"
        @click="setAccount(account.id)"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">{{ account.name }}</span>
          <i
            v-if="authStore.canWriteFinance"
            class="pi pi-pencil text-xs text-gray-300 hover:text-gray-600"
            @click.stop="openAccount(account)"
          ></i>
        </div>
        <div class="text-xs text-gray-400 font-mono">{{ account.number || 'sin número' }}</div>
        <div v-if="account.cci" class="text-xs text-gray-400 font-mono">CCI {{ account.cci }}</div>
        <div class="text-2xl font-bold text-gray-900 mt-2">
          {{ account.balance !== null ? money(account.balance, account.currency) : '—' }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          <template v-if="account.balance_at">Saldo al {{ formatDate(account.balance_at) }}</template>
          <template v-else>El archivo de este banco no trae saldo</template>
        </div>
        <div class="text-xs mt-1" :class="account.pending > 0 ? 'text-orange-600' : 'text-green-600'">
          {{ account.pending > 0 ? `${account.pending} por conciliar` : 'Todo conciliado' }}
          <span class="text-gray-400">· {{ account.movements }} movimientos</span>
        </div>
      </button>
    </div>

    <!-- Sin cuentas: por dónde empezar -->
    <div v-else-if="!loading" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-building-columns text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Todavía no hay movimientos de banco</p>
      <p class="text-sm text-gray-400 mt-1 max-w-xl mx-auto">
        Descarga los movimientos en Excel desde la banca por internet y súbelos con "Importar movimientos". BBVA trae el
        número de cuenta y se crea sola; para BCP crea antes la cuenta con "Nueva cuenta".
      </p>
    </div>

    <template v-if="accounts.length > 0">
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[200px]">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Buscar en la descripción o la referencia..." class="w-full" @keyup.enter="applySearch" />
            </span>
          </div>
          <SelectButton v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" :allowEmpty="false" @change="reload" />
          <Dropdown v-model="directionFilter" :options="directionOptions" optionLabel="label" optionValue="value" class="w-40" @change="reload" />
          <InputText v-model="monthFilter" type="month" class="w-44" v-tooltip.top="'Un mes en particular'" @change="reload" />
        </div>
        <p class="text-xs text-gray-400 mt-3">
          {{ formatNumber(summary.movements) }} movimientos · entró {{ plain(summary.inflow) }} · salió {{ plain(-summary.outflow) }}
          <template v-if="summary.itf !== 0"> · ITF y comisiones {{ plain(-summary.itf) }}</template>
          <template v-if="!filters.account_id && mixedCurrencies"> (suma soles y dólares: filtra una cuenta para ver importes reales)</template>
        </p>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-medium">{{ error }}</p>
        <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
      </div>

      <div v-else-if="!loading && movements.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <i class="pi pi-check-circle text-4xl text-gray-300 mb-3"></i>
        <p class="text-gray-500 font-medium">Nada con estos filtros</p>
        <p v-if="filters.status === 'pending'" class="text-sm text-gray-400 mt-1">No queda ningún movimiento por conciliar.</p>
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <!-- Varios que no son ingreso ni gasto: los ITF, las comisiones -->
        <div v-if="selected.length > 0" class="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          <span class="text-sm font-medium text-gray-700">{{ selected.length }} seleccionado{{ selected.length === 1 ? '' : 's' }}</span>
          <Dropdown v-model="bulkLabel" :options="otherOptions" optionLabel="label" optionValue="value" placeholder="No es ingreso ni gasto: es…" class="w-80" />
          <Button label="Marcar" icon="pi pi-check" :loading="saving" :disabled="!bulkLabel" @click="submitBulk" />
          <Button label="Quitar selección" text severity="secondary" @click="selected = []" />
        </div>

        <DataTable v-model:selection="selected" :value="movements" :loading="loading" dataKey="id" stripedRows class="p-datatable-sm">
          <Column v-if="authStore.canWriteFinance" selectionMode="multiple" style="width: 3rem" />

          <Column header="Fecha" style="width: 120px">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-600">{{ formatDate(row.op_date) }}</span>
              <div v-if="!filters.account_id" class="text-xs text-gray-400">{{ row.account_name }}</div>
            </template>
          </Column>

          <Column header="Movimiento" style="min-width: 280px">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-800">{{ row.description }}</span>
              <div v-if="row.reference" class="text-xs text-gray-400 font-mono">op. {{ row.reference }}</div>
            </template>
          </Column>

          <Column header="Importe" style="min-width: 130px">
            <template #body="{ data: row }">
              <span class="text-sm font-semibold block text-right tabular-nums" :class="row.amount >= 0 ? 'text-green-700' : 'text-gray-800'">
                {{ row.amount >= 0 ? '+' : '−' }} {{ money(Math.abs(row.amount), row.currency) }}
              </span>
              <span v-if="row.itf !== 0" class="text-xs text-gray-400 block text-right">
                {{ row.bank === 'Culqi' ? 'comisión' : 'ITF' }} {{ plain(Math.abs(row.itf)) }}
              </span>
            </template>
          </Column>

          <Column header="A qué corresponde" style="min-width: 280px">
            <template #body="{ data: row }">
              <template v-if="row.links.length > 0">
                <div v-for="link in row.links" :key="link.id" class="text-sm text-gray-700">
                  {{ link.text }}
                  <span v-if="row.links.length > 1" class="text-xs text-gray-400">· {{ money(link.amount, row.currency) }}</span>
                </div>
                <div v-if="row.remaining > 0" class="text-xs text-orange-600">falta conciliar {{ money(row.remaining, row.currency) }}</div>
              </template>
              <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                Por conciliar
              </span>
            </template>
          </Column>

          <Column header="" style="width: 130px">
            <template #body="{ data: row }">
              <Button
                v-if="authStore.canWrite('reconcile') || row.links.length > 0"
                :label="row.remaining > 0 ? 'Conciliar' : 'Ver'"
                :icon="row.remaining > 0 ? 'pi pi-link' : 'pi pi-eye'"
                size="small"
                :outlined="row.remaining > 0"
                :text="row.remaining === 0"
                @click="openReconcile(row)"
              />
            </template>
          </Column>
        </DataTable>

        <div v-if="meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span class="text-sm text-gray-500">Página {{ meta.current_page }} de {{ meta.total_pages }}</span>
          <div class="flex gap-1">
            <Button icon="pi pi-chevron-left" text rounded size="small" :disabled="meta.current_page <= 1" @click="goToPage(meta.current_page - 1)" />
            <Button icon="pi pi-chevron-right" text rounded size="small" :disabled="meta.current_page >= meta.total_pages" @click="goToPage(meta.current_page + 1)" />
          </div>
        </div>
      </div>
    </template>

    <!-- Conciliar -->
    <Dialog :draggable="false" v-model:visible="reconcileVisible" modal header="A qué corresponde este movimiento" :style="{ width: '44rem' }">
      <div v-if="current" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-gray-800 font-medium">{{ current.description }}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ current.account_name }} · {{ formatDate(current.op_date) }}
                <template v-if="current.reference"> · op. {{ current.reference }}</template>
              </div>
            </div>
            <div class="text-right whitespace-nowrap">
              <div class="text-lg font-bold tabular-nums" :class="current.amount >= 0 ? 'text-green-700' : 'text-gray-900'">
                {{ current.amount >= 0 ? '+' : '−' }} {{ money(Math.abs(current.amount), current.currency) }}
              </div>
              <div v-if="current.remaining > 0 && current.links.length > 0" class="text-xs text-orange-600">
                falta {{ money(current.remaining, current.currency) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Lo ya conciliado -->
        <table v-if="current.links.length > 0" class="w-full text-sm">
          <tbody>
            <tr v-for="link in current.links" :key="link.id" class="border-t border-gray-100 first:border-0">
              <td class="py-1.5 text-gray-700">
                {{ link.text }}
                <div v-if="link.note" class="text-xs text-gray-400">{{ link.note }}</div>
              </td>
              <td class="py-1.5 text-right tabular-nums text-gray-800 whitespace-nowrap">{{ money(link.amount, current.currency) }}</td>
              <td class="py-1.5 text-right w-8">
                <Button
                  v-if="authStore.canWriteFinance || (authStore.canWrite('reconcile') && link.kind === 'cobro')"
                  icon="pi pi-undo"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  :loading="undoingId === link.id"
                  v-tooltip.top="link.kind === 'otro' ? 'Deshacer' : 'Deshacer: también quita el cobro o pago que se registró'"
                  @click="undo(link.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <template v-if="current.remaining > 0 && authStore.canWrite('reconcile')">
          <SelectButton v-model="mode" :options="modeOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />

          <!-- Cobro de un comprobante -->
          <template v-if="mode === 'cobro'">
            <p v-if="loadingSuggestions" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Buscando comprobantes…</p>
            <template v-else>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText v-model="invoiceSearch" placeholder="Buscar otro comprobante por número, RUC o cliente" class="w-full" @keyup.enter="searchInvoices" />
              </span>
              <p v-if="invoiceOptions.length === 0" class="text-sm text-gray-500">
                No encontré un comprobante sin cobrar que calce. Búscalo arriba, o marca el movimiento como "No es un cobro".
              </p>
              <div v-else class="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                <label
                  v-for="invoice in invoiceOptions"
                  :key="invoice.id"
                  class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  :class="{ 'bg-primary-50': pickedInvoice === invoice.id }"
                >
                  <RadioButton v-model="pickedInvoice" :value="invoice.id" @change="onPickInvoice(invoice)" />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-gray-800">
                      <span class="font-medium">{{ invoice.number }}</span> · {{ invoice.customer_name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ formatDate(invoice.issue_date) }}
                      <span v-if="invoice.number_match" class="text-green-700"> · el número está en la glosa</span>
                      <span v-else-if="invoice.name_match" class="text-green-700"> · el nombre está en la glosa</span>
                      <span v-if="invoice.same_amount" class="text-green-700"> · mismo importe</span>
                      <span v-else-if="invoice.net_of_detraction" class="text-amber-700"> · calza con el neto de detracción</span>
                      <span v-if="invoice.document_match" class="text-green-700"> · mismo RUC</span>
                      <span v-if="invoice.detraction_match && !invoice.usd_detraction" class="text-green-700"> · el importe es su detracción</span>
                      <span v-if="invoice.confirms_payment" class="text-green-700">
                        · confirma el cobro anotado el {{ formatDate(invoice.confirms_payment.paid_at) }}{{ invoice.confirms_payment.method ? ` (${invoice.confirms_payment.method})` : '' }}
                      </span>
                    </div>
                    <div v-if="invoice.foreign_detraction && !invoice.usd_detraction" class="text-xs text-gray-700">
                      Factura en dólares: el depósito se aplica como su detracción, al tipo de cambio implícito.
                    </div>
                    <div v-if="invoice.usd_detraction" class="text-xs">
                      <span class="text-gray-700">
                        Detracción de factura en dólares: se abonan {{ money(invoice.usd_detraction.usd, 'USD') }}
                        (TC {{ invoice.usd_detraction.implied_rate.toFixed(3) }}; la factura, a {{ invoice.usd_detraction.invoice_rate.toFixed(3) }})
                      </span>
                      <span v-if="invoice.usd_detraction.rate_match" class="text-green-700"> · calza con el TC oficial de su fecha</span>
                    </div>
                  </div>
                  <div class="text-sm tabular-nums text-gray-800 whitespace-nowrap">{{ money(invoice.open_amount, invoice.currency) }}</div>
                </label>
              </div>

              <!-- Un depósito que cubre varias facturas del mismo cliente -->
              <div v-if="pickedCustomer && !customerOpen">
                <Button
                  :label="`Repartir entre lo pendiente de ${pickedCustomer.name}`"
                  icon="pi pi-sitemap"
                  text
                  size="small"
                  :loading="loadingCustomer"
                  @click="loadCustomer"
                />
              </div>
              <div v-if="customerOpen" class="border border-primary/30 bg-primary/5 rounded-lg p-3 space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <div class="text-sm font-medium text-gray-800">Pendiente de {{ customerOpen.customer_name }}</div>
                  <Button label="Volver a una sola" text size="small" severity="secondary" @click="customerOpen = null" />
                </div>
                <p class="text-xs text-gray-500">
                  El depósito se aplica de la factura más antigua a la más nueva. Desmarca las que ya se cobraron por otro
                  lado o las que este pago no cubre.
                </p>
                <div class="max-h-64 overflow-y-auto bg-white border border-gray-100 rounded-lg divide-y divide-gray-100">
                  <label v-for="invoice in customerOpen.invoices" :key="invoice.id" class="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Checkbox v-model="customerChosen" :value="invoice.id" />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-gray-800">
                        <span class="font-medium">{{ invoice.number }}</span>
                        <span class="text-xs text-gray-500"> · {{ formatDate(invoice.issue_date) }}</span>
                        <span v-if="invoice.unconfirmed" class="text-xs text-amber-600"> · sin confirmar</span>
                      </div>
                      <div class="text-xs text-gray-500">saldo {{ money(invoice.open_amount, current.currency) }}</div>
                    </div>
                    <div class="text-right whitespace-nowrap">
                      <div v-if="customerPlan[invoice.id]" class="text-sm tabular-nums font-medium text-gray-900">
                        {{ money(customerPlan[invoice.id] ?? 0, current.currency) }}
                      </div>
                      <div v-else class="text-sm text-gray-300">-</div>
                      <div v-if="customerPlan[invoice.id] && (customerPlan[invoice.id] ?? 0) < invoice.open_amount" class="text-xs text-amber-600">
                        quedan {{ money(invoice.open_amount - (customerPlan[invoice.id] ?? 0), current.currency) }}
                      </div>
                    </div>
                  </label>
                </div>
                <div class="flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-gray-600">
                  <span>Se aplican <strong>{{ money(customerSummary.applied, current.currency) }}</strong> a {{ customerSummary.count }} comprobantes</span>
                  <span v-if="customerSummary.unapplied > 0" class="text-amber-700">
                    Sobran {{ money(customerSummary.unapplied, current.currency) }} del depósito
                  </span>
                  <span v-if="customerSummary.debt > 0">El cliente queda debiendo {{ money(customerSummary.debt, current.currency) }}</span>
                </div>
              </div>
            </template>
          </template>

          <!-- Pago de uno o varios gastos ya registrados -->
          <template v-else-if="mode === 'pago'">
            <div class="flex gap-2">
              <InputText
                v-model="expenseSearch"
                placeholder="Buscar gasto por proveedor, descripción o número"
                class="flex-1"
                @keydown.enter.prevent="searchExpenses"
              />
              <Button icon="pi pi-search" outlined :loading="loadingSuggestions" @click="searchExpenses" />
            </div>
            <p v-if="loadingSuggestions" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Buscando gastos…</p>
            <template v-else>
              <p v-if="expenseRows.length === 0" class="text-sm text-gray-500">
                No hay un gasto por pagar que calce por importe o por nombre. Búscalo arriba o, si no está registrado, usa "Gasto nuevo".
              </p>
              <div v-else class="max-h-72 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                <div
                  v-for="expense in expenseRows"
                  :key="expense.id"
                  class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  :class="{ 'bg-primary-50': expensePlan[expense.id] !== undefined }"
                >
                  <Checkbox :modelValue="expensePlan[expense.id] !== undefined" binary @update:modelValue="toggleExpense(expense, $event)" />
                  <div class="flex-1 min-w-0 cursor-pointer" @click="toggleExpense(expense, expensePlan[expense.id] === undefined)">
                    <div class="text-sm text-gray-800">
                      <span class="font-medium">{{ expense.payee_name }}</span> · {{ expense.category_name }}
                    </div>
                    <div class="text-xs text-gray-500 truncate">
                      {{ formatDate(expense.issue_date) }} · {{ expense.document_number || formatMonthYear(expense.period) }}
                      <span v-if="expense.description"> · {{ expense.description }}</span>
                      <span v-if="expense.same_amount" class="text-green-700"> · mismo importe</span>
                      <span v-if="expense.name_match" class="text-green-700"> · el nombre está en la glosa</span>
                    </div>
                  </div>
                  <div class="text-right whitespace-nowrap">
                    <InputNumber
                      v-if="expensePlan[expense.id] !== undefined"
                      v-model="expensePlan[expense.id]"
                      :minFractionDigits="2"
                      :maxFractionDigits="2"
                      :min="0"
                      :max="expense.open_amount"
                      inputClass="w-28 text-right text-sm"
                    />
                    <div class="text-xs tabular-nums text-gray-500">saldo {{ money(expense.open_amount, expense.currency) }}</div>
                  </div>
                </div>
              </div>
              <div v-if="expenseSummary.count > 0" class="flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-gray-600">
                <span>Se aplican <strong>{{ money(expenseSummary.applied, current.currency) }}</strong> a {{ expenseSummary.count }} {{ expenseSummary.count === 1 ? 'gasto' : 'gastos' }}</span>
                <span v-if="expenseSummary.left > 0.004" class="text-amber-700">
                  Faltan {{ money(expenseSummary.left, current.currency) }} del movimiento (queda abierto para otra parte)
                </span>
                <span v-else-if="expenseSummary.left < -0.004" class="text-red-600">
                  Te pasas por {{ money(-expenseSummary.left, current.currency) }}
                </span>
                <span v-else class="text-green-700">Cuadra con el movimiento</span>
              </div>
            </template>
          </template>

          <!-- Gasto que no estaba registrado -->
          <template v-else-if="mode === 'gasto'">
            <p class="text-xs text-gray-500">
              Crea el gasto por {{ money(current.remaining, current.currency) }} con la fecha del movimiento y lo deja pagado.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">A quién se pagó *</label>
                <Dropdown v-model="newExpense.payee_id" :options="payees" optionLabel="name" optionValue="id" filter placeholder="Proveedor o persona" class="w-full" @change="onPayee" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Categoría *</label>
                <Dropdown v-model="newExpense.category_id" :options="categoryOptions" optionLabel="label" optionValue="value" filter placeholder="En qué se gastó" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Corresponde al mes</label>
                <InputText v-model="newExpense.period" type="month" class="w-full" />
                <p class="text-xs text-gray-400 mt-1">Vacío: el mes del movimiento.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <InputText v-model="newExpense.description" maxlength="255" class="w-full" :placeholder="current.description" />
              </div>
            </div>
          </template>

          <!-- No es ingreso ni gasto -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Qué es *</label>
              <Dropdown v-model="other.label" :options="otherOptions" optionLabel="label" optionValue="value" placeholder="Elige" class="w-full" />
            </div>
            <div v-if="other.label === 'transferencia'" class="rounded-lg border border-gray-200 p-3 space-y-2">
              <div class="text-sm font-medium text-gray-700">El otro lado, en la otra cuenta</div>
              <div v-if="transferLoading" class="text-sm text-gray-400">Buscando…</div>
              <template v-else>
                <label v-for="c in transferCandidates" :key="c.id" class="flex items-start gap-2 text-sm cursor-pointer">
                  <RadioButton v-model="other.counterpart" :value="c.id" class="mt-0.5" />
                  <span>
                    <span class="font-medium text-gray-800">{{ c.account_name }}</span>
                    · {{ formatDate(c.op_date) }} · {{ c.description }}
                    · <span class="tabular-nums">{{ money(Math.abs(c.amount), c.currency ?? current?.currency ?? 'PEN') }}</span>
                    <span v-if="c.fee > 0" class="text-xs text-gray-500"> (comisión del banco {{ money(c.fee, current?.currency ?? 'PEN') }})</span>
                    <span v-if="c.fx" class="text-xs text-gray-500">
                      (cambio de moneda: TC {{ c.fx.rate.toFixed(4) }}; oficial {{ c.fx.official.toFixed(3) }}, la diferencia va a diferencia de cambio)
                    </span>
                  </span>
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer text-gray-600">
                  <RadioButton v-model="other.counterpart" :value="null" />
                  Marcar solo este lado (el otro no está importado)
                </label>
                <p class="text-xs text-gray-500">
                  Se concilian los dos movimientos; si el que sale es mayor, la diferencia queda como comisión del banco
                  (llega facturada por el SIRE). Deshacer un lado deshace los dos.
                </p>
              </template>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Nota</label>
              <InputText v-model="other.note" maxlength="255" class="w-full" placeholder="Opcional" />
            </div>
          </template>

          <!-- Importe de esta parte: solo cuando se cruza con un comprobante o un gasto -->
          <div v-if="mode === 'cobro' && !customerOpen && !pickedUsdDetraction" class="flex items-end gap-3">
            <div class="w-48">
              <label class="block text-sm font-medium text-gray-600 mb-1">Importe a aplicar</label>
              <InputNumber v-model="partAmount" :minFractionDigits="2" :maxFractionDigits="2" :min="0" class="w-full" />
            </div>
            <p class="text-xs text-gray-500 pb-2">
              Si el movimiento cubre varios comprobantes, aplica una parte a cada uno: el diálogo queda abierto mientras
              falte conciliar.
            </p>
          </div>
        </template>
      </div>
      <template #footer>
        <Button label="Cerrar" text severity="secondary" @click="reconcileVisible = false" />
        <Button
          v-if="current && current.remaining > 0 && authStore.canWrite('reconcile')"
          :label="mode === 'cobro' && customerOpen ? 'Aplicar el reparto' : 'Conciliar'"
          icon="pi pi-check"
          :loading="saving"
          @click="submitReconcile"
        />
      </template>
    </Dialog>

    <!-- Importar -->
    <Dialog :draggable="false" v-model:visible="importVisible" modal header="Importar movimientos del banco" :style="{ width: '36rem' }">
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Sube el archivo tal como se descarga: el Excel de movimientos de BBVA o de BCP, el CSV de movimientos de
          Culqi, o el PDF del estado de cuenta de la tarjeta de crédito BBVA. Primero ves qué entraría; lo que ya se
          importó no se repite.
        </p>
        <input type="file" accept=".xls,.xlsx,.csv,.pdf,.md" class="block w-full text-sm text-gray-600" @change="onFile" />

        <div v-if="isPdf">
          <label class="block text-sm font-medium text-gray-600 mb-1">Clave del PDF</label>
          <div class="flex gap-2">
            <InputText v-model="pdfPassword" type="password" autocomplete="off" class="flex-1" placeholder="La que pide el banco para abrirlo" @keyup.enter="refreshPreview" />
            <Button label="Leer" severity="secondary" outlined :loading="importLoading" @click="refreshPreview" />
          </div>
          <p class="text-xs text-gray-500 mt-1">Solo se usa para leer este archivo; no se guarda.</p>
        </div>

        <p v-if="importLoading" class="text-sm text-gray-400"><i class="pi pi-spin pi-spinner mr-2"></i>Leyendo el archivo…</p>

        <div v-if="preview?.needs_account">
          <label class="block text-sm font-medium text-gray-600 mb-1">¿De qué cuenta es? *</label>
          <Dropdown
            v-model="importAccountId"
            :options="accountsFor(preview.currency)"
            optionLabel="name"
            optionValue="id"
            placeholder="Elige la cuenta"
            class="w-full"
            @change="refreshPreview"
          />
          <p class="text-xs text-gray-500 mt-1">
            El archivo de {{ preview.bank }} no dice de qué cuenta es. Si no está en la lista, créala antes con "Nueva cuenta".
          </p>
        </div>

        <div v-if="preview" class="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500">Cuenta</span>
            <span class="text-gray-800">
              {{ preview.account_name ?? (preview.will_create_account ? `${preview.bank} ${preview.account_number} (se crea)` : 'por elegir') }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Período</span>
            <span class="text-gray-800">{{ preview.from ? formatDate(preview.from) : '-' }} al {{ preview.to ? formatDate(preview.to) : '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Movimientos nuevos</span>
            <span class="font-semibold text-gray-900 tabular-nums">{{ preview.created }} de {{ preview.read }}</span>
          </div>
          <p v-for="w in preview.warnings ?? []" :key="w" class="text-xs text-amber-700">{{ w }}</p>
          <div v-if="preview.duplicates > 0" class="flex justify-between">
            <span class="text-gray-500">Ya importados (se saltan)</span>
            <span class="tabular-nums text-gray-800">{{ preview.duplicates }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Entra / sale</span>
            <span class="tabular-nums text-gray-800">
              {{ money(preview.inflow, preview.currency) }} / {{ money(-preview.outflow, preview.currency) }}
            </span>
          </div>
          <div v-if="preview.balance !== null" class="flex justify-between">
            <span class="text-gray-500">Saldo que informa el banco</span>
            <span class="tabular-nums text-gray-800">{{ money(preview.balance, preview.currency) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="importVisible = false" />
        <Button
          label="Importar"
          icon="pi pi-check"
          :loading="saving"
          :disabled="!preview || preview.created === 0 || (preview.needs_account && !importAccountId)"
          @click="submitImport"
        />
      </template>
    </Dialog>

    <!-- Cuenta -->
    <Dialog :draggable="false" v-model:visible="accountVisible" modal :header="editingAccount ? 'Editar cuenta' : 'Nueva cuenta'" :style="{ width: '28rem' }">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Banco *</label>
            <Dropdown v-model="accountForm.bank" :options="BANKS" editable placeholder="BCP, BBVA…" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Moneda</label>
            <SelectButton v-model="accountForm.currency" :options="currencyOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
          <InputText v-model="accountForm.name" maxlength="80" placeholder="BCP soles" class="w-full" />
          <p class="text-xs text-gray-400 mt-1">Es lo que queda como "medio" en cada cobro o pago que se concilie con esta cuenta.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Número de cuenta</label>
          <InputText v-model="accountForm.number" maxlength="40" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">CCI</label>
          <InputText v-model="accountForm.cci" maxlength="40" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="accountVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="submitAccount" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { ACCOUNTING_TABS } from '@/config/sections.config'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import {
  getBankAccounts, saveBankAccount, importBankFile, getBankMovements, getBankSuggestions, reconcileBankMovement,
  markBankMovements, unlinkBankMovement, autoReconcileBanks, getExpenseCategories, getPayees, accountingErrorMessage,
  searchBankExpenses,
  getCustomerOpenInvoices, getTransferCandidates, type TransferCandidate
} from '@/api/accounting.api'
import { getLedgerInvoices } from '@/api/ledger.api'
import type {
  BankAccount, BankImportResult, BankMovement, BankMovementFilters, BankMovementSummary, ExpenseCategory,
  CustomerOpenInvoices, ExpenseSuggestion, InvoiceSuggestion, Payee, ReconcileInput
} from '@/types/accounting.types'

const toast = useToast()
const authStore = useAuthStore()
const { formatDate, formatNumber, formatMonthYear } = useFormatters()

const BANKS = ['BBVA', 'BCP', 'Interbank', 'Scotiabank', 'Banco de la Nación', 'Culqi', 'Mercado Pago']
const currencyOptions = [
  { label: 'S/', value: 'PEN' },
  { label: 'US$', value: 'USD' }
]

const accounts = ref<BankAccount[]>([])
const otherLabels = ref<Record<string, string>>({})
const movements = ref<BankMovement[]>([])
const summary = ref<BankMovementSummary>({ movements: 0, pending: 0, inflow: 0, outflow: 0, itf: 0 })
const meta = ref({ current_page: 1, per_page: 50, total: 0, total_pages: 1 })
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const selected = ref<BankMovement[]>([])

function plain(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function money(amount: number, currency = 'PEN'): string {
  return `${currency === 'USD' ? 'US$' : 'S/'} ${plain(amount)}`
}

const mixedCurrencies = computed(() => new Set(accounts.value.map(a => a.currency)).size > 1)
const otherOptions = computed(() => Object.entries(otherLabels.value).map(([value, label]) => ({ label, value })))

// --- Filtros ---
const searchQuery = ref('')
const monthFilter = ref('')
const directionFilter = ref('all')
const filters = reactive<BankMovementFilters>({ account_id: null, period: '', status: 'pending', direction: '', search: '', page: 1 })

const statusOptions = [
  { label: 'Por conciliar', value: 'pending' },
  { label: 'Conciliados', value: 'done' },
  { label: 'Todos', value: 'all' }
]
const directionOptions = [
  { label: 'Entra y sale', value: 'all' },
  { label: 'Solo ingresos', value: 'in' },
  { label: 'Solo salidas', value: 'out' }
]

// Cada carga lleva su número: una respuesta lenta no pisa a la más reciente.
let loadSeq = 0

async function load() {
  const seq = ++loadSeq
  loading.value = true
  error.value = null
  filters.period = monthFilter.value
  filters.direction = directionFilter.value === 'all' ? '' : (directionFilter.value as 'in' | 'out')
  try {
    const res = await getBankMovements(filters)
    if (seq !== loadSeq) return
    movements.value = res.data ?? []
    summary.value = res.summary
    meta.value = res.meta
    selected.value = []
  } catch (e) {
    if (seq === loadSeq) error.value = accountingErrorMessage(e)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

async function loadAccounts() {
  try {
    const res = await getBankAccounts()
    accounts.value = res.data
    otherLabels.value = res.meta.other_labels
  } catch (e) {
    error.value = accountingErrorMessage(e)
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

function setAccount(id: number) {
  filters.account_id = filters.account_id === id ? null : id
  reload()
}

async function refreshAll() {
  await Promise.all([loadAccounts(), load()])
}

// --- Conciliación automática ---
const autoRunning = ref(false)

async function runAuto() {
  autoRunning.value = true
  try {
    const res = await autoReconcileBanks()
    toast.add({
      severity: res.data.charges + res.data.transfers + res.data.expenses > 0 ? 'success' : 'info',
      summary: res.message,
      detail: res.data.charges_skipped + res.data.expenses_ambiguous > 0
        ? `Para revisar a mano: ${res.data.charges_skipped} cobros de Culqi (sin venta de plan con ese código, o con importe distinto) y ${res.data.expenses_ambiguous} consumos (calzan con más de un proveedor o les falta categoría)`
        : undefined,
      life: 9000
    })
    refreshAll()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo conciliar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    autoRunning.value = false
  }
}

// --- Varios a la vez ---
const bulkLabel = ref<string | null>(null)

async function submitBulk() {
  if (!bulkLabel.value) return
  saving.value = true
  try {
    const res = await markBankMovements(selected.value.map(m => m.id), bulkLabel.value)
    toast.add({ severity: 'success', summary: res.message, life: 3000 })
    bulkLabel.value = null
    refreshAll()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo marcar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

// --- Conciliar ---
type Mode = 'cobro' | 'pago' | 'gasto' | 'otro'

const reconcileVisible = ref(false)
const current = ref<BankMovement | null>(null)
const mode = ref<Mode>('cobro')
const loadingSuggestions = ref(false)
const invoiceOptions = ref<InvoiceSuggestion[]>([])
const expenseOptions = ref<ExpenseSuggestion[]>([])
const pickedInvoice = ref<number | null>(null)
// Gasto → importe que se le aplica. Varios gastos pueden salir de un solo pago.
const expensePlan = ref<Record<number, number>>({})
const pickedExpenseRows = ref<Record<number, ExpenseSuggestion>>({})
const expenseSearch = ref('')
// Los marcados se quedan visibles aunque una búsqueda nueva no los traiga.
const expenseRows = computed(() => {
  const shown = new Set(expenseOptions.value.map(e => e.id))
  const kept = Object.values(pickedExpenseRows.value).filter(e => !shown.has(e.id))
  return [...kept, ...expenseOptions.value]
})
const expenseSummary = computed(() => {
  const amounts = Object.values(expensePlan.value).map(v => Number(v) || 0)
  const applied = Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100
  return { count: amounts.length, applied, left: Math.round(((current.value?.remaining ?? 0) - applied) * 100) / 100 }
})
function toggleExpense(expense: ExpenseSuggestion, on: boolean) {
  const plan = { ...expensePlan.value }
  const rows = { ...pickedExpenseRows.value }
  if (on) {
    const left = (current.value?.remaining ?? 0) - Object.values(plan).reduce((a, b) => a + (Number(b) || 0), 0)
    plan[expense.id] = Math.round(Math.max(Math.min(expense.open_amount, left), 0) * 100) / 100 || expense.open_amount
    rows[expense.id] = expense
  } else {
    delete plan[expense.id]
    delete rows[expense.id]
  }
  expensePlan.value = plan
  pickedExpenseRows.value = rows
}
const partAmount = ref<number | null>(null)
// Depósito en soles que paga la detracción de una factura en dólares: va completo, sin importe.
const pickedUsdDetraction = computed(() => invoiceOptions.value.find(i => i.id === pickedInvoice.value)?.usd_detraction ?? null)
const invoiceSearch = ref('')
const undoingId = ref<number | null>(null)
const payees = ref<Payee[]>([])
const categories = ref<ExpenseCategory[]>([])
const newExpense = reactive({ payee_id: null as number | null, category_id: null as number | null, period: '', description: '' })
const other = reactive({ label: null as string | null, note: '', counterpart: null as number | null })

// Transferencia entre cuentas propias: el otro lado, para conciliar los dos a la vez.
const transferCandidates = ref<TransferCandidate[]>([])
const transferLoading = ref(false)
watch(() => other.label, async (label) => {
  transferCandidates.value = []
  other.counterpart = null
  if (label !== 'transferencia' || !current.value) return
  transferLoading.value = true
  try {
    transferCandidates.value = await getTransferCandidates(current.value.id)
    if (transferCandidates.value.length === 1) other.counterpart = transferCandidates.value[0].id
  } catch {
    transferCandidates.value = []
  } finally {
    transferLoading.value = false
  }
})
let changed = false

// Quien solo concilia (ventas) cruza ingresos con comprobantes; lo demás es de contabilidad.
const modeOptions = computed(() =>
  current.value && current.value.amount >= 0
    ? [
        { label: 'Cobro de un comprobante', value: 'cobro' },
        ...(authStore.canWriteFinance ? [{ label: 'No es un cobro', value: 'otro' }] : [])
      ]
    : [
        { label: 'Pago de un gasto', value: 'pago' },
        { label: 'Gasto nuevo', value: 'gasto' },
        { label: 'No es un gasto', value: 'otro' }
      ]
)

const categoryOptions = computed(() =>
  categories.value.filter(c => c.is_active).map(c => ({ label: `${c.group_name} · ${c.name}`, value: c.id }))
)

// --- Reparto entre lo pendiente de un cliente ---
const customerOpen = ref<CustomerOpenInvoices | null>(null)
const customerChosen = ref<number[]>([])
const loadingCustomer = ref(false)

const pickedCustomer = computed(() => {
  const invoice = invoiceOptions.value.find(i => i.id === pickedInvoice.value)
  return invoice?.customer_document ? { document: invoice.customer_document, name: invoice.customer_name } : null
})

/** Lo mismo que hará el servidor: de la más antigua a la más nueva, en céntimos. */
const customerPlan = computed<Record<number, number>>(() => {
  const plan: Record<number, number> = {}
  let cents = Math.round((current.value?.remaining ?? 0) * 100)
  for (const invoice of customerOpen.value?.invoices ?? []) {
    if (cents <= 0) break
    if (!customerChosen.value.includes(invoice.id)) continue
    const apply = Math.min(cents, Math.round(invoice.open_amount * 100))
    if (apply <= 0) continue
    plan[invoice.id] = apply / 100
    cents -= apply
  }
  return plan
})

const customerSummary = computed(() => {
  const applied = Object.values(customerPlan.value).reduce((sum, amount) => sum + amount, 0)
  const open = (customerOpen.value?.invoices ?? []).reduce((sum, invoice) => sum + invoice.open_amount, 0)
  return {
    applied,
    count: Object.keys(customerPlan.value).length,
    unapplied: Math.max(0, Math.round(((current.value?.remaining ?? 0) - applied) * 100) / 100),
    debt: Math.max(0, Math.round((open - applied) * 100) / 100)
  }
})

async function loadCustomer() {
  if (!current.value || !pickedCustomer.value) return
  loadingCustomer.value = true
  try {
    const open = await getCustomerOpenInvoices(current.value.id, pickedCustomer.value.document)
    customerOpen.value = open
    // Lo sin confirmar no entra solo: puede que ya esté cobrado. Lo pendiente o cobrado en parte, sí.
    const sure = open.invoices.filter(invoice => !invoice.unconfirmed).map(invoice => invoice.id)
    customerChosen.value = sure.length > 0 ? sure : (pickedInvoice.value ? [pickedInvoice.value] : [])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cargar lo pendiente del cliente', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loadingCustomer.value = false
  }
}

function resetChoice() {
  customerOpen.value = null
  customerChosen.value = []
  pickedInvoice.value = null
  expensePlan.value = {}
  pickedExpenseRows.value = {}
  expenseSearch.value = ''
  partAmount.value = current.value?.remaining ?? null
  newExpense.payee_id = null
  newExpense.category_id = null
  newExpense.period = ''
  newExpense.description = ''
  other.label = null
  other.note = ''
  other.counterpart = null
}

async function loadSuggestions() {
  if (!current.value || current.value.remaining <= 0) return
  loadingSuggestions.value = true
  try {
    const res = await getBankSuggestions(current.value.id)
    invoiceOptions.value = res.invoices
    expenseOptions.value = res.expenses
    // Una sola candidata segura se deja elegida: es un clic menos.
    const sure = res.invoices.filter(
      i => i.number_match || (i.name_match && (i.same_amount || i.net_of_detraction)) || (i.document_match && i.detraction_match)
    )
    if (sure.length === 1) {
      pickedInvoice.value = sure[0].id
      onPickInvoice(sure[0])
    }
    const sureExpense = res.expenses.filter(e => e.same_amount && e.name_match)
    if (sureExpense.length === 1) {
      toggleExpense(sureExpense[0], true)
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar las sugerencias', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loadingSuggestions.value = false
  }
}

async function openReconcile(row: BankMovement) {
  current.value = row
  mode.value = row.amount >= 0 ? 'cobro' : 'pago'
  invoiceOptions.value = []
  expenseOptions.value = []
  invoiceSearch.value = ''
  changed = false
  resetChoice()
  reconcileVisible.value = true
  loadSuggestions()

  if (row.amount < 0 && payees.value.length === 0) {
    try {
      const [people, cats] = await Promise.all([getPayees(), getExpenseCategories()])
      payees.value = people
      categories.value = cats
    } catch {
      // Sin listas, "Gasto nuevo" no se puede completar; los otros modos sí.
    }
  }
}

// El abono no puede superar ni lo que falta del movimiento ni el saldo del comprobante.
function onPickInvoice(invoice: InvoiceSuggestion) {
  partAmount.value = Math.min(current.value?.remaining ?? 0, invoice.open_amount)
}

// Buscar a mano gastos que las sugerencias no trajeron (p. ej. lo que se le reembolsa a alguien).
async function searchExpenses() {
  if (!current.value) return
  loadingSuggestions.value = true
  try {
    expenseOptions.value = await searchBankExpenses(current.value.id, expenseSearch.value.trim())
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo buscar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loadingSuggestions.value = false
  }
}

function onPayee() {
  const payee = payees.value.find(p => p.id === newExpense.payee_id)
  if (payee?.default_category_id) newExpense.category_id = payee.default_category_id
}

// Buscar a mano un comprobante que las sugerencias no trajeron.
async function searchInvoices() {
  if (!invoiceSearch.value.trim() || !current.value) return
  loadingSuggestions.value = true
  try {
    const res = await getLedgerInvoices({ payment: 'all', period: '', origin: '', search: invoiceSearch.value.trim(), page: 1 })
    // En la cuenta de detracciones (soles) entra también la detracción de facturas en dólares.
    const bnSoles = current.value.bank === 'Banco de la Nación' && current.value.currency === 'PEN'
    invoiceOptions.value = res.data
      .filter(i => i.payment_status !== null && (i.currency === current.value!.currency || (bnSoles && i.currency === 'USD')))
      .map(i => ({
        id: i.id,
        number: i.number,
        issue_date: i.issue_date,
        customer_name: i.customer_name,
        customer_document: i.customer_document,
        total: i.total,
        // Un cobrado sin abonos detallados admite que el banco lo confirme.
        open_amount: i.balance > 0 ? i.balance : Math.max(i.total - i.credited - (i.paid_amount ?? 0), 0),
        currency: i.currency,
        same_amount: false,
        net_of_detraction: false,
        name_match: false,
        number_match: false,
        foreign_detraction: i.currency !== current.value!.currency
      }))
      .filter(i => i.open_amount > 0)
    pickedInvoice.value = null
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo buscar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    loadingSuggestions.value = false
  }
}

function warn(detail: string) {
  toast.add({ severity: 'warn', summary: 'Falta un dato', detail, life: 5000 })
}

async function submitReconcile() {
  if (!current.value) return
  let payload: ReconcileInput

  if (mode.value === 'cobro' && customerOpen.value) {
    const ids = Object.keys(customerPlan.value).map(Number)
    if (ids.length === 0) return warn('Marca al menos un comprobante con saldo')
    payload = { kind: 'cliente', customer_document: customerOpen.value.customer_document, invoice_ids: ids }
  } else if (mode.value === 'cobro') {
    if (!pickedInvoice.value) return warn('Elige el comprobante que se cobró')
    const picked = invoiceOptions.value.find(i => i.id === pickedInvoice.value)
    if (pickedUsdDetraction.value || picked?.foreign_detraction) {
      payload = { kind: 'detraccion_usd', invoice_id: pickedInvoice.value }
    } else {
      if (!partAmount.value || partAmount.value <= 0) return warn('Indica el importe a aplicar')
      payload = { kind: 'cobro', invoice_id: pickedInvoice.value, amount: partAmount.value }
    }
  } else if (mode.value === 'pago') {
    const items = Object.entries(expensePlan.value).map(([id, amount]) => ({ expense_id: Number(id), amount: Number(amount) || 0 }))
    if (items.length === 0) return warn('Marca el gasto o los gastos que se pagaron')
    if (items.some(i => i.amount <= 0)) return warn('Cada gasto marcado necesita un importe')
    if (expenseSummary.value.left < -0.004) return warn('Los gastos marcados suman más que el movimiento')
    payload = { kind: 'pagos', items }
  } else if (mode.value === 'gasto') {
    if (!newExpense.payee_id || !newExpense.category_id) return warn('Indica a quién se pagó y la categoría')
    payload = {
      kind: 'gasto',
      payee_id: newExpense.payee_id,
      category_id: newExpense.category_id,
      period: newExpense.period || undefined,
      description: newExpense.description.trim() || undefined
    }
  } else {
    if (!other.label) return warn('Indica qué es el movimiento')
    payload = other.label === 'transferencia' && other.counterpart
      ? { kind: 'transferencia', counterpart_id: other.counterpart }
      : { kind: 'otro', label: other.label, note: other.note.trim() || undefined }
  }

  saving.value = true
  try {
    const res = await reconcileBankMovement(current.value.id, payload)
    current.value = res.data
    changed = true
    toast.add({ severity: 'success', summary: res.message, life: 3000 })

    // Con resto por conciliar el diálogo sigue abierto para la siguiente parte.
    if (res.data.remaining <= 0) {
      reconcileVisible.value = false
    } else {
      resetChoice()
      loadSuggestions()
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo conciliar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    saving.value = false
  }
}

async function undo(linkId: number) {
  undoingId.value = linkId
  try {
    const res = await unlinkBankMovement(linkId)
    current.value = res.data
    changed = true
    mode.value = res.data.amount >= 0 ? 'cobro' : 'pago'
    resetChoice()
    loadSuggestions()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo deshacer', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    undoingId.value = null
  }
}

// También al cerrar con la X o con Escape: si hubo cambios, todo se recarga.
watch(reconcileVisible, visible => {
  if (!visible && changed) {
    changed = false
    refreshAll()
  }
})

// --- Importar ---
const importVisible = ref(false)
const importLoading = ref(false)
const importFile = ref<File | null>(null)
const importAccountId = ref<number | null>(null)
const pdfPassword = ref('')
const isPdf = computed(() => importFile.value?.name.toLowerCase().endsWith('.pdf') ?? false)
const preview = ref<BankImportResult | null>(null)

function accountsFor(currency: string): BankAccount[] {
  return accounts.value.filter(a => a.is_active && a.currency === currency)
}

function openImport() {
  importFile.value = null
  importAccountId.value = null
  preview.value = null
  pdfPassword.value = ''
  importVisible.value = true
}

async function refreshPreview() {
  if (!importFile.value) return
  importLoading.value = true
  try {
    preview.value = (await importBankFile(importFile.value, importAccountId.value, false, pdfPassword.value)).data
    // Con una sola cuenta posible no hay nada que elegir.
    if (preview.value.needs_account && !importAccountId.value) {
      const options = accountsFor(preview.value.currency).filter(a => a.bank === preview.value!.bank)
      if (options.length === 1) {
        importAccountId.value = options[0].id
        preview.value = (await importBankFile(importFile.value, importAccountId.value, false, pdfPassword.value)).data
      }
    }
  } catch (e) {
    preview.value = null
    toast.add({ severity: 'error', summary: 'No se pudo leer el archivo', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    importLoading.value = false
  }
}

function onFile(event: Event) {
  importFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
  importAccountId.value = null
  preview.value = null
  pdfPassword.value = ''
  // Un PDF con clave no se puede leer hasta que la escriban.
  if (!isPdf.value) refreshPreview()
}

async function submitImport() {
  if (!importFile.value) return
  saving.value = true
  try {
    const res = await importBankFile(importFile.value, importAccountId.value, true, pdfPassword.value)
    toast.add({
      severity: 'success',
      summary: res.message,
      detail: res.data.auto_marked
        ? `${res.data.auto_marked} entraron ya conciliados (abonos al banco). Usa "Conciliar automáticamente" para cruzar los cobros.`
        : undefined,
      life: 8000
    })
    importVisible.value = false
    filters.account_id = res.data.account_id
    filters.status = 'pending'
    refreshAll()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo importar', detail: accountingErrorMessage(e), life: 7000 })
  } finally {
    saving.value = false
  }
}

// --- Cuenta ---
const accountVisible = ref(false)
const editingAccount = ref<BankAccount | null>(null)
const accountForm = reactive({ bank: '', name: '', number: '', cci: '', currency: 'PEN' as 'PEN' | 'USD' })

function openAccount(account: BankAccount | null) {
  editingAccount.value = account
  accountForm.bank = account?.bank ?? ''
  accountForm.name = account?.name ?? ''
  accountForm.number = account?.number ?? ''
  accountForm.cci = account?.cci ?? ''
  accountForm.currency = account?.currency ?? 'PEN'
  accountVisible.value = true
}

async function submitAccount() {
  if (!accountForm.bank.trim() || !accountForm.name.trim()) return warn('Indica el banco y un nombre para la cuenta')
  saving.value = true
  try {
    accounts.value = await saveBankAccount(editingAccount.value?.id ?? null, {
      bank: accountForm.bank.trim(),
      name: accountForm.name.trim(),
      number: accountForm.number.trim() || undefined,
      cci: accountForm.cci.trim() || undefined,
      currency: accountForm.currency
    })
    accountVisible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: accountingErrorMessage(e), life: 6000 })
  } finally {
    saving.value = false
  }
}

onMounted(refreshAll)
</script>
