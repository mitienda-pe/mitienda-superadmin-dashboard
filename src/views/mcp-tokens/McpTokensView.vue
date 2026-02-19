<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">MCP Tokens</h1>
        <p class="text-sm text-gray-500 mt-1">
          Gestiona los tokens de acceso para el MCP Server. Cada colaborador necesita su propio token.
        </p>
      </div>
      <Button
        label="Crear Token"
        icon="pi pi-plus"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2" />
      <p class="text-red-700">{{ error }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-3"
        severity="danger"
        outlined
        @click="fetchTokens"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="tokens.length === 0"
      class="bg-white border border-gray-200 rounded-xl p-12 text-center"
    >
      <i class="pi pi-key text-gray-300 text-5xl mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No hay tokens creados</h3>
      <p class="text-gray-500 mb-6 max-w-md mx-auto">
        Crea un token MCP para que tus colaboradores puedan usar el MCP Server
        desde Claude Desktop o ChatGPT sin necesitar credenciales de base de datos.
      </p>
      <Button
        label="Crear primer token"
        icon="pi pi-plus"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Tokens table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable :value="tokens" :loading="isLoading" stripedRows>
        <Column field="label" header="Etiqueta" sortable>
          <template #body="{ data }">
            <div class="font-medium text-gray-900">{{ data.label }}</div>
          </template>
        </Column>
        <Column field="token_prefix" header="Token" sortable>
          <template #body="{ data }">
            <code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              {{ data.token_prefix }}...
            </code>
          </template>
        </Column>
        <Column field="is_active" header="Estado" sortable>
          <template #body="{ data }">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                data.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              ]"
            >
              {{ data.is_active ? 'Activo' : 'Revocado' }}
            </span>
          </template>
        </Column>
        <Column field="last_used_at" header="Ultimo uso" sortable>
          <template #body="{ data }">
            <span class="text-sm text-gray-500">
              {{ data.last_used_at ? formatDate(data.last_used_at) : 'Nunca' }}
            </span>
          </template>
        </Column>
        <Column field="created_at" header="Creado" sortable>
          <template #body="{ data }">
            <span class="text-sm text-gray-500">
              {{ formatDate(data.created_at) }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 80px">
          <template #body="{ data }">
            <Button
              v-if="data.is_active"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="confirmRevoke(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create Token Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Crear Token MCP"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Etiqueta
          </label>
          <InputText
            v-model="newTokenLabel"
            placeholder="Ej: Carlos - MacBook"
            class="w-full"
            :disabled="isCreating"
          />
          <p class="text-xs text-gray-400 mt-1">
            Identifica al colaborador y dispositivo
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="showCreateDialog = false"
          :disabled="isCreating"
        />
        <Button
          label="Crear Token"
          icon="pi pi-plus"
          @click="handleCreate"
          :loading="isCreating"
          :disabled="!newTokenLabel.trim()"
        />
      </template>
    </Dialog>

    <!-- Token Created Dialog (shows raw token ONCE) -->
    <Dialog
      v-model:visible="showTokenCreated"
      header="Token Creado"
      :modal="true"
      :closable="false"
      :style="{ width: '560px' }"
    >
      <div class="space-y-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 text-xl mt-0.5" />
            <div>
              <p class="font-medium text-yellow-800">Guarda este token ahora</p>
              <p class="text-sm text-yellow-700 mt-1">
                Este token no se mostrara de nuevo. Si lo pierdes, deberas crear uno nuevo.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Token para {{ createdTokenLabel }}
          </label>
          <div class="flex gap-2">
            <InputText
              :modelValue="createdTokenValue"
              class="w-full font-mono text-sm"
              readonly
            />
            <Button
              :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
              :severity="copied ? 'success' : 'secondary'"
              @click="copyToken"
            />
          </div>
        </div>

        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Configuracion del colaborador:</p>
          <pre class="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">MCP_TOKEN={{ createdTokenValue }}
API_BASE_URL=https://api2.mitienda.pe/api/v1</pre>
        </div>
      </div>
      <template #footer>
        <Button
          label="Listo, ya guarde el token"
          @click="closeTokenCreated"
        />
      </template>
    </Dialog>

    <!-- Revoke Confirmation Dialog -->
    <Dialog
      v-model:visible="showRevokeDialog"
      header="Revocar Token"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-red-500 text-xl mt-0.5" />
        <div>
          <p class="text-gray-900">
            Estas seguro de revocar el token <strong>{{ revokeTarget?.label }}</strong>?
          </p>
          <p class="text-sm text-gray-500 mt-2">
            El colaborador perdera acceso al MCP Server inmediatamente.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="showRevokeDialog = false"
          :disabled="isRevoking"
        />
        <Button
          label="Revocar"
          severity="danger"
          icon="pi pi-trash"
          @click="handleRevoke"
          :loading="isRevoking"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import {
  getMcpTokens,
  createMcpToken,
  revokeMcpToken
} from '@/api/mcp-tokens.api'
import type { McpToken } from '@/types/mcp-token.types'

// State
const tokens = ref<McpToken[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Create dialog
const showCreateDialog = ref(false)
const newTokenLabel = ref('')
const isCreating = ref(false)

// Token created dialog
const showTokenCreated = ref(false)
const createdTokenValue = ref('')
const createdTokenLabel = ref('')
const copied = ref(false)

// Revoke dialog
const showRevokeDialog = ref(false)
const revokeTarget = ref<McpToken | null>(null)
const isRevoking = ref(false)

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: es })
  } catch {
    return dateStr
  }
}

async function fetchTokens() {
  isLoading.value = true
  error.value = null
  try {
    const res = await getMcpTokens()
    tokens.value = res.data || []
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error cargando tokens'
  } finally {
    isLoading.value = false
  }
}

async function handleCreate() {
  if (!newTokenLabel.value.trim()) return

  isCreating.value = true
  try {
    const res = await createMcpToken(newTokenLabel.value.trim())
    createdTokenValue.value = res.data.token
    createdTokenLabel.value = res.data.label
    showCreateDialog.value = false
    showTokenCreated.value = true
    newTokenLabel.value = ''
    await fetchTokens()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error creando token'
  } finally {
    isCreating.value = false
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(createdTokenValue.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = createdTokenValue.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function closeTokenCreated() {
  showTokenCreated.value = false
  createdTokenValue.value = ''
  createdTokenLabel.value = ''
}

function confirmRevoke(token: McpToken) {
  revokeTarget.value = token
  showRevokeDialog.value = true
}

async function handleRevoke() {
  if (!revokeTarget.value) return

  isRevoking.value = true
  try {
    await revokeMcpToken(revokeTarget.value.id)
    showRevokeDialog.value = false
    revokeTarget.value = null
    await fetchTokens()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error revocando token'
  } finally {
    isRevoking.value = false
  }
}

onMounted(() => {
  fetchTokens()
})
</script>
