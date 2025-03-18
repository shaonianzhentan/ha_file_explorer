import { createApp, DefineComponent } from 'vue'
import App from './App.vue'
import { VaListItemLabel, VuesticPlugin } from 'vuestic-ui'
import 'vuestic-ui/dist/vuestic-ui.css'
import '@mdi/font/css/materialdesignicons.min.css'
import './style/index.scss'
import api from './api/index'

import rotuer from './router/index'
import store from './store/index'

import MdiIcon from './components/globel/mdi-icon.vue'
import VueThreeShortkey from 'vue-three-shortkey'

const getParentColor = (cssVar: string) => {
  return getComputedStyle(parent.document.documentElement).getPropertyValue(cssVar).trim()
}
document.body.style.backgroundColor = getParentColor('--primary-background-color')
const style = document.createElement('style')
style.textContent = `
:root{
    --va-list-item-label-color: ${getParentColor('--primary-text-color')}
}
`
document.head.appendChild(style)
const vuesticConfig = {
  colors: {
    primary: getParentColor('--primary-color'),
    // background: getParentColor('--primary-background-color'),
    // text: getParentColor('--primary-text-color')
  },
  components: {
    VaAppBar: {
      color: getParentColor('--app-header-background-color'),
      text: getParentColor('--app-header-text-color')
    },
    VaCard: {
      color: getParentColor('--card-background-color')
    }
  }
}

const app = createApp(App)
app.config.globalProperties.api = api
app.config.globalProperties.$toast = (message: string, options = {}) => {
  app.config.globalProperties.$vaToast.init({ position: 'bottom-right', color: 'primary', message, ...options })
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
app.use(rotuer).use(store).use(VuesticPlugin, vuesticConfig).component('mdi-icon', MdiIcon).use(VueThreeShortkey).mount('#app')
