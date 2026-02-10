<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="text-center">
      <div class="text-6xl text-gray-300 mb-4">
        <i class="pi pi-lock"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
      <p class="text-gray-500 mb-6">No tienes permisos de Super Administrador para acceder a este panel.</p>
      <Button label="Volver al Login" icon="pi pi-arrow-left" @click="goToLogin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

async function goToLogin() {
  await authStore.logout()
  router.push('/login')
}
</script>
