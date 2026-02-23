<template>
  <div>
    <!-- Loading -->
    <div v-if="plansStore.isLoading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
    </div>

    <!-- Error -->
    <div v-else-if="plansStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
      <p class="text-red-700">{{ plansStore.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" size="small" class="mt-3" @click="plansStore.fetchPlans()" />
    </div>

    <!-- Plans Table -->
    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <router-link to="/plans" class="text-sm text-primary-600 hover:underline">
          <i class="pi pi-table text-xs mr-1"></i>
          Vista Matriz
        </router-link>
      </div>
      <DataTable
        :value="plansStore.plans"
        class="p-datatable-sm"
        stripedRows
        :rowHover="true"
        @row-click="goToDetail"
      >
        <Column field="id" header="ID" :sortable="true" style="width: 60px" />
        <Column field="name" header="Plan" :sortable="true">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ data.name }}</span>
              <span
                v-if="!data.active"
                class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
              >
                Inactivo
              </span>
            </div>
          </template>
        </Column>
        <Column field="max_items" header="Max Productos" :sortable="true" style="width: 130px">
          <template #body="{ data }">
            {{ data.max_items === 0 ? 'Ilimitado' : data.max_items }}
          </template>
        </Column>
        <Column field="max_pages" header="Max Paginas" :sortable="true" style="width: 130px">
          <template #body="{ data }">
            {{ data.max_pages === 0 ? 'Ilimitado' : data.max_pages }}
          </template>
        </Column>
        <Column field="module_count" header="Modulos" :sortable="true" style="width: 100px">
          <template #body="{ data }">
            <span class="inline-flex items-center gap-1 text-sm">
              <i class="pi pi-th-large text-xs text-gray-400"></i>
              {{ data.module_count }}
            </span>
          </template>
        </Column>
        <Column field="active_stores" header="Tiendas Activas" :sortable="true" style="width: 130px">
          <template #body="{ data }">
            <span class="inline-flex items-center gap-1 text-sm">
              <i class="pi pi-shop text-xs text-gray-400"></i>
              {{ data.active_stores }}
            </span>
          </template>
        </Column>
        <Column style="width: 60px">
          <template #body="{ data }">
            <Button
              icon="pi pi-chevron-right"
              text
              rounded
              size="small"
              severity="secondary"
              @click.stop="goToDetail({ data })"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlansStore } from '@/stores/plans.store'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const router = useRouter()
const plansStore = usePlansStore()

onMounted(() => {
  plansStore.fetchPlans()
})

function goToDetail({ data }: any) {
  router.push(`/plans/${data.id}`)
}
</script>
