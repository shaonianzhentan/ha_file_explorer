import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/editFile',
    name: 'editFile',
    component: () => import('../views/EditFile.vue')
  },
  {
    path: '/PlugIn',
    name: 'PlugIn',
    component: () => import('../views/PlugIn')
  },
  {
    path: '/Backup',
    name: 'Backup',
    component: () => import('../views/Backup')
  },
  {
    path: '/Tools',
    name: 'Tools',
    component: () => import('../views/Tools')
  },
  {
    path: '/Update',
    name: 'Update',
    component: () => import('../views/Update')
  },
  {
    path: '/Setting',
    name: 'Setting',
    component: () => import('../views/Setting')
  }
]

const router = new VueRouter({
  routes
})

export default router
