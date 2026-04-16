import axios from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry || original.url === '/users/refresh') {
      return Promise.reject(error)
    }

    original._retry = true
    const refreshToken = Cookies.get('refresh_token')

    if (!refreshToken) {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      router.push('/login')
      return Promise.reject(error)
    }

    if (!refreshPromise) {
      refreshPromise = api.post('/users/refresh', { token: refreshToken })
        .then(({ data }) => {
          Cookies.set('access_token', data.access_token, { expires: 1 / 24 })
          Cookies.set('refresh_token', data.refresh_token, { expires: 7 })
        })
        .catch(() => {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          router.push('/login')
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    await refreshPromise
    const newToken = Cookies.get('access_token')
    if (!newToken) return Promise.reject(error)

    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)
  },
)

export default api
