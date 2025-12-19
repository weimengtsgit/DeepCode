import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore('global', () => {
  // Sidebar state
  const isSidebarCollapsed = ref(false);
  
  // Theme state (defaulting to dark as per requirements)
  const isDarkTheme = ref(true);

  // Actions
  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  }

  function setSidebarCollapsed(value: boolean) {
    isSidebarCollapsed.value = value;
  }

  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value;
    // In a full implementation, this would toggle class on document.body
    if (isDarkTheme.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    isSidebarCollapsed,
    isDarkTheme,
    toggleSidebar,
    setSidebarCollapsed,
    toggleTheme
  };
});
