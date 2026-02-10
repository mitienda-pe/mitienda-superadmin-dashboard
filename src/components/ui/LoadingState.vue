<template>
  <div class="space-y-6">
    <!-- KPI cards skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-32 mb-3"></div>
        <div class="h-9 bg-gray-100 rounded w-full"></div>
      </div>
    </div>

    <!-- Charts skeleton -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="'chart-'+i" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div class="h-5 bg-gray-200 rounded w-40 mb-4"></div>
        <div class="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  </div>
</template>
