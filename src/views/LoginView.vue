<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'
import Cookies from 'js-cookie'
import api from '@/api/axios'

const schema = yup.object({
  email: yup.string().required('Email is required').email('Must be a valid email'),
  password: yup.string().required('Password is required'),
})

const router = useRouter()
const toast = useToast()
const { handleSubmit } = useForm({ validationSchema: schema })

const { value: email, errorMessage: emailError } = useField('email')
const { value: password, errorMessage: passwordError } = useField('password')

const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    const { data } = await api.post('/users/login', {
      email: values.email,
      password: values.password,
    })
    Cookies.set('access_token', data.access_token, { expires: 1 / 24 })
    Cookies.set('refresh_token', data.refresh_token, { expires: 7 })
    toast.success('Logged in successfully!')
    router.push('/')
  } catch (err) {
    const detail = err.response?.data?.detail
    toast.error(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-10">
      <h1 class="text-2xl font-bold text-gray-900">Log In</h1>
      <p class="text-sm text-gray-500 mt-1 mb-7">Welcome back</p>

      <form @submit.prevent="onSubmit" class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-sm font-semibold text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:bg-white transition-colors placeholder:text-gray-400"
            :class="emailError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'"
          />
          <span v-if="emailError" class="text-xs text-red-500">{{ emailError }}</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-semibold text-gray-700">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            class="px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:bg-white transition-colors placeholder:text-gray-400"
            :class="passwordError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'"
          />
          <span v-if="passwordError" class="text-xs text-red-500">{{ passwordError }}</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-5">
        Don't have an account?
        <router-link to="/register" class="text-indigo-500 font-semibold hover:underline">Register</router-link>
      </p>
    </div>
  </div>
</template>
