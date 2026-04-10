<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'
import api from '@/api/axios'

const schema = yup.object({
  email: yup.string().required('Email is required').email('Must be a valid email'),
  fullName: yup.string().required('Full name is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'At least 8 characters')
    .matches(/[A-Z]/, 'At least 1 uppercase letter')
    .matches(/[a-z]/, 'At least 1 lowercase letter')
    .matches(/\d/, 'At least 1 digit'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
})

const router = useRouter()
const toast = useToast()
const { handleSubmit } = useForm({ validationSchema: schema })

const { value: email, errorMessage: emailError } = useField('email')
const { value: fullName, errorMessage: fullNameError } = useField('fullName')
const { value: password, errorMessage: passwordError } = useField('password')
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField('confirmPassword')

const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    await api.post('/users/register', {
      email: values.email,
      full_name: values.fullName,
      password: values.password,
    })
    toast.success('Account created successfully!')
    router.push('/login')
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
      <h1 class="text-2xl font-bold text-gray-900">Create Account</h1>
      <p class="text-sm text-gray-500 mt-1 mb-7">Sign up to get started</p>

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
          <label for="fullName" class="text-sm font-semibold text-gray-700">Full Name</label>
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            placeholder="John Doe"
            class="px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:bg-white transition-colors placeholder:text-gray-400"
            :class="fullNameError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'"
          />
          <span v-if="fullNameError" class="text-xs text-red-500">{{ fullNameError }}</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-semibold text-gray-700">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="At least 8 characters"
            class="px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:bg-white transition-colors placeholder:text-gray-400"
            :class="passwordError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'"
          />
          <span v-if="passwordError" class="text-xs text-red-500">{{ passwordError }}</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="confirmPassword" class="text-sm font-semibold text-gray-700">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            class="px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:bg-white transition-colors placeholder:text-gray-400"
            :class="confirmPasswordError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'"
          />
          <span v-if="confirmPasswordError" class="text-xs text-red-500">{{ confirmPasswordError }}</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-5">
        Already have an account?
        <router-link to="/login" class="text-indigo-500 font-semibold hover:underline">Log in</router-link>
      </p>
    </div>
  </div>
</template>
