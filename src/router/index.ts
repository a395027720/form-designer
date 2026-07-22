import { createRouter, createWebHistory } from 'vue-router'

const HomePage = () => import('@/views/HomePage.vue')
const FieldList = () => import('@/views/field/FieldList.vue')
const FieldEditor = () => import('@/views/field/FieldEditor.vue')
const TemplateList = () => import('@/views/template/TemplateList.vue')
const BasicEditor = () => import('@/views/template/BasicEditor.vue')
const PresetsEditor = () => import('@/views/template/PresetsEditor.vue')
const TemplateRenderer = () => import('@/views/template/TemplateRenderer.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage, name: 'home' },
    { path: '/fields', component: FieldList, name: 'field-list' },
    { path: '/fields/new', component: FieldEditor, name: 'field-new' },
    { path: '/fields/:id/edit', component: FieldEditor, name: 'field-edit', props: true },
    { path: '/templates', component: TemplateList, name: 'template-list' },
    { path: '/templates/new/basic', component: BasicEditor, name: 'template-new-basic' },
    { path: '/templates/new/presets', component: PresetsEditor, name: 'template-new-presets' },
    { path: '/templates/:id/edit', component: BasicEditor, name: 'template-edit', props: true },
    { path: '/templates/:id/render', component: TemplateRenderer, name: 'template-render', props: true }
  ]
})
