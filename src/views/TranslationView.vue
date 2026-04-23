<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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
    fetchJobs()
  } catch (err) {
    const detail = err.response?.data?.detail
    toast.error(typeof detail === 'string' ? detail : 'Upload failed. Please try again.')
  } finally {
    submitting.value = false
  }
}

const languageLabels = { vi: 'Vietnamese', en: 'English', ja: 'Japanese' }

const jobs = ref([])
const jobsPage = ref(1)
const jobsTotal = ref(0)
const jobsPages = ref(1)
const jobsLoading = ref(false)

async function fetchJobs(page = 1) {
  jobsLoading.value = true
  try {
    const { data } = await api.get('/translation/jobs', { params: { page, page_size: 10 } })
    jobs.value = data.items
    jobsPage.value = data.page
    jobsTotal.value = data.total
    jobsPages.value = data.pages
  } catch {
    // silently fail — jobs list is not critical
  } finally {
    jobsLoading.value = false
  }
}

const selectedJob = ref(null)
const jobDetailLoading = ref(false)

async function openJobDetail(jobId) {
  jobDetailLoading.value = true
  selectedJob.value = null
  try {
    const { data } = await api.get(`/translation/jobs/${jobId}`)
    selectedJob.value = data
  } catch {
    toast.error('Failed to load job details')
  } finally {
    jobDetailLoading.value = false
  }
}

function closeModal() {
  selectedJob.value = null
}

function statusIcon(status) {
  switch (status) {
    case 'completed': return 'circle-check'
    case 'failed': return 'circle-xmark'
    case 'processing': return 'spinner'
    default: return 'clock'
  }
}

function statusColor(status) {
  switch (status) {
    case 'completed': return 'text-green-500'
    case 'failed': return 'text-red-500'
    case 'processing': return 'text-yellow-500'
    default: return 'text-gray-400'
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString()
}

const downloading = ref({})

async function downloadFile(jobId, type) {
  const key = `${jobId}-${type}`
  downloading.value[key] = true
  try {
    const { data } = await api.get(`/translation/jobs/${jobId}/download`)
    const url = type === 'original' ? data.original_url : data.result_url
    if (!url) {
      toast.error('Download URL is not available')
      return
    }
    window.open(url, '_blank')
  } catch {
    toast.error('Failed to get download link')
  } finally {
    downloading.value[key] = false
  }
}

let pollInterval = null

onMounted(() => {
  fetchJobs()
  pollInterval = setInterval(() => fetchJobs(jobsPage.value), 5000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
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

    <!-- Jobs list -->
    <div class="mt-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Translation Jobs</h2>

      <div v-if="jobsLoading && !jobs.length" class="text-sm text-gray-400 py-6 text-center">
        Loading...
      </div>

      <div v-else-if="!jobs.length" class="text-sm text-gray-400 py-6 text-center">
        No jobs yet
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-indigo-300 transition-colors"
        >
          <font-awesome-icon
            :icon="statusIcon(job.status)"
            :class="statusColor(job.status)"
            :spin="job.status === 'processing'"
          />
          <button
            @click="openJobDetail(job.id)"
            class="flex-1 min-w-0 text-left cursor-pointer"
          >
            <p class="text-sm font-medium text-gray-900 truncate">{{ job.file_key.split('/').pop() }}</p>
            <p class="text-xs text-gray-400">{{ formatDate(job.created_at) }}</p>
          </button>
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              @click="downloadFile(job.id, 'original')"
              :disabled="downloading[`${job.id}-original`]"
              class="p-1.5 text-gray-400 hover:text-indigo-500 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Download original file"
            >
              <font-awesome-icon
                :icon="downloading[`${job.id}-original`] ? 'spinner' : 'download'"
                :spin="downloading[`${job.id}-original`]"
                class="text-sm"
              />
            </button>
            <button
              v-if="job.status === 'completed'"
              @click="downloadFile(job.id, 'result')"
              :disabled="downloading[`${job.id}-result`]"
              class="p-1.5 text-green-500 hover:text-green-600 disabled:text-green-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Download translated file"
            >
              <font-awesome-icon
                :icon="downloading[`${job.id}-result`] ? 'spinner' : 'download'"
                :spin="downloading[`${job.id}-result`]"
                class="text-sm"
              />
            </button>
          </div>
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0"
            :class="{
              'bg-green-50 text-green-600': job.status === 'completed',
              'bg-red-50 text-red-600': job.status === 'failed',
              'bg-yellow-50 text-yellow-600': job.status === 'processing',
              'bg-gray-100 text-gray-500': job.status === 'pending',
            }"
          >
            {{ job.status }}
          </span>
        </div>

        <!-- Pagination -->
        <div v-if="jobsPages > 1" class="flex items-center justify-center gap-3 mt-3">
          <button
            :disabled="jobsPage <= 1"
            @click="fetchJobs(jobsPage - 1)"
            class="p-2 text-gray-500 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            <font-awesome-icon icon="chevron-left" />
          </button>
          <span class="text-sm text-gray-500">{{ jobsPage }} / {{ jobsPages }}</span>
          <button
            :disabled="jobsPage >= jobsPages"
            @click="fetchJobs(jobsPage + 1)"
            class="p-2 text-gray-500 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            <font-awesome-icon icon="chevron-right" />
          </button>
        </div>
      </div>
    </div>

    <!-- Job detail modal -->
    <div
      v-if="selectedJob || jobDetailLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto">
        <div v-if="jobDetailLoading" class="p-10 text-center text-gray-400">
          <font-awesome-icon icon="spinner" spin class="text-2xl" />
        </div>
        <div v-else-if="selectedJob" class="p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-gray-900">Job #{{ selectedJob.id }}</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 cursor-pointer">
              <font-awesome-icon icon="xmark" class="text-lg" />
            </button>
          </div>

          <div class="flex flex-col gap-4 text-sm">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-700 w-24 shrink-0">Status</span>
              <span
                class="font-medium px-2 py-0.5 rounded-full capitalize text-xs"
                :class="{
                  'bg-green-50 text-green-600': selectedJob.status === 'completed',
                  'bg-red-50 text-red-600': selectedJob.status === 'failed',
                  'bg-yellow-50 text-yellow-600': selectedJob.status === 'processing',
                  'bg-gray-100 text-gray-500': selectedJob.status === 'pending',
                }"
              >
                {{ selectedJob.status }}
              </span>
            </div>

            <div class="flex gap-2">
              <span class="font-semibold text-gray-700 w-24 shrink-0">Language</span>
              <span class="text-gray-600">{{ languageLabels[selectedJob.language] || selectedJob.language }}</span>
            </div>

            <div class="flex gap-2">
              <span class="font-semibold text-gray-700 w-24 shrink-0">File</span>
              <span class="text-gray-600 break-all">{{ selectedJob.file_key.split('/').pop() }}</span>
            </div>

            <div class="flex gap-2">
              <span class="font-semibold text-gray-700 w-24 shrink-0">Prompt</span>
              <span class="text-gray-600 whitespace-pre-wrap">{{ selectedJob.prompt }}</span>
            </div>

            <div v-if="selectedJob.sheet_prompts?.length">
              <span class="font-semibold text-gray-700">Sheet prompts</span>
              <div class="mt-2 flex flex-col gap-2">
                <div
                  v-for="sp in selectedJob.sheet_prompts"
                  :key="sp.sheet_name"
                  class="bg-gray-50 rounded-lg px-3 py-2"
                >
                  <p class="text-xs font-medium text-gray-500">{{ sp.sheet_name }}</p>
                  <p class="text-gray-600 whitespace-pre-wrap">{{ sp.prompt || '—' }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedJob.error" class="flex gap-2">
              <span class="font-semibold text-red-600 w-24 shrink-0">Error</span>
              <span class="text-red-500">{{ selectedJob.error }}</span>
            </div>

            <div class="flex gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
              <span>Created: {{ formatDate(selectedJob.created_at) }}</span>
              <span>&middot;</span>
              <span>Updated: {{ formatDate(selectedJob.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
