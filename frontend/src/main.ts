import { createApp } from 'vue'
import App from './App.vue'
import { VuesticPlugin } from 'vuestic-ui'
import 'vuestic-ui/dist/vuestic-ui.css'
import '@mdi/font/css/materialdesignicons.min.css'
import './style/index.scss'

import rotuer from './router/index'
import store from './store/index'

import MdiIcon from './components/globel/mdi-icon.vue'

const app = createApp(App)
app.config.globalProperties.$toast = (message: string) => {
    app.config.globalProperties.$vaToast.init({ position: 'bottom-right', color: 'primary', message })
}
app.use(rotuer).use(store).use(VuesticPlugin).component('mdi-icon', MdiIcon).mount('#app')
