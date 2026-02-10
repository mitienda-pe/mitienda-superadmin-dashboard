<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Tags</h3>

    <!-- Tag chips -->
    <div class="flex flex-wrap gap-1.5 mb-3">
      <span
        v-for="tag in tags"
        :key="tag"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium group"
      >
        {{ tag }}
        <button
          class="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          @click="removeTag(tag)"
        >
          <i class="pi pi-times text-[10px]"></i>
        </button>
      </span>
      <span v-if="tags.length === 0" class="text-xs text-gray-400">Sin tags</span>
    </div>

    <!-- Add tag -->
    <div class="flex gap-2">
      <InputText
        v-model="newTag"
        placeholder="Nuevo tag"
        class="flex-1"
        size="small"
        @keyup.enter="addTag"
      />
      <Button
        icon="pi pi-plus"
        size="small"
        :disabled="!newTag.trim()"
        @click="addTag"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { usePipelineStore } from '@/stores/pipeline.store'

const props = defineProps<{
  tags: string[]
  tiendaId: number
}>()

const pipelineStore = usePipelineStore()
const toast = useToast()
const newTag = ref('')

async function addTag() {
  const tag = newTag.value.trim().toLowerCase()
  if (!tag || props.tags.includes(tag)) return
  try {
    await pipelineStore.updateLeadTags(props.tiendaId, [...props.tags, tag])
    newTag.value = ''
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar tags', life: 3000 })
  }
}

async function removeTag(tag: string) {
  try {
    await pipelineStore.updateLeadTags(props.tiendaId, props.tags.filter(t => t !== tag))
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar tags', life: 3000 })
  }
}
</script>
