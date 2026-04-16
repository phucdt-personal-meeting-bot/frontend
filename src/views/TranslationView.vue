<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { read } from 'xlsx'
import api from '@/api/axios'

const toast = useToast()
const MAX_SIZE = 10 * 1024 * 1024

const languages = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
]

const file = ref(null)
const sheetNames = ref([])
const language = ref('vi')
const filePrompt = ref('')
const sheetPrompts = ref({})
const fileInputRef = ref(null)

function openFilePicker() {
  fileInputRef.value.click()
}

function handleFile(event) {
  const selected = event.target.files[0]
  if (!selected) return

  if (selected.size > MAX_SIZE) {
    toast.error('File size must be 10MB or less')
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const workbook = read(e.target.result, { type: 'array', bookSheets: true })
    if (!workbook.SheetNames.length) {
      toast.error('This file has no sheets')
      event.target.value = ''
      return
    }
    file.value = selected
    language.value = 'vi'
    filePrompt.value = ''
    sheetPrompts.value = {}
    sheetNames.value = workbook.SheetNames
    for (const name of workbook.SheetNames) {
      sheetPrompts.value[name] = ''
    }
  }
  reader.readAsArrayBuffer(selected)
}

function removeFile() {
  sheetNames.value = []
  language.value = 'vi'
  filePrompt.value = ''
  sheetPrompts.value = {}
  if (fileInputRef.value) fileInputRef.value.value = ''
  file.value = null
}

const submitting = ref(false)

async function submit() {
  const sheetPromptsArray = sheetNames.value.map((name) => ({
    sheet_name: name,
    prompt: sheetPrompts.value[name] || '',
  }))

  const payload = {
    file: file.value,
    language: language.value,
    prompt: filePrompt.value || ' ',
    sheet_prompts: JSON.stringify(sheetPromptsArray),
  }

  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value)
  }

  submitting.value = true
  try {
    await api.post('/translation/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    toast.success('File uploaded successfully!')
    removeFile()
  } catch (err) {
    const detail = err.response?.data?.detail
    toast.error(typeof detail === 'string' ? detail : 'Upload failed. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6 md:p-10 max-w-3xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-1">Translation Bot</h1>
    <p class="text-sm text-gray-500 mb-8">Upload an Excel file to get started</p>

    <!-- Upload area -->
    <div v-if="!file" class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
      <font-awesome-icon icon="upload" class="text-3xl text-gray-400 mb-3" />
      <p class="text-sm text-gray-500 mb-1">Excel files only (.xlsx, .xls)</p>
      <p class="text-xs text-gray-400 mb-4">Max 10MB</p>
      <button
        @click="openFilePicker"
        class="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
      >
        Choose File
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="handleFile"
      />
    </div>

    <!-- File loaded -->
    <div v-else class="flex flex-col gap-6">
      <!-- File info -->
      <div class="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
        <font-awesome-icon icon="file-excel" class="text-xl text-green-600" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
          <p class="text-xs text-gray-400">
            {{ sheetNames.length }} sheet{{ sheetNames.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <button
          @click="removeFile"
          class="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          <font-awesome-icon icon="xmark-circle" class="text-lg" />
        </button>
      </div>

      <!-- Language -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-gray-700">Prompting language</label>
        <select
          v-model="language"
          class="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
        >
          <option v-for="lang in languages" :key="lang.value" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>
      </div>

      <!-- File-level prompt -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-gray-700">Prompt for entire file</label>
        <textarea
          v-model="filePrompt"
          rows="3"
          placeholder="e.g. Translate all content to Vietnamese"
          class="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-gray-400 resize-none"
        />
      </div>

      <!-- Sheet-level prompts -->
      <div class="flex flex-col gap-4">
        <h3 class="text-sm font-semibold text-gray-700">Prompts per sheet</h3>
        <div v-for="name in sheetNames" :key="name" class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-gray-500">{{ name }}</label>
          <textarea
            v-model="sheetPrompts[name]"
            rows="2"
            :placeholder="`Additional prompt for &quot;${name}&quot;...`"
            class="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-gray-400 resize-none"
          />
        </div>
      </div>

      <!-- Submit -->
      <button
        @click="submit"
        :disabled="submitting"
        class="self-start px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors"
      >
        {{ submitting ? 'Uploading...' : 'Submit' }}
      </button>
    </div>
  </div>
</template>
