<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

function goHome() {
  auth.hasConnectionError = false
  auth.consecutiveErrors = 0
  auth.startPolling()
}
</script>

<template>
  <div v-if="auth.hasConnectionError" class="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    <div class="text-center">
      <div class="text-5xl mb-4">&#9888;</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Connection Error</h1>
      <p class="text-sm text-gray-500 mb-8">Unable to reach the server. Please check your connection and try again.</p>
      <div class="flex gap-3 justify-center">
        <router-link
          to="/"
          class="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors"
          @click="goHome"
        >
          Go to Home
        </router-link>
        <router-link
          to="/login"
          class="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
          @click="auth.reset()"
        >
          Go to Login
        </router-link>
      </div>
    </div>
  </div>
  <router-view v-else />
</template>
