<script setup></script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-10">
      <h1 class="text-2xl font-bold text-gray-900">Log In</h1>
      <p class="text-sm text-gray-500 mt-1 mb-7">Welcome back</p>

      <p class="text-center text-sm text-gray-500 mt-5">
        Don't have an account?
        <router-link to="/register" class="text-indigo-500 font-semibold hover:underline">Register</router-link>
      </p>
    </div>
  </div>
</template>
