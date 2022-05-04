import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'index',
        meta: {
            keepAlive: true
        },
        component: () => import('../views/index.vue')
    },
    {
        path: '/editor', 
        name: 'editor',
        meta: {
            keepAlive: false
        }, component: () => import('../views/editor.vue')
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router