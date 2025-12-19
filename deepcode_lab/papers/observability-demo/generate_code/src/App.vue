<script setup lang="ts">
import { onMounted } from 'vue'
import MainLayout from '@/components/Layout/MainLayout.vue'
import { useGlobalStore } from '@/stores/globalStore'
import { useMockData } from '@/composables/useMockData'

const globalStore = useGlobalStore()

// Initialize the data simulation engine globally.
// This ensures that data fetching loops run continuously regardless of the active view,
// providing a "live" observability experience (e.g. alerts generated in background).
useMockData()

onMounted(() => {
  // Initialize Global Theme
  if (globalStore.isDarkTheme) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <MainLayout />
</template>

<style lang="scss">
/* Global overrides if necessary, though src/styles/main.scss is preferred */
</style>
