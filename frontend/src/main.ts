import { createApp, DefineComponent } from 'vue'
import App from './App.vue'
import { VuesticPlugin } from 'vuestic-ui'
import 'vuestic-ui/dist/vuestic-ui.css'
import '@mdi/font/css/materialdesignicons.min.css'
import './style/index.scss'
import api from './api/index'

import rotuer from './router/index'
import store from './store/index'

import MdiIcon from './components/globel/mdi-icon.vue'

const vuesticConfig = {
    colors: {
        primary: getComputedStyle(parent.document.documentElement).getPropertyValue('--primary-color').trim()
    }
}

const app = createApp(App)
app.config.globalProperties.api = api
app.config.globalProperties.$toast = (message: string) => {
    app.config.globalProperties.$vaToast.init({ position: 'bottom-right', color: 'primary', message })
}
app.config.globalProperties.$dialog = (com: DefineComponent, propsData = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
        const div = document.createElement('div')
        const comApp = createApp(com, Object.assign(propsData, {
            app() {
                return app.config.globalProperties
            },
            ok(data: any) {
                comApp.unmount()
                resolve(data)
            },
            cancel() {
                comApp.unmount()
                reject()
            }
        }))
        comApp.use(store).use(VuesticPlugin, vuesticConfig).component('mdi-icon', MdiIcon).mount(div)
    })
}
app.use(rotuer).use(store).use(VuesticPlugin, vuesticConfig).component('mdi-icon', MdiIcon).mount('#app')
