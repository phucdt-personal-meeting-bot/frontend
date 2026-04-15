import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const consecutiveErrors = ref(0)
  const hasConnectionError = ref(false)
  let intervalId = null

  async function fetchProfile() {
    try {
      const { data } = await api.get('/users/profile')
      user.value = data
      consecutiveErrors.value = 0
      hasConnectionError.value = false
    } catch {
      consecutiveErrors.value++
      if (consecutiveErrors.value >= 3) {
        hasConnectionError.value = true
        stopPolling()
      }
    }
  }

  function startPolling() {
    if (intervalId) return
    consecutiveErrors.value = 0
    hasConnectionError.value = false
    fetchProfile()
    intervalId = setInterval(fetchProfile, 5000)
  }

  function stopPolling() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function reset() {
    stopPolling()
    user.value = null
    consecutiveErrors.value = 0
    hasConnectionError.value = false
  }

  return { user, hasConnectionError, fetchProfile, startPolling, stopPolling, reset }
})
