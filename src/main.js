import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import filters from './filters'
Vue.use(filters)

Vue.config.productionTip = false

Vue.component("AppBar", () => import("./components/AppBar"))

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
