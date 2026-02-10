<template>
  <div class="bg-white rounded-xl shadow-lg p-8">
    <h2 class="text-xl font-semibold text-gray-800 mb-6">Iniciar sesión</h2>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <InputText
          id="email"
          v-model="credentials.email"
          type="email"
          placeholder="admin@mitienda.pe"
          class="w-full"
          :disabled="authStore.isLoading"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <InputText
          id="password"
          v-model="credentials.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          :disabled="authStore.isLoading"
        />
      </div>

      <div v-if="authStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {{ authStore.error }}
      </div>

      <Button
        type="submit"
        label="Ingresar"
        class="w-full"
        :loading="authStore.isLoading"
        :disabled="!credentials.email || !credentials.password"
      />
    </form>

    <!-- Dev credentials helper -->
    <div v-if="testEmail" class="mt-4 pt-4 border-t border-gray-100">
      <button
        @click="fillTestCredentials"
        class="text-xs text-gray-400 hover:text-primary-500 transition-colors"
      >
        Usar credenciales de prueba
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth.store'
import type { LoginCredentials } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()

const testEmail = import.meta.env.VITE_TEST_EMAIL
const testPassword = import.meta.env.VITE_TEST_PASSWORD

const credentials = reactive<LoginCredentials>({
  email: '',
  password: ''
})

function fillTestCredentials() {
  if (testEmail) credentials.email = testEmail
  if (testPassword) credentials.password = testPassword
}

async function handleLogin() {
  const success = await authStore.login(credentials)
  if (success) {
    router.push('/dashboard')
  }
}
</script>
