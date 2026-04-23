import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faHouse, faLanguage, faBars, faXmark, faUpload, faFileExcel, faXmarkCircle,
  faSpinner, faCircleCheck, faCircleXmark, faClock, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import App from './App.vue'
import router from './router'
import './assets/main.css'

library.add(
  faHouse, faLanguage, faBars, faXmark, faUpload, faFileExcel, faXmarkCircle,
  faSpinner, faCircleCheck, faCircleXmark, faClock, faChevronLeft, faChevronRight,
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)
app.use(Toast, { position: 'top-right', timeout: 4000 })

app.mount('#app')
