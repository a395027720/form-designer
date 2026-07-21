import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/templates'
    },
    {
      path: '/templates',
      name: 'TemplateList',
      component: () => import('@/pages/TemplateList.vue')
    },
    {
      path: '/templates/:id/edit',
      name: 'Designer',
      component: () => import('@/pages/Designer.vue')
    },
    {
      path: '/renderer/:templateId',
      name: 'Renderer',
      component: () => import('@/pages/Renderer.vue')
    }
  ]
})

export default router