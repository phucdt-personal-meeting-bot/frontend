import { createRouter, createWebHistory } from 'vue-router'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/views/HomeView.vue'
import TranslationView from '@/views/TranslationView.vue'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'

const guestRoutes = ['login', 'register']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'translation', name: 'translation', component: TranslationView },
      ],
    },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const isGuest = guestRoutes.includes(to.name)

  if (!isGuest && !Cookies.get('access_token') && !Cookies.get('refresh_token')) {
    return { name: 'login' }
  }

  if (isGuest) {
    auth.stopPolling()
  } else {
    auth.startPolling()
  }
})

export default router
