<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(false)

const navItems = [
  { name: 'Home', to: '/', icon: 'house' },
  { name: 'Translation Bot', to: '/translation', icon: 'language' },
]

watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="h-screen flex bg-gray-50">
    <!-- Mobile top bar -->
    <div class="fixed top-0 left-0 right-0 z-30 flex items-center h-14 bg-white border-b border-gray-200 px-4 md:hidden">
      <button @click="sidebarOpen = !sidebarOpen" class="text-gray-600 p-1">
        <font-awesome-icon :icon="sidebarOpen ? 'xmark' : 'bars'" class="w-5 h-5" />
      </button>
      <h2 class="ml-3 text-lg font-bold text-gray-900">Meeting Bot</h2>
    </div>

    <!-- Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/30 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed top-0 left-0 z-40 h-full w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="px-5 py-6">
        <h2 class="text-lg font-bold text-gray-900">Meeting Bot</h2>
      </div>
      <nav class="flex-1 px-3 flex flex-col gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === item.to
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
        >
          <font-awesome-icon :icon="item.icon" class="w-4" />
          {{ item.name }}
        </router-link>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 pt-14 md:pt-0 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
