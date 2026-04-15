import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'

const guestRoutes = ['login', 'register']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (guestRoutes.includes(to.name)) {
    auth.stopPolling()
  } else {
    auth.startPolling()
  }
})

export default router
