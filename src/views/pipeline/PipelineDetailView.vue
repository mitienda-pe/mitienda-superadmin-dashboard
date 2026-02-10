<template>
  <div class="space-y-6">
    <PipelineSubNav />

    <!-- Back button -->
    <router-link to="/pipeline/leads" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
      <i class="pi pi-arrow-left text-xs"></i>
      Volver a Leads
    </router-link>

    <!-- Loading -->
    <div v-if="pipelineStore.isDetailLoading" class="space-y-4">
      <div class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="flex gap-6">
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div class="grid grid-cols-5 gap-4">
              <div class="h-16 bg-gray-100 rounded" v-for="i in 5" :key="i"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="pipelineStore.detailError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ pipelineStore.detailError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="loadLead" />
    </div>

    <!-- Content -->
    <template v-else-if="lead">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column (2/3) -->
        <div class="lg:col-span-2 space-y-6">
          <LeadHeader :lead="lead" />
          <SetupChecklistCard :lead="lead" />
          <ActivityTimelinePanel
            :notes="lead.notes"
            :stage-history="lead.stage_history"
            :tienda-id="lead.id"
          />
        </div>

        <!-- Right column (1/3) -->
        <div class="space-y-6">
          <StageManagementCard
            :current-stage="lead.pipeline_stage"
            :stage-changed-at="lead.stage_changed_at"
            :tienda-id="lead.id"
          />
          <FollowUpsCard
            :follow-ups="lead.follow_ups"
            :tienda-id="lead.id"
          />
          <TagsCard
            :tags="lead.tags"
            :tienda-id="lead.id"
          />
          <QuickActionsCard :lead="lead" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import { usePipelineStore } from '@/stores/pipeline.store'
import PipelineSubNav from '@/components/pipeline/PipelineSubNav.vue'
import LeadHeader from '@/components/pipeline/LeadHeader.vue'
import SetupChecklistCard from '@/components/pipeline/SetupChecklistCard.vue'
import ActivityTimelinePanel from '@/components/pipeline/ActivityTimelinePanel.vue'
import StageManagementCard from '@/components/pipeline/StageManagementCard.vue'
import FollowUpsCard from '@/components/pipeline/FollowUpsCard.vue'
import TagsCard from '@/components/pipeline/TagsCard.vue'
import QuickActionsCard from '@/components/pipeline/QuickActionsCard.vue'

const route = useRoute()
const pipelineStore = usePipelineStore()

const lead = computed(() => pipelineStore.currentLead)

function loadLead() {
  const id = Number(route.params.id)
  if (id) {
    pipelineStore.fetchLeadDetail(id)
  }
}

onMounted(() => {
  loadLead()
})
</script>
